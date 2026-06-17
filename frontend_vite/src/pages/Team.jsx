import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users as UsersIcon, Plus, Edit3, Zap, Search, X, Save, Trash2, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import ProgressRing from '../components/ui/ProgressRing';
import PageTransition from '../components/ui/PageTransition';
import ProficiencySelector from '../components/ui/ProficiencySelector';

function ProficiencyTopicSelector({ topics, selections, onChange, maxTopics = 30 }) {
  const PROFICIENCY_VALUES = { BEGINNER: 1, MEDIUM: 2, EXPERT: 3, MASTER: 4 };

  function calculateScore(selections) {
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

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Member's Proficiency Levels</p>
            <p className="text-xs text-gray-600 mt-1">Select proficiency level for each topic</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{calculateScore(selections)}</div>
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [orgTreeUsers, setOrgTreeUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberSkills, setMemberSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [topicSelections, setTopicSelections] = useState([]);
  const [skillForm, setSkillForm] = useState({ target_level: 100, years_experience: 0, can_teach: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const canManage = user?.role === 'ADMIN' || user?.role === 'CTO' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'MANAGER';

  useEffect(() => {
    loadTeam();
    loadAllSkills();
    loadOrgTree();
  }, []);

  async function loadTeam() {
    try {
      const data = await api.get('/users/team');
      setMembers(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadAllSkills() {
    try {
      const data = await api.get('/skills');
      setAllSkills(data);
    } catch {}
  }

  async function loadOrgTree() {
    try {
      const data = await api.get('/employee-skills/org-tree');
      setOrgTreeUsers(data);
    } catch {}
  }

  async function selectMember(member) {
    setSelectedMember(member);
    setEditingProfile(false);
    setShowAddSkill(false);
    setSelectedSkill(null);
    setTopicSelections([]);
    setSearchQuery('');
    setProfileForm({
      designation: member.designation || '',
      project_name: member.project_name || '',
      project_role: member.project_role || '',
      stream: member.stream || '',
      department: member.department || '',
    });
    try {
      const data = await api.get(`/employee-skills/user/${member.id}`);
      setMemberSkills(data);
    } catch {}
  }

  function handleSkillSelect(skill) {
    setSelectedSkill(skill);
    setTopicSelections([]);
    setSearchQuery(skill.name);
    setShowDropdown(false);
  }

  async function handleAddSkillToMember(e) {
    e.preventDefault();
    if (!selectedSkill || topicSelections.length === 0) {
      setMessage('Please select a skill and at least one topic');
      return;
    }
    try {
      await api.post('/employee-skills/with-proficiencies', {
        user_id: selectedMember.id,
        skill_id: selectedSkill.id,
        topic_selections: topicSelections,
        target_level: parseInt(skillForm.target_level) || 100,
        years_experience: parseInt(skillForm.years_experience) || 0,
        can_teach: skillForm.can_teach,
      });
      setShowAddSkill(false);
      setSelectedSkill(null);
      setTopicSelections([]);
      setSearchQuery('');
      setSkillForm({ target_level: 100, years_experience: 0, can_teach: false });
      const data = await api.get(`/employee-skills/user/${selectedMember.id}`);
      setMemberSkills(data);
      setMessage('Skill added successfully');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleRemoveSkill(skillId) {
    try {
      await api.delete(`/employee-skills/${skillId}`);
      const data = await api.get(`/employee-skills/user/${selectedMember.id}`);
      setMemberSkills(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedMember.id}`, profileForm);
      setEditingProfile(false);
      setMessage('Profile updated successfully');
      loadTeam();
    } catch (err) {
      setMessage(err.message);
    }
  }

  const roleVariant = (role) => {
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'CTO': return 'warning';
      case 'DEPARTMENT_HEAD': return 'warning';
      case 'MANAGER': return 'brand';
      case 'LEAD': return 'info';
      default: return 'default';
    }
  };

  // Filter out skills already assigned to this member
  const memberSkillIds = memberSkills.map(s => s.skill_id);
  const availableSkills = allSkills.filter(s =>
    !memberSkillIds.includes(s.id) &&
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[#F5F5F7] rounded-xl w-fit border border-card-border/50">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-white text-[#1d1d1f] shadow-sm'
                : 'text-secondary hover:text-[#1d1d1f]'
            }`}
          >
            <UsersIcon className="w-3.5 h-3.5" />
            Team Members
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer ${
              activeTab === 'tree'
                ? 'bg-white text-[#1d1d1f] shadow-sm'
                : 'text-secondary hover:text-[#1d1d1f]'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
            Organization Tree
          </button>
        </div>

        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3 rounded-lg bg-brand/5 border border-brand/20 text-sm text-brand">
            {message}
            <button onClick={() => setMessage('')} className="ml-2 text-brand/60 hover:text-brand cursor-pointer"><X className="w-3.5 h-3.5 inline" /></button>
          </motion.div>
        )}

        {activeTab === 'members' && (members.length === 0 ? (
          <Card className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-secondary">No team members found.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-2">
              <p className="text-sm font-medium text-secondary mb-2">{members.length} members</p>
              {members.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <button
                    onClick={() => selectMember(m)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedMember?.id === m.id ? 'border-brand bg-brand/5' : 'border-card-border bg-white hover:border-brand/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand font-bold text-sm">{m.name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{m.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={roleVariant(m.role)}>{m.role?.replace('_', ' ')}</Badge>
                          {m.category && <Badge>{m.category}</Badge>}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-2">
              {!selectedMember ? (
                <Card className="p-12 text-center">
                  <UsersIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-secondary text-sm">Select a team member to view details</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900">{selectedMember.name}</h2>
                        <p className="text-xs text-secondary mt-0.5">{selectedMember.email}</p>
                      </div>
                      {canManage && !editingProfile && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
                          <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {!editingProfile ? (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-xs text-secondary uppercase">Role</span><p><Badge variant={roleVariant(selectedMember.role)}>{selectedMember.role?.replace('_', ' ')}</Badge></p></div>
                          <div><span className="text-xs text-secondary uppercase">HR</span><p>{selectedMember.stream || '-'}</p></div>
                          <div><span className="text-xs text-secondary uppercase">Stream</span><p>{selectedMember.category || '-'}</p></div>
                          <div><span className="text-xs text-secondary uppercase">Department</span><p>{selectedMember.department || '-'}</p></div>
                          <div><span className="text-xs text-secondary uppercase">Designation</span><p>{selectedMember.designation || '-'}</p></div>
                          <div><span className="text-xs text-secondary uppercase">Project</span><p>{selectedMember.project_name || '-'}</p></div>
                          <div><span className="text-xs text-secondary uppercase">Project Role</span><p>{selectedMember.project_role || '-'}</p></div>
                          <div><span className="text-xs text-secondary uppercase">Status</span><p><Badge variant={selectedMember.status === 'active' ? 'success' : 'warning'}>{selectedMember.status}</Badge></p></div>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveProfile} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Designation" value={profileForm.designation} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} />
                            <Input label="HR" value={profileForm.stream} onChange={(e) => setProfileForm({ ...profileForm, stream: e.target.value })} placeholder="HR person name" />
                            <Input label="Department" value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} />
                            <Input label="Project Name" value={profileForm.project_name} onChange={(e) => setProfileForm({ ...profileForm, project_name: e.target.value })} />
                            <Input label="Project Role" value={profileForm.project_role} onChange={(e) => setProfileForm({ ...profileForm, project_role: e.target.value })} />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm"><Save className="w-3.5 h-3.5" /> Save</Button>
                            <Button variant="secondary" size="sm" type="button" onClick={() => setEditingProfile(false)}><X className="w-3.5 h-3.5" /> Cancel</Button>
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <h2 className="font-semibold text-gray-900">Skills ({memberSkills.length})</h2>
                      {canManage && (
                        <Button size="sm" onClick={() => { setShowAddSkill(!showAddSkill); setSelectedSkill(null); setTopicSelections([]); setSearchQuery(''); }}>
                          <Plus className="w-3.5 h-3.5" /> Add Skill
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      <AnimatePresence>
                        {showAddSkill && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                            <form onSubmit={handleAddSkillToMember} className="p-4 bg-gray-50 rounded-lg space-y-4">
                              {/* Skill Search */}
                              <div className="relative">
                                <label className="text-[12px] font-medium text-gray-500">Skill</label>
                                <div className="relative mt-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search for a skill..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); setSelectedSkill(null); }}
                                    onFocus={() => { if (!selectedSkill) setShowDropdown(true); }}
                                    className={`w-full pl-9 pr-16 py-2 rounded-lg border bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${selectedSkill ? 'border-green-300 bg-green-50/30' : 'border-card-border'}`}
                                  />
                                  {selectedSkill && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-medium">Selected</span>
                                  )}
                                </div>
                                {showDropdown && searchQuery.length > 0 && !selectedSkill && (
                                  <div className="absolute z-20 mt-1 w-full bg-white border border-card-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {availableSkills.map(s => (
                                      <button key={s.id} type="button" onClick={() => handleSkillSelect(s)}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-brand/5 cursor-pointer">{s.name}</button>
                                    ))}
                                    {availableSkills.length === 0 && (
                                      <p className="px-3 py-2 text-sm text-secondary">No matching skills available</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Topic Proficiency Selector */}
                              {selectedSkill && selectedSkill.topics && (
                                <div onClick={(e) => e.preventDefault()}>
                                  <ProficiencyTopicSelector
                                    topics={selectedSkill.topics}
                                    selections={topicSelections}
                                    onChange={setTopicSelections}
                                    maxTopics={selectedSkill.max_topics || 30}
                                  />
                                </div>
                              )}

                              {/* Additional fields */}
                              {selectedSkill && (
                                <div className="space-y-3 pt-2 border-t border-gray-200">
                                  <Input label="Years Experience" type="number" min="0" value={skillForm.years_experience} onChange={(e) => setSkillForm({ ...skillForm, years_experience: e.target.value })} />
                                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={skillForm.can_teach} onChange={(e) => setSkillForm({ ...skillForm, can_teach: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-brand" />
                                    Available for Mentorship
                                  </label>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={!selectedSkill || topicSelections.length === 0}>Assign Skill</Button>
                                <Button variant="secondary" size="sm" type="button" onClick={() => { setShowAddSkill(false); setSelectedSkill(null); setTopicSelections([]); setSearchQuery(''); }}>Cancel</Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {memberSkills.length === 0 ? (
                        <p className="text-sm text-secondary py-4 text-center">No skills assigned yet</p>
                      ) : (
                        <div className="space-y-3">
                          {memberSkills.map(s => (
                            <div key={s.id} className="p-3 rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <ProgressRing value={s.calculated_level || s.current_level} size={40} strokeWidth={3} max={100} />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{s.skill.name}</p>
                                    <p className="text-xs text-secondary">{s.calculated_level || s.current_level || 0}/100 score</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {s.status === 'APPROVED' && <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-0.5" />Approved</Badge>}
                                  {s.status === 'PENDING' && <Badge variant="warning"><Clock className="w-3 h-3 mr-0.5" />Pending</Badge>}
                                  {s.can_teach && <Badge variant="success">Teach</Badge>}
                                  {canManage && (
                                    <button onClick={() => handleRemoveSkill(s.id)} className="p-1 rounded text-gray-400 hover:text-accent-red hover:bg-red-50 cursor-pointer">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Proficiency Level Details */}
                              <div className="mt-3 space-y-2">
                                <div className="text-xs font-semibold text-gray-700">Subtopics & Proficiency Levels:</div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {((s.topicSelections || []).length === 0 && (s.selectedTopics || []).length === 0) ? (
                                    <p className="text-xs text-gray-500 italic">No topics selected</p>
                                  ) : (s.topicSelections || []).length > 0 ? (
                                    (s.topicSelections || []).map(ts => {
                                      const topic = s.skill.topics.find(t => t.id === ts.skill_topic_id);
                                      const levelColors = {
                                        BEGINNER: 'bg-green-100 text-green-700 border-green-300',
                                        MEDIUM: 'bg-amber-100 text-amber-700 border-amber-300',
                                        EXPERT: 'bg-blue-100 text-blue-700 border-blue-300',
                                        MASTER: 'bg-purple-100 text-purple-700 border-purple-300',
                                      };
                                      return (
                                        <div key={ts.skill_topic_id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                                          <span className="text-[12px] font-medium text-gray-800 flex-1">
                                            {topic?.name}
                                          </span>
                                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${levelColors[ts.proficiency_level]} whitespace-nowrap`}>
                                            {ts.proficiency_level}
                                          </span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    (s.selectedTopics || []).map(st => {
                                      const topic = s.skill.topics.find(t => t.id === st.skill_topic_id);
                                      return (
                                        <div key={st.skill_topic_id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                                          <span className="text-[12px] font-medium text-gray-800 flex-1">
                                            {topic?.name}
                                          </span>
                                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                                            Selected
                                          </span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        ))}

        {activeTab === 'tree' && (
          orgTreeUsers.length === 0 ? (
            <Card className="p-12 text-center">
              <ChevronRight className="w-10 h-10 text-[#D2D2D7] mx-auto mb-3" />
              <p className="text-secondary text-[14px]">No organization data available.</p>
            </Card>
          ) : (
            <OrgTreeDisplay users={orgTreeUsers} />
          )
        )}
      </div>
    </PageTransition>
  );
}

// Organization Tree Component for Team Page
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
      initial={{ opacity: 0, scale: 0.95 }}
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

function OrgTreeDisplay({ users }) {
  const { user: currentUser } = useAuth();
  const ctoUser = users.find(u => u.role === 'CTO');
  const [focusedUserId, setFocusedUserId] = useState(ctoUser?.id || currentUser?.id);

  const focusedUser = users.find(u => u.id === focusedUserId) || ctoUser || currentUser;

  const getManager = (u) => {
    if (u.manager_id) {
      const mgr = users.find(user => user.id === u.manager_id);
      if (mgr && mgr.role === 'ADMIN') return null;
      return mgr;
    }
    return null;
  };

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
          {manager && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <p className="text-[11px] text-secondary uppercase tracking-wide mb-3 font-semibold">Reports To</p>
              <OrgCard user={manager} onClick={() => setFocusedUserId(manager.id)} />
              <div className="w-1 h-8 bg-gradient-to-b from-gray-400 to-gray-200 mx-auto mt-4" />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className="text-[11px] text-secondary uppercase tracking-wide mb-3 font-semibold">You</p>
            <OrgCard user={focusedUser} isCurrent={true} onClick={() => {}} />
          </motion.div>

          {reports.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
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
