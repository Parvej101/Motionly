import type { CSSProperties } from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";

type KenBurnsProps = {
  src: string | null;
  durationInFrames: number;
  index?: number;
  style?: CSSProperties;
  imageStyle?: CSSProperties;
  startScale?: number;
  endScale?: number;
  brightness?: number;
  saturation?: number;
  fallbackColor?: string;
};

const pans = [
  { x: -2.5, y: -1.5 },
  { x: 2.5, y: 1.5 },
  { x: -2, y: 2 },
  { x: 2, y: -2 },
];

export const KenBurns = ({
  src,
  durationInFrames,
  index = 0,
  style,
  imageStyle,
  startScale = 1.06,
  endScale = 1.16,
  brightness = 1,
  saturation = 1,
  fallbackColor = "#15151b",
}: KenBurnsProps) => {
  const frame = useCurrentFrame();
  const duration = Math.max(1, durationInFrames);
  const pan = pans[index % pans.length];
  const scale = interpolate(frame, [0, duration], [startScale, endScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(frame, [0, duration], [pan.x, -pan.x], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, duration], [pan.y, -pan.y], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: fallbackColor, ...style }}>
      {src ? (
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate3d(${translateX}%, ${translateY}%, 0) scale(${scale})`,
            filter: `brightness(${brightness}) saturate(${saturation})`,
            ...imageStyle,
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 30% 20%, ${fallbackColor}, #07070b 70%)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
