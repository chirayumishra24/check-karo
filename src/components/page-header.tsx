"use client";

import type { DictKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "./providers";

export function PageHeader({
  title, subtitle, eyebrow, icon, narrow,
}: {
  title: DictKey; subtitle?: DictKey; eyebrow?: DictKey; icon?: React.ReactNode;
  /** Centre the header over a narrow (max-w-3xl) content column. */
  narrow?: boolean;
}) {
  const { t } = useI18n();
  return (
    <section className={`container-page animate-rise pt-10 pb-8 sm:pt-14 ${narrow ? "max-w-3xl text-center" : ""}`}>
      {eyebrow ? <span className="eyebrow">{icon}{t(eyebrow)}</span> : null}
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">{t(title)}</h1>
      {subtitle ? (
        <p className={`mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg ${narrow ? "mx-auto" : ""}`}>{t(subtitle)}</p>
      ) : null}
    </section>
  );
}

/** Title + one paragraph, used by Privacy / Terms. */
export function TextPage({ title, body }: { title: DictKey; body: DictKey }) {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={title} />
      <section className="container-page max-w-3xl">
        <p className="panel p-7 text-base leading-relaxed sm:p-9">{t(body)}</p>
      </section>
    </>
  );
}
