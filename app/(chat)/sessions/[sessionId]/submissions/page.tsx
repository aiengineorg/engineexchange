"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, Github, ExternalLink, Users, Crown, Plus, Lock } from "lucide-react";
import { EmailWarningBanner } from "@/components/email-warning-banner";

interface TeamMember {
  userId: string;
  displayName: string;
  contactEmail: string | null;
  images: string[] | null;
  isLead: boolean;
}

interface Team {
  id: string;
  name: string;
  teamNumber: string;
}

interface Submission {
  id: string;
  teamId: string;
  projectName: string;
  githubLink: string;
  description: string;
  demoLink?: string;
  techStack: string;
  problemStatement: string;
  fileUploads: string[];
  sponsorTech: string[];
  submittedAt: string;
}

interface SubmissionWithTeam {
  submission: Submission;
  team: Team;
  members: TeamMember[];
}

export default function SubmissionsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const isUnlocked = true;

  const [loading, setLoading] = useState(true);
  const [hasValidEmail, setHasValidEmail] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionWithTeam[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithTeam | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isUnlocked) {
      loadData();
    }
  }, [sessionId]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // Check email and team status
      const emailRes = await fetch(`/api/profiles/check-email?sessionId=${sessionId}`);
      const emailData = await emailRes.json();
      setHasValidEmail(emailData.hasValidEmail);
      setHasTeam(emailData.hasTeam);

      if (!emailData.hasValidEmail || !emailData.hasTeam) {
        setLoading(false);
        return;
      }

      // Load submissions
      const subRes = await fetch(`/api/submissions?sessionId=${sessionId}`);
      const subData = await subRes.json();

      if (!subRes.ok) {
        throw new Error(subData.error || "Failed to load submissions");
      }

      setSubmissions(subData);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-bfl-green" />
            <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">
              Hackathon
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
            Submissions
          </h1>
        </div>

        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-12 md:p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-bfl-muted" />
          </div>
          <h2 className="text-3xl md:text-4xl font-normal text-white tracking-tighter uppercase mb-4">
            Coming Soon
          </h2>
          <p className="text-bfl-muted font-medium max-w-md mx-auto mb-2">
            Project submissions will open shortly. Check back soon to submit your hackathon project.
          </p>
          <p className="text-xs text-bfl-muted/60 font-mono">
            Stay tuned for updates
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto text-bfl-green animate-spin mb-4" />
          <p className="text-bfl-muted text-sm">Loading submissions...</p>
        </div>
      </div>
    );
  }

  // Show warning if no email
  if (!hasValidEmail) {
    return (
      <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-bfl-green" />
            <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">
              Hackathon
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
            Submissions
          </h1>
        </div>
        <EmailWarningBanner
          sessionId={sessionId}
          message="You need a contact email to view and create submissions"
        />
      </div>
    );
  }

  // Show warning if no team
  if (!hasTeam) {
    return (
      <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-bfl-green" />
            <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">
              Hackathon
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
            Submissions
          </h1>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-sm">
          <div className="flex items-start gap-4">
            <Users className="text-amber-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <p className="text-amber-200 font-medium mb-2">You must be part of a team to view submissions</p>
              <Link
                href={`/sessions/${sessionId}/teams`}
                className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors font-mono uppercase tracking-wider"
              >
                <Users size={14} />
                Go to Teams
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-bfl-green" />
            <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">
              Hackathon
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
            Submissions
          </h1>
          <p className="text-bfl-muted font-medium max-w-lg">
            Browse all hackathon project submissions from participating teams.
          </p>
        </div>
        <Link
          href={`/sessions/${sessionId}/submissions/my-team`}
          className="px-6 py-3 bg-bfl-green text-black font-bold text-xs uppercase tracking-[0.15em] hover:bg-bfl-green/90 transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          My Submission
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Submissions Grid */}
      {submissions.length === 0 ? (
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-bfl-muted mb-6" />
          <h3 className="text-xl text-white mb-3">No submissions yet</h3>
          <p className="text-bfl-muted mb-8 max-w-md mx-auto">
            Be the first to submit your project! Teams can submit one project for the hackathon.
          </p>
          <Link
            href={`/sessions/${sessionId}/submissions/my-team`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-bfl-green text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-bfl-green/90 transition-all"
          >
            <Plus size={18} />
            Submit Your Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map(({ submission, team, members }) => (
            <button
              key={submission.id}
              onClick={() => setSelectedSubmission({ submission, team, members })}
              className="text-left bg-white/[0.08] backdrop-blur-sm border border-white/10 p-6 hover:border-bfl-green/50 hover:bg-white/[0.1] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg text-white font-medium mb-1">{submission.projectName}</h3>
                  <p className="text-xs text-bfl-muted font-mono">Team #{team.teamNumber} · {team.name}</p>
                </div>
                <FileText className="text-bfl-green flex-shrink-0" size={20} />
              </div>
              <p className="text-sm text-bfl-muted line-clamp-3 mb-4">
                {submission.description}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {submission.techStack.split(",").slice(0, 3).map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-white/[0.06] text-xs text-bfl-muted"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
              <div className="flex -space-x-2">
                {members.slice(0, 4).map((member, i) => (
                  member.images?.[0] ? (
                    <img
                      key={i}
                      src={member.images[0]}
                      alt={member.displayName}
                      className="w-8 h-8 rounded-full border-2 border-bfl-black object-cover"
                    />
                  ) : (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-bfl-black bg-white/10 flex items-center justify-center"
                    >
                      <Users size={12} className="text-bfl-muted" />
                    </div>
                  )
                ))}
                {members.length > 4 && (
                  <div className="w-8 h-8 rounded-full border-2 border-bfl-black bg-white/10 flex items-center justify-center">
                    <span className="text-xs text-bfl-muted">+{members.length - 4}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setSelectedSubmission(null)}
          />
          <div className="relative bg-bfl-black border border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-bfl-muted hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="mb-6">
              <h2 className="text-2xl text-white font-medium mb-2">
                {selectedSubmission.submission.projectName}
              </h2>
              <p className="text-bfl-muted font-mono text-sm">
                Team #{selectedSubmission.team.teamNumber} · {selectedSubmission.team.name}
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-4 mb-6">
              <a
                href={selectedSubmission.submission.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/15 text-white text-sm hover:bg-white/10 transition-all"
              >
                <Github size={16} />
                GitHub
              </a>
              {selectedSubmission.submission.demoLink && (
                <a
                  href={selectedSubmission.submission.demoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-bfl-green/20 border border-bfl-green/30 text-bfl-green text-sm hover:bg-bfl-green/30 transition-all"
                >
                  <ExternalLink size={16} />
                  Demo
                </a>
              )}
            </div>

            {/* Problem Statement */}
            <div className="mb-6">
              <h3 className="text-sm text-bfl-muted font-mono uppercase tracking-wider mb-2">
                Problem Statement
              </h3>
              <p className="text-white text-sm leading-relaxed">
                {selectedSubmission.submission.problemStatement}
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm text-bfl-muted font-mono uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                {selectedSubmission.submission.description}
              </p>
            </div>

            {/* Tech Stack */}
            <div className="mb-6">
              <h3 className="text-sm text-bfl-muted font-mono uppercase tracking-wider mb-2">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedSubmission.submission.techStack.split(",").map((tech, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-white/[0.06] text-sm text-white"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Sponsor Tech */}
            {selectedSubmission.submission.sponsorTech && selectedSubmission.submission.sponsorTech.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm text-bfl-muted font-mono uppercase tracking-wider mb-2">
                  Sponsor Tech Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSubmission.submission.sponsorTech.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-bfl-green/20 border border-bfl-green/30 text-sm text-bfl-green"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members */}
            <div>
              <h3 className="text-sm text-bfl-muted font-mono uppercase tracking-wider mb-3">
                Team Members
              </h3>
              <div className="space-y-3">
                {selectedSubmission.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-4 p-3 bg-white/[0.04] border border-white/10"
                  >
                    {member.images?.[0] ? (
                      <img
                        src={member.images[0]}
                        alt={member.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Users size={18} className="text-bfl-muted" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{member.displayName}</p>
                        {member.isLead && <Crown size={14} className="text-amber-400" />}
                      </div>
                      {member.contactEmail && (
                        <p className="text-xs text-bfl-muted">{member.contactEmail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
