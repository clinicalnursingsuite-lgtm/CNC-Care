/* ── CNC Operating System — Frontend ──────────────────────────────────────── */
'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
const S = { user: null, page: 'dashboard', patientId: null };

// ── Utilities ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html) e.innerHTML = html; return e; };

function toast(msg, type='ok') {
  const t = $('toast');
  t.textContent = msg;
  t.style.borderColor = type==='err' ? 'rgba(163,45,45,.5)' : 'rgba(83,74,183,.5)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-JM', { day:'numeric', month:'short', year:'numeric' }); }
  catch { return dateStr; }
}

function daysAgo(dateStr) {
  if (!dateStr) return '—';
  const d = Math.round((Date.now() - new Date(dateStr)) / 86400000);
  if (d === 0) return 'Today'; if (d === 1) return 'Yesterday'; return `${d} days ago`;
}

function riskBadge(r) {
  const m = { High:'b-red', Moderate:'b-amber', Low:'b-green' };
  return `<span class="badge ${m[r]||'b-gray'}">${r||'—'}</span>`;
}

function scoreColor(s) {
  if (s >= 90) return '#86cc54'; if (s >= 80) return '#5dcaa5';
  if (s >= 70) return '#fac775'; return '#f09595';
}

// ── API ────────────────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch('/api' + path, opts);
  if (r.status === 401) { window.location.href = '/login.html'; return null; }
  return r.json();
}
const GET  = path => api('GET', path);
const POST = (path, body) => api('POST', path, body);
const PUT  = (path, body) => api('PUT', path, body);

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(title, bodyHtml, footerHtml) {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = bodyHtml;
  $('modal-footer').innerHTML = footerHtml || '<button class="btn" onclick="closeModal()">Cancel</button>';
  $('global-modal').classList.add('open');
}
function closeModal() { $('global-modal').classList.remove('open'); }
$('global-modal').addEventListener('click', e => { if (e.target === $('global-modal')) closeModal(); });

// ── Navigation ────────────────────────────────────────────────────────────────
function nav(page) {
  S.page = page;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  loadPage(page);
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => nav(btn.dataset.page));
});

function toggleSidebar() {
  $('sidebar').classList.toggle('open');
}

// ── Tab helper ────────────────────────────────────────────────────────────────
function setupTabs(containerId) {
  const container = $(containerId);
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      container.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === target));
    });
  });
}

