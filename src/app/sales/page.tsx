"use client";

import { useEffect, useState, useCallback } from "react";
import { Sale } from "./types";
import { getSales, updateSale } from "./actions";
import { T } from "@/styles/theme";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VENUE_CONFIG, VenueConfig } from "@/lib/venueConfig";
import {
  Receipt,
  ShoppingCart,
  Database,
  Pencil,
  Check,
  X,
  Send,
  RefreshCw,
  Search,
} from "lucide-react";

const BRAND_PINK = "#FFB8D7";
const SEND_STRIPE_WEBHOOK = "https://n8n.veltraai.net/webhook/send-stripe-link";

function getPaymentStatus(
  sale: Sale,
): "pending" | "link_sent" | "reminder_sent" | "paid" {
  if (sale.status === "Paid") return "paid";
  if (sale.reminder_sent) return "reminder_sent";
  if (sale.payment_link_sent) return "link_sent";
  return "pending";
}

const PAYMENT_STATUS_CONFIG = {
  paid: {
    label: "Paid",
    cls: "bg-green-100 text-green-700 border-green-200",
    rowBg: "bg-green-50 hover:bg-green-100",
  },
  reminder_sent: {
    label: "Reminder Sent",
    cls: "bg-red-100 text-red-700 border-red-300",
    rowBg: "bg-red-100 hover:bg-red-200",
  },
  link_sent: {
    label: "Link Sent",
    cls: "bg-blue-100 text-blue-700 border-blue-200",
    rowBg: "bg-blue-50 hover:bg-blue-100",
  },
  pending: {
    label: "Pending",
    cls: "bg-orange-100 text-orange-700 border-orange-200",
    rowBg: "bg-orange-50 hover:bg-orange-100",
  },
};

function mono(val: number | null | undefined) {
  return `£${Number(val ?? 0).toFixed(2)}`;
}

export function calcDerived(
  sale: Partial<Sale>,
  venueConfig?: VenueConfig | null,
) {
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
    bar_earning,
    bottles,
    expected_rev,
  };
}

function groupByMonth(sales: Sale[]): Record<string, Sale[]> {
  return sales.reduce(
    (acc, sale) => {
      const d = new Date(sale.date_of_shift);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(sale);
      return acc;
    },
    {} as Record<string, Sale[]>,
  );
}

