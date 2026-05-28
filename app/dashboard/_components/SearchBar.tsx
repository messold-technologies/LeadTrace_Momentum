"use client";

import { Search } from "lucide-react";
import type { FormEvent } from "react";
import { cls } from "./utils";

type Props = Readonly<{
  searchMode: "phone" | "nmi";
  searchInput: string;
  searching: boolean;
  onModeChange: (mode: "phone" | "nmi") => void;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}>;

export function SearchBar({
  searchMode,
  searchInput,
  searching,
  onModeChange,
  onInputChange,
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 items-center">
      <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden shrink-0">
        {(["phone", "nmi"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onModeChange(mode)}
            className={cls(
              "px-3.5 py-2.5 text-xs font-semibold transition-colors",
              searchMode === mode
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
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
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={
            searchMode === "phone" ? "e.g. 0412 345 678" : "e.g. 4102636546"
          }
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
  );
}
