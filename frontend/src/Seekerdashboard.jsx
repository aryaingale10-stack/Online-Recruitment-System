import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API = 'http://localhost:3000';

/* ── dummy jobs shown when backend has no data ── */
const DUMMY_JOBS = [
  { job_id:1,  title:'Frontend Developer',       company_name:'TechCorp Solutions',  location:'San Francisco, CA', salary:90000,  deadline:'2025-06-30' },
  { job_id:2,  title:'Data Analyst',              company_name:'DataVerse Inc',       location:'Remote',            salary:75000,  deadline:'2025-07-15' },
  { job_id:3,  title:'UX Designer',               company_name:'Pixel Studio',        location:'New York, NY',      salary:85000,  deadline:'2025-06-20' },
  { job_id:4,  title:'Backend Engineer',          company_name:'CloudBase Ltd',       location:'Seattle, WA',       salary:110000, deadline:'2025-07-01' },
  { job_id:5,  title:'Product Manager',           company_name:'LaunchPad Ventures',  location:'Austin, TX',        salary:120000, deadline:'2025-08-01' },
  { job_id:6,  title:'DevOps Engineer',           company_name:'InfraStack',          location:'Remote',            salary:105000, deadline:'2025-07-20' },
  { job_id:7,  title:'Mobile Developer (React Native)', company_name:'AppForge',      location:'Chicago, IL',       salary:95000,  deadline:'2025-06-25' },
  { job_id:8,  title:'Machine Learning Engineer', company_name:'NeuralPath AI',       location:'Boston, MA',        salary:130000, deadline:'2025-07-10' },
  { job_id:9,  title:'Cybersecurity Analyst',     company_name:'SecureEdge',          location:'Washington, DC',    salary:95000,  deadline:'2025-07-05' },
  { job_id:10, title:'Full Stack Developer',      company_name:'WebCraft Agency',     location:'Remote',            salary:88000,  deadline:'2025-06-28' },
  { job_id:11, title:'Cloud Architect',           company_name:'SkyOps Cloud',        location:'Denver, CO',        salary:140000, deadline:'2025-08-15' },
  { job_id:12, title:'QA Engineer',               company_name:'BugSquash Labs',      location:'San Jose, CA',      salary:78000,  deadline:'2025-07-18' },
];

const DUMMY_APPS = [
  { application_id:1, title:'Frontend Developer', company_name:'TechCorp Solutions', application_date:'2025-05-10', status:'Shortlisted', job_id:1 },
  { application_id:2, title:'Data Analyst',        company_name:'DataVerse Inc',      application_date:'2025-05-14', status:'Under Review', job_id:2 },
  { application_id:3, title:'UX Designer',         company_name:'Pixel Studio',       application_date:'2025-05-18', status:'Submitted',    job_id:3 },
];

const STATUS_MAP = {
  'Submitted':    { icon:'◈', cls:'badge--submitted'  },
  'Under Review': { icon:'◉', cls:'badge--review'     },
  'Shortlisted':  { icon:'◆', cls:'badge--shortlisted' },
  'Hired':        { icon:'✦', cls:'badge--hired'       },
  'Rejected':     { icon:'◇', cls:'badge--rejected'    },
};

const StatusBadge = ({ status }) => {
  const { icon, cls } = STATUS_MAP[status] || STATUS_MAP['Submitted'];
  return <span className={`status-badge ${cls}`}><span>{icon}</span>{status}</span>;
};

