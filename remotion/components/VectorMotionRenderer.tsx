import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { VectorMotionOverlay } from "../types";

export interface VectorMotionRendererProps {
  overlays?: VectorMotionOverlay[];
  brandColor?: string;
}

export const VectorMotionRenderer: React.FC<VectorMotionRendererProps> = ({
  overlays,
  brandColor = "#7c5cff",
}) => {
  const frame = useCurrentFrame();

  if (!overlays || overlays.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 25,
      }}
    >
      {overlays.map((item) => {
        const speed = item.speedMultiplier || 1;
        const color = item.color || brandColor || "#ffffff";
        const size = item.size || 160;

        // Positioning
        const left = `${item.xPercent}%`;
        const top = `${item.yPercent}%`;

        if (item.type === "clock") {
          // Exactly matching user's demo video: rotating minute & hour hand
          const minuteDeg = (frame * 6 * speed) % 360;
          const hourDeg = (frame * 0.5 * speed) % 360;
          const secondPulse = (Math.sin(frame / 4) * 0.05 + 1);

          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                left,
                top,
                transform: `translate(-50%, -50%) scale(${secondPulse})`,
                width: size,
                height: size,
                filter: `drop-shadow(0 0 16px ${color}88)`,
              }}
            >
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                {/* Dial Outer Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={color}
                  strokeWidth="4"
                  strokeDasharray="282.7"
                  strokeDashoffset={interpolate(frame, [0, 20], [282.7, 0], {
                    extrapolateRight: "clamp",
                  })}
                />

                {/* 12 Hour Ticks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <line
                    key={deg}
                    x1="50"
                    y1="10"
                    x2="50"
                    y2={deg % 90 === 0 ? "17" : "14"}
                    stroke={color}
                    strokeWidth={deg % 90 === 0 ? "3.5" : "2"}
                    strokeLinecap="round"
                    transform={`rotate(${deg} 50 50)`}
                  />
                ))}

                {/* Hour Hand */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="28"
                  stroke={color}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  transform={`rotate(${hourDeg} 50 50)`}
                />

                {/* Minute Hand */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="18"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${minuteDeg} 50 50)`}
                />

                {/* Center Pin */}
                <circle cx="50" cy="50" r="4" fill={color} />
              </svg>

              {item.label && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -22,
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#ffffff",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        }

        if (item.type === "gear") {
          // Spinning mechanical gear teeth
          const gearRot = (frame * 3 * speed) % 360;

          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                left,
                top,
                transform: "translate(-50%, -50%)",
                width: size,
                height: size,
                filter: `drop-shadow(0 0 18px ${color}77)`,
              }}
            >
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <g transform={`rotate(${gearRot} 50 50)`}>
                  {/* Gear 8 Teeth */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <rect
                      key={deg}
                      x="44"
                      y="4"
                      width="12"
                      height="14"
                      rx="2"
                      fill={color}
                      transform={`rotate(${deg} 50 50)`}
                    />
                  ))}
                  {/* Gear Body */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="6" />
                  <circle cx="50" cy="50" r="14" fill="none" stroke={color} strokeWidth="4" />
                  {/* Cross Spokes */}
                  <line x1="50" y1="14" x2="50" y2="86" stroke={color} strokeWidth="3" />
                  <line x1="14" y1="50" x2="86" y2="50" stroke={color} strokeWidth="3" />
                  <circle cx="50" cy="50" r="5" fill={color} />
                </g>
              </svg>
            </div>
          );
        }

        if (item.type === "hud_scanner") {
          // Cyberpunk HUD target scanner around focal point
          const hudRot = (frame * 2 * speed) % 360;
          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                left,
                top,
                transform: "translate(-50%, -50%)",
                width: size,
                height: size,
              }}
            >
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="16 8"
                  transform={`rotate(${hudRot} 50 50)`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="34"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="30 15"
                  transform={`rotate(${-hudRot * 1.5} 50 50)`}
                />
                {/* 4 corner brackets */}
                <path d="M 15 30 L 15 15 L 30 15" fill="none" stroke={color} strokeWidth="3" />
                <path d="M 85 30 L 85 15 L 70 15" fill="none" stroke={color} strokeWidth="3" />
                <path d="M 15 70 L 15 85 L 30 85" fill="none" stroke={color} strokeWidth="3" />
                <path d="M 85 70 L 85 85 L 70 85" fill="none" stroke={color} strokeWidth="3" />
                <circle cx="50" cy="50" r="3" fill={color} />
              </svg>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
