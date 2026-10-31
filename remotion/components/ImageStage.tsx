import type { CSSProperties } from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from "remotion";
import { KenBurns } from "./KenBurns";
import type { Scene } from "../scenes";
import type { AdvancedMotionConfig } from "../types";

export type WipeFrom = "left" | "right" | "top" | "bottom" | "fade";

type ImageStageProps = {
  scenes: Scene[];
  wipeFrom: WipeFrom;
  brandColor: string;
  brightness?: number;
  advancedMotion?: AdvancedMotionConfig;
  /** Frames each scene keeps rendering under the next one while it wipes in. */
  overlap?: number;
};

const WIPE_FRAMES = 20;

const SceneLayer = ({
  scene,
  wipeFrom,
  brandColor,
  brightness,
  advancedMotion,
  totalFrames,
}: {
  scene: Scene;
  wipeFrom: WipeFrom;
  brandColor: string;
  brightness: number;
  advancedMotion?: AdvancedMotionConfig;
  totalFrames: number;
}) => {
  const frame = useCurrentFrame();
  const first = scene.index === 0;
  const p = first
    ? 1
    : interpolate(frame, [0, WIPE_FRAMES], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.65, 0, 0.35, 1),
      });
  const hidden = `${(1 - p) * 100}%`;

  let clipPath: string | undefined;
  let edge: CSSProperties | null = null;
  const edgeVisible = !first && p > 0 && p < 1;
  switch (wipeFrom) {
    case "left":
      clipPath = `inset(0 ${hidden} 0 0)`;
      edge = { top: 0, bottom: 0, width: 8, left: `calc(${p * 100}% - 4px)` };
      break;
    case "right":
      clipPath = `inset(0 0 0 ${hidden})`;
      edge = { top: 0, bottom: 0, width: 8, left: `calc(${(1 - p) * 100}% - 4px)` };
      break;
    case "top":
      clipPath = `inset(0 0 ${hidden} 0)`;
      edge = { left: 0, right: 0, height: 8, top: `calc(${p * 100}% - 4px)` };
      break;
    case "bottom":
      clipPath = `inset(${hidden} 0 0 0)`;
      edge = { left: 0, right: 0, height: 8, top: `calc(${(1 - p) * 100}% - 4px)` };
      break;
    default:
      clipPath = undefined;
  }

  return (
    <AbsoluteFill style={{ zIndex: scene.index + 1 }}>
      <AbsoluteFill
        style={{
          clipPath,
          opacity: wipeFrom === "fade" ? p : 1,
          transform: `scale(${1 + (1 - p) * 0.06})`,
        }}
      >
        <KenBurns
          src={scene.src}
          durationInFrames={totalFrames}
          index={scene.index}
          brightness={brightness}
          advancedMotion={advancedMotion}
        />
      </AbsoluteFill>
      {edge && edgeVisible ? (
        <div
          style={{
            position: "absolute",
            ...edge,
            backgroundColor: brandColor,
            boxShadow: `0 0 24px ${brandColor}`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Renders the image slideshow with hero-slider style wipes inside any container. */
export const ImageStage = ({
  scenes,
  wipeFrom,
  brandColor,
  brightness = 1,
  advancedMotion,
  overlap = WIPE_FRAMES + 2,
}: ImageStageProps) => {
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#111116" }}>
      {scenes.map((scene, i) => {
        const isLast = i === scenes.length - 1;
        const total = scene.durationInFrames + (isLast ? 0 : overlap);
        return (
          <Sequence key={`${scene.index}-${scene.from}`} from={scene.from} durationInFrames={total}>
            <SceneLayer
              scene={scene}
              wipeFrom={wipeFrom}
              brandColor={brandColor}
              brightness={brightness}
              advancedMotion={advancedMotion}
              totalFrames={total}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
