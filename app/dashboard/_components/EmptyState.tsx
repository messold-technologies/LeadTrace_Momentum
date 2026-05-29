"use client";

import { Search, Upload } from "lucide-react";

type Props = Readonly<{
  onImport: () => void;
}>;

export function EmptyState({ onImport }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        <Search className="h-7 w-7 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">
        Search by phone or NMI
      </h3>
      <p className="mt-1 text-sm text-slate-400 max-w-xs">
        Enter a phone number or NMI / MIRN above to see sales history. Numbers
        on the DNC List are flagged in results.
      </p>
      <button
        type="button"
        onClick={onImport}
        className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors"
      >
        <Upload className="h-4 w-4" />
        Import Excel data
      </button>
    </div>
  );
}
