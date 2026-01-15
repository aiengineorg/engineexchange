"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CardStack } from "@/components/matching/card-stack";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, X, Zap, Linkedin, ExternalLink, ArrowRight, Share2 } from "lucide-react";

interface Profile {
  id: string;
  displayName: string;
  whatIOffer: string;
  whatImLookingFor: string;
  similarity?: number;
  matchReason?: string;
  searchedField?: "what_i_offer" | "what_im_looking_for";
  images?: string[];
}

// Sample profiles for testing
const MOCK_PROFILES: Profile[] = [
  {
    id: 'NODE-991',
    displayName: 'Elena Vance',
    whatIOffer: 'Deep expertise in React Native and performance optimization for mobile apps. I specialize in building mission-critical interfaces that maintain 60fps under extreme data loads.',
    whatImLookingFor: 'A backend architect who treats infrastructure as an art form. Specifically looking for Rust or Go expertise to collaborate on a decentralized communication layer.',
    similarity: 0.94,
    matchReason: 'Structural alignment detected in high-performance architectures and real-time messaging protocols. Both nodes prioritize low-latency execution and memory safety.',
    images: ['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800&h=1200'],
  },
  {
    id: 'NODE-742',
    displayName: 'Marcus Thorne',
    whatIOffer: 'Computational geometry and WebGL optimization. I translate high-level spatial concepts into performant browser-based 3D environments using Three.js and custom shaders.',
    whatImLookingFor: 'Creative UX Designers who are bored with 2D screens. I need visionaries to help define the interface language for the next generation of spatial computing.',
    similarity: 0.88,
    matchReason: 'Cross-functional synergy between Marcus\'s specialized 3D stack and your product vision. High potential for zero-to-one innovation in AR/VR spaces.',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800&h=1200'],
  },
  {
    id: 'NODE-112',
    displayName: 'Sarah Jenkins',
    whatIOffer: 'Strategic Product Management for AI-first B2B SaaS. I excel at converting complex vector-space capabilities into intuitive features that enterprise customers actually pay for.',
    whatImLookingFor: 'LLM researchers and engineers who want to see their models deployed in the wild. Looking for partners to build robust business intelligence tools.',
    similarity: 0.76,
    matchReason: 'Complementary skillsets for scaling AI-first applications within enterprise ecosystems. Your technical depth perfectly offsets Sarah\'s market-facing strategy.',
    images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800&h=1200'],
  },
  {
    id: 'NODE-445',
    displayName: 'Alex Chen',
    whatIOffer: 'Full-stack development with expertise in distributed systems, microservices architecture, and cloud infrastructure. Specialized in building scalable backend systems using Node.js, Python, and Kubernetes.',
    whatImLookingFor: 'Frontend engineers passionate about creating beautiful, performant user experiences. Looking for someone to collaborate on building the next generation of web applications.',
    similarity: 0.82,
    matchReason: 'Strong technical alignment in modern web development stack. Both nodes demonstrate expertise in building production-ready applications.',
    images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800&h=1200'],
  },
  {
    id: 'NODE-223',
    displayName: 'Jordan Taylor',
    whatIOffer: 'Data science and machine learning engineering. I build predictive models and data pipelines that help businesses make data-driven decisions. Expertise in Python, TensorFlow, and cloud ML platforms.',
    whatImLookingFor: 'Software engineers who understand the full stack and can help deploy ML models into production. Looking for someone to bridge the gap between data science and engineering.',
    similarity: 0.79,
    matchReason: 'Complementary skills in data engineering and software development. High potential for building end-to-end ML systems.',
    images: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800&h=1200'],
  },
];

