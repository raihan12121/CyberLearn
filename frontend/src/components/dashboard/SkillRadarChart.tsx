"use client";

import React from "react";
import { Shield, Award, CheckCircle, ChevronRight, Zap } from "lucide-react";

interface SkillScore {
  label: string;
  score: number; // 0 - 100
  color: string;
}

const skillsData: SkillScore[] = [
  { label: "Network Security", score: 85, color: "#38bdf8" },
  { label: "Web Security", score: 92, color: "#a855f7" },
  { label: "Linux Mastery", score: 78, color: "#22c55e" },
  { label: "Defense & SIEM", score: 88, color: "#f59e0b" },
  { label: "Cryptography", score: 65, color: "#ec4899" },
  { label: "Cloud & AI Security", score: 70, color: "#6366f1" },
];

export default function SkillRadarChart() {
  const center = 110;
  const radius = 80;
  const total = skillsData.length;

  // Calculate polygon points for the skills
  const points = skillsData
    .map((skill, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const r = (skill.score / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            6-Axis Skill Radar & Cyber Readiness Index
          </h3>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Quantifiable skill coverage across 6 core cybersecurity disciplines
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
          Tier: Penetration Tester
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* SVG Radar Polygon Visual */}
        <div className="flex items-center justify-center relative py-2">
          <svg width="220" height="220" className="overflow-visible">
            {/* Grid polygons */}
            {gridLevels.map((level, idx) => {
              const gridPoints = skillsData
                .map((_, i) => {
                  const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
                  const r = level * radius;
                  const x = center + r * Math.cos(angle);
                  const y = center + r * Math.sin(angle);
                  return `${x},${y}`;
                })
                .join(" ");
              return (
                <polygon
                  key={idx}
                  points={gridPoints}
                  fill="none"
                  stroke="var(--border-hover)"
                  strokeWidth="1"
                  strokeDasharray={idx < 4 ? "3,3" : "none"}
                />
              );
            })}

            {/* Axis lines */}
            {skillsData.map((_, i) => {
              const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
              const x2 = center + radius * Math.cos(angle);
              const y2 = center + radius * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="var(--border-hover)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled Skill Polygon */}
            <polygon
              points={points}
              fill="rgba(56, 189, 248, 0.25)"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />

            {/* Skill Vertex Dots */}
            {skillsData.map((skill, i) => {
              const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
              const r = (skill.score / 100) * radius;
              const cx = center + r * Math.cos(angle);
              const cy = center + r * Math.sin(angle);
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="4"
                  fill="#38bdf8"
                  stroke="var(--surface)"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>

        {/* Skill Metrics Breakdown */}
        <div className="space-y-2.5">
          {skillsData.map((skill) => (
            <div key={skill.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">{skill.label}</span>
                <span className="font-mono font-bold text-primary">{skill.score}%</span>
              </div>
              <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${skill.score}%`, backgroundColor: skill.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Role Readiness Footer */}
      <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-foreground-secondary">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Role Readiness:</span>
          <span className="font-bold text-foreground">Junior SOC Analyst (88%)</span> •{" "}
          <span className="font-bold text-foreground">Web Pentester (85%)</span>
        </div>
      </div>
    </div>
  );
}
