import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Account — Motionly",
  description: "Sign in or create a Motionly account.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-10 sm:px-6">
      <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl shadow-black/30 lg:grid-cols-[1fr_0.9fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-500/20 via-transparent to-amber-300/10 p-10 lg:flex">
          <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <Link href="/" className="relative flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 text-sm font-black text-white">
              M
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">Motionly</span>
          </Link>
          <div className="relative">
            <h2 className="max-w-sm text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-white">
              Your next motion piece is three images away.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/50">
              Free accounts include three renders per month. Videos are temporary and removed from the
              server as soon as you download them.
            </p>
          </div>
          <div className="relative flex items-center gap-6 text-[11px] uppercase tracking-[0.16em] text-white/35">
            <span>Bangla + English</span>
            <span>9:16 · 1:1 · 16:9</span>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500 text-xs font-black text-white">
                M
              </span>
              <span className="text-base font-semibold text-white">Motionly</span>
            </Link>
            <Link href="/editor" className="text-xs text-white/45 transition hover:text-white">
              Back to editor
            </Link>
          </div>
          <LoginForm />
          <div className="mt-6 text-center text-xs text-white/30">
            <Link href="/editor" className="transition hover:text-white/60">
              Continue without an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
