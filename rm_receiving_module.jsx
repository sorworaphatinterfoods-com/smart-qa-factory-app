import { useState, useCallback, useMemo, createContext, useContext } from "react";

// ═══════════════════════════════════════════════════════════════
// SMART QA FACTORY — RM Receiving Module v3.0
// Thai-First UI · HACCP · ISO 22000 · GMP Thailand
// ═══════════════════════════════════════════════════════════════

const LangCtx = createContext({ lang: "th", set: () => {} });
const useLang = () => useContext(LangCtx);

// ── Master Data ──
const SUPPLIERS = [
  { id: "SP0001", name: "บริษัท เบทาโกรฯ (หมู)", cat: "Pork", risk: "HIGH", status: "Approved" },
  { id: "SP0002", name: "บริษัท เบทาโกรฯ (ไก่)", cat: "Chicken", risk: "HIGH", status: "Approved" },
  { id: "SP0003", name: "บริษัท เอส แอล พิทักษ์", cat: "Pork", risk: "HIGH", status: "Approved" },
  { id: "SP0004", name: "บริษัท ฟู้ดจ๊อบ จำกัด", cat: "Pork", risk: "HIGH", status: "Approved" },
  { id: "SP0034", name: "บริษัท อีเค ซลอเทอร์เฮาส์", cat: "Pork", risk: "HIGH", status: "Conditional" },
];

const MATERIALS = [
  { code: "RM0001", name: "สะโพกหมู", en: "Pork Leg", cat: "Pork", unit: "kg", storage: "Chilled", surfMax: 4, coreMax: 7, vehMax: 4, phMin: 5.5, phMax: 5.8, coaReq: true, shelf: 6 },
  { code: "RM0002", name: "มันสันแข็ง", en: "Hard Back Fat", cat: "Pork", unit: "kg", storage: "Chilled", surfMax: 4, coreMax: 7, vehMax: 4, phMin: 5.5, phMax: 6.0, coaReq: true, shelf: 6 },
  { code: "RM0004", name: "เศษบีบติดหนัง", en: "Pork Trim w/ Skin", cat: "Chicken", unit: "kg", storage: "Chilled", surfMax: 4, coreMax: 7, vehMax: 4, phMin: 5.5, phMax: 5.8, coaReq: true, shelf: 5 },
  { code: "RM0005", name: "อกไก่", en: "Chicken Breast", cat: "Chicken", unit: "kg", storage: "Chilled", surfMax: 4, coreMax: 7, vehMax: 4, phMin: 5.8, phMax: 6.2, coaReq: true, shelf: 5 },
];

const SPECS = MATERIALS.map(m => ({
  material: m.code, name: m.name, version: 1, status: "Active",
  surfMin: -1, surfMax: m.surfMax, coreMin: -1, coreMax: m.coreMax, vehMin: 0, vehMax: m.vehMax,
  phMin: m.phMin, phMax: m.phMax,
  color: m.cat === "Pork" ? "สีชมพูแดงปกติ ไม่คล้ำ" : "สีชมพูอ่อนปกติ ไม่เขียว",
  odor: "กลิ่นปกติ ไม่มีกลิ่นเหม็น",
  packaging: "บรรจุภัณฑ์สมบูรณ์ ไม่ฉีกขาด ไม่รั่วซึม",
}));

// ── Date/ID helpers ──
const today = () => new Date().toISOString().split("T")[0];
const nowTime = () => new Date().toTimeString().slice(0, 5);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };
let refSeq = 100;
const genRef = (pfx) => `${pfx}-${today().replace(/-/g, "")}-${String(++refSeq).padStart(3, "0")}`;

// ── Validation Engine ──
function validate(data, mat) {
  const results = [];
  const fails = [];
  const holds = [];

  // Vehicle temp
  if (data.vehicleTemp !== "" && data.vehicleTemp != null) {
    const v = parseFloat(data.vehicleTemp);
    const max = mat?.vehMax ?? 4;
    const ok = !isNaN(v) && v >= 0 && v <= max;
    if (!ok && !isNaN(v)) holds.push("VEHICLE_TEMP");
    results.push({ type: "vehicle_temp", label: "อุณหภูมิรถขนส่ง", en: "Vehicle Temp", spec: `0 – ${max} °C`, val: `${v} °C`, status: ok ? "PASS" : "HOLD", crit: true, dev: ok ? null : Math.max(0, v - max).toFixed(1) });
  }
  // Surface temp
  if (data.surfaceTemp !== "" && data.surfaceTemp != null) {
    const v = parseFloat(data.surfaceTemp);
    const max = mat?.surfMax ?? 4;
    const hardFail = !isNaN(v) && v > 7;
    const ok = !isNaN(v) && v >= -1 && v <= max;
    if (hardFail) fails.push("SURFACE_TEMP_CRITICAL");
    else if (!ok && !isNaN(v)) holds.push("SURFACE_TEMP");
    results.push({ type: "surface_temp", label: "อุณหภูมิผิวหน้า", en: "Surface Temp", spec: `-1 – ${max} °C`, val: `${v} °C`, status: hardFail ? "FAIL" : ok ? "PASS" : "HOLD", crit: true, dev: ok ? null : Math.max(0, v - max).toFixed(1) });
  }
  // Core temp
  if (data.coreTemp !== "" && data.coreTemp != null) {
    const v = parseFloat(data.coreTemp);
    const max = mat?.coreMax ?? 7;
    const hardFail = !isNaN(v) && v > 10;
    const ok = !isNaN(v) && v >= -1 && v <= max;
    if (hardFail) fails.push("CORE_TEMP_CRITICAL");
    else if (!ok && !isNaN(v)) holds.push("CORE_TEMP");
    results.push({ type: "core_temp", label: "อุณหภูมิแกนกลาง", en: "Core Temp", spec: `-1 – ${max} °C`, val: `${v} °C`, status: hardFail ? "FAIL" : ok ? "PASS" : "HOLD", crit: true, dev: ok ? null : Math.max(0, v - max).toFixed(1) });
  }
  // Visual
  const visOk = data.visual === "ปกติ";
  if (!visOk && data.visual) holds.push("VISUAL");
  results.push({ type: "visual", label: "ลักษณะปรากฏ", en: "Visual", spec: "ปกติ", val: data.visual || "ปกติ", status: visOk || !data.visual ? "PASS" : "HOLD", crit: false });
  // Odor
  const odorOk = data.odor === "ปกติ" || !data.odor;
  if (!odorOk) fails.push("ODOR_ABNORMAL");
  results.push({ type: "odor", label: "กลิ่น", en: "Odor", spec: "ปกติ", val: data.odor || "ปกติ", status: odorOk ? "PASS" : "FAIL", crit: true });
  // Slime
  const slimeOk = data.slime === "ไม่พบ" || !data.slime;
  if (!slimeOk) fails.push("SLIME_FOUND");
  results.push({ type: "slime", label: "เมือก/ลื่น", en: "Slime", spec: "ไม่พบ", val: data.slime || "ไม่พบ", status: slimeOk ? "PASS" : "FAIL", crit: true });
  // Color
  const colorOk = data.color === "ปกติ" || !data.color;
  if (!colorOk) holds.push("COLOR");
  results.push({ type: "color", label: "สี", en: "Color", spec: "ปกติ", val: data.color || "ปกติ", status: colorOk ? "PASS" : "HOLD", crit: false });
  // Packaging
  const pkgOk = data.packaging === "สมบูรณ์" || !data.packaging;
  if (!pkgOk) fails.push("PACKAGING_DAMAGED");
  results.push({ type: "packaging", label: "สภาพบรรจุภัณฑ์", en: "Packaging", spec: "สมบูรณ์", val: data.packaging || "สมบูรณ์", status: pkgOk ? "PASS" : "FAIL", crit: false });
  // Label
  const labelOk = data.labelCond === "ถูกต้อง" || !data.labelCond;
  const labelMissing = data.labelCond === "ไม่มี";
  if (labelMissing) fails.push("LABEL_MISSING");
  else if (!labelOk && data.labelCond) holds.push("LABEL_INCORRECT");
  results.push({ type: "label", label: "ฉลาก", en: "Label", spec: "ถูกต้อง", val: data.labelCond || "ถูกต้อง", status: labelMissing ? "FAIL" : labelOk || !data.labelCond ? "PASS" : "HOLD", crit: false });
  // Foreign matter
  const fmOk = data.foreignMatter === "ไม่พบ" || !data.foreignMatter;
  if (!fmOk) fails.push("FOREIGN_MATTER");
  results.push({ type: "foreign_matter", label: "สิ่งแปลกปลอม", en: "Foreign Matter", spec: "ไม่พบ", val: data.foreignMatter || "ไม่พบ", status: fmOk ? "PASS" : "FAIL", crit: true });
  // COA
  if (mat?.coaReq && !data.coaReceived) {
    holds.push("COA_MISSING");
    results.push({ type: "coa", label: "เอกสาร COA", en: "COA", spec: "ต้องมี", val: "ไม่ได้รับ", status: "HOLD", crit: false });
  }

  const overall = fails.length > 0 ? "FAIL" : holds.length > 0 ? "HOLD" : "PASS";
  return { overall, fails, holds, results };
}

