import { useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";

// ═══════════════════════════════════════════════════
// SMART QA FACTORY SYSTEM — Enterprise Dashboard
// Compliance: HACCP · ISO 22000 · FSSC 22000 · GMP
// ═══════════════════════════════════════════════════

// ─── Language Context ───
const LangContext = createContext();
const useLang = () => useContext(LangContext);

const T = {
  dashboard: { en: "Dashboard", th: "แดชบอร์ด" },
  masterData: { en: "Master Data", th: "ข้อมูลหลัก" },
  suppliers: { en: "Suppliers", th: "ซัพพลายเออร์" },
  materials: { en: "Materials", th: "วัตถุดิบ" },
  finishedGoods: { en: "Finished Goods", th: "สินค้าสำเร็จรูป" },
  processes: { en: "Processes", th: "กระบวนการ" },
  equipment: { en: "Equipment", th: "เครื่องมือ" },
  incomingQC: { en: "Incoming QC", th: "ตรวจรับวัตถุดิบ" },
  ccpMonitoring: { en: "CCP Monitoring", th: "ติดตาม CCP" },
  metalDetector: { en: "Metal Detector", th: "เครื่องตรวจโลหะ" },
  ncr: { en: "NCR", th: "ใบ NCR" },
  capa: { en: "CAPA", th: "CAPA" },
  complaints: { en: "Complaints", th: "ข้อร้องเรียน" },
  traceability: { en: "Traceability", th: "การสอบกลับ" },
  documents: { en: "Documents", th: "ควบคุมเอกสาร" },
  hygiene: { en: "Hygiene & GHP", th: "สุขลักษณะ GHP" },
  cleaning: { en: "Cleaning", th: "การทำความสะอาด" },
  auditTrail: { en: "Audit Trail", th: "บันทึกตรวจสอบ" },
  alerts: { en: "Alerts", th: "การแจ้งเตือน" },
  openNCR: { en: "Open NCR", th: "NCR เปิด" },
  openCAPA: { en: "Open CAPA", th: "CAPA เปิด" },
  activeAlerts: { en: "Active Alerts", th: "แจ้งเตือน" },
  lotsOnHold: { en: "Lots on Hold", th: "ล็อตถูกพัก" },
  passRate: { en: "Pass Rate (30d)", th: "อัตราผ่าน (30 วัน)" },
  failsThisWeek: { en: "Fails (7d)", th: "ไม่ผ่าน (7 วัน)" },
  calibDue: { en: "Calibration Due", th: "ครบกำหนดสอบเทียบ" },
  complaints_: { en: "Complaints", th: "ข้อร้องเรียน" },
  search: { en: "Search...", th: "ค้นหา..." },
  all: { en: "All", th: "ทั้งหมด" },
  approved: { en: "Approved", th: "อนุมัติ" },
  conditional: { en: "Conditional", th: "มีเงื่อนไข" },
  high: { en: "HIGH", th: "สูง" },
  medium: { en: "MEDIUM", th: "กลาง" },
  low: { en: "LOW", th: "ต่ำ" },
  pass: { en: "PASS", th: "ผ่าน" },
  fail: { en: "FAIL", th: "ไม่ผ่าน" },
  hold: { en: "HOLD", th: "พัก" },
  open: { en: "Open", th: "เปิด" },
  closed: { en: "Closed", th: "ปิด" },
  status: { en: "Status", th: "สถานะ" },
  action: { en: "Action", th: "ดำเนินการ" },
  date: { en: "Date", th: "วันที่" },
  lot: { en: "Lot No.", th: "เลขล็อต" },
  result: { en: "Result", th: "ผลตรวจ" },
};

const t = (key, lang) => T[key]?.[lang] || T[key]?.en || key;

// ─── Seed Data (from QA_Master_DATA) ───
const SUPPLIERS = [
  { supplier_id: "SP0001", supplier_name: "บริษัท เบทาโกรเกษตรอุตสาหกรรม จำกัด (หมู)", material_type: "RM", risk_level: "HIGH", approved_status: "Approved" },
  { supplier_id: "SP0002", supplier_name: "บริษัท เบทาโกรเกษตรอุตสาหกรรม จำกัด (ไก่)", material_type: "RM", risk_level: "HIGH", approved_status: "Approved" },
  { supplier_id: "SP0003", supplier_name: "บริษัท เอส แอล พิทักษ์ จำกัด", material_type: "RM", risk_level: "HIGH", approved_status: "Approved" },
  { supplier_id: "SP0004", supplier_name: "บริษัท ฟู้ดจ๊อบ จำกัด", material_type: "RM", risk_level: "HIGH", approved_status: "Approved" },
  { supplier_id: "SP0005", supplier_name: "ห้างหุ้นส่วนจำกัด หมูสามตัว", material_type: "DM", risk_level: "HIGH", approved_status: "Approved" },
  { supplier_id: "SP0006", supplier_name: "ร้าน ปายปายค้าข้าว", material_type: "DM", risk_level: "LOW", approved_status: "Conditional" },
  { supplier_id: "SP0007", supplier_name: "บริษัท ซีพีแอ็กซ์ตร้า จำกัด (มหาชน)", material_type: "DM", risk_level: "LOW", approved_status: "Approved" },
  { supplier_id: "SP0008", supplier_name: "บริษัท หยั่นหว่อหยุ่น คอร์ปอเรชั่น จำกัด", material_type: "DM", risk_level: "LOW", approved_status: "Approved" },
  { supplier_id: "SP0022", supplier_name: "บริษัท อุทัยพลาสติกอุตสาหกรรม จำกัด", material_type: "PM", risk_level: "LOW", approved_status: "Approved" },
  { supplier_id: "SP0027", supplier_name: "ห้างหุ้นส่วนจำกัด วี-ริน เคมีคอล", material_type: "CM", risk_level: "MEDIUM", approved_status: "Approved" },
  { supplier_id: "SP0028", supplier_name: "บริษัท เอ็นริช อินเตอร์เคมิคัล จำกัด", material_type: "CM", risk_level: "MEDIUM", approved_status: "Approved" },
  { supplier_id: "SP0034", supplier_name: "บริษัท อีเค ซลอเทอร์เฮาส์ จำกัด", material_type: "RM", risk_level: "HIGH", approved_status: "Approved" },
];

const MATERIALS = [
  { material_code: "RM0001", material_name: "สะโพกหมู", material_type: "RM", category: "Pork", unit: "กิโลกรัม", min_temp: 0, max_temp: 7, shelf_life_days: 6 },
  { material_code: "RM0002", material_name: "มันสันแข็ง", material_type: "RM", category: "Pork", unit: "กิโลกรัม", min_temp: 0, max_temp: 7, shelf_life_days: 6 },
  { material_code: "RM0004", material_name: "เศษบีบติดหนัง", material_type: "RM", category: "Chicken", unit: "กิโลกรัม", min_temp: 0, max_temp: 7, shelf_life_days: 5 },
  { material_code: "RM0005", material_name: "อกไก่", material_type: "RM", category: "Chicken", unit: "กิโลกรัม", min_temp: 0, max_temp: 7, shelf_life_days: 5 },
  { material_code: "RM0006", material_name: "ข้าวสารเหนียว", material_type: "DM", category: "Rice", unit: "กิโลกรัม" },
  { material_code: "PD0001", material_name: "ซอสหอยนางรมหมู", material_type: "DM", category: "Seasoning", unit: "กิโลกรัม" },
  { material_code: "PD0010", material_name: "เกลือ", material_type: "DM", category: "Ingredient", unit: "กิโลกรัม" },
  { material_code: "PD0019", material_name: "นมจืด", material_type: "DM", category: "Ingredient", unit: "กระป๋อง" },
  { material_code: "PK0001", material_name: "กล่องลูกฟูก 5 ชั้น 287*385*305", material_type: "PM", category: "Packaging", unit: "ใบ" },
  { material_code: "PK0019", material_name: "ไม้กลม 3*5", material_type: "PM", category: "Skewer", unit: "กิโลกรัม" },
  { material_code: "CM0001", material_name: "CL - NEXGEN PH-1000", material_type: "CM", category: "Cleaning", unit: "ลิตร" },
  { material_code: "CM0002", material_name: "SN - คลอรีนน้ำ 10%", material_type: "CM", category: "Sanitizing", unit: "กิโลกรัม" },
];

const FINISHED_GOODS = [
  { fg_code: "FG-M002", fg_name: "หมูปิ้งนมสดเสียบไม้ - Size L", product_type: "Pork Marinated", storage_temp: -18, shelf_life_days: 365, min_weight: 50, max_weight: 52 },
  { fg_code: "FG-M003", fg_name: "หมูปิ้งนมสดเสียบไม้ - Size S", product_type: "Pork Marinated", storage_temp: -18, shelf_life_days: 365, min_weight: 25, max_weight: 26 },
  { fg_code: "FG-M006", fg_name: "หมูปิ้งนมสดแช่แข็ง 25 ก (MK)", product_type: "Pork Marinated", storage_temp: -18, shelf_life_days: 365, min_weight: 25, max_weight: 26 },
  { fg_code: "FG-M010", fg_name: "หมูแดดเดียว", product_type: "Pork Marinated", storage_temp: -18, shelf_life_days: 365, min_weight: 35, max_weight: 37 },
  { fg_code: "FG-M011", fg_name: "หมูปิ้งโบราณ Size L", product_type: "Pork Marinated", storage_temp: -18, shelf_life_days: 365 },
  { fg_code: "FG-K001", fg_name: "ไก่แดงโบราณ", product_type: "Chicken Marinated", storage_temp: -18, shelf_life_days: 365 },
  { fg_code: "FG-K002", fg_name: "ไก่พริกไทยดำ", product_type: "Chicken Marinated", storage_temp: -18, shelf_life_days: 365, min_weight: 50, max_weight: 52 },
  { fg_code: "FG-K003", fg_name: "ไก่ปิ้งนมสด", product_type: "Chicken Marinated", storage_temp: -18, shelf_life_days: 365, min_weight: 50, max_weight: 52 },
  { fg_code: "FG-L001", fg_name: "ลูกชิ้นหมู", product_type: "Meat Ball", storage_temp: -18, shelf_life_days: 365 },
  { fg_code: "FG-S001", fg_name: "ไส้กรอกวุ้นเส้น", product_type: "Esan Sausage", storage_temp: -18, shelf_life_days: 365 },
];

const PROCESSES = [
  { process_id: "PC0001", process_name: "การรับเข้าวัตถุดิบ", description: "Receiving inspection", work_area: "จุดรับวัตถุดิบ", seq: 1 },
  { process_id: "PC0002", process_name: "การจัดเก็บวัตถุดิบ", description: "RM Storage", work_area: "ห้องแช่เย็น", seq: 2 },
  { process_id: "PC0003", process_name: "การตัดและตกแต่ง", description: "Trimming", work_area: "จุดตัดแต่ง", seq: 3 },
  { process_id: "PC0004", process_name: "การชั่งน้ำหนักส่วนผสม", description: "Weighing", work_area: "ห้องชั่งสาร", seq: 4 },
  { process_id: "PC0008", process_name: "การผสมและการหมัก", description: "Mixing/Marinating", work_area: "ห้องผลิต", seq: 5 },
  { process_id: "PC0009", process_name: "การเสียบไม้และขึ้นรูป", description: "Skewering", work_area: "ห้องผลิต", seq: 6 },
  { process_id: "PC0012", process_name: "การตรวจจับโลหะ (CCP)", description: "Metal Detection CCP", work_area: "ห้องผลิต", seq: 7, is_ccp: true },
  { process_id: "PC0013", process_name: "การบรรจุ/ซีล/ติดฉลาก", description: "Packing/Sealing/Labeling", work_area: "ห้องบรรจุ", seq: 8 },
  { process_id: "PC0014", process_name: "การแช่แข็ง", description: "Blast Freezing", work_area: "ห้องแช่เยือกแข็ง", seq: 9 },
  { process_id: "PC0015", process_name: "การจัดเก็บสินค้าแช่แข็ง", description: "FG Storage ≤-18°C", work_area: "ห้องจัดเก็บ FG", seq: 10 },
  { process_id: "PC0016", process_name: "การจ่ายสินค้า/การจัดส่ง", description: "Dispatch", work_area: "จุดโหลดสินค้า", seq: 11 },
];

const PARAMETERS = [
  { parameter_id: "PR0001", parameter_name: "อุณหภูมิรถขนส่ง (RM)", category: "Temperature", spec: "0 - 4 °C", unit: "°C" },
  { parameter_id: "PR0002", parameter_name: "ค่า pH รับเข้าเนื้อสัตว์", category: "Quality", spec: "5.5 - 5.8", unit: "-" },
  { parameter_id: "PR0004", parameter_name: "อุณหภูมิแกนกลาง RM", category: "Temperature", spec: "0 - 7 °C", unit: "°C" },
  { parameter_id: "PR0005", parameter_name: "อุณหภูมิห้องผลิต", category: "Temperature", spec: "≤ 12 °C", unit: "°C" },
  { parameter_id: "PR0007", parameter_name: "อุณหภูมิห้องแช่แข็ง", category: "Temperature", spec: "≤ -18 °C", unit: "°C" },
  { parameter_id: "PR0008", parameter_name: "ตรวจจับโลหะ (เหล็ก)", category: "Food Safety", spec: "ø 1.0 mm", unit: "mm" },
  { parameter_id: "PR0009", parameter_name: "ตรวจจับโลหะ (Non-Fe)", category: "Food Safety", spec: "ø 1.5 mm", unit: "mm" },
  { parameter_id: "PR0010", parameter_name: "ตรวจจับโลหะ (SUS)", category: "Food Safety", spec: "ø 2.0 mm", unit: "mm" },
  { parameter_id: "PR0013", parameter_name: "น้ำหนัก/ไม้", category: "Weight", spec: "within tolerance", unit: "กรัม" },
  { parameter_id: "PR0017", parameter_name: "สิ่งแปลกปลอม", category: "Quality", spec: "ไม่พบ", unit: "-" },
  { parameter_id: "PR0023", parameter_name: "ค่า pH น้ำ", category: "Food Safety", spec: "6.5 - 8.5", unit: "-" },
  { parameter_id: "PR0024", parameter_name: "คลอรีนอิสระ", category: "Food Safety", spec: "0.2 - 0.5 ppm", unit: "ppm" },
];

const EQUIPMENT_DATA = [
  { equipment_id: "MDB001", equipment_name: "เครื่องชั่ง 6 kg (ห้องเครื่องเสียบ)", equipment_type: "Measuring" },
  { equipment_id: "MDB003", equipment_name: "เครื่องชั่ง 15 kg (ห้องชั่งสาร)", equipment_type: "Measuring" },
  { equipment_id: "MDB006", equipment_name: "เครื่องชั่ง 100 kg (จุดเตรียมวัตถุดิบ)", equipment_type: "Measuring" },
  { equipment_id: "MDB010", equipment_name: "เครื่องชั่ง 150 kg (จุดรับ RM)", equipment_type: "Measuring" },
  { equipment_id: "MTC001", equipment_name: "ห้องแช่เย็น (RM)", equipment_type: "Measuring" },
  { equipment_id: "MTF001", equipment_name: "ห้องแช่เยือกแข็ง FG 1", equipment_type: "Measuring" },
  { equipment_id: "MPH001", equipment_name: "pH Meter 001", equipment_type: "Measuring" },
  { equipment_id: "TMD001", equipment_name: "Metal Detector - S", equipment_type: "Testing" },
  { equipment_id: "TMD002", equipment_name: "Metal Detector - L", equipment_type: "Testing" },
  { equipment_id: "TTS001", equipment_name: "Test Strips Chlorine", equipment_type: "Testing" },
];

const CCP_DATA = [
  { ccp_id: "CCP001", process_id: "PC0012", ccp_name: "ตรวจจับสิ่งแปลกปลอม Fe", critical_limit: "ø 1.0 mm" },
  { ccp_id: "CCP002", process_id: "PC0012", ccp_name: "ตรวจจับสิ่งแปลกปลอม Non-Fe", critical_limit: "ø 1.5 mm" },
  { ccp_id: "CCP003", process_id: "PC0012", ccp_name: "ตรวจจับสิ่งแปลกปลอม SUS", critical_limit: "ø 2.0 mm" },
];

// Sample operational data
const genDate = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().split('T')[0]; };
const genNCRId = (i) => `NCR-2026${String(i).padStart(4, '0')}`;
const genCAPAId = (i) => `CAPA-2026${String(i).padStart(4, '0')}`;

