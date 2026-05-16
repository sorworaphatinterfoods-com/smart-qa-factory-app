# Smart QA Factory System — Cloudflare App

Version: 1.0 MASTER BASELINE  
Scope: GHPs + HACCP Codex QA/QC system for meat processing / frozen products.

## Modules included
- RM Receiving
- In-Process QC
- CCP Monitoring
- Metal Detector / Foreign Body Control
- FG Release
- GHP Basic Program: Cleaning, Pest, Hygiene, Water, Waste, Chemical, Maintenance
- Calibration
- Document Control / DCC with R2 document storage
- Complaint / NCR / CAPA
- Traceability / Recall readiness
- Management Review KPI dashboard

## Local setup
```bash
npm install
npm run build
npm run dev
```

## Cloudflare setup
1. Create D1 database:
```bash
npm run d1:create
```
2. Copy the returned `database_id` into `wrangler.toml`.
3. Create R2 bucket named `smartqa-documents` in Cloudflare dashboard.
4. Initialize schema:
```bash
npm run d1:init:prod
```
5. Deploy:
```bash
npm run deploy
```

## API examples
```bash
curl /api/health
curl /api/dashboard
curl /api/table/documents
curl -X POST /api/table/inspection_logs -H "content-type: application/json" -d '{"log_id":"QA-001","record_date":"2026-05-16","result":"PASS","inspector":"QA"}'
```

## Critical implementation rule
Do not rename database keys, document codes, API route names, or master table columns after baseline approval unless revision control is issued.
