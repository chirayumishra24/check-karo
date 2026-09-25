import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Check Karo",
    short_name: "Check Karo",
    description: "Verify forwards and links, and find government schemes you qualify for.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f4fbf",
    lang: "en-IN",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
