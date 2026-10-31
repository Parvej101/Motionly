import { mix, readableOn, withAlpha } from "./color";
import type { StyleId } from "./types";

/**
 * Text design themes. Each theme defines how the text looks
 * (colors, weight, decoration, CTA) — independent of the page layout.
 */
export type TextTheme = {
  id: StyleId;
  isDark: boolean;
  /** Background used when text sits on its own solid panel (split / band / framed / diagonal). */
  panelBackground: string;
  /** Optional decorative pattern drawn above the panel background. */
  panelPattern?: string;
  headlineColor: string;
  subtitleColor: string;
  accent: string;
  headlineWeight: number;
  headlineFont?: string;
  headlineLetterSpacing: string;
  headlineLineHeight: number;
  headlineScale: number;
  uppercaseHeadline?: boolean;
  accentWordMode: "last" | "none" | "chip";
  decoration: "bar" | "index" | "label" | "tag" | "glow";
  ctaStyle: "pill" | "square" | "outline" | "sticker";
  /** When text floats on top of the image (full-screen layout) without glass. */
  overlayCard?: { background: string; headline: string; subtitle: string; border?: string };
  overlayChips?: boolean;
  panelTextShadow?: string;
};

export const getTextTheme = (styleId: StyleId, brandColor: string, fontStack: string): TextTheme => {
  switch (styleId) {
    case "minimal":
      return {
        id: "minimal",
        isDark: false,
        panelBackground: `radial-gradient(circle at 85% 12%, ${withAlpha(brandColor, 0.16)}, transparent 45%), linear-gradient(160deg, #f8f6f1 0%, #ece7dd 100%)`,
        headlineColor: "#141416",
        subtitleColor: "#5c574e",
        accent: brandColor,
        headlineWeight: 700,
        headlineLetterSpacing: "-0.02em",
        headlineLineHeight: 1.12,
        headlineScale: 1,
        accentWordMode: "none",
        decoration: "bar",
        ctaStyle: "pill",
        overlayCard: {
          background: "rgba(248, 246, 241, 0.94)",
          headline: "#141416",
          subtitle: "#5c574e",
          border: "1px solid rgba(255,255,255,0.7)",
        },
      };
    case "fashion": {
      const gold = mix(brandColor, "#d8c3a5", 0.6);
      return {
        id: "fashion",
        isDark: true,
        panelBackground: `radial-gradient(circle at 20% 15%, ${withAlpha(gold, 0.14)}, transparent 50%), linear-gradient(180deg, #110f0c 0%, #070605 100%)`,
        headlineColor: "#f4ecdd",
        subtitleColor: "rgba(244, 236, 221, 0.68)",
        accent: gold,
        headlineWeight: 400,
        headlineFont: `"Playfair Display", "Didot", Georgia, "Times New Roman", ${fontStack}`,
        headlineLetterSpacing: "0.005em",
        headlineLineHeight: 1.14,
        headlineScale: 1.1,
        accentWordMode: "none",
        decoration: "label",
        ctaStyle: "outline",
      };
    }
    case "social": {
      const warm = mix(brandColor, "#ff8a3d", 0.55);
      return {
        id: "social",
        isDark: true,
        panelBackground: `radial-gradient(circle at 90% 10%, rgba(255,255,255,0.22), transparent 40%), linear-gradient(135deg, ${brandColor} 0%, ${warm} 100%)`,
        headlineColor: "#ffffff",
        subtitleColor: "rgba(255, 255, 255, 0.92)",
        accent: "#ffe14d",
        headlineWeight: 800,
        headlineLetterSpacing: "-0.02em",
        headlineLineHeight: 1.14,
        headlineScale: 1.04,
        accentWordMode: "chip",
        decoration: "tag",
        ctaStyle: "sticker",
        overlayChips: true,
        panelTextShadow: "0 3px 14px rgba(0,0,0,0.18)",
      };
    }
    case "corporate":
      return {
        id: "corporate",
        isDark: false,
        panelBackground: `radial-gradient(circle at 8% 8%, ${withAlpha(brandColor, 0.12)}, transparent 40%), linear-gradient(135deg, #f8fafc 0%, #e8eef6 100%)`,
        panelPattern:
          "linear-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.045) 1px, transparent 1px)",
        headlineColor: "#0f172a",
        subtitleColor: "#475569",
        accent: brandColor,
        headlineWeight: 700,
        headlineLetterSpacing: "-0.02em",
        headlineLineHeight: 1.14,
        headlineScale: 0.96,
        accentWordMode: "none",
        decoration: "index",
        ctaStyle: "square",
        overlayCard: {
          background: "rgba(255, 255, 255, 0.96)",
          headline: "#0f172a",
          subtitle: "#475569",
          border: `1px solid ${withAlpha(brandColor, 0.25)}`,
        },
      };
    case "kinetic":
    default:
      return {
        id: "kinetic",
        isDark: true,
        panelBackground: `radial-gradient(circle at 25% 20%, ${withAlpha(brandColor, 0.32)}, transparent 55%), radial-gradient(circle at 85% 90%, ${withAlpha(brandColor, 0.18)}, transparent 50%), #08080d`,
        headlineColor: "#ffffff",
        subtitleColor: "rgba(255, 255, 255, 0.78)",
        accent: readableOn(brandColor) === "#ffffff" ? mix(brandColor, "#ffffff", 0.15) : brandColor,
        headlineWeight: 800,
        headlineLetterSpacing: "-0.025em",
        headlineLineHeight: 1.08,
        headlineScale: 1.08,
        accentWordMode: "last",
        decoration: "glow",
        ctaStyle: "square",
      };
  }
};
