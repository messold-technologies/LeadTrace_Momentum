"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LogOut, Search, Upload, Megaphone,
  X, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────

type User = { id: string; email: string };

type SaleRecord = { sale_date: string | null; center_name: string | null };

type ChannelResult = {
  channel: string;
  count:   number;
  records: SaleRecord[];
};

type SearchResult = {
  phone:    string;
  found:    boolean;
  channels: ChannelResult[];
};

type SheetReport = {
  sheet:        string;
  skipped?:     boolean;
  reason?:      string;
  inserted?:    number;
  duplicates?:  number;
  skippedRows?: number;
  detectedColumns?: { phone: string | null; date: string | null; center: string | null };
};

type ImportResult = {
  summary: { totalInserted: number; totalDuplicates: number; totalSkipped: number };
  sheets:  SheetReport[];
};

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(raw: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

// ── sub-components ────────────────────────────────────────────────────────────

function ChannelCard({ result }: { result: ChannelResult }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
          <span className="font-medium text-white text-sm">{result.channel}</span>
          <span className="text-xs text-white/40 bg-white/10 rounded-full px-2 py-0.5">
            {result.count} {result.count === 1 ? "sale" : "sales"}
          </span>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-white/40" />
          : <ChevronDown className="h-4 w-4 text-white/40" />}
      </button>

      {open && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {result.records.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-white/50">{formatDate(r.sale_date)}</span>
              <span className="text-white/80 text-right max-w-[55%] truncate">
                {r.center_name ?? <span className="text-white/30 italic">No center</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SheetRow({ r }: { r: SheetReport }) {
  if (r.skipped) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
        <span className="text-white/60 font-medium">{r.sheet}</span>
        <span className="text-white/30 italic">{r.reason}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm flex-wrap">
      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
      <span className="text-white/80 font-medium min-w-[110px]">{r.sheet}</span>
      <span className="text-emerald-400">{r.inserted} new</span>
      {(r.duplicates ?? 0) > 0 && (
        <span className="text-white/30">{r.duplicates} dup</span>
      )}
      {(r.skippedRows ?? 0) > 0 && (
        <span className="text-white/30">{r.skippedRows} no-phone</span>
      )}
      {r.detectedColumns?.phone && (
        <span className="ml-auto text-[11px] text-white/20 truncate max-w-[180px]">
          ↳ {r.detectedColumns.phone}
        </span>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user,  setUser]  = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  // search
  const [phoneInput,   setPhoneInput]   = useState("");
  const [searching,    setSearching]    = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError,  setSearchError]  = useState<string | null>(null);

  // import
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError,  setImportError]  = useState<string | null>(null);

  // auth guard
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) { router.replace("/"); return; }
      const data = (await res.json()) as { user: User | null };
      if (!data.user) { router.replace("/"); return; }
      setUser(data.user);
      setReady(true);
    })().catch(() => router.replace("/"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    try {
      const res  = await fetch(`/api/sales/search?phone=${encodeURIComponent(phoneInput.trim())}`, { credentials: "include" });
      const data = (await res.json()) as SearchResult & { error?: string };
      if (!res.ok) { setSearchError(data.error ?? "Search failed"); return; }
      setSearchResult(data);
    } catch {
      setSearchError("Network error");
    } finally {
      setSearching(false);
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const res  = await fetch("/api/sales/import", { method: "POST", body: form, credentials: "include" });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) { setImportError(data.error ?? "Import failed"); return; }
      setImportResult(data);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setImportError("Network error");
    } finally {
      setImporting(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070A12]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_700px_at_20%_10%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(800px_600px_at_85%_5%,rgba(217,70,239,0.30),transparent_60%),radial-gradient(900px_700px_at_50%_100%,rgba(59,130,246,0.18),transparent_65%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-size-[72px_72px]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/10 to-black/35" />

      <div className="relative mx-auto max-w-4xl px-4 py-8 space-y-6">

        {/* header */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-5 py-3.5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <Megaphone className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-widest text-white/40">LEAD TRACE</div>
              <div className="text-sm font-medium text-white/80">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* search */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Search by Phone Number</h2>
            <p className="mt-0.5 text-sm text-white/40">Find all sales channels a contact number appears in</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              placeholder="e.g. 0412 345 678"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/25 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm"
              disabled={searching}
            />
            <button
              type="submit"
              disabled={searching || !phoneInput.trim()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <Search className="h-4 w-4" />
              {searching ? "Searching…" : "Search"}
            </button>
          </form>

          {searchError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {searchError}
            </div>
          )}

          {searchResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">
                  Results for <span className="text-white font-medium">{searchResult.phone}</span>
                </span>
                <button onClick={() => setSearchResult(null)} className="text-white/30 hover:text-white/60 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {!searchResult.found ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-white/40">
                  No sales records found for this number.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-white/30 uppercase tracking-wider">
                    Found in {searchResult.channels.length}{" "}
                    {searchResult.channels.length === 1 ? "channel" : "channels"}
                  </div>
                  {searchResult.channels.map(ch => (
                    <ChannelCard key={ch.channel} result={ch} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* import */}
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Import Sales Data</h2>
            <p className="mt-0.5 text-sm text-white/40">
              Upload any Excel file — each sheet is treated as a sales channel automatically
            </p>
          </div>

          <form onSubmit={handleImport} className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 px-6 py-10 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors">
              <Upload className="h-6 w-6 text-white/30" />
              <div className="text-sm text-white/50 text-center">
                {selectedFile ? (
                  <span className="text-indigo-300 font-medium">{selectedFile.name}</span>
                ) : (
                  <><span className="text-white/70 font-medium">Click to browse</span> or drag &amp; drop</>
                )}
              </div>
              <div className="text-xs text-white/25">.xlsx or .xls only</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => {
                  setSelectedFile(e.target.files?.[0] ?? null);
                  setImportResult(null);
                  setImportError(null);
                }}
              />
            </label>

            <button
              type="submit"
              disabled={importing || !selectedFile}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              <Upload className="h-4 w-4" />
              {importing ? "Importing…" : "Import File"}
            </button>
          </form>

          {importError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {importError}
            </div>
          )}

          {importResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-xs font-medium text-emerald-300">
                  {importResult.summary.totalInserted} new records
                </span>
                {importResult.summary.totalDuplicates > 0 && (
                  <span className="rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/40">
                    {importResult.summary.totalDuplicates} duplicates skipped
                  </span>
                )}
                {importResult.summary.totalSkipped > 0 && (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-xs text-amber-300">
                    {importResult.summary.totalSkipped} rows without phone
                  </span>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5 overflow-hidden">
                {importResult.sheets.map(r => <SheetRow key={r.sheet} r={r} />)}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
