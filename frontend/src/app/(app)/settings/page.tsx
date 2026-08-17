"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Lock,
  Trash2,
  Check,
  Smartphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

export default function SettingsPage() {
  // Tabs
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  // Passwords Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications state
  const [emailNotif, setEmailNotif] = useState(true);
  const [labAlerts, setLabAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);

  // Load profile on mount
  useEffect(() => {
    api.getMe()
      .then((data) => {
        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setUsername(data.username || data.email.split("@")[0]);
        }
      })
      .catch((err) => console.error("Error fetching profile settings:", err));
  }, []);

  // Profile Saving
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    api.updateProfile({ full_name: fullName, email, username })
      .then(() => {
        alert("Profile configurations saved successfully!");
      })
      .catch((err) => {
        alert("Error saving profile details: " + err.message);
      });
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground font-sans">Settings</h1>
        <p className="text-foreground-secondary text-sm mt-1">
          Manage your account preferences, security credentials, and email notifications.
        </p>
      </motion.div>

      {/* Main Grid Layout split (Sidebar nav + active form card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Sub-navigation (3 cols) */}
        <div className="lg:col-span-3 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: "profile", label: "My Profile", icon: User },
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
          {/* PROFILE TABS */}
          {activeTab === "profile" && (
            <Card padding="lg" className="space-y-6">
              <div className="border-b border-border pb-4">
                <h3 className="text-base font-bold text-foreground">Profile Information</h3>
                <p className="text-xs text-foreground-secondary">Update your public profile display variables.</p>
              </div>

              {/* Avatar upload layout */}
              <div className="flex items-center gap-4">
                <Avatar name={fullName} size="lg" className="w-16 h-16" />
                <div>
                  <Button variant="outline" size="sm" onClick={() => alert("Simulated photo upload triggered!")}>
                    Change Photo
                  </Button>
                  <p className="text-[10px] text-foreground-muted mt-1.5 font-normal">
                    JPG, PNG, or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground-secondary">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground-secondary">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-secondary">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button type="submit">Save Settings</Button>
                </div>
              </form>
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
        </div>
      </div>
    </div>
  );
}
