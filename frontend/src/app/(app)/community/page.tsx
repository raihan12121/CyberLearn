"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  ThumbsUp,
  Search,
  PenTool,
  TrendingUp,
  Tag,
  AlertCircle,
  X,
  Share2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  Send,
  Trash2,
  ShieldCheck,
  Award,
  Terminal,
  User,
  Zap,
  LogIn,
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { api, ensureAuthenticated, getAuthToken } from "@/lib/api";
import { useAuthStore } from "@/lib/authStore";

const categories = ["All", "Questions", "Writeups", "General", "Security News", "Help Wanted"];

const trendingTopics = [
  { tag: "#SQLiBypass", count: 128 },
  { tag: "#WiresharkAnalysis", count: 95 },
  { tag: "#LinuxPrivEsc", count: 74 },
  { tag: "#OWASPTop10", count: 64 },
  { tag: "#CCNASecurity", count: 52 },
];

interface CommentItem {
  id: string;
  post_id: string;
  user_id: string;
  author_name?: string;
  author_username?: string;
  author_avatar?: string;
  author_role?: string;
  content: string;
  is_solution?: boolean;
  created_at: string;
}

interface PostItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags?: string;
  is_solved: boolean;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  upvotes: number;
  comment_count: number;
  has_upvoted: boolean;
  created_at: string;
}