const SAMPLE_NCR = [
  { ncr_id: genNCRId(1), ncr_date: genDate(2), source: "Inspection", lot_no: "L260510-01", severity: "MEDIUM", status: "Open", description: "อุณหภูมิรถขนส่งเกินกำหนด 6°C", risk_level: "MEDIUM" },
  { ncr_id: genNCRId(2), ncr_date: genDate(5), source: "CCP", lot_no: "L260508-03", severity: "HIGH", status: "Investigation", description: "Metal detector FAIL - Fe detected", risk_level: "HIGH", lot_blocked: 1 },
  { ncr_id: genNCRId(3), ncr_date: genDate(8), source: "Complaint", lot_no: "L260505-01", severity: "HIGH", status: "Disposition", description: "ลูกค้าพบสิ่งแปลกปลอม", risk_level: "HIGH" },
  { ncr_id: genNCRId(4), ncr_date: genDate(15), source: "Audit", severity: "LOW", status: "Closed", description: "เอกสาร SOP ไม่อัพเดต", risk_level: "LOW" },
  { ncr_id: genNCRId(5), ncr_date: genDate(1), source: "Metal Detector", lot_no: "L260512-02", severity: "CRITICAL", status: "Open", description: "Metal detector verification FAIL", risk_level: "CRITICAL", lot_blocked: 1 },
];

