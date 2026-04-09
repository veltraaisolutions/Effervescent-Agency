"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import {
  Check,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const HEARD_ABOUT_OPTIONS = [
  "Instagram",
  "TikTok",
  "Facebook",
  "Twitter/X",
  "Direct Message from your page",
  "Friends / Word of mouth",
  "Adverts",
  "Met a shot-girl!",
  "Headhunter",
  "Trade shows / Exhibitions",
];

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Prefer not to say"];

const WEBHOOK_URL = "https://n8n.veltraai.net/webhook/web-form-milli";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ALLOWED_ID_TYPES = ["image/jpeg", "image/jpg", "image/png"];

// Brand colour — every accent in the form uses this
const B = "#FDB8D7";

const SLIDE_LABELS = [
  "Personal",
  "Location",
  "Photos",
  "Experience",
  "Declarations",
];
const SLIDE_TITLES = [
  "Personal Information",
  "Location & Availability",
  "Photos & ID",
  "Experience & Motivation",
  "Final Declarations",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileData {
  name: string;
  base64: string;
  size: number;
  type: string;
}

interface FormState {
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  instagram: string;
  primaryCity: string;
  secondCity: string;
  manualCity: string;
  isStudent: string;
  homeCity: string;
  doesDrive: string;
  photos: FileData[];
  passportId: FileData | null;
  nonUkPassport: boolean;
  shareCode: string;
  priorExp: string;
  prevCompany: string;
  yearsExp: string;
  understandRole: string;
  whyFit: string;
  salesExp: string;
  startDate: string;
  selfEmployed: boolean;
  weekendWork: boolean;
  heardAbout: string;
}

const INITIAL: FormState = {
  fullName: "",
  dob: "",
  gender: "",
  email: "",
  phone: "",
  instagram: "",
  primaryCity: "",
  secondCity: "",
  manualCity: "",
  isStudent: "",
  homeCity: "",
  doesDrive: "",
  photos: [],
  passportId: null,
  nonUkPassport: false,
  shareCode: "",
  priorExp: "",
  prevCompany: "",
  yearsExp: "",
  understandRole: "",
  whyFit: "",
  salesExp: "",
  startDate: "",
  selfEmployed: false,
  weekendWork: false,
  heardAbout: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAtLeast18(dob: string): boolean {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}

// Normalise a phone number to E.164 format (+[countrycode][number], no spaces)
function normalizePhone(raw: string): string {
  let v = raw.trim().replace(/[\s\-().]/g, "");
  // UK local: 07xxxxxxxxx → +447xxxxxxxxx
  if (/^07\d{9}$/.test(v)) return "+44" + v.slice(1);
  // Already international without +
  if (/^\d{10,15}$/.test(v)) return "+" + v;
  return v;
}

function isValidPhone(v: string): boolean {
  return /^\+\d{7,15}$/.test(v);
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─── Shared focus handlers (brand ring on dark inputs) ────────────────────────

const onFocusBrand = (
  e: React.FocusEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) => {
  e.currentTarget.style.boxShadow = `0 0 0 2px ${B}55`;
  e.currentTarget.style.borderColor = B;
};
const onBlurBrand = (
  e: React.FocusEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >,
) => {
  e.currentTarget.style.boxShadow = "";
  e.currentTarget.style.borderColor = "";
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-gray-300 mb-1.5">
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
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {message}
    </p>
  );
}

function TextInput({
  value,
  onChange,
  onBlur,
  placeholder = "",
  type = "text",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        onBlurBrand(e);
        onBlur?.();
      }}
      style={{ colorScheme: "dark" }}
      className="w-full px-3 py-2.5 border border-[#2a2a2a] rounded-xl text-sm
        bg-[#1a1a1a] text-white placeholder:text-gray-600
        focus:outline-none disabled:opacity-50 transition-all"
      onFocus={onFocusBrand}
    />
  );
}

function TextareaInput({
  value,
  onChange,
  placeholder = "",
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-[#2a2a2a] rounded-xl text-sm
        bg-[#1a1a1a] text-white placeholder:text-gray-600
        focus:outline-none resize-none transition-all"
      onFocus={onFocusBrand}
      onBlur={onBlurBrand}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ colorScheme: "dark" }}
        className="w-full appearance-none px-3 py-2.5 border border-[#2a2a2a] rounded-xl text-sm
          bg-[#1a1a1a] text-white focus:outline-none transition-all"
        onFocus={onFocusBrand}
        onBlur={onBlurBrand}
      >
        <option
          value=""
          className="text-gray-500"
        >
          {placeholder}
        </option>
        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
            className="text-white bg-[#1a1a1a]"
          >
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {(["yes", "no"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={
            value === opt
              ? { backgroundColor: B, borderColor: B, color: "#1a0a10" }
              : {}
          }
          className={`px-6 py-2 rounded-xl text-sm font-semibold border transition-all ${
            value === opt
              ? "shadow-sm"
              : "bg-[#1a1a1a] text-gray-400 border-[#2a2a2a] hover:border-[#FDB8D7]/60 hover:text-gray-200"
          }`}
        >
          {opt === "yes" ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={
            value === opt ? { borderColor: B, backgroundColor: `${B}14` } : {}
          }
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
            value === opt
              ? "text-white"
              : "border-[#2a2a2a] bg-[#1a1a1a] text-gray-400 hover:border-[#FDB8D7]/40 hover:text-gray-300"
          }`}
        >
          <div
            style={value === opt ? { borderColor: B } : {}}
            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              value === opt ? "" : "border-[#444]"
            }`}
          >
            {value === opt && (
              <div
                style={{ backgroundColor: B }}
                className="w-2 h-2 rounded-full"
              />
            )}
          </div>
          {opt}
        </button>
      ))}
    </div>
  );
}

function StyledCheckbox({
  checked,
  onCheckedChange,
  id,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id: string;
  label: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(!!v)}
        style={checked ? { backgroundColor: B, borderColor: B } : {}}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked ? "" : "border-[#444] bg-[#1a1a1a] hover:border-[#FDB8D7]/60"
        }`}
      >
        <CheckboxPrimitive.Indicator>
          <Check
            className="w-3 h-3 text-[#1a0a10]"
            strokeWidth={3}
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label
        htmlFor={id}
        className="text-sm text-gray-300 cursor-pointer leading-relaxed"
      >
        {label}
      </label>
    </div>
  );
}

// ─── Success Screen (with confetti) ──────────────────────────────────────────

function SuccessScreen() {
  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 3500;

    async function fire() {
      const confetti = (await import("canvas-confetti")).default;

      function burst(origin: { x: number; y: number }, angle: number) {
        confetti({
          particleCount: 60,
          angle,
          spread: 70,
          origin,
          colors: ["#FDB8D7", "#ffffff", "#f9a8d4", "#fce7f3", "#e879a0"],
          scalar: 1.1,
          gravity: 0.9,
          drift: 0,
        });
      }

      function loop(ts: number) {
        if (!start) start = ts;
        const elapsed = ts - start;
        if (elapsed < duration) {
          burst({ x: 0, y: 0.6 }, 60);
          burst({ x: 1, y: 0.6 }, 120);
          frame = requestAnimationFrame((next) => {
            setTimeout(() => loop(next), 350);
          });
        }
      }

      frame = requestAnimationFrame(loop);
    }

    fire();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
        <div
          className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-6 shadow-lg"
          style={{ boxShadow: `0 0 0 2px ${B}40` }}
        >
          <Image
            src="/logo1.jpeg"
            alt="Effervescent Agency"
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Application Submitted!
        </h2>
        <p className="text-gray-300 text-base leading-relaxed">
          Thank you! We&apos;ll be in touch soon.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplyPage() {
  const [slide, setSlide] = useState(1);
  const [visible, setVisible] = useState(true);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [photoUploadError, setPhotoUploadError] = useState("");
  const [idUploadError, setIdUploadError] = useState("");

  const photosRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  const upd = (patch: Partial<FormState>) =>
    setForm((f) => ({ ...f, ...patch }));

  function goToSlide(next: number) {
    setVisible(false);
    setTimeout(() => {
      setSlide(next);
      setErrors({});
      setVisible(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 180);
  }

  function validateCurrentSlide(): Record<string, string> {
    const e: Record<string, string> = {};
    if (slide === 1) {
      if (!form.fullName.trim()) e.fullName = "Full name is required";
      if (!form.dob) e.dob = "Date of birth is required";
      else if (!isAtLeast18(form.dob))
        e.dob = "You must be at least 18 years old to apply";
      if (!form.gender) e.gender = "Please select your gender identity";
      if (!form.email.trim()) e.email = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "Please enter a valid email address";
      if (!form.phone.trim()) e.phone = "Phone number is required";
      else if (!isValidPhone(form.phone))
        e.phone =
          "Enter a valid number with country code and no spaces — e.g. +447700000000";
      if (!form.instagram.trim())
        e.instagram = "Instagram username is required";
    }
    if (slide === 2) {
      if (!form.primaryCity)
        e.primaryCity = "Please select your primary location";
      if (!form.isStudent) e.isStudent = "Please select Yes or No";
      if (form.isStudent === "yes" && !form.homeCity.trim())
        e.homeCity = "Home city is required";
      if (!form.doesDrive) e.doesDrive = "Please select Yes or No";
    }
    if (slide === 3) {
      if (form.photos.length < 2)
        e.photos = "Please upload at least 2 photos of yourself";
      if (!form.passportId)
        e.passportId = "Please upload your passport as photo ID";
      if (form.nonUkPassport && !form.shareCode.trim())
        e.shareCode = "Share code is required for non-UK passport holders";
    }
    if (slide === 4) {
      if (!form.priorExp) e.priorExp = "Please select Yes or No";
      if (form.priorExp === "yes") {
        if (!form.prevCompany.trim())
          e.prevCompany = "Previous company / venue is required";
        if (!form.yearsExp.trim())
          e.yearsExp = "Years of experience is required";
      }
      if (!form.understandRole.trim())
        e.understandRole = "This field is required";
      if (!form.whyFit.trim()) e.whyFit = "This field is required";
      if (!form.salesExp.trim()) e.salesExp = "This field is required";
      if (!form.startDate)
        e.startDate = "Please select an available start date";
    }
    if (slide === 5) {
      if (!form.selfEmployed)
        e.selfEmployed = "You must acknowledge this to proceed";
      if (!form.weekendWork)
        e.weekendWork = "You must acknowledge this to proceed";
      if (!form.heardAbout)
        e.heardAbout = "Please tell us how you heard about us";
    }
    return e;
  }

  function handleNext() {
    const e = validateCurrentSlide();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    if (slide < 5) goToSlide(slide + 1);
    else handleSubmit();
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files) return;
    setPhotoUploadError("");
    const current = [...form.photos];
    for (const file of Array.from(files)) {
      if (current.length >= 5) {
        setPhotoUploadError("Maximum 5 photos allowed");
        break;
      }
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        setPhotoUploadError(
          `"${file.name}" is not allowed. Only JPG, PNG, or WEBP images.`,
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setPhotoUploadError(`"${file.name}" exceeds 10MB.`);
        continue;
      }
      current.push({
        name: file.name,
        base64: await toBase64(file),
        size: file.size,
        type: file.type,
      });
    }
    upd({ photos: current });
    if (photosRef.current) photosRef.current.value = "";
  }

  async function handleIdUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIdUploadError("");
    const file = files[0];
    if (!ALLOWED_ID_TYPES.includes(file.type)) {
      setIdUploadError("Only JPG or PNG accepted for photo ID.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setIdUploadError("File must be under 10MB.");
      return;
    }
    upd({
      passportId: {
        name: file.name,
        base64: await toBase64(file),
        size: file.size,
        type: file.type,
      },
    });
    if (idRef.current) idRef.current.value = "";
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        personalInfo: {
          fullName: form.fullName,
          dateOfBirth: form.dob,
          gender: form.gender,
          email: form.email,
          phone: form.phone,
          instagram: form.instagram,
        },
        location: {
          primaryLocation: form.primaryCity,
          secondLocation: form.secondCity,
          manualLocation: form.manualCity,
          isStudent: form.isStudent,
          homeCity: form.homeCity,
          doesDrive: form.doesDrive,
        },
        photos: {
          selfPhotos: form.photos.map((p) => ({
            name: p.name,
            base64: p.base64,
            type: p.type,
          })),
          passportId: form.passportId
            ? {
                name: form.passportId.name,
                base64: form.passportId.base64,
                type: form.passportId.type,
              }
            : null,
          hasNonUkPassport: form.nonUkPassport,
          shareCode: form.shareCode,
        },
        experience: {
          hasPriorExperience: form.priorExp,
          previousCompany: form.prevCompany,
          yearsOfExperience: form.yearsExp,
          understandRole: form.understandRole,
          whyGoodFit: form.whyFit,
          salesExperience: form.salesExp,
          availableFrom: form.startDate,
        },
        declarations: {
          selfEmployed: form.selfEmployed,
          weekendWork: form.weekendWork,
          heardAbout: form.heardAbout,
        },
      };
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Something went wrong. Please try again or contact us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success Screen ──────────────────────────────────────────────────────────

  if (submitted) return <SuccessScreen />;

  // ─── Form Layout ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#1a1a1a] sticky top-0 z-20">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div
            className="h-10 rounded-xl overflow-hidden"
            style={{ boxShadow: `0 0 0 1px ${B}30` }}
          >
            <Image
              src="/logo2.jpeg"
              alt="Effervescent Agency"
              width={180}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </div>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{
              color: B,
              backgroundColor: `${B}12`,
              borderColor: `${B}35`,
            }}
          >
            {slide} / 5
          </span>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-xl mx-auto px-4 pt-5 pb-2">
        <div className="flex items-start justify-between mb-3">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div
                style={
                  s <= slide
                    ? {
                        backgroundColor: B,
                        color: "#1a0a10",
                        boxShadow: s === slide ? `0 0 0 4px ${B}30` : undefined,
                      }
                    : {}
                }
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  s <= slide
                    ? ""
                    : "bg-[#1a1a1a] text-gray-600 border border-[#2a2a2a]"
                }`}
              >
                {s < slide ? (
                  <Check
                    className="w-4 h-4"
                    strokeWidth={3}
                  />
                ) : (
                  s
                )}
              </div>
              <span
                style={s === slide ? { color: B } : {}}
                className={`text-[10px] font-medium text-center leading-none hidden sm:block ${s === slide ? "" : "text-gray-600"}`}
              >
                {SLIDE_LABELS[s - 1]}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            style={{
              width: `${((slide - 1) / 4) * 100}%`,
              background: `linear-gradient(to right, ${B}, #e89fbe)`,
            }}
            className="h-full rounded-full transition-all duration-500 ease-out"
          />
        </div>
      </div>

      {/* Slide Card */}
      <div
        className={`max-w-xl mx-auto px-4 py-4 transition-all duration-200 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      >
        <div className="bg-[#111111] rounded-3xl border border-[#1f1f1f] overflow-hidden shadow-2xl">
          {/* Card Header */}
          <div
            className="px-6 py-5"
            style={{ background: `linear-gradient(135deg, #2a0d1c, #3d1228)` }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: `${B}90` }}
            >
              Step {slide} of 5
            </p>
            <h2
              className="text-xl font-bold"
              style={{ color: B }}
            >
              {SLIDE_TITLES[slide - 1]}
            </h2>
          </div>

          {/* Card Body */}
          <div className="px-6 py-6 space-y-5">
            {/* ── Slide 1 ── */}
            {slide === 1 && (
              <>
                <div>
                  <FieldLabel required>Full Name</FieldLabel>
                  <TextInput
                    value={form.fullName}
                    onChange={(v) => upd({ fullName: v })}
                    placeholder="Jane Smith"
                  />
                  <FieldError message={errors.fullName} />
                </div>
                <div>
                  <FieldLabel required>Date of Birth</FieldLabel>
                  <TextInput
                    type="date"
                    value={form.dob}
                    onChange={(v) => upd({ dob: v })}
                  />
                  <FieldError message={errors.dob} />
                </div>
                <div>
                  <FieldLabel required>What do you identify as?</FieldLabel>
                  <RadioGroup
                    options={GENDER_OPTIONS}
                    value={form.gender}
                    onChange={(v) => upd({ gender: v })}
                  />
                  <FieldError message={errors.gender} />
                </div>
                <div>
                  <FieldLabel required>Email Address</FieldLabel>
                  <TextInput
                    type="email"
                    value={form.email}
                    onChange={(v) => upd({ email: v })}
                    placeholder="jane@example.com"
                  />
                  <FieldError message={errors.email} />
                </div>
                <div>
                  <FieldLabel required>Mobile Phone / WhatsApp</FieldLabel>
                  <TextInput
                    type="tel"
                    value={form.phone}
                    onChange={(v) => upd({ phone: v })}
                    onBlur={() => {
                      if (form.phone.trim()) {
                        const normalized = normalizePhone(form.phone);
                        upd({ phone: normalized });
                      }
                    }}
                    placeholder="+447700000000 — country code, no spaces"
                  />
                  <p className="mt-1 text-[11px] text-gray-600">
                    Include country code · no spaces or dashes · e.g.
                    +447700000000
                  </p>
                  <FieldError message={errors.phone} />
                </div>
                <div>
                  <FieldLabel required>Instagram Username</FieldLabel>
                  <TextInput
                    value={form.instagram}
                    onChange={(v) => upd({ instagram: v })}
                    placeholder="@username"
                  />
                  <FieldError message={errors.instagram} />
                </div>
              </>
            )}

            {/* ── Slide 2 ── */}
            {slide === 2 && (
              <>
                <div>
                  <FieldLabel required>Primary Location</FieldLabel>
                  <SelectInput
                    value={form.primaryCity}
                    onChange={(v) => upd({ primaryCity: v })}
                    options={UK_CITIES}
                    placeholder="Select your city…"
                  />
                  <FieldError message={errors.primaryCity} />
                </div>
                <div>
                  <FieldLabel>
                    Second Choice Location{" "}
                    <span className="text-gray-600 font-normal text-xs">
                      (optional)
                    </span>
                  </FieldLabel>
                  <SelectInput
                    value={form.secondCity}
                    onChange={(v) => upd({ secondCity: v })}
                    options={UK_CITIES}
                    placeholder="Select second choice…"
                  />
                </div>
                <div>
                  <FieldLabel>
                    Location Not Listed?{" "}
                    <span className="text-gray-600 font-normal text-xs">
                      (optional)
                    </span>
                  </FieldLabel>
                  <TextInput
                    value={form.manualCity}
                    onChange={(v) => upd({ manualCity: v })}
                    placeholder="Enter your city manually"
                  />
                </div>
                <div>
                  <FieldLabel required>Are you a student?</FieldLabel>
                  <YesNoToggle
                    value={form.isStudent}
                    onChange={(v) => upd({ isStudent: v })}
                  />
                  <FieldError message={errors.isStudent} />
                  {form.isStudent === "yes" && (
                    <div
                      className="mt-3 pl-4 border-l-2 space-y-0"
                      style={{ borderColor: `${B}40` }}
                    >
                      <FieldLabel required>Home City</FieldLabel>
                      <TextInput
                        value={form.homeCity}
                        onChange={(v) => upd({ homeCity: v })}
                        placeholder="Your home city"
                      />
                      <FieldError message={errors.homeCity} />
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel required>Do you drive?</FieldLabel>
                  <YesNoToggle
                    value={form.doesDrive}
                    onChange={(v) => upd({ doesDrive: v })}
                  />
                  <FieldError message={errors.doesDrive} />
                </div>
              </>
            )}

            {/* ── Slide 3 ── */}
            {slide === 3 && (
              <>
                <div>
                  <FieldLabel required>Photos of Yourself</FieldLabel>
                  <p className="text-xs text-gray-500 mb-2">
                    Upload 2 photos. JPG, PNG, or WEBP only. Max 10MB each.
                  </p>
                  <div
                    onClick={() => photosRef.current?.click()}
                    className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 text-center bg-[#141414] cursor-pointer transition-all"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = B;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                    }}
                  >
                    <Upload
                      className="w-8 h-8 mx-auto mb-2"
                      style={{ color: B }}
                    />
                    <p
                      className="text-sm font-semibold"
                      style={{ color: B }}
                    >
                      Click to add photos
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {form.photos.length} / 2 uploaded
                      {form.photos.length < 2 && " (need at least 2)"}
                    </p>
                  </div>
                  <input
                    ref={photosRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    hidden
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                  {photoUploadError && (
                    <FieldError message={photoUploadError} />
                  )}
                  <FieldError message={errors.photos} />
                  {form.photos.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {form.photos.map((p, i) => (
                        <div
                          key={i}
                          className="relative rounded-xl overflow-hidden bg-[#1a1a1a] aspect-square group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.base64}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              upd({
                                photos: form.photos.filter(
                                  (_, idx) => idx !== i,
                                ),
                              })
                            }
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel required>
                    Upload Photo ID (Passport Only)
                  </FieldLabel>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3 text-xs text-amber-400 leading-relaxed">
                    <strong>Note:</strong> We require a passport copy for Right
                    to Work in UK check. If you have a non-UK passport, you will
                    also need to provide your Share Code.{" "}
                    <span className="text-amber-500/80">
                      We do NOT accept driving licences.
                    </span>
                  </div>
                  {!form.passportId ? (
                    <div
                      onClick={() => idRef.current?.click()}
                      className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 text-center bg-[#141414] cursor-pointer transition-all"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = B;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "";
                      }}
                    >
                      <Upload
                        className="w-8 h-8 mx-auto mb-2"
                        style={{ color: B }}
                      />
                      <p
                        className="text-sm font-semibold"
                        style={{ color: B }}
                      >
                        Click to upload passport
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        JPG or PNG only — max 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#222] flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.passportId.base64}
                          alt="Passport ID"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {form.passportId.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(form.passportId.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => upd({ passportId: null })}
                        className="text-gray-600 hover:text-red-400 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    ref={idRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    hidden
                    onChange={(e) => handleIdUpload(e.target.files)}
                  />
                  {idUploadError && <FieldError message={idUploadError} />}
                  <FieldError message={errors.passportId} />
                </div>

                <div className="space-y-3">
                  <StyledCheckbox
                    id="nonUkPassport"
                    checked={form.nonUkPassport}
                    onCheckedChange={(v) =>
                      upd({
                        nonUkPassport: v,
                        shareCode: v ? form.shareCode : "",
                      })
                    }
                    label="I have a non-UK passport"
                  />
                  {form.nonUkPassport && (
                    <div className="pl-8">
                      <FieldLabel required>Share Code</FieldLabel>
                      <TextInput
                        value={form.shareCode}
                        onChange={(v) => upd({ shareCode: v })}
                        placeholder="e.g. W12 3AB 4CD"
                      />
                      <FieldError message={errors.shareCode} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Slide 4 ── */}
            {slide === 4 && (
              <>
                <div>
                  <FieldLabel required>
                    Have you ever been a shot seller before?
                  </FieldLabel>
                  <YesNoToggle
                    value={form.priorExp}
                    onChange={(v) => upd({ priorExp: v })}
                  />
                  <FieldError message={errors.priorExp} />
                  {form.priorExp === "yes" && (
                    <div
                      className="mt-3 pl-4 border-l-2 space-y-4"
                      style={{ borderColor: `${B}40` }}
                    >
                      <div>
                        <FieldLabel required>
                          Previous Company / Venue
                        </FieldLabel>
                        <TextInput
                          value={form.prevCompany}
                          onChange={(v) => upd({ prevCompany: v })}
                          placeholder="Company or venue name"
                        />
                        <FieldError message={errors.prevCompany} />
                      </div>
                      <div>
                        <FieldLabel required>Years of Experience</FieldLabel>
                        <TextInput
                          type="number"
                          value={form.yearsExp}
                          onChange={(v) => upd({ yearsExp: v })}
                          placeholder="e.g. 2"
                        />
                        <FieldError message={errors.yearsExp} />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel required>
                    What do you understand about being a shot-seller?
                  </FieldLabel>
                  <TextareaInput
                    value={form.understandRole}
                    onChange={(v) => upd({ understandRole: v })}
                    placeholder="Describe your understanding of the role…"
                  />
                  <FieldError message={errors.understandRole} />
                </div>
                <div>
                  <FieldLabel required>
                    Why do you think you&apos;ll be a good fit for the role?
                  </FieldLabel>
                  <TextareaInput
                    value={form.whyFit}
                    onChange={(v) => upd({ whyFit: v })}
                    placeholder="Tell us why you'd be great for this role…"
                  />
                  <FieldError message={errors.whyFit} />
                </div>
                <div>
                  <FieldLabel required>
                    What sales &amp; customer service experience do you have?
                  </FieldLabel>
                  <TextareaInput
                    value={form.salesExp}
                    onChange={(v) => upd({ salesExp: v })}
                    placeholder="Describe your relevant experience…"
                  />
                  <FieldError message={errors.salesExp} />
                </div>
                <div>
                  <FieldLabel required>
                    How soon are you available to start?
                  </FieldLabel>
                  <TextInput
                    type="date"
                    value={form.startDate}
                    onChange={(v) => upd({ startDate: v })}
                  />
                  <FieldError message={errors.startDate} />
                </div>
              </>
            )}

            {/* ── Slide 5 ── */}
            {slide === 5 && (
              <>
                <div
                  className="rounded-2xl p-5 space-y-5 border"
                  style={{ backgroundColor: `${B}08`, borderColor: `${B}20` }}
                >
                  <p
                    className="text-sm font-bold"
                    style={{ color: B }}
                  >
                    Please read and tick each box to confirm:
                  </p>
                  <div>
                    <StyledCheckbox
                      id="selfEmployed"
                      checked={form.selfEmployed}
                      onCheckedChange={(v) => upd({ selfEmployed: v })}
                      label={
                        <span>
                          I understand this is{" "}
                          <strong className="text-white">
                            self-employed work, NOT employment
                          </strong>
                        </span>
                      }
                    />
                    <FieldError message={errors.selfEmployed} />
                  </div>
                  <div>
                    <StyledCheckbox
                      id="weekendWork"
                      checked={form.weekendWork}
                      onCheckedChange={(v) => upd({ weekendWork: v })}
                      label={
                        <span>
                          I understand this is predominantly{" "}
                          <strong className="text-white">
                            weekend / night time work
                          </strong>
                        </span>
                      }
                    />
                    <FieldError message={errors.weekendWork} />
                  </div>
                </div>
                <div>
                  <FieldLabel required>How did you hear about us?</FieldLabel>
                  <SelectInput
                    value={form.heardAbout}
                    onChange={(v) => upd({ heardAbout: v })}
                    options={HEARD_ABOUT_OPTIONS}
                    placeholder="Select an option…"
                  />
                  <FieldError message={errors.heardAbout} />
                </div>
                {submitError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{submitError}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 border-t border-[#1a1a1a] flex justify-between items-center">
            <button
              type="button"
              onClick={() => slide > 1 && goToSlide(slide - 1)}
              disabled={slide === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#2a2a2a] text-gray-400 bg-[#141414] hover:border-[#FDB8D7]/50 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              style={{
                background: `linear-gradient(135deg, ${B}, #e89fbe)`,
                color: "#1a0a10",
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#1a0a10]/30 border-t-[#1a0a10] rounded-full animate-spin" />
                  Submitting…
                </>
              ) : slide === 5 ? (
                "Submit Application"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4 pb-4">
          Your information is handled securely and will only be used for your
          application.
        </p>
      </div>
    </div>
  );
}
