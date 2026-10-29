export type Scene = {
  src: string | null;
  index: number;
  from: number;
  durationInFrames: number;
};

export const buildScenes = (images: string[], durationInFrames: number): Scene[] => {
  const sources = images.length > 0 ? images.slice(0, 10) : [null];
  const total = Math.max(1, Math.round(durationInFrames));
  const base = Math.floor(total / sources.length);

  return sources.map((src, index) => {
    const from = index * base;
    const isLast = index === sources.length - 1;
    return {
      src,
      index,
      from,
      durationInFrames: isLast ? Math.max(1, total - from) : Math.max(1, base),
    };
  });
};
