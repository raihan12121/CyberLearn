"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  RefreshCw,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

interface NidVerificationData {
  user_id: string;
  full_name?: string;
  email: string;
  nid_number?: string;
  nid_front_image?: string;
  nid_back_image?: string;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  verification_notes?: string;
  verified_at?: string;
}

export default function VerifyNidPage() {
  const [data, setData] = useState<NidVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [nidNumber, setNidNumber] = useState("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMyNidVerification();
      setData(res);
      if (res.nid_number) setNidNumber(res.nid_number);
      if (res.nid_front_image) setFrontImage(res.nid_front_image);
      if (res.nid_back_image) setBackImage(res.nid_back_image);
    } catch (err: any) {
      setError(err.message || "Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to Base64 for instant preview & persistence
    const reader = new FileReader();
    reader.onload = () => {
      if (side === "front") {
        setFrontImage(reader.result as string);
      } else {
        setBackImage(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nidNumber.trim() || nidNumber.trim().length < 8) {
      setError("Please enter a valid National ID (NID) of at least 8 digits.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await api.submitNidVerification({
        nid_number: nidNumber.trim(),
        nid_front_image: frontImage || undefined,
        nid_back_image: backImage || undefined,
      });

      setData(res);
      setSuccess(
        "Your National ID has been submitted successfully! Our administrative team will review it shortly."
      );
    } catch (err: any) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const status = data?.verification_status || "unverified";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card to-card/50 border border-border/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" />
              Human & Identity Authentication
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              National ID (NID) Verification
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
              Verify your genuine human identity to unlock certified course diplomas, live cohort batch graduation, and competitive CTF prize pools.
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            {status === "verified" && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <div className="text-xs font-semibold uppercase">Status</div>
                  <div className="font-bold text-sm">Verified Account</div>
                </div>
              </div>
            )}
            {status === "pending" && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Clock className="h-6 w-6 animate-pulse" />
                <div>
                  <div className="text-xs font-semibold uppercase">Status</div>
                  <div className="font-bold text-sm">Pending Admin Audit</div>
                </div>
              </div>
            )}
            {status === "rejected" && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertCircle className="h-6 w-6" />
                <div>
                  <div className="text-xs font-semibold uppercase">Status</div>
                  <div className="font-bold text-sm">Verification Rejected</div>
                </div>
              </div>
            )}
            {status === "unverified" && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 border border-border text-muted-foreground">
                <Lock className="h-6 w-6" />
                <div>
                  <div className="text-xs font-semibold uppercase">Status</div>
                  <div className="font-bold text-sm">Not Submitted</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Admin Notes if rejected or pending */}
      {data?.verification_notes && (
        <div className="p-4 rounded-xl bg-card border border-border/60 text-sm space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Audit Remarks:
          </span>
          <p className="text-foreground">{data.verification_notes}</p>
        </div>
      )}

      {/* Verification Form Card */}
      <div className="bg-card/70 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* NID Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              National Identification (NID) Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={status === "verified"}
              value={nidNumber}
              onChange={(e) => setNidNumber(e.target.value)}
              placeholder="e.g. 1998521094002341"
              className="w-full px-4 py-3 rounded-xl bg-background/80 border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base transition-all disabled:opacity-60"
            />
            <p className="text-xs text-muted-foreground">
              Your NID is strictly encrypted and used solely for authenticating credentials & certifications.
            </p>
          </div>

          {/* Document Uploads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Front Photo */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center justify-between">
                <span>NID Front Side Photo</span>
                {frontImage && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-normal">
                    <CheckCircle2 className="h-3 w-3" /> Uploaded
                  </span>
                )}
              </label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[190px] ${
                  frontImage
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/80 hover:border-primary/40 bg-background/40"
                }`}
              >
                {frontImage ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={frontImage}
                      alt="NID Front"
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                    {status !== "verified" && (
                      <button
                        type="button"
                        onClick={() => setFrontImage(null)}
                        className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white rounded text-xs hover:bg-black"
                      >
                        Change
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-9 w-9 text-muted-foreground mb-2" />
                    <span className="text-xs font-semibold text-foreground">
                      Upload NID Front
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1">
                      PNG, JPG or PDF up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={status === "verified"}
                      onChange={(e) => handleFileUpload(e, "front")}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Back Photo */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground flex items-center justify-between">
                <span>NID Back Side Photo</span>
                {backImage && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-normal">
                    <CheckCircle2 className="h-3 w-3" /> Uploaded
                  </span>
                )}
              </label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[190px] ${
                  backImage
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/80 hover:border-primary/40 bg-background/40"
                }`}
              >
                {backImage ? (
                  <div className="relative w-full h-36 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={backImage}
                      alt="NID Back"
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                    {status !== "verified" && (
                      <button
                        type="button"
                        onClick={() => setBackImage(null)}
                        className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white rounded text-xs hover:bg-black"
                      >
                        Change
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-9 w-9 text-muted-foreground mb-2" />
                    <span className="text-xs font-semibold text-foreground">
                      Upload NID Back
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1">
                      PNG, JPG or PDF up to 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={status === "verified"}
                      onChange={(e) => handleFileUpload(e, "back")}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {status !== "verified" && (
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Submitting Verification...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Submit for Official Verification
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Trust & Guarantee Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-1.5">
          <div className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            256-bit Encryption
          </div>
          <p className="text-xs text-muted-foreground">
            Identification files are strictly isolated and never exposed publicly.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-1.5">
          <div className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Instant Badge
          </div>
          <p className="text-xs text-muted-foreground">
            Get a Verified Practitioner seal on your public cyber portfolio.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-1.5">
          <div className="font-semibold text-sm text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Accredited Certs
          </div>
          <p className="text-xs text-muted-foreground">
            Enables tamper-proof certification issuing with QR credential verification.
          </p>
        </div>
      </div>
    </div>
  );
}
