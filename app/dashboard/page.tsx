"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LogOut, Search, Upload, Megaphone, X,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  Layers, FileSpreadsheet, Phone,
} from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────

type User = { id: string; email: string };

type Channel = { name: string; count: number };

type ChannelRecord = {
  phone:       string;
  nmi:         string | null;
  sale_date:   string | null;
  center_name: string | null;
};

type ChannelPage = {
  channel:    string;
  total:      number;
  page:       number;
  totalPages: number;
  records:    ChannelRecord[];
};

type SearchRecord  = { nmi: string | null; sale_date: string | null; center_name: string | null };
type SearchChannel = { channel: string; count: number; records: SearchRecord[] };
type SearchResult  = { type: "phone" | "nmi"; query: string; found: boolean; channels: SearchChannel[] };

type SheetReport = {
  sheet:        string;
  skipped?:     boolean;
  reason?:      string;
  inserted?:    number;
  duplicates?:  number;
  skippedRows?: number;
  detectedColumns?: { phone: string | null; nmi: string | null; date: string | null; center: string | null };
};
type ImportResult = {
  summary: { totalInserted: number; totalDuplicates: number; totalSkipped: number };
  sheets:  SheetReport[];
};

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(raw: string | null): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ── Import Modal ──────────────────────────────────────────────────────────────

