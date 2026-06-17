import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { AlertTriangle, Edit3, Save, X, Lock, Eye, EyeOff } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import PageTransition from '../components/ui/PageTransition';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState('');
  const [managersList, setManagersList] = useState([]);
  const [showHierarchyForm, setShowHierarchyForm] = useState(false);
  const [hierarchyForm, setHierarchyForm] = useState({ department_head_id: '', manager_id: '', lead_id: '' });

  useEffect(() => {
    loadProfile();
    loadManagersList();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.get('/users/profile');
      setProfile(data);
      setForm(data);
      setHierarchyForm({ department_head_id: data.department_head_id || '', manager_id: data.manager_id || '', lead_id: data.lead_id || '' });
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function loadManagersList() {
    try {
      const data = await api.get('/users/managers-leads');
      setManagersList(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  function needsHierarchy() {
    if (!profile) return false;
    if (profile.role === 'ADMIN') return false;
    if (profile.role === 'CTO' && !profile.manager_id) return true;
    if (profile.role === 'DEPARTMENT_HEAD' && !profile.manager_id) return true;
    if (profile.role === 'MANAGER' && !profile.department_head_id) return true;
    if (profile.role === 'LEAD' && (!profile.manager_id || !profile.department_head_id)) return true;
    if (profile.role === 'EMPLOYEE' && (!profile.manager_id || !profile.lead_id || !profile.department_head_id)) return true;
    return false;
  }

  async function handleHierarchySave(e) {
    e.preventDefault();
    setMessage('');
    try {
      const updates = {};
      if (hierarchyForm.department_head_id) updates.department_head_id = parseInt(hierarchyForm.department_head_id);
      if (hierarchyForm.manager_id) updates.manager_id = parseInt(hierarchyForm.manager_id);
      if (hierarchyForm.lead_id) updates.lead_id = parseInt(hierarchyForm.lead_id);
      await api.put('/users/profile', updates);
      const freshProfile = await api.get('/users/profile');
      setProfile(freshProfile);
      setForm(freshProfile);
      setHierarchyForm({ department_head_id: freshProfile.department_head_id || '', manager_id: freshProfile.manager_id || '', lead_id: freshProfile.lead_id || '' });
      setMessage('Reporting hierarchy updated');
      setShowHierarchyForm(false);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage('');
    try {
      const updates = {};

      // Name and email can be edited by all users (with approval for LEAD/EMPLOYEE)
      if (form.name !== profile.name) updates.name = form.name;
      if (form.email !== profile.email) updates.email = form.email;

      // Designation only editable by ADMIN, CTO, DEPARTMENT_HEAD, or MANAGER
      const canEditDesignation = ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER'].includes(user?.role);
      if (canEditDesignation && form.designation !== profile.designation) {
        updates.designation = form.designation;
      }

      const formDoj = form.date_of_joining ? form.date_of_joining.slice(0, 10) : '';
      const profileDoj = profile.date_of_joining ? profile.date_of_joining.slice(0, 10) : '';
      if (formDoj !== profileDoj) updates.date_of_joining = form.date_of_joining;
      if (form.years_of_experience !== profile.years_of_experience) updates.years_of_experience = form.years_of_experience ? parseInt(form.years_of_experience) : null;
      if (form.project_name !== profile.project_name) updates.project_name = form.project_name;
      if (form.project_role !== profile.project_role) updates.project_role = form.project_role;

      if (Object.keys(updates).length === 0) {
        setEditing(false);
        return;
      }

      const res = await api.put('/users/profile', updates);
      setMessage(res.message || 'Profile updated');
      setEditing(false);
      loadProfile();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (!profile) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  const departmentHeads = managersList.filter(u => u.role === 'DEPARTMENT_HEAD');
  const managers = managersList.filter(u => u.role === 'MANAGER');
  const leads = managersList.filter(u => u.role === 'LEAD');
  const blocked = needsHierarchy();

  // Calculate total experience with months
  const calculateTotalExperience = () => {
    if (!profile.date_of_joining) return '-';
    const joinDate = new Date(profile.date_of_joining);
    const now = new Date();
    const diffMs = now - joinDate;
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
    return `${years} years ${months} months`;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-3 rounded-lg bg-brand/5 border border-brand/20 text-sm text-brand">
            {message}
          </motion.div>
        )}

        {blocked && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-accent-red/30 bg-red-50/50">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-accent-red mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-accent-red">Action Required: Select your reporting hierarchy</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {profile.role === 'CTO' && 'You must select your reporting admin.'}
                      {profile.role === 'DEPARTMENT_HEAD' && 'You must select your reporting admin.'}
                      {profile.role === 'MANAGER' && 'You must select your department head.'}
                      {profile.role === 'LEAD' && 'You must select your department head and manager.'}
                      {profile.role === 'EMPLOYEE' && 'You must select your department head, manager, and lead.'}
                    </p>
                    <form onSubmit={handleHierarchySave} className="mt-4 space-y-3">
                      {(profile.role === 'CTO' || profile.role === 'DEPARTMENT_HEAD') && (
                        <Select
                          label="Reporting To (Admin)"
                          value={hierarchyForm.manager_id}
                          onChange={(e) => setHierarchyForm({ ...hierarchyForm, manager_id: e.target.value })}
                          required
                        >
                          <option value="">Select Admin</option>
                          {managersList.filter(u => u.role === 'ADMIN').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </Select>
                      )}
                      {(profile.role === 'MANAGER' || profile.role === 'LEAD' || profile.role === 'EMPLOYEE') && (
                        <Select
                          label="Department Head"
                          value={hierarchyForm.department_head_id}
                          onChange={(e) => setHierarchyForm({ ...hierarchyForm, department_head_id: e.target.value })}
                          required
                        >
                          <option value="">Select Department Head</option>
                          {departmentHeads.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </Select>
                      )}
                      {(profile.role === 'LEAD' || profile.role === 'EMPLOYEE') && (
                        <Select
                          label="Manager"
                          value={hierarchyForm.manager_id}
                          onChange={(e) => setHierarchyForm({ ...hierarchyForm, manager_id: e.target.value })}
                          required
                        >
                          <option value="">Select Manager</option>
                          {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </Select>
                      )}
                      {profile.role === 'EMPLOYEE' && (
                        <Select
                          label="Lead"
                          value={hierarchyForm.lead_id}
                          onChange={(e) => setHierarchyForm({ ...hierarchyForm, lead_id: e.target.value })}
                          required
                        >
                          <option value="">Select Lead</option>
                          {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </Select>
                      )}
                      <Button type="submit" size="sm">Save Hierarchy</Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!editing ? (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Personal Information</h2>
              <div className="flex gap-2">
                {!blocked && profile.role !== 'ADMIN' && profile.role !== 'CTO' && (
                  <Button variant="ghost" size="sm" onClick={() => setShowHierarchyForm(!showHierarchyForm)}>
                    Change Reporting
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)} disabled={blocked}>
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Identity Strip */}
              <div className="flex items-center gap-4 pb-6 border-b border-card-border">
                <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center text-brand text-[22px] font-bold shrink-0">
                  {profile.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-semibold text-gray-900">{profile.name}</div>
                  <div className="text-[13px] text-secondary mt-0.5">{profile.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="brand" className="text-[11px] font-semibold uppercase tracking-wider">
                    {profile.role?.replace('_', ' ')}
                  </Badge>
                  <Badge
                    variant={profile.status === 'active' ? 'success' : 'warning'}
                    className="text-[11px] font-semibold uppercase tracking-wider"
                  >
                    {profile.status}
                  </Badge>
                </div>
              </div>

              {/* Position Group */}
              <div className="pt-6">
                <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3.5">
                  Position
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-4">
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Department</div>
                    <div className="text-[14.5px] font-medium text-gray-900">{profile.department || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Stream</div>
                    <div className="text-[14.5px] font-medium text-gray-900">{profile.category || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Platform</div>
                    <div className="text-[14.5px] font-medium text-gray-900">
                      {profile.platform ? <Badge variant={profile.platform === 'CORE' ? 'brand' : 'info'}>{profile.platform}</Badge> : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">HR</div>
                    <div className="text-[14.5px] font-medium text-gray-900">{profile.stream || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Project</div>
                    <div className="text-[14.5px] font-medium text-gray-900">{profile.project_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Date of Joining</div>
                    <div className="text-[14.5px] font-medium text-gray-900">
                      {profile.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience Group */}
              <div className="pt-6">
                <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3.5">
                  Experience
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-4">
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Total Experience</div>
                    <div className="text-[14.5px] font-medium text-gray-900">{calculateTotalExperience()}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">One Pager</div>
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-[14.5px] font-medium text-brand hover:underline">
                      View document
                    </a>
                  </div>
                </div>
              </div>

              {/* Reporting Group */}
              <div className="pt-6">
                <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3.5">
                  Reporting
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-4">
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Reporting Manager</div>
                    <div className="text-[14.5px] font-medium text-gray-900">{profile.manager?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Department Head</div>
                    <div className="text-[14.5px] font-medium text-gray-900">{profile.departmentHead?.name || '-'}</div>
                  </div>
                  {profile.role === 'EMPLOYEE' && profile.lead && (
                    <div>
                      <div className="text-[11px] text-secondary uppercase tracking-wide mb-1">Lead</div>
                      <div className="text-[14.5px] font-medium text-gray-900">{profile.lead.name}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Last Updated */}
              {profile.updatedBy && (
                <div className="pt-6 mt-6 border-t border-card-border">
                  <div className="text-[11px] text-secondary">
                    Last updated by <span className="font-medium text-gray-900">{profile.updatedBy.name}</span> ({profile.updatedBy.role?.replace('_', ' ')})
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Edit Profile</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="pb-4 border-b border-card-border">
                  <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3">
                    Personal Details
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      value={form.name || ''}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="pb-4 border-b border-card-border">
                  <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3">
                    Position Details
                  </div>
                  <div className="space-y-4">
                    {['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER'].includes(user?.role) && (
                      <Input
                        label="Designation"
                        value={form.designation || ''}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      />
                    )}
                    <Input
                      label="Date of Joining"
                      type="date"
                      value={form.date_of_joining ? form.date_of_joining.slice(0, 10) : ''}
                      onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
                    />
                    <Input
                      label="Years of Experience"
                      type="number"
                      min="0"
                      max="50"
                      value={form.years_of_experience || ''}
                      onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
                      placeholder="Enter total years of experience"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-3">
                    Project Details
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="Project Name"
                      value={form.project_name || ''}
                      onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                    />
                    <Input
                      label="Project Role"
                      value={form.project_role || ''}
                      onChange={(e) => setForm({ ...form, project_role: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-card-border">
                  <Button type="submit"><Save className="w-3.5 h-3.5" /> Save Changes</Button>
                  <Button variant="secondary" type="button" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /> Cancel</Button>
                </div>
                {(user?.role === 'LEAD' || user?.role === 'EMPLOYEE') && (
                  <p className="text-xs text-secondary">Changes will be submitted for manager approval.</p>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {showHierarchyForm && !blocked && profile.role !== 'ADMIN' && profile.role !== 'CTO' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Update Reporting Hierarchy</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHierarchySave} className="space-y-4">
                  {(profile.role === 'CTO' || profile.role === 'DEPARTMENT_HEAD') && (
                    <Select
                      label="Reporting To (Admin)"
                      value={hierarchyForm.manager_id}
                      onChange={(e) => setHierarchyForm({ ...hierarchyForm, manager_id: e.target.value })}
                      required
                    >
                      <option value="">Select Admin</option>
                      {managersList.filter(u => u.role === 'ADMIN').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Select>
                  )}
                  {(profile.role === 'MANAGER' || profile.role === 'LEAD' || profile.role === 'EMPLOYEE') && (
                    <Select
                      label="Department Head"
                      value={hierarchyForm.department_head_id}
                      onChange={(e) => setHierarchyForm({ ...hierarchyForm, department_head_id: e.target.value })}
                      required
                    >
                      <option value="">Select Department Head</option>
                      {departmentHeads.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                  )}
                  {(profile.role === 'LEAD' || profile.role === 'EMPLOYEE') && (
                    <Select
                      label="Manager"
                      value={hierarchyForm.manager_id}
                      onChange={(e) => setHierarchyForm({ ...hierarchyForm, manager_id: e.target.value })}
                      required
                    >
                      <option value="">Select Manager</option>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </Select>
                  )}
                  {profile.role === 'EMPLOYEE' && (
                    <Select
                      label="Lead"
                      value={hierarchyForm.lead_id}
                      onChange={(e) => setHierarchyForm({ ...hierarchyForm, lead_id: e.target.value })}
                      required
                    >
                      <option value="">Select Lead</option>
                      {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit"><Save className="w-3.5 h-3.5" /> Save</Button>
                    <Button variant="secondary" type="button" onClick={() => setShowHierarchyForm(false)}><X className="w-3.5 h-3.5" /> Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <ChangePasswordSection />
      </div>
    </PageTransition>
  );
}

function ChangePasswordSection() {
  const [showForm, setShowForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.put('/users/change-password', { oldPassword, newPassword });
      setSuccess('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-4 h-4 text-secondary" />
          <h2 className="font-semibold text-gray-900">Password & Security</h2>
        </div>
        {!showForm && (
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            Change Password
          </Button>
        )}
      </CardHeader>
      {showForm && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error && <p className="text-[13px] text-accent-red">{error}</p>}
            {success && <p className="text-[13px] text-green-600">{success}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                <Lock className="w-3.5 h-3.5" /> {loading ? 'Saving...' : 'Update Password'}
              </Button>
              <Button variant="secondary" type="button" onClick={() => { setShowForm(false); setError(''); }}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
