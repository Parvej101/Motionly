import { createReadStream, type Dirent } from "node:fs";
import { mkdir, readdir, rm, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const TEMP_ROOT = path.join(os.tmpdir(), "vidgen");
export const JOB_TTL_MS = 30 * 60 * 1000;

const jobIdPattern = /^[a-f0-9]{24}$/i;

const assertJobId = (jobId: string) => {
  if (!jobIdPattern.test(jobId)) {
    throw new Error("Invalid job id");
  }
};

export const getJobDir = (jobId: string) => {
  assertJobId(jobId);
  return path.join(TEMP_ROOT, jobId);
};

export const getOutputPath = (jobId: string) => path.join(getJobDir(jobId), "out.mp4");

export const getThumbnailPath = (jobId: string) => path.join(getJobDir(jobId), "thumbnail.jpg");

export const getImagePath = (jobId: string, index: number) =>
  path.join(getJobDir(jobId), `image-${index}.jpg`);

export const createJobDir = async (jobId: string) => {
  const dir = getJobDir(jobId);
  await mkdir(dir, { recursive: true });
  return dir;
};

export const deleteJobDir = async (jobId: string) => {
  await rm(getJobDir(jobId), { recursive: true, force: true });
};

export const deleteJobImages = async (jobId: string) => {
  const dir = getJobDir(jobId);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.startsWith("image-") && entry.endsWith(".jpg"))
      .map((entry) => unlink(path.join(dir, entry)).catch(() => undefined)),
  );
};

export const fileExists = async (filePath: string) => {
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch {
    return false;
  }
};

export const readJobOutput = async (jobId: string) => {
  const outputPath = getOutputPath(jobId);
  const info = await stat(outputPath);
  return { outputPath, size: info.size };
};

export const readJobThumbnail = async (jobId: string) => {
  const thumbnailPath = getThumbnailPath(jobId);
  const info = await stat(thumbnailPath);
  return { thumbnailPath, size: info.size };
};

export const createOutputReadStream = (jobId: string) => createReadStream(getOutputPath(jobId));

export const createThumbnailReadStream = (jobId: string) => createReadStream(getThumbnailPath(jobId));

export const sweepOldJobs = async (maxAgeMs = JOB_TTL_MS) => {
  let entries: Dirent[];
  try {
    entries = await readdir(TEMP_ROOT, { withFileTypes: true });
  } catch {
    return 0;
  }

  let removed = 0;
  const cutoff = Date.now() - maxAgeMs;

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory()) {
        return;
      }
      const target = path.join(TEMP_ROOT, entry.name);
      try {
        const info = await stat(target);
        if (info.mtimeMs < cutoff) {
          await rm(target, { recursive: true, force: true });
          removed += 1;
        }
      } catch {
        return;
      }
    }),
  );

  return removed;
};

type SweeperGlobal = {
  __motionlySweeper?: NodeJS.Timeout;
};

const globalForSweeper = globalThis as typeof globalThis & SweeperGlobal;

export const startSweeper = () => {
  if (globalForSweeper.__motionlySweeper) {
    return;
  }

  const run = () => {
    void sweepOldJobs().then((removed) => {
      if (removed > 0) {
        console.info(`[motionly] swept ${removed} expired render folder(s)`);
      }
    });
  };

  run();
  const interval = setInterval(run, 5 * 60 * 1000);
  interval.unref?.();
  globalForSweeper.__motionlySweeper = interval;
};
