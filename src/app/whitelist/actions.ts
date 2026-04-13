"use server";

import { supabase } from "@/lib/supabase";

export async function getWhitelistCandidates() {
  const { data, error } = await supabase
    .from("milli_candidates")
    .select("id, full_name, phone, whitelisted, onboarded_at")
    .eq("status", "on-boarded")
    .order("onboarded_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function toggleWhitelist(id: string, value: boolean) {
  const { error } = await supabase
    .from("milli_candidates")
    .update({ whitelisted: value })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}
