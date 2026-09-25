"use client";

import {
  ArrowLeft, ArrowUpRight, BadgeCheck, Building2, CalendarDays, CircleCheck, HandCoins, Landmark,
  Share2, ShieldAlert, Sparkles, Tags, UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { stateName } from "@/lib/constants";
import type { Scheme } from "@/lib/schemes";
import { ExternalLink } from "./external-link";
import { schemeTopic, TopicIcon } from "./icons";
import { hostOf, TagLabel } from "./scheme-card";
import { useI18n } from "./providers";

export function SchemeDetail({ scheme }: { scheme: Scheme }) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const place = scheme.level === "central" ? t("tag.central") : `${t("tag.state")} · ${stateName(scheme.stateKey, lang)}`;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: scheme.name[lang], text: scheme.desc[lang], url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch { /* user cancelled */ }
  };

  return (
    <>
      <section className="container-page animate-rise pt-6">
        <Link href="/schemes" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("schemes.detail.back")}
        </Link>

        <div className="relative mt-5 overflow-hidden rounded-3xl border border-border p-7 sm:p-10" style={{ boxShadow: "var(--shadow)" }}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-card to-saffron-soft" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <TopicIcon tag={schemeTopic(scheme.tags)} size="lg" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-card px-3 py-1 text-primary">{place}</span>
                {scheme.source === "ai" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-saffron">
                    <Sparkles className="h-3 w-3" /> {t("schemes.badge.ai")}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{scheme.name[lang]}</h1>
              <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{scheme.desc[lang]}</p>
              <div className="mt-6 hidden flex-wrap gap-3 sm:flex">
                <ExternalLink href={scheme.url} className="btn-primary px-6 py-3.5 text-base">
                  {t("schemes.card.website")} <ArrowUpRight className="h-4 w-4" />
                </ExternalLink>
                <button type="button" onClick={share} className="btn-ghost px-6 py-3.5 text-base">
                  <Share2 className="h-4 w-4" /> {copied ? t("schemes.card.copied") : t("schemes.card.share")}
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{hostOf(scheme.url)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-success/25 bg-success-soft p-6">
              <HandCoins className="h-6 w-6 text-success" />
              <h2 className="mt-3 text-sm font-bold tracking-wide text-success uppercase">{t("schemes.card.benefits")}</h2>
              <p className="mt-2 text-base font-medium">{scheme.benefits[lang]}</p>
            </div>
            <div className="panel p-6">
              <UserCheck className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-sm font-bold tracking-wide text-primary uppercase">{t("schemes.card.eligibility")}</h2>
              <p className="mt-2 text-base">{scheme.eligibility[lang]}</p>
            </div>
          </div>

          <div className="panel p-6 sm:p-7">
            <h2 className="text-lg font-bold">{t("schemes.card.documents")}</h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {scheme.documents[lang].map((d) => (
                <li key={d} className="flex items-center gap-3 rounded-2xl bg-muted/70 px-4 py-3 text-sm font-medium">
                  <CircleCheck className="h-5 w-5 shrink-0 text-success" /> {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-6 sm:p-7">
            <h2 className="text-lg font-bold">{t("schemes.detail.apply")}</h2>
            <ol className="mt-4 space-y-4">
              {(["schemes.detail.apply1", "schemes.detail.apply2", "schemes.detail.apply3"] as const).map((k, i) => (
                <li key={k} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                  <p className="pt-1 text-sm">{t(k)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="panel p-6">
            <h2 className="font-bold">{t("schemes.detail.facts")}</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <Fact icon={scheme.level === "central" ? Landmark : Building2} label={t("schemes.detail.level")} value={place} />
              {scheme.year ? <Fact icon={CalendarDays} label={t("schemes.detail.launched")} value={String(scheme.year)} /> : null}
              {scheme.lastVerifiedAt ? (
                <Fact
                  icon={BadgeCheck}
                  label="AI"
                  value={t("schemes.detail.verified", {
                    d: new Date(scheme.lastVerifiedAt).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN"),
                  })}
                />
              ) : null}
              <div className="flex gap-3">
                <Tags className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="label">{t("schemes.detail.topics")}</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {scheme.tags.map((tag) => (
                      <Link key={tag} href={`/schemes?tag=${tag}`} className="chip py-1"><TagLabel tag={tag} /></Link>
                    ))}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-saffron/30 bg-saffron-soft p-6 text-sm">
            <ShieldAlert className="h-6 w-6 text-saffron" />
            <p className="mt-3 font-medium">{t("schemes.detail.warning")}</p>
          </div>
        </aside>
      </section>

      {/* Sticky call to action on phones, above the tab bar. */}
      <div className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/90 p-3 backdrop-blur-xl sm:hidden">
        <div className="flex gap-2">
          <ExternalLink href={scheme.url} className="btn-primary flex-1 py-3.5 text-base">
            {t("schemes.card.website")} <ArrowUpRight className="h-4 w-4" />
          </ExternalLink>
          <button type="button" onClick={share} aria-label={t("schemes.card.share")} className="btn-ghost px-4">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Landmark; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <dt className="label">{label}</dt>
        <dd className="mt-0.5 font-medium">{value}</dd>
      </div>
    </div>
  );
}
