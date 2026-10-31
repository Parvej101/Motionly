export type AspectRatio = "9:16" | "1:1" | "16:9";

export type FontFamily = "NotoSansBengali" | "HindSiliguri" | "Inter";

/** Text design system — controls how headline / subtitle / CTA look. */
export type StyleId = "minimal" | "kinetic" | "fashion" | "social" | "corporate";

/** Page layout system — controls how image and text share the canvas. */
export type LayoutId = "fullscreen" | "split-left" | "split-right" | "framed" | "band" | "diagonal";

export const LAYOUT_IDS: LayoutId[] = ["split-left", "split-right", "fullscreen", "framed", "band", "diagonal"];

export const LAYOUT_LABELS: Record<LayoutId, string> = {
  "split-left": "Hero Split · Image Left",
  "split-right": "Hero Split · Image Right",
  fullscreen: "Full Screen Overlay",
  framed: "Floating Card",
  band: "Magazine Band",
  diagonal: "Diagonal Cut",
};

export const LAYOUT_DESCRIPTIONS: Record<LayoutId, string> = {
  "split-left": "Image on one side, text on the other — like a website hero slider.",
  "split-right": "Text first, image on the opposite side with a sliding wipe.",
  fullscreen: "Full-bleed image with text floating on top.",
  framed: "Image in a tilted floating card, text beside it.",
  band: "Full image with a solid text band sliding up from the bottom.",
  diagonal: "Image cut with a bold diagonal edge next to the text.",
};

export const DEFAULT_LAYOUT_FOR_STYLE: Record<StyleId, LayoutId> = {
  minimal: "split-left",
  kinetic: "fullscreen",
  fashion: "framed",
  social: "band",
  corporate: "split-right",
};

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
  textGlassEffect?: boolean;
};

export type PresenterShape = "circle" | "rounded";
export type PresenterSize = "small" | "medium" | "large";

export type PresenterConfig = {
  enabled: boolean;
  videoUrl?: string;
  shape?: PresenterShape;
  size?: PresenterSize;
  position?: "bottom-right" | "bottom-left";
  durationInSeconds?: number;
};

export type MotionEngineMode = "standard" | "parallax_free" | "ai_motion";

export type AiProvider = "google_gemini" | "replicate_svd" | "fal_kling";

export type PartMovementType = "rotate" | "float_y" | "float_x" | "pulse_scale" | "pendulum_swing" | "slide_bounce";

export type DynamicDeconstructedPart = {
  id: string;
  name: string; // e.g. "Front Wheel", "Character Arm", "Clock Dial", "Laptop Screen"
  box: {
    xPercent: number; // 0-100 left position
    yPercent: number; // 0-100 top position
    widthPercent: number; // width
    heightPercent: number; // height
  };
  movement: PartMovementType;
  speed: number; // -3 to +3
  amplitude?: number; // pixel distance or rotation degree
  svgVectorCode?: string;
};

export type VectorMotionType = "clock" | "gear" | "hud_scanner" | "pulse_circle" | "custom_svg";

export type VectorMotionOverlay = {
  id: string;
  type: VectorMotionType;
  xPercent: number;
  yPercent: number;
  size: number;
  color?: string;
  speedMultiplier?: number;
  label?: string;
  svgData?: string;
};

export type AdvancedMotionConfig = {
  enabled: boolean;
  engine: "free_parallax" | "ai_generative";
  parallaxStrength?: "subtle" | "medium" | "dramatic"; // for free 2.5D parallax
  ambientParticle?: boolean; // floating dust/bokeh particles
  cameraZoom?: "in" | "out" | "pan_left" | "pan_right";
  deconstructedParts?: DynamicDeconstructedPart[]; // AI decomposed dynamic layers
  vectorOverlays?: VectorMotionOverlay[];
  aiConfig?: {
    provider: AiProvider;
    apiKey?: string;
    motionPrompt?: string;
    motionIntensity?: number; // 1-10
    generatedVideoUrls?: Record<number, string>; // scene index -> generated video URL
  };
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
  layoutId?: LayoutId;
  textPosition?: TextPosition;
  textAnimation?: TextAnimation;
  textGlassEffect?: boolean;
  slideTexts?: SlideText[];
  presenter?: PresenterConfig;
  audio?: AudioConfig;
  advancedMotion?: AdvancedMotionConfig;
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
  minimal: "Minimal Clean",
  kinetic: "Bold Kinetic",
  fashion: "Luxury Editorial",
  social: "Social Pop",
  corporate: "Corporate Pro",
};

export const STYLE_DESCRIPTIONS: Record<StyleId, string> = {
  minimal: "Cream paper tones, dark ink headline and a calm accent bar.",
  kinetic: "Dark neon panel, heavy words and an accent last word.",
  fashion: "Black & gold, elegant serif headline and outline button.",
  social: "Brand gradient, sticker tag and highlighted keyword chip.",
  corporate: "Light slate grid, scene counter and sharp square button.",
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
