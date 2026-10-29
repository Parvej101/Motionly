"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { io } from "next/cache";
import { Player } from "@remotion/player";
import { STYLE_COMPONENTS } from "@/remotion/compositions";
import {
  ASPECT_DIMENSIONS,
  FPS,
  MAX_DURATION_SECONDS,
  MIN_DURATION_SECONDS,
  STYLE_ACCENTS,
  STYLE_DESCRIPTIONS,
  STYLE_IDS,
  STYLE_LABELS,
  framesForSeconds,
  type AspectRatio,
  type AudioConfig,
  type FontFamily,
  type PresenterConfig,
  type StyleId,
  type TextPosition,
  type TextAnimation,
  type VideoProps,
} from "@/remotion/types";
import { AudioVoiceRecorder } from "./components/AudioVoiceRecorder";
import { PresenterPipRecorder } from "./components/PresenterPipRecorder";

type PreviewImage = {
  id: string;
  file: File;
  url: string;
};

type Account = {
  id: string;
  email: string;
  name?: string;
  plan: "free" | "pro";
  rendersUsedThisMonth: number;
  monthKey: string;
};

type MeState = {
  user: Account | null;
  remaining?: number;
  limit?: number;
};

type JobStatus = "idle" | "queued" | "rendering" | "done" | "failed" | "downloaded";

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-violet-400/60 focus:bg-white/[0.06]";

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40";

const palette = ["#7c5cff", "#ff6b3d", "#18b98a", "#ff4d8d", "#27a7ff", "#d7ff3f"];

const fontOptions: { id: FontFamily; label: string }[] = [
  { id: "NotoSansBengali", label: "Noto Sans Bengali" },
  { id: "HindSiliguri", label: "Hind Siliguri" },
  { id: "Inter", label: "Inter" },
];

const ratioOptions: {
  id: AspectRatio;
  label: string;
  badge: string;
  desc: string;
  shape: string;
  resolution: string;
}[] = [
  { id: "9:16", label: "9:16 Vertical", badge: "Reels / TikTok", desc: "Shorts, Stories & Mobile", shape: "h-8 w-5", resolution: "1080 × 1920" },
  { id: "1:1", label: "1:1 Square", badge: "Feed Post", desc: "Instagram & Facebook Post", shape: "h-7 w-7", resolution: "1080 × 1080" },
  { id: "16:9", label: "16:9 Landscape", badge: "YouTube", desc: "Desktop, Web & TV", shape: "h-5 w-8", resolution: "1920 × 1080" },
];

const positionOptions: {
  id: TextPosition;
  label: string;
  desc: string;
  icon: string;
}[] = [
  { id: "top-left", label: "Top Left", desc: "Left corner", icon: "↖" },
  { id: "top", label: "Top Center", desc: "Top banner", icon: "↑" },
  { id: "top-right", label: "Top Right", desc: "Right corner", icon: "↗" },
  { id: "center", label: "Center", desc: "Reels viral focus", icon: "⏺" },
  { id: "bottom-left", label: "Bottom Left", desc: "Left lower corner", icon: "↙" },
  { id: "bottom", label: "Bottom Center", desc: "Caption area", icon: "↓" },
  { id: "bottom-right", label: "Bottom Right", desc: "Right lower corner", icon: "↘" },
];

const motionOptions: {
  id: TextAnimation;
  label: string;
  desc: string;
  emoji: string;
}[] = [
  { id: "typewriter", label: "Typewriter", desc: "Live typing effect", emoji: "⌨️" },
  { id: "pop", label: "Word Punch", desc: "High energy punch", emoji: "💥" },
  { id: "highlight", label: "Karaoke Glow", desc: "Word-by-word glow", emoji: "✨" },
  { id: "slide", label: "Masked Slide", desc: "Smooth modern slide", emoji: "🚀" },
  { id: "fade", label: "Cinematic", desc: "Soft elegant fade", emoji: "🎬" },
];

