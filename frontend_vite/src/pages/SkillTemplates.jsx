import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Save, X, BookOpen, ChevronDown, AlertCircle } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import PageTransition from '../components/ui/PageTransition';

function TopicEditor({ topics, onChange }) {
  const MAX_TOPICS = 30;

  function updateTopic(index, value) {
    const updated = [...topics];
    updated[index] = value;
    onChange(updated);
  }

  function addTopic() {
    if (topics.length >= MAX_TOPICS) return;
    onChange([...topics, '']);
  }

  function removeTopic(index) {
    onChange(topics.filter((_, i) => i !== index));
  }

  const isFull = topics.length >= MAX_TOPICS;
  const isEmpty = topics.length === 0;
  const filledCount = topics.filter(t => t.trim()).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-gray-700 tracking-wide">
          Topics
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            topics.length === 0
              ? 'bg-gray-100 text-gray-600'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {filledCount} added
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {topics.map((topic, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 group"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <span className="text-xs font-bold text-brand">{idx + 1}</span>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => updateTopic(idx, e.target.value)}
              placeholder={`Topic name`}
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
            <button
              type="button"
              onClick={() => removeTopic(idx)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={addTopic}
        disabled={isFull}
        className={`w-full py-2.5 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-2 text-sm font-medium ${
          isFull
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'border-brand/30 bg-brand/5 text-brand hover:border-brand/50 hover:bg-brand/10 cursor-pointer'
        }`}
      >
        <Plus className="w-4 h-4" />
        {isEmpty ? 'Add First Topic' : 'Add Topic'}
        {!isEmpty && <span className="text-xs opacity-70">({topics.length})</span>}
      </button>

      {isFull && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Maximum 30 topics reached
          </p>
        </div>
      )}
    </div>
  );
}

export default function SkillTemplates() {
  const [skills, setSkills] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', topics: [] });
  const [editForm, setEditForm] = useState({ name: '', topics: [] });
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      const data = await api.get('/skills');
      setSkills(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setMessage('');
    if (!form.name.trim()) {
      setMessage('Skill name is required');
      return;
    }
    const filledTopics = form.topics.filter(t => t.trim());
    if (filledTopics.length < 1) {
      setMessage(`Please add at least 1 topic`);
      return;
    }
    try {
      await api.post('/skills', { name: form.name.trim(), topics: filledTopics, max_topics: 30 });
      setShowAdd(false);
      setForm({ name: '', topics: [] });
      loadSkills();
      setMessage('Skill template created successfully');
    } catch (err) {
      setMessage(err.message);
    }
  }

  function startEdit(skill) {
    setEditingId(skill.id);
    setEditForm({
      name: skill.name,
      max_topics: skill.max_topics || 10,
      topics: skill.topics.map(t => t.name),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: '', max_topics: 10, topics: [] });
  }

  async function handleUpdate(id) {
    setMessage('');
    if (!editForm.name.trim()) {
      setMessage('Skill name is required');
      return;
    }
    const filledTopics = editForm.topics.filter(t => t.trim());
    if (filledTopics.length < 1) {
      setMessage(`Please add at least 1 topic`);
      return;
    }
    try {
      await api.put(`/skills/${id}`, { name: editForm.name.trim(), topics: filledTopics, max_topics: 30 });
      setEditingId(null);
      setEditForm({ name: '', topics: [] });
      loadSkills();
      setMessage('Skill template updated successfully');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure? This will remove the skill and all associated employee records.')) return;
    try {
      await api.delete(`/skills/${id}`);
      loadSkills();
      setMessage('Skill deleted successfully');
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skill Templates</h1>
            <p className="text-sm text-secondary mt-1">Manage skill definitions and their topics</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} size="sm">
            <Plus className="w-4 h-4" /> New Skill
          </Button>
        </div>

        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3 rounded-lg bg-brand/5 border border-brand/20 text-sm text-brand">
            {message}
          </motion.div>
        )}

        {/* Add New Skill Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Create New Skill Template</h2>
                    <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdd} className="space-y-6">
                    <Input
                      label="Skill Name"
                      placeholder="e.g., C++, Python, CAN Protocol"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                    <TopicEditor
                      topics={form.topics}
                      onChange={(topics) => setForm({ ...form, topics })}
                    />
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <Button type="submit">Create Skill</Button>
                      <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill List */}
        {skills.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-secondary">No skill templates yet. Create one to get started.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {skills.map((skill, i) => (
              <motion.div key={skill.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                {editingId === skill.id ? (
                  <Card className="p-5">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Edit: {skill.name}</h3>
                        <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <Input
                        label="Skill Name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <TopicEditor
                        topics={editForm.topics}
                        onChange={(topics) => setEditForm({ ...editForm, topics })}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(skill.id)}>
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </Button>
                        <Button size="sm" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card hover className="p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === skill.id ? null : skill.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <BookOpen className="w-5 h-5 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg">{skill.name}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <Badge variant="info" className="text-xs">
                              {skill.topics.length} / {skill.max_topics || 10} topics
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Created by {skill.creator?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => startEdit(skill)} className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(skill.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Topics */}
                    <AnimatePresence>
                      {expandedId === skill.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Topics</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {skill.topics.map((topic, idx) => (
                              <div
                                key={topic.id}
                                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                              >
                                <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-brand">{idx + 1}</span>
                                </div>
                                <span className="text-sm text-gray-700 truncate">{topic.name}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
