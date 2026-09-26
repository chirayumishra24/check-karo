import type { CapacitorConfig } from "@capacitor/cli";

// The Android/iOS apps are thin native shells around the hosted web app, so
// every web deploy updates the apps too. External links (scheme websites,
// sources) open in the in-app browser via @capacitor/browser; see
// src/lib/open-link.ts.
//
// Production build: npx cap sync android  (uses the Firebase App Hosting URL)
// Testing against a laptop dev server on the same Wi-Fi:
//   CAP_SERVER_URL=http://<laptop-ip>:3001 npx cap sync android
// (cap-shell/dev-connect.html is a helper page for that setup.)
const PRODUCTION_URL = "https://check-karo--ideathon-projects.us-central1.hosted.app";
const serverUrl = process.env.CAP_SERVER_URL || PRODUCTION_URL;
const insecure = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "in.checkkaro.app",
  appName: "Check Karo",
  webDir: "cap-shell",
  server: {
    url: serverUrl,
    // Plain HTTP is only allowed for local testing builds.
    cleartext: insecure,
    errorPath: "index.html",
  },
  android: { allowMixedContent: insecure },
};

export default config;
