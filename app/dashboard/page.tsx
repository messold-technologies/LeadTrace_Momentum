"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MeResponse =
  | { user: { id: string; email: string; name?: string | null } }
  | { user: null };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        router.replace("/");
        return;
      }
      const data = (await res.json()) as MeResponse;
      if (!("user" in data) || !data.user) {
        router.replace("/");
        return;
      }
      setMe(data);
    })().catch(() => router.replace("/"));
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070A12] p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_700px_at_20%_10%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(800px_600px_at_85%_5%,rgba(217,70,239,0.30),transparent_60%),radial-gradient(900px_700px_at_50%_100%,rgba(59,130,246,0.18),transparent_65%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-size-[72px_72px]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/10 to-black/35" />

      <div className="relative mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-8 shadow-xl backdrop-blur">
          <div className="text-xs font-semibold tracking-wider text-white/70">
            LEAD TRACE
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {me?.user ? `Signed in as ${me.user.email}` : "Loading..."}
          </p>
        </div>
      </div>
    </div>
  );
}

