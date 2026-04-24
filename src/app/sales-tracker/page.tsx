"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { ChevronDown, Upload, X, CheckCircle2 } from "lucide-react";

const B = "#FDB8D7";
const WEBHOOK_URL = "https://n8n.veltraai.net/webhook/sales-tracker";

// List remains for selection, but calculations are removed from the payload
const VENUES = [
  "2Funky",
  "Binks Yard",
  "Bounty",
  "Cavendish",
  "Crib",
  "Cucamara",
  "Fat Cat Derby",
  "Ghost",
  "Grumpy Monkey",
  "Hukka",
  "Icon",
  "Icon BAR CRAW",
  "The Camden",
  "Lace Bar",
  "Loft Bar",
  "Mixing House",
  "The Nest",
  "New Foresters",
  "Oz Bar",
  "Pitcher & Piano",
  "Popworld",
  "Revolution South",
  "Revs de cuba",
  "Route One",
  "Secret Garden",
  "Secret vault",
  "Steins Derby",
  "The Kings",
  "The Mail Room",
  "Trent Navigation",
  "Tunnel",
  "Vat & Fiddle",
  "Vibe",
  "XOYO",
].sort();

interface SalesForm {
  date: string;
  venue: string;
  name: string;
  bottles: string;
  cash: string;
  paidBarDirectly: "YES" | "NO";
  agencySentMoney: "YES" | "NO";
  agencyAmount: string;
  images: string[];
}

const INITIAL: SalesForm = {
  date: "",
  venue: "",
  name: "",
  bottles: "",
  cash: "",
  paidBarDirectly: "NO",
  agencySentMoney: "NO",
  agencyAmount: "0",
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
      // Sending RAW data only. Google Sheet formulas handle the math.
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
          <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">
            Shift Submitted
          </h2>
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
            Veltra AI Solutions
          </p>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            Sales Tracker
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* SECTION 1: IDENTITY & DATE */}
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-[#1f1f1f] space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div>
              <FieldLabel required>Full Name</FieldLabel>
              <input
                className="w-full bg-[#161616] border border-[#222] rounded-2xl px-6 py-4 text-sm focus:border-[#FDB8D7] outline-none transition-all"
                value={form.name}
                placeholder="Enter your name"
                onChange={(e) => upd({ name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* SECTION 2: BAR PAYMENT (Moved up as requested) */}
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-[#1f1f1f] space-y-6">
            <div>
              <FieldLabel required>
                Did you make any payment to the bar?
              </FieldLabel>
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
          </div>

          {/* SECTION 3: SALES DATA */}
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-[#1f1f1f] space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Exact units sold (e.g. 3.5)</FieldLabel>
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
                  placeholder="£0.00"
                  className="w-full bg-[#161616] border border-[#222] rounded-2xl px-6 py-4 text-sm outline-none focus:border-[#FDB8D7]"
                  value={form.cash}
                  onChange={(e) => upd({ cash: e.target.value })}
                  required
                />
                <p className="text-[14px] text-gray-400 mt-2 italic px-1 font-medium leading-relaxed">
                  Total physical cash taken, including tips and any given to
                  bar.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: RECEIPTS */}
          <div className="bg-[#111] p-8 rounded-[2.5rem] border border-[#1f1f1f] space-y-6">
            <FieldLabel>Upload Receipts</FieldLabel>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#222] rounded-[2rem] p-8 text-center cursor-pointer hover:border-[#FDB8D7] transition-all group"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-20 group-hover:opacity-100" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Tap to upload images
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
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar">
                {form.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border border-[#222]"
                  >
                    <Image
                      src={img}
                      alt="Receipt"
                      fill
                      className="object-cover opacity-60"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() =>
                        upd({
                          images: form.images.filter((_, idx) => idx !== i),
                        })
                      }
                      className="absolute top-1 right-1 bg-black rounded-full p-1"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: B }}
              className="w-full py-6 rounded-3xl text-black font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Submit Shift Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
