"use client";

import {
  ArrowRight, BadgeCheck, CircleCheck, CircleX, KeyRound, Landmark, Link2, MessageCircle, ScanSearch,
  Search, ShieldAlert, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATES } from "@/lib/constants";
import type { DictKey } from "@/lib/i18n/dictionaries";
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
      <section className="container-page grid items-center gap-12 pt-10 pb-6 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
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
        />
      </section>

      {/* Categories */}
      <section className="container-page mt-20">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("home.cat.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("home.cat.subtitle")}</p>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link key={c} href={`/schemes?tag=${c}`} className="panel panel-hover flex flex-col items-start gap-3 p-4">
              <TopicIcon tag={c} />
              <span className="text-sm font-semibold">{t(`tag.${c}` as DictKey)}</span>
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
}) {
  const { t } = useI18n();
  return (
    <article className="panel panel-hover flex flex-col p-7 sm:p-8">
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

/** Illustration built from UI pieces: a scam forward being flagged, and a matched scheme. */
function HeroVisual() {
  const { t } = useI18n();
  const Farmer = TAG_STYLE.farmer.icon;
  return (
    <div className="relative mx-auto w-full max-w-sm animate-rise [animation-delay:150ms] lg:max-w-none">
      <div className="absolute inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/25 via-primary-2/20 to-saffron/25 blur-3xl" />
      <div className="panel mx-auto max-w-[22rem] rounded-[2.2rem] p-3" style={{ boxShadow: "var(--shadow-lg)" }}>
        <div className="rounded-[1.7rem] bg-muted p-4">
          <div className="flex items-center gap-2 pb-3 text-xs font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success" /> {t("brand.name")}
          </div>

          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-[#dcf8c6] p-3 text-[13px] leading-snug text-[#1b2a12] shadow-sm">
            {t("home.mock.forward")}
          </div>

          <div className="animate-float mt-3 rounded-2xl border border-danger/30 bg-card p-3.5 shadow-md">
            <div className="flex items-center gap-2">
              <CircleX className="h-5 w-5 text-danger" />
              <span className="text-sm font-extrabold tracking-wide text-danger uppercase">{t("verify.result.wrong")}</span>
              <span className="ml-auto text-xs font-semibold text-muted-foreground">94%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[94%] rounded-full bg-danger" />
            </div>
          </div>

          <div className="animate-float mt-3 rounded-2xl border border-success/30 bg-card p-3.5 shadow-md [animation-delay:1.5s]">
            <div className="flex items-center gap-3">
              <span className={`icon-tile h-10 w-10 ${TAG_STYLE.farmer.tint}`}><Farmer className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">PM-KISAN</p>
                <p className="text-xs text-muted-foreground">{t("home.mock.benefit")}</p>
              </div>
            </div>
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
              <CircleCheck className="h-3.5 w-3.5" /> {t("home.mock.eligible")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
