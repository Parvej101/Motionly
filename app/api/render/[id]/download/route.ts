import { Readable } from "node:stream";
import { getSessionUser } from "@/lib/auth";
import { getJob, updateJob } from "@/lib/jobs";
import {
  createOutputReadStream,
  deleteJobDir,
  fileExists,
  getOutputPath,
  readJobOutput,
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
    return Response.json({ error: "The render is not ready yet." }, { status: 409 });
  }

  if (job.status === "downloaded") {
    return Response.json(
      { error: "This video has already been downloaded and deleted." },
      { status: 410 },
    );
  }

  if (!(await fileExists(getOutputPath(id)))) {
    return Response.json(
      { error: "The video file is no longer available." },
      { status: 410 },
    );
  }

  await updateJob(id, { status: "downloaded" });

  const { size } = await readJobOutput(id);
  const nodeStream = createOutputReadStream(id);
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    void deleteJobDir(id).catch(() => undefined);
  };

  nodeStream.once("close", cleanup);
  nodeStream.once("error", cleanup);

  const body = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="motionly-${id}.mp4"`,
      "Cache-Control": "no-store",
    },
  });
}
