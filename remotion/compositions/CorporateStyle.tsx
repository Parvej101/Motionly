import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { KenBurns } from "../components/KenBurns";
import { PresenterPip } from "../components/PresenterPip";
import { Transition } from "../components/Transition";
import { Watermark } from "../components/Watermark";
import { mix, readableOn, withAlpha } from "../color";
import { getFontStack } from "../fonts";
import { buildScenes } from "../scenes";
import type { VideoProps } from "../types";

export const CorporateStyle = (props: VideoProps) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const scenes = buildScenes(props.images, durationInFrames);
  const horizontal = width > height;
  const fontFamily = getFontStack(props.fontFamily);
  const hasSlideTexts = Boolean(props.slideTexts && props.slideTexts.length > 0);
  const headlineLength = props.headline?.length ?? 0;
  const baseSize = horizontal ? 82 : 70;
  const headlineSize = Math.max(38, Math.min(baseSize, baseSize - Math.max(0, headlineLength - 32) * 1.15));
  const lineWidth = interpolate(frame, [0, 30], [0, horizontal ? 190 : 150], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#eef2f7", color: "#0f172a", fontFamily }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 8% 8%, ${withAlpha(props.brandColor, 0.14)}, transparent 38%), linear-gradient(135deg, #f8fafc 0%, #e8eef6 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.045) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.75), transparent 92%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: horizontal ? "row" : "column",
          gap: horizontal ? 58 : 30,
          width: "100%",
          height: "100%",
          padding: horizontal ? 58 : 42,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flex: horizontal ? 1.05 : 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            order: horizontal ? 0 : 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: horizontal ? 44 : 20 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: props.brandColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: "#ffffff" }} />
            </div>
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: 3.2, textTransform: "uppercase", color: "#334155" }}>
              {props.brandName || "Motionly"}
            </span>
          </div>

          {hasSlideTexts ? (
            scenes.map((scene) => {
              const slide = props.slideTexts?.[scene.index];
              const headline = slide?.headline || "";
              const subtitle = slide?.subtitle || "";
              const isLastScene = scene.index === scenes.length - 1;
              if (!headline && !subtitle && (!isLastScene || !props.cta)) {
                return null;
              }

              const slideHeadlineSize = Math.max(38, Math.min(baseSize, baseSize - Math.max(0, headline.length - 32) * 1.15));

              return (
                <Sequence key={`text-${scene.index}`} from={scene.from} durationInFrames={scene.durationInFrames}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}>
                    <div style={{ width: lineWidth, height: 6, borderRadius: 999, backgroundColor: props.brandColor, marginBottom: 24 }} />
                    {headline ? (
                      <AnimatedText
                        text={headline}
                        delay={4}
                        fontSize={slideHeadlineSize}
                        fontWeight={700}
                        color="#0f172a"
                        fontFamily={fontFamily}
                        lineHeight={1.1}
                        letterSpacing={-1.2}
                        maxWidth={horizontal ? 760 : "100%"}
                        animation={slide?.textAnimation || props.textAnimation}
                        brandColor={props.brandColor}
                        durationInFrames={scene.durationInFrames}
                      />
                    ) : null}
                    {subtitle ? (
                      <AnimatedText
                        text={subtitle}
                        delay={14}
                        fontSize={horizontal ? 29 : 30}
                        fontWeight={400}
                        color="#475569"
                        fontFamily={fontFamily}
                        lineHeight={1.48}
                        maxWidth={horizontal ? 680 : "96%"}
                        style={{ marginTop: 22 }}
                      />
                    ) : null}

                    {isLastScene && props.cta ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 34 }}>
                        <AnimatedText
                          text={props.cta}
                          delay={20}
                          fontSize={horizontal ? 23 : 25}
                          fontWeight={700}
                          color={readableOn(props.brandColor)}
                          fontFamily={fontFamily}
                          letterSpacing={0.8}
                          align="center"
                          style={{
                            display: "inline-block",
                            padding: "16px 30px",
                            borderRadius: 10,
                            backgroundColor: props.brandColor,
                            boxShadow: `0 14px 34px ${withAlpha(props.brandColor, 0.3)}`,
                          }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: props.brandColor }} />
                          <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: withAlpha(props.brandColor, 0.42) }} />
                          <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: withAlpha(props.brandColor, 0.18) }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Sequence>
              );
            })
          ) : (
            <>
              <div style={{ width: lineWidth, height: 6, borderRadius: 999, backgroundColor: props.brandColor, marginBottom: 24 }} />
              <AnimatedText
                text={props.headline}
                delay={4}
                fontSize={headlineSize}
                fontWeight={700}
                color="#0f172a"
                fontFamily={fontFamily}
                lineHeight={1.1}
                letterSpacing={-1.2}
                maxWidth={horizontal ? 760 : "100%"}
                animation={props.textAnimation}
                brandColor={props.brandColor}
                durationInFrames={durationInFrames}
              />
              {props.subtitle ? (
                <AnimatedText
                  text={props.subtitle}
                  delay={16}
                  fontSize={horizontal ? 29 : 30}
                  fontWeight={400}
                  color="#475569"
                  fontFamily={fontFamily}
                  lineHeight={1.48}
                  maxWidth={horizontal ? 680 : "96%"}
                  style={{ marginTop: 22 }}
                />
              ) : null}

              <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 34 }}>
                {props.cta ? (
                  <AnimatedText
                    text={props.cta}
                    delay={26}
                    fontSize={horizontal ? 23 : 25}
                    fontWeight={700}
                    color={readableOn(props.brandColor)}
                    fontFamily={fontFamily}
                    letterSpacing={0.8}
                    align="center"
                    style={{
                      display: "inline-block",
                      padding: "16px 30px",
                      borderRadius: 10,
                      backgroundColor: props.brandColor,
                      boxShadow: `0 14px 34px ${withAlpha(props.brandColor, 0.3)}`,
                    }}
                  />
                ) : null}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: props.brandColor }} />
                  <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: withAlpha(props.brandColor, 0.42) }} />
                  <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: withAlpha(props.brandColor, 0.18) }} />
                </div>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            position: "relative",
            flex: horizontal ? 1 : 1.05,
            minHeight: 0,
            order: horizontal ? 1 : 1,
            borderRadius: 26,
            overflow: "hidden",
            backgroundColor: mix(props.brandColor, "#0f172a", 0.7),
            boxShadow: "0 34px 80px rgba(15, 23, 42, 0.22)",
            border: "1px solid rgba(255,255,255,0.65)",
          }}
        >
          {scenes.map((scene) => (
            <Sequence key={`${scene.index}-${scene.from}`} from={scene.from} durationInFrames={scene.durationInFrames}>
              <Transition durationInFrames={scene.durationInFrames} fadeIn={scene.index === 0 ? 0 : 12} fadeOut={scene.index === scenes.length - 1 ? 0 : 12}>
                <KenBurns
                  src={scene.src}
                  durationInFrames={scene.durationInFrames}
                  index={scene.index}
                  endScale={1.14}
                  brightness={0.94}
                  advancedMotion={props.advancedMotion}
                />
              </Transition>
            </Sequence>
          ))}

          <AbsoluteFill
            style={{
              background: `linear-gradient(180deg, ${withAlpha(props.brandColor, 0.12)} 0%, transparent 34%, rgba(4, 12, 28, 0.5) 100%)`,
            }}
          />
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: 88, height: 3, backgroundColor: props.brandColor, borderRadius: 999, marginBottom: 12 }} />
              <span style={{ fontSize: 17, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.82)", fontWeight: 600 }}>
                {props.aspectRatio}
              </span>
            </div>
            <div style={{ padding: "9px 14px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.88)", color: "#0f172a", fontSize: 17, fontWeight: 700, letterSpacing: 1.4 }}>
              {String(scenes.length).padStart(2, "0")} scenes
            </div>
          </div>
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
