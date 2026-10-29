"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "signup";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/60 focus:bg-white/[0.06]";

const labelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "signup" ? { name } : {}),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      router.push("/editor");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
        {(["login", "signup"] as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              mode === value ? "bg-white text-slate-950" : "text-white/50 hover:text-white/80"
            }`}
          >
            {value === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-white">
        {mode === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1.5 text-sm text-white/40">
        {mode === "login"
          ? "Sign in to track your monthly renders."
          : "Free plan includes three renders per month."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
            placeholder="At least 8 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-3 text-xs leading-5 text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Please wait…
            </>
          ) : mode === "login" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-4 text-[11px] leading-5 text-white/25">
        Accounts require a configured MongoDB database. Guest renders work without an account.
      </p>
    </div>
  );
}
