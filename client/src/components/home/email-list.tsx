import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EmailListSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/email-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-20 bg-ora-bone">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ora-milk mb-5">
            <Sparkles size={22} className="text-ora-taupe" />
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
            Stay in the Loop
          </h2>
          <p className="text-ora-fog mb-8 max-w-xl mx-auto">
            Be the first to hear about new treatments, exclusive offers, and ORÁ community events.
            No spam — just beautiful things.
          </p>

          {status === "success" ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle size={28} className="text-ora-taupe" />
              <p className="font-medium text-foreground">You're on the list.</p>
              <p className="text-sm text-ora-fog">We'll be in touch with something beautiful soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-white border-ora-greige focus:border-ora-taupe"
              />
              <Button
                type="submit"
                disabled={status === "loading"}
                className="bg-ora-taupe text-white hover:bg-ora-fog whitespace-nowrap"
              >
                {status === "loading" ? (
                  <><Loader2 size={16} className="animate-spin mr-2" /> Joining…</>
                ) : (
                  "Join the List"
                )}
              </Button>
            </form>
          )}

          {status === "error" && (
            <p className="text-sm text-red-500 mt-3">Something went wrong — please try again.</p>
          )}

          <p className="text-xs text-ora-smoke mt-5">
            Unsubscribe at any time. We respect your privacy.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
