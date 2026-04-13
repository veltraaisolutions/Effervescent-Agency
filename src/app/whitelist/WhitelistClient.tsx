"use client";

import { useState } from "react";
import { toggleWhitelist } from "./actions";
import { Shield, ShieldOff, Phone, User } from "lucide-react";

interface WhitelistEntry {
  id: string;
  full_name: string;
  phone: string;
  whitelisted: boolean;
  onboarded_at: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WhitelistClient({ initial }: { initial: WhitelistEntry[] }) {
  const [entries, setEntries] = useState<WhitelistEntry[]>(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle(id: string, current: boolean) {
    setLoadingId(id);
    const result = await toggleWhitelist(id, !current);
    if (!result.error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, whitelisted: !current } : e)),
      );
    }
    setLoadingId(null);
  }

  const whitelisted = entries.filter((e) => e.whitelisted);
  const notWhitelisted = entries.filter((e) => !e.whitelisted);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ borderColor: "#FDB8D720", backgroundColor: "#FDB8D708" }}
          >
            <Shield
              className="w-5 h-5"
              style={{ color: "#FDB8D7" }}
            />
            <div>
              <p
                className="text-2xl font-bold leading-none"
                style={{ color: "#FDB8D7" }}
              >
                {whitelisted.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Whitelisted</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#1f1f1f] p-4 flex items-center gap-3 bg-[#111111]">
            <ShieldOff className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-2xl font-bold leading-none text-gray-400">
                {notWhitelisted.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Not Whitelisted</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1a1a1a]">
            <h2 className="text-sm font-bold text-white">Onboarded Staff</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Toggle access to the WhatsApp bot. Only fully onboarded staff
              appear here.
            </p>
          </div>

          {entries.length === 0 ? (
            <div className="py-16 text-center text-gray-600">
              <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No onboarded staff yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#161616]">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#161616] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {entry.full_name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {entry.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {entry.whitelisted ? (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        Access granted
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                        No access
                      </span>
                    )}

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(entry.id, entry.whitelisted)}
                      disabled={loadingId === entry.id}
                      className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0
                        ${entry.whitelisted ? "bg-emerald-500" : "bg-[#2a2a2a]"}
                        ${loadingId === entry.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                          ${entry.whitelisted ? "translate-x-6" : "translate-x-0"}
                        `}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 pb-2">
          {entries.length} onboarded staff total
        </p>
      </div>
    </div>
  );
}
