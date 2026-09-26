// Builds the Android debug APK and publishes it to public/downloads so the
// website's "Download Android app" button serves the latest build.
// Needs the Android SDK and a JDK (17+). Deploy the website afterwards.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";

const run = (cmd, cwd) => execSync(cmd, { stdio: "inherit", cwd });
const javaHome = process.env.JAVA_HOME || "C:/Program Files/Java/jdk-22";
if (existsSync(javaHome)) process.env.JAVA_HOME = javaHome;

run("npx cap sync android");
run(process.platform === "win32" ? "gradlew.bat assembleDebug" : "./gradlew assembleDebug", "android");

const apk = "android/app/build/outputs/apk/debug/app-debug.apk";
for (const dir of ["public/downloads", "dist"]) mkdirSync(dir, { recursive: true });
copyFileSync(apk, "public/downloads/check-karo.apk");
copyFileSync(apk, "dist/check-karo-debug.apk");
console.log(`APK ready: public/downloads/check-karo.apk (${(statSync(apk).size / 1048576).toFixed(1)} MB)`);
