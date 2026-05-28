"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ChannelPage } from "./types";
import { cls, formatDate } from "./utils";

type Props = Readonly<{
  channelName: string;
}>;

export function ChannelTable({ channelName }: Props) {
  const [data, setData] = useState<ChannelPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/sales/channel/${encodeURIComponent(channelName)}?page=${p}&limit=50`,
          { credentials: "include" },
        );
        const d = (await res.json()) as ChannelPage;
        setData(d);
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [channelName],
  );

  useEffect(() => {
    load(1);
  }, [load]);

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, data.total)} of{" "}
          <span className="font-medium text-slate-700">
            {data.total.toLocaleString()}
          </span>{" "}
          records
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => load(page - 1)}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="text-xs text-slate-500 px-1">
            {page} / {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => load(page + 1)}
            disabled={page >= data.totalPages || loading}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white border shadow-sm border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                NMI / MIRN
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Sale Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Center Name
              </th>
            </tr>
          </thead>
          <tbody
            className={cls("divide-y divide-slate-100", loading && "opacity-50")}
          >
            {data.records.map((r) => (
              <tr
                key={`${r.phone}-${r.sale_date ?? ""}-${r.nmi ?? ""}`}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-slate-700 text-xs">
                  {r.phone}
                </td>
                <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                  {r.nmi ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(r.sale_date)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.center_name ?? (
                    <span className="text-slate-300 italic">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