// ── Page loader ───────────────────────────────────────────────────────────────
async function loadPage(page) {
  const mc = $('page-content');
  mc.innerHTML = '<div class="loading-spinner"><i class="ti ti-loader-2 spin"></i> Loading…</div>';
  const pages = {
    dashboard: renderDashboard,
    patients: renderPatients,
    reports24hr: renderReports24hr,
    rounding: renderRounding,
    curves: renderCurves,
    wound: renderWound,
    inventory: renderInventory,
    equipment: renderEquipment,
    staff: renderStaff,
    incidents: renderIncidents,
    settings: renderSettings,
  };
  if (pages[page]) await pages[page](mc);
  else mc.innerHTML = '<div class="page-hdr"><div class="page-title">Page not found</div></div>';
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
async function renderDashboard(mc) {
  const [dash, patients] = await Promise.all([GET('/dashboard'), GET('/patients')]);
  if (!dash) return;

  const riskCount = { High: 0, Moderate: 0, Low: 0 };
  (patients||[]).forEach(p => riskCount[p.risk] = (riskCount[p.risk]||0)+1);

  mc.innerHTML = `
    <div class="page-hdr"><div class="page-title">Dashboard</div><div class="page-sub">Live operations overview — ${new Date().toLocaleDateString('en-JM',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div></div>
    <div class="metrics">
      <div class="metric"><div class="metric-val" style="color:var(--purple-m)">${dash.active}</div><div class="metric-lbl">Active patients</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--red)">${dash.overdueRounds}</div><div class="metric-lbl">Rounds overdue</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--amber)">${dash.lowStock}</div><div class="metric-lbl">Low-stock items</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--teal)">${dash.activeEquipment}</div><div class="metric-lbl">Equipment rented</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--red)">${riskCount.High||0}</div><div class="metric-lbl">High-risk patients</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--amber)">${riskCount.Moderate||0}</div><div class="metric-lbl">Moderate-risk</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--green)">${riskCount.Low||0}</div><div class="metric-lbl">Low-risk</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--rose)">${dash.openIncidents}</div><div class="metric-lbl">Open incidents</div></div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-title"><i class="ti ti-users" aria-hidden="true"></i>Patient census</div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Patient</th><th>Diagnosis</th><th>Risk</th><th>PN</th><th>Site</th></tr></thead>
          <tbody>${(patients||[]).map(p=>`<tr onclick="navToPatient('${p.id}')">
            <td><strong>${p.name}</strong></td><td class="text-muted fs-12">${p.dx}</td>
            <td>${riskBadge(p.risk)}</td><td>${p.pn}</td><td>${p.site}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-activity" aria-hidden="true"></i>Recent activity</div>
        <div class="timeline">
          ${(dash.recentNotes||[]).map(n=>`
            <div class="tl-item"><div class="tl-dot" style="background:var(--purple-m)"></div>
            <div class="tl-body"><div class="tl-time">${n.dt} — ${n.nurse}</div>
            <div class="tl-title">${n.type}</div><div class="tl-desc">${n.text.slice(0,100)}${n.text.length>100?'…':''}</div></div></div>`).join('')||'<div class="tbl-empty">No recent activity.</div>'}
        </div>
      </div>
    </div>`;

  $('active-count').textContent = dash.active;
}

function navToPatient(id) {
  S.patientId = id;
  nav('patients');
}

// ── PATIENTS / EHR ────────────────────────────────────────────────────────────
async function renderPatients(mc) {
  const patients = await GET('/patients');
  if (!patients) return;

  let html = `
    <div class="page-hdr">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div><div class="page-title">Patients — Electronic Health Records</div><div class="page-sub">All active patient records accessible from any site</div></div>
        ${S.user.role !== 'nurse' ? '<button class="btn btn-primary btn-sm" onclick="newPatientModal()"><i class="ti ti-plus" aria-hidden="true"></i>Register patient</button>' : ''}
      </div>
    </div>
    <div class="search-bar">
      <input class="search-input" id="pt-search" placeholder="Search patients by name, diagnosis, or site…" oninput="filterPtTable()" />
    </div>
    <div class="card card-flush">
      <div class="tbl-wrap"><table id="pt-table">
        <thead><tr><th>Patient</th><th>Date of birth</th><th>Diagnosis</th><th>Risk</th><th>PN assigned</th><th>Service</th><th>Site</th><th></th></tr></thead>
        <tbody id="pt-tbody">
          ${patients.map(p=>`<tr data-search="${(p.name+p.dx+p.site).toLowerCase()}">
            <td><strong>${p.name}</strong></td><td>${p.dob}</td><td class="fs-12 text-muted">${p.dx}</td>
            <td>${riskBadge(p.risk)}</td><td>${p.pn}</td>
            <td><span class="badge b-purple">${p.svc}</span></td><td>${p.site}</td>
            <td><button class="btn btn-sm" onclick="openEHR('${p.id}','${p.name}')"><i class="ti ti-eye" aria-hidden="true"></i>EHR</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>
    <div id="ehr-panel"></div>`;

  mc.innerHTML = html;
  if (S.patientId) { await openEHR(S.patientId); S.patientId = null; }
}

function filterPtTable() {
  const q = $('pt-search').value.toLowerCase();
  document.querySelectorAll('#pt-tbody tr').forEach(r => {
    r.style.display = r.dataset.search?.includes(q) ? '' : 'none';
  });
}

async function openEHR(patientId, name) {
  const [patient, vitals, notes, meds, careplan] = await Promise.all([
    GET('/patients').then(pts => pts?.find(p => p.id === patientId)),
    GET('/vitals/' + patientId),
    GET('/notes/' + patientId),
    GET('/medications/' + patientId),
    GET('/careplan/' + patientId),
  ]);
  if (!patient) return;

  const ehrPanel = $('ehr-panel');
  ehrPanel.innerHTML = `
    <div class="card" id="ehr-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-size:18px;font-weight:600">${patient.name}</div>
          <div class="text-muted fs-12">DOB: ${patient.dob} · ${riskBadge(patient.risk)} · ${patient.svc}</div>
        </div>
        <div class="btn-group">
          <button class="btn btn-sm" onclick="logVitalsModal('${patientId}')"><i class="ti ti-heartbeat" aria-hidden="true"></i>Log vitals</button>
          <button class="btn btn-sm" onclick="addNoteModal('${patientId}')"><i class="ti ti-pencil" aria-hidden="true"></i>Add note</button>
          ${S.user.role !== 'nurse' ? `<button class="btn btn-sm" onclick="editCarePlanModal('${patientId}','${escHtml(careplan?.goals||'')}','${escHtml(careplan?.interventions||'')}')"><i class="ti ti-clipboard-list" aria-hidden="true"></i>Care plan</button>` : ''}
          <button class="btn btn-sm" onclick="$('ehr-panel').innerHTML=''"><i class="ti ti-x" aria-hidden="true"></i>Close</button>
        </div>
      </div>

      <div class="tab-bar" id="ehr-tabs">
        <button class="tab-btn active" data-tab="ehr-summary">Summary</button>
        <button class="tab-btn" data-tab="ehr-vitals">Vitals</button>
        <button class="tab-btn" data-tab="ehr-meds">Medications</button>
        <button class="tab-btn" data-tab="ehr-notes">Nursing notes</button>
        <button class="tab-btn" data-tab="ehr-careplan">Care plan</button>
      </div>

      <div class="tab-pane active" id="ehr-summary">
        <div class="three-col">
          <div><div class="fs-11 text-muted">Primary diagnosis</div><div class="fw-500 mt-1">${patient.dx}</div></div>
          <div><div class="fs-11 text-muted">Treating physician</div><div class="fw-500 mt-1">${patient.physician}</div></div>
          <div><div class="fs-11 text-muted">Service type</div><div class="fw-500 mt-1">${patient.svc}</div></div>
          <div><div class="fs-11 text-muted">PN assigned</div><div class="fw-500 mt-1">${patient.pn}</div></div>
          <div><div class="fs-11 text-muted">Site</div><div class="fw-500 mt-1">${patient.site}</div></div>
          <div><div class="fs-11 text-muted">Allergies</div><div class="fw-500 mt-1 text-danger">${patient.allergies}</div></div>
        </div>
        ${vitals && vitals.length ? `<div class="alert alert-purple mt-2"><i class="ti ti-heartbeat" aria-hidden="true"></i>Last vitals: BP ${vitals[0].bp} · HR ${vitals[0].hr} · SpO₂ ${vitals[0].spo2}% · Pain ${vitals[0].pain}/10 — ${vitals[0].dt}</div>` : ''}
      </div>

      <div class="tab-pane" id="ehr-vitals">
        <div class="tbl-wrap"><table>
          <thead><tr><th>Date / time</th><th>BP (mmHg)</th><th>HR (bpm)</th><th>Temp °C</th><th>SpO₂ %</th><th>Pain /10</th><th>Nurse</th><th>Notes</th></tr></thead>
          <tbody>${(vitals||[]).map(v=>`<tr><td>${v.dt}</td><td>${v.bp}</td><td>${v.hr}</td><td>${v.temp}</td><td>${v.spo2}</td><td>${v.pain}</td><td>${v.nurse}</td><td class="text-muted fs-12">${v.notes||'—'}</td></tr>`).join('')||'<tr><td colspan="8" class="tbl-empty">No vitals recorded yet.</td></tr>'}</tbody>
        </table></div>
      </div>

      <div class="tab-pane" id="ehr-meds">
        <div class="tbl-wrap"><table>
          <thead><tr><th>Medication</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Prescriber</th><th>Status</th></tr></thead>
          <tbody>${(meds||[]).map(m=>`<tr><td><strong>${m.name}</strong></td><td>${m.dose}</td><td>${m.route}</td><td>${m.freq}</td><td>${m.prescriber}</td><td><span class="badge b-green">${m.status}</span></td></tr>`).join('')||'<tr><td colspan="6" class="tbl-empty">No medications on file.</td></tr>'}</tbody>
        </table></div>
      </div>

      <div class="tab-pane" id="ehr-notes">
        ${(notes||[]).map(n=>`
          <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
              <span class="badge b-purple">${n.type}</span>
              <span class="text-muted fs-11">${n.dt} — ${n.nurse}</span>
            </div>
            <div class="text-muted" style="font-size:13px;line-height:1.6">${n.text}</div>
          </div>`).join('')||'<div class="tbl-empty">No nursing notes yet.</div>'}
      </div>

      <div class="tab-pane" id="ehr-careplan">
        ${careplan && careplan.goals ? `
          <div class="mb-2"><div class="fs-11 text-muted mb-1">Goals</div><div style="font-size:13px;line-height:1.7">${careplan.goals}</div></div>
          <div class="mb-2"><div class="fs-11 text-muted mb-1">Nursing interventions</div><div style="font-size:13px;line-height:1.7">${careplan.interventions}</div></div>
          <div class="text-muted fs-11">Last updated: ${careplan.dt} by ${careplan.updatedBy}</div>
        ` : '<div class="tbl-empty">No care plan on file. <button class="btn btn-sm btn-primary" onclick="editCarePlanModal(\''+patientId+'\',\'\',\'\')">Create care plan</button></div>'}
      </div>
    </div>`;

  setupTabs('ehr-card');
  ehrPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escHtml(str) { return String(str).replace(/'/g,"&#39;").replace(/"/g,"&quot;"); }

// ── EHR Modals ────────────────────────────────────────────────────────────────
function logVitalsModal(patientId) {
  openModal('Log vital signs',
    `<div class="form-grid">
      <div class="form-group"><label class="form-label">BP (mmHg)</label><input class="form-control" id="v-bp" placeholder="120/80"/></div>
      <div class="form-group"><label class="form-label">HR (bpm)</label><input class="form-control" id="v-hr" placeholder="72"/></div>
      <div class="form-group"><label class="form-label">Temp (°C)</label><input class="form-control" id="v-temp" placeholder="36.8"/></div>
      <div class="form-group"><label class="form-label">SpO₂ (%)</label><input class="form-control" id="v-spo2" placeholder="98"/></div>
      <div class="form-group"><label class="form-label">Pain score (0–10)</label><input class="form-control" id="v-pain" placeholder="3" type="number" min="0" max="10"/></div>
      <div class="form-group"><label class="form-label">Nurse initials</label><input class="form-control" id="v-nurse" placeholder="JR"/></div>
    </div>
    <div class="form-group form-full"><label class="form-label">Notes (optional)</label><input class="form-control" id="v-notes" placeholder="Any observations…"/></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveVitals('${patientId}')">Save vitals</button>`
  );
}

async function saveVitals(patientId) {
  const data = { patientId, bp:$('v-bp').value, hr:$('v-hr').value, temp:$('v-temp').value, spo2:$('v-spo2').value, pain:$('v-pain').value, notes:$('v-notes').value };
  if (!data.bp && !data.hr) { toast('Enter at least BP and HR','err'); return; }
  const r = await POST('/vitals', data);
  if (r) { closeModal(); toast('Vitals saved'); await openEHR(patientId); }
}

function addNoteModal(patientId) {
  openModal('Add nursing note',
    `<div class="form-group"><label class="form-label">Note type</label>
      <select class="form-control" id="n-type">
        <option>Nursing assessment</option><option>Medication note</option><option>Wound care note</option>
        <option>Family communication</option><option>Escalation note</option><option>Other</option>
      </select></div>
    <div class="form-group"><label class="form-label">Note</label><textarea class="form-control" id="n-text" rows="5" placeholder="Enter nursing note (factual and objective)…"></textarea></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveNote('${patientId}')">Save note</button>`
  );
}

async function saveNote(patientId) {
  const text = $('n-text').value.trim();
  if (!text) { toast('Note cannot be empty','err'); return; }
  const r = await POST('/notes', { patientId, type:$('n-type').value, text });
  if (r) { closeModal(); toast('Note saved'); await openEHR(patientId); }
}

function editCarePlanModal(patientId, goals, interventions) {
  openModal('Edit care plan',
    `<div class="form-group"><label class="form-label">Goals (SMART)</label><textarea class="form-control" id="cp-goals" rows="3">${goals}</textarea></div>
     <div class="form-group"><label class="form-label">Nursing interventions</label><textarea class="form-control" id="cp-int" rows="4">${interventions}</textarea></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveCarePlan('${patientId}')">Save care plan</button>`
  );
}

async function saveCarePlan(patientId) {
  const r = await POST('/careplan', { patientId, goals:$('cp-goals').value, interventions:$('cp-int').value });
  if (r) { closeModal(); toast('Care plan updated'); await openEHR(patientId); }
}

function newPatientModal() {
  openModal('Register new patient',
    `<div class="form-grid">
      <div class="form-group"><label class="form-label">Full name</label><input class="form-control" id="np-name" placeholder="Patient full name"/></div>
      <div class="form-group"><label class="form-label">Date of birth</label><input class="form-control" type="date" id="np-dob"/></div>
      <div class="form-group form-full"><label class="form-label">Primary diagnosis</label><input class="form-control" id="np-dx" placeholder="e.g. Type 2 Diabetes, Hypertension"/></div>
      <div class="form-group"><label class="form-label">Risk tier</label><select class="form-control" id="np-risk"><option>High</option><option>Moderate</option><option>Low</option></select></div>
      <div class="form-group"><label class="form-label">Site</label><input class="form-control" id="np-site" placeholder="S1 / S2 / Hospital…"/></div>
      <div class="form-group"><label class="form-label">PN assigned</label><input class="form-control" id="np-pn" placeholder="Nurse full name"/></div>
      <div class="form-group"><label class="form-label">Service type</label><select class="form-control" id="np-svc">
        <option>Home care (PN)</option><option>Wound care</option><option>Curves in Care — BBL</option>
        <option>Curves in Care — 360 Lipo</option><option>Curves in Care — Breast Aug</option>
        <option>RN Hourly</option><option>PICC / IV Infusion</option><option>Post-operative care</option>
      </select></div>
      <div class="form-group"><label class="form-label">Treating physician</label><input class="form-control" id="np-physician" placeholder="Dr. Name"/></div>
      <div class="form-group"><label class="form-label">Allergies</label><input class="form-control" id="np-allergies" placeholder="NKDA or list allergies"/></div>
    </div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveNewPatient()">Register patient</button>`
  );
}

async function saveNewPatient() {
  const name = $('np-name').value.trim();
  if (!name) { toast('Patient name required','err'); return; }
  const r = await POST('/patients', { name, dob:$('np-dob').value, dx:$('np-dx').value, risk:$('np-risk').value, site:$('np-site').value, pn:$('np-pn').value, svc:$('np-svc').value, physician:$('np-physician').value, allergies:$('np-allergies').value });
  if (r) { closeModal(); toast('Patient registered'); await renderPatients($('page-content')); }
}

// ── 24-HOUR REPORTS ───────────────────────────────────────────────────────────
async function renderReports24hr(mc) {
  const reports = await GET('/reports24hr');
  mc.innerHTML = `
    <div class="page-hdr">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div><div class="page-title">24-Hour Daily Operations Reports</div><div class="page-sub">Filed by supervisors at end of every shift. Due by 20:30.</div></div>
        ${S.user.role !== 'nurse' ? '<button class="btn btn-primary btn-sm" onclick="new24hrModal()"><i class="ti ti-plus" aria-hidden="true"></i>File report</button>' : ''}
      </div>
    </div>
    <div class="card card-flush">
      <div class="tbl-wrap"><table>
        <thead><tr><th>Date</th><th>Shift</th><th>Supervisor</th><th>Patients covered</th><th>Incidents</th><th>PN absences</th><th>Filed at</th><th>Status</th></tr></thead>
        <tbody>${(reports||[]).map(r=>`<tr>
          <td>${r.date}</td><td>${r.shift}</td><td>${r.supervisor||r.filedBy||'—'}</td>
          <td>${r.patientsCovered}</td>
          <td><span class="badge ${r.incidents>0?'b-red':'b-green'}">${r.incidents}</span></td>
          <td><span class="badge ${r.absences>0?'b-amber':'b-green'}">${r.absences}</span></td>
          <td>${r.filedAt}</td><td><span class="badge b-teal">${r.status}</span></td>
        </tr>`).join('')||'<tr><td colspan="8" class="tbl-empty">No reports filed yet.</td></tr>'}</tbody>
      </table></div>
    </div>`;
}

function new24hrModal() {
  openModal('File 24-hour report',
    `<div class="form-grid">
      <div class="form-group"><label class="form-label">Shift</label><select class="form-control" id="d-shift"><option>Day (07:00–19:00)</option><option>Night (19:00–07:00)</option></select></div>
      <div class="form-group"><label class="form-label">Date</label><input class="form-control" type="date" id="d-date"/></div>
      <div class="form-group"><label class="form-label">Patients covered</label><input class="form-control" type="number" id="d-pts" value="6"/></div>
      <div class="form-group"><label class="form-label">Incidents this shift</label><input class="form-control" type="number" id="d-inc" value="0"/></div>
      <div class="form-group"><label class="form-label">PN absences</label><input class="form-control" type="number" id="d-abs" value="0"/></div>
    </div>
    <div class="form-group"><label class="form-label">Shift notes</label><textarea class="form-control" id="d-notes" rows="3" placeholder="Key events, outstanding concerns, handover notes…"></textarea></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="save24hr()">File report</button>`
  );
  $('d-date').value = new Date().toISOString().slice(0,10);
}

async function save24hr() {
  const r = await POST('/reports24hr', { shift:$('d-shift').value, date:$('d-date').value, patientsCovered:parseInt($('d-pts').value)||6, incidents:parseInt($('d-inc').value)||0, absences:parseInt($('d-abs').value)||0, notes:$('d-notes').value });
  if (r) { closeModal(); toast('Report filed'); await renderReports24hr($('page-content')); }
}

// ── SUPERVISORY ROUNDS ────────────────────────────────────────────────────────
async function renderRounding(mc) {
  const rounds = await GET('/rounds');
  const today = new Date().toISOString().slice(0,10);
  mc.innerHTML = `
    <div class="page-hdr">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div><div class="page-title">Supervisory Rounds</div><div class="page-sub">All home visit rounds. High-risk: weekly · Moderate: 2-weekly · Low: monthly.</div></div>
        ${S.user.role !== 'nurse' ? '<button class="btn btn-primary btn-sm" onclick="newRoundModal()"><i class="ti ti-plus" aria-hidden="true"></i>Log round</button>' : ''}
      </div>
    </div>
    <div class="card card-flush">
      <div class="tbl-wrap"><table>
        <thead><tr><th>Patient</th><th>Date</th><th>Supervisor</th><th>Risk</th><th>Score /100</th><th>Wound review</th><th>Escalation</th><th>Next due</th></tr></thead>
        <tbody>${(rounds||[]).map(r=>`<tr>
          <td><strong>${r.patientName}</strong></td><td>${r.date}</td><td>${r.supervisor}</td>
          <td>${riskBadge(r.risk)}</td>
          <td style="font-weight:500;color:${scoreColor(r.score)}">${r.score}</td>
          <td>${r.woundReview}</td>
          <td><span class="badge ${r.escalation==='No'?'b-green':r.escalation?.includes('director')?'b-red':'b-amber'}">${r.escalation}</span></td>
          <td style="color:${r.nextDue<today?'var(--red)':'inherit'}">${r.nextDue}${r.nextDue<today?' ⚠':''}</td>
        </tr>`).join('')||'<tr><td colspan="8" class="tbl-empty">No rounds recorded.</td></tr>'}</tbody>
      </table></div>
    </div>`;
}

function newRoundModal() {
  openModal('Log supervisory round',
    `<div class="form-grid">
      <div class="form-group"><label class="form-label">Patient name</label><input class="form-control" id="rnd-pt" placeholder="Patient full name"/></div>
      <div class="form-group"><label class="form-label">Risk tier</label><select class="form-control" id="rnd-risk"><option>High</option><option>Moderate</option><option>Low</option></select></div>
      <div class="form-group"><label class="form-label">Round date</label><input class="form-control" type="date" id="rnd-date"/></div>
      <div class="form-group"><label class="form-label">Scorecard total (/100)</label><input class="form-control" type="number" id="rnd-score" min="0" max="100" placeholder="85"/></div>
      <div class="form-group"><label class="form-label">Wound reviewed</label><select class="form-control" id="rnd-wound"><option>Yes</option><option>No</option><option>N/A</option></select></div>
      <div class="form-group"><label class="form-label">Escalation required</label><select class="form-control" id="rnd-escal"><option>No</option><option>Yes — supervisor</option><option>Yes — director</option></select></div>
      <div class="form-group form-full"><label class="form-label">Round notes</label><textarea class="form-control" id="rnd-notes" rows="3" placeholder="Key findings, coaching points, actions taken…"></textarea></div>
    </div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveRound()">Save round</button>`
  );
  $('rnd-date').value = new Date().toISOString().slice(0,10);
}

async function saveRound() {
  const risk = $('rnd-risk').value;
  const daysNext = risk==='High'?7:risk==='Moderate'?14:30;
  const nextDue = new Date(Date.now()+daysNext*86400000).toISOString().slice(0,10);
  const r = await POST('/rounds', { patientName:$('rnd-pt').value, patientId:'', risk, date:$('rnd-date').value, score:parseInt($('rnd-score').value)||0, woundReview:$('rnd-wound').value, escalation:$('rnd-escal').value, nextDue, notes:$('rnd-notes').value });
  if (r) { closeModal(); toast('Round saved'); await renderRounding($('page-content')); }
}

// ── CURVES IN CARE ────────────────────────────────────────────────────────────
async function renderCurves(mc) {
  const patients = await GET('/patients');
  const curvePts = (patients||[]).filter(p => p.svc?.includes('Curves'));
  mc.innerHTML = `
    <div class="page-hdr"><div class="page-title">Curves in Care</div><div class="page-sub">Post-operative care service — BBL, 360 Lipo, Breast Augmentation</div></div>
    ${curvePts.length ? `
      <div class="card card-flush"><div class="tbl-wrap"><table>
        <thead><tr><th>Patient</th><th>Procedure</th><th>Risk</th><th>Nurse assigned</th><th>Site</th><th>Status</th><th></th></tr></thead>
        <tbody>${curvePts.map(p=>`<tr>
          <td><strong>${p.name}</strong></td>
          <td><span class="badge b-rose">${p.svc.replace('Curves in Care — ','')}</span></td>
          <td>${riskBadge(p.risk)}</td><td>${p.pn}</td><td>${p.site}</td>
          <td><span class="badge b-teal">Active</span></td>
          <td><button class="btn btn-sm" onclick="openEHR('${p.id}')"><i class="ti ti-eye" aria-hidden="true"></i>EHR</button></td>
        </tr>`).join('')}</tbody>
      </table></div></div>
    ` : `<div class="card"><div class="tbl-empty"><i class="ti ti-heart" style="font-size:32px;display:block;margin-bottom:8px" aria-hidden="true"></i>No active Curves in Care patients.<br>Register a new patient with a Curves in Care service type.</div></div>`}
    <div id="ehr-panel"></div>`;
}

// ── WOUND CARE ────────────────────────────────────────────────────────────────
async function renderWound(mc) {
  const patients = await GET('/patients');
  const woundPts = (patients||[]).filter(p => p.svc?.toLowerCase().includes('wound'));
  mc.innerHTML = `
    <div class="page-hdr"><div class="page-title">Wound Care Service</div><div class="page-sub">Managed by Clinical Director — Wound Care Specialist. Photos reviewed daily.</div></div>
    <div class="card card-flush"><div class="tbl-wrap"><table>
      <thead><tr><th>Patient</th><th>Diagnosis</th><th>Risk</th><th>PN assigned</th><th>Site</th><th>Allergies</th><th></th></tr></thead>
      <tbody>${woundPts.map(p=>`<tr>
        <td><strong>${p.name}</strong></td><td class="fs-12 text-muted">${p.dx}</td>
        <td>${riskBadge(p.risk)}</td><td>${p.pn}</td><td>${p.site}</td>
        <td class="text-danger fs-12">${p.allergies}</td>
        <td><button class="btn btn-sm" onclick="openEHR('${p.id}')"><i class="ti ti-eye" aria-hidden="true"></i>EHR</button></td>
      </tr>`).join('')||'<tr><td colspan="7" class="tbl-empty">No wound care patients.</td></tr>'}</tbody>
    </table></div></div>
    <div id="ehr-panel"></div>`;
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────
async function renderInventory(mc) {
  const items = await GET('/inventory');
  const low = (items||[]).filter(i => i.qty <= i.threshold).length;
  const crit = (items||[]).filter(i => i.qty <= i.threshold/2).length;
  mc.innerHTML = `
    <div class="page-hdr">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div><div class="page-title">Inventory Management</div><div class="page-sub">All clinical supplies. Reorder alerts fire at threshold.</div></div>
        ${S.user.role !== 'nurse' ? '<button class="btn btn-primary btn-sm" onclick="newInventoryModal()"><i class="ti ti-plus" aria-hidden="true"></i>Add item</button>' : ''}
      </div>
    </div>
    <div class="metrics" style="grid-template-columns:repeat(3,1fr)">
      <div class="metric"><div class="metric-val" style="color:var(--purple-m)">${(items||[]).length}</div><div class="metric-lbl">Total SKUs</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--amber)">${low}</div><div class="metric-lbl">Low-stock alerts</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--red)">${crit}</div><div class="metric-lbl">Critical / reorder now</div></div>
    </div>
    <div class="card card-flush"><div class="tbl-wrap"><table>
      <thead><tr><th>Item</th><th>Category</th><th>In stock</th><th>Threshold</th><th>Last restocked</th><th>Status</th><th></th></tr></thead>
      <tbody>${(items||[]).map(i=>{
        const pct = Math.min(100,Math.round(i.qty/Math.max(i.threshold*2,1)*100));
        const st = i.qty<=i.threshold/2?['b-red','Critical']:i.qty<=i.threshold?['b-amber','Low stock']:['b-green','OK'];
        return `<tr>
          <td><strong>${i.name}</strong></td><td><span class="badge b-purple">${i.category}</span></td>
          <td><div style="font-weight:500">${i.qty} ${i.unit}</div><div class="prog-wrap" style="width:80px"><div class="prog-fill" style="width:${pct}%;background:${i.qty<=i.threshold?'var(--red)':'var(--teal)'}"></div></div></td>
          <td>${i.threshold} ${i.unit}</td><td>${i.lastRestocked}</td>
          <td><span class="badge ${st[0]}">${st[1]}</span></td>
          <td><button class="btn btn-sm" onclick="restockModal('${i.id}','${escHtml(i.name)}')"><i class="ti ti-plus" aria-hidden="true"></i>Restock</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
}

function restockModal(id, name) {
  openModal(`Restock: ${name}`,
    `<div class="form-group"><label class="form-label">Quantity to add</label><input class="form-control" type="number" id="rs-qty" placeholder="50" min="1"/></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="doRestock('${id}')">Restock</button>`
  );
}

async function doRestock(id) {
  const qty = parseInt($('rs-qty').value);
  if (!qty || qty < 1) { toast('Enter a valid quantity','err'); return; }
  const r = await PUT('/inventory/' + id + '/restock', { qty });
  if (r) { closeModal(); toast('Inventory updated'); await renderInventory($('page-content')); }
}

function newInventoryModal() {
  openModal('Add inventory item',
    `<div class="form-grid">
      <div class="form-group"><label class="form-label">Item name</label><input class="form-control" id="inv-name" placeholder="e.g. Gauze 4×4"/></div>
      <div class="form-group"><label class="form-label">Category</label><select class="form-control" id="inv-cat"><option>Wound care</option><option>PPE</option><option>IV supplies</option><option>O2 supplies</option><option>Equipment</option><option>General supplies</option></select></div>
      <div class="form-group"><label class="form-label">Initial quantity</label><input class="form-control" type="number" id="inv-qty" placeholder="50"/></div>
      <div class="form-group"><label class="form-label">Reorder threshold</label><input class="form-control" type="number" id="inv-thresh" placeholder="20"/></div>
      <div class="form-group"><label class="form-label">Unit</label><select class="form-control" id="inv-unit"><option>pcs</option><option>boxes</option><option>rolls</option><option>pairs</option><option>bottles</option><option>btl</option><option>tubes</option></select></div>
      <div class="form-group"><label class="form-label">Site</label><input class="form-control" id="inv-site" value="Central store"/></div>
    </div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveInventory()">Add item</button>`
  );
}

async function saveInventory() {
  const name = $('inv-name').value.trim();
  if (!name) { toast('Item name required','err'); return; }
  const r = await POST('/inventory', { name, category:$('inv-cat').value, qty:parseInt($('inv-qty').value)||0, threshold:parseInt($('inv-thresh').value)||20, unit:$('inv-unit').value, site:$('inv-site').value });
  if (r) { closeModal(); toast('Item added'); await renderInventory($('page-content')); }
}

// ── EQUIPMENT RENTAL ──────────────────────────────────────────────────────────
async function renderEquipment(mc) {
  const eq = await GET('/equipment');
  const active = (eq||[]).filter(e=>e.status==='Active').length;
  const overdue = (eq||[]).filter(e=>e.status==='Overdue').length;
  const revenue = (eq||[]).filter(e=>e.status!=='Returned').reduce((s,e)=>s+(e.totalDue||0),0);
  mc.innerHTML = `
    <div class="page-hdr">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div><div class="page-title">Equipment Rental</div><div class="page-sub">O₂ concentrators and clinical equipment. Rate: JMD $2,500/day.</div></div>
        ${S.user.role !== 'nurse' ? '<button class="btn btn-primary btn-sm" onclick="newRentalModal()"><i class="ti ti-plus" aria-hidden="true"></i>New rental</button>' : ''}
      </div>
    </div>
    <div class="metrics">
      <div class="metric"><div class="metric-val" style="color:var(--teal)">${active}</div><div class="metric-lbl">Active rentals</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--red)">${overdue}</div><div class="metric-lbl">Overdue returns</div></div>
      <div class="metric"><div class="metric-val" style="color:var(--purple-m);font-size:18px">$${revenue.toLocaleString('en-JM')}</div><div class="metric-lbl">Total revenue (JMD)</div></div>
    </div>
    <div class="card card-flush"><div class="tbl-wrap"><table>
      <thead><tr><th>Client / patient</th><th>Unit</th><th>Serial</th><th>Flow rate</th><th>Start date</th><th>End date</th><th>Days</th><th>Total (JMD)</th><th>Status</th><th></th></tr></thead>
      <tbody>${(eq||[]).map(e=>`<tr>
        <td><strong>${e.client}</strong></td><td>${e.unit}</td><td class="fs-11 text-muted">${e.serial}</td>
        <td>${e.flowRate} L/min</td><td>${e.startDate}</td><td>${e.endDate}</td>
        <td>${e.daysRented}</td><td style="font-weight:500">$${(e.totalDue||0).toLocaleString('en-JM')}</td>
        <td><span class="badge ${e.status==='Active'?'b-teal':e.status==='Overdue'?'b-red':'b-green'}">${e.status}</span></td>
        <td>
          ${e.status!=='Returned'?`<button class="btn btn-sm" onclick="markReturned('${e.id}')"><i class="ti ti-check" aria-hidden="true"></i>Return</button>`:''}
        </td>
      </tr>`).join('')||'<tr><td colspan="10" class="tbl-empty">No equipment rented.</td></tr>'}</tbody>
    </table></div></div>`;
}

function newRentalModal() {
  openModal('New equipment rental',
    `<div class="alert alert-purple"><i class="ti ti-info-circle" aria-hidden="true"></i>Rate: JMD $2,500/day. Physician O₂ prescription required before rental.</div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Client / patient name</label><input class="form-control" id="eq-client" placeholder="Full name"/></div>
      <div class="form-group"><label class="form-label">Equipment type</label><select class="form-control" id="eq-type"><option>O₂ Concentrator 5L</option><option>O₂ Concentrator 10L</option><option>Portable O₂ cylinder</option></select></div>
      <div class="form-group"><label class="form-label">Serial number</label><input class="form-control" id="eq-serial" placeholder="OC-004"/></div>
      <div class="form-group"><label class="form-label">Flow rate (L/min)</label><input class="form-control" type="number" id="eq-flow" placeholder="2"/></div>
      <div class="form-group"><label class="form-label">Rental start date</label><input class="form-control" type="date" id="eq-start"/></div>
      <div class="form-group"><label class="form-label">Estimated end date</label><input class="form-control" type="date" id="eq-end"/></div>
      <div class="form-group form-full"><label class="form-label">Notes</label><input class="form-control" id="eq-notes" placeholder="Prescription details, physician name…"/></div>
    </div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveRental()">Create rental</button>`
  );
  const t = new Date().toISOString().slice(0,10);
  $('eq-start').value = t;
}

async function saveRental() {
  const client = $('eq-client').value.trim();
  if (!client) { toast('Client name required','err'); return; }
  const r = await POST('/equipment', { client, unit:$('eq-type').value, serial:$('eq-serial').value, flowRate:$('eq-flow').value, startDate:$('eq-start').value, endDate:$('eq-end').value, notes:$('eq-notes').value, depositPaid:5000 });
  if (r) { closeModal(); toast('Rental created'); await renderEquipment($('page-content')); }
}

async function markReturned(id) {
  if (!confirm('Mark this equipment as returned?')) return;
  const r = await PUT('/equipment/' + id, { status: 'Returned' });
  if (r) { toast('Equipment marked as returned'); await renderEquipment($('page-content')); }
}

// ── STAFF ─────────────────────────────────────────────────────────────────────
async function renderStaff(mc) {
  const staff = await GET('/staff');
  mc.innerHTML = `
    <div class="page-hdr">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div><div class="page-title">Staff</div><div class="page-sub">All CNC clinical and support staff.</div></div>
      </div>
    </div>
    <div class="card card-flush"><div class="tbl-wrap"><table>
      <thead><tr><th>Name</th><th>Role</th><th>Registration</th><th>Sites</th><th>Shift</th><th>On-call</th><th>Status</th></tr></thead>
      <tbody>${(staff||[]).map(s=>`<tr>
        <td><strong>${s.name}</strong></td>
        <td><span class="badge ${s.role.includes('Director')?'b-purple':s.role.includes('Supervisor')?'b-teal':s.role.includes('RN')?'b-amber':'b-gray'}">${s.role}</span></td>
        <td class="fs-12 text-muted">${s.reg}</td><td>${s.sites}</td><td>${s.shift}</td>
        <td>${s.onCall}</td><td><span class="badge b-green">${s.status}</span></td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
}

// ── INCIDENTS ─────────────────────────────────────────────────────────────────
async function renderIncidents(mc) {
  const incidents = await GET('/incidents');
  mc.innerHTML = `
    <div class="page-hdr">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div><div class="page-title">Incident Log</div><div class="page-sub">All clinical incidents. Supervisor review within 24 hrs. Director review within 48 hrs.</div></div>
        <button class="btn btn-primary btn-sm" onclick="newIncidentModal()"><i class="ti ti-plus" aria-hidden="true"></i>Log incident</button>
      </div>
    </div>
    <div class="card card-flush"><div class="tbl-wrap"><table>
      <thead><tr><th>Ref</th><th>Date</th><th>Patient</th><th>Type</th><th>Severity</th><th>Reported by</th><th>Supervisor reviewed</th><th>Status</th><th></th></tr></thead>
      <tbody>${(incidents||[]).map(i=>`<tr>
        <td><strong>${i.ref}</strong></td><td>${i.date}</td><td>${i.patientName}</td>
        <td>${i.type}</td>
        <td><span class="badge ${i.severity==='Near miss'?'b-green':i.severity==='Minor'?'b-teal':i.severity==='Moderate'?'b-amber':'b-red'}">${i.severity}</span></td>
        <td>${i.reportedBy}</td><td>${i.supervisorReviewed}</td>
        <td><span class="badge ${i.status==='Closed'?'b-green':i.status==='Under review'?'b-amber':'b-red'}">${i.status}</span></td>
        <td>${S.user.role!=='nurse'&&i.status!=='Closed'?`<button class="btn btn-sm" onclick="closeIncident('${i.id}')"><i class="ti ti-check" aria-hidden="true"></i>Close</button>`:''}
        </td>
      </tr>`).join('')||'<tr><td colspan="9" class="tbl-empty">No incidents recorded.</td></tr>'}</tbody>
    </table></div></div>`;
}

function newIncidentModal() {
  openModal('Log incident',
    `<div class="alert alert-red"><i class="ti ti-alert-triangle" aria-hidden="true"></i>Notify your Clinical Supervisor by phone immediately. Complete this form as soon as it is safe to do so.</div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Patient name</label><input class="form-control" id="inc-pt" placeholder="Full name"/></div>
      <div class="form-group"><label class="form-label">Incident date</label><input class="form-control" type="date" id="inc-date"/></div>
      <div class="form-group"><label class="form-label">Incident type</label><select class="form-control" id="inc-type"><option>Fall</option><option>Medication error</option><option>Pressure injury</option><option>Wound complication</option><option>Acute deterioration</option><option>Safeguarding concern</option><option>Equipment failure</option><option>Other</option></select></div>
      <div class="form-group"><label class="form-label">Severity</label><select class="form-control" id="inc-sev"><option>Near miss</option><option>Minor</option><option>Moderate</option><option>Severe</option></select></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="inc-desc" rows="4" placeholder="Describe what happened — be factual and objective…"></textarea></div>`,
    `<button class="btn" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="saveIncident()">Log incident</button>`
  );
  $('inc-date').value = new Date().toISOString().slice(0,10);
}

async function saveIncident() {
  const pt = $('inc-pt').value.trim();
  if (!pt) { toast('Patient name required','err'); return; }
  const r = await POST('/incidents', { patientName:pt, date:$('inc-date').value, type:$('inc-type').value, severity:$('inc-sev').value, description:$('inc-desc').value });
  if (r) { closeModal(); toast('Incident logged. Notify supervisor immediately.'); await renderIncidents($('page-content')); }
}

async function closeIncident(id) {
  const r = await PUT('/incidents/' + id, { status:'Closed', supervisorReviewed:'Yes' });
  if (r) { toast('Incident closed'); await renderIncidents($('page-content')); }
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
async function renderSettings(mc) {
  mc.innerHTML = `
    <div class="page-hdr"><div class="page-title">Settings</div><div class="page-sub">Account and system configuration.</div></div>
    <div class="two-col">
      <div class="card">
        <div class="card-title"><i class="ti ti-lock" aria-hidden="true"></i>Change your password</div>
        <div class="form-group"><label class="form-label">New password</label><input class="form-control" type="password" id="new-pw" placeholder="Min 8 characters"/></div>
        <div class="form-group"><label class="form-label">Confirm password</label><input class="form-control" type="password" id="conf-pw" placeholder="Repeat password"/></div>
        <button class="btn btn-primary" onclick="changePw()">Update password</button>
      </div>
      <div class="card">
        <div class="card-title"><i class="ti ti-user" aria-hidden="true"></i>Your account</div>
        <div class="mb-2"><div class="fs-11 text-muted">Name</div><div class="fw-500">${S.user.name}</div></div>
        <div class="mb-2"><div class="fs-11 text-muted">Email</div><div class="fw-500">${S.user.email}</div></div>
        <div class="mb-2"><div class="fs-11 text-muted">Role</div><div class="fw-500">${S.user.role}</div></div>
      </div>
    </div>`;
}

async function changePw() {
  const pw = $('new-pw').value;
  if (pw.length < 8) { toast('Password must be at least 8 characters','err'); return; }
  if (pw !== $('conf-pw').value) { toast('Passwords do not match','err'); return; }
  const r = await PUT('/users/' + S.user.id + '/password', { password: pw });
  if (r?.ok) toast('Password updated');
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function logout() {
  await POST('/logout');
  window.location.href = '/login.html';
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  const me = await GET('/me');
  if (!me) return;
  S.user = me;
  $('user-name').textContent = me.name;
  if (me.role === 'director') $('nav-settings').style.display = 'flex';
  await loadPage('dashboard');
})();
