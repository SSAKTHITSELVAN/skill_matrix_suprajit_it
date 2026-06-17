import { useState } from 'react';
import { Plus, Trash2, Edit3, GripVertical, Check, X } from 'lucide-react';
import { api } from '../utils/api';
import Card, { CardContent, CardHeader } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopicManagementPanel({ skill, onUpdate }) {
  const [topics, setTopics] = useState(skill.topics || []);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });
  const [editTopic, setEditTopic] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!newTopic.name.trim()) {
      setMessage('Topic name is required');
      return;
    }
    if (topics.length >= (skill.max_topics || 10)) {
      setMessage(`Skill cannot have more than ${skill.max_topics || 10} topics (current: ${topics.length})`);
      return;
    }

    setLoading(true);
    try {
      const topic = await api.post(`/skills/${skill.id}/topics`, {
        topic_name: newTopic.name.trim(),
        description: newTopic.description.trim() || null,
      });
      setTopics([...topics, topic]);
      setNewTopic({ name: '', description: '' });
      setShowAdd(false);
      setMessage('Topic added successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTopic = async (topicId) => {
    setMessage('');
    if (!editTopic.name.trim()) {
      setMessage('Topic name is required');
      return;
    }

    setLoading(true);
    try {
      const updated = await api.put(`/skills/${skill.id}/topics/${topicId}`, {
        topic_name: editTopic.name.trim(),
        description: editTopic.description.trim() || null,
      });
      setTopics(topics.map(t => t.id === topicId ? updated : t));
      setEditingId(null);
      setEditTopic({});
      setMessage('Topic updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    setMessage('');
    setLoading(true);
    try {
      await api.delete(`/skills/${skill.id}/topics/${topicId}`);
      setTopics(topics.filter(t => t.id !== topicId));
      setMessage('Topic deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (topic) => {
    setEditingId(topic.id);
    setEditTopic({ name: topic.name, description: topic.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTopic({});
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Topics Management ({topics.length}/{skill.max_topics || 10})</h3>
        <Button
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          disabled={topics.length >= (skill.max_topics || 10) || loading}
        >
          <Plus className="w-4 h-4" /> Add Topic
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-3 py-2 rounded-lg bg-brand/5 border border-brand/20 text-sm text-brand"
          >
            {message}
          </motion.div>
        )}

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
            >
              <Input
                label="Topic Name"
                value={newTopic.name}
                onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                placeholder="e.g., Variables & Data Types"
                disabled={loading}
              />
              <Input
                label="Description (Optional)"
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                placeholder="Describe what this topic covers..."
                disabled={loading}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddTopic}
                  disabled={!newTopic.name.trim() || loading}
                >
                  <Check className="w-3.5 h-3.5" /> Create
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setShowAdd(false);
                    setNewTopic({ name: '', description: '' });
                  }}
                  disabled={loading}
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {topics.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No topics yet. Add one to get started.</p>
          ) : (
            topics.map((topic) => (
              <div
                key={topic.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {editingId === topic.id ? (
                  <div className="space-y-2">
                    <Input
                      label="Topic Name"
                      value={editTopic.name}
                      onChange={(e) => setEditTopic({ ...editTopic, name: e.target.value })}
                      disabled={loading}
                    />
                    <Input
                      label="Description"
                      value={editTopic.description}
                      onChange={(e) => setEditTopic({ ...editTopic, description: e.target.value })}
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditTopic(topic.id)}
                        disabled={!editTopic.name.trim() || loading}
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={cancelEdit}
                        disabled={loading}
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{topic.name}</div>
                        {topic.description && (
                          <div className="text-xs text-gray-600 mt-1">{topic.description}</div>
                        )}
                        <div className="text-[11px] text-gray-500 mt-2">Sort Order: {topic.sort_order}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(topic)}
                        disabled={loading}
                        className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        disabled={loading}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {topics.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Tip: You can reorder topics by dragging them (drag-and-drop functionality coming soon)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
