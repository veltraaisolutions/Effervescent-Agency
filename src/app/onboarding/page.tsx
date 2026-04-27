"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Calendar,
  User,
  Package,
  Smartphone,
  ExternalLink,
} from "lucide-react";

const B = "#FDB8D7";
const WEBHOOK_URL =
  "https://n8n.veltraai.net/webhook/Onboarding_Availability_form_submitted";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface FieldProps {
  children: React.ReactNode;
  required?: boolean;
}

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

interface CheckItemProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

interface MonthSectionProps {
  label: string;
  dates: string[];
  selectedDates: string[];
  onToggle: (d: string) => void;
  defaultOpen?: boolean;
}

// ─── DYNAMIC DATES ────────────────────────────────────────────────────────────

function getOrdinalSuffix(d: number) {
  if (d === 1 || d === 21 || d === 31) return "st";
  if (d === 2 || d === 22) return "nd";
  if (d === 3 || d === 23) return "rd";
  return "th";
}

function buildDates(year: number, month: number, fromDay = 1): string[] {
  const monthName = new Date(year, month, 1).toLocaleString("en-GB", {
    month: "long",
  });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];
  for (let d = fromDay; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayName = date.toLocaleString("en-GB", { weekday: "long" });
    dates.push(`${dayName} ${d}${getOrdinalSuffix(d)} ${monthName}`);
  }
  return dates;
}

const now = new Date();
const CY = now.getFullYear();
const CM = now.getMonth();
const CD = now.getDate();
const NY = CM === 11 ? CY + 1 : CY;
const NM = CM === 11 ? 0 : CM + 1;
const CURRENT_MONTH_LABEL = now.toLocaleString("en-GB", {
  month: "long",
  year: "numeric",
});
const NEXT_MONTH_LABEL = new Date(NY, NM, 1).toLocaleString("en-GB", {
  month: "long",
  year: "numeric",
});
const CURRENT_DATES = buildDates(CY, CM, CD);
const NEXT_DATES = buildDates(NY, NM, 1);
const SHOW_NEXT_MONTH = CD >= 16;

const LOCATIONS = [
  "Nottingham",
  "cardiff",
  "Marbella",
  "Dubai",
  "Derby",
  "Newark",
  "Mansfield",
  "Leicester",
  "Nuneaton",
  "Loughborough",
  "Northampton",
  "Sheffield",
  "Birmingham",
  "Walsall",
  "Worthing/Brighton",
  "Plymouth",
  "Coventry",
  "Hull",
  "Exeter",
  "Stanmore (London)",
  "Camden (London)",
  "Greenwich (London)",
  "Aldgate (London)",
  "Edgware (London)",
  "Harlesden (London)",
  "Hounslow (London)",
  "Ealing (London)",
  "Bedford",
  "Portsmouth",
  "Southampton",
  "Winchester",
  "Hinckley",
  "Cheltenham",
  "Newport",
  "Maidstone",
  "Solihull",
  "Wolverhampton",
];

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────

const onFocus = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  e.currentTarget.style.boxShadow = `0 0 0 2px ${B}55`;
  e.currentTarget.style.borderColor = B;
};
const onBlur = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  e.currentTarget.style.boxShadow = "";
  e.currentTarget.style.borderColor = "";
};

function FieldLabel({ children, required }: FieldProps) {
  return (
    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
      {children}
      {required && (
        <span
          style={{ color: B }}
          className="ml-0.5"
        >
          *
        </span>
      )}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {message}
    </p>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      style={{ colorScheme: "dark" } as React.CSSProperties}
      className="w-full px-3 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] text-white placeholder:text-gray-600 focus:outline-none transition-all"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: any) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 border border-[#2a2a2a] rounded-xl text-sm bg-[#1a1a1a] text-white placeholder:text-gray-600 focus:outline-none resize-none transition-all"
    />
  );
}

function CheckItem({ checked, onChange, label }: CheckItemProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={checked ? { borderColor: B, backgroundColor: `${B}12` } : {}}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
        checked ? "" : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#FDB8D7]/30"
      }`}
    >
      <div
        style={checked ? { backgroundColor: B, borderColor: B } : {}}
        className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
          checked ? "" : "border-[#444]"
        }`}
      >
        {checked && (
          <Check
            className="w-2.5 h-2.5 text-[#1a0a10]"
            strokeWidth={3}
          />
        )}
      </div>
      <p
        className={`text-sm ${checked ? "text-white font-medium" : "text-gray-400"}`}
      >
        {label}
      </p>
    </button>
  );
}

