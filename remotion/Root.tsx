import type { CalculateMetadataFunction } from "remotion";
import { Composition } from "remotion";
import { UnifiedCanvasRenderer } from "./compositions/UnifiedCanvasRenderer";
import {
  ASPECT_DIMENSIONS,
  FPS,
  framesForSeconds,
  normalizeDuration,
  type VideoProps,
} from "./types";

const defaultProps: VideoProps = {
  images: [],
  headline: "Your story starts here",
  subtitle: "Add your own words, images, and brand color.",
  cta: "Learn more",
  brandName: "Motionly",
  brandColor: "#7c5cff",
  fontFamily: "NotoSansBengali",
  aspectRatio: "9:16",
  durationInSeconds: 8,
  watermark: true,
  styleId: "kinetic",
  layoutId: "split-left",
  textPosition: "center",
  textAnimation: "pop",
};

export const calculateVideoMetadata: CalculateMetadataFunction<VideoProps> = ({ props }) => {
  const dimensions = ASPECT_DIMENSIONS[props.aspectRatio] ?? ASPECT_DIMENSIONS["9:16"];
  return {
    width: dimensions.width,
    height: dimensions.height,
    fps: FPS,
    durationInFrames: framesForSeconds(normalizeDuration(props.durationInSeconds)),
  };
};

const compositionProps = {
  fps: FPS,
  width: ASPECT_DIMENSIONS["9:16"].width,
  height: ASPECT_DIMENSIONS["9:16"].height,
  durationInFrames: framesForSeconds(defaultProps.durationInSeconds),
  calculateMetadata: calculateVideoMetadata,
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="minimal"
        component={UnifiedCanvasRenderer}
        defaultProps={{ ...defaultProps, styleId: "minimal" }}
        {...compositionProps}
      />
      <Composition
        id="kinetic"
        component={UnifiedCanvasRenderer}
        defaultProps={{ ...defaultProps, styleId: "kinetic" }}
        {...compositionProps}
      />
      <Composition
        id="fashion"
        component={UnifiedCanvasRenderer}
        defaultProps={{ ...defaultProps, styleId: "fashion" }}
        {...compositionProps}
      />
      <Composition
        id="social"
        component={UnifiedCanvasRenderer}
        defaultProps={{ ...defaultProps, styleId: "social" }}
        {...compositionProps}
      />
      <Composition
        id="corporate"
        component={UnifiedCanvasRenderer}
        defaultProps={{ ...defaultProps, styleId: "corporate" }}
        {...compositionProps}
      />
    </>
  );
};
