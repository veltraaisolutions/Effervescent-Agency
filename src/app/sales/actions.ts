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

  let bar_earning = Number(sale.bar_amount ?? 0);
  let bottles = bottlesSold;
  let deductions = 0;

  if (expected_rev > 0 && total_revenue > expected_rev * 1.15) {
    const shotPrice = Number(venueConfig?.shot_price ?? 0);
    const bottlePrice = Number(venueConfig?.bottle_price ?? 0);
    if (shotPrice > 0 && bottlePrice > 0) {
      const corrected_bottles = total_revenue / shotPrice / 40;
      const corrected_bar_earning = corrected_bottles * bottlePrice;
      const bar_earning_difference =
        corrected_bar_earning - bottlesSold * bottlePrice;
      bar_earning = corrected_bar_earning;
      bottles = corrected_bottles;
      deductions += bar_earning_difference;
    }
  }

  const net_revenue = total_revenue - bar_earning;
  const seller_comm = net_revenue / 2;
  const agency_comm = net_revenue / 2;

  if (!sale.paid_bar_directly) deductions += bar_earning;
  if (sale.agency_sent_money) deductions += Number(sale.agency_amount ?? 0);

  const agency_fee = agency_comm + deductions;
  const actual_rev = total_revenue; // cash + card
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
  // Resolve venue config from central file
  const venueConfig = VENUE_CONFIG[editState.venue ?? ""] ?? null;
  const derived = calcDerived(editState, venueConfig);

  const payload = {
    date_of_shift: editState.date_of_shift,
    city: editState.city,
    venue: editState.venue,
    full_name: editState.full_name,
    bottles_sold: derived.bottles_sold,
    bar_amount: derived.bar_amount,
    card_amount: Number(editState.card_amount) || 0,
    cash_collected: Number(editState.cash_collected) || 0,
    deductions: derived.deductions,
    agency_fee: derived.agency_fee,
    expected_rev: derived.expected_rev,
    actual_rev: derived.actual_rev,
    total_revenue: derived.total_revenue,
    seller_comm: derived.seller_comm,
    agency_comm: derived.agency_comm,
    difference: derived.difference,
    agency_amount: Number(editState.agency_amount) || 0,
    paid_bar_directly:
      editState.paid_bar_directly === true ||
      (editState.paid_bar_directly as unknown as string) === "true",
    agency_sent_money:
      editState.agency_sent_money === true ||
      (editState.agency_sent_money as unknown as string) === "true",
    status: editState.status,
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
