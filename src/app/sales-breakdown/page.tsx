"use client";

import { useState, ChangeEvent, FormEvent, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Upload, CheckCircle2, Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const BRAND_PINK = "#FFB8D7";
const WEBHOOK_URL = "https://n8n.veltraai.net/webhook/sales-tracker";

const VENUES = [
  "Boxpark Liverpool",
  "Tibu",
  "Portside",
  "Zanettis",
  "Babilonia",
  "Kova Beach",
  "Linekers Marbella",
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

const UK_CITIES = [
  "Aberdeen",
  "Bedford",
  "Billericay (Essex)",
  "Birmingham",
  "Bristol",
  "Cardiff",
  "Chelmsford",
  "Cheltenham",
  "Chester",
  "Chichester",
  "Colchester",
  "Coventry",
  "Derby",
  "Dundee",
  "Evesham",
  "Exeter",
  "Glasgow",
  "Guildford",
  "Herne Bay",
  "Hinckley",
  "Hull",
  "Inverness",
  "Leicester",
  "Leeds",
  "Liverpool",
  "London - Aldgate",
  "London - Camden",
  "London - Edgware",
  "London - Greenwich",
  "London - Harlesden",
  "London - Hounslow",
  "Loughborough",
  "Manchester",
  "Mansfield",
  "Margate",
  "Milton Keynes",
  "Newcastle",
  "Newport",
  "Northampton",
  "Nottingham",
  "Peterborough",
  "Plymouth",
  "Portsmouth/Southsea",
  "Sheffield",
  "Southend",
  "Solihull",
  "Southampton",
  "St Albans",
  "Walsall",
  "Wolverhampton",
  "Worthing",
  "Thanet",
  "Swansea",
  "Wrexham",
  "Winchester",
  "Worcester",
];

interface SalesForm {
  date: string;
  shiftStartTime: string;
  city: string;
  venue: string;
  name: string;
  reference_id: string;
  bottles: string;
  barEarning: string;
  cash: string;
  paidBarDirectly: "YES" | "NO";
  agencySentMoney: "YES" | "NO";
  agencyAmount: string;
  status: string;
  bottleImage: string | null;
  paymentImage: string | null;
}

const INITIAL: SalesForm = {
  date: "",
  shiftStartTime: "",
  city: "",
  venue: "",
  name: "",
  reference_id: "",
  bottles: "",
  barEarning: "",
  cash: "",
  paidBarDirectly: "NO",
  agencySentMoney: "NO",
  agencyAmount: "",
  status: "Pending",
  bottleImage: null,
  paymentImage: null,
};

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2 text-gray-900">
      {children}{" "}
      {required && (
        <span
          style={{ color: BRAND_PINK }}
          className="ml-1"
        >
          *
        </span>
      )}
    </label>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: BRAND_PINK, borderTopColor: "transparent" }}
        />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Loading your form...
        </p>
      </div>
    </div>
  );
}

function InvalidLinkScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-sm w-full p-10 rounded-[2.5rem] bg-white shadow-sm border border-gray-100 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-50">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-black uppercase tracking-tighter text-gray-900">
          Invalid Link
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          This link is not valid or has expired.
          <br />
          Please contact your agency for your personal form link.
        </p>
      </div>
    </div>
  );
}

