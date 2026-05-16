const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" }
});

const fail = (message, status = 400, details = null) => json({ ok: false, message, details }, status);
const ok = (data = {}) => json({ ok: true, ...data });

const tables = new Set([
  "users", "suppliers", "materials", "finished_goods", "processes", "parameters",
  "equipment", "ccp_master", "inspection_logs", "metal_detector_logs", "documents"
]);

const allowedColumns = {
  users: ["user_id","full_name","email","department","role","status"],
  suppliers: ["supplier_id","supplier_name","material_type","risk_level","coa_required","halal_cert","gmp_status","approved_status","last_audit_date","material_code"],
  materials: ["material_code","material_name","material_type","category","unit","min_temp_c","max_temp_c","storage_temp","shelf_life_days","risk_level","supplier_id"],
  finished_goods: ["fg_code","fg_name","category","unit","net_weight_g","sticks_per_pack","storage_condition","shelf_life_months","allergen_contains","label_status"],
  processes: ["process_code","process_name","process_group","sequence_no","line_type","is_ccp","ghp_control_point","haccp_reference"],
  parameters: ["parameter_code","parameter_name","process_code","unit","min_value","max_value","target_value","spec_text","result_type","severity_if_fail"],
  equipment: ["equipment_id","equipment_name","equipment_type","location","calibration_required","calibration_frequency_days","last_calibration_date","next_calibration_date","status"],
  ccp_master: ["ccp_id","ccp_name","process_code","hazard_controlled","critical_limit","monitoring_method","frequency","corrective_action","verification_method","record_form_code"],
  inspection_logs: ["log_id","record_date","shift","line","product_code","lot_no","process_code","parameter_code","value_text","value_num","unit","result","severity","inspector","corrective_action","verified_by"],
  metal_detector_logs: ["md_log_id","record_date","line","product_code","lot_no","fe_test_mm","non_fe_test_mm","sus_test_mm","reject_function_ok","result","inspector","corrective_action","verified_by"],
  documents: ["doc_code","doc_title","doc_type","department","revision","effective_date","owner","status","cloudflare_r2_key","related_module"]
};

function assertTable(table) {
  if (!tables.has(table)) throw new Error(`Table not allowed: ${table}`);
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function listRows(env, table, url) {
  assertTable(table);
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 500);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  const result = await env.DB.prepare(`SELECT * FROM ${table} LIMIT ? OFFSET ?`).bind(limit, offset).all();
  return ok({ table, count: result.results.length, rows: result.results });
}

async function insertRow(env, table, payload) {
  assertTable(table);
  if (!payload || typeof payload !== "object") return fail("Invalid JSON payload");
  const cols = allowedColumns[table].filter(c => Object.prototype.hasOwnProperty.call(payload, c));
  if (cols.length === 0) return fail("No allowed columns found in payload");
  const placeholders = cols.map(() => "?").join(",");
  const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`;
  await env.DB.prepare(sql).bind(...cols.map(c => payload[c])).run();
  return ok({ table, inserted: true });
}

async function dashboard(env) {
  const checks = await env.DB.prepare("SELECT COUNT(*) AS total FROM inspection_logs").first();
  const pass = await env.DB.prepare("SELECT COUNT(*) AS total FROM inspection_logs WHERE result='PASS'").first();
  const failRows = await env.DB.prepare("SELECT COUNT(*) AS total FROM inspection_logs WHERE result='FAIL'").first();
  const mdFail = await env.DB.prepare("SELECT COUNT(*) AS total FROM metal_detector_logs WHERE result='FAIL'").first();
  const docs = await env.DB.prepare("SELECT COUNT(*) AS total FROM documents WHERE status='ACTIVE'").first();
  const passRate = checks.total ? Math.round((pass.total / checks.total) * 10000) / 100 : 0;
  return ok({
    kpi: {
      total_checks: checks.total,
      pass: pass.total,
      fail: failRows.total,
      pass_rate_percent: passRate,
      metal_detector_fail: mdFail.total,
      active_documents: docs.total,
      qa_status: failRows.total || mdFail.total ? "ATTENTION REQUIRED" : "UNDER CONTROL"
    }
  });
}

async function uploadDocument(env, request) {
  const form = await request.formData();
  const file = form.get("file");
  const docCode = form.get("doc_code");
  if (!file || !docCode) return fail("file and doc_code are required");
  const key = `documents/${docCode}/${Date.now()}-${file.name}`;
  await env.DOC_BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return ok({ r2_key: key });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        if (url.pathname === "/api/health") return ok({ service: "Smart QA Factory", version: "1.0 MASTER BASELINE" });
        if (url.pathname === "/api/dashboard") return dashboard(env);
        if (url.pathname === "/api/documents/upload" && request.method === "POST") return uploadDocument(env, request);
        const match = url.pathname.match(/^\/api\/table\/([a-z_]+)$/);
        if (match && request.method === "GET") return listRows(env, match[1], url);
        if (match && request.method === "POST") return insertRow(env, match[1], await readJson(request));
        return fail("API route not found", 404);
      } catch (err) {
        return fail(err.message, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
