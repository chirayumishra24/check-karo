"use client";

import { ArrowUpRight, ChevronRight, FileText, HandCoins, Sparkles, UserCheck } from "lucide-react";
import Link from "next/link";
import { stateName } from "@/lib/constants";
import type { DictKey } from "@/lib/i18n/dictionaries";
import type { Scheme } from "@/lib/schemes";
import { ExternalLink } from "./external-link";
import { schemeTopic, TopicIcon } from "./icons";
import { useI18n } from "./providers";

export function SchemeCard({ scheme, isNew }: { scheme: Scheme; isNew?: boolean }) {
  const { t, lang } = useI18n();
  const place = scheme.level === "central" ? t("tag.central") : stateName(scheme.stateKey, lang) || t("tag.state");

  return (
    <article
      className={`panel panel-hover group flex flex-col overflow-hidden ${isNew ? "ring-2 ring-success ring-offset-2 ring-offset-background" : ""}`}
    >
      <div className="flex items-start gap-4 p-6 pb-0">
        <TopicIcon tag={schemeTopic(scheme.tags)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-primary">{place}</span>
            {scheme.year ? <span className="text-muted-foreground">· {scheme.year}</span> : null}
            {isNew ? (
              <span className="rounded-full bg-success px-2.5 py-0.5 text-white">{t("schemes.badge.new")}</span>
            ) : scheme.source === "ai" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-saffron-soft px-2.5 py-0.5 text-saffron">
                <Sparkles className="h-3 w-3" /> {t("schemes.badge.ai")}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg leading-snug font-bold">
            <Link href={`/schemes/${scheme.id}`} className="hover:text-primary">{scheme.name[lang]}</Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{scheme.desc[lang]}</p>
        </div>
      </div>

      <div className="mx-6 mt-5 flex gap-3 rounded-2xl bg-success-soft p-4">
        <HandCoins className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="text-[11px] font-bold tracking-wide text-success uppercase">{t("schemes.card.benefits")}</p>
          <p className="mt-0.5 text-sm font-medium">{scheme.benefits[lang]}</p>
        </div>
      </div>

      <div className="space-y-3 px-6 pt-4 text-sm">
        <p className="flex gap-2.5">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span><span className="font-semibold">{t("schemes.card.eligibility")}: </span>{scheme.eligibility[lang]}</span>
        </p>
        <div className="flex gap-2.5">
          <FileText className="mt-1 h-4 w-4 shrink-0 text-primary" />
          <div className="flex flex-wrap gap-1.5">
            {scheme.documents[lang].map((d) => (
              <span key={d} className="rounded-lg border border-border bg-background px-2 py-0.5 text-xs">{d}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-border p-4 pt-4 sm:px-6">
        <ExternalLink href={scheme.url} className="btn-primary flex-1 sm:flex-none">
          {t("schemes.card.website")} <ArrowUpRight className="h-4 w-4" />
        </ExternalLink>
        <Link href={`/schemes/${scheme.id}`} className="btn-ghost">
          {t("schemes.card.details")} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <p className="-mt-2 truncate px-6 pb-4 text-[11px] text-muted-foreground" title={scheme.url}>{hostOf(scheme.url)}</p>
    </article>
  );
}

export function TagLabel({ tag }: { tag: string }) {
  const { t } = useI18n();
  return <>{t(`tag.${tag}` as DictKey)}</>;
}

export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
