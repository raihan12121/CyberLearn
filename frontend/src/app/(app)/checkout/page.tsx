"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowLeft,
  FlaskConical,
  BookOpen,
  Award,
  Sparkles,
  Printer,
  ChevronRight,
  HelpCircle,
  Globe,
  Tag,
  Wallet,
  Clock,
  Infinity as InfinityIcon,
  Check,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api, getAuthToken, setAuthToken, removeAuthToken } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";
import Link from "next/link";

interface PlanConfig {
  name: string;
  title: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

const PLANS: Record<string, PlanConfig> = {
  pro: {
    name: "Pro",
    title: "CyberLearn Pro All-Access",
    tagline: "Unlocks every course video, syllabus, quizzes, and hands-on practice labs.",
    monthlyPrice: 12.00,
    annualPrice: 120.00,
    features: [
      "Full access to 10+ Complete Security Courses",
      "Unlimited Hands-on Security Labs & CTF Challenges",
      "Live HTTP Proxy & Wireshark Log Workbenches",
      "AI Socratic Tutor with Infinite Hints",
      "Verified Course Credentials & Diplomas",
    ],
  },
  premium: {
    name: "Premium",
    title: "CyberLearn Premium Enterprise",
    tagline: "For professional red teamers, cohort leaders, and teams.",
    monthlyPrice: 24.00,
    annualPrice: 240.00,
    features: [
      "Everything in Pro Tier Included",
      "1-on-1 Monthly Mentorship & Career Guidance",
      "Custom Private Cohort Batches & LMS Sync",
      "Advanced SOC Team Analytics & Leaderboard Badging",
      "Priority VIP Support & Custom CTF Scenarios",
    ],
  },
};

const DURATION_OPTIONS = [
  { months: 1, label: "1 Month", proPrice: 12.00, premiumPrice: 24.00, discountNote: "Standard monthly" },
  { months: 2, label: "2 Months", proPrice: 22.00, premiumPrice: 44.00, discountNote: "Save $2 (Popular)" },
  { months: 3, label: "3 Months (Quarterly)", proPrice: 30.00, premiumPrice: 60.00, discountNote: "Save $6" },
  { months: 6, label: "6 Months", proPrice: 58.00, premiumPrice: 116.00, discountNote: "Save $14" },
  { months: 12, label: "12 Months (Annual)", proPrice: 120.00, premiumPrice: 240.00, discountNote: "Best Value (Save $24)" },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, fetchUser } = useAuthStore();

  // Query Params
  const typeQuery = searchParams.get("type")?.toLowerCase() || (searchParams.get("courseId") ? "course_lifetime" : "subscription");
  const planQuery = searchParams.get("plan")?.toLowerCase() || "pro";
  const courseIdQuery = searchParams.get("courseId") || "";
  const monthsQuery = parseInt(searchParams.get("months") || "1", 10);

