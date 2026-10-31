import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { readableOn, withAlpha } from "../color";
import type { TextTheme } from "../textThemes";
import type { TextAnimation, TextPosition } from "../types";

type StyledTextBlockProps = {
  headline?: string;
  subtitle?: string;
  cta?: string;
  theme: TextTheme;
  brandColor: string;
  brandName?: string;
  fontFamily: string;
  animation: TextAnimation;
  position: TextPosition;
  /** "panel" = text on its own solid panel, "overlay" = text floating on top of the image. */
  mode: "panel" | "overlay";
  glass?: boolean;
  durationInFrames: number;
  sceneIndex?: number;
  sceneCount?: number;
  exitFade?: boolean;
  compact?: boolean;
  padding?: CSSProperties["padding"];
  maxWidth?: CSSProperties["maxWidth"];
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pad2 = (n: number) => String(n).padStart(2, "0");

export const StyledTextBlock = ({
  headline = "",
  subtitle = "",
  cta = "",
  theme,
  brandColor,
  brandName,
  fontFamily,
  animation,
  position,
  mode,
  glass = false,
  durationInFrames,
  sceneIndex,
  sceneCount,
  exitFade = false,
  compact = false,
  padding,
  maxWidth,
}: StyledTextBlockProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const horizontal = width > height;

  const head = headline.trim();
  const sub = subtitle.trim();
  const action = cta.trim();
  if (!head && !sub && !action) {
    return null;
  }

  // ---------- Alignment from text position ----------
  const vAlign = position.startsWith("top") ? "flex-start" : position.startsWith("bottom") ? "flex-end" : "center";
  const hKey: "left" | "right" | "center" = position.endsWith("left")
    ? "left"
    : position.endsWith("right")
      ? "right"
      : "center";
  const justify = hKey === "left" ? "flex-start" : hKey === "right" ? "flex-end" : "center";

  // ---------- Sizing ----------
  const len = head.length;
  const sizeTable =
    mode === "overlay"
      ? horizontal
        ? [96, 78, 62, 50]
        : [92, 76, 60, 48]
      : horizontal
        ? [80, 66, 54, 44]
        : compact
          ? [74, 62, 52, 42]
          : [86, 72, 58, 48];
  const sizeIndex = len <= 16 ? 0 : len <= 34 ? 1 : len <= 58 ? 2 : 3;
  const hs = Math.round(sizeTable[sizeIndex] * theme.headlineScale);
  const ss = Math.max(horizontal ? 28 : 30, Math.round(hs * 0.4));
  const cs = Math.max(22, Math.round(hs * 0.3));

  // ---------- Colors by mode ----------
  const card = mode === "overlay" && !glass ? theme.overlayCard : undefined;
  const chips = mode === "overlay" && !glass && !card && theme.overlayChips;
  const onImage = mode === "overlay" && !card;
  const headlineColor = mode === "panel" ? theme.headlineColor : card ? card.headline : "#ffffff";
  const subtitleColor = mode === "panel" ? theme.subtitleColor : card ? card.subtitle : "rgba(255,255,255,0.92)";
  const accent = theme.accent;
  const textShadow = onImage
    ? "0 4px 22px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6)"
    : mode === "panel"
      ? theme.panelTextShadow ?? "none"
      : "none";

  // ---------- Box (card / glass) ----------
  const boxIn = spring({ frame, fps, config: { damping: 18, mass: 0.8, stiffness: 120 } });
  const darkGlass = mode === "overlay" || theme.isDark;
  const boxStyle: CSSProperties = glass
    ? {
        background: darkGlass ? "rgba(12, 12, 18, 0.42)" : "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(20px) saturate(170%)",
        WebkitBackdropFilter: "blur(20px) saturate(170%)",
        border: darkGlass ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.85)",
        borderRadius: 28,
        padding: horizontal ? "38px 46px" : "34px 38px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.25)",
        transform: `translateY(${(1 - boxIn) * 30}px) scale(${0.96 + boxIn * 0.04})`,
        opacity: interpolate(boxIn, [0, 0.4], [0, 1], clamp),
      }
    : card
      ? {
          background: card.background,
          border: card.border,
          borderRadius: 26,
          padding: horizontal ? "40px 48px" : "36px 40px",
          boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
          transform: `translateY(${(1 - boxIn) * 30}px) scale(${0.96 + boxIn * 0.04})`,
          opacity: interpolate(boxIn, [0, 0.4], [0, 1], clamp),
        }
      : {};

  // ---------- Exit ----------
  const exitP = exitFade ? interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 1], clamp) : 0;

  // ---------- Decoration ----------
  const decoP = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const decoColor = onImage && theme.decoration === "index" ? "#ffffff" : accent;
  const lineColor = onImage ? "rgba(255,255,255,0.4)" : withAlpha(headlineColor.startsWith("#") ? headlineColor : "#ffffff", 0.22);
  const decoMargin = horizontal ? 26 : 22;
  let decoration: ReactNode = null;
  switch (theme.decoration) {
    case "bar":
      decoration = (
        <div style={{ width: 130 * decoP, height: 7, borderRadius: 999, backgroundColor: accent, marginBottom: decoMargin }} />
      );
      break;
    case "index":
      decoration = (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: decoMargin, opacity: decoP }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, color: decoColor, fontFamily }}>
            {sceneIndex !== undefined && sceneCount ? `${pad2(sceneIndex + 1)} / ${pad2(sceneCount)}` : (brandName || "Motionly").toUpperCase()}
          </span>
          <div style={{ width: 90 * decoP, height: 2, backgroundColor: lineColor }} />
        </div>
      );
      break;
    case "label":
      decoration = (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: decoMargin + 4, opacity: decoP }}>
          <div style={{ width: 44 * decoP, height: 1, backgroundColor: accent }} />
          <span style={{ fontSize: 18, letterSpacing: 6, textTransform: "uppercase", color: accent, fontFamily }}>
            {brandName || "Collection"}
          </span>
          <div style={{ width: 44 * decoP, height: 1, backgroundColor: accent }} />
        </div>
      );
      break;
    case "tag": {
      const tagIn = spring({ frame: frame - 2, fps, config: { damping: 10, mass: 0.6, stiffness: 180 } });
      decoration = (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 20px",
            borderRadius: 999,
            backgroundColor: accent,
            color: "#141414",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: decoMargin,
            transform: `rotate(-3deg) scale(${tagIn})`,
            boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
            fontFamily,
          }}
        >
          ★ {brandName || "New"}
        </div>
      );
      break;
    }
    case "glow":
    default:
      decoration = (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: decoMargin, opacity: decoP }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              transform: "rotate(45deg)",
              backgroundColor: brandColor,
              boxShadow: `0 0 16px ${brandColor}`,
            }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: onImage ? "rgba(255,255,255,0.9)" : accent,
              fontFamily,
            }}
          >
            {brandName || "Motionly"}
          </span>
        </div>
      );
      break;
  }

  // ---------- Headline (Supports multi-line via Enter) ----------
  const rawLines = head.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const lines = rawLines.length > 0 ? rawLines : [head];
  const headFont = theme.headlineFont ?? fontFamily;
  let wordCounter = 0;
  const lineWords = lines.map((l) =>
    l
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => ({ word: w, globalIndex: wordCounter++ }))
  );
  const totalWords = wordCounter;
  const activeWord = Math.min(Math.max(0, totalWords - 1), Math.floor(Math.max(0, frame - 4) / 6));

  const wordMotion = (i: number): { outer?: CSSProperties; inner: CSSProperties } => {
    const wf = frame - 4 - i * 3;
    if (animation === "pop") {
      const s = spring({ frame: wf, fps, config: { damping: 12, mass: 0.6, stiffness: 200 } });
      return {
        inner: {
          opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
          transform: `translateY(${(1 - s) * 26}px) scale(${interpolate(s, [0, 0.7, 1], [0.5, 1.1, 1], clamp)})`,
        },
      };
    }
    if (animation === "slide") {
      const s = spring({ frame: wf, fps, config: { damping: 18, mass: 0.7, stiffness: 140 } });
      return {
        outer: { overflow: "hidden", paddingBottom: "0.08em" },
        inner: { transform: `translateY(${(1 - s) * 110}%)` },
      };
    }
    if (animation === "highlight") {
      const passed = i <= activeWord;
      return {
        inner: {
          opacity: passed ? 1 : 0.32,
          transform: i === activeWord ? "scale(1.08)" : "none",
          color: i === activeWord ? accent : undefined,
          textShadow: i === activeWord ? `0 0 28px ${withAlpha(brandColor, 0.65)}` : undefined,
        },
      };
    }
    const o = interpolate(wf, [0, 12], [0, 1], clamp);
    return { inner: { opacity: o, transform: `translateY(${(1 - o) * 12}px)`, filter: `blur(${(1 - o) * 6}px)` } };
  };

  const headlineBase: CSSProperties = {
    fontFamily: headFont,
    fontSize: hs,
    fontWeight: theme.headlineWeight,
    letterSpacing: theme.headlineLetterSpacing,
    lineHeight: theme.headlineLineHeight,
    color: headlineColor,
    textShadow,
    textTransform: theme.uppercaseHeadline ? "uppercase" : "none",
  };

  let headlineNode: ReactNode = null;
  let typingDuration = 0;
  if (head) {
    if (animation === "typewriter") {
      const chars = Array.from(head);
      typingDuration = Math.min(Math.max(20, durationInFrames * 0.6), Math.max(16, chars.length * 1.3));
      const shown = Math.min(chars.length, Math.floor((Math.max(0, frame - 4) / typingDuration) * chars.length));
      const showCursor = shown < chars.length || Math.floor(frame / 12) % 2 === 0;
      headlineNode = (
        <div style={{ ...headlineBase, textAlign: hKey, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          <span>{chars.slice(0, shown).join("")}</span>
          <span
            style={{
              display: "inline-block",
              width: Math.max(3, Math.round(hs * 0.06)),
              height: "0.85em",
              marginLeft: 6,
              verticalAlign: "middle",
              borderRadius: 2,
              backgroundColor: accent,
              opacity: showCursor ? 1 : 0,
            }}
          />
        </div>
      );
    } else {
      headlineNode = (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: justify === "center" ? "center" : justify === "flex-end" ? "flex-end" : "flex-start",
            rowGap: Math.round(hs * (chips ? 0.22 : 0.12)),
            width: "100%",
          }}
        >
          {lineWords.map((line, lineIdx) => (
            <div
              key={`line-${lineIdx}`}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: justify,
                columnGap: Math.round(hs * 0.26),
                rowGap: Math.round(hs * (chips ? 0.14 : 0.04)),
              }}
            >
              {line.map(({ word, globalIndex }) => {
                const motion = wordMotion(globalIndex);
                const isLast = globalIndex === totalWords - 1 && totalWords > 1;
                let wordStyle: CSSProperties = {};
                if (chips) {
                  wordStyle = {
                    backgroundColor: isLast ? accent : brandColor,
                    color: isLast ? "#141414" : readableOn(brandColor),
                    padding: "0.02em 0.24em 0.08em",
                    borderRadius: "0.18em",
                    textShadow: "none",
                    boxShadow: "0 10px 26px rgba(0,0,0,0.3)",
                  };
                } else if (isLast && theme.accentWordMode === "last") {
                  wordStyle = { color: accent };
                } else if (isLast && theme.accentWordMode === "chip") {
                  wordStyle = {
                    backgroundColor: accent,
                    color: "#141414",
                    padding: "0 0.22em 0.06em",
                    borderRadius: "0.18em",
                    textShadow: "none",
                    display: "inline-block",
                    transform: "rotate(-2deg)",
                  };
                }
                return (
                  <span key={`${word}-${globalIndex}`} style={{ display: "inline-block", ...motion.outer }}>
                    <span style={{ ...headlineBase, display: "inline-block", ...wordStyle, ...motion.inner }}>{word}</span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
  }

  // ---------- Subtitle ----------
  const subDelay = animation === "typewriter" ? Math.round(typingDuration * 0.8) : 8 + totalWords * 3;
  const subIn = spring({ frame: frame - subDelay, fps, config: { damping: 20, mass: 0.9, stiffness: 120 } });
  const subtitleNode = sub ? (
    <p
      style={{
        margin: 0,
        marginTop: head ? (horizontal ? 22 : 24) : 0,
        fontFamily,
        fontSize: ss,
        fontWeight: theme.id === "fashion" ? 400 : 500,
        lineHeight: 1.45,
        color: subtitleColor,
        textAlign: hKey,
        textShadow: onImage ? "0 2px 12px rgba(0,0,0,0.8)" : "none",
        letterSpacing: theme.id === "fashion" ? "0.02em" : 0,
        maxWidth: horizontal ? (mode === "overlay" ? 900 : 760) : "100%",
        opacity: interpolate(subIn, [0, 0.5], [0, 1], clamp),
        transform: `translateY(${(1 - subIn) * 20}px)`,
      }}
    >
      {sub}
    </p>
  ) : null;

  // ---------- CTA ----------
  const ctaIn = spring({ frame: frame - subDelay - 8, fps, config: { damping: 13, mass: 0.7, stiffness: 170 } });
  let ctaStyle: CSSProperties;
  switch (theme.ctaStyle) {
    case "pill":
      ctaStyle = {
        backgroundColor: brandColor,
        color: readableOn(brandColor),
        borderRadius: 999,
        padding: `${Math.round(cs * 0.7)}px ${Math.round(cs * 1.5)}px`,
        boxShadow: `0 16px 40px ${withAlpha(brandColor, 0.35)}`,
      };
      break;
    case "outline":
      ctaStyle = {
        border: `1.5px solid ${onImage ? "#ffffff" : accent}`,
        color: onImage ? "#ffffff" : accent,
        padding: `${Math.round(cs * 0.65)}px ${Math.round(cs * 1.6)}px`,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        fontWeight: 500,
      };
      break;
    case "sticker":
      ctaStyle = {
        backgroundColor: "#ffffff",
        color: brandColor,
        borderRadius: 999,
        padding: `${Math.round(cs * 0.7)}px ${Math.round(cs * 1.5)}px`,
        boxShadow: "0 14px 34px rgba(0,0,0,0.25)",
        fontWeight: 800,
        rotate: "-2deg",
      };
      break;
    case "square":
    default:
      ctaStyle = {
        backgroundColor: brandColor,
        color: readableOn(brandColor),
        borderRadius: 12,
        padding: `${Math.round(cs * 0.7)}px ${Math.round(cs * 1.3)}px`,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        boxShadow: `0 14px 34px ${withAlpha(brandColor, 0.35)}`,
      };
      break;
  }
  const ctaNode = action ? (
    <div style={{ marginTop: horizontal ? 34 : 36, display: "flex", justifyContent: justify }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          fontFamily,
          fontSize: cs,
          fontWeight: 700,
          opacity: interpolate(ctaIn, [0, 0.3], [0, 1], clamp),
          transform: `scale(${0.6 + ctaIn * 0.4})`,
          ...ctaStyle,
        }}
      >
        <span>{action}</span>
        {theme.ctaStyle === "square" || theme.ctaStyle === "outline" ? (
          <svg width={cs * 0.9} height={cs * 0.9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: vAlign,
        alignItems: justify,
        padding,
        boxSizing: "border-box",
        opacity: 1 - exitP,
        transform: `translateY(${-exitP * 18}px)`,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: justify,
          textAlign: hKey,
          maxWidth: maxWidth ?? "100%",
          ...boxStyle,
        }}
      >
        {decoration}
        {headlineNode}
        {subtitleNode}
        {ctaNode}
      </div>
    </div>
  );
};
