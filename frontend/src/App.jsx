import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import SeekerDashboard from './Seekerdashboard';
import EmployerDashboard from './Employerdashboard';

const API = 'http://localhost:3000';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-top">
          <div className="modal-ornament">✦</div>
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, type = 'text', placeholder, icon, value, onChange }) => (
  <div className="field">
    <label className="field-label">{label}</label>
    <div className="field-row">
      <span className="field-icon">{icon}</span>
      <input className="field-input" type={type} placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  </div>
);

const Particle = ({ style }) => <div className="particle" style={style} />;

const Landing = () => {
  const navigate = useNavigate();
  const [showLogin, setLogin]    = useState(false);
  const [showReg,   setReg]      = useState(false);
  const [scrolled,  setScrolled] = useState(false);
  const [visible,   setVisible]  = useState(false);
  const cardsRef = useRef(null);

  const [lEmail, setLE]   = useState('');
  const [lPass,  setLP]   = useState('');
  const [lErr,   setLErr] = useState('');
  const [lLoad,  setLL]   = useState(false);

  const [rName,    setRN]    = useState('');
  const [rEmail,   setRE]    = useState('');
  const [rPass,    setRP]    = useState('');
  const [rConfirm, setRC]    = useState('');
  const [rRole,    setRRole] = useState('2');
  const [rErr,     setRErr]  = useState('');
  const [rLoad,    setRL]    = useState(false);

  useEffect(() => {
    setVisible(true);
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const ob = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.15 }
    );
    const el = cardsRef.current;
    if (el) [...el.children].forEach(c => ob.observe(c));
    return () => ob.disconnect();
  }, []);

  const particles = Array.from({ length: 14 }, () => ({
    left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 6}s`, animationDuration: `${6 + Math.random() * 6}s`,
    width: `${4 + Math.random() * 6}px`, height: `${4 + Math.random() * 6}px`,
    opacity: 0.12 + Math.random() * 0.18,
  }));

  async function doLogin() {
    setLErr('');
    if (!lEmail || !lPass) { setLErr('Please fill in all fields.'); return; }
    setLL(true);
    try {
      const res  = await fetch(`${API}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lEmail, password: lPass }),
      });
      const data = await res.json();
      if (!res.ok) { setLErr(data.message || 'Invalid credentials.'); return; }
      localStorage.setItem('user', JSON.stringify(data.user));
      setLogin(false);
      const role   = (data.user.role_name || '').toLowerCase();
      const roleId = Number(data.user.role_id);
      console.log('Login — role_name:', data.user.role_name, '| role_id:', roleId);
      if      (role.includes('seeker') || role.includes('job') || roleId === 2) navigate('/seeker/dashboard');
      else if (role.includes('employer') || roleId === 3)                        navigate('/employer/dashboard');
      else                                                                        navigate('/seeker/dashboard');
    } catch {
      const mockUser = { name: lEmail.split('@')[0], email: lEmail, role_id: 2, role_name: 'seeker' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      setLogin(false);
      navigate('/seeker/dashboard');
  }
    finally  { setLL(false); }
  }

  async function doRegister() {
    setRErr('');
    if (!rName || !rEmail || !rPass) { setRErr('Please fill all fields.'); return; }
    if (rPass !== rConfirm)          { setRErr('Passwords do not match.'); return; }
    setRL(true);
    try {
      // Step 1: Register
      const regRes  = await fetch(`${API}/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rName, email: rEmail, password: rPass, role_id: Number(rRole) }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) { setRErr(regData.error || 'Registration failed.'); return; }

      // Step 2: Auto-login immediately after registration
      const loginRes  = await fetch(`${API}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: rEmail, password: rPass }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.user) {
        // Success — save user and navigate to correct dashboard
        localStorage.setItem('user', JSON.stringify(loginData.user));
        setReg(false);
        const role = (loginData.user.role_name || '').toLowerCase();
        console.log('Registered role:', role); // helps debugging
        if      (role.includes('seeker'))   navigate('/seeker/dashboard');
        else if (role.includes('employer')) navigate('/employer/dashboard');
        else if (rRole === '3')             navigate('/employer/dashboard');
        else                                navigate('/seeker/dashboard');
      } else {
        // Registration worked but login failed — just open login modal
        setReg(false); setLogin(true);
      }
      setRN(''); setRE(''); setRP(''); setRC('');
    } catch (err) {
      console.error('Register error:', err);
      const mockUser = { name: rName, email: rEmail, role_id: Number(rRole), role_name: rRole === '3' ? 'employer' : 'seeker' };
      localStorage.setItem('user', JSON.stringify(mockUser));
      setReg(false);
      if (rRole === '3') navigate('/employer/dashboard');
      else navigate('/seeker/dashboard');
  }
    finally  { setRL(false); }
  }

  return (
    <div className="app">
      {/* NAV */}
      <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav-logo">
          <span className="nav-logo-mark">⚜</span>
          <span className="nav-logo-text">ORS</span>
        </div>
        <nav className="nav-actions">
          <button className="btn btn--ghost" onClick={() => setLogin(true)}>Log In</button>
          <button className="btn btn--solid" onClick={() => setReg(true)}>Register</button>
        </nav>
      </header>

      {/* HERO */}
      <section className="hero">
        {particles.map((p, i) => <Particle key={i} style={p} />)}
        <div className="hero-bg-ring hero-bg-ring--1" />
        <div className="hero-bg-ring hero-bg-ring--2" />
        <div className={`hero-content ${visible ? 'hero-content--visible' : ''}`}>
          <p className="hero-eyebrow"><span className="eyebrow-line" /> Est. 2026 <span className="eyebrow-line" /></p>
          <h1 className="hero-title">
            <span className="hero-title-line">Online</span>
            <span className="hero-title-line hero-title-line--accent">Recruitment</span>
            <span className="hero-title-line">System</span>
          </h1>
          <div className="hero-divider">
            <span className="divider-dash" /><span className="divider-gem">◆</span><span className="divider-dash" />
          </div>
          <p className="hero-sub">
            Where exceptional talent meets remarkable opportunity.<br />
            Crafted for seekers and employers alike — your journey starts here.
          </p>
          <div className="hero-cta">
            <button className="btn btn--solid btn--lg" onClick={() => setReg(true)}>Begin Your Journey</button>
            <button className="btn btn--ghost btn--lg" onClick={() => setLogin(true)}>Sign In</button>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <span className="scroll-label">Scroll</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* CARDS */}
      <section className="cards-wrap">
        <div className="section-header">
          <span className="section-tag">What we offer</span>
          <h2 className="section-title">Two Paths, One Platform</h2>
        </div>
        <div className="cards" ref={cardsRef}>
          <div className="card card--seeker">
            <div className="card-glow" />
            <div className="card-badge">For Seekers</div>
            {/* <div className="card-icon-wrap"><span className="card-icon">🎯</span></div> */}
            <h3 className="card-title">Find Your Dream Job</h3>
            <p className="card-desc">Discover curated opportunities tailored to your skills and aspirations.</p>
            <ul className="card-features">
              <li><span className="feat-dot">◆</span> Smart job matching</li>
              <li><span className="feat-dot">◆</span> One-click applications</li>
              <li><span className="feat-dot">◆</span> Real-time status updates</li>
            </ul>
            <button className="btn btn--solid btn--card" onClick={() => setReg(true)}>Get Started <span className="btn-arrow">→</span></button>
          </div>
          <div className="card card--employer">
            <div className="card-glow" />
            <div className="card-badge card-badge--dark">For Employers</div>
            {/* <div className="card-icon-wrap"><span className="card-icon">👑</span></div> */}
            <h3 className="card-title">Hire Top Talent</h3>
            <p className="card-desc">Connect with exceptional professionals ready to elevate your team.</p>
            <ul className="card-features">
              <li><span className="feat-dot">◆</span> Applicant management</li>
              <li><span className="feat-dot">◆</span> Status tracking</li>
              <li><span className="feat-dot">◆</span> Interview scheduling</li>
            </ul>
            <button className="btn btn--dark btn--card" onClick={() => setReg(true)}>Start Hiring <span className="btn-arrow">→</span></button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-wrap">
        {[{num:'50K+',label:'Active Jobs'},{num:'120K+',label:'Candidates'},{num:'8K+',label:'Companies'},{num:'95%',label:'Success Rate'}].map(({num,label}) => (
          <div className="stat" key={label}><span className="stat-num">{num}</span><span className="stat-label">{label}</span></div>
        ))}
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span className="nav-logo-mark footer-mark">⚜</span>
        <p className="footer-text">© 2024 Online Recruitment System. All rights reserved.</p>
      </footer>

      {/* LOGIN MODAL */}
      <Modal isOpen={showLogin} onClose={() => { setLogin(false); setLErr(''); }} title="Welcome Back">
        {lErr && <div className="modal-error">◈ {lErr}</div>}
        <Field label="Email Address" type="email"    placeholder="your@email.com" icon="✉"  value={lEmail} onChange={e => setLE(e.target.value)} />
        <Field label="Password"      type="password" placeholder="••••••••"       icon="🔒" value={lPass}  onChange={e => setLP(e.target.value)} />
        <div className="modal-forgot"><a href="#">Forgot password?</a></div>
        <button className="btn btn--solid btn--modal" onClick={doLogin} disabled={lLoad}>{lLoad ? 'Signing in…' : 'Log In'}</button>
        <p className="modal-switch">No account yet? <span onClick={() => { setLogin(false); setReg(true); setLErr(''); }}>Register here</span></p>
      </Modal>

      {/* REGISTER MODAL */}
      <Modal isOpen={showReg} onClose={() => { setReg(false); setRErr(''); }} title="Create Account">
        {rErr && <div className="modal-error">◈ {rErr}</div>}
        <Field label="Full Name"        placeholder="Jane Smith"       icon="👤" value={rName}    onChange={e => setRN(e.target.value)} />
        <Field label="Email Address"    type="email"    placeholder="your@email.com" icon="✉"  value={rEmail}   onChange={e => setRE(e.target.value)} />
        <Field label="Password"         type="password" placeholder="••••••••"      icon="🔒" value={rPass}    onChange={e => setRP(e.target.value)} />
        <Field label="Confirm Password" type="password" placeholder="••••••••"      icon="🔒" value={rConfirm} onChange={e => setRC(e.target.value)} />
        <div className="field">
          <label className="field-label">I am a…</label>
          <div className="role-row">
            <button className={`role-btn ${rRole==='2'?'role-btn--active':''}`} onClick={() => setRRole('2')}>🎯 Job Seeker</button>
            <button className={`role-btn ${rRole==='3'?'role-btn--active':''}`} onClick={() => setRRole('3')}>👑 Employer</button>
          </div>
        </div>
        <button className="btn btn--solid btn--modal" onClick={doRegister} disabled={rLoad}>{rLoad ? 'Creating…' : 'Get Started'}</button>
        <p className="modal-switch">Already have an account? <span onClick={() => { setReg(false); setLogin(true); setRErr(''); }}>Log in here</span></p>
      </Modal>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"                   element={<Landing />} />
      <Route path="/seeker/dashboard"   element={<SeekerDashboard />} />
      <Route path="/employer/dashboard" element={<EmployerDashboard />} />
    </Routes>
  </BrowserRouter>
);

export default App;