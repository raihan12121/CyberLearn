"use client";

import React, { useState } from "react";
import { Send, RefreshCw, Code } from "lucide-react";
import { api } from "@/lib/api";

interface RequestItem {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  status: number;
  time: string;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseBody: string;
}

const initialHistory: RequestItem[] = [
  {
    id: "req-1",
    method: "POST",
    url: "/api/v1/auth/login",
    status: 401,
    time: "10:14:02",
    requestHeaders: {
      "Content-Type": "application/json",
      "User-Agent": "CyberLearn-Proxy/1.0",
      "X-Forwarded-For": "10.0.4.12",
    },
    requestBody: JSON.stringify({ username: "admin' OR '1'='1", password: "password" }, null, 2),
    responseBody: JSON.stringify({ error: "Invalid credentials", code: "AUTH_FAILED" }, null, 2),
  },
  {
    id: "req-2",
    method: "GET",
    url: "/api/v1/user/profile?id=1",
    status: 200,
    time: "10:15:10",
    requestHeaders: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1Ni...",
      "User-Agent": "Mozilla/5.0 (CyberInspector)",
    },
    requestBody: "",
    responseBody: JSON.stringify({ id: 1, name: "Administrator", role: "admin", email: "admin@target.local" }, null, 2),
  },
];

export default function WebProxyInspector({ targetUrl, labId }: { targetUrl?: string; labId?: string }) {
  const [history, setHistory] = useState<RequestItem[]>(initialHistory);
  const [selectedReq, setSelectedReq] = useState<RequestItem>(initialHistory[0]);
  const [activeTab, setActiveTab] = useState<"repeater" | "history">("repeater");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">(selectedReq.method);
  const [url, setUrl] = useState<string>(selectedReq.url);
  const [body, setBody] = useState<string>(selectedReq.requestBody);
  const [response, setResponse] = useState<string>(selectedReq.responseBody);
  const [loading, setLoading] = useState(false);

  const handleSelectReq = (req: RequestItem) => {
    setSelectedReq(req);
    setMethod(req.method);
    setUrl(req.url);
    setBody(req.requestBody);
    setResponse(req.responseBody);
  };

  const handleSendRequest = () => {
    setLoading(true);

    api.forwardProxyRequest({ method, url, body })
      .then((res) => {
        const resBody = res.body || "// Empty response";
        const newReq: RequestItem = {
          id: `req-${Date.now()}`,
          method,
          url,
          status: res.status || 200,
          time: new Date().toLocaleTimeString(),
          requestHeaders: res.headers || { "Content-Type": "application/json" },
          requestBody: body,
          responseBody: resBody,
        };

        setHistory([newReq, ...history]);
        setSelectedReq(newReq);
        setResponse(resBody);
        setLoading(false);
      })
      .catch((err) => {
        const errorRes = JSON.stringify({ error: err.message || "Proxy request execution failed" }, null, 2);
        const newReq: RequestItem = {
          id: `req-${Date.now()}`,
          method,
          url,
          status: 500,
          time: new Date().toLocaleTimeString(),
          requestHeaders: { "Content-Type": "application/json" },
          requestBody: body,
          responseBody: errorRes,
        };

        setHistory([newReq, ...history]);
        setSelectedReq(newReq);
        setResponse(errorRes);
        setLoading(false);
      });
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden font-mono text-xs">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-elevated border-b border-border">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground tracking-wide text-sm">
            Web Security Proxy Inspector
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary border border-primary/20 font-sans">
            In-Browser HTTP Interceptor
          </span>
        </div>
        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={() => setActiveTab("repeater")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === "repeater"
                ? "bg-primary text-black"
                : "bg-surface-elevated text-foreground-secondary hover:text-foreground"
            }`}
          >
            HTTP Repeater
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === "history"
                ? "bg-primary text-black"
                : "bg-surface-elevated text-foreground-secondary hover:text-foreground"
            }`}
          >
            Request History ({history.length})
          </button>
        </div>
      </div>

      {/* Main Body */}
      {activeTab === "repeater" ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
          {/* Request Composer */}
          <div className="flex flex-col p-3 space-y-3 bg-surface overflow-y-auto">
            <div className="flex items-center justify-between text-foreground-secondary font-sans font-medium">
              <span>Request Composer</span>
              <span className="text-[10px] text-foreground-muted">Target: {targetUrl || "http://target.lab:8080"}</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "GET" | "POST" | "PUT" | "DELETE")}
                className="bg-surface-elevated border border-border rounded px-2.5 py-1.5 text-primary font-bold focus:outline-none focus:border-primary"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-surface-elevated border border-border rounded px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
                placeholder="/api/v1/endpoint"
              />

              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="bg-primary hover:bg-primary-hover text-black px-4 py-1.5 rounded font-sans font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send
              </button>
            </div>

            <div className="flex-1 flex flex-col space-y-1">
              <label className="text-[11px] text-foreground-muted font-sans font-medium">
                Request Payload / Headers
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 min-h-[180px] bg-surface-elevated border border-border rounded p-3 text-foreground focus:outline-none focus:border-primary resize-none font-mono"
                placeholder="Enter raw request body or payload (e.g. JSON, SQLi payload)..."
              />
            </div>
          </div>

          {/* Response Viewer */}
          <div className="flex flex-col p-3 space-y-3 bg-surface-elevated/40 overflow-y-auto">
            <div className="flex items-center justify-between text-foreground-secondary font-sans font-medium">
              <span>Response Inspector</span>
              {selectedReq && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedReq.status === 200 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  }`}
                >
                  HTTP {selectedReq.status} OK
                </span>
              )}
            </div>

            <div className="flex-1 bg-surface border border-border rounded p-3 text-emerald-400 overflow-x-auto whitespace-pre-wrap font-mono">
              {response || "// Execute request to view response body"}
            </div>
          </div>
        </div>
      ) : (
        /* History View */
        <div className="flex-1 overflow-y-auto p-3">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-foreground-muted font-sans">
                <th className="py-2 px-3">Method</th>
                <th className="py-2 px-3">URL Path</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-surface-elevated transition-colors">
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-bold ${
                        item.method === "POST"
                          ? "text-amber-400"
                          : item.method === "GET"
                          ? "text-sky-400"
                          : "text-rose-400"
                      }`}
                    >
                      {item.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-foreground truncate max-w-xs">{item.url}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 200
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-foreground-muted">{item.time}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        handleSelectReq(item);
                        setActiveTab("repeater");
                      }}
                      className="text-primary hover:underline font-sans text-xs font-semibold"
                    >
                      Open in Repeater
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
