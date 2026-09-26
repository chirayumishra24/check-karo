import type { Profile } from "./schemes";

function ageBand(age: number): string {
  if (age < 18) return "child";
  if (age < 25) return "18-24";
  if (age < 40) return "25-39";
  if (age < 60) return "40-59";
  return "60+";
}

/**
 * Same search → same key, so repeated searches reuse one AI run. Uses Web
 * Crypto so the browser can compute the key too: if the request is cut off by
 * the hosting proxy's timeout, the client polls for the result by key.
 */
export async function discoveryKey(profile: Profile | null, q: string): Promise<string> {
  const norm = JSON.stringify({
    p: profile
      ? { ...profile, age: profile.age ? ageBand(Number(profile.age)) : "", groups: [...profile.groups].sort() }
      : null,
    q: q.trim().toLowerCase().replace(/\s+/g, " "),
  });
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
