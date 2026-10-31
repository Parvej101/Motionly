import { Readable } from "node:stream";
import { getSessionUser } from "@/lib/auth";
import { getJob } from "@/lib/jobs";
import {
  createThumbnailReadStream,
  fileExists,
  getThumbnailPath,
  readJobThumbnail,
} from "@/lib/tempfiles";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const job = await getJob(id);

  if (!job) {
    return Response.json({ error: "Render job not found." }, { status: 404 });
  }

  if (job.userId) {
    const user = await getSessionUser();
    if (user?.id !== job.userId) {
      return Response.json({ error: "Render job not found." }, { status: 404 });
    }
  }

  if (job.status === "failed") {
    return Response.json(
      { error: job.error || "This render failed." },
      { status: 410 },
    );
  }

  if (job.status === "queued" || job.status === "rendering") {
    return Response.json({ error: "The thumbnail is not ready yet." }, { status: 409 });
  }

  const thumbPath = getThumbnailPath(id);
  if (!(await fileExists(thumbPath))) {
    return Response.json(
      { error: "The thumbnail file is no longer available." },
      { status: 404 },
    );
  }

  const { size } = await readJobThumbnail(id);
  const nodeStream = createThumbnailReadStream(id);
  const body = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="motionly-${id}-thumbnail.jpg"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
