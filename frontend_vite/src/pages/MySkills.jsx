import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, AlertTriangle, GraduationCap, Search, Zap, Edit3, Save, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import ProgressRing from '../components/ui/ProgressRing';
import PageTransition from '../components/ui/PageTransition';
import ProficiencySelector from '../components/ui/ProficiencySelector';

const PROFICIENCY_VALUES = { BEGINNER: 1, MEDIUM: 2, EXPERT: 3, MASTER: 4 };

function calculateScore(selections, maxTopics = 30) {
  if (!selections || selections.length === 0) return 0;

  const sum = selections.reduce((acc, sel) => acc + (PROFICIENCY_VALUES[sel.proficiency_level] || 0), 0);
  const averageProficiency = sum / selections.length;

  // Coverage: how many topics selected vs available
  const coverage = selections.length / maxTopics;

  // Depth: how deep their proficiency is (0-1, where 1 = all MASTER)
  const depth = averageProficiency / 4;

  // Final score: coverage × depth × 100
  const score = Math.round(coverage * depth * 100);

  return Math.min(100, score);
}

function ProficiencyTopicSelector({ topics, selections, onChange, disabled, maxTopics = 30 }) {
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Your Proficiency Levels</p>
            <p className="text-xs text-gray-600 mt-1">Select your level for each topic</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{calculateScore(selections, maxTopics)}</div>
            <p className="text-xs text-gray-600">Score / 100</p>
          </div>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Zap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No topics available for this skill yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map(topic => {
            const selection = selections.find(s => s.skill_topic_id === topic.id);
            return (
              <ProficiencySelector
                key={topic.id}
                topicId={topic.id}
                topicName={topic.name}
                selectedLevel={selection?.proficiency_level || null}
                onChange={(level) => {
                  const updated = selections.filter(s => s.skill_topic_id !== topic.id);
                  updated.push({ skill_topic_id: topic.id, proficiency_level: level });
                  onChange(updated);
                }}
                disabled={disabled}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'APPROVED') return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
  if (status === 'REJECTED') return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
  return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
}

export default function MySkills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selections, setSelections] = useState([]);
  const [form, setForm] = useState({ target_level: 40, years_experience: 0, can_teach: false });
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editSelections, setEditSelections] = useState([]);
  const [editForm, setEditForm] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    checkAccess();
    loadSkills();
    loadAllSkills();
  }, []);

  async function checkAccess() {
    try {
      const data = await api.get('/users/profile');
      setProfile(data);
      if (data.role === 'ADMIN') { setBlocked(false); return; }
      if (data.role === 'CTO' && !data.manager_id) { setBlocked(true); return; }
      if (data.role === 'DEPARTMENT_HEAD' && !data.manager_id) { setBlocked(true); return; }
      if (data.role === 'MANAGER' && !data.department_head_id) { setBlocked(true); return; }
      if (data.role === 'LEAD' && (!data.manager_id || !data.department_head_id)) { setBlocked(true); return; }
      if (data.role === 'EMPLOYEE' && (!data.manager_id || !data.lead_id || !data.department_head_id)) { setBlocked(true); return; }
      setBlocked(false);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadSkills() {
    try {
      const data = await api.get('/employee-skills/my-skills');
      setSkills(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadAllSkills() {
    try {
      const data = await api.get('/skills');
      setAllSkills(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  function handleSkillSelect(skill) {
    setSelectedSkill(skill);
    setSelections([]);
    setSearchQuery(skill.name);
    setShowDropdown(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setMessage('');
    if (!selectedSkill) {
      setMessage('Please select a skill');
      return;
    }
    if (selections.length === 0) {
      setMessage('Please select at least one topic and its proficiency level');
      return;
    }
    try {
      await api.post('/employee-skills/with-proficiencies', {
        skill_id: selectedSkill.id,
        topic_selections: selections,
        target_level: parseInt(form.target_level),
        years_experience: parseInt(form.years_experience),
        can_teach: form.can_teach,
      });
      setShowAdd(false);
      setSelectedSkill(null);
      setSelections([]);
      setSearchQuery('');
      setForm({ target_level: 40, years_experience: 0, can_teach: false });
      loadSkills();
      setMessage('Skill submitted for approval');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/employee-skills/${id}`);
      loadSkills();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function startEdit(skill) {
    setEditingId(skill.id);
    setEditSelections((skill.topicSelections || []).map(ts => ({
      skill_topic_id: ts.skill_topic_id,
      proficiency_level: ts.proficiency_level || 'BEGINNER',
    })));
    setEditForm({
      target_level: skill.target_level,
      years_experience: skill.years_experience,
      can_teach: skill.can_teach,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditSelections([]);
    setEditForm({});
  }

  async function handleUpdate(id) {
    setMessage('');
    if (editSelections.length === 0) {
      setMessage('Please select at least one topic');
      return;
    }
    try {
      await api.put(`/employee-skills/${id}/proficiencies`, {
        topic_selections: editSelections,
        target_level: parseInt(editForm.target_level),
        years_experience: parseInt(editForm.years_experience),
        can_teach: editForm.can_teach,
      });
      setEditingId(null);
      setEditSelections([]);
      setEditForm({});
      loadSkills();
      setMessage('Skill updated successfully');
    } catch (err) {
      setMessage(err.message);
    }
  }

  const alreadyAssignedSkillIds = skills.map(s => s.skill_id);
  const availableSkills = allSkills.filter(s =>
    !alreadyAssignedSkillIds.includes(s.id) &&
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (blocked) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">My Skills</h1>
          <Card className="border-accent-red/30 bg-red-50/50">
            <CardContent className="py-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-accent-red mt-0.5" />
                <div>
                  <p className="font-semibold text-accent-red">Access Blocked</p>
                  <p className="text-sm text-gray-600 mt-1">You must set your reporting hierarchy (manager{user?.role === 'EMPLOYEE' ? ' and lead' : ''}) in your <Link to="/profile" className="underline font-bold text-brand">Profile</Link> before managing skills.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Skills</h1>
          <Button onClick={() => setShowAdd(!showAdd)} size="sm">
            <Plus className="w-4 h-4" /> Add Skill
          </Button>
        </div>

        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3 rounded-lg bg-brand/5 border border-brand/20 text-sm text-brand">
            {message}
          </motion.div>
        )}

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card>
                <CardHeader><h2 className="font-semibold text-gray-900">Add New Skill</h2></CardHeader>
                <CardContent>
                  <form onSubmit={handleAdd} className="space-y-5" onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}>
                    {/* Skill Search */}
                    <div className="relative">
                      <label className="text-[13px] font-medium text-gray-500 tracking-wide">Skill</label>
                      <div className="relative mt-1.5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search for a skill..."
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); setSelectedSkill(null); }}
                          onFocus={() => { if (!selectedSkill) setShowDropdown(true); }}
                          className={`w-full pl-10 pr-20 py-2.5 rounded-xl border bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200 ${selectedSkill ? 'border-green-300 bg-green-50/30' : 'border-card-border'}`}
                        />
                        {selectedSkill && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-medium">Selected</span>
                        )}
                      </div>
                      {showDropdown && searchQuery.length > 0 && !selectedSkill && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-card-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {availableSkills.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSkillSelect(s)}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand/5 transition-colors cursor-pointer"
                            >
                              {s.name}
                            </button>
                          ))}
                          {availableSkills.length === 0 && (
                            <p className="px-4 py-2.5 text-sm text-secondary">No matching skills available</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Topic Proficiency Selector */}
                    {selectedSkill && selectedSkill.topics && (
                      <div onClick={(e) => e.preventDefault()}>
                        <ProficiencyTopicSelector
                          topics={selectedSkill.topics}
                          selections={selections}
                          onChange={setSelections}
                          maxTopics={selectedSkill.max_topics || 30}
                        />
                      </div>
                    )}

                    {/* Additional Fields */}
                    {selectedSkill && (
                      <div className="space-y-4 pt-2 border-t border-gray-100">
                        <Input label="Years of Experience" type="number" min="0" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
                        <label className="flex items-center gap-2.5 text-[14px] font-medium text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={form.can_teach} onChange={(e) => setForm({ ...form, can_teach: e.target.checked })} className="w-[18px] h-[18px] rounded border-gray-300 text-brand focus:ring-brand focus:ring-offset-0" />
                          Available for Mentorship
                        </label>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" disabled={!selectedSkill || selections.length === 0}>Submit for Approval</Button>
                      <Button variant="secondary" type="button" onClick={() => { setShowAdd(false); setSelectedSkill(null); setSelections([]); setSearchQuery(''); }}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {skills.length === 0 ? (
          <Card className="p-12 text-center">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-secondary">No skills added yet. Click "Add Skill" to get started.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card hover className="p-5">
                  {editingId === s.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[17px] font-semibold text-gray-900">{s.skill.name}</h3>
                        <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div onClick={(e) => e.preventDefault()}>
                        <ProficiencyTopicSelector
                          topics={s.skill.topics}
                          selections={editSelections}
                          onChange={setEditSelections}
                          maxTopics={s.skill.max_topics || 30}
                        />
                      </div>
                      <Input
                        label="Years Experience"
                        type="number"
                        min="0"
                        value={editForm.years_experience}
                        onChange={(e) => setEditForm({ ...editForm, years_experience: e.target.value })}
                      />
                      <label className="flex items-center gap-2.5 text-[14px] font-medium text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.can_teach}
                          onChange={(e) => setEditForm({ ...editForm, can_teach: e.target.checked })}
                          className="w-[18px] h-[18px] rounded border-gray-300 text-brand focus:ring-brand focus:ring-offset-0"
                        />
                        Available for Mentorship
                      </label>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={() => handleUpdate(s.id)}>
                          <Save className="w-3.5 h-3.5" /> Save
                        </Button>
                        <Button size="sm" variant="secondary" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <ProgressRing value={s.calculated_level || s.current_level} max={100} size={52} strokeWidth={4} />
                          <div>
                            <h3 className="font-semibold text-gray-900">{s.skill.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-secondary">{s.topicSelections?.length || 0} topics selected</span>
                              <span className="text-xs text-secondary">|</span>
                              <span className="text-xs text-secondary">{s.years_experience}yr exp</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={s.status} />
                          {s.can_teach && (
                            <Badge variant="success"><GraduationCap className="w-3 h-3 mr-1" />Mentor</Badge>
                          )}
                        </div>
                      </div>

                      {/* Proficiency Level Details */}
                      <div className="mt-4 space-y-2">
                        <div className="text-xs font-semibold text-gray-700">Subtopics & Proficiency Levels:</div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {(s.topicSelections || []).length === 0 ? (
                            <p className="text-xs text-gray-500 italic">No topics selected</p>
                          ) : (
                            (s.topicSelections || []).map(ts => {
                              const topic = s.skill.topics.find(t => t.id === ts.skill_topic_id);
                              const levelColors = {
                                BEGINNER: 'bg-green-100 text-green-700 border-green-300',
                                MEDIUM: 'bg-amber-100 text-amber-700 border-amber-300',
                                EXPERT: 'bg-blue-100 text-blue-700 border-blue-300',
                                MASTER: 'bg-purple-100 text-purple-700 border-purple-300',
                              };
                              return (
                                <div key={ts.skill_topic_id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                                  <span className="text-[12px] font-medium text-gray-800 flex-1">
                                    {topic?.name}
                                  </span>
                                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${levelColors[ts.proficiency_level]} whitespace-nowrap`}>
                                    {ts.proficiency_level}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-secondary mb-1">
                            <span>Score</span>
                            <span>{s.calculated_level || s.current_level}/100</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${((s.calculated_level || s.current_level) / 100) * 100}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05 }}
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: (s.calculated_level || s.current_level) <= 10 ? '#EF4444' : (s.calculated_level || s.current_level) <= 20 ? '#F59E0B' : (s.calculated_level || s.current_level) <= 30 ? '#3B82F6' : '#22C55E'
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-accent-red hover:bg-red-50 transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
