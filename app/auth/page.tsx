"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Authentication failed.");
      window.location.href = "/editor";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputClasses = "h-12 border-0 border-b border-[var(--line)] bg-transparent px-0 rounded-none focus-visible:ring-0 focus-visible:border-[var(--foreground)] text-[var(--foreground)] text-lg transition-colors placeholder:text-[var(--muted)]";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6">
      <Link href="/editor" className="absolute left-8 top-8 flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
        <ChevronLeft size={16} /> Back to Editor
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[340px]"
      >
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] mb-2">
            {mode === "login" ? "Sign in." : "Sign up."}
          </h1>
          <p className="text-base text-[var(--muted)]">
            {mode === "login" ? "Enter your details below." : "Create your workspace."}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Input name="name" placeholder="Full Name" required minLength={2} className={inputClasses} />
              </motion.div>
            )}
          </AnimatePresence>

          <Input name="email" type="email" placeholder="Email Address" required className={inputClasses} />
          
          <div className="relative">
            <Input name="password" type={showPassword ? "text" : "password"} placeholder="Password" required minLength={8} className={`${inputClasses} pr-10`} />
            <button type="button" className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-500 font-medium">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-col gap-4">
            <Button type="submit" className="h-12 w-full rounded-full bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)]/90 flex items-center justify-center gap-2 text-base font-medium transition-all" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "login" ? "Continue" : "Create Account"}
              {!loading && <ArrowRight size={18} />}
            </Button>
            
            <Button type="button" variant="ghost" className="h-12 w-full rounded-full text-[var(--muted)] hover:text-[var(--foreground)] text-base font-medium" onClick={() => (window.location.href = "/editor")}>
              Continue as Guest
            </Button>
          </div>
        </form>

        <p className="mt-12 text-center text-sm text-[var(--muted)]">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="font-medium text-[var(--foreground)] hover:underline transition-colors" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </main>
  );
}
