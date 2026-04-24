"use client";

import { useState, useRef, useMemo, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { ChevronDown, Upload, X, CheckCircle2 } from "lucide-react";

const B = "#FDB8D7";
const WEBHOOK_URL = "https://n8n.veltraai.net/webhook/sales-tracker";

const VENUE_PRICES: Record<string, number> = {
  "2Funky": 70,
  "Binks Yard": 85,
  Bounty: 70,
  Cavendish: 70,
  Crib: 80,
  Cucamara: 65,
  "Fat Cat Derby": 65,
  Ghost: 60,
  "Grumpy Monkey": 70,
  Hukka: 100,
  Icon: 65,
  "Icon BAR CRAW": 40,
  "The Camden": 180,
  "Lace Bar": 70,
  "Loft Bar": 80,
  "Mixing House": 65,
  "The Nest": 70,
  "New Foresters": 70,
  "Oz Bar": 65,
  "Pitcher & Piano": 100,
  Popworld: 70,
  "Revolution South": 50,
  "Revs de cuba": 70,
  "Route One": 65,
  "Secret Garden": 70,
  "Secret vault": 70,
  "Steins Derby": 50,
  "The Kings": 55,
  "The Mail Room": 100,
  "Trent Navigation": 80,
  Tunnel: 65,
  "Vat & Fiddle": 60,
  Vibe: 60,
  XOYO: 78.75,
  DEFAULT: 65,
};

const VENUES = Object.keys(VENUE_PRICES)
  .filter((v) => v !== "DEFAULT")
  .sort();

interface SalesForm {
  date: string;
  venue: string;
  name: string;
  email: string;
  bottles: string;
  cash: string;
  paidBarDirectly: "YES" | "NO" | "";
  agencySentMoney: "YES" | "NO" | "";
  agencyAmount: string;
  images: string[];
}

const INITIAL: SalesForm = {
  date: "",
  venue: "",
  name: "",
  email: "",
  bottles: "",
  cash: "",
  paidBarDirectly: "",
  agencySentMoney: "",
  agencyAmount: "",
  images: [],
};

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">
      {children}{" "}
      {required && (
        <span
          style={{ color: B }}
          className="ml-1"
        >
          *
        </span>
      )}
    </label>
  );
}