function SalesTrackerInner() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref");

  const [form, setForm] = useState<SalesForm>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffValid, setStaffValid] = useState(false);

  useEffect(() => {
    if (!refParam) {
      setStaffLoading(false);
      return;
    }

    supabase
      .from("milli_candidates")
      .select("full_name, reference_id")
      .eq("reference_id", refParam.toUpperCase())
      .eq("status", "on-boarded")
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setForm((f) => ({
            ...f,
            name: data.full_name,
            reference_id: data.reference_id,
          }));
          setStaffValid(true);
        }
        setStaffLoading(false);
      });
  }, [refParam]);

  const upd = (patch: Partial<SalesForm>) =>
    setForm((f) => ({ ...f, ...patch }));

  const handleUpload = (
    type: "bottle" | "payment",
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      upd({
        [type === "bottle" ? "bottleImage" : "paymentImage"]:
          reader.result as string,
      });
    reader.readAsDataURL(file);
  };

  const handleClearImage = (type: "bottle" | "payment") => {
    upd({ [type === "bottle" ? "bottleImage" : "paymentImage"]: null });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const imagesArray: string[] = [];
    if (form.bottleImage) imagesArray.push(form.bottleImage);
    if (form.paymentImage) imagesArray.push(form.paymentImage);

    const payload = {
      date: form.date,
      shiftStartTime: form.shiftStartTime,
      city: form.city,
      venue: form.venue,
      name: form.name,
      reference_id: form.reference_id,
      bottles: form.bottles,
      barEarning: form.barEarning,
      cash: form.cash,
      paidBarDirectly: form.paidBarDirectly,
      agencySentMoney: form.agencySentMoney,
      agencyAmount: form.agencyAmount,
      status: form.status,
      images: imagesArray,
    };

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        throw new Error("Failed to submit");
      }
    } catch (err) {
      console.error(err);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (staffLoading) return <LoadingScreen />;
  if (!refParam || !staffValid) return <InvalidLinkScreen />;

  if (submitted)
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-gray-50">
        <div className="p-12 rounded-[3rem] bg-white border border-gray-100 shadow-sm">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-green-500" />
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter text-gray-900">
            Shift Submitted
          </h2>
          <p className="text-xs text-gray-400 mb-8">
            Nice work, {form.name.split(" ")[0]}.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm((f) => ({
                ...INITIAL,
                name: f.name,
                reference_id: f.reference_id,
              }));
            }}
            style={{ backgroundColor: BRAND_PINK }}
            className="px-8 py-4 rounded-2xl font-black uppercase text-xs text-white"
          >
            Submit Another Shift
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen p-6 font-sans bg-gray-50">
      <div className="max-w-xl mx-auto space-y-6">
        <header className="flex flex-col items-center pt-4">
          <Image
            src="/logo.jpeg"
            alt="Logo"
            width={100}
            height={100}
            className="rounded-xl shadow-lg"
          />
          <h1
            className="text-3xl font-black italic tracking-tighter uppercase mt-4"
            style={{ color: BRAND_PINK }}
          >
            Sales Breakdown
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Block 1: Basic Info */}
          <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm space-y-4">
            <FieldLabel>Your Name</FieldLabel>
            <div className="w-full rounded-2xl px-6 py-4 bg-gray-100 border border-gray-200 text-gray-700 font-semibold flex items-center justify-between">
              <span>{form.name}</span>
              <Lock className="w-4 h-4 text-gray-400" />
            </div>

            <FieldLabel required>Date</FieldLabel>
            <input
              type="date"
              className="w-full rounded-2xl px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 font-medium"
              value={form.date}
              onChange={(e) => upd({ date: e.target.value })}
              required
            />

            <FieldLabel required>Shift Start Time</FieldLabel>
            <input
              type="time"
              className="w-full rounded-2xl px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 font-medium"
              value={form.shiftStartTime}
              onChange={(e) => upd({ shiftStartTime: e.target.value })}
              required
            />

            <FieldLabel required>City</FieldLabel>
            <select
              className="w-full rounded-2xl px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 font-medium"
              value={form.city}
              onChange={(e) => upd({ city: e.target.value })}
              required
            >
              <option value="">Select City</option>
              {UK_CITIES.map((city) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              ))}
            </select>

            <FieldLabel required>Venue</FieldLabel>
            <select
              className="w-full rounded-2xl px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 font-medium"
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
          </div>

          {/* Block 2: Sales Figures */}
          <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm space-y-4">
            <FieldLabel required>Exact Units Sold</FieldLabel>
            <input
              type="number"
              step="1"
              placeholder="0.00"
              className="w-full rounded-2xl px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400"
              value={form.bottles}
              onChange={(e) => upd({ bottles: e.target.value })}
              required
            />

            <FieldLabel required>Bar Earning (£)</FieldLabel>
            <input
              type="number"
              step="1"
              placeholder="£0.00"
              className="w-full rounded-2xl px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400"
              value={form.barEarning}
              onChange={(e) => upd({ barEarning: e.target.value })}
              required
            />

            <FieldLabel required>Cash (£)</FieldLabel>
            <input
              type="number"
              step="1"
              placeholder="£0.00"
              className="w-full rounded-2xl px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 font-medium placeholder:text-gray-400"
              value={form.cash}
              onChange={(e) => upd({ cash: e.target.value })}
              required
            />
          </div>

          {/* Block 3: Payment Questions */}
          <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm space-y-4">
            <FieldLabel required>
              Did you make any payment to the bar?
            </FieldLabel>
            <div className="flex gap-4">
              {(["YES", "NO"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => upd({ paidBarDirectly: opt })}
                  style={
                    form.paidBarDirectly === opt
                      ? { backgroundColor: BRAND_PINK, color: "white" }
                      : { background: "#f3f4f6", color: "#6b7280" }
                  }
                  className="flex-1 py-4 rounded-2xl font-black text-xs transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>

            <FieldLabel required>
              Did the agency send you money to help pay the bar?
            </FieldLabel>
            <div className="flex gap-4">
              {(["YES", "NO"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => upd({ agencySentMoney: opt })}
                  style={
                    form.agencySentMoney === opt
                      ? { backgroundColor: BRAND_PINK, color: "white" }
                      : { background: "#f3f4f6", color: "#6b7280" }
                  }
                  className="flex-1 py-4 rounded-2xl font-black text-xs transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
            {form.agencySentMoney === "YES" && (
              <input
                type="number"
                step="1"
                placeholder="Amount sent by agency"
                className="w-full rounded-2xl px-6 py-4 bg-gray-50 border border-gray-200 text-gray-900 font-medium mt-2"
                value={form.agencyAmount}
                onChange={(e) => upd({ agencyAmount: e.target.value })}
                required
              />
            )}
          </div>

          {/* Block 4: Image Uploads */}
          <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm grid grid-cols-2 gap-4">
            {(["bottle", "payment"] as const).map((type) => (
              <div key={type}>
                <FieldLabel>
                  {type === "bottle" ? "Bottle Photo" : "Payment Proof"}
                </FieldLabel>
                <label className="relative block w-full h-32 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50">
                  {form[`${type}Image`] ? (
                    <>
                      <Image
                        src={form[`${type}Image`]!}
                        alt="Receipt"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleClearImage(type);
                        }}
                        className="absolute top-1 right-1 z-10 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <Upload className="text-gray-400" />
                  )}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleUpload(type, e)}
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: BRAND_PINK }}
            className="w-full py-6 rounded-3xl font-black uppercase text-white shadow-xl transition-opacity disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Submit Shift Data"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SalesTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-10 h-10 rounded-full border-4 animate-spin"
              style={{ borderColor: "#FFB8D7", borderTopColor: "transparent" }}
            />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <SalesTrackerInner />
    </Suspense>
  );
}
