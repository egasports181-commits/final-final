"use client";

import { useState, type FormEvent } from "react";
import { Logo } from "@/components/site/Logo";

export function LoginForm({ dbOk, usingDefault }: { dbOk: boolean; usingDefault: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Login failed.");
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="brand-gradient grain relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-4vw] select-none text-center f-display text-[26vw] font-medium leading-none tracking-[-0.06em] text-white/10">
        ADMIN
      </div>
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm rounded-[28px] bg-white p-8 shadow-2xl">
        <Logo name="Upflit" height={34} variant="brand" />
        <h1 className="f-heading mt-6 text-2xl font-semibold tracking-tight text-[#111]">Admin login</h1>
        <p className="mt-1 text-sm text-[#7a746c]">Sign in to manage your website.</p>
        {!dbOk && (
          <p className="mt-4 rounded-xl bg-[#fef2f2] p-3 text-xs text-[#9b1c1c]">
            Database is not reachable. Check <code>DATABASE_URL</code> in your <code>.env</code> file and make sure PostgreSQL is running.
          </p>
        )}
        <div className="mt-6 grid gap-4">
          <label htmlFor="email">
            <span className="a-label">Email</span>
            <input 
              id="email"
              name="email"
              className="a-input" 
              type="email" 
              autoComplete="username" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </label>
          <label htmlFor="password">
            <span className="a-label">Password</span>
            <input 
              id="password"
              name="password"
              className="a-input" 
              type="password" 
              autoComplete="current-password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </label>
          {error && <p className="rounded-xl bg-[#fef2f2] p-3 text-sm text-[#9b1c1c]" role="alert">{error}</p>}
          <button className="a-btn a-btn-primary justify-center py-3" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </div>
        {usingDefault && (
          <p className="mt-5 rounded-xl bg-[#f7f4ef] p-3 text-[0.72rem] leading-relaxed text-[#7a746c]">
            First run: no <code>ADMIN_PASSWORD</code> configured. Default login is <strong>admin@upflit.com</strong> / <strong>upflit-admin</strong>. Change it in Account &amp; Security after logging in.
          </p>
        )}
        <a href="/" className="mt-5 block text-center text-xs text-[#9a948c] hover:text-[#111]">← Back to website</a>
      </form>
    </div>
  );
}