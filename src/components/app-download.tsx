"use client";

import { Download } from "lucide-react";
import { useSyncExternalStore } from "react";
import { isNativeApp } from "@/lib/open-link";
import { useI18n } from "./providers";

/** Served from public/downloads; refreshed by `npm run build:apk`. */
export const APK_URL = "/downloads/check-karo.apk";
export const APK_SIZE_MB = 5;

const noSubscribe = () => () => {};

/** True inside the Android/iOS app, where offering the APK makes no sense. */
export function useInApp(): boolean {
  return useSyncExternalStore(noSubscribe, isNativeApp, () => false);
}

export function AppDownload() {
  const { t } = useI18n();
  if (useInApp()) return null;
  return (
    <div className="mt-8">
      <a href={APK_URL} download="check-karo.apk" className="btn-primary px-6 py-4 text-base">
        <Download className="h-5 w-5" /> {t("app.download")}
      </a>
      <p className="mt-6 label">{t("app.steps.title")}</p>
      <ol className="mt-3 space-y-2.5">
        {(["app.step1", "app.step2", "app.step3"] as const).map((k, i) => (
          <li key={k} className="flex gap-3 text-sm">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
              {i + 1}
            </span>
            <span className="pt-0.5 text-muted-foreground">{t(k)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
