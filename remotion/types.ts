export type AspectRatio = "9:16" | "1:1" | "16:9";

export type FontFamily = "NotoSansBengali" | "HindSiliguri" | "Inter";

export type StyleId = "minimal" | "kinetic" | "fashion" | "social" | "corporate";

export type TextPosition =
  | "center"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type TextAnimation = "pop" | "highlight" | "slide" | "fade" | "typewriter";

export type SlideText = {
  headline?: string;
  subtitle?: string;
  textPosition?: TextPosition;
  textAnimation?: TextAnimation;
};

export type PresenterShape = "circle" | "rounded";
export type PresenterSize = "small" | "medium" | "large";

export type PresenterConfig = {
  enabled: boolean;
  videoUrl?: string;
  shape?: PresenterShape;
  size?: PresenterSize;
  position?: "bottom-right" | "bottom-left";
};

export type AudioConfig = {
  audioUrl?: string;
  volume?: number;
  loop?: boolean;
  startFromSeconds?: number;
  endAtSeconds?: number;
};

export type VideoProps = {
  images: string[];
  headline: string;
  subtitle?: string;
  cta?: string;
  brandName?: string;
  brandColor: string;
  fontFamily: FontFamily;
  aspectRatio: AspectRatio;
  durationInSeconds: number;
  musicTrack?: string;
  watermark?: boolean;
  styleId?: StyleId;
  textPosition?: TextPosition;
  textAnimation?: TextAnimation;
  slideTexts?: SlideText[];
  presenter?: PresenterConfig;
  audio?: AudioConfig;
};

export const FPS = 30;
export const MIN_DURATION_SECONDS = 5;
export const MAX_DURATION_SECONDS = 30;

export const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

export const STYLE_IDS: StyleId[] = ["minimal", "kinetic", "fashion", "social", "corporate"];

export const STYLE_LABELS: Record<StyleId, string> = {
  minimal: "Minimal",
  kinetic: "Kinetic Typography",
  fashion: "Fashion Luxury",
  social: "Social Promo",
  corporate: "Corporate",
};

export const STYLE_DESCRIPTIONS: Record<StyleId, string> = {
  minimal: "Clean layouts, quiet motion, and plenty of breathing room.",
  kinetic: "Bold, punchy word-by-word typography over moving imagery.",
  fashion: "Editorial pacing, full-bleed images, and refined spacing.",
  social: "Bright gradients, playful cards, and a strong call to action.",
  corporate: "Polished split layouts built for brand and product stories.",
};

export const STYLE_ACCENTS: Record<StyleId, string> = {
  minimal: "#c2b8a3",
  kinetic: "#f5d90a",
  fashion: "#d8c3a5",
  social: "#ff4d8d",
  corporate: "#2563eb",
};

export const normalizeDuration = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? seconds : 8;
  return Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, safe));
};

export const framesForSeconds = (seconds: number) => Math.round(normalizeDuration(seconds) * FPS);
