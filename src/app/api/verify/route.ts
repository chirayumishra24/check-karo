import { z } from "zod";
import { aiConfigured, AiError } from "@/lib/ai";
import { bad, rateLimited } from "@/lib/http";
import { verify, type VerifyInput } from "@/lib/verify";

export const maxDuration = 300;

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MIMES = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const;

const Body = z.object({
  lang: z.string().max(5).default("en"),
  input: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("text"), text: z.string().trim().min(3).max(6000) }),
    z.object({ mode: z.literal("url"), url: z.string().trim().url().max(2000).refine((u) => /^https?:/i.test(u)) }),
    z.object({
      mode: z.literal("file"),
      name: z.string().max(200),
      mime: z.enum(MIMES),
      base64: z.string().max(Math.ceil((MAX_FILE_BYTES * 4) / 3) + 8),
    }),
  ]),
});

export async function POST(req: Request) {
  if (!aiConfigured()) return bad("AI is not configured on the server.", 503);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid input");
  if (rateLimited(req, "verify", 15, 60 * 60_000)) return bad("Too many checks. Please try again later.", 429);

  try {
    const result = await verify(parsed.data.input as VerifyInput, parsed.data.lang);
    return Response.json(result);
  } catch (err) {
    console.error("verify failed", err);
    return bad(err instanceof AiError ? err.message : "Verification failed", 502);
  }
}
