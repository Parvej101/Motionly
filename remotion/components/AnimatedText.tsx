import type { CSSProperties } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

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
  style,
}: AnimatedTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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
