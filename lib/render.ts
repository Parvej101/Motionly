import { existsSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { renderLimiter } from "./limiter";
import { updateJob } from "./jobs";
import { deleteJobDir, deleteJobImages, getOutputPath } from "./tempfiles";
import type { VideoProps } from "@/remotion/types";

type RenderGlobal = {
  __motionlyBundle?: Promise<string>;
};

const globalForRender = globalThis as typeof globalThis & RenderGlobal;

const getBundle = async () => {
  if (!globalForRender.__motionlyBundle) {
    const entryPoint = path.resolve(process.cwd(), "remotion", "index.ts");
    globalForRender.__motionlyBundle = bundle({
      entryPoint,
      publicDir: null,
      onProgress: () => undefined,
    }).catch((error) => {
      globalForRender.__motionlyBundle = undefined;
      throw error;
    });
  }

  return globalForRender.__motionlyBundle;
};

const resolveBrowserExecutable = (): string | null => {
  const configured = process.env.REMOTION_BROWSER_EXECUTABLE?.trim();
  if (configured) {
    return configured;
  }

  if (process.platform === "win32") {
    const roots = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(
      (value): value is string => Boolean(value),
    );
    const candidates = roots.flatMap((root) => [
      path.join(root, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
    ]);
    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }

  return null;
};

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return String(error).slice(0, 500);
};

export const renderVideo = async (jobId: string, props: VideoProps) => {
  const serveUrl = await getBundle();
  const browserExecutable = resolveBrowserExecutable();
  const composition = await selectComposition({
    serveUrl,
    id: props.styleId ?? "minimal",
    inputProps: props,
    browserExecutable,
  });

  let lastReportedPct = -1;

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: getOutputPath(jobId),
    inputProps: props,
    browserExecutable,
    overwrite: true,
    imageFormat: "jpeg",
    jpegQuality: 88,
    concurrency: 4,
    pixelFormat: "yuv420p",
    crf: 19,
    chromiumOptions: {
      disableWebSecurity: true,
    },
    onProgress: ({ progress }) => {
      const pct = Math.min(99, Math.round(progress * 100));
      if (pct >= lastReportedPct + 2) {
        lastReportedPct = pct;
        void updateJob(jobId, { progress: pct }).catch(() => undefined);
      }
    },
    onBrowserLog: (log) => {
      if (log.type === "error") {
        console.error(`[motionly] browser: ${log.text}`);
      }
    },
  });
};

export const processRender = async (jobId: string, props: VideoProps) => {
  try {
    await updateJob(jobId, { status: "rendering", progress: 0 });
    await renderVideo(jobId, props);
    await deleteJobImages(jobId).catch(() => undefined);
    await updateJob(jobId, { status: "done", progress: 100 });
  } catch (error) {
    console.error(`[motionly] render ${jobId} failed`, error);
    await deleteJobDir(jobId).catch(() => undefined);
    await updateJob(jobId, { status: "failed", error: formatError(error) }).catch(() => undefined);
  } finally {
    renderLimiter.release();
  }
};
