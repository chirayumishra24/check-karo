"use client";

import {
  CalendarDays, CircleAlert, CircleCheck, CircleHelp, CircleX, ExternalLink as ExternalIcon, FileSearch, FileText,
  Lightbulb, Link2, LoaderCircle, Quote, ScanSearch, ScrollText, ShieldCheck, Type, UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { DictKey } from "@/lib/i18n/dictionaries";
import type { VerdictResult } from "@/lib/verify";
import { ExternalLink } from "./external-link";
import { SearchSuggestions } from "./search-suggestions";
import { useI18n } from "./providers";

type Mode = "text" | "url" | "file";
const MIMES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX = 8 * 1024 * 1024;
const TABS = [
  { mode: "text", icon: Type },
  { mode: "url", icon: Link2 },
  { mode: "file", icon: UploadCloud },
] as const;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

export function Verifier() {
  const { t, lang } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerdictResult | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    if (mode === "text" && text.trim().length < 3) return setError(t("verify.error.empty"));
    if (mode === "url" && !/^https?:\/\/\S+\.\S+/.test(url.trim())) return setError(t("verify.error.url"));
    if (mode === "file" && !file) return setError(t("verify.error.empty"));

    setBusy(true);
    try {
      const input =
        mode === "file" && file ? { mode, name: file.name, mime: file.type, base64: await toBase64(file) }
        : mode === "url" ? { mode, url: url.trim() }
        : { mode, text: text.trim() };
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, input }),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch {
      setError(t("verify.error.failed"));
    } finally {
      setBusy(false);
    }
  };

  const pick = (f: File | null) => {
    setError(null);
    if (!f) return setFile(null);
    if (!MIMES.includes(f.type)) { setFile(null); return setError(t("verify.error.file")); }
    if (f.size > MAX) { setFile(null); return setError(t("verify.error.size")); }
    setFile(f);
  };

  return (
    <section className="container-page max-w-3xl animate-rise [animation-delay:80ms]">
      {/* Visual Trust Banner */}
      <div className="panel mb-6 overflow-hidden border-primary/20 bg-gradient-to-r from-primary-soft/60 via-card to-saffron-soft/40 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border/80 shadow-md">
            <Image
              src="/images/fraud-shield.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t("verify.engine.badge")}</span>
            </div>
            <h2 className="mt-1.5 text-base font-extrabold sm:text-lg">{t("verify.engine.title")}</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t("verify.engine.body")}</p>
          </div>
        </div>
      </div>

      <div className="panel p-5 sm:p-8">
        <div className="seg grid w-full grid-cols-3" role="tablist">
          {TABS.map(({ mode: m, icon: Icon }) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setError(null); }}
              className={`seg-item justify-center py-2.5 ${mode === m ? "seg-on text-primary" : ""}`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{t(`verify.tab.${m}` as DictKey)}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              maxLength={6000}
              placeholder={t("verify.text.placeholder")}
              className="field h-auto resize-none py-4 text-base leading-relaxed"
            />
          ) : null}
          {mode === "url" ? (
            <div className="relative">
              <Link2 className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                inputMode="url"
                maxLength={2000}
                placeholder={t("verify.url.placeholder")}
                className="field h-14 pl-12 text-base"
              />
            </div>
          ) : null}
          {mode === "file" ? (
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0] ?? null); }}
                className={`flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed px-6 py-12 transition-colors ${
                  drag ? "border-primary bg-primary-soft" : "border-border bg-muted/40 hover:border-primary/60"
                }`}
              >
                <span className="icon-tile h-14 w-14 bg-primary-soft text-primary"><UploadCloud className="h-7 w-7" /></span>
                <span className="mt-1 text-base font-semibold">{t("verify.file.choose")}</span>
                <span className="text-xs text-muted-foreground">{t("verify.file.hint")}</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <p className="mt-3 flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
                  <FileText className="h-4 w-4 text-primary" /> <span className="truncate">{file.name}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            <CircleAlert className="h-4 w-4 shrink-0" /> {error}
          </p>
        ) : null}

        <button type="button" onClick={submit} disabled={busy} className="btn-primary mt-5 w-full py-4 text-base">
          {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ScanSearch className="h-5 w-5" />}
          {busy ? t("verify.loading") : t("verify.button")}
        </button>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t("verify.disclaimer")}</p>
      </div>

      <div ref={resultRef} className="scroll-mt-24">
        {result ? <VerdictCard result={result} /> : null}
      </div>
    </section>
  );
}