export default function CommunityPage() {
  const { user, fetchUser } = useAuthStore();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [solvedFilter, setSolvedFilter] = useState<"all" | "unsolved" | "solved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Post dialog modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Questions");
  const [newPostTags, setNewPostTags] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Post Detail Thread Modal state
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [selectedPostDetails, setSelectedPostDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Initial user & posts fetch
  useEffect(() => {
    fetchUser().catch(() => {});
  }, [fetchUser]);

  const fetchPosts = () => {
    setLoading(true);
    const filterParams: any = {};
    if (activeCategory !== "All") filterParams.category = activeCategory;
    if (searchQuery.trim()) filterParams.search = searchQuery.trim();
    if (solvedFilter === "unsolved") filterParams.is_solved = false;
    if (solvedFilter === "solved") filterParams.is_solved = true;

    api.getPosts(filterParams)
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        }
      })
      .catch((err) => console.log("Error loading community posts:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, [activeCategory, solvedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleOpenPostDetails = async (post: PostItem) => {
    setSelectedPost(post);
    setCommentError(null);
    setLoadingDetails(true);
    try {
      const details = await api.getPostDetail(post.id);
      setSelectedPostDetails(details);
    } catch (err: any) {
      console.warn("Failed to load post detail:", err);
      setSelectedPostDetails({ ...post, comments: [] });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpvote = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await ensureAuthenticated();
      const updated = await api.upvotePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, upvotes: updated.upvotes, has_upvoted: updated.has_upvoted } : p))
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) => prev ? { ...prev, upvotes: updated.upvotes, has_upvoted: updated.has_upvoted } : null);
      }
    } catch (err: any) {
      console.warn("Upvote error:", err);
    }
  };

  const handleToggleSolved = async (postId: string) => {
    try {
      await ensureAuthenticated();
      const updated = await api.togglePostSolved(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, is_solved: updated.is_solved } : p))
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) => prev ? { ...prev, is_solved: updated.is_solved } : null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update solved status.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this discussion post?")) return;
    try {
      await ensureAuthenticated();
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setSelectedPost(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete post.");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    setPostError(null);
    setIsSubmittingPost(true);

    try {
      // 1. Ensure authenticated session exists
      await ensureAuthenticated();
      await fetchUser(true).catch(() => {});

      // 2. Submit post
      const created = await api.createPost({
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        category: newPostCategory,
        tags: newPostTags.trim() || undefined,
      });

      setPosts([created, ...posts]);
      setShowCreateModal(false);
      setNewPostTitle("");
      setNewPostTags("");
      setNewPostContent("");
      setPostError(null);
    } catch (err: any) {
      console.error("Post creation failure:", err);
      setPostError(err.message || "Failed to publish post. Please check your credentials.");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment.trim()) return;

    setCommentError(null);
    setIsSubmittingComment(true);

    try {
      await ensureAuthenticated();
      await fetchUser(true).catch(() => {});

      const commentRes = await api.addComment(selectedPost.id, newComment.trim());
      if (selectedPostDetails) {
        setSelectedPostDetails({
          ...selectedPostDetails,
          comments: [...(selectedPostDetails.comments || []), commentRes],
        });
      }
      setPosts((prev) =>
        prev.map((p) => (p.id === selectedPost.id ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p))
      );
      setNewComment("");
    } catch (err: any) {
      console.error("Add comment failure:", err);
      setCommentError(err.message || "Failed to post answer. Please ensure you are signed in.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    try {
      await ensureAuthenticated();
      await fetchUser(true);
      setPostError(null);
      setCommentError(null);
    } catch (err: any) {
      alert("Failed to auto-sign in: " + err.message);
    }
  };

  const formatInitials = (name?: string) => {
    if (!name) return "LM";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm" className="font-mono uppercase text-[10px] font-bold">
                Student &amp; Mentor Community
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">Community &amp; Problem Solving</h1>
            <p className="text-sm text-foreground-secondary mt-1 max-w-2xl leading-relaxed">
              Ask questions about lab challenges, share security writeups, troubleshoot payload syntax errors, and collaborate with mentors in real time.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setPostError(null);
              setShowCreateModal(true);
            }}
            icon={<PenTool className="w-4 h-4" />}
            className="font-bold shadow-lg shrink-0"
          >
            Ask Question / Share Problem
          </Button>
        </div>
      </motion.div>

      {/* Filter Controls & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-150 whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-black shadow-sm font-bold"
                  : "bg-surface-elevated text-foreground-secondary hover:text-foreground hover:bg-surface-bright"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Solved Filter */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-surface-elevated border border-border text-xs">
            <button
              onClick={() => setSolvedFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                solvedFilter === "all" ? "bg-surface-bright text-foreground font-bold shadow-xs" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSolvedFilter("unsolved")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                solvedFilter === "unsolved" ? "bg-warning/20 text-warning font-bold shadow-xs" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Unsolved
            </button>
            <button
              onClick={() => setSolvedFilter("solved")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                solvedFilter === "solved" ? "bg-success/20 text-success font-bold shadow-xs" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              Solved
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search problems, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-elevated border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary transition-all"
            />
          </form>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-foreground-muted">Loading community discussions...</div>
          ) : posts.length === 0 ? (
            <Card padding="lg" className="text-center py-12 space-y-3">
              <HelpCircle className="w-12 h-12 text-foreground-muted mx-auto" />
              <h3 className="text-base font-bold text-foreground">No discussions found</h3>
              <p className="text-xs text-foreground-secondary max-w-sm mx-auto">
                No questions or problems match your search or filter. Be the first to start a conversation!
              </p>
              <Button size="sm" variant="primary" onClick={() => setShowCreateModal(true)}>
                Ask a Question Now
              </Button>
            </Card>
          ) : (
            posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div
                  onClick={() => handleOpenPostDetails(post)}
                  className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md space-y-3.5 group"
                >
                  {/* Top Bar: Author, Solved Status, Category */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary font-mono">
                        {formatInitials(post.author_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {post.author_name}
                          </span>
                          <span className="text-[10px] text-foreground-muted">@{post.author_username}</span>
                        </div>
                        <span className="text-[10px] text-foreground-muted block">
                          {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.is_solved ? (
                        <Badge variant="success" size="sm" className="gap-1 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          SOLVED
                        </Badge>
                      ) : (
                        post.category === "Questions" && (
                          <Badge variant="warning" size="sm" className="font-mono text-[10px]">
                            UNRESOLVED
                          </Badge>
                        )
                      )}
                      <Badge variant="outline" size="sm" className="text-[10px]">
                        {post.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Title & Preview */}
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-foreground-secondary mt-1.5 line-clamp-2 leading-relaxed font-normal">
                      {post.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {post.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.split(",").map((t) => (
                        <span
                          key={t.trim()}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-elevated border border-border text-foreground-muted"
                        >
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Stats & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-foreground-muted">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => handleUpvote(post.id, e)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer text-xs font-semibold ${
                          post.has_upvoted
                            ? "bg-primary/15 border-primary text-primary"
                            : "bg-surface-elevated border-border text-foreground-secondary hover:text-foreground"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{post.upvotes}</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-foreground-secondary">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comment_count || 0} answers</span>
                      </div>
                    </div>

                    <span className="text-[11px] text-primary font-semibold group-hover:underline">
                      View discussion thread →
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Right Column: Trending Tags & Rules (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Trending Cybersecurity Topics</h3>
            </div>
            <div className="space-y-2.5">
              {trendingTopics.map((topic) => (
                <button
                  key={topic.tag}
                  onClick={() => {
                    setSearchQuery(topic.tag.replace("#", ""));
                    fetchPosts();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-elevated transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs text-foreground font-mono font-medium hover:text-primary">
                    {topic.tag}
                  </span>
                  <Badge variant="primary" size="sm" className="font-mono text-[10px]">
                    {topic.count} posts
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Community Code of Conduct</h3>
            </div>
            <ul className="text-xs text-foreground-secondary space-y-2 leading-relaxed list-disc pl-4">
              <li>No leaking plain text CTF flags — explain methodology and debugging logic instead.</li>
              <li>Provide exact error messages and sanitized payloads when seeking help.</li>
              <li>Mark questions as <strong>SOLVED</strong> once you find a working solution.</li>
              <li>Maintain a supportive, constructive learning environment for all skill levels.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* CREATE POST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Ask a Question or Share Problem</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-bright transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Author Identity Pill */}
              <div className="px-6 pt-4 flex items-center justify-between text-xs bg-surface-elevated/40 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Posting as: <strong className="text-foreground">{user?.full_name || "Demo Student"}</strong> (@{user?.username || "student"})</span>
                </div>
                {!user && (
                  <button
                    type="button"
                    onClick={handleQuickDemoLogin}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Auto-Sign In</span>
                  </button>
                )}
              </div>

              {postError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{postError}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleQuickDemoLogin} className="text-xs shrink-0 py-1 h-7">
                    <Zap className="w-3 h-3 mr-1" /> Re-authenticate
                  </Button>
                </div>
              )}

              <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Problem Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SQL Injection auth bypass error with quotation delimiter in SQLite lab"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Category *</label>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      {categories.slice(1).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Tags (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. sqli, web, lab-3"
                      value={newPostTags}
                      onChange={(e) => setNewPostTags(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Problem Description &amp; Details *</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Describe what you are trying to do, the error logs or payload outputs received, and the steps you have attempted..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-xl p-4 text-xs font-mono text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isSubmittingPost} className="font-bold">
                    Publish Problem to Community
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL DISCUSSION & SOLUTIONS THREAD MODAL */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-border bg-surface-elevated flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                    {selectedPost.category}
                  </Badge>
                  {selectedPost.is_solved && (
                    <Badge variant="success" size="sm" className="gap-1 font-bold text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      SOLVED
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(user?.id === selectedPost.user_id || user?.role === "admin") && (
                    <>
                      <Button
                        variant={selectedPost.is_solved ? "outline" : "primary"}
                        size="sm"
                        onClick={() => handleToggleSolved(selectedPost.id)}
                        className="text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {selectedPost.is_solved ? "Reopen Problem" : "Mark as Solved"}
                      </Button>
                      <button
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="p-2 rounded-lg text-foreground-muted hover:text-error hover:bg-surface-bright transition-colors cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-bright transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Main Post Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary font-mono">
                        {formatInitials(selectedPost.author_name)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{selectedPost.author_name}</h4>
                        <p className="text-[10px] text-foreground-muted">
                          @{selectedPost.author_username} • {new Date(selectedPost.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvote(selectedPost.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                        selectedPost.has_upvoted
                          ? "bg-primary/15 border-primary text-primary"
                          : "bg-surface-elevated border-border text-foreground-secondary hover:text-foreground"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{selectedPost.upvotes}</span>
                    </button>
                  </div>

                  <h2 className="text-xl font-bold text-foreground leading-snug">{selectedPost.title}</h2>

                  <div className="p-4 rounded-2xl bg-surface-elevated/60 border border-border whitespace-pre-wrap text-xs md:text-sm text-foreground-secondary leading-relaxed font-sans">
                    {selectedPost.content}
                  </div>

                  {selectedPost.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPost.tags.split(",").map((t) => (
                        <span
                          key={t.trim()}
                          className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-surface-elevated border border-border text-foreground-muted"
                        >
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Answers & Solutions Thread */}
                <div className="pt-6 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span>Answers &amp; Solutions ({selectedPostDetails?.comments?.length || 0})</span>
                    </h3>
                  </div>

                  {commentError && (
                    <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center justify-between gap-2">
                      <span>{commentError}</span>
                      <Button size="sm" variant="outline" onClick={handleQuickDemoLogin} className="text-xs shrink-0 py-1 h-7">
                        <Zap className="w-3 h-3 mr-1" /> Re-authenticate
                      </Button>
                    </div>
                  )}

                  {loadingDetails ? (
                    <div className="py-8 text-center text-xs text-foreground-muted">Loading answers...</div>
                  ) : selectedPostDetails?.comments?.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-surface-elevated/40 border border-border text-center text-xs text-foreground-muted">
                      No answers posted yet. Help your fellow student by posting a solution below!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPostDetails?.comments?.map((comment: CommentItem) => (
                        <div
                          key={comment.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            comment.is_solution
                              ? "bg-success/10 border-success/30"
                              : "bg-surface-elevated/50 border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">{comment.author_name}</span>
                              <Badge
                                variant={comment.author_role === "instructor" || comment.author_role === "admin" ? "primary" : "outline"}
                                size="sm"
                                className="text-[9px] uppercase font-mono"
                              >
                                {comment.author_role || "student"}
                              </Badge>
                              {comment.is_solution && (
                                <Badge variant="success" size="sm" className="text-[9px] font-bold">
                                  Verified Solution
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-foreground-muted">
                              {new Date(comment.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground-secondary whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Answer Box */}
                  <form onSubmit={handleAddComment} className="pt-2 space-y-3">
                    <textarea
                      rows={3}
                      placeholder="Write your answer, payload suggestion, or debugging advice..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary resize-none leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={isSubmittingComment}
                        disabled={!newComment.trim()}
                        icon={<Send className="w-3.5 h-3.5" />}
                        className="font-bold"
                      >
                        Post Answer
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
