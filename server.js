// ─────────────────────────────────────────────────────────────────────────────
//  CNC Operating System — Server
//  Stack: Node.js + Express + JSON file storage + session auth
//  Run:  node server.js
//  Open: http://localhost:3000
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const express = require('express');
const session = require('express-session');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'data', 'db.json');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'cnc-secret-2026-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8-hour session
}));

// ── JSON DB helpers ───────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB)) return seedDB();
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return seedDB(); }
}
function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function hashPw(pw) { return crypto.createHash('sha256').update(pw).digest('hex'); }

// ── Seed data ─────────────────────────────────────────────────────────────────
function seedDB() {
  const data = {
    users: [
      { id:'u1', name:'Dr. A. Clarke',        email:'director@cnc.com',   pw: hashPw('Director2026!'),   role:'director',    active:true },
      { id:'u2', name:'Michelle Thompson',     email:'supa@cnc.com',       pw: hashPw('SupervisorA1!'),   role:'supervisor',  active:true },
      { id:'u3', name:'Sandra Brown',          email:'supb@cnc.com',       pw: hashPw('SupervisorB1!'),   role:'supervisor',  active:true },
      { id:'u4', name:'Patrice Brown',         email:'pnbrown@cnc.com',    pw: hashPw('PN_Brown2026!'),   role:'nurse',       active:true },
      { id:'u5', name:'Kevin Davis',           email:'pndavis@cnc.com',    pw: hashPw('PN_Davis2026!'),   role:'nurse',       active:true },
      { id:'u6', name:'Janet Richards',        email:'pnrichards@cnc.com', pw: hashPw('PN_Rich2026!'),    role:'nurse',       active:true },
    ],
    patients: [
      { id:'p1', name:'Marcia Brown',   dob:'1942-03-15', dx:'Pressure Injury Stage 3 / Hypertension', risk:'High',     pn:'Patrice Brown',  svc:'Wound care',          physician:'Dr. Morrison', allergies:'Penicillin', site:'S1', status:'Active' },
      { id:'p2', name:'Devon Campbell', dob:'1951-07-22', dx:'Venous Leg Ulcer CEAP C6 / CVI',         risk:'High',     pn:'Kevin Davis',    svc:'Wound care',          physician:'Dr. Chen',     allergies:'NKDA',      site:'S2', status:'Active' },
      { id:'p3', name:'Norma Reid',     dob:'1955-11-08', dx:'Diabetic Foot Ulcer Wagner 2 / T2DM',    risk:'High',     pn:'Janet Richards', svc:'Wound care',          physician:'Dr. Patel',    allergies:'Sulfa',     site:'S3', status:'Active' },
      { id:'p4', name:'Hugh Miller',    dob:'1938-04-01', dx:'COPD / O₂ dependent',                   risk:'Moderate', pn:'Patrice Brown',  svc:'Home care (PN)',       physician:'Dr. Thompson', allergies:'NKDA',      site:'S4', status:'Active' },
      { id:'p5', name:'Audrey Francis', dob:'1948-09-17', dx:'Dementia / Type 2 DM',                  risk:'Moderate', pn:'Kevin Davis',    svc:'Home care (PN)',       physician:'Dr. Lee',      allergies:'Aspirin',   site:'S5', status:'Active' },
      { id:'p6', name:'Earl Hamilton',  dob:'1965-02-28', dx:'Post-op hip replacement',               risk:'Low',      pn:'RN James',       svc:'RN Hourly — sitter',  physician:'Dr. Reid',     allergies:'NKDA',      site:'Hospital', status:'Active' },
    ],
    vitals: [
      { id:'v1', patientId:'p1', dt:'2026-06-10 07:30', bp:'148/92', hr:'78', temp:'37.1', spo2:'97', pain:'4', nurse:'Patrice Brown', notes:'' },
      { id:'v2', patientId:'p2', dt:'2026-06-10 08:00', bp:'132/84', hr:'72', temp:'36.9', spo2:'98', pain:'2', nurse:'Kevin Davis',   notes:'' },
      { id:'v3', patientId:'p4', dt:'2026-06-10 09:00', bp:'138/88', hr:'85', temp:'36.8', spo2:'94', pain:'1', nurse:'Patrice Brown', notes:'O2 at 2L via NC' },
    ],
    notes: [
      { id:'n1', patientId:'p1', type:'Wound care note',   text:'Stage 3 PI sacrum — 60% granulation, 40% slough. Increased exudate. Photos sent to director.', nurse:'Patrice Brown',  dt:'2026-06-10 07:45' },
      { id:'n2', patientId:'p2', type:'Nursing assessment', text:'Compression therapy compliant. Wound reducing in size. No infection signs. Family satisfied.',  nurse:'Kevin Davis',    dt:'2026-06-10 08:15' },
      { id:'n3', patientId:'p4', type:'Nursing assessment', text:'SpO2 stable on 2L O2. Breathless on exertion. Compliant with inhalers.',                       nurse:'Patrice Brown',  dt:'2026-06-10 09:15' },
    ],
    medications: [
      { id:'m1', patientId:'p1', name:'Amlodipine',        dose:'5mg',       route:'PO',      freq:'Daily',  prescriber:'Dr. Morrison', status:'Active' },
      { id:'m2', patientId:'p2', name:'Furosemide',        dose:'40mg',      route:'PO',      freq:'OD',     prescriber:'Dr. Chen',     status:'Active' },
      { id:'m3', patientId:'p3', name:'Metformin',         dose:'1g',        route:'PO',      freq:'BD',     prescriber:'Dr. Patel',    status:'Active' },
      { id:'m4', patientId:'p3', name:'Insulin Glargine',  dose:'20 units',  route:'SC',      freq:'Nocte',  prescriber:'Dr. Patel',    status:'Active' },
      { id:'m5', patientId:'p4', name:'Salbutamol inhaler',dose:'100mcg',    route:'Inhaled', freq:'PRN',    prescriber:'Dr. Thompson', status:'Active' },
      { id:'m6', patientId:'p5', name:'Donepezil',         dose:'10mg',      route:'PO',      freq:'Nocte',  prescriber:'Dr. Lee',      status:'Active' },
    ],
    careplans: [
      { id:'cp1', patientId:'p1', goals:'30% wound area reduction in 4 weeks.', interventions:'Twice-daily dressing changes, repositioning Q2h, protein supplementation, Braden monitoring.', updatedBy:'Dr. A. Clarke', dt:'2026-06-05' },
      { id:'cp2', patientId:'p2', goals:'Wound closure within 12 weeks.', interventions:'4-layer compression, twice-weekly dressing, daily leg elevation, MLD weekly.', updatedBy:'Dr. A. Clarke', dt:'2026-06-05' },
    ],
    rounds: [
      { id:'r1', patientId:'p1', patientName:'Marcia Brown',   date:'2026-06-07', supervisor:'Michelle Thompson', risk:'High',     score:72,  woundReview:'Yes', escalation:'Yes — director',  nextDue:'2026-06-14', notes:'Wound deteriorating. Director notified.' },
      { id:'r2', patientId:'p2', patientName:'Devon Campbell', date:'2026-06-06', supervisor:'Sandra Brown',     risk:'High',     score:88,  woundReview:'Yes', escalation:'No',               nextDue:'2026-06-13', notes:'Good progress. PN performing well.' },
      { id:'r3', patientId:'p3', patientName:'Norma Reid',     date:'2026-06-05', supervisor:'Michelle Thompson', risk:'High',     score:81,  woundReview:'Yes', escalation:'No',               nextDue:'2026-06-12', notes:'Static wound. DFU offloading in place.' },
      { id:'r4', patientId:'p4', patientName:'Hugh Miller',    date:'2026-05-26', supervisor:'Sandra Brown',     risk:'Moderate', score:85,  woundReview:'N/A', escalation:'No',               nextDue:'2026-06-09', notes:'O2 compliance good. SpO2 stable.' },
    ],
    reports24hr: [
      { id:'d1', date:'2026-06-09', shift:'Day',   supervisor:'Michelle Thompson', patientsCovered:6, incidents:0, absences:0, filedAt:'19:45', notes:'All 5 PNs arrived on time. Hospital RN confirmed on station.',  status:'Filed' },
      { id:'d2', date:'2026-06-08', shift:'Night', supervisor:'Sandra Brown',     patientsCovered:6, incidents:1, absences:0, filedAt:'07:15', notes:'Incident INC-001 — wound complication Marcia Brown. Director notified.', status:'Filed' },
    ],
    incidents: [
      { id:'i1', ref:'INC-001', date:'2026-06-08', patientName:'Marcia Brown', type:'Wound complication', severity:'Moderate',   reportedBy:'Patrice Brown',  supervisorReviewed:'Yes', directorReviewed:'Yes',  status:'Under review', description:'Wound bed increased in size. Stage 3 PI — increased exudate and new slough formation noted.' },
      { id:'i2', ref:'INC-002', date:'2026-06-03', patientName:'Hugh Miller',  type:'Near miss — equipment', severity:'Near miss', reportedBy:'Patrice Brown',  supervisorReviewed:'Yes', directorReviewed:'Yes',  status:'Closed',       description:'O2 tubing kinked. Corrected immediately. No adverse patient outcome.' },
    ],
    inventory: [
      { id:'inv1', name:'Gauze pads 4×4',       category:'Wound care',      qty:12,  threshold:20, unit:'pcs',   lastRestocked:'2026-06-07', site:'Central store' },
      { id:'inv2', name:'Non-stick dressings',   category:'Wound care',      qty:45,  threshold:20, unit:'pcs',   lastRestocked:'2026-06-05', site:'Central store' },
      { id:'inv3', name:'Compression bandages',  category:'Wound care',      qty:8,   threshold:15, unit:'rolls', lastRestocked:'2026-06-03', site:'Central store' },
      { id:'inv4', name:'Latex gloves (M)',       category:'PPE',             qty:180, threshold:50, unit:'pairs', lastRestocked:'2026-06-08', site:'Central store' },
      { id:'inv5', name:'Face masks (surgical)',  category:'PPE',             qty:95,  threshold:50, unit:'pcs',   lastRestocked:'2026-06-08', site:'Central store' },
      { id:'inv6', name:'Alcohol wipes',          category:'General supplies', qty:300, threshold:100,unit:'pcs',  lastRestocked:'2026-06-09', site:'Central store' },
      { id:'inv7', name:'IV giving sets',         category:'IV supplies',     qty:22,  threshold:10, unit:'pcs',   lastRestocked:'2026-06-06', site:'Central store' },
      { id:'inv8', name:'Normal saline 100mL',    category:'IV supplies',     qty:15,  threshold:10, unit:'btl',   lastRestocked:'2026-06-07', site:'Central store' },
      { id:'inv9', name:'Nasal cannula sets',     category:'O2 supplies',     qty:6,   threshold:5,  unit:'pcs',   lastRestocked:'2026-06-03', site:'Central store' },
      { id:'inv10',name:'Digital thermometers',   category:'Equipment',       qty:4,   threshold:3,  unit:'pcs',   lastRestocked:'2026-05-27', site:'Central store' },
    ],
    equipment: [
      { id:'eq1', client:'Hugh Miller',    unit:'O₂ Concentrator 5L',  serial:'OC-001', flowRate:'2', startDate:'2026-05-20', endDate:'2026-06-20', depositPaid:5000,  status:'Active',  notes:'2L/min per Dr. Thompson' },
      { id:'eq2', client:'Norma Reid',     unit:'O₂ Concentrator 5L',  serial:'OC-002', flowRate:'1', startDate:'2026-06-01', endDate:'2026-06-30', depositPaid:5000,  status:'Active',  notes:'Supplemental O2 post-wound care' },
      { id:'eq3', client:'Everton Blake',  unit:'O₂ Concentrator 10L', serial:'OC-003', flowRate:'4', startDate:'2026-05-28', endDate:'2026-06-14', depositPaid:5000,  status:'Overdue', notes:'Client not responding. Supervisor to follow up.' },
    ],
    staff: [
      { id:'s1', name:'Dr. A. Clarke',       role:'Clinical Director',   reg:'RN-00421',  sites:'All',      shift:'16:00–20:00',  onCall:'—',        status:'Active' },
      { id:'s2', name:'Michelle Thompson',   role:'Clinical Supervisor', reg:'RN-01872',  sites:'S1,S2,S3', shift:'Day',          onCall:'This week',status:'On duty' },
      { id:'s3', name:'Sandra Brown',        role:'Clinical Supervisor', reg:'RN-02341',  sites:'S4,S5,Hosp',shift:'Night',       onCall:'Next week',status:'On duty' },
      { id:'s4', name:'Patrice Brown',       role:'Practical Nurse',     reg:'PN-4421',   sites:'S1,S4',    shift:'Day',          onCall:'—',        status:'On site' },
      { id:'s5', name:'Kevin Davis',         role:'Practical Nurse',     reg:'PN-3389',   sites:'S2,S5',    shift:'Day',          onCall:'—',        status:'On site' },
      { id:'s6', name:'Janet Richards',      role:'Practical Nurse',     reg:'PN-5512',   sites:'S3',       shift:'Day',          onCall:'—',        status:'On site' },
      { id:'s7', name:'Errol James',         role:'RN Sitter',           reg:'RN-04118',  sites:'Hospital', shift:'Night',        onCall:'—',        status:'On station' },
    ],
  };
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  writeDB(data);
  return data;
}

