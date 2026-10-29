import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { TextAnimation } from "../types";

type AnimatedTextProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  fontFamily?: string;
  letterSpacing?: number;
  lineHeight?: number;
  align?: CSSProperties["textAlign"];
  uppercase?: boolean;
  maxWidth?: number | string;
  enterFrom?: "bottom" | "top" | "left" | "right" | "none";
  animation?: TextAnimation;
  brandColor?: string;
  durationInFrames?: number;
  style?: CSSProperties;
};

export const AnimatedText = ({
  text,
  delay = 0,
  fontSize = 72,
  fontWeight = 700,
  color = "#ffffff",
  fontFamily = "sans-serif",
  letterSpacing = -0.5,
  lineHeight = 1.15,
  align = "left",
  uppercase = false,
  maxWidth = "100%",
  enterFrom = "bottom",
  animation,
  brandColor,
  durationInFrames,
  style,
}: AnimatedTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (animation === "typewriter") {
    const chars = Array.from(text || "");
    const activeFrame = Math.max(0, frame - delay);
    const availableFrames = durationInFrames ? Math.max(20, durationInFrames * 0.65) : 40;
    const typingDuration = Math.min(availableFrames, Math.max(16, chars.length * 1.3));
    const charIndex = Math.min(chars.length, Math.floor((activeFrame / typingDuration) * chars.length));
    const visibleText = chars.slice(0, charIndex).join("");
    const isTyping = charIndex < chars.length;
    const showCursor = isTyping || (Math.floor(frame / 12) % 2 === 0);

    return (
      <div
        style={{
          color,
          fontFamily,
          fontSize,
          fontWeight,
          letterSpacing,
          lineHeight,
          textAlign: align,
          textTransform: uppercase ? "uppercase" : "none",
          maxWidth,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          ...style,
        }}
      >
        <span>{visibleText}</span>
        <span
          style={{
            display: "inline-block",
            width: Math.max(2, Math.round(fontSize * 0.05)),
            height: "0.85em",
            backgroundColor: brandColor || color,
            marginLeft: "4px",
            verticalAlign: "middle",
            borderRadius: "2px",
            opacity: showCursor ? 1 : 0,
            boxShadow: `0 0 10px ${brandColor || color}`,
          }}
        />
      </div>
    );
  }
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.8, stiffness: 110 },
  });
  const distance = (1 - progress) * 36;
  const offsetX = enterFrom === "left" ? -distance : enterFrom === "right" ? distance : 0;
  const offsetY = enterFrom === "top" ? -distance : enterFrom === "bottom" ? distance : 0;
  const opacity = interpolate(progress, [0, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        color,
        fontFamily,
        fontSize,
        fontWeight,
        letterSpacing,
        lineHeight,
        textAlign: align,
        textTransform: uppercase ? "uppercase" : "none",
        maxWidth,
        opacity,
        transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${0.97 + progress * 0.03})`,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        textWrap: "balance",
        ...style,
      }}
    >
      {text}
    </div>
  );
};