// ── CSS ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
--bg0:#04090f;--bg1:#081420;--bg2:#0d1f30;--bg3:#132a3e;--bg4:#1a3550;
--bdr:#163050;--bdr2:#205070;--brH:#305575;
--t1:#dce8f2;--t2:#8fafc8;--t3:#5a7a95;--t4:#3a5570;
--cyan:#00d4e0;--cyanD:#008a94;--blue:#2090e0;--green:#00d060;--greenD:#008040;
--red:#ff3050;--redD:#a01020;--amber:#ffa020;--amberD:#a06800;
--purple:#a060f0;--pink:#f04090;--teal:#00b898;
--pass:#00d060;--fail:#ff3050;--hold:#ffa020;--pending:#5a7a95;
--font:'Sarabun',sans-serif;--mono:'Fira Code',monospace;
--r:10px;--rs:7px;--rx:5px;
--shadow:0 4px 24px rgba(0,0,0,.4);
}
body{font-family:var(--font);background:var(--bg0);color:var(--t1);-webkit-font-smoothing:antialiased;font-size:13.5px;line-height:1.5}
.app{display:flex;min-height:100vh}

/* Sidebar */
.sb{width:240px;background:var(--bg1);border-right:1px solid var(--bdr);position:fixed;top:0;left:0;bottom:0;z-index:100;display:flex;flex-direction:column;transition:transform .25s}
.sb.shut{transform:translateX(-240px)}
.sb-top{padding:14px 16px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:10px}
.sb-icon{width:38px;height:38px;background:linear-gradient(135deg,#005060,#00d4e0);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;flex-shrink:0;letter-spacing:-.5px}
.sb-top h2{font-size:13px;font-weight:700;letter-spacing:-.3px;line-height:1.2}
.sb-top small{font-size:8.5px;color:var(--t4);letter-spacing:1.5px;text-transform:uppercase;font-weight:600}
.sb-nav{flex:1;overflow-y:auto;padding:10px 6px}
.sb-nav::-webkit-scrollbar{width:3px}.sb-nav::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}
.sb-section{font-size:8.5px;text-transform:uppercase;letter-spacing:1.5px;color:var(--t4);padding:16px 12px 5px;font-weight:700}
.sb-item{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:var(--rs);cursor:pointer;font-size:13px;color:var(--t2);transition:all .1s;position:relative;font-weight:500}
.sb-item:hover{background:var(--bg3);color:var(--t1)}
.sb-item.on{background:rgba(0,212,224,.08);color:var(--cyan);font-weight:600}
.sb-item.on::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:3px;background:var(--cyan);border-radius:0 3px 3px 0}
.sb-ic{font-size:16px;width:20px;text-align:center;flex-shrink:0}
.sb-badge{margin-left:auto;background:var(--red);color:#fff;font-size:9px;padding:1px 7px;border-radius:8px;font-weight:700}
.sb-foot{padding:10px 16px;border-top:1px solid var(--bdr);font-size:10px;color:var(--t4);display:flex;align-items:center;gap:6px}

/* Main */
.main{flex:1;margin-left:240px;transition:margin .25s}
.main.full{margin-left:0}
.top{height:50px;background:var(--bg1);border-bottom:1px solid var(--bdr);display:flex;align-items:center;padding:0 18px;gap:12px;position:sticky;top:0;z-index:50}
.top-ham{display:none;background:none;border:none;color:var(--t1);font-size:18px;cursor:pointer;padding:4px}
.top-t{font-size:15px;font-weight:700}
.top-r{margin-left:auto;display:flex;align-items:center;gap:10px}
.lang-btn{background:var(--bg3);border:1px solid var(--bdr);color:var(--t2);padding:4px 12px;border-radius:14px;font-size:11px;cursor:pointer;font-family:var(--font);font-weight:600;transition:all .1s}
.lang-btn:hover{border-color:var(--cyan);color:var(--cyan)}
.cnt{padding:18px;max-width:1400px;margin:0 auto}

/* KPI */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin-bottom:20px}
.kpi{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);padding:14px 16px;position:relative;overflow:hidden;transition:all .12s;cursor:default}
.kpi:hover{border-color:var(--bdr2);box-shadow:var(--shadow)}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2.5px}
.kpi.pass::before{background:linear-gradient(90deg,var(--greenD),var(--green))}.kpi.fail::before{background:linear-gradient(90deg,var(--redD),var(--red))}
.kpi.hold::before{background:linear-gradient(90deg,var(--amberD),var(--amber))}.kpi.info::before{background:linear-gradient(90deg,var(--cyanD),var(--cyan))}
.kpi-v{font-size:26px;font-weight:800;font-family:var(--mono);letter-spacing:-1px;margin-bottom:1px}
.kpi.pass .kpi-v{color:var(--green)}.kpi.fail .kpi-v{color:var(--red)}.kpi.hold .kpi-v{color:var(--amber)}.kpi.info .kpi-v{color:var(--cyan)}
.kpi-l{font-size:10px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.4px}

