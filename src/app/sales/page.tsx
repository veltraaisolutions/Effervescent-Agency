import { supabase } from "@/lib/supabase";
import { Sale } from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, ShoppingCart } from "lucide-react";

export default async function SalesPage() {
  const { data: sales, error } = await supabase
    .from("milli_sales")
    .select("*")
    .order("date", { ascending: false });

  if (error)
    return (
      <div className="p-10 text-red-400 font-mono">Error: {error.message}</div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e7eb] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ffb6c1]/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-[#ffb6c1]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sales Ledger
            </h1>
          </div>
        </div>

        {/* Removed ScrollArea to eliminate the large empty space */}
        <div className="bg-[#111111] rounded-xl border border-white/5 shadow-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-[#1a1a1a]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-500 text-[10px] uppercase tracking-wider py-4 w-[120px]">
                  Date
                </TableHead>
                <TableHead className="text-gray-500 text-[10px] uppercase tracking-wider">
                  Seller
                </TableHead>
                <TableHead className="text-gray-500 text-[10px] uppercase tracking-wider">
                  Venue
                </TableHead>
                <TableHead className="text-gray-500 text-[10px] uppercase tracking-wider text-center">
                  Units
                </TableHead>
                <TableHead className="text-gray-500 text-[10px] uppercase tracking-wider text-right">
                  Revenue
                </TableHead>
                <TableHead className="text-gray-500 text-[10px] uppercase tracking-wider text-right">
                  Images
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales && sales.length > 0 ? (
                sales.map((sale: Sale) => (
                  <TableRow
                    key={sale.id}
                    className="border-white/5 hover:bg-white/[0.01] transition-all group"
                  >
                    <TableCell className="text-gray-500 text-xs py-4 font-medium">
                      {sale.date}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-200">
                          {sale.seller_name}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {sale.seller_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#1a1a1a] text-gray-400 border-white/10 px-2.5 py-0.5 rounded-full font-normal text-[10px]">
                        {sale.venue}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono text-gray-500 text-sm">
                      {sale.bottles}
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-white">
                      £{sale.total_revenue?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {sale.receipt_images?.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-bold text-[#ffb6c1] bg-[#ffb6c1]/5 hover:bg-[#ffb6c1]/10 px-3 py-1 rounded-full border border-[#ffb6c1]/10 transition-all"
                          >
                            <Receipt className="w-3 h-3" />#{i + 1}
                          </a>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-gray-600 text-sm"
                  >
                    No sales recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
