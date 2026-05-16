-- Smart QA Factory App - Cloudflare D1 Starter Schema
-- Scope: GHPs + HACCP Codex QA/QC system for meat processing / frozen products

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  department TEXT,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id TEXT PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  material_type TEXT,
  risk_level TEXT,
  coa_required TEXT,
  halal_cert TEXT,
  gmp_status TEXT,
  approved_status TEXT,
  last_audit_date TEXT,
  material_code TEXT
);

CREATE TABLE IF NOT EXISTS materials (
  material_code TEXT PRIMARY KEY,
  material_name TEXT NOT NULL,
  material_type TEXT,
  category TEXT,
  unit TEXT,
  min_temp_c REAL,
  max_temp_c REAL,
  storage_temp TEXT,
  shelf_life_days INTEGER,
  risk_level TEXT,
  supplier_id TEXT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);

CREATE TABLE IF NOT EXISTS finished_goods (
  fg_code TEXT PRIMARY KEY,
  fg_name TEXT NOT NULL,
  product_type TEXT,
  storage_temp_c REAL,
  shelf_life_days INTEGER,
  min_weight_g REAL,
  max_weight_g REAL,
  min_weight_pack_g REAL,
  max_weight_pack_g REAL
);

CREATE TABLE IF NOT EXISTS processes (
  process_id TEXT PRIMARY KEY,
  process_name TEXT NOT NULL,
  description TEXT,
  work_area TEXT,
  sequence_no INTEGER
);

CREATE TABLE IF NOT EXISTS parameters (
  parameter_id TEXT PRIMARY KEY,
  parameter_name TEXT NOT NULL,
  parameter_description TEXT,
  parameter_category TEXT,
  spec_limit TEXT,
  unit TEXT
);

CREATE TABLE IF NOT EXISTS equipment (
  equipment_id TEXT PRIMARY KEY,
  equipment_name TEXT NOT NULL,
  equipment_type TEXT,
  location TEXT,
  calibration_required TEXT,
  status TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS ccp_master (
  ccp_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  ccp_name TEXT NOT NULL,
  critical_limit TEXT NOT NULL,
  FOREIGN KEY (process_id) REFERENCES processes(process_id)
);

CREATE TABLE IF NOT EXISTS process_parameter_map (
  map_id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  parameter_id TEXT NOT NULL,
  equipment_id TEXT,
  frequency TEXT,
  is_ccp TEXT DEFAULT 'NO',
  FOREIGN KEY (process_id) REFERENCES processes(process_id),
  FOREIGN KEY (parameter_id) REFERENCES parameters(parameter_id),
  FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id)
);