// ── Auth middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  if (req.xhr || req.path.startsWith('/api')) return res.status(401).json({ error: 'Unauthorised' });
  res.redirect('/login.html');
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorised' });
    if (!roles.includes(req.session.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email && u.pw === hashPw(password) && u.active);
  if (!user) return res.json({ ok: false, error: 'Invalid email or password' });
  req.session.user = { id: user.id, name: user.name, role: user.role, email: user.email };
  res.json({ ok: true, user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => res.json(req.session.user));

// ── Patients ──────────────────────────────────────────────────────────────────
app.get('/api/patients', requireAuth, (req, res) => {
  const db = readDB();
  // Nurses only see their own patients
  if (req.session.user.role === 'nurse') {
    return res.json(db.patients.filter(p => p.pn === req.session.user.name));
  }
  res.json(db.patients);
});

app.post('/api/patients', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const patient = { id: newId(), ...req.body, status: 'Active' };
  db.patients.push(patient);
  writeDB(db);
  res.json(patient);
});

app.put('/api/patients/:id', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const idx = db.patients.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.patients[idx] = { ...db.patients[idx], ...req.body };
  writeDB(db);
  res.json(db.patients[idx]);
});

// ── Vitals ────────────────────────────────────────────────────────────────────
app.get('/api/vitals/:patientId', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.vitals.filter(v => v.patientId === req.params.patientId).sort((a,b) => b.dt.localeCompare(a.dt)));
});

