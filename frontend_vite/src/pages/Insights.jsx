import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Download, BarChart3, Zap, TrendingUp, Award, Users } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageTransition from '../components/ui/PageTransition';
import ProgressRing from '../components/ui/ProgressRing';

const PROFICIENCY_COLORS = {
  BEGINNER: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  EXPERT: 'bg-blue-100 text-blue-700',
  MASTER: 'bg-purple-100 text-purple-700',
};

const PROFICIENCY_VALUES = { BEGINNER: 1, MEDIUM: 2, EXPERT: 3, MASTER: 4 };

function calculateScore(selections, maxTopics = 30) {
  if (!selections || selections.length === 0) return 0;
  const sum = selections.reduce((acc, sel) => acc + (PROFICIENCY_VALUES[sel.proficiency_level] || 0), 0);
  const averageProficiency = sum / selections.length;
  const coverage = selections.length / maxTopics;
  const depth = averageProficiency / 4;
  return Math.round(coverage * depth * 100);
}

export default function Insights() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState({
    totalSkills: 0,
    avgScore: 0,
    expertSkills: 0,
    masterSkills: 0,
    totalTopicsSelected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      const data = await api.get('/employee-skills/my-skills');
      setSkills(data);
      calculateStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(skillsList) {
    const totalSkills = skillsList.length;
    const avgScore = totalSkills > 0 ? Math.round(skillsList.reduce((sum, s) => sum + (s.calculated_level || 0), 0) / totalSkills) : 0;
    const expertSkills = skillsList.filter(s => (s.calculated_level || 0) >= 60).length;
    const masterSkills = skillsList.filter(s => (s.calculated_level || 0) >= 80).length;
    const totalTopicsSelected = skillsList.reduce((sum, s) => sum + (s.topicSelections?.length || 0), 0);

    setStats({
      totalSkills,
      avgScore,
      expertSkills,
      masterSkills,
      totalTopicsSelected,
    });
  }

  // Prepare radar data (top 6 skills)
  const radarData = skills.slice(0, 6).map(s => ({
    skill: s.skill.name.length > 12 ? s.skill.name.slice(0, 12) + '...' : s.skill.name,
    score: s.calculated_level || 0,
    target: s.target_level || 100,
  }));

  // Prepare heatmap data
  const heatmapData = skills.map(s => {
    const proficiencyDist = {
      BEGINNER: 0,
      MEDIUM: 0,
      EXPERT: 0,
      MASTER: 0,
    };
    (s.topicSelections || []).forEach(ts => {
      proficiencyDist[ts.proficiency_level]++;
    });
    return {
      skill: s.skill.name,
      score: s.calculated_level || 0,
      topics: s.topicSelections?.length || 0,
      ...proficiencyDist,
    };
  });

  // Export to CSV
  function handleExport() {
    const headers = ['Skill Name', 'Score (/100)', 'Topics Selected', 'Beginner', 'Medium', 'Expert', 'Master', 'Target Level'];
    const rows = heatmapData.map(item => [
      item.skill,
      item.score,
      item.topics,
      item.BEGINNER,
      item.MEDIUM,
      item.EXPERT,
      item.MASTER,
      100,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skill-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center h-96">
          <p className="text-secondary">Loading insights...</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skill Insights</h1>
            <p className="text-secondary text-sm mt-1">Your proficiency analysis and metrics</p>
          </div>
          <Button onClick={handleExport} size="sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Key Metrics */}
        {skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary font-medium">Total Skills</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalSkills}</p>
                </div>
                <Zap className="w-8 h-8 text-brand/30" />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.avgScore}</p>
                  <p className="text-xs text-secondary mt-1">/100</p>
                </div>
                <ProgressRing value={stats.avgScore} max={100} size={48} />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary font-medium">Expert Skills</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{stats.expertSkills}</p>
                  <p className="text-xs text-secondary mt-1">60+ score</p>
                </div>
                <Award className="w-8 h-8 text-blue-200" />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary font-medium">Master Skills</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">{stats.masterSkills}</p>
                  <p className="text-xs text-secondary mt-1">80+ score</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary font-medium">Topics Selected</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{stats.totalTopicsSelected}</p>
                  <p className="text-xs text-secondary mt-1">across skills</p>
                </div>
                <Users className="w-8 h-8 text-green-200" />
              </div>
            </Card>
          </motion.div>
        )}

        {/* Skill Radar Chart */}
        {radarData.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand" />
                  <h2 className="font-semibold text-gray-900">Skills Radar</h2>
                </div>
                <p className="text-xs text-secondary mt-1">Top {Math.min(6, skills.length)} skills performance</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Radar name="Score" dataKey="score" stroke="#0D4E9E" fill="#0D4E9E" fillOpacity={0.3} />
                    <Radar name="Target" dataKey="target" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} strokeDasharray="5 5" />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Proficiency Distribution Heatmap */}
        {skills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand" />
                  <h2 className="font-semibold text-gray-900">Proficiency Heatmap</h2>
                </div>
                <p className="text-xs text-secondary mt-1">Distribution of proficiency levels across skills</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {heatmapData.map(skill => (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 w-32 truncate">{skill.skill}</span>
                        <div className="flex-1 flex items-center gap-2 ml-4">
                          <span className="text-xs font-bold text-gray-700 w-8 text-right">{skill.score}</span>
                          <div className="flex-1 h-6 rounded-lg bg-gray-100 overflow-hidden flex">
                            {skill.BEGINNER > 0 && (
                              <div
                                className="bg-green-300 transition-all"
                                style={{ width: `${(skill.BEGINNER / skill.topics) * 100}%` }}
                                title={`Beginner: ${skill.BEGINNER}`}
                              />
                            )}
                            {skill.MEDIUM > 0 && (
                              <div
                                className="bg-amber-300 transition-all"
                                style={{ width: `${(skill.MEDIUM / skill.topics) * 100}%` }}
                                title={`Medium: ${skill.MEDIUM}`}
                              />
                            )}
                            {skill.EXPERT > 0 && (
                              <div
                                className="bg-blue-300 transition-all"
                                style={{ width: `${(skill.EXPERT / skill.topics) * 100}%` }}
                                title={`Expert: ${skill.EXPERT}`}
                              />
                            )}
                            {skill.MASTER > 0 && (
                              <div
                                className="bg-purple-300 transition-all"
                                style={{ width: `${(skill.MASTER / skill.topics) * 100}%` }}
                                title={`Master: ${skill.MASTER}`}
                              />
                            )}
                          </div>
                          <span className="text-xs text-gray-600 w-12 text-right">{skill.topics}/30</span>
                        </div>
                      </div>
                      <div className="flex gap-2 text-[11px] ml-40">
                        {skill.BEGINNER > 0 && <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700">B:{skill.BEGINNER}</span>}
                        {skill.MEDIUM > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">M:{skill.MEDIUM}</span>}
                        {skill.EXPERT > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">E:{skill.EXPERT}</span>}
                        {skill.MASTER > 0 && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">X:{skill.MASTER}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Legend */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Proficiency Levels</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { level: 'BEGINNER', value: 1, desc: 'Basic understanding', icon: '📖' },
                { level: 'MEDIUM', value: 2, desc: 'Can work independently', icon: '💼' },
                { level: 'EXPERT', value: 3, desc: 'Can teach others', icon: '👨‍🏫' },
                { level: 'MASTER', value: 4, desc: 'Complete mastery', icon: '🏆' },
              ].map(item => (
                <div key={item.level} className={`p-3 rounded-lg ${PROFICIENCY_COLORS[item.level]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-semibold text-sm">{item.level}</span>
                  </div>
                  <p className="text-xs opacity-80">{item.desc}</p>
                  <p className="text-xs opacity-60 mt-1">Value: {item.value}/4</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {skills.length === 0 && (
          <Card className="p-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-secondary">No skills added yet. Start adding skills to see insights!</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
