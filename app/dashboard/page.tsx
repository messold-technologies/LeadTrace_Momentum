"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { ChannelSidebar } from "./_components/ChannelSidebar";
import { ChannelTable } from "./_components/ChannelTable";
import { DashboardHeader } from "./_components/DashboardHeader";
import { EmptyState } from "./_components/EmptyState";
import { ImportModal } from "./_components/ImportModal";
import { SearchBar } from "./_components/SearchBar";
import { SearchResults } from "./_components/SearchResults";
import type { Channel, SearchResult, User } from "./_components/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const [searchMode, setSearchMode] = useState<"phone" | "nmi">("phone");
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        router.replace("/");
        return;
      }
      const data = (await res.json()) as { user: User | null };
      if (!data.user) {
        router.replace("/");
        return;
      }
      setUser(data.user);
      setReady(true);
    })().catch(() => router.replace("/"));
  }, [router]);

  const loadChannels = useCallback(async () => {
    const res = await fetch("/api/sales/channels", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { channels: Channel[] };
    setChannels(data.channels);
  }, []);

  useEffect(() => {
    if (ready) loadChannels();
  }, [ready, loadChannels]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/");
  }

  function handleModeChange(mode: "phone" | "nmi") {
    setSearchMode(mode);
    setSearchInput("");
    setSearchResult(null);
    setSearchError(null);
  }

  function handleSelectChannel(name: string) {
    setSelectedChannel(name);
    setSearchResult(null);
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError(null);
    setSelectedChannel(null);
    try {
      const param = searchMode === "phone" ? "phone" : "nmi";
      const res = await fetch(
        `/api/sales/search?${param}=${encodeURIComponent(searchInput.trim())}`,
        { credentials: "include" },
      );
      const data = (await res.json()) as SearchResult & { error?: string };
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed");
        return;
      }
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
      <DashboardHeader
        user={user}
        onImport={() => setShowModal(true)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <ChannelSidebar
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={handleSelectChannel}
          onImport={() => setShowModal(true)}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <SearchBar
            searchMode={searchMode}
            searchInput={searchInput}
            searching={searching}
            onModeChange={handleModeChange}
            onInputChange={setSearchInput}
            onSubmit={handleSearch}
          />

          {searchError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {searchError}
            </div>
          )}

          {searchResult && (
            <SearchResults
              result={searchResult}
              onClose={() => setSearchResult(null)}
            />
          )}

          {selectedChannel && !searchResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {selectedChannel}
                </h2>
                <span className="text-xs font-medium bg-white/80 text-indigo-600 rounded-full px-2 py-0.5">
                  {channels
                    .find((c) => c.name === selectedChannel)
                    ?.count.toLocaleString()}{" "}
                  records
                </span>
              </div>
              <ChannelTable channelName={selectedChannel} />
            </div>
          )}

          {!selectedChannel && !searchResult && !searchError && (
            <EmptyState
              showImportCta={channels.length === 0}
              onImport={() => setShowModal(true)}
            />
          )}
        </main>
      </div>

      {showModal && (
        <ImportModal
          onClose={() => setShowModal(false)}
          onImported={() => loadChannels()}
        />
      )}
    </div>
  );
}
