"use client";

import {
  ArrowRight, BadgeCheck, CircleCheck, CircleX, KeyRound, Landmark, Link2, MessageCircle, ScanSearch,
  Search, ShieldAlert, ShieldCheck, Smartphone, Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATES } from "@/lib/constants";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { AppDownload, APK_SIZE_MB } from "./app-download";
import { TAG_STYLE, TopicIcon } from "./icons";
import { useI18n } from "./providers";

const CATEGORIES = [
  "farmer", "student", "women", "senior", "health", "housing",
  "employment", "business", "pension", "disabled", "insurance", "scholarship",
] as const;

export function Home({ schemeCount }: { schemeCount: number | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <>
      {/* Hero */}
      <section className="container-page grid grid-cols-1 items-center gap-12 pt-10 pb-6 sm:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pt-20">
        <div className="animate-rise">
          <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> {t("home.badge")}</span>
          <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            {t("home.title.a")} <span className="text-gradient">{t("home.title.b")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("home.subtitle")}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(q.trim() ? `/schemes?q=${encodeURIComponent(q.trim())}` : "/schemes");
            }}
            className="panel mt-8 flex items-center gap-2 p-2 pl-4"
          >
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("home.search.placeholder")}
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-muted-foreground/80"
              enterKeyHint="search"
              aria-label={t("home.search.placeholder")}
            />
            <button type="submit" className="btn-primary shrink-0 px-5">
              <span className="hidden sm:inline">{t("home.search.go")}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/verify" className="btn-ghost"><ScanSearch className="h-4 w-4 text-primary" />{t("home.verify.cta")}</Link>
            <Link href="/schemes" className="btn-ghost"><Landmark className="h-4 w-4 text-success" />{t("home.schemes.cta")}</Link>
          </div>
        </div>

        <HeroVisual />
      </section>

      {/* Stats */}
      <section className="container-page mt-10">
        <div className="panel grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
          {[
            [schemeCount ? `${schemeCount}+` : "—", "home.stat.schemes"],
            [String(STATES.length), "home.stat.states"],
            ["2", "home.stat.languages"],
            ["₹0", "home.stat.cost"],
          ].map(([value, key]) => (
            <div key={key} className="px-6 py-5 text-center">
              <p className="text-gradient text-3xl font-extrabold">{value}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{t(key as DictKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources we compare against (plain text: no logos, no implied endorsement) */}
      <section className="container-page mt-8">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-5">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("home.trust.title")}</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {(["home.trust.pib", "home.trust.myscheme", "home.trust.indiagov", "home.trust.states", "home.trust.news"] as const).map((k) => (
              <li key={k} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80">{t(k)}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Two main tools */}
      <section className="container-page mt-16 grid gap-6 md:grid-cols-2">
        <FeatureCard
          href="/verify"
          icon={<ScanSearch className="h-6 w-6" />}
          tint="bg-primary-soft text-primary"
          title="home.verify.title"
          desc="home.verify.desc"
          points={["home.verify.p1", "home.verify.p2", "home.verify.p3"]}
          cta="home.verify.cta"
          button="btn-primary"
          image="/images/fraud-shield.jpg"
        />
        <FeatureCard
          href="/schemes"
          icon={<Landmark className="h-6 w-6" />}
          tint="bg-success-soft text-success"
          title="home.schemes.title"
          desc="home.schemes.desc"
          points={["home.schemes.p1", "home.schemes.p2", "home.schemes.p3"]}
          cta="home.schemes.cta"
          button="btn-saffron"
          media={<SchemesMedia />}
        />
      </section>

      {/* Categories */}
      <section className="container-page mt-20">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("home.cat.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("home.cat.subtitle")}</p>
        <div className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/schemes?tag=${c}`}
              className="panel panel-hover flex flex-col items-center gap-2 px-2 py-4 text-center sm:items-start sm:gap-3 sm:p-4 sm:text-left"
            >
              <TopicIcon tag={c} />
              <span className="text-xs font-semibold sm:text-sm">{t(`tag.${c}` as DictKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container-page mt-20">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("home.how.title")}</h2>
        <ol className="mt-7 grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="panel relative overflow-hidden p-6">
              <span className="text-gradient absolute -top-3 right-3 text-7xl font-black opacity-20 select-none">{n}</span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{n}</span>
              <h3 className="mt-4 text-lg font-bold">{t(`home.how.${n}.title` as DictKey)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`home.how.${n}.body` as DictKey)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Safety */}
      <section className="container-page mt-20">
        <div className="relative overflow-hidden rounded-3xl border border-saffron/30 bg-saffron-soft p-7 sm:p-10">
          <ShieldAlert className="absolute -right-6 -bottom-8 h-48 w-48 text-saffron opacity-10" />
          <h2 className="flex items-center gap-3 text-xl font-extrabold sm:text-2xl">
            <ShieldAlert className="h-7 w-7 text-saffron" /> {t("home.safety.title")}
          </h2>
          <ul className="relative mt-6 grid gap-4 md:grid-cols-3">
            {[
              [KeyRound, "home.safety.t1"],
              [BadgeCheck, "home.safety.t2"],
              [Link2, "home.safety.t3"],
            ].map(([Icon, key]) => {
              const I = Icon as typeof KeyRound;
              return (
                <li key={key as string} className="flex gap-3 rounded-2xl bg-card/80 p-4 text-sm backdrop-blur">
                  <I className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
                  {t(key as DictKey)}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Mobile App & PWA Showcase */}
      <section className="container-page mt-20">
        <div className="panel relative overflow-hidden p-8 sm:p-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <span className="eyebrow"><Smartphone className="h-3.5 w-3.5 text-primary" /> {t("app.eyebrow")}</span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("app.title")}</h2>
              <p className="mt-3 text-base text-muted-foreground">{t("app.body")}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-muted px-3.5 py-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-success" /> {t("app.chip.private")}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-muted px-3.5 py-2 font-medium">
                  <Sparkles className="h-4 w-4 text-saffron" /> {t("app.chip.size", { size: APK_SIZE_MB })}
                </div>
              </div>
              <AppDownload />
            </div>

            <HomeScreenMock />
          </div>
        </div>
      </section>

      {/* Assistant CTA */}
      <section className="container-page mt-20">
        <div
          className="relative overflow-hidden rounded-3xl p-8 text-white sm:p-12"
          style={{ backgroundImage: "linear-gradient(120deg, #2e2799, #5b3fd6 55%, #c0630a)" }}
        >
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t("home.cta.title")}</h2>
              <p className="mt-2 max-w-lg text-white/80">{t("home.cta.body")}</p>
            </div>
            <Link href="/assistant" className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#2e2799] shadow-lg transition-transform hover:-translate-y-px">
              <MessageCircle className="h-4 w-4" /> {t("home.cta.button")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureCard(props: {
  href: string; icon: React.ReactNode; tint: string; title: DictKey; desc: DictKey;
  points: DictKey[]; cta: DictKey; button: string;
  /** Decorative header: a photo, or a UI illustration via `media`. */
  image?: string;
  media?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <article className="panel panel-hover flex flex-col overflow-hidden p-7 sm:p-8">
      {props.image || props.media ? (
        <div className="relative -mx-7 -mt-7 mb-6 h-44 overflow-hidden border-b border-border bg-muted/40 sm:-mx-8 sm:-mt-8 sm:h-48">
          {props.image ? (
            <>
              <Image
                src={props.image}
                alt=""
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
            </>
          ) : (
            props.media
          )}
        </div>
      ) : null}
      <span className={`icon-tile h-12 w-12 ${props.tint}`}>{props.icon}</span>
      <h2 className="mt-5 text-2xl font-extrabold tracking-tight">{t(props.title)}</h2>
      <p className="mt-2 text-muted-foreground">{t(props.desc)}</p>
      <ul className="mt-5 flex-1 space-y-2.5 text-sm">
        {props.points.map((p) => (
          <li key={p} className="flex items-center gap-2.5">
            <CircleCheck className="h-4 w-4 shrink-0 text-success" /> {t(p)}
          </li>
        ))}
      </ul>
      <Link href={props.href} className={`${props.button} mt-7 py-3.5 text-base`}>
        {t(props.cta)} <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

/** A phone home screen with the Check Karo icon installed among generic app tiles. */
function HomeScreenMock() {
  const { t } = useI18n();
  const tiles = ["bg-[#f6d6c8]", "bg-[#cfe3f7]", "bg-[#d8efd9]", "bg-[#f3e3b5]", "bg-[#e3d9f5]", "bg-[#f7d0dc]", "bg-[#cdeae8]", "bg-[#e6e1d6]"];
  return (
    <div className="relative mx-auto w-full max-w-[16rem]">
      <div className="absolute inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/25 to-saffron/20 blur-3xl" />
      <div className="rounded-[2.4rem] border border-border bg-card p-2.5" style={{ boxShadow: "var(--shadow-lg)" }}>
        <div
          className="rounded-[1.9rem] px-5 pt-8 pb-6"
          style={{ backgroundImage: "linear-gradient(160deg, #2e2799 0%, #5b3fd6 55%, #c0630a 120%)" }}
        >
          <p className="text-center text-3xl font-light text-white/90">9:41</p>
          <div className="mt-8 grid grid-cols-4 gap-x-3 gap-y-5">
            {tiles.slice(0, 5).map((c, i) => (
              <span key={i} className={`aspect-square rounded-2xl ${c} opacity-80`} />
            ))}
            <span className="flex flex-col items-center gap-1">
              <span className="grid aspect-square w-full place-items-center rounded-2xl bg-white ring-4 ring-white/40">
                <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={2.4} />
              </span>
              <span className="text-[9px] font-semibold text-white">{t("brand.name")}</span>
            </span>
            {tiles.slice(5, 7).map((c, i) => (
              <span key={i} className={`aspect-square rounded-2xl ${c} opacity-80`} />
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur">
            <CircleCheck className="h-3.5 w-3.5 text-emerald-300" /> {t("app.chip.private")}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Header for the schemes card: stacked scheme rows, as they appear in the finder. */
function SchemesMedia() {
  const { t } = useI18n();
  const rows = [
    { tag: "student", w: "w-28" },
    { tag: "farmer", w: "w-36" },
    { tag: "senior", w: "w-24" },
  ] as const;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-success-soft via-card to-saffron-soft">
      <div
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: "radial-gradient(var(--border) 1.2px, transparent 1.2px)", backgroundSize: "16px 16px" }}
      />
      <div className="relative w-[78%] max-w-xs space-y-2">
        {rows.map(({ tag, w }, i) => {
          const Icon = TAG_STYLE[tag].icon;
          return (
            <div
              key={tag}
              className={`flex items-center gap-2.5 rounded-2xl border border-border bg-card p-2.5 ${i === 1 ? "translate-x-4" : ""}`}
              style={{ boxShadow: "var(--shadow)" }}
            >
              <span className={`icon-tile h-8 w-8 rounded-xl ${TAG_STYLE[tag].tint}`}><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1 space-y-1.5">
                <span className={`block h-2 ${w} max-w-full rounded-full bg-foreground/15`} />
                <span className="block h-1.5 w-16 rounded-full bg-muted-foreground/20" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                <CircleCheck className="h-3 w-3" /> {t("home.mock.eligible")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Product illustration made from real UI pieces: a phone showing a scam
 * forward being flagged and a scheme match, with two floating result cards.
 */
function HeroVisual() {
  const { t } = useI18n();
  const Farmer = TAG_STYLE.farmer.icon;
  const Student = TAG_STYLE.student.icon;
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto w-full max-w-md animate-rise [animation-delay:150ms] lg:max-w-none">
      {/* soft glow + dotted backdrop */}
      <div className="absolute inset-4 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/30 via-primary-2/20 to-saffron/25 blur-3xl" />
      <div
        className="absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]"
        style={{ backgroundImage: "radial-gradient(var(--border) 1.2px, transparent 1.2px)", backgroundSize: "18px 18px" }}
      />

      {/* phone */}
      <div className="mx-auto w-[17.5rem] rounded-[2.6rem] border border-border bg-card p-2.5 sm:w-[19rem]" style={{ boxShadow: "var(--shadow-lg)" }}>
        <div className="overflow-hidden rounded-[2.1rem] bg-muted">
          <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] font-semibold text-muted-foreground">
            <span>9:41</span>
            <span className="h-4 w-16 rounded-full bg-foreground/90" />
            <span>5G</span>
          </div>
          <div className="flex items-center gap-2 border-b border-border/70 bg-card/80 px-4 py-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}>
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold">{t("brand.name")}</span>
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-success" />
          </div>

          <div className="space-y-3 p-3.5">
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-[#dcf8c6] px-3 py-2 text-[11.5px] leading-snug text-[#1b2a12] shadow-sm">
              {t("home.mock.forward")}
            </div>

            <div className="rounded-2xl border border-danger/30 bg-card p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <CircleX className="h-4 w-4 shrink-0 text-danger" />
                <span className="text-[11px] font-extrabold tracking-wide text-danger uppercase">{t("verify.result.wrong")}</span>
                <span className="ml-auto text-[11px] font-bold text-muted-foreground">94%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[94%] rounded-full bg-danger" />
              </div>
            </div>

            <div className="rounded-2xl border border-success/30 bg-card p-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className={`icon-tile h-8 w-8 rounded-xl ${TAG_STYLE.farmer.tint}`}><Farmer className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-bold">PM-KISAN</p>
                  <p className="truncate text-[10.5px] text-muted-foreground">{t("home.mock.benefit")}</p>
                </div>
              </div>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">
                <CircleCheck className="h-3 w-3" /> {t("home.mock.eligible")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* floating: sources checked */}
      <div className="animate-float absolute top-10 -left-2 hidden items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 pr-4 backdrop-blur sm:flex lg:-left-6" style={{ boxShadow: "var(--shadow-lg)" }}>
        <span className="relative grid h-10 w-10 place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
            <circle cx="18" cy="18" r={r} fill="none" stroke="var(--muted)" strokeWidth="4" />
            <circle cx="18" cy="18" r={r} fill="none" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * 0.12} />
          </svg>
          <BadgeCheck className="h-4 w-4 text-success" />
        </span>
        <span className="text-xs font-semibold">{t("home.mock.sources")}</span>
      </div>

      {/* floating: schemes found */}
      <div className="animate-float absolute top-60 -right-2 hidden w-52 rounded-2xl border border-border bg-card/95 p-3 backdrop-blur [animation-delay:1.5s] sm:block lg:-right-6" style={{ boxShadow: "var(--shadow-lg)" }}>
        <p className="flex items-center gap-1.5 text-xs font-bold">
          <Sparkles className="h-3.5 w-3.5 text-saffron" /> {t("home.mock.found", { n: 3 })}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`icon-tile h-7 w-7 rounded-lg ${TAG_STYLE.student.tint}`}><Student className="h-3.5 w-3.5" /></span>
          <span className="h-2 flex-1 rounded-full bg-muted" />
          <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[9px] font-bold text-success">{t("home.mock.new")}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`icon-tile h-7 w-7 rounded-lg ${TAG_STYLE.farmer.tint}`}><Farmer className="h-3.5 w-3.5" /></span>
          <span className="h-2 w-3/4 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