export default function SalesTrackerPage() {
  const [form, setForm] = useState<SalesForm>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upd = (patch: Partial<SalesForm>) =>
    setForm((f) => ({ ...f, ...patch }));

  const computed = useMemo(() => {
    const cash = parseFloat(form.cash) || 0;
    const bottles = parseFloat(form.bottles) || 0;
    const agencyCash = parseFloat(form.agencyAmount) || 0;

    const pricePerBottle = VENUE_PRICES[form.venue] || VENUE_PRICES["DEFAULT"];
    const barEarnings = bottles * pricePerBottle;

    // Note: Commission calculation is kept for the background payload
    // but hidden from the UI as per client request.
    const rawCommission = cash * 0.25;

    let deductions = 0;
    if (form.paidBarDirectly === "YES") deductions += barEarnings;
    if (form.agencySentMoney === "YES") deductions += agencyCash;

    return {
      totalRevenue: cash,
      sellerCommission: Math.max(0, rawCommission - deductions),
      barEarnings,
      deductions,
    };
  }, [form]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setForm((prev) => ({ ...prev, images: [...prev.images, base64] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...computed }),
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="bg-[#111] p-12 rounded-[3rem] border border-[#222]">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-6">SHIFT SUBMITTED</h2>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm(INITIAL);
            }}
            style={{ backgroundColor: B }}
            className="px-8 py-4 rounded-2xl text-black font-black uppercase text-xs"
          >
            New Entry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-xl mx-auto py-12 space-y-8">
        <header className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">
            Effervescent Agency
          </p>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            Shift Sales Entry
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-[#1f1f1f] space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <FieldLabel required>Full Name</FieldLabel>
                <input
                  className="w-full bg-[#161616] border border-[#222] rounded-2xl px-6 py-4 text-sm focus:border-[#FDB8D7] outline-none transition-all"
                  value={form.name}
                  onChange={(e) => upd({ name: e.target.value })}
                  required
                />
              </div>
              <div>
                <FieldLabel required>Date</FieldLabel>
                <input
                  type="date"
                  className="w-full bg-[#161616] border border-[#222] rounded-2xl px-6 py-4 text-sm focus:border-[#FDB8D7] outline-none"
                  value={form.date}
                  onChange={(e) => upd({ date: e.target.value })}
                  required
                />
              </div>
              <div>
                <FieldLabel required>Venue</FieldLabel>
                <div className="relative">
                  <select
                    className="w-full bg-[#161616] border border-[#222] rounded-2xl px-6 py-4 text-sm focus:border-[#FDB8D7] outline-none appearance-none cursor-pointer"
                    value={form.venue}
                    onChange={(e) => upd({ venue: e.target.value })}
                    required
                  >
                    <option value="">Select Venue</option>
                    {VENUES.map((v) => (
                      <option
                        key={v}
                        value={v}
                      >
                        {v}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-4 w-4 h-4 opacity-30 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Exact units sold e.g. 3.5</FieldLabel>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-[#161616] border border-[#222] rounded-2xl px-6 py-4 text-sm outline-none focus:border-[#FDB8D7]"
                  value={form.bottles}
                  onChange={(e) => upd({ bottles: e.target.value })}
                  required
                />
              </div>
              <div>
                <FieldLabel required>Physical Cash Collected</FieldLabel>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Inc. tips & bar payments"
                  className="w-full bg-[#161616] border border-[#222] rounded-2xl px-6 py-4 text-sm outline-none focus:border-[#FDB8D7]"
                  value={form.cash}
                  onChange={(e) => upd({ cash: e.target.value })}
                  required
                />
                <p className="text-[9px] text-gray-500 mt-2 italic px-2">
                  Total physical cash taken, including tips and any given to
                  bar.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-[#1f1f1f] space-y-6">
            <div>
              <FieldLabel required>Amount paid or owed to the bar</FieldLabel>
              <div className="flex gap-4">
                {(["YES", "NO"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => upd({ paidBarDirectly: opt })}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${form.paidBarDirectly === opt ? "bg-white text-black" : "bg-black text-gray-500 border border-[#222]"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel required>
                Did the agency send money to help pay for the bottles?
              </FieldLabel>
              <div className="flex gap-4">
                {(["YES", "NO"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => upd({ agencySentMoney: opt })}
                    className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${form.agencySentMoney === opt ? "bg-white text-black" : "bg-black text-gray-500 border border-[#222]"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {form.agencySentMoney === "YES" && (
                <div className="mt-4">
                  <FieldLabel required>How much exactly? (£)</FieldLabel>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-black border border-[#222] rounded-2xl px-6 py-4 text-sm outline-none focus:border-[#FDB8D7]"
                    value={form.agencyAmount}
                    onChange={(e) => upd({ agencyAmount: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-[#1f1f1f]">
            <FieldLabel>Upload Receipts</FieldLabel>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#222] rounded-[2rem] p-8 text-center cursor-pointer hover:border-[#FDB8D7] transition-all group"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-20 group-hover:opacity-100 transition-opacity" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Click to upload images
              </p>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            {form.images.length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-4 no-scrollbar">
                {form.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 flex-shrink-0 bg-[#161616] rounded-2xl overflow-hidden border border-[#222]"
                  >
                    <Image
                      src={img}
                      alt={`Receipt ${i}`}
                      fill
                      unoptimized
                      className="object-cover opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        upd({
                          images: form.images.filter((_, idx) => idx !== i),
                        })
                      }
                      className="absolute top-1 right-1 bg-black rounded-full p-1.5 z-10 border border-white/10"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: B }}
            className="w-full py-6 rounded-[2rem] text-black font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Submit Shift Data"}
          </button>
        </form>
      </div>
    </div>
  );
}