app.post('/api/vitals', requireAuth, (req, res) => {
  const db = readDB();
  const vital = { id: newId(), ...req.body, nurse: req.session.user.name, dt: new Date().toISOString().slice(0,16).replace('T',' ') };
  db.vitals.push(vital);
  writeDB(db);
  res.json(vital);
});

// ── Notes ─────────────────────────────────────────────────────────────────────
app.get('/api/notes/:patientId', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.notes.filter(n => n.patientId === req.params.patientId).sort((a,b) => b.dt.localeCompare(a.dt)));
});

app.post('/api/notes', requireAuth, (req, res) => {
  const db = readDB();
  const note = { id: newId(), ...req.body, nurse: req.session.user.name, dt: new Date().toISOString().slice(0,16).replace('T',' ') };
  db.notes.push(note);
  writeDB(db);
  res.json(note);
});

// ── Medications ───────────────────────────────────────────────────────────────
app.get('/api/medications/:patientId', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.medications.filter(m => m.patientId === req.params.patientId));
});

app.post('/api/medications', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const med = { id: newId(), ...req.body };
  db.medications.push(med);
  writeDB(db);
  res.json(med);
});

// ── Care plans ────────────────────────────────────────────────────────────────
app.get('/api/careplan/:patientId', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.careplans.find(c => c.patientId === req.params.patientId) || {});
});

