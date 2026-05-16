// ═══════════════════════════════════════════════════════════════
// SMART QA FACTORY — RM Receiving API v3.0
// Cloudflare Workers + D1 + R2
// ═══════════════════════════════════════════════════════════════

export interface Env { DB: D1Database; R2: R2Bucket; JWT_SECRET: string; }

const json = (data: any, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
});
const err = (msg: string, status = 400) => json({ error: true, message: msg }, status);

function genRef(prefix: string): string {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${d}-${r}`;
}

async function audit(db: D1Database, table: string, id: string, ref: string,
  action: string, by: string, field?: string, oldV?: string, newV?: string, summary?: string) {
  await db.prepare(
    `INSERT INTO audit_logs (table_name, record_id, record_ref, action, field_changed, old_value, new_value, change_summary, changed_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(table, id, ref, action, field, oldV, newV, summary, by).run();
}

async function createAlert(db: D1Database, type: string, sev: string,
  title: string, msg: string, table?: string, id?: string, role?: string) {
  await db.prepare(
    `INSERT INTO rm_receiving_alerts (alert_type, severity, title, message, related_table, related_id, assigned_role)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(type, sev, title, msg, table, id, role).run();
}

// ─── Validation Engine ───
interface ValidationResult {
  overall: 'PASS' | 'FAIL' | 'HOLD';
  failReasons: string[];
  holdReasons: string[];
  measurements: Array<{
    type: string; param: string; paramTh: string;
    specMin?: number; specMax?: number; specText?: string;
    value?: number; valueText?: string; unit?: string;
    status: string; isCritical: boolean; deviation?: number;
  }>;
}

function validateReceiving(data: any, spec: any): ValidationResult {
  const measurements: ValidationResult['measurements'] = [];
  const failReasons: string[] = [];
  const holdReasons: string[] = [];

  // 1. Vehicle Temperature
  if (data.vehicle_temp != null) {
    const vMin = spec?.temp_vehicle_min ?? 0;
    const vMax = spec?.temp_vehicle_max ?? 4;
    const pass = data.vehicle_temp >= vMin && data.vehicle_temp <= vMax;
    if (!pass) holdReasons.push('VEHICLE_TEMP_OUT_OF_SPEC');
    measurements.push({
      type: 'vehicle_temp', param: 'Vehicle Temperature', paramTh: 'อุณหภูมิรถขนส่ง',
      specMin: vMin, specMax: vMax, value: data.vehicle_temp, unit: '°C',
      status: pass ? 'PASS' : 'HOLD', isCritical: true,
      deviation: pass ? undefined : Math.max(0, data.vehicle_temp - vMax)
    });
  }

  // 2. Surface Temperature (critical for chilled meat)
  if (data.surface_temp != null) {
    const sMax = spec?.temp_surface_max ?? 4;
    const sMin = spec?.temp_surface_min ?? -1;
    const pass = data.surface_temp >= sMin && data.surface_temp <= sMax;
    const hardFail = data.surface_temp > 7; // absolute limit for chilled meat
    if (hardFail) failReasons.push('SURFACE_TEMP_CRITICAL_EXCEED');
    else if (!pass) holdReasons.push('SURFACE_TEMP_OUT_OF_SPEC');
    measurements.push({
      type: 'surface_temp', param: 'Surface Temperature', paramTh: 'อุณหภูมิผิวหน้า',
      specMin: sMin, specMax: sMax, value: data.surface_temp, unit: '°C',
      status: hardFail ? 'FAIL' : (pass ? 'PASS' : 'HOLD'), isCritical: true,
      deviation: pass ? undefined : Math.max(0, data.surface_temp - sMax)
    });
  }

  // 3. Core Temperature
  if (data.core_temp != null) {
    const cMax = spec?.temp_core_max ?? 7;
    const cMin = spec?.temp_core_min ?? -1;
    const pass = data.core_temp >= cMin && data.core_temp <= cMax;
    const hardFail = data.core_temp > 10;
    if (hardFail) failReasons.push('CORE_TEMP_CRITICAL_EXCEED');
    else if (!pass) holdReasons.push('CORE_TEMP_OUT_OF_SPEC');
    measurements.push({
      type: 'core_temp', param: 'Core Temperature', paramTh: 'อุณหภูมิแกนกลาง',
      specMin: cMin, specMax: cMax, value: data.core_temp, unit: '°C',
      status: hardFail ? 'FAIL' : (pass ? 'PASS' : 'HOLD'), isCritical: true,
      deviation: pass ? undefined : Math.max(0, data.core_temp - cMax)
    });
  }

  // 4. Visual Appearance
  const visualOk = ['ปกติ', 'Normal'].includes(data.visual_appearance || 'ปกติ');
  if (!visualOk) holdReasons.push('VISUAL_ABNORMAL');
  measurements.push({
    type: 'visual', param: 'Visual Appearance', paramTh: 'ลักษณะปรากฏ',
    specText: 'ปกติ / Normal', valueText: data.visual_appearance || 'ปกติ',
    status: visualOk ? 'PASS' : 'HOLD', isCritical: false
  });

  // 5. Odor
  const odorOk = ['ปกติ', 'Normal'].includes(data.odor_check || 'ปกติ');
  if (!odorOk) failReasons.push('ODOR_ABNORMAL');
  measurements.push({
    type: 'odor', param: 'Odor Check', paramTh: 'กลิ่น',
    specText: 'ปกติ / Normal', valueText: data.odor_check || 'ปกติ',
    status: odorOk ? 'PASS' : 'FAIL', isCritical: true
  });

  // 6. Slime
  const slimeOk = ['ไม่พบ', 'Not Found'].includes(data.slime_check || 'ไม่พบ');
  if (!slimeOk) failReasons.push('SLIME_FOUND');
  measurements.push({
    type: 'slime', param: 'Slime Check', paramTh: 'เมือก/ลื่น',
    specText: 'ไม่พบ / Not Found', valueText: data.slime_check || 'ไม่พบ',
    status: slimeOk ? 'PASS' : 'FAIL', isCritical: true
  });

  // 7. Packaging Condition
  const pkgOk = ['สมบูรณ์', 'Intact'].includes(data.packaging_condition || 'สมบูรณ์');
  if (!pkgOk) failReasons.push('PACKAGING_DAMAGED');
  measurements.push({
    type: 'packaging', param: 'Packaging Condition', paramTh: 'สภาพบรรจุภัณฑ์',
    specText: 'สมบูรณ์ / Intact', valueText: data.packaging_condition || 'สมบูรณ์',
    status: pkgOk ? 'PASS' : 'FAIL', isCritical: false
  });

  // 8. Label Condition
  const labelOk = ['ถูกต้อง', 'Correct'].includes(data.label_condition || 'ถูกต้อง');
  if (!labelOk) {
    const missing = ['ไม่มี', 'Missing'].includes(data.label_condition);
    if (missing) failReasons.push('LABEL_MISSING');
    else holdReasons.push('LABEL_INCORRECT');
  }
  measurements.push({
    type: 'label', param: 'Label Condition', paramTh: 'สภาพฉลาก',
    specText: 'ถูกต้อง / Correct', valueText: data.label_condition || 'ถูกต้อง',
    status: labelOk ? 'PASS' : (['ไม่มี', 'Missing'].includes(data.label_condition) ? 'FAIL' : 'HOLD'),
    isCritical: false
  });

  // 9. Foreign Matter
  const fmOk = ['ไม่พบ', 'Not Found'].includes(data.foreign_matter || 'ไม่พบ');
  if (!fmOk) failReasons.push('FOREIGN_MATTER_FOUND');
  measurements.push({
    type: 'foreign_matter', param: 'Foreign Matter', paramTh: 'สิ่งแปลกปลอม',
    specText: 'ไม่พบ / Not Found', valueText: data.foreign_matter || 'ไม่พบ',
    status: fmOk ? 'PASS' : 'FAIL', isCritical: true
  });

  // 10. COA check
  const coaRequired = spec?.coa_required || data.coa_required;
  if (coaRequired && !data.coa_received) {
    holdReasons.push('COA_MISSING');
    measurements.push({
      type: 'other', param: 'COA Document', paramTh: 'เอกสาร COA',
      specText: 'Required', valueText: 'Not Received',
      status: 'HOLD', isCritical: false
    });
  }

  // Determine overall result
  let overall: 'PASS' | 'FAIL' | 'HOLD' = 'PASS';
  if (failReasons.length > 0) overall = 'FAIL';
  else if (holdReasons.length > 0) overall = 'HOLD';

  return { overall, failReasons, holdReasons, measurements };
}

// ─── Auto CAPA Generator ───
async function autoCreateCAPA(
  db: D1Database, source_ref: string, description: string,
  priority: string, created_by: string, detail?: string
): Promise<string> {
  const capa_id = genRef('CAPA');
  const target_date = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  await db.prepare(
    `INSERT INTO capa_actions (capa_id, capa_type, source, source_ref, source_table, source_record_id, description, detail, priority, target_date, status, created_by)
     VALUES (?, 'Corrective', 'RM Receiving', ?, 'rm_receiving_lots', ?, ?, ?, ?, ?, 'Open', ?)`
  ).bind(capa_id, source_ref, source_ref, description, detail, priority, target_date, created_by).run();

  await createAlert(db, 'CAPA_CREATED', priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
    `CAPA สร้างอัตโนมัติ: ${capa_id}`,
    `${description}`, 'capa_actions', capa_id, 'QA_MANAGER');

  return capa_id;
}

// ═══════════ ROUTE HANDLERS ═══════════

// GET /api/rm-receiving/dashboard
async function getDashboard(db: D1Database): Promise<Response> {
  const kpi = await db.prepare(`SELECT * FROM v_rm_receiving_dashboard`).first();
  const supplierIssues = await db.prepare(
    `SELECT * FROM v_rm_supplier_issues WHERE total_receipts_90d > 0 ORDER BY fail_count DESC LIMIT 5`
  ).all();
  const recentAlerts = await db.prepare(
    `SELECT * FROM rm_receiving_alerts WHERE status = 'Active' ORDER BY created_at DESC LIMIT 10`
  ).all();
  const recentLots = await db.prepare(
    `SELECT r.*, s.supplier_name, m.material_name
     FROM rm_receiving_lots r
     JOIN suppliers s ON r.supplier_id = s.supplier_id
     JOIN raw_materials m ON r.material_code = m.material_code
     WHERE r.receiving_date >= date('now', '-7 days')
     ORDER BY r.receiving_date DESC, r.receiving_time DESC LIMIT 20`
  ).all();

  return json({
    kpi, supplierIssues: supplierIssues.results,
    recentAlerts: recentAlerts.results, recentLots: recentLots.results
  });
}

// GET /api/rm-receiving/records
async function getRecords(db: D1Database, url: URL): Promise<Response> {
  let query = `SELECT r.*, s.supplier_name, m.material_name, m.category
     FROM rm_receiving_lots r
     JOIN suppliers s ON r.supplier_id = s.supplier_id
     JOIN raw_materials m ON r.material_code = m.material_code WHERE 1=1`;
  const params: any[] = [];

  const dateFrom = url.searchParams.get('from');
  if (dateFrom) { query += ` AND r.receiving_date >= ?`; params.push(dateFrom); }
  const dateTo = url.searchParams.get('to');
  if (dateTo) { query += ` AND r.receiving_date <= ?`; params.push(dateTo); }
  const supplier = url.searchParams.get('supplier');
  if (supplier) { query += ` AND r.supplier_id = ?`; params.push(supplier); }
  const material = url.searchParams.get('material');
  if (material) { query += ` AND r.material_code = ?`; params.push(material); }
  const result = url.searchParams.get('result');
  if (result) { query += ` AND r.overall_result = ?`; params.push(result); }
  const search = url.searchParams.get('search');
  if (search) {
    query += ` AND (r.receiving_ref LIKE ? OR r.internal_lot_no LIKE ? OR r.supplier_lot_no LIKE ? OR s.supplier_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY r.receiving_date DESC, r.receiving_time DESC LIMIT 200`;
  const records = await db.prepare(query).bind(...params).all();
  return json({ data: records.results, total: records.results.length });
}

// GET /api/rm-receiving/:id
async function getRecordById(db: D1Database, id: string): Promise<Response> {
  const lot = await db.prepare(
    `SELECT r.*, s.supplier_name, m.material_name, m.category, m.storage_condition
     FROM rm_receiving_lots r
     JOIN suppliers s ON r.supplier_id = s.supplier_id
     JOIN raw_materials m ON r.material_code = m.material_code
     WHERE r.receiving_id = ? OR r.receiving_ref = ?`
  ).bind(id, id).first();
  if (!lot) return err('Record not found', 404);

  const measurements = await db.prepare(
    `SELECT * FROM rm_receiving_measurements WHERE receiving_id = ? ORDER BY measurement_id`
  ).bind((lot as any).receiving_id).all();

  const holdRecords = await db.prepare(
    `SELECT * FROM rm_hold_records WHERE receiving_id = ? ORDER BY hold_date DESC`
  ).bind((lot as any).receiving_id).all();

  const auditTrail = await db.prepare(
    `SELECT * FROM audit_logs WHERE table_name = 'rm_receiving_lots' AND (record_id = ? OR record_ref = ?) ORDER BY changed_at DESC LIMIT 50`
  ).bind(String((lot as any).receiving_id), (lot as any).receiving_ref).all();

  const documents = await db.prepare(
    `SELECT * FROM uploaded_documents WHERE related_table = 'rm_receiving_lots' AND related_id = ? AND is_active = 1`
  ).bind(String((lot as any).receiving_id)).all();

  return json({
    data: {
      ...lot,
      measurements: measurements.results,
      hold_records: holdRecords.results,
      audit_trail: auditTrail.results,
      documents: documents.results
    }
  });
}

// POST /api/rm-receiving
async function createReceiving(db: D1Database, body: any, user: string): Promise<Response> {
  const ref = genRef('RCV');
  const internalLot = body.internal_lot_no || genRef('L');

  // Get spec
  const spec = await db.prepare(
    `SELECT * FROM rm_specifications WHERE material_code = ? AND status = 'Active' ORDER BY spec_version DESC LIMIT 1`
  ).bind(body.material_code).first();

  // Get material info
  const material = await db.prepare(
    `SELECT * FROM raw_materials WHERE material_code = ?`
  ).bind(body.material_code).first<any>();

  // Run validation
  const validation = validateReceiving({
    ...body,
    coa_required: material?.coa_required
  }, spec);

  // Calculate days to expiry
  let daysToExpiry = null;
  if (body.expiry_date) {
    daysToExpiry = Math.floor((new Date(body.expiry_date).getTime() - Date.now()) / 86400000);
  }

  // Insert main record
  await db.prepare(
    `INSERT INTO rm_receiving_lots (
      receiving_ref, receiving_date, receiving_time,
      supplier_id, do_invoice_no, vehicle_plate, driver_name,
      material_code, supplier_lot_no, internal_lot_no, quantity, unit,
      production_date, expiry_date, days_to_expiry,
      vehicle_temp, surface_temp, core_temp,
      storage_condition, coa_received, spec_id,
      visual_appearance, odor_check, slime_check, color_check,
      packaging_condition, label_condition, foreign_matter,
      overall_result, fail_reasons, hold_reasons,
      inspector, inspector_name, remarks, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    ref, body.receiving_date || new Date().toISOString().split('T')[0],
    body.receiving_time || new Date().toTimeString().slice(0, 5),
    body.supplier_id, body.do_invoice_no, body.vehicle_plate, body.driver_name,
    body.material_code, body.supplier_lot_no, internalLot, body.quantity, body.unit || 'kg',
    body.production_date, body.expiry_date, daysToExpiry,
    body.vehicle_temp, body.surface_temp, body.core_temp,
    body.storage_condition || material?.storage_condition || 'Chilled',
    body.coa_received ? 1 : 0, (spec as any)?.spec_id || null,
    body.visual_appearance || 'ปกติ', body.odor_check || 'ปกติ',
    body.slime_check || 'ไม่พบ', body.color_check || 'ปกติ',
    body.packaging_condition || 'สมบูรณ์', body.label_condition || 'ถูกต้อง',
    body.foreign_matter || 'ไม่พบ',
    validation.overall,
    validation.failReasons.length > 0 ? JSON.stringify(validation.failReasons) : null,
    validation.holdReasons.length > 0 ? JSON.stringify(validation.holdReasons) : null,
    user, body.inspector_name, body.remarks,
    validation.overall === 'PASS' ? 'Released' : (validation.overall === 'FAIL' ? 'Rejected' : 'On Hold'),
    user
  ).run();

  // Get inserted ID
  const inserted = await db.prepare(
    `SELECT receiving_id FROM rm_receiving_lots WHERE receiving_ref = ?`
  ).bind(ref).first<any>();
  const receivingId = inserted?.receiving_id;

  // Insert measurements
  for (const m of validation.measurements) {
    await db.prepare(
      `INSERT INTO rm_receiving_measurements (
        receiving_id, measurement_type, parameter_name, parameter_name_th,
        spec_min, spec_max, spec_text, result_numeric, result_text, unit,
        result_status, deviation_value, is_critical, measured_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      receivingId, m.type, m.param, m.paramTh,
      m.specMin ?? null, m.specMax ?? null, m.specText ?? null,
      m.value ?? null, m.valueText ?? null, m.unit ?? null,
      m.status, m.deviation ?? null, m.isCritical ? 1 : 0, user
    ).run();
  }

  // Audit log
  await audit(db, 'rm_receiving_lots', String(receivingId), ref, 'CREATE', user,
    'overall_result', null, validation.overall,
    `RM Receiving: ${body.material_code} from ${body.supplier_id}, Qty: ${body.quantity} ${body.unit || 'kg'}, Result: ${validation.overall}`);

  let capa_id = null;
  let hold_id = null;

  // ★ FAIL → Auto-create CAPA
  if (validation.overall === 'FAIL') {
    const failDesc = `RM Receiving FAIL: ${material?.material_name || body.material_code} (${ref}) — ${validation.failReasons.join(', ')}`;
    capa_id = await autoCreateCAPA(db, ref, failDesc,
      validation.failReasons.some(r => r.includes('CRITICAL') || r.includes('FOREIGN_MATTER') || r.includes('SLIME')) ? 'CRITICAL' : 'HIGH',
      user, `Supplier: ${body.supplier_id}, Lot: ${internalLot}`);

    await db.prepare(`UPDATE rm_receiving_lots SET capa_id = ? WHERE receiving_ref = ?`).bind(capa_id, ref).run();

    // Create alerts for each fail reason
    for (const reason of validation.failReasons) {
      const alertType = reason.includes('TEMP') ? 'TEMP_OUT_OF_SPEC' :
        reason.includes('ODOR') ? 'SENSORY_FAIL' :
        reason.includes('SLIME') ? 'SENSORY_FAIL' :
        reason.includes('FOREIGN') ? 'FOREIGN_MATTER' :
        reason.includes('PACKAGING') ? 'PACKAGING_FAIL' :
        reason.includes('LABEL') ? 'LABEL_FAIL' : 'VISUAL_FAIL';

      await createAlert(db, alertType, 'CRITICAL',
        `❌ RM FAIL: ${reason}`,
        `${ref} — ${material?.material_name || body.material_code} from ${body.supplier_id}`,
        'rm_receiving_lots', ref, 'QA_MANAGER');
    }
  }

  // ★ HOLD → Create hold record
  if (validation.overall === 'HOLD') {
    const holdRef = genRef('HOLD');
    await db.prepare(
      `INSERT INTO rm_hold_records (hold_ref, receiving_id, hold_reason, hold_category, risk_level, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(holdRef, receivingId,
      validation.holdReasons.join(', '),
      validation.holdReasons[0]?.includes('TEMP') ? 'Temperature' :
        validation.holdReasons[0]?.includes('VISUAL') ? 'Visual' :
        validation.holdReasons[0]?.includes('COA') ? 'Documentation' :
        validation.holdReasons[0]?.includes('LABEL') ? 'Label' : 'Specification',
      'MEDIUM', user
    ).run();

    const holdInserted = await db.prepare(
      `SELECT hold_id FROM rm_hold_records WHERE hold_ref = ?`
    ).bind(holdRef).first<any>();
    hold_id = holdInserted?.hold_id;

    await db.prepare(`UPDATE rm_receiving_lots SET hold_record_id = ? WHERE receiving_ref = ?`).bind(hold_id, ref).run();

    await createAlert(db, 'HOLD_CREATED', 'WARNING',
      `⏸️ RM HOLD: ${holdRef}`,
      `${material?.material_name || body.material_code} — ${validation.holdReasons.join(', ')} — QA disposition required`,
      'rm_hold_records', holdRef, 'QA_MANAGER');
  }

  return json({
    success: true,
    receiving_ref: ref,
    internal_lot_no: internalLot,
    overall_result: validation.overall,
    status: validation.overall === 'PASS' ? 'Released' : (validation.overall === 'FAIL' ? 'Rejected' : 'On Hold'),
    fail_reasons: validation.failReasons,
    hold_reasons: validation.holdReasons,
    measurements: validation.measurements,
    capa_id,
    hold_id,
    message: validation.overall === 'FAIL'
      ? `❌ RM FAIL — CAPA ${capa_id} auto-created`
      : validation.overall === 'HOLD'
        ? `⏸️ RM ON HOLD — QA disposition required`
        : `✅ RM PASS — Released to storage`
  }, 201);
}

// GET /api/rm-receiving/holds
async function getHoldRecords(db: D1Database, url: URL): Promise<Response> {
  const status = url.searchParams.get('status') || 'Open';
  const result = await db.prepare(
    `SELECT h.*, r.receiving_ref, r.material_code, r.supplier_id, r.internal_lot_no,
            r.quantity, r.unit, r.surface_temp, r.core_temp, r.overall_result,
            s.supplier_name, m.material_name
     FROM rm_hold_records h
     JOIN rm_receiving_lots r ON h.receiving_id = r.receiving_id
     JOIN suppliers s ON r.supplier_id = s.supplier_id
     JOIN raw_materials m ON r.material_code = m.material_code
     WHERE h.status = ? OR ? = 'All'
     ORDER BY h.hold_date DESC LIMIT 100`
  ).bind(status, status).all();
  return json({ data: result.results });
}

// PATCH /api/rm-receiving/holds/:id/disposition
async function disposeHold(db: D1Database, id: string, body: any, user: string): Promise<Response> {
  const hold = await db.prepare(`SELECT * FROM rm_hold_records WHERE hold_id = ? OR hold_ref = ?`).bind(id, id).first<any>();
  if (!hold) return err('Hold record not found', 404);

  const { disposition, disposition_reason, disposition_conditions, qa_comments } = body;
  if (!disposition) return err('Disposition is required');

  await db.prepare(
    `UPDATE rm_hold_records SET
      disposition = ?, disposition_reason = ?, disposition_conditions = ?,
      disposition_by = ?, disposition_date = datetime('now'),
      qa_reviewer = ?, qa_review_date = datetime('now'), qa_comments = ?,
      status = 'Dispositioned', updated_at = datetime('now'), updated_by = ?
     WHERE hold_id = ?`
  ).bind(disposition, disposition_reason, disposition_conditions, user, user, qa_comments, user, hold.hold_id).run();

  // Update receiving lot status based on disposition
  let newStatus = 'On Hold';
  if (disposition === 'Accept by Concession' || disposition === 'Use As Is') newStatus = 'Conditional Release';
  else if (disposition === 'Reject' || disposition === 'Return to Supplier' || disposition === 'Destroyed') newStatus = 'Rejected';

  await db.prepare(
    `UPDATE rm_receiving_lots SET status = ?, approved_by = ?, approved_date = datetime('now'), updated_at = datetime('now'), updated_by = ?
     WHERE receiving_id = ?`
  ).bind(newStatus, user, user, hold.receiving_id).run();

  // Create CAPA for rejects
  if (['Reject', 'Return to Supplier', 'Destroyed'].includes(disposition)) {
    const capaId = await autoCreateCAPA(db, hold.hold_ref,
      `Hold disposition: ${disposition} — ${hold.hold_reason}`,
      'HIGH', user, `Reason: ${disposition_reason || hold.hold_reason}`);
    await db.prepare(`UPDATE rm_hold_records SET capa_id = ? WHERE hold_id = ?`).bind(capaId, hold.hold_id).run();
  }

  await audit(db, 'rm_hold_records', String(hold.hold_id), hold.hold_ref, 'DISPOSITION', user,
    'disposition', 'Pending', disposition, `QA Decision: ${disposition}`);

  return json({ success: true, disposition, new_status: newStatus });
}

// GET /api/rm-receiving/specs
async function getSpecs(db: D1Database, url: URL): Promise<Response> {
  const material = url.searchParams.get('material');
  let query = `SELECT s.*, m.material_name, m.category FROM rm_specifications s JOIN raw_materials m ON s.material_code = m.material_code WHERE s.status = 'Active'`;
  const params: any[] = [];
  if (material) { query += ` AND s.material_code = ?`; params.push(material); }
  query += ` ORDER BY s.material_code, s.spec_version DESC`;
  const result = await db.prepare(query).bind(...params).all();
  return json({ data: result.results });
}

// GET /api/rm-receiving/suppliers
async function getSuppliers(db: D1Database): Promise<Response> {
  const result = await db.prepare(
    `SELECT * FROM suppliers WHERE material_type = 'RM' AND is_active = 1 ORDER BY supplier_id`
  ).all();
  return json({ data: result.results });
}

// GET /api/rm-receiving/materials
async function getMaterials(db: D1Database): Promise<Response> {
  const result = await db.prepare(
    `SELECT * FROM raw_materials WHERE material_type = 'RM' AND is_active = 1 ORDER BY material_code`
  ).all();
  return json({ data: result.results });
}

// POST /api/rm-receiving/documents/upload
async function uploadDocument(db: D1Database, r2: R2Bucket, body: any, user: string): Promise<Response> {
  // In production, handle multipart form data with actual file upload to R2
  const docId = await db.prepare(
    `INSERT INTO uploaded_documents (document_type, related_table, related_id, file_name, file_path, file_size, file_type, description, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(body.document_type, body.related_table, body.related_id,
    body.file_name, body.file_path || `documents/${genRef('DOC')}`,
    body.file_size, body.file_type, body.description, user).run();

  return json({ success: true, document_id: docId }, 201);
}

// ═══════════ ROUTER ═══════════

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }});
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const user = 'QA-User'; // In production, extract from JWT

    try {
      if (path === '/api/rm-receiving/dashboard' && method === 'GET') return getDashboard(env.DB);
      if (path === '/api/rm-receiving/records' && method === 'GET') return getRecords(env.DB, url);
      if (path === '/api/rm-receiving' && method === 'POST') return createReceiving(env.DB, await request.json(), user);
      if (path.match(/^\/api\/rm-receiving\/[\w-]+$/) && method === 'GET') return getRecordById(env.DB, path.split('/').pop()!);
      if (path === '/api/rm-receiving/holds' && method === 'GET') return getHoldRecords(env.DB, url);
      if (path.match(/^\/api\/rm-receiving\/holds\/[\w-]+\/disposition$/) && method === 'PATCH')
        return disposeHold(env.DB, path.split('/')[4], await request.json(), user);
      if (path === '/api/rm-receiving/specs' && method === 'GET') return getSpecs(env.DB, url);
      if (path === '/api/rm-receiving/suppliers' && method === 'GET') return getSuppliers(env.DB);
      if (path === '/api/rm-receiving/materials' && method === 'GET') return getMaterials(env.DB);
      if (path === '/api/rm-receiving/documents/upload' && method === 'POST')
        return uploadDocument(env.DB, env.R2, await request.json(), user);

      return err('Not Found', 404);
    } catch (e: any) {
      console.error('API Error:', e);
      return err(e.message || 'Internal Server Error', 500);
    }
  }
};
