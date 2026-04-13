"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
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
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  ThumbsUp,
  ThumbsDown,
  Award,
  Building2,
  User,
  Save,
  NotebookPen,
  CheckSquare,
  Square,
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
} from "./actions";

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
  "rejected - non responsive": "Rejected - Non Responsive",
  rejected: "Rejected",
  trial_offered: "Trial Offered",
  onboarding: "Onboarding",
  "on-boarded": "Onboarded",
};

const STATUS_TRANSITIONS: Record<Candidate["status"], Candidate["status"][]> = {
  pending: ["approved", "rejected"],
  approved: ["interview booked", "rejected"],
  "rejected - non responsive": ["pending"],
  "interview booked": ["trial_offered", "rejected"],
  trial_offered: ["onboarding", "rejected"],
  onboarding: ["on-boarded", "rejected"],
  "on-boarded": [],
  rejected: ["pending"],
};

function StatusBadge({ status }: { status: Candidate["status"] }) {
  const map: Record<Candidate["status"], string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    approved: "bg-green-500/15 text-green-400 border-green-500/25",
    "interview booked": "bg-sky-500/15 text-sky-400 border-sky-500/25",
    "rejected - non responsive":
      "bg-orange-500/15 text-orange-400 border-orange-500/25",
    rejected: "bg-red-500/15 text-red-400 border-red-500/25",
    trial_offered: "bg-purple-500/15 text-purple-400 border-purple-500/25",
    onboarding: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    "on-boarded": "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== false && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-[#FDB8D7] uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

// ─── Reject Reason Modal ───────────────────────────────────────────────────────

const REJECT_REASONS = [
  "Unsuitable for role",
  "No right-to-work",
  "Non-responsive",
  "Unsuccessful trial shift",
  "Unsuccessful interview",
  "Non-attendance to interview",
  "Non-attendance to trial shift",
  "Underage (Below 18)",
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-white font-semibold text-base mb-1">
          Reason for rejection
        </h3>
        <p className="text-gray-500 text-xs mb-4">Select a reason</p>
        <div className="space-y-2 mb-5">
          {REJECT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelected(reason)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border transition-all ${
                selected === reason
                  ? "bg-red-500/20 border-red-500/50 text-red-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm font-medium border border-white/10 text-gray-400 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold
              bg-red-500/20 text-red-400 border border-red-500/30
              hover:bg-red-500/30 hover:border-red-500/50
              disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
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

// ─── Candidate Detail Modal ────────────────────────────────────────────────────

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

  const [trialVenue, setTrialVenue] = useState(candidate.trial_venue ?? "");
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
      trialVenue,
      trialMentor,
    );
    setTrialSaving(false);
    if (result.error) {
      setTrialError(result.error);
    } else {
      setTrialSaved(true);
      onStatusChange(candidate.id, {
        trial_venue: trialVenue,
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
    if (!result.error) {
      onStatusChange(candidate.id, { [field]: value });
    }
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
      if (result.error) {
        setActionError(result.error);
      } else {
        onStatusChange(candidate.id, { status: "approved" });
      }
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
      if (result.error) {
        setActionError(result.error);
      } else {
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
      if (result.error) {
        setActionError(result.error);
      } else {
        onStatusChange(candidate.id, {
          status: "trial_offered",
          trial_offered_at: now,
        });
      }
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
      if (result.error) {
        setActionError(result.error as string);
      } else {
        onStatusChange(candidate.id, {
          status: "on-boarded",
          onboarded_at: now,
        });
      }
      setActiveAction(null);
    });
  }

  function handleTrialFail() {
    setActionError("");
    setActiveAction("trial_fail");
    startTransition(async () => {
      const result = await markTrialFailed(candidate.id);
      if (result.error) {
        setActionError(result.error);
      } else {
        onStatusChange(candidate.id, {
          status: "rejected",
          trial_success: false,
        });
      }
      setActiveAction(null);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-[#111111] border border-[#1f1f1f] rounded-3xl w-full max-w-2xl my-4 shadow-2xl">
        {/* Header */}
        <div className="rounded-t-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#b05c82] to-[#c8709a] px-6 py-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">
                Candidate Profile
              </p>
              <h2 className="text-xl font-bold text-white">
                {candidate.full_name}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={candidate.status} />
                <span className="text-xs text-white/50">
                  Applied {formatDate(candidate.created_at)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-1 mt-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {candidate.status === "rejected" && (
            <div className="bg-[#1a0a0a] border-b border-red-900/40 px-6 py-3 flex items-start gap-3">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
                  Rejection Reason
                </p>
                <p className="text-sm text-red-200 mt-0.5">
                  {candidate.rejection_reason ?? (
                    <span className="text-red-400/50 italic">
                      No reason recorded
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-7 max-h-[70vh] overflow-y-auto">
          {/* Action Buttons */}
          {candidate.status === "pending" && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                  bg-green-500/15 text-green-400 border border-green-500/25
                  hover:bg-green-500/25 hover:border-green-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && activeAction === "approve" ? (
                  <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                  bg-red-500/15 text-red-400 border border-red-500/25
                  hover:bg-red-500/25 hover:border-red-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <XCircle className="w-4 h-4" />
                Reject
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
                  bg-purple-500/15 text-purple-400 border border-purple-500/25
                  hover:bg-purple-500/25 hover:border-purple-500/40
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && activeAction === "trial_offer" ? (
                  <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
        bg-purple-500/15 text-purple-400 border border-purple-500/25
        hover:bg-purple-500/25 hover:border-purple-500/40
        disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && activeAction === "trial_offer" ? (
                  <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Mark as Trial Offered
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
        bg-red-500/15 text-red-400 border border-red-500/25
        hover:bg-red-500/25 hover:border-red-500/40
        disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}

          {candidate.status === "trial_offered" && (
            <div className="flex gap-3">
              <button
                onClick={handleTrialSuccess}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
        bg-blue-500/15 text-blue-400 border border-blue-500/25
        hover:bg-blue-500/25 hover:border-blue-500/40
        disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && activeAction === "trial_success" ? (
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                ) : (
                  <ThumbsUp className="w-4 h-4" />
                )}
                Trial Successful → Onboarding
              </button>
              <button
                onClick={handleTrialFail}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
        bg-red-500/15 text-red-400 border border-red-500/25
        hover:bg-red-500/25 hover:border-red-500/40
        disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && activeAction === "trial_fail" ? (
                  <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
        bg-emerald-500/15 text-emerald-400 border border-emerald-500/25
        hover:bg-emerald-500/25 hover:border-emerald-500/40
        disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && activeAction === "complete_onboarding" ? (
                  <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                ) : (
                  <Award className="w-4 h-4" />
                )}
                Complete Onboarding
              </button>
              <button
                onClick={handleTrialFail}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
        bg-red-500/15 text-red-400 border border-red-500/25
        hover:bg-red-500/25 hover:border-red-500/40
        disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}

          {candidate.status === "on-boarded" && (
            <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">
                Onboarded
              </span>
              {candidate.onboarded_at && (
                <span className="text-xs text-emerald-600 ml-1">
                  since {formatDate(candidate.onboarded_at)}
                </span>
              )}
            </div>
          )}

          {actionError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {actionError}
            </p>
          )}

          {/* Trial Details */}
          {(candidate.status === "trial_offered" ||
            candidate.status === "onboarding" ||
            candidate.status === "on-boarded") && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#FDB8D7] uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
                Trial Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Trial Venue
                  </label>
                  <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 focus-within:border-[#FDB8D7]/50 transition-colors">
                    <Building2 className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <input
                      type="text"
                      value={trialVenue}
                      onChange={(e) => setTrialVenue(e.target.value)}
                      placeholder="e.g. Venue name"
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Trial Mentor
                  </label>
                  <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 focus-within:border-[#FDB8D7]/50 transition-colors">
                    <User className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                    <input
                      type="text"
                      value={trialMentor}
                      onChange={(e) => setTrialMentor(e.target.value)}
                      placeholder="e.g. Mentor name"
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleSaveTrialDetails}
                disabled={trialSaving}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  bg-[#FDB8D7]/10 text-[#FDB8D7] border border-[#FDB8D7]/25
                  hover:bg-[#FDB8D7]/20 hover:border-[#FDB8D7]/40
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {trialSaving ? (
                  <div className="w-4 h-4 border-2 border-[#FDB8D7]/30 border-t-[#FDB8D7] rounded-full animate-spin" />
                ) : trialSaved ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {trialSaved ? "Saved!" : "Save Trial Details"}
              </button>
              {trialError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {trialError}
                </p>
              )}
            </div>
          )}

          {/* Onboarding Checklist */}
          {(candidate.status === "onboarding" ||
            candidate.status === "on-boarded") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-2">
                <h4 className="text-xs font-bold text-[#FDB8D7] uppercase tracking-widest">
                  Onboarding Checklist
                </h4>
                {candidate.rotacloud_login &&
                candidate.sumup_account &&
                candidate.contract_signed &&
                candidate.added_to_whatsapp_group ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    🟢 All Complete
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
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
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#FDB8D7]/30 transition-colors text-left"
                  >
                    {candidate[field] ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${candidate[field] ? "text-emerald-400" : "text-gray-400"}`}
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
            <h4 className="text-xs font-bold text-[#FDB8D7] uppercase tracking-widest border-b border-[#1f1f1f] pb-2 flex items-center gap-2">
              <NotebookPen className="w-3.5 h-3.5" />
              Staff Notes
            </h4>
            <textarea
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this candidate…"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FDB8D7]/50 resize-none transition-colors"
            />
            <button
              onClick={handleSaveNotes}
              disabled={notesSaving}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                bg-[#FDB8D7]/10 text-[#FDB8D7] border border-[#FDB8D7]/25
                hover:bg-[#FDB8D7]/20 hover:border-[#FDB8D7]/40
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {notesSaving ? (
                <div className="w-4 h-4 border-2 border-[#FDB8D7]/30 border-t-[#FDB8D7] rounded-full animate-spin" />
              ) : notesSaved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {notesSaved ? "Saved!" : "Save Notes"}
            </button>
            {notesError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
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
              <h4 className="text-xs font-bold text-[#FDB8D7] uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
                Photos ({candidate.photo_urls.length})
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {candidate.photo_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] block hover:opacity-90 transition-opacity"
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

          {/* Passport / ID */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#FDB8D7] uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
              Identity & Right to Work
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow
                label="AI Verification"
                value={
                  candidate.ai_verification === "Passed" ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <ShieldCheck className="w-3.5 h-3.5" /> Passed
                    </span>
                  ) : candidate.ai_verification === "Failed" ? (
                    <span className="flex items-center gap-1 text-red-400">
                      <ShieldAlert className="w-3.5 h-3.5" /> Failed
                    </span>
                  ) : (
                    <span className="text-gray-500">Not checked</span>
                  )
                }
              />
              <InfoRow
                label="UK Passport"
                value={
                  candidate.is_uk_passport === null ? (
                    <span className="text-gray-500">Unknown</span>
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
                className="block mt-2 rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] hover:border-pink-500/40 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidate.passport_url}
                  alt="Passport"
                  className="w-full max-h-48 object-contain p-2"
                />
                <p className="text-center text-xs text-gray-500 pb-2">
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

          {/* Long-form answers */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#FDB8D7] uppercase tracking-widest border-b border-[#1f1f1f] pb-2">
              Written Answers
            </h4>
            {candidate.understand_role && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Understanding of the role
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#141414] rounded-xl px-4 py-3 border border-[#1f1f1f]">
                  {candidate.understand_role}
                </p>
              </div>
            )}
            {candidate.why_good_fit && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Why a good fit
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#141414] rounded-xl px-4 py-3 border border-[#1f1f1f]">
                  {candidate.why_good_fit}
                </p>
              </div>
            )}
            {candidate.sales_experience && (
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Sales & customer service experience
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#141414] rounded-xl px-4 py-3 border border-[#1f1f1f]">
                  {candidate.sales_experience}
                </p>
              </div>
            )}
          </div>

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
                  <span className="text-gray-600">Not sent</span>
                )
              }
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Row Actions (inline Approve/Reject in table) ─────────────────────────────

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
          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending && activeAction === "approve" ? (
            <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
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
          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending && activeAction === "reject" ? (
            <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </>
  );
}

// ─── Portal Status Dropdown ───────────────────────────────────────────────────

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

  const transitions = STATUS_TRANSITIONS[candidate.status];
  if (transitions.length === 0)
    return <StatusBadge status={candidate.status} />;

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (buttonRef.current) {
      setDropRect(buttonRef.current.getBoundingClientRect());
    }
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
        <ChevronDown className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors" />
      </button>

      {open &&
        dropRect &&
        createPortal(
          <>
            {/* Invisible backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />
            {/* Dropdown anchored above the button via fixed positioning */}
            <div
              style={{
                position: "fixed",
                top: dropRect.top - 4,
                left: dropRect.left,
                zIndex: 9999,
                transform: "translateY(-100%)",
              }}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl py-1 min-w-[160px]"
            >
              {transitions.map((s) => (
                <button
                  key={s}
                  onClick={(e) => handleSelect(e, s)}
                  className="w-full text-left px-3 py-2 hover:bg-[#252525] transition-colors flex items-center gap-2"
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

  function handleStatusChange(id: string, patch: Partial<Candidate>) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, ...patch } : null));
    }
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
        if (!c.wa_sent_at || c.status === "rejected") return false;
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
      let av: string = "";
      let bv: string = "";
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
    inviteSent: candidates.filter((c) => c.wa_sent_at !== null).length,
    approved: candidates.filter((c) => c.status === "approved").length,
    trialOffered: candidates.filter((c) => c.status === "trial_offered").length,
    onboarding: candidates.filter((c) => c.status === "onboarding").length,
    onboarded: candidates.filter((c) => c.status === "on-boarded").length,
    rejected: candidates.filter((c) => c.status === "rejected").length,
    interviewBooked: candidates.filter((c) => c.status === "interview booked")
      .length,
  };

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown className="w-3 h-3 text-gray-600" />;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 text-[#FDB8D7]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#FDB8D7]" />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {pendingReject && (
        <RejectReasonModal
          onConfirm={handlePendingRejectConfirm}
          onCancel={() => setPendingReject(null)}
          isPending={rejectPending}
        />
      )}
      {/* Header */}
      <header className="bg-[#0d0d0d]/95 backdrop-blur-sm border-b border-[#1a1a1a] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                style={{ boxShadow: "0 0 0 1px #FDB8D730" }}
              >
                <Image
                  src="/logo1.jpeg"
                  alt="Effervescent Agency"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p
                  className="text-sm font-bold tracking-tight leading-none"
                  style={{ color: "#FDB8D7" }}
                >
                  Effervescent Agency
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Candidates Dashboard
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/apply"
              className="text-xs text-gray-500 hover:text-[#FDB8D7] transition-colors"
            >
              → Apply Form
            </a>
            <a
              href="/whitelist"
              className="text-xs text-gray-500 hover:text-[#FDB8D7] transition-colors"
            >
              → Whitelist
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total card uses brand color */}
          <div
            className="rounded-2xl border p-4 flex items-center gap-3"
            style={{ borderColor: "#FDB8D720", backgroundColor: "#FDB8D708" }}
          >
            <Briefcase
              className="w-5 h-5 flex-shrink-0"
              style={{ color: "#FDB8D7" }}
            />
            <div>
              <p
                className="text-2xl font-bold leading-none"
                style={{ color: "#FDB8D7" }}
              >
                {counts.total}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total</p>
            </div>
          </div>
          {[
            {
              label: "Pending",
              value: counts.pending,
              icon: Clock,
              color: "text-yellow-400",
              bg: "bg-yellow-500/10 border-yellow-500/20",
            },
            {
              label: "Invite Sent",
              value: counts.inviteSent,
              icon: Mail,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
            },
            {
              label: "Approved",
              value: counts.approved,
              icon: CheckCircle2,
              color: "text-green-400",
              bg: "bg-green-500/10 border-green-500/20",
            },
            {
              label: "Interview Booked",
              value: counts.interviewBooked,
              icon: Calendar,
              color: "text-sky-400",
              bg: "bg-sky-500/10 border-sky-500/20",
            },
            {
              label: "Trial Offered",
              value: counts.trialOffered,
              icon: Star,
              color: "text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20",
            },
            {
              label: "Onboarding",
              value: counts.onboarding,
              icon: Clock,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
            },
            {
              label: "Onboarded",
              value: counts.onboarded,
              icon: Award,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
            },
            {
              label: "Rejected",
              value: counts.rejected,
              icon: XCircle,
              color: "text-red-400",
              bg: "bg-red-500/10 border-red-500/20",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className={`rounded-2xl border p-4 flex items-center gap-3 ${bg}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
              <div>
                <p className={`text-2xl font-bold leading-none ${color}`}>
                  {value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, location…"
            className="flex-1 px-4 py-2.5 bg-[#111111] border border-[#1f1f1f] rounded-xl text-sm text-white
              placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": "#FDB8D7" } as React.CSSProperties}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 2px #FDB8D760";
              e.currentTarget.style.borderColor = "#FDB8D7";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "";
              e.currentTarget.style.borderColor = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "invite_sent", label: "Invite Sent" },
                { value: "approved", label: "Approved" },
                { value: "interview booked", label: "Interview Booked" },
                { value: "trial_offered_filter", label: "Trial Offered" },
                { value: "onboarding", label: "Onboarding" },
                { value: "onboarded_filter", label: "Onboarded" },
                { value: "rejected", label: "Rejected" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                style={
                  statusFilter === value
                    ? {
                        backgroundColor: "#FDB8D7",
                        borderColor: "#FDB8D7",
                        color: "#1a0a10",
                      }
                    : {}
                }
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === value
                    ? ""
                    : "bg-[#111111] text-gray-400 border-[#1f1f1f] hover:border-[#FDB8D7]/50 hover:text-[#FDB8D7]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl overflow-visible">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-600">
              <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No candidates found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      {[
                        { label: "Name", key: "full_name" as SortKey },
                        { label: "Contact", key: null },
                        { label: "Location", key: null },
                        { label: "Gender", key: null },
                        { label: "Status", key: "status" as SortKey },
                        { label: "Trial Venue", key: null },
                        { label: "Trial Mentor", key: null },
                        { label: "Onboarding", key: null },
                        { label: "Applied", key: "created_at" as SortKey },
                        { label: "", key: null },
                      ].map(({ label, key }) => (
                        <th
                          key={label}
                          onClick={key ? () => toggleSort(key) : undefined}
                          className={`px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                            key
                              ? "cursor-pointer hover:text-gray-300 select-none"
                              : ""
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {label}
                            {key && <SortIcon k={key} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161616]">
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="hover:bg-[#161616] cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white group-hover:text-[#FDB8D7] transition-colors">
                            {c.full_name}
                          </p>
                          {c.instagram && (
                            <p className="text-xs text-gray-600">
                              {c.instagram}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-300 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            {c.email}
                          </p>
                          <p className="text-gray-500 text-xs flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {c.phone}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-300 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-gray-600 flex-shrink-0" />
                            {c.primary_location}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-gray-600">
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
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                          {c.gender ?? "—"}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <InlineStatusDropdown
                            candidate={c}
                            onSelect={(s) => handleStatusDirect(c, s)}
                          />
                          {c.status === "rejected" && c.rejection_reason && (
                            <p
                              className="text-[10px] text-red-400/70 italic mt-1 max-w-[160px] truncate"
                              title={c.rejection_reason}
                            >
                              {c.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">
                          {c.trial_venue ? (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3 h-3 text-gray-600 flex-shrink-0" />
                              {c.trial_venue}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">
                          {c.trial_mentor ? (
                            <span className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-gray-600 flex-shrink-0" />
                              {c.trial_mentor}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
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
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(c.created_at)}
                        </td>
                        <td className="px-4 py-3">
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
                              className="p-1.5 rounded-lg bg-[#1a1a1a] text-gray-500 hover:text-[#FDB8D7] hover:bg-[#FDB8D7]/10 transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-[#161616]">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="px-4 py-4 cursor-pointer hover:bg-[#161616] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-white">
                          {c.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <InlineStatusDropdown
                          candidate={c}
                          onSelect={(s) => handleStatusDirect(c, s)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {c.primary_location}
                      </span>
                      {c.gender && <span>{c.gender}</span>}
                    </div>
                    {c.status === "rejected" && c.rejection_reason && (
                      <p className="text-[10px] text-red-400/70 italic mt-1">
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
                        className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-[#FDB8D7] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-700 pb-2">
          Showing {filtered.length} of {candidates.length} candidates
        </p>
      </div>

      {/* Detail Modal */}
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
