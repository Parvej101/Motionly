import React from "react";
import { useCurrentFrame } from "remotion";
import type { DynamicDeconstructedPart } from "../types";

export interface DeconstructedPartsRendererProps {
  parts?: DynamicDeconstructedPart[];
  brandColor?: string;
}

export const DeconstructedPartsRenderer: React.FC<DeconstructedPartsRendererProps> = ({
  parts,
  brandColor = "#7c5cff",
}) => {
  const frame = useCurrentFrame();

  if (!parts || parts.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 26,
      }}
    >
      {parts.map((part) => {
        const speed = part.speed || 1;
        const amplitude = part.amplitude || 15;

        // Calculate dynamic transformation according to AI decomposed motion type
        let transform = "";
        const filter = `drop-shadow(0 0 14px ${brandColor}66)`;

        if (part.movement === "rotate") {
          // Continuous rotation (e.g., wheels, clocks, gears, spinning logos)
          const angle = (frame * 4 * speed) % 360;
          transform = `rotate(${angle}deg)`;
        } else if (part.movement === "float_y") {
          // Floating up and down (e.g., characters, animals, floating devices)
          const y = Math.sin((frame * speed) / 12) * amplitude;
          transform = `translateY(${y}px)`;
        } else if (part.movement === "float_x") {
          // Drifting left and right (e.g., moving cars, flying clouds)
          const x = Math.sin((frame * speed) / 15) * amplitude;
          transform = `translateX(${x}px)`;
        } else if (part.movement === "pulse_scale") {
          // Pulsing / breathing (e.g., hearts, glowing lights, screens)
          const s = 1 + Math.sin((frame * speed) / 10) * 0.08;
          transform = `scale(${s})`;
        } else if (part.movement === "pendulum_swing") {
          // Pendulum swing (e.g., walking legs, waving arms, swinging badges)
          const swingAngle = Math.sin((frame * speed) / 12) * amplitude;
          transform = `rotate(${swingAngle}deg)`;
        } else if (part.movement === "slide_bounce") {
          // Spring bounce
          const bounce = Math.abs(Math.sin((frame * speed) / 10)) * amplitude;
          transform = `translateY(${-bounce}px)`;
        }

        return (
          <div
            key={part.id}
            style={{
              position: "absolute",
              left: `${part.box.xPercent}%`,
              top: `${part.box.yPercent}%`,
              width: `${part.box.widthPercent}%`,
              height: `${part.box.heightPercent}%`,
              transformOrigin: "center center",
              transform,
              filter,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* If AI generated custom SVG vector code for this part */}
            {part.svgVectorCode ? (
              <div
                style={{ width: "100%", height: "100%" }}
                dangerouslySetInnerHTML={{ __html: part.svgVectorCode }}
              />
            ) : (
              // Stylized AI Dynamic HUD Element when no raw SVG is embedded
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "16px",
                  border: `2px dashed ${brandColor}`,
                  backgroundColor: `${brandColor}18`,
                  backdropFilter: "blur(2px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 0 20px ${brandColor}40`,
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#ffffff",
                    backgroundColor: "rgba(0,0,0,0.7)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  ⚡ {part.name}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 600,
                    color: brandColor,
                    marginTop: "3px",
                    textTransform: "uppercase",
                  }}
                >
                  {part.movement} motion
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
