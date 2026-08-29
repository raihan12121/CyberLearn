"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Trash2,
  Check,
  Smartphone,
  Palette,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  CreditCard,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuthStore, isUserSubscribed } from "@/lib/authStore";
import { useTheme, ThemeMode } from "@/lib/theme";
import Link from "next/link";

export default function SettingsPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState("profile");

  // Theme state from hook
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Passwords Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications state
  const [emailNotif, setEmailNotif] = useState(true);
  const [labAlerts, setLabAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);

  // Subscription & Invoices state
  const { user, fetchUser, setUser } = useAuthStore();
  const [subLoading, setSubLoading] = useState(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Load profile on mount
  useEffect(() => {
    api.getMe()
      .then((data) => {
        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setUsername(data.username || data.email.split("@")[0]);
          setAvatarUrl(data.avatar_url || "");
          setBio(data.bio || "");
        }
      })
      .catch((err) => console.error("Error fetching profile settings:", err));

    api.getInvoices()
      .then((invList) => {
        if (Array.isArray(invList)) setInvoices(invList);
      })
      .catch(() => {});

    api.getMyPurchasedCourses()
      .then((coursesList) => {
        if (Array.isArray(coursesList)) setPurchasedCourses(coursesList);
      })
      .catch(() => {});
  }, []);

  // Debounced username checking
  useEffect(() => {
    if (!username || (user && username === user.username)) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const clean = username.trim();
    if (clean.length < 3) {
      setUsernameAvailable(false);
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(clean)) {
      setUsernameAvailable(false);
      setUsernameError("Only letters, numbers, underscores, and hyphens allowed");
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await api.checkUsernameAvailability(clean);
        setUsernameAvailable(res.available);
        if (!res.available) setUsernameError(res.message);
        else setUsernameError(null);
      } catch {
        setUsernameAvailable(true);
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, user]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Selected photo exceeds the 5MB file size limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatarUrl(base64);
        try {
          const updated = await api.uploadAvatar(base64);
          setUser(updated);
          setProfileMessage({ type: "success", text: "Profile picture uploaded successfully!" });
        } catch (err: any) {
          console.warn("Avatar upload failed:", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl("");
    try {
      const updated = await api.removeAvatar();
      setUser(updated);
      setProfileMessage({ type: "success", text: "Profile picture removed successfully." });
    } catch (err: any) {
      console.warn("Avatar removal failed:", err);
    }
  };

  const handleCancelSub = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? Courses and interactive practice labs will be locked.")) {
      return;
    }
    setSubLoading(true);
    setSubMessage(null);
    try {
      const res = await api.cancelSubscription();
      await fetchUser(true);
      setSubMessage(res.message || "Subscription canceled.");
    } catch (err: any) {
      setSubMessage("Error canceling subscription: " + err.message);
    } finally {
      setSubLoading(false);
    }
  };

  // Profile Saving
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || usernameAvailable === false) {
      alert("Please resolve the username error before saving.");
      return;
    }

    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const updated = await api.updateProfile({
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        avatar_url: avatarUrl || "remove",
        bio: bio.trim(),
      });
      setUser(updated);
      await fetchUser(true);
      setProfileMessage({ type: "success", text: "Profile settings saved successfully!" });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to update profile settings." });
    } finally {
      setProfileSaving(false);
    }
  };

  // Password Update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Error: Passwords do not match!");
      return;
    }
    api.updatePassword({ current_password: currentPassword, new_password: newPassword })
      .then(() => {
        alert("Success: Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch((err) => {
        alert("Error updating password: " + err.message);
      });
  };

  const themeOptions: {
    id: ThemeMode;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    previewBg: string;
    previewSurface: string;
    previewBorder: string;
    previewText: string;
  }[] = [
    {
      id: "dark",
      name: "Cyber Dark",
      description: "Deep obsidian backdrop with glowing emerald neon accents, optimized for night sessions & CTF hacking.",
      icon: Moon,
      accentColor: "text-emerald-400",
      previewBg: "bg-[#0D0E11]",
      previewSurface: "bg-[#16181D]",
      previewBorder: "border-white/10",
      previewText: "text-white",
    },
    {
      id: "light",
      name: "Cyber Light",
      description: "Crisp slate aesthetic with high-contrast emerald & amber highlights, engineered for daylight readability.",
      icon: Sun,
      accentColor: "text-amber-500",
      previewBg: "bg-[#F8FAFC]",
      previewSurface: "bg-white",
      previewBorder: "border-slate-200",
      previewText: "text-slate-900",
    },
    {
      id: "system",
      name: "System Sync",
      description: "Automatically matches your operating system preference and seamlessly switches between day and night.",
      icon: Monitor,
      accentColor: "text-primary",
      previewBg: "bg-gradient-to-r from-[#0D0E11] to-[#F8FAFC]",
      previewSurface: "bg-surface",
      previewBorder: "border-border",
      previewText: "text-foreground",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground font-sans">Settings</h1>
        <p className="text-foreground-secondary text-sm mt-1">
          Manage your account preferences, appearance, security credentials, and email notifications.
        </p>
      </motion.div>

      {/* Main Grid Layout split (Sidebar nav + active form card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Sub-navigation (3 cols) */}
        <div className="lg:col-span-3 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: "profile", label: "My Profile", icon: User },
            { id: "subscription", label: "Subscription & Billing", icon: CreditCard },
            { id: "appearance", label: "Appearance & Theme", icon: Palette },
            { id: "security", label: "Security & MFA", icon: Shield },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2.5 px-4 py-2.5 sm:py-3 rounded-[var(--radius)] text-left text-xs font-semibold shrink-0 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-b-2 lg:border-b-0 lg:border-l-2 border-primary text-primary"
                    : "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configurations Forms Content (9 cols) */}
        <div className="lg:col-span-9">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <Card padding="lg" className="space-y-6">
              <div className="border-b border-border pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Profile &amp; Operative Identity</h3>
                  <p className="text-xs text-foreground-secondary">Manage your public avatar photo, legal certificate name, and unique hacker handle.</p>
                </div>
              </div>

              {profileMessage && (
                <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                  profileMessage.type === "success"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/15 text-red-400 border border-red-500/30"
                }`}>
                  {profileMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              {/* Avatar upload & removal controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-surface-elevated/60 border border-border">
                <Avatar src={avatarUrl} name={fullName || username} size="xl" className="w-20 h-20 shadow-md ring-2 ring-primary/30" />
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarFileUpload}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-bold text-xs"
                    >
                      <span>Upload New Photo</span>
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        <span>Remove Photo</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Supports Google account photo, PNG, JPG, or WEBP up to 5MB. Removing reverts to initials.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase font-mono tracking-wider">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <p className="text-[10px] text-foreground-muted">Printed on official course certificates and diplomas.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase font-mono tracking-wider">
                      Unique Hacker Handle / Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-muted font-mono text-xs">
                        @
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        maxLength={25}
                        placeholder="e.g. shadow_phantom"
                        className={`w-full bg-surface-elevated border rounded-xl pl-7 pr-8 py-2.5 text-xs font-mono text-foreground focus:outline-none transition-all ${
                          usernameAvailable === true
                            ? "border-emerald-500/60 ring-1 ring-emerald-500/30"
                            : usernameAvailable === false
                            ? "border-red-500/60 ring-1 ring-red-500/30"
                            : "border-border focus:border-primary"
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {isCheckingUsername ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : usernameAvailable === true ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : usernameAvailable === false ? (
                          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        ) : null}
                      </div>
                    </div>
                    {usernameError && (
                      <p className="text-[10px] text-red-400 font-semibold">{usernameError}</p>
                    )}
                    {usernameAvailable === true && (
                      <p className="text-[10px] text-emerald-400 font-semibold">✓ Handle is available!</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase font-mono tracking-wider">
                    Operative Bio &amp; Mission Statement
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio displayed on your public cybersecurity portfolio..."
                    maxLength={160}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                  />
                  <div className="text-right text-[10px] text-foreground-muted font-mono">{bio.length}/160</div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase font-mono tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button type="submit" loading={profileSaving} className="font-bold">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* APPEARANCE & THEME TAB */}
          {activeTab === "appearance" && (
            <Card padding="lg" className="space-y-6">
              <div className="border-b border-border pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Theme &amp; Visual Preferences
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    Customize your CyberLearn interface mode. Changes apply immediately.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated border border-border text-xs font-semibold text-foreground-secondary">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Active: <strong className="text-foreground capitalize">{theme} ({resolvedTheme})</strong></span>
                </div>
              </div>

              {/* Theme Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = theme === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className={`
                        relative group rounded-2xl border-2 p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between
                        ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                            : "border-border hover:border-border-hover bg-surface-elevated/40 hover:bg-surface-elevated"
                        }
                      `}
                    >
                      {/* Selection Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center ${opt.accentColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-foreground">{opt.name}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "border-border bg-surface"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Visual UI Mini-Mockup Preview */}
                      <div className={`w-full h-24 rounded-xl ${opt.previewBg} p-2.5 border ${opt.previewBorder} shadow-inner my-2 flex flex-col justify-between overflow-hidden relative`}>
                        {/* Mock header bar */}
                        <div className={`h-4 rounded-md ${opt.previewSurface} border ${opt.previewBorder} flex items-center justify-between px-2`}>
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400/80" />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                          </div>
                          <div className="w-10 h-1.5 rounded bg-primary/40" />
                        </div>

                        {/* Mock content blocks */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className={`h-10 rounded-md ${opt.previewSurface} border ${opt.previewBorder} p-1.5 flex flex-col justify-between`}>
                            <div className="w-8 h-1.5 rounded bg-primary/60" />
                            <div className="w-12 h-1 rounded bg-foreground-muted/40" />
                          </div>
                          <div className={`h-10 rounded-md ${opt.previewSurface} border ${opt.previewBorder} p-1.5 flex flex-col justify-between`}>
                            <div className="w-6 h-1.5 rounded bg-secondary/60" />
                            <div className="w-10 h-1 rounded bg-foreground-muted/40" />
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-foreground-secondary mt-2 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Status information note */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-foreground-secondary">
                  <Monitor className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    Your preference is saved locally and synced across all browser tabs automatically.
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* SECURITY & PASSWORD TABS */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <Card padding="lg" className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="text-base font-bold text-foreground">Change Password</h3>
                  <p className="text-xs text-foreground-secondary">Ensure your account password is strong and secure.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground-secondary">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground-secondary">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground-secondary">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end">
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </Card>

              {/* MFA panel */}
              <Card padding="lg" className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    Two-Factor Authentication (2FA)
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-1 font-normal">
                    Add an extra layer of security to your CyberLearn account.
                  </p>
                </div>
                <div className="flex items-center justify-between bg-surface-elevated/40 border border-border p-4 rounded-[var(--radius-lg)]">
                  <div>
                    <p className="text-xs font-bold text-foreground">Authenticator App</p>
                    <p className="text-[10px] text-foreground-muted mt-0.5 font-normal">
                      Use apps like Google Authenticator or Authy to generate codes.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => alert("Simulated 2FA setup started!")}>
                    Enable 2FA
                  </Button>
                </div>
              </Card>

              {/* Danger Zone */}
              <Card padding="lg" className="border-error/20 bg-error/5 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-error">Danger Zone</h3>
                  <p className="text-xs text-foreground-secondary mt-1 font-normal">
                    Permanently delete your progress data and account records.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <p className="text-xs text-foreground-secondary font-normal">
                    Once deleted, you cannot recover your progress, badges, or certificates.
                  </p>
                  <Button
                    variant="outline"
                    className="border-error text-error hover:bg-error hover:text-white"
                    size="sm"
                    onClick={async () => {
                      if (confirm("Are you sure you want to permanently delete your account? This action is irreversible.")) {
                        try {
                          await api.deleteAccount();
                          alert("Account successfully deleted.");
                          api.logout();
                          window.location.href = "/login";
                        } catch (err: any) {
                          alert(`Error deleting account: ${err.message}`);
                        }
                      }
                    }}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* NOTIFICATIONS TABS */}
          {activeTab === "notifications" && (
            <Card padding="lg" className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-base font-bold text-foreground">Email Notifications</h3>
                <p className="text-xs text-foreground-secondary">Control what notifications you receive via email.</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: "notif-email",
                    title: "Security & Login Alerts",
                    desc: "Get notified immediately of new logins, settings changes, or credential updates.",
                    value: emailNotif,
                    setValue: setEmailNotif,
                  },
                  {
                    id: "notif-labs",
                    title: "Lab Status Alerts",
                    desc: "Receive email reminders before container lab sessions expire.",
                    value: labAlerts,
                    setValue: setLabAlerts,
                  },
                  {
                    id: "notif-marketing",
                    title: "Platform News & Offers",
                    desc: "Weekly updates about new courses, feature additions, or learning tracks.",
                    value: marketing,
                    setValue: setMarketing,
                  },
                ].map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b border-border/40 pb-4">
                    <div className="max-w-[80%]">
                      <p className="text-xs font-bold text-foreground">{item.title}</p>
                      <p className="text-[10px] text-foreground-muted mt-0.5 font-normal leading-normal">
                        {item.desc}
                      </p>
                    </div>
                    {/* Toggle button mockup */}
                    <button
                      type="button"
                      onClick={() => item.setValue(!item.value)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.value ? "bg-primary" : "bg-surface-elevated"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          item.value ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => alert("Notification settings updated successfully!")}>
                  Save Preferences
                </Button>
              </div>
            </Card>
          )}

          {/* SUBSCRIPTION & BILLING TAB */}
          {activeTab === "subscription" && (
            <Card padding="lg" className="space-y-6">
              <div className="border-b border-border pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Subscription &amp; Entitlements</h3>
                  <p className="text-xs text-foreground-secondary">Manage your membership plan and access to courses &amp; practice labs.</p>
                </div>
                <Badge
                  variant={isUserSubscribed(user) ? "success" : "warning"}
                  size="sm"
                  className="font-mono uppercase text-[10px]"
                >
                  {isUserSubscribed(user) ? "Active Subscription" : "Free Plan"}
                </Badge>
              </div>

              {subMessage && (
                <div className="p-3.5 bg-primary/10 border border-primary/30 rounded-xl text-primary text-xs font-mono font-bold">
                  {subMessage}
                </div>
              )}

              {/* Current Tier Overview Box */}
              <div className="p-5 rounded-2xl bg-surface-elevated border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Current Membership</span>
                    <h4 className="text-xl font-extrabold text-foreground capitalize flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      CyberLearn {user?.subscription_tier || (user?.role === "pro_member" ? "Pro" : user?.role === "premium_member" ? "Premium" : "Free")}
                    </h4>
                  </div>
                  <Link href="/pricing">
                    <Button variant="primary" size="sm" className="font-bold">
                      <Zap className="w-3.5 h-3.5 mr-1" />
                      <span>{isUserSubscribed(user) ? "Change Plan" : "Upgrade to Pro"}</span>
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <CheckCircle2 className={`w-4 h-4 ${isUserSubscribed(user) ? "text-success" : "text-foreground-muted"}`} />
                    <span>Interactive Course Videos &amp; Quizzes: <strong>{isUserSubscribed(user) ? "Unlocked" : "Locked"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <CheckCircle2 className={`w-4 h-4 ${isUserSubscribed(user) ? "text-success" : "text-foreground-muted"}`} />
                    <span>Interactive CTF Practice Labs: <strong>{isUserSubscribed(user) ? "Unlocked" : "Locked"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <CheckCircle2 className={`w-4 h-4 ${isUserSubscribed(user) ? "text-success" : "text-foreground-muted"}`} />
                    <span>AI Cyber Coach &amp; Hint Unlocks: <strong>{isUserSubscribed(user) ? "Full Access" : "Basic"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <CheckCircle2 className={`w-4 h-4 ${isUserSubscribed(user) ? "text-success" : "text-foreground-muted"}`} />
                    <span>Verified Course Credentials: <strong>{isUserSubscribed(user) ? "Included" : "Locked"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Lifetime Owned Courses */}
              <div className="space-y-3 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Lifetime Owned Courses</h4>
                    <p className="text-xs text-foreground-secondary">Courses you own permanently with lifetime syllabus and video access.</p>
                  </div>
                  <Link href="/courses">
                    <Button variant="outline" size="sm">
                      Browse Courses
                    </Button>
                  </Link>
                </div>

                {purchasedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {purchasedCourses.map((c) => (
                      <div key={c.id} className="p-3.5 rounded-xl bg-surface-elevated border border-accent/30 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Lifetime Access</span>
                          <h5 className="text-xs font-bold text-foreground">{c.course_title}</h5>
                          <span className="text-[10px] text-foreground-muted block font-mono">
                            Purchased: {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Link href={`/courses/${c.course_id}`}>
                          <Button variant="primary" size="sm" className="font-bold shrink-0 text-xs">
                            Open Course →
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center space-y-1">
                    <p className="text-xs text-foreground-secondary font-medium">No individual lifetime courses owned yet.</p>
                    <p className="text-[11px] text-foreground-muted">You can buy lifetime access to any specific course on CyberLearn for $49 without a subscription.</p>
                  </div>
                )}
              </div>

              {/* Billing Invoices & Receipts History */}
              <div className="space-y-3 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Billing Invoices &amp; Receipts</h4>
                    <p className="text-xs text-foreground-secondary">View and download your digital payment receipts.</p>
                  </div>
                  <Link href="/pricing">
                    <Button variant="outline" size="sm">
                      Change Plan
                    </Button>
                  </Link>
                </div>

                {invoices.length > 0 ? (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-elevated/60 text-foreground-muted border-b border-border">
                        <tr>
                          <th className="p-3 font-semibold">Invoice #</th>
                          <th className="p-3 font-semibold">Date</th>
                          <th className="p-3 font-semibold">Plan</th>
                          <th className="p-3 font-semibold">Amount</th>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-surface-elevated/30 transition-colors">
                            <td className="p-3 font-mono font-bold text-foreground">{inv.invoice_number}</td>
                            <td className="p-3 text-foreground-secondary">
                              {new Date(inv.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-semibold capitalize text-foreground">
                              {inv.plan_tier} ({inv.billing_cycle})
                            </td>
                            <td className="p-3 font-mono text-primary font-bold">
                              ${Number(inv.total_paid).toFixed(2)} USD
                            </td>
                            <td className="p-3">
                              <Badge variant="success" size="sm" className="capitalize text-[10px]">
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedInvoice(inv)}
                                className="text-xs text-primary hover:underline font-semibold"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-1">
                    <p className="text-xs text-foreground-secondary font-medium">No past invoice receipts found.</p>
                    <p className="text-[11px] text-foreground-muted">When you subscribe or upgrade your account, your digital receipts will appear here.</p>
                  </div>
                )}
              </div>

              {/* Cancellation Action */}
              {isUserSubscribed(user) && user?.role !== "admin" && user?.role !== "instructor" && (
                <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-error">Cancel Subscription</p>
                    <p className="text-[11px] text-foreground-muted">Revert account back to Free tier and lock course content &amp; practice labs.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={subLoading}
                    onClick={handleCancelSub}
                    className="text-error border-error/30 hover:bg-error/10 hover:border-error"
                  >
                    {subLoading ? "Canceling..." : "Cancel Subscription"}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* RECEIPT MODAL */}
          {selectedInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <p className="text-[10px] font-mono text-foreground-muted uppercase">Digital Receipt</p>
                    <h3 className="text-base font-bold text-foreground">{selectedInvoice.invoice_number}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-foreground-muted hover:text-foreground p-1 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-foreground-muted block">Tier</span>
                    <span className="font-bold text-foreground uppercase">{selectedInvoice.plan_tier} Plan</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block">Billing Period</span>
                    <span className="font-bold text-foreground capitalize">{selectedInvoice.billing_cycle}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block">Payment Method</span>
                    <span className="font-bold text-foreground font-mono uppercase">
                      {selectedInvoice.card_brand || "CARD"} •••• {selectedInvoice.card_last4 || "4242"}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block">Date</span>
                    <span className="font-bold text-foreground">
                      {new Date(selectedInvoice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-surface-elevated rounded-xl border border-border space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">Subtotal</span>
                    <span>${Number(selectedInvoice.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(selectedInvoice.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Discount ({selectedInvoice.promo_code || "Promo"})</span>
                      <span>-${Number(selectedInvoice.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-border font-bold text-sm text-foreground">
                    <span>Total Amount</span>
                    <span className="text-primary">${Number(selectedInvoice.total_paid).toFixed(2)} USD</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    Print Receipt
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setSelectedInvoice(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
