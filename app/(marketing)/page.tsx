import Link from "next/link";
import {
  STYLE_ACCENTS,
  STYLE_DESCRIPTIONS,
  STYLE_IDS,
  STYLE_LABELS,
} from "@/remotion/types";

const steps = [
  {
    number: "01",
    title: "Add your images",
    body: "Drop in 1 to 10 stills. They stay in your browser until you press Generate.",
  },
  {
    number: "02",
    title: "Write and style",
    body: "Add a headline, subtitle, CTA, and brand name. Pick a look, color, font, and format.",
  },
  {
    number: "03",
    title: "Generate and download",
    body: "The server renders an MP4. Download it instantly. Your files are deleted right after.",
  },
];

const facts = [
  { label: "Languages", value: "Bangla + English" },
  { label: "Formats", value: "9:16 · 1:1 · 16:9" },
  { label: "Styles", value: "5 motion systems" },
  { label: "Storage", value: "Deleted after download" },
];

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />
        <div className="absolute right-[-12rem] top-[24rem] h-[28rem] w-[28rem] rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute bottom-[-14rem] left-[-10rem] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 text-sm font-black text-white shadow-lg shadow-violet-500/30">
            M
          </span>
          <span className="text-lg font-semibold tracking-tight">Motionly</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/60">
          <a href="#styles" className="hidden transition hover:text-white sm:block">
            Styles
          </a>
          <Link href="/login" className="hidden transition hover:text-white sm:block">
            Sign in
          </Link>
          <Link
            href="/editor"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-100"
          >
            Open editor
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium tracking-wide text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Browser preview · Server render · Instant download
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Turn stills into
              <span className="block bg-gradient-to-r from-violet-300 via-white to-amber-200 bg-clip-text text-transparent">
                motion, in minutes.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/55">
              Motionly is a motion graphics video generator for social promos, product launches, and
              brand stories. Upload images, write your copy, preview live, and export an MP4.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/editor"
                className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 transition hover:brightness-110"
              >
                Start creating
              </Link>
              <a
                href="#styles"
                className="rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Explore styles
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-4 border-t border-white/10 pt-6 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/35">{fact.label}</div>
                  <div className="mt-1 text-sm font-medium text-white/80">{fact.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-violet-500/20 via-transparent to-amber-300/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.4rem] border border-white/15 bg-[#0b0b11] p-3 shadow-2xl shadow-black/50">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[1.9rem] bg-[#11111a]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,#6d4aff_0%,transparent_46%),radial-gradient(circle_at_82%_78%,#ffb37a_0%,transparent_40%),linear-gradient(160deg,#171129_0%,#08080d_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_26%,rgba(0,0,0,0.32)_56%,rgba(0,0,0,0.82)_100%)]" />
                <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                    Live preview
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-medium text-white/60">
                    9:16
                  </span>
                </div>

                <div className="absolute left-5 right-5 top-[38%]">
                  <div className="mb-3 h-1.5 w-16 rounded-full bg-violet-400" />
                  <div className="text-[2.7rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white">
                    Make it
                    <span className="block text-violet-300">move.</span>
                  </div>
                  <div className="mt-4 max-w-[16rem] text-sm leading-6 text-white/60">
                    A new collection built for the way you share.
                  </div>
                </div>

                <div className="absolute bottom-6 left-5 right-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white px-4 py-2.5 text-xs font-bold text-slate-950">
                      Shop the drop
                    </span>
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-6 rounded-full bg-white" />
                      <span className="h-1.5 w-6 rounded-full bg-white/25" />
                      <span className="h-1.5 w-6 rounded-full bg-white/25" />
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/40">
                    <span>Motionly Studio</span>
                    <span>00:08</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-4 rounded-2xl border border-white/10 bg-[#121218]/95 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Render status</div>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium text-white/85">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                MP4 ready to download
              </div>
            </div>
          </div>
        </section>

        <section id="styles" className="border-t border-white/10 bg-white/[0.015] py-24">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
                Five motion systems
              </div>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-white">
                One editor. Distinct visual voices.
              </h2>
              <p className="mt-4 text-base leading-7 text-white/50">
                Each style is a purpose-built Remotion composition. Switch between them without
                changing your content.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {STYLE_IDS.map((styleId, index) => (
                <div
                  key={styleId}
                  className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05] ${
                    index === 0 ? "lg:col-span-2" : ""
                  }`}
                >
                  <div
                    className="absolute right-0 top-0 h-32 w-32 rounded-full opacity-20 blur-3xl transition group-hover:opacity-35"
                    style={{ backgroundColor: STYLE_ACCENTS[styleId] }}
                  />
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STYLE_ACCENTS[styleId] }}
                    />
                    <h3 className="text-lg font-semibold text-white">{STYLE_LABELS[styleId]}</h3>
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/50">
                    {STYLE_DESCRIPTIONS[styleId]}
                  </p>
                  <div className="mt-8 flex items-end gap-1.5">
                    {[38, 62, 46, 78, 54, 88, 66].map((height, barIndex) => (
                      <span
                        key={barIndex}
                        className="w-2 rounded-full bg-white/10"
                        style={{
                          height: `${height * 0.5}px`,
                          backgroundColor: barIndex > 3 ? STYLE_ACCENTS[styleId] : undefined,
                          opacity: barIndex > 3 ? 0.5 : 1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                  How it works
                </div>
                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-white">
                  From upload to export, without a timeline.
                </h2>
                <p className="mt-4 text-base leading-7 text-white/50">
                  Motionly keeps the flow short. Preview everything in the browser, then render only
                  when you are ready.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {steps.map((step) => (
                  <div key={step.number} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="text-xs font-semibold tracking-[0.2em] text-white/30">{step.number}</div>
                    <h3 className="mt-6 text-base font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/45">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/15 via-white/[0.03] to-amber-300/10 px-8 py-14 text-center sm:px-14">
              <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-violet-500/25 blur-3xl" />
              <h2 className="relative text-4xl font-semibold tracking-[-0.03em] text-white">
                Ready to make your first motion piece?
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-base leading-7 text-white/55">
                Free accounts get three renders per month. No permanent video storage, no clutter.
              </p>
              <Link
                href="/editor"
                className="relative mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100"
              >
                Open the editor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/35 sm:flex-row">
          <span>Motionly — motion graphics from stills.</span>
          <div className="flex items-center gap-6">
            <Link href="/editor" className="transition hover:text-white/70">
              Editor
            </Link>
            <Link href="/login" className="transition hover:text-white/70">
              Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
