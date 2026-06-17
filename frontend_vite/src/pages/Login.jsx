import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import logoImg from '../assets/logo_v1.png';

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/signin', { email, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#000000]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1d1d1f] via-[#000000] to-[#1d1d1f] animate-gradient" />
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-[400px] mx-4"
      >
        <div className="glass-dark rounded-3xl p-10 shadow-[0_0_0_0.5px_rgba(255,255,255,0.05)]">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-6"
            >
              <img src={logoImg} alt="Suprajit" className="h-30 w-auto mx-auto" />
            </motion.div>
            <h1 className="text-[28px] font-bold text-white tracking-tight">Skill Matrix</h1>
            <p className="text-[#86868B] text-[15px] mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#86868B] group-focus-within:text-white/80 transition-colors z-10" />
              <input
                type="email"
                list="email-suggestions"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#1d1d1f] border border-[#424245] text-[15px] text-white placeholder:text-[#86868B] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-200"
                required
              />
              <datalist id="email-suggestions">
                {email.length > 0 && !email.includes('@') && (
                  <>
                    <option value={`${email}@suprajit.com`} />
                    <option value={`${email}@gmail.com`} />
                  </>
                )}
                {email.includes('@') && !email.includes('@suprajit.com') && !email.includes('@gmail.com') && (
                  <>
                    <option value={`${email.split('@')[0]}@suprajit.com`} />
                    <option value={`${email.split('@')[0]}@gmail.com`} />
                  </>
                )}
              </datalist>
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[#86868B] group-focus-within:text-white/80 transition-colors" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#1d1d1f] border border-[#424245] text-[15px] text-white placeholder:text-[#86868B] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all duration-200"
                required
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#FF453A] text-[13px] bg-[#FF453A]/10 px-4 py-2.5 rounded-xl"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 mt-3 rounded-xl bg-brand text-white text-[15px] font-medium hover:bg-brand-light transition-all duration-200 disabled:opacity-40 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