const Panel = ({
  title,
  hint,
  step,
  children,
}: {
  title: string;
  hint?: string;
  step?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 shadow-lg shadow-black/10 transition-all hover:border-white/15">
    <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/5 pb-3">
      <div className="flex items-center gap-2.5">
        {step && (
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/20 text-[10px] font-bold text-violet-300">
            {step}
          </span>
        )}
        <h2 className="text-sm font-semibold tracking-tight text-white/90">{title}</h2>
      </div>
      {hint ? <span className="text-xs text-white/35">{hint}</span> : null}
    </div>
    {children}
  </section>
);

export default function EditorClient() {
  use(io());

  const [images, setImages] = useState<PreviewImage[]>([]);
  const imagesRef = useRef<PreviewImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [headline, setHeadline] = useState("Your story starts here");
  const [subtitle, setSubtitle] = useState("A short line that sets the mood.");
  const [cta, setCta] = useState("Learn more");
  const [brandName, setBrandName] = useState("Your brand");
  const [brandColor, setBrandColor] = useState("#7c5cff");
  const [colorText, setColorText] = useState("#7c5cff");
  const [fontFamily, setFontFamily] = useState<FontFamily>("NotoSansBengali");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [duration, setDuration] = useState(8);
  const [styleId, setStyleId] = useState<StyleId>("kinetic");
  const [textPosition, setTextPosition] = useState<TextPosition>("center");
  const [textAnimation, setTextAnimation] = useState<TextAnimation>("typewriter");
  const [slideTexts, setSlideTexts] = useState<
    Array<{
      headline: string;
      subtitle: string;
      textPosition?: TextPosition;
      textAnimation?: TextAnimation;
    }>
  >([]);
  const [enablePerSlideText, setEnablePerSlideText] = useState(false);
  const [presenterConfig, setPresenterConfig] = useState<PresenterConfig | undefined>(undefined);
  const [audioConfig, setAudioConfig] = useState<AudioConfig | undefined>(undefined);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const [me, setMe] = useState<MeState | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobError, setJobError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.url);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: MeState | null) => {
        if (active) {
          setMe(data ?? { user: null });
          setMeLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setMe({ user: null });
          setMeLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const poll = async () => {
      try {
        const response = await fetch(`/api/render/${jobId}/status`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Status request failed");
        }
        const data = (await response.json()) as { status: JobStatus; error?: string };
        if (cancelled) {
          return;
        }

        setJobStatus(data.status);

        if (data.status === "done") {
          setDownloadUrl(`/api/render/${jobId}/download`);
          setJobError(null);
          stop();
        } else if (data.status === "failed") {
          setJobError(data.error || "The render failed. Try again.");
          stop();
        } else if (data.status === "downloaded") {
          setJobStatus("downloaded");
          stop();
        }
      } catch {
        if (!cancelled) {
          setJobError("Could not reach the render status. Retrying…");
        }
      }
    };

    void poll();
    timer = setInterval(poll, 1600);
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setJobError("This render is taking longer than expected. Check again shortly.");
        stop();
      }
    }, 8 * 60 * 1000);

    return () => {
      cancelled = true;
      stop();
      clearTimeout(timeout);
    };
  }, [jobId]);

  const dimensions = ASPECT_DIMENSIONS[aspectRatio];

  const effectiveSlideTexts = useMemo(() => {
    return images.map((_, idx) => ({
      headline: slideTexts[idx]?.headline ?? "",
      subtitle: slideTexts[idx]?.subtitle ?? "",
      textPosition: slideTexts[idx]?.textPosition,
      textAnimation: slideTexts[idx]?.textAnimation,
    }));
  }, [images, slideTexts]);

  const previewProps = useMemo<VideoProps>(
    () => ({
      images: images.map((image) => image.url),
      headline: enablePerSlideText ? "" : (headline || "Your story starts here"),
      subtitle: enablePerSlideText ? undefined : (subtitle || undefined),
      cta: cta || undefined,
      brandName: brandName || undefined,
      brandColor,
      fontFamily,
      aspectRatio,
      durationInSeconds: duration,
      watermark: !me?.user || me.user.plan === "free",
      styleId,
      textPosition,
      textAnimation,
      slideTexts: enablePerSlideText ? effectiveSlideTexts : undefined,
      presenter: presenterConfig,
      audio: audioConfig,
    }),
    [
      images,
      headline,
      subtitle,
      cta,
      brandName,
      brandColor,
      fontFamily,
      aspectRatio,
      duration,
      me,
      styleId,
      textPosition,
      textAnimation,
      enablePerSlideText,
      effectiveSlideTexts,
      presenterConfig,
      audioConfig,
    ],
  );

  const addFiles = (incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    const next = [...images];
    const messages: string[] = [];

    for (const file of files) {
      if (next.length >= MAX_IMAGES) {
        messages.push(`You can add up to ${MAX_IMAGES} images.`);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        messages.push("Only JPEG, PNG, and WebP images are supported.");
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        messages.push("Each image must be 5 MB or smaller.");
        continue;
      }
      next.push({
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      });
    }

    setImages(next);
    setError(messages[0] ?? null);
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((image) => image.id !== id);
    });
  };

  const applyColor = (value: string) => {
    setBrandColor(value);
    setColorText(value);
  };

  const updateColorText = (value: string) => {
    setColorText(value);
    const normalized = value.startsWith("#") ? value : `#${value}`;
    if (/^#[0-9a-f]{6}$/i.test(normalized)) {
      setBrandColor(normalized.toLowerCase());
    }
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe({ user: null });
  };

  const generate = async () => {
    if (images.length === 0) {
      setError("Add at least one image before generating.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setLimitReached(false);
    setJobError(null);
    setDownloadUrl(null);
    setDownloaded(false);
    setJobStatus("queued");
    setJobId(null);

    const formData = new FormData();
    formData.append(
      "props",
      JSON.stringify({
        headline: enablePerSlideText ? "" : headline,
        subtitle: enablePerSlideText ? undefined : subtitle,
        cta,
        brandName,
        brandColor,
        fontFamily,
        aspectRatio,
        durationInSeconds: duration,
        styleId,
        textPosition,
        textAnimation,
        slideTexts: enablePerSlideText ? effectiveSlideTexts : undefined,
        presenter: presenterConfig,
        audio: audioConfig,
      }),
    );

    for (const image of images) {
      formData.append("images", image.file, image.file.name);
    }

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        jobId?: string;
        limitReached?: boolean;
      };

      if (!response.ok || !data.jobId) {
        setError(data.error || "Could not start the render.");
        setLimitReached(Boolean(data.limitReached));
        setJobStatus("idle");
        return;
      }

      setJobId(data.jobId);
      setJobStatus("queued");
      setMe((current) => {
        if (!current?.user) {
          return current;
        }
        const used = current.user.rendersUsedThisMonth + 1;
        return {
          ...current,
          user: {
            ...current.user,
            rendersUsedThisMonth: used,
          },
          remaining: Math.max(0, (current.limit ?? 3) - used),
        };
      });
    } catch {
      setError("Network error. Check your connection and try again.");
      setJobStatus("idle");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || jobStatus === "queued" || jobStatus === "rendering";
  const StyleComponent = STYLE_COMPONENTS[styleId];
  const remaining = me?.remaining;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 text-sm font-black text-white shadow-lg shadow-violet-500/30">
            M
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white">Motionly editor</h1>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                Live preview
              </span>
            </div>
            <p className="text-xs text-white/35">Nothing uploads until you press Generate.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" className="hidden text-sm text-white/45 transition hover:text-white sm:block">
            Home
          </Link>
          {meLoading ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
          ) : me?.user ? (
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-4 pr-1.5">
              <div className="hidden text-right sm:block">
                <div className="max-w-[160px] truncate text-xs font-medium text-white/80">{me.user.email}</div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                  {me.user.plan === "pro" ? "Pro plan" : `${remaining ?? 0} of ${me.limit ?? 3} left`}
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/15 hover:text-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
        <div className="space-y-5">
          {/* STEP 1: Aspect Ratio & Canvas Format */}
          <Panel title="Video Canvas & Aspect Ratio" hint="Target platform & video orientation" step="01">
            <div className="space-y-4">
              <div>
                <span className={`mb-2 block ${labelClass}`}>Select Orientation</span>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {ratioOptions.map((option) => {
                    const selected = aspectRatio === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAspectRatio(option.id)}
                        className={`group relative flex flex-col items-center rounded-2xl border p-3.5 text-center transition-all ${
                          selected
                            ? "border-violet-400 bg-violet-500/15 text-white shadow-md shadow-violet-500/10 ring-1 ring-violet-400/50"
                            : "border-white/10 bg-white/[0.025] text-white/60 hover:border-white/20 hover:bg-white/[0.045] hover:text-white"
                        }`}
                      >
                        <div className="flex h-10 w-full items-center justify-center">
                          <span
                            className={`rounded-md border-2 transition-all ${option.shape} ${
                              selected ? "border-violet-300 bg-violet-400/30 scale-105" : "border-white/25 bg-white/5"
                            }`}
                          />
                        </div>
                        <div className="mt-2 text-xs font-bold text-white">{option.label}</div>
                        <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-violet-200">
                          {option.badge}
                        </span>
                        <span className="mt-0.5 text-[10px] text-white/40">{option.resolution}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Video Duration Slider */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label htmlFor="duration" className={labelClass}>Total Duration</label>
                    <span className="text-[10px] text-white/30">(Fast pacing or detailed)</span>
                  </div>
                  <span className="rounded-md border border-violet-400/30 bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-violet-200">
                    {duration} Seconds
                  </span>
                </div>
                <input
                  id="duration"
                  type="range"
                  min={MIN_DURATION_SECONDS}
                  max={MAX_DURATION_SECONDS}
                  step={1}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10"
                  style={{ accentColor: brandColor }}
                />
                <div className="mt-1.5 flex justify-between text-[10px] text-white/30">
                  <span>{MIN_DURATION_SECONDS}s (Quick Reel)</span>
                  <span>15s (Standard)</span>
                  <span>{MAX_DURATION_SECONDS}s (Maximum)</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Images & Visuals" hint={`${images.length} / ${MAX_IMAGES}`} step="02">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                if (event.dataTransfer.files?.length) {
                  addFiles(event.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition ${
                dragActive
                  ? "border-violet-400/70 bg-violet-400/10"
                  : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
              }`}
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/60 transition group-hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 16V4m0 0L7 9m5-5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div className="mt-4 text-sm font-medium text-white/80">Drop images here or click to browse</div>
              <div className="mt-1 text-xs text-white/35">JPEG, PNG, or WebP · up to 5 MB each</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.length) {
                    addFiles(event.target.files);
                  }
                  event.target.value = "";
                }}
              />
            </div>

            {images.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {images.map((image, index) => (
                  <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white/80 opacity-0 transition hover:bg-rose-500 hover:text-white group-hover:opacity-100"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel title="Words & Messaging" hint="Bangla and English supported" step="03">
            <div className="space-y-4">
              {enablePerSlideText ? (
                <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-3.5 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-violet-300">
                    <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                    Scene-by-scene Text Active
                  </div>
                  <p className="mt-1 text-white/60">
                    Primary headline and subtitle are hidden. Text is configured individually for each scene in &quot;Text Motion &amp; Placement&quot; below.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="headline" className={labelClass}>Headline</label>
                      <span className={`text-[10px] ${headline.length > 80 ? "text-rose-300" : "text-white/25"}`}>
                        {headline.length}/80
                      </span>
                    </div>
                    <input
                      id="headline"
                      value={headline}
                      maxLength={80}
                      onChange={(event) => setHeadline(event.target.value)}
                      className={fieldClass}
                      placeholder="Your story starts here"
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="subtitle" className={labelClass}>Subtitle</label>
                      <span className="text-[10px] text-white/25">{subtitle.length}/180</span>
                    </div>
                    <textarea
                      id="subtitle"
                      value={subtitle}
                      maxLength={180}
                      onChange={(event) => setSubtitle(event.target.value)}
                      className={`${fieldClass} min-h-20 resize-y`}
                      placeholder="A short supporting line"
                    />
                  </div>
                </>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cta" className={`mb-1.5 block ${labelClass}`}>Call to action</label>
                  <input
                    id="cta"
                    value={cta}
                    maxLength={40}
                    onChange={(event) => setCta(event.target.value)}
                    className={fieldClass}
                    placeholder="Learn more"
                  />
                </div>
                <div>
                  <label htmlFor="brand" className={`mb-1.5 block ${labelClass}`}>Brand name</label>
                  <input
                    id="brand"
                    value={brandName}
                    maxLength={40}
                    onChange={(event) => setBrandName(event.target.value)}
                    className={fieldClass}
                    placeholder="Your brand"
                  />
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Text Motion & Placement" hint="Corners, center & viral animations" step="04">
            <div className="space-y-4">
              <div>
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className={labelClass}>Text Alignment & Corners</span>
                    <p className="text-[11px] text-white/40">Select which corner or area the text appears</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-200 shadow-sm shadow-violet-500/25">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Selected: {positionOptions.find((p) => p.id === textPosition)?.icon} {positionOptions.find((p) => p.id === textPosition)?.label}
                  </span>
                </div>

                {/* Visual Position Canvas Box */}
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5 shadow-inner">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Top Row: Top-Left, Top, Top-Right */}
                    {(["top-left", "top", "top-right"] as const).map((posId) => {
                      const pos = positionOptions.find((p) => p.id === posId)!;
                      const active = textPosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setTextPosition(pos.id)}
                          className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all ${
                            active
                              ? "border-2 border-violet-300 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white font-extrabold shadow-lg shadow-violet-600/40 ring-2 ring-violet-400/70 scale-[1.03] z-10"
                              : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          {active && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-black text-black shadow-md ring-2 ring-[#0c0d12]">
                              ✓
                            </span>
                          )}
                          <span className="text-lg font-bold leading-none">{pos.icon}</span>
                          <span className="mt-1 text-[11px] font-semibold">{pos.label}</span>
                        </button>
                      );
                    })}

                    {/* Middle Row: Center Focus */}
                    <div className="col-span-3 py-0.5">
                      {(() => {
                        const pos = positionOptions.find((p) => p.id === "center")!;
                        const active = textPosition === pos.id;
                        return (
                          <button
                            type="button"
                            onClick={() => setTextPosition(pos.id)}
                            className={`relative w-full flex items-center justify-center gap-2 rounded-xl p-2.5 text-center transition-all ${
                              active
                                ? "border-2 border-violet-300 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white font-extrabold shadow-lg shadow-violet-600/40 ring-2 ring-violet-400/70 scale-[1.02] z-10"
                                : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                            }`}
                          >
                            {active && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-black text-black shadow-md ring-2 ring-[#0c0d12]">
                                ✓
                              </span>
                            )}
                            <span className="text-lg font-bold leading-none">{pos.icon}</span>
                            <span className="text-xs font-bold">{pos.label}</span>
                            <span className="text-[10px] opacity-75">({pos.desc})</span>
                          </button>
                        );
                      })()}
                    </div>

                    {/* Bottom Row: Bottom-Left, Bottom, Bottom-Right */}
                    {(["bottom-left", "bottom", "bottom-right"] as const).map((posId) => {
                      const pos = positionOptions.find((p) => p.id === posId)!;
                      const active = textPosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setTextPosition(pos.id)}
                          className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all ${
                            active
                              ? "border-2 border-violet-300 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white font-extrabold shadow-lg shadow-violet-600/40 ring-2 ring-violet-400/70 scale-[1.03] z-10"
                              : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                          }`}
                        >
                          {active && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-black text-black shadow-md ring-2 ring-[#0c0d12]">
                              ✓
                            </span>
                          )}
                          <span className="text-lg font-bold leading-none">{pos.icon}</span>
                          <span className="mt-1 text-[11px] font-semibold">{pos.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className={labelClass}>Motion Style Animation</span>
                    <p className="text-[11px] text-white/40">Dynamic text entrance & kinetic pacing</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-200 shadow-sm shadow-violet-500/25">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Selected: {motionOptions.find((m) => m.id === textAnimation)?.emoji} {motionOptions.find((m) => m.id === textAnimation)?.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {motionOptions.map((anim) => {
                    const active = textAnimation === anim.id;
                    return (
                      <button
                        key={anim.id}
                        type="button"
                        onClick={() => setTextAnimation(anim.id)}
                        className={`relative rounded-xl p-2.5 text-center transition-all ${
                          active
                            ? "border-2 border-violet-300 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white font-extrabold shadow-lg shadow-violet-600/40 ring-2 ring-violet-400/70 scale-[1.03] z-10"
                            : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-black text-black shadow-md ring-2 ring-[#0c0d12]">
                            ✓
                          </span>
                        )}
                        <span className="text-base">{anim.emoji}</span>
                        <div className="mt-1 text-xs font-bold">{anim.label}</div>
                        <div className="mt-0.5 text-[10px] opacity-75">{anim.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {images.length > 1 && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white">Scene-by-scene Text</span>
                      <p className="text-[11px] text-white/40">Different headline for each uploaded image</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnablePerSlideText(!enablePerSlideText)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enablePerSlideText ? "bg-violet-600" : "bg-white/20"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          enablePerSlideText ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {enablePerSlideText && (
                    <div className="mt-3 space-y-3.5 pt-2">
                      <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-violet-200">Per-Scene Customization Mode Active</span>
                            <p className="text-[11px] text-white/50">Each image can have its own headline, corner alignment, and motion style.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSlideTexts((prev) => {
                                return images.map((_, i) => ({
                                  headline: prev[i]?.headline ?? "",
                                  subtitle: prev[i]?.subtitle ?? "",
                                  textPosition: textPosition,
                                  textAnimation: textAnimation,
                                }));
                              });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/40 bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-700/40 transition hover:bg-violet-500 hover:scale-[1.02]"
                          >
                            <span>⚡ Sync Global ({positionOptions.find((p) => p.id === textPosition)?.label}) to All Scenes</span>
                          </button>
                        </div>
                      </div>

                      {images.map((img, idx) => {
                        const curPos = slideTexts[idx]?.textPosition || textPosition;
                        const curAnim = slideTexts[idx]?.textAnimation || textAnimation;

                        return (
                          <div key={img.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3 shadow-sm">
                            <div className="flex items-center gap-3">
                              {/* Thumbnail */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={`Scene ${idx + 1}`}
                                className="h-14 w-14 rounded-lg object-cover border border-white/15 shrink-0"
                              />
                              <div className="flex-1 space-y-1.5">
                                <input
                                  value={slideTexts[idx]?.headline ?? ""}
                                  placeholder={`Scene ${idx + 1} Headline`}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSlideTexts((prev) => {
                                      const next = [...prev];
                                      while (next.length <= idx) {
                                        next.push({ headline: "", subtitle: "" });
                                      }
                                      next[idx] = { ...next[idx], headline: val };
                                      return next;
                                    });
                                  }}
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white placeholder:text-white/30 focus:border-violet-400 focus:outline-none"
                                />
                                <input
                                  value={slideTexts[idx]?.subtitle ?? ""}
                                  placeholder="Scene Subtitle (optional)"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSlideTexts((prev) => {
                                      const next = [...prev];
                                      while (next.length <= idx) {
                                        next.push({ headline: "", subtitle: "" });
                                      }
                                      next[idx] = { ...next[idx], subtitle: val };
                                      return next;
                                    });
                                  }}
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/80 placeholder:text-white/25 focus:border-violet-400 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Per-scene Position & Motion controls */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                              <div className="rounded-lg bg-black/25 p-2 border border-white/5">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">Scene {idx + 1} Position</span>
                                  <span className="inline-flex items-center gap-1 rounded-md border border-violet-400/40 bg-violet-500/25 px-2 py-0.5 text-[11px] font-bold text-violet-200 shadow-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    {positionOptions.find((p) => p.id === curPos)?.icon} {positionOptions.find((p) => p.id === curPos)?.label}
                                  </span>
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                  {positionOptions.map((p) => {
                                    const isPosActive = curPos === p.id;
                                    return (
                                      <button
                                        key={p.id}
                                        type="button"
                                        title={`${p.label} (${p.desc})`}
                                        onClick={() => {
                                          setSlideTexts((prev) => {
                                            const next = [...prev];
                                            while (next.length <= idx) {
                                              next.push({ headline: "", subtitle: "" });
                                            }
                                            next[idx] = { ...next[idx], textPosition: p.id };
                                            return next;
                                          });
                                        }}
                                        className={`relative py-1.5 text-[11px] rounded-lg border transition-all flex flex-col items-center justify-center ${
                                          isPosActive
                                            ? "border-2 border-violet-300 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white font-extrabold shadow-md shadow-violet-600/50 ring-2 ring-violet-400 scale-105 z-10"
                                            : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                                        }`}
                                      >
                                        <span className="text-xs font-bold leading-none">{p.icon}</span>
                                        {isPosActive && (
                                          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 text-[8px] font-black text-black ring-1 ring-black shadow">
                                            ✓
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="rounded-lg bg-black/25 p-2 border border-white/5">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">Scene {idx + 1} Motion</span>
                                  <span className="inline-flex items-center gap-1 rounded-md border border-violet-400/40 bg-violet-500/25 px-2 py-0.5 text-[11px] font-bold text-violet-200 shadow-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    {motionOptions.find((m) => m.id === curAnim)?.emoji} {motionOptions.find((m) => m.id === curAnim)?.label}
                                  </span>
                                </div>
                                <div className="grid grid-cols-5 gap-1">
                                  {motionOptions.map((a) => {
                                    const isAnimActive = curAnim === a.id;
                                    return (
                                      <button
                                        key={a.id}
                                        type="button"
                                        onClick={() => {
                                          setSlideTexts((prev) => {
                                            const next = [...prev];
                                            while (next.length <= idx) {
                                              next.push({ headline: "", subtitle: "" });
                                            }
                                            next[idx] = { ...next[idx], textAnimation: a.id };
                                            return next;
                                          });
                                        }}
                                        className={`relative py-1.5 text-[10px] rounded-lg border transition-all text-center ${
                                          isAnimActive
                                            ? "border-2 border-violet-300 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white font-extrabold shadow-md shadow-violet-600/50 ring-2 ring-violet-400 scale-105 z-10"
                                            : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                                        }`}
                                      >
                                        <span className="text-xs">{a.emoji}</span>
                                        <div className="font-semibold text-[10px] leading-tight mt-0.5">{a.label.split(" ")[0]}</div>
                                        {isAnimActive && (
                                          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 text-[8px] font-black text-black ring-1 ring-black shadow">
                                            ✓
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Panel>

          {/* STEP 5: Motion Style Templates */}
          <Panel title="Motion Style Template" hint="Select video theme and aesthetic" step="05">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {STYLE_IDS.map((id) => {
                const selected = id === styleId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStyleId(id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-violet-400/60 bg-violet-400/10 shadow-md shadow-violet-500/10"
                        : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.045]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STYLE_ACCENTS[id] }} />
                      <span className="text-sm font-semibold text-white">{STYLE_LABELS[id]}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/40">{STYLE_DESCRIPTIONS[id]}</p>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* STEP 6: Brand Color & Typography */}
          <Panel title="Brand & Typography" hint="Custom color palette and font" step="06">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className={`mb-2 block ${labelClass}`}>Brand color</span>
                <div className="flex items-center gap-2.5">
                  <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/15" style={{ backgroundColor: brandColor }}>
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(event) => applyColor(event.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Pick brand color"
                    />
                  </label>
                  <input
                    value={colorText}
                    onChange={(event) => updateColorText(event.target.value)}
                    onBlur={() => {
                      if (!/^#?[0-9a-f]{6}$/i.test(colorText.trim())) {
                        setColorText(brandColor);
                      }
                    }}
                    className={fieldClass}
                    aria-label="Brand color hex"
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {palette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => applyColor(color)}
                      className={`h-6 w-6 rounded-full border transition ${
                        brandColor === color ? "border-white scale-110" : "border-white/15 hover:border-white/40"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Use ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="font" className={`mb-2 block ${labelClass}`}>Font</label>
                <select
                  id="font"
                  value={fontFamily}
                  onChange={(event) => setFontFamily(event.target.value as FontFamily)}
                  className={`${fieldClass} appearance-none`}
                >
                  {fontOptions.map((font) => (
                    <option key={font.id} value={font.id} className="bg-slate-950 text-white">
                      {font.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2.5 text-xs leading-5 text-white/30">
                  Noto Sans Bengali &amp; Hind Siliguri are tuned for Bangla.
                </div>
              </div>
            </div>
          </Panel>

          {/* STEP 7: Voiceover & Sound */}
          <Panel title="Voiceover & Sound" hint="Record mic or upload track" step="07">
            <AudioVoiceRecorder audioConfig={audioConfig} onChange={setAudioConfig} videoDuration={duration} />
          </Panel>

          {/* STEP 8: Course Presenter Mode (PiP) */}
          <Panel title="Course Presenter Mode (PiP)" hint="Right bottom avatar with voice" step="08">
            <PresenterPipRecorder presenterConfig={presenterConfig} onChange={setPresenterConfig} />
          </Panel>
        </div>

        <aside className="order-first h-fit space-y-5 lg:order-none lg:sticky lg:top-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-4 shadow-xl shadow-black/20">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Live preview</span>
              </div>
              <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-medium text-white/45">
                {aspectRatio} · {duration}s · {FPS}fps
              </span>
            </div>

            <div
              className="mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black"
              style={{
                maxWidth: aspectRatio === "9:16" ? 320 : aspectRatio === "1:1" ? 410 : "100%",
                aspectRatio: `${dimensions.width} / ${dimensions.height}`,
              }}
            >
              <Player
                key={`${styleId}-${aspectRatio}`}
                component={StyleComponent}
                inputProps={previewProps}
                durationInFrames={framesForSeconds(duration)}
                fps={FPS}
                compositionWidth={dimensions.width}
                compositionHeight={dimensions.height}
                style={{ width: "100%", height: "100%" }}
                controls
                loop
                acknowledgeRemotionLicense
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-white/30">
              <span>{images.length === 0 ? "Showing the fallback backdrop" : `${images.length} image${images.length === 1 ? "" : "s"} in rotation`}</span>
              <span>{frameLabel(duration)}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/20">
            <button
              type="button"
              onClick={generate}
              disabled={busy || images.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {submitting ? "Uploading…" : "Rendering…"}
                </>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 4.5v15l14-7.5-14-7.5Z" fill="currentColor" />
                  </svg>
                  Generate MP4
                </>
              )}
            </button>

            <div className="mt-3 flex items-center justify-between text-[11px] text-white/30">
              <span>{(previewProps.watermark ?? true) ? "Free renders include a small watermark." : "Pro render — no watermark."}</span>
              <span>{images.length}/10 images</span>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-3 text-xs leading-5 text-rose-200">
                {error}
                {limitReached ? (
                  <Link href="/login" className="ml-1 font-semibold underline underline-offset-2 hover:text-white">
                    Sign in for more renders
                  </Link>
                ) : null}
              </div>
            ) : null}

            {jobStatus === "queued" ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
                <span className="mt-1 h-3 w-3 animate-pulse rounded-full bg-amber-300" />
                <div>
                  <div className="text-xs font-medium text-white/75">Queued for rendering</div>
                  <div className="mt-0.5 text-[11px] leading-5 text-white/35">We will start as soon as a render slot is free.</div>
                </div>
              </div>
            ) : null}

            {jobStatus === "rendering" ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
                <span className="mt-1 h-3 w-3 animate-pulse rounded-full bg-violet-300" />
                <div>
                  <div className="text-xs font-medium text-white/75">Rendering your video</div>
                  <div className="mt-0.5 text-[11px] leading-5 text-white/35">This usually takes 15–60 seconds. You can keep editing the preview.</div>
                </div>
              </div>
            ) : null}

            {jobStatus === "done" && downloadUrl ? (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Your MP4 is ready
                </div>
                <a
                  href={downloadUrl}
                  onClick={() => {
                    window.setTimeout(() => {
                      setDownloaded(true);
                      setJobStatus("downloaded");
                    }, 250);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-950 transition hover:bg-emerald-200"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 4v11m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Download and delete from server
                </a>
                <div className="mt-2 text-[10px] leading-4 text-emerald-200/50">
                  The server removes the video and images as soon as the download finishes.
                </div>
              </div>
            ) : null}

            {downloaded || jobStatus === "downloaded" ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-xs text-white/50">
                Downloaded. The server copy and source images have been deleted.
              </div>
            ) : null}

            {jobError ? (
              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3.5 py-3 text-xs leading-5 text-amber-200">
                {jobError}
              </div>
            ) : null}

            {jobId && jobStatus !== "done" && jobStatus !== "downloaded" && !jobError ? (
              <div className="mt-3 break-all text-[10px] text-white/20">Job {jobId}</div>
            ) : null}
          </div>

          {!me?.user && !meLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-5 text-white/40">
              <span className="font-semibold text-white/65">Guest mode.</span> You get three free renders
              each month. Sign in to keep your usage across devices and unlock a higher limit on Pro.
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

const frameLabel = (seconds: number) => `${Math.round(seconds * FPS)} frames`;
