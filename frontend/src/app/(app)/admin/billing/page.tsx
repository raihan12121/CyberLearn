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
  CheckCircle2,
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
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-surface border border-rose-500/30 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm shadow-emerald-500/10">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Financials & Billing Ledger</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Settled Transactions
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Review revenue breakdown, manage active subscription counters, and inspect transaction invoices.
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

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" hover className="bg-surface border-border flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-foreground-muted text-[11px] font-bold uppercase tracking-wider mb-1">
                Net Settled Revenue
              </p>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                ${(financialsData.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Gross: ${(financialsData.gross_revenue || 0).toLocaleString()}
          </span>
        </Card>

        <Card padding="md" hover className="bg-surface border-border flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-foreground-muted text-[11px] font-bold uppercase tracking-wider mb-1">
                Active Pro Subscriptions
              </p>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                {financialsData.paid_subscriptions_count || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-foreground-muted">Recurring Monthly / Annual</span>
        </Card>

        <Card padding="md" hover className="bg-surface border-border flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-foreground-muted text-[11px] font-bold uppercase tracking-wider mb-1">
                Lifetime Course Passes
              </p>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                {financialsData.lifetime_course_purchases_count || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-foreground-muted">Permanent Access Passes</span>
        </Card>

        <Card padding="md" hover className="bg-surface border-border flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-foreground-muted text-[11px] font-bold uppercase tracking-wider mb-1">
                Refunds & Chargebacks
              </p>
              <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                ${(financialsData.refunded_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-foreground-muted">Dispute rate &lt; 0.1%</span>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative bg-surface p-3 rounded-xl border border-border">
        <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-foreground-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search invoices by invoice number, customer name, email, or promo code..."
          className="w-full bg-surface-elevated border border-border rounded-lg pl-10 pr-4 py-2 text-xs text-foreground placeholder-foreground-muted focus:outline-none focus:border-sky-400"
        />
      </div>

      {/* Invoices Table */}
      <Card padding="none" className="border border-border bg-surface shadow-lg overflow-hidden space-y-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-surface-elevated text-foreground-muted font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item / Product</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-foreground-muted">
                    No transactions matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-foreground">{inv.user_name}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{inv.user_email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{inv.item_name}</p>
                      {inv.promo_code && (
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          PROMO: {inv.promo_code}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      ${(inv.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          inv.status === "paid"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : inv.status === "refunded"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground-muted text-[11px]">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingInvoice({ ...inv })}
                        icon={<Edit className="w-3.5 h-3.5 text-foreground-muted hover:text-sky-400" />}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Invoice Status Modal */}
      <AnimatePresence>
        {editingInvoice && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground">Update Transaction Status</h3>
                <button onClick={() => setEditingInvoice(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateInvoiceStatus} className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-surface-elevated border border-border space-y-1">
                  <p className="font-mono font-bold text-sky-400">{editingInvoice.invoice_number}</p>
                  <p className="font-bold text-foreground">{editingInvoice.item_name}</p>
                  <p className="text-foreground-muted">Customer: {editingInvoice.user_name} ({editingInvoice.user_email})</p>
                  <p className="font-mono font-bold text-foreground">Amount: ${editingInvoice.amount}</p>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Transaction Settlement Status</label>
                  <select
                    value={editingInvoice.status}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none font-bold"
                  >
                    <option value="paid">Paid (Settled)</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed / Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingInvoice(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Status
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
