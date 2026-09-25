import { z } from "zod";
import {
  AREAS, CATEGORIES, EDUCATIONS, GENDERS, GROUPS, INCOMES, OCCUPATIONS, STATE_KEYS,
} from "./constants";
import type { Profile } from "./schemes";

const orEmpty = <T extends [string, ...string[]]>(values: T) => z.union([z.enum(values), z.literal("")]);

export const ProfileSchema: z.ZodType<Profile> = z.object({
  state: orEmpty(STATE_KEYS),
  age: z.string().regex(/^\d{0,3}$/),
  gender: orEmpty([...GENDERS]),
  occupation: orEmpty([...OCCUPATIONS]),
  income: orEmpty([...INCOMES]),
  education: orEmpty([...EDUCATIONS]),
  category: orEmpty([...CATEGORIES]),
  area: orEmpty([...AREAS]),
  groups: z.array(z.enum(GROUPS)).max(GROUPS.length),
});

export const SearchSchema = z.object({
  profile: ProfileSchema.nullable(),
  q: z.string().max(200).default(""),
  tags: z.array(z.string().max(30)).max(30).default([]),
});

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

// Best-effort limiter for AI endpoints. It is per server instance, which is
// enough to stop a single client from running up the bill; put Firebase App
// Check or a shared counter in front of it for stronger guarantees.
const hits = new Map<string, number[]>();

export function rateLimited(req: Request, bucket: string, max: number, windowMs: number): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}