app.post('/api/careplan', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const idx = db.careplans.findIndex(c => c.patientId === req.body.patientId);
  const cp = { id: newId(), ...req.body, updatedBy: req.session.user.name, dt: new Date().toISOString().slice(0,10) };
  if (idx >= 0) db.careplans[idx] = cp; else db.careplans.push(cp);
  writeDB(db);
  res.json(cp);
});

// ── 24-hour reports ───────────────────────────────────────────────────────────
app.get('/api/reports24hr', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.reports24hr.sort((a,b) => b.date.localeCompare(a.date)));
});

app.post('/api/reports24hr', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const report = { id: newId(), ...req.body, filedAt: new Date().toLocaleTimeString('en-JM',{hour:'2-digit',minute:'2-digit'}), filedBy: req.session.user.name, status: 'Filed' };
  db.reports24hr.unshift(report);
  writeDB(db);
  res.json(report);
});

// ── Supervisory rounds ────────────────────────────────────────────────────────
app.get('/api/rounds', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.rounds.sort((a,b) => b.date.localeCompare(a.date)));
});

app.post('/api/rounds', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const round = { id: newId(), ...req.body, supervisor: req.session.user.name };
  db.rounds.unshift(round);
  writeDB(db);
  res.json(round);
});

// ── Incidents ─────────────────────────────────────────────────────────────────
app.get('/api/incidents', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.incidents.sort((a,b) => b.date.localeCompare(a.date)));
});

