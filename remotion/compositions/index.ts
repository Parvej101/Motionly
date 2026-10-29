import type { ComponentType } from "react";
import { CorporateStyle } from "./CorporateStyle";
import { FashionLuxuryStyle } from "./FashionLuxuryStyle";
import { KineticStyle } from "./KineticStyle";
import { MinimalStyle } from "./MinimalStyle";
import { SocialPromoStyle } from "./SocialPromoStyle";
import type { StyleId, VideoProps } from "../types";

export const STYLE_COMPONENTS: Record<StyleId, ComponentType<VideoProps>> = {
  minimal: MinimalStyle,
  kinetic: KineticStyle,
  fashion: FashionLuxuryStyle,
  social: SocialPromoStyle,
  corporate: CorporateStyle,
};

export { MinimalStyle, KineticStyle, FashionLuxuryStyle, SocialPromoStyle, CorporateStyle };