function formatMonthKey(key: string) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<Partial<Sale>>({});
  const [saving, setSaving] = useState(false);
  const [sendingPaymentId, setSendingPaymentId] = useState<number | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [sendAllProgress, setSendAllProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [filterVenue, setFilterVenue] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  const fetchSales = useCallback(async () => {
    const data = await getSales();
    setSales(data);
    setLastRefreshed(new Date());
  }, []);

  useEffect(() => {
    fetchSales().finally(() => setLoading(false));
  }, [fetchSales]);

  useEffect(() => {
    const channel = supabase
      .channel("milli_sales_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "milli_sales" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setSales((prev) =>
              prev.map((s) =>
                s.id === (payload.new as Sale).id
                  ? { ...s, ...(payload.new as Sale) }
                  : s,
              ),
            );
            setLastRefreshed(new Date());
          } else {
            fetchSales();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSales]);

  const filteredSales = sales.filter((s) => {
    const venueMatch = filterVenue === "" || s.venue === filterVenue;
    const nameMatch =
      filterName === "" ||
      s.full_name.toLowerCase().includes(filterName.toLowerCase());
    const statusMatch =
      filterStatus === "" || getPaymentStatus(s) === filterStatus;
    const saleDate = new Date(s.date_of_shift);
    const fromMatch =
      filterDateFrom === "" || saleDate >= new Date(filterDateFrom);
    const toMatch = filterDateTo === "" || saleDate <= new Date(filterDateTo);
    return venueMatch && nameMatch && statusMatch && fromMatch && toMatch;
  });

  const uniqueVenues = Array.from(new Set(sales.map((s) => s.venue))).sort();

  function startEdit(sale: Sale) {
    setEditingId(sale.id);
    setEditState({ ...sale });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState({});
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await updateSale(editingId, editState);
      setSales((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      setEditingId(null);
      setEditState({});
    } catch (err: unknown) {
      alert("Save failed: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function editField(key: keyof Sale, value: string | boolean) {
    setEditState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSendPaymentLink(sale: Sale) {
    setSendingPaymentId(sale.id);
    try {
      const { data: candidate } = await supabase
        .from("milli_candidates")
        .select("phone, email")
        .eq("reference_id", sale.reference_id)
        .single();

      const venueConfig = VENUE_CONFIG[sale.venue] ?? null;
      const derived = calcDerived(sale, venueConfig);
      const amount = Number(derived.agency_fee.toFixed(2));

      const payload = {
        sale_id: sale.id,
        full_name: sale.full_name,
        reference_id: sale.reference_id,
        phone: candidate?.phone ?? null,
        email: candidate?.email ?? null,
        amount,
        date_of_shift: sale.date_of_shift,
        venue: sale.venue,
      };

      const res = await fetch(SEND_STRIPE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Webhook failed");

      await supabase
        .from("milli_sales")
        .update({
          payment_link_sent: true,
          payment_link_sent_at: new Date().toISOString(),
        })
        .eq("id", sale.id);

      setSales((prev) =>
        prev.map((s) =>
          s.id === sale.id ? { ...s, payment_link_sent: true } : s,
        ),
      );
    } catch (err) {
      console.error(err);
      alert(
        `Failed to send payment link for ${sale.full_name}. Please try again.`,
      );
    } finally {
      setSendingPaymentId(null);
    }
  }

  async function handleSendAllPaymentLinks() {
    const pending = filteredSales.filter(
      (s) => s.status !== "Paid" && !s.payment_link_sent,
    );

    if (pending.length === 0) {
      alert("No pending sales to send links to.");
      return;
    }

    // Group by reference_id + date_of_shift, pick first sale from each group
    const groups = new Map<string, Sale>();
    for (const sale of pending) {
      const key = `${sale.reference_id}_${sale.date_of_shift}`;
      if (!groups.has(key)) groups.set(key, sale);
    }
    const uniqueGroups = Array.from(groups.values());

    if (
      !confirm(
        `Send payment links to ${uniqueGroups.length} seller${uniqueGroups.length !== 1 ? "s" : ""}?`,
      )
    )
      return;

    setSendingAll(true);
    setSendAllProgress({ done: 0, total: uniqueGroups.length });

    for (let i = 0; i < uniqueGroups.length; i++) {
      await handleSendPaymentLink(uniqueGroups[i]);
      setSendAllProgress({ done: i + 1, total: uniqueGroups.length });
      if (i < uniqueGroups.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    setSendingAll(false);
    setSendAllProgress(null);
  }

  function numInput(key: keyof Sale) {
    return (
      <input
        type="number"
        step="0.01"
        value={(editState[key] as number) ?? ""}
        onChange={(e) => editField(key, e.target.value)}
        className="w-24 px-2 py-1 rounded-lg border border-pink-300 bg-white text-gray-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
      />
    );
  }

  function textInput(key: keyof Sale, placeholder = "") {
    return (
      <input
        type="text"
        placeholder={placeholder}
        value={(editState[key] as string) ?? ""}
        onChange={(e) => editField(key, e.target.value)}
        className="w-28 px-2 py-1 rounded-lg border border-pink-300 bg-white text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
      />
    );
  }

  const grouped = groupByMonth(filteredSales);
  const monthKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const pendingCount = filteredSales.filter(
    (s) => s.status !== "Paid" && !s.payment_link_sent,
  ).length;

  if (loading) return <p className="p-10 text-gray-400 text-sm">Loading...</p>;

  return (
    <div className={`${T.cls.page} bg-gray-900 p-6 md:p-10`}>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-50 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-pink-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sales Ledger</h1>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <button
                onClick={handleSendAllPaymentLinks}
                disabled={sendingAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
                style={{ backgroundColor: BRAND_PINK, color: "white" }}
              >
                {sendingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {sendAllProgress
                      ? `Sending ${sendAllProgress.done}/${sendAllProgress.total}...`
                      : "Sending..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send All Payment Links ({pendingCount})
                  </>
                )}
              </button>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <RefreshCw className="w-3 h-3" />
              <span>
                Live · updated {lastRefreshed.toLocaleTimeString("en-GB")}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search seller..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 w-44"
            />
          </div>

          <select
            value={filterVenue}
            onChange={(e) => setFilterVenue(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option value="">All Venues</option>
            {uniqueVenues.map((v) => (
              <option
                key={v}
                value={v}
              >
                {v}
              </option>
            ))}
          </select>

          {(filterVenue ||
            filterName ||
            filterStatus ||
            filterDateFrom ||
            filterDateTo) && (
            <button
              onClick={() => {
                setFilterVenue("");
                setFilterName("");
                setFilterStatus("");
                setFilterDateFrom("");
                setFilterDateTo("");
              }}
              className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors"
            >
              Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Filter:</span>
            {(
              Object.entries(PAYMENT_STATUS_CONFIG) as [
                string,
                (typeof PAYMENT_STATUS_CONFIG)[keyof typeof PAYMENT_STATUS_CONFIG],
              ][]
            ).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${cfg.cls} ${
                  filterStatus === key
                    ? "ring-2 ring-offset-1 ring-gray-400 scale-105"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {monthKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-2 h-48">
            <Database className="w-8 h-8 opacity-20" />
            <p className="text-sm font-medium text-gray-800">
              No records found
            </p>
          </div>
        ) : (
          monthKeys.map((monthKey) => (
            <div
              key={monthKey}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full"
                  style={{ backgroundColor: BRAND_PINK, color: "white" }}
                >
                  {formatMonthKey(monthKey)}
                </span>
                <span className="text-xs text-gray-400">
                  {grouped[monthKey].length} record
                  {grouped[monthKey].length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className={T.cls.tableWrap + " overflow-x-auto"}>
                <Table>
                  <TableHeader className={T.cls.thead}>
                    <TableRow className="border-gray-100 hover:bg-transparent">
                      <TableHead className={T.cls.th}>Actions</TableHead>
                      <TableHead className={T.cls.th + " text-center"}>
                        Range
                      </TableHead>
                      <TableHead className={T.cls.th + " text-center"}>
                        Status
                      </TableHead>
                      <TableHead className={T.cls.th + " text-center"}>
                        Payment
                      </TableHead>
                      <TableHead className={T.cls.th}>Date</TableHead>
                      <TableHead className={T.cls.th}>City</TableHead>
                      <TableHead className={T.cls.th}>Venue</TableHead>
                      <TableHead className={T.cls.th}>Seller</TableHead>
                      <TableHead className={T.cls.th + " text-center"}>
                        Units
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Bar Earning
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Card £
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Cash £
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Total Rev
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Seller Comm
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Agency Comm
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Deductions
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Agency Fee
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Expected Rev
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Actual Rev
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Difference
                      </TableHead>
                      <TableHead className={T.cls.th + " text-center"}>
                        Paid Bar?
                      </TableHead>
                      <TableHead className={T.cls.th + " text-center"}>
                        Agency Sent?
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Agency £
                      </TableHead>
                      <TableHead className={T.cls.th + " text-right"}>
                        Images
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[monthKey].map((sale) => {
                      const isEditing = editingId === sale.id;

                      const venueKey = isEditing
                        ? (editState.venue ?? sale.venue)
                        : sale.venue;
                      const venueConfig = VENUE_CONFIG[venueKey] ?? null;

                      const liveCalc = calcDerived(
                        isEditing ? editState : sale,
                        venueConfig,
                      );

                      const diff = Number(liveCalc.difference ?? 0);

                      const discrepancyStatus =
                        liveCalc.expected_rev === 0
                          ? "none"
                          : liveCalc.actual_rev < liveCalc.expected_rev * 0.85
                            ? "under"
                            : liveCalc.actual_rev >=
                                liveCalc.expected_rev * 1.15
                              ? "over"
                              : "within";

                      const paymentStatus = getPaymentStatus(
                        isEditing ? { ...sale, ...editState } : sale,
                      );
                      const cfg = PAYMENT_STATUS_CONFIG[paymentStatus];
                      const isSendingThis = sendingPaymentId === sale.id;

                      return (
                        <TableRow
                          key={sale.id}
                          className={`${T.cls.tr} ${
                            discrepancyStatus === "over"
                              ? "bg-yellow-200 hover:bg-yellow-300 border-l-4 border-yellow-500"
                              : discrepancyStatus === "under"
                                ? "bg-red-200 hover:bg-red-300 border-l-4 border-red-500"
                                : cfg.rowBg
                          }`}
                        >
                          {/* Actions */}
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={saveEdit}
                                  disabled={saving}
                                  className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(sale)}
                                className="p-1.5 rounded-lg bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </TableCell>

                          {/* Range */}
                          <TableCell className="text-center">
                            {discrepancyStatus === "over" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-400 text-yellow-900 border border-yellow-500">
                                ⚠️ Over
                              </span>
                            )}
                            {discrepancyStatus === "under" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-red-400 text-white border border-red-500">
                                ⬇️ Under
                              </span>
                            )}
                            {discrepancyStatus === "within" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700 border border-green-300">
                                ✓ Within Range
                              </span>
                            )}
                            {discrepancyStatus === "none" && (
                              <span className="text-[10px] text-gray-400">
                                —
                              </span>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center">
                            {isEditing ? (
                              <select
                                value={(editState.status as string) ?? ""}
                                onChange={(e) =>
                                  editField("status", e.target.value)
                                }
                                className="px-2 py-1 text-xs rounded-lg border border-pink-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-300 w-full"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}
                              >
                                {cfg.label}
                              </span>
                            )}
                          </TableCell>
                          {/* Payment Link */}
                          <TableCell className="text-center">
                            {!isEditing && paymentStatus === "pending" && (
                              <button
                                onClick={() => handleSendPaymentLink(sale)}
                                disabled={isSendingThis || sendingAll}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors disabled:opacity-50"
                                style={{
                                  backgroundColor: BRAND_PINK,
                                  color: "white",
                                  borderColor: BRAND_PINK,
                                }}
                              >
                                {isSendingThis ? (
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                {isSendingThis ? "Sending..." : "Send Link"}
                              </button>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-gray-500 text-xs whitespace-nowrap">
                            {isEditing
                              ? textInput("date_of_shift")
                              : sale.date_of_shift}
                          </TableCell>

                          {/* City */}
                          <TableCell className="text-gray-600 text-xs whitespace-nowrap">
                            {isEditing ? textInput("city") : (sale.city ?? "—")}
                          </TableCell>

                          {/* Venue */}
                          <TableCell>
                            {isEditing ? (
                              textInput("venue")
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-gray-200 text-gray-600 whitespace-nowrap"
                              >
                                {sale.venue}
                              </Badge>
                            )}
                          </TableCell>

                          {/* Seller */}
                          <TableCell
                            className={T.cls.td + " whitespace-nowrap"}
                          >
                            {isEditing
                              ? textInput("full_name")
                              : sale.full_name}
                          </TableCell>

                          {/* Units */}
                          <TableCell className="text-center text-gray-500 font-mono">
                            {isEditing
                              ? numInput("bottles_sold")
                              : liveCalc.bottles.toFixed(2)}
                          </TableCell>

                          {/* Bar Earning */}
                          <TableCell className="text-right font-mono text-gray-800">
                            {isEditing
                              ? numInput("bar_amount")
                              : mono(liveCalc.bar_earning)}
                          </TableCell>

                          {/* Card */}
                          <TableCell className="text-right font-mono text-gray-800">
                            {isEditing
                              ? numInput("card_amount")
                              : mono(sale.card_amount)}
                          </TableCell>

                          {/* Cash */}
                          <TableCell className="text-right font-mono text-green-700">
                            {isEditing
                              ? numInput("cash_collected")
                              : mono(sale.cash_collected)}
                          </TableCell>

                          {/* Total Rev */}
                          <TableCell className="text-right font-mono font-bold text-gray-900">
                            {isEditing
                              ? numInput("total_revenue")
                              : mono(liveCalc.total_revenue)}
                          </TableCell>

                          {/* Seller Comm */}
                          <TableCell className="text-right font-mono text-purple-700">
                            {isEditing
                              ? numInput("seller_comm")
                              : mono(liveCalc.seller_comm)}
                          </TableCell>

                          {/* Agency Comm */}
                          <TableCell className="text-right font-mono text-blue-700">
                            {isEditing
                              ? numInput("agency_comm")
                              : mono(liveCalc.agency_comm)}
                          </TableCell>

                          {/* Deductions */}
                          <TableCell className="text-right font-mono text-red-500">
                            {isEditing
                              ? numInput("deductions")
                              : mono(liveCalc.deductions)}
                          </TableCell>

                          {/* Agency Fee */}
                          <TableCell className="text-right font-mono text-orange-600">
                            {isEditing
                              ? numInput("agency_fee")
                              : mono(liveCalc.agency_fee)}
                          </TableCell>

                          {/* Expected Rev */}
                          <TableCell className="text-right font-mono text-gray-500">
                            {isEditing
                              ? numInput("expected_rev")
                              : mono(liveCalc.expected_rev)}
                          </TableCell>

                          {/* Actual Rev */}
                          <TableCell className="text-right font-mono text-gray-800">
                            {isEditing
                              ? numInput("actual_rev")
                              : mono(liveCalc.actual_rev)}
                          </TableCell>

                          {/* Difference */}
                          <TableCell
                            className={`text-right font-mono font-bold ${
                              diff < 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {isEditing ? (
                              numInput("difference")
                            ) : (
                              <>
                                {mono(diff)}
                                {liveCalc.expected_rev > 0 && (
                                  <span className="ml-1 text-[10px] text-gray-400">
                                    (
                                    {(
                                      (diff / liveCalc.expected_rev) *
                                      100
                                    ).toFixed(1)}
                                    %)
                                  </span>
                                )}
                              </>
                            )}
                          </TableCell>

                          {/* Paid Bar */}
                          <TableCell className="text-center text-lg">
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={!!editState.paid_bar_directly}
                                onChange={(e) =>
                                  editField(
                                    "paid_bar_directly",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 accent-pink-400"
                              />
                            ) : sale.paid_bar_directly ? (
                              "✅"
                            ) : (
                              "❌"
                            )}
                          </TableCell>

                          {/* Agency Sent */}
                          <TableCell className="text-center text-lg">
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={!!editState.agency_sent_money}
                                onChange={(e) =>
                                  editField(
                                    "agency_sent_money",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 accent-pink-400"
                              />
                            ) : sale.agency_sent_money ? (
                              "✅"
                            ) : (
                              "❌"
                            )}
                          </TableCell>

                          {/* Agency £ */}
                          <TableCell className="text-right font-mono text-blue-700">
                            {isEditing
                              ? numInput("agency_amount")
                              : mono(sale.agency_amount)}
                          </TableCell>

                          {/* Images */}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {sale.receipt_images ? (
                                sale.receipt_images
                                  .split(", ")
                                  .map((url: string, i: number) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-pink-500 hover:text-pink-600 transition-colors"
                                    >
                                      <Receipt className="w-4 h-4" />
                                    </a>
                                  ))
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">
                                  None
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
