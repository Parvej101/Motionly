import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, useCurrentFrame } from "remotion";
import type { AdvancedMotionConfig } from "../types";

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
  advancedMotion?: AdvancedMotionConfig;
};

type CameraChoreography = {
  name: string;
  scaleStart: number;
  scaleEnd: number;
  panStartX: number; // in %
  panEndX: number;   // in %
  panStartY: number; // in %
  panEndY: number;   // in %
  tiltStart: number; // in deg
  tiltEnd: number;   // in deg
};

// 6 diverse cinematic camera motions so no consecutive scenes repeat the same motion
const cinematicMotions: CameraChoreography[] = [
  // Scene 0: Focus Push (Cinematic Dolly-In with gentle vertical lift)
  {
    name: "dolly_in",
    scaleStart: 1.05,
    scaleEnd: 1.23,
    panStartX: 0,
    panEndX: 0,
    panStartY: 2.2,
    panEndY: -2.2,
    tiltStart: -0.5,
    tiltEnd: 0.5,
  },
  // Scene 1: Dramatic Pull-Back Reveal (Zoom-out revealing wider frame + gentle sweep)
  {
    name: "reveal_out",
    scaleStart: 1.26,
    scaleEnd: 1.08,
    panStartX: 2.5,
    panEndX: -2.0,
    panStartY: -2.5,
    panEndY: 1.5,
    tiltStart: 0.7,
    tiltEnd: -0.4,
  },
  // Scene 2: Vertical Crane Rise (Smooth bottom-to-top sweep)
  {
    name: "crane_rise",
    scaleStart: 1.10,
    scaleEnd: 1.21,
    panStartX: -1.5,
    panEndX: 1.5,
    panStartY: 3.8,
    panEndY: -3.8,
    tiltStart: -0.6,
    tiltEnd: 0.6,
  },
  // Scene 3: Diagonal Cinematic Glide (Top-left to bottom-right drift)
  {
    name: "diagonal_sweep",
    scaleStart: 1.08,
    scaleEnd: 1.24,
    panStartX: -3.2,
    panEndX: 2.8,
    panStartY: -2.8,
    panEndY: 2.8,
    tiltStart: 0.6,
    tiltEnd: -0.8,
  },
  // Scene 4: Cinematic Arc / Orbital Pan (Curved motion around focal point)
  {
    name: "arc_pan",
    scaleStart: 1.14,
    scaleEnd: 1.22,
    panStartX: 2.8,
    panEndX: -2.8,
    panStartY: 2.0,
    panEndY: -1.5,
    tiltStart: -1.0,
    tiltEnd: 1.0,
  },
  // Scene 5: Hero Push-Up (Ground-up hero reveal)
  {
    name: "hero_lift",
    scaleStart: 1.06,
    scaleEnd: 1.25,
    panStartX: 1.2,
    panEndX: -1.2,
    panStartY: 3.2,
    panEndY: -2.2,
    tiltStart: 0.5,
    tiltEnd: -0.5,
  },
];

export const KenBurns = ({
  src,
  durationInFrames,
  index = 0,
  style,
  imageStyle,
  startScale,
  endScale,
  brightness = 1,
  saturation = 1,
  fallbackColor = "#15151b",
  advancedMotion,
}: KenBurnsProps) => {
  const frame = useCurrentFrame();
  const duration = Math.max(1, durationInFrames);

  // Pick camera motion tailored for this scene index
  const motion = cinematicMotions[index % cinematicMotions.length];

  // Smooth quadratic easing for natural camera movement
  const easeProgress = interpolate(frame, [0, duration], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const baseScale = interpolate(
    easeProgress,
    [0, 1],
    [startScale ?? motion.scaleStart, endScale ?? motion.scaleEnd],
  );
  const translateX = interpolate(easeProgress, [0, 1], [motion.panStartX, motion.panEndX]);
  const translateY = interpolate(easeProgress, [0, 1], [motion.panStartY, motion.panEndY]);
  const tilt = interpolate(easeProgress, [0, 1], [motion.tiltStart, motion.tiltEnd]);

  // Subtle organic handheld breathing so photos feel alive and natural
  const breathingX = Math.sin((frame + index * 24) / 32) * 0.35;
  const breathingY = Math.cos((frame + index * 24) / 26) * 0.35;

  // If an AI video was generated for this specific scene, play it!
  const aiVideoUrl = advancedMotion?.aiConfig?.generatedVideoUrls?.[index];

  // Parallax float calculations when advancedMotion is enabled
  const isParallax = Boolean(advancedMotion?.enabled);
  const parallaxStrength =
    advancedMotion?.parallaxStrength === "dramatic" ? 3.5 : advancedMotion?.parallaxStrength === "medium" ? 2.2 : 1.5;

  // Custom camera motion from Advance Edit configuration
  const zoomType = advancedMotion?.cameraZoom || "in";
  let dynamicScale = baseScale;
  if (isParallax) {
    if (zoomType === "in") {
      dynamicScale = interpolate(easeProgress, [0, 1], [1.02, 1.25 * (parallaxStrength / 1.5)]);
    } else if (zoomType === "out") {
      dynamicScale = interpolate(easeProgress, [0, 1], [1.25 * (parallaxStrength / 1.5), 1.02]);
    } else if (zoomType === "pan_left") {
      dynamicScale = 1.15;
    } else if (zoomType === "pan_right") {
      dynamicScale = 1.15;
    }
  }

  // Vivid 3D floating drift and camera pan
  const panMultiplier = isParallax ? (zoomType === "pan_left" ? -2.5 : zoomType === "pan_right" ? 2.5 : 1.8) : 1;
  const floatY = isParallax ? Math.sin((frame + index * 18) / 14) * 2.5 * parallaxStrength : 0;
  const floatX = isParallax ? Math.cos((frame + index * 18) / 18) * 2.0 * parallaxStrength : 0;
  const rotateDeg = isParallax
    ? tilt + Math.sin((frame + index * 20) / 28) * 1.5 * (parallaxStrength / 1.5)
    : tilt;

  // Combined translate in percentage for both X and Y
  const totalX = translateX * panMultiplier + breathingX + floatX;
  const totalY = translateY * (isParallax ? 1.8 : 1) + breathingY + floatY;

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: fallbackColor, ...style }}>
      {aiVideoUrl ? (
        <OffthreadVideo
          src={aiVideoUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `brightness(${brightness}) saturate(${saturation})`,
            ...imageStyle,
          }}
        />
      ) : src ? (
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate3d(${totalX}%, ${totalY}%, 0) scale(${dynamicScale}) rotate(${rotateDeg}deg)`,
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

      {/* Floating ambient particles for dramatic parallax */}
      {isParallax && advancedMotion?.ambientParticle && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(circle at ${50 + Math.sin(frame / 25) * 30}% ${
              40 + Math.cos(frame / 30) * 20
            }%, rgba(255,255,255,0.12) 0%, transparent 50%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
