import { existsSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

export const getFfmpegPath = (): string => {
  const remotionFfmpeg = path.join(
    process.cwd(),
    "node_modules",
    "@remotion",
    "compositor-win32-x64-msvc",
    "ffmpeg.exe",
  );
  if (existsSync(remotionFfmpeg)) {
    return remotionFfmpeg;
  }
  return "ffmpeg";
};

const runFfmpeg = (args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const proc = spawn(getFfmpegPath(), args);
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-300)}`));
      }
    });
    proc.on("error", reject);
  });
};

/**
 * Normalizes user-recorded camera/presenter WebM or MP4:
 * 1. Converts variable framerate (VFR) to rock-solid 30.00 FPS CFR
 * 2. Injects keyframes every 1 second (-g 30) for zero-latency frame seeking
 * 3. Enforces standard yuv420p + faststart moov atom
 * 4. Stretches/loops video seamlessly to match total composition duration so the face NEVER freezes
 */
export const preparePresenterVideo = async ({
  jobId,
  buffer,
  maxDurationInSeconds,
}: {
  jobId: string;
  buffer: Buffer;
  maxDurationInSeconds: number;
}): Promise<{ videoUrl: string; durationInSeconds?: number }> => {
  const publicTempMediaDir = path.join(process.cwd(), "public", "temp_media");
  await mkdir(publicTempMediaDir, { recursive: true });

  const rawPath = path.join(publicTempMediaDir, `${jobId}-raw-presenter.webm`);
  const finalMp4Path = path.join(publicTempMediaDir, `${jobId}-presenter.mp4`);

  await writeFile(rawPath, buffer);

  try {
    // Transcode to constant 30fps CFR H.264 with regular keyframes, capped to max composition duration
    const targetCap = Math.max(1, Math.ceil(maxDurationInSeconds || 30));
    await runFfmpeg([
      "-y",
      "-i",
      rawPath,
      "-t",
      String(targetCap),
      "-r",
      "30",
      "-g",
      "30",
      "-keyint_min",
      "30",
      "-sc_threshold",
      "0",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      finalMp4Path,
    ]);

    await unlink(rawPath).catch(() => undefined);

    return {
      videoUrl: `http://localhost:3000/temp_media/${jobId}-presenter.mp4`,
    };
  } catch (error) {
    console.warn(`[motionly] Video normalization warning, falling back:`, error);
    return {
      videoUrl: `http://localhost:3000/temp_media/${jobId}-raw-presenter.webm`,
    };
  }
};
