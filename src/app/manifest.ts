import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME, HOME_PATH } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION.fr,
    lang: "fr",
    start_url: HOME_PATH,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f5fa",
    theme_color: "#2f55e4",
    // Générées par `npm run icons` (scripts/make-icons.mjs).
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
