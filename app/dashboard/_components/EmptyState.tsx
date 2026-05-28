"use client";

import { Layers, Upload } from "lucide-react";

type Props = Readonly<{
  showImportCta: boolean;
  onImport: () => void;
}>;

export function EmptyState({ showImportCta, onImport }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        <Layers className="h-7 w-7 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">
        Select a channel or search
      </h3>
      <p className="mt-1 text-sm text-slate-400 max-w-xs">
        Pick a channel from the sidebar to browse its records, or search by
        phone number above.
      </p>
      {showImportCta && (
        <button
          type="button"
          onClick={onImport}
          className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <Upload className="h-4 w-4" />
          Import your first Excel file
        </button>
      )}
    </div>
  );
}
