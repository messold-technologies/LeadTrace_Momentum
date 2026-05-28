"use client";

import { useEffect, useState } from "react";
import { Phone, X, ChevronRight } from "lucide-react";
import type { SearchResult } from "./types";
import { cls, formatDate } from "./utils";

type Props = Readonly<{
  result: SearchResult;
  onClose: () => void;
}>;

export function SearchResults({ result, onClose }: Props) {
  // Empty set = all channels open by default; add name to close one.
  const [closedChannels, setClosedChannels] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setClosedChannels(new Set());
  }, [result.query, result.type]);

  function toggleChannel(channel: string) {
    setClosedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channel)) next.delete(channel);
      else next.add(channel);
      return next;
    });
  }

  if (!result.found) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <Phone className="mx-auto h-8 w-8 text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">
          No sales records found for{" "}
          <span className="font-mono font-medium text-slate-700">
            {result.query}
          </span>
        </p>
      </div>
    );
  }

  const label = result.type === "nmi" ? "NMI / MIRN" : "Phone";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 mr-1">
            {label}
          </span>
          <span className="font-mono font-medium text-slate-900">
            {result.query}
          </span>
          {" — found in "}
          <span className="font-medium text-indigo-600">
            {result.channels.length}
          </span>{" "}
          {result.channels.length === 1 ? "channel" : "channels"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {result.channels.map((ch) => {
        const isOpen = !closedChannels.has(ch.channel);

        return (
        <div
          key={ch.channel}
          className="rounded-xl border border-slate-200 bg-white overflow-hidden"
        >
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            onClick={() => toggleChannel(ch.channel)}
          >
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
              <span className="font-medium text-slate-800 text-sm">
                {ch.channel}
              </span>
              <span className="rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium px-2 py-0.5">
                {ch.count} {ch.count === 1 ? "sale" : "sales"}
              </span>
            </div>
            <ChevronRight
              className={cls(
                "h-4 w-4 text-slate-400 transition-transform",
                isOpen && "rotate-90",
              )}
            />
          </button>

          {isOpen && (
            <div className="border-t border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Phone
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      NMI / MIRN
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Sale Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Center Name
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ch.records.map((r) => (
                    <tr
                      key={`${r.phone}-${r.sale_date ?? ""}-${r.nmi ?? ""}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-700">
                        {r.phone}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                        {r.nmi ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {formatDate(r.sale_date)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {r.center_name ?? (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
