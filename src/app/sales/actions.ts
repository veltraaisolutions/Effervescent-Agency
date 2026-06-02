"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { Sale } from "./types";
import { VENUE_CONFIG, VenueConfig } from "@/lib/venueConfig";

const SHOT_PRICE = 4;
const SHOTS_PER_BOTTLE = 40;
const TOLERANCE = 0.15;

function calcDerived(sale: Partial<Sale>, venueConfig?: VenueConfig | null) {
  const cash = Number(sale.cash_collected ?? 0);
  const card = Number(sale.card_amount ?? 0);
  const total_revenue = cash + card;

  const bottlesSold = Number(sale.bottles_sold ?? 0);
  const avgHigh = Number(venueConfig?.avg_sales_per_bottle_high ?? 0);
  const expected_rev = bottlesSold * avgHigh;

  const reported_bar_earning = Math.max(0, Number(sale.bar_amount ?? 0));
  const actual_rev = total_revenue;
  const difference = actual_rev - expected_rev;

  // ----- REPORTED VALUES (never overwritten) -----
  const reported_net_revenue = total_revenue - reported_bar_earning;
  const reported_seller_comm = Math.max(0, reported_net_revenue / 2);
  const reported_agency_comm = Math.max(0, reported_net_revenue / 2);

  let reported_deductions = 0;
  if (!sale.paid_bar_directly) reported_deductions += reported_bar_earning;
  if (sale.agency_sent_money)
    reported_deductions += Number(sale.agency_amount ?? 0);

  const reported_agency_fee = reported_agency_comm + reported_deductions;

  // ----- ±15% ADJUSTMENT CHECK -----
  const upper_threshold = expected_rev * (1 + TOLERANCE);
  const lower_threshold = expected_rev * (1 - TOLERANCE);
  const isOutsideTolerance =
    expected_rev > 0 &&
    (total_revenue > upper_threshold || total_revenue < lower_threshold);

  let adjustment_triggered = false;
  let adjustment_direction: string | null = null;
  let corrected_bottles: number | null = null;
  let corrected_bar_earning: number | null = null;
  let corrected_net_revenue: number | null = null;
  let corrected_seller_comm: number | null = null;
  let corrected_agency_comm: number | null = null;
  let corrected_deductions: number | null = null;
  let corrected_agency_fee: number | null = null;
  let bar_earning_difference = 0;

  if (isOutsideTolerance) {
    adjustment_triggered = true;
    adjustment_direction = total_revenue > upper_threshold ? "over" : "under";

    corrected_bottles = total_revenue / SHOT_PRICE / SHOTS_PER_BOTTLE;
    corrected_bar_earning = corrected_bottles * avgHigh;
    bar_earning_difference = corrected_bar_earning - reported_bar_earning;

    corrected_net_revenue = total_revenue - corrected_bar_earning;
    corrected_seller_comm = Math.max(0, corrected_net_revenue / 2);
    corrected_agency_comm = Math.max(0, corrected_net_revenue / 2);

    corrected_deductions = 0;
    if (!sale.paid_bar_directly) corrected_deductions += corrected_bar_earning;
    if (sale.agency_sent_money)
      corrected_deductions += Number(sale.agency_amount ?? 0);
    corrected_deductions += bar_earning_difference;

    corrected_agency_fee = corrected_agency_comm + corrected_deductions;
  }

  return {
    // Reported values (what seller submitted, never overwritten)
    total_revenue,
    seller_comm: reported_seller_comm,
    agency_comm: reported_agency_comm,
    actual_rev,
    difference,
    deductions: reported_deductions,
    agency_fee: reported_agency_fee,
    bar_amount: reported_bar_earning,
    bottles_sold: bottlesSold,
    expected_rev,
    // Adjustment status
    adjustment_triggered,
    adjustment_direction,
    // Audit fields
    reported_bottles: bottlesSold,
    reported_bar_earning,
    bar_earning_difference,
    // Corrected values (null when not triggered)
    corrected_bottles,
    corrected_bar_earning,
    corrected_net_revenue,
    corrected_seller_comm,
    corrected_agency_fee,
  };
}

function preferManual(manual: unknown, auto: number): number {
  const n = Number(manual);
  return !isNaN(n) && String(manual).trim() !== "" ? n : auto;
}

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("milli_sales")
    .select("*")
    .order("date_of_shift", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateSale(
  id: number,
  editState: Partial<Sale>,
): Promise<Sale> {
  const venueConfig = VENUE_CONFIG[editState.venue ?? ""] ?? null;
  const derived = calcDerived(editState, venueConfig);

  const currentAgencyFee = preferManual(
    editState.agency_fee,
    derived.agency_fee,
  );
  const shouldLockOriginal =
    !editState.original_agency_fee || editState.original_agency_fee === 0;

  const payload = {
    date_of_shift: editState.date_of_shift,
    city: editState.city,
    venue: editState.venue,
    full_name: editState.full_name,
    bottles_sold: derived.bottles_sold,
    bar_amount: derived.bar_amount,
    card_amount: Number(editState.card_amount) || 0,
    cash_collected: Number(editState.cash_collected) || 0,
    total_revenue: preferManual(editState.total_revenue, derived.total_revenue),
    seller_comm: derived.seller_comm,
    agency_comm: derived.agency_comm,
    deductions: derived.deductions,
    agency_fee: derived.agency_fee,
    expected_rev: preferManual(editState.expected_rev, derived.expected_rev),
    actual_rev: preferManual(editState.actual_rev, derived.actual_rev),
    difference: preferManual(editState.difference, derived.difference),
    agency_amount: Number(editState.agency_amount) || 0,
    paid_bar_directly:
      editState.paid_bar_directly === true ||
      (editState.paid_bar_directly as unknown as string) === "true",
    agency_sent_money:
      editState.agency_sent_money === true ||
      (editState.agency_sent_money as unknown as string) === "true",
    status: editState.status,
    original_agency_fee: shouldLockOriginal
      ? currentAgencyFee
      : editState.original_agency_fee,
    adjustment_triggered: derived.adjustment_triggered,
    adjustment_direction: derived.adjustment_direction,
    reported_bottles: derived.reported_bottles,
    corrected_bottles: derived.corrected_bottles,
    reported_bar_earning: derived.reported_bar_earning,
    bar_earning_difference: derived.bar_earning_difference,
    corrected_bar_earning: derived.corrected_bar_earning,
    corrected_net_revenue: derived.corrected_net_revenue,
    corrected_seller_comm: derived.corrected_seller_comm,
    corrected_agency_fee: derived.corrected_agency_fee,
  };

  const { data, error } = await supabase
    .from("milli_sales")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/sales");
  return data as Sale;
}
