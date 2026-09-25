import { getScheme } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/schemes/[id]">) {
  const { id } = await ctx.params;
  const scheme = await getScheme(id);
  if (!scheme) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ scheme });
}
