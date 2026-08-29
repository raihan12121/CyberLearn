"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Globe,
  BookOpen,
  Bot,
  Trophy,
  ChevronRight,
  Users,
  FlaskConical,
  Swords,
  Star,
  ArrowRight,
  Zap,
  Award,
  Menu,
  X,
  Network,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ThemeToggle from "@/components/ui/ThemeToggle";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: BookOpen,
    title: "Structured Learning",
    desc: "Follow carefully designed learning paths from fundamentals to expert level.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Globe,
    title: "Interactive Labs",
    desc: "Practice with live HTTP Web Proxies, Attack Topology Graphs, and SOC Workbenches.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Bot,
    title: "AI Cyber Coach",
    desc: "Get instant help and personalized guidance powered by AI.",
    color: "text-secondary-light",
    bg: "bg-secondary/10",
  },
  {
    icon: Trophy,
    title: "Track Progress",
    desc: "Earn XP, badges, and certificates as you advance your skills.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

const stats = [
  { value: "10K+", label: "Hands-on Learners", icon: Users },
  { value: "500+", label: "Courses & Paths", icon: BookOpen },
  { value: "200+", label: "Interactive Labs", icon: FlaskConical },
  { value: "50K+", label: "Challenges Solved", icon: Swords },
];

const learningPaths = [
  { title: "Web Security", level: "Beginner", labs: 12, color: "from-primary to-primary-light" },
  { title: "Linux Mastery", level: "Intermediate", labs: 18, color: "from-accent to-accent-light" },
  { title: "Network Defense", level: "Advanced", labs: 15, color: "from-secondary to-secondary-light" },
  { title: "Ethical Hacking", level: "Expert", labs: 20, color: "from-warning to-warning-light" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">CyberLearn</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {["Courses", "Labs", "Challenges", "Community", "Pricing"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-[var(--radius)] text-foreground-secondary hover:text-foreground hover:bg-surface-elevated cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Sheet */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-border bg-surface px-4 py-4 space-y-4 overflow-hidden"
            >
              <div className="flex flex-col space-y-3">
                {["Courses", "Labs", "Challenges", "Community", "Pricing"].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors py-1"
                  >
                    {item}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col sm:hidden gap-2 pt-3 border-t border-border">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button variant="ghost" size="sm" className="w-full justify-center">Log In</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button size="sm" className="w-full justify-center">Sign Up</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <motion.section
        className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-6"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div variants={fadeUp}>
            <Badge variant="success" size="md" className="mb-6">
              <Zap className="w-3 h-3" /> Learn. Practice. Master.
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6"
          >
            Master Cybersecurity{" "}
            <span className="text-gradient">Through Hands-on</span>{" "}
            Practice
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg md:text-xl text-foreground-secondary max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            Interactive labs, real-world challenges, and AI-powered guidance to
            help you become a cybersecurity expert.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto justify-center" icon={<ArrowRight className="w-4 h-4" />}>
                Start Learning Now
              </Button>
            </Link>
            <Link href="/labs" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto justify-center" icon={<Globe className="w-4 h-4" />}>
                Explore Labs
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="py-6 px-6 border-y border-border bg-surface/50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 justify-center py-4"
              >
                <Icon className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-foreground-secondary">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features - Learn by Doing */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Learn by Doing
            </h2>
            <p className="text-foreground-secondary text-lg">
              Real skills come from real practice.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card hover padding="lg" className="h-full text-center group">
                    <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                      {feature.desc}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-24 px-6 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose Your Path
            </h2>
            <p className="text-foreground-secondary text-lg">
              Structured learning tracks from beginner to expert.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {learningPaths.map((path, i) => (
              <motion.div
                key={path.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card hover padding="none" className="overflow-hidden group">
                  <div className={`h-2 bg-gradient-to-r ${path.color}`} />
                  <div className="p-5">
                    <Badge
                      variant={
                        path.level === "Beginner"
                          ? "success"
                          : path.level === "Intermediate"
                          ? "primary"
                          : path.level === "Advanced"
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                      className="mb-3"
                    >
                      {path.level}
                    </Badge>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {path.title}
                    </h3>
                    <p className="text-sm text-foreground-secondary mb-4">
                      {path.labs} interactive labs
                    </p>
                    <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all duration-200">
                      <span>Start Learning</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Web Proxy & Security Tooling Preview */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Interactive Tooling. Real-World Defense.
            </h2>
            <p className="text-foreground-secondary text-lg">
              Intercept live HTTP payloads, analyze attack graphs, and parse SOC telemetry directly in your browser.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card padding="none" className="overflow-hidden glow-primary">
              {/* Proxy Inspector header */}
              <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-error/60" />
                    <span className="w-3 h-3 rounded-full bg-warning/60" />
                    <span className="w-3 h-3 rounded-full bg-accent/60" />
                  </div>
                  <span className="text-xs text-foreground-muted font-mono ml-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    proxy-repeater://target.cyberlearn.local:443/auth/login
                  </span>
                </div>
                <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                  INTERCEPT: ACTIVE
                </Badge>
              </div>
              {/* Proxy body */}
              <div className="bg-terminal-bg p-6 font-mono text-sm leading-7 min-h-[280px]">
                <p><span className="text-accent font-bold">POST</span> <span className="text-foreground">/api/v1/auth/admin-login HTTP/1.1</span></p>
                <p className="text-foreground-secondary">Host: api.cyberlearn.local</p>
                <p className="text-foreground-secondary">User-Agent: CyberLearn-SecurityProxy/3.2</p>
                <p className="text-foreground-secondary">Content-Type: application/json</p>
                <p className="text-foreground-muted">----------------------------------------</p>
                <p className="text-primary font-semibold">{`{ "username": "admin' OR 1=1--", "password": "any_password" }`}</p>
                <p className="text-foreground-muted">----------------------------------------</p>
                <p className="text-emerald-400 font-bold">HTTP/1.1 200 OK</p>
                <p className="text-foreground-secondary">Content-Type: application/json</p>
                <p className="text-amber-400 font-mono">{`{ "status": "authenticated", "role": "admin", "flag": "FLAG{web_proxy_sqli_bypassed_98a2}" }`}</p>
                <p className="pt-2 text-accent">
                  <span>Target server compromised. Capture flag ready for validation.</span>
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-surface/30" id="pricing">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h2>
            <p className="text-foreground-secondary text-lg">
              Start free, upgrade when you&apos;re ready.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card padding="lg" className="h-full flex flex-col">
                <h3 className="text-lg font-semibold text-foreground mb-1">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-foreground-muted text-sm">/month</span>
                </div>
                <p className="text-sm text-foreground-secondary mb-6">Get started with basics</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["Access to free courses", "5 lab sessions/month", "Basic challenges", "Community access"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground-secondary">
                        <Star className="w-4 h-4 text-accent shrink-0" />
                        {item}
                      </li>
                    )
                  )}
                </ul>
                <Button variant="outline" fullWidth>Get Started</Button>
              </Card>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card padding="lg" glow="primary" className="h-full flex flex-col relative border-primary/30">
                <Badge variant="primary" size="sm" className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
                <h3 className="text-lg font-semibold text-primary mb-1">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">$12</span>
                  <span className="text-foreground-muted text-sm">/month</span>
                </div>
                <p className="text-sm text-foreground-secondary mb-6">Everything in Free plus...</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Unlimited lab sessions",
                    "AI Coach full access",
                    "Certificates",
                    "Advanced challenges",
                    "Priority support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <Star className="w-4 h-4 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button fullWidth>Start Free Trial</Button>
              </Card>
            </motion.div>

            {/* Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card padding="lg" className="h-full flex flex-col">
                <h3 className="text-lg font-semibold text-secondary-light mb-1">Premium</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-foreground">$24</span>
                  <span className="text-foreground-muted text-sm">/month</span>
                </div>
                <p className="text-sm text-foreground-secondary mb-6">For serious learners & teams</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Pro",
                    "Custom learning paths",
                    "1-on-1 mentoring",
                    "Team analytics",
                    "Custom branding",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <Star className="w-4 h-4 text-secondary-light shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" fullWidth>Start Free Trial</Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Award className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-foreground-secondary text-lg mb-8">
              Join thousands of learners mastering cybersecurity today.
            </p>
            <Link href="/signup">
              <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Create Free Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">CyberLearn</span>
            </div>
            <p className="text-sm text-foreground-secondary">
              Master cybersecurity through hands-on practice and AI-guided learning.
            </p>
          </div>
          {[
            { title: "Platform", links: ["Courses", "Labs", "Challenges", "Pricing"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground text-sm mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-foreground-muted">
            © 2024 CyberLearn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
