import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { firestore } from "./firebase-admin";
import { SEED_SCHEMES } from "./seed-schemes";
import { matchesProfile, type Profile, type Scheme } from "./schemes";
import { STATES } from "./constants";

// Firestore layout (every collection name gets PREFIX, so the app can share a
// project database with other apps):
//   schemes/{id}          one document per scheme (seeded + AI-discovered)
//   discoveries/{key}     one document per AI search, used as a cache and lock
//   contacts/{autoId}     messages from the contact form
//   meta/seed             marks that the starter catalogue has been written

const PREFIX = process.env.FIRESTORE_PREFIX ?? "checkkaro_";
const SCHEMES = `${PREFIX}schemes`;
const DISCOVERIES = `${PREFIX}discoveries`;
const CONTACTS = `${PREFIX}contacts`;
const META = `${PREFIX}meta`;
const CACHE_MS = 60_000;

let cache: { at: number; list: Scheme[] } | null = null;
let seeding: Promise<void> | null = null;

function toIso(v: unknown): string | null {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === "string") return v;
  return null;
}

function fromDoc(id: string, d: FirebaseFirestore.DocumentData): Scheme {
  return {
    id,
    level: d.level,
    stateKey: d.stateKey ?? null,
    name: d.name,
    desc: d.desc,
    benefits: d.benefits,
    eligibility: d.eligibility,
    documents: d.documents,
    url: d.url,
    tags: d.tags ?? [],
    popularity: d.popularity ?? 50,
    year: d.year ?? null,
    criteria: d.criteria ?? {},
    source: d.source ?? "seed",
    createdAt: toIso(d.createdAt) ?? new Date(0).toISOString(),
    lastVerifiedAt: toIso(d.lastVerifiedAt),
  };
}

/** Normalised URL used to spot the same scheme found twice under different names. */
export function urlKey(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/+$/, "")).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function searchText(s: Omit<Scheme, "createdAt" | "lastVerifiedAt" | "source">): string {
  const state = STATES.find((x) => x.key === s.stateKey);
  return [
    s.name.en, s.name.hi, s.desc.en, s.desc.hi, state?.en, state?.hi, ...s.tags,
  ].filter(Boolean).join(" ").toLowerCase();
}

async function ensureSeeded(): Promise<void> {
  const db = firestore();
  const marker = db.collection(META).doc("seed");
  if ((await marker.get()).exists) return;
  const batch = db.batch();
  for (const s of SEED_SCHEMES) {
    batch.set(db.collection(SCHEMES).doc(s.id), {
      ...s,
      source: "seed",
      urlKey: urlKey(s.url),
      searchText: searchText(s),
      createdAt: FieldValue.serverTimestamp(),
      lastVerifiedAt: null,
    });
  }
  batch.set(marker, { at: FieldValue.serverTimestamp(), count: SEED_SCHEMES.length });
  await batch.commit();
}

export async function getAllSchemes(): Promise<Scheme[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.list;
  seeding ??= ensureSeeded().finally(() => { seeding = null; });
  await seeding;
  const snap = await firestore().collection(SCHEMES).get();
  const list = snap.docs.map((d) => fromDoc(d.id, d.data()));
  cache = { at: Date.now(), list };
  return list;
}

export async function getScheme(id: string): Promise<Scheme | null> {
  const doc = await firestore().collection(SCHEMES).doc(id).get();
  return doc.exists ? fromDoc(doc.id, doc.data()!) : null;
}

export type SchemeQuery = { profile: Profile | null; q: string; tags: string[] };

export async function findSchemes({ profile, q, tags }: SchemeQuery): Promise<Scheme[]> {
  let list = await getAllSchemes();
  if (profile) list = list.filter((s) => matchesProfile(s, profile));
  if (tags.length) list = list.filter((s) => tags.every((t) => s.tags.includes(t as never)));
  const needle = q.trim().toLowerCase();
  if (needle) {
    const words = needle.split(/\s+/).filter(Boolean);
    list = list.filter((s) => {
      const text = searchText(s);
      return words.every((w) => text.includes(w));
    });
  }
  return list;
}

