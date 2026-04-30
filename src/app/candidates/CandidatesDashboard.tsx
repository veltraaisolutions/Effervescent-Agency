"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { toggleWhitelist } from "@/app/whitelist/actions";
import { createPortal } from "react-dom";
import {
  X,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Car,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Star,
  ThumbsUp,
  ThumbsDown,
  Award,
  User,
  Save,
  NotebookPen,
  CheckSquare,
  Square,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Candidate } from "./types";
import {
  approveCandidate,
  rejectCandidate,
  markTrialOffered,
  markTrialSuccessful,
  markTrialFailed,
  changeStatus,
  updateTrialDetails,
  updateOnboardingChecklist,
  updateStaffNotes,
  deleteCandidate,
} from "./actions";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { T } from "@/styles/theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<Candidate["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  "interview booked": "Interview Booked",
  "interview rejected": "Interview Rejected",
  "rejected - non responsive": "Rejected - Non Responsive",
  rejected: "Rejected",
  trial_offered: "Trial Offered",
  onboarding: "Onboarding",
  "on-boarded": "Onboarded",
};

const STATUS_TRANSITIONS: Record<Candidate["status"], Candidate["status"][]> = {
  pending: ["approved", "rejected"],
  approved: ["interview booked", "rejected"],
  "interview booked": ["trial_offered", "rejected", "interview rejected"],
  "interview rejected": ["pending"],
  "rejected - non responsive": ["pending"],
  trial_offered: ["onboarding", "rejected"],
  onboarding: ["on-boarded", "rejected"],
  "on-boarded": [],
  rejected: ["pending"],
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Candidate["status"] }) {
  const styles: Record<
    Candidate["status"],
    { bg: string; text: string; border: string }
  > = {
    pending: {
      bg: T.bg.badge.pending,
      text: T.text.badge.pending,
      border: T.border.badge.pending,
    },
    approved: {
      bg: T.bg.badge.approved,
      text: T.text.badge.approved,
      border: T.border.badge.approved,
    },
    "interview booked": {
      bg: T.bg.badge.interview,
      text: T.text.badge.interview,
      border: T.border.badge.interview,
    },
    "interview rejected": {
      bg: T.bg.badge.rejected,
      text: T.text.badge.rejected,
      border: T.border.badge.rejected,
    },
    "rejected - non responsive": {
      bg: T.bg.badge.orange,
      text: T.text.badge.orange,
      border: T.border.badge.orange,
    },
    rejected: {
      bg: T.bg.badge.rejected,
      text: T.text.badge.rejected,
      border: T.border.badge.rejected,
    },
    trial_offered: {
      bg: T.bg.badge.trial,
      text: T.text.badge.trial,
      border: T.border.badge.trial,
    },
    onboarding: {
      bg: T.bg.badge.onboarding,
      text: T.text.badge.onboarding,
      border: T.border.badge.onboarding,
    },
    "on-boarded": {
      bg: T.bg.badge.onboarded,
      text: T.text.badge.onboarded,
      border: T.border.badge.onboarded,
    },
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== false && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className={T.cls.infoLabel}>{label}</span>
      <span className={T.cls.infoValue}>{value}</span>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className={T.cls.sectionHeader}>{title}</h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

// ─── Reject Reason Modal ──────────────────────────────────────────────────────

const REJECT_REASONS = [
  "Unsuitable for role",
  "No right-to-work",
  "Non-responsive",
  "Unsuccessful trial shift",
  "Unsuccessful interview",
  "Non-attendance to interview",
  "Non-attendance to trial shift",
];

function RejectReasonModal({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className={`${T.cls.backdrop} fixed inset-0`}
        onClick={onCancel}
      />
      <div
        className="relative rounded-2xl w-full max-w-sm shadow-2xl p-6"
        style={{
          background: T.bg.modal,
          border: `1px solid ${T.border.default}`,
        }}
      >
        <h3
          className="font-semibold text-base mb-1"
          style={{ color: T.text.primary }}
        >
          Reason for rejection
        </h3>
        <p
          className="text-xs mb-4"
          style={{ color: T.text.muted }}
        >
          Select a reason
        </p>
        <div className="space-y-2 mb-5">
          {REJECT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-all"
              style={
                selected === reason
                  ? {
                      background: T.bg.badge.rejected,
                      borderColor: T.border.badge.rejected,
                      color: T.text.badge.rejected,
                    }
                  : {
                      background: T.bg.surfaceAlt,
                      borderColor: T.border.default,
                      color: T.text.secondary,
                    }
              }
            >
              {reason}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all`}
            style={{ borderColor: T.border.default, color: T.text.secondary }}
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || isPending}
            className={`flex-1 ${T.cls.btnDanger}`}
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Candidate Detail Modal ───────────────────────────────────────────────────

function CandidateModal({
  candidate,
  onClose,
  onStatusChange,
}: {
  candidate: Candidate;
  onClose: () => void;
  onStatusChange: (id: string, patch: Partial<Candidate>) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState("");
  const [activeAction, setActiveAction] = useState<
    | "approve"
    | "reject"
    | "trial_offer"
    | "trial_success"
    | "trial_fail"
    | "complete_onboarding"
    | null
  >(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [trialDate, setTrialDate] = useState(candidate.trial_date ?? "");
  const [trialMentor, setTrialMentor] = useState(candidate.trial_mentor ?? "");
  const [trialSaving, setTrialSaving] = useState(false);
  const [trialSaved, setTrialSaved] = useState(false);
  const [trialError, setTrialError] = useState("");

  const [staffNotes, setStaffNotes] = useState(candidate.staff_notes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesError, setNotesError] = useState("");

  async function handleSaveTrialDetails() {
    setTrialSaving(true);
    setTrialError("");
    const result = await updateTrialDetails(
      candidate.id,
      trialDate,
      trialMentor,
    );
    setTrialSaving(false);
    if (result.error) {
      setTrialError(result.error);
    } else {
      setTrialSaved(true);
      onStatusChange(candidate.id, {
        trial_date: trialDate,
        trial_mentor: trialMentor,
      });
      setTimeout(() => setTrialSaved(false), 2000);
    }
  }

  async function handleChecklistToggle(
    field:
      | "rotacloud_login"
      | "sumup_account"
      | "contract_signed"
      | "added_to_whatsapp_group",
    value: boolean,
  ) {
    const result = await updateOnboardingChecklist(candidate.id, {
      [field]: value,
    });
    if (!result.error) onStatusChange(candidate.id, { [field]: value });
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    setNotesError("");
    const result = await updateStaffNotes(candidate.id, staffNotes);
    setNotesSaving(false);
    if (result.error) {
      setNotesError(result.error);
    } else {
      setNotesSaved(true);
      onStatusChange(candidate.id, { staff_notes: staffNotes });
      setTimeout(() => setNotesSaved(false), 2000);
    }
  }

  function handleApprove() {
    setActionError("");
    setActiveAction("approve");
    startTransition(async () => {
      const result = await approveCandidate(candidate);
      if (result.error) setActionError(result.error);
      else onStatusChange(candidate.id, { status: "approved" });
      setActiveAction(null);
    });
  }

  function handleReject(reason: string) {
    setActionError("");
    setActiveAction("reject");
    startTransition(async () => {
      const result = await rejectCandidate(
        {
          id: candidate.id,
          full_name: candidate.full_name,
          phone: candidate.phone,
        },
        reason,
      );
      if (result.error) setActionError(result.error);
      else {
        setShowRejectModal(false);
        onStatusChange(candidate.id, {
          status: "rejected",
          rejection_reason: reason,
        });
      }
      setActiveAction(null);
    });
  }

  function handleTrialOffer() {
    setActionError("");
    setActiveAction("trial_offer");
    startTransition(async () => {
      const now = new Date().toISOString();
      const result = await markTrialOffered(candidate.id);
      if (result.error) setActionError(result.error);
      else
        onStatusChange(candidate.id, {
          status: "trial_offered",
          trial_offered_at: now,
        });
      setActiveAction(null);
    });
  }

  function handleTrialSuccess() {
    setActionError("");
    setActiveAction("trial_success");
    startTransition(async () => {
      const result = await markTrialSuccessful(candidate.id);
      if (result.error) {
        setActionError(result.error);
      } else {
        onStatusChange(candidate.id, {
          status: "onboarding",
          trial_success: true,
        });
        fetch("https://n8n.veltraai.net/webhook/successful_trial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: candidate.full_name,
            phone: candidate.phone,
            candidate_id: candidate.id,
          }),
        });
        fetch("https://n8n.veltraai.net/webhook/send-Docusign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: candidate.full_name,
            phone: candidate.phone,
            email: candidate.email,
            candidate_id: candidate.id,
          }),
        });
      }
      setActiveAction(null);
    });
  }

  function handleCompleteOnboarding() {
    setActionError("");
    setActiveAction("complete_onboarding");
    startTransition(async () => {
      const now = new Date().toISOString();
      const result = await changeStatus(
        candidate.id,
        "onboarding",
        "on-boarded",
      );
      if (result.error) setActionError(result.error as string);
      else
        onStatusChange(candidate.id, {
          status: "on-boarded",
          onboarded_at: now,
          whitelisted: true,
        });
      setActiveAction(null);
    });
  }

  function handleTrialFail() {
    setActionError("");
    setActiveAction("trial_fail");
    startTransition(async () => {
      const result = await markTrialFailed(candidate.id);
      if (result.error) setActionError(result.error);
      else
        onStatusChange(candidate.id, {
          status: "rejected",
          trial_success: false,
        });
      setActiveAction(null);
    });
  }

  const spinnerPink = (
    <div className="w-4 h-4 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className={`${T.cls.backdrop} fixed inset-0`}
        onClick={onClose}
      />

      <div
        className="relative rounded-3xl w-full max-w-2xl my-4 shadow-2xl overflow-hidden"
        style={{
          background: T.bg.modal,
          border: `1px solid ${T.border.default}`,
        }}
      >
        {/* ── Modal Header ── */}
        <div
          className="px-6 py-5 flex items-start justify-between"
          style={{
            background: `linear-gradient(135deg, ${T.brand.primary}, ${T.brand.primaryHover})`,
          }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Candidate Profile
            </p>
            <h2 className="text-xl font-bold text-white">
              {candidate.full_name}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={candidate.status} />
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Applied {formatDate(candidate.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {candidate.status === "rejected" && (
          <div
            className="px-6 py-3 flex items-start gap-3 border-b"
            style={{
              background: T.bg.badge.rejected,
              borderColor: T.border.badge.rejected,
            }}
          >
            <XCircle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: T.text.badge.rejected }}
            />
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: T.text.badge.rejected }}
              >
                Rejection Reason
              </p>
              <p
                className="text-sm mt-0.5"
                style={{ color: T.text.primary }}
              >
                {candidate.rejection_reason ?? (
                  <span
                    className="italic"
                    style={{ color: T.text.muted }}
                  >
                    No reason recorded
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── Modal Body ── */}
        <div className="px-6 py-6 space-y-7 max-h-[70vh] overflow-y-auto">
          {/* Action Buttons */}
          {candidate.status === "pending" && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnSuccess}`}
              >
                {isPending && activeAction === "approve" ? (
                  spinnerPink
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnDanger}`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {showRejectModal && (
            <RejectReasonModal
              onConfirm={handleReject}
              onCancel={() => setShowRejectModal(false)}
              isPending={isPending && activeAction === "reject"}
            />
          )}

          {candidate.status === "approved" && candidate.wa_sent_at && (
            <div className="flex gap-3">
              <button
                onClick={handleTrialOffer}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnPurple}`}
              >
                {isPending && activeAction === "trial_offer" ? (
                  spinnerPink
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Mark as Trial Offered
              </button>
            </div>
          )}

          {candidate.status === "interview booked" && (
            <div className="flex gap-3">
              <button
                onClick={handleTrialOffer}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnPurple}`}
              >
                {isPending && activeAction === "trial_offer" ? (
                  spinnerPink
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Mark as Trial Offered
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnDanger}`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {candidate.status === "trial_offered" && (
            <div className="flex gap-3">
              <button
                onClick={handleTrialSuccess}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnBlue}`}
              >
                {isPending && activeAction === "trial_success" ? (
                  spinnerPink
                ) : (
                  <ThumbsUp className="w-4 h-4" />
                )}
                Trial Successful → Onboarding
              </button>
              <button
                onClick={handleTrialFail}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnDanger}`}
              >
                {isPending && activeAction === "trial_fail" ? (
                  spinnerPink
                ) : (
                  <ThumbsDown className="w-4 h-4" />
                )}
                Trial Failed
              </button>
            </div>
          )}

          {candidate.status === "onboarding" && (
            <div className="flex gap-3">
              <button
                onClick={handleCompleteOnboarding}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnEmerald}`}
              >
                {isPending && activeAction === "complete_onboarding" ? (
                  spinnerPink
                ) : (
                  <Award className="w-4 h-4" />
                )}
                Complete Onboarding
              </button>
              <button
                onClick={handleTrialFail}
                disabled={isPending}
                className={`flex-1 ${T.cls.btnDanger}`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          {candidate.status === "on-boarded" && (
            <div
              className="flex items-center justify-between py-2.5 px-4 rounded-xl border"
              style={{
                background: T.bg.badge.onboarded,
                borderColor: T.border.badge.onboarded,
              }}
            >
              <div className="flex items-center gap-2">
                <Award
                  className="w-4 h-4"
                  style={{ color: T.text.badge.onboarded }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: T.text.badge.onboarded }}
                >
                  Onboarded
                </span>
                {candidate.onboarded_at && (
                  <span
                    className="text-xs ml-1"
                    style={{ color: T.text.muted }}
                  >
                    since {formatDate(candidate.onboarded_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs"
                  style={{ color: T.text.muted }}
                >
                  {candidate.whitelisted ? "Whitelisted" : "Not Whitelisted"}
                </span>
                <button
                  onClick={async () => {
                    const newVal = !candidate.whitelisted;
                    const result = await toggleWhitelist(candidate.id, newVal);
                    if (!result.error)
                      onStatusChange(candidate.id, { whitelisted: newVal });
                  }}
                  className={`relative w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0`}
                  style={{
                    background: candidate.whitelisted
                      ? T.brand.primary
                      : T.border.default,
                  }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${candidate.whitelisted ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>
          )}

          {actionError && (
            <p
              className="text-xs rounded-xl px-3 py-2 border"
              style={{
                color: T.text.badge.rejected,
                background: T.bg.badge.rejected,
                borderColor: T.border.badge.rejected,
              }}
            >
              {actionError}
            </p>
          )}

          {/* Trial Details */}
          {(candidate.status === "trial_offered" ||
            candidate.status === "onboarding" ||
            candidate.status === "on-boarded") && (
            <div className="space-y-3">
              <h4 className={T.cls.sectionHeader}>Trial Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={T.cls.infoLabel}>Trial Date</label>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors focus-within:ring-2"
                    style={{
                      background: T.bg.input,
                      borderColor: T.border.input,
                    }}
                  >
                    <Calendar
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: T.text.muted }}
                    />
                    <input
                      type="date"
                      value={trialDate}
                      onChange={(e) => setTrialDate(e.target.value)}
                      className="flex-1 bg-transparent text-sm focus:outline-none"
                      style={{ color: T.text.primary }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={T.cls.infoLabel}>Trial Mentor</label>
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2 border transition-colors"
                    style={{
                      background: T.bg.input,
                      borderColor: T.border.input,
                    }}
                  >
                    <User
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: T.text.muted }}
                    />
                    <input
                      type="text"
                      value={trialMentor}
                      onChange={(e) => setTrialMentor(e.target.value)}
                      placeholder="e.g. Mentor name"
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                      style={{ color: T.text.primary }}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleSaveTrialDetails}
                disabled={trialSaving}
                className={T.cls.btnPrimary}
              >
                {trialSaving ? (
                  spinnerPink
                ) : trialSaved ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {trialSaved ? "Saved!" : "Save Trial Details"}
              </button>
              {trialError && (
                <p
                  className="text-xs rounded-xl px-3 py-2 border"
                  style={{
                    color: T.text.badge.rejected,
                    background: T.bg.badge.rejected,
                    borderColor: T.border.badge.rejected,
                  }}
                >
                  {trialError}
                </p>
              )}
            </div>
          )}

          {/* Onboarding Checklist */}
          {(candidate.status === "onboarding" ||
            candidate.status === "on-boarded") && (
            <div className="space-y-3">
              <div
                className="flex items-center justify-between border-b pb-2"
                style={{ borderColor: T.border.default }}
              >
                <h4
                  className={T.cls.sectionHeader}
                  style={{ borderBottom: "none" }}
                >
                  Onboarding Checklist
                </h4>
                {candidate.rotacloud_login &&
                candidate.sumup_account &&
                candidate.contract_signed &&
                candidate.added_to_whatsapp_group ? (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: T.text.badge.onboarded }}
                  >
                    🟢 All Complete
                  </span>
                ) : (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: T.text.badge.rejected }}
                  >
                    🔴 Pending
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {(
                  [
                    {
                      field: "rotacloud_login" as const,
                      label: "Rotacloud Login",
                    },
                    { field: "sumup_account" as const, label: "SumUp Account" },
                    {
                      field: "contract_signed" as const,
                      label: "Contract Signed",
                    },
                    {
                      field: "added_to_whatsapp_group" as const,
                      label: "Added to WhatsApp Group",
                    },
                  ] as const
                ).map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() =>
                      handleChecklistToggle(field, !candidate[field])
                    }
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left"
                    style={{
                      background: T.bg.surfaceAlt,
                      borderColor: T.border.default,
                    }}
                  >
                    {candidate[field] ? (
                      <CheckSquare
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: T.text.badge.onboarded }}
                      />
                    ) : (
                      <Square
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: T.text.muted }}
                      />
                    )}
                    <span
                      className="text-sm"
                      style={{
                        color: candidate[field]
                          ? T.text.badge.onboarded
                          : T.text.secondary,
                      }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Staff Notes */}
          <div className="space-y-3">
            <h4 className={`${T.cls.sectionHeader} flex items-center gap-2`}>
              <NotebookPen className="w-3.5 h-3.5" /> Staff Notes
            </h4>
            <textarea
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this candidate…"
              className={T.cls.textarea}
            />
            <button
              onClick={handleSaveNotes}
              disabled={notesSaving}
              className={T.cls.btnPrimary}
            >
              {notesSaving ? (
                spinnerPink
              ) : notesSaved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {notesSaved ? "Saved!" : "Save Notes"}
            </button>
            {notesError && (
              <p
                className="text-xs rounded-xl px-3 py-2 border"
                style={{
                  color: T.text.badge.rejected,
                  background: T.bg.badge.rejected,
                  borderColor: T.border.badge.rejected,
                }}
              >
                {notesError}
              </p>
            )}
          </div>

          {/* Personal Info */}
          <Section title="Personal Information">
            <InfoRow
              label="Email"
              value={candidate.email}
            />
            <InfoRow
              label="Phone"
              value={candidate.phone}
            />
            <InfoRow
              label="Instagram"
              value={candidate.instagram}
            />
            <InfoRow
              label="Gender"
              value={candidate.gender}
            />
          </Section>

          {/* Location */}
          <Section title="Location & Availability">
            <InfoRow
              label="Primary Location"
              value={candidate.primary_location}
            />
            <InfoRow
              label="Second Choice"
              value={candidate.second_location}
            />
            <InfoRow
              label="Manual Location"
              value={candidate.manual_location}
            />
            <InfoRow
              label="Is Student"
              value={candidate.is_student ? "Yes" : "No"}
            />
            {candidate.is_student && (
              <InfoRow
                label="Home City"
                value={candidate.home_city}
              />
            )}
            <InfoRow
              label="Drives"
              value={candidate.does_drive ? "Yes" : "No"}
            />
          </Section>

          {/* Photos */}
          {candidate.photo_urls && candidate.photo_urls.length > 0 && (
            <div className="space-y-3">
              <h4 className={T.cls.sectionHeader}>
                Photos ({candidate.photo_urls.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {candidate.photo_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden block hover:opacity-90 transition-opacity border"
                    style={{
                      background: T.bg.surfaceAlt,
                      borderColor: T.border.default,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {candidate.certificate_url && (
            <div className="space-y-3">
              <h4 className={T.cls.sectionHeader}>Training Certificate</h4>
              {candidate.certificate_url.toLowerCase().includes(".pdf") ? (
                <div
                  className="rounded-xl overflow-hidden border"
                  style={{ borderColor: T.border.brandSoft }}
                >
                  <Link
                    href={candidate.certificate_url.replace(
                      "/image/upload/",
                      "/raw/upload/",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 hover:opacity-90 transition-all group"
                    style={{ background: T.brand.soft }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: T.brand.softBorder }}
                    >
                      <Award
                        className="w-5 h-5"
                        style={{ color: T.brand.primary }}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-xs font-medium"
                        style={{ color: T.text.primary }}
                      >
                        Training Certificate
                      </p>
                      <p
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: T.text.muted }}
                      >
                        Click to open PDF
                      </p>
                    </div>
                    <ExternalLink
                      className="w-4 h-4"
                      style={{ color: T.text.muted }}
                    />
                  </Link>
                </div>
              ) : (
                <Link
                  href={candidate.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border hover:opacity-90 transition-all"
                  style={{ borderColor: T.border.brandSoft }}
                >
                  <div className="relative w-full h-48">
                    <Image
                      src={candidate.certificate_url}
                      alt="Training Certificate"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div
                    className="flex items-center gap-2 p-3"
                    style={{ background: T.brand.soft }}
                  >
                    <ExternalLink
                      className="w-4 h-4"
                      style={{ color: T.text.muted }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: T.text.muted }}
                    >
                      View full image
                    </span>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Identity */}
          <div className="space-y-3">
            <h4 className={T.cls.sectionHeader}>Identity & Right to Work</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow
                label="AI Verification"
                value={
                  candidate.ai_verification === "Passed" ? (
                    <span
                      className="flex items-center gap-1"
                      style={{ color: T.text.badge.approved }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Passed
                    </span>
                  ) : candidate.ai_verification === "Failed" ? (
                    <span
                      className="flex items-center gap-1"
                      style={{ color: T.text.badge.rejected }}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Failed
                    </span>
                  ) : (
                    <span style={{ color: T.text.muted }}>Not checked</span>
                  )
                }
              />
              <InfoRow
                label="UK Passport"
                value={
                  candidate.is_uk_passport === null ? (
                    <span style={{ color: T.text.muted }}>Unknown</span>
                  ) : candidate.is_uk_passport ? (
                    "Yes"
                  ) : (
                    "No"
                  )
                }
              />
              <InfoRow
                label="Non-UK Passport"
                value={candidate.has_non_uk_passport ? "Yes" : "No"}
              />
              <InfoRow
                label="Share Code"
                value={candidate.share_code}
              />
            </div>
            {candidate.passport_url && (
              <a
                href={candidate.passport_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 rounded-xl overflow-hidden border transition-colors"
                style={{
                  background: T.bg.surfaceAlt,
                  borderColor: T.border.default,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidate.passport_url}
                  alt="Passport"
                  className="w-full max-h-48 object-contain p-2"
                />
                <p
                  className="text-center text-xs pb-2"
                  style={{ color: T.text.muted }}
                >
                  Click to open full size
                </p>
              </a>
            )}
          </div>

          {/* Experience */}
          <Section title="Experience & Motivation">
            <InfoRow
              label="Prior Shot-Seller Experience"
              value={candidate.has_prior_experience ? "Yes" : "No"}
            />
            <InfoRow
              label="Previous Company"
              value={candidate.previous_company}
            />
            <InfoRow
              label="Years Experience"
              value={
                candidate.years_experience !== null
                  ? String(candidate.years_experience)
                  : undefined
              }
            />
            <InfoRow
              label="Available From"
              value={
                candidate.available_from
                  ? formatDate(candidate.available_from)
                  : undefined
              }
            />
          </Section>

          {/* Written Answers */}
          <div className="space-y-4">
            <h4 className={T.cls.sectionHeader}>Written Answers</h4>
            {candidate.understand_role && (
              <div>
                <p className={`${T.cls.infoLabel} mb-1`}>
                  Understanding of the role
                </p>
                <p
                  className="text-sm leading-relaxed rounded-xl px-4 py-3 border"
                  style={{
                    color: T.text.secondary,
                    background: T.bg.surfaceAlt,
                    borderColor: T.border.default,
                  }}
                >
                  {candidate.understand_role}
                </p>
              </div>
            )}
            {candidate.why_good_fit && (
              <div>
                <p className={`${T.cls.infoLabel} mb-1`}>Why a good fit</p>
                <p
                  className="text-sm leading-relaxed rounded-xl px-4 py-3 border"
                  style={{
                    color: T.text.secondary,
                    background: T.bg.surfaceAlt,
                    borderColor: T.border.default,
                  }}
                >
                  {candidate.why_good_fit}
                </p>
              </div>
            )}
            {candidate.sales_experience && (
              <div>
                <p className={`${T.cls.infoLabel} mb-1`}>
                  Sales & customer service experience
                </p>
                <p
                  className="text-sm leading-relaxed rounded-xl px-4 py-3 border"
                  style={{
                    color: T.text.secondary,
                    background: T.bg.surfaceAlt,
                    borderColor: T.border.badge.onboarding,
                  }}
                >
                  {candidate.sales_experience}
                </p>
              </div>
            )}
          </div>

          {/* Submitted Forms Info */}
          {(candidate.home_address ||
            candidate.emergency_contact_name ||
            candidate.bank_account_number ||
            candidate.availability_dates ||
            candidate.availability_locations ||
            candidate.availability_comments) && (
            <div className="space-y-4">
              <h4 className={T.cls.sectionHeader}>Submitted Forms Info</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <InfoRow
                  label="Home Address"
                  value={candidate.home_address}
                />
                <InfoRow
                  label="Emergency Contact"
                  value={candidate.emergency_contact_name}
                />
                <InfoRow
                  label="Relationship"
                  value={candidate.emergency_contact_relationship}
                />
                <InfoRow
                  label="Emergency Phone"
                  value={candidate.emergency_contact_phone}
                />
                <InfoRow
                  label="Bank Account Number"
                  value={candidate.bank_account_number}
                />
                <InfoRow
                  label="Sort Code"
                  value={candidate.bank_sort_code}
                />
              </div>
              {candidate.availability_dates &&
              Array.isArray(candidate.availability_dates)
                ? candidate.availability_dates.length > 0 && (
                    <div>
                      <p className={`${T.cls.infoLabel} mb-1`}>
                        Dates Available
                      </p>
                      <p
                        className="text-sm leading-relaxed rounded-xl px-4 py-3 border"
                        style={{
                          color: T.text.secondary,
                          background: T.bg.surfaceAlt,
                          borderColor: T.border.default,
                        }}
                      >
                        {candidate.availability_dates.join(", ")}
                      </p>
                    </div>
                  )
                : candidate.availability_dates &&
                  JSON.parse(candidate.availability_dates as unknown as string)
                    .length > 0 && (
                    <div>
                      <p className={`${T.cls.infoLabel} mb-1`}>
                        Dates Available
                      </p>
                      <p
                        className="text-sm leading-relaxed rounded-xl px-4 py-3 border"
                        style={{
                          color: T.text.secondary,
                          background: T.bg.surfaceAlt,
                          borderColor: T.border.default,
                        }}
                      >
                        {JSON.parse(
                          candidate.availability_dates as unknown as string,
                        ).join(", ")}
                      </p>
                    </div>
                  )}
              {(!candidate.availability_dates ||
                (Array.isArray(candidate.availability_dates)
                  ? candidate.availability_dates.length === 0
                  : JSON.parse(
                      candidate.availability_dates as unknown as string,
                    ).length === 0)) &&
                candidate.unavailable_reason && (
                  <div>
                    <p className={`${T.cls.infoLabel} mb-1`}>
                      This candidate is unavailable because:
                    </p>
                    <p
                      className="text-sm leading-relaxed rounded-xl px-4 py-3 border"
                      style={{
                        color: T.text.secondary,
                        background: T.bg.surfaceAlt,
                        borderColor: T.border.default,
                      }}
                    >
                      {candidate.unavailable_reason}
                    </p>
                  </div>
                )}
              {candidate.availability_locations && (
                <div>
                  <p className={`${T.cls.infoLabel} mb-1`}>
                    Locations Available
                  </p>
                  <p
                    className="text-sm leading-relaxed rounded-xl px-4 py-3 border"
                    style={{
                      color: T.text.secondary,
                      background: T.bg.surfaceAlt,
                      borderColor: T.border.default,
                    }}
                  >
                    {(Array.isArray(candidate.availability_locations)
                      ? candidate.availability_locations
                      : JSON.parse(
                          candidate.availability_locations as unknown as string,
                        )
                    ).join(", ")}
                  </p>
                </div>
              )}
              {candidate.availability_comments && (
                <div>
                  <p className={`${T.cls.infoLabel} mb-1`}>Comments</p>
                  <p
                    className="text-sm leading-relaxed rounded-xl px-4 py-3 border"
                    style={{
                      color: T.text.secondary,
                      background: T.bg.surfaceAlt,
                      borderColor: T.border.default,
                    }}
                  >
                    {candidate.availability_comments}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Declarations */}
          <Section title="Declarations">
            <InfoRow
              label="Accepts self-employed terms"
              value={candidate.self_employed ? "Yes ✓" : "No"}
            />
            <InfoRow
              label="Accepts weekend/night work"
              value={candidate.weekend_work ? "Yes ✓" : "No"}
            />
            <InfoRow
              label="How they heard about us"
              value={candidate.heard_about}
            />
            <InfoRow
              label="WhatsApp Invite Sent"
              value={
                candidate.wa_sent_at ? (
                  formatDate(candidate.wa_sent_at)
                ) : (
                  <span style={{ color: T.text.muted }}>Not sent</span>
                )
              }
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

function RowActions({
  candidate,
  onStatusChange,
}: {
  candidate: Candidate;
  onStatusChange: (id: string, patch: Partial<Candidate>) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [showRejectModal, setShowRejectModal] = useState(false);

  if (candidate.status !== "pending") return null;

  function handleApprove(e: React.MouseEvent) {
    e.stopPropagation();
    setActiveAction("approve");
    startTransition(async () => {
      const result = await approveCandidate(candidate);
      if (!result.error) onStatusChange(candidate.id, { status: "approved" });
      setActiveAction(null);
    });
  }

  function handleRejectConfirm(reason: string) {
    setActiveAction("reject");
    startTransition(async () => {
      const result = await rejectCandidate(
        {
          id: candidate.id,
          full_name: candidate.full_name,
          phone: candidate.phone,
        },
        reason,
      );
      if (!result.error) {
        setShowRejectModal(false);
        onStatusChange(candidate.id, {
          status: "rejected",
          rejection_reason: reason,
        });
      }
      setActiveAction(null);
    });
  }

  return (
    <>
      {showRejectModal && (
        <RejectReasonModal
          onConfirm={handleRejectConfirm}
          onCancel={() => setShowRejectModal(false)}
          isPending={isPending && activeAction === "reject"}
        />
      )}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleApprove}
          disabled={isPending}
          title="Approve"
          className="p-1.5 rounded-lg border transition-colors disabled:opacity-50"
          style={{
            background: T.bg.badge.approved,
            borderColor: T.border.badge.approved,
            color: T.text.badge.approved,
          }}
        >
          {isPending && activeAction === "approve" ? (
            <div className="w-3.5 h-3.5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowRejectModal(true);
          }}
          disabled={isPending}
          title="Reject"
          className="p-1.5 rounded-lg border transition-colors disabled:opacity-50"
          style={{
            background: T.bg.badge.rejected,
            borderColor: T.border.badge.rejected,
            color: T.text.badge.rejected,
          }}
        >
          {isPending && activeAction === "reject" ? (
            <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </>
  );
}

// ─── Inline Status Dropdown ───────────────────────────────────────────────────

function InlineStatusDropdown({
  candidate,
  onSelect,
}: {
  candidate: Candidate;
  onSelect: (newStatus: Candidate["status"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropRect, setDropRect] = useState<DOMRect | null>(null);

  const transitions = STATUS_TRANSITIONS[candidate.status] ?? [];
  if (transitions.length === 0)
    return <StatusBadge status={candidate.status} />;

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (buttonRef.current)
      setDropRect(buttonRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  }

  function handleSelect(e: React.MouseEvent, s: Candidate["status"]) {
    e.stopPropagation();
    setOpen(false);
    onSelect(s);
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="flex items-center gap-1 group"
        title="Click to change status"
      >
        <StatusBadge status={candidate.status} />
        <ChevronDown
          className="w-3 h-3 transition-colors"
          style={{ color: T.text.muted }}
        />
      </button>

      {open &&
        dropRect &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />
            <div
              style={{
                position: "fixed",
                top: dropRect.top - 4,
                left: dropRect.left,
                zIndex: 9999,
                transform: "translateY(-100%)",
                background: T.bg.modal,
                borderColor: T.border.default,
              }}
            >
              {transitions.map((s) => (
                <button
                  key={s}
                  onClick={(e) => handleSelect(e, s)}
                  className="w-full text-left px-3 py-2 transition-colors flex items-center gap-2 hover:bg-gray-50"
                >
                  <StatusBadge status={s} />
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type SortKey = "created_at" | "full_name" | "status";

export function CandidatesDashboard({
  initialCandidates,
}: {
  initialCandidates: Candidate[];
}) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    | "all"
    | Candidate["status"]
    | "invite_sent"
    | "trial_offered_filter"
    | "onboarding"
    | "onboarded_filter"
  >("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [pendingReject, setPendingReject] = useState<Candidate | null>(null);
  const [rejectPending, setRejectPending] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("milli_candidates_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "milli_candidates" },
        (payload) => {
          // New candidate submitted — prepend to the list
          const newCandidate = payload.new as Candidate;
          setCandidates((prev) => {
            // Guard: don't add if somehow already present
            if (prev.some((c) => c.id === newCandidate.id)) return prev;
            return [newCandidate, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "milli_candidates" },
        (payload) => {
          // Row updated externally — patch in place
          const updated = payload.new as Candidate;
          setCandidates((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
          );
          // Also patch the open modal if it's showing this candidate
          setSelected((prev) =>
            prev?.id === updated.id ? { ...prev, ...updated } : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  function handleStatusChange(id: string, patch: Partial<Candidate>) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
    if (selected?.id === id)
      setSelected((prev) => (prev ? { ...prev, ...patch } : null));
  }

  async function handleStatusDirect(
    candidate: Candidate,
    newStatus: Candidate["status"],
  ) {
    if (newStatus === "rejected") {
      setPendingReject(candidate);
      return;
    }
    const confirmed = window.confirm(
      `Change "${candidate.full_name}" status from "${STATUS_LABEL[candidate.status]}" to "${STATUS_LABEL[newStatus]}"?\n\nSave changes?`,
    );
    if (!confirmed) return;
    const result = await changeStatus(
      candidate.id,
      candidate.status,
      newStatus,
    );
    if (result.error) {
      window.alert(`Failed to update: ${result.error}`);
      return;
    }
    handleStatusChange(candidate.id, result.patch as Partial<Candidate>);

    if (newStatus === "approved") {
      fetch("https://n8n.veltraai.net/webhook/candidate-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: candidate.full_name,
          phone: candidate.phone,
          email: candidate.email,
          candidate_id: candidate.id,
        }),
      });
    }
    if (newStatus === "onboarding") {
      fetch("https://n8n.veltraai.net/webhook/successful_trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: candidate.full_name,
          phone: candidate.phone,
          candidate_id: candidate.id,
        }),
      });
      fetch("https://n8n.veltraai.net/webhook/send-Docusign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: candidate.full_name,
          phone: candidate.phone,
          email: candidate.email,
          candidate_id: candidate.id,
        }),
      });
    }
  }

  async function handlePendingRejectConfirm(reason: string) {
    if (!pendingReject) return;
    setRejectPending(true);
    const result = await rejectCandidate(
      {
        id: pendingReject.id,
        full_name: pendingReject.full_name,
        phone: pendingReject.phone,
      },
      reason,
    );
    setRejectPending(false);
    if (result.error) {
      window.alert(`Failed to reject: ${result.error}`);
      return;
    }
    handleStatusChange(pendingReject.id, {
      status: "rejected",
      rejection_reason: reason,
    });
    setPendingReject(null);
  }

  async function handleDelete(candidate: Candidate) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${candidate.full_name}"? This cannot be undone.`,
    );
    if (!confirmed) return;
    const result = await deleteCandidate(candidate.id);
    if (result.error) {
      window.alert(`Failed to delete: ${result.error}`);
      return;
    }
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    if (selected?.id === candidate.id) setSelected(null);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const filtered = candidates
    .filter((c) => {
      const q = search.toLowerCase();
      if (statusFilter === "invite_sent") {
        if (c.status !== "approved") return false;
      } else if (statusFilter === "trial_offered_filter") {
        if (c.status !== "trial_offered") return false;
      } else if (statusFilter === "onboarded_filter") {
        if (c.status !== "on-boarded") return false;
      } else if (statusFilter !== "all" && c.status !== statusFilter)
        return false;
      if (!q) return true;
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.primary_location.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      );
    })
    .sort((a, b) => {
      let av = "",
        bv = "";
      if (sortKey === "created_at") {
        av = a.created_at;
        bv = b.created_at;
      }
      if (sortKey === "full_name") {
        av = a.full_name;
        bv = b.full_name;
      }
      if (sortKey === "status") {
        av = a.status;
        bv = b.status;
      }
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const counts = {
    total: candidates.length,
    pending: candidates.filter((c) => c.status === "pending").length,
    inviteSent: candidates.filter((c) => c.status === "approved").length,
    trialOffered: candidates.filter((c) => c.status === "trial_offered").length,
    onboarding: candidates.filter((c) => c.status === "onboarding").length,
    onboarded: candidates.filter((c) => c.status === "on-boarded").length,
    rejected: candidates.filter((c) => c.status === "rejected").length,
    interviewBooked: candidates.filter((c) => c.status === "interview booked")
      .length,
  };

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k)
      return (
        <ChevronDown
          className="w-3 h-3"
          style={{ color: T.text.muted }}
        />
      );
    return sortAsc ? (
      <ChevronUp
        className="w-3 h-3"
        style={{ color: T.brand.primary }}
      />
    ) : (
      <ChevronDown
        className="w-3 h-3"
        style={{ color: T.brand.primary }}
      />
    );
  }

  return (
    <div className={T.cls.page}>
      {pendingReject && (
        <RejectReasonModal
          onConfirm={handlePendingRejectConfirm}
          onCancel={() => setPendingReject(null)}
          isPending={rejectPending}
        />
      )}

      {/* ── Header ── */}
      <header className={T.cls.header}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border"
              style={{ borderColor: T.border.brandSoft }}
            >
              <Image
                src="/logo.jpeg"
                alt="Effervescent Agency"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p
                className="text-sm font-bold tracking-tight leading-none"
                style={{ color: T.brand.primary }}
              >
                Effervescent Agency
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: T.text.muted }}
              >
                Candidates Dashboard
              </p>
            </div>
          </div>
          <div className="fixed top-4 right-6 z-50 flex items-center gap-3">
            <Link
              href="/"
              className={T.cls.btnPrimary + " px-4 py-1.5 text-sm"}
            >
              Application Form
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Search & Filters ── */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, location…"
            className={T.cls.input}
          />
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "All", count: counts.total },
                { value: "pending", label: "Pending", count: counts.pending },
                {
                  value: "invite_sent",
                  label: "Invite Sent",
                  count: counts.inviteSent,
                },
                {
                  value: "interview booked",
                  label: "Interview Booked",
                  count: counts.interviewBooked,
                },
                {
                  value: "trial_offered_filter",
                  label: "Trial Offered",
                  count: counts.trialOffered,
                },
                {
                  value: "onboarding",
                  label: "Onboarding",
                  count: counts.onboarding,
                },
                {
                  value: "onboarded_filter",
                  label: "Onboarded",
                  count: counts.onboarded,
                },
                {
                  value: "rejected",
                  label: "Rejected",
                  count: counts.rejected,
                },
              ] as const
            ).map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={
                  statusFilter === value
                    ? T.cls.filterActive
                    : T.cls.filterInactive
                }
              >
                {label}
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={
                    statusFilter === value
                      ? {
                          background: "rgba(255,255,255,0.25)",
                          color: T.brand.primaryText,
                        }
                      : { background: T.bg.surfaceAlt, color: T.text.secondary }
                  }
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className={T.cls.tableWrap}>
          {filtered.length === 0 ? (
            <div
              className="py-16 text-center"
              style={{ color: T.text.muted }}
            >
              <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No candidates found</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={T.cls.thead}>
                      {[
                        { label: "Name", key: "full_name" as SortKey },
                        { label: "Contact", key: null },
                        { label: "Location", key: null },
                        { label: "Gender", key: null },
                        { label: "Status", key: "status" as SortKey },
                        { label: "Trial Date", key: null },
                        { label: "Trial Mentor", key: null },
                        { label: "Onboarding", key: null },
                        { label: "Applied", key: "created_at" as SortKey },
                        { label: "", key: null },
                      ].map(({ label, key }) => (
                        <th
                          key={label}
                          onClick={key ? () => toggleSort(key) : undefined}
                          className={`${T.cls.th} ${key ? "cursor-pointer select-none" : ""}`}
                        >
                          <span className="flex items-center gap-1">
                            {label}
                            {key && <SortIcon k={key} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={T.cls.divider}>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className={T.cls.tr}
                      >
                        <td className={T.cls.td}>
                          <p
                            className="font-semibold"
                            style={{ color: T.text.primary }}
                          >
                            {c.full_name}
                          </p>
                          {c.instagram && (
                            <p
                              className="text-xs"
                              style={{ color: T.text.muted }}
                            >
                              {c.instagram}
                            </p>
                          )}
                        </td>
                        <td className={T.cls.td}>
                          <p
                            className="flex items-center gap-1.5"
                            style={{ color: T.text.secondary }}
                          >
                            <Mail
                              className="w-3 h-3 flex-shrink-0"
                              style={{ color: T.text.muted }}
                            />
                            {c.email}
                          </p>
                          <p
                            className="text-xs flex items-center gap-1.5 mt-0.5"
                            style={{ color: T.text.muted }}
                          >
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {c.phone}
                          </p>
                        </td>
                        <td className={T.cls.td}>
                          <p
                            className="flex items-center gap-1.5"
                            style={{ color: T.text.secondary }}
                          >
                            <MapPin
                              className="w-3 h-3 flex-shrink-0"
                              style={{ color: T.text.muted }}
                            />
                            {c.primary_location}
                          </p>
                          <div
                            className="flex items-center gap-2 mt-0.5"
                            style={{ color: T.text.muted }}
                          >
                            {c.does_drive && (
                              <span className="flex items-center gap-0.5 text-xs">
                                <Car className="w-3 h-3" /> Drives
                              </span>
                            )}
                            {c.is_student && (
                              <span className="flex items-center gap-0.5 text-xs">
                                <GraduationCap className="w-3 h-3" /> Student
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className={`${T.cls.td} whitespace-nowrap`}
                          style={{ color: T.text.secondary }}
                        >
                          {c.gender ?? "—"}
                        </td>
                        <td
                          className={T.cls.td}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <InlineStatusDropdown
                            candidate={c}
                            onSelect={(s) => handleStatusDirect(c, s)}
                          />
                          {c.status === "rejected" && c.rejection_reason && (
                            <p
                              className="text-[10px] italic mt-1 max-w-[160px] truncate"
                              style={{ color: T.text.badge.rejected }}
                              title={c.rejection_reason}
                            >
                              {c.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className={`${T.cls.td} whitespace-nowrap`}>
                          {c.trial_date ? (
                            <span
                              className="flex items-center gap-1.5 text-xs"
                              style={{ color: T.text.secondary }}
                            >
                              <Calendar
                                className="w-3 h-3 flex-shrink-0"
                                style={{ color: T.text.muted }}
                              />
                              {formatDate(c.trial_date)}
                            </span>
                          ) : (
                            <span style={{ color: T.text.muted }}>—</span>
                          )}
                        </td>
                        <td className={`${T.cls.td} whitespace-nowrap`}>
                          {c.trial_mentor ? (
                            <span
                              className="flex items-center gap-1.5 text-xs"
                              style={{ color: T.text.secondary }}
                            >
                              <User
                                className="w-3 h-3 flex-shrink-0"
                                style={{ color: T.text.muted }}
                              />
                              {c.trial_mentor}
                            </span>
                          ) : (
                            <span style={{ color: T.text.muted }}>—</span>
                          )}
                        </td>
                        <td className={`${T.cls.td} whitespace-nowrap text-xs`}>
                          {c.status === "onboarding" ||
                          c.status === "on-boarded" ? (
                            c.rotacloud_login &&
                            c.sumup_account &&
                            c.contract_signed &&
                            c.added_to_whatsapp_group ? (
                              <span title="All complete">🟢</span>
                            ) : (
                              <span title="Pending">🔴</span>
                            )
                          ) : (
                            <span style={{ color: T.text.muted }}>—</span>
                          )}
                        </td>
                        <td
                          className={`${T.cls.td} whitespace-nowrap text-xs`}
                          style={{ color: T.text.muted }}
                        >
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(c.created_at)}
                        </td>
                        <td className={T.cls.td}>
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <RowActions
                              candidate={c}
                              onStatusChange={handleStatusChange}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(c);
                              }}
                              className="p-1.5 rounded-lg border transition-colors"
                              style={{
                                background: T.bg.surfaceAlt,
                                borderColor: T.border.default,
                                color: T.text.muted,
                              }}
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(c);
                              }}
                              className="p-1.5 rounded-lg border transition-colors"
                              style={{
                                background: T.bg.badge.rejected,
                                borderColor: T.border.badge.rejected,
                                color: T.text.badge.rejected,
                              }}
                              title="Delete candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div
                className="sm:hidden divide-y"
                style={{ borderColor: T.border.table }}
              >
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: T.text.primary }}
                        >
                          {c.full_name}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: T.text.muted }}
                        >
                          {c.email}
                        </p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <InlineStatusDropdown
                          candidate={c}
                          onSelect={(s) => handleStatusDirect(c, s)}
                        />
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-3 text-xs"
                      style={{ color: T.text.muted }}
                    >
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {c.primary_location}
                      </span>
                      {c.gender && <span>{c.gender}</span>}
                    </div>
                    {c.status === "rejected" && c.rejection_reason && (
                      <p
                        className="text-[10px] italic mt-1"
                        style={{ color: T.text.badge.rejected }}
                      >
                        {c.rejection_reason}
                      </p>
                    )}
                    <div
                      className="flex items-center gap-2 mt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <RowActions
                        candidate={c}
                        onStatusChange={handleStatusChange}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(c);
                        }}
                        className="ml-auto flex items-center gap-1 text-xs transition-colors"
                        style={{ color: T.text.muted }}
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c);
                        }}
                        className="p-1.5 rounded-lg border transition-colors"
                        style={{
                          background: T.bg.badge.rejected,
                          borderColor: T.border.badge.rejected,
                          color: T.text.badge.rejected,
                        }}
                        title="Delete candidate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p
          className="text-center text-xs pb-2"
          style={{ color: T.text.muted }}
        >
          Showing {filtered.length} of {candidates.length} candidates
        </p>
      </div>

      {selected && (
        <CandidateModal
          candidate={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
