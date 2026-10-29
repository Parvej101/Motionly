import { AbsoluteFill } from "remotion";

type WatermarkProps = {
  visible?: boolean;
};

export const Watermark = ({ visible }: WatermarkProps) => {
  if (!visible) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "flex-end",
        padding: 28,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: '"Inter", "Noto Sans Bengali", sans-serif',
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: 0.3,
          color: "rgba(255, 255, 255, 0.9)",
          background: "rgba(10, 10, 14, 0.45)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          borderRadius: 999,
          padding: "8px 14px",
          backdropFilter: "blur(8px)",
        }}
      >
        Made with Motionly
      </div>
    </AbsoluteFill>
  );
};