app.post('/api/incidents', requireAuth, (req, res) => {
  const db = readDB();
  const ref = 'INC-' + String(db.incidents.length + 1).padStart(3,'0');
  const inc = { id: newId(), ref, ...req.body, reportedBy: req.session.user.name, supervisorReviewed: 'Pending', directorReviewed: 'Pending', status: 'Open' };
  db.incidents.unshift(inc);
  writeDB(db);
  res.json(inc);
});

app.put('/api/incidents/:id', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const idx = db.incidents.findIndex(i => i.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.incidents[idx] = { ...db.incidents[idx], ...req.body };
  writeDB(db);
  res.json(db.incidents[idx]);
});

// ── Inventory ─────────────────────────────────────────────────────────────────
app.get('/api/inventory', requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.inventory);
});

app.post('/api/inventory', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const item = { id: newId(), ...req.body, lastRestocked: new Date().toISOString().slice(0,10) };
  db.inventory.push(item);
  writeDB(db);
  res.json(item);
});

app.put('/api/inventory/:id/restock', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const idx = db.inventory.findIndex(i => i.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.inventory[idx].qty += parseInt(req.body.qty) || 0;
  db.inventory[idx].lastRestocked = new Date().toISOString().slice(0,10);
  writeDB(db);
  res.json(db.inventory[idx]);
});

// ── Equipment rental ──────────────────────────────────────────────────────────
const DAILY_RATE = 2500; // JMD

app.get('/api/equipment', requireAuth, (req, res) => {
  const db = readDB();
  const enriched = db.equipment.map(e => {
    const days = Math.max(1, Math.round((Date.now() - new Date(e.startDate)) / 86400000));
    return { ...e, daysRented: days, totalDue: days * DAILY_RATE };
  });
  res.json(enriched);
});

app.post('/api/equipment', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const eq = { id: newId(), ...req.body, status: 'Active' };
  db.equipment.push(eq);
  writeDB(db);
  res.json(eq);
});

app.put('/api/equipment/:id', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  const idx = db.equipment.findIndex(e => e.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.equipment[idx] = { ...db.equipment[idx], ...req.body };
  writeDB(db);
  res.json(db.equipment[idx]);
});

// ── Staff ─────────────────────────────────────────────────────────────────────
app.get('/api/staff', requireAuth, requireRole('director','supervisor'), (req, res) => {
  const db = readDB();
  res.json(db.staff);
});

app.post('/api/staff', requireAuth, requireRole('director'), (req, res) => {
  const db = readDB();
  const member = { id: newId(), ...req.body };
  db.staff.push(member);
  writeDB(db);
  res.json(member);
});

// ── Users (director only) ─────────────────────────────────────────────────────
app.get('/api/users', requireAuth, requireRole('director'), (req, res) => {
  const db = readDB();
  res.json(db.users.map(u => ({ id:u.id, name:u.name, email:u.email, role:u.role, active:u.active })));
});

app.post('/api/users', requireAuth, requireRole('director'), (req, res) => {
  const db = readDB();
  if (db.users.find(u => u.email === req.body.email)) return res.status(400).json({ error: 'Email already exists' });
  const user = { id: newId(), ...req.body, pw: hashPw(req.body.password), active: true };
  delete user.password;
  db.users.push(user);
  writeDB(db);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.put('/api/users/:id/password', requireAuth, (req, res) => {
  if (req.session.user.id !== req.params.id && req.session.user.role !== 'director')
    return res.status(403).json({ error: 'Forbidden' });
  const db = readDB();
  const idx = db.users.findIndex(u => u.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  db.users[idx].pw = hashPw(req.body.password);
  writeDB(db);
  res.json({ ok: true });
});

// ── Dashboard summary ─────────────────────────────────────────────────────────
app.get('/api/dashboard', requireAuth, (req, res) => {
  const db = readDB();
  const today = new Date().toISOString().slice(0,10);
  const active = db.patients.filter(p => p.status === 'Active').length;
  const lowStock = db.inventory.filter(i => i.qty <= i.threshold).length;
  const openIncidents = db.incidents.filter(i => i.status !== 'Closed').length;
  const activeEquipment = db.equipment.filter(e => e.status === 'Active').length;
  const overdueRounds = db.rounds.filter(r => r.nextDue < today).length;
  const recentNotes = db.notes.sort((a,b) => b.dt.localeCompare(a.dt)).slice(0,5);
  res.json({ active, lowStock, openIncidents, activeEquipment, overdueRounds, recentNotes });
});

// ── Serve app shell ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`\n✅ CNC Operating System running at http://localhost:${PORT}\n   Default login: director@cnc.com / Director2026!\n`));