export type NewScheme = Omit<Scheme, "source" | "createdAt" | "lastVerifiedAt">;

/**
 * Saves AI-found schemes, skipping any whose id or official URL is already
 * stored. Returns the ids that were actually added.
 */
export async function addDiscoveredSchemes(found: NewScheme[]): Promise<string[]> {
  const db = firestore();
  const existing = await getAllSchemes();
  const ids = new Set(existing.map((s) => s.id));
  const urls = new Set(existing.map((s) => urlKey(s.url)));
  const added: string[] = [];
  const batch = db.batch();
  for (const s of found) {
    const key = urlKey(s.url);
    if (ids.has(s.id) || urls.has(key)) continue;
    ids.add(s.id);
    urls.add(key);
    batch.set(db.collection(SCHEMES).doc(s.id), {
      // JSON round-trip drops undefined optional fields, which Firestore rejects.
      ...(JSON.parse(JSON.stringify(s)) as NewScheme),
      source: "ai",
      urlKey: key,
      searchText: searchText(s),
      createdAt: FieldValue.serverTimestamp(),
      lastVerifiedAt: FieldValue.serverTimestamp(),
    });
    added.push(s.id);
  }
  if (added.length) {
    await batch.commit();
    cache = null;
  }
  return added;
}

// ---- Discovery jobs ---------------------------------------------------------

export type Discovery = {
  status: "running" | "done" | "error";
  added: string[];
  startedAt: string | null;
  finishedAt: string | null;
  error?: string;
};

const FRESH_MS = Number(process.env.DISCOVERY_TTL_HOURS ?? 72) * 3_600_000;
const STALE_RUN_MS = 5 * 60_000;

function toDiscovery(d: FirebaseFirestore.DocumentData): Discovery {
  return {
    status: d.status,
    added: d.added ?? [],
    startedAt: toIso(d.startedAt),
    finishedAt: toIso(d.finishedAt),
    error: d.error,
  };
}

export async function getDiscovery(key: string): Promise<Discovery | null> {
  const doc = await firestore().collection(DISCOVERIES).doc(key).get();
  return doc.exists ? toDiscovery(doc.data()!) : null;
}

/**
 * Atomically decides whether this request should run the AI search for `key`.
 * Returns "claimed" when the caller should run it, or the existing record when
 * a recent search already covered it or another request is running it now.
 */
export async function claimDiscovery(
  key: string,
  meta: Record<string, unknown>,
): Promise<"claimed" | Discovery> {
  const db = firestore();
  const ref = db.collection(DISCOVERIES).doc(key);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const d = snap.data()!;
      const started = d.startedAt instanceof Timestamp ? d.startedAt.toMillis() : 0;
      const finished = d.finishedAt instanceof Timestamp ? d.finishedAt.toMillis() : 0;
      if (d.status === "running" && Date.now() - started < STALE_RUN_MS) return toDiscovery(d);
      if (d.status === "done" && Date.now() - finished < FRESH_MS) return toDiscovery(d);
    }
    tx.set(ref, {
      ...meta,
      status: "running",
      added: [],
      startedAt: FieldValue.serverTimestamp(),
      finishedAt: null,
      error: FieldValue.delete(),
    }, { merge: true });
    return "claimed" as const;
  });
}

export async function finishDiscovery(key: string, result: { added: string[] } | { error: string }) {
  await firestore().collection(DISCOVERIES).doc(key).set(
    "error" in result
      ? { status: "error", error: result.error, finishedAt: FieldValue.serverTimestamp() }
      : { status: "done", added: result.added, finishedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

// ---- Contact form -----------------------------------------------------------

export async function saveContact(msg: Record<string, string>) {
  await firestore().collection(CONTACTS).add({ ...msg, createdAt: FieldValue.serverTimestamp() });
}
