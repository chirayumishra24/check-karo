import { z } from "zod";
import { bad, rateLimited } from "@/lib/http";
import { saveContact } from "@/lib/store";

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
  type: z.enum(["suggestion", "feedback", "claim"]),
  message: z.string().trim().min(1).max(1000),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid form");
  if (rateLimited(req, "contact", 5, 60 * 60_000)) return bad("Too many messages", 429);
  await saveContact(parsed.data);
  return Response.json({ ok: true });
}
