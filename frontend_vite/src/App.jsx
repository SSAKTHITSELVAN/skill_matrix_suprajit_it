import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MySkills from './pages/MySkills';
import Team from './pages/Team';
import SkillMatrix from './pages/SkillMatrix';
import Approvals from './pages/Approvals';
import Users from './pages/Users';
import SkillTemplates from './pages/SkillTemplates';
import Insights from './pages/Insights';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                    <Route path="/skills" element={<ProtectedRoute><Layout><MySkills /></Layout></ProtectedRoute>} />
                    <Route path="/insights" element={<ProtectedRoute><Layout><Insights /></Layout></ProtectedRoute>} />
                    <Route path="/team" element={<ProtectedRoute><Layout><Team /></Layout></ProtectedRoute>} />
                    <Route path="/matrix" element={<ProtectedRoute><Layout><SkillMatrix /></Layout></ProtectedRoute>} />
                    <Route path="/approvals" element={<ProtectedRoute><Layout><Approvals /></Layout></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
                    <Route path="/skill-templates" element={<ProtectedRoute><Layout><SkillTemplates /></Layout></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
