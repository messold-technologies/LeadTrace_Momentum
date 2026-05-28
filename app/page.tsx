import { AuthCard } from "./_components/AuthCard";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 flex items-center justify-center p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_600px_at_15%_10%,rgba(99,102,241,0.07),transparent_65%),radial-gradient(700px_500px_at_85%_90%,rgba(139,92,246,0.06),transparent_65%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] bg-size-[28px_28px]"
        aria-hidden="true"
      />
      <div className="relative">
        <AuthCard />
      </div>
    </div>
  );
}
