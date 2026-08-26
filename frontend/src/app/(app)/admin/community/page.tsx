"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Trash2,
  Eye,
  Shield,
  RefreshCw,
  X,
  MessageCircle,
  ThumbsUp,
  Clock,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Posts State
  const [postsList, setPostsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingPost, setInspectingPost] = useState<any | null>(null);

  const loadPosts = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const posts = await api.getAdminPosts();
      setPostsList(posts || []);
    } catch (err: any) {
      console.error("Failed to load posts:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const filteredPosts = postsList.filter((post) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      post.title?.toLowerCase().includes(term) ||
      post.content?.toLowerCase().includes(term) ||
      post.author_name?.toLowerCase().includes(term) ||
      post.author_email?.toLowerCase().includes(term)
    );
  });

  const handleDeletePost = async (postId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently remove thread "${title}"?`)) return;
    try {
      await api.deleteAdminPost(postId);
      setPostsList((prev) => prev.filter((p) => p.id !== postId));
      if (inspectingPost?.id === postId) {
        setInspectingPost(null);
      }
      alert("Post removed.");
    } catch (e: any) {
      alert(`Error deleting post: ${e.message}`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to remove this comment?")) return;
    try {
      await api.deleteAdminComment(commentId);
      if (inspectingPost) {
        setInspectingPost({
          ...inspectingPost,
          comments: inspectingPost.comments?.filter((c: any) => c.id !== commentId) || [],
        });
      }
      alert("Comment removed.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

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
          Administrative privileges required to access Community Moderation.
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-sm shadow-sky-500/10">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Community & Forum Moderation</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                {postsList.length} Threads
              </span>
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Moderate public learner discussions, remove policy-violating threads, and manage comment streams.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPosts}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Threads"}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative bg-surface p-3 rounded-xl border border-border">
        <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-foreground-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search community posts by title, body keyword, or author..."
          className="w-full bg-surface-elevated border border-border rounded-lg pl-10 pr-4 py-2 text-xs text-foreground placeholder-foreground-muted focus:outline-none focus:border-sky-400"
        />
      </form>

      {/* Community Posts Table */}
      <Card padding="none" className="border border-border bg-surface shadow-lg overflow-hidden space-y-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-surface-elevated text-foreground-muted font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Post Title & Excerpt</th>
                <th className="py-3 px-4">Category / Tags</th>
                <th className="py-3 px-4">Upvotes</th>
                <th className="py-3 px-4">Replies</th>
                <th className="py-3 px-4">Posted Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-foreground-muted">
                    No community threads matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={post.author_name || post.author_email || "User"} size="sm" />
                        <div>
                          <p className="font-bold text-foreground">{post.author_name || "Community Member"}</p>
                          <p className="text-[10px] text-foreground-muted font-mono">{post.author_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-bold text-foreground truncate">{post.title}</p>
                      <p className="text-[11px] text-foreground-muted truncate mt-0.5">{post.content || post.body}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                        {post.category || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {post.upvotes_count || post.upvotes || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sky-400 font-bold">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> {post.comments?.length || post.comments_count || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground-muted text-[11px]">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : "Recent"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setInspectingPost(post)}
                          className="hover:text-sky-400"
                          icon={<Eye className="w-3.5 h-3.5" />}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="hover:bg-rose-500/10 text-rose-400"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Thread Modal */}
      <AnimatePresence>
        {inspectingPost && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-surface rounded-2xl p-6 border border-border shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={inspectingPost.author_name || "User"} size="sm" />
                  <div>
                    <h3 className="text-base font-bold text-foreground truncate max-w-md">{inspectingPost.title}</h3>
                    <p className="text-[11px] text-foreground-muted flex items-center gap-1.5 font-mono">
                      <span>By {inspectingPost.author_name}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{inspectingPost.created_at ? new Date(inspectingPost.created_at).toLocaleString() : "Recently"}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setInspectingPost(null)} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {inspectingPost.content || inspectingPost.body}
              </div>

              {/* Comments Stream */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                <h4 className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
                  Thread Comments ({inspectingPost.comments?.length || 0})
                </h4>

                {!inspectingPost.comments || inspectingPost.comments.length === 0 ? (
                  <p className="text-xs text-foreground-muted py-6 text-center">No replies on this thread.</p>
                ) : (
                  inspectingPost.comments.map((cmt: any) => (
                    <div
                      key={cmt.id}
                      className="p-3 rounded-xl bg-surface-elevated border border-border flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{cmt.author_name || "User"}</span>
                          <span className="text-[10px] text-foreground-muted font-mono">
                            {cmt.created_at ? new Date(cmt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                          </span>
                        </div>
                        <p className="text-foreground-secondary">{cmt.content || cmt.body}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(cmt.id)}
                        className="hover:bg-rose-500/10 text-rose-400 shrink-0"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeletePost(inspectingPost.id, inspectingPost.title)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete Entire Thread
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInspectingPost(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
