import { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// SMART QA FACTORY SYSTEM — Complete Enterprise Application
// HACCP · ISO 22000 · FSSC 22000 · GMP Thailand · Thai FDA
// ═══════════════════════════════════════════════════════════════

// ─── Contexts ───
const AuthContext = createContext(null);
const LangContext = createContext({ lang: "en", setLang: () => {} });
const useAuth = () => useContext(AuthContext);
const useLang = () => useContext(LangContext);

// ─── i18n ───
const i18n = {
  dashboard:{en:"Dashboard",th:"แดชบอร์ด"},suppliers:{en:"Suppliers",th:"ซัพพลายเออร์"},materials:{en:"Materials",th:"วัตถุดิบ"},
  finishedGoods:{en:"Finished Goods",th:"สินค้าสำเร็จรูป"},processes:{en:"Processes",th:"กระบวนการ"},equipment:{en:"Equipment",th:"เครื่องมือ"},
  incomingQC:{en:"Incoming QC",th:"ตรวจรับวัตถุดิบ"},ccpMonitoring:{en:"CCP Monitoring",th:"ติดตาม CCP"},metalDetector:{en:"Metal Detector",th:"เครื่องตรวจโลหะ"},
  ncr:{en:"NCR",th:"ใบ NCR"},capa:{en:"CAPA",th:"CAPA"},complaints:{en:"Complaints",th:"ข้อร้องเรียน"},traceability:{en:"Traceability",th:"การสอบกลับ"},
  documents:{en:"Documents",th:"ควบคุมเอกสาร"},hygiene:{en:"Hygiene & GHP",th:"สุขลักษณะ GHP"},cleaning:{en:"Cleaning",th:"ทำความสะอาด"},
  alerts:{en:"Alerts",th:"แจ้งเตือน"},auditTrail:{en:"Audit Trail",th:"บันทึกตรวจสอบ"},receiving:{en:"Receiving",th:"การรับเข้า"},
  fgRelease:{en:"FG Release",th:"ปล่อยสินค้า"},supplierApproval:{en:"Supplier Approval",th:"อนุมัติซัพพลายเออร์"},
  login:{en:"Login",th:"เข้าสู่ระบบ"},logout:{en:"Logout",th:"ออกจากระบบ"},search:{en:"Search...",th:"ค้นหา..."},
  all:{en:"All",th:"ทั้งหมด"},save:{en:"Save",th:"บันทึก"},cancel:{en:"Cancel",th:"ยกเลิก"},submit:{en:"Submit",th:"ส่ง"},
  approve:{en:"Approve",th:"อนุมัติ"},reject:{en:"Reject",th:"ปฏิเสธ"},new:{en:"+ New",th:"+ เพิ่ม"},
};
const t = (k, lang) => i18n[k]?.[lang] || i18n[k]?.en || k;

// ─── Master Seed Data ───
const SUPPLIERS=[
  {id:"SP0001",name:"บริษัท เบทาโกรเกษตรอุตสาหกรรม จำกัด (หมู)",type:"RM",risk:"HIGH",status:"Approved",score:92,grade:"A"},
  {id:"SP0002",name:"บริษัท เบทาโกรเกษตรอุตสาหกรรม จำกัด (ไก่)",type:"RM",risk:"HIGH",status:"Approved",score:90,grade:"A"},
  {id:"SP0003",name:"บริษัท เอส แอล พิทักษ์ จำกัด",type:"RM",risk:"HIGH",status:"Approved",score:85,grade:"B"},
  {id:"SP0004",name:"บริษัท ฟู้ดจ๊อบ จำกัด",type:"RM",risk:"HIGH",status:"Approved",score:88,grade:"B"},
  {id:"SP0005",name:"ห้างหุ้นส่วนจำกัด หมูสามตัว",type:"DM",risk:"HIGH",status:"Approved",score:82,grade:"B"},
  {id:"SP0006",name:"ร้าน ปายปายค้าข้าว",type:"DM",risk:"LOW",status:"Conditional",score:68,grade:"D"},
  {id:"SP0007",name:"บริษัท ซีพีแอ็กซ์ตร้า จำกัด (มหาชน)",type:"DM",risk:"LOW",status:"Approved",score:95,grade:"A"},
  {id:"SP0008",name:"บริษัท หยั่นหว่อหยุ่น คอร์ปอเรชั่น จำกัด",type:"DM",risk:"LOW",status:"Approved",score:91,grade:"A"},
  {id:"SP0022",name:"บริษัท อุทัยพลาสติกอุตสาหกรรม จำกัด",type:"PM",risk:"LOW",status:"Approved",score:87,grade:"B"},
  {id:"SP0025",name:"บริษัท ศรีไม้ไผ่ทอง(2019) อุตสาหกรรม จำกัด",type:"PM",risk:"LOW",status:"Approved",score:85,grade:"B"},
  {id:"SP0027",name:"ห้างหุ้นส่วนจำกัด วี-ริน เคมีคอล",type:"CM",risk:"MEDIUM",status:"Approved",score:89,grade:"B"},
  {id:"SP0028",name:"บริษัท เอ็นริช อินเตอร์เคมิคัล จำกัด",type:"CM",risk:"MEDIUM",status:"Approved",score:86,grade:"B"},
  {id:"SP0034",name:"บริษัท อีเค ซลอเทอร์เฮาส์ จำกัด",type:"RM",risk:"HIGH",status:"Pending",score:null,grade:null},
];

const MATERIALS=[
  {code:"RM0001",name:"สะโพกหมู",type:"RM",cat:"Pork",unit:"kg",minT:0,maxT:7,shelf:6},
  {code:"RM0002",name:"มันสันแข็ง",type:"RM",cat:"Pork",unit:"kg",minT:0,maxT:7,shelf:6},
  {code:"RM0005",name:"อกไก่",type:"RM",cat:"Chicken",unit:"kg",minT:0,maxT:7,shelf:5},
  {code:"PD0001",name:"ซอสหอยนางรมหมู",type:"DM",cat:"Seasoning",unit:"kg"},
  {code:"PD0010",name:"เกลือ",type:"DM",cat:"Ingredient",unit:"kg"},
  {code:"PD0019",name:"นมจืด",type:"DM",cat:"Ingredient",unit:"กระป๋อง"},
  {code:"PK0001",name:"กล่องลูกฟูก 5 ชั้น",type:"PM",cat:"Packaging",unit:"ใบ"},
  {code:"PK0019",name:"ไม้กลม 3*5",type:"PM",cat:"Skewer",unit:"kg"},
  {code:"CM0001",name:"CL-NEXGEN PH-1000",type:"CM",cat:"Cleaning",unit:"ลิตร"},
  {code:"CM0002",name:"SN-คลอรีนน้ำ 10%",type:"CM",cat:"Sanitizing",unit:"kg"},
];

const FG=[
  {code:"FG-M002",name:"หมูปิ้งนมสดเสียบไม้ Size L",type:"Pork Marinated",temp:-18,shelf:365,minW:50,maxW:52},
  {code:"FG-M003",name:"หมูปิ้งนมสดเสียบไม้ Size S",type:"Pork Marinated",temp:-18,shelf:365,minW:25,maxW:26},
  {code:"FG-M006",name:"หมูปิ้งนมสดแช่แข็ง 25g (MK)",type:"Pork Marinated",temp:-18,shelf:365,minW:25,maxW:26},
  {code:"FG-M010",name:"หมูแดดเดียว",type:"Pork Marinated",temp:-18,shelf:365,minW:35,maxW:37},
  {code:"FG-M011",name:"หมูปิ้งโบราณ Size L",type:"Pork Marinated",temp:-18,shelf:365},
  {code:"FG-K001",name:"ไก่แดงโบราณ",type:"Chicken Marinated",temp:-18,shelf:365},
  {code:"FG-K002",name:"ไก่พริกไทยดำ",type:"Chicken Marinated",temp:-18,shelf:365,minW:50,maxW:52},
  {code:"FG-K003",name:"ไก่ปิ้งนมสด",type:"Chicken Marinated",temp:-18,shelf:365,minW:50,maxW:52},
  {code:"FG-L001",name:"ลูกชิ้นหมู",type:"Meat Ball",temp:-18,shelf:365},
  {code:"FG-S001",name:"ไส้กรอกวุ้นเส้น",type:"Esan Sausage",temp:-18,shelf:365},
];

const PROCESSES=[
  {id:"PC0001",name:"การรับเข้าวัตถุดิบ",en:"Receiving",area:"จุดรับวัตถุดิบ",seq:1,ccp:false,icon:"📥"},
  {id:"PC0002",name:"การจัดเก็บวัตถุดิบ",en:"RM Storage",area:"ห้องแช่เย็น",seq:2,ccp:false,icon:"❄️"},
  {id:"PC0003",name:"การตัดและตกแต่ง",en:"Trimming",area:"จุดตัดแต่ง",seq:3,ccp:false,icon:"🔪"},
  {id:"PC0004",name:"การชั่งน้ำหนักส่วนผสม",en:"Weighing",area:"ห้องชั่งสาร",seq:4,ccp:false,icon:"⚖️"},
  {id:"PC0008",name:"การผสมและการหมัก",en:"Marinating",area:"ห้องผลิต",seq:5,ccp:false,icon:"🫙"},
  {id:"PC0009",name:"การเสียบไม้และขึ้นรูป",en:"Skewering",area:"ห้องผลิต",seq:6,ccp:false,icon:"🪡"},
  {id:"PC0012",name:"การตรวจจับโลหะ",en:"Metal Detection (CCP)",area:"ห้องผลิต",seq:7,ccp:true,icon:"🎯"},
  {id:"PC0013",name:"การบรรจุ/ซีล/ติดฉลาก",en:"Packing",area:"ห้องบรรจุ",seq:8,ccp:false,icon:"📦"},
  {id:"PC0014",name:"การแช่แข็ง",en:"Blast Freezing",area:"ห้องแช่เยือกแข็ง",seq:9,ccp:false,icon:"🧊"},
  {id:"PC0015",name:"การจัดเก็บสินค้า",en:"FG Storage",area:"ห้องจัดเก็บ FG",seq:10,ccp:false,icon:"📦"},
  {id:"PC0016",name:"การจ่ายสินค้า",en:"Dispatch",area:"จุดโหลดสินค้า",seq:11,ccp:false,icon:"🚛"},
];

const CCPS=[
  {id:"CCP001",process:"PC0012",name:"ตรวจจับ Fe",en:"Fe Detection",limit:"ø 1.0 mm",param:"PR0008"},
  {id:"CCP002",process:"PC0012",name:"ตรวจจับ Non-Fe",en:"Non-Fe Detection",limit:"ø 1.5 mm",param:"PR0009"},
  {id:"CCP003",process:"PC0012",name:"ตรวจจับ SUS",en:"SUS Detection",limit:"ø 2.0 mm",param:"PR0010"},
];

const PARAMETERS=[
  {id:"PR0001",name:"อุณหภูมิรถขนส่ง (RM)",cat:"Temperature",spec:"0-4°C",unit:"°C"},
  {id:"PR0002",name:"ค่า pH เนื้อสัตว์",cat:"Quality",spec:"5.5-5.8",unit:"-"},
  {id:"PR0004",name:"อุณหภูมิแกนกลาง RM",cat:"Temperature",spec:"0-7°C",unit:"°C"},
  {id:"PR0005",name:"อุณหภูมิห้องผลิต",cat:"Temperature",spec:"≤12°C",unit:"°C"},
  {id:"PR0007",name:"อุณหภูมิห้องแช่แข็ง",cat:"Temperature",spec:"≤-18°C",unit:"°C"},
  {id:"PR0008",name:"ตรวจจับโลหะ Fe",cat:"Food Safety",spec:"ø1.0mm",unit:"mm"},
  {id:"PR0009",name:"ตรวจจับโลหะ Non-Fe",cat:"Food Safety",spec:"ø1.5mm",unit:"mm"},
  {id:"PR0010",name:"ตรวจจับโลหะ SUS",cat:"Food Safety",spec:"ø2.0mm",unit:"mm"},
  {id:"PR0013",name:"น้ำหนัก/ไม้",cat:"Weight",spec:"within tolerance",unit:"g"},
  {id:"PR0017",name:"สิ่งแปลกปลอม",cat:"Quality",spec:"ไม่พบ",unit:"-"},
  {id:"PR0023",name:"pH น้ำ",cat:"Food Safety",spec:"6.5-8.5",unit:"-"},
  {id:"PR0024",name:"คลอรีนอิสระ",cat:"Food Safety",spec:"0.2-0.5 ppm",unit:"ppm"},
];

const EQUIP=[
  {id:"MDB001",name:"เครื่องชั่ง 6kg (ห้องเครื่องเสียบ)",type:"Measuring",cal:"Valid"},
  {id:"MDB003",name:"เครื่องชั่ง 15kg (ห้องชั่งสาร)",type:"Measuring",cal:"Valid"},
  {id:"MDB010",name:"เครื่องชั่ง 150kg (จุดรับ RM)",type:"Measuring",cal:"Valid"},
  {id:"MTC001",name:"ห้องแช่เย็น RM",type:"Monitoring",cal:"Valid"},
  {id:"MTF001",name:"ห้องแช่เยือกแข็ง FG1",type:"Monitoring",cal:"Valid"},
  {id:"MPH001",name:"pH Meter 001",type:"Measuring",cal:"Due"},
  {id:"TMD001",name:"Metal Detector - S",type:"Testing",cal:"Valid"},
  {id:"TMD002",name:"Metal Detector - L",type:"Testing",cal:"Valid"},
  {id:"TTS001",name:"Test Strips Chlorine",type:"Testing",cal:"Valid"},
];

// ─── Dynamic State Generator ───
const d=(n)=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().split('T')[0]};
const now=()=>new Date().toISOString().split('T')[0];
let ncrSeq=1,capaSeq=1;
const nid=()=>`NCR-${now().replace(/-/g,'')}-${String(ncrSeq++).padStart(3,'0')}`;
const cid=()=>`CAPA-${now().replace(/-/g,'')}-${String(capaSeq++).padStart(3,'0')}`;

