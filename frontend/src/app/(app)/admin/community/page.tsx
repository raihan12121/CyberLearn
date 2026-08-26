"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Trash2,
  Eye,
  Shield,
  RefreshCw,
  X,
  MessageCircle,
  ThumbsUp,
  Tag,
  Search,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

export default function AdminCommunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Community Posts State
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [postSearch, setPostSearch] = useState("");
  const [inspectingPost, setInspectingPost] = useState<any | null>(null);

  const loadCommunityPosts = async () => {
    setRefreshing(true);
    try {
      const me = await api.getMe();
      if (me.role !== "admin") {
        setUnauthorized(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const list = await api.getAdminPosts();
      setCommunityPosts(list || []);
    } catch (err: any) {
      console.error("Failed to load community posts:", err);
      if (err?.message?.includes("403")) {
        setUnauthorized(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCommunityPosts();
  }, []);

  const handleDeletePost = async (postId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete post "${title}"?`)) return;
    try {
      await api.deleteAdminPost(postId);
      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
      if (inspectingPost?.id === postId) {
        setInspectingPost(null);
      }
      alert("Post deleted by administrator.");
    } catch (e: any) {
      alert(`Error deleting post: ${e.message}`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await api.deleteAdminComment(commentId);
      if (inspectingPost) {
        setInspectingPost({
          ...inspectingPost,
          comments: inspectingPost.comments?.filter((c: any) => c.id !== commentId),
        });
      }
      alert("Comment removed.");
    } catch (e: any) {
      alert(`Error deleting comment: ${e.message}`);
    }
  };

  const filteredPosts = communityPosts.filter((p) => {
    if (!postSearch) return true;
    const term = postSearch.toLowerCase();
    return (
      p.title?.toLowerCase().includes(term) ||
      p.content?.toLowerCase().includes(term) ||
      p.author_name?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-surface border border-error/30 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/25 flex items-center justify-center shadow-sm shadow-blue-500/10">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Community & Forum Moderation</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {communityPosts.length} Forum Threads
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitor security discussion threads, audit offensive content, and moderate community replies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCommunityPosts}
            disabled={refreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
          >
            {refreshing ? "Syncing..." : "Sync Community"}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-[#0C1222] p-3 rounded-xl border border-[#1E293B]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={postSearch}
            onChange={(e) => setPostSearch(e.target.value)}
            placeholder="Search discussion threads by keyword, author, or category..."
            className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Forum Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPosts.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-xs text-slate-400">
            No community threads matching your search.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Card
              key={post.id}
              padding="lg"
              className="border border-[#1E293B] bg-[#0F172A] flex flex-col justify-between hover:border-slate-700 transition-all duration-150 group shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {post.category || "Discussion"}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-xs text-slate-400">
                  <span className="text-slate-300 font-medium">By {post.author_name || "Community Member"}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-mono">
                      <ThumbsUp className="w-3.5 h-3.5 text-blue-400" /> {post.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> {post.comments?.length || post.comments_count || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#1E293B]">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInspectingPost(post)}
                  icon={<Eye className="w-3.5 h-3.5" />}
                >
                  Inspect & Comments
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeletePost(post.id, post.title)}
                  className="hover:bg-red-500/10 text-red-400"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Inspect Community Post Modal */}
      <AnimatePresence>
        {inspectingPost && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{inspectingPost.title}</h3>
                  <p className="text-xs text-slate-400">By {inspectingPost.author_name || "Anonymous"}</p>
                </div>
                <button onClick={() => setInspectingPost(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-[#0C1222] rounded-xl text-xs text-slate-200 leading-relaxed border border-[#1E293B]">
                {inspectingPost.content}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Comments & Answers ({inspectingPost.comments?.length || 0})
                </h4>
                {(!inspectingPost.comments || inspectingPost.comments.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No comments posted on this thread yet.
                  </div>
                ) : (
                  inspectingPost.comments.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-[#0C1222] border border-[#1E293B] flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{c.author || c.user_name || "Learner"}</p>
                        <p className="text-slate-300 mt-0.5">{c.content}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-red-400 hover:bg-red-500/10 shrink-0"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
