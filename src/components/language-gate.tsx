"use client";

import { Languages } from "lucide-react";
import { LANGS } from "@/lib/i18n/dictionaries";
import { useI18n } from "./providers";

/** First-visit language picker. Shown once; the choice is remembered on the device. */
export function LanguageGate() {
  const { chosen, setLang } = useI18n();
  if (chosen !== false) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b0d1a]/50 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="lang-title">
      <div className="panel animate-rise w-full max-w-sm p-8 text-center" style={{ boxShadow: "var(--shadow-lg)" }}>
        <span
          className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white"
          style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}
        >
          <Languages className="h-7 w-7" />
        </span>
        <p id="lang-title" className="mt-5 text-xl font-extrabold">अपनी भाषा चुनें</p>
        <p className="text-sm text-muted-foreground">Choose your language</p>
        <div className="mt-7 grid gap-3">
          {LANGS.map((l, i) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={`${i === 0 ? "btn-primary" : "btn-ghost"} py-4 text-lg`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