/* Card */
.card{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);margin-bottom:14px;overflow:hidden}
.card-h{padding:12px 16px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.card-t{font-size:13.5px;font-weight:700;display:flex;align-items:center;gap:7px}
.card-a{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.card-b{padding:16px}

/* Table */
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;padding:8px 12px;background:var(--bg1);font-weight:700;font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;color:var(--t3);white-space:nowrap;border-bottom:1px solid var(--bdr)}
td{padding:8px 12px;border-bottom:1px solid rgba(22,48,80,.35);color:var(--t2);vertical-align:middle}
tr:hover td{background:rgba(0,212,224,.015)}
tr.fail-row td{background:rgba(255,48,80,.03)}
tr.hold-row td{background:rgba(255,160,32,.03)}
.mono{font-family:var(--mono);font-size:11px;letter-spacing:-.3px}

/* Badge */
.bg{display:inline-flex;align-items:center;padding:2px 9px;border-radius:10px;font-size:10px;font-weight:700;letter-spacing:.2px;white-space:nowrap}
.bg-pass{background:rgba(0,208,96,.12);color:#40e080}.bg-fail{background:rgba(255,48,80,.12);color:#ff6080}
.bg-hold{background:rgba(255,160,32,.12);color:#ffc050}.bg-pending{background:rgba(90,122,149,.15);color:var(--t3)}
.bg-rm{background:rgba(255,48,80,.08);color:#ff6080}.bg-high{background:rgba(255,48,80,.12);color:#ff6080}
.bg-medium{background:rgba(255,160,32,.12);color:#ffc050}.bg-low{background:rgba(0,208,96,.12);color:#40e080}
.bg-critical{background:rgba(240,64,144,.12);color:#f080b0}
.bg-ok{background:rgba(0,208,96,.12);color:#40e080}.bg-ng{background:rgba(255,48,80,.12);color:#ff6080}
.bg-cond{background:rgba(255,160,32,.12);color:#ffc050}

/* Temp readout */
.temp-read{font-family:var(--mono);font-size:16px;font-weight:600;letter-spacing:-1px;padding:6px 12px;border-radius:var(--rx);display:inline-flex;align-items:center;gap:4px}
.temp-read.ok{background:rgba(0,208,96,.08);color:var(--green);border:1px solid rgba(0,208,96,.2)}
.temp-read.ng{background:rgba(255,48,80,.08);color:var(--red);border:1px solid rgba(255,48,80,.2)}
.temp-read.warn{background:rgba(255,160,32,.08);color:var(--amber);border:1px solid rgba(255,160,32,.2)}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:var(--rs);font-size:12px;font-weight:600;cursor:pointer;transition:all .1s;border:1px solid transparent;font-family:var(--font)}
.btn:active{transform:scale(.97)}
.btn-p{background:var(--cyan);color:#000}.btn-p:hover{background:#00e8f0}
.btn-o{background:transparent;border-color:var(--bdr);color:var(--t2)}.btn-o:hover{border-color:var(--cyan);color:var(--cyan)}
.btn-g{background:rgba(0,208,96,.12);color:var(--green);border-color:rgba(0,208,96,.3)}.btn-g:hover{background:rgba(0,208,96,.2)}
.btn-d{background:rgba(255,48,80,.1);color:var(--red);border-color:rgba(255,48,80,.25)}.btn-d:hover{background:rgba(255,48,80,.18)}
.btn-w{background:rgba(255,160,32,.1);color:var(--amber);border-color:rgba(255,160,32,.25)}
.btn-sm{padding:4px 10px;font-size:10.5px}
.btn-lg{padding:10px 20px;font-size:14px}
.btn-full{width:100%;justify-content:center}

/* Form */
.fg{margin-bottom:14px}
.fl{display:block;font-size:11px;font-weight:700;color:var(--t3);margin-bottom:4px;letter-spacing:.3px}
.fl-req::after{content:' *';color:var(--red)}
.fi{width:100%;background:var(--bg1);border:1px solid var(--bdr);color:var(--t1);padding:9px 12px;border-radius:var(--rs);font-family:var(--font);font-size:13px;outline:none;transition:border .1s}
.fi:focus{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(0,212,224,.08)}
.fi::placeholder{color:var(--t4)}
.fi-err{border-color:var(--red)}
.fi-mono{font-family:var(--mono);font-size:14px;letter-spacing:-.5px}
select.fi{cursor:pointer}
textarea.fi{min-height:70px;resize:vertical}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.form-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.form-full{grid-column:1/-1}
.form-section{margin-top:20px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--bdr);font-size:12px;font-weight:700;color:var(--cyan);text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:6px}
.form-hint{font-size:10.5px;color:var(--t4);margin-top:2px}

/* Filter bar */
.fbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.fbar select,.fbar input{background:var(--bg1);border:1px solid var(--bdr);color:var(--t1);padding:6px 10px;border-radius:var(--rs);font-size:12px;font-family:var(--font);outline:none}

/* Detail rows */
.dr{display:flex;padding:8px 16px;border-bottom:1px solid rgba(22,48,80,.25)}
.dr-l{width:140px;font-size:10.5px;color:var(--t3);font-weight:600;flex-shrink:0;text-transform:uppercase;letter-spacing:.3px}
.dr-v{font-size:13px;color:var(--t1)}

/* Result box */
.result-box{padding:20px;text-align:center;border-radius:var(--r);margin:16px 0}
.result-box.pass{background:rgba(0,208,96,.06);border:2px solid rgba(0,208,96,.25)}
.result-box.fail{background:rgba(255,48,80,.06);border:2px solid rgba(255,48,80,.25)}
.result-box.hold{background:rgba(255,160,32,.06);border:2px solid rgba(255,160,32,.25)}
.result-icon{font-size:36px;margin-bottom:6px}
.result-label{font-size:22px;font-weight:800;font-family:var(--mono);letter-spacing:1px}
.result-box.pass .result-label{color:var(--green)}.result-box.fail .result-label{color:var(--red)}.result-box.hold .result-label{color:var(--amber)}
.result-msg{font-size:12px;color:var(--t2);margin-top:6px}

/* Alert */
.alert-item{padding:10px 16px;border-bottom:1px solid rgba(22,48,80,.25);display:flex;gap:10px;align-items:flex-start}
.alert-dot{width:6px;height:6px;border-radius:50%;margin-top:5px;flex-shrink:0;animation:apulse 2s infinite}
.alert-dot.crit{background:var(--red)}.alert-dot.warn{background:var(--amber)}
@keyframes apulse{0%,100%{opacity:1}50%{opacity:.3}}

/* Rule box */
.rule{background:rgba(255,48,80,.03);border:1px solid rgba(255,48,80,.12);border-radius:var(--r);padding:12px 16px;margin:10px 0;display:flex;gap:8px}
.rule-ic{font-size:16px;flex-shrink:0}.rule-t{font-weight:700;color:var(--red);font-size:11.5px}.rule-x{font-size:11px;color:var(--t2);line-height:1.5}

/* Modal */
.mdl-ov{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:30px 16px;overflow-y:auto}
.mdl{background:var(--bg2);border:1px solid var(--bdr);border-radius:14px;width:100%;max-width:700px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.mdl-h{padding:16px 20px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between}
.mdl-t{font-size:16px;font-weight:800}.mdl-x{background:none;border:none;color:var(--t3);font-size:20px;cursor:pointer;padding:4px}
.mdl-b{padding:20px;max-height:70vh;overflow-y:auto}.mdl-f{padding:12px 20px;border-top:1px solid var(--bdr);display:flex;justify-content:flex-end;gap:8px}

/* Measurement table */
.meas-pass{color:var(--green)}.meas-fail{color:var(--red)}.meas-hold{color:var(--amber)}

/* Grid */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}

/* Workflow */
.wf{display:flex;gap:0;padding:14px;overflow-x:auto;align-items:center}
.wf-n{padding:7px 14px;border-radius:16px;font-size:10.5px;font-weight:700;white-space:nowrap;border:2px solid var(--bdr);background:var(--bg3);color:var(--t3)}
.wf-n.done{border-color:var(--green);color:var(--green);background:rgba(0,208,96,.06)}
.wf-n.on{border-color:var(--cyan);color:var(--cyan);background:rgba(0,212,224,.06)}
.wf-n.fail-n{border-color:var(--red);color:var(--red);background:rgba(255,48,80,.06)}
.wf-a{width:24px;height:2px;background:var(--bdr);flex-shrink:0}

/* Mobile */
@media(max-width:900px){.g2,.g3,.form-grid,.form-3{grid-template-columns:1fr}.kpi-grid{grid-template-columns:repeat(2,1fr);gap:8px}.kpi{padding:10px 12px}.kpi-v{font-size:20px}}
@media(max-width:768px){.sb{transform:translateX(-240px)}.sb.open{transform:translateX(0);box-shadow:var(--shadow)}.main{margin-left:0!important}.top-ham{display:block}.cnt{padding:12px}.kpi-grid{grid-template-columns:repeat(2,1fr)}}
`;

// ── Badge/Status Components ──
const B = ({ c, children }) => <span className={`bg bg-${c}`}>{children}</span>;
const SB = ({ s }) => {
  const m = { PASS: "pass", FAIL: "fail", HOLD: "hold", PENDING: "pending", Open: "hold", Closed: "pass", Released: "pass", Rejected: "fail", "On Hold": "hold", "Conditional Release": "cond", Voided: "pending", Draft: "pending", Approved: "ok", Conditional: "cond", Active: "ok", Dispositioned: "pass" };
  return <B c={m[s] || "pending"}>{s}</B>;
};
const TempBadge = ({ val, max, unit = "°C" }) => {
  if (val == null || val === "") return <span className="mono" style={{ color: "var(--t4)" }}>—</span>;
  const v = parseFloat(val);
  const cls = isNaN(v) ? "" : v <= max ? "ok" : v <= 7 ? "warn" : "ng";
  return <span className={`temp-read ${cls}`}>{v.toFixed(1)}{unit}</span>;
};

// ═══════════ PAGES ═══════════

// ── Dashboard ──
function DashboardPage({ state }) {
  const passToday = state.lots.filter(l => l.date === today() && l.result === "PASS").length;
  const holdToday = state.lots.filter(l => l.date === today() && l.result === "HOLD").length;
  const failToday = state.lots.filter(l => l.date === today() && l.result === "FAIL").length;
  const totalToday = state.lots.filter(l => l.date === today()).length;
  const todayTemps = state.lots.filter(l => l.date === today() && l.surfTemp != null).map(l => parseFloat(l.surfTemp)).filter(v => !isNaN(v));
  const avgTemp = todayTemps.length > 0 ? (todayTemps.reduce((a, b) => a + b, 0) / todayTemps.length).toFixed(1) : "—";
  const openHolds = state.holds.filter(h => h.status === "Open" || h.status === "Under Review").length;
  const openCapas = state.capas.filter(c => !c.status.startsWith("Closed")).length;
  const passRate30d = state.lots.length > 0 ? Math.round(100 * state.lots.filter(l => l.result === "PASS").length / state.lots.length) : 0;

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi info"><div className="kpi-v">{totalToday}</div><div className="kpi-l">รับเข้าวันนี้ / Today</div></div>
        <div className="kpi pass"><div className="kpi-v">{passToday}</div><div className="kpi-l">ผ่าน / PASS</div></div>
        <div className="kpi hold"><div className="kpi-v">{holdToday}</div><div className="kpi-l">พัก / HOLD</div></div>
        <div className="kpi fail"><div className="kpi-v">{failToday}</div><div className="kpi-l">ไม่ผ่าน / FAIL</div></div>
        <div className="kpi info"><div className="kpi-v">{avgTemp}°</div><div className="kpi-l">อุณหภูมิเฉลี่ย / Avg Temp</div></div>
        <div className="kpi hold"><div className="kpi-v">{openHolds}</div><div className="kpi-l">Hold เปิด / Open Holds</div></div>
        <div className="kpi fail"><div className="kpi-v">{openCapas}</div><div className="kpi-l">CAPA เปิด / Open CAPA</div></div>
        <div className="kpi pass"><div className="kpi-v">{passRate30d}%</div><div className="kpi-l">อัตราผ่าน 30 วัน</div></div>
      </div>

      <div className="g2">
        <div className="card"><div className="card-h"><div className="card-t">🔔 การแจ้งเตือน / Alerts</div></div>
          {state.alerts.slice(0, 5).map((a, i) => (
            <div key={i} className="alert-item">
              <div className={`alert-dot ${a.sev === "CRITICAL" ? "crit" : "warn"}`} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t1)" }}>{a.title}</div>
                <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>{a.msg}</div>
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--t4)", whiteSpace: "nowrap" }}>{a.at}</div>
            </div>
          ))}
          {state.alerts.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--t4)", fontSize: 12 }}>ไม่มีแจ้งเตือน</div>}
        </div>

        <div className="card"><div className="card-h"><div className="card-t">📦 การรับเข้าล่าสุด / Recent</div></div>
          <div className="tw"><table><thead><tr><th>Ref</th><th>วัตถุดิบ</th><th>Temp</th><th>ผล</th></tr></thead><tbody>
            {state.lots.slice(0, 7).map((l, i) => (
              <tr key={i} className={l.result === "FAIL" ? "fail-row" : l.result === "HOLD" ? "hold-row" : ""}>
                <td className="mono">{l.ref}</td>
                <td style={{ fontSize: 11.5 }}>{MATERIALS.find(m => m.code === l.material)?.name || l.material}</td>
                <td><TempBadge val={l.surfTemp} max={MATERIALS.find(m => m.code === l.material)?.surfMax || 4} /></td>
                <td><SB s={l.result} /></td>
              </tr>
            ))}
          </tbody></table></div>
        </div>
      </div>

      <div className="card"><div className="card-h"><div className="card-t">🏢 ซัพพลายเออร์ที่มีปัญหา / Supplier Issues (90d)</div></div>
        <div className="tw"><table><thead><tr><th>Supplier</th><th>รับทั้งหมด</th><th>FAIL</th><th>HOLD</th><th>Pass Rate</th></tr></thead><tbody>
          {SUPPLIERS.filter(s => s.status === "Approved").map(s => {
            const sLots = state.lots.filter(l => l.supplier === s.id);
            const fCount = sLots.filter(l => l.result === "FAIL").length;
            const hCount = sLots.filter(l => l.result === "HOLD").length;
            const pr = sLots.length > 0 ? Math.round(100 * sLots.filter(l => l.result === "PASS").length / sLots.length) : 100;
            return (
              <tr key={s.id}>
                <td><span className="mono" style={{ marginRight: 6 }}>{s.id}</span>{s.name}</td>
                <td className="mono">{sLots.length}</td>
                <td>{fCount > 0 ? <B c="fail">{fCount}</B> : <span className="mono" style={{ color: "var(--t4)" }}>0</span>}</td>
                <td>{hCount > 0 ? <B c="hold">{hCount}</B> : <span className="mono" style={{ color: "var(--t4)" }}>0</span>}</td>
                <td><span className="mono" style={{ color: pr >= 95 ? "var(--green)" : pr >= 80 ? "var(--amber)" : "var(--red)", fontWeight: 600 }}>{pr}%</span></td>
              </tr>
            );
          })}
        </tbody></table></div>
      </div>

      <div className="rule"><div className="rule-ic">⚠️</div><div><div className="rule-t">กฎ Food Safety ที่ใช้งาน</div><div className="rule-x">
        อุณหภูมิผิว &gt; spec → HOLD | &gt; 7°C → FAIL · กลิ่นผิดปกติ/เมือก/สิ่งแปลกปลอม → FAIL · บรรจุภัณฑ์ชำรุด → FAIL · ฉลากไม่มี → FAIL · FAIL ทุกรายการ → สร้าง CAPA อัตโนมัติ · HOLD → ต้อง Disposition โดย QA
      </div></div></div>
    </div>
  );
}

// ── New Receiving Form ──
function NewReceivingPage({ state, onBack }) {
  const [form, setForm] = useState({
    date: today(), time: nowTime(), supplier: "", doInvoice: "", vehiclePlate: "", driverName: "",
    material: "", supplierLot: "", quantity: "", unit: "kg",
    prodDate: "", expDate: "",
    vehicleTemp: "", surfaceTemp: "", coreTemp: "",
    visual: "ปกติ", odor: "ปกติ", slime: "ไม่พบ", color: "ปกติ",
    packaging: "สมบูรณ์", labelCond: "ถูกต้อง", foreignMatter: "ไม่พบ",
    coaReceived: false, remarks: "", inspector: "",
  });
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const mat = MATERIALS.find(m => m.code === form.material);

  const doValidate = () => {
    if (!form.supplier || !form.material || !form.quantity || !form.inspector) {
      alert("กรุณากรอกข้อมูลที่จำเป็น (ซัพพลายเออร์, วัตถุดิบ, จำนวน, ผู้ตรวจ)");
      return;
    }
    const v = validate(form, mat);
    setResult(v);
    setShowResult(true);
  };

  const doSubmit = () => {
    if (!result) return;
    const ref = genRef("RCV");
    const intLot = genRef("L");
    const newLot = {
      ref, date: form.date, time: form.time, supplier: form.supplier,
      material: form.material, supplierLot: form.supplierLot, intLot,
      qty: form.quantity, unit: form.unit, surfTemp: form.surfaceTemp,
      coreTemp: form.coreTemp, vehTemp: form.vehicleTemp,
      result: result.overall, status: result.overall === "PASS" ? "Released" : result.overall === "FAIL" ? "Rejected" : "On Hold",
      measurements: result.results, fails: result.fails, holds: result.holds,
      inspector: form.inspector, remarks: form.remarks,
    };
    state.addLot(newLot);

    if (result.overall === "FAIL") {
      const capaId = genRef("CAPA");
      state.addCapa({
        id: capaId, source: "RM Receiving", ref, type: "Corrective",
        desc: `RM FAIL: ${mat?.name || form.material} — ${result.fails.join(", ")}`,
        priority: result.fails.some(f => f.includes("CRITICAL") || f.includes("FOREIGN") || f.includes("SLIME")) ? "CRITICAL" : "HIGH",
        status: "Open", target: (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split("T")[0]; })(),
      });
      state.addAlert({
        title: `❌ RM FAIL: ${ref}`, msg: `${mat?.name} — ${result.fails.join(", ")}`,
        sev: "CRITICAL", at: today(),
      });
    }
    if (result.overall === "HOLD") {
      const holdRef = genRef("HOLD");
      state.addHold({
        ref: holdRef, rcvRef: ref, material: form.material, supplier: form.supplier,
        reason: result.holds.join(", "), risk: "MEDIUM", status: "Open",
        disposition: "Pending", date: today(),
      });
      state.addAlert({
        title: `⏸️ RM HOLD: ${holdRef}`, msg: `${mat?.name} — ${result.holds.join(", ")} — QA ต้อง disposition`,
        sev: "WARNING", at: today(),
      });
    }

    setShowResult(false);
    setResult(null);
    setForm({ date: today(), time: nowTime(), supplier: "", doInvoice: "", vehiclePlate: "", driverName: "", material: "", supplierLot: "", quantity: "", unit: "kg", prodDate: "", expDate: "", vehicleTemp: "", surfaceTemp: "", coreTemp: "", visual: "ปกติ", odor: "ปกติ", slime: "ไม่พบ", color: "ปกติ", packaging: "สมบูรณ์", labelCond: "ถูกต้อง", foreignMatter: "ไม่พบ", coaReceived: false, remarks: "", inspector: "" });
    onBack();
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}><button className="btn btn-o" onClick={onBack}>← กลับ / Back</button></div>

      <div className="card"><div className="card-h"><div className="card-t">📋 บันทึกการรับเข้าวัตถุดิบ / RM Receiving Record</div></div>
        <div className="card-b">
          <div className="form-section">📅 ข้อมูลการรับเข้า / Receiving Info</div>
          <div className="form-3">
            <div className="fg"><label className="fl fl-req">วันที่รับ / Date</label><input className="fi" type="date" value={form.date} onChange={e => u("date", e.target.value)} /></div>
            <div className="fg"><label className="fl fl-req">เวลา / Time</label><input className="fi fi-mono" type="time" value={form.time} onChange={e => u("time", e.target.value)} /></div>
            <div className="fg"><label className="fl fl-req">ผู้ตรวจ / Inspector</label><input className="fi" value={form.inspector} onChange={e => u("inspector", e.target.value)} placeholder="ชื่อผู้ตรวจ" /></div>
          </div>

          <div className="form-section">🏢 ข้อมูลซัพพลายเออร์ / Supplier</div>
          <div className="form-grid">
            <div className="fg"><label className="fl fl-req">ซัพพลายเออร์ / Supplier</label><select className="fi" value={form.supplier} onChange={e => u("supplier", e.target.value)}><option value="">— เลือกซัพพลายเออร์ —</option>{SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}</select></div>
            <div className="fg"><label className="fl">เลข DO/Invoice</label><input className="fi fi-mono" value={form.doInvoice} onChange={e => u("doInvoice", e.target.value)} placeholder="DO-XXXXX" /></div>
            <div className="fg"><label className="fl">ทะเบียนรถ / Vehicle</label><input className="fi fi-mono" value={form.vehiclePlate} onChange={e => u("vehiclePlate", e.target.value)} /></div>
            <div className="fg"><label className="fl">ชื่อคนขับ / Driver</label><input className="fi" value={form.driverName} onChange={e => u("driverName", e.target.value)} /></div>
          </div>

          <div className="form-section">📦 ข้อมูลวัตถุดิบ / Material</div>
          <div className="form-grid">
            <div className="fg"><label className="fl fl-req">วัตถุดิบ / Material</label><select className="fi" value={form.material} onChange={e => u("material", e.target.value)}><option value="">— เลือกวัตถุดิบ —</option>{MATERIALS.map(m => <option key={m.code} value={m.code}>{m.code} — {m.name} ({m.en})</option>)}</select>
              {mat && <div className="form-hint">Spec: อุณหภูมิผิว ≤ {mat.surfMax}°C · แกนกลาง ≤ {mat.coreMax}°C · pH {mat.phMin}–{mat.phMax} · Shelf: {mat.shelf}d · COA: {mat.coaReq ? "ต้องมี" : "ไม่ต้อง"}</div>}
            </div>
            <div className="fg"><label className="fl">Lot/Batch ซัพพลายเออร์</label><input className="fi fi-mono" value={form.supplierLot} onChange={e => u("supplierLot", e.target.value)} /></div>
            <div className="fg"><label className="fl fl-req">จำนวน / Quantity</label><input className="fi fi-mono" type="number" step="0.1" value={form.quantity} onChange={e => u("quantity", e.target.value)} placeholder="0.0" /></div>
            <div className="fg"><label className="fl">หน่วย / Unit</label><select className="fi" value={form.unit} onChange={e => u("unit", e.target.value)}><option>kg</option><option>กิโลกรัม</option><option>กล่อง</option><option>ถุง</option></select></div>
            <div className="fg"><label className="fl">วันผลิต / Prod Date</label><input className="fi" type="date" value={form.prodDate} onChange={e => u("prodDate", e.target.value)} /></div>
            <div className="fg"><label className="fl">วันหมดอายุ / Exp Date</label><input className="fi" type="date" value={form.expDate} onChange={e => u("expDate", e.target.value)} /></div>
          </div>

          <div className="form-section">🌡️ อุณหภูมิ / Temperature</div>
          <div className="form-3">
            <div className="fg"><label className="fl fl-req">อุณหภูมิรถ / Vehicle (°C)</label><input className="fi fi-mono" type="number" step="0.1" value={form.vehicleTemp} onChange={e => u("vehicleTemp", e.target.value)} placeholder="0.0" />
              {mat && <div className="form-hint">Spec: 0 – {mat.vehMax} °C</div>}</div>
            <div className="fg"><label className="fl fl-req">อุณหภูมิผิว / Surface (°C)</label><input className={`fi fi-mono ${form.surfaceTemp && parseFloat(form.surfaceTemp) > (mat?.surfMax || 4) ? "fi-err" : ""}`} type="number" step="0.1" value={form.surfaceTemp} onChange={e => u("surfaceTemp", e.target.value)} placeholder="0.0" />
              {mat && <div className="form-hint">Spec: -1 – {mat.surfMax} °C{" "}{form.surfaceTemp && parseFloat(form.surfaceTemp) > mat.surfMax ? <span style={{ color: "var(--red)", fontWeight: 700 }}>⚠️ เกินค่า!</span> : ""}</div>}</div>
            <div className="fg"><label className="fl fl-req">อุณหภูมิแกนกลาง / Core (°C)</label><input className={`fi fi-mono ${form.coreTemp && parseFloat(form.coreTemp) > (mat?.coreMax || 7) ? "fi-err" : ""}`} type="number" step="0.1" value={form.coreTemp} onChange={e => u("coreTemp", e.target.value)} placeholder="0.0" />
              {mat && <div className="form-hint">Spec: -1 – {mat.coreMax} °C{" "}{form.coreTemp && parseFloat(form.coreTemp) > mat.coreMax ? <span style={{ color: "var(--red)", fontWeight: 700 }}>⚠️ เกินค่า!</span> : ""}</div>}</div>
          </div>

          <div className="form-section">👁️ การตรวจสอบทางกายภาพ / Physical & Sensory</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">ลักษณะปรากฏ / Visual</label><select className="fi" value={form.visual} onChange={e => u("visual", e.target.value)}><option>ปกติ</option><option>ผิดปกติ</option></select></div>
            <div className="fg"><label className="fl">กลิ่น / Odor</label><select className="fi" value={form.odor} onChange={e => u("odor", e.target.value)}><option>ปกติ</option><option>ผิดปกติ</option></select>{form.odor === "ผิดปกติ" && <div className="form-hint" style={{ color: "var(--red)", fontWeight: 700 }}>⚠️ กลิ่นผิดปกติ = FAIL</div>}</div>
            <div className="fg"><label className="fl">เมือก/ลื่น / Slime</label><select className="fi" value={form.slime} onChange={e => u("slime", e.target.value)}><option>ไม่พบ</option><option>พบ</option></select>{form.slime === "พบ" && <div className="form-hint" style={{ color: "var(--red)", fontWeight: 700 }}>⚠️ พบเมือก = FAIL</div>}</div>
            <div className="fg"><label className="fl">สี / Color</label><select className="fi" value={form.color} onChange={e => u("color", e.target.value)}><option>ปกติ</option><option>ผิดปกติ</option></select></div>
            <div className="fg"><label className="fl">บรรจุภัณฑ์ / Packaging</label><select className="fi" value={form.packaging} onChange={e => u("packaging", e.target.value)}><option>สมบูรณ์</option><option>ชำรุด</option></select>{form.packaging === "ชำรุด" && <div className="form-hint" style={{ color: "var(--red)", fontWeight: 700 }}>⚠️ บรรจุภัณฑ์ชำรุด = FAIL</div>}</div>
            <div className="fg"><label className="fl">ฉลาก / Label</label><select className="fi" value={form.labelCond} onChange={e => u("labelCond", e.target.value)}><option>ถูกต้อง</option><option>ไม่ถูกต้อง</option><option>ไม่มี</option></select>{form.labelCond === "ไม่มี" && <div className="form-hint" style={{ color: "var(--red)", fontWeight: 700 }}>⚠️ ไม่มีฉลาก = FAIL</div>}</div>
            <div className="fg"><label className="fl">สิ่งแปลกปลอม / Foreign Matter</label><select className="fi" value={form.foreignMatter} onChange={e => u("foreignMatter", e.target.value)}><option>ไม่พบ</option><option>พบ</option></select>{form.foreignMatter === "พบ" && <div className="form-hint" style={{ color: "var(--red)", fontWeight: 700 }}>🚨 พบสิ่งแปลกปลอม = FAIL (Food Safety)</div>}</div>
            <div className="fg"><label className="fl">COA ได้รับ</label><select className="fi" value={form.coaReceived ? "ได้รับ" : "ไม่ได้รับ"} onChange={e => u("coaReceived", e.target.value === "ได้รับ")}><option>ได้รับ</option><option>ไม่ได้รับ</option></select>{mat?.coaReq && !form.coaReceived && <div className="form-hint" style={{ color: "var(--amber)" }}>⚠️ COA ต้องมี → HOLD</div>}</div>
          </div>

          <div className="form-section">📎 เอกสาร & หมายเหตุ / Documents & Notes</div>
          <div className="fg"><label className="fl">หมายเหตุ / Remarks</label><textarea className="fi" value={form.remarks} onChange={e => u("remarks", e.target.value)} placeholder="บันทึกเพิ่มเติม..." /></div>
          <div className="fg"><label className="fl">แนบเอกสาร / Attachments (R2)</label>
            <div style={{ padding: 16, border: "1px dashed var(--bdr2)", borderRadius: "var(--r)", textAlign: "center", color: "var(--t4)", fontSize: 12 }}>📁 ลากไฟล์มาวาง หรือคลิกเพื่อเลือก<br /><span style={{ fontSize: 10 }}>รองรับ: JPG, PNG, PDF — สูงสุด 10MB — บันทึกลง Cloudflare R2</span></div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            <button className="btn btn-o btn-lg" onClick={onBack}>ยกเลิก</button>
            <button className="btn btn-p btn-lg" onClick={doValidate}>🔍 ตรวจสอบ & บันทึก</button>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && result && (
        <div className="mdl-ov" onClick={() => setShowResult(false)}>
          <div className="mdl" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="mdl-h"><div className="mdl-t">ผลการตรวจสอบ / Validation Result</div><button className="mdl-x" onClick={() => setShowResult(false)}>×</button></div>
            <div className="mdl-b">
              <div className={`result-box ${result.overall.toLowerCase()}`}>
                <div className="result-icon">{result.overall === "PASS" ? "✅" : result.overall === "FAIL" ? "❌" : "⏸️"}</div>
                <div className="result-label">{result.overall}</div>
                <div className="result-msg">
                  {result.overall === "PASS" && "ผ่านการตรวจสอบทั้งหมด — ปล่อยเข้าจัดเก็บ"}
                  {result.overall === "FAIL" && `ไม่ผ่าน: ${result.fails.join(", ")} — สร้าง CAPA อัตโนมัติ`}
                  {result.overall === "HOLD" && `พัก: ${result.holds.join(", ")} — ต้อง disposition โดย QA`}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "var(--t2)" }}>รายละเอียดการตรวจ / Measurements</div>
                <table><thead><tr><th>พารามิเตอร์</th><th>Spec</th><th>ค่าที่วัด</th><th>ผล</th></tr></thead><tbody>
                  {result.results.map((r, i) => (
                    <tr key={i} className={r.status === "FAIL" ? "fail-row" : r.status === "HOLD" ? "hold-row" : ""}>
                      <td><span style={{ fontSize: 11.5 }}>{r.label}</span>{r.crit && <span style={{ color: "var(--red)", fontSize: 9, marginLeft: 4 }}>●</span>}</td>
                      <td className="mono" style={{ fontSize: 11, color: "var(--t3)" }}>{r.spec}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{r.val}</td>
                      <td><SB s={r.status} />{r.dev && <span style={{ fontSize: 10, color: "var(--red)", marginLeft: 4 }}>+{r.dev}</span>}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>

              {result.overall === "FAIL" && <div className="rule" style={{ marginTop: 14 }}><div className="rule-ic">🚨</div><div><div className="rule-t">CAPA จะถูกสร้างอัตโนมัติ</div><div className="rule-x">เหตุผล: {result.fails.join(", ")} — กำหนดเสร็จ 14 วัน</div></div></div>}
              {result.overall === "HOLD" && <div className="rule" style={{ marginTop: 14, background: "rgba(255,160,32,.03)", borderColor: "rgba(255,160,32,.12)" }}><div className="rule-ic">⏸️</div><div><div className="rule-t" style={{ color: "var(--amber)" }}>สร้าง Hold Record อัตโนมัติ</div><div className="rule-x">QA ต้อง Disposition: Accept by Concession / Reject / Return / Rework / Await QA Decision</div></div></div>}
            </div>
            <div className="mdl-f">
              <button className="btn btn-o" onClick={() => setShowResult(false)}>แก้ไข / Edit</button>
              <button className={`btn ${result.overall === "FAIL" ? "btn-d" : result.overall === "HOLD" ? "btn-w" : "btn-g"}`} onClick={doSubmit}>
                {result.overall === "PASS" ? "✅ ยืนยัน ปล่อยเข้าจัดเก็บ" : result.overall === "FAIL" ? "❌ ยืนยัน ปฏิเสธ & สร้าง CAPA" : "⏸️ ยืนยัน Hold & สร้าง Hold Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Records ──
function RecordsPage({ state, onView }) {
  const [fResult, setFResult] = useState("All");
  const [fSupplier, setFSupplier] = useState("All");
  const [search, setSearch] = useState("");
  const filtered = state.lots.filter(l => {
    if (fResult !== "All" && l.result !== fResult) return false;
    if (fSupplier !== "All" && l.supplier !== fSupplier) return false;
    if (search && !l.ref.toLowerCase().includes(search.toLowerCase()) && !(MATERIALS.find(m => m.code === l.material)?.name || "").includes(search)) return false;
    return true;
  });
  return (
    <div className="card">
      <div className="card-h"><div className="card-t">📋 บันทึกการรับเข้า / Records ({filtered.length})</div>
        <div className="card-a"><div className="fbar">
          <select value={fResult} onChange={e => setFResult(e.target.value)}><option value="All">ทั้งหมด</option><option>PASS</option><option>FAIL</option><option>HOLD</option></select>
          <select value={fSupplier} onChange={e => setFSupplier(e.target.value)}><option value="All">ซัพพลายเออร์ทั้งหมด</option>{SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}</select>
          <input placeholder="ค้นหา Ref/วัตถุดิบ..." value={search} onChange={e => setSearch(e.target.value)} />
        </div></div>
      </div>
      <div className="tw"><table><thead><tr><th>Ref</th><th>วันที่</th><th>ซัพพลายเออร์</th><th>วัตถุดิบ</th><th>จำนวน</th><th>ผิวหน้า°C</th><th>แกนกลาง°C</th><th>ผล</th><th>สถานะ</th></tr></thead><tbody>
        {filtered.map((l, i) => {
          const m = MATERIALS.find(mm => mm.code === l.material);
          return (
            <tr key={i} className={l.result === "FAIL" ? "fail-row" : l.result === "HOLD" ? "hold-row" : ""} style={{ cursor: "pointer" }} onClick={() => onView && onView(l)}>
              <td className="mono">{l.ref}</td>
              <td>{l.date}</td>
              <td style={{ fontSize: 11 }}>{SUPPLIERS.find(s => s.id === l.supplier)?.name || l.supplier}</td>
              <td>{m?.name || l.material}</td>
              <td className="mono">{l.qty} {l.unit}</td>
              <td><TempBadge val={l.surfTemp} max={m?.surfMax || 4} /></td>
              <td><TempBadge val={l.coreTemp} max={m?.coreMax || 7} /></td>
              <td><SB s={l.result} /></td>
              <td><SB s={l.status} /></td>
            </tr>
          );
        })}
      </tbody></table></div>
    </div>
  );
}

// ── Hold Management ──
function HoldPage({ state }) {
  const [dispModal, setDispModal] = useState(null);
  const [disp, setDisp] = useState({ decision: "", reason: "", conditions: "" });

  const doDisposition = () => {
    if (!disp.decision) return;
    state.updateHold(dispModal.ref, disp.decision);
    setDispModal(null);
    setDisp({ decision: "", reason: "", conditions: "" });
  };

  return (
    <div>
      <div className="card"><div className="card-h"><div className="card-t">⏸️ Hold Workflow</div></div>
        <div style={{ padding: 14 }}><div className="wf"><div className="wf-n done">รับเข้า</div><div className="wf-a" /><div className="wf-n done">ตรวจสอบ</div><div className="wf-a" /><div className="wf-n on">HOLD</div><div className="wf-a" /><div className="wf-n">QA Review</div><div className="wf-a" /><div className="wf-n">Disposition</div><div className="wf-a" /><div className="wf-n">Accept/Reject</div></div></div></div>
      <div className="card"><div className="card-h"><div className="card-t">📋 Hold Records ({state.holds.length})</div></div>
        <div className="tw"><table><thead><tr><th>Hold Ref</th><th>RCV Ref</th><th>วัตถุดิบ</th><th>เหตุผล</th><th>ความเสี่ยง</th><th>Disposition</th><th>สถานะ</th><th>ดำเนินการ</th></tr></thead><tbody>
          {state.holds.map((h, i) => (
            <tr key={i}>
              <td className="mono">{h.ref}</td>
              <td className="mono">{h.rcvRef}</td>
              <td>{MATERIALS.find(m => m.code === h.material)?.name || h.material}</td>
              <td style={{ fontSize: 11, maxWidth: 150 }}>{h.reason}</td>
              <td><B c={h.risk?.toLowerCase() || "medium"}>{h.risk}</B></td>
              <td><SB s={h.disposition} /></td>
              <td><SB s={h.status} /></td>
              <td>{h.status === "Open" && <button className="btn btn-p btn-sm" onClick={() => setDispModal(h)}>Disposition</button>}</td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
      <div className="rule"><div className="rule-ic">⚠️</div><div><div className="rule-t">Hold Disposition Rules</div><div className="rule-x">ต้อง disposition โดย QA Manager · ตัวเลือก: Accept by Concession / Reject / Return to Supplier / Rework / Await QA Decision · Reject/Return → สร้าง CAPA อัตโนมัติ · ไม่สามารถปล่อยวัตถุดิบโดยไม่ผ่าน QA</div></div></div>

      {dispModal && (
        <div className="mdl-ov" onClick={() => setDispModal(null)}>
          <div className="mdl" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="mdl-h"><div className="mdl-t">⚖️ Disposition — {dispModal.ref}</div><button className="mdl-x" onClick={() => setDispModal(null)}>×</button></div>
            <div className="mdl-b">
              <div className="dr"><div className="dr-l">Hold Ref</div><div className="dr-v mono">{dispModal.ref}</div></div>
              <div className="dr"><div className="dr-l">เหตุผล</div><div className="dr-v">{dispModal.reason}</div></div>
              <div style={{ marginTop: 16 }}>
                <div className="fg"><label className="fl fl-req">การตัดสินใจ / Disposition</label><select className="fi" value={disp.decision} onChange={e => setDisp(p => ({ ...p, decision: e.target.value }))}>
                  <option value="">— เลือก —</option>
                  <option value="Accept by Concession">ยอมรับแบบมีเงื่อนไข (Accept by Concession)</option>
                  <option value="Use As Is">ใช้ตามสภาพ (Use As Is)</option>
                  <option value="Reject">ปฏิเสธ (Reject)</option>
                  <option value="Return to Supplier">คืนซัพพลายเออร์ (Return)</option>
                  <option value="Rework">แก้ไข (Rework)</option>
                  <option value="Await QA Decision">รอ QA ตัดสินใจ</option>
                </select></div>
                <div className="fg"><label className="fl">เหตุผล / Reason</label><textarea className="fi" value={disp.reason} onChange={e => setDisp(p => ({ ...p, reason: e.target.value }))} /></div>
                {disp.decision === "Accept by Concession" && <div className="fg"><label className="fl fl-req">เงื่อนไข / Conditions</label><textarea className="fi" value={disp.conditions} onChange={e => setDisp(p => ({ ...p, conditions: e.target.value }))} placeholder="ระบุเงื่อนไขการยอมรับ..." /></div>}
                {(disp.decision === "Reject" || disp.decision === "Return to Supplier") && <div className="rule"><div className="rule-ic">🚨</div><div><div className="rule-t">จะสร้าง CAPA อัตโนมัติ</div><div className="rule-x">การปฏิเสธ/คืนสินค้า จะสร้าง CAPA สำหรับติดตามการแก้ไข</div></div></div>}
              </div>
            </div>
            <div className="mdl-f"><button className="btn btn-o" onClick={() => setDispModal(null)}>ยกเลิก</button><button className="btn btn-p" onClick={doDisposition}>✅ ยืนยัน Disposition</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Specs ──
function SpecsPage() {
  return (
    <div className="card"><div className="card-h"><div className="card-t">📐 RM Specifications / ข้อกำหนดวัตถุดิบ</div></div>
      <div className="tw"><table><thead><tr><th>Material</th><th>ชื่อ</th><th>Ver</th><th>ผิวหน้า °C</th><th>แกนกลาง °C</th><th>รถ °C</th><th>pH</th><th>สี</th><th>กลิ่น</th><th>Status</th></tr></thead><tbody>
        {SPECS.map((s, i) => (
          <tr key={i}>
            <td className="mono">{s.material}</td>
            <td>{s.name}</td>
            <td className="mono">v{s.version}</td>
            <td className="mono">{s.surfMin} – {s.surfMax}</td>
            <td className="mono">{s.coreMin} – {s.coreMax}</td>
            <td className="mono">{s.vehMin} – {s.vehMax}</td>
            <td className="mono">{s.phMin} – {s.phMax}</td>
            <td style={{ fontSize: 11, maxWidth: 120 }}>{s.color}</td>
            <td style={{ fontSize: 11, maxWidth: 100 }}>{s.odor}</td>
            <td><SB s={s.status} /></td>
          </tr>
        ))}
      </tbody></table></div>
    </div>
  );
}

// ── CAPA list ──
function CAPAListPage({ state }) {
  return (
    <div className="card"><div className="card-h"><div className="card-t">🔄 CAPA — Corrective Actions from RM Receiving</div></div>
      <div className="tw"><table><thead><tr><th>CAPA ID</th><th>Source Ref</th><th>Description</th><th>Priority</th><th>Target</th><th>Status</th></tr></thead><tbody>
        {state.capas.map((c, i) => (
          <tr key={i}><td className="mono">{c.id}</td><td className="mono">{c.ref}</td><td style={{ fontSize: 11.5, maxWidth: 220 }}>{c.desc}</td><td><B c={c.priority?.toLowerCase() || "medium"}>{c.priority}</B></td><td>{c.target}</td><td><SB s={c.status} /></td></tr>
        ))}
      </tbody></table></div>
      {state.capas.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--t4)", fontSize: 13 }}>ไม่มี CAPA</div>}
    </div>
  );
}

// ═══════════ APP STATE ═══════════
function useAppState() {
  const [lots, setLots] = useState([
    { ref: "RCV-20260515-001", date: daysAgo(0), time: "07:30", supplier: "SP0001", material: "RM0001", supplierLot: "BT-2605-A01", intLot: "L-20260515-001", qty: "250", unit: "kg", surfTemp: "2.8", coreTemp: "4.2", vehTemp: "3.1", result: "PASS", status: "Released", inspector: "QA-01", measurements: [], fails: [], holds: [] },
    { ref: "RCV-20260515-002", date: daysAgo(0), time: "08:15", supplier: "SP0002", material: "RM0005", supplierLot: "BT-2605-C01", intLot: "L-20260515-002", qty: "180", unit: "kg", surfTemp: "3.5", coreTemp: "5.1", vehTemp: "2.9", result: "PASS", status: "Released", inspector: "QA-01", measurements: [], fails: [], holds: [] },
    { ref: "RCV-20260515-003", date: daysAgo(0), time: "09:00", supplier: "SP0003", material: "RM0001", supplierLot: "SL-2605-P03", intLot: "L-20260515-003", qty: "300", unit: "kg", surfTemp: "5.8", coreTemp: "8.2", vehTemp: "5.0", result: "HOLD", status: "On Hold", inspector: "QA-02", measurements: [], fails: [], holds: ["SURFACE_TEMP", "CORE_TEMP"] },
    { ref: "RCV-20260514-001", date: daysAgo(1), time: "07:45", supplier: "SP0001", material: "RM0002", supplierLot: "BT-2604-F01", intLot: "L-20260514-001", qty: "120", unit: "kg", surfTemp: "2.1", coreTemp: "3.8", vehTemp: "2.5", result: "PASS", status: "Released", inspector: "QA-01", measurements: [], fails: [], holds: [] },
    { ref: "RCV-20260514-002", date: daysAgo(1), time: "10:30", supplier: "SP0034", material: "RM0001", supplierLot: "EK-2604-M01", intLot: "L-20260514-002", qty: "200", unit: "kg", surfTemp: "7.5", coreTemp: "9.1", vehTemp: "6.0", result: "FAIL", status: "Rejected", inspector: "QA-03", measurements: [], fails: ["SURFACE_TEMP_CRITICAL", "CORE_TEMP_CRITICAL"], holds: [] },
    { ref: "RCV-20260513-001", date: daysAgo(2), time: "08:00", supplier: "SP0001", material: "RM0001", supplierLot: "BT-2603-A05", intLot: "L-20260513-001", qty: "280", unit: "kg", surfTemp: "3.0", coreTemp: "4.5", vehTemp: "2.8", result: "PASS", status: "Released", inspector: "QA-01", measurements: [], fails: [], holds: [] },
    { ref: "RCV-20260513-002", date: daysAgo(2), time: "11:00", supplier: "SP0004", material: "RM0001", supplierLot: "FJ-2603-P01", intLot: "L-20260513-002", qty: "150", unit: "kg", surfTemp: "2.5", coreTemp: "4.0", vehTemp: "2.0", result: "PASS", status: "Released", inspector: "QA-02", measurements: [], fails: [], holds: [] },
  ]);
  const [holds, setHolds] = useState([
    { ref: "HOLD-20260515-001", rcvRef: "RCV-20260515-003", material: "RM0001", supplier: "SP0003", reason: "SURFACE_TEMP, CORE_TEMP", risk: "MEDIUM", status: "Open", disposition: "Pending", date: daysAgo(0) },
  ]);
  const [capas, setCapas] = useState([
    { id: "CAPA-20260514-001", source: "RM Receiving", ref: "RCV-20260514-002", type: "Corrective", desc: "RM FAIL: สะโพกหมู — SURFACE_TEMP_CRITICAL, CORE_TEMP_CRITICAL", priority: "CRITICAL", status: "Open", target: daysAgo(-14) },
  ]);
  const [alerts, setAlerts] = useState([
    { title: "❌ RM FAIL: RCV-20260514-002", msg: "สะโพกหมู จาก SP0034 — อุณหภูมิเกินค่าวิกฤต", sev: "CRITICAL", at: daysAgo(1) },
    { title: "⏸️ RM HOLD: HOLD-20260515-001", msg: "สะโพกหมู จาก SP0003 — อุณหภูมิเกิน spec → QA ต้อง disposition", sev: "WARNING", at: daysAgo(0) },
    { title: "🔄 CAPA สร้างอัตโนมัติ: CAPA-20260514-001", msg: "แก้ไขปัญหาอุณหภูมิจาก SP0034", sev: "WARNING", at: daysAgo(1) },
  ]);

  const addLot = (lot) => setLots(p => [lot, ...p]);
  const addHold = (h) => setHolds(p => [h, ...p]);
  const addCapa = (c) => setCapas(p => [c, ...p]);
  const addAlert = (a) => setAlerts(p => [a, ...p]);
  const updateHold = (ref, decision) => setHolds(p => p.map(h => h.ref === ref ? { ...h, disposition: decision, status: "Dispositioned" } : h));

  return { lots, holds, capas, alerts, addLot, addHold, addCapa, addAlert, updateHold };
}

// ═══════════ NAV ═══════════
const NAV = [
  { label: "RM Receiving", items: [
    { k: "dash", ic: "📊", l: "แดชบอร์ด / Dashboard" },
    { k: "new", ic: "📝", l: "บันทึกรับเข้า / New" },
    { k: "records", ic: "📋", l: "รายการทั้งหมด / Records" },
    { k: "hold", ic: "⏸️", l: "Hold / Disposition", badge: true },
    { k: "specs", ic: "📐", l: "ข้อกำหนด / Specs" },
  ]},
  { label: "Quality", items: [
    { k: "capa", ic: "🔄", l: "CAPA", badge: true },
  ]},
];

const TITLES = { dash: "แดชบอร์ด RM Receiving", new: "บันทึกรับเข้าวัตถุดิบ", records: "รายการรับเข้า", hold: "Hold & Disposition", specs: "ข้อกำหนดวัตถุดิบ", capa: "CAPA — RM Receiving" };

// ═══════════ MAIN APP ═══════════
export default function App() {
  const [page, setPage] = useState("dash");
  const [lang, setLang] = useState("th");
  const [sbOpen, setSbOpen] = useState(false);
  const state = useAppState();

  const nav = (k) => { setPage(k); setSbOpen(false); };
  const openHoldCount = state.holds.filter(h => h.status === "Open").length;
  const openCapaCount = state.capas.filter(c => !c.status.startsWith("Closed")).length;

  return (
    <LangCtx.Provider value={{ lang, set: setLang }}>
      <style>{CSS}</style>
      <div className="app">
        <aside className={`sb ${sbOpen ? "open" : "shut"}`}>
          <div className="sb-top"><div className="sb-icon">RM</div><div><h2>Smart QA Factory</h2><small>RM Receiving Module</small></div></div>
          <nav className="sb-nav">
            {NAV.map(sec => (
              <div key={sec.label}>
                <div className="sb-section">{sec.label}</div>
                {sec.items.map(it => (
                  <div key={it.k} className={`sb-item ${page === it.k ? "on" : ""}`} onClick={() => nav(it.k)}>
                    <span className="sb-ic">{it.ic}</span><span>{it.l}</span>
                    {it.badge && it.k === "hold" && openHoldCount > 0 && <span className="sb-badge">{openHoldCount}</span>}
                    {it.badge && it.k === "capa" && openCapaCount > 0 && <span className="sb-badge">{openCapaCount}</span>}
                  </div>
                ))}
              </div>
            ))}
          </nav>
          <div className="sb-foot">
            <span style={{ fontSize: 14 }}>🏭</span>
            <div><div style={{ fontWeight: 600, color: "var(--t2)", fontSize: 10 }}>HACCP · ISO 22000 · GMP</div><div style={{ fontSize: 9, color: "var(--t4)" }}>เนื้อสัตว์แปรรูป</div></div>
          </div>
        </aside>

        {sbOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 99 }} onClick={() => setSbOpen(false)} />}

        <div className="main">
          <header className="top">
            <button className="top-ham" onClick={() => setSbOpen(!sbOpen)}>☰</button>
            <div className="top-t">{TITLES[page] || "RM Receiving"}</div>
            <div className="top-r">
              <button className="lang-btn" onClick={() => setLang(l => l === "th" ? "en" : "th")}>{lang === "th" ? "🇬🇧 EN" : "🇹🇭 ไทย"}</button>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#005060,#00d4e0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>QA</div>
            </div>
          </header>
          <div className="cnt">
            {page === "dash" && <DashboardPage state={state} />}
            {page === "new" && <NewReceivingPage state={state} onBack={() => nav("dash")} />}
            {page === "records" && <RecordsPage state={state} />}
            {page === "hold" && <HoldPage state={state} />}
            {page === "specs" && <SpecsPage />}
            {page === "capa" && <CAPAListPage state={state} />}
          </div>
        </div>
      </div>
    </LangCtx.Provider>
  );
}
