import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

type TransitionProps = {
  children: ReactNode;
  durationInFrames: number;
  fadeIn?: number;
  fadeOut?: number;
  slide?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  style?: CSSProperties;
};

export const Transition = ({
  children,
  durationInFrames,
  fadeIn = 10,
  fadeOut = 10,
  slide = 0,
  direction = "none",
  style,
}: TransitionProps) => {
  const frame = useCurrentFrame();
  const duration = Math.max(1, durationInFrames);
  const inFrames = Math.min(Math.max(0, fadeIn), duration);
  const outFrames = Math.min(Math.max(0, fadeOut), duration);

  const fadeInOpacity =
    inFrames > 0
      ? interpolate(frame, [0, inFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const fadeOutStart = Math.max(0, duration - outFrames);
  const fadeOutOpacity =
    outFrames > 0
      ? interpolate(frame, [fadeOutStart, duration], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

  const enter =
    inFrames > 0
      ? interpolate(frame, [0, inFrames], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  const exit =
    outFrames > 0
      ? interpolate(frame, [fadeOutStart, duration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  const offset = (enter + exit) * slide;
  const x = direction === "left" ? -offset : direction === "right" ? offset : 0;
  const y = direction === "up" ? -offset : direction === "down" ? offset : 0;

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
