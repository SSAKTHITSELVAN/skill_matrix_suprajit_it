import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ClipboardCheck, ArrowRight, Zap } from 'lucide-react';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PageTransition from '../components/ui/PageTransition';

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [skillApprovals, setSkillApprovals] = useState([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('skills');

  useEffect(() => {
    loadApprovals();
    loadSkillApprovals();
  }, []);

  async function loadApprovals() {
    try {
      const data = await api.get('/approvals/pending');
      setApprovals(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadSkillApprovals() {
    try {
      const data = await api.get('/employee-skills/pending');
      setSkillApprovals(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleApprove(id) {
    try {
      await api.put(`/approvals/${id}/approve`);
      setMessage('Request approved');
      loadApprovals();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleReject(id) {
    try {
      await api.put(`/approvals/${id}/reject`);
      setMessage('Request rejected');
      loadApprovals();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSkillApprove(id) {
    try {
      await api.put(`/employee-skills/${id}/approve`);
      setMessage('Skill approved');
      loadSkillApprovals();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSkillReject(id) {
    try {
      await api.put(`/employee-skills/${id}/reject`);
      setMessage('Skill rejected');
      loadSkillApprovals();
    } catch (err) {
      setMessage(err.message);
    }
  }

  const totalPending = approvals.length + skillApprovals.length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          {totalPending > 0 && (
            <Badge variant="warning">{totalPending} pending</Badge>
          )}
        </div>

        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-3 rounded-lg bg-brand/5 border border-brand/20 text-sm text-brand">
            {message}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'skills' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Skill Requests {skillApprovals.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">{skillApprovals.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile Changes {approvals.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">{approvals.length}</span>}
          </button>
        </div>

        {/* Skill Approvals Tab */}
        {activeTab === 'skills' && (
          <>
            {skillApprovals.length === 0 ? (
              <Card className="p-12 text-center">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-secondary">No pending skill approvals. All caught up!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {skillApprovals.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card hover className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-brand font-bold text-sm">{s.user.name[0]}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {s.user.name} <span className="text-secondary font-normal">wants to add</span> <span className="font-semibold text-brand">{s.skill.name}</span>
                                </p>
                                <p className="text-xs text-secondary mt-0.5">
                                  Level: {s.current_level}/10 &middot; {s.selectedTopics.length} topics selected
                                </p>
                              </div>
                            </div>

                            {/* Show selected topics */}
                            <div className="ml-12 flex flex-wrap gap-1.5 mt-2">
                              {s.skill.topics.map(topic => {
                                const isSelected = s.selectedTopics.some(st => st.skill_topic_id === topic.id);
                                return (
                                  <span
                                    key={topic.id}
                                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                                      isSelected
                                        ? 'bg-green-100 text-green-700 font-medium'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    {topic.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" onClick={() => handleSkillApprove(s.id)}>
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleSkillReject(s.id)}>
                              <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* Profile Approvals Tab */}
        {activeTab === 'profile' && (
          <>
            {approvals.length === 0 ? (
              <Card className="p-12 text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-secondary">No pending profile changes. All caught up!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {approvals.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card hover className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-amber-600 font-bold text-sm">{a.user.name[0]}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">
                                {a.user.name} <span className="text-secondary font-normal">wants to change</span> <span className="font-semibold text-brand">{a.field_name}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 text-sm">
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 truncate max-w-[120px]">{a.old_value || 'empty'}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                                <span className="px-2 py-0.5 rounded bg-brand/5 text-brand font-medium truncate max-w-[120px]">{a.new_value}</span>
                              </div>
                              <p className="text-xs text-secondary mt-1.5">Changed by: {a.changer.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" onClick={() => handleApprove(a.id)}>
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleReject(a.id)}>
                              <X className="w-3.5 h-3.5" /> Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