CREATE TABLE IF NOT EXISTS documents (
  document_id TEXT PRIMARY KEY,
  document_no TEXT NOT NULL UNIQUE,
  category TEXT,
  document_name TEXT NOT NULL,
  revision TEXT,
  effective_date TEXT,
  system TEXT,
  owner TEXT,
  location TEXT,
  status TEXT,
  storage_key TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_versions (
  version_id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  revision TEXT NOT NULL,
  file_key TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  effective_date TEXT,
  status TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(document_id)
);

CREATE TABLE IF NOT EXISTS inspection_logs (
  inspection_id TEXT PRIMARY KEY,
  inspection_date TEXT NOT NULL,
  shift TEXT,
  line TEXT,
  product_code TEXT,
  lot_no TEXT,
  process_id TEXT,
  parameter_id TEXT,
  spec_limit TEXT,
  value_text TEXT,
  value_num REAL,
  unit TEXT,
  result TEXT NOT NULL CHECK(result IN ('PASS','FAIL','HOLD','NA')),
  severity TEXT,
  inspector_id TEXT,
  remark TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ccp_monitoring_logs (
  ccp_log_id TEXT PRIMARY KEY,
  inspection_date TEXT NOT NULL,
  line TEXT,
  ccp_id TEXT NOT NULL,
  product_code TEXT,
  lot_no TEXT,
  critical_limit TEXT,
  value_text TEXT,
  value_num REAL,
  unit TEXT,
  result TEXT NOT NULL CHECK(result IN ('PASS','FAIL')),
  action_taken TEXT,
  verified_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ccp_id) REFERENCES ccp_master(ccp_id)
);

CREATE TABLE IF NOT EXISTS metal_detector_logs (
  metal_log_id TEXT PRIMARY KEY,
  inspection_date TEXT NOT NULL,
  line TEXT,
  product_code TEXT,
  lot_no TEXT,
  fe_mm REAL DEFAULT 1.0,
  non_fe_mm REAL DEFAULT 1.5,
  sus_mm REAL DEFAULT 2.0,
  reject_ok TEXT,
  result TEXT NOT NULL CHECK(result IN ('PASS','FAIL')),
  action_taken TEXT,
  inspector_id TEXT,
  verified_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ghp_logs (
  ghp_log_id TEXT PRIMARY KEY,
  log_date TEXT NOT NULL,
  program TEXT NOT NULL,
  area TEXT,
  item_checked TEXT,
  standard TEXT,
  result TEXT NOT NULL CHECK(result IN ('PASS','FAIL','NA')),
  action_taken TEXT,
  inspector_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS receiving_lots (
  receiving_id TEXT PRIMARY KEY,
  receiving_date TEXT NOT NULL,
  supplier_id TEXT,
  material_code TEXT,
  lot_no TEXT,
  qty REAL,
  unit TEXT,
  temp_c REAL,
  coa_status TEXT,
  visual_result TEXT,
  packaging_result TEXT,
  result TEXT,
  lot_status TEXT DEFAULT 'PENDING',
  inspector_id TEXT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (material_code) REFERENCES materials(material_code)
);

CREATE TABLE IF NOT EXISTS ncr_records (
  ncr_id TEXT PRIMARY KEY,
  source_module TEXT NOT NULL,
  source_record_id TEXT,
  issue_date TEXT NOT NULL,
  product_code TEXT,
  lot_no TEXT,
  issue_description TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  disposition TEXT,
  qa_decision TEXT,
  created_by TEXT,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS capa_records (
  capa_id TEXT PRIMARY KEY,
  ncr_id TEXT,
  root_cause TEXT,
  correction TEXT,
  corrective_action TEXT,
  owner TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'OPEN',
  effectiveness_check TEXT,
  closed_at TEXT,
  FOREIGN KEY (ncr_id) REFERENCES ncr_records(ncr_id)
);

CREATE TABLE IF NOT EXISTS customer_complaints (
  complaint_id TEXT PRIMARY KEY,
  complaint_date TEXT NOT NULL,
  customer TEXT,
  product_code TEXT,
  lot_no TEXT,
  issue TEXT NOT NULL,
  severity TEXT,
  recall_risk TEXT,
  status TEXT DEFAULT 'OPEN',
  capa_id TEXT,
  FOREIGN KEY (capa_id) REFERENCES capa_records(capa_id)
);

CREATE TABLE IF NOT EXISTS lot_chain (
  trace_id TEXT PRIMARY KEY,
  batch_id TEXT,
  rm_lot_no TEXT,
  fg_lot_no TEXT,
  product_code TEXT,
  qty_input REAL,
  qty_output REAL,
  unit TEXT,
  production_date TEXT,
  line TEXT
);

CREATE TABLE IF NOT EXISTS attachments (
  attachment_id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  record_id TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT,
  content_type TEXT,
  uploaded_by TEXT,
  uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  alert_id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  record_id TEXT,
  severity TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_trail (
  audit_id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  user_id TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW IF NOT EXISTS v_dashboard_kpi AS
SELECT
  (SELECT COUNT(*) FROM inspection_logs) AS total_inspections,
  (SELECT COUNT(*) FROM inspection_logs WHERE result='PASS') AS pass_count,
  (SELECT COUNT(*) FROM inspection_logs WHERE result='FAIL') AS fail_count,
  (SELECT COUNT(*) FROM ccp_monitoring_logs WHERE result='FAIL') AS ccp_fail_count,
  (SELECT COUNT(*) FROM ncr_records WHERE status='OPEN') AS open_ncr,
  (SELECT COUNT(*) FROM capa_records WHERE status='OPEN') AS open_capa,
  (SELECT COUNT(*) FROM customer_complaints WHERE status='OPEN') AS open_complaints;
