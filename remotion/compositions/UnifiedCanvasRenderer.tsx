import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { ImageStage } from "../components/ImageStage";
import { StyledTextBlock } from "../components/StyledTextBlock";
import { PresenterPip } from "../components/PresenterPip";
import { Watermark } from "../components/Watermark";
import { VectorMotionRenderer } from "../components/VectorMotionRenderer";
import { DeconstructedPartsRenderer } from "../components/DeconstructedPartsRenderer";
import { getFontStack } from "../fonts";
import { buildScenes } from "../scenes";
import { getTextTheme } from "../textThemes";
import { DEFAULT_LAYOUT_FOR_STYLE, type LayoutId, type StyleId, type VideoProps } from "../types";

export const UnifiedCanvasRenderer = (props: VideoProps) => {
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const horizontal = width > height;

  const scenes = buildScenes(props.images, durationInFrames);
  const fontFamily = getFontStack(props.fontFamily);
  const styleId: StyleId = props.styleId || "kinetic";
  const layoutId: LayoutId = props.layoutId || DEFAULT_LAYOUT_FOR_STYLE[styleId] || "fullscreen";
  const theme = getTextTheme(styleId, props.brandColor, fontFamily);

  const hasSlideTexts = Boolean(props.slideTexts && props.slideTexts.length > 0);

  // Common render helper for the text block across scenes
  const renderTextForLayout = (mode: "panel" | "overlay", compact = false) => {
    if (hasSlideTexts) {
      return scenes.map((scene) => {
        const slide = props.slideTexts?.[scene.index];
        const head = slide?.headline || "";
        const sub = slide?.subtitle || "";
        const isLast = scene.index === scenes.length - 1;

        if (!head && !sub && (!isLast || !props.cta)) {
          return null;
        }

        return (
          <Sequence
            key={`scene-text-${scene.index}`}
            from={scene.from}
            durationInFrames={scene.durationInFrames}
          >
            <StyledTextBlock
              headline={head}
              subtitle={sub}
              cta={isLast ? props.cta : undefined}
              theme={theme}
              brandColor={props.brandColor}
              brandName={props.brandName}
              fontFamily={fontFamily}
              animation={slide?.textAnimation || props.textAnimation || "pop"}
              position={slide?.textPosition || props.textPosition || (mode === "panel" ? "center" : "center")}
              mode={mode}
              glass={slide?.textGlassEffect ?? props.textGlassEffect ?? false}
              durationInFrames={scene.durationInFrames}
              sceneIndex={scene.index}
              sceneCount={scenes.length}
              exitFade={true}
              compact={compact}
            />
          </Sequence>
        );
      });
    }

    return (
      <StyledTextBlock
        headline={props.headline}
        subtitle={props.subtitle}
        cta={props.cta}
        theme={theme}
        brandColor={props.brandColor}
        brandName={props.brandName}
        fontFamily={fontFamily}
        animation={props.textAnimation || "pop"}
        position={props.textPosition || "center"}
        mode={mode}
        glass={props.textGlassEffect ?? false}
        durationInFrames={durationInFrames}
        compact={compact}
      />
    );
  };

  // Render the selected layout
  const renderLayoutContent = () => {
    switch (layoutId) {
      // 1. HERO SPLIT: IMAGE ON LEFT, TEXT ON RIGHT (OR TOP/BOTTOM ON VERTICAL)
      case "split-left": {
        return (
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: horizontal ? "row" : "column",
              backgroundColor: theme.isDark ? "#09090e" : "#f4f1ea",
            }}
          >
            {/* Image side */}
            <div
              style={{
                position: "relative",
                flex: horizontal ? 1.15 : 1,
                minHeight: 0,
                overflow: "hidden",
                boxShadow: horizontal ? "10px 0 40px rgba(0,0,0,0.3)" : "0 10px 40px rgba(0,0,0,0.3)",
                zIndex: 2,
              }}
            >
              <ImageStage
                scenes={scenes}
                wipeFrom={horizontal ? "right" : "bottom"}
                brandColor={props.brandColor}
                brightness={theme.isDark ? 0.88 : 0.96}
                advancedMotion={props.advancedMotion}
              />
              {/* Subtle gradient vignette to blend toward the text panel */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: horizontal
                    ? `linear-gradient(to right, transparent 75%, ${theme.isDark ? "rgba(9,9,14,0.4)" : "rgba(244,241,234,0.4)"} 100%)`
                    : `linear-gradient(to bottom, transparent 75%, ${theme.isDark ? "rgba(9,9,14,0.4)" : "rgba(244,241,234,0.4)"} 100%)`,
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Text side */}
            <div
              style={{
                position: "relative",
                flex: horizontal ? 1 : 1,
                minHeight: 0,
                background: theme.panelBackground,
                overflow: "hidden",
                zIndex: 1,
              }}
            >
              {theme.panelPattern ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: theme.panelPattern,
                    backgroundSize: "72px 72px",
                    opacity: 0.6,
                    pointerEvents: "none",
                  }}
                />
              ) : null}
              {renderTextForLayout("panel", !horizontal)}
            </div>
          </AbsoluteFill>
        );
      }

      // 2. HERO SPLIT: TEXT ON LEFT, IMAGE ON RIGHT (OR REVERSED ON VERTICAL)
      case "split-right": {
        return (
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: horizontal ? "row" : "column",
              backgroundColor: theme.isDark ? "#09090e" : "#f4f1ea",
            }}
          >
            {/* Text side (comes first) */}
            <div
              style={{
                position: "relative",
                flex: horizontal ? 1 : 1,
                minHeight: 0,
                background: theme.panelBackground,
                overflow: "hidden",
                zIndex: 1,
                order: horizontal ? 1 : 2,
              }}
            >
              {theme.panelPattern ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: theme.panelPattern,
                    backgroundSize: "72px 72px",
                    opacity: 0.6,
                    pointerEvents: "none",
                  }}
                />
              ) : null}
              {renderTextForLayout("panel", !horizontal)}
            </div>

            {/* Image side */}
            <div
              style={{
                position: "relative",
                flex: horizontal ? 1.15 : 1,
                minHeight: 0,
                overflow: "hidden",
                boxShadow: horizontal ? "-10px 0 40px rgba(0,0,0,0.3)" : "0 -10px 40px rgba(0,0,0,0.3)",
                zIndex: 2,
                order: horizontal ? 2 : 1,
              }}
            >
              <ImageStage
                scenes={scenes}
                wipeFrom={horizontal ? "left" : "bottom"}
                brandColor={props.brandColor}
                brightness={theme.isDark ? 0.88 : 0.96}
                advancedMotion={props.advancedMotion}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: horizontal
                    ? `linear-gradient(to left, transparent 75%, ${theme.isDark ? "rgba(9,9,14,0.4)" : "rgba(244,241,234,0.4)"} 100%)`
                    : `linear-gradient(to bottom, transparent 75%, ${theme.isDark ? "rgba(9,9,14,0.4)" : "rgba(244,241,234,0.4)"} 100%)`,
                  pointerEvents: "none",
                }}
              />
            </div>
          </AbsoluteFill>
        );
      }

      // 3. FRAMED CARD: Hero product card floating on a curated background
      case "framed": {
        return (
          <AbsoluteFill
            style={{
              background: theme.panelBackground,
              display: "flex",
              flexDirection: horizontal ? "row" : "column",
              padding: horizontal ? "56px 64px" : "48px 36px",
              boxSizing: "border-box",
              gap: horizontal ? 56 : 36,
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {/* The Floating Image Frame */}
            <div
              style={{
                position: "relative",
                flex: horizontal ? 1.1 : 1.1,
                width: horizontal ? "auto" : "100%",
                height: horizontal ? "86%" : "auto",
                minHeight: 0,
                borderRadius: horizontal ? 36 : 28,
                overflow: "hidden",
                boxShadow: `0 35px 80px rgba(0,0,0,0.45), 0 0 0 2px rgba(255,255,255,0.18)`,
                transform: `rotate(${horizontal ? -2 : 0}deg)`,
                backgroundColor: "#111116",
              }}
            >
              <ImageStage
                scenes={scenes}
                wipeFrom="left"
                brandColor={props.brandColor}
                brightness={0.92}
                advancedMotion={props.advancedMotion}
              />
            </div>

            {/* Text side beside the floating card */}
            <div
              style={{
                position: "relative",
                flex: horizontal ? 1 : 0.9,
                width: horizontal ? "auto" : "100%",
                height: horizontal ? "100%" : "auto",
                minHeight: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {renderTextForLayout("panel", true)}
            </div>
          </AbsoluteFill>
        );
      }

      // 4. MAGAZINE BAND: Bottom or side solid text band sliding across full image
      case "band": {
        const bandHeight = horizontal ? "42%" : "38%";
        return (
          <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#060609" }}>
            <ImageStage
              scenes={scenes}
              wipeFrom="right"
              brandColor={props.brandColor}
              brightness={0.88}
              advancedMotion={props.advancedMotion}
            />
            {/* Magazine Solid Bottom Band */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: bandHeight,
                background: theme.panelBackground,
                boxShadow: "0 -20px 60px rgba(0,0,0,0.55)",
                borderTop: `4px solid ${props.brandColor}`,
                zIndex: 10,
                overflow: "hidden",
              }}
            >
              {renderTextForLayout("panel", true)}
            </div>
          </AbsoluteFill>
        );
      }

      // 5. DIAGONAL CUT: Sharp angled architectural cut dividing image & text
      case "diagonal": {
        return (
          <AbsoluteFill style={{ backgroundColor: theme.isDark ? "#09090e" : "#f4f1ea", overflow: "hidden" }}>
            {/* Background image stage */}
            <AbsoluteFill>
              <ImageStage
                scenes={scenes}
                wipeFrom="fade"
                brandColor={props.brandColor}
                brightness={theme.isDark ? 0.8 : 0.92}
                advancedMotion={props.advancedMotion}
              />
            </AbsoluteFill>

            {/* Angled polygon panel */}
            <AbsoluteFill
              style={{
                background: theme.panelBackground,
                clipPath: horizontal
                  ? "polygon(48% 0%, 100% 0%, 100% 100%, 36% 100%)"
                  : "polygon(0% 48%, 100% 38%, 100% 100%, 0% 100%)",
                zIndex: 5,
              }}
            />

            {/* Accent divider line */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 6,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: horizontal ? 6 : "100%",
                  height: horizontal ? "100%" : 6,
                  left: horizontal ? "48%" : 0,
                  top: horizontal ? 0 : "48%",
                  backgroundColor: props.brandColor,
                  boxShadow: `0 0 20px ${props.brandColor}`,
                  transform: horizontal ? "skewX(-7deg)" : "skewY(-6deg)",
                  transformOrigin: "top left",
                }}
              />
            </div>

            {/* Text positioned over the angled panel */}
            <div
              style={{
                position: "absolute",
                top: horizontal ? 0 : "46%",
                left: horizontal ? "46%" : 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
              }}
            >
              {renderTextForLayout("panel", true)}
            </div>
          </AbsoluteFill>
        );
      }

      // 6. FULL SCREEN OVERLAY: Full-bleed image with kinetic floating text
      case "fullscreen":
      default: {
        return (
          <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#060609" }}>
            <ImageStage
              scenes={scenes}
              wipeFrom="right"
              brandColor={props.brandColor}
              brightness={0.46}
              advancedMotion={props.advancedMotion}
            />
            {/* Cinematic Gradient Vignettes */}
            <AbsoluteFill
              style={{
                background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(6,6,9,0.85) 100%)`,
                pointerEvents: "none",
              }}
            />
            <AbsoluteFill
              style={{
                background: `linear-gradient(180deg, rgba(6,6,9,0.65) 0%, transparent 25%, transparent 75%, rgba(6,6,9,0.85) 100%)`,
                pointerEvents: "none",
              }}
            />
            {renderTextForLayout("overlay", false)}
          </AbsoluteFill>
        );
      }
    }
  };

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {renderLayoutContent()}

      {/* Dynamic Vector Motion Overlays */}
      <VectorMotionRenderer
        overlays={props.advancedMotion?.vectorOverlays}
        brandColor={props.brandColor}
      />

      {/* AI Multi-Part Motion Decomposition Renderer */}
      <DeconstructedPartsRenderer
        parts={props.advancedMotion?.deconstructedParts}
        brandColor={props.brandColor}
      />

      {/* Picture-in-Picture Presenter Video (Loom / Course Style) */}
      <PresenterPip presenter={props.presenter} brandColor={props.brandColor} />

      {/* Synchronized Audio */}
      {props.audio?.audioUrl ? (
        <Audio
          src={props.audio.audioUrl}
          volume={props.audio.volume ?? 1}
          loop={props.audio.loop ?? true}
          startFrom={Math.round((props.audio.startFromSeconds ?? 0) * fps)}
          endAt={
            props.audio.endAtSeconds && props.audio.endAtSeconds > (props.audio.startFromSeconds ?? 0)
              ? Math.round(props.audio.endAtSeconds * fps)
              : undefined
          }
        />
      ) : null}

      <Watermark visible={props.watermark} />
    </AbsoluteFill>
  );
};
