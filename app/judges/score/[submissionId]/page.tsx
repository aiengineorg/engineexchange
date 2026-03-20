"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Github,
  ExternalLink,
  Crown,
  Star,
  Trash2,
} from "lucide-react";

interface TeamMember {
  displayName: string;
  isLead: boolean;
}

interface Team {
  id: string;
  name: string;
  teamNumber: string;
}

interface Submission {
  id: string;
  projectName: string;
  githubLink: string;
  demoLink: string | null;
  description: string;
  problemStatement: string;
  techStack: string;
  sponsorTech: string[];
  fileUploads: string[];
  // Hidden feedback fields (visible only to judges)
  sponsorFeatureFeedback?: string;
  mediaPermission?: string;
  eventFeedback?: string;
}

interface ExistingScore {
  id: string;
  futurePotential: string;
  demo: string;
  creativity: string;
  pitchingQuality: string;
  brainRot: string | null;
  additionalComments: string | null;
}

interface SubmissionData {
  submission: Submission;
  team: Team;
  members: TeamMember[];
  hasScored: boolean;
  existingScore: ExistingScore | null;
}

interface ScoreFormData {
  futurePotential: string;
  demo: string;
  creativity: string;
  pitchingQuality: string;
  brainRot: string;
  additionalComments: string;
}

