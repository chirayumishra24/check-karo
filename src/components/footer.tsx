"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { APK_URL } from "./app-download";
import { Logo } from "./header";
import { useI18n } from "./providers";

export function Footer() {
  const { t } = useI18n();
  const links = [
    ["/schemes", "nav.schemes"], ["/verify", "nav.verify"], ["/assistant", "nav.assistant"],
    ["/about", "nav.about"], ["/faq", "nav.faq"], ["/contact", "nav.contact"],
    ["/privacy", "footer.privacy"], ["/terms", "footer.terms"], [APK_URL, "footer.app"],
  ] as const;

  return (
    <footer className="border-t border-border bg-card/60 pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t("brand.tagline")}</p>
        </div>
        <ul className="space-y-2.5 text-sm">
          {(["footer.line1", "footer.line2", "footer.line3"] as const).map((k) => (
            <li key={k} className="flex items-start gap-2 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
              {t(k)}
            </li>
          ))}
        </ul>
        <div>
          <p className="label uppercase">{t("footer.links")}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {links.map(([href, key]) =>
              href.endsWith(".apk") ? (
                // A file, not a page: plain link so the browser downloads it.
                <a key={href} href={href} className="text-muted-foreground hover:text-foreground">{t(key)}</a>
              ) : (
                <Link key={href} href={href} className="text-muted-foreground hover:text-foreground">{t(key)}</Link>
              ),
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="container-page py-5 text-xs text-muted-foreground">{t("footer.copyright", { y: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
