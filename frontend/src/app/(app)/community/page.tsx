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
} from "lucide-react";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { api } from "@/lib/api";

const categories = ["All", "General", "Writeups", "Questions", "Announcements", "Security News"];

const initialPosts = [
  {
    id: "post-1",
    title: "SQL Injection Bypass on Book Recon Challenge - Walkthrough",
    category: "Writeups",
    author: "RootHacker",
    avatar: "RH",
    time: "2 hours ago",
    preview: "For anyone struggling with the SQL Injection login bypass challenge, the trick is to check how the server constructs the SQL query. Here is a step by step analysis of the query concatenation...",
    upvotes: 45,
    comments: 12,
    hasUpvoted: false,
  },
  {
    id: "post-2",
    title: "Vulnerabilities discovered in common OAuth libraries",
    category: "Security News",
    author: "CyberSec_Ann",
    avatar: "CS",
    time: "5 hours ago",
    preview: "A critical flaw was recently disclosed in multiple OpenID Connect/OAuth client SDKs that allows account takeover under specific configurations. Ensure you update your npm/pip packages immediately...",
    upvotes: 32,
    comments: 4,
    hasUpvoted: false,
  },
  {
    id: "post-3",
    title: "How to set up a home lab for malware analysis?",
    category: "Questions",
    author: "JuniorBug",
    avatar: "JB",
    time: "1 day ago",
    preview: "I want to start analyzing real-world malware samples in a safe sandbox. Should I use virtual box or standard isolated containers? What configurations do you recommend for host network isolation?",
    upvotes: 18,
    comments: 19,
    hasUpvoted: false,
  },
];

const trendingTopics = [
  { tag: "#WiresharkTutorial", count: 128 },
  { tag: "#SQLiBypass", count: 95 },
  { tag: "#PrivEscTips", count: 72 },
  { tag: "#OWASPTop10", count: 64 },
];

interface PostItem {
  id: string;
  title: string;
  category: string;
  author: string;
  avatar: string;
  time: string;
  preview: string;
  upvotes: number;
  comments: number;
  hasUpvoted: boolean;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Post dialog modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("General");
  const [newPostContent, setNewPostContent] = useState("");

  const fetchPosts = () => {
    api.getPosts()
      .then((data) => {
        if (data && data.length > 0) {
          const formatted = data.map((p: { id: string; title: string; category?: string; user_id?: string; content: string; upvotes?: number }) => ({
            id: p.id,
            title: p.title,
            category: p.category || "General",
            author: p.user_id === "system-admin-id" ? "Admin" : "Learner",
            avatar: "LN",
            time: "Recently",
            preview: p.content,
            upvotes: p.upvotes || 1,
            comments: 0,
            hasUpvoted: false,
          }));
          setPosts(formatted);
        }
      })
      .catch((err) => console.log("Backend offline, utilizing cached forum feed:", err));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleUpvote = (postId: string) => {
    const numId = parseInt(postId, 10);
    if (!isNaN(numId)) {
      api.upvotePost(numId).catch((err) => console.log("Upvote sync error:", err));
    }
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            upvotes: p.hasUpvoted ? p.upvotes - 1 : p.upvotes + 1,
            hasUpvoted: !p.hasUpvoted,
          };
        }
        return p;
      })
    );
  };


  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle || !newPostContent) return;

    api.createPost({
      title: newPostTitle,
      content: newPostContent,
      category: newPostCategory,
    })
      .then(() => {
        fetchPosts();
        setShowCreateModal(false);
        setNewPostTitle("");
        setNewPostContent("");
      })
      .catch((err) => {
        console.log("Could not post to backend, prepending locally:", err);
        const newPost = {
          id: `local-${posts.length + 1}`,
          title: newPostTitle,
          category: newPostCategory,
          author: "You",
          avatar: "YO",
          time: "Just now",
          preview: newPostContent,
          upvotes: 1,
          comments: 0,
          hasUpvoted: true,
        };
        setPosts([newPost, ...posts]);
        setShowCreateModal(false);
        setNewPostTitle("");
        setNewPostContent("");
      });
  };

  const filteredPosts = posts.filter((p) => {
    const matchCategory = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Community</h1>
            <p className="text-foreground-secondary mt-1">
              Discuss writeups, security news, ask questions, and share knowledge.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} icon={<PenTool className="w-4 h-4" />}>
            Create Post
          </Button>
        </div>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Feed (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer ${
                    activeCategory === cat
                      ? "bg-primary text-white"
                      : "bg-surface-elevated text-foreground-secondary hover:text-foreground border border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search forum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-[var(--radius-lg)] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
              />
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} padding="lg" hover className="transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={post.author} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{post.author}</p>
                      <p className="text-[10px] text-foreground-muted">{post.time}</p>
                    </div>
                  </div>
                  <Badge variant={post.category === "Announcements" ? "danger" : "primary"} size="sm">
                    {post.category}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer">
                  {post.title}
                </h3>
                <p className="text-xs text-foreground-secondary mb-4 leading-relaxed line-clamp-3 font-normal">
                  {post.preview}
                </p>

                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-foreground-muted font-semibold">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleUpvote(post.id)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-[var(--radius-sm)] transition-colors cursor-pointer hover:bg-surface-elevated ${
                        post.hasUpvoted ? "text-primary bg-primary/10" : ""
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{post.upvotes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 py-1 px-2.5 rounded-[var(--radius-sm)] hover:bg-surface-elevated transition-colors cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.comments} comments</span>
                    </button>
                  </div>

                  <button className="flex items-center gap-1.5 py-1 px-2.5 rounded-[var(--radius-sm)] hover:bg-surface-elevated transition-colors cursor-pointer">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </Card>
            ))}

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
                <p className="text-foreground-secondary">No discussions found matching filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Trending Tags</h3>
            </div>
            <div className="space-y-3">
              {trendingTopics.map((topic) => (
                <div key={topic.tag} className="flex items-center justify-between">
                  <span className="text-xs text-foreground-secondary font-mono cursor-pointer hover:text-primary transition-colors">
                    {topic.tag}
                  </span>
                  <Badge variant="primary" size="sm" className="bg-primary/5 border border-primary/20 text-primary">
                    {topic.count} posts
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">Community Rules</h3>
            <ul className="text-xs text-foreground-secondary space-y-2 leading-relaxed list-disc pl-4 font-normal">
              <li>No sharing flags or exact payload solutions.</li>
              <li>Explain vulnerability methodologies clearly.</li>
              <li>Be helpful and patient with beginner security learners.</li>
              <li>Report offensive content or spam.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Create Post Modal Dialog */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-surface border border-border rounded-[var(--radius-xl)] shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/40">
                <h3 className="text-lg font-bold text-foreground">Create Discussion Post</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-secondary">Post Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter a descriptive title..."
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-secondary">Category</label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200"
                  >
                    {categories.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground-secondary">Content</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Write details of your discussion post..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-surface-elevated border border-border rounded-[var(--radius)] px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all duration-200 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Submit Post</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