const SCORE_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function ScoreSubmissionPageContent({
  submissionId,
}: {
  submissionId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const judgeId = searchParams.get("judgeId");
  const judgeName = searchParams.get("judgeName");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [error, setError] = useState("");

  const [scoreForm, setScoreForm] = useState<ScoreFormData>({
    futurePotential: "",
    demo: "",
    creativity: "",
    pitchingQuality: "",
    brainRot: "false",
    additionalComments: "",
  });

  useEffect(() => {
    if (!judgeId) {
      router.push("/judges");
      return;
    }
    loadSubmission();
  }, [submissionId, judgeId]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/judges/submissions?judgeId=${judgeId}`);
      const data = await response.json();
      const found = data.submissions?.find(
        (s: SubmissionData) => s.submission.id === submissionId
      );

      if (found) {
        setSubmissionData(found);
        if (found.existingScore) {
          setScoreForm({
            futurePotential: found.existingScore.futurePotential,
            demo: found.existingScore.demo,
            creativity: found.existingScore.creativity,
            pitchingQuality: found.existingScore.pitchingQuality,
            brainRot: found.existingScore.brainRot || "false",
            additionalComments: found.existingScore.additionalComments || "",
          });
        }
      } else {
        setError("Submission not found");
      }
    } catch (err) {
      setError("Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeId || !submissionData) return;

    if (!scoreForm.futurePotential || !scoreForm.demo || !scoreForm.creativity || !scoreForm.pitchingQuality) {
      setError("Please fill in all required scores");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/judges/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeId,
          submissionId: submissionData.submission.id,
          ...scoreForm,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit score");
      }

      // Redirect back to judges page
      router.push(`/judges?judgeId=${judgeId}&judgeName=${encodeURIComponent(judgeName || "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit score");
      setSaving(false);
    }
  };

  const handleDeleteScore = async () => {
    if (!judgeId || !submissionData) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/judges/scores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeId,
          submissionId: submissionData.submission.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete score");
      }

      // Redirect back to judges page
      router.push(`/judges?judgeId=${judgeId}&judgeName=${encodeURIComponent(judgeName || "")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete score");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const calculateTotal = () => {
    const fp = parseInt(scoreForm.futurePotential) || 0;
    const demo = parseInt(scoreForm.demo) || 0;
    const creativity = parseInt(scoreForm.creativity) || 0;
    const pitching = parseInt(scoreForm.pitchingQuality) || 0;
    const brainRotPenalty = scoreForm.brainRot === "true" ? -1 : 0;
    return fp + demo + creativity + pitching + brainRotPenalty;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4a9eed] animate-spin" />
      </div>
    );
  }

  if (!submissionData) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white/50 mb-4">{error || "Submission not found"}</p>
          <Link
            href={`/judges?judgeId=${judgeId}&judgeName=${encodeURIComponent(judgeName || "")}`}
            className="text-[#4a9eed] hover:underline"
          >
            Back to Judges Portal
          </Link>
        </div>
      </div>
    );
  }

  const { submission, team, members } = submissionData;

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href={`/judges?judgeId=${judgeId}&judgeName=${encodeURIComponent(judgeName || "")}`}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-mono uppercase tracking-wider">Back to Submissions</span>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px w-6 bg-[#4a9eed]" />
            <span className="font-mono text-[10px] text-[#4a9eed] uppercase tracking-[0.4em]">
              Scoring as {judgeName}
            </span>
          </div>
          <h1 className="text-3xl font-normal tracking-tight">
            {submission.projectName}
          </h1>
          <p className="text-white/50 mt-1">
            Team #{team.teamNumber} · {team.name}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submission Details */}
          <div className="space-y-6">
            {/* Links */}
            <div className="flex gap-3">
              <a
                href={submission.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/15 text-white text-sm hover:bg-white/10 transition-all"
              >
                <Github size={16} />
                GitHub
              </a>
              {submission.demoLink && (
                <a
                  href={submission.demoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#4a9eed]/20 border border-[#4a9eed]/30 text-[#4a9eed] text-sm hover:bg-[#4a9eed]/30 transition-all"
                >
                  <ExternalLink size={16} />
                  Demo
                </a>
              )}
            </div>

            {/* Problem Statement */}
            <div className="bg-white/[0.04] border border-white/10 p-6">
              <h3 className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Problem Statement
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {submission.problemStatement}
              </p>
            </div>

            {/* Description */}
            <div className="bg-white/[0.04] border border-white/10 p-6">
              <h3 className="text-xs text-white/50 uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                {submission.description}
              </p>
            </div>

            {/* Tech Stack */}
            <div className="bg-white/[0.04] border border-white/10 p-6">
              <h3 className="text-xs text-white/50 uppercase tracking-wider mb-3">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {submission.techStack.split(",").map((tech, i) => (
                  <span key={i} className="px-2 py-1 bg-white/[0.06] text-xs text-white/70">
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Sponsor Tech */}
            {submission.sponsorTech.length > 0 && (
              <div className="bg-white/[0.04] border border-white/10 p-6">
                <h3 className="text-xs text-white/50 uppercase tracking-wider mb-3">
                  Sponsor Tech Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {submission.sponsorTech.map((tech, i) => (
                    <span key={i} className="px-2 py-1 bg-[#4a9eed]/20 text-xs text-[#4a9eed]">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* File Uploads */}
            {submission.fileUploads.length > 0 && (
              <div className="bg-white/[0.04] border border-white/10 p-6">
                <h3 className="text-xs text-white/50 uppercase tracking-wider mb-3">
                  Attachments
                </h3>
                <div className="flex flex-wrap gap-2">
                  {submission.fileUploads.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white/[0.06] text-sm text-[#4a9eed] hover:bg-white/10 transition-all"
                    >
                      File {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members */}
            <div className="bg-white/[0.04] border border-white/10 p-6">
              <h3 className="text-xs text-white/50 uppercase tracking-wider mb-3">
                Team Members
              </h3>
              <div className="flex flex-wrap gap-2">
                {members.map((m, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] text-sm text-white/70">
                    {m.displayName}
                    {m.isLead && <Crown size={12} className="text-amber-400" />}
                  </span>
                ))}
              </div>
            </div>

            {/* Hidden Feedback (Judges Only) */}
            {(submission.sponsorFeatureFeedback || submission.eventFeedback || submission.mediaPermission) && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-6">
                <h3 className="text-xs text-amber-400 uppercase tracking-wider mb-4">
                  Participant Feedback (Judges Only)
                </h3>

                {submission.sponsorFeatureFeedback && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-1">Sponsor Feature Feedback:</p>
                    <p className="text-sm text-white/80">{submission.sponsorFeatureFeedback}</p>
                  </div>
                )}

                {submission.eventFeedback && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-1">Event Feedback:</p>
                    <p className="text-sm text-white/80">{submission.eventFeedback}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-white/50 mb-1">Media Permission:</p>
                  <p className="text-sm text-white/80">
                    {submission.mediaPermission === "true" ? "Granted" : "Not Granted"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Scoring Form */}
          <div>
            <form onSubmit={handleSubmitScore} className="bg-white/[0.04] border border-white/10 p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <Star size={20} className="text-[#4a9eed]" />
                <h2 className="text-lg font-medium">Score this Submission</h2>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Future Potential */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Future Potential (25%) *
                    <span className="block text-xs text-white/40 mt-1">
                      What is the project's long-term potential for success, growth and impact?
                    </span>
                  </label>
                  <select
                    value={scoreForm.futurePotential}
                    onChange={(e) => setScoreForm({ ...scoreForm, futurePotential: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white text-sm focus:ring-1 focus:ring-[#4a9eed] outline-none"
                    required
                  >
                    <option value="">Select score (0-10)</option>
                    {SCORE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Demo */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Demo (25%) *
                    <span className="block text-xs text-white/40 mt-1">
                      How well has the team implemented the idea? Does it work?
                    </span>
                  </label>
                  <select
                    value={scoreForm.demo}
                    onChange={(e) => setScoreForm({ ...scoreForm, demo: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white text-sm focus:ring-1 focus:ring-[#4a9eed] outline-none"
                    required
                  >
                    <option value="">Select score (0-10)</option>
                    {SCORE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Creativity */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Creativity / Uniqueness (25%) *
                    <span className="block text-xs text-white/40 mt-1">
                      Is the project's concept innovative and unique?
                    </span>
                  </label>
                  <select
                    value={scoreForm.creativity}
                    onChange={(e) => setScoreForm({ ...scoreForm, creativity: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white text-sm focus:ring-1 focus:ring-[#4a9eed] outline-none"
                    required
                  >
                    <option value="">Select score (0-10)</option>
                    {SCORE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Pitching Quality */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Pitching Quality (25%) *
                    <span className="block text-xs text-white/40 mt-1">
                      How well does the team present their project?
                    </span>
                  </label>
                  <select
                    value={scoreForm.pitchingQuality}
                    onChange={(e) => setScoreForm({ ...scoreForm, pitchingQuality: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white text-sm focus:ring-1 focus:ring-[#4a9eed] outline-none"
                    required
                  >
                    <option value="">Select score (0-10)</option>
                    {SCORE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Brain Rot Penalty */}
                <div className="bg-red-500/10 border border-red-500/30 p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scoreForm.brainRot === "true"}
                      onChange={(e) =>
                        setScoreForm({ ...scoreForm, brainRot: e.target.checked ? "true" : "false" })
                      }
                      className="w-4 h-4 rounded border-white/30 bg-white/[0.06] text-red-500 focus:ring-red-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-white/80">
                      <strong className="text-red-400">Brain Rot (-1)</strong>
                      <span className="block text-xs text-white/40 mt-0.5">
                        Check this if the project is brain rot
                      </span>
                    </span>
                  </label>
                </div>

                {/* Additional Comments */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">
                    Additional Comments
                  </label>
                  <textarea
                    value={scoreForm.additionalComments}
                    onChange={(e) => setScoreForm({ ...scoreForm, additionalComments: e.target.value })}
                    placeholder="Any additional feedback or notes..."
                    rows={3}
                    maxLength={2000}
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-[#4a9eed] outline-none resize-none"
                  />
                </div>

                {/* Total Score */}
                <div className="bg-[#4a9eed]/10 border border-[#4a9eed]/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Total Score</span>
                    <span className="text-2xl font-bold text-[#4a9eed]">
                      {calculateTotal()} / 40
                    </span>
                  </div>
                  {scoreForm.brainRot === "true" && (
                    <p className="text-xs text-red-400 mt-1">Includes -1 brain rot penalty</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving || deleting}
                  className="w-full px-6 py-4 bg-[#4a9eed] text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#4a9eed]/90 transition-all disabled:opacity-50"
                >
                  {saving ? "Submitting..." : submissionData.hasScored ? "Update Score" : "Submit Score"}
                </button>

                {/* Reset Score - only show if already scored */}
                {submissionData.hasScored && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving || deleting}
                        className="w-full px-4 py-3 border border-red-500/30 text-red-400 text-xs uppercase tracking-wider hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} />
                        Reset My Score
                      </button>
                    ) : (
                      <div className="bg-red-500/10 border border-red-500/30 p-4">
                        <p className="text-red-400 text-sm mb-3">Delete your score for this submission?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={deleting}
                            className="flex-1 px-3 py-2 border border-white/10 text-white/70 text-xs uppercase hover:bg-white/5 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteScore}
                            disabled={deleting}
                            className="flex-1 px-3 py-2 bg-red-500 text-white text-xs uppercase hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {deleting ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScoreSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#4a9eed] animate-spin" />
        </div>
      }
    >
      <ScoreSubmissionPageContent submissionId={submissionId} />
    </Suspense>
  );
}
