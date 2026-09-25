import { createHash } from "node:crypto";
import { z } from "zod";
import { researchAndSubmit } from "./ai";
import {
  AREAS, CATEGORIES, EDUCATIONS, GENDERS, GROUPS, INCOMES, OCCUPATIONS, STATES, STATE_KEYS, TAGS,
} from "./constants";
import { slugify, type Profile } from "./schemes";
import { addDiscoveredSchemes, getAllSchemes, type NewScheme } from "./store";

const bi = z.object({ en: z.string().min(1), hi: z.string().min(1) });
const biList = z.object({ en: z.array(z.string()), hi: z.array(z.string()) });

const FoundScheme = z.object({
  name: bi.describe("Official scheme name, in English and Hindi"),
  level: z.enum(["central", "state"]),
  stateKey: z.enum(STATE_KEYS).nullable().describe("State key for state schemes, null for central"),
  desc: bi.describe("One plain sentence on what the scheme is"),
  benefits: bi.describe("What the person actually gets: amounts, cover, services"),
  eligibility: bi.describe("Who can apply, in plain words"),
  documents: biList.describe("Documents usually needed to apply"),
  url: z.string().url().describe("Official government page to read and apply (.gov.in / .nic.in preferred)"),
  tags: z.array(z.enum(TAGS)).min(1),
  year: z.number().int().min(1947).max(2100).nullable().describe("Launch year if known"),
  popularity: z.number().int().min(1).max(100).describe("Rough reach estimate, 100 = nationwide flagship"),
  criteria: z.object({
    states: z.array(z.enum(STATE_KEYS)).optional(),
    minAge: z.number().int().min(0).max(120).optional(),
    maxAge: z.number().int().min(0).max(120).optional(),
    genders: z.array(z.enum(GENDERS)).optional(),
    occupations: z.array(z.enum(OCCUPATIONS)).optional(),
    incomes: z.array(z.enum(INCOMES)).optional(),
    educations: z.array(z.enum(EDUCATIONS)).optional(),
    categories: z.array(z.enum(CATEGORIES)).optional(),
    areas: z.array(z.enum(AREAS)).optional(),
    groups: z.array(z.enum(GROUPS)).optional(),
  }).describe("Machine-readable rules. Omit a field when the scheme has no such restriction."),
});

const Submission = z.object({ schemes: z.array(FoundScheme).max(12) });

const SYSTEM = `You research Indian government welfare schemes for Check Karo, a free public service that helps ordinary people find benefits they qualify for.

Use web search to find schemes that are currently active, preferring official sources (myscheme.gov.in, india.gov.in, ministry and state .gov.in / .nic.in sites). Only report a scheme when you found a real official page for it; never invent schemes, amounts or links. Skip schemes that have been closed or merged.

Write every text field in simple language that a first-time smartphone user can follow, in both English and Hindi (Devanagari). Keep each field to one or two short sentences.

For criteria, only use the allowed enum values. Leave a criteria field out when the scheme does not restrict on it; do not guess restrictions. Use groups=["women"] or genders=["female"] for women-only schemes, groups=["senior"] with a minAge for elderly schemes, groups=["disabled"] for disability schemes.

When done, call submit_schemes exactly once. Submit an empty list if you found nothing new.`;

function describeProfile(p: Profile | null): string {
  if (!p) return "No profile given.";
  const parts: string[] = [];
  if (p.state) parts.push(`lives in ${STATES.find((s) => s.key === p.state)?.en}`);
  if (p.age) parts.push(`age ${p.age}`);
  if (p.gender) parts.push(`gender: ${p.gender}`);
  if (p.occupation) parts.push(`occupation: ${p.occupation}`);
  if (p.income) parts.push(p.income === "bpl" ? "below poverty line" : "above poverty line");
  if (p.education) parts.push(`education: ${p.education}`);
  if (p.category) parts.push(`social category: ${p.category}`);
  if (p.area) parts.push(`${p.area} area`);
  if (p.groups.length) parts.push(`also: ${p.groups.join(", ")}`);
  return parts.length ? parts.join("; ") : "No profile given.";
}

/** Same search → same key, so repeated searches reuse one AI run. */
export function discoveryKey(profile: Profile | null, q: string): string {
  const norm = JSON.stringify({
    p: profile ? { ...profile, age: profile.age ? ageBand(Number(profile.age)) : "", groups: [...profile.groups].sort() } : null,
    q: q.trim().toLowerCase().replace(/\s+/g, " "),
  });
  return createHash("sha256").update(norm).digest("hex").slice(0, 32);
}

function ageBand(age: number): string {
  if (age < 18) return "child";
  if (age < 25) return "18-24";
  if (age < 40) return "25-39";
  if (age < 60) return "40-59";
  return "60+";
}

export async function discoverSchemes(profile: Profile | null, q: string): Promise<string[]> {
  const known = (await getAllSchemes()).map((s) => s.name.en);
  const request = [
    q.trim() ? `The person searched for: "${q.trim()}"` : null,
    `Their profile: ${describeProfile(profile)}`,
    `Find up to 8 active government schemes (central, and state schemes for their state if given) that this person is likely eligible for or is looking for, which are NOT already in this list:`,
    known.map((n) => `- ${n}`).join("\n"),
  ].filter(Boolean).join("\n\n");

  const result = await researchAndSubmit({
    system: SYSTEM,
    content: [{ type: "text", text: request }],
    submit: {
      name: "submit_schemes",
      description: "Submit the new schemes you found, with bilingual text and eligibility rules.",
      schema: Submission,
    },
    searches: 6,
  });

  const cleaned: NewScheme[] = result.schemes.map((s) => ({
    id: slugify(s.name.en) || createHash("sha1").update(s.url).digest("hex").slice(0, 12),
    level: s.level,
    stateKey: s.level === "state" ? s.stateKey : null,
    name: s.name,
    desc: s.desc,
    benefits: s.benefits,
    eligibility: s.eligibility,
    documents: s.documents,
    url: s.url,
    tags: Array.from(new Set([s.level, ...s.tags])),
    popularity: s.popularity,
    year: s.year,
    criteria: s.level === "state" && s.stateKey && !s.criteria.states
      ? { ...s.criteria, states: [s.stateKey] }
      : s.criteria,
  }));

  return addDiscoveredSchemes(cleaned);
}
