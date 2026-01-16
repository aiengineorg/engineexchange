import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionsByUserId, getAvailableSessions } from "@/lib/db/queries";
import { auth } from "../(auth)/auth";
import { Plus, Users, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user's existing sessions and available sessions
  const [userSessions, availableSessions] = await Promise.all([
    getSessionsByUserId(session.user.id),
    getAvailableSessions(session.user.id),
  ]);

  const allSessions = [...userSessions, ...availableSessions];

  return (
    <div className="px-6 py-20 md:px-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="mb-32 relative">
        <div className="max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-white/5 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-bfl-green animate-pulse" />
            <span className="font-mono text-[10px] font-bold text-bfl-muted uppercase tracking-[0.4em]">Exchange Intelligence Platform 2.5</span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-extrabold text-white tracking-tighter mb-8 leading-[0.9] text-glow italic">
            WELCOME TO <br />
            <span className="text-bfl-green not-italic">AI ENGINE EXCHANGE.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-bfl-muted mb-12 leading-relaxed max-w-2xl font-light">
            Engineered for high-impact professional matching. Utilizing neural embeddings to bridge the gap between human ambition and technical capability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <Link 
              href="/sessions/new"
              className="px-10 py-5 bg-white text-bfl-black rounded-sm font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-bfl-offwhite transition-all transform hover:translate-y-[-2px]"
            >
              <span className="text-bfl-black">Initialize Session</span>
              <Plus size={16} strokeWidth={3} className="text-bfl-black" />
            </Link>
            <Link 
              href="/sessions/join"
              className="px-10 py-5 bg-bfl-dark border border-white/10 text-white rounded-sm font-bold text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
            >
              <span className="text-white">Secure Access</span>
              <ArrowRight size={16} className="text-white" />
            </Link>
          </div>
        </div>
      </section>

      {/* Grid Layout for content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 blueprint-line" />
            <h2 className="font-mono text-xs font-bold text-bfl-green uppercase tracking-[0.5em]">Active Registries</h2>
            <div className="h-px w-10 blueprint-line" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allSessions.map(s => (
              <Link 
                key={s.id} 
                href={userSessions.some(us => us.id === s.id) ? `/sessions/${s.id}/discover` : `/sessions/join?code=${s.code}`}
                className="group relative bg-bfl-black subtle-border p-8 hover:border-white/20 transition-all overflow-hidden"
              >
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-12">
                    <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.3em]">Code: {s.code}</span>
                    <Zap size={14} className="text-bfl-green/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-glow transition-all uppercase tracking-tighter">{s.name}</h3>
                  <div className="flex items-center gap-3 text-bfl-muted font-mono text-[10px] tracking-widest uppercase">
                    <Users size={12} />
                    {s.profileCount} Verified Profiles
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="text-white" size={24} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px w-10 blueprint-line" />
            <h2 className="font-mono text-xs font-bold text-bfl-green uppercase tracking-[0.5em]">System Specs</h2>
            <div className="h-px flex-1 blueprint-line" />
          </div>

          <div className="bg-white/[0.02] subtle-border p-10 space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white font-bold uppercase tracking-widest text-sm italic">
                <Sparkles size={18} className="text-bfl-green" />
                Vector Intelligence
              </div>
              <p className="text-xs text-bfl-muted leading-relaxed font-medium">Our neural engine maps professional identities into N-dimensional space for ultra-precise similarity detection.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white font-bold uppercase tracking-widest text-sm italic">
                <Shield size={18} className="text-bfl-green" />
                E2E Protocol
              </div>
              <p className="text-xs text-bfl-muted leading-relaxed font-medium">Connections are verified through local LLM processing, ensuring private data never leaves the encrypted node.</p>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-mono text-bfl-muted uppercase tracking-[0.3em]">System Health</div>
                <div className="text-white font-mono text-xs font-bold uppercase tracking-widest mt-1">Operational</div>
              </div>
              <div className="w-12 h-12 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
