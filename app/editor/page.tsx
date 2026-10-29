import type { Metadata } from "next";
import { Suspense } from "react";
import EditorClient from "./EditorClient";

export const metadata: Metadata = {
  title: "Editor — Motionly",
  description: "Upload images, write your copy, preview live, and generate an MP4.",
};

function EditorFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-xl bg-white/10" />
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-56 animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
        <div className="space-y-5">
          <div className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />
        </div>
        <div className="order-first lg:order-none">
          <div className="h-[34rem] animate-pulse rounded-3xl border border-white/10 bg-white/[0.025]" />
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<EditorFallback />}>
      <EditorClient />
    </Suspense>
  );
}
