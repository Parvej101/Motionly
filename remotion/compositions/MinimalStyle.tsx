import { AbsoluteFill, Audio, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { KenBurns } from "../components/KenBurns";
import { PresenterPip } from "../components/PresenterPip";
import { Transition } from "../components/Transition";
import { Watermark } from "../components/Watermark";
import { readableOn, withAlpha } from "../color";
import { getFontStack } from "../fonts";
import { buildScenes } from "../scenes";
import type { VideoProps } from "../types";

export const MinimalStyle = (props: VideoProps) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();
  const scenes = buildScenes(props.images, durationInFrames);
  const horizontal = width > height;
  const fontFamily = getFontStack(props.fontFamily);
  const hasSlideTexts = Boolean(props.slideTexts && props.slideTexts.length > 0);
  const headlineLength = props.headline?.length ?? 0;
  const baseSize = horizontal ? 92 : 78;
  const headlineSize = Math.max(42, Math.min(baseSize, baseSize - Math.max(0, headlineLength - 34) * 1.1));
  const lineWidth = interpolate(frame, [0, 34], [0, horizontal ? 150 : 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#f4f1ea", color: "#141416", fontFamily }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 82% 12%, rgba(194, 184, 163, 0.4), transparent 42%), linear-gradient(160deg, #f8f6f1 0%, #ece7dd 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: horizontal ? "row" : "column",
          gap: horizontal ? 52 : 34,
          width: "100%",
          height: "100%",
          padding: horizontal ? 56 : 44,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: horizontal ? 1.15 : 1,
            minHeight: 0,
            borderRadius: horizontal ? 30 : 26,
            overflow: "hidden",
            backgroundColor: "#15151b",
            boxShadow: "0 30px 80px rgba(30, 26, 18, 0.22)",
          }}
        >
          {scenes.map((scene) => (
            <Sequence key={`${scene.index}-${scene.from}`} from={scene.from} durationInFrames={scene.durationInFrames}>
              <Transition
                durationInFrames={scene.durationInFrames}
                fadeIn={scene.index === 0 ? 0 : 14}
                fadeOut={scene.index === scenes.length - 1 ? 0 : 14}
              >
                <KenBurns src={scene.src} durationInFrames={scene.durationInFrames} index={scene.index} endScale={1.13} />
              </Transition>
            </Sequence>
          ))}

          <div
            style={{
              position: "absolute",
              top: 24,
              left: 26,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: props.brandColor }} />
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2.4, textTransform: "uppercase", color: "#1a1a1c" }}>
              {props.brandName || "Motionly"}
            </span>
          </div>
        </div>

        <div
          style={{
            flex: horizontal ? 1 : 0.72,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: horizontal ? "12px 16px 12px 0" : "0 8px",
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

              const slideHeadlineSize = Math.max(42, Math.min(baseSize, baseSize - Math.max(0, headline.length - 34) * 1.1));

              return (
                <Sequence key={`text-${scene.index}`} from={scene.from} durationInFrames={scene.durationInFrames}>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%" }}>
                    <div
                      style={{
                        width: lineWidth,
                        height: 7,
                        borderRadius: 999,
                        backgroundColor: props.brandColor,
                        marginBottom: 26,
                      }}
                    />
                    {headline ? (
                      <AnimatedText
                        text={headline}
                        delay={4}
                        fontSize={slideHeadlineSize}
                        fontWeight={700}
                        color="#141416"
                        fontFamily={fontFamily}
                        lineHeight={1.08}
                        letterSpacing={-1.4}
                        maxWidth="100%"
                        animation={slide?.textAnimation || props.textAnimation}
                        brandColor={props.brandColor}
                        durationInFrames={scene.durationInFrames}
                      />
                    ) : null}
                    {subtitle ? (
                      <AnimatedText
                        text={subtitle}
                        delay={14}
                        fontSize={horizontal ? 30 : 32}
                        fontWeight={400}
                        color="#5c574e"
                        fontFamily={fontFamily}
                        lineHeight={1.45}
                        letterSpacing={0}
                        maxWidth={horizontal ? 560 : "94%"}
                        style={{ marginTop: 22 }}
                      />
                    ) : null}
                    {isLastScene && props.cta ? (
                      <div style={{ marginTop: 34 }}>
                        <AnimatedText
                          text={props.cta}
                          delay={20}
                          fontSize={horizontal ? 24 : 26}
                          fontWeight={700}
                          color={readableOn(props.brandColor)}
                          fontFamily={fontFamily}
                          letterSpacing={0.6}
                          align="center"
                          style={{
                            display: "inline-block",
                            padding: "16px 30px",
                            borderRadius: 999,
                            backgroundColor: props.brandColor,
                            boxShadow: `0 16px 40px ${withAlpha(props.brandColor, 0.32)}`,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </Sequence>
              );
            })
          ) : (
            <>
              <div
                style={{
                  width: lineWidth,
                  height: 7,
                  borderRadius: 999,
                  backgroundColor: props.brandColor,
                  marginBottom: 26,
                }}
              />
              <AnimatedText
                text={props.headline}
                delay={4}
                fontSize={headlineSize}
                fontWeight={700}
                color="#141416"
                fontFamily={fontFamily}
                lineHeight={1.08}
                letterSpacing={-1.4}
                maxWidth="100%"
                animation={props.textAnimation}
                brandColor={props.brandColor}
                durationInFrames={durationInFrames}
              />
              {props.subtitle ? (
                <AnimatedText
                  text={props.subtitle}
                  delay={16}
                  fontSize={horizontal ? 30 : 32}
                  fontWeight={400}
                  color="#5c574e"
                  fontFamily={fontFamily}
                  lineHeight={1.45}
                  letterSpacing={0}
                  maxWidth={horizontal ? 560 : "94%"}
                  style={{ marginTop: 22 }}
                />
              ) : null}
              {props.cta ? (
                <div style={{ marginTop: 34 }}>
                  <AnimatedText
                    text={props.cta}
                    delay={26}
                    fontSize={horizontal ? 24 : 26}
                    fontWeight={700}
                    color={readableOn(props.brandColor)}
                    fontFamily={fontFamily}
                    letterSpacing={0.6}
                    align="center"
                    style={{
                      display: "inline-block",
                      padding: "16px 30px",
                      borderRadius: 999,
                      backgroundColor: props.brandColor,
                      boxShadow: `0 16px 40px ${withAlpha(props.brandColor, 0.32)}`,
                    }}
                  />
                </div>
              ) : null}
            </>
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
