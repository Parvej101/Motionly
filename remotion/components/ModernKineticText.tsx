import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { readableOn, withAlpha } from "../color";
import type { TextAnimation, TextPosition } from "../types";

type ModernKineticTextProps = {
  headline: string;
  subtitle?: string;
  cta?: string;
  brandColor?: string;
  fontFamily?: string;
  position?: TextPosition;
  animation?: TextAnimation;
  delay?: number;
  durationInFrames?: number;
  maxWidth?: number | string;
  scale?: number;
  glassEffect?: boolean;
  style?: CSSProperties;
};

export const ModernKineticText = ({
  headline,
  subtitle,
  cta,
  brandColor = "#7c5cff",
  fontFamily = "sans-serif",
  position = "center",
  animation = "pop",
  delay = 0,
  durationInFrames,
  maxWidth,
  scale = 1,
  glassEffect = false,
  style,
}: ModernKineticTextProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isHorizontal = width > height;

  const currentFrame = Math.max(0, frame - delay);
  const trimmedHeadline = (headline || "").trim();
  const trimmedSubtitle = (subtitle || "").trim();
  const trimmedCta = (cta || "").trim();

  if (!trimmedHeadline && !trimmedSubtitle && !trimmedCta) {
    return null;
  }

  // Support multi-line headlines entered with Enter / newlines
  const rawLines = trimmedHeadline.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const lines = rawLines.length > 0 ? rawLines : [trimmedHeadline];
  let wordCounter = 0;
  const lineWords = lines.map((l) =>
    l
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => ({ word: w, globalIndex: wordCounter++ }))
  );
  const totalWords = wordCounter;
  const words = lineWords.flatMap((lw) => lw.map((item) => item.word));

  // Position alignment styling
  const isLeft = position === "top-left" || position === "bottom-left";
  const isRight = position === "top-right" || position === "bottom-right";

  const positionStyles: Record<TextPosition, CSSProperties> = {
    center: {
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      margin: "auto 0",
    },
    top: {
      alignItems: "center",
      justifyContent: "flex-start",
      textAlign: "center",
      marginTop: isHorizontal ? 50 : 80,
      marginBottom: "auto",
    },
    bottom: {
      alignItems: "center",
      justifyContent: "flex-end",
      textAlign: "center",
      marginTop: "auto",
      marginBottom: isHorizontal ? 60 : 100,
    },
    "top-left": {
      alignItems: "flex-start",
      justifyContent: "flex-start",
      textAlign: "left",
      marginTop: isHorizontal ? 50 : 80,
      marginBottom: "auto",
      paddingLeft: isHorizontal ? 32 : 16,
    },
    "top-right": {
      alignItems: "flex-end",
      justifyContent: "flex-start",
      textAlign: "right",
      marginTop: isHorizontal ? 50 : 80,
      marginBottom: "auto",
      paddingRight: isHorizontal ? 32 : 16,
    },
    "bottom-left": {
      alignItems: "flex-start",
      justifyContent: "flex-end",
      textAlign: "left",
      marginTop: "auto",
      marginBottom: isHorizontal ? 60 : 100,
      paddingLeft: isHorizontal ? 32 : 16,
    },
    "bottom-right": {
      alignItems: "flex-end",
      justifyContent: "flex-end",
      textAlign: "right",
      marginTop: "auto",
      marginBottom: isHorizontal ? 60 : 100,
      paddingRight: isHorizontal ? 32 : 16,
    },
  };

  // Base font size calculation for responsiveness
  const baseFontSize = isHorizontal
    ? words.length <= 4
      ? 84
      : words.length <= 8
        ? 68
        : 52
    : words.length <= 4
      ? 76
      : words.length <= 8
        ? 62
        : 48;

  const responsiveFontSize = Math.round(baseFontSize * scale);

  const glassStyle: CSSProperties = glassEffect
    ? {
      backgroundColor: "rgba(10, 10, 16, 0.45)",
      backdropFilter: "blur(18px) saturate(180%)",
      WebkitBackdropFilter: "blur(18px) saturate(180%)",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      borderRadius: "24px",
      padding: isHorizontal ? "28px 36px" : "24px 28px",
      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
    }
    : {};

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: maxWidth || (isHorizontal ? "78%" : "90%"),
        pointerEvents: "none",
        zIndex: 20,
        ...positionStyles[position],
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          alignItems: isLeft ? "flex-start" : isRight ? "flex-end" : "center",
          ...glassStyle,
        }}
      >
        {/* Dynamic Headline with Words / Typewriter Animation */}
        {trimmedHeadline ? (
          animation === "typewriter" ? (
          (() => {
            const chars = Array.from(headline || "");
            const availableFrames = durationInFrames ? Math.max(25, durationInFrames * 0.65) : 45;
            const typingDuration = Math.min(availableFrames, Math.max(16, chars.length * 1.3));
            const charIndex = Math.min(chars.length, Math.floor((currentFrame / typingDuration) * chars.length));
            const visibleText = chars.slice(0, charIndex).join("");
            const isTyping = charIndex < chars.length;
            const showCursor = isTyping || (Math.floor(frame / 12) % 2 === 0);

            return (
              <div
                style={{
                  fontSize: responsiveFontSize,
                  fontWeight: 800,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.25,
                  color: "#ffffff",
                  textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)",
                  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))",
                  textAlign: isLeft ? "left" : isRight ? "right" : "center",
                  fontFamily,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                <span>{visibleText}</span>
                <span
                  style={{
                    display: "inline-block",
                    width: Math.max(3, Math.round(responsiveFontSize * 0.06)),
                    height: "0.85em",
                    backgroundColor: brandColor,
                    marginLeft: "4px",
                    verticalAlign: "middle",
                    borderRadius: "2px",
                    opacity: showCursor ? 1 : 0,
                    boxShadow: `0 0 12px ${brandColor}`,
                  }}
                />
              </div>
            );
          })()
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: isLeft ? "flex-start" : isRight ? "flex-end" : "center",
              gap: `${responsiveFontSize * 0.18}px`,
              width: "100%",
            }}
          >
            {lineWords.map((line, lineIdx) => (
              <div
                key={`line-${lineIdx}`}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: isLeft ? "flex-start" : isRight ? "flex-end" : "center",
                  gap: `${responsiveFontSize * 0.16}px ${responsiveFontSize * 0.28}px`,
                  lineHeight: 1.25,
                  fontFamily,
                }}
              >
                {line.map(({ word, globalIndex }) => {
                  // Staggered frame per word
                  const wordDelay = globalIndex * 4;
                  const wordFrame = currentFrame - wordDelay;

                  let wordStyle: CSSProperties = {};

                  if (animation === "pop") {
                    const spr = spring({
                      frame: wordFrame,
                      fps,
                      config: { damping: 12, mass: 0.6, stiffness: 200 },
                    });
                    const opacity = interpolate(spr, [0, 0.3], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    const scaleVal = interpolate(spr, [0, 0.7, 1], [0.4, 1.15, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    const translateY = (1 - spr) * 28;

                    wordStyle = {
                      opacity,
                      transform: `translate3d(0, ${translateY}px, 0) scale(${scaleVal})`,
                    };
                  } else if (animation === "highlight") {
                    // Karaoke / Reels active highlight: current active word glows with brandColor
                    const activeIndex = Math.min(
                      totalWords - 1,
                      Math.floor(currentFrame / 6)
                    );
                    const isActive = globalIndex === activeIndex;
                    const isPassed = globalIndex <= activeIndex;

                    wordStyle = {
                      opacity: isPassed ? 1 : 0.35,
                      color: isActive ? brandColor : isPassed ? "#ffffff" : "rgba(255,255,255,0.45)",
                      transform: isActive
                        ? `scale(1.12) translateY(-2px)`
                        : `scale(1) translateY(0)`,
                      textShadow: isActive
                        ? `0 0 30px ${withAlpha(brandColor, 0.8)}, 0 4px 12px rgba(0,0,0,0.8)`
                        : `0 3px 10px rgba(0,0,0,0.7)`,
                      transition: "all 0.15s ease",
                    };
                  } else if (animation === "slide") {
                    // Masked slide up
                    const spr = spring({
                      frame: wordFrame,
                      fps,
                      config: { damping: 18, mass: 0.7, stiffness: 140 },
                    });
                    const opacity = interpolate(spr, [0, 0.4], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    wordStyle = {
                      opacity,
                      transform: `translate3d(0, ${(1 - spr) * 45}px, 0)`,
                    };
                  } else {
                    // Smooth fade
                    const opacity = interpolate(currentFrame - globalIndex * 3, [0, 10], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    });
                    wordStyle = {
                      opacity,
                      transform: `scale(${interpolate(currentFrame - globalIndex * 3, [0, 10], [0.95, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      })})`,
                    };
                  }

                  // Accent colors: highlight last word or keyword
                  const isAccent = animation !== "highlight" && (globalIndex === totalWords - 1 || globalIndex === 0 && totalWords > 3);
                  const color = isAccent ? brandColor : "#ffffff";

                  return (
                    <span
                      key={`${word}-${globalIndex}`}
                      style={{
                        display: "inline-block",
                        fontSize: responsiveFontSize,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        color,
                        textShadow: "0 4px 16px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)",
                        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.6))",
                        ...wordStyle,
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )
      ) : null}

        {/* Modern Subtitle */}
        {subtitle && (
          <div
            style={{
              marginTop: isHorizontal ? 18 : 22,
              fontFamily,
              display: "flex",
              justifyContent: isLeft ? "flex-start" : isRight ? "flex-end" : "center",
              width: "100%",
            }}
          >
            {(() => {
              const typeDelay = Math.min(
                durationInFrames ? Math.max(25, durationInFrames * 0.65) : 45,
                Math.max(16, (headline || "").length * 1.3),
              );
              const subFrame = currentFrame - (animation === "typewriter" ? Math.round(typeDelay * 0.85) : (words.length * 3 + 8));
              const subSpr = spring({
                frame: subFrame,
                fps,
                config: { damping: 20, mass: 0.9, stiffness: 120 },
              });
              const subOpacity = interpolate(subSpr, [0, 0.5], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const subTranslateY = (1 - subSpr) * 20;

              return (
                <p
                  style={{
                    margin: 0,
                    fontSize: Math.round(responsiveFontSize * 0.42),
                    fontWeight: 500,
                    lineHeight: 1.4,
                    textAlign: isLeft ? "left" : isRight ? "right" : "center",
                    color: "rgba(255, 255, 255, 0.92)",
                    opacity: subOpacity,
                    transform: `translate3d(0, ${subTranslateY}px, 0)`,
                    textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                    backgroundColor: "rgba(0, 0, 0, 0.45)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    padding: "8px 20px",
                    borderRadius: 999,
                    display: "inline-block",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {subtitle}
                </p>
              );
            })()}
          </div>
        )}

        {/* CTA Button / Badge */}
        {cta && (
          <div
            style={{
              marginTop: isHorizontal ? 24 : 28,
              fontFamily,
              display: "flex",
              justifyContent: isLeft ? "flex-start" : isRight ? "flex-end" : "center",
              width: "100%",
            }}
          >
            {(() => {
              const ctaFrame = currentFrame - (words.length * 3 + 16);
              const ctaSpr = spring({
                frame: ctaFrame,
                fps,
                config: { damping: 14, mass: 0.7, stiffness: 180 },
              });
              const ctaOpacity = interpolate(ctaSpr, [0, 0.3], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });

              return (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: `${Math.round(responsiveFontSize * 0.22)}px ${Math.round(responsiveFontSize * 0.48)}px`,
                    backgroundColor: brandColor,
                    color: readableOn(brandColor),
                    borderRadius: 14,
                    fontSize: Math.round(responsiveFontSize * 0.36),
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    opacity: ctaOpacity,
                    transform: `scale(${ctaSpr})`,
                    boxShadow: `0 12px 30px ${withAlpha(brandColor, 0.45)}, 0 4px 12px rgba(0,0,0,0.5)`,
                  }}
                >
                  <span>{cta}</span>
                  <svg
                    width={Math.round(responsiveFontSize * 0.32)}
                    height={Math.round(responsiveFontSize * 0.32)}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