const SAMPLE_CAPA = [
  { capa_id: genCAPAId(1), ncr_id: genNCRId(1), capa_type: "Corrective", status: "In Progress", description: "แก้ไขระบบตรวจสอบอุณหภูมิรถ", target_date: genDate(-10) },
  { capa_id: genCAPAId(2), ncr_id: genNCRId(2), capa_type: "Both", status: "Open", description: "ปรับปรุง Metal Detector sensitivity", target_date: genDate(-5) },
  { capa_id: genCAPAId(3), ncr_id: genNCRId(3), capa_type: "Corrective", status: "Verification", description: "ทบทวนกระบวนการตรวจสอบ FG", target_date: genDate(-15) },
];

const SAMPLE_COMPLAINTS = [
  { complaint_id: "CC-20260501-001", complaint_date: genDate(12), customer_name: "Tops Supermarket", fg_lot_no: "FGL260428-01", complaint_type: "Foreign Matter", severity: "HIGH", status: "Investigation", food_safety_risk: 1 },
  { complaint_id: "CC-20260508-001", complaint_date: genDate(5), customer_name: "MK Restaurant", fg_lot_no: "FGL260505-02", complaint_type: "Quality", severity: "MEDIUM", status: "Open", food_safety_risk: 0 },
];

const SAMPLE_INSPECTIONS = [
  { id: 1, lot_no: "L260513-01", process_id: "PC0001", parameter_id: "PR0001", result_value: "3.2°C", result_status: "PASS", inspection_date: genDate(0), inspector: "QA-01" },
  { id: 2, lot_no: "L260513-01", process_id: "PC0001", parameter_id: "PR0002", result_value: "5.6", result_status: "PASS", inspection_date: genDate(0), inspector: "QA-01" },
  { id: 3, lot_no: "L260512-02", process_id: "PC0001", parameter_id: "PR0001", result_value: "6.1°C", result_status: "FAIL", inspection_date: genDate(1), inspector: "QA-02" },
  { id: 4, lot_no: "L260512-01", process_id: "PC0012", parameter_id: "PR0008", result_value: "PASS", result_status: "PASS", inspection_date: genDate(1), inspector: "QA-01" },
  { id: 5, lot_no: "L260511-01", process_id: "PC0001", parameter_id: "PR0004", result_value: "4.5°C", result_status: "PASS", inspection_date: genDate(2), inspector: "QA-03" },
  { id: 6, lot_no: "L260510-01", process_id: "PC0001", parameter_id: "PR0001", result_value: "6.0°C", result_status: "FAIL", inspection_date: genDate(3), inspector: "QA-01" },
];

const SAMPLE_METAL = [
  { id: 1, lot_no: "L260513-01", fg_lot_no: "FGL260513-01", ccp_id: "CCP001", test_piece_type: "Fe", result_status: "PASS", verification_type: "Start", test_datetime: genDate(0) },
  { id: 2, lot_no: "L260513-01", fg_lot_no: "FGL260513-01", ccp_id: "CCP002", test_piece_type: "Non-Fe", result_status: "PASS", verification_type: "Start", test_datetime: genDate(0) },
  { id: 3, lot_no: "L260513-01", fg_lot_no: "FGL260513-01", ccp_id: "CCP003", test_piece_type: "SUS", result_status: "PASS", verification_type: "Start", test_datetime: genDate(0) },
  { id: 4, lot_no: "L260512-02", fg_lot_no: "FGL260512-02", ccp_id: "CCP001", test_piece_type: "Fe", result_status: "FAIL", verification_type: "Hourly", test_datetime: genDate(1), lot_blocked: 1 },
];

const SAMPLE_ALERTS = [
  { id: 1, alert_type: "CCP_FAIL", severity: "CRITICAL", title: "CCP FAIL - Metal Detector", message: "Fe detection failed for lot L260512-02", status: "Active", created_at: genDate(1) },
  { id: 2, alert_type: "NCR_OPEN", severity: "WARNING", title: "NCR Open > 5 days", message: "NCR-20260002 still under investigation", status: "Active", created_at: genDate(3) },
  { id: 3, alert_type: "CALIBRATION_DUE", severity: "WARNING", title: "pH Meter calibration due", message: "MPH001 calibration expires in 3 days", status: "Active", created_at: genDate(0) },
  { id: 4, alert_type: "COMPLAINT_CRITICAL", severity: "CRITICAL", title: "Food Safety Complaint", message: "Foreign matter complaint from Tops - recall assessment required", status: "Active", created_at: genDate(12) },
  { id: 5, alert_type: "LOT_BLOCKED", severity: "CRITICAL", title: "FG Lot Blocked", message: "FGL260512-02 blocked due to metal detector failure", status: "Active", created_at: genDate(1) },
];

const SAMPLE_DOCUMENTS = [
  { document_no: "QP-QA-001", document_title: "HACCP Plan", document_type: "QP", revision_no: 3, status: "Active", effective_date: "2025-12-01" },
  { document_no: "SOP-QA-001", document_title: "Incoming QC Procedure", document_type: "SOP", revision_no: 2, status: "Active", effective_date: "2025-11-15" },
  { document_no: "SOP-QA-002", document_title: "Metal Detector Verification", document_type: "SOP", revision_no: 4, status: "Active", effective_date: "2026-01-10" },
  { document_no: "WI-QA-001", document_title: "Temperature Monitoring", document_type: "WI", revision_no: 1, status: "Active", effective_date: "2025-10-01" },
  { document_no: "FM-QA-001", document_title: "Incoming Inspection Form", document_type: "FM", revision_no: 5, status: "Active", effective_date: "2026-02-01" },
  { document_no: "FM-QA-010", document_title: "Metal Detector Log Form", document_type: "FM", revision_no: 3, status: "Active", effective_date: "2026-01-15" },
  { document_no: "SOP-PD-001", document_title: "Marination Process", document_type: "SOP", revision_no: 2, status: "Draft", effective_date: null },
  { document_no: "FM-GHP-001", document_title: "Daily Hygiene Checklist", document_type: "FM", revision_no: 6, status: "Active", effective_date: "2026-03-01" },
];

