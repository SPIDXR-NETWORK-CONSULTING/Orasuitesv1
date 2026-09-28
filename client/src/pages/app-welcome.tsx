/**
 * /app/welcome — where the ORÁ app's "confirm your email" link lands (Supabase
 * redirect). Greets the person by the name they signed up with and sends them back
 * into the app. The access token in the URL fragment is only DECODED here to read the
 * name — never stored or sent — and is wiped from the address bar straight away.
 */
import * as React from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/layout";
import { useSEO } from "@/hooks/use-seo";

function nameFromFragment(): { name: string; error: string | null } {
  try {
    const p = new URLSearchParams(window.location.hash.slice(1));
    const error = p.get("error_description");
    const token = p.get("access_token");
    const payload = token ? JSON.parse(decodeURIComponent(escape(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))))) : null;
    const name = String(payload?.user_metadata?.name || payload?.user_metadata?.full_name || "").trim().split(" ")[0];
    return { name, error };
  } catch {
    return { name: "", error: null };
  }
}

export default function AppWelcomePage() {
  useSEO({ title: "Welcome to ORÁ | ORÁ.", description: "Your ORÁ account is confirmed.", path: "/app/welcome", noindex: true });
  const [{ name, error }] = React.useState(nameFromFragment);
  React.useEffect(() => {
    if (window.location.hash) history.replaceState(null, "", window.location.pathname); // drop the token from the URL
  }, []);

  return (
    <Layout>
      <section className="bg-ora-milk px-4 pb-24 pt-36">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-md text-center">
          {error ? (
            <>
              <h1 className="font-display text-[1.75rem] text-foreground">That link has expired</h1>
              <p className="mt-2 font-sans text-[0.9375rem] text-ora-fog">Open the ORÁ app and sign in. We'll send you a fresh confirmation email.</p>
            </>
          ) : (
            <>
              <p className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-ora-bronze">Email confirmed</p>
              <h1 className="mt-2 font-display text-[2rem] leading-tight text-foreground" data-testid="welcome-title">
                Welcome{name ? `, ${name},` : ""} to ORÁ
              </h1>
              <p className="mt-2 font-sans text-[0.9375rem] text-ora-fog">Your account is ready. Book your visit.</p>
            </>
          )}
          <a href="orasuites://" className="mt-8 inline-flex h-11 items-center rounded-full bg-ora-bronze px-6 font-sans text-[0.875rem] text-white transition-colors hover:bg-ora-bronze-deep">
            Open the ORÁ app
          </a>
          <p className="mt-3">
            <a href="/book" className="font-sans text-[0.8125rem] text-ora-bronze underline-offset-4 hover:underline">or book on the website</a>
          </p>
        </motion.div>
      </section>
    </Layout>
  );
}
