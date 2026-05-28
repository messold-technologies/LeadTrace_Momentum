import { AuthCard } from "./_components/AuthCard";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070A12] flex items-center justify-center p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_700px_at_20%_10%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(800px_600px_at_85%_5%,rgba(217,70,239,0.30),transparent_60%),radial-gradient(900px_700px_at_50%_100%,rgba(59,130,246,0.18),transparent_65%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-size-[72px_72px]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/10 to-black/35" />

      <div className="relative">
        <AuthCard />
      </div>
    </div>
  );
}
