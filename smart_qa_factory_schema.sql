-- ============================================================
-- Smart QA Factory System — Full Database Schema
-- Target: Cloudflare D1 (SQLite)
-- Version: 1.0.0
-- Compliance: HACCP, ISO 22000, FSSC 22000, GMP Thailand
-- ============================================================

-- ============ FOUNDATION: MASTER DATA (Priority 1) ============

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id TEXT PRIMARY KEY,           -- SP0001
    supplier_name TEXT NOT NULL,
    material_type TEXT CHECK(material_type IN ('RM','DM','PM','CM')),
    risk_level TEXT CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'LOW',
    approved_status TEXT CHECK(approved_status IN ('Approved','Conditional','Suspended','Rejected')) DEFAULT 'Conditional',
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    last_audit_date TEXT,
    next_audit_date TEXT,
    certification TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS materials (
    material_code TEXT PRIMARY KEY,          -- RM0001, DM0001, PK0001, CM0001
    material_name TEXT NOT NULL,
    material_type TEXT CHECK(material_type IN ('RM','DM','PM','CM')) NOT NULL,
    category TEXT,
    unit TEXT,
    supplier_id TEXT,
    min_temp REAL,
    max_temp REAL,
    shelf_life_days INTEGER,
    spec_description TEXT,
    allergen_info TEXT,
    risk_level TEXT CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'LOW',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
);

CREATE TABLE IF NOT EXISTS finished_goods (
    fg_code TEXT PRIMARY KEY,               -- FG-M002
    fg_name TEXT NOT NULL,
    product_type TEXT,
    storage_temp REAL,
    shelf_life_days INTEGER,
    min_weight REAL,
    max_weight REAL,
    min_weight_pack REAL,
    max_weight_pack REAL,
    allergen_info TEXT,
    spec_document TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS processes (
    process_id TEXT PRIMARY KEY,            -- PC0001
    process_name TEXT NOT NULL,
    description TEXT,
    work_area TEXT,
    sequence_order INTEGER,
    is_ccp INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS parameters (
    parameter_id TEXT PRIMARY KEY,          -- PR0001
    parameter_name TEXT NOT NULL,
    parameter_category TEXT CHECK(parameter_category IN ('Temperature','Quality','Food Safety','Weight','Visual','Process')),
    spec_value TEXT,
    unit TEXT,
    critical_limit_min REAL,
    critical_limit_max REAL,
    target_value REAL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id TEXT PRIMARY KEY,          -- MDB001
    equipment_name TEXT NOT NULL,
    equipment_type TEXT CHECK(equipment_type IN ('Measuring','Testing','Visual','Monitoring')),
    usage_description TEXT,
    location TEXT,
    calibration_frequency_days INTEGER,
    last_calibration_date TEXT,
    next_calibration_date TEXT,
    calibration_status TEXT CHECK(calibration_status IN ('Valid','Due','Overdue','Out of Service')) DEFAULT 'Valid',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS machines (
    machine_id TEXT PRIMARY KEY,
    machine_name TEXT NOT NULL,
    process_id TEXT,
    location TEXT,
    status TEXT CHECK(status IN ('Active','Maintenance','Out of Service')) DEFAULT 'Active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (process_id) REFERENCES processes(process_id)
);

-- ============ FOOD SAFETY: HACCP (Priority 1) ============

CREATE TABLE IF NOT EXISTS ccp_master (
    ccp_id TEXT PRIMARY KEY,                -- CCP001
    process_id TEXT NOT NULL,
    ccp_name TEXT NOT NULL,
    critical_limit TEXT NOT NULL,
    monitoring_method TEXT,
    monitoring_frequency TEXT,
    corrective_action TEXT,
    verification_method TEXT,
    record_keeping TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (process_id) REFERENCES processes(process_id)
);

CREATE TABLE IF NOT EXISTS process_parameter_map (
    map_id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_id TEXT NOT NULL,
    parameter_id TEXT NOT NULL,
    equipment_id TEXT,
    ccp_id TEXT,
    is_mandatory INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (process_id) REFERENCES processes(process_id),
    FOREIGN KEY (parameter_id) REFERENCES parameters(parameter_id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id),
    FOREIGN KEY (ccp_id) REFERENCES ccp_master(ccp_id)
);

-- ============ OPERATIONS (Priority 2) ============

CREATE TABLE IF NOT EXISTS inspection_logs (
    inspection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_no TEXT NOT NULL,
    process_id TEXT NOT NULL,
    parameter_id TEXT NOT NULL,
    equipment_id TEXT,
    result_value TEXT,
    result_numeric REAL,
    result_status TEXT CHECK(result_status IN ('PASS','FAIL','HOLD','PENDING')) NOT NULL,
    inspector TEXT,
    inspection_date TEXT DEFAULT (datetime('now')),
    remarks TEXT,
    ncr_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    FOREIGN KEY (process_id) REFERENCES processes(process_id),
    FOREIGN KEY (parameter_id) REFERENCES parameters(parameter_id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id)
);

CREATE TABLE IF NOT EXISTS metal_detector_logs (
    metal_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_no TEXT NOT NULL,
    fg_lot_no TEXT,
    ccp_id TEXT NOT NULL,
    equipment_id TEXT,
    test_piece_type TEXT CHECK(test_piece_type IN ('Fe','Non-Fe','SUS')),
    test_piece_size TEXT,
    result_status TEXT CHECK(result_status IN ('PASS','FAIL')) NOT NULL,
    verification_type TEXT CHECK(verification_type IN ('Start','Hourly','End','Post-Reject')),
    operator TEXT,
    verifier TEXT,
    test_datetime TEXT DEFAULT (datetime('now')),
    remarks TEXT,
    ncr_id TEXT,
    lot_blocked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    FOREIGN KEY (ccp_id) REFERENCES ccp_master(ccp_id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id)
);

-- ============ NCR / CAPA (Priority 2) ============

CREATE TABLE IF NOT EXISTS ncr_records (
    ncr_id TEXT PRIMARY KEY,                -- NCR-YYYYMMDD-001
    ncr_date TEXT NOT NULL,
    source TEXT CHECK(source IN ('Inspection','CCP','Metal Detector','Complaint','Audit','Supplier','Other')),
    lot_no TEXT,
    fg_lot_no TEXT,
    supplier_id TEXT,
    parameter_id TEXT,
    process_id TEXT,
    description TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'MEDIUM',
    risk_level TEXT CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'MEDIUM',
    status TEXT CHECK(status IN ('Open','Investigation','Disposition','Closed','Void')) DEFAULT 'Open',
    disposition TEXT CHECK(disposition IN ('Use As Is','Rework','Reject','Hold','Recall',NULL)),
    root_cause TEXT,
    immediate_action TEXT,
    assigned_to TEXT,
    closed_by TEXT,
    closed_date TEXT,
    lot_blocked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (parameter_id) REFERENCES parameters(parameter_id),
    FOREIGN KEY (process_id) REFERENCES processes(process_id)
);

CREATE TABLE IF NOT EXISTS capa_records (
    capa_id TEXT PRIMARY KEY,               -- CAPA-YYYYMMDD-001
    ncr_id TEXT,
    capa_type TEXT CHECK(capa_type IN ('Corrective','Preventive','Both')) DEFAULT 'Corrective',
    source TEXT,
    description TEXT NOT NULL,
    root_cause_analysis TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    responsible_person TEXT,
    target_date TEXT,
    status TEXT CHECK(status IN ('Open','In Progress','Verification','Closed','Overdue')) DEFAULT 'Open',
    effectiveness_check TEXT,
    effectiveness_result TEXT CHECK(effectiveness_result IN ('Effective','Not Effective','Pending',NULL)),
    verified_by TEXT,
    verified_date TEXT,
    closed_by TEXT,
    closed_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    FOREIGN KEY (ncr_id) REFERENCES ncr_records(ncr_id)
);

-- ============ COMPLAINT (Priority 2) ============

CREATE TABLE IF NOT EXISTS customer_complaints (
    complaint_id TEXT PRIMARY KEY,          -- CC-YYYYMMDD-001
    complaint_date TEXT NOT NULL,
    customer_name TEXT,
    customer_contact TEXT,
    fg_lot_no TEXT,
    fg_code TEXT,
    complaint_type TEXT CHECK(complaint_type IN ('Quality','Food Safety','Foreign Matter','Packaging','Labeling','Other')),
    description TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'MEDIUM',
    food_safety_risk INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('Open','Investigation','Resolution','Closed','Recall Assessment')) DEFAULT 'Open',
    investigation_result TEXT,
    corrective_action TEXT,
    related_ncr_id TEXT,
    recall_required INTEGER DEFAULT 0,
    assigned_to TEXT,
    closed_by TEXT,
    closed_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    FOREIGN KEY (fg_code) REFERENCES finished_goods(fg_code),
    FOREIGN KEY (related_ncr_id) REFERENCES ncr_records(ncr_id)
);

-- ============ DOCUMENT CONTROL (Priority 2) ============

CREATE TABLE IF NOT EXISTS documents (
    document_id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_no TEXT UNIQUE NOT NULL,       -- QP-QA-001
    document_title TEXT NOT NULL,
    document_type TEXT CHECK(document_type IN ('QP','SOP','WI','FM','SD')),
    department TEXT,
    revision_no INTEGER DEFAULT 0,
    effective_date TEXT,
    review_date TEXT,
    status TEXT CHECK(status IN ('Draft','Review','Approved','Active','Obsolete','Superseded')) DEFAULT 'Draft',
    file_path TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    approved_by TEXT,
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS document_approval_logs (
    approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    action TEXT CHECK(action IN ('Submit','Review','Approve','Reject','Acknowledge','Obsolete')),
    action_by TEXT,
    action_date TEXT DEFAULT (datetime('now')),
    comments TEXT,
    e_signature TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(document_id)
);

-- ============ TRACEABILITY (Priority 3) ============

CREATE TABLE IF NOT EXISTS receiving_records (
    receiving_id INTEGER PRIMARY KEY AUTOINCREMENT,
    receiving_date TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    material_code TEXT NOT NULL,
    lot_no TEXT NOT NULL,
    quantity REAL,
    unit TEXT,
    temp_value REAL,
    inspection_result TEXT CHECK(inspection_result IN ('PASS','FAIL','HOLD','CONDITIONAL')),
    inspector TEXT,
    vehicle_plate TEXT,
    remarks TEXT,
    ncr_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (material_code) REFERENCES materials(material_code)
);

CREATE TABLE IF NOT EXISTS production_batches (
    batch_id TEXT PRIMARY KEY,              -- B-YYYYMMDD-001
    production_date TEXT NOT NULL,
    fg_code TEXT NOT NULL,
    planned_qty REAL,
    actual_qty REAL,
    unit TEXT DEFAULT 'kg',
    shift TEXT DEFAULT '1',
    line TEXT,
    status TEXT CHECK(status IN ('In Progress','Completed','On Hold','Cancelled')) DEFAULT 'In Progress',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    FOREIGN KEY (fg_code) REFERENCES finished_goods(fg_code)
);

CREATE TABLE IF NOT EXISTS batch_material_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    material_code TEXT NOT NULL,
    material_lot_no TEXT NOT NULL,
    quantity_used REAL,
    unit TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (batch_id) REFERENCES production_batches(batch_id),
    FOREIGN KEY (material_code) REFERENCES materials(material_code)
);

CREATE TABLE IF NOT EXISTS finished_goods_lots (
    fg_lot_id INTEGER PRIMARY KEY AUTOINCREMENT,
    fg_lot_no TEXT UNIQUE NOT NULL,
    batch_id TEXT NOT NULL,
    fg_code TEXT NOT NULL,
    production_date TEXT,
    expiry_date TEXT,
    quantity REAL,
    unit TEXT DEFAULT 'kg',
    release_status TEXT CHECK(release_status IN ('Pending','Released','Hold','Rejected','Recalled')) DEFAULT 'Pending',
    released_by TEXT,
    released_date TEXT,
    metal_detector_pass INTEGER DEFAULT 0,
    has_open_ncr INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (batch_id) REFERENCES production_batches(batch_id),
    FOREIGN KEY (fg_code) REFERENCES finished_goods(fg_code)
);

-- ============ RECALL (Priority 3) ============

CREATE TABLE IF NOT EXISTS mock_recall_records (
    mock_recall_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recall_date TEXT NOT NULL,
    recall_type TEXT CHECK(recall_type IN ('Mock','Actual')) DEFAULT 'Mock',
    fg_lot_no TEXT NOT NULL,
    fg_code TEXT,
    reason TEXT,
    total_produced REAL,
    total_shipped REAL,
    total_recovered REAL,
    recovery_rate REAL,
    mass_balance_ok INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('Initiated','In Progress','Completed','Closed')) DEFAULT 'Initiated',
    initiated_by TEXT,
    completed_date TEXT,
    remarks TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============ GHP & HYGIENE ============

CREATE TABLE IF NOT EXISTS hygiene_inspections (
    hygiene_id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_date TEXT NOT NULL,
    zone TEXT,
    area TEXT,
    category TEXT CHECK(category IN ('Personnel','Hand Washing','Clothing','Cleaning','Chemical','Pest','Waste','Water','Glass','Foreign Matter','Maintenance','Allergen','Temperature','Zoning','Cross Contamination')),
    checklist_item TEXT,
    result TEXT CHECK(result IN ('PASS','FAIL','N/A')),
    remarks TEXT,
    inspector TEXT,
    corrective_action TEXT,
    ncr_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT
);

CREATE TABLE IF NOT EXISTS cleaning_records (
    cleaning_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cleaning_date TEXT NOT NULL,
    area TEXT NOT NULL,
    equipment TEXT,
    chemical_used TEXT,
    concentration TEXT,
    method TEXT,
    pre_clean_result TEXT CHECK(pre_clean_result IN ('PASS','FAIL')),
    post_clean_result TEXT CHECK(post_clean_result IN ('PASS','FAIL')),
    verified_by TEXT,
    remarks TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT
);

-- ============ AUDIT TRAIL (Immutable) ============

CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT CHECK(action IN ('INSERT','UPDATE','DELETE','STATUS_CHANGE','LOGIN','LOGOUT')),
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    changed_by TEXT,
    changed_at TEXT DEFAULT (datetime('now')),
    ip_address TEXT,
    user_agent TEXT
);

-- ============ ALERTS ============

CREATE TABLE IF NOT EXISTS alerts (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT CHECK(alert_type IN ('CCP_FAIL','METAL_FAIL','NCR_OPEN','CAPA_OVERDUE','CALIBRATION_DUE','TEMP_DEVIATION','COMPLAINT_CRITICAL','RECALL','LOT_BLOCKED','DOCUMENT_REVIEW')),
    severity TEXT CHECK(severity IN ('INFO','WARNING','CRITICAL')) DEFAULT 'WARNING',
    title TEXT NOT NULL,
    message TEXT,
    related_table TEXT,
    related_id TEXT,
    status TEXT CHECK(status IN ('Active','Acknowledged','Resolved')) DEFAULT 'Active',
    assigned_to TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT,
    resolved_by TEXT
);

-- ============ USERS & RBAC ============

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT,
    role TEXT CHECK(role IN ('Admin','QA Manager','QA Inspector','Production Supervisor','Operator','Viewer')) DEFAULT 'Viewer',
    department TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inspection_lot ON inspection_logs(lot_no);
CREATE INDEX IF NOT EXISTS idx_inspection_date ON inspection_logs(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspection_status ON inspection_logs(result_status);
CREATE INDEX IF NOT EXISTS idx_metal_lot ON metal_detector_logs(lot_no);
CREATE INDEX IF NOT EXISTS idx_metal_status ON metal_detector_logs(result_status);
CREATE INDEX IF NOT EXISTS idx_ncr_status ON ncr_records(status);
CREATE INDEX IF NOT EXISTS idx_ncr_date ON ncr_records(ncr_date);
CREATE INDEX IF NOT EXISTS idx_ncr_lot ON ncr_records(lot_no);
CREATE INDEX IF NOT EXISTS idx_capa_status ON capa_records(status);
CREATE INDEX IF NOT EXISTS idx_complaint_status ON customer_complaints(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_receiving_date ON receiving_records(receiving_date);
CREATE INDEX IF NOT EXISTS idx_batch_date ON production_batches(production_date);
CREATE INDEX IF NOT EXISTS idx_fglot_status ON finished_goods_lots(release_status);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_date ON hygiene_inspections(inspection_date);

-- ============ VIEWS ============

CREATE VIEW IF NOT EXISTS v_dashboard_kpi AS
SELECT
    (SELECT COUNT(*) FROM ncr_records WHERE status IN ('Open','Investigation')) AS open_ncr_count,
    (SELECT COUNT(*) FROM capa_records WHERE status IN ('Open','In Progress','Overdue')) AS open_capa_count,
    (SELECT COUNT(*) FROM customer_complaints WHERE status IN ('Open','Investigation')) AS open_complaints,
    (SELECT COUNT(*) FROM alerts WHERE status = 'Active') AS active_alerts,
    (SELECT COUNT(*) FROM finished_goods_lots WHERE release_status = 'Hold') AS lots_on_hold,
    (SELECT COUNT(*) FROM equipment WHERE calibration_status IN ('Due','Overdue')) AS calibration_due,
    (SELECT COUNT(*) FROM inspection_logs WHERE result_status = 'FAIL' AND inspection_date >= date('now','-7 days')) AS fails_last_7d,
    (SELECT COUNT(*) FROM metal_detector_logs WHERE result_status = 'FAIL' AND test_datetime >= date('now','-7 days')) AS metal_fails_7d,
    (SELECT ROUND(100.0 * SUM(CASE WHEN result_status='PASS' THEN 1 ELSE 0 END) / MAX(COUNT(*),1), 1) FROM inspection_logs WHERE inspection_date >= date('now','-30 days')) AS pass_rate_30d,
    (SELECT COUNT(*) FROM documents WHERE status = 'Active') AS active_documents;
