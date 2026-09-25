import type {
  Area, Category, Education, Gender, Group, Income, Occupation, StateKey, Tag,
} from "./constants";

export type Bilingual = { en: string; hi: string };
export type BilingualList = { en: string[]; hi: string[] };

/** Rules a person must satisfy. Every field is optional; a missing field means "no restriction". */
export type Criteria = {
  states?: StateKey[];
  minAge?: number;
  maxAge?: number;
  genders?: Gender[];
  occupations?: Occupation[];
  incomes?: Income[];
  educations?: Education[];
  categories?: Category[];
  areas?: Area[];
  groups?: Group[];
};

export type Scheme = {
  id: string;
  level: "central" | "state";
  stateKey: StateKey | null;
  name: Bilingual;
  desc: Bilingual;
  benefits: Bilingual;
  eligibility: Bilingual;
  documents: BilingualList;
  url: string;
  tags: Tag[];
  popularity: number;
  year: number | null;
  criteria: Criteria;
  source: "seed" | "ai";
  createdAt: string;
  lastVerifiedAt: string | null;
};

/** Answers from the "Find My Schemes" form. Empty string means "Any". */
export type Profile = {
  state: StateKey | "";
  age: string;
  gender: Gender | "";
  occupation: Occupation | "";
  income: Income | "";
  education: Education | "";
  category: Category | "";
  area: Area | "";
  groups: Group[];
};

export const EMPTY_PROFILE: Profile = {
  state: "", age: "", gender: "", occupation: "", income: "",
  education: "", category: "", area: "", groups: [],
};

export function isEmptyProfile(p: Profile): boolean {
  return (
    !p.state && !p.age && !p.gender && !p.occupation && !p.income &&
    !p.education && !p.category && !p.area && p.groups.length === 0
  );
}

function excludes<T>(allowed: T[] | undefined, value: T | ""): boolean {
  return !!allowed && allowed.length > 0 && value !== "" && !allowed.includes(value as T);
}

/**
 * True when nothing in the profile rules the scheme out. Unanswered questions
 * never exclude a scheme, so a sparse profile gives a broad list.
 */
export function matchesProfile(scheme: Scheme, p: Profile): boolean {
  const c = scheme.criteria;

  if (p.state) {
    if (scheme.level === "state" && scheme.stateKey && scheme.stateKey !== p.state) return false;
    if (excludes(c.states, p.state)) return false;
  }

  const age = p.age ? Number(p.age) : null;
  if (age !== null && !Number.isNaN(age)) {
    if (c.minAge !== undefined && age < c.minAge) return false;
    if (c.maxAge !== undefined && age > c.maxAge) return false;
  }

  if (excludes(c.genders, p.gender)) return false;
  if (excludes(c.occupations, p.occupation)) return false;
  if (excludes(c.incomes, p.income)) return false;
  if (excludes(c.educations, p.education)) return false;
  if (excludes(c.areas, p.area)) return false;

  // Categories (SC/ST/...) and groups (women/senior/...) often work as
  // alternatives, e.g. "SC, ST or women entrepreneurs". When a scheme lists
  // both, satisfying either one is enough.
  const hasCats = !!c.categories?.length;
  const hasGroups = !!c.groups?.length;
  const catOk = !hasCats || !p.category || c.categories!.includes(p.category as Category);
  const groupOk = !hasGroups || c.groups!.some((g) => p.groups.includes(g));
  if (hasCats && hasGroups) {
    if (!catOk && !groupOk) return false;
  } else if (hasCats) {
    if (!catOk) return false;
  } else if (hasGroups) {
    // A women-only scheme should still show for a female user who did not tick "Women".
    const impliedGroups = p.gender === "female" ? [...p.groups, "women" as Group] : p.groups;
    if (!c.groups!.some((g) => impliedGroups.includes(g))) return false;
  }

  return true;
}

export type SortKey = "popular" | "latest" | "new";

export function sortSchemes(list: Scheme[], sort: SortKey): Scheme[] {
  const copy = [...list];
  if (sort === "latest") copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  else if (sort === "new") copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  else copy.sort((a, b) => b.popularity - a.popularity);
  return copy;
}

/** Stable, URL-safe id derived from the English name. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