// ─── CSS ───
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{
--bg0:#060b18;--bg1:#0c1425;--bg2:#121e33;--bg3:#182640;--bg4:#1e3050;
--bdr:#1a3055;--bdr2:#264070;
--t1:#e8edf5;--t2:#a0b4cc;--t3:#6b82a0;--t4:#4a6080;
--blue:#2d8cf0;--cyan:#00c6d4;--green:#00c853;--red:#ff3d57;--amber:#ffab00;
--purple:#9c5cf0;--pink:#f050a0;--teal:#00b8a9;
--grad-cyan:linear-gradient(135deg,#006070,#00c6d4);
--grad-red:linear-gradient(135deg,#700020,#ff3d57);
--grad-green:linear-gradient(135deg,#005020,#00c853);
--grad-amber:linear-gradient(135deg,#604000,#ffab00);
--grad-blue:linear-gradient(135deg,#102060,#2d8cf0);
--grad-purple:linear-gradient(135deg,#301060,#9c5cf0);
--r:10px;--rs:6px;
--shadow:0 4px 20px rgba(0,0,0,.35);
--font:'Noto Sans Thai','DM Mono',system-ui,sans-serif;
--mono:'DM Mono',monospace;
}
body{font-family:var(--font);background:var(--bg0);color:var(--t1);-webkit-font-smoothing:antialiased;font-size:13px}
.app{display:flex;min-height:100vh}

/* ── Login ── */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg0);padding:20px}
.login-card{width:100%;max-width:380px;background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:40px 32px;box-shadow:var(--shadow)}
.login-logo{text-align:center;margin-bottom:28px}
.login-logo .icon{width:56px;height:56px;background:var(--grad-cyan);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;margin-bottom:12px}
.login-logo h1{font-size:20px;font-weight:700;letter-spacing:-.5px}
.login-logo p{font-size:11px;color:var(--t3);text-transform:uppercase;letter-spacing:2px;margin-top:4px}
.form-group{margin-bottom:16px}
.form-label{display:block;font-size:11px;font-weight:600;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.form-input{width:100%;background:var(--bg1);border:1px solid var(--bdr);color:var(--t1);padding:10px 14px;border-radius:var(--rs);font-family:var(--font);font-size:13px;outline:none;transition:border .15s}
.form-input:focus{border-color:var(--cyan)}
.form-select{width:100%;background:var(--bg1);border:1px solid var(--bdr);color:var(--t1);padding:10px 14px;border-radius:var(--rs);font-family:var(--font);font-size:13px;outline:none}
.form-input::placeholder{color:var(--t4)}

/* ── Sidebar ── */
.sidebar{width:250px;background:var(--bg1);border-right:1px solid var(--bdr);position:fixed;top:0;left:0;bottom:0;z-index:100;display:flex;flex-direction:column;transition:transform .25s ease}
.sidebar.closed{transform:translateX(-250px)}
.sb-logo{padding:16px 18px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:10px}
.sb-logo .icon{width:36px;height:36px;background:var(--grad-cyan);border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0}
.sb-logo h2{font-size:14px;font-weight:700;letter-spacing:-.3px}
.sb-logo small{font-size:9px;color:var(--t4);letter-spacing:1.5px;text-transform:uppercase}
.sb-nav{flex:1;overflow-y:auto;padding:8px 6px}
.sb-nav::-webkit-scrollbar{width:3px}.sb-nav::-webkit-scrollbar-thumb{background:var(--bdr);border-radius:3px}
.nav-section{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:var(--t4);padding:14px 12px 4px;font-weight:600}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:var(--rs);cursor:pointer;font-size:12.5px;color:var(--t2);transition:all .12s;position:relative;font-weight:400}
.nav-item:hover{background:var(--bg3);color:var(--t1)}
.nav-item.active{background:rgba(0,198,212,.08);color:var(--cyan);font-weight:500}
.nav-item.active::before{content:'';position:absolute;left:0;top:5px;bottom:5px;width:3px;background:var(--cyan);border-radius:0 3px 3px 0}
.nav-icon{font-size:15px;width:18px;text-align:center;flex-shrink:0}
.nav-badge{margin-left:auto;background:var(--red);color:#fff;font-size:9px;padding:1px 6px;border-radius:8px;font-weight:600;min-width:18px;text-align:center}
.sb-footer{padding:12px 18px;border-top:1px solid var(--bdr);font-size:11px;color:var(--t4)}

/* ── Main ── */
.main{flex:1;margin-left:250px;transition:margin-left .25s}
.main.full{margin-left:0}
.topbar{height:52px;background:var(--bg1);border-bottom:1px solid var(--bdr);display:flex;align-items:center;padding:0 20px;gap:12px;position:sticky;top:0;z-index:50}
.tb-ham{display:none;background:none;border:none;color:var(--t1);font-size:18px;cursor:pointer;padding:4px}
.tb-title{font-size:15px;font-weight:600}
.tb-right{margin-left:auto;display:flex;align-items:center;gap:10px}
.tb-lang{background:var(--bg3);border:1px solid var(--bdr);color:var(--t2);padding:4px 12px;border-radius:16px;font-size:11px;cursor:pointer;font-family:var(--font);font-weight:500;transition:all .12s}
.tb-lang:hover{border-color:var(--cyan);color:var(--cyan)}
.tb-user{display:flex;align-items:center;gap:8px;cursor:pointer}
.tb-avatar{width:30px;height:30px;border-radius:50%;background:var(--grad-cyan);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
.content{padding:20px;max-width:1440px;margin:0 auto}

/* ── KPI Cards ── */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:24px}
.kpi{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);padding:16px 18px;position:relative;overflow:hidden;transition:all .15s;cursor:default}
.kpi:hover{border-color:var(--bdr2);transform:translateY(-1px);box-shadow:var(--shadow)}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.kpi.c-red::before{background:var(--grad-red)}.kpi.c-green::before{background:var(--grad-green)}
.kpi.c-amber::before{background:var(--grad-amber)}.kpi.c-blue::before{background:var(--grad-blue)}
.kpi.c-purple::before{background:var(--grad-purple)}.kpi.c-cyan::before{background:var(--grad-cyan)}
.kpi-val{font-size:28px;font-weight:700;font-family:var(--mono);margin-bottom:2px;letter-spacing:-1px}
.kpi.c-red .kpi-val{color:var(--red)}.kpi.c-green .kpi-val{color:var(--green)}
.kpi.c-amber .kpi-val{color:var(--amber)}.kpi.c-blue .kpi-val{color:var(--blue)}
.kpi.c-purple .kpi-val{color:var(--purple)}.kpi.c-cyan .kpi-val{color:var(--cyan)}
.kpi-label{font-size:10.5px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.3px}

/* ── Card ── */
.card{background:var(--bg2);border:1px solid var(--bdr);border-radius:var(--r);margin-bottom:16px;overflow:hidden}
.card-h{padding:14px 18px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.card-t{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}
.card-a{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.card-body{padding:18px}

/* ── Table ── */
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;padding:9px 14px;background:var(--bg1);font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);white-space:nowrap;border-bottom:1px solid var(--bdr)}
td{padding:9px 14px;border-bottom:1px solid rgba(26,48,85,.4);color:var(--t2);vertical-align:middle}
tr:hover td{background:rgba(0,198,212,.02)}
.mono{font-family:var(--mono);font-size:11.5px}

/* ── Badges ── */
.badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:12px;font-size:10.5px;font-weight:600;letter-spacing:.2px;white-space:nowrap}
.b-pass{background:rgba(0,200,83,.12);color:#4cdc80}.b-fail{background:rgba(255,61,87,.12);color:#ff6b7f}
.b-hold{background:rgba(255,171,0,.12);color:#ffc840}.b-pending{background:rgba(107,130,160,.12);color:var(--t3)}
.b-open{background:rgba(45,140,240,.12);color:#60a5fa}.b-closed{background:rgba(107,130,160,.12);color:var(--t3)}
.b-inv{background:rgba(156,92,240,.12);color:#b890f0}.b-rm{background:rgba(255,61,87,.08);color:#ff6b7f}
.b-dm{background:rgba(255,171,0,.08);color:#ffc840}.b-pm{background:rgba(45,140,240,.08);color:#60a5fa}
.b-cm{background:rgba(156,92,240,.08);color:#b890f0}.b-high{background:rgba(255,61,87,.12);color:#ff6b7f}
.b-medium{background:rgba(255,171,0,.12);color:#ffc840}.b-low{background:rgba(0,200,83,.12);color:#4cdc80}
.b-critical{background:rgba(240,80,160,.12);color:#f080b0}.b-active{background:rgba(0,200,83,.12);color:#4cdc80}
.b-draft{background:rgba(107,130,160,.12);color:var(--t3)}.b-approved{background:rgba(0,200,83,.12);color:#4cdc80}
.b-conditional{background:rgba(255,171,0,.12);color:#ffc840}.b-ccp{background:rgba(255,61,87,.15);color:#ff6b7f;font-weight:700}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:var(--rs);font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;border:1px solid transparent;font-family:var(--font)}
.btn-p{background:var(--cyan);color:#000;font-weight:600}.btn-p:hover{background:#00dce8}
.btn-o{background:transparent;border-color:var(--bdr);color:var(--t2)}.btn-o:hover{border-color:var(--cyan);color:var(--cyan)}
.btn-d{background:rgba(255,61,87,.1);color:var(--red);border-color:rgba(255,61,87,.25)}.btn-d:hover{background:rgba(255,61,87,.2)}
.btn-g{background:rgba(0,200,83,.1);color:var(--green);border-color:rgba(0,200,83,.25)}
.btn-sm{padding:4px 10px;font-size:11px}

/* ── Filter Bar ── */
.fbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.fbar select,.fbar input{background:var(--bg1);border:1px solid var(--bdr);color:var(--t1);padding:7px 12px;border-radius:var(--rs);font-size:12px;font-family:var(--font);outline:none;transition:border .12s}
.fbar select:focus,.fbar input:focus{border-color:var(--cyan)}
.fbar input{min-width:150px}

/* ── Process Flow ── */
.pflow{display:flex;overflow-x:auto;padding:16px;gap:0;align-items:center}
.pstep{display:flex;flex-direction:column;align-items:center;min-width:80px;text-align:center}
.pstep-icon{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:6px;border:2px solid var(--bdr);background:var(--bg2)}
.pstep.ccp .pstep-icon{border-color:var(--red);background:rgba(255,61,87,.08);animation:ccp-pulse 2s infinite}
.pstep-label{font-size:9px;color:var(--t3);max-width:75px;line-height:1.3}
.parrow{color:var(--t4);font-size:14px;margin:0 2px;margin-bottom:20px;flex-shrink:0}
@keyframes ccp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,61,87,.3)}50%{box-shadow:0 0 0 8px rgba(255,61,87,0)}}

/* ── Alerts ── */
.alert-item{padding:12px 18px;border-bottom:1px solid rgba(26,48,85,.3);display:flex;gap:10px;align-items:flex-start}
.alert-item:last-child{border-bottom:none}
.alert-dot{width:7px;height:7px;border-radius:50%;margin-top:5px;flex-shrink:0;animation:apulse 2s infinite}
.alert-dot.critical{background:var(--red)}.alert-dot.warning{background:var(--amber)}.alert-dot.emergency{background:var(--pink)}
@keyframes apulse{0%,100%{opacity:1}50%{opacity:.3}}

/* ── Modal ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:var(--bg2);border:1px solid var(--bdr);border-radius:14px;width:100%;max-width:600px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.modal-h{padding:18px 22px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between}
.modal-title{font-size:16px;font-weight:700}
.modal-close{background:none;border:none;color:var(--t3);font-size:20px;cursor:pointer;padding:4px;line-height:1}
.modal-body{padding:22px}
.modal-footer{padding:14px 22px;border-top:1px solid var(--bdr);display:flex;justify-content:flex-end;gap:8px}

/* ── Form Grid ── */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.form-full{grid-column:1/-1}
textarea.form-input{min-height:80px;resize:vertical}

/* ── Layout ── */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}

/* ── Detail ── */
.detail-row{display:flex;padding:9px 18px;border-bottom:1px solid rgba(26,48,85,.25)}
.detail-l{width:140px;font-size:11px;color:var(--t3);font-weight:500;flex-shrink:0}
.detail-v{font-size:12.5px;color:var(--t1)}

/* ── Tabs ── */
.tabs{display:flex;gap:0;border-bottom:1px solid var(--bdr);padding:0 18px}
.tab{padding:10px 18px;font-size:12.5px;color:var(--t3);cursor:pointer;border-bottom:2px solid transparent;transition:all .12s;font-weight:500}
.tab:hover{color:var(--t1)}.tab.active{color:var(--cyan);border-bottom-color:var(--cyan)}

/* ── Rule Box ── */
.rule-box{background:rgba(255,61,87,.04);border:1px solid rgba(255,61,87,.15);border-radius:var(--r);padding:14px 18px;margin:12px 0;display:flex;gap:10px;align-items:flex-start}
.rule-box .icon{font-size:18px;flex-shrink:0}.rule-box .title{font-weight:600;color:var(--red);font-size:12px;margin-bottom:2px}
.rule-box .text{font-size:11.5px;color:var(--t2);line-height:1.5}

/* ── Workflow Steps ── */
.wf-steps{display:flex;gap:0;padding:16px;overflow-x:auto}
.wf-step{display:flex;align-items:center;gap:0}
.wf-node{padding:8px 16px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;border:2px solid var(--bdr);background:var(--bg3);color:var(--t2)}
.wf-node.active{border-color:var(--cyan);background:rgba(0,198,212,.08);color:var(--cyan)}
.wf-node.done{border-color:var(--green);background:rgba(0,200,83,.08);color:var(--green)}
.wf-arrow{width:28px;height:2px;background:var(--bdr);position:relative;margin:0 -2px}

/* ── Score Bar ── */
.score-bar{height:6px;background:var(--bg1);border-radius:3px;overflow:hidden;margin-top:4px}
.score-fill{height:100%;border-radius:3px;transition:width .5s ease}

/* ── Mobile ── */
@media(max-width:1024px){.grid-2,.grid-3{grid-template-columns:1fr}.kpi-grid{grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}.form-grid{grid-template-columns:1fr}}
@media(max-width:768px){.sidebar{transform:translateX(-250px)}.sidebar.open{transform:translateX(0);box-shadow:var(--shadow)}.main{margin-left:0!important}.tb-ham{display:block}.content{padding:14px}.kpi-grid{grid-template-columns:repeat(2,1fr);gap:8px}.kpi{padding:12px 14px}.kpi-val{font-size:22px}td,th{padding:7px 10px}.card-h{padding:10px 14px}}
`;

// ─── Components ───
const Badge=({type,children})=><span className={`badge b-${type?.toLowerCase().replace(/[\s\/]+/g,'-')}`}>{children}</span>;
const StatusBadge=({s})=>{const m={PASS:'pass',FAIL:'fail',HOLD:'hold',PENDING:'pending',Open:'open',Closed:'closed',Investigation:'inv',Approved:'approved',Conditional:'conditional',Active:'active',Draft:'draft','In Progress':'open',Disposition:'hold',Verification:'hold','Recall Assessment':'fail','Root Cause':'inv','Root Cause Analysis':'inv','Action Planning':'open',Implementation:'open','Effectiveness Check':'hold','Closed Effective':'pass','Closed Not Effective':'fail',Overdue:'fail',Released:'pass',Rejected:'fail',Hold:'hold','Pending QC':'pending','Pending Release':'hold',Received:'open',Acknowledged:'hold','Pending Review':'hold','Under Review':'inv','Pending Approval':'hold',Obsolete:'closed',Superseded:'closed'};return <Badge type={m[s]||'pending'}>{s}</Badge>};
const RiskBadge=({l})=><Badge type={l?.toLowerCase()}>{l}</Badge>;
const TypeBadge=({t})=><Badge type={t?.toLowerCase()}>{t}</Badge>;

const Modal=({open,onClose,title,children,footer})=>{if(!open)return null;return(<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-h"><div className="modal-title">{title}</div><button className="modal-close" onClick={onClose}>×</button></div><div className="modal-body">{children}</div>{footer&&<div className="modal-footer">{footer}</div>}</div></div>)};

// ─── State Management ───
function useAppState(){
  const [ncrs,setNcrs]=useState([
    {id:"NCR-20260514-001",date:d(2),source:"Inspection",lot:"L260512-01",severity:"MEDIUM",status:"Open",desc:"อุณหภูมิรถขนส่งเกิน 6°C",risk:"MEDIUM",blocked:0},
    {id:"NCR-20260514-002",date:d(5),source:"CCP",lot:"L260508-03",fgLot:"FGL260508-03",severity:"CRITICAL",status:"Investigation",desc:"Metal detector FAIL - Fe detected",risk:"CRITICAL",blocked:1},
    {id:"NCR-20260514-003",date:d(8),source:"Complaint",lot:"L260505-01",severity:"HIGH",status:"Root Cause",desc:"ลูกค้าพบสิ่งแปลกปลอม",risk:"HIGH",blocked:1},
    {id:"NCR-20260514-004",date:d(15),source:"Audit",severity:"LOW",status:"Closed",desc:"เอกสาร SOP ไม่อัพเดต",risk:"LOW",blocked:0},
    {id:"NCR-20260514-005",date:d(0),source:"Metal Detector",lot:"L260514-02",fgLot:"FGL260514-02",severity:"CRITICAL",status:"Open",desc:"Metal detector verification FAIL",risk:"CRITICAL",blocked:1},
  ]);
  const [capas,setCapas]=useState([
    {id:"CAPA-20260514-001",ncr:"NCR-20260514-001",type:"Corrective",status:"Implementation",desc:"ปรับปรุงระบบตรวจสอบอุณหภูมิรถ",target:d(-10),priority:"MEDIUM",responsible:"QA Supervisor"},
    {id:"CAPA-20260514-002",ncr:"NCR-20260514-002",type:"Both",status:"Root Cause Analysis",desc:"Metal Detector sensitivity review",target:d(-5),priority:"CRITICAL",responsible:"QA Manager"},
    {id:"CAPA-20260514-003",ncr:"NCR-20260514-003",type:"Corrective",status:"Effectiveness Check",desc:"ทบทวนกระบวนการตรวจสอบ FG",target:d(-15),priority:"HIGH",responsible:"Production Manager"},
  ]);
  const [inspections,setInspections]=useState([
    {id:1,lot:"L260514-01",process:"PC0001",param:"PR0001",value:"3.2°C",status:"PASS",date:d(0),by:"QA-01"},
    {id:2,lot:"L260514-01",process:"PC0001",param:"PR0002",value:"5.6",status:"PASS",date:d(0),by:"QA-01"},
    {id:3,lot:"L260513-02",process:"PC0001",param:"PR0001",value:"6.1°C",status:"FAIL",date:d(1),by:"QA-02"},
    {id:4,lot:"L260513-01",process:"PC0012",param:"PR0008",value:"PASS",status:"PASS",date:d(1),by:"QA-01"},
    {id:5,lot:"L260512-01",process:"PC0001",param:"PR0004",value:"4.5°C",status:"PASS",date:d(2),by:"QA-03"},
    {id:6,lot:"L260512-01",process:"PC0001",param:"PR0001",value:"6.0°C",status:"FAIL",date:d(3),by:"QA-01"},
  ]);
  const [metalLogs,setMetalLogs]=useState([
    {id:1,lot:"L260514-01",fgLot:"FGL260514-01",ccp:"CCP001",piece:"Fe",status:"PASS",type:"Start",date:d(0),blocked:0},
    {id:2,lot:"L260514-01",fgLot:"FGL260514-01",ccp:"CCP002",piece:"Non-Fe",status:"PASS",type:"Start",date:d(0),blocked:0},
    {id:3,lot:"L260514-01",fgLot:"FGL260514-01",ccp:"CCP003",piece:"SUS",status:"PASS",type:"Start",date:d(0),blocked:0},
    {id:4,lot:"L260514-02",fgLot:"FGL260514-02",ccp:"CCP001",piece:"Fe",status:"FAIL",type:"Hourly",date:d(0),blocked:1},
    {id:5,lot:"L260513-01",fgLot:"FGL260513-01",ccp:"CCP001",piece:"Fe",status:"PASS",type:"End",date:d(1),blocked:0},
  ]);
  const [complaints,setComplaints]=useState([
    {id:"CC-20260502-001",date:d(12),customer:"Tops Supermarket",fgLot:"FGL260428-01",type:"Foreign Matter",severity:"HIGH",status:"Investigation",fsRisk:true},
    {id:"CC-20260509-001",date:d(5),customer:"MK Restaurant",fgLot:"FGL260505-02",type:"Quality",severity:"MEDIUM",status:"Received",fsRisk:false},
  ]);
  const [alerts,setAlerts]=useState([
    {id:1,type:"CCP_FAIL",sev:"EMERGENCY",title:"🚨 CCP FAIL — Metal Detector Fe",msg:"Lot L260514-02 BLOCKED. NCR auto-created.",at:d(0)},
    {id:2,type:"LOT_BLOCKED",sev:"CRITICAL",title:"FG Lot FGL260514-02 BLOCKED",msg:"Metal detector failure. Release prohibited.",at:d(0)},
    {id:3,type:"COMPLAINT_FOOD_SAFETY",sev:"CRITICAL",title:"Food Safety Complaint — Tops",msg:"Foreign matter. Recall assessment required.",at:d(12)},
    {id:4,type:"CALIBRATION_DUE",sev:"WARNING",title:"pH Meter MPH001 calibration due",msg:"Expires in 3 days.",at:d(0)},
    {id:5,type:"CAPA_OVERDUE",sev:"WARNING",title:"CAPA-20260514-001 target overdue",msg:"Target date exceeded. Escalation required.",at:d(2)},
  ]);
  const [docs,setDocs]=useState([
    {no:"QP-QA-001",title:"HACCP Plan",type:"QP",rev:3,status:"Active",eff:"2025-12-01"},
    {no:"SOP-QA-001",title:"Incoming QC Procedure",type:"SOP",rev:2,status:"Active",eff:"2025-11-15"},
    {no:"SOP-QA-002",title:"Metal Detector Verification",type:"SOP",rev:4,status:"Active",eff:"2026-01-10"},
    {no:"WI-QA-001",title:"Temperature Monitoring",type:"WI",rev:1,status:"Active",eff:"2025-10-01"},
    {no:"FM-QA-001",title:"Incoming Inspection Form",type:"FM",rev:5,status:"Active",eff:"2026-02-01"},
    {no:"FM-QA-010",title:"Metal Detector Log Form",type:"FM",rev:3,status:"Active",eff:"2026-01-15"},
    {no:"FM-GHP-001",title:"Daily Hygiene Checklist",type:"FM",rev:6,status:"Active",eff:"2026-03-01"},
    {no:"SOP-PD-001",title:"Marination Process",type:"SOP",rev:0,status:"Draft",eff:null},
    {no:"SD-QA-001",title:"Allergen Matrix",type:"SD",rev:2,status:"Pending Review",eff:null},
  ]);

  const addInspection=(ins)=>{
    const newIns={...ins,id:inspections.length+1,date:now(),by:"QA-User"};
    setInspections(p=>[newIns,...p]);
    if(ins.status==='FAIL'){
      const newNCR={id:nid(),date:now(),source:"Inspection",lot:ins.lot,severity:"MEDIUM",status:"Open",desc:`Inspection FAIL: ${ins.param} = ${ins.value}`,risk:"MEDIUM",blocked:0};
      setNcrs(p=>[newNCR,...p]);
      setAlerts(p=>[{id:p.length+1,type:"INSPECTION_FAIL",sev:"WARNING",title:`Inspection FAIL: ${ins.param}`,msg:`Lot ${ins.lot}: NCR auto-created`,at:now()},...p]);
    }
  };

  const addMetalLog=(log)=>{
    const newLog={...log,id:metalLogs.length+1,date:now(),blocked:log.status==='FAIL'?1:0};
    setMetalLogs(p=>[newLog,...p]);
    if(log.status==='FAIL'){
      const newNCR={id:nid(),date:now(),source:"Metal Detector",lot:log.lot,fgLot:log.fgLot,severity:"CRITICAL",status:"Open",desc:`Metal Detector FAIL: ${log.piece} — ${log.ccp}`,risk:"CRITICAL",blocked:1};
      setNcrs(p=>[newNCR,...p]);
      setAlerts(p=>[
        {id:p.length+1,type:"METAL_FAIL",sev:"EMERGENCY",title:`🚨 METAL DETECTOR FAIL: ${log.piece}`,msg:`Lot ${log.lot} BLOCKED. NCR auto-created.`,at:now()},
        {id:p.length+2,type:"LOT_BLOCKED",sev:"CRITICAL",title:`FG Lot ${log.fgLot} BLOCKED`,msg:"Release prohibited until investigation complete.",at:now()},
        ...p
      ]);
    }
  };

  return{ncrs,setNcrs,capas,setCapas,inspections,addInspection,metalLogs,addMetalLog,complaints,setComplaints,alerts,setAlerts,docs,setDocs};
}

// ═══════════ LOGIN PAGE ═══════════
function LoginPage({onLogin}){
  const[user,setUser]=useState('');const[pass,setPass]=useState('');const[role,setRole]=useState('QA_MANAGER');const[err,setErr]=useState('');
  const submit=()=>{if(!user||!pass){setErr('Please enter credentials');return}onLogin({username:user,role,displayName:user==='admin'?'Administrator':user})};
  return(<div className="login-wrap"><div className="login-card"><div className="login-logo"><div className="icon">QA</div><h1>Smart QA Factory</h1><p>HACCP · ISO 22000 · FSSC 22000</p></div>
    {err&&<div style={{color:'var(--red)',fontSize:12,marginBottom:12,textAlign:'center'}}>{err}</div>}
    <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={user} onChange={e=>setUser(e.target.value)} placeholder="admin"/></div>
    <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/></div>
    <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={role} onChange={e=>setRole(e.target.value)}>
      <option value="ADMIN">Admin</option><option value="QA_MANAGER">QA Manager</option><option value="QA_INSPECTOR">QA Inspector</option><option value="PRODUCTION_SUPERVISOR">Production Supervisor</option><option value="VIEWER">Viewer</option>
    </select></div>
    <button className="btn btn-p" style={{width:'100%',justifyContent:'center',padding:'11px',fontSize:14}} onClick={submit}>เข้าสู่ระบบ / Login</button>
    <div style={{textAlign:'center',marginTop:16,fontSize:11,color:'var(--t4)'}}>Demo: any username/password</div>
  </div></div>);
}

// ═══════════ DASHBOARD ═══════════
function DashboardPage({state}){
  const{lang}=useLang();
  const openNCR=state.ncrs.filter(n=>n.status!=='Closed').length;
  const critNCR=state.ncrs.filter(n=>n.severity==='CRITICAL'&&n.status!=='Closed').length;
  const openCAPA=state.capas.filter(c=>!c.status.startsWith('Closed')).length;
  const blockedLots=state.ncrs.filter(n=>n.blocked).length;
  const passRate=Math.round(100*state.inspections.filter(i=>i.status==='PASS').length/Math.max(state.inspections.length,1));
  const fails7d=state.inspections.filter(i=>i.status==='FAIL').length;
  const kpis=[
    {label:"Open NCR",val:openNCR,c:"red"},{label:"Critical NCR",val:critNCR,c:"red"},
    {label:"Open CAPA",val:openCAPA,c:"purple"},{label:"Lots Blocked",val:blockedLots,c:"red"},
    {label:"Pass Rate 30d",val:`${passRate}%`,c:"green"},{label:"Fails 7d",val:fails7d,c:"amber"},
    {label:"Calibration Due",val:1,c:"cyan"},{label:"Active Alerts",val:state.alerts.length,c:"amber"},
  ];
  return(<div>
    <div className="kpi-grid">{kpis.map((k,i)=><div key={i} className={`kpi c-${k.c}`}><div className="kpi-val">{k.val}</div><div className="kpi-label">{k.label}</div></div>)}</div>
    <div className="card"><div className="card-h"><div className="card-t">⚙️ HACCP Process Flow — Production Line</div></div>
      <div className="pflow">{PROCESSES.map((p,i)=><div key={p.id} style={{display:'flex',alignItems:'center'}}><div className={`pstep ${p.ccp?'ccp':''}`}><div className="pstep-icon">{p.icon}</div><div className="pstep-label">{p.id}<br/>{p.en}{p.ccp&&<div style={{color:'var(--red)',fontWeight:700,marginTop:1}}>CCP</div>}</div></div>{i<PROCESSES.length-1&&<span className="parrow">→</span>}</div>)}</div></div>
    <div className="grid-2">
      <div className="card"><div className="card-h"><div className="card-t">🔔 Active Alerts</div></div>
        {state.alerts.slice(0,5).map(a=><div key={a.id} className="alert-item"><div className={`alert-dot ${a.sev==='EMERGENCY'?'emergency':a.sev==='CRITICAL'?'critical':'warning'}`}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:'var(--t1)'}}>{a.title}</div><div style={{fontSize:11.5,color:'var(--t3)',marginTop:1}}>{a.msg}</div></div><div style={{fontSize:10,color:'var(--t4)',fontFamily:'var(--mono)',whiteSpace:'nowrap'}}>{a.at}</div></div>)}</div>
      <div className="card"><div className="card-h"><div className="card-t">⚠️ Recent NCR</div></div><div className="tw"><table><thead><tr><th>NCR ID</th><th>Source</th><th>Severity</th><th>Status</th></tr></thead><tbody>
        {state.ncrs.slice(0,5).map(n=><tr key={n.id}><td className="mono">{n.id}</td><td>{n.source}</td><td><RiskBadge l={n.severity}/></td><td><StatusBadge s={n.status}/></td></tr>)}
      </tbody></table></div></div>
    </div>
    <div className="grid-2">
      <div className="card"><div className="card-h"><div className="card-t">🎯 CCP Status — Metal Detection</div></div><div className="tw"><table><thead><tr><th>CCP</th><th>Name</th><th>Critical Limit</th><th>Last Result</th></tr></thead><tbody>
        {CCPS.map(c=>{const last=state.metalLogs.find(m=>m.ccp===c.id);return <tr key={c.id}><td className="mono">{c.id}</td><td>{c.en}</td><td>{c.limit}</td><td><StatusBadge s={last?.status||'PENDING'}/></td></tr>})}
      </tbody></table></div></div>
      <div className="card"><div className="card-h"><div className="card-t">🔍 Recent Inspections</div></div><div className="tw"><table><thead><tr><th>Lot</th><th>Param</th><th>Value</th><th>Result</th></tr></thead><tbody>
        {state.inspections.slice(0,5).map(ins=><tr key={ins.id}><td className="mono">{ins.lot}</td><td style={{fontSize:11}}>{PARAMETERS.find(p=>p.id===ins.param)?.name?.substring(0,22)||ins.param}</td><td className="mono">{ins.value}</td><td><StatusBadge s={ins.status}/></td></tr>)}
      </tbody></table></div></div>
    </div>
    <div className="rule-box"><div className="icon">⚠️</div><div><div className="title">Food Safety Rules Active</div><div className="text">Inspection FAIL → auto NCR • CCP/Metal FAIL → NCR + block FG lot + CAPA • Complaint (food safety or HIGH/CRITICAL) → recall assessment • Open NCR blocks FG release • All actions logged to immutable audit trail</div></div></div>
  </div>);
}

// ═══════════ MOBILE QA FORMS — Incoming QC ═══════════
function IncomingQCPage({state}){
  const{lang}=useLang();const[modal,setModal]=useState(false);
  const[form,setForm]=useState({lot:'',process:'PC0001',param:'PR0001',value:'',status:'PASS'});
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));
  const submit=()=>{if(!form.lot||!form.value)return;state.addInspection(form);setModal(false);setForm({lot:'',process:'PC0001',param:'PR0001',value:'',status:'PASS'})};
  return(<div>
    <div className="card"><div className="card-h"><div className="card-t">🔍 {t('incomingQC',lang)} — Inspection Log</div><button className="btn btn-p" onClick={()=>setModal(true)}>+ New Inspection</button></div>
      <div className="tw"><table><thead><tr><th>Date</th><th>Lot</th><th>Process</th><th>Parameter</th><th>Value</th><th>Result</th><th>Inspector</th></tr></thead><tbody>
        {state.inspections.map(ins=><tr key={ins.id} style={ins.status==='FAIL'?{background:'rgba(255,61,87,.03)'}:{}}><td>{ins.date}</td><td className="mono">{ins.lot}</td>
          <td style={{fontSize:11}}>{PROCESSES.find(p=>p.id===ins.process)?.en||ins.process}</td>
          <td style={{fontSize:11}}>{PARAMETERS.find(p=>p.id===ins.param)?.name?.substring(0,18)||ins.param}</td>
          <td className="mono">{ins.value}</td><td><StatusBadge s={ins.status}/></td><td>{ins.by}</td></tr>)}
      </tbody></table></div></div>
    <div className="rule-box"><div className="icon">⚠️</div><div><div className="title">Auto-NCR Rule</div><div className="text">Any FAIL result automatically generates NCR. CCP-related parameters generate CRITICAL NCR and block FG lot. HOLD status requires QA Manager review.</div></div></div>
    <Modal open={modal} onClose={()=>setModal(false)} title="📋 New Inspection Record" footer={<><button className="btn btn-o" onClick={()=>setModal(false)}>{t('cancel',lang)}</button><button className="btn btn-p" onClick={submit}>{t('save',lang)}</button></>}>
      <div className="form-grid">
        <div><label className="form-label">Lot No. *</label><input className="form-input" value={form.lot} onChange={e=>upd('lot',e.target.value)} placeholder="L260514-01"/></div>
        <div><label className="form-label">Process</label><select className="form-select" value={form.process} onChange={e=>upd('process',e.target.value)}>{PROCESSES.map(p=><option key={p.id} value={p.id}>{p.id} — {p.en}</option>)}</select></div>
        <div><label className="form-label">Parameter</label><select className="form-select" value={form.param} onChange={e=>upd('param',e.target.value)}>{PARAMETERS.map(p=><option key={p.id} value={p.id}>{p.id} — {p.name.substring(0,25)}</option>)}</select></div>
        <div><label className="form-label">Equipment</label><select className="form-select">{EQUIP.map(e=><option key={e.id} value={e.id}>{e.id}</option>)}</select></div>
        <div><label className="form-label">Result Value *</label><input className="form-input" value={form.value} onChange={e=>upd('value',e.target.value)} placeholder="e.g. 3.5°C"/></div>
        <div><label className="form-label">Result Status *</label><select className="form-select" value={form.status} onChange={e=>upd('status',e.target.value)}><option value="PASS">✅ PASS</option><option value="FAIL">❌ FAIL</option><option value="HOLD">⏸️ HOLD</option></select></div>
        <div className="form-full"><label className="form-label">Spec Reference</label><div style={{fontSize:12,color:'var(--t2)',padding:'8px 0'}}>{PARAMETERS.find(p=>p.id===form.param)?.spec||'—'} {PARAMETERS.find(p=>p.id===form.param)?.unit||''}</div></div>
        <div className="form-full"><label className="form-label">Remarks</label><textarea className="form-input" placeholder="Optional remarks..."/></div>
      </div>
      {form.status==='FAIL'&&<div className="rule-box" style={{marginTop:16}}><div className="icon">🚨</div><div><div className="title">FAIL Detected</div><div className="text">Saving will auto-create NCR and alert QA Supervisor.</div></div></div>}
    </Modal>
  </div>);
}

// ═══════════ CCP MONITORING ═══════════
function CCPPage({state}){
  return(<div>
    <div className="grid-3">{CCPS.map(c=>{const hasFail=state.metalLogs.some(m=>m.ccp===c.id&&m.status==='FAIL');return(
      <div key={c.id} className={`kpi ${hasFail?'c-red':'c-green'}`} style={{padding:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><span className="mono" style={{fontSize:11,color:'var(--t3)'}}>{c.id}</span><StatusBadge s={hasFail?'FAIL':'PASS'}/></div>
        <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{c.en}</div>
        <div style={{fontSize:11.5,color:'var(--t3)'}}>Critical Limit: {c.limit}</div>
      </div>)})}</div>
    <div className="card"><div className="card-h"><div className="card-t">🎯 CCP Monitoring — HACCP Critical Control Points</div></div>
      <div style={{padding:16}}><div className="wf-steps"><div className="wf-step"><div className="wf-node done">Monitor CCP</div></div><div className="wf-arrow"/><div className="wf-step"><div className="wf-node active">Record Result</div></div><div className="wf-arrow"/><div className="wf-step"><div className="wf-node">PASS → Release</div></div><div className="wf-arrow"/><div className="wf-step"><div className="wf-node" style={{borderColor:'var(--red)',color:'var(--red)'}}>FAIL → NCR + Block</div></div><div className="wf-arrow"/><div className="wf-step"><div className="wf-node">CAPA Required</div></div></div></div></div>
    <div className="rule-box"><div className="icon">🚨</div><div><div className="title">HACCP Critical Rule</div><div className="text">CCP FAIL → Auto-create NCR (CRITICAL) → Block FG Lot → EMERGENCY Alert → Corrective Action Required → CAPA Mandatory → All product re-screened</div></div></div>
  </div>);
}

// ═══════════ METAL DETECTOR ═══════════
function MetalDetectorPage({state}){
  const[modal,setModal]=useState(false);
  const[form,setForm]=useState({lot:'',fgLot:'',ccp:'CCP001',piece:'Fe',type:'Start',status:'PASS'});
  const upd=(k,v)=>setForm(p=>({...p,[k]:v}));
  const submit=()=>{if(!form.lot)return;state.addMetalLog(form);setModal(false);setForm({lot:'',fgLot:'',ccp:'CCP001',piece:'Fe',type:'Start',status:'PASS'})};
  return(<div>
    <div className="card"><div className="card-h"><div className="card-t">⚡ Metal Detector Verification Log</div><button className="btn btn-p" onClick={()=>setModal(true)}>+ New Test</button></div>
      <div className="tw"><table><thead><tr><th>Date</th><th>Lot</th><th>FG Lot</th><th>CCP</th><th>Piece</th><th>Type</th><th>Result</th><th>Blocked</th></tr></thead><tbody>
        {state.metalLogs.map(m=><tr key={m.id} style={m.status==='FAIL'?{background:'rgba(255,61,87,.03)'}:{}}><td>{m.date}</td><td className="mono">{m.lot}</td><td className="mono">{m.fgLot}</td><td>{m.ccp}</td><td>{m.piece}</td><td>{m.type}</td><td><StatusBadge s={m.status}/></td><td>{m.blocked?<Badge type="fail">🔒 BLOCKED</Badge>:'—'}</td></tr>)}
      </tbody></table></div></div>
    <Modal open={modal} onClose={()=>setModal(false)} title="⚡ Metal Detector Test" footer={<><button className="btn btn-o" onClick={()=>setModal(false)}>Cancel</button><button className="btn btn-p" onClick={submit}>Save</button></>}>
      <div className="form-grid">
        <div><label className="form-label">Lot No. *</label><input className="form-input" value={form.lot} onChange={e=>upd('lot',e.target.value)}/></div>
        <div><label className="form-label">FG Lot No.</label><input className="form-input" value={form.fgLot} onChange={e=>upd('fgLot',e.target.value)}/></div>
        <div><label className="form-label">CCP</label><select className="form-select" value={form.ccp} onChange={e=>upd('ccp',e.target.value)}>{CCPS.map(c=><option key={c.id} value={c.id}>{c.id} — {c.en}</option>)}</select></div>
        <div><label className="form-label">Test Piece</label><select className="form-select" value={form.piece} onChange={e=>upd('piece',e.target.value)}><option>Fe</option><option>Non-Fe</option><option>SUS</option></select></div>
        <div><label className="form-label">Verification Type</label><select className="form-select" value={form.type} onChange={e=>upd('type',e.target.value)}><option>Start</option><option>Hourly</option><option>End</option><option>Post-Reject</option></select></div>
        <div><label className="form-label">Result *</label><select className="form-select" value={form.status} onChange={e=>upd('status',e.target.value)}><option value="PASS">✅ PASS</option><option value="FAIL">❌ FAIL</option></select></div>
      </div>
      {form.status==='FAIL'&&<div className="rule-box" style={{marginTop:16}}><div className="icon">🚨</div><div><div className="title">CRITICAL — CCP Failure</div><div className="text">Auto-creates CRITICAL NCR, blocks FG lot, EMERGENCY alert to QA Manager, CAPA mandatory.</div></div></div>}
    </Modal>
  </div>);
}

// ═══════════ NCR ═══════════
function NCRPage({state}){
  const[filter,setFilter]=useState('All');
  const filtered=state.ncrs.filter(n=>filter==='All'||n.status===filter);
  return(<div className="card"><div className="card-h"><div className="card-t">⚠️ Non-Conformance Records ({filtered.length})</div><div className="card-a"><div className="fbar"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="All">All Status</option><option>Open</option><option>Investigation</option><option>Root Cause</option><option>Disposition</option><option>Closed</option></select></div></div></div>
    <div className="tw"><table><thead><tr><th>NCR ID</th><th>Date</th><th>Source</th><th>Lot</th><th>Description</th><th>Severity</th><th>Status</th><th>Blocked</th></tr></thead><tbody>
      {filtered.map(n=><tr key={n.id} style={n.severity==='CRITICAL'?{background:'rgba(255,61,87,.03)'}:{}}><td className="mono">{n.id}</td><td>{n.date}</td><td>{n.source}</td><td className="mono">{n.lot||'—'}</td><td style={{maxWidth:180,fontSize:11.5}}>{n.desc}</td><td><RiskBadge l={n.severity}/></td><td><StatusBadge s={n.status}/></td><td>{n.blocked?<Badge type="fail">🔒</Badge>:'—'}</td></tr>)}
    </tbody></table></div></div>);
}

// ═══════════ CAPA WORKFLOW ═══════════
function CAPAPage({state}){
  const steps=['Open','Root Cause Analysis','Action Planning','Implementation','Verification','Effectiveness Check','Closed Effective'];
  return(<div>
    <div className="card"><div className="card-h"><div className="card-t">🔄 CAPA Workflow</div></div>
      <div style={{padding:16}}><div className="wf-steps">{steps.map((s,i)=>{return <div key={s} className="wf-step"><div className={`wf-node ${i<3?'done':i===3?'active':''}`}>{s}</div>{i<steps.length-1&&<div className="wf-arrow"/>}</div>})}</div></div></div>
    <div className="card"><div className="card-h"><div className="card-t">📋 CAPA Records ({state.capas.length})</div><button className="btn btn-p">+ New CAPA</button></div>
      <div className="tw"><table><thead><tr><th>CAPA ID</th><th>NCR Ref</th><th>Type</th><th>Description</th><th>Responsible</th><th>Target</th><th>Priority</th><th>Status</th></tr></thead><tbody>
        {state.capas.map(c=><tr key={c.id}><td className="mono">{c.id}</td><td className="mono">{c.ncr}</td><td><Badge type={c.type==='Both'?'hold':'active'}>{c.type}</Badge></td><td style={{maxWidth:180,fontSize:11.5}}>{c.desc}</td><td>{c.responsible}</td><td>{c.target}</td><td><RiskBadge l={c.priority}/></td><td><StatusBadge s={c.status}/></td></tr>)}
      </tbody></table></div></div>
    <div className="rule-box"><div className="icon">⚠️</div><div><div className="title">CAPA Workflow Rules</div><div className="text">CCP/Metal Detector NCR → CAPA mandatory • Overdue CAPA → escalation alert • Effectiveness check required by QA Manager • "Not Effective" → re-investigation</div></div></div>
  </div>);
}

// ═══════════ COMPLAINTS ═══════════
function ComplaintsPage({state}){
  return(<div className="card"><div className="card-h"><div className="card-t">📝 Customer Complaints</div><button className="btn btn-p">+ New Complaint</button></div>
    <div className="tw"><table><thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>FG Lot</th><th>Type</th><th>Severity</th><th>Food Safety</th><th>Status</th></tr></thead><tbody>
      {state.complaints.map(c=><tr key={c.id} style={c.fsRisk?{background:'rgba(255,61,87,.03)'}:{}}><td className="mono">{c.id}</td><td>{c.date}</td><td>{c.customer}</td><td className="mono">{c.fgLot}</td><td>{c.type}</td><td><RiskBadge l={c.severity}/></td><td>{c.fsRisk?<Badge type="fail">⚠️ YES</Badge>:<Badge type="pass">No</Badge>}</td><td><StatusBadge s={c.status}/></td></tr>)}
    </tbody></table></div>
    <div className="rule-box" style={{margin:0,borderRadius:0,borderTop:'1px solid rgba(255,61,87,.15)'}}><div className="icon">🚨</div><div><div className="title">Recall Assessment Rule</div><div className="text">food_safety_risk=YES or severity HIGH/CRITICAL → auto-trigger Recall Assessment → NCR auto-created → FG lot blocked</div></div></div>
  </div>);
}

// ═══════════ DOCUMENT CONTROL ═══════════
function DocumentsPage({state}){
  const[filter,setFilter]=useState('All');const[modal,setModal]=useState(false);
  const filtered=state.docs.filter(d=>{if(filter!=='All'&&d.type!==filter)return false;if(d.status==='Obsolete'||d.status==='Superseded')return false;return true});
  const wfSteps=['Draft','Pending Review','Under Review','Pending Approval','Approved','Active'];
  return(<div>
    <div className="card"><div className="card-h"><div className="card-t">📄 Document Approval Workflow</div></div>
      <div style={{padding:16}}><div className="wf-steps">{wfSteps.map((s,i)=><div key={s} className="wf-step"><div className={`wf-node ${i<4?'done':i===4?'active':''}`}>{s}</div>{i<wfSteps.length-1&&<div className="wf-arrow"/>}</div>)}</div></div></div>
    <div className="card"><div className="card-h"><div className="card-t">📑 Document Control ({filtered.length})</div><div className="card-a"><div className="fbar"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="All">All Types</option><option value="QP">QP</option><option value="SOP">SOP</option><option value="WI">WI</option><option value="FM">FM</option><option value="SD">SD</option></select></div><button className="btn btn-p" onClick={()=>setModal(true)}>+ New</button></div></div>
      <div className="tw"><table><thead><tr><th>Doc No.</th><th>Title</th><th>Type</th><th>Rev</th><th>Effective</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {filtered.map(d=><tr key={d.no}><td className="mono">{d.no}</td><td>{d.title}</td><td><Badge type={d.type==='QP'?'hold':d.type==='SOP'?'open':d.type==='FM'?'active':d.type==='WI'?'dm':'pending'}>{d.type}</Badge></td><td className="mono" style={{textAlign:'center'}}>{d.rev}</td><td>{d.eff||'—'}</td><td><StatusBadge s={d.status}/></td>
          <td><div style={{display:'flex',gap:4}}>{d.status==='Draft'&&<button className="btn btn-o btn-sm">Submit</button>}{d.status==='Pending Review'&&<button className="btn btn-g btn-sm">Approve</button>}{d.status==='Active'&&<button className="btn btn-o btn-sm">Revise</button>}</div></td></tr>)}
      </tbody></table></div></div>
    <div className="rule-box"><div className="icon">📋</div><div><div className="title">Document Control Rules</div><div className="text">Draft → Review → Approve → Active (with e-signature) • Obsolete/Superseded docs hidden by default • Revision control maintained • Annual review required • Acknowledgment tracking for distributed docs</div></div></div>
  </div>);
}

// ═══════════ SUPPLIER APPROVAL ═══════════
function SupplierPage({state}){
  const[filter,setFilter]=useState('All');const[detail,setDetail]=useState(null);
  const filtered=SUPPLIERS.filter(s=>filter==='All'||s.type===filter);
  return(<div>
    {detail?<SupplierDetail sup={detail} onBack={()=>setDetail(null)}/>:(
    <div className="card"><div className="card-h"><div className="card-t">🏢 Supplier Approval & Evaluation</div><div className="card-a"><div className="fbar"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="All">All Types</option><option value="RM">RM</option><option value="DM">DM</option><option value="PM">PM</option><option value="CM">CM</option></select></div></div></div>
      <div className="tw"><table><thead><tr><th>ID</th><th>Supplier</th><th>Type</th><th>Risk</th><th>Score</th><th>Grade</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {filtered.map(s=><tr key={s.id}><td className="mono">{s.id}</td><td style={{maxWidth:200,cursor:'pointer',color:'var(--cyan)'}} onClick={()=>setDetail(s)}>{s.name}</td><td><TypeBadge t={s.type}/></td><td><RiskBadge l={s.risk}/></td>
          <td>{s.score?<div style={{display:'flex',alignItems:'center',gap:8}}><span className="mono">{s.score}</span><div style={{width:60}}><div className="score-bar"><div className="score-fill" style={{width:`${s.score}%`,background:s.score>=90?'var(--green)':s.score>=70?'var(--amber)':'var(--red)'}}/></div></div></div>:'—'}</td>
          <td>{s.grade?<span className="mono" style={{fontWeight:600,color:s.grade==='A'?'var(--green)':s.grade==='B'?'var(--cyan)':s.grade==='C'?'var(--amber)':'var(--red)'}}>{s.grade}</span>:'—'}</td>
          <td><StatusBadge s={s.status}/></td>
          <td>{s.status==='Pending'?<button className="btn btn-g btn-sm">Evaluate</button>:<button className="btn btn-o btn-sm" onClick={()=>setDetail(s)}>View</button>}</td></tr>)}
      </tbody></table></div></div>)}
    <div className="rule-box"><div className="icon">🏢</div><div><div className="title">Supplier Approval Workflow</div><div className="text">New → Evaluation (Quality/Delivery/Price/Service/Compliance) → Score & Grade → Approve/Conditional/Reject → Annual Re-evaluation • Grade D/F → Suspension review • RM suppliers require annual audit</div></div></div>
  </div>);
}

function SupplierDetail({sup,onBack}){
  const wfSteps=['Registration','Evaluation','Scoring','Approval','Monitoring'];
  const criteria=[{name:'Quality',weight:'30%',score:sup.score?Math.round(sup.score*1.02):0},{name:'Delivery',weight:'25%',score:sup.score?Math.round(sup.score*0.95):0},{name:'Price',weight:'15%',score:sup.score?Math.round(sup.score*0.98):0},{name:'Service',weight:'15%',score:sup.score?Math.round(sup.score*1.01):0},{name:'Compliance',weight:'15%',score:sup.score?Math.round(sup.score*0.97):0}];
  return(<div>
    <div style={{marginBottom:12}}><button className="btn btn-o" onClick={onBack}>← Back to List</button></div>
    <div className="card"><div className="card-h"><div className="card-t">🏢 {sup.name}</div><div className="card-a"><StatusBadge s={sup.status}/></div></div>
      <div style={{padding:16}}><div className="wf-steps">{wfSteps.map((s,i)=><div key={s} className="wf-step"><div className={`wf-node ${sup.status==='Approved'?'done':i<=2?'done':i===3?'active':''}`}>{s}</div>{i<wfSteps.length-1&&<div className="wf-arrow"/>}</div>)}</div></div>
      <div className="detail-row"><div className="detail-l">Supplier ID</div><div className="detail-v mono">{sup.id}</div></div>
      <div className="detail-row"><div className="detail-l">Material Type</div><div className="detail-v"><TypeBadge t={sup.type}/></div></div>
      <div className="detail-row"><div className="detail-l">Risk Level</div><div className="detail-v"><RiskBadge l={sup.risk}/></div></div>
      <div className="detail-row"><div className="detail-l">Total Score</div><div className="detail-v"><span className="mono" style={{fontSize:18,fontWeight:700,color:sup.score>=90?'var(--green)':sup.score>=70?'var(--amber)':'var(--red)'}}>{sup.score||'—'}</span></div></div>
      <div className="detail-row"><div className="detail-l">Grade</div><div className="detail-v"><span style={{fontSize:18,fontWeight:700}}>{sup.grade||'—'}</span></div></div></div>
    {sup.score&&<div className="card"><div className="card-h"><div className="card-t">📊 Evaluation Criteria Breakdown</div></div><div className="tw"><table><thead><tr><th>Criteria</th><th>Weight</th><th>Score</th><th>Bar</th></tr></thead><tbody>
      {criteria.map(c=><tr key={c.name}><td style={{fontWeight:500}}>{c.name}</td><td>{c.weight}</td><td className="mono">{c.score}</td><td><div style={{width:120}}><div className="score-bar"><div className="score-fill" style={{width:`${c.score}%`,background:c.score>=90?'var(--green)':c.score>=70?'var(--amber)':'var(--red)'}}/></div></div></td></tr>)}
    </tbody></table></div></div>}
  </div>);
}

// ═══════════ TRACEABILITY ═══════════
function TraceabilityPage(){
  return(<div>
    <div className="card"><div className="card-h"><div className="card-t">🔗 Traceability — Forward & Backward Trace</div><div className="fbar"><input className="form-input" defaultValue="FGL260514-01" style={{fontFamily:'var(--mono)'}}/><button className="btn btn-p">🔍 Trace</button></div></div></div>
    <div className="grid-2">
      <div className="card"><div className="card-h"><div className="card-t">📦 FG Lot</div></div>
        <div className="detail-row"><div className="detail-l">FG Lot No.</div><div className="detail-v mono">FGL260514-01</div></div>
        <div className="detail-row"><div className="detail-l">FG Code</div><div className="detail-v">FG-M002</div></div>
        <div className="detail-row"><div className="detail-l">Product</div><div className="detail-v">หมูปิ้งนมสดเสียบไม้ Size L</div></div>
        <div className="detail-row"><div className="detail-l">Batch</div><div className="detail-v mono">B-20260514-001</div></div>
        <div className="detail-row"><div className="detail-l">Production</div><div className="detail-v">{now()}</div></div>
        <div className="detail-row"><div className="detail-l">Release</div><div className="detail-v"><Badge type="pass">Released</Badge></div></div>
        <div className="detail-row"><div className="detail-l">Metal Det.</div><div className="detail-v"><Badge type="pass">All CCP PASS</Badge></div></div></div>
      <div className="card"><div className="card-h"><div className="card-t">📥 Raw Materials (Backward)</div></div><div className="tw"><table><thead><tr><th>Code</th><th>Name</th><th>RM Lot</th><th>Qty</th><th>Supplier</th></tr></thead><tbody>
        <tr><td className="mono">RM0001</td><td>สะโพกหมู</td><td className="mono">L260514-RM01</td><td>120 kg</td><td className="mono">SP0001</td></tr>
        <tr><td className="mono">PD0001</td><td>ซอสหอยนางรม</td><td className="mono">L260514-DM01</td><td>15 kg</td><td className="mono">SP0008</td></tr>
        <tr><td className="mono">PD0019</td><td>นมจืด</td><td className="mono">L260514-DM02</td><td>30 กระป๋อง</td><td className="mono">SP0007</td></tr>
        <tr><td className="mono">PK0019</td><td>ไม้กลม 3*5</td><td className="mono">L260514-PK01</td><td>50 kg</td><td className="mono">SP0025</td></tr>
      </tbody></table></div></div></div></div>);
}

// ═══════════ REMAINING PAGES ═══════════
function MaterialsPage(){const[f,setF]=useState('All');const list=MATERIALS.filter(m=>f==='All'||m.type===f);return(<div className="card"><div className="card-h"><div className="card-t">📦 Materials ({list.length})</div><div className="fbar"><select value={f} onChange={e=>setF(e.target.value)}><option value="All">All</option><option value="RM">RM</option><option value="DM">DM</option><option value="PM">PM</option><option value="CM">CM</option></select></div></div><div className="tw"><table><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Category</th><th>Unit</th><th>Temp</th><th>Shelf</th></tr></thead><tbody>{list.map(m=><tr key={m.code}><td className="mono">{m.code}</td><td>{m.name}</td><td><TypeBadge t={m.type}/></td><td>{m.cat}</td><td>{m.unit}</td><td>{m.minT!=null?`${m.minT}–${m.maxT}°C`:'—'}</td><td>{m.shelf?`${m.shelf}d`:'—'}</td></tr>)}</tbody></table></div></div>)}
function FGPage(){return(<div className="card"><div className="card-h"><div className="card-t">🏷️ Finished Goods ({FG.length})</div></div><div className="tw"><table><thead><tr><th>Code</th><th>Product</th><th>Type</th><th>Temp</th><th>Shelf</th><th>Weight (g)</th></tr></thead><tbody>{FG.map(f=><tr key={f.code}><td className="mono">{f.code}</td><td>{f.name}</td><td><Badge type="active">{f.type}</Badge></td><td>{f.temp}°C</td><td>{f.shelf}d</td><td>{f.minW&&f.maxW?`${f.minW}–${f.maxW}`:'—'}</td></tr>)}</tbody></table></div></div>)}
function ProcessesPage(){return(<div className="card"><div className="card-h"><div className="card-t">⚙️ Process Master</div></div><div className="tw"><table><thead><tr><th>#</th><th>ID</th><th>Process</th><th>EN</th><th>Area</th><th>CCP</th></tr></thead><tbody>{PROCESSES.map((p,i)=><tr key={p.id} style={p.ccp?{background:'rgba(255,61,87,.03)'}:{}}><td>{i+1}</td><td className="mono">{p.id}</td><td>{p.name}</td><td>{p.en}</td><td style={{fontSize:11}}>{p.area}</td><td>{p.ccp?<Badge type="ccp">CCP</Badge>:'—'}</td></tr>)}</tbody></table></div></div>)}
function EquipmentPage(){return(<div className="card"><div className="card-h"><div className="card-t">🔧 Equipment & Calibration</div></div><div className="tw"><table><thead><tr><th>ID</th><th>Equipment</th><th>Type</th><th>Calibration</th></tr></thead><tbody>{EQUIP.map(e=><tr key={e.id}><td className="mono">{e.id}</td><td>{e.name}</td><td><Badge type={e.type==='Testing'?'hold':'active'}>{e.type}</Badge></td><td><StatusBadge s={e.cal==='Due'?'HOLD':e.cal}/></td></tr>)}</tbody></table></div></div>)}
function HygienePage(){const cats=['Personnel','Hand Washing','Clothing','Cleaning','Chemical','Pest','Waste','Water','Glass','Foreign Matter','Maintenance','Allergen','Temperature','Zoning','Cross Contamination'];const icons=['👤','🤲','👕','🧹','🧪','🪲','🗑️','💧','🪟','🔎','🔩','⚠️','🌡️','🟦','🚫'];return(<div className="card"><div className="card-h"><div className="card-t">🧼 GHP Foundation Programs — 15 Categories</div><button className="btn btn-p">+ Daily Checklist</button></div><div style={{padding:16,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:8}}>{cats.map((c,i)=><div key={c} style={{padding:'10px 14px',background:'var(--bg1)',border:'1px solid var(--bdr)',borderRadius:'var(--rs)',display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:16}}>{icons[i]}</span><div><div style={{fontWeight:500,fontSize:12,color:'var(--t1)'}}>{c}</div><div style={{fontSize:10,color:'var(--t4)'}}>GHP</div></div></div>)}</div></div>)}
function CleaningPage(){return(<div className="card"><div className="card-h"><div className="card-t">🧹 Cleaning & Sanitation</div><button className="btn btn-p">+ New Record</button></div><div className="tw"><table><thead><tr><th>Date</th><th>Area</th><th>Chemical</th><th>Pre-Clean</th><th>Post-Clean</th><th>Verified</th></tr></thead><tbody><tr><td>{d(0)}</td><td>ห้องผลิต</td><td>CM0001</td><td><StatusBadge s="PASS"/></td><td><StatusBadge s="PASS"/></td><td>QA-03</td></tr><tr><td>{d(0)}</td><td>ห้องบรรจุ</td><td>CM0004</td><td><StatusBadge s="PASS"/></td><td><StatusBadge s="PASS"/></td><td>QA-03</td></tr><tr><td>{d(1)}</td><td>ห้องผลิต</td><td>CM0001</td><td><StatusBadge s="FAIL"/></td><td><StatusBadge s="PASS"/></td><td>QA-02</td></tr></tbody></table></div></div>)}
function AlertsPage({state}){return(<div className="card"><div className="card-h"><div className="card-t">🔔 Active Alerts ({state.alerts.length})</div></div>{state.alerts.map(a=><div key={a.id} className="alert-item"><div className={`alert-dot ${a.sev==='EMERGENCY'?'emergency':a.sev==='CRITICAL'?'critical':'warning'}`}/><div style={{flex:1}}><div style={{display:'flex',gap:8,alignItems:'center',marginBottom:2}}><span style={{fontSize:13,fontWeight:500,color:'var(--t1)'}}>{a.title}</span><Badge type={a.sev==='EMERGENCY'||a.sev==='CRITICAL'?'fail':'hold'}>{a.sev}</Badge></div><div style={{fontSize:11.5,color:'var(--t3)'}}>{a.msg}</div><div className="mono" style={{fontSize:10,color:'var(--t4)',marginTop:2}}>{a.type} · {a.at}</div></div><button className="btn btn-o btn-sm">Ack</button></div>)}</div>)}
function AuditTrailPage(){const trail=[{action:'INSERT',table:'inspection_logs',rec:'INS-20260514',by:'QA-01',at:`${d(0)} 08:30`,field:'result_status',nv:'PASS'},{action:'STATUS_CHANGE',table:'ncr_records',rec:'NCR-20260514-005',by:'QA-MGR',at:`${d(0)} 14:20`,field:'status',ov:'Open',nv:'Investigation'},{action:'INSERT',table:'metal_detector_logs',rec:'MD-20260514',by:'QA-02',at:`${d(0)} 10:15`,field:'result_status',nv:'FAIL'},{action:'INSERT',table:'alerts',rec:'ALT-005',by:'SYSTEM',at:`${d(0)} 10:16`,field:'auto',nv:'LOT_BLOCKED'},{action:'RELEASE',table:'finished_goods_lots',rec:'FGL260514-01',by:'QA-MGR',at:`${d(0)} 16:00`,field:'release_status',ov:'Pending',nv:'Released'}];return(<div className="card"><div className="card-h"><div className="card-t">📋 Immutable Audit Trail</div></div><div className="tw"><table><thead><tr><th>Timestamp</th><th>Action</th><th>Table</th><th>Record</th><th>Field</th><th>Change</th><th>User</th></tr></thead><tbody>{trail.map((t,i)=><tr key={i}><td className="mono" style={{whiteSpace:'nowrap',fontSize:11}}>{t.at}</td><td><Badge type={t.action==='INSERT'?'active':t.action==='STATUS_CHANGE'?'hold':t.action==='RELEASE'?'pass':'open'}>{t.action}</Badge></td><td style={{fontSize:11}}>{t.table}</td><td className="mono" style={{fontSize:11}}>{t.rec}</td><td>{t.field}</td><td style={{fontSize:11.5}}>{t.ov?`${t.ov} → `:''}{t.nv}</td><td>{t.by}</td></tr>)}</tbody></table></div></div>)}

// ═══════════ NAV CONFIG ═══════════
const NAV=[
  {label:"Overview",items:[{k:"dashboard",icon:"📊",l:"dashboard"},{k:"alerts",icon:"🔔",l:"alerts",badge:5}]},
  {label:"Master Data",items:[{k:"suppliers",icon:"🏢",l:"suppliers"},{k:"materials",icon:"📦",l:"materials"},{k:"fg",icon:"🏷️",l:"finishedGoods"},{k:"processes",icon:"⚙️",l:"processes"},{k:"equipment",icon:"🔧",l:"equipment"}]},
  {label:"Operations",items:[{k:"incomingQC",icon:"🔍",l:"incomingQC"},{k:"ccp",icon:"🎯",l:"ccpMonitoring"},{k:"metal",icon:"⚡",l:"metalDetector"}]},
  {label:"Quality",items:[{k:"ncr",icon:"⚠️",l:"ncr",badge:3},{k:"capa",icon:"🔄",l:"capa",badge:2},{k:"complaints",icon:"📝",l:"complaints"}]},
  {label:"Compliance",items:[{k:"trace",icon:"🔗",l:"traceability"},{k:"docs",icon:"📄",l:"documents"},{k:"hygiene",icon:"🧼",l:"hygiene"},{k:"cleaning",icon:"🧹",l:"cleaning"},{k:"audit",icon:"📋",l:"auditTrail"}]},
];

const PAGES={dashboard:DashboardPage,suppliers:SupplierPage,materials:MaterialsPage,fg:FGPage,processes:ProcessesPage,equipment:EquipmentPage,incomingQC:IncomingQCPage,ccp:CCPPage,metal:MetalDetectorPage,ncr:NCRPage,capa:CAPAPage,complaints:ComplaintsPage,trace:TraceabilityPage,docs:DocumentsPage,hygiene:HygienePage,cleaning:CleaningPage,alerts:AlertsPage,audit:AuditTrailPage};

// ═══════════ MAIN APP ═══════════
export default function App(){
  const[auth,setAuth]=useState(null);
  const[page,setPage]=useState('dashboard');
  const[lang,setLang]=useState('en');
  const[sbOpen,setSbOpen]=useState(false);
  const state=useAppState();

  if(!auth)return <><style>{CSS}</style><LoginPage onLogin={u=>setAuth(u)}/></>;

  const PageComp=PAGES[page]||DashboardPage;
  const pageTitle=useMemo(()=>{for(const s of NAV){const it=s.items.find(i=>i.k===page);if(it)return t(it.l,lang)}return t('dashboard',lang)},[page,lang]);
  const nav=k=>{setPage(k);setSbOpen(false)};

  return(
    <AuthContext.Provider value={auth}>
    <LangContext.Provider value={{lang,setLang}}>
    <style>{CSS}</style>
    <div className="app">
      <aside className={`sidebar ${sbOpen?'open':'closed'}`}>
        <div className="sb-logo"><div className="icon">QA</div><div><h2>Smart QA Factory</h2><small>HACCP · ISO 22000</small></div></div>
        <nav className="sb-nav">
          {NAV.map(sec=><div key={sec.label}><div className="nav-section">{sec.label}</div>{sec.items.map(it=><div key={it.k} className={`nav-item ${page===it.k?'active':''}`} onClick={()=>nav(it.k)}><span className="nav-icon">{it.icon}</span><span>{t(it.l,lang)}</span>{it.badge&&<span className="nav-badge">{it.badge}</span>}</div>)}</div>)}
        </nav>
        <div className="sb-footer"><div style={{display:'flex',alignItems:'center',gap:8}}><div className="tb-avatar" style={{width:24,height:24,fontSize:9}}>{auth.username?.[0]?.toUpperCase()}</div><div><div style={{fontWeight:500,color:'var(--t2)',fontSize:11}}>{auth.displayName}</div><div style={{fontSize:10,color:'var(--t4)'}}>{auth.role}</div></div></div></div>
      </aside>
      {sbOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:99}} onClick={()=>setSbOpen(false)}/>}
      <div className={`main ${!sbOpen?'':'full'}`}>
        <header className="topbar">
          <button className="tb-ham" onClick={()=>setSbOpen(!sbOpen)}>☰</button>
          <div className="tb-title">{pageTitle}</div>
          <div className="tb-right">
            <button className="tb-lang" onClick={()=>setLang(l=>l==='en'?'th':'en')}>{lang==='en'?'🇹🇭 ไทย':'🇬🇧 EN'}</button>
            <div className="tb-user"><div className="tb-avatar">{auth.username?.[0]?.toUpperCase()}</div></div>
            <button className="btn btn-o btn-sm" onClick={()=>setAuth(null)}>{t('logout',lang)}</button>
          </div>
        </header>
        <div className="content"><PageComp state={state}/></div>
      </div>
    </div>
    </LangContext.Provider>
    </AuthContext.Provider>
  );
}
