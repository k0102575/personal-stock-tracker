import { fileURLToPath, URL } from "node:url";
import { existsSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const workerConfigPath = existsSync("wrangler.jsonc")
  ? "wrangler.jsonc"
  : "wrangler.example.jsonc";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    cloudflare({
      configPath: workerConfigPath
    }),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "app-icon.svg", "app-icon-maskable.svg"],
      manifest: {
        name: "Vanity Stock",
        short_name: "VanityStock",
        description:
          "A personal inventory tracker for cosmetics, perfumes, ointments, and personal care items.",
        theme_color: "#f4c7b8",
        background_color: "#f7f1ea",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait-primary",
        categories: ["lifestyle", "productivity", "utilities"],
        icons: [
          {
            src: "/app-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/app-icon-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.method === "GET" &&
              url.pathname.startsWith("/api/") &&
              !url.pathname.startsWith("/api/me"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 3
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "app-shell"
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    port: 5173
  }
});
