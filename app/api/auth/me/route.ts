import { getSessionUser } from "@/lib/auth";
import { FREE_RENDER_LIMIT, currentMonthKey } from "@/lib/usage";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json(
      { user: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const monthKey = currentMonthKey();
  const used = user.monthKey === monthKey ? user.rendersUsedThisMonth : 0;
  const limit = user.plan === "pro" ? 100 : FREE_RENDER_LIMIT;

  return Response.json(
    {
      user: {
        ...user,
        rendersUsedThisMonth: used,
      },
      remaining: Math.max(0, limit - used),
      limit,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
