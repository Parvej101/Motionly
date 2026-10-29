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
  maxWidth,
  scale = 1,
  style,
}: ModernKineticTextProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isHorizontal = width > height;

  const currentFrame = Math.max(0, frame - delay);
  const words = (headline || "").trim().split(/\s+/).filter(Boolean);

  // Position alignment styling
  const positionStyles: Record<TextPosition, CSSProperties> = {
    center: {
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      margin: "auto 0",
    },
    bottom: {
      alignItems: "center",
      justifyContent: "flex-end",
      textAlign: "center",
      marginTop: "auto",
      marginBottom: isHorizontal ? 60 : 100,
    },
    top: {
      alignItems: "center",
      justifyContent: "flex-start",
      textAlign: "center",
      marginTop: isHorizontal ? 50 : 80,
      marginBottom: "auto",
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
      {/* Dynamic Headline with Words Animation */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: position === "center" || position === "bottom" || position === "top" ? "center" : "flex-start",
          gap: `${responsiveFontSize * 0.16}px ${responsiveFontSize * 0.28}px`,
          lineHeight: 1.25,
          fontFamily,
        }}
      >
        {words.map((word, index) => {
          // Staggered frame per word
          const wordDelay = index * 4;
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
              words.length - 1,
              Math.floor(currentFrame / 6)
            );
            const isActive = index === activeIndex;
            const isPassed = index <= activeIndex;

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
            const opacity = interpolate(currentFrame - index * 3, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            wordStyle = {
              opacity,
              transform: `scale(${interpolate(currentFrame - index * 3, [0, 10], [0.95, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })})`,
            };
          }

          // Accent colors: highlight last word or keyword
          const isAccent = animation !== "highlight" && (index === words.length - 1 || index === 0 && words.length > 3);
          const color = isAccent ? brandColor : "#ffffff";

          return (
            <span
              key={`${word}-${index}`}
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

      {/* Modern Subtitle */}
      {subtitle && (
        <div
          style={{
            marginTop: isHorizontal ? 18 : 22,
            fontFamily,
          }}
        >
          {(() => {
            const subFrame = currentFrame - (words.length * 3 + 8);
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
  );
};
