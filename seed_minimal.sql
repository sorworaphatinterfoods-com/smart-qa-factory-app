INSERT OR IGNORE INTO roles(role_id, role_name, description) VALUES
('ROLE_QC_INSPECTOR','QC Inspector','บันทึกผลตรวจ QA/QC'),
('ROLE_QA_SUPERVISOR','QA Supervisor','อนุมัติ HOLD/RELEASE และ NCR'),
('ROLE_QA_MANAGER','QA Manager','อนุมัติ Critical case / Recall'),
('ROLE_DCC','DCC Officer','ควบคุมเอกสาร'),
('ROLE_ADMIN','System Admin','ผู้ดูแลระบบ');

INSERT OR IGNORE INTO users(user_id, display_name, email, department, position, role_id) VALUES
('USR-QA-001','QA Supervisor','qa.supervisor@example.com','QA','QA Supervisor','ROLE_QA_SUPERVISOR'),
('USR-QC-001','QC Inspector','qc.inspector@example.com','QC','QC Inspector','ROLE_QC_INSPECTOR');

INSERT OR IGNORE INTO ccp_master(ccp_id, process_id, ccp_name, critical_limit, hazard_type, monitoring_frequency, corrective_action_standard)
VALUES ('CCP001','PC0012','Metal Detector','Fe/Non-Fe/SUS must pass test piece and no detected metal above limit','PHYSICAL','Start/Hourly/End and product change','Stop line, hold affected lot, repass, create NCR, maintenance inspection');
