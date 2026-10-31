import { ObjectId } from "mongodb";
import { getDb, RENDER_JOBS_COLLECTION } from "./db";
import type { AspectRatio, StyleId } from "@/remotion/types";

export type RenderJobStatus = "queued" | "rendering" | "done" | "failed" | "downloaded";

export type RenderJob = {
  _id: ObjectId;
  userId?: ObjectId;
  status: RenderJobStatus;
  styleId: string;
  aspectRatio: AspectRatio;
  progress?: number;
  error?: string;
  createdAt: Date;
};

export type RenderJobView = {
  id: string;
  userId?: string;
  status: RenderJobStatus;
  styleId: string;
  aspectRatio: AspectRatio;
  progress?: number;
  error?: string;
  createdAt: Date;
};

type MemoryJob = RenderJobView & { createdAt: Date };

type JobGlobal = {
  __motionlyJobs?: Map<string, MemoryJob>;
};

const globalForJobs = globalThis as typeof globalThis & JobGlobal;

const memoryJobs = () => {
  if (!globalForJobs.__motionlyJobs) {
    globalForJobs.__motionlyJobs = new Map();
  }
  return globalForJobs.__motionlyJobs;
};

const pruneMemory = () => {
  const jobs = memoryJobs();
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.createdAt.getTime() < cutoff) {
      jobs.delete(id);
    }
  }
  if (jobs.size > 250) {
    const sorted = [...jobs.entries()].sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());
    for (const [id] of sorted.slice(0, jobs.size - 250)) {
      jobs.delete(id);
    }
  }
};

const toView = (job: RenderJob): RenderJobView => ({
  id: job._id.toHexString(),
  userId: job.userId ? job.userId.toHexString() : undefined,
  status: job.status,
  styleId: job.styleId,
  aspectRatio: job.aspectRatio,
  progress: job.progress,
  error: job.error,
  createdAt: job.createdAt,
});

export const createJob = async (input: {
  userId?: string;
  styleId: StyleId;
  aspectRatio: AspectRatio;
}): Promise<string> => {
  const _id = new ObjectId();
  const createdAt = new Date();
  let userId: ObjectId | undefined;

  if (input.userId && ObjectId.isValid(input.userId)) {
    userId = new ObjectId(input.userId);
  }

  const db = await getDb();
  if (db) {
    await db.collection<RenderJob>(RENDER_JOBS_COLLECTION).insertOne({
      _id,
      userId,
      status: "queued",
      styleId: input.styleId,
      aspectRatio: input.aspectRatio,
      createdAt,
    });
  } else {
    pruneMemory();
    memoryJobs().set(_id.toHexString(), {
      id: _id.toHexString(),
      userId: userId?.toHexString(),
      status: "queued",
      styleId: input.styleId,
      aspectRatio: input.aspectRatio,
      createdAt,
    });
  }

  return _id.toHexString();
};

export const updateJob = async (
  id: string,
  patch: Partial<Pick<RenderJob, "status" | "error" | "progress">>,
) => {
  const db = await getDb();
  if (db && ObjectId.isValid(id)) {
    await db.collection<RenderJob>(RENDER_JOBS_COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: patch },
    );
    return;
  }

  const job = memoryJobs().get(id);
  if (job) {
    memoryJobs().set(id, { ...job, ...patch });
  }
};

export const getJob = async (id: string): Promise<RenderJobView | null> => {
  const db = await getDb();
  if (db) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const job = await db.collection<RenderJob>(RENDER_JOBS_COLLECTION).findOne({
      _id: new ObjectId(id),
    });
    return job ? toView(job) : null;
  }

  pruneMemory();
  return memoryJobs().get(id) ?? null;
};
