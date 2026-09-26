import { aiConfigured, AiError } from "@/lib/ai";
import { discoverSchemes } from "@/lib/discovery";
import { discoveryKey } from "@/lib/discovery-key";
import { bad, rateLimited, SearchSchema } from "@/lib/http";
import { isEmptyProfile } from "@/lib/schemes";
import { claimDiscovery, finishDiscovery, getDiscovery } from "@/lib/store";

// An AI search with several web lookups can take a minute or two.
export const maxDuration = 300;

/**
 * Starts (or reuses) an AI search for new schemes matching a profile / query.
 * The request waits for the search to finish so it keeps running on Cloud Run.
 * Identical searches made while one is running get {status: "running"} and
 * poll GET ?key= until it is done.
 */
export async function POST(req: Request) {
  if (!aiConfigured()) return Response.json({ status: "disabled" });
  const parsed = SearchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid search");

  const profile = parsed.data.profile && !isEmptyProfile(parsed.data.profile) ? parsed.data.profile : null;
  const q = parsed.data.q.trim();
  if (!profile && q.length < 3) return Response.json({ status: "skipped" });

  const key = await discoveryKey(profile, q);
  const claim = await claimDiscovery(key, { profile, q });
  if (claim !== "claimed") return Response.json({ key, ...claim });

  if (rateLimited(req, "discover", 6, 60 * 60_000)) {
    await finishDiscovery(key, { error: "rate_limited" });
    return bad("Too many AI searches. Please try again later.", 429);
  }

  try {
    const added = await discoverSchemes(profile, q);
    await finishDiscovery(key, { added });
    return Response.json({ key, status: "done", added });
  } catch (err) {
    console.error("discovery failed", err);
    const message = err instanceof AiError ? err.message : "AI search failed";
    await finishDiscovery(key, { error: message });
    return Response.json({ key, status: "error", error: message }, { status: 502 });
  }
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key || !/^[a-f0-9]{32}$/.test(key)) return bad("Missing key");
  const d = await getDiscovery(key);
  return d ? Response.json({ key, ...d }) : bad("Not found", 404);
}
