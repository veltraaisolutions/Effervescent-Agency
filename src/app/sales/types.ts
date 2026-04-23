export interface Sale {
  id: string;
  date: string;
  venue: string;
  seller_name: string;
  bottles: number;
  total_revenue: number;
  receipt_images: string[];
  bar_earnings: number;
  cash_payments: number;
  card_payments: number;
  seller_email: string;
}