function MonthSection({
  label,
  dates,
  selectedDates,
  onToggle,
  defaultOpen = false,
}: MonthSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const selectedCount = dates.filter((d) => selectedDates.includes(d)).length;
  return (
    <div className="border border-[#2a2a2a] rounded-2xl overflow-hidden mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#161616] hover:bg-[#1c1c1c] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar
            className="w-4 h-4"
            style={{ color: B }}
          />
          <span className="text-sm font-bold text-white">{label}</span>
          {selectedCount > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${B}20`, color: B }}
            >
              {selectedCount} selected
            </span>
          )}
        </div>
        <ChevronDown
          className="w-4 h-4 text-gray-500 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 space-y-1.5 bg-[#111111]">
          {dates.map((d) => (
            <CheckItem
              key={d}
              checked={selectedDates.includes(d)}
              onChange={() => onToggle(d)}
              label={d}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <p
        className="text-xs font-bold uppercase tracking-widest whitespace-nowrap"
        style={{ color: `${B}99` }}
      >
        {children}
      </p>
      <div className="flex-1 h-px bg-[#2a2a2a]" />
    </div>
  );
}

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-10 max-w-sm w-full text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: `${B}20`, border: `2px solid ${B}` }}
        >
          <Check
            className="w-7 h-7"
            style={{ color: B }}
            strokeWidth={2.5}
          />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">All Done!</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          We&apos;ve received your details. We&apos;ll be in touch shortly with
          next steps.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN FORM ────────────────────────────────────────────────────────────────

function OnboardingForm() {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get("id") ?? "";

  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"onboarding" | "availability">("onboarding");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [homeAddress, setHomeAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankSortCode, setBankSortCode] = useState("");
  const [unavailableAll, setUnavailableAll] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [comments, setComments] = useState("");

  function toggleDate(d: string) {
    setSelectedDates((p) =>
      p.includes(d) ? p.filter((x) => x !== d) : [...p, d],
    );
  }
  function toggleLocation(l: string) {
    setSelectedLocations((p) =>
      p.includes(l) ? p.filter((x) => x !== l) : [...p, l],
    );
  }

  function handleSortCode(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    const parts = digits.match(/.{1,2}/g) ?? [];
    setBankSortCode(parts.join("-"));
  }

  function handleNext() {
    const e: Record<string, string> = {};
    if (!homeAddress.trim()) e.homeAddress = "Required";
    if (!emergencyContactName.trim()) e.emergencyContactName = "Required";
    if (!emergencyRelationship.trim()) e.emergencyRelationship = "Required";
    if (!emergencyPhone.trim()) e.emergencyPhone = "Required";
    if (bankAccountNumber.length !== 8)
      e.bankAccountNumber = "Must be 8 digits";
    if (bankSortCode.replace(/\D/g, "").length !== 6)
      e.bankSortCode = "Must be 6 digits";

    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setTab("availability");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    const e: Record<string, string> = {};
    if (!unavailableAll && selectedDates.length === 0)
      e.dates = "Select dates or mark unavailable";
    if (selectedLocations.length === 0)
      e.locations = "Select at least one location";
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          onboarding: {
            home_address: homeAddress,
            emergency_contact_name: emergencyContactName,
            emergency_contact_relationship: emergencyRelationship,
            emergency_contact_phone: emergencyPhone,
            bank_account_number: bankAccountNumber,
            bank_sort_code: bankSortCode,
          },
          availability: {
            unavailable_all_month: unavailableAll,
            dates: unavailableAll ? [] : selectedDates,
            locations: selectedLocations,
            comments,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return <SuccessScreen />;

  if (!showForm) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-6">
        <div className="max-w-xl mx-auto">
          <header className="mb-10">
            <h1
              className="text-4xl font-black italic tracking-tighter leading-none mb-4"
              style={{ color: B }}
            >
              OFFER & NEXT STEPS
            </h1>
            <p className="text-gray-300 leading-relaxed">
              Thank you for attending a trial shift with us. we were really
              pleased and would like to offer you the opportunity to work with
              us.
            </p>
          </header>

          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-red-400 mb-2 font-bold text-xs uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" /> Right to Work
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                You must have the valid right to work as a self-employed
                individual in the UK. If you DO NOT have a British passport,
                please let us know immediately.
              </p>
            </div>

            <section className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-6">
              <h2 className="flex items-center gap-2 font-bold mb-4 text-white uppercase text-sm tracking-widest">
                <Package className="w-5 h-5 text-[#FDB8D7]" /> 📦 Equipment
              </h2>
              <ul className="text-sm text-gray-400 space-y-2 mb-6">
                <li>• 25ml Jägerbomb cups (at least 100)</li>
                <li>• Shot tubes with rack (approved suppliers)</li>
                <li>• Tray (recommended)</li>
                <li>
                  • It Is Required To Buy The Equipment Before Your First Shift
                </li>
              </ul>
              <a
                href="https://effervescent-agency.sumupstore.com/product/shot-seller-starter-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-[#FDB8D7]">
                  Get Starter Kit
                </span>
                <ExternalLink className="w-4 h-4 text-gray-600" />
              </a>
            </section>

            <section className="bg-[#111111] border border-[#1f1f1f] rounded-3xl p-6">
              <h2 className="flex items-center gap-2 font-bold mb-4 text-white uppercase text-sm tracking-widest">
                <Smartphone className="w-5 h-5 text-[#FDB8D7]" /> 📲 What
                Happens Next
              </h2>
              <div className="text-xs text-gray-500 space-y-3 leading-relaxed">
                <p>
                  • You will receive an invitation to join{" "}
                  <strong>RotaCloud</strong>.
                </p>
                <p>
                  • You will be sent a <strong>contract via email</strong> to
                  review and e-sign.
                </p>
                <p>
                  • You will be added to our <strong>WhatsApp group</strong>.
                </p>
                <p>
                  • Mandatory <strong>e-learning modules</strong> will be sent
                  to you.
                </p>
              </div>
            </section>

            <button
              onClick={() => {
                setShowForm(true);
                window.scrollTo(0, 0);
              }}
              className="w-full py-5 rounded-2xl font-black text-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_20px_40px_-15px_#FDB8D744]"
              style={{ background: B }}
            >
              ACCEPT & START FORMS <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-5 bg-[#111111] border border-[#1f1f1f] rounded-2xl p-1.5">
          {(["onboarding", "availability"] as const).map((t) => (
            <button
              key={t}
              onClick={() => t === "onboarding" && setTab("onboarding")}
              style={tab === t ? { backgroundColor: B, color: "#1a0a10" } : {}}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === t ? "" : "text-gray-500"
              } ${t === "availability" && tab === "onboarding" ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {t === "onboarding" ? (
                <>
                  <User className="w-4 h-4" /> Onboarding
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" /> Availability
                </>
              )}
            </button>
          ))}
        </div>

        <div className="bg-[#111111] border border-[#1f1f1f] rounded-3xl overflow-hidden shadow-2xl">
          <div
            className="px-6 py-5"
            style={{ background: "linear-gradient(135deg, #2a0d1c, #3d1228)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: `${B}80` }}
            >
              {tab === "onboarding" ? "Step 1 of 2" : "Step 2 of 2"}
            </p>
            <h2
              className="text-xl font-bold"
              style={{ color: B }}
            >
              {tab === "onboarding" ? "Your Details" : "Availability"}
            </h2>
          </div>

          <div className="px-6 py-6 space-y-5">
            {tab === "onboarding" ? (
              <>
                <SectionTitle>Personal</SectionTitle>
                <div>
                  <FieldLabel required>Home Address</FieldLabel>
                  <Textarea
                    value={homeAddress}
                    onChange={setHomeAddress}
                    placeholder="Address, Postcode"
                  />
                  <FieldError message={errors.homeAddress} />
                </div>
                <SectionTitle>Emergency Contact</SectionTitle>
                <div>
                  <FieldLabel required>Name</FieldLabel>
                  <Input
                    value={emergencyContactName}
                    onChange={setEmergencyContactName}
                  />
                  <FieldError message={errors.emergencyContactName} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Relationship</FieldLabel>
                    <Input
                      value={emergencyRelationship}
                      onChange={setEmergencyRelationship}
                    />
                  </div>
                  <div>
                    <FieldLabel required>Phone</FieldLabel>
                    <Input
                      value={emergencyPhone}
                      onChange={setEmergencyPhone}
                      type="tel"
                    />
                  </div>
                </div>
                <SectionTitle>Bank Details</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Account No.</FieldLabel>
                    <Input
                      value={bankAccountNumber}
                      onChange={(v) =>
                        setBankAccountNumber(v.replace(/\D/g, "").slice(0, 8))
                      }
                    />
                    <FieldError message={errors.bankAccountNumber} />
                  </div>
                  <div>
                    <FieldLabel required>Sort Code</FieldLabel>
                    <Input
                      value={bankSortCode}
                      onChange={handleSortCode}
                    />
                    <FieldError message={errors.bankSortCode} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <FieldLabel required>Dates Available</FieldLabel>
                <FieldError message={errors.dates} />
                <CheckItem
                  checked={unavailableAll}
                  onChange={(v) => {
                    setUnavailableAll(v);
                    if (v) setSelectedDates([]);
                  }}
                  label="Unavailable All Month"
                />
                {!unavailableAll && (
                  <>
                    <MonthSection
                      label={CURRENT_MONTH_LABEL}
                      dates={CURRENT_DATES}
                      selectedDates={selectedDates}
                      onToggle={toggleDate}
                    />
                    {SHOW_NEXT_MONTH && (
                      <MonthSection
                        label={NEXT_MONTH_LABEL}
                        dates={NEXT_DATES}
                        selectedDates={selectedDates}
                        onToggle={toggleDate}
                      />
                    )}
                  </>
                )}
                <SectionTitle>Locations</SectionTitle>
                <FieldError message={errors.locations} />
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {LOCATIONS.map((l) => (
                    <CheckItem
                      key={l}
                      checked={selectedLocations.includes(l)}
                      onChange={() => toggleLocation(l)}
                      label={l}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#1a1a1a] flex justify-between items-center">
            {tab === "availability" && (
              <button
                onClick={() => setTab("onboarding")}
                className="text-gray-500 text-sm font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={tab === "onboarding" ? handleNext : handleSubmit}
              disabled={submitting}
              className="ml-auto px-8 py-3 rounded-xl font-bold text-black disabled:opacity-50"
              style={{ background: B }}
            >
              {submitting
                ? "Submitting..."
                : tab === "onboarding"
                  ? "Next"
                  : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FDB8D7]/30 border-t-[#FDB8D7] rounded-full animate-spin" />
        </div>
      }
    >
      <OnboardingForm />
    </Suspense>
  );
}
