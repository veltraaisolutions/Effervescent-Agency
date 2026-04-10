"use server";

import { supabase } from "@/lib/supabase";
import { Candidate } from "./types";

const APPROVED_WEBHOOK = "https://n8n.veltraai.net/webhook/candidate-approved";
const REJECTED_WEBHOOK = "https://n8n.veltraai.net/webhook/rejected";

export async function approveCandidate(
  candidate: Candidate,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("milli_candidates")
    .update({ status: "approved" })
    .eq("id", candidate.id);

  if (error) return { error: error.message };

  try {
    await fetch(APPROVED_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...candidate, status: "approved" }),
    });
  } catch {
    // Webhook failure is non-fatal — status is already updated
  }

  return {};
}

export async function rejectCandidate(
  candidate: Pick<Candidate, "id" | "full_name" | "phone">,
  reason: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("milli_candidates")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", candidate.id);

  if (error) return { error: error.message };

  try {
    await fetch(REJECTED_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: candidate.full_name,
        phone: candidate.phone,
        reason,
      }),
    });
  } catch {
    // Webhook failure is non-fatal
  }

  return {};
}

export async function markTrialOffered(
  id: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("milli_candidates")
    .update({
      status: "trial_offered",
      trial_offered_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function markTrialSuccessful(
  id: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("milli_candidates")
    .update({ trial_success: true, status: "onboarding" })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function markTrialFailed(id: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("milli_candidates")
    .update({ trial_success: false, status: "rejected" })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function changeStatus(
  id: string,
  from: string,
  to: string,
): Promise<{ error?: string; patch?: Record<string, unknown> }> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: to };

  if (to === "trial_offered") patch.trial_offered_at = now;
  if (to === "onboarding") patch.trial_success = true;
  if (to === "on-boarded") patch.onboarded_at = now;
  if (to === "rejected" && (from === "trial_offered" || from === "onboarding"))
    patch.trial_success = false;

  const { error } = await supabase
    .from("milli_candidates")
    .update(patch)
    .eq("id", id);

  if (error) return { error: error.message };
  return { patch };
}

// ─── Trial Details ─────────────────────────────────────────────────────────────

export async function updateTrialDetails(
  id: string,
  trial_venue: string,
  trial_mentor: string,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("milli_candidates")
    .update({ trial_venue, trial_mentor })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}
