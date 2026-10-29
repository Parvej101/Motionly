import { loadFont as loadHindSiliguri } from "@remotion/google-fonts/HindSiliguri";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNotoSansBengali } from "@remotion/google-fonts/NotoSansBengali";
import type { FontFamily } from "./types";

const weights = ["400", "600", "700"] as const;

loadNotoSansBengali("normal", {
  weights: [...weights],
  subsets: ["bengali", "latin", "latin-ext"],
});

loadHindSiliguri("normal", {
  weights: [...weights],
  subsets: ["bengali", "latin", "latin-ext"],
});

loadInter("normal", {
  weights: [...weights],
  subsets: ["latin", "latin-ext"],
});

export const FONT_STACKS: Record<FontFamily, string> = {
  NotoSansBengali: '"Noto Sans Bengali", "Hind Siliguri", sans-serif',
  HindSiliguri: '"Hind Siliguri", "Noto Sans Bengali", sans-serif',
  Inter: '"Inter", "Noto Sans Bengali", sans-serif',
};

export const getFontStack = (fontFamily: FontFamily | undefined) =>
  FONT_STACKS[fontFamily ?? "NotoSansBengali"] ?? FONT_STACKS.NotoSansBengali;
