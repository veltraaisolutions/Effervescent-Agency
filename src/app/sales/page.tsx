import { supabase } from "@/lib/supabase";
import { Sale } from "./types";

export default async function SalesPage() {
  const { data: sales, error } = await supabase
    .from("milli_sales")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    return (
      <div className="p-10 text-red-500">
        Error loading sales: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales Dashboard</h1>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {sales?.length || 0} Entries Found
        </span>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Venue
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Bottles
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Receipts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sales?.map((sale: Sale) => (
              <tr
                key={sale.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {sale.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sale.seller_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {sale.venue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                  {sale.bottles}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-emerald-600">
                  £{sale.total_revenue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className="flex justify-center gap-3">
                    {sale.receipt_images?.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Img {i + 1}
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
