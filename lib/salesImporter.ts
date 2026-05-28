import * as XLSX from "xlsx";
import { getDb } from "./mongodb";

// ── tunables ──────────────────────────────────────────────────────────────────
const NON_SALES_SHEETS = new Set(["DNC List", "Sheet1"]);

const MIN_PHONE_SCORE  = 5;
const MIN_DATE_SCORE   = 5;
const MIN_CENTER_SCORE = 8;

const PHONE_KEYWORDS  = ["mobile", "phone", "contact", " no", "number", "ph ", "mob"];
const DATE_KEYWORDS   = ["date", "agreement", "doa", "sold"];
const CENTER_KEYWORDS = ["center", "centre", "branch", "hub", "location"];
// ─────────────────────────────────────────────────────────────────────────────

const PHONE_RE = /^\d{9,10}$/;

export function normalizePhone(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).replace(/[\s\-\(\)\+]/g, "");
  if (!PHONE_RE.test(s)) return null;
  // Australian mobiles stored without leading 0 (9 digits)
  return s.length === 10 ? s : "0" + s;
}

function parseDate(val: unknown): Date | null {
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    // xlsx serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof val === "string") {
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/,  // dd/mm/yyyy
      /^(\d{2})-(\d{2})-(\d{4})$/,    // dd-mm-yyyy
      /^(\d{2})\.(\d{2})\.(\d{4})$/,  // dd.mm.yyyy
      /^(\d{4})-(\d{2})-(\d{2})$/,    // yyyy-mm-dd
    ];
    for (const re of formats) {
      const m = val.trim().match(re);
      if (m) {
        const [, a, b, c] = m;
        const d = re.source.startsWith("^(\\d{4})")
          ? new Date(+a, +b - 1, +c)
          : new Date(+c, +b - 1, +a);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }
  return null;
}

function looksLikePhone(val: unknown): boolean {
  return normalizePhone(val) !== null;
}

function looksLikeDate(val: unknown): boolean {
  return parseDate(val) !== null;
}

function findHeaderRow(rows: unknown[][]): number {
  let bestRow = 0, bestScore = 0;
  const limit = Math.min(10, rows.length);
  for (let i = 0; i < limit; i++) {
    const score = rows[i].filter(v => typeof v === "string" && v.trim().length > 1).length;
    if (score > bestScore) { bestScore = score; bestRow = i; }
  }
  return bestRow;
}

interface ColMap { phone: number | null; date: number | null; center: number | null }

function detectColumns(headers: string[], sampleRows: unknown[][]): ColMap {
  let phoneBest = { idx: null as number | null, score: 0 };
  let dateBest  = { idx: null as number | null, score: 0 };
  let centerBest= { idx: null as number | null, score: 0 };

  for (let idx = 0; idx < headers.length; idx++) {
    const h = (headers[idx] || "").toLowerCase().trim();
    const vals = sampleRows
      .map(r => r[idx])
      .filter(v => v != null)
      .slice(0, 15);

    // phone: keyword weight ×3 + value pattern
    const ph = PHONE_KEYWORDS.filter(kw => h.includes(kw)).length * 3
             + vals.filter(looksLikePhone).length;

    // date: keyword weight ×3 + value pattern
    const dt = DATE_KEYWORDS.filter(kw => h.includes(kw)).length * 3
             + vals.filter(looksLikeDate).length;

    // center: keyword weight ×4 + string value heuristic
    const ct = CENTER_KEYWORDS.filter(kw => h.includes(kw)).length * 4
             + vals.filter(v =>
                 typeof v === "string" && v.length > 2 && v.length < 80
                 && !looksLikeDate(v) && !looksLikePhone(v)
               ).length;

    if (ph > phoneBest.score)  phoneBest  = { idx, score: ph };
    if (dt > dateBest.score)   dateBest   = { idx, score: dt };
    if (ct > centerBest.score) centerBest = { idx, score: ct };
  }

  return {
    phone:  phoneBest.score  >= MIN_PHONE_SCORE  ? phoneBest.idx  : null,
    date:   dateBest.score   >= MIN_DATE_SCORE   ? dateBest.idx   : null,
    center: centerBest.score >= MIN_CENTER_SCORE ? centerBest.idx : null,
  };
}

export interface SheetReport {
  sheet: string;
  skipped?: boolean;
  reason?: string;
  inserted?: number;
  duplicates?: number;
  skippedRows?: number;
  detectedColumns?: { phone: string | null; date: string | null; center: string | null };
}

export async function importExcelBuffer(buffer: ArrayBuffer): Promise<SheetReport[]> {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const db = await getDb();
  const col = db.collection("sales");

  await col.createIndex({ phone: 1 });
  await col.createIndex({ phone: 1, channel: 1 });

  const report: SheetReport[] = [];

  for (const sheetName of wb.SheetNames) {
    if (NON_SALES_SHEETS.has(sheetName)) continue;

    const ws = wb.Sheets[sheetName];
    // Convert to array-of-arrays (raw values, no header row mapping yet)
    const allRows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      raw: false,   // get formatted strings for dates
    });

    // Also get with raw:true for proper date objects and numbers
    const allRowsRaw: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: null,
      raw: true,
    });

    if (allRows.length < 2) continue;

    const headerRowIdx = findHeaderRow(allRows);
    const headers = (allRows[headerRowIdx] as unknown[]).map(v =>
      typeof v === "string" ? v.trim() : String(v ?? "")
    );
    const dataRows    = allRowsRaw.slice(headerRowIdx + 1);
    const dataRowsFmt = allRows.slice(headerRowIdx + 1);
    const cols = detectColumns(headers, dataRows.slice(0, 20));

    if (cols.phone === null) {
      report.push({ sheet: sheetName, skipped: true, reason: "no phone column detected" });
      continue;
    }

    const ops: object[] = [];
    let skippedRows = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row    = dataRows[i];
      const rowFmt = dataRowsFmt[i];

      const phone = normalizePhone(row[cols.phone!]);
      if (!phone) { skippedRows++; continue; }

      // Use formatted row for date string parsing, raw row for Date objects
      const rawDate  = cols.date !== null ? row[cols.date]    : null;
      const fmtDate  = cols.date !== null ? rowFmt[cols.date] : null;
      const saleDate = parseDate(rawDate) ?? parseDate(fmtDate);

      const rawCenter = cols.center !== null ? row[cols.center] : null;
      const centerName = typeof rawCenter === "string" ? rawCenter.trim() || null : null;

      const doc = {
        phone,
        channel:    sheetName,
        sale_date:  saleDate,
        center_name: centerName,
        imported_at: new Date(),
      };

      ops.push({
        updateOne: {
          filter: { phone, channel: sheetName, sale_date: saleDate },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      });
    }

    if (ops.length === 0) {
      report.push({ sheet: sheetName, inserted: 0, duplicates: 0, skippedRows });
      continue;
    }

    const result = await col.bulkWrite(ops as Parameters<typeof col.bulkWrite>[0], { ordered: false });

    report.push({
      sheet:    sheetName,
      inserted: result.upsertedCount,
      duplicates: result.matchedCount,
      skippedRows,
      detectedColumns: {
        phone:  headers[cols.phone!] ?? null,
        date:   cols.date   !== null ? headers[cols.date]   ?? null : null,
        center: cols.center !== null ? headers[cols.center] ?? null : null,
      },
    });
  }

  return report;
}
