// ─── Single source of truth for venue prices ────────────────────────────────
// Update this file when venue prices change.
// Imported by: page.tsx, actions.ts
// n8n has its own copy (can't import from code) — keep in sync manually.

export interface VenueConfig {
  shot_price: number;
  bottle_price: number;
  avg_sales_per_bottle_high: number;
}

export const VENUE_CONFIG: Record<string, VenueConfig> = {
  "2Funky": {
    shot_price: 3.5,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 140.0,
  },
  "Binks Yard": {
    shot_price: 5.0,
    bottle_price: 85.0,
    avg_sales_per_bottle_high: 200.0,
  },
  Bounty: {
    shot_price: 3.5,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 140.0,
  },
  Cavendish: {
    shot_price: 4.0,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 160.0,
  },
  Crib: {
    shot_price: 5.5,
    bottle_price: 80.0,
    avg_sales_per_bottle_high: 220.0,
  },
  Cucamara: {
    shot_price: 3.0,
    bottle_price: 65.0,
    avg_sales_per_bottle_high: 120.0,
  },
  "Fat Cat Derby": {
    shot_price: 3.0,
    bottle_price: 65.0,
    avg_sales_per_bottle_high: 120.0,
  },
  Ghost: {
    shot_price: 3.0,
    bottle_price: 60.0,
    avg_sales_per_bottle_high: 120.0,
  },
  "Grumpy Monkey": {
    shot_price: 4.0,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 160.0,
  },
  Hukka: {
    shot_price: 5.0,
    bottle_price: 100.0,
    avg_sales_per_bottle_high: 200.0,
  },
  Icon: {
    shot_price: 3.0,
    bottle_price: 65.0,
    avg_sales_per_bottle_high: 120.0,
  },
  "Icon BAR CRAW": {
    shot_price: 2.0,
    bottle_price: 40.0,
    avg_sales_per_bottle_high: 80.0,
  },
  "The Camden": {
    shot_price: 8.5,
    bottle_price: 180.0,
    avg_sales_per_bottle_high: 340.0,
  },
  "Lace Bar": {
    shot_price: 3.5,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 140.0,
  },
  "Loft Bar": {
    shot_price: 4.0,
    bottle_price: 80.0,
    avg_sales_per_bottle_high: 160.0,
  },
  "Mixing House": {
    shot_price: 3.0,
    bottle_price: 65.0,
    avg_sales_per_bottle_high: 120.0,
  },
  "The Nest": {
    shot_price: 3.5,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 140.0,
  },
  "New Foresters": {
    shot_price: 4.0,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 160.0,
  },
  "Oz Bar": {
    shot_price: 3.0,
    bottle_price: 65.0,
    avg_sales_per_bottle_high: 120.0,
  },
  "Pitcher & Piano": {
    shot_price: 5.0,
    bottle_price: 100.0,
    avg_sales_per_bottle_high: 200.0,
  },
  Popworld: {
    shot_price: 3.5,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 140.0,
  },
  "Revolution South": {
    shot_price: 3.5,
    bottle_price: 50.0,
    avg_sales_per_bottle_high: 140.0,
  },
  "Revs de cuba": {
    shot_price: 4.0,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 160.0,
  },
  "Route One": {
    shot_price: 3.0,
    bottle_price: 65.0,
    avg_sales_per_bottle_high: 120.0,
  },
  "Secret Garden": {
    shot_price: 3.5,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 140.0,
  },
  "Secret vault": {
    shot_price: 4.0,
    bottle_price: 70.0,
    avg_sales_per_bottle_high: 160.0,
  },
  "Steins Derby": {
    shot_price: 4.0,
    bottle_price: 50.0,
    avg_sales_per_bottle_high: 160.0,
  },
  "The Kings": {
    shot_price: 3.0,
    bottle_price: 55.0,
    avg_sales_per_bottle_high: 120.0,
  },
  "The Mail Room": {
    shot_price: 6.0,
    bottle_price: 100.0,
    avg_sales_per_bottle_high: 240.0,
  },
  "Trent Navigation": {
    shot_price: 4.5,
    bottle_price: 80.0,
    avg_sales_per_bottle_high: 180.0,
  },
  Tunnel: {
    shot_price: 3.0,
    bottle_price: 65.0,
    avg_sales_per_bottle_high: 120.0,
  },
  "Vat & Fiddle": {
    shot_price: 3.0,
    bottle_price: 60.0,
    avg_sales_per_bottle_high: 120.0,
  },
  Vibe: {
    shot_price: 6.0,
    bottle_price: 60.0,
    avg_sales_per_bottle_high: 240.0,
  },
  XOYO: {
    shot_price: 4.5,
    bottle_price: 78.75,
    avg_sales_per_bottle_high: 180.0,
  },
  "Boxpark Liverpool": {
    shot_price: 0.0,
    bottle_price: 100.0,
    avg_sales_per_bottle_high: 0.0,
  },
};
