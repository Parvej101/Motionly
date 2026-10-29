import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { KenBurns } from "../components/KenBurns";
import { Transition } from "../components/Transition";
import { Watermark } from "../components/Watermark";
import { readableOn, withAlpha } from "../color";
import { getFontStack } from "../fonts";
import { buildScenes } from "../scenes";
import type { VideoProps } from "../types";

export const FashionLuxuryStyle = (props: VideoProps) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const scenes = buildScenes(props.images, durationInFrames);
  const horizontal = width > height;
  const fontFamily = getFontStack(props.fontFamily);
  const headlineLength = props.headline?.length ?? 0;
  const baseSize = horizontal ? 98 : 82;
  const headlineSize = Math.max(40, Math.min(baseSize, baseSize - Math.max(0, headlineLength - 26) * 1.4));
  const activeIndex = scenes.findIndex(
    (scene) => frame >= scene.from && frame < scene.from + scene.durationInFrames,
  );
  const sceneNumber = String((activeIndex >= 0 ? activeIndex : scenes.length - 1) + 1).padStart(2, "0");
  const ruleWidth = interpolate(frame, [8, 52], [0, horizontal ? 520 : 380], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f0e0c", fontFamily, overflow: "hidden" }}>
      {scenes.map((scene) => (
        <Sequence key={`${scene.index}-${scene.from}`} from={scene.from} durationInFrames={scene.durationInFrames}>
          <Transition
            durationInFrames={scene.durationInFrames}
            fadeIn={scene.index === 0 ? 0 : 20}
            fadeOut={scene.index === scenes.length - 1 ? 0 : 20}
          >
            <KenBurns
              src={scene.src}
              durationInFrames={scene.durationInFrames}
              index={scene.index}
              brightness={0.72}
              saturation={0.88}
              startScale={1.02}
              endScale={1.11}
            />
          </Transition>
        </Sequence>
      ))}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(9,8,7,0.72) 0%, rgba(9,8,7,0.12) 34%, rgba(9,8,7,0.18) 62%, rgba(9,8,7,0.86) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      <div style={{ position: "absolute", top: 48, left: 56, right: 56, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: horizontal ? 19 : 20, fontWeight: 600, letterSpacing: 7, textTransform: "uppercase", color: "rgba(255,255,255,0.9)" }}>
            {props.brandName || "Motionly"}
          </span>
          <div style={{ width: 40, height: 1, backgroundColor: props.brandColor }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ display: "block", fontSize: 18, letterSpacing: 4, color: "rgba(255,255,255,0.62)" }}>EDITION</span>
          <span style={{ display: "block", fontSize: 26, fontWeight: 600, letterSpacing: 2, color: "#ffffff" }}>
            {sceneNumber} / {String(scenes.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: horizontal ? "120px 150px" : "170px 70px 140px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <div style={{ width: ruleWidth, height: 1, backgroundColor: withAlpha(props.brandColor, 0.9), marginBottom: 34 }} />
        <AnimatedText
          text={props.headline}
          delay={6}
          fontSize={headlineSize}
          fontWeight={400}
          color="#ffffff"
          fontFamily={fontFamily}
          letterSpacing={horizontal ? 8 : 5}
          lineHeight={1.08}
          align="center"
          uppercase
          maxWidth={horizontal ? 1380 : "100%"}
          enterFrom="none"
        />
        <div style={{ width: ruleWidth, height: 1, backgroundColor: withAlpha(props.brandColor, 0.9), marginTop: 34 }} />

        {props.subtitle ? (
          <AnimatedText
            text={props.subtitle}
            delay={20}
            fontSize={horizontal ? 25 : 27}
            fontWeight={400}
            color="rgba(255,255,255,0.78)"
            fontFamily={fontFamily}
            letterSpacing={1.4}
            lineHeight={1.6}
            align="center"
            maxWidth={horizontal ? 800 : "90%"}
            style={{ marginTop: 30 }}
          />
        ) : null}

        {props.cta ? (
          <div style={{ marginTop: 42 }}>
            <AnimatedText
              text={props.cta}
              delay={32}
              fontSize={horizontal ? 20 : 22}
              fontWeight={600}
              color={readableOn(props.brandColor)}
              fontFamily={fontFamily}
              letterSpacing={3}
              align="center"
              uppercase
              style={{
                display: "inline-block",
                padding: "16px 42px",
                border: `1px solid ${props.brandColor}`,
                backgroundColor: props.brandColor,
              }}
            />
          </div>
        ) : null}
      </div>

      <div style={{ position: "absolute", bottom: 42, left: 56, right: 56, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
          {props.brandName || "Motionly"}
        </span>
        <span style={{ fontSize: 16, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
          {props.aspectRatio.replace(":", " : ")}
        </span>
      </div>

      <Watermark visible={props.watermark} />
    </AbsoluteFill>
  );
};
