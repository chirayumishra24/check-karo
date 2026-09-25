import { bad, SearchSchema } from "@/lib/http";
import { isEmptyProfile } from "@/lib/schemes";
import { findSchemes } from "@/lib/store";

export async function POST(req: Request) {
  const parsed = SearchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid search");
  const { profile, q, tags } = parsed.data;
  const schemes = await findSchemes({
    profile: profile && !isEmptyProfile(profile) ? profile : null,
    q,
    tags,
  });
  return Response.json({ schemes });
}
