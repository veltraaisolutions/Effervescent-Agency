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
import { supabase } from "@/lib/supabase";
import "react-phone-number-input/style.css";
import PhoneInput, {
  isValidPhoneNumber,
  getCountryCallingCode,
  getCountries,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";

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

const WEBHOOK_URL = "https://n8n.veltraai.net/webhook/web-form-milli";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const COUNTRY_LABELS = getCountries().reduce(
  (acc, country) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = (en as any)[country] || country;
    try {
      const code = getCountryCallingCode(country);
      acc[country] = `(+${code}) ${name}`;
    } catch {
      acc[country] = name;
    }
    return acc;
  },
  {} as Record<string, string>,
);

const SORTED_COUNTRIES = getCountries().sort((a, b) => {
  const nameA = (en as any)[a] || "";
  const nameB = (en as any)[b] || "";
  return nameA.localeCompare(nameB);
});

const ALLOWED_ID_TYPES = ["image/jpeg", "image/jpg", "image/png"];

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

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.82,
): Promise<string> {
  return new Promise((res, rej) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      res(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = rej;
    img.src = url;
  });
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-brand-pink">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
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
      onBlur={onBlur}
      className="w-full px-3 py-2 border border-brand-pink-mid rounded-xl text-sm
        bg-white text-gray-900 placeholder:text-gray-400
        focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink
        disabled:opacity-50 transition-all"
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
      className="w-full px-3 py-2 border border-brand-pink-mid rounded-xl text-sm
        bg-white text-gray-900 placeholder:text-gray-400
        focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink
        resize-none transition-all"
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
        className="w-full appearance-none px-3 py-2 border border-brand-pink-mid rounded-xl text-sm
          bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-pink
          focus:border-brand-pink transition-all"
      >
        <option
          value=""
          className="text-gray-400"
        >
          {placeholder}
        </option>
        {options.map((opt) => (
          <option
            key={opt}
            value={opt}
            className="text-gray-900 bg-white"
          >
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
          className={`px-6 py-2 rounded-xl text-sm font-semibold border transition-all ${
            value === opt
              ? "bg-brand-pink border-brand-pink text-white shadow-sm"
              : "bg-white text-gray-600 border-gray-300 hover:border-brand-pink hover:text-brand-pink"
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
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
            value === opt
              ? "border-brand-pink bg-brand-pink-light text-gray-900"
              : "border-gray-200 bg-white text-gray-600 hover:border-brand-pink-mid hover:text-gray-800"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
              value === opt ? "border-brand-pink" : "border-gray-300"
            }`}
          >
            {value === opt && (
              <div className="w-2 h-2 rounded-full bg-brand-pink" />
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
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          checked
            ? "bg-brand-pink border-brand-pink"
            : "border-gray-300 bg-white hover:border-brand-pink"
        }`}
      >
        <CheckboxPrimitive.Indicator>
          <Check
            className="w-3 h-3 text-white"
            strokeWidth={3}
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label
        htmlFor={id}
        className="text-sm text-gray-700 cursor-pointer leading-relaxed"
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
          colors: ["#ec4899", "#ffffff", "#fbcfe8", "#fdf2f8", "#be185d"],
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-6 shadow-md ring-2 ring-pink-200">
          <Image
            src="/logo.jpeg"
            alt="Effervescent Agency"
            width={96}
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Application Submitted!
        </h2>
        <p className="text-gray-600 text-base leading-relaxed">
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
        e.dob =
          "Due to the nature of this work - we can only accept applicants over 18";
      if (!form.email.trim()) e.email = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "Please enter a valid email address";
      if (!form.phone || !form.phone.trim())
        e.phone = "Phone number is required";
      else if (!isValidPhoneNumber(form.phone))
        e.phone = "Please enter a valid international phone number";
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
      if (current.length >= 2) {
        setPhotoUploadError("Maximum 2 photos allowed");
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
        base64: await compressImage(file),
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
        base64: await compressImage(file, 1600, 0.88), // slightly higher quality for ID readability
        size: file.size,
        type: file.type,
      },
    });
    if (idRef.current) idRef.current.value = "";
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");

    // ─── Optimization & Sanitization ──────────────────────────────────────────
    const cleanPhone = form.phone.replace(/[\s\-\(\)]/g, "");
    const cleanEmail = form.email.trim().toLowerCase();
    const cleanFullName = form.fullName.trim();
    const cleanInstagram = form.instagram.trim();
    const cleanManualCity = form.manualCity.trim();
    const cleanHomeCity = form.homeCity.trim();
    const cleanShareCode = form.shareCode.trim().toUpperCase();
    const cleanPrevCompany = form.prevCompany.trim();

    try {
      // Check if blacklisted using sanitized data
      const { data: blacklistedData } = await supabase
        .from("milli_candidates")
        .select("id")
        .or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`)
        .eq("blacklisted", true)
        .limit(1);

      if (blacklistedData && blacklistedData.length > 0) {
        setSubmitError(
          "You are unable to apply at this time. Please contact us if you think this is a mistake.",
        );
        setSubmitting(false);
        return;
      }

      const payload = {
        personalInfo: {
          fullName: cleanFullName,
          dateOfBirth: form.dob,
          email: cleanEmail,
          phone: cleanPhone,
          instagram: cleanInstagram,
        },
        location: {
          primaryLocation: form.primaryCity,
          secondLocation: form.secondCity,
          manualLocation: cleanManualCity,
          isStudent: form.isStudent,
          homeCity: cleanHomeCity,
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
          shareCode: cleanShareCode,
        },
        experience: {
          hasPriorExperience: form.priorExp,
          previousCompany: cleanPrevCompany,
          yearsOfExperience: form.yearsExp,
          understandRole: form.understandRole.trim(),
          whyGoodFit: form.whyFit.trim(),
          salesExperience: form.salesExp.trim(),
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Container */}
            <div className="h-10 rounded-xl overflow-hidden ring-1 ring-brand-pink-mid">
              <Image
                src="/logo.jpeg"
                alt="Effervescent Agency"
                width={180}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>

            {/* Entire title in the pink color */}
            <h1 className="text-sm font-bold text-brand-pink">
              Effervescent Agency{" "}
              <span className="hidden sm:inline">
                - Shot Seller Application Form
              </span>
            </h1>
          </div>

          {/* Counter */}
          <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-brand-pink-light text-brand-pink-dark border-brand-pink-mid whitespace-nowrap">
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  s <= slide
                    ? s === slide
                      ? "bg-brand-pink text-white ring-4 ring-brand-pink-light"
                      : "bg-brand-pink text-white"
                    : "bg-gray-100 text-gray-400 border border-gray-300"
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
                className={`text-[10px] font-medium text-center leading-none hidden sm:block ${
                  s === slide ? "text-brand-pink" : "text-gray-400"
                }`}
              >
                {SLIDE_LABELS[s - 1]}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-gray-200/50 rounded-full overflow-hidden">
          <div
            style={{ width: `${((slide - 1) / 4) * 100}%` }}
            className="h-full rounded-full bg-gradient-to-r from-brand-pink to-brand-pink-dark transition-all duration-500 ease-out"
          />
        </div>
      </div>

      {/* Slide Card */}
      <div
        className={`max-w-xl mx-auto px-4 py-4 transition-all duration-200 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="bg-white rounded-3xl border border-brand-pink-light overflow-hidden shadow-sm">
          {/* Card Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-brand-pink to-brand-pink-mid">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-white opacity-90">
              Step {slide} of 5
            </p>
            <h2 className="text-xl font-bold text-white">
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
                  <FieldLabel required>Email Address</FieldLabel>
                  <TextInput
                    type="email"
                    value={form.email}
                    onChange={(v) => upd({ email: v })}
                    placeholder="jane@example.com"
                  />
                  <FieldError message={errors.email} />
                </div>
                {/* ── Phone — international-aware ── */}
                <div>
                  <FieldLabel required>Mobile Phone / WhatsApp</FieldLabel>
                  <div className="phone-input-container">
                    <PhoneInput
                      international
                      withCountryCallingCode
                      defaultCountry="GB"
                      countries={SORTED_COUNTRIES}
                      labels={COUNTRY_LABELS}
                      value={form.phone}
                      onChange={(v) => upd({ phone: v || "" })}
                      className="phone-input-wrapper"
                    />
                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-2.5 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-amber-800 leading-tight">
                        Please use your number registered on WhatsApp only.
                      </p>
                    </div>
                  </div>
                  <style
                    jsx
                    global
                  >{`
                    .phone-input-container .phone-input-wrapper {
                      display: flex;
                      align-items: center;
                      gap: 8px;
                    }
                    .phone-input-container .PhoneInputCountry {
                      background-color: #fdf2f8; /* pink-50 */
                      border: 2px solid #fbcfe8 !important; /* pink-200 */
                      padding: 4px 8px;
                      border-radius: 12px;
                      transition: all 0.2s;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      height: 40px;
                    }
                    .phone-input-container .PhoneInputCountry:hover {
                      background-color: #fce7f3; /* pink-100 */
                      border-color: #ec4899 !important; /* pink-500 */
                    }
                    .phone-input-container .PhoneInputCountryIcon {
                      width: 24px !important;
                      height: 16px !important;
                      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    }
                    /* Style for the country calling code text next to the flag */
                    .phone-input-container .PhoneInputCountry {
                      font-size: 13px;
                      font-weight: 600;
                      color: #111827 !important;
                      gap: 4px;
                    }
                    .phone-input-container .PhoneInputCountrySelectArrow {
                      color: #ec4899;
                      opacity: 0.8;
                      margin-left: 4px;
                      width: 7px;
                      height: 7px;
                    }
                    .phone-input-container .PhoneInputInput {
                      flex: 1;
                      height: 40px;
                      padding: 8px 12px;
                      border: 2px solid #fbcfe8 !important; /* border-brand-pink-mid */
                      border-radius: 12px;
                      font-size: 14px;
                      font-weight: 500;
                      background-color: #ffffff;
                      color: #111827 !important;
                      transition: all 0.2s;
                      outline: none;
                    }
                    .phone-input-container .PhoneInputInput:focus {
                      box-shadow: 0 0 0 3px #ec489922;
                      border-color: #ec4899 !important;
                    }
                    .phone-input-container select {
                      color: #111827 !important;
                      background-color: #ffffff !important;
                      cursor: pointer;
                    }
                    .phone-input-container .PhoneInputInput::placeholder {
                      color: #9ca3af !important;
                    }
                  `}</style>
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
                    <span className="text-gray-400 font-normal text-xs">
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
                    <span className="text-gray-400 font-normal text-xs">
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
                    <div className="mt-3 pl-4 border-l-2 border-brand-pink-mid space-y-0">
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
                    Upload exactly 2 photos of yourself. JPG, PNG, or WEBP only.
                    Max 10MB each.
                  </p>
                  <label
                    htmlFor="photos-input"
                    className="border-2 border-dashed border-brand-pink-mid rounded-2xl p-6 text-center bg-brand-pink-light/40 cursor-pointer hover:bg-brand-pink-light transition-all block"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-brand-pink" />
                    <p className="text-sm font-semibold text-pink-500">
                      Click to add photos
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {form.photos.length} / 2 uploaded
                      {form.photos.length < 2 &&
                        ` (need ${2 - form.photos.length} more)`}
                    </p>
                  </label>
                  <input
                    id="photos-input"
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
                          className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square group"
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
                            className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
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
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-700 leading-relaxed">
                    <strong>Note:</strong> We require a passport copy for Right
                    to Work in UK check. If you have a non-UK passport, you will
                    also need to provide your Share Code.{" "}
                    <span className="text-amber-600">
                      We do NOT accept driving licences.
                    </span>
                  </div>
                  {!form.passportId ? (
                    <label
                      htmlFor="id-input"
                      className="border-2 border-dashed border-brand-pink-mid rounded-2xl p-6 text-center bg-brand-pink-light/40 cursor-pointer hover:bg-brand-pink-light transition-all block"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-brand-pink" />
                      <p className="text-sm font-semibold text-pink-500">
                        Click to upload passport
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG or PNG only — max 10MB
                      </p>
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.passportId.base64}
                          alt="Passport ID"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {form.passportId.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(form.passportId.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => upd({ passportId: null })}
                        className="text-red-400 hover:text-red-600 p-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    id="id-input"
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
                  <div>
                    <FieldLabel required>Do you have a UK passport?</FieldLabel>
                    <YesNoToggle
                      value={
                        form.nonUkPassport === false
                          ? "yes"
                          : form.nonUkPassport === true
                            ? "no"
                            : ""
                      }
                      onChange={(v) =>
                        upd({
                          nonUkPassport: v === "no",
                          shareCode: v === "yes" ? "" : form.shareCode,
                        })
                      }
                    />
                  </div>
                  {form.nonUkPassport === true && (
                    <div className="pl-4 border-l-2 border-brand-pink-mid">
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
                    <div className="mt-3 pl-4 border-l-2 border-brand-pink-mid space-y-4">
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
                <div className="rounded-2xl p-5 space-y-5 bg-brand-pink-light border border-brand-pink-mid">
                  <p className="text-sm font-bold text-brand-pink-dark">
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
                          <strong className="text-gray-900">
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
                          <strong className="text-gray-900">
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
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
            <button
              type="button"
              onClick={() => slide > 1 && goToSlide(slide - 1)}
              disabled={slide === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-600 bg-white hover:border-pink-400 hover:text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-brand-pink-light0 hover:bg-brand-pink-dark text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

        <p className="text-center text-xs text-gray-400 mt-4 pb-4">
          Your information is handled securely and will only be used for your
          application.
        </p>
      </div>
    </div>
  );
}