const LOOK = {
  verified: { Icon: CircleCheck, text: "text-success", soft: "bg-success-soft", stroke: "var(--success)" },
  not_verified: { Icon: CircleHelp, text: "text-neutral", soft: "bg-neutral-soft", stroke: "var(--neutral)" },
  wrong: { Icon: CircleX, text: "text-danger", soft: "bg-danger-soft", stroke: "var(--danger)" },
} as const;

function VerdictCard({ result }: { result: VerdictResult }) {
  const { t, lang } = useI18n();
  const look = LOOK[result.verdict];
  const r = 26;
  const c = 2 * Math.PI * r;

  return (
    <div className="panel animate-rise mt-8 overflow-hidden" aria-live="polite">
      <div className={`flex items-center gap-4 p-6 sm:p-7 ${look.soft}`}>
        <look.Icon className={`h-12 w-12 shrink-0 ${look.text}`} strokeWidth={2.2} />
        <div className="flex-1">
          <h2 className={`text-2xl font-extrabold tracking-tight uppercase sm:text-3xl ${look.text}`}>
            {t(`verify.result.${result.verdict}` as DictKey)}
          </h2>
          <p className="mt-1 text-sm text-foreground/80">{result.claim}</p>
        </div>
        <div className="relative grid h-16 w-16 shrink-0 place-items-center" title={t("verify.result.confidence")}>
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-card" />
            <circle
              cx="32" cy="32" r={r} fill="none" stroke={look.stroke} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - result.confidence / 100)}
            />
          </svg>
          <span className="text-sm font-extrabold">{result.confidence}%</span>
        </div>
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7">
        <Item icon={FileSearch} label="verify.result.reason">{result.reason}</Item>
        <Item icon={ScrollText} label="verify.result.evidence">{result.evidence}</Item>
        <div className="sm:col-span-2">
          <div className="flex gap-3 rounded-2xl border border-saffron/30 bg-saffron-soft p-4">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-saffron" />
            <div>
              <p className="label">{t("verify.result.action")}</p>
              <p className="mt-1 text-sm font-medium">{result.action || "—"}</p>
            </div>
          </div>
        </div>
        <Item icon={ExternalIcon} label="verify.result.sources">
          {result.sources.length ? (
            <span className="mt-1 block space-y-1.5">
              {result.sources.map((s) => (
                <ExternalLink key={s.url} href={s.url} className="flex items-center gap-1.5 font-medium text-primary hover:underline">
                  {s.name} <ExternalIcon className="h-3.5 w-3.5" />
                </ExternalLink>
              ))}
            </span>
          ) : "—"}
        </Item>
        <Item icon={CalendarDays} label="verify.result.date">
          {new Date(result.checkedAt).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </Item>
      </div>

      {result.extracted ? (
        <div className="mx-6 mb-6 rounded-2xl bg-muted p-4 sm:mx-7 sm:mb-7">
          <p className="label flex items-center gap-1.5"><Quote className="h-3.5 w-3.5" /> {t("verify.result.extracted")}</p>
          <p className="mt-1.5 text-sm whitespace-pre-wrap">{result.extracted}</p>
        </div>
      ) : null}

      {result.suggestionsHtml ? (
        <div className="mx-6 mb-6 sm:mx-7 sm:mb-7">
          <SearchSuggestions html={result.suggestionsHtml} />
        </div>
      ) : null}
    </div>
  );
}

function Item({ icon: Icon, label, children }: { icon: typeof FileSearch; label: DictKey; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="label">{t(label)}</p>
        <div className="mt-1 text-sm">{children}</div>
      </div>
    </div>
  );
}
