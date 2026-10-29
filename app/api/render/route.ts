import { after } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createJob, updateJob } from "@/lib/jobs";
import { prepareImages } from "@/lib/images";
import { renderLimiter } from "@/lib/limiter";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { processRender } from "@/lib/render";
import { createJobDir, deleteJobDir } from "@/lib/tempfiles";
import { consumeRender } from "@/lib/usage";
import { parseRenderSubmission, ValidationError } from "@/lib/validation";
import type { VideoProps } from "@/remotion/types";

export const maxDuration = 300;

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(`render:ip:${ip}`, 6, 10 * 60 * 1000);
  if (!ipLimit.allowed) {
    return json(
      { error: "Too many render attempts. Try again shortly." },
      429,
      { "Retry-After": String(ipLimit.retryAfterSeconds) },
    );
  }

  const user = await getSessionUser();
  if (user) {
    const userLimit = checkRateLimit(`render:user:${user.id}`, 10, 10 * 60 * 1000);
    if (!userLimit.allowed) {
      return json(
        { error: "Too many render attempts. Try again shortly." },
        429,
        { "Retry-After": String(userLimit.retryAfterSeconds) },
      );
    }
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return json({ error: "Expected multipart/form-data." }, 415);
  }

  let submission;
  try {
    submission = parseRenderSubmission(await request.formData());
  } catch (error) {
    if (error instanceof ValidationError) {
      return json({ error: error.message }, 400);
    }
    return json({ error: "Could not read the upload." }, 400);
  }

  if (!renderLimiter.tryAcquire()) {
    return json(
      {
        error: "The render server is busy. Please try again in a moment.",
        busy: true,
        active: renderLimiter.activeCount,
      },
      503,
      { "Retry-After": "15" },
    );
  }

  let jobId: string | null = null;

  try {
    const usage = await consumeRender({ user, ip });
    if (!usage.allowed) {
      renderLimiter.release();
      return json(
        {
          error: usage.reason || "Render limit reached.",
          limitReached: true,
          remaining: usage.remaining,
          plan: usage.plan,
        },
        429,
      );
    }

    jobId = await createJob({
      userId: user?.id,
      styleId: submission.baseProps.styleId ?? "minimal",
      aspectRatio: submission.baseProps.aspectRatio,
    });

    const activeJobId = jobId;
    await createJobDir(activeJobId);
    const images = await prepareImages({
      files: submission.images,
      aspectRatio: submission.baseProps.aspectRatio,
      jobId: activeJobId,
    });

    const props: VideoProps = {
      ...submission.baseProps,
      images,
      watermark: usage.watermark,
    };

    after(() => {
      void processRender(activeJobId, props);
    });

    return json({
      jobId: activeJobId,
      watermark: usage.watermark,
      remaining: usage.remaining,
      plan: usage.plan,
    });
  } catch (error) {
    renderLimiter.release();

    if (jobId) {
      await deleteJobDir(jobId).catch(() => undefined);
      await updateJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message.slice(0, 500) : "Render setup failed.",
      }).catch(() => undefined);
    }

    if (error instanceof ValidationError) {
      return json({ error: error.message }, 400);
    }

    console.error("[motionly] failed to create render job", error);
    return json({ error: "Could not start the render. Please try again." }, 500);
  }
}
