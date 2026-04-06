"use client";

/**
 * Toggle: set to false in development to bypass the auth gate entirely.
 * Set to true to require the access code on the /candidates route.
 */
const AUTH_ENABLED = false;

const SESSION_KEY = "cand_auth_ok";

import { useState, useEffect, useTransition } from "react";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { verifyAccessCode } from "./verify-code";

async function hashInput(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false); // prevents flash before sessionStorage read
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!AUTH_ENABLED) {
      setAuthed(true);
    } else {
      setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    }
    setChecked(true);
  }, []);

  if (!checked) return null; // wait for sessionStorage check to avoid flash

  if (!AUTH_ENABLED || authed) return <>{children}</>;

  function handleSubmit() {
    if (!code.trim()) {
      setError("Please enter the access code.");
      return;
    }
    setError("");
    startTransition(async () => {
      const hash = await hashInput(code.trim());
      const ok = await verifyAccessCode(hash);
      if (ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setAuthed(true);
      } else {
        setError("Incorrect access code. Please try again.");
        setCode("");
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Blurred background hint */}
      <div className="fixed inset-0 bg-[#0a0a0a]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center">
              <Lock className="w-6 h-6 text-pink-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-xl font-bold text-white text-center mb-1">
            Restricted Access
          </h1>
          <p className="text-sm text-gray-500 text-center mb-7">
            Enter your access code to continue.
          </p>

          {/* Input */}
          <div className="relative mb-4">
            <input
              type={showCode ? "text" : "password"}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && !isPending && handleSubmit()
              }
              placeholder="Access code"
              autoFocus
              className="w-full px-4 py-3 pr-11 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-white text-sm
                placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent
                transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showCode ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
              bg-pink-500 hover:bg-pink-600 text-white
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {isPending ? "Verifying…" : "Enter"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          Effervescent Agency · Candidates Dashboard
        </p>
      </div>
    </div>
  );
}