  // Mode Selection
  const [purchaseType, setPurchaseType] = useState<"subscription" | "course_lifetime">(
    typeQuery === "course_lifetime" ? "course_lifetime" : "subscription"
  );
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>(PLANS[planQuery] ? planQuery : "pro");
  const [durationMonths, setDurationMonths] = useState<number>(monthsQuery || 1);
  const [targetCourse, setTargetCourse] = useState<any | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  const plan = PLANS[selectedPlanKey] || PLANS.pro;

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "paypal" | "google_pay" | "crypto">("credit_card");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardholderName, setCardholderName] = useState(user?.full_name || "Alex Vance");
  const [expiryDate, setExpiryDate] = useState("12/28");
  const [cvc, setCvc] = useState("789");
  const [billingCountry, setBillingCountry] = useState("United States");
  const [billingZip, setBillingZip] = useState("94103");

  // Promo Engine States
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount_pct: number;
    discount_amount: number;
    message: string;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Processing & Success States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("Initializing secure channel...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Load Course detail if purchasing course lifetime
  useEffect(() => {
    if (courseIdQuery) {
      setLoadingCourse(true);
      api.getCourse(courseIdQuery)
        .then((data) => {
          setTargetCourse(data);
          setPurchaseType("course_lifetime");
        })
        .catch(() => {})
        .finally(() => setLoadingCourse(false));
    }
  }, [courseIdQuery]);

  // Compute Base Price
  const getBasePrice = () => {
    if (purchaseType === "course_lifetime") {
      return targetCourse?.price ? Number(targetCourse.price) : 49.00;
    }
    const opt = DURATION_OPTIONS.find((d) => d.months === durationMonths) || DURATION_OPTIONS[0];
    return selectedPlanKey === "premium" ? opt.premiumPrice : opt.proPrice;
  };

  const basePrice = getBasePrice();
  const discountAmount = appliedPromo ? Number((basePrice * (appliedPromo.discount_pct / 100)).toFixed(2)) : 0;
  const finalPrice = Math.max(0, Number((basePrice - discountAmount).toFixed(2)));

  // Auto-format card number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumber(formatted);
  };

  // Auto-format expiry date MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setExpiryDate(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiryDate(raw);
    }
  };

  // Card brand detection
  const detectBrand = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (clean.startsWith("5")) return "MASTERCARD";
    if (clean.startsWith("34") || clean.startsWith("37")) return "AMEX";
    if (clean.startsWith("6")) return "DISCOVER";
    return "CARD";
  };

  // Validate Promo Code
  const handleApplyPromo = async (codeToTry?: string) => {
    const code = (codeToTry || promoInput).trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);

    try {
      const res = await api.validatePromoCode({
        promo_code: code,
        purchase_type: purchaseType,
        plan_name: plan.name,
        duration_months: durationMonths,
        course_id: targetCourse?.id,
      });
      setAppliedPromo({
        code: res.promo_code,
        discount_pct: res.discount_pct,
        discount_amount: res.discount_amount,
        message: res.message,
      });
      setPromoInput(code);
    } catch (err: any) {
      setAppliedPromo(null);
      setPromoError(err.message || "Invalid or expired promotional code.");
    } finally {
      setPromoLoading(false);
    }
  };

  // Quick Autofill Helpers
  const autofillTestCard = (type: "success" | "decline") => {
    if (type === "success") {
      setCardNumber("4242 4242 4242 4242");
      setExpiryDate("12/29");
      setCvc("789");
      setErrorMessage(null);
    } else {
      setCardNumber("4242 4242 4242 0002");
      setExpiryDate("12/29");
      setCvc("789");
      setErrorMessage(null);
    }
  };

  // Helper to ensure authentication before payment
  const ensureAuthenticated = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      throw new Error("Please sign in to complete your checkout.");
    }
  };

  // Helper to run payment with specific parameters
  const executePayment = async (cardNumOverride?: string, expOverride?: string, cvcOverride?: string) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      await ensureAuthenticated();
    } catch (err: any) {
      setIsProcessing(false);
      return;
    }

    const activeCard = cardNumOverride || cardNumber;
    const activeExp = expOverride || expiryDate;
    const activeCvc = cvcOverride || cvc;

    const [expMonthStr, expYearStr] = activeExp.split("/");
    const expMonth = parseInt(expMonthStr, 10) || 12;
    const expYear = 2000 + (parseInt(expYearStr, 10) || 29);

    try {
      setProcessingStep("Verifying 256-bit TLS connection & authorization tokens...");
      await new Promise((r) => setTimeout(r, 500));

      setProcessingStep("Conducting 3D Secure bank authorization handshake...");
      await new Promise((r) => setTimeout(r, 500));

      setProcessingStep("Minting entitlements & generating digital invoice receipt...");
      const res = await api.processPayment({
        purchase_type: purchaseType,
        plan_name: plan.name,
        duration_months: durationMonths,
        course_id: purchaseType === "course_lifetime" ? (targetCourse?.id || courseIdQuery) : undefined,
        billing_period: durationMonths === 12 ? "annually" : `${durationMonths}-months`,
        payment_method: paymentMethod,
        card_number: paymentMethod === "credit_card" ? activeCard.replace(/\s+/g, "") : undefined,
        card_exp_month: paymentMethod === "credit_card" ? expMonth : undefined,
        card_exp_year: paymentMethod === "credit_card" ? expYear : undefined,
        card_cvc: paymentMethod === "credit_card" ? activeCvc : undefined,
        cardholder_name: cardholderName,
        billing_country: billingCountry,
        billing_zip: billingZip,
        promo_code: appliedPromo?.code,
      });

      await fetchUser(true);
      setSuccessResult({
        ...res,
        invoice: res.invoice || {
          invoice_number: `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          purchase_type: purchaseType,
          plan_tier: purchaseType === "course_lifetime" ? "lifetime" : plan.name.toLowerCase(),
          billing_cycle: purchaseType === "course_lifetime" ? "lifetime" : `${durationMonths}-months`,
          total_paid: finalPrice,
          discount_amount: discountAmount,
          card_last4: activeCard.slice(-4) || "4242",
          card_brand: detectBrand(activeCard).toLowerCase(),
          created_at: new Date().toISOString(),
        }
      });
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("Could not validate credentials") || msg.includes("401") || msg.includes("Unauthorized")) {
        setErrorMessage("Your login session has expired. Please sign in or click '⚡ 1-Click Instant Demo Unlock' to re-authenticate and complete your checkout.");
      } else {
        setErrorMessage(msg || "Payment authorization failed. Please verify your details or use a different card.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Final Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await executePayment();
  };

  const handleInstantDemoUnlock = async () => {
    setPaymentMethod("credit_card");
    setCardNumber("4242 4242 4242 4242");
    setExpiryDate("12/29");
    setCvc("789");
    await executePayment("4242 4242 4242 4242", "12/29", "789");
  };

  // SUCCESS CONFIRMATION / DIGITAL INVOICE RECEIPT
  if (successResult) {
    const inv = successResult.invoice;
    const isLifetime = purchaseType === "course_lifetime";

    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-success/15 border border-success/30 text-success shadow-xl">
            <CheckCircle2 className="w-12 h-12 text-success animate-bounce" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            {isLifetime ? "Course Lifetime Access Unlocked!" : "All-Access Subscription Activated!"}
          </h1>
          <p className="text-sm text-foreground-secondary max-w-md mx-auto">
            {isLifetime
              ? `You now own lifetime access to '${targetCourse?.title || successResult.course_title || "your course"}'. All video lessons, quizzes, and certificates are permanently unlocked.`
              : `Your ${plan.name} membership is active for ${durationMonths} month(s). All security courses and interactive practice labs are ready.`}
          </p>
        </motion.div>

        {/* Digital Receipt Card */}
        <Card padding="lg" className="border-success/30 bg-surface-elevated/50 space-y-6 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/70 gap-2">
            <div>
              <p className="text-[11px] font-mono uppercase text-foreground-muted">Official Transaction Receipt</p>
              <h3 className="text-lg font-bold text-foreground">{inv.invoice_number}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="md">
                {isLifetime ? "Lifetime Owned" : "Active Subscription"}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />}>
                Print Receipt
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-foreground-muted block">Purchase Type</span>
              <span className="font-bold text-foreground capitalize">
                {isLifetime ? "Course Lifetime" : `${plan.name} Plan`}
              </span>
            </div>
            <div>
              <span className="text-foreground-muted block">Access Duration</span>
              <span className="font-bold text-foreground">
                {isLifetime ? "Permanent Lifetime" : `${durationMonths} Month(s)`}
              </span>
            </div>
            <div>
              <span className="text-foreground-muted block">Payment Method</span>
              <span className="font-bold text-foreground uppercase font-mono">
                {inv.card_brand || "CARD"} •••• {inv.card_last4 || "4242"}
              </span>
            </div>
            <div>
              <span className="text-foreground-muted block">Date</span>
              <span className="font-bold text-foreground">
                {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "Today"}
              </span>
            </div>
          </div>

          {/* Itemized breakdown table */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 text-foreground-secondary">
              <span>
                {isLifetime
                  ? `Lifetime Access: ${targetCourse?.title || successResult.course_title || "Course"}`
                  : `CyberLearn ${plan.name} (${durationMonths} Month All-Access)`}
              </span>
              <span>${basePrice.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-400 font-semibold">
                <span>Promo Discount ({appliedPromo?.code || "APPLIED"})</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-foreground-secondary">
              <span>Sales Tax / VAT (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-bold text-base text-foreground">
              <span>Total Paid</span>
              <span className="text-primary">${finalPrice.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Next Steps CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {isLifetime && targetCourse ? (
              <Link href={`/courses/${targetCourse.id}`} className="w-full sm:flex-1">
                <Button variant="primary" fullWidth size="lg" icon={<BookOpen className="w-4 h-4" />}>
                  Launch Unlocked Course
                </Button>
              </Link>
            ) : (
              <Link href="/courses" className="w-full sm:flex-1">
                <Button variant="primary" fullWidth size="lg" icon={<BookOpen className="w-4 h-4" />}>
                  Explore All Courses
                </Button>
              </Link>
            )}
            <Link href="/labs" className="w-full sm:flex-1">
              <Button variant="outline" fullWidth size="lg" icon={<FlaskConical className="w-4 h-4" />}>
                Launch Practice Labs
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push(targetCourse ? `/courses/${targetCourse.id}` : "/pricing")} icon={<ArrowLeft className="w-4 h-4" />}>
          {targetCourse ? `Back to ${targetCourse.title}` : "Back to Pricing"}
        </Button>
        <div className="flex items-center gap-2 text-xs font-mono text-foreground-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
      </div>

      {/* Mode Switcher Banner if coming from a course */}
      {targetCourse && (
        <div className="p-3 bg-surface-elevated/70 border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground-muted">Selected Item</span>
              <h3 className="text-sm font-bold text-foreground">{targetCourse.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPurchaseType("course_lifetime")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                purchaseType === "course_lifetime"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-foreground-secondary hover:text-foreground border border-border"
              }`}
            >
              Lifetime Course ($49)
            </button>
            <button
              type="button"
              onClick={() => setPurchaseType("subscription")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                purchaseType === "subscription"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface text-foreground-secondary hover:text-foreground border border-border"
              }`}
            >
              All-Access Sub ($12/mo)
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Payment Method & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Payment Details</h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Select your preferred payment method and enter your billing details.
              </p>
            </div>

            {/* Guest / Unauthenticated Session Banner */}
            {!user && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-200">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Sign In Required to Link Your Purchase</span>
                </div>
                <p className="text-amber-200/80 leading-relaxed">
                  You are currently browsing as a guest (or your session expired). Sign in or use the 1-click Demo Sign In to link your course/subscription to your profile.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={ensureAuthenticated}
                    className="px-3 py-1 bg-amber-400 text-black font-bold text-xs rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    ⚡ 1-Click Sign In as Demo Student
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/checkout")}`)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg border border-white/20 transition-colors cursor-pointer"
                  >
                    Go to Sign In →
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "credit_card", label: "Credit Card", icon: CreditCard },
                { id: "paypal", label: "PayPal", icon: Wallet },
                { id: "google_pay", label: "Google Pay", icon: Zap },
                { id: "crypto", label: "Crypto / Web3", icon: Globe },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40"
                        : "border-border bg-surface-elevated/40 text-foreground-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Test Card Quick Shortcuts */}
            <div className="p-3.5 bg-surface-elevated/70 border border-primary/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  Testing &amp; Evaluation Mode
                </span>
                <span className="text-[10px] text-foreground-muted">Instant Authorization</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstantDemoUnlock}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-black hover:opacity-90 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  ⚡ 1-Click Instant Demo Unlock
                </button>
                {paymentMethod === "credit_card" && (
                  <>
                    <button
                      type="button"
                      onClick={() => autofillTestCard("success")}
                      className="px-2.5 py-1.5 text-[11px] font-mono rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors cursor-pointer"
                    >
                      💳 Fill Valid Card (4242...)
                    </button>
                    <button
                      type="button"
                      onClick={() => autofillTestCard("decline")}
                      className="px-2.5 py-1.5 text-[11px] font-mono rounded bg-error/10 hover:bg-error/20 text-error border border-error/30 transition-colors cursor-pointer"
                    >
                      ⚠️ Test Declined Card (0002)
                    </button>
                  </>
                )}
              </div>
              <p className="text-[11px] text-foreground-secondary leading-snug">
                For manual input, use test card <code className="text-primary font-mono font-bold">4242 4242 4242 4242</code>, expiry <code className="text-primary font-mono font-bold">12/29</code>, CVC <code className="text-primary font-mono font-bold">789</code>.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-medium space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
                <div className="pl-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      autofillTestCard("success");
                      setErrorMessage(null);
                    }}
                    className="underline text-[11px] font-bold text-foreground hover:text-primary cursor-pointer"
                  >
                    👉 Autofill valid test card (4242...)
                  </button>
                  <button
                    type="button"
                    onClick={handleInstantDemoUnlock}
                    className="px-2.5 py-1 rounded-md bg-primary text-black font-bold text-[11px] hover:opacity-90 cursor-pointer shadow"
                  >
                    ⚡ Auto-Login &amp; 1-Click Unlock
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {paymentMethod === "credit_card" ? (
                <>
                  {/* Card Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex justify-between">
                      <span>Card Number</span>
                      <span className="text-primary font-mono text-[10px] font-bold">{detectBrand(cardNumber)}</span>
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="Alex Vance"
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Expiry and CVC */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Expiration Date</label>
                      <input
                        type="text"
                        required
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">CVC / Security Code</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                        placeholder="789"
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Country and Postal Code */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Country</label>
                      <select
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Germany">Germany</option>
                        <option value="Australia">Australia</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="India">India</option>
                        <option value="Other">Other Region</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Billing Postal Code</label>
                      <input
                        type="text"
                        required
                        value={billingZip}
                        onChange={(e) => setBillingZip(e.target.value)}
                        placeholder="94103"
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-mono text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Express Wallet Simulation Box */
                <div className="py-8 text-center space-y-3 bg-surface-elevated/40 border border-border rounded-xl p-4">
                  <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-foreground capitalize">
                    {paymentMethod.replace("_", " ")} 1-Click Instant Express Authorization
                  </p>
                  <p className="text-[11px] text-foreground-muted max-w-sm mx-auto">
                    Click the button below to authorize the secure token via your {paymentMethod.replace("_", " ")} client.
                  </p>
                </div>
              )}

              {/* Security guarantee line */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-foreground-muted">
                <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Your transaction is encrypted and processed via PCI-DSS compliant infrastructure.</span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isProcessing}
                className="font-bold shadow-xl"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{processingStep}</span>
                  </span>
                ) : (
                  <span>Authorize &amp; Pay ${finalPrice.toFixed(2)} USD</span>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: Order Summary & Promo Code (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg" glow="primary" className="border-primary/40 space-y-6">
            {purchaseType === "course_lifetime" && targetCourse ? (
              /* Course Lifetime Summary */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-bold">Lifetime Ownership</span>
                    <h3 className="text-xl font-extrabold text-foreground">{targetCourse.title}</h3>
                  </div>
                  <Badge variant="success" size="sm">Lifetime</Badge>
                </div>

                <div className="space-y-2.5 text-xs text-foreground-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Permanent access to all video lectures and syllabi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>All interactive quizzes and practice exams</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Verifiable Course Completion Certificate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>Buy once, own forever — no recurring fees</span>
                  </div>
                </div>
              </div>
            ) : (
              /* All-Access Subscription Summary */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">All-Access Pass</span>
                    <h3 className="text-xl font-extrabold text-foreground">{plan.title}</h3>
                  </div>
                  <Badge variant="primary" size="sm">{durationMonths} Mo Pass</Badge>
                </div>

                {/* Plan Tier Switcher */}
                <div className="flex gap-2 p-1 bg-surface-elevated rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanKey("pro")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      selectedPlanKey === "pro" ? "bg-primary text-white shadow-sm" : "text-foreground-secondary hover:text-foreground"
                    }`}
                  >
                    Pro Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanKey("premium")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      selectedPlanKey === "premium" ? "bg-primary text-white shadow-sm" : "text-foreground-secondary hover:text-foreground"
                    }`}
                  >
                    Premium Plan
                  </button>
                </div>

                {/* Duration Picker Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-foreground">Select Access Duration:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DURATION_OPTIONS.map((opt) => {
                      const active = durationMonths === opt.months;
                      const price = selectedPlanKey === "premium" ? opt.premiumPrice : opt.proPrice;
                      return (
                        <button
                          key={opt.months}
                          type="button"
                          onClick={() => setDurationMonths(opt.months)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                            active
                              ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-sm"
                              : "border-border bg-surface-elevated/40 text-foreground-secondary hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{opt.label}</span>
                            <span className="text-primary font-mono">${price}</span>
                          </div>
                          <span className="text-[10px] text-foreground-muted block mt-0.5">{opt.discountNote}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Unlocked Features List */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-xs font-bold text-foreground">All-Access Includes:</span>
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-xs text-foreground-secondary">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promo Code Engine */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-accent" />
                <span>Promotional Discount Code</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. CYBER2026)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono uppercase text-foreground focus:outline-none focus:border-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={promoLoading || !promoInput.trim()}
                  onClick={() => handleApplyPromo()}
                >
                  {promoLoading ? "Checking..." : "Apply"}
                </Button>
              </div>

              {/* Clickable Promo Code Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["CYBER2026", "STUDENT20", "HACKER100"].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleApplyPromo(code)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 transition-all cursor-pointer"
                  >
                    🏷️ {code}
                  </button>
                ))}
              </div>

              {appliedPromo && (
                <div className="p-2.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-medium flex items-center justify-between">
                  <span>🎉 {appliedPromo.message}</span>
                  <button
                    type="button"
                    onClick={() => setAppliedPromo(null)}
                    className="text-[10px] text-foreground-muted hover:text-foreground underline ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}

              {promoError && (
                <p className="text-[11px] text-error font-medium">{promoError}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 pt-4 border-t border-border text-xs">
              <div className="flex justify-between text-foreground-secondary">
                <span>Subtotal</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Discount ({appliedPromo?.discount_pct}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-foreground-secondary">
                <span>Estimated Tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border text-base font-extrabold text-foreground">
                <span>Total Due Today</span>
                <span className="text-primary text-xl font-mono">${finalPrice.toFixed(2)} USD</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-foreground-muted">Loading secure checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
