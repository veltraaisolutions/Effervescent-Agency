"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { Sale } from "./types";
import { VENUE_CONFIG, VenueConfig } from "@/lib/venueConfig";

function calcDerived(sale: Partial<Sale>, venueConfig?: VenueConfig | null) {
  const cash = Number(sale.cash_collected ?? 0);
  const card = Number(sale.card_amount ?? 0);
  const total_revenue = cash + card;

  const bottlesSold = Number(sale.bottles_sold ?? 0);
  const avgHigh = Number(venueConfig?.avg_sales_per_bottle_high ?? 0);
  const expected_rev = bottlesSold * avgHigh;

  const bar_earning = Number(sale.bar_amount ?? 0);
  const bottles = bottlesSold;
  let deductions = 0;

  const net_revenue = total_revenue - bar_earning;
  const seller_comm = Math.max(0, net_revenue / 2);
  const agency_comm = Math.max(0, net_revenue / 2);

  if (!sale.paid_bar_directly) deductions += bar_earning;
  if (sale.agency_sent_money) deductions += Number(sale.agency_amount ?? 0);

  const agency_fee = agency_comm + deductions;
  const actual_rev = total_revenue;
  const difference = actual_rev - expected_rev;

  return {
    total_revenue,
    seller_comm,
    agency_comm,
    actual_rev,
    difference,
    deductions,
    agency_fee,
    bar_amount: bar_earning,
    bottles_sold: bottles,
    expected_rev,
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
    seller_comm: preferManual(editState.seller_comm, derived.seller_comm),
    agency_comm: preferManual(editState.agency_comm, derived.agency_comm),
    deductions: preferManual(editState.deductions, derived.deductions),
    agency_fee: preferManual(editState.agency_fee, derived.agency_fee),
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
