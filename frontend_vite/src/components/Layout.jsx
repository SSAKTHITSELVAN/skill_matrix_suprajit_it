import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LayoutDashboard, User, Zap, Users, Grid3X3, ClipboardCheck, UserCog, LogOut, Menu, X, BookOpen, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import logoImg from '../assets/logo_v1.png';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD', 'EMPLOYEE'] },
  { path: '/profile', label: 'Profile', icon: User, roles: ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD', 'EMPLOYEE'] },
  { path: '/skills', label: 'My Skills', icon: Zap, roles: ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD', 'EMPLOYEE'] },
  { path: '/insights', label: 'Insights', icon: BarChart3, roles: ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD', 'EMPLOYEE'] },
  { path: '/skill-templates', label: 'Skill Templates', icon: BookOpen, roles: ['ADMIN', 'MANAGER'] },
  { path: '/team', label: 'Team', icon: Users, roles: ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD'] },
  { path: '/matrix', label: 'Skill Matrix', icon: Grid3X3, roles: ['ADMIN', 'CTO', 'DEPARTMENT_HEAD', 'MANAGER', 'LEAD'] },
  { path: '/approvals', label: 'Approvals', icon: ClipboardCheck, roles: ['ADMIN', 'MANAGER'] },
  { path: '/users', label: 'Users', icon: UserCog, roles: ['ADMIN'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="h-screen flex overflow-hidden bg-page-bg">
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] shrink-0 bg-[#1d1d1f] flex flex-col transition-transform duration-500 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <img src={logoImg} alt="Suprajit" className="h-24 w-auto" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5 overflow-y-auto">
          {filteredNav.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'text-white/65 hover:text-white hover:bg-white/8'
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.7} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-white/10">
          <div className="px-3 py-2.5 mb-1">
            <p className="text-[13px] font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-white/40 mt-0.5 uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-white/40 hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-all duration-200 w-full cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="bg-white/80 backdrop-blur-2xl border-b border-card-border/50 px-8 h-14 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-black/5 cursor-pointer transition-colors"
            >
              <Menu className="w-5 h-5 text-[#1d1d1f]" />
            </button>
            <h1 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight hidden lg:block">
              {filteredNav.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center ring-2 ring-white shadow-sm">
              <span className="text-white text-[12px] font-bold">{user?.name?.[0]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-6 pb-20 w-full overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1120px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
