import type { ComponentType } from "react";
import { UnifiedCanvasRenderer } from "./UnifiedCanvasRenderer";
import type { StyleId, VideoProps } from "../types";

export const STYLE_COMPONENTS: Record<StyleId, ComponentType<VideoProps>> = {
  minimal: UnifiedCanvasRenderer,
  kinetic: UnifiedCanvasRenderer,
  fashion: UnifiedCanvasRenderer,
  social: UnifiedCanvasRenderer,
  corporate: UnifiedCanvasRenderer,
};

export { UnifiedCanvasRenderer };