// ─── Styles ───
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg-primary: #0a0e1a;
  --bg-secondary: #111827;
  --bg-card: #1a2236;
  --bg-card-hover: #1e293b;
  --bg-input: #0f172a;
  --border: #1e3a5f;
  --border-light: #2d4a6f;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-blue: #3b82f6;
  --accent-cyan: #06b6d4;
  --accent-green: #10b981;
  --accent-amber: #f59e0b;
  --accent-red: #ef4444;
  --accent-purple: #8b5cf6;
  --accent-pink: #ec4899;
  --gradient-blue: linear-gradient(135deg, #1e40af, #3b82f6);
  --gradient-green: linear-gradient(135deg, #047857, #10b981);
  --gradient-red: linear-gradient(135deg, #991b1b, #ef4444);
  --gradient-amber: linear-gradient(135deg, #92400e, #f59e0b);
  --gradient-purple: linear-gradient(135deg, #5b21b6, #8b5cf6);
  --gradient-cyan: linear-gradient(135deg, #0e7490, #06b6d4);
  --shadow: 0 4px 24px rgba(0,0,0,0.3);
  --shadow-lg: 0 8px 40px rgba(0,0,0,0.4);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-xs: 6px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'IBM Plex Sans Thai', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

.app { display: flex; min-height: 100vh; }

/* Sidebar */
.sidebar {
  width: 260px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s ease;
}
.sidebar.collapsed { transform: translateX(-260px); }
.sidebar-logo {
  padding: 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.sidebar-logo .logo-icon {
  width: 40px;
  height: 40px;
  background: var(--gradient-cyan);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.sidebar-logo h1 {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--text-primary);
  line-height: 1.2;
}
.sidebar-logo small {
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 500;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px;
}
.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

.nav-group-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  padding: 16px 12px 6px;
  font-weight: 600;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.15s;
  font-weight: 400;
  position: relative;
}
.nav-item:hover { background: var(--bg-card); color: var(--text-primary); }
.nav-item.active {
  background: rgba(6, 182, 212, 0.12);
  color: var(--accent-cyan);
  font-weight: 500;
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  background: var(--accent-cyan);
  border-radius: 0 3px 3px 0;
}
.nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
.nav-badge {
  margin-left: auto;
  background: var(--accent-red);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}

/* Main Content */
.main {
  flex: 1;
  margin-left: 260px;
  transition: margin-left 0.3s ease;
}
.main.expanded { margin-left: 0; }

.topbar {
  height: 56px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 50;
}
.topbar-hamburger {
  display: none;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}
.topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}
.lang-toggle {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.15s;
}
.lang-toggle:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }

.content { padding: 24px; max-width: 1400px; margin: 0 auto; }

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}
.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  cursor: default;
}
.kpi-card:hover { border-color: var(--border-light); transform: translateY(-1px); box-shadow: var(--shadow); }
.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.kpi-card.blue::before { background: var(--gradient-blue); }
.kpi-card.green::before { background: var(--gradient-green); }
.kpi-card.red::before { background: var(--gradient-red); }
.kpi-card.amber::before { background: var(--gradient-amber); }
.kpi-card.purple::before { background: var(--gradient-purple); }
.kpi-card.cyan::before { background: var(--gradient-cyan); }
.kpi-value {
  font-size: 32px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 4px;
  letter-spacing: -1px;
}
.kpi-card.blue .kpi-value { color: var(--accent-blue); }
.kpi-card.green .kpi-value { color: var(--accent-green); }
.kpi-card.red .kpi-value { color: var(--accent-red); }
.kpi-card.amber .kpi-value { color: var(--accent-amber); }
.kpi-card.purple .kpi-value { color: var(--accent-purple); }
.kpi-card.cyan .kpi-value { color: var(--accent-cyan); }
.kpi-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Data Cards & Tables */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 20px;
  overflow: hidden;
}
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.table-wrapper { overflow-x: auto; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th {
  text-align: left;
  padding: 10px 16px;
  background: var(--bg-input);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
}
td {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(30,58,95,0.5);
  color: var(--text-secondary);
  vertical-align: middle;
}
tr:hover td { background: rgba(6,182,212,0.03); }

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.badge-pass { background: rgba(16,185,129,0.15); color: #34d399; }
.badge-fail { background: rgba(239,68,68,0.15); color: #f87171; }
.badge-hold { background: rgba(245,158,11,0.15); color: #fbbf24; }
.badge-pending { background: rgba(100,116,139,0.15); color: #94a3b8; }
.badge-open { background: rgba(59,130,246,0.15); color: #60a5fa; }
.badge-closed { background: rgba(100,116,139,0.15); color: #94a3b8; }
.badge-investigation { background: rgba(139,92,246,0.15); color: #a78bfa; }
.badge-rm { background: rgba(239,68,68,0.12); color: #f87171; }
.badge-dm { background: rgba(245,158,11,0.12); color: #fbbf24; }
.badge-pm { background: rgba(59,130,246,0.12); color: #60a5fa; }
.badge-cm { background: rgba(139,92,246,0.12); color: #a78bfa; }
.badge-high { background: rgba(239,68,68,0.15); color: #f87171; }
.badge-medium { background: rgba(245,158,11,0.15); color: #fbbf24; }
.badge-low { background: rgba(16,185,129,0.15); color: #34d399; }
.badge-critical { background: rgba(236,72,153,0.15); color: #f472b6; }
.badge-active { background: rgba(16,185,129,0.15); color: #34d399; }
.badge-draft { background: rgba(100,116,139,0.15); color: #94a3b8; }
.badge-approved { background: rgba(16,185,129,0.15); color: #34d399; }
.badge-conditional { background: rgba(245,158,11,0.15); color: #fbbf24; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-xs);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  font-family: inherit;
}
.btn-primary { background: var(--accent-cyan); color: white; }
.btn-primary:hover { background: #0891b2; }
.btn-outline { background: transparent; border-color: var(--border); color: var(--text-secondary); }
.btn-outline:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); }
.btn-sm { padding: 4px 10px; font-size: 11px; }
.btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }

/* Filter bar */
.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.filter-bar select, .filter-bar input {
  background: var(--bg-input);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 7px 12px;
  border-radius: var(--radius-xs);
  font-size: 12px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.filter-bar select:focus, .filter-bar input:focus { border-color: var(--accent-cyan); }
.filter-bar input { min-width: 180px; }

/* Process Flow */
.process-flow {
  display: flex;
  gap: 0;
  overflow-x: auto;
  padding: 20px;
  align-items: center;
}
.process-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  text-align: center;
  position: relative;
}
.process-step-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 8px;
  border: 2px solid var(--border);
  background: var(--bg-card);
}
.process-step.ccp .process-step-icon {
  border-color: var(--accent-red);
  background: rgba(239,68,68,0.1);
}
.process-step-label { font-size: 10px; color: var(--text-muted); max-width: 90px; line-height: 1.3; }
.process-arrow { color: var(--text-muted); font-size: 18px; margin: 0 4px; margin-bottom: 20px; flex-shrink: 0; }

/* Alerts Panel */
.alert-item {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(30,58,95,0.5);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.alert-item:last-child { border-bottom: none; }
.alert-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  animation: pulse-alert 2s infinite;
}
.alert-dot.critical { background: var(--accent-red); }
.alert-dot.warning { background: var(--accent-amber); }
.alert-title { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.alert-msg { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.alert-time { font-size: 11px; color: var(--text-muted); margin-left: auto; white-space: nowrap; font-family: 'JetBrains Mono', monospace; }

@keyframes pulse-alert {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Grid layouts */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }

/* Detail panel */
.detail-row { display: flex; padding: 10px 20px; border-bottom: 1px solid rgba(30,58,95,0.3); }
.detail-label { width: 160px; font-size: 12px; color: var(--text-muted); font-weight: 500; flex-shrink: 0; }
.detail-value { font-size: 13px; color: var(--text-primary); }

/* Tabs */
.tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); padding: 0 20px; }
.tab {
  padding: 12px 20px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  font-weight: 500;
}
.tab:hover { color: var(--text-primary); }
.tab.active { color: var(--accent-cyan); border-bottom-color: var(--accent-cyan); }

/* Mobile Responsive */
@media (max-width: 1024px) {
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
}
@media (max-width: 768px) {
  .sidebar { transform: translateX(-260px); }
  .sidebar.open { transform: translateX(0); box-shadow: var(--shadow-lg); }
  .main { margin-left: 0 !important; }
  .topbar-hamburger { display: block; }
  .content { padding: 16px; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .kpi-card { padding: 14px 16px; }
  .kpi-value { font-size: 24px; }
  .card-header { padding: 12px 16px; }
  td, th { padding: 8px 12px; }
}
`;

// ─── Utility Components ───
const Badge = ({ type, children }) => <span className={`badge badge-${type?.toLowerCase().replace(/\s+/g,'-')}`}>{children}</span>;

const StatusBadge = ({ status }) => {
  const map = { PASS: 'pass', FAIL: 'fail', HOLD: 'hold', PENDING: 'pending', Open: 'open', Closed: 'closed', Investigation: 'investigation', Approved: 'approved', Conditional: 'conditional', Active: 'active', Draft: 'draft', 'In Progress': 'open', Disposition: 'hold', Verification: 'hold', 'Recall Assessment': 'fail', Overdue: 'fail', Resolution: 'hold' };
  return <Badge type={map[status] || 'pending'}>{status}</Badge>;
};

const RiskBadge = ({ level }) => <Badge type={level?.toLowerCase()}>{level}</Badge>;
const TypeBadge = ({ type }) => <Badge type={type?.toLowerCase()}>{type}</Badge>;

// ─── Navigation Data ───
const NAV_SECTIONS = [
  { label: "Overview", items: [
    { key: "dashboard", icon: "📊", labelKey: "dashboard" },
    { key: "alerts", icon: "🔔", labelKey: "alerts", badgeCount: 5 },
  ]},
  { label: "Master Data", items: [
    { key: "suppliers", icon: "🏢", labelKey: "suppliers" },
    { key: "materials", icon: "📦", labelKey: "materials" },
    { key: "finishedGoods", icon: "🏷️", labelKey: "finishedGoods" },
    { key: "processes", icon: "⚙️", labelKey: "processes" },
    { key: "equipment", icon: "🔧", labelKey: "equipment" },
  ]},
  { label: "Operations", items: [
    { key: "incomingQC", icon: "🔍", labelKey: "incomingQC" },
    { key: "ccpMonitoring", icon: "🎯", labelKey: "ccpMonitoring" },
    { key: "metalDetector", icon: "⚡", labelKey: "metalDetector" },
  ]},
  { label: "Quality", items: [
    { key: "ncr", icon: "⚠️", labelKey: "ncr", badgeCount: 3 },
    { key: "capa", icon: "🔄", labelKey: "capa", badgeCount: 2 },
    { key: "complaints", icon: "📝", labelKey: "complaints" },
  ]},
  { label: "Compliance", items: [
    { key: "traceability", icon: "🔗", labelKey: "traceability" },
    { key: "documents", icon: "📄", labelKey: "documents" },
    { key: "hygiene", icon: "🧼", labelKey: "hygiene" },
    { key: "auditTrail", icon: "📋", labelKey: "auditTrail" },
  ]},
];

// ═══════════════════════════════════════════════════
// PAGE COMPONENTS
// ═══════════════════════════════════════════════════

// ─── Dashboard ───
function DashboardPage() {
  const { lang } = useLang();
  const kpis = [
    { label: t('openNCR', lang), value: SAMPLE_NCR.filter(n => n.status !== 'Closed').length, color: "red" },
    { label: t('openCAPA', lang), value: SAMPLE_CAPA.filter(c => c.status !== 'Closed').length, color: "purple" },
    { label: t('activeAlerts', lang), value: SAMPLE_ALERTS.filter(a => a.status === 'Active').length, color: "amber" },
    { label: t('lotsOnHold', lang), value: SAMPLE_NCR.filter(n => n.lot_blocked).length, color: "red" },
    { label: t('passRate', lang), value: `${Math.round(100 * SAMPLE_INSPECTIONS.filter(i=>i.result_status==='PASS').length / SAMPLE_INSPECTIONS.length)}%`, color: "green" },
    { label: t('failsThisWeek', lang), value: SAMPLE_INSPECTIONS.filter(i=>i.result_status==='FAIL').length, color: "amber" },
    { label: t('calibDue', lang), value: 1, color: "cyan" },
    { label: t('complaints_', lang), value: SAMPLE_COMPLAINTS.filter(c=>c.status!=='Closed').length, color: "blue" },
  ];

  return (
    <div>
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className={`kpi-card ${k.color}`}>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Process Flow */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">⚙️ Production Flow — HACCP Process Map</div>
        </div>
        <div className="process-flow">
          {PROCESSES.map((p, i) => (
            <div key={p.process_id} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`process-step ${p.is_ccp ? 'ccp' : ''}`}>
                <div className="process-step-icon">
                  {p.is_ccp ? '🎯' : ['📥','❄️','🔪','⚖️','🫙','🪡','⚡','📦','🧊','📦','🚛'][i] || '⚙️'}
                </div>
                <div className="process-step-label">
                  {p.process_id}<br/>{p.description}
                  {p.is_ccp && <div style={{color: 'var(--accent-red)', fontWeight: 600, marginTop: 2}}>CCP</div>}
                </div>
              </div>
              {i < PROCESSES.length - 1 && <span className="process-arrow">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔔 {t('alerts', lang)}</div>
          </div>
          {SAMPLE_ALERTS.slice(0, 4).map(a => (
            <div key={a.id} className="alert-item">
              <div className={`alert-dot ${a.severity === 'CRITICAL' ? 'critical' : 'warning'}`} />
              <div>
                <div className="alert-title">{a.title}</div>
                <div className="alert-msg">{a.message}</div>
              </div>
              <div className="alert-time">{a.created_at}</div>
            </div>
          ))}
        </div>

        {/* Recent NCRs */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ Recent NCR</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>NCR ID</th><th>Source</th><th>Severity</th><th>Status</th></tr></thead>
              <tbody>
                {SAMPLE_NCR.slice(0, 5).map(n => (
                  <tr key={n.ncr_id}>
                    <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{n.ncr_id}</td>
                    <td>{n.source}</td>
                    <td><RiskBadge level={n.severity}/></td>
                    <td><StatusBadge status={n.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Inspections */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔍 Recent Inspections</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Lot</th><th>Parameter</th><th>Value</th><th>Result</th></tr></thead>
              <tbody>
                {SAMPLE_INSPECTIONS.slice(0, 5).map(ins => (
                  <tr key={ins.id}>
                    <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{ins.lot_no}</td>
                    <td>{PARAMETERS.find(p=>p.parameter_id===ins.parameter_id)?.parameter_name?.substring(0,25) || ins.parameter_id}</td>
                    <td>{ins.result_value}</td>
                    <td><StatusBadge status={ins.result_status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CCP Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎯 CCP Status — Metal Detection</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>CCP</th><th>Name</th><th>Critical Limit</th><th>Status</th></tr></thead>
              <tbody>
                {CCP_DATA.map(c => {
                  const hasFail = SAMPLE_METAL.some(m => m.ccp_id === c.ccp_id && m.result_status === 'FAIL');
                  return (
                    <tr key={c.ccp_id}>
                      <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{c.ccp_id}</td>
                      <td>{c.ccp_name}</td>
                      <td>{c.critical_limit}</td>
                      <td><StatusBadge status={hasFail ? 'FAIL' : 'PASS'}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Suppliers Page ───
function SuppliersPage() {
  const { lang } = useLang();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const filtered = SUPPLIERS.filter(s => {
    if (filter !== 'All' && s.material_type !== filter) return false;
    if (search && !s.supplier_name.toLowerCase().includes(search.toLowerCase()) && !s.supplier_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🏢 {t('suppliers', lang)} ({filtered.length})</div>
        <div className="filter-bar">
          <select value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="All">{t('all', lang)}</option>
            <option value="RM">RM</option><option value="DM">DM</option>
            <option value="PM">PM</option><option value="CM">CM</option>
          </select>
          <input placeholder={t('search', lang)} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Supplier Name</th><th>Type</th><th>Risk</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.supplier_id}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{s.supplier_id}</td>
                <td style={{maxWidth:300}}>{s.supplier_name}</td>
                <td><TypeBadge type={s.material_type}/></td>
                <td><RiskBadge level={s.risk_level}/></td>
                <td><StatusBadge status={s.approved_status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Materials Page ───
function MaterialsPage() {
  const { lang } = useLang();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const filtered = MATERIALS.filter(m => {
    if (filter !== 'All' && m.material_type !== filter) return false;
    if (search && !m.material_name.includes(search) && !m.material_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📦 {t('materials', lang)} ({filtered.length})</div>
        <div className="filter-bar">
          <select value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="All">{t('all', lang)}</option>
            <option value="RM">RM - Raw Material</option>
            <option value="DM">DM - Direct Material</option>
            <option value="PM">PM - Packaging</option>
            <option value="CM">CM - Chemical</option>
          </select>
          <input placeholder={t('search', lang)} value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Category</th><th>Unit</th><th>Temp Range</th><th>Shelf Life</th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.material_code}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{m.material_code}</td>
                <td>{m.material_name}</td>
                <td><TypeBadge type={m.material_type}/></td>
                <td>{m.category}</td>
                <td>{m.unit}</td>
                <td>{m.min_temp != null ? `${m.min_temp}–${m.max_temp}°C` : '—'}</td>
                <td>{m.shelf_life_days ? `${m.shelf_life_days}d` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Finished Goods Page ───
function FinishedGoodsPage() {
  const { lang } = useLang();
  const [filter, setFilter] = useState('All');
  const types = [...new Set(FINISHED_GOODS.map(f=>f.product_type))];
  const filtered = FINISHED_GOODS.filter(f => filter === 'All' || f.product_type === filter);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🏷️ {t('finishedGoods', lang)} ({filtered.length})</div>
        <div className="filter-bar">
          <select value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="All">{t('all', lang)}</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>FG Code</th><th>Product Name</th><th>Type</th><th>Storage</th><th>Shelf Life</th><th>Weight (g)</th></tr></thead>
          <tbody>
            {filtered.map(f => (
              <tr key={f.fg_code + f.fg_name}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{f.fg_code}</td>
                <td>{f.fg_name}</td>
                <td><Badge type="active">{f.product_type}</Badge></td>
                <td>{f.storage_temp}°C</td>
                <td>{f.shelf_life_days}d</td>
                <td>{f.min_weight && f.max_weight ? `${f.min_weight}–${f.max_weight}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Processes Page ───
function ProcessesPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">⚙️ Process Flow Master</div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>#</th><th>Process ID</th><th>Process Name</th><th>Description</th><th>Work Area</th><th>CCP</th></tr></thead>
          <tbody>
            {PROCESSES.map((p, i) => (
              <tr key={p.process_id} style={p.is_ccp ? { background: 'rgba(239,68,68,0.05)' } : {}}>
                <td>{i + 1}</td>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{p.process_id}</td>
                <td style={{fontWeight: p.is_ccp ? 600 : 400}}>{p.process_name}</td>
                <td>{p.description}</td>
                <td>{p.work_area}</td>
                <td>{p.is_ccp ? <Badge type="fail">CCP</Badge> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Equipment Page ───
function EquipmentPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🔧 Equipment & Calibration</div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Equipment ID</th><th>Name</th><th>Type</th><th>Cal. Status</th></tr></thead>
          <tbody>
            {EQUIPMENT_DATA.map(e => (
              <tr key={e.equipment_id}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{e.equipment_id}</td>
                <td>{e.equipment_name}</td>
                <td><Badge type={e.equipment_type === 'Testing' ? 'hold' : 'active'}>{e.equipment_type}</Badge></td>
                <td><Badge type="active">Valid</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Incoming QC Page ───
function IncomingQCPage() {
  const { lang } = useLang();
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">🔍 {t('incomingQC', lang)} — Inspection Log</div>
          <button className="btn btn-primary">+ New Inspection</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Lot No.</th><th>Process</th><th>Parameter</th><th>Value</th><th>Result</th><th>Inspector</th></tr></thead>
            <tbody>
              {SAMPLE_INSPECTIONS.map(ins => (
                <tr key={ins.id}>
                  <td>{ins.inspection_date}</td>
                  <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{ins.lot_no}</td>
                  <td>{PROCESSES.find(p=>p.process_id===ins.process_id)?.description || ins.process_id}</td>
                  <td>{PARAMETERS.find(p=>p.parameter_id===ins.parameter_id)?.parameter_name?.substring(0,20) || ins.parameter_id}</td>
                  <td style={{fontFamily:'JetBrains Mono'}}>{ins.result_value}</td>
                  <td><StatusBadge status={ins.result_status}/></td>
                  <td>{ins.inspector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{background:'rgba(239,68,68,0.05)', borderColor:'rgba(239,68,68,0.2)'}}>
        <div style={{padding:16, display:'flex', alignItems:'center', gap:12}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <div style={{fontWeight:600, color:'#f87171', fontSize:13}}>Food Safety Rule</div>
            <div style={{fontSize:12, color:'var(--text-secondary)'}}>Any FAIL result automatically generates NCR. HOLD status requires QA Manager review before disposition.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CCP Monitoring Page ───
function CCPMonitoringPage() {
  return (
    <div>
      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
        {CCP_DATA.map(c => {
          const logs = SAMPLE_METAL.filter(m => m.ccp_id === c.ccp_id);
          const hasFail = logs.some(m => m.result_status === 'FAIL');
          return (
            <div key={c.ccp_id} className={`kpi-card ${hasFail ? 'red' : 'green'}`}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <span style={{fontFamily:'JetBrains Mono', fontSize:12, color:'var(--text-muted)'}}>{c.ccp_id}</span>
                <StatusBadge status={hasFail ? 'FAIL' : 'PASS'} />
              </div>
              <div style={{fontSize:14, fontWeight:600, marginBottom:4}}>{c.ccp_name}</div>
              <div style={{fontSize:12, color:'var(--text-muted)'}}>Critical Limit: {c.critical_limit}</div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{background:'rgba(239,68,68,0.05)', borderColor:'rgba(239,68,68,0.2)'}}>
        <div style={{padding:16}}>
          <div style={{fontWeight:600, color:'#f87171', fontSize:13, marginBottom:4}}>⚠️ HACCP Critical Rule</div>
          <div style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.6}}>
            CCP FAIL → Auto-create NCR (CRITICAL) → Block FG Lot → Alert QA Manager → Corrective Action Required → CAPA mandatory
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Metal Detector Page ───
function MetalDetectorPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">⚡ Metal Detector Verification Log</div>
        <button className="btn btn-primary">+ New Test</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Date</th><th>Lot</th><th>FG Lot</th><th>CCP</th><th>Test Piece</th><th>Type</th><th>Result</th><th>Blocked</th></tr></thead>
          <tbody>
            {SAMPLE_METAL.map(m => (
              <tr key={m.id} style={m.result_status === 'FAIL' ? {background:'rgba(239,68,68,0.05)'} : {}}>
                <td>{m.test_datetime}</td>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{m.lot_no}</td>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{m.fg_lot_no}</td>
                <td>{m.ccp_id}</td>
                <td>{m.test_piece_type}</td>
                <td>{m.verification_type}</td>
                <td><StatusBadge status={m.result_status}/></td>
                <td>{m.lot_blocked ? <Badge type="fail">BLOCKED</Badge> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── NCR Page ───
function NCRPage() {
  const [filter, setFilter] = useState('All');
  const filtered = SAMPLE_NCR.filter(n => filter === 'All' || n.status === filter);
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">⚠️ Non-Conformance Records ({filtered.length})</div>
        <div className="card-actions">
          <div className="filter-bar">
            <select value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Open">Open</option><option value="Investigation">Investigation</option>
              <option value="Disposition">Disposition</option><option value="Closed">Closed</option>
            </select>
          </div>
          <button className="btn btn-primary">+ New NCR</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>NCR ID</th><th>Date</th><th>Source</th><th>Lot</th><th>Description</th><th>Severity</th><th>Risk</th><th>Status</th><th>Blocked</th></tr></thead>
          <tbody>
            {filtered.map(n => (
              <tr key={n.ncr_id} style={n.severity === 'CRITICAL' ? {background:'rgba(239,68,68,0.05)'} : {}}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{n.ncr_id}</td>
                <td>{n.ncr_date}</td>
                <td>{n.source}</td>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{n.lot_no || '—'}</td>
                <td style={{maxWidth:200}}>{n.description}</td>
                <td><RiskBadge level={n.severity}/></td>
                <td><RiskBadge level={n.risk_level}/></td>
                <td><StatusBadge status={n.status}/></td>
                <td>{n.lot_blocked ? <Badge type="fail">🔒 YES</Badge> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CAPA Page ───
function CAPAPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🔄 Corrective & Preventive Action</div>
        <button className="btn btn-primary">+ New CAPA</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>CAPA ID</th><th>NCR Ref</th><th>Type</th><th>Description</th><th>Target Date</th><th>Status</th></tr></thead>
          <tbody>
            {SAMPLE_CAPA.map(c => (
              <tr key={c.capa_id}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{c.capa_id}</td>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{c.ncr_id}</td>
                <td><Badge type={c.capa_type === 'Both' ? 'hold' : 'active'}>{c.capa_type}</Badge></td>
                <td>{c.description}</td>
                <td>{c.target_date}</td>
                <td><StatusBadge status={c.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Complaints Page ───
function ComplaintsPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📝 Customer Complaints</div>
        <button className="btn btn-primary">+ New Complaint</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>FG Lot</th><th>Type</th><th>Severity</th><th>Food Safety</th><th>Status</th></tr></thead>
          <tbody>
            {SAMPLE_COMPLAINTS.map(c => (
              <tr key={c.complaint_id} style={c.food_safety_risk ? {background:'rgba(239,68,68,0.05)'} : {}}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{c.complaint_id}</td>
                <td>{c.complaint_date}</td>
                <td>{c.customer_name}</td>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{c.fg_lot_no}</td>
                <td>{c.complaint_type}</td>
                <td><RiskBadge level={c.severity}/></td>
                <td>{c.food_safety_risk ? <Badge type="fail">⚠️ YES</Badge> : <Badge type="pass">No</Badge>}</td>
                <td><StatusBadge status={c.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{margin:0, borderRadius:0, background:'rgba(239,68,68,0.05)', borderColor:'rgba(239,68,68,0.2)', borderTop:'1px solid rgba(239,68,68,0.2)'}}>
        <div style={{padding:16, fontSize:12, color:'var(--text-secondary)'}}>
          <strong style={{color:'#f87171'}}>Rule:</strong> Complaints with food_safety_risk = YES or severity HIGH/CRITICAL automatically trigger Recall Assessment workflow
        </div>
      </div>
    </div>
  );
}

// ─── Traceability Page ───
function TraceabilityPage() {
  const [lotSearch, setLotSearch] = useState('FGL260513-01');
  const trace = {
    fg_lot: 'FGL260513-01', fg_code: 'FG-M002', fg_name: 'หมูปิ้งนมสดเสียบไม้ - Size L',
    batch_id: 'B-20260513-001', production_date: genDate(0),
    materials_used: [
      { material_code: 'RM0001', material_name: 'สะโพกหมู', lot_no: 'L260513-RM01', qty: '120 kg', supplier: 'SP0001' },
      { material_code: 'PD0001', material_name: 'ซอสหอยนางรม', lot_no: 'L260513-DM01', qty: '15 kg', supplier: 'SP0008' },
      { material_code: 'PD0019', material_name: 'นมจืด', lot_no: 'L260513-DM02', qty: '30 กระป๋อง', supplier: 'SP0007' },
      { material_code: 'PK0019', material_name: 'ไม้กลม 3*5', lot_no: 'L260513-PK01', qty: '50 kg', supplier: 'SP0025' },
    ],
    inspections: SAMPLE_INSPECTIONS.filter(i=>i.lot_no === 'L260513-01'),
    metal_tests: SAMPLE_METAL.filter(m=>m.lot_no === 'L260513-01'),
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">🔗 Traceability — Forward & Backward Trace</div>
          <div className="filter-bar">
            <input value={lotSearch} onChange={e=>setLotSearch(e.target.value)} placeholder="Enter FG Lot No." style={{fontFamily:'JetBrains Mono'}} />
            <button className="btn btn-primary">🔍 Trace</button>
          </div>
        </div>
      </div>

      {/* Trace Result */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">📦 FG Lot Detail</div></div>
          <div className="detail-row"><div className="detail-label">FG Lot No.</div><div className="detail-value" style={{fontFamily:'JetBrains Mono'}}>{trace.fg_lot}</div></div>
          <div className="detail-row"><div className="detail-label">FG Code</div><div className="detail-value">{trace.fg_code}</div></div>
          <div className="detail-row"><div className="detail-label">Product</div><div className="detail-value">{trace.fg_name}</div></div>
          <div className="detail-row"><div className="detail-label">Batch</div><div className="detail-value" style={{fontFamily:'JetBrains Mono'}}>{trace.batch_id}</div></div>
          <div className="detail-row"><div className="detail-label">Production Date</div><div className="detail-value">{trace.production_date}</div></div>
          <div className="detail-row"><div className="detail-label">Release Status</div><div className="detail-value"><Badge type="pass">Released</Badge></div></div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">🧪 QC / CCP Results</div></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Type</th><th>Parameter</th><th>Result</th></tr></thead>
              <tbody>
                {trace.inspections.map((ins,i) => (
                  <tr key={i}><td>Inspection</td><td>{ins.parameter_id}</td><td><StatusBadge status={ins.result_status}/></td></tr>
                ))}
                {trace.metal_tests.map((mt,i) => (
                  <tr key={`m${i}`}><td>Metal Det.</td><td>{mt.test_piece_type}</td><td><StatusBadge status={mt.result_status}/></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">📥 Raw Materials Used (Backward Trace)</div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Material Code</th><th>Name</th><th>RM Lot</th><th>Qty</th><th>Supplier</th></tr></thead>
            <tbody>
              {trace.materials_used.map((m,i) => (
                <tr key={i}>
                  <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{m.material_code}</td>
                  <td>{m.material_name}</td>
                  <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{m.lot_no}</td>
                  <td>{m.qty}</td>
                  <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{m.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Documents Page ───
function DocumentsPage() {
  const [filter, setFilter] = useState('All');
  const filtered = SAMPLE_DOCUMENTS.filter(d => filter === 'All' || d.document_type === filter);
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📄 Document Control Center</div>
        <div className="card-actions">
          <div className="filter-bar">
            <select value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="QP">QP - Quality Procedure</option>
              <option value="SOP">SOP</option>
              <option value="WI">WI - Work Instruction</option>
              <option value="FM">FM - Form</option>
              <option value="SD">SD - Supporting Doc</option>
            </select>
          </div>
          <button className="btn btn-primary">+ New Document</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Doc No.</th><th>Title</th><th>Type</th><th>Rev</th><th>Effective Date</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.document_no}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:12}}>{d.document_no}</td>
                <td>{d.document_title}</td>
                <td><Badge type={d.document_type === 'QP' ? 'hold' : d.document_type === 'SOP' ? 'open' : 'active'}>{d.document_type}</Badge></td>
                <td style={{fontFamily:'JetBrains Mono', textAlign:'center'}}>{d.revision_no}</td>
                <td>{d.effective_date || '—'}</td>
                <td><StatusBadge status={d.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Hygiene & GHP Page ───
function HygienePage() {
  const categories = ['Personnel', 'Hand Washing', 'Clothing', 'Cleaning', 'Chemical', 'Pest', 'Waste', 'Water', 'Glass', 'Foreign Matter', 'Maintenance', 'Allergen', 'Temperature', 'Zoning', 'Cross Contamination'];
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">🧼 GHP Foundation Programs — 15 Categories</div>
          <button className="btn btn-primary">+ Daily Checklist</button>
        </div>
        <div style={{padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10}}>
          {categories.map((cat, i) => (
            <div key={cat} style={{
              padding:'12px 16px',
              background:'var(--bg-input)',
              border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)',
              display:'flex', alignItems:'center', gap:10, fontSize:13,
            }}>
              <span style={{fontSize:16}}>
                {['👤','🤲','👕','🧹','🧪','🪲','🗑️','💧','🪟','🔎','🔩','⚠️','🌡️','🟦','🚫'][i]}
              </span>
              <div>
                <div style={{fontWeight:500, color:'var(--text-primary)'}}>{cat}</div>
                <div style={{fontSize:11, color:'var(--text-muted)'}}>GHP Program</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Alerts Page ───
function AlertsPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🔔 Active Alerts & Notifications</div>
      </div>
      {SAMPLE_ALERTS.map(a => (
        <div key={a.id} className="alert-item">
          <div className={`alert-dot ${a.severity === 'CRITICAL' ? 'critical' : 'warning'}`} />
          <div style={{flex:1}}>
            <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:2}}>
              <div className="alert-title">{a.title}</div>
              <Badge type={a.severity === 'CRITICAL' ? 'fail' : 'hold'}>{a.severity}</Badge>
            </div>
            <div className="alert-msg">{a.message}</div>
            <div style={{fontSize:11, color:'var(--text-muted)', marginTop:4, fontFamily:'JetBrains Mono'}}>{a.alert_type} · {a.created_at}</div>
          </div>
          <button className="btn btn-outline btn-sm">Acknowledge</button>
        </div>
      ))}
    </div>
  );
}

// ─── Audit Trail Page ───
function AuditTrailPage() {
  const trail = [
    { action: 'INSERT', table_name: 'inspection_logs', record_id: '6', changed_by: 'QA-01', changed_at: genDate(0) + ' 08:30', field_changed: 'result_status', new_value: 'PASS' },
    { action: 'STATUS_CHANGE', table_name: 'ncr_records', record_id: genNCRId(5), changed_by: 'QA-MGR', changed_at: genDate(1) + ' 14:20', field_changed: 'status', old_value: 'Open', new_value: 'Investigation' },
    { action: 'INSERT', table_name: 'metal_detector_logs', record_id: '4', changed_by: 'QA-02', changed_at: genDate(1) + ' 10:15', field_changed: 'result_status', new_value: 'FAIL' },
    { action: 'INSERT', table_name: 'alerts', record_id: '5', changed_by: 'SYSTEM', changed_at: genDate(1) + ' 10:16', field_changed: 'auto', new_value: 'LOT_BLOCKED alert created' },
    { action: 'UPDATE', table_name: 'finished_goods_lots', record_id: 'FGL260512-02', changed_by: 'SYSTEM', changed_at: genDate(1) + ' 10:16', field_changed: 'release_status', old_value: 'Pending', new_value: 'Hold' },
  ];
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📋 Immutable Audit Trail</div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Timestamp</th><th>Action</th><th>Table</th><th>Record</th><th>Field</th><th>Old → New</th><th>User</th></tr></thead>
          <tbody>
            {trail.map((t,i) => (
              <tr key={i}>
                <td style={{fontFamily:'JetBrains Mono',fontSize:11, whiteSpace:'nowrap'}}>{t.changed_at}</td>
                <td><Badge type={t.action === 'INSERT' ? 'active' : t.action === 'STATUS_CHANGE' ? 'hold' : 'open'}>{t.action}</Badge></td>
                <td style={{fontSize:12}}>{t.table_name}</td>
                <td style={{fontFamily:'JetBrains Mono',fontSize:11}}>{t.record_id}</td>
                <td>{t.field_changed}</td>
                <td style={{fontSize:12}}>{t.old_value ? `${t.old_value} → ` : ''}{t.new_value}</td>
                <td>{t.changed_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Cleaning Page ───
function CleaningPage() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🧹 Cleaning & Sanitation Verification</div>
        <button className="btn btn-primary">+ New Record</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Date</th><th>Area</th><th>Chemical</th><th>Pre-Clean</th><th>Post-Clean</th><th>Verified By</th></tr></thead>
          <tbody>
            <tr><td>{genDate(0)}</td><td>ห้องผลิต</td><td>CM0001 - NEXGEN PH-1000</td><td><StatusBadge status="PASS"/></td><td><StatusBadge status="PASS"/></td><td>QA-03</td></tr>
            <tr><td>{genDate(0)}</td><td>ห้องบรรจุ</td><td>CM0004 - NEXGEN ALCO 70B</td><td><StatusBadge status="PASS"/></td><td><StatusBadge status="PASS"/></td><td>QA-03</td></tr>
            <tr><td>{genDate(1)}</td><td>ห้องผลิต</td><td>CM0001 - NEXGEN PH-1000</td><td><StatusBadge status="FAIL"/></td><td><StatusBadge status="PASS"/></td><td>QA-02</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════

const PAGES = {
  dashboard: DashboardPage,
  suppliers: SuppliersPage,
  materials: MaterialsPage,
  finishedGoods: FinishedGoodsPage,
  processes: ProcessesPage,
  equipment: EquipmentPage,
  incomingQC: IncomingQCPage,
  ccpMonitoring: CCPMonitoringPage,
  metalDetector: MetalDetectorPage,
  ncr: NCRPage,
  capa: CAPAPage,
  complaints: ComplaintsPage,
  traceability: TraceabilityPage,
  documents: DocumentsPage,
  hygiene: HygienePage,
  cleaning: CleaningPage,
  alerts: AlertsPage,
  auditTrail: AuditTrailPage,
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [lang, setLang] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const PageComponent = PAGES[activePage] || DashboardPage;

  const navigate = useCallback((page) => {
    setActivePage(page);
    setSidebarOpen(false);
  }, []);

  const pageTitle = useMemo(() => {
    for (const sec of NAV_SECTIONS) {
      const item = sec.items.find(i => i.key === activePage);
      if (item) return t(item.labelKey, lang);
    }
    return t('dashboard', lang);
  }, [activePage, lang]);

  return (
    <LangContext.Provider value={{ lang }}>
      <style>{CSS}</style>
      <div className="app">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <div className="logo-icon">QA</div>
            <div>
              <h1>Smart QA Factory</h1>
              <small>HACCP · ISO 22000 · FSSC</small>
            </div>
          </div>
          <nav className="sidebar-nav">
            {NAV_SECTIONS.map(sec => (
              <div key={sec.label}>
                <div className="nav-group-label">{sec.label}</div>
                {sec.items.map(item => (
                  <div
                    key={item.key}
                    className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                    onClick={() => navigate(item.key)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{t(item.labelKey, lang)}</span>
                    {item.badgeCount && <span className="nav-badge">{item.badgeCount}</span>}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99}} onClick={()=>setSidebarOpen(false)} />}

        {/* Main Content */}
        <div className="main">
          <header className="topbar">
            <button className="topbar-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="topbar-title">{pageTitle}</div>
            <div className="topbar-right">
              <button className="lang-toggle" onClick={() => setLang(l => l === 'en' ? 'th' : 'en')}>
                {lang === 'en' ? '🇹🇭 ไทย' : '🇬🇧 EN'}
              </button>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--gradient-cyan)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600,color:'white'}}>QA</div>
            </div>
          </header>
          <div className="content">
            <PageComponent />
          </div>
        </div>
      </div>
    </LangContext.Provider>
  );
}
