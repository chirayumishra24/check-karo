"use client";

import { Capacitor } from "@capacitor/core";

/**
 * Opens an external link. Inside the Android/iOS app it uses the in-app
 * browser (Chrome Custom Tabs / SFSafariViewController) so people stay in the
 * app; on the web it opens a new tab.
 */
export async function openLink(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url, presentationStyle: "popover", toolbarColor: "#1f4fbf" });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
