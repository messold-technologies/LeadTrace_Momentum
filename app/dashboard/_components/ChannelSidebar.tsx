"use client";

import { Layers } from "lucide-react";
import type { Channel } from "./types";
import { cls } from "./utils";

type Props = Readonly<{
  channels: Channel[];
  selectedChannel: string | null;
  onSelectChannel: (name: string) => void;
  onImport: () => void;
}>;

export function ChannelSidebar({
  channels,
  selectedChannel,
  onSelectChannel,
  onImport,
}: Props) {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Layers className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Channels
        </span>
        {channels.length > 0 && (
          <span className="ml-auto text-xs text-slate-400">
            {channels.length}
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        {channels.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-slate-400">No data imported yet.</p>
            <button
              type="button"
              onClick={onImport}
              className="mt-2 text-xs text-indigo-600 hover:underline font-medium"
            >
              Import a file
            </button>
          </div>
        ) : (
          channels.map((ch) => (
            <button
              key={ch.name}
              type="button"
              onClick={() => onSelectChannel(ch.name)}
              className={cls(
                "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                selectedChannel === ch.name
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <span className="text-sm truncate font-medium">{ch.name}</span>
              <span
                className={cls(
                  "text-xs rounded-full px-1.5 py-0.5 font-medium shrink-0",
                  selectedChannel === ch.name
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-slate-400 bg-slate-100",
                )}
              >
                {ch.count.toLocaleString()}
              </span>
            </button>
          ))
        )}
      </nav>
    </aside>
  );
}
