import type { CapacitorConfig } from "@capacitor/cli";

// The Android/iOS apps are thin native shells around the hosted web app, so
// every web deploy updates the apps too. Set CAP_SERVER_URL to your Firebase
// App Hosting URL before `npx cap sync`. External links (scheme websites,
// sources) open in the in-app browser via @capacitor/browser; see
// src/lib/open-link.ts.
const serverUrl = process.env.CAP_SERVER_URL || "https://check-karo--check-karo-demo.asia-east1.hosted.app";

const config: CapacitorConfig = {
  appId: "in.checkkaro.app",
  appName: "Check Karo",
  webDir: "cap-shell",
  server: {
    url: serverUrl,
    cleartext: false,
    errorPath: "index.html",
  },
  android: { allowMixedContent: false },
};

export default config;
