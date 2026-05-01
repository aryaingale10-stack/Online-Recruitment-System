import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API = 'http://localhost:3000';

/* ── Dummy Data ── */
const DUMMY_POSTINGS = [
  { job_id:1,  title:'Frontend Developer',       location:'San Francisco, CA', salary:90000,  status:'Active',  deadline:'2025-06-30', applicants:14 },
  { job_id:2,  title:'Data Analyst',              location:'Remote',            salary:75000,  status:'Active',  deadline:'2025-07-15', applicants:9  },
  { job_id:3,  title:'Backend Engineer',          location:'Seattle, WA',       salary:110000, status:'Active',  deadline:'2025-07-01', applicants:21 },
  { job_id:4,  title:'UX Designer',               location:'New York, NY',      salary:85000,  status:'Closed',  deadline:'2025-05-10', applicants:17 },
  { job_id:5,  title:'Product Manager',           location:'Austin, TX',        salary:120000, status:'Draft',   deadline:'2025-08-01', applicants:0  },
];

const DUMMY_APPLICANTS = {
  1: [
    { application_id:1,  name:'Alice Chen',     role:'Frontend Developer', date:'2025-05-10', status:'Shortlisted', avatar:'AC' },
    { application_id:2,  name:'Bob Martinez',   role:'Frontend Developer', date:'2025-05-11', status:'Under Review', avatar:'BM' },
    { application_id:3,  name:'Priya Sharma',   role:'Frontend Developer', date:'2025-05-12', status:'Submitted',   avatar:'PS' },
    { application_id:4,  name:'James Lee',      role:'Frontend Developer', date:'2025-05-13', status:'Rejected',    avatar:'JL' },
  ],
  2: [
    { application_id:5,  name:'Sara Okafor',    role:'Data Analyst',       date:'2025-05-15', status:'Under Review', avatar:'SO' },
    { application_id:6,  name:'Kevin Zhao',     role:'Data Analyst',       date:'2025-05-16', status:'Submitted',   avatar:'KZ' },
  ],
  3: [
    { application_id:7,  name:'Liam Patel',     role:'Backend Engineer',   date:'2025-05-08', status:'Shortlisted', avatar:'LP' },
    { application_id:8,  name:'Emma Wilson',    role:'Backend Engineer',   date:'2025-05-09', status:'Hired',       avatar:'EW' },
    { application_id:9,  name:'Noah Kim',       role:'Backend Engineer',   date:'2025-05-10', status:'Rejected',    avatar:'NK' },
  ],
};

const STATUS_MAP = {
  'Submitted':    { icon:'◈', cls:'badge--submitted'   },
  'Under Review': { icon:'◉', cls:'badge--review'      },
  'Shortlisted':  { icon:'◆', cls:'badge--shortlisted' },
  'Hired':        { icon:'✦', cls:'badge--hired'        },
  'Rejected':     { icon:'◇', cls:'badge--rejected'    },
};

const StatusBadge = ({ status }) => {
  const { icon, cls } = STATUS_MAP[status] || STATUS_MAP['Submitted'];
  return <span className={`status-badge ${cls}`}><span>{icon}</span>{status}</span>;
};

const JOB_STATUS = {
  'Active': { cls:'jstat--active', icon:'●' },
  'Closed': { cls:'jstat--closed', icon:'○' },
  'Draft':  { cls:'jstat--draft',  icon:'◌' },
};

