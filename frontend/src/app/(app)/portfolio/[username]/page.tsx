"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shield, Award, CheckCircle2, Terminal, ExternalLink, Share2, Download, Zap, Star } from "lucide-react";
import SkillRadarChart from "@/components/dashboard/SkillRadarChart";
import { Card, Badge, Avatar, Button } from "@/components/ui";
import { api } from "@/lib/api";

interface PublicProfile {
  full_name: string;
  username: string;
  role: string;
  rank: number;
  xp: number;
  solved_labs_count: number;
  joined_date: string;
  badges: { name: string; icon: string; date: string; desc: string }[];
  certificates: { id: string; courseTitle: string; category: string; issueDate: string; credentialUrl: string }[];
  solved_labs: { title: string; category: string; xp: number; date: string }[];
}

export default function VerifiedPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const username = (params?.username as string) || "learner";

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    api.getPublicProfile(username)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Error fetching public profile, utilizing fallback layout:", err);
        setError(err.message || "User profile not found.");
        setLoading(false);
      });
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initial = profile?.full_name ? profile.full_name[0].toUpperCase() : username[0].toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans py-4">
      {/* Recruiter Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground capitalize">{profile?.full_name || username}</h1>
              <CheckCircle2 className="w-5 h-5 text-sky-400" />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-sky-400/10 text-sky-400 border border-sky-400/20 font-mono font-bold">
                VERIFIED PRACTITIONER
              </span>
            </div>
            <p className="text-sm text-foreground-secondary mt-1">
              Junior Penetration Tester & SOC Security Analyst • Global Rank #{profile?.rank || 1}
            </p>
            <p className="text-xs text-foreground-muted mt-0.5">
              @{profile?.username || username} • {profile?.joined_date || "Joined Recently"} • {profile?.xp.toLocaleString() || 0} XP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Portfolio URL copied to clipboard!");
            }}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            Share Profile
          </Button>
        </div>
      </div>

      {/* Skill Radar & Job Readiness */}
      <SkillRadarChart />

      {/* Verified Solved Labs & Write-ups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" /> Verified Lab Executions
            </h3>
            <span className="text-xs font-mono text-primary font-bold">
              {profile?.solved_labs_count || 0} Labs Solved
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {profile?.solved_labs && profile.solved_labs.length > 0 ? (
              profile.solved_labs.map((lab, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface-elevated border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">{lab.title}</span>
                    <span className="text-[10px] text-foreground-muted">{lab.category} • Verified {lab.date}</span>
                  </div>
                  <Badge variant="success" size="sm">+{lab.xp} XP</Badge>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-foreground-muted">
                No lab executions completed yet.
              </div>
            )}
          </div>
        </Card>

        {/* Digital Credentials */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Digital Certificates
            </h3>
            <span className="text-xs font-mono text-amber-400 font-bold">
              {profile?.certificates ? profile.certificates.length : 0} Verified Credentials
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {profile?.certificates && profile.certificates.length > 0 ? (
              profile.certificates.map((cert) => (
                <div key={cert.id} className="p-3 rounded-lg bg-surface-elevated border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">{cert.courseTitle}</span>
                    <span className="text-[10px] text-foreground-muted">Issued {cert.issueDate} • ID #{cert.id}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(cert.credentialUrl)}
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Verify
                  </Button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-foreground-muted">
                No certificates earned yet. Complete courses to unlock credentials!
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
