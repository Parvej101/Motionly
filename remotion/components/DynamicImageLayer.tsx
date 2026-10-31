import React from "react";
import { Img, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import type { AdvancedMotionConfig } from "../types";

export interface DynamicImageLayerProps {
  src: string;
  advancedMotion?: AdvancedMotionConfig;
  sceneIndex?: number;
  durationInFrames: number;
}

export const DynamicImageLayer: React.FC<DynamicImageLayerProps> = ({
  src,
  advancedMotion,
  sceneIndex = 0,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // If AI video has been generated for this scene, play the AI video!
  const aiVideoUrl = advancedMotion?.aiConfig?.generatedVideoUrls?.[sceneIndex];
  if (aiVideoUrl) {
    return (
      <OffthreadVideo
        src={aiVideoUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  }

  // If Advanced Motion is NOT enabled, render standard image
  if (!advancedMotion?.enabled) {
    return (
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  }

  // --- FREE 2.5D PARALLAX & DYNAMIC MOTION ENGINE ---
  const strengthMultiplier =
    advancedMotion.parallaxStrength === "dramatic" ? 1.8 : advancedMotion.parallaxStrength === "medium" ? 1.3 : 1.0;

  // Cinematic Camera Zoom & Drift
  const zoomType = advancedMotion.cameraZoom || "in";
  let scale = 1;
  let translateX = 0;
  const translateY = 0;

  if (zoomType === "in") {
    scale = interpolate(frame, [0, durationInFrames], [1.02, 1.14 * strengthMultiplier], {
      extrapolateRight: "clamp",
    });
  } else if (zoomType === "out") {
    scale = interpolate(frame, [0, durationInFrames], [1.14 * strengthMultiplier, 1.02], {
      extrapolateRight: "clamp",
    });
  } else if (zoomType === "pan_left") {
    scale = 1.08;
    translateX = interpolate(frame, [0, durationInFrames], [20 * strengthMultiplier, -20 * strengthMultiplier]);
  } else if (zoomType === "pan_right") {
    scale = 1.08;
    translateX = interpolate(frame, [0, durationInFrames], [-20 * strengthMultiplier, 20 * strengthMultiplier]);
  }

  // Subtle natural organic breathing/floating motion
  const organicFloatY = Math.sin((frame + sceneIndex * 15) / 22) * 6 * strengthMultiplier;
  const organicFloatX = Math.cos((frame + sceneIndex * 15) / 30) * 4 * strengthMultiplier;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 2.5D Deep Motion Layer */}
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${translateX + organicFloatX}px, ${translateY + organicFloatY}px)`,
          transition: "transform 0.05s linear",
          willChange: "transform",
        }}
      />

      {/* Dynamic Ambient Light Sweep / Vignette Glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.08) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Optional Ambient Particles */}
      {advancedMotion.ambientParticle && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(circle at ${40 + Math.sin(frame / 20) * 20}% ${
              30 + Math.cos(frame / 25) * 15
            }%, rgba(255, 255, 255, 0.15) 0%, transparent 40%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
};
