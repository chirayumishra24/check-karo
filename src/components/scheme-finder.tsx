"use client";

import {
  ArrowRight, CircleAlert, CircleCheck, ClipboardList, LoaderCircle, RotateCcw, Search, SearchX, Sparkles,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AREAS, CATEGORIES, EDUCATIONS, GENDERS, GROUPS, INCOMES, OCCUPATIONS, STATES, TAGS,
} from "@/lib/constants";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { discoveryKey } from "@/lib/discovery-key";
import { EMPTY_PROFILE, isEmptyProfile, sortSchemes, type Profile, type Scheme, type SortKey } from "@/lib/schemes";
import { TAG_STYLE } from "./icons";
import { SchemeCard, TagLabel } from "./scheme-card";
import { useI18n } from "./providers";

type AiState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "found"; n: number }
  | { kind: "nothing" }
  | { kind: "cached" }
  | { kind: "error" };

const PROFILE_KEY = "checkkaro.profile";

export function SchemeFinder() {
  const { t, lang } = useI18n();
  const params = useSearchParams();
  const [initialQ] = useState(() => params.get("q")?.slice(0, 200) ?? "");
  const [draft, setDraft] = useState<Profile>(EMPTY_PROFILE);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [qInput, setQInput] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [tags, setTags] = useState<string[]>(() => {
    const tag = params.get("tag");
    return tag && (TAGS as readonly string[]).includes(tag) ? [tag] : [];
  });
  const [sort, setSort] = useState<SortKey>("popular");
  const [schemes, setSchemes] = useState<Scheme[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [ai, setAi] = useState<AiState>({ kind: "idle" });
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const searchSeq = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (p: Profile | null, query: string) => {
    setLoadError(false);
    try {
      const res = await fetch("/api/schemes/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p, q: query, tags: [] }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { schemes: Scheme[] };
      setSchemes(data.schemes);
    } catch {
      setLoadError(true);
      setSchemes((s) => s ?? []);
    }
  }, []);

  const discover = useCallback(async (p: Profile | null, query: string) => {
    if (!p && query.trim().length < 3) return;
    const seq = ++searchSeq.current;
    setAi({ kind: "running" });
    const finish = async (status: string, added: string[]) => {
      if (seq !== searchSeq.current) return;
      if (status === "done" && added.length) {
        setNewIds(new Set(added));
        await load(p, query);
        setAi({ kind: "found", n: added.length });
      } else if (status === "done") setAi({ kind: "nothing" });
      else if (status === "disabled" || status === "skipped") setAi({ kind: "idle" });
      else setAi({ kind: "error" });
    };

    // Waits for a search that is running on the server (ours or someone else's).
    const pollFor = async (key: string) => {
      let misses = 0;
      for (let i = 0; i < 75 && seq === searchSeq.current; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const poll = await fetch(`/api/schemes/discover?key=${key}`).then((r) => r.json()).catch(() => null);
        if (!poll?.status) {
          if (++misses > 5) break; // the search never started
          continue;
        }
        if (poll.status !== "running") return finish(poll.status, poll.added ?? []);
      }
      return finish("error", []);
    };

    try {
      const key = await discoveryKey(p, query);
      // Firebase Hosting cuts proxied requests off after 60 s while the search
      // keeps running on the server, so a failed or non-JSON reply means "poll".
      const data = await fetch("/api/schemes/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p, q: query, tags: [] }),
      }).then((r) => r.json()).catch(() => null);
      if (!data || data.status === "running") return pollFor(data?.key ?? key);
      if (data.status === "done" && data.startedAt && seq === searchSeq.current) {
        setAi({ kind: "cached" }); // an earlier identical search already ran
        return;
      }
      return finish(data.status, data.added ?? []);
    } catch {
      if (seq === searchSeq.current) setAi({ kind: "error" });
    }
  }, [load]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "null");
      if (saved && typeof saved === "object") {
        setDraft({ ...EMPTY_PROFILE, ...saved });
      }
    } catch { /* ignore */ }
    void load(null, initialQ).then(() => (initialQ ? discover(null, initialQ) : undefined));
  }, [load, discover, initialQ]);

  const runSearch = (p: Profile | null, query: string) => {
    setNewIds(new Set());
    setSchemes(null);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    void load(p, query).then(() => discover(p, query));
  };

  const onFind = () => {
    const p = isEmptyProfile(draft) ? null : draft;
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
    setProfile(p);
    runSearch(p, q);
  };

  const onReset = () => {
    searchSeq.current++;
    setDraft(EMPTY_PROFILE);
    setProfile(null);
    setQ("");
    setQInput("");
    setTags([]);
    setAi({ kind: "idle" });
    setNewIds(new Set());
    try { localStorage.removeItem(PROFILE_KEY); } catch { /* ignore */ }
    setSchemes(null);
    void load(null, "");
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = qInput.trim();
    setQ(query);
    runSearch(profile, query);
  };

  const visible = useMemo(() => {
    if (!schemes) return null;
    const filtered = tags.length ? schemes.filter((s) => tags.every((tag) => s.tags.includes(tag as never))) : schemes;
    const sorted = sortSchemes(filtered, sort);
    // Freshly discovered schemes go first so people notice them.
    return [...sorted.filter((s) => newIds.has(s.id)), ...sorted.filter((s) => !newIds.has(s.id))];
  }, [schemes, tags, sort, newIds]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const answered = Object.entries(draft).filter(([k, v]) => (k === "groups" ? (v as string[]).length : v)).length;

  const select = (k: keyof Profile, label: DictKey, options: readonly string[], prefix: string) => (
    <label className="block">
      <span className="label">{t(label)}</span>
      <select value={draft[k] as string} onChange={(e) => set(k, e.target.value as never)} className="field mt-1.5">
        <option value="">{t("schemes.any")}</option>
        {options.map((o) => <option key={o} value={o}>{t(`${prefix}.${o}` as DictKey)}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <section className="container-page animate-rise [animation-delay:80ms]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/50 px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="icon-tile h-10 w-10 bg-primary-soft text-primary"><ClipboardList className="h-5 w-5" /></span>
              <div>
                <p className="font-bold">{t("schemes.form.title")}</p>
                <p className="text-xs text-muted-foreground">{t("schemes.form.hint")}</p>
              </div>
            </div>
            {answered ? (
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{answered}/9</span>
            ) : null}
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="label">{t("schemes.q.state")}</span>
                <select value={draft.state} onChange={(e) => set("state", e.target.value as Profile["state"])} className="field mt-1.5">
                  <option value="">{t("schemes.any")}</option>
                  {STATES.map((s) => <option key={s.key} value={s.key}>{s[lang]}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">{t("schemes.q.age")}</span>
                <input
                  value={draft.age}
                  onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))}
                  inputMode="numeric"
                  placeholder="—"
                  className="field mt-1.5"
                />
              </label>
              {select("gender", "schemes.q.gender", GENDERS, "opt.gender")}
              {select("occupation", "schemes.q.occupation", OCCUPATIONS, "opt.occupation")}
              {select("income", "schemes.q.income", INCOMES, "opt.income")}
              {select("education", "schemes.q.education", EDUCATIONS, "opt.education")}
              {select("category", "schemes.q.category", CATEGORIES, "opt.category")}
              {select("area", "schemes.q.area", AREAS, "opt.area")}
            </div>

            <div className="mt-6">
              <p className="label">{t("schemes.q.groups")}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {GROUPS.map((g) => {
                  const on = draft.groups.includes(g);
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("groups", on ? draft.groups.filter((x) => x !== g) : [...draft.groups, g])}
                      className={`${on ? "chip-on" : "chip"} px-4 py-2 text-sm`}
                    >
                      {on ? <CircleCheck className="h-4 w-4" /> : null}
                      {t(`opt.group.${g}` as DictKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={onFind} className="btn-saffron flex-1 py-4 text-base sm:flex-none sm:px-10">
                <Search className="h-5 w-5" /> {t("schemes.find")}
              </button>
              <button type="button" onClick={onReset} className="btn-ghost py-4">
                <RotateCcw className="h-4 w-4" /> {t("schemes.reset")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section ref={resultsRef} className="container-page mt-10 scroll-mt-20">
        <div className="sticky top-[calc(64px+env(safe-area-inset-top))] z-20 -mx-4 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <form onSubmit={onSearch} className="flex w-full items-center gap-2 lg:max-w-lg">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder={t("schemes.search")}
                  className="field pl-11"
                  enterKeyHint="search"
                  maxLength={200}
                />
              </div>
              <button type="submit" className="btn-primary h-12 shrink-0" aria-label={t("schemes.searchGo")}>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <div className="seg self-start">
              {(["popular", "latest", "new"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSort(s)} className={`seg-item px-3 py-1.5 text-xs sm:text-sm ${sort === s ? "seg-on" : ""}`}>
                  {t(`schemes.sort.${s}` as DictKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {TAGS.map((tag) => {
              const on = tags.includes(tag);
              const Icon = TAG_STYLE[tag]?.icon;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTags(on ? tags.filter((x) => x !== tag) : [...tags, tag])}
                  className={`${on ? "chip-on" : "chip"} shrink-0`}
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                  <TagLabel tag={tag} />
                </button>
              );
            })}
          </div>
        </div>

        <AiBanner state={ai} />

        <div className="mt-7 flex items-baseline justify-between">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{profile || q ? t("schemes.results") : t("schemes.all")}</h2>
          {visible ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {t("schemes.count", { n: visible.length })}
            </span>
          ) : null}
        </div>

        {loadError ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-danger"><CircleAlert className="h-4 w-4" />{t("verify.error.failed")}</p>
        ) : null}

        {visible === null ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="panel p-6">
                <div className="flex gap-4">
                  <div className="h-11 w-11 animate-pulse rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-5 h-16 animate-pulse rounded-2xl bg-muted" />
                <div className="mt-4 h-10 animate-pulse rounded-2xl bg-muted" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="panel mt-6 flex flex-col items-center p-10 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{t("schemes.none")}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {visible.map((s) => <SchemeCard key={s.id} scheme={s} isNew={newIds.has(s.id)} />)}
          </div>
        )}
      </section>
    </>
  );
}

function AiBanner({ state }: { state: AiState }) {
  const { t } = useI18n();
  if (state.kind === "idle") return null;
  const text =
    state.kind === "running" ? t("schemes.ai.running")
    : state.kind === "found" ? t("schemes.ai.found", { n: state.n })
    : state.kind === "nothing" ? t("schemes.ai.nothing")
    : state.kind === "cached" ? t("schemes.ai.cached")
    : t("schemes.ai.error");
  const tone =
    state.kind === "found" ? "border-success/40 bg-success-soft text-success"
    : state.kind === "error" ? "border-danger/40 bg-danger-soft text-danger"
    : state.kind === "running" ? "border-primary/30 bg-primary-soft text-primary"
    : "border-border bg-card text-muted-foreground";
  return (
    <div className={`animate-rise mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium ${tone}`} role="status" aria-live="polite">
      {state.kind === "running" ? <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" /> : <Sparkles className="h-5 w-5 shrink-0" />}
      {text}
    </div>
  );
}
