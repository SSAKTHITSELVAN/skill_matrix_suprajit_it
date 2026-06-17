import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Zap, Grid3X3, ClipboardCheck, UserCog, Users, ShieldAlert, Lock, Eye, EyeOff } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PageTransition from '../components/ui/PageTransition';
import ProgressRing from '../components/ui/ProgressRing';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function ChangePasswordPrompt({ onDone }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.put('/users/change-password', { oldPassword, newPassword });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-amber-200/60 bg-amber-50/30">
        <CardHeader className="border-amber-200/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Change Your Password</h2>
              <p className="text-[13px] text-secondary mt-0.5">You're using a temporary password. Please set a new one to secure your account.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter your temporary password"
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
              placeholder="Re-enter new password"
              required
            />
            {error && <p className="text-[13px] text-accent-red">{error}</p>}
            <Button type="submit" disabled={loading}>
              <Lock className="w-4 h-4" /> {loading ? 'Saving...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState({ totalSkills: 0, avgLevel: 0, teachable: 0 });
  const [mustChangePassword, setMustChangePassword] = useState(user?.must_change_password || false);

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      const data = await api.get('/employee-skills/my-skills');
      setSkills(data);
      if (data.length > 0) {
        const avg = data.reduce((sum, s) => sum + (s.calculated_level || 0), 0) / data.length;
        const teach = data.filter(s => s.can_teach).length;
        const expertCount = data.filter(s => (s.calculated_level || 0) >= 60).length;
        setStats({ totalSkills: data.length, avgLevel: Math.round(avg), teachable: teach, expertSkills: expertCount });
      }
    } catch {
    }
  }

  function handlePasswordChanged() {
    setMustChangePassword(false);
    updateUser({ ...user, must_change_password: false });
  }

  const radarData = skills.slice(0, 6).map(s => ({
    skill: s.skill.name.length > 10 ? s.skill.name.slice(0, 10) + '...' : s.skill.name,
    current: s.calculated_level || 0,
    target: s.target_level || 100,
  }));

  const quickLinks = [
    { path: '/profile', label: 'Profile', desc: 'View & edit your profile', icon: User, color: 'bg-blue-50 text-blue-600' },
    { path: '/skills', label: 'My Skills', desc: 'Manage your skill set', icon: Zap, color: 'bg-amber-50 text-amber-600' },
    ...(['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD'].includes(user?.role) ? [
      { path: '/team', label: 'Team', desc: 'View team members', icon: Users, color: 'bg-purple-50 text-purple-600' },
      { path: '/matrix', label: 'Skill Matrix', desc: 'Team skills overview', icon: Grid3X3, color: 'bg-green-50 text-green-600' },
    ] : []),
    ...(['ADMIN', 'MANAGER'].includes(user?.role) ? [
      { path: '/approvals', label: 'Approvals', desc: 'Review pending requests', icon: ClipboardCheck, color: 'bg-orange-50 text-orange-600' },
    ] : []),
    ...(user?.role === 'ADMIN' ? [
      { path: '/users', label: 'Manage Users', desc: 'Create & manage users', icon: UserCog, color: 'bg-rose-50 text-rose-600' },
    ] : []),
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-secondary text-sm mt-1">Here's your skill development overview</p>
        </div>

        {mustChangePassword && (
          <ChangePasswordPrompt onDone={handlePasswordChanged} />
        )}

        {skills.length > 0 && (
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div variants={item}>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Total Skills</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSkills}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-brand" />
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Average Proficiency</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgLevel}</p>
                    <p className="text-xs text-secondary mt-1">/100 scale</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ProgressRing value={stats.avgLevel} max={100} size={48} />
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary">Can Teach</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.teachable}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {radarData.length >= 3 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Radar</h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar name="Current" dataKey="current" stroke="#0D4E9E" fill="#0D4E9E" fillOpacity={0.3} />
                <Radar name="Target" dataKey="target" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} strokeDasharray="4 4" />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Access</h2>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map(link => (
              <motion.div key={link.path} variants={item}>
                <Link to={link.path}>
                  <Card hover className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color}`}>
                        <link.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{link.label}</h3>
                        <p className="text-sm text-secondary mt-0.5">{link.desc}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
