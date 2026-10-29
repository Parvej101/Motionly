const clamp = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

export const parseHex = (hex: string): [number, number, number] => {
  const normalized = hex.replace("#", "").trim();
  if (/^[0-9a-f]{3}$/i.test(normalized)) {
    const [r, g, b] = normalized.split("");
    return [
      parseInt(`${r}${r}`, 16),
      parseInt(`${g}${g}`, 16),
      parseInt(`${b}${b}`, 16),
    ];
  }
  if (/^[0-9a-f]{6}$/i.test(normalized)) {
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16),
    ];
  }
  return [255, 255, 255];
};

export const withAlpha = (hex: string, alpha: number) => {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
};

export const mix = (hex: string, target: string, amount: number) => {
  const [r1, g1, b1] = parseHex(hex);
  const [r2, g2, b2] = parseHex(target);
  const t = Math.min(1, Math.max(0, amount));
  return `rgb(${clamp(r1 + (r2 - r1) * t)}, ${clamp(g1 + (g2 - g1) * t)}, ${clamp(b1 + (b2 - b1) * t)})`;
};

export const readableOn = (hex: string) => {
  const [r, g, b] = parseHex(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111114" : "#ffffff";
};
