export interface Sale {
  id: number;
  created_at: string;
  date_of_shift: string;
  city: string;
  venue: string;
  full_name: string;
  bottles_sold: number;
  bar_amount: number;
  card_amount: number;
  cash_collected: number;
  total_revenue: number;
  seller_comm: number;
  agency_comm: number;
  deductions: number;
  agency_fee: number;
  expected_rev: number;
  actual_rev: number;
  difference: number;
  paid_bar_directly: boolean;
  agency_sent_money: boolean;
  agency_amount: number;
  status: string;
  receipt_images: string | null;
  reference_id: string | null;
  payment_link_sent?: boolean | null;
  reminder_sent?: boolean | null;
  original_agency_fee?: number | null;
}
