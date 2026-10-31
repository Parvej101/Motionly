import { getSessionUser } from "@/lib/auth";
import { getJob } from "@/lib/jobs";

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

  return Response.json(
    {
      status: job.status,
      progress: job.progress ?? 0,
      error: job.error,
      styleId: job.styleId,
      aspectRatio: job.aspectRatio,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
