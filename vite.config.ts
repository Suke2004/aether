import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Ensure required client-side env vars exist even when the hosting layer
  // provides them without the VITE_ prefix.
  const env = loadEnv(mode, process.cwd(), "");

  const supabaseUrl =
    env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.SUPABASE_URL || "";

  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  
    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error("Supabase env vars missing");
    }


  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean
    ),
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

