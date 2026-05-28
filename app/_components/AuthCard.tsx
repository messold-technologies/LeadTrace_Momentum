"use client";

import { useRouter } from "next/navigation";
import { Eye , EyeOff , Megaphone } from 'lucide-react';
import { type SyntheticEvent, useMemo, useState } from "react";

type AuthMode = "signup" | "login";

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const title = useMemo(() => (mode === "login" ? "Welcome back" : "Create account"), [mode]);

  const submitLabel = useMemo(() => {
    if (loading) return "Please wait...";
    return mode === "login" ? "Login" : "Sign up";
  }, [loading, mode]);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = { email, password };

      if (mode === "signup") {
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const registerData = (await registerRes.json()) as { error?: string };
        if (!registerRes.ok) {
          setMessage(registerData.error || "Registration failed");
          return;
        }

        // Move to login flow (JWT/cookie happens ONLY in login).
        setMode("login");
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const loginData = (await loginRes.json()) as { error?: string };
      if (!loginRes.ok) {
        setMessage(loginData.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/80 border border-slate-200">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black">
          <Megaphone className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-semibold tracking-[0.22em] text-black/60">
              LEAD TRACE
            </div>
         
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-black">{title}</h1>
          <p className="mt-1 text-sm text-black/60">
            Continue with your email and password.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-black/80" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
          />
        </div>

        <div>
       
            <label className="text-sm font-medium text-black/80" htmlFor="auth-password">
              Password
            </label>
         
        

          <div className="flex items-center justify-between relative">
            <input
              id="auth-password"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              disabled={loading}
              required
            />
             <button
              type="button"
              className="text-xs font-medium text-black/60 hover:text-black absolute right-4 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff /> : <Eye />}
           </button>
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <button
          className="w-full rounded-xl bg-indigo-600 text-white py-3 font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          disabled={loading}
          type="submit"
        >
          {submitLabel}
        </button>
      </form>

      <div className="mt-5 text-sm text-black/70">
        {mode === "login" ? (
          <button
            type="button"
            className="underline underline-offset-4 decoration-black/40 hover:decoration-black"
            onClick={() => setMode("signup")}
            disabled={loading}
          >
            Don&apos;t have an account? Register
          </button>
        ) : (
          <button
            type="button"
            className="underline underline-offset-4 decoration-black/40 hover:decoration-black"
            onClick={() => setMode("login")}
            disabled={loading}
          >
            Already have an account? Login
          </button>
        )}
      </div>
    </div>
  );
}

