/**
 * ─── Effervescent Agency — Central Theme ──────────────────────────────────────
 *
 * All colours, shadows, and design tokens live here.
 * To retheme the entire project, only edit this file.
 *
 * Usage:
 *   import { T } from "@/styles/theme";
 *   <div style={{ background: T.bg.page }} />
 *   className={T.cls.card}          // pre-built Tailwind class strings
 */

// ─── Raw colour palette ───────────────────────────────────────────────────────

export const PALETTE = {
  // Brand pinks
  pink: "#ec4899", // primary action colour (buttons, active states)
  pinkLight: "#fdf2f8", // very light pink tint — used for hover bg, etc.
  pinkMid: "#fbcfe8", // softer pink for borders, badges
  pinkDark: "#be185d", // deeper pink for hover on buttons

  // Neutrals
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  black: "#000000",

  // Semantic
  green: "#16a34a",
  greenLight: "#dcfce7",
  red: "#dc2626",
  redLight: "#fee2e2",
  yellow: "#ca8a04",
  yellowLight: "#fef9c3",
  blue: "#2563eb",
  blueLight: "#dbeafe",
  sky: "#0284c7",
  skyLight: "#e0f2fe",
  purple: "#7c3aed",
  purpleLight: "#ede9fe",
  emerald: "#059669",
  emeraldLight: "#d1fae5",
  orange: "#ea580c",
  orangeLight: "#ffedd5",
} as const;

// ─── Semantic tokens ──────────────────────────────────────────────────────────

export const T = {
  // ── Backgrounds ──────────────────────────────────────────────────────────────
  bg: {
    page: PALETTE.white, // main page background
    surface: PALETTE.white, // cards, table container
    surfaceAlt: PALETTE.gray50, // alternate row / subtle section bg
    header: PALETTE.white, // sticky header background
    input: PALETTE.white, // form inputs
    inputHover: PALETTE.gray50,
    modal: PALETTE.white, // modal / drawer background
    modalHeader: PALETTE.pink, // modal gradient header (solid fallback)
    overlay: "rgba(0,0,0,0.45)", // backdrop
    badge: {
      pending: PALETTE.yellowLight,
      approved: PALETTE.greenLight,
      interview: PALETTE.skyLight,
      rejected: PALETTE.redLight,
      trial: PALETTE.purpleLight,
      onboarding: PALETTE.blueLight,
      onboarded: PALETTE.emeraldLight,
      orange: PALETTE.orangeLight,
    },
  },

  // ── Text ─────────────────────────────────────────────────────────────────────
  text: {
    primary: PALETTE.gray900,
    secondary: PALETTE.gray900,
    muted: PALETTE.gray900,
    inverse: PALETTE.white,
    brand: PALETTE.pink,
    link: PALETTE.pink,
    badge: {
      pending: PALETTE.yellow,
      approved: PALETTE.green,
      interview: PALETTE.sky,
      rejected: PALETTE.red,
      trial: PALETTE.purple,
      onboarding: PALETTE.blue,
      onboarded: PALETTE.emerald,
      orange: PALETTE.orange,
    },
  },

  // ── Borders ──────────────────────────────────────────────────────────────────
  border: {
    default: PALETTE.gray200,
    strong: PALETTE.gray300,
    brand: PALETTE.pink,
    brandSoft: PALETTE.pinkMid,
    table: PALETTE.gray100,
    input: PALETTE.gray300,
    inputFocus: PALETTE.pink,
    badge: {
      pending: PALETTE.yellowLight,
      approved: PALETTE.greenLight,
      interview: PALETTE.skyLight,
      rejected: PALETTE.redLight,
      trial: PALETTE.purpleLight,
      onboarding: PALETTE.blueLight,
      onboarded: PALETTE.emeraldLight,
      orange: PALETTE.orangeLight,
    },
  },

  // ── Brand / action ───────────────────────────────────────────────────────────
  brand: {
    primary: PALETTE.pink,
    primaryHover: PALETTE.pinkDark,
    primaryText: PALETTE.white, // text on pink buttons
    soft: PALETTE.pinkLight, // very light pink bg
    softBorder: PALETTE.pinkMid,
  },

  // ── Shadows ──────────────────────────────────────────────────────────────────
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.08)",
    md: "0 4px 12px rgba(0,0,0,0.10)",
    lg: "0 8px 30px rgba(0,0,0,0.12)",
    card: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
  },

  // ── Pre-built Tailwind class strings (light theme) ────────────────────────
  // Use these for elements that appear many times so a single token change
  // propagates everywhere automatically.
  cls: {
    // Page shell
    page: "min-h-screen bg-white",
    header: "bg-white border-b border-gray-200 sticky top-0 z-10",

    // Cards / containers
    card: "bg-white border border-gray-200 rounded-2xl shadow-sm",
    cardHover: "hover:bg-gray-50 transition-colors",

    // Table
    tableWrap: "bg-white border border-gray-200 rounded-2xl overflow-visible",
    thead: "border-b border-gray-100",
    th: "px-4 py-3 text-left text-[11px] font-bold text-pink-500 uppercase tracking-wider whitespace-nowrap",
    tr: "hover:bg-pink-50/40 cursor-pointer transition-colors group",
    td: "px-4 py-3 text-gray-800 text-sm",
    divider: "divide-y divide-gray-100",

    // Inputs
    input:
      "w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all",
    textarea:
      "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 resize-none transition-all",

    // Buttons
    btnPrimary:
      "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm",
    btnSecondary:
      "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all",
    btnGhost:
      "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-pink-500 hover:bg-pink-50 transition-all",
    btnDanger:
      "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
    btnSuccess:
      "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
    btnPurple:
      "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
    btnBlue:
      "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
    btnEmerald:
      "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all",

    // Filter pills
    filterActive:
      "px-4 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-2 bg-pink-500 text-white border-pink-500 shadow-sm",
    filterInactive:
      "px-4 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-2 bg-white text-gray-600 border-gray-300 hover:border-pink-400 hover:text-pink-500",

    // Section headers inside modal
    sectionHeader:
      "text-xs font-bold text-pink-500 uppercase tracking-widest border-b border-gray-200 pb-2",

    // Info labels
    infoLabel:
      "text-[11px] font-semibold text-gray-400 uppercase tracking-wider",
    infoValue: "text-sm text-gray-800",

    // Modal backdrop
    backdrop: "fixed inset-0 bg-black/40 backdrop-blur-sm",
  },
} as const;

export default T;