export default function EmployerDashboard() {
  const navigate   = useNavigate();
  const user       = JSON.parse(localStorage.getItem('user') || '{}');

  const [tab,        setTab]      = useState('overview');
  const [postings,   setPostings] = useState(DUMMY_POSTINGS);
  const [applicants, setApplicants] = useState({});
  const [selJob,     setSelJob]   = useState(null);
  const [scrolled,   setScrolled] = useState(false);
  const [visible,    setVisible]  = useState(false);
  const [toast,      setToast]    = useState({ show:false, msg:'', type:'success' });

  /* new job form */
  const [showForm, setShowForm]   = useState(false);
  const [formTitle,  setFTitle]   = useState('');
  const [formLoc,    setFLoc]     = useState('');
  const [formSal,    setFSal]     = useState('');
  const [formDeadline, setFDl]    = useState('');

  useEffect(() => {
    setVisible(true);
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setApplicants(DUMMY_APPLICANTS);
    /* if backend is live, you can fetch real data here */
  }, []);

  function openJob(job) {
    setSelJob(job);
    setTab('applicants');
  }

  function updateStatus(appId, newStatus) {
    if (!selJob) return;
    setApplicants(prev => ({
      ...prev,
      [selJob.job_id]: (prev[selJob.job_id]||[]).map(a =>
        a.application_id === appId ? { ...a, status: newStatus } : a
      ),
    }));
    showToast(`Status updated to "${newStatus}"`, 'success');
  }

  function addJob() {
    if (!formTitle || !formLoc) { showToast('Title and location are required','error'); return; }
    const newJob = {
      job_id: Date.now(),
      title: formTitle, location: formLoc,
      salary: formSal ? Number(formSal) : null,
      deadline: formDeadline || null,
      status: 'Active', applicants: 0,
    };
    setPostings(p => [newJob, ...p]);
    setFTitle(''); setFLoc(''); setFSal(''); setFDl('');
    setShowForm(false);
    showToast('Job posting published! ✦','success');
  }

  function toggleJobStatus(jobId) {
    setPostings(p => p.map(j =>
      j.job_id === jobId ? { ...j, status: j.status === 'Active' ? 'Closed' : 'Active' } : j
    ));
  }

  function showToast(msg, type='success') {
    setToast({ show:true, msg, type });
    setTimeout(() => setToast(t => ({...t,show:false})), 3400);
  }

  const totalApps    = Object.values(applicants).flat().length;
  const shortlisted  = Object.values(applicants).flat().filter(a=>a.status==='Shortlisted').length;
  const hired        = Object.values(applicants).flat().filter(a=>a.status==='Hired').length;
  const activeJobs   = postings.filter(p=>p.status==='Active').length;

  const selApplicants = selJob ? (applicants[selJob.job_id] || []) : [];

  return (
    <div className="db">

      {/* NAV */}
      <header className={`db-nav ${scrolled?'db-nav--scrolled':''}`}>
        <div className="db-logo" onClick={() => navigate('/')}>
          <span className="db-logo-mark">⚜</span>
          <span className="db-logo-text">ORS</span>
        </div>
        <nav className="db-tabs">
          <button className={`db-tab ${tab==='overview'?'db-tab--on':''}`}    onClick={()=>{setTab('overview');setSelJob(null);}}>◈ Overview</button>
          <button className={`db-tab ${tab==='postings'?'db-tab--on':''}`}    onClick={()=>{setTab('postings');setSelJob(null);}}>📋 Job Postings</button>
          <button className={`db-tab ${tab==='applicants'?'db-tab--on':''}`}  onClick={()=>setTab('applicants')}>
            👥 Applicants {totalApps>0 && <span className="db-badge">{totalApps}</span>}
          </button>
        </nav>
        <div className="db-nav-r">
          <div className="db-pill">
            <span className="db-avatar">{(user.name||'E')[0].toUpperCase()}</span>
            <span className="db-uname">{user.name||'Employer'}</span>
          </div>
          <button className="db-logout" onClick={()=>{localStorage.removeItem('user');navigate('/');}}>↩ Exit</button>
        </div>
      </header>

      <main className={`db-main ${visible?'db-main--on':''}`}>

        {/* WELCOME */}
        <section className="db-welcome db-welcome--employer">
          <div className="db-welcome-text">
            <p className="db-eyebrow"><span className="eyebrow-line"/>Employer Portal<span className="eyebrow-line"/></p>
            <h1 className="db-welcome-h1">Welcome,<br /><span className="db-wname">{user.name?.split(' ')[0]||'Employer'}</span></h1>
            <p className="db-welcome-sub">Manage your postings and find the right talent.</p>
          </div>
          <div className="db-ornament">
            <div className="db-ring db-ring--1"/><div className="db-ring db-ring--2"/>
            <span className="db-gem">👑</span>
          </div>
        </section>

        {/* STATS */}
        <section className="db-stats">
          {[
            { label:'Active Jobs',   val:activeJobs, icon:'◈' },
            { label:'Total Applicants', val:totalApps, icon:'◉', cls:'st--review' },
            { label:'Shortlisted',   val:shortlisted, icon:'◆', cls:'st--short' },
            { label:'Hired',         val:hired,       icon:'✦', cls:'st--hired' },
          ].map(({label,val,icon,cls=''}, i) => (
            <div className={`db-stat ${cls}`} key={label} style={{animationDelay:`${i*.1}s`}}>
              <span className="db-stat-icon">{icon}</span>
              <span className="db-stat-num">{val}</span>
              <span className="db-stat-lbl">{label}</span>
            </div>
          ))}
        </section>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <section className="db-sec">
            <div className="db-sec-hd">
              <div><span className="db-tag">At a Glance</span><h2 className="db-h2">Dashboard Overview</h2></div>
              <button className="db-post-btn" onClick={()=>{setTab('postings');setShowForm(true);}}>+ Post a Job</button>
            </div>

            {/* Recent applicants */}
            <h3 className="db-sub-h">Recent Applications</h3>
            <div className="db-apps">
              <div className="db-apps-hd"><span>Candidate</span><span>Applied For</span><span>Date</span><span>Status</span></div>
              {Object.values(applicants).flat().slice(0,6).map((a,i) => (
                <div className="db-app-row" key={a.application_id} style={{animationDelay:`${i*.05}s`}}>
                  <div className="db-app-info">
                    <div className="db-emp-avatar">{a.avatar}</div>
                    <span className="db-app-title">{a.name}</span>
                  </div>
                  <div className="db-app-co">{a.role}</div>
                  <div className="db-app-date">{new Date(a.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                  <StatusBadge status={a.status}/>
                </div>
              ))}
            </div>

            {/* Active postings mini */}
            <h3 className="db-sub-h" style={{marginTop:'2.5rem'}}>Your Active Postings</h3>
            <div className="em-grid">
              {postings.filter(p=>p.status==='Active').map((p,i) => (
                <div className="em-card" key={p.job_id} style={{animationDelay:`${i*.07}s`}} onClick={()=>openJob(p)}>
                  <div className="em-card-top">
                    <span className="em-card-title">{p.title}</span>
                    <span className={`jstat ${JOB_STATUS[p.status].cls}`}>{JOB_STATUS[p.status].icon} {p.status}</span>
                  </div>
                  <p className="em-card-loc">📍 {p.location}</p>
                  <div className="em-card-foot">
                    <span className="em-card-apps">👥 {(applicants[p.job_id]||[]).length} applicants</span>
                    <span className="em-card-link">View →</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── JOB POSTINGS TAB ── */}
        {tab === 'postings' && (
          <section className="db-sec">
            <div className="db-sec-hd">
              <div><span className="db-tag">Manage</span><h2 className="db-h2">Job Postings</h2></div>
              <button className="db-post-btn" onClick={()=>setShowForm(!showForm)}>
                {showForm ? '✕ Cancel' : '+ Post a Job'}
              </button>
            </div>

            {/* Post Job Form */}
            {showForm && (
              <div className="em-form">
                <h3 className="em-form-title">✦ New Job Posting</h3>
                <div className="em-form-grid">
                  <div className="field">
                    <label className="field-label">Job Title *</label>
                    <input className="em-input" placeholder="e.g. Senior Frontend Developer" value={formTitle} onChange={e=>setFTitle(e.target.value)}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Location *</label>
                    <input className="em-input" placeholder="e.g. Remote, New York, NY" value={formLoc} onChange={e=>setFLoc(e.target.value)}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Annual Salary ($)</label>
                    <input className="em-input" type="number" placeholder="e.g. 95000" value={formSal} onChange={e=>setFSal(e.target.value)}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Application Deadline</label>
                    <input className="em-input" type="date" value={formDeadline} onChange={e=>setFDl(e.target.value)}/>
                  </div>
                </div>
                <button className="db-post-btn" onClick={addJob}>Publish Job Posting →</button>
              </div>
            )}

            {/* Postings table */}
            <div className="db-apps">
              <div className="db-apps-hd em-apps-hd"><span>Job Title</span><span>Location</span><span>Salary</span><span>Applicants</span><span>Status</span><span>Actions</span></div>
              {postings.map((p,i) => (
                <div className="db-app-row em-post-row" key={p.job_id} style={{animationDelay:`${i*.05}s`}}>
                  <div className="db-app-info">
                    <div className="db-app-ico">💼</div>
                    <div>
                      <div className="db-app-title">{p.title}</div>
                      <div className="db-app-co">Deadline: {p.deadline ? new Date(p.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'Open'}</div>
                    </div>
                  </div>
                  <div className="db-app-date">📍 {p.location}</div>
                  <div className="db-app-date">{p.salary ? `$${Number(p.salary).toLocaleString()}` : '—'}</div>
                  <div className="db-app-date">👥 {(applicants[p.job_id]||[]).length}</div>
                  <span className={`jstat ${JOB_STATUS[p.status]?.cls||''}`}>{JOB_STATUS[p.status]?.icon||'●'} {p.status}</span>
                  <div className="em-actions">
                    <button className="em-act-btn" onClick={()=>openJob(p)}>View</button>
                    <button className="em-act-btn em-act-btn--sec" onClick={()=>toggleJobStatus(p.job_id)}>
                      {p.status==='Active'?'Close':'Reopen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── APPLICANTS TAB ── */}
        {tab === 'applicants' && (
          <section className="db-sec">
            <div className="db-sec-hd">
              <div>
                <span className="db-tag">Candidates</span>
                <h2 className="db-h2">{selJob ? `Applicants — ${selJob.title}` : 'All Applicants'}</h2>
              </div>
              {selJob && <button className="db-post-btn em-act-btn--sec" style={{background:'none',color:'var(--brown)',border:'1.5px solid var(--cream-mid)'}} onClick={()=>setSelJob(null)}>← All Jobs</button>}
            </div>

            {/* Job selector if no job chosen */}
            {!selJob && (
              <div className="em-grid">
                {postings.map((p,i) => (
                  <div className="em-card" key={p.job_id} style={{animationDelay:`${i*.07}s`}} onClick={()=>setSelJob(p)}>
                    <div className="em-card-top">
                      <span className="em-card-title">{p.title}</span>
                      <span className={`jstat ${JOB_STATUS[p.status].cls}`}>{JOB_STATUS[p.status].icon} {p.status}</span>
                    </div>
                    <p className="em-card-loc">📍 {p.location}</p>
                    <div className="em-card-foot">
                      <span className="em-card-apps">👥 {(applicants[p.job_id]||[]).length} applicants</span>
                      <span className="em-card-link">Select →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Applicant list for selected job */}
            {selJob && (
              selApplicants.length === 0 ? (
                <div className="db-empty"><span className="db-empty-icon">◇</span><h3>No applicants yet</h3><p>Share your job posting to attract candidates</p></div>
              ) : (
                <div className="db-apps">
                  <div className="db-apps-hd em-cand-hd"><span>Candidate</span><span>Applied On</span><span>Status</span><span>Update Status</span></div>
                  {selApplicants.map((a,i) => (
                    <div className="db-app-row" key={a.application_id} style={{animationDelay:`${i*.06}s`}}>
                      <div className="db-app-info">
                        <div className="db-emp-avatar">{a.avatar}</div>
                        <div>
                          <div className="db-app-title">{a.name}</div>
                          <div className="db-app-co">{a.role}</div>
                        </div>
                      </div>
                      <div className="db-app-date">{new Date(a.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                      <StatusBadge status={a.status}/>
                      <div className="em-status-sel">
                        <select
                          className="em-select"
                          value={a.status}
                          onChange={e => updateStatus(a.application_id, e.target.value)}
                        >
                          {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )
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