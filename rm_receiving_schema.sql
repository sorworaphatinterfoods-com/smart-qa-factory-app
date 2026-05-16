-- ═══════════════════════════════════════════════════════════════
-- SMART QA FACTORY — RM Receiving Module Schema v3.0
-- Target: Cloudflare D1 (SQLite)
-- Compliance: HACCP Codex · ISO 22000 · GMP Thailand
-- Run: wrangler d1 execute SMART_QA_DB --file=rm_receiving_schema.sql
-- ═══════════════════════════════════════════════════════════════

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ═══════════ 1. SUPPLIERS ═══════════

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id         TEXT PRIMARY KEY,          -- SP0001 format
    supplier_name       TEXT NOT NULL,
    supplier_name_en    TEXT,
    material_type       TEXT CHECK(material_type IN ('RM','DM','PM','CM')),
    category            TEXT,                      -- e.g. Pork, Chicken, Seafood
    risk_level          TEXT CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'MEDIUM',
    approved_status     TEXT CHECK(approved_status IN (
        'Pending','Approved','Conditional','Suspended','Rejected','Expired'
    )) DEFAULT 'Pending',
    approval_date       TEXT,
    expiry_date         TEXT,
    contact_person      TEXT,
    phone               TEXT,
    email               TEXT,
    address             TEXT,
    tax_id              TEXT,
    certification       TEXT,                      -- e.g. GMP, HACCP, Halal
    audit_score         REAL,
    last_audit_date     TEXT,
    next_audit_date     TEXT,
    evaluation_score    REAL,
    evaluation_grade    TEXT CHECK(evaluation_grade IN ('A','B','C','D','F',NULL)),
    notes               TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    created_by          TEXT,
    updated_by          TEXT,
    is_active           INTEGER NOT NULL DEFAULT 1
);

-- ═══════════ 2. RAW MATERIALS ═══════════

CREATE TABLE IF NOT EXISTS raw_materials (
    material_code       TEXT PRIMARY KEY,          -- RM0001 format
    material_name       TEXT NOT NULL,
    material_name_en    TEXT,
    material_type       TEXT NOT NULL CHECK(material_type IN ('RM','DM','PM','CM')),
    category            TEXT,                      -- Pork, Chicken, Seasoning, Packaging, Chemical
    sub_category        TEXT,                      -- e.g. Loin, Breast, Thigh
    default_supplier_id TEXT,
    unit                TEXT NOT NULL DEFAULT 'kg',
    storage_condition   TEXT CHECK(storage_condition IN ('Chilled','Frozen','Ambient','Cool Dry')),
    min_receiving_temp  REAL,                      -- °C minimum allowed at receiving
    max_receiving_temp  REAL,                      -- °C maximum allowed at receiving
    shelf_life_days     INTEGER,
    allergen_info       TEXT,                      -- comma-separated allergen codes
    risk_level          TEXT CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'LOW',
    coa_required        INTEGER NOT NULL DEFAULT 0,
    requires_micro_test INTEGER NOT NULL DEFAULT 0,
    spec_document_ref   TEXT,                      -- reference to rm_specifications
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    created_by          TEXT,
    updated_by          TEXT,
    is_active           INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (default_supplier_id) REFERENCES suppliers(supplier_id)
);

-- ═══════════ 3. RM SPECIFICATIONS ═══════════

CREATE TABLE IF NOT EXISTS rm_specifications (
    spec_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    material_code       TEXT NOT NULL,
    spec_version        INTEGER NOT NULL DEFAULT 1,
    effective_date      TEXT NOT NULL,
    expiry_date         TEXT,
    status              TEXT CHECK(status IN ('Draft','Active','Superseded','Obsolete')) DEFAULT 'Draft',

    -- Temperature specifications
    temp_surface_min    REAL,
    temp_surface_max    REAL,                      -- surface temp upper limit
    temp_core_min       REAL,
    temp_core_max       REAL,                      -- core temp upper limit
    temp_vehicle_min    REAL,
    temp_vehicle_max    REAL,                      -- delivery vehicle temp limit

    -- Physical specifications
    ph_min              REAL,
    ph_max              REAL,
    color_standard      TEXT,                      -- acceptable color description
    odor_standard       TEXT,                      -- 'Normal' / description
    texture_standard    TEXT,
    appearance_standard TEXT,

    -- Packaging specifications
    packaging_type      TEXT,
    packaging_integrity TEXT DEFAULT 'No damage, no leak, no tear',
    label_required_fields TEXT,                    -- comma-separated required label items

    -- Microbiological limits (reference)
    micro_tpc_max       REAL,                      -- Total Plate Count max CFU/g
    micro_ecoli_max     REAL,
    micro_salmonella    TEXT DEFAULT 'Not Detected / 25g',
    micro_listeria      TEXT DEFAULT 'Not Detected / 25g',

    -- Weight tolerance
    weight_tolerance_pct REAL DEFAULT 2.0,

    -- Additional
    additional_criteria TEXT,                       -- JSON or text for extra checks
    approved_by         TEXT,
    approved_date       TEXT,
    document_path       TEXT,                      -- R2 path to spec PDF

    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    created_by          TEXT,
    updated_by          TEXT,

    FOREIGN KEY (material_code) REFERENCES raw_materials(material_code),
    UNIQUE(material_code, spec_version)
);

-- ═══════════ 4. RM RECEIVING LOTS ═══════════

CREATE TABLE IF NOT EXISTS rm_receiving_lots (
    receiving_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    receiving_ref       TEXT UNIQUE NOT NULL,       -- RCV-YYYYMMDD-001 format
    receiving_date      TEXT NOT NULL,
    receiving_time      TEXT,                       -- HH:MM format

    -- Supplier info
    supplier_id         TEXT NOT NULL,
    do_invoice_no       TEXT,                       -- Delivery Order / Invoice number
    vehicle_plate       TEXT,
    driver_name         TEXT,

    -- Material info
    material_code       TEXT NOT NULL,
    supplier_lot_no     TEXT,                       -- Supplier's lot/batch number
    internal_lot_no     TEXT NOT NULL,              -- Factory internal lot assignment
    quantity            REAL NOT NULL,
    unit                TEXT NOT NULL DEFAULT 'kg',

    -- Product dates
    production_date     TEXT,
    expiry_date         TEXT,
    days_to_expiry      INTEGER,                   -- auto-calculated

    -- Temperature readings
    vehicle_temp        REAL,                      -- delivery vehicle temperature °C
    surface_temp        REAL,                      -- product surface temperature °C
    core_temp           REAL,                      -- product core temperature °C

    -- Storage assignment
    storage_condition   TEXT CHECK(storage_condition IN ('Chilled','Frozen','Ambient')),
    storage_location    TEXT,

    -- COA
    coa_received        INTEGER NOT NULL DEFAULT 0,
    coa_document_id     INTEGER,                   -- FK to uploaded_documents

    -- Spec reference
    spec_id             INTEGER,                   -- FK to rm_specifications

    -- Visual & sensory checks
    visual_appearance   TEXT CHECK(visual_appearance IN ('ปกติ','ผิดปกติ','Normal','Abnormal')) DEFAULT 'ปกติ',
    odor_check          TEXT CHECK(odor_check IN ('ปกติ','ผิดปกติ','Normal','Abnormal')) DEFAULT 'ปกติ',
    slime_check         TEXT CHECK(slime_check IN ('ไม่พบ','พบ','Not Found','Found')) DEFAULT 'ไม่พบ',
    color_check         TEXT CHECK(color_check IN ('ปกติ','ผิดปกติ','Normal','Abnormal')) DEFAULT 'ปกติ',
    packaging_condition TEXT CHECK(packaging_condition IN ('สมบูรณ์','ชำรุด','Intact','Damaged')) DEFAULT 'สมบูรณ์',
    label_condition     TEXT CHECK(label_condition IN ('ถูกต้อง','ไม่ถูกต้อง','ไม่มี','Correct','Incorrect','Missing')) DEFAULT 'ถูกต้อง',
    foreign_matter      TEXT CHECK(foreign_matter IN ('ไม่พบ','พบ','Not Found','Found')) DEFAULT 'ไม่พบ',

    -- Overall result
    overall_result      TEXT NOT NULL CHECK(overall_result IN ('PASS','FAIL','HOLD','PENDING')) DEFAULT 'PENDING',
    fail_reasons        TEXT,                      -- JSON array of fail reason codes
    hold_reasons        TEXT,

    -- Personnel
    inspector           TEXT NOT NULL,
    inspector_name      TEXT,
    approved_by         TEXT,                      -- QA approval for release
    approved_date       TEXT,

    -- Remarks
    remarks             TEXT,
    photo_paths         TEXT,                      -- JSON array of R2 photo paths

    -- Status tracking
    status              TEXT NOT NULL CHECK(status IN (
        'Draft','Submitted','Under Review','Released','Rejected',
        'Returned','Voided','On Hold','Conditional Release'
    )) DEFAULT 'Draft',

    -- Linked records
    ncr_id              TEXT,
    capa_id             TEXT,
    hold_record_id      INTEGER,

    -- Audit fields
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    created_by          TEXT NOT NULL,
    updated_by          TEXT,

    FOREIGN KEY (supplier_id)   REFERENCES suppliers(supplier_id),
    FOREIGN KEY (material_code) REFERENCES raw_materials(material_code),
    FOREIGN KEY (spec_id)       REFERENCES rm_specifications(spec_id)
);

-- ═══════════ 5. RM RECEIVING MEASUREMENTS ═══════════

CREATE TABLE IF NOT EXISTS rm_receiving_measurements (
    measurement_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    receiving_id        INTEGER NOT NULL,
    measurement_type    TEXT NOT NULL CHECK(measurement_type IN (
        'vehicle_temp','surface_temp','core_temp',
        'ph','weight','visual','odor','slime','color',
        'packaging','label','foreign_matter','micro',
        'moisture','fat','protein','other'
    )),
    parameter_name      TEXT NOT NULL,
    parameter_name_th   TEXT,
    spec_min            REAL,
    spec_max            REAL,
    spec_text           TEXT,                      -- for non-numeric specs
    result_numeric      REAL,
    result_text         TEXT,
    unit                TEXT,
    result_status       TEXT NOT NULL CHECK(result_status IN ('PASS','FAIL','HOLD','N/A','PENDING')),
    equipment_id        TEXT,
    deviation_value     REAL,                      -- how far out of spec
    is_critical         INTEGER NOT NULL DEFAULT 0, -- food safety critical parameter
    remarks             TEXT,
    measured_at         TEXT NOT NULL DEFAULT (datetime('now')),
    measured_by         TEXT NOT NULL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (receiving_id) REFERENCES rm_receiving_lots(receiving_id)
);

-- ═══════════ 6. RM HOLD RECORDS ═══════════

CREATE TABLE IF NOT EXISTS rm_hold_records (
    hold_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    hold_ref            TEXT UNIQUE NOT NULL,       -- HOLD-YYYYMMDD-001
    receiving_id        INTEGER NOT NULL,
    hold_date           TEXT NOT NULL DEFAULT (datetime('now')),

    -- Hold details
    hold_reason         TEXT NOT NULL,
    hold_category       TEXT CHECK(hold_category IN (
        'Temperature','Visual','Sensory','Packaging','Label',
        'Documentation','Foreign Matter','Quantity','Specification','Other'
    )),
    risk_level          TEXT CHECK(risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'MEDIUM',

    -- Disposition
    disposition         TEXT CHECK(disposition IN (
        'Pending','Accept by Concession','Reject','Return to Supplier',
        'Rework','Downgrade','Use As Is','Await QA Decision','Destroyed'
    )) DEFAULT 'Pending',
    disposition_reason  TEXT,
    disposition_conditions TEXT,                    -- conditions for conditional acceptance
    disposition_by      TEXT,
    disposition_date    TEXT,

    -- QA review
    qa_reviewer         TEXT,
    qa_review_date      TEXT,
    qa_decision         TEXT,
    qa_comments         TEXT,

    -- Linked records
    ncr_id              TEXT,
    capa_id             TEXT,

    -- Status
    status              TEXT CHECK(status IN ('Open','Under Review','Dispositioned','Closed','Voided')) DEFAULT 'Open',

    -- Audit
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    created_by          TEXT NOT NULL,
    updated_by          TEXT,

    FOREIGN KEY (receiving_id) REFERENCES rm_receiving_lots(receiving_id)
);

-- ═══════════ 7. CAPA ACTIONS ═══════════

CREATE TABLE IF NOT EXISTS capa_actions (
    capa_id             TEXT PRIMARY KEY,           -- CAPA-YYYYMMDD-001
    capa_type           TEXT CHECK(capa_type IN ('Corrective','Preventive','Both')) DEFAULT 'Corrective',
    source              TEXT CHECK(source IN (
        'RM Receiving','Inspection','CCP','Metal Detector','Complaint',
        'Audit','GHP','Supplier','Internal','Other'
    )) DEFAULT 'RM Receiving',
    source_ref          TEXT,                       -- receiving_ref or NCR ID
    source_table        TEXT,
    source_record_id    TEXT,

    -- Description
    description         TEXT NOT NULL,
    detail              TEXT,
    priority            TEXT CHECK(priority IN ('LOW','MEDIUM','HIGH','CRITICAL')) DEFAULT 'MEDIUM',

    -- Root cause
    root_cause_analysis TEXT,
    root_cause_method   TEXT CHECK(root_cause_method IN ('5 Why','Fishbone','FTA','Pareto','FMEA',NULL)),
    root_cause_category TEXT CHECK(root_cause_category IN (
        'Supplier','Transport','Storage','Process','Equipment',
        'Personnel','Material','Method','Environment','Other',NULL
    )),

    -- Actions
    corrective_action   TEXT,
    preventive_action   TEXT,
    containment_action  TEXT,

    -- Assignment
    responsible_person  TEXT,
    responsible_dept    TEXT,
    team_members        TEXT,

    -- Timeline
    target_date         TEXT,
    extension_date      TEXT,
    extension_reason    TEXT,
    actual_completion   TEXT,
    days_open           INTEGER,

    -- Verification
    effectiveness_criteria TEXT,
    effectiveness_check_date TEXT,
    effectiveness_result TEXT CHECK(effectiveness_result IN (
        'Effective','Not Effective','Partially Effective','Pending',NULL
    )),
    effectiveness_evidence TEXT,

    -- Approval
    verified_by         TEXT,
    verified_date       TEXT,
    approved_by         TEXT,
    approved_date       TEXT,
    closed_by           TEXT,
    closed_date         TEXT,

    -- Status
    status              TEXT CHECK(status IN (
        'Draft','Open','Root Cause Analysis','Action Planning',
        'Implementation','Verification','Effectiveness Check',
        'Closed Effective','Closed Not Effective','Overdue','Cancelled'
    )) DEFAULT 'Draft',

    -- Audit
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    created_by          TEXT NOT NULL,
    updated_by          TEXT
);

-- ═══════════ 8. UPLOADED DOCUMENTS ═══════════

CREATE TABLE IF NOT EXISTS uploaded_documents (
    document_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type       TEXT NOT NULL CHECK(document_type IN (
        'COA','Spec','Photo','Report','Certificate',
        'Audit Report','Test Result','Invoice','DO','Other'
    )),
    related_table       TEXT NOT NULL,              -- e.g. 'rm_receiving_lots'
    related_id          TEXT NOT NULL,              -- PK of related record
    file_name           TEXT NOT NULL,
    file_path           TEXT NOT NULL,              -- R2 object key
    file_size           INTEGER,
    file_type           TEXT,                       -- MIME type
    description         TEXT,
    uploaded_by         TEXT NOT NULL,
    uploaded_at         TEXT NOT NULL DEFAULT (datetime('now')),
    is_active           INTEGER NOT NULL DEFAULT 1
);

-- ═══════════ 9. AUDIT LOGS ═══════════

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id            INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name          TEXT NOT NULL,
    record_id           TEXT NOT NULL,
    record_ref          TEXT,                       -- human-readable reference
    action              TEXT NOT NULL CHECK(action IN (
        'CREATE','UPDATE','DELETE','STATUS_CHANGE','RESULT_CHANGE',
        'APPROVE','REJECT','HOLD','RELEASE','VOID','DISPOSITION',
        'CAPA_CREATE','CAPA_UPDATE','UPLOAD','LOGIN','EXPORT'
    )),
    field_changed       TEXT,
    old_value           TEXT,
    new_value           TEXT,
    change_summary      TEXT,
    changed_by          TEXT NOT NULL,
    changed_by_name     TEXT,
    changed_at          TEXT NOT NULL DEFAULT (datetime('now')),
    ip_address          TEXT,
    user_agent          TEXT,
    session_id          TEXT
);

-- ═══════════ 10. ALERTS (RM Receiving specific) ═══════════

CREATE TABLE IF NOT EXISTS rm_receiving_alerts (
    alert_id            INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type          TEXT NOT NULL CHECK(alert_type IN (
        'TEMP_OUT_OF_SPEC','VISUAL_FAIL','SENSORY_FAIL','PACKAGING_FAIL',
        'LABEL_FAIL','COA_MISSING','FOREIGN_MATTER','HOLD_CREATED',
        'CAPA_CREATED','CAPA_OVERDUE','SUPPLIER_ISSUE','EXPIRY_WARNING',
        'SPEC_MISSING','QUANTITY_DEVIATION'
    )),
    severity            TEXT CHECK(severity IN ('INFO','WARNING','CRITICAL','EMERGENCY')) DEFAULT 'WARNING',
    title               TEXT NOT NULL,
    title_th            TEXT,
    message             TEXT,
    related_table       TEXT,
    related_id          TEXT,
    assigned_to         TEXT,
    assigned_role       TEXT,
    status              TEXT CHECK(status IN ('Active','Acknowledged','Resolved','Dismissed')) DEFAULT 'Active',
    acknowledged_by     TEXT,
    acknowledged_at     TEXT,
    resolved_by         TEXT,
    resolved_at         TEXT,
    resolution_note     TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ═══════════ INDEXES ═══════════

CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(material_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(approved_status);
CREATE INDEX IF NOT EXISTS idx_materials_type ON raw_materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_cat ON raw_materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON raw_materials(default_supplier_id);
CREATE INDEX IF NOT EXISTS idx_specs_material ON rm_specifications(material_code);
CREATE INDEX IF NOT EXISTS idx_specs_status ON rm_specifications(status);
CREATE INDEX IF NOT EXISTS idx_rcv_date ON rm_receiving_lots(receiving_date);
CREATE INDEX IF NOT EXISTS idx_rcv_supplier ON rm_receiving_lots(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rcv_material ON rm_receiving_lots(material_code);
CREATE INDEX IF NOT EXISTS idx_rcv_lot ON rm_receiving_lots(internal_lot_no);
CREATE INDEX IF NOT EXISTS idx_rcv_result ON rm_receiving_lots(overall_result);
CREATE INDEX IF NOT EXISTS idx_rcv_status ON rm_receiving_lots(status);
CREATE INDEX IF NOT EXISTS idx_rcv_ref ON rm_receiving_lots(receiving_ref);
CREATE INDEX IF NOT EXISTS idx_meas_rcv ON rm_receiving_measurements(receiving_id);
CREATE INDEX IF NOT EXISTS idx_meas_type ON rm_receiving_measurements(measurement_type);
CREATE INDEX IF NOT EXISTS idx_meas_status ON rm_receiving_measurements(result_status);
CREATE INDEX IF NOT EXISTS idx_hold_rcv ON rm_hold_records(receiving_id);
CREATE INDEX IF NOT EXISTS idx_hold_status ON rm_hold_records(status);
CREATE INDEX IF NOT EXISTS idx_capa_status ON capa_actions(status);
CREATE INDEX IF NOT EXISTS idx_capa_source ON capa_actions(source, source_ref);
CREATE INDEX IF NOT EXISTS idx_capa_target ON capa_actions(target_date);
CREATE INDEX IF NOT EXISTS idx_docs_related ON uploaded_documents(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON rm_receiving_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON rm_receiving_alerts(alert_type);

-- ═══════════ VIEWS ═══════════

-- Dashboard KPI view
CREATE VIEW IF NOT EXISTS v_rm_receiving_dashboard AS
SELECT
    (SELECT COUNT(*) FROM rm_receiving_lots WHERE receiving_date = date('now')) AS today_total,
    (SELECT COUNT(*) FROM rm_receiving_lots WHERE receiving_date = date('now') AND overall_result = 'PASS') AS today_pass,
    (SELECT COUNT(*) FROM rm_receiving_lots WHERE receiving_date = date('now') AND overall_result = 'HOLD') AS today_hold,
    (SELECT COUNT(*) FROM rm_receiving_lots WHERE receiving_date = date('now') AND overall_result = 'FAIL') AS today_fail,
    (SELECT COUNT(*) FROM rm_receiving_lots WHERE receiving_date = date('now') AND overall_result = 'PENDING') AS today_pending,
    (SELECT ROUND(AVG(surface_temp), 1) FROM rm_receiving_lots WHERE receiving_date = date('now') AND surface_temp IS NOT NULL) AS avg_surface_temp_today,
    (SELECT ROUND(AVG(core_temp), 1) FROM rm_receiving_lots WHERE receiving_date = date('now') AND core_temp IS NOT NULL) AS avg_core_temp_today,
    (SELECT COUNT(*) FROM rm_hold_records WHERE status IN ('Open','Under Review')) AS open_holds,
    (SELECT COUNT(*) FROM capa_actions WHERE source = 'RM Receiving' AND status NOT IN ('Closed Effective','Closed Not Effective','Cancelled')) AS open_capas,
    (SELECT COUNT(*) FROM rm_receiving_alerts WHERE status = 'Active') AS active_alerts,
    (SELECT ROUND(100.0 * SUM(CASE WHEN overall_result = 'PASS' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) FROM rm_receiving_lots WHERE receiving_date >= date('now', '-30 days')) AS pass_rate_30d,
    (SELECT COUNT(*) FROM rm_receiving_lots WHERE overall_result = 'FAIL' AND receiving_date >= date('now', '-7 days')) AS fails_7d;

-- Supplier issue summary
CREATE VIEW IF NOT EXISTS v_rm_supplier_issues AS
SELECT
    s.supplier_id,
    s.supplier_name,
    s.risk_level,
    COUNT(r.receiving_id) AS total_receipts_90d,
    SUM(CASE WHEN r.overall_result = 'FAIL' THEN 1 ELSE 0 END) AS fail_count,
    SUM(CASE WHEN r.overall_result = 'HOLD' THEN 1 ELSE 0 END) AS hold_count,
    ROUND(100.0 * SUM(CASE WHEN r.overall_result = 'PASS' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) AS pass_rate,
    GROUP_CONCAT(DISTINCT r.fail_reasons) AS common_fail_reasons
FROM suppliers s
LEFT JOIN rm_receiving_lots r ON s.supplier_id = r.supplier_id
    AND r.receiving_date >= date('now', '-90 days')
WHERE s.material_type = 'RM' AND s.is_active = 1
GROUP BY s.supplier_id, s.supplier_name, s.risk_level
ORDER BY fail_count DESC, hold_count DESC;

-- ═══════════ SEED DATA ═══════════

-- Suppliers
INSERT OR IGNORE INTO suppliers (supplier_id, supplier_name, material_type, category, risk_level, approved_status, created_by) VALUES
('SP0001', 'บริษัท เบทาโกรเกษตรอุตสาหกรรม จำกัด (หมู)', 'RM', 'Pork', 'HIGH', 'Approved', 'SYSTEM'),
('SP0002', 'บริษัท เบทาโกรเกษตรอุตสาหกรรม จำกัด (ไก่)', 'RM', 'Chicken', 'HIGH', 'Approved', 'SYSTEM'),
('SP0003', 'บริษัท เอส แอล พิทักษ์ จำกัด', 'RM', 'Pork', 'HIGH', 'Approved', 'SYSTEM'),
('SP0004', 'บริษัท ฟู้ดจ๊อบ จำกัด', 'RM', 'Pork', 'HIGH', 'Approved', 'SYSTEM'),
('SP0034', 'บริษัท อีเค ซลอเทอร์เฮาส์ จำกัด', 'RM', 'Pork', 'HIGH', 'Conditional', 'SYSTEM');

-- Raw Materials
INSERT OR IGNORE INTO raw_materials (material_code, material_name, material_name_en, material_type, category, sub_category, default_supplier_id, unit, storage_condition, min_receiving_temp, max_receiving_temp, shelf_life_days, risk_level, coa_required, created_by) VALUES
('RM0001', 'สะโพกหมู', 'Pork Leg', 'RM', 'Pork', 'Leg', 'SP0001', 'kg', 'Chilled', -1.0, 7.0, 6, 'HIGH', 1, 'SYSTEM'),
('RM0002', 'มันสันแข็ง', 'Hard Back Fat', 'RM', 'Pork', 'Fat', 'SP0001', 'kg', 'Chilled', -1.0, 7.0, 6, 'HIGH', 1, 'SYSTEM'),
('RM0004', 'เศษบีบติดหนัง', 'Pork Trim w/ Skin', 'RM', 'Chicken', 'Trim', 'SP0003', 'kg', 'Chilled', -1.0, 7.0, 5, 'HIGH', 1, 'SYSTEM'),
('RM0005', 'อกไก่', 'Chicken Breast', 'RM', 'Chicken', 'Breast', 'SP0002', 'kg', 'Chilled', -1.0, 7.0, 5, 'HIGH', 1, 'SYSTEM');

-- Specifications
INSERT OR IGNORE INTO rm_specifications (material_code, spec_version, effective_date, status, temp_surface_min, temp_surface_max, temp_core_min, temp_core_max, temp_vehicle_min, temp_vehicle_max, ph_min, ph_max, color_standard, odor_standard, packaging_integrity, approved_by, created_by) VALUES
('RM0001', 1, '2025-01-01', 'Active', -1.0, 4.0, -1.0, 7.0, 0.0, 4.0, 5.5, 5.8, 'สีชมพูแดงปกติ ไม่คล้ำ', 'กลิ่นปกติของเนื้อหมูสด ไม่มีกลิ่นเหม็น', 'บรรจุภัณฑ์สมบูรณ์ ไม่ฉีกขาด ไม่รั่วซึม', 'QA Manager', 'SYSTEM'),
('RM0002', 1, '2025-01-01', 'Active', -1.0, 4.0, -1.0, 7.0, 0.0, 4.0, 5.5, 6.0, 'สีขาวปกติ ไม่เหลืองคล้ำ', 'กลิ่นปกติ ไม่มีกลิ่นหืน', 'บรรจุภัณฑ์สมบูรณ์ ไม่ฉีกขาด ไม่รั่วซึม', 'QA Manager', 'SYSTEM'),
('RM0004', 1, '2025-01-01', 'Active', -1.0, 4.0, -1.0, 7.0, 0.0, 4.0, 5.5, 5.8, 'สีปกติ', 'กลิ่นปกติ', 'บรรจุภัณฑ์สมบูรณ์', 'QA Manager', 'SYSTEM'),
('RM0005', 1, '2025-01-01', 'Active', -1.0, 4.0, -1.0, 7.0, 0.0, 4.0, 5.8, 6.2, 'สีชมพูอ่อนปกติ ไม่เขียว', 'กลิ่นปกติของเนื้อไก่สด', 'บรรจุภัณฑ์สมบูรณ์ ไม่ฉีกขาด ไม่รั่วซึม', 'QA Manager', 'SYSTEM');
