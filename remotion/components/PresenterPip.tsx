import type { CSSProperties } from "react";
import { OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { withAlpha } from "../color";
import type { PresenterConfig } from "../types";

type PresenterPipProps = {
  presenter?: PresenterConfig;
  brandColor?: string;
};

export const PresenterPip = ({ presenter, brandColor = "#7c5cff" }: PresenterPipProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  if (!presenter || !presenter.enabled || !presenter.videoUrl) {
    return null;
  }

  const isHorizontal = width > height;
  const shape = presenter.shape || "circle";
  const size = presenter.size || "medium";
  const position = presenter.position || "bottom-right";

  // Calculate size relative to canvas
  const baseDim = isHorizontal ? 260 : 300;
  const sizeMultiplier = size === "small" ? 0.75 : size === "large" ? 1.3 : 1;
  const dimension = Math.round(baseDim * sizeMultiplier);
  const videoHeight = shape === "circle" ? dimension : Math.round(dimension * 1.25);

  // Entrance spring animation
  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 140 },
  });

  // Calculate exit animation if presenter recording duration is specified and shorter than the video
  const presenterFrames = presenter.durationInSeconds
    ? Math.round(presenter.durationInSeconds * fps)
    : undefined;
  const isShorterThanVideo = presenterFrames !== undefined && presenterFrames < durationInFrames;

  // Start exit 14 frames before the recording ends so it smoothly pops away
  const exitDuration = 14;
  const exitStartFrame = isShorterThanVideo
    ? Math.max(0, presenterFrames - exitDuration)
    : undefined;

  let exitScale = 1;
  let exitOpacity = 1;
  let exitTranslateY = 0;

  if (isShorterThanVideo && exitStartFrame !== undefined) {
    if (frame >= exitStartFrame + exitDuration) {
      // Recording has completely finished, do not render presenter anymore
      return null;
    }
    if (frame >= exitStartFrame) {
      const exitProgress = spring({
        frame: frame - exitStartFrame,
        fps,
        config: { damping: 12, mass: 0.6, stiffness: 180 },
      });
      // Pop up slightly then shrink away into the corner
      exitScale = interpolate(exitProgress, [0, 0.3, 1], [1, 1.08, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      exitOpacity = interpolate(exitProgress, [0, 0.8], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      exitTranslateY = interpolate(exitProgress, [0, 1], [0, 30], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
  }

  const floatY = Math.sin(frame / 25) * 4;

  const cornerOffset = isHorizontal ? 40 : 50;
  const combinedScale = entrance * exitScale;

  const containerStyle: CSSProperties = {
    position: "absolute",
    bottom: cornerOffset + 10,
    [position === "bottom-left" ? "left" : "right"]: cornerOffset,
    width: dimension,
    height: videoHeight,
    borderRadius: shape === "circle" ? "50%" : 28,
    overflow: "hidden",
    border: `3.5px solid ${brandColor}`,
    boxShadow: `0 16px 45px rgba(0, 0, 0, 0.65), 0 0 25px ${withAlpha(brandColor, 0.45)}`,
    zIndex: 50,
    transform: `scale(${combinedScale}) translateY(${floatY + exitTranslateY}px)`,
    transformOrigin: position === "bottom-left" ? "left bottom" : "right bottom",
    opacity: exitOpacity,
    backgroundColor: "#111116",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  };

  return (
    <div style={containerStyle}>
      <OffthreadVideo
        src={presenter.videoUrl}
        pauseWhenBuffering={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Glossy gradient rim */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          border: `1.5px solid rgba(255, 255, 255, 0.3)`,
          pointerEvents: "none",
        }}
      />

      {/* Presenter Live badge */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 8px",
          borderRadius: 999,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            boxShadow: "0 0 6px #22c55e",
            display: "inline-block",
            opacity: interpolate(frame % 30, [0, 15, 30], [1, 0.4, 1]),
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.8,
            color: "#ffffff",
            textTransform: "uppercase",
          }}
        >
          Live
        </span>
      </div>
    </div>
  );
};
