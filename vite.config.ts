// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Vite loadEnv never overwrites keys already in process.env. Cursor/Lovable may inject
// stale placeholders (e.g. VITE_SUPABASE_PUBLISHABLE_KEY=SUA_ANON_KEY) into the dev
// server process — force .env values locally so import.meta.env matches the file.
const SUPABASE_ENV_KEYS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function applyLocalDotEnvOverrides() {
  if (process.env.LOVABLE_SANDBOX === "1") return;

  let content: string;
  try {
    content = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  } catch {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!(SUPABASE_ENV_KEYS as readonly string[]).includes(key)) continue;
    process.env[key] = trimmed.slice(eq + 1).trim();
  }
}

applyLocalDotEnvOverrides();

export default defineConfig({
  // Required for self-hosted deploy (Vercel, Netlify, etc.): without Lovable sandbox
  // context the Nitro plugin is skipped and only dist/client + dist/server are emitted —
  // Vercel needs Nitro's .vercel/output with serverless handlers for SSR routes.
  nitro: true,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
