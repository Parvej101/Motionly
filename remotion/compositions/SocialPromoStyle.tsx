import { AbsoluteFill, Audio, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KenBurns } from "../components/KenBurns";
import { ModernKineticText } from "../components/ModernKineticText";
import { PresenterPip } from "../components/PresenterPip";
import { Transition } from "../components/Transition";
import { Watermark } from "../components/Watermark";
import { mix, withAlpha } from "../color";
import { getFontStack } from "../fonts";
import { buildScenes } from "../scenes";
import type { VideoProps } from "../types";

export const SocialPromoStyle = (props: VideoProps) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const scenes = buildScenes(props.images, durationInFrames);
  const horizontal = width > height;
  const fontFamily = getFontStack(props.fontFamily);
  const entrance = spring({ frame, fps, config: { damping: 16, mass: 0.8, stiffness: 120 } });
  const float = Math.sin(frame / 28) * 10;
  const hasSlideTexts = Boolean(props.slideTexts && props.slideTexts.length > 0);

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        overflow: "hidden",
        background: `linear-gradient(150deg, ${mix(props.brandColor, "#ffffff", 0.08)} 0%, ${props.brandColor} 40%, ${mix(props.brandColor, "#160019", 0.62)} 100%)`,
      }}
    >
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            top: -160 + float,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "42% 58% 63% 37% / 45% 38% 62% 55%",
            backgroundColor: withAlpha("#ffffff", 0.12),
            transform: `rotate(${frame / 6}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220 - float,
            left: -180,
            width: 560,
            height: 560,
            borderRadius: 999,
            border: `42px solid ${withAlpha("#ffffff", 0.1)}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: -60,
            width: 190,
            height: 190,
            borderRadius: 999,
            backgroundColor: withAlpha("#ffffff", 0.16),
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: horizontal ? "row" : "column",
          alignItems: "stretch",
          gap: horizontal ? 52 : 30,
          width: "100%",
          height: "100%",
          padding: horizontal ? 54 : 40,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: horizontal ? 0.95 : 1.15,
            minHeight: 0,
            borderRadius: 34,
            padding: horizontal ? 14 : 12,
            backgroundColor: "rgba(255,255,255,0.24)",
            border: "2px solid rgba(255,255,255,0.68)",
            boxShadow: "0 38px 80px rgba(18, 0, 16, 0.35)",
            transform: `translateY(${(1 - entrance) * 70 + float}px) rotate(${-3 + (1 - entrance) * 4}deg) scale(${0.86 + entrance * 0.14})`,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 24, overflow: "hidden", backgroundColor: "#1a0716" }}>
            {scenes.map((scene) => {
              const transitionDirections: Array<"none" | "right" | "up" | "left"> = ["none", "right", "up", "left"];
              const direction = transitionDirections[scene.index % transitionDirections.length];

              return (
                <Sequence key={`${scene.index}-${scene.from}`} from={scene.from} durationInFrames={scene.durationInFrames}>
                  <Transition
                    durationInFrames={scene.durationInFrames}
                    fadeIn={8}
                    fadeOut={8}
                    slide={direction === "none" ? 0 : 26}
                    direction={direction}
                  >
                    <KenBurns
                      src={scene.src}
                      durationInFrames={scene.durationInFrames}
                      index={scene.index}
                      advancedMotion={props.advancedMotion}
                    />
                  </Transition>
                </Sequence>
              );
            })}
            <div
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                padding: "10px 18px",
                borderRadius: 999,
                backgroundColor: "#ffffff",
                color: "#161018",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 2.2,
                textTransform: "uppercase",
              }}
            >
              {props.brandName || "Motionly"}
            </div>
            <div style={{ position: "absolute", bottom: 18, left: 20, right: 20, display: "flex", gap: 8 }}>
              {scenes.map((scene) => {
                const active = frame >= scene.from && frame < scene.from + scene.durationInFrames;
                return (
                  <div
                    key={scene.index}
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 999,
                      backgroundColor: active ? "#ffffff" : "rgba(255,255,255,0.36)",
                      transform: active ? "scaleY(1.4)" : "scaleY(1)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            flex: horizontal ? 1 : 0.82,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: horizontal ? 20 : 8,
            paddingLeft: horizontal ? 0 : 8,
          }}
        >
          {hasSlideTexts ? (
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
                  <ModernKineticText
                    headline={headline}
                    subtitle={subtitle}
                    cta={isLastScene ? props.cta : undefined}
                    brandColor="#ffffff"
                    fontFamily={fontFamily}
                    position={slide?.textPosition || props.textPosition || "center"}
                    animation={slide?.textAnimation || props.textAnimation || "pop"}
                    glassEffect={slide?.textGlassEffect ?? props.textGlassEffect}
                    durationInFrames={scene.durationInFrames}
                    maxWidth="100%"
                  />
                </Sequence>
              );
            })
          ) : (
            <ModernKineticText
              headline={props.headline}
              subtitle={props.subtitle}
              cta={props.cta}
              brandColor="#ffffff"
              fontFamily={fontFamily}
              position={props.textPosition || "center"}
              animation={props.textAnimation || "pop"}
              glassEffect={props.textGlassEffect}
              durationInFrames={durationInFrames}
              maxWidth="100%"
            />
          )}
        </div>
      </div>

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

      <Watermark visible={props.watermark} />
    </AbsoluteFill>
  );
};
