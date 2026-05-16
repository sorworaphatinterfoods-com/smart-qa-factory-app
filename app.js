const modules = [
  ["RM Receiving", "รับวัตถุดิบ / COA / Temp / Supplier"],
  ["In-Process QC", "Cutting / Mixing / Marination / Forming"],
  ["CCP Monitoring", "Critical limit / Corrective action / Verification"],
  ["Metal Detector", "Fe / Non-Fe / SUS / Reject Test"],
  ["FG Release", "Label / Weight / Temp / Micro / QA Approval"],
  ["GHP Basic", "Cleaning / Pest / Hygiene / Water / Waste"],
  ["Calibration", "Equipment master / Due date / Status"],
  ["DCC", "QP / WI / FM / SD / Revision / R2"],
  ["CAPA", "Complaint / NCR / Root cause / Action"],
  ["Traceability", "1-up 1-down / Recall readiness"]
];

function card(title, value) { return `<div class="card"><h3>${title}</h3><strong>${value}</strong></div>`; }

async function loadDashboard() {
  const health = await fetch('/api/health').then(r => r.json());
  document.getElementById('status').textContent = health.ok ? 'API ONLINE' : 'API ERROR';
  const dash = await fetch('/api/dashboard').then(r => r.json()).catch(() => ({ kpi: {} }));
  const k = dash.kpi || {};
  document.getElementById('kpiCards').innerHTML = [
    card('Total Checks', k.total_checks ?? 0),
    card('PASS', k.pass ?? 0),
    card('FAIL', k.fail ?? 0),
    card('Pass Rate', `${k.pass_rate_percent ?? 0}%`),
    card('MD Fail', k.metal_detector_fail ?? 0),
    card('QA Status', k.qa_status ?? 'NO DATA')
  ].join('');
}

document.getElementById('modules').innerHTML = modules.map(([m,d]) => `<div class="module"><b>${m}</b><br><small>${d}</small></div>`).join('');

document.getElementById('inspectionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  if (payload.value_num === '') delete payload.value_num; else payload.value_num = Number(payload.value_num);
  const res = await fetch('/api/table/inspection_logs', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
  }).then(r => r.json());
  document.getElementById('formResult').textContent = JSON.stringify(res, null, 2);
  await loadDashboard();
});

loadDashboard();