function ImportModal({
  onClose,
  onImported,
}: {
  onClose:    () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file,    setFile]    = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<ImportResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/sales/import", { method: "POST", body: form, credentials: "include" });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) { setError(data.error ?? "Import failed"); return; }
      setResult(data);
      onImported();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Import Sales Data</h2>
              <p className="text-xs text-slate-500">Each sheet is treated as a channel automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <form onSubmit={handleImport} className="space-y-4">
              {/* drop zone */}
              <label className={cls(
                "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors",
                file
                  ? "border-indigo-300 bg-indigo-50/50"
                  : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
              )}>
                <div className={cls(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  file ? "bg-indigo-100" : "bg-slate-100"
                )}>
                  <Upload className={cls("h-5 w-5", file ? "text-indigo-600" : "text-slate-400")} />
                </div>
                <div className="text-center">
                  {file ? (
                    <p className="text-sm font-medium text-indigo-700">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-700">Click to browse or drag &amp; drop</p>
                      <p className="mt-0.5 text-xs text-slate-400">.xlsx or .xls files only</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => { setFile(e.target.files?.[0] ?? null); setError(null); }}
                />
              </label>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                <Upload className="h-4 w-4" />
                {loading ? "Importing…" : "Import File"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                  <div className="text-xl font-bold text-emerald-700">{result.summary.totalInserted}</div>
                  <div className="text-xs text-emerald-600 mt-0.5">New records</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <div className="text-xl font-bold text-slate-600">{result.summary.totalDuplicates}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Duplicates</div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                  <div className="text-xl font-bold text-amber-700">{result.summary.totalSkipped}</div>
                  <div className="text-xs text-amber-600 mt-0.5">No phone</div>
                </div>
              </div>

              {/* per-sheet */}
              <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {result.sheets.map(r => (
                  <div key={r.sheet} className="flex items-center gap-3 px-4 py-2.5">
                    {r.skipped
                      ? <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                      : <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                    <span className="text-sm font-medium text-slate-700 min-w-[100px]">{r.sheet}</span>
                    {r.skipped
                      ? <span className="text-xs text-slate-400 italic">{r.reason}</span>
                      : <>
                          <span className="text-xs text-emerald-600">{r.inserted} new</span>
                          {(r.duplicates ?? 0) > 0 && <span className="text-xs text-slate-400">{r.duplicates} dup</span>}
                          {(r.skippedRows ?? 0) > 0 && <span className="text-xs text-slate-400">{r.skippedRows} skipped</span>}
                        </>}
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-sm font-medium text-slate-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Channel Table ─────────────────────────────────────────────────────────────

function ChannelTable({ channelName }: { channelName: string }) {
  const [data,    setData]    = useState<ChannelPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sales/channel/${encodeURIComponent(channelName)}?page=${p}&limit=50`,
        { credentials: "include" }
      );
      const d = (await res.json()) as ChannelPage;
      setData(d);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [channelName]);

  useEffect(() => { load(1); }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* table header info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, data.total)} of{" "}
          <span className="font-medium text-slate-700">{data.total.toLocaleString()}</span> records
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="text-xs text-slate-500 px-1">{page} / {data.totalPages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= data.totalPages || loading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">NMI / MIRN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Sale Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Center Name</th>
            </tr>
          </thead>
          <tbody className={cls("divide-y divide-slate-100", loading ? "opacity-50" : "")}>
            {data.records.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-700 text-xs">{r.phone}</td>
                <td className="px-4 py-3 font-mono text-slate-600 text-xs">{r.nmi ?? <span className="text-slate-300">—</span>}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(r.sale_date)}</td>
                <td className="px-4 py-3 text-slate-600">{r.center_name ?? <span className="text-slate-300 italic">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Phone Search Results ──────────────────────────────────────────────────────

function SearchResults({ result, onClose }: { result: SearchResult; onClose: () => void }) {
  const [openChannel, setOpenChannel] = useState<string | null>(null);

  if (!result.found) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <Phone className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">No sales records found for <span className="font-mono font-medium text-slate-700">{result.query}</span></p>
      </div>
    );
  }

  const label = result.type === "nmi" ? "NMI / MIRN" : "Phone";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mr-1">{label}</span>
          <span className="font-mono font-medium text-slate-900">{result.query}</span>
          {" — found in "}
          <span className="font-medium text-indigo-600">{result.channels.length}</span>{" "}
          {result.channels.length === 1 ? "channel" : "channels"}
        </p>
        <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {result.channels.map(ch => (
        <div key={ch.channel} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            onClick={() => setOpenChannel(openChannel === ch.channel ? null : ch.channel)}
          >
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
              <span className="font-medium text-slate-800 text-sm">{ch.channel}</span>
              <span className="rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium px-2 py-0.5">
                {ch.count} {ch.count === 1 ? "sale" : "sales"}
              </span>
            </div>
            <ChevronRight className={cls("h-4 w-4 text-slate-400 transition-transform", openChannel === ch.channel && "rotate-90")} />
          </button>

          {openChannel === ch.channel && (
            <div className="border-t border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {result.type === "phone" && (
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">NMI / MIRN</th>
                    )}
                    {result.type === "nmi" && (
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                    )}
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Sale Date</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Center Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ch.records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {result.type === "phone" && (
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.nmi ?? <span className="text-slate-300">—</span>}</td>
                      )}
                      {result.type === "nmi" && (
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.nmi ?? <span className="text-slate-300">—</span>}</td>
                      )}
                      <td className="px-4 py-2.5 text-slate-600">{formatDate(r.sale_date)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.center_name ?? <span className="text-slate-300 italic">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<User | null>(null);
  const [ready,   setReady]   = useState(false);

  // sidebar
  const [channels,         setChannels]         = useState<Channel[]>([]);
  const [selectedChannel,  setSelectedChannel]  = useState<string | null>(null);

  // search
  const [searchMode,   setSearchMode]   = useState<"phone" | "nmi">("phone");
  const [searchInput,  setSearchInput]  = useState("");
  const [searching,    setSearching]    = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError,  setSearchError]  = useState<string | null>(null);

  // modal
  const [showModal, setShowModal] = useState(false);

  // ── auth guard ──
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

  // ── load channels ──
  const loadChannels = useCallback(async () => {
    const res = await fetch("/api/sales/channels", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { channels: Channel[] };
    setChannels(data.channels);
  }, []);

  useEffect(() => { if (ready) loadChannels(); }, [ready, loadChannels]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    setSelectedChannel(null);
    try {
      const param = searchMode === "phone" ? "phone" : "nmi";
      const res   = await fetch(`/api/sales/search?${param}=${encodeURIComponent(searchInput.trim())}`, { credentials: "include" });
      const data  = (await res.json()) as SearchResult & { error?: string };
      if (!res.ok) { setSearchError(data.error ?? "Search failed"); return; }
      setSearchResult(data);
    } catch {
      setSearchError("Network error");
    } finally {
      setSearching(false);
    }
  }

  if (!ready) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* ── top header ── */}
      <header className="flex-shrink-0 flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Megaphone className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900 tracking-tight">LeadTrace</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Import Excel
          </button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <span className="text-xs text-slate-500 hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── sidebar ── */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Channels</span>
            {channels.length > 0 && (
              <span className="ml-auto text-xs text-slate-400">{channels.length}</span>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-1">
            {channels.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-slate-400">No data imported yet.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-2 text-xs text-indigo-600 hover:underline font-medium"
                >
                  Import a file
                </button>
              </div>
            ) : (
              channels.map(ch => (
                <button
                  key={ch.name}
                  onClick={() => { setSelectedChannel(ch.name); setSearchResult(null); }}
                  className={cls(
                    "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                    selectedChannel === ch.name
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-sm truncate font-medium">{ch.name}</span>
                  <span className={cls(
                    "text-xs rounded-full px-1.5 py-0.5 font-medium shrink-0",
                    selectedChannel === ch.name
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-slate-400 bg-slate-100"
                  )}>
                    {ch.count.toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* ── main content ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 items-center">
            {/* mode toggle */}
            <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden shrink-0">
              {(["phone", "nmi"] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setSearchMode(mode); setSearchInput(""); setSearchResult(null); setSearchError(null); }}
                  className={cls(
                    "px-3.5 py-2.5 text-xs font-semibold transition-colors",
                    searchMode === mode
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  )}
                >
                  {mode === "phone" ? "Phone" : "NMI / MIRN"}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={searchMode === "phone" ? "e.g. 0412 345 678" : "e.g. 4102636546"}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                disabled={searching}
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchInput.trim()}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors shrink-0"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>

          {/* search error */}
          {searchError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {searchError}
            </div>
          )}

          {/* search results */}
          {searchResult && (
            <SearchResults result={searchResult} onClose={() => setSearchResult(null)} />
          )}

          {/* channel table */}
          {selectedChannel && !searchResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900">{selectedChannel}</h2>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {channels.find(c => c.name === selectedChannel)?.count.toLocaleString()} records
                </span>
              </div>
              <ChannelTable channelName={selectedChannel} />
            </div>
          )}

          {/* empty state */}
          {!selectedChannel && !searchResult && !searchError && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <Layers className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">Select a channel or search</h3>
              <p className="mt-1 text-sm text-slate-400 max-w-xs">
                Pick a channel from the sidebar to browse its records, or search by phone number above.
              </p>
              {channels.length === 0 && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Import your first Excel file
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── import modal ── */}
      {showModal && (
        <ImportModal
          onClose={() => setShowModal(false)}
          onImported={() => loadChannels()}
        />
      )}
    </div>
  );
}
