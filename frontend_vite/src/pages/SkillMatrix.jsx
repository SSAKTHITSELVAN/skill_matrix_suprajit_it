import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { Grid3X3, Network, ChevronRight, ChevronDown, Search, Users, Target, Sparkles, Download, UserCheck, Award, Layers, GraduationCap, Info } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressRing from '../components/ui/ProgressRing';
import PageTransition from '../components/ui/PageTransition';
import Button from '../components/ui/Button';
import * as XLSX from 'xlsx';

function SkillInsights({ members }) {
  const allSkillEntries = members.flatMap(m => m.skills);
  const skillMap = {};
  allSkillEntries.forEach(s => {
    if (!skillMap[s.skill.name]) skillMap[s.skill.name] = [];
    skillMap[s.skill.name].push(s.calculated_level || 0);
  });

  const skillStats = Object.entries(skillMap).map(([name, levels]) => ({
    name: name.length > 8 ? name.slice(0, 8) + '…' : name,
    fullName: name,
    avg: Math.round((levels.reduce((a, b) => a + b, 0) / levels.length) * 10) / 10,
    max: Math.max(...levels),
    people: levels.length,
  })).sort((a, b) => b.people - a.people).slice(0, 8);

  const totalPeople = members.length;
  const totalSkillAssignments = allSkillEntries.length;
  const avgSkillsPerPerson = totalPeople > 0 ? Math.round((totalSkillAssignments / totalPeople) * 10) / 10 : 0;
  const teachable = allSkillEntries.filter(s => s.can_teach).length;

  const barColors = ['#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500', '#FFCC00', '#34C759', '#00C7BE'];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 group relative cursor-help">
        <div className="flex items-center justify-between mb-1">
          <UserCheck className="w-5 h-5 text-brand" />
          <Info className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors" />
        </div>
        <p className="text-[11px] text-secondary uppercase tracking-wider">Team Size</p>
        <p className="text-[28px] font-bold text-[#1d1d1f] mt-1">{totalPeople}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
          <div className="font-medium mb-0.5">Total team members</div>
          <div className="text-gray-300">Count of all users in your team</div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </Card>

      <Card className="p-4 group relative cursor-help">
        <div className="flex items-center justify-between mb-1">
          <Target className="w-5 h-5 text-purple-500" />
          <Info className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
        </div>
        <p className="text-[11px] text-secondary uppercase tracking-wider">Avg Skills / Person</p>
        <p className="text-[28px] font-bold text-[#1d1d1f] mt-1">{avgSkillsPerPerson}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
          <div className="font-medium mb-0.5">Average skills per person</div>
          <div className="text-gray-300">Total skills ÷ Team size = {avgSkillsPerPerson}</div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </Card>

      <Card className="p-4 group relative cursor-help">
        <div className="flex items-center justify-between mb-1">
          <Layers className="w-5 h-5 text-orange-500" />
          <Info className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
        </div>
        <p className="text-[11px] text-secondary uppercase tracking-wider">Unique Skills</p>
        <p className="text-[28px] font-bold text-[#1d1d1f] mt-1">{Object.keys(skillMap).length}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
          <div className="font-medium mb-0.5">Unique skill count</div>
          <div className="text-gray-300">Total different skills across your team</div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </Card>

      <Card className="p-4 group relative cursor-help">
        <div className="flex items-center justify-between mb-1">
          <GraduationCap className="w-5 h-5 text-green-600" />
          <Info className="w-4 h-4 text-gray-300 group-hover:text-green-600 transition-colors" />
        </div>
        <p className="text-[11px] text-secondary uppercase tracking-wider">Mentors</p>
        <p className="text-[28px] font-bold text-[#1d1d1f] mt-1">{teachable}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none">
          <div className="font-medium mb-0.5">Available mentors</div>
          <div className="text-gray-300">Skills marked as "Available for Mentorship"</div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </Card>

      {skillStats.length > 0 && (
        <Card className="col-span-2 lg:col-span-4 p-5">
          <h3 className="text-[13px] font-semibold text-[#1d1d1f] mb-4">Skill Coverage — Team Average</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={skillStats} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#86868B' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#86868B' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #D2D2D7', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(value, name) => [value, name === 'avg' ? 'Avg Level' : name]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
              />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                {skillStats.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

function FindBestMatch({ members, allSkillNames }) {
  const [searchSkill, setSearchSkill] = useState('');
  const [minLevel, setMinLevel] = useState(20);
  const [results, setResults] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  function handleSearch(skillOverride) {
    const skill = skillOverride || searchSkill;
    if (!skill.trim()) return;
    const query = skill.toLowerCase();
    const matches = members
      .map(m => {
        const match = m.skills.find(s => s.skill.name.toLowerCase().includes(query));
        if (!match || (match.calculated_level || 0) < minLevel) return null;
        return { ...m, matchedSkill: match };
      })
      .filter(Boolean)
      .sort((a, b) => (b.matchedSkill.calculated_level || 0) - (a.matchedSkill.calculated_level || 0));
    setResults(matches);
    setShowSuggestions(false);
  }

  function handleSelectSuggestion(s) {
    setSearchSkill(s);
    setShowSuggestions(false);
    handleSearch(s);
  }

  const suggestions = showSuggestions && searchSkill.length > 0
    ? allSkillNames.filter(n => n.toLowerCase().includes(searchSkill.toLowerCase())).slice(0, 5)
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          <h2 className="font-semibold text-[#1d1d1f]">Find Best Resource</h2>
        </div>
        <p className="text-[12px] text-secondary mt-1">Search by skill to find the best-matched team member for a project or requirement</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <label className="text-[12px] font-medium text-secondary uppercase tracking-wide">Skill Required</label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="e.g. React, Docker, C++"
                value={searchSkill}
                onChange={(e) => { setSearchSkill(e.target.value); setShowSuggestions(true); setResults(null); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-card-border bg-white text-[14px] text-[#1d1d1f] placeholder:text-secondary focus:outline-none focus:ring-4 focus:ring-brand/12 focus:border-brand transition-all"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-card-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map(s => (
                  <button key={s} type="button" onClick={() => handleSelectSuggestion(s)} className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-page-bg cursor-pointer transition-colors">{s}</button>
                ))}
              </div>
            )}
          </div>
          <div className="w-[120px]">
            <label className="text-[12px] font-medium text-secondary uppercase tracking-wide">Min Level</label>
            <select
              value={minLevel}
              onChange={(e) => { setMinLevel(parseInt(e.target.value)); setResults(null); }}
              className="w-full mt-1.5 px-3 py-2 rounded-xl border border-card-border bg-white text-[14px] focus:outline-none focus:ring-4 focus:ring-brand/12 focus:border-brand"
            >
              {[0,10,20,30,40,50,60,70,80,90].map(n => <option key={n} value={n}>{n}+</option>)}
            </select>
          </div>
          <Button onClick={handleSearch} size="md">
            <Search className="w-4 h-4" /> Search
          </Button>
        </div>

        <AnimatePresence>
          {results !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
              {results.length === 0 ? (
                <p className="text-[13px] text-secondary py-4 text-center">No team members match this criteria. Try lowering the minimum level.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[12px] text-secondary mb-3">{results.length} match{results.length > 1 ? 'es' : ''} found — sorted by proficiency</p>
                  {results.map((m, i) => (
                    <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-xl bg-page-bg border border-card-border/40"
                    >
                      <span className="text-[12px] font-bold text-secondary w-5 text-center">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                        <span className="text-brand text-[12px] font-bold">{m.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#1d1d1f] truncate">{m.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="brand">{m.role?.replace('_', ' ')}</Badge>
                          {m.designation && <span className="text-[11px] text-secondary">{m.designation}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <ProgressRing value={m.matchedSkill.calculated_level || 0} max={100} size={36} strokeWidth={3} />
                          <div>
                            <p className="text-[12px] font-semibold text-[#1d1d1f]">{m.matchedSkill.calculated_level || 0}/100</p>
                            <p className="text-[10px] text-secondary">{m.matchedSkill.years_experience}yr exp</p>
                          </div>
                        </div>
                      </div>
                      {m.matchedSkill.can_teach && <Badge variant="success">Mentor</Badge>}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function SkillHeatmap({ members }) {
  const allSkills = [...new Set(members.flatMap(m => m.skills.map(s => s.skill.name)))].sort();
  if (allSkills.length === 0) return null;

  const levelBg = (level) => {
    if (!level) return '#FAFAFA';
    if (level <= 25) return '#FEE2E2';
    if (level <= 50) return '#FEF3C7';
    if (level <= 75) return '#DBEAFE';
    return '#D1FAE5';
  };
  const levelText = (level) => {
    if (!level) return '#D1D5DB';
    if (level <= 25) return '#DC2626';
    if (level <= 50) return '#D97706';
    if (level <= 75) return '#2563EB';
    return '#16A34A';
  };

  function exportToExcel() {
    // Prepare data for Excel
    const excelData = members.map(member => {
      const row = {
        'Name': member.name,
        'Role': member.role?.replace('_', ' '),
        'Department': member.department || '-',
        'Designation': member.designation || '-'
      };

      // Add skill columns
      allSkills.forEach(skill => {
        const s = member.skills.find(ms => ms.skill.name === skill);
        if (s) {
          row[skill] = s.calculated_level || 0;
          row[`${skill} (Years)`] = s.years_experience;
          row[`${skill} (Mentor)`] = s.can_teach ? 'Yes' : 'No';
        } else {
          row[skill] = '-';
          row[`${skill} (Years)`] = '-';
          row[`${skill} (Mentor)`] = '-';
        }
      });

      return row;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Name
      { wch: 15 }, // Role
      { wch: 20 }, // Department
      { wch: 15 }, // Designation
    ];
    allSkills.forEach(() => {
      colWidths.push({ wch: 12 }); // Skill level
      colWidths.push({ wch: 10 }); // Years
      colWidths.push({ wch: 10 }); // Mentor
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Skills Heatmap');

    // Generate file name with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Skills_Heatmap_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, fileName);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[#1d1d1f]">Skills Heatmap</h2>
          <p className="text-[12px] text-secondary mt-1">Visual overview of skill proficiency levels across your team</p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportToExcel}>
          <Download className="w-4 h-4" /> Export to Excel
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[12px] text-secondary mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span><strong>How to read:</strong> Rows = Team Members (People) | Columns = Skills | Color/Number = Proficiency Score (0-100)</span>
            </div>
          </div>

          <div className="overflow-x-auto -mx-5 px-5">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-brand/10 to-transparent border-b-2 border-brand/30">
                    <th className="text-left py-3 px-4 font-bold text-[13px] text-[#1d1d1f] sticky left-0 bg-white z-20 border-r-2 border-brand/30 min-w-[160px]">
                      👤 Team Member
                    </th>
                    {allSkills.map(skill => (
                      <th key={skill} className="py-3 px-2 font-semibold text-[11px] text-[#1d1d1f] text-center min-w-[80px] bg-gradient-to-b from-brand/5 to-transparent">
                        <div className="flex flex-col items-center gap-1">
                          <span className="block max-w-[75px] truncate font-bold" title={skill}>📚 {skill}</span>
                          <span className="text-[10px] text-secondary">(0-100)</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, idx) => (
                    <tr
                      key={member.id}
                      className={`border-b border-card-border/40 hover:bg-brand/5 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                    >
                      <td className="py-3 px-4 font-semibold text-[13px] text-[#1d1d1f] sticky left-0 z-10 border-r-2 border-card-border/50 whitespace-nowrap"
                          style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shrink-0 text-white font-bold text-[11px]">
                            {member.name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate" title={member.name}>{member.name}</p>
                            <p className="text-[10px] text-secondary truncate">{member.role?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>
                      {allSkills.map(skill => {
                        const s = member.skills.find(ms => ms.skill.name === skill);
                        const level = s?.calculated_level || 0;
                        return (
                          <td key={skill} className="py-3 px-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[13px] font-bold shadow-md transition-all hover:scale-110 hover:shadow-lg"
                                style={{ backgroundColor: levelBg(level), color: levelText(level) }}
                                title={s ? `${skill}: Score ${level}/100 | ${s.years_experience}yr experience ${s.can_teach ? '| Mentor Available' : ''}` : `${skill}: Not assigned`}
                              >
                                {level || '—'}
                              </span>
                              {s && s.can_teach && (
                                <span className="text-[9px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded" title="Can mentor others">👨‍🏫</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-5 border-t border-card-border/50">
            <p className="text-[12px] font-bold text-[#1d1d1f] mb-3">📊 Proficiency Score Guide (0-100):</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                <span className="w-8 h-8 rounded-lg font-bold text-red-700 flex items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>0-25</span>
                <div>
                  <p className="text-[11px] font-semibold text-[#1d1d1f]">Beginner</p>
                  <p className="text-[10px] text-secondary">Basic knowledge</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                <span className="w-8 h-8 rounded-lg font-bold text-amber-700 flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>26-50</span>
                <div>
                  <p className="text-[11px] font-semibold text-[#1d1d1f]">Medium</p>
                  <p className="text-[10px] text-secondary">Independent work</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                <span className="w-8 h-8 rounded-lg font-bold text-blue-700 flex items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>51-75</span>
                <div>
                  <p className="text-[11px] font-semibold text-[#1d1d1f]">Expert</p>
                  <p className="text-[10px] text-secondary">Can teach others</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-100">
                <span className="w-8 h-8 rounded-lg font-bold text-green-700 flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>76-100</span>
                <div>
                  <p className="text-[11px] font-semibold text-[#1d1d1f]">Master</p>
                  <p className="text-[10px] text-secondary">Complete mastery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrgCard({ user, isCurrent = false, onClick }) {
  const badgeColors = {
    ADMIN: 'bg-red-500',
    CTO: 'bg-orange-500',
    DEPARTMENT_HEAD: 'bg-amber-500',
    MANAGER: 'bg-blue-500',
    LEAD: 'bg-cyan-500',
    EMPLOYEE: 'bg-green-500'
  };

  const borderColors = {
    ADMIN: 'border-red-500',
    CTO: 'border-orange-500',
    DEPARTMENT_HEAD: 'border-amber-500',
    MANAGER: 'border-blue-500',
    LEAD: 'border-cyan-500',
    EMPLOYEE: 'border-green-500'
  };

  const badgeColor = badgeColors[user.role] || badgeColors.EMPLOYEE;
  const borderColor = borderColors[user.role] || borderColors.EMPLOYEE;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`${isCurrent ? `border-4 ${borderColor} ring-2 ring-offset-2 ring-${borderColor.split('-')[1]}-300` : 'border-2 border-gray-200'} bg-white rounded-xl p-4 w-72 shadow-lg hover:shadow-xl transition-all cursor-pointer`}
    >
      <div className="flex items-center gap-3">
        <div className={`${badgeColor} w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0`}>
          {user.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[14px] text-[#1d1d1f] truncate">{user.name}</p>
          <p className="text-[12px] text-secondary font-semibold">{user.role?.replace('_', ' ')}</p>
          {user.designation && <p className="text-[11px] text-secondary/70 truncate mt-0.5">{user.designation}</p>}
        </div>
      </div>
    </motion.div>
  );
}

function OrgTree({ users }) {
  const { user: currentUser } = useAuth();
  const ctoUser = users.find(u => u.role === 'CTO');
  const [focusedUserId, setFocusedUserId] = useState(ctoUser?.id || currentUser?.id);

  const focusedUser = users.find(u => u.id === focusedUserId) || ctoUser || currentUser;

  // Get manager (one level up) - skip ADMIN level
  const getManager = (u) => {
    if (u.manager_id) {
      const mgr = users.find(user => user.id === u.manager_id);
      // Don't show ADMIN as manager, skip to next level if needed
      if (mgr && mgr.role === 'ADMIN') return null;
      return mgr;
    }
    return null;
  };

  // Get direct reports (one level down)
  const getReports = (u) => {
    return users.filter(user => {
      if (u.role === 'ADMIN') return user.manager_id === u.id && user.role === 'CTO';
      if (u.role === 'CTO') return user.manager_id === u.id && user.role === 'DEPARTMENT_HEAD';
      if (u.role === 'DEPARTMENT_HEAD') return user.manager_id === u.id && user.role === 'MANAGER';
      if (u.role === 'MANAGER') return user.manager_id === u.id && user.role === 'LEAD';
      if (u.role === 'LEAD') return user.lead_id === u.id && user.role === 'EMPLOYEE';
      return false;
    });
  };

  const manager = getManager(focusedUser);
  const reports = getReports(focusedUser);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#1d1d1f] text-lg">Organization Hierarchy</h2>
            <p className="text-[12px] text-secondary mt-1">Click on anyone to view their hierarchy</p>
          </div>
          {focusedUserId !== (ctoUser?.id || currentUser?.id) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setFocusedUserId(ctoUser?.id || currentUser?.id)}
              className="text-[12px] text-brand hover:text-brand-dark font-semibold px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors"
            >
              ↻ Reset View
            </motion.button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8 bg-gradient-to-b from-white to-page-bg">
        <div className="flex flex-col items-center gap-8">
          {/* Manager (Level Up) */}
          {manager && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className="text-[11px] text-secondary uppercase tracking-wide mb-3 font-semibold">Reports To</p>
              <OrgCard user={manager} onClick={() => setFocusedUserId(manager.id)} />
              {/* Connector line */}
              <div className="w-1 h-8 bg-gradient-to-b from-gray-400 to-gray-200 mx-auto mt-4" />
            </motion.div>
          )}

          {/* Current User (Center) */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className="text-[11px] text-secondary uppercase tracking-wide mb-3 font-semibold">You</p>
            <OrgCard user={focusedUser} isCurrent={true} onClick={() => {}} />
          </motion.div>

          {/* Direct Reports (Level Down) */}
          {reports.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
              {/* Connector line */}
              <div className="w-1 h-8 bg-gradient-to-t from-gray-400 to-gray-200 mx-auto mb-4" />
              <p className="text-[11px] text-secondary uppercase tracking-wide text-center mb-4 font-semibold">{reports.length} Direct Report{reports.length > 1 ? 's' : ''}</p>
              <div className={`flex gap-6 justify-center flex-wrap`}>
                {reports.map((report) => (
                  <OrgCard key={report.id} user={report} onClick={() => setFocusedUserId(report.id)} />
                ))}
              </div>
            </motion.div>
          )}

          {reports.length === 0 && manager === null && (
            <p className="text-secondary text-[13px] text-center italic">No team members to display</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SkillMatrix() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('insights');
  const [matrix, setMatrix] = useState([]);
  const [orgTree, setOrgTree] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    loadMatrix();
    loadOrgTree();
  }, []);

  async function loadMatrix() {
    try {
      const data = await api.get('/employee-skills/matrix');
      setMatrix(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadOrgTree() {
    try {
      const data = await api.get('/employee-skills/org-tree');
      setOrgTree(data);
    } catch {}
  }

  const allSkillNames = useMemo(() => {
    return [...new Set(matrix.flatMap(m => m.skills.map(s => s.skill.name)))];
  }, [matrix]);

  const radarData = selectedMember?.skills.map(s => ({
    skill: s.skill.name.length > 10 ? s.skill.name.slice(0, 10) + '…' : s.skill.name,
    current: s.calculated_level || 0,
    target: s.target_level || 100,
  })) || [];

  const tabs = [
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'heatmap', label: 'Heatmap', icon: Grid3X3 },
    { id: 'people', label: 'People', icon: Users },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1d1d1f] tracking-tight">Skill Matrix</h1>
          <p className="text-[13px] text-secondary mt-1">Find the right resource for any project or requirement</p>
        </div>

        <div className="flex gap-1 p-1 bg-[#F5F5F7] rounded-xl w-fit border border-card-border/50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-secondary hover:text-[#1d1d1f]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <div className="px-4 py-3 rounded-xl bg-brand/5 border border-brand/20 text-[13px] text-brand">{message}</div>
        )}

        {activeTab === 'insights' && (
          matrix.length === 0 ? (
            <Card className="p-12 text-center">
              <Sparkles className="w-10 h-10 text-[#D2D2D7] mx-auto mb-3" />
              <p className="text-secondary text-[14px]">No data yet. Add skills to team members to see insights.</p>
            </Card>
          ) : (
            <SkillInsights members={matrix} />
          )
        )}

        {activeTab === 'heatmap' && (
          matrix.length === 0 ? (
            <Card className="p-12 text-center">
              <Grid3X3 className="w-10 h-10 text-[#D2D2D7] mx-auto mb-3" />
              <p className="text-secondary text-[14px]">No skills data available.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              <FindBestMatch members={matrix} allSkillNames={allSkillNames} />
              <SkillHeatmap members={matrix} />
            </div>
          )
        )}

        {activeTab === 'people' && (
          matrix.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-10 h-10 text-[#D2D2D7] mx-auto mb-3" />
              <p className="text-secondary text-[14px]">No team members found.</p>
            </Card>
          ) : (
            <>
              {selectedMember && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-[15px] font-semibold text-[#1d1d1f]">{selectedMember.name}</h2>
                        <p className="text-[12px] text-secondary mt-1">{selectedMember.role?.replace('_', ' ')} {selectedMember.designation ? `• ${selectedMember.designation}` : ''}</p>
                      </div>
                      <button onClick={() => setSelectedMember(null)} className="text-[12px] text-brand cursor-pointer hover:underline">Close</button>
                    </div>
                  </Card>

                  {radarData.length >= 3 && (
                    <Card className="p-5">
                      <h3 className="text-[14px] font-semibold text-[#1d1d1f] mb-4">Skill Radar</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#E8E8ED" />
                          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#86868B' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#86868B' }} />
                          <Radar name="Current" dataKey="current" stroke="#007AFF" fill="#007AFF" fillOpacity={0.2} />
                          <Radar name="Target" dataKey="target" stroke="#34C759" fill="#34C759" fillOpacity={0.08} strokeDasharray="4 4" />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {selectedMember.skills.length > 0 && (
                    <Card className="p-5">
                      <h3 className="text-[14px] font-semibold text-[#1d1d1f] mb-4">Skills & Proficiency</h3>
                      <div className="space-y-4">
                        {selectedMember.skills.map(skill => {
                          const getProfColor = (level) => {
                            if (!level) return 'bg-gray-100 text-gray-700';
                            if (level <= 25) return 'bg-green-100 text-green-700';
                            if (level <= 50) return 'bg-amber-100 text-amber-700';
                            if (level <= 75) return 'bg-blue-100 text-blue-700';
                            return 'bg-purple-100 text-purple-700';
                          };
                          const getProfLabel = (level) => {
                            if (!level) return 'N/A';
                            if (level <= 25) return 'Beginner';
                            if (level <= 50) return 'Medium';
                            if (level <= 75) return 'Expert';
                            return 'Master';
                          };
                          return (
                            <div key={skill.id} className="border border-card-border/50 rounded-xl p-4">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                  <h4 className="font-medium text-[14px] text-[#1d1d1f]">{skill.skill.name}</h4>
                                  <p className="text-[12px] text-secondary mt-1">{skill.topicSelections?.length || 0} / {skill.skill.topics?.length || 0} topics</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ProgressRing value={skill.calculated_level || 0} max={100} size={40} strokeWidth={2.5} />
                                  <div className="text-right">
                                    <p className="text-[13px] font-semibold text-[#1d1d1f]">{skill.calculated_level || 0}</p>
                                    <p className="text-[11px] text-secondary">/100</p>
                                  </div>
                                </div>
                              </div>
                              {skill.topicSelections && skill.topicSelections.length > 0 && (
                                <div className="space-y-2 mt-3 pt-3 border-t border-card-border/30">
                                  <p className="text-[11px] font-medium text-secondary uppercase tracking-wide">Subtopics ({skill.topicSelections.length})</p>
                                  <div className="flex flex-wrap gap-2">
                                    {skill.topicSelections.map((ts, idx) => {
                                      const topicName = ts.skillTopic?.name || `Topic ${idx + 1}`;
                                      return (
                                        <span key={ts.id} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${getProfColor(ts.proficiency_level === 'BEGINNER' ? 25 : ts.proficiency_level === 'MEDIUM' ? 50 : ts.proficiency_level === 'EXPERT' ? 75 : 100)}`}>
                                          {topicName}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matrix.map((member, i) => (
                  <motion.div key={member.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card
                      hover
                      className={`p-4 ${selectedMember?.id === member.id ? 'ring-2 ring-brand' : ''}`}
                      onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                          <span className="text-brand font-bold text-[12px]">{member.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#1d1d1f] text-[14px] truncate">{member.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="brand">{member.role?.replace('_', ' ')}</Badge>
                            {member.designation && <span className="text-[11px] text-secondary truncate">{member.designation}</span>}
                          </div>
                        </div>
                        <span className="text-[11px] text-secondary shrink-0">{member.skills.length} skills</span>
                      </div>
                      {member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pl-12">
                          {member.skills.slice(0, 4).map(s => (
                            <div key={s.id} className="flex items-center gap-1.5 bg-page-bg px-2 py-1 rounded-lg">
                              <ProgressRing value={s.calculated_level || 0} max={100} size={22} strokeWidth={2.5} />
                              <span className="text-[11px] text-[#1d1d1f]/70">{s.skill.name}</span>
                            </div>
                          ))}
                          {member.skills.length > 4 && <span className="text-[11px] text-secondary self-center">+{member.skills.length - 4}</span>}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )
        )}

      </div>
    </PageTransition>
  );
}
