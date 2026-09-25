"use client";

import { ChevronDown, CircleCheck, CircleHelp, Compass, HeartHandshake, Info, Mail, Rocket, Send, Target } from "lucide-react";
import { useState } from "react";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { PageHeader } from "./page-header";
import { useI18n } from "./providers";

export function About() {
  const { t } = useI18n();
  const cards: [DictKey, DictKey, typeof Info, string][] = [
    ["about.why.title", "about.why.body", HeartHandshake, "bg-danger-soft text-danger"],
    ["about.mission.title", "about.mission.body", Target, "bg-primary-soft text-primary"],
    ["about.how.title", "about.how.body", Compass, "bg-success-soft text-success"],
    ["about.next.title", "about.next.body", Rocket, "bg-saffron-soft text-saffron"],
  ];
  return (
    <>
      <PageHeader eyebrow="nav.about" icon={<Info className="h-3.5 w-3.5" />} title="about.title" subtitle="about.intro" />
      <section className="container-page grid gap-6 sm:grid-cols-2">
        {cards.map(([title, body, Icon, tint]) => (
          <article key={title} className="panel panel-hover p-7">
            <span className={`icon-tile h-12 w-12 ${tint}`}><Icon className="h-6 w-6" /></span>
            <h2 className="mt-5 text-xl font-bold">{t(title)}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{t(body)}</p>
          </article>
        ))}
      </section>
    </>
  );
}

export function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`faq.q${n}` as DictKey), a: t(`faq.a${n}` as DictKey) }));
  return (
    <>
      <PageHeader eyebrow="nav.faq" icon={<CircleHelp className="h-3.5 w-3.5" />} title="faq.title" />
      <section className="container-page max-w-3xl space-y-3">
        {items.map((it, i) => {
          const on = open === i;
          return (
            <div key={i} className={`panel overflow-hidden transition-colors ${on ? "border-primary/40" : ""}`}>
              <button
                type="button"
                aria-expanded={on}
                onClick={() => setOpen(on ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-base font-semibold">{it.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${on ? "rotate-180 text-primary" : ""}`} />
              </button>
              {on ? <p className="animate-rise px-6 pb-6 leading-relaxed text-muted-foreground">{it.a}</p> : null}
            </div>
          );
        })}
      </section>
    </>
  );
}

type Form = { name: string; email: string; phone: string; type: "suggestion" | "feedback" | "claim"; message: string };
const EMPTY: Form = { name: "", email: "", phone: "", type: "suggestion", message: "" };

export function Contact() {
  const { t } = useI18n();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = t("contact.err.name");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = t("contact.err.email");
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = t("contact.err.phone");
    if (!form.message.trim()) e.message = t("contact.err.message");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm(EMPTY);
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  const field = (k: "name" | "email" | "phone", type: string) => (
    <label className="block">
      <span className="label">{t(`contact.${k}` as DictKey)}</span>
      <input
        type={type}
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="field mt-2"
        inputMode={k === "phone" ? "numeric" : undefined}
      />
      {errors[k] ? <span className="mt-1 block text-xs text-danger">{errors[k]}</span> : null}
    </label>
  );

  return (
    <>
      <PageHeader eyebrow="nav.contact" icon={<Mail className="h-3.5 w-3.5" />} title="contact.title" subtitle="contact.subtitle" />
      <section className="container-page grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="panel space-y-5 p-6 sm:p-8" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            {field("name", "text")}
            {field("phone", "tel")}
          </div>
          {field("email", "email")}
          <label className="block">
            <span className="label">{t("contact.type")}</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Form["type"] })} className="field mt-2">
              <option value="suggestion">{t("contact.type.suggestion")}</option>
              <option value="feedback">{t("contact.type.feedback")}</option>
              <option value="claim">{t("contact.type.claim")}</option>
            </select>
          </label>
          <label className="block">
            <span className="label">{t("contact.message")}</span>
            <textarea
              rows={5}
              maxLength={1000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="field mt-2 h-auto resize-none py-3"
            />
            {errors.message ? <span className="mt-1 block text-xs text-danger">{errors.message}</span> : null}
          </label>
          <button type="submit" disabled={status === "sending"} className="btn-primary w-full py-4 text-base sm:w-auto sm:px-10">
            <Send className="h-4 w-4" /> {status === "sending" ? t("contact.sending") : t("contact.send")}
          </button>
          {status === "sent" ? (
            <p className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
              <CircleCheck className="h-4 w-4" /> {t("contact.success")}
            </p>
          ) : null}
          {status === "failed" ? <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">{t("contact.failed")}</p> : null}
        </form>
        <aside
          className="h-fit rounded-3xl p-7 text-white"
          style={{ backgroundImage: "linear-gradient(140deg, #2e2799, #5b3fd6 60%, #c0630a)" }}
        >
          <HeartHandshake className="h-8 w-8" />
          <h2 className="mt-4 text-xl font-bold">{t("contact.side.title")}</h2>
          <p className="mt-2 text-sm text-white/80">{t("contact.side.body")}</p>
        </aside>
      </section>
    </>
  );
}