const Counter = ({ target }) => {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const t0 = performance.now();
        const tick = now => {
          const p = Math.min((now - t0) / 900, 1);
          setN(Math.floor((1 - Math.pow(1-p,3)) * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold:.5 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [target]);
  return <span ref={ref}>{n}</span>;
};

const COMPANY_ICONS = ['🏢','🏦','🚀','💡','🎯','⚙️','🧠','🏗️','🌐','📡','🔬','🎨'];

const JobCard = ({ job, idx, applied, onApply }) => {
  const icon    = COMPANY_ICONS[idx % COMPANY_ICONS.length];
  const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Open';
  const salary   = job.salary   ? `$${Number(job.salary).toLocaleString()}` : 'Negotiable';
  return (
    <div className="jc" style={{ animationDelay:`${idx*.05}s` }}>
      <div className="jc-shine" />
      <div className="jc-top">
        <div className="jc-logo">{icon}</div>
        <span className="jc-deadline">📅 {deadline}</span>
      </div>
      <h3 className="jc-title">{job.title}</h3>
      <p className="jc-company">{job.company_name}</p>
      <div className="jc-tags">
        <span className="jc-tag">📍 {job.location||'N/A'}</span>
        <span className="jc-tag">💼 Full-time</span>
      </div>
      <div className="jc-foot">
        <div>
          <div className="jc-salary">{salary}</div>
          <div className="jc-sal-lbl">per year</div>
        </div>
        <button
          className={`jc-btn ${applied?'jc-btn--done':''}`}
          onClick={() => !applied && onApply(job.job_id)}
          disabled={applied}
        >
          {applied ? <>✦ Applied</> : <>Apply <span className="btn-arrow">→</span></>}
        </button>
      </div>
    </div>
  );
};

export default function SeekerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [tab,        setTab]     = useState('browse');
  const [jobs,       setJobs]    = useState([]);
  const [apps,       setApps]    = useState([]);
  const [applied,    setApplied] = useState(new Set());
  const [search,     setSearch]  = useState('');
  const [locFilter,  setLocF]    = useState('all');
  const [loading,    setLoad]    = useState(true);
  const [scrolled,   setScrolled]= useState(false);
  const [visible,    setVisible] = useState(false);
  const [toast,      setToast]   = useState({ show:false, msg:'', type:'success' });

  useEffect(() => {
    setVisible(true);
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { loadJobs(); loadApps(); }, []);

  async function loadJobs() {
    setLoad(true);
    try {
      const res  = await fetch(`${API}/jobs`);
      const data = await res.json();
      setJobs(Array.isArray(data) && data.length ? data : DUMMY_JOBS);
    } catch { setJobs(DUMMY_JOBS); }
    finally { setLoad(false); }
  }

  async function loadApps() {
    if (!user.user_id) { setApps(DUMMY_APPS); setApplied(new Set(DUMMY_APPS.map(a=>a.job_id))); return; }
    try {
      const res  = await fetch(`${API}/applications/${user.user_id}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        setApps(data); setApplied(new Set(data.map(a => a.job_id)));
      } else {
        setApps(DUMMY_APPS); setApplied(new Set(DUMMY_APPS.map(a=>a.job_id)));
      }
    } catch { setApps(DUMMY_APPS); setApplied(new Set(DUMMY_APPS.map(a=>a.job_id))); }
  }

  async function doApply(jobId) {
    if (!user.user_id) { showToast('Please log in to apply','error'); return; }
    try {
      const res  = await fetch(`${API}/applications`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ job_id: jobId, seeker_id: user.user_id }),
      });
      if (!res.ok) throw new Error();
      setApplied(p => new Set([...p, jobId]));
      showToast('Application submitted! 🎉','success');
      loadApps();
    } catch { showToast('Could not submit — try again','error'); }
  }

  function showToast(msg, type='success') {
    setToast({ show:true, msg, type });
    setTimeout(() => setToast(t => ({...t, show:false})), 3400);
  }

  const filtered = jobs.filter(j => {
    const s = search.toLowerCase();
    const matchS = !s || j.title?.toLowerCase().includes(s) || j.company_name?.toLowerCase().includes(s);
    const matchL = locFilter==='all' || j.location?.toLowerCase().includes(locFilter.toLowerCase());
    return matchS && matchL;
  });

  const total       = apps.length;
  const underReview = apps.filter(a=>a.status==='Under Review').length;
  const shortlisted = apps.filter(a=>a.status==='Shortlisted').length;
  const hired       = apps.filter(a=>a.status==='Hired').length;

  return (
    <div className="db">

      {/* NAV */}
      <header className={`db-nav ${scrolled?'db-nav--scrolled':''}`}>
        <div className="db-logo" onClick={() => navigate('/')}>
          <span className="db-logo-mark">⚜</span>
          <span className="db-logo-text">ORS</span>
        </div>
        <nav className="db-tabs">
          <button className={`db-tab ${tab==='browse'?'db-tab--on':''}`} onClick={() => setTab('browse')}>◈ Browse Jobs</button>
          <button className={`db-tab ${tab==='apps'?'db-tab--on':''}`}   onClick={() => setTab('apps')}>◆ My Applications {total>0 && <span className="db-badge">{total}</span>}</button>
        </nav>
        <div className="db-nav-r">
          <div className="db-pill">
            <span className="db-avatar">{(user.name||'U')[0].toUpperCase()}</span>
            <span className="db-uname">{user.name||'Guest'}</span>
          </div>
          <button className="db-logout" onClick={() => { localStorage.removeItem('user'); navigate('/'); }}>↩ Exit</button>
        </div>
      </header>

      <main className={`db-main ${visible?'db-main--on':''}`}>

        {/* WELCOME */}
        <section className="db-welcome">
          <div className="db-welcome-text">
            <p className="db-eyebrow"><span className="eyebrow-line"/>Your Dashboard<span className="eyebrow-line"/></p>
            <h1 className="db-welcome-h1">Welcome back,<br /><span className="db-wname">{user.name?.split(' ')[0]||'Seeker'}</span></h1>
            <p className="db-welcome-sub">Your journey to the perfect role continues here.</p>
          </div>
          <div className="db-ornament">
            <div className="db-ring db-ring--1"/><div className="db-ring db-ring--2"/>
            <span className="db-gem">◆</span>
          </div>
        </section>

        {/* STATS */}
        <section className="db-stats">
          {[
            { label:'Total Applied',  val:total,       icon:'◈' },
            { label:'Under Review',   val:underReview, icon:'◉', cls:'st--review' },
            { label:'Shortlisted',    val:shortlisted, icon:'◆', cls:'st--short'  },
            { label:'Hired',          val:hired,       icon:'✦', cls:'st--hired'  },
          ].map(({label,val,icon,cls=''}, i) => (
            <div className={`db-stat ${cls}`} key={label} style={{animationDelay:`${i*.1}s`}}>
              <span className="db-stat-icon">{icon}</span>
              <span className="db-stat-num"><Counter target={val}/></span>
              <span className="db-stat-lbl">{label}</span>
            </div>
          ))}
        </section>

        {/* ── BROWSE TAB ── */}
        {tab === 'browse' && (
          <section className="db-sec">
            <div className="db-sec-hd">
              <div><span className="db-tag">Opportunities</span><h2 className="db-h2">Active Openings</h2></div>
              <span className="db-cnt">{filtered.length} position{filtered.length!==1?'s':''}</span>
            </div>

            <div className="db-search-row">
              <div className="db-search">
                <span className="db-search-icon">⊙</span>
                <input className="db-search-in" placeholder="Search by title or company…" value={search} onChange={e=>setSearch(e.target.value)}/>
                {search && <button className="db-search-clr" onClick={()=>setSearch('')}>✕</button>}
              </div>
              <div className="db-chips">
                {['all','Remote','New York','San Francisco','Seattle','Boston'].map(f => (
                  <button key={f} className={`db-chip ${locFilter===f?'db-chip--on':''}`} onClick={()=>setLocF(f)}>
                    {f==='all'?'All Locations':f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="sk-grid">{Array(6).fill(0).map((_,i)=>(
                <div className="sk-card" key={i}>
                  <div className="sk sk--lg"/><div className="sk sk--md"/><div className="sk sk--sm"/>
                </div>
              ))}</div>
            ) : filtered.length === 0 ? (
              <div className="db-empty"><span className="db-empty-icon">◈</span><h3>No positions found</h3><p>Try adjusting search or filter</p></div>
            ) : (
              <div className="jc-grid">
                {filtered.map((j,i) => <JobCard key={j.job_id} job={j} idx={i} applied={applied.has(j.job_id)} onApply={doApply}/>)}
              </div>
            )}
          </section>
        )}

        {/* ── APPLICATIONS TAB ── */}
        {tab === 'apps' && (
          <section className="db-sec">
            <div className="db-sec-hd">
              <div><span className="db-tag">Your Journey</span><h2 className="db-h2">My Applications</h2></div>
              <span className="db-cnt">{apps.length} submitted</span>
            </div>

            <div className="db-legend">
              {Object.keys(STATUS_MAP).map(s => <StatusBadge key={s} status={s}/>)}
            </div>

            {apps.length === 0 ? (
              <div className="db-empty">
                <span className="db-empty-icon">◇</span>
                <h3>No applications yet</h3>
                <p>Browse open positions and start your journey</p>
                <button className="db-browse-btn" onClick={()=>setTab('browse')}>Browse Jobs →</button>
              </div>
            ) : (
              <div className="db-apps">
                <div className="db-apps-hd"><span>Position</span><span>Applied On</span><span>Status</span></div>
                {apps.map((a, i) => (
                  <div className="db-app-row" key={a.application_id} style={{animationDelay:`${i*.06}s`}}>
                    <div className="db-app-info">
                      <div className="db-app-ico">{['🎯','🚀','💡','⚙️'][i%4]}</div>
                      <div>
                        <div className="db-app-title">{a.title}</div>
                        <div className="db-app-co">{a.company_name}</div>
                      </div>
                    </div>
                    <div className="db-app-date">{new Date(a.application_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                    <StatusBadge status={a.status}/>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* TOAST */}
      <div className={`db-toast db-toast--${toast.type} ${toast.show?'db-toast--on':''}`}>
        <span>{toast.type==='success'?'✦':'◈'}</span>{toast.msg}
      </div>
    </div>
  );
}