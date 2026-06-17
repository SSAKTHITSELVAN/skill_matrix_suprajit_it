import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, UserX, UserCog } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import PageTransition from '../components/ui/PageTransition';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'EMPLOYEE', hr: '', category: 'SW', platform: 'CORE', department: '', designation: '', date_of_joining: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMessage('');
    try {
      const { hr, ...rest } = form;
      const data = await api.post('/users', { ...rest, stream: hr });
      setMessage(`User created. Password: ${data.tempPassword}`);
      setShowCreate(false);
      setForm({ name: '', email: '', role: 'EMPLOYEE', hr: '', category: 'SW', platform: 'CORE', department: '', designation: '', date_of_joining: '' });
      loadUsers();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleResetPassword(id) {
    try {
      const data = await api.post(`/users/${id}/reset-password`);
      setMessage(`Password reset. New password: ${data.tempPassword}`);
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

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm">
            <Plus className="w-4 h-4" /> Create User
          </Button>
        </div>

        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-3 rounded-lg bg-brand/5 border border-brand/20 text-sm text-brand font-mono">
            {message}
          </motion.div>
        )}

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card>
                <CardHeader><h2 className="font-semibold text-gray-900">Create New User</h2></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                      <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="LEAD">LEAD</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="DEPARTMENT_HEAD">DEPARTMENT HEAD</option>
                        <option value="CTO">CTO</option>
                        <option value="ADMIN">ADMIN</option>
                      </Select>
                      <Input label="HR" value={form.hr} onChange={(e) => setForm({ ...form, hr: e.target.value })} placeholder="HR person name" />
                      <Select label="Stream" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                        <option value="SW">Software</option>
                        <option value="HW">Hardware</option>
                        <option value="DEVOPS">DevOps</option>
                        <option value="MANAGEMENT">Management</option>
                      </Select>
                      <Select label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                        <option value="CORE">CORE</option>
                        <option value="COMMERCIAL">COMMERCIAL</option>
                      </Select>
                      <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Software Development" />
                      <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Engineer, Manager" />
                      <Input label="Date of Joining" type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Create User</Button>
                      <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-gray-50/50">
                  <th className="text-left p-3 font-medium text-secondary">Name</th>
                  <th className="text-left p-3 font-medium text-secondary">Email</th>
                  <th className="text-left p-3 font-medium text-secondary">Role</th>
                  <th className="text-left p-3 font-medium text-secondary">HR</th>
                  <th className="text-left p-3 font-medium text-secondary">Stream</th>
                  <th className="text-left p-3 font-medium text-secondary">Platform</th>
                  <th className="text-left p-3 font-medium text-secondary">Department</th>
                  <th className="text-left p-3 font-medium text-secondary">DOJ</th>
                  <th className="text-left p-3 font-medium text-secondary">Manager</th>
                  <th className="text-left p-3 font-medium text-secondary">Status</th>
                  <th className="text-left p-3 font-medium text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-card-border hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-900">{u.name}</td>
                    <td className="p-3 text-secondary">{u.email}</td>
                    <td className="p-3"><Badge variant={roleVariant(u.role)}>{u.role?.replace('_', ' ')}</Badge></td>
                    <td className="p-3 text-secondary">{u.stream || '-'}</td>
                    <td className="p-3 text-secondary">{u.category || '-'}</td>
                    <td className="p-3">{u.platform ? <Badge variant={u.platform === 'CORE' ? 'brand' : 'info'}>{u.platform}</Badge> : '-'}</td>
                    <td className="p-3 text-secondary">{u.department || '-'}</td>
                    <td className="p-3 text-secondary">{u.date_of_joining ? new Date(u.date_of_joining).toLocaleDateString() : '-'}</td>
                    <td className="p-3 text-secondary">{u.manager?.name || '-'}</td>
                    <td className="p-3"><Badge variant={u.status === 'active' ? 'success' : 'warning'}>{u.status}</Badge></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleResetPassword(u.id)} className="p-1.5 rounded-lg text-secondary hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer" title="Reset Password">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg text-secondary hover:text-accent-red hover:bg-red-50 transition-colors cursor-pointer" title="Deactivate">
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
