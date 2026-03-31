"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { formatCents } from "@/lib/money";

type Order = {
  id: string;
  status: string;
  createdAt: string | Date;
  totalCents: number;
  shippingName: string;
  shippingEmail: string;
  shippingAddress1: string;
  shippingCity: string;
  shippingPostal: string;
  shippingCountry: string;
  user: { email: string | null; name: string | null };
  items: Array<{
    id: string;
    productTitle: string;
    variantSize: string | null;
    variantColor: string | null;
    variantSku: string | null;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    PAID: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    SHIPPED: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    DELIVERED: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${colors[status] || "bg-slate-800 text-slate-400 ring-slate-700"}`}>
      {status}
    </span>
  );
}

export default function AdminOrdersTable({ orders }: { orders: Order[] }) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(orderId: string, nextStatus: string) {
    setSavingId(orderId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to update order");
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-slate-400 text-sm mt-1">Manage and update order statuses</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Shipping</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-slate-400">No orders yet</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="align-top">
                  <td>
                    <div className="font-semibold text-slate-200">{o.id.slice(0, 8)}...</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium text-slate-200">{o.shippingName}</div>
                    <div className="text-xs text-slate-500">
                      {o.user?.email ?? o.shippingEmail}
                    </div>
                  </td>
                  <td>
                    <div className="font-medium text-slate-200">{o.shippingAddress1}</div>
                    <div className="text-xs text-slate-500">
                      {o.shippingCity} {o.shippingPostal}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      {o.items.slice(0, 3).map((it) => (
                        <div key={it.id} className="text-xs text-slate-400">
                          <span className="font-semibold text-slate-300">{it.quantity}×</span>{" "}
                          {it.productTitle}
                        </div>
                      ))}
                      {o.items.length > 3 && (
                        <div className="text-xs text-slate-500">
                          +{o.items.length - 3} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold text-brand-400">
                    {formatCents(o.totalCents)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                      <select
                        value={o.status}
                        disabled={savingId === o.id}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        className="rounded-lg border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:ring-brand-500 disabled:opacity-60"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

