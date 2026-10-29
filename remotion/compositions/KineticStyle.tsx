import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { KenBurns } from "../components/KenBurns";
import { ModernKineticText } from "../components/ModernKineticText";
import { PresenterPip } from "../components/PresenterPip";
import { Transition } from "../components/Transition";
import { Watermark } from "../components/Watermark";
import { withAlpha } from "../color";
import { getFontStack } from "../fonts";
import { buildScenes } from "../scenes";
import type { VideoProps } from "../types";

export const KineticStyle = (props: VideoProps) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const scenes = buildScenes(props.images, durationInFrames);
  const isHorizontal = width > height;
  const fontFamily = getFontStack(props.fontFamily);
  const hasSlideTexts = Boolean(props.slideTexts && props.slideTexts.length > 0);

  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#060609", fontFamily, overflow: "hidden" }}>
      {/* Background Images with smooth Ken Burns & Transitions */}
      {scenes.map((scene) => (
        <Sequence key={`${scene.index}-${scene.from}`} from={scene.from} durationInFrames={scene.durationInFrames}>
          <Transition durationInFrames={scene.durationInFrames} fadeIn={8} fadeOut={10} slide={28} direction="up">
            <KenBurns
              src={scene.src}
              durationInFrames={scene.durationInFrames}
              index={scene.index}
              brightness={0.42}
              saturation={0.85}
              endScale={1.24}
            />
          </Transition>
        </Sequence>
      ))}

      {/* Modern Cinematic Vignette & Gradient Overlays */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.15) 0%, rgba(6,6,9,0.85) 100%)`,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(6,6,9,0.7) 0%, transparent 22%, transparent 75%, rgba(6,6,9,0.9) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* Subtle Ambient Color Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "25%",
          width: 500,
          height: 500,
          borderRadius: 999,
          background: `radial-gradient(circle, ${withAlpha(props.brandColor, 0.18)} 0%, transparent 70%)`,
          filter: "blur(60px)",
          pointerEvents: "none",
          transform: `scale(${1 + Math.sin(frame / 30) * 0.1})`,
        }}
      />

      {/* Top Header: Brand Name Badge */}
      <div
        style={{
          position: "absolute",
          top: isHorizontal ? 36 : 48,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 18px",
            borderRadius: 999,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              backgroundColor: props.brandColor,
              transform: "rotate(45deg)",
            }}
          />
          <span
            style={{
              fontSize: isHorizontal ? 16 : 18,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.9)",
            }}
          >
            {props.brandName || "Motionly"}
          </span>
        </div>
      </div>

      {/* Dynamic Animated Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isHorizontal ? "70px 50px" : "90px 32px",
          boxSizing: "border-box",
        }}
      >
        {hasSlideTexts ? (
          // Scene-by-Scene synced text mode
          scenes.map((scene) => {
            const slide = props.slideTexts?.[scene.index];
            const headline = slide?.headline || "";
            const subtitle = slide?.subtitle || "";
            const isLastScene = scene.index === scenes.length - 1;

            if (!headline && !subtitle && (!isLastScene || !props.cta)) {
              return null;
            }

            return (
              <Sequence
                key={`text-${scene.index}`}
                from={scene.from}
                durationInFrames={scene.durationInFrames}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ModernKineticText
                    headline={headline}
                    subtitle={subtitle}
                    cta={isLastScene ? props.cta : undefined}
                    brandColor={props.brandColor}
                    fontFamily={fontFamily}
                    position={slide?.textPosition || props.textPosition || "center"}
                    animation={slide?.textAnimation || props.textAnimation || "pop"}
                    durationInFrames={scene.durationInFrames}
                  />
                </div>
              </Sequence>
            );
          })
        ) : (
          // Global dynamic text mode with modern word-by-word punch
          <ModernKineticText
            headline={props.headline}
            subtitle={props.subtitle}
            cta={props.cta}
            brandColor={props.brandColor}
            fontFamily={fontFamily}
            position={props.textPosition || "center"}
            animation={props.textAnimation || "pop"}
            durationInFrames={durationInFrames}
          />
        )}
      </AbsoluteFill>

      {/* Picture-in-Picture Presenter Video (Course / Loom Style) */}
      <PresenterPip presenter={props.presenter} brandColor={props.brandColor} />

      {/* Synchronized Audio (Voiceover / Background Track) */}
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

      {/* Bottom Progress Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: props.brandColor,
            boxShadow: `0 0 12px ${props.brandColor}`,
          }}
        />
      </div>

      <Watermark visible={props.watermark} />
    </AbsoluteFill>
  );
};
