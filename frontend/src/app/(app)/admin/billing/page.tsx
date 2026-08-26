"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  CreditCard,
  Edit,
  TrendingUp,
  Tag,
  Shield,
  RefreshCw,
  X,
  Search,
  Receipt,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminBillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Billing & Financials State
  const [financialsData, setFinancialsData] = useState<any>({
    gross_revenue: 0,
    refunded_total: 0,
    net_revenue: 0,
    total_invoices: 0,
    paid_subscriptions_count: 0,
    lifetime_course_purchases_count: 0,
    active_promos: [],
  });
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadFinancialsData = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [fin, inv] = await Promise.all([
        api.getAdminFinancials().catch(() => null),
        api.getAdminInvoices().catch(() => []),
      ]);

      if (fin) setFinancialsData(fin);
      setInvoicesList(inv || []);
    } catch (err: any) {
      console.error("Failed to load financials:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFinancialsData();
  }, []);

  const handleUpdateInvoiceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    try {
      await api.updateAdminInvoiceStatus(editingInvoice.id, editingInvoice.status);
      setInvoicesList((prev) =>
        prev.map((inv) => (inv.id === editingInvoice.id ? { ...inv, status: editingInvoice.status } : inv))
      );
      setEditingInvoice(null);
      alert("Invoice transaction status updated.");
    } catch (e: any) {
      alert(`Error updating invoice: ${e.message}`);
    }
  };

  const filteredInvoices = invoicesList.filter((inv) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      inv.invoice_number?.toLowerCase().includes(term) ||
      inv.user_name?.toLowerCase().includes(term) ||
      inv.user_email?.toLowerCase().includes(term) ||
      inv.item_name?.toLowerCase().includes(term) ||
      inv.promo_code?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-surface border border-error/30 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground-muted">
          Administrative privileges required to access Financials & Billing.
        </p>
        <Button onClick={() => router.push("/dashboard")} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shadow-sm shadow-blue-500/10">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Financials & Billing Ledger</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Settled Transactions
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Revenue accounting, subscription plans, promotional discount redemptions, and itemized customer invoices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadFinancialsData}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Ledger"}
          </Button>
        </div>
      </div>

      {/* Financial Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-sm space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Gross Platform Revenue</p>
          <h3 className="text-2xl font-extrabold text-emerald-400">
            ${Number(financialsData.gross_revenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-slate-400">{financialsData.total_invoices || 0} total settled transactions</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-sm space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Active Subscriptions</p>
          <h3 className="text-2xl font-extrabold text-blue-400">
            {financialsData.paid_subscriptions_count || 0}
          </h3>
          <p className="text-[11px] text-slate-400">Monthly & Annual recurring student seats</p>
        </div>

        <div className="p-5 rounded-xl bg-[#0F172A] border border-[#1E293B] shadow-sm space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Lifetime Course Sales</p>
          <h3 className="text-2xl font-extrabold text-purple-400">
            {financialsData.lifetime_course_purchases_count || 0}
          </h3>
          <p className="text-[11px] text-slate-400">$49/course permanent syllabus passes</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex items-center bg-[#0C1222] p-3 rounded-xl border border-[#1E293B]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions by invoice #, customer name, email, or promo code..."
            className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Itemized Transactions Ledger */}
      <Card padding="none" className="border border-[#1E293B] bg-[#0F172A] shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] bg-[#0C1222] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-400" /> Itemized Transactions & Invoices Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time billing receipts, promo discounts, card brand/last4, and payment statuses.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#0F172A] border border-[#1E293B] text-slate-300">
            {filteredInvoices.length} Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[#1E293B] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan / Item</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Promo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-slate-400">
                    No transactions matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{inv.invoice_number}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{inv.user_name || "Customer"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{inv.user_email}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">{inv.item_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">${Number(inv.subtotal || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 font-mono text-red-400">
                      {inv.discount_amount > 0 ? `-$${Number(inv.discount_amount).toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-emerald-400">
                      ${Number(inv.total_paid || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {inv.payment_method} {inv.card_last4 ? `(•${inv.card_last4})` : ""}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-emerald-400 font-semibold">{inv.promo_code || "—"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          inv.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : inv.status === "refunded"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingInvoice({ ...inv })}
                        icon={<Edit className="w-3.5 h-3.5 text-slate-400 hover:text-white" />}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Update Invoice Status Modal */}
      <AnimatePresence>
        {editingInvoice && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Update Invoice Status</h3>
                <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateInvoiceStatus} className="space-y-4 text-xs">
                <div>
                  <p className="font-mono text-blue-400 font-bold">{editingInvoice.invoice_number}</p>
                  <p className="text-slate-300">
                    Customer: {editingInvoice.user_name} (${editingInvoice.total_paid})
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Transaction Status</label>
                  <select
                    value={editingInvoice.status}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value })}
                    className="w-full bg-[#0C1222] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none font-bold"
                  >
                    <option value="paid">paid</option>
                    <option value="refunded">refunded</option>
                    <option value="void">void</option>
                    <option value="pending">pending</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingInvoice(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Update Status
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
