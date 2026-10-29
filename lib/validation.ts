import {
  STYLE_IDS,
  type AspectRatio,
  type FontFamily,
  type StyleId,
  type VideoProps,
} from "@/remotion/types";

export const MAX_IMAGES = 10;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_HEADLINE_LENGTH = 80;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedAspectRatios = new Set<AspectRatio>(["9:16", "1:1", "16:9"]);
const allowedFonts = new Set<FontFamily>(["NotoSansBengali", "HindSiliguri", "Inter"]);

export class ValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export type RenderSubmission = {
  baseProps: Omit<VideoProps, "images"> & { images?: never };
  images: File[];
};

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeColor = (value: unknown) => {
  const raw = asString(value);
  const hex = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return hex.toLowerCase();
  }
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }
  return null;
};

export const parseRenderSubmission = (formData: FormData): RenderSubmission => {
  const rawProps = formData.get("props");
  if (typeof rawProps !== "string") {
    throw new ValidationError("Missing render settings.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawProps) as Record<string, unknown>;
  } catch {
    throw new ValidationError("Render settings must be valid JSON.");
  }

  const headline = asString(parsed.headline);
  if (!headline) {
    throw new ValidationError("Headline is required.");
  }
  if (headline.length > MAX_HEADLINE_LENGTH) {
    throw new ValidationError(`Headline must be ${MAX_HEADLINE_LENGTH} characters or fewer.`);
  }

  const styleId = asString(parsed.styleId) as StyleId;
  if (!STYLE_IDS.includes(styleId)) {
    throw new ValidationError("Unknown style.");
  }

  const aspectRatio = asString(parsed.aspectRatio) as AspectRatio;
  if (!allowedAspectRatios.has(aspectRatio)) {
    throw new ValidationError("Aspect ratio must be 9:16, 1:1, or 16:9.");
  }

  const fontFamily = (asString(parsed.fontFamily) || "NotoSansBengali") as FontFamily;
  if (!allowedFonts.has(fontFamily)) {
    throw new ValidationError("Unknown font.");
  }

  const brandColor = normalizeColor(parsed.brandColor);
  if (!brandColor) {
    throw new ValidationError("Brand color must be a hex color.");
  }

  const durationInSeconds = Number(parsed.durationInSeconds);
  if (!Number.isFinite(durationInSeconds) || durationInSeconds < 5 || durationInSeconds > 30) {
    throw new ValidationError("Duration must be between 5 and 30 seconds.");
  }

  const subtitle = asString(parsed.subtitle);
  const cta = asString(parsed.cta);
  const brandName = asString(parsed.brandName);

  if (subtitle.length > 180) {
    throw new ValidationError("Subtitle must be 180 characters or fewer.");
  }
  if (cta.length > 40) {
    throw new ValidationError("CTA must be 40 characters or fewer.");
  }
  if (brandName.length > 40) {
    throw new ValidationError("Brand name must be 40 characters or fewer.");
  }

  const images = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
  if (images.length < 1) {
    throw new ValidationError("Add at least one image.");
  }
  if (images.length > MAX_IMAGES) {
    throw new ValidationError(`You can add up to ${MAX_IMAGES} images.`);
  }

  for (const image of images) {
    if (!allowedImageTypes.has(image.type)) {
      throw new ValidationError("Images must be JPEG, PNG, or WebP.");
    }
    if (image.size <= 0) {
      throw new ValidationError("One of the images is empty.");
    }
    if (image.size > MAX_IMAGE_BYTES) {
      throw new ValidationError("Each image must be 5 MB or smaller.");
    }
  }

  const allowedPositions = new Set([
    "center",
    "bottom",
    "top",
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ]);
  const rawPosition = asString(parsed.textPosition);
  const textPosition = allowedPositions.has(rawPosition)
    ? (rawPosition as
        | "center"
        | "bottom"
        | "top"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right")
    : "center";

  const allowedAnimations = new Set(["pop", "highlight", "slide", "fade", "typewriter"]);
  const rawAnimation = asString(parsed.textAnimation);
  const textAnimation = allowedAnimations.has(rawAnimation)
    ? (rawAnimation as "pop" | "highlight" | "slide" | "fade" | "typewriter")
    : "pop";

  let slideTexts = undefined;
  if (Array.isArray(parsed.slideTexts)) {
    slideTexts = parsed.slideTexts.map((s) => ({
      headline: typeof s?.headline === "string" ? s.headline.slice(0, MAX_HEADLINE_LENGTH) : "",
      subtitle: typeof s?.subtitle === "string" ? s.subtitle.slice(0, 180) : "",
      textPosition: allowedPositions.has(s?.textPosition) ? s.textPosition : undefined,
      textAnimation: allowedAnimations.has(s?.textAnimation) ? s.textAnimation : undefined,
    }));
  }

  let presenter = undefined;
  if (parsed.presenter && typeof parsed.presenter === "object") {
    const p = parsed.presenter as Record<string, unknown>;
    if (p.enabled) {
      presenter = {
        enabled: true,
        videoUrl: typeof p.videoUrl === "string" ? p.videoUrl : undefined,
        shape: (p.shape === "rounded" ? "rounded" : "circle") as "rounded" | "circle",
        size: (p.size === "small" || p.size === "large" ? p.size : "medium") as "small" | "medium" | "large",
        position: (p.position === "bottom-left" ? "bottom-left" : "bottom-right") as "bottom-left" | "bottom-right",
      };
    }
  }

  let audio = undefined;
  if (parsed.audio && typeof parsed.audio === "object") {
    const a = parsed.audio as Record<string, unknown>;
    if (typeof a.audioUrl === "string" && a.audioUrl) {
      const startFromSeconds = typeof a.startFromSeconds === "number" && a.startFromSeconds >= 0 ? a.startFromSeconds : 0;
      const endAtSeconds = typeof a.endAtSeconds === "number" && a.endAtSeconds > startFromSeconds ? a.endAtSeconds : undefined;
      audio = {
        audioUrl: a.audioUrl,
        volume: typeof a.volume === "number" ? Math.max(0, Math.min(1, a.volume)) : 1,
        loop: Boolean(a.loop),
        startFromSeconds,
        endAtSeconds,
      };
    }
  }

  return {
    images,
    baseProps: {
      headline,
      subtitle: subtitle || undefined,
      cta: cta || undefined,
      brandName: brandName || undefined,
      brandColor,
      fontFamily,
      aspectRatio,
      durationInSeconds: Math.round(durationInSeconds * 10) / 10,
      styleId,
      textPosition,
      textAnimation,
      slideTexts,
      presenter,
      audio,
    },
  };
};