export default function DiscoverPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"offers" | "looking_for">("offers");
  const [useMockData, setUseMockData] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const loadProfiles = async (customQuery?: string, isSearch = false, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (isSearch) {
      setSearching(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const url = new URL("/api/feed/discover", window.location.origin);
      url.searchParams.set("sessionId", sessionId);
      if (customQuery) {
        url.searchParams.set("query", customQuery);
        url.searchParams.set("searchField", searchField);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.details || data.error || "Failed to load profiles";
        throw new Error(errorMsg);
      }

      const data = await response.json();
      // If no profiles returned, use mock data for testing
      if (data.length === 0 && !customQuery) {
        setProfiles(MOCK_PROFILES);
        setUseMockData(true);
      } else {
        setProfiles(data);
        setUseMockData(false);
      }
    } catch (err) {
      // On error, use mock data for testing
      console.warn("Failed to load profiles, using mock data:", err);
      setProfiles(MOCK_PROFILES);
      setUseMockData(true);
      setError("");
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else if (isSearch) {
        setSearching(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Check if profile exists on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/me?sessionId=${sessionId}`);
        
        if (response.status === 404) {
          // Profile doesn't exist, redirect to profile creation
          router.push(`/sessions/${sessionId}/profile/new`);
          return;
        }
        
        if (!response.ok) {
          throw new Error("Failed to check profile");
        }
        
        // Profile exists, load profiles
        loadProfiles();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setLoading(false);
      }
    };
    
    checkProfile();
  }, [sessionId, router]);

  const handleSwipe = async (profileId: string, decision: "yes" | "no") => {
    // If using mock data, just remove the card from the stack
    if (useMockData) {
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      if (decision === "yes") {
        console.log("Mock match with:", profileId);
      }
      return;
    }

    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: profileId,
          sessionId,
          decision,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to swipe");
      }

      const result = await response.json();

      // Show match modal if matched
      if (result.matched) {
        alert(`It's a Match! 🎉`); // TODO: Replace with proper match modal
        router.push(`/sessions/${sessionId}/matches`);
      }
    } catch (err) {
      console.error("Swipe error:", err);
      // On error, just remove from local state
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadProfiles(searchQuery, true);
    }
  };

  const handleCardClick = (profile: Profile) => {
    setSelectedProfile(profile);
  };

  const handleSwipeFromDetail = (direction: "left" | "right") => {
    if (selectedProfile) {
      const decision = direction === "right" ? "yes" : "no";
      handleSwipe(selectedProfile.id, decision);
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mb-6 mx-auto">
            <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="text-bfl-green" size={24} />
            </div>
          </div>
          <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">Loading Profiles</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center bg-white/[0.02] subtle-border p-8">
          <p className="text-red-400 mb-4 font-mono text-sm">{error}</p>
          <p className="text-sm text-bfl-muted mb-6 font-medium">
            If you just created your profile, please wait a moment for embeddings to be generated.
          </p>
          <button 
            onClick={() => loadProfiles()} 
            className="px-8 py-3 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const ProfileDetail = ({ profile, onClose, onSwipe }: { profile: Profile; onClose: () => void; onSwipe: (dir: "left" | "right") => void }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[100] bg-bfl-black flex flex-col overflow-y-auto"
      >
        {/* Fixed Technical Header */}
        <div className="sticky top-0 z-50 glass border-b border-white/10 p-6 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-bfl-green uppercase tracking-[0.4em]">Neural Sync View</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-white font-black tracking-widest text-sm uppercase italic">{profile.displayName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-w-3xl mx-auto w-full pb-32">
          {/* Immersive Hero Image */}
          <div className="relative h-[60vh] w-full mb-12">
            {profile.images?.[0] ? (
              <img
                src={profile.images[0]}
                className="w-full h-full object-cover grayscale-[0.1]"
                alt={profile.displayName}
              />
            ) : (
              <div className="w-full h-full bg-bfl-dark" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bfl-black via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10">
              <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase mb-2 text-glow">
                {profile.displayName}
              </h1>
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-bfl-green font-bold uppercase tracking-[0.3em]">
                  {profile.id} / SYNCHRONIZED
                </span>
              </div>
            </div>
          </div>

          {/* Technical Sections */}
          <div className="px-6 space-y-16">
            <div className="relative pt-8 border-t border-white/10">
              <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
                01 / Strategic Value
              </span>
              <h4 className="text-2xl font-bold text-white italic mb-6">"I am currently offering..."</h4>
              <p className="text-xl text-bfl-muted leading-relaxed font-light italic">{profile.whatIOffer}</p>
            </div>

            <div className="relative pt-8 border-t border-white/10">
              <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
                02 / Search Parameters
              </span>
              <h4 className="text-2xl font-bold text-white italic mb-6">"I'm searching for nodes with..."</h4>
              <p className="text-xl text-bfl-muted leading-relaxed font-light italic">{profile.whatImLookingFor}</p>
            </div>

            {profile.similarity !== undefined && (
              <div className="relative pt-8 border-t border-white/10">
                <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
                  03 / AI Synergy Analysis
                </span>
                <div className="bg-white/[0.02] subtle-border p-8 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-bfl-green" />
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Zap className="text-bfl-green" size={20} fill="currentColor" />
                      <span className="font-mono text-sm font-bold text-white uppercase tracking-widest">
                        Similarity: {Math.round(profile.similarity * 100)}%
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-bfl-green/20 border border-bfl-green/50 text-[10px] text-bfl-green font-black uppercase tracking-widest rounded">
                      Validated
                    </div>
                  </div>
                  {profile.matchReason && (
                    <p className="text-sm text-bfl-muted leading-relaxed italic border-l border-white/10 pl-6 py-2">
                      {profile.matchReason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Persistent Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-8 glass border-t border-white/10">
          <div className="max-w-xl mx-auto flex gap-6">
            <button
              onClick={() => {
                onSwipe("left");
                onClose();
              }}
              className="flex-1 py-5 border border-red-500/20 text-red-500 font-black text-xs uppercase tracking-[0.4em] hover:bg-red-500/10 transition-all italic rounded-sm"
            >
              Decline Node
            </button>
            <button
              onClick={() => {
                onSwipe("right");
                onClose();
              }}
              className="flex-2 px-12 py-5 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.4em] hover:bg-bfl-offwhite transition-all italic rounded-sm"
            >
              Initiate Connection
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="px-6 py-12 md:px-12 max-w-5xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-bfl-green" />
            <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Find People</span>
          </div>
          <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">Discover</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setProfiles(MOCK_PROFILES);
              setUseMockData(true);
            }}
            className="flex items-center gap-3 px-6 py-3 border border-bfl-green/50 text-bfl-green font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-bfl-green/10 transition-all"
          >
            Load Sample Cards
          </button>
          <button 
            onClick={() => loadProfiles(undefined, false, true)}
            disabled={refreshing}
            className="flex items-center gap-3 px-6 py-3 border border-white/10 text-bfl-muted font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Reset Registry Stack
          </button>
        </div>
      </div>

      <div className="mb-20">
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          <Select value={searchField} onValueChange={(value: "offers" | "looking_for") => setSearchField(value)}>
            <SelectTrigger className="w-full md:w-auto min-w-[180px] h-auto py-6 px-6 bg-white/[0.02] border border-white/10 rounded-sm text-white font-mono text-sm uppercase tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all">
              <SelectValue placeholder="Search field" />
            </SelectTrigger>
            <SelectContent className="bg-bfl-dark border border-white/10 rounded-sm">
              <SelectItem value="offers" className="font-mono text-sm uppercase tracking-widest py-3 text-white focus:bg-white/10 focus:text-white">I can offer</SelectItem>
              <SelectItem value="looking_for" className="font-mono text-sm uppercase tracking-widest py-3 text-white focus:bg-white/10 focus:text-white">Looking for</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="text-white/20" size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by skills, expertise..."
              className="w-full pl-16 pr-6 py-6 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || searching}
            className="px-10 py-6 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all disabled:opacity-50 rounded-sm whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start relative">
        {profiles.length === 0 && !loading ? (
          <div className="text-center py-32 px-12 bg-white/[0.02] border border-white/5 rounded-sm w-full max-w-2xl">
            <div className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.6em] mb-8">All Caught Up</div>
            <h3 className="text-5xl font-extrabold text-white mb-6 italic tracking-tighter">NO MORE FOR NOW!</h3>
            <p className="text-bfl-muted mb-12 font-medium max-w-md mx-auto leading-relaxed">
              You've seen everyone for today. Check back later for new people or try adjusting your search.
            </p>
            <button
              onClick={() => loadProfiles()}
              className="px-12 py-5 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="relative w-full flex justify-center h-[700px]">
            <CardStack
              profiles={profiles}
              sessionId={sessionId}
              onSwipe={handleSwipe}
              onCardClick={setSelectedProfile}
            />
            {(searching || refreshing) && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center glass rounded-sm max-w-[420px] border border-white/20">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
                  <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="text-bfl-green" size={32} />
                  </div>
                </div>
                <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">Computing Embeddings</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Profile Detail Overlay */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetail
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            onSwipe={handleSwipeFromDetail}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
