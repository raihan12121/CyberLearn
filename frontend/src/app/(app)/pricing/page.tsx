"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Star,
  Award,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";

const faqs = [
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel your subscription at any time from your settings page. You will retain access until the end of your billing cycle." },
  { q: "What's the difference between Pro and Premium?", a: "Pro gives you full unlimited access to all courses, labs, and the AI coach. Premium adds team analytics reports, custom learning pathways, and 1-on-1 monthly mentoring sessions." },
  { q: "Are lab sandboxes safe to run?", a: "Absolutely. All labs run inside isolated Docker containers on our secure cloud server. They cannot interact with your local device or network." },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("monthly");

  const plans = [
    {
      name: "Free",
      price: 0,
      desc: "Perfect for getting started with cyber safety basics.",
      features: ["Access to 5 beginner labs", "Basic vulnerability courses", "Community forum access", "Standard badge earning"],
      badge: "Starter",
      variant: "outline" as const,
      color: "text-foreground-secondary",
    },
    {
      name: "Pro",
      price: billingPeriod === "monthly" ? 12 : 10,
      desc: "For intermediate learners pursuing career readiness.",
      features: ["Unlimited sandbox labs", "Full access to AI Coach", "Course completion certificates", "Advanced CTF challenges", "Priority discord support"],
      badge: "Most Popular",
      variant: "primary" as const,
      glow: "primary" as const,
      color: "text-primary",
    },
    {
      name: "Premium",
      price: billingPeriod === "monthly" ? 24 : 20,
      desc: "For professionals, organizations, and team leaders.",
      features: ["Everything in Pro plan", "1-on-1 monthly mentoring", "Custom team learning paths", "Comprehensive team analytics", "White-labeled dashboards"],
      badge: "Enterprise",
      variant: "secondary" as const,
      color: "text-secondary-light",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <Badge variant="primary" size="md">Pricing Plans</Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Flexible Plans for Every Stage</h1>
        <p className="text-foreground-secondary text-sm max-w-lg mx-auto leading-relaxed">
          Upgrade to a Pro or Premium plan to unlock unlimited interactive sandbox labs, certificates, and personal coaching.
        </p>

        {/* Period toggle switch */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-xs font-bold ${billingPeriod === "monthly" ? "text-primary" : "text-foreground-muted"}`}>Monthly</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annually" : "monthly")}
            className="w-12 h-6 bg-surface-elevated rounded-full border border-border flex items-center p-0.5 cursor-pointer relative"
          >
            <div className={`w-4 h-4 bg-primary rounded-full transition-transform duration-200 ${billingPeriod === "annually" ? "translate-x-6" : ""}`} />
          </button>
          <span className={`text-xs font-bold ${billingPeriod === "annually" ? "text-primary" : "text-foreground-muted"} flex items-center gap-1`}>
            Annually <Badge variant="success" size="sm" className="py-0 px-1.5 text-[9px]">-15%</Badge>
          </span>
        </div>
      </motion.div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-4">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              padding="lg"
              glow={plan.glow || false}
              className={`h-full flex flex-col justify-between relative border ${
                plan.glow ? "border-primary/30" : "border-border"
              }`}
            >
              {plan.badge === "Most Popular" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="primary" size="sm">Most Popular</Badge>
                </div>
              )}

              <div>
                <h3 className={`text-lg font-bold ${plan.color} mb-1`}>{plan.name}</h3>
                <p className="text-xs text-foreground-muted font-normal leading-relaxed mb-6">{plan.desc}</p>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">${plan.price}</span>
                  <span className="text-xs text-foreground-secondary">/{billingPeriod === "monthly" ? "mo" : "mo, billed annually"}</span>
                </div>

                <div className="space-y-3.5 mb-8">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-foreground-secondary font-semibold">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant={plan.variant}
                fullWidth
                onClick={() => alert(`Simulated checkout started for: ${plan.name} (${billingPeriod})`)}
              >
                {plan.name === "Free" ? "Get Started" : "Start Free Trial"}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* FAQ Accordion Section */}
      <div className="pt-12 border-t border-border">
        <h2 className="text-xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {faqs.map((faq, i) => (
            <Card key={i} padding="lg">
              <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                {faq.q}
              </h4>
              <p className="text-xs text-foreground-secondary font-normal leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
