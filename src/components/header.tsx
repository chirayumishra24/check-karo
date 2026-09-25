"use client";

import {
  CircleHelp, House, Info, Landmark, Mail, Menu, MessageCircle, Moon, ScanSearch, ShieldCheck, Sun, X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { toggleTheme, useI18n } from "./providers";

type NavItem = { href: string; key: DictKey; icon: LucideIcon };

const MAIN: NavItem[] = [
  { href: "/", key: "nav.home", icon: House },
  { href: "/verify", key: "nav.verify", icon: ScanSearch },
  { href: "/schemes", key: "nav.schemes", icon: Landmark },
  { href: "/assistant", key: "nav.assistant", icon: MessageCircle },
];
const MORE: NavItem[] = [
  { href: "/about", key: "nav.about", icon: Info },
  { href: "/faq", key: "nav.faq", icon: CircleHelp },
  { href: "/contact", key: "nav.contact", icon: Mail },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

export function Logo() {
  const { t } = useI18n();
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-md transition-transform group-hover:rotate-[-6deg]"
        style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}
      >
        <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
      </span>
      <span className="text-lg font-extrabold tracking-tight">{t("brand.name")}</span>
    </Link>
  );
}

function LangSwitch() {
  const { lang, setLang } = useI18n();
  return (
    <div className="seg p-0.5" role="group" aria-label="Language">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`seg-item px-2.5 py-1 text-xs ${lang === l ? "seg-on" : ""}`}
        >
          {l === "en" ? "EN" : "हि"}
        </button>
      ))}
    </div>
  );
}

function ThemeButton() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-label={t("nav.theme")}
      onClick={toggleTheme}
      className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}

export function Header() {
  const { t } = useI18n();
  const active = useActive();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-2xl border border-border bg-card/70 p-1 lg:flex">
          {[...MAIN, ...MORE].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                active(n.href) ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <ThemeButton />
        </div>
      </div>
    </header>
  );
}

/** App-style tab bar for phones (and the Android/iOS app). */
export function BottomNav() {
  const { t } = useI18n();
  const active = useActive();
  const [open, setOpen] = useState(false);
  const moreActive = MORE.some((m) => active(m.href));

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="panel animate-rise absolute inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {MORE.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-medium hover:bg-muted"
              >
                <m.icon className="h-5 w-5 text-primary" />
                {t(m.key)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {MAIN.map((n) => {
            const on = active(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${on ? "text-primary" : "text-muted-foreground"}`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${on ? "bg-primary-soft" : ""}`}>
                  <n.icon className="h-5 w-5" strokeWidth={on ? 2.4 : 2} />
                </span>
                {t(n.key)}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${moreActive || open ? "text-primary" : "text-muted-foreground"}`}
          >
            <span className={`grid h-8 w-12 place-items-center rounded-full ${moreActive || open ? "bg-primary-soft" : ""}`}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </span>
            {t("nav.more")}
          </button>
        </div>
      </nav>
    </>
  );
}
