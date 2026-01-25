"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, Upload, X, Github, ExternalLink, Save, ArrowLeft, Lock } from "lucide-react";
import { EmailWarningBanner } from "@/components/email-warning-banner";

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
  sponsorFeatureFeedback?: string;
  mediaPermission?: string;
  eventFeedback?: string;
  submittedAt: string;
}

const SPONSOR_TECH_OPTIONS = ["Runware", "NVIDIA", "Anthropic", "Flux Models"] as const;

// Deadline: January 25, 2026 at 2:15 PM (local time)
const SUBMISSION_DEADLINE = new Date("2026-01-25T14:15:00");

interface Team {
  id: string;
  name: string;
  teamNumber: string;
}

export default function MyTeamSubmissionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasValidEmail, setHasValidEmail] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    projectName: "",
    githubLink: "",
    description: "",
    demoLink: "",
    techStack: "",
    problemStatement: "",
    sponsorTech: [] as string[],
    sponsorFeatureFeedback: "",
    mediaPermission: "false",
    eventFeedback: "",
  });

  // Check if deadline has passed (for new submissions only)
  const isDeadlinePassed = new Date() > SUBMISSION_DEADLINE;
  const canCreateNew = !isDeadlinePassed;

  const [fileUploads, setFileUploads] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
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

      // Load my team's submission
      const subRes = await fetch(`/api/submissions/my-team?sessionId=${sessionId}`);
      const subData = await subRes.json();

      if (!subRes.ok) {
        throw new Error(subData.error || "Failed to load submission");
      }

      setTeam(subData.team);

      if (subData.submission) {
        setSubmission(subData.submission);
        setFormData({
          projectName: subData.submission.projectName,
          githubLink: subData.submission.githubLink,
          description: subData.submission.description,
          demoLink: subData.submission.demoLink || "",
          techStack: subData.submission.techStack,
          problemStatement: subData.submission.problemStatement,
          sponsorTech: subData.submission.sponsorTech || [],
          sponsorFeatureFeedback: subData.submission.sponsorFeatureFeedback || "",
          mediaPermission: subData.submission.mediaPermission || "false",
          eventFeedback: subData.submission.eventFeedback || "",
        });
        setFileUploads(subData.submission.fileUploads || []);
      }
    } catch (err) {
      console.error("Failed to load submission:", err);
      setError(err instanceof Error ? err.message : "Failed to load submission");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileUploads.length >= 5) {
      alert("Maximum 5 files allowed");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/submissions/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setFileUploads([...fileUploads, data.url]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setFileUploads(fileUploads.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = submission
        ? `/api/submissions/${submission.id}`
        : "/api/submissions";
      const method = submission ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          projectName: formData.projectName,
          githubLink: formData.githubLink,
          description: formData.description,
          demoLink: formData.demoLink,
          techStack: formData.techStack,
          problemStatement: formData.problemStatement,
          fileUploads,
          sponsorTech: formData.sponsorTech,
          sponsorFeatureFeedback: formData.sponsorFeatureFeedback || undefined,
          mediaPermission: formData.mediaPermission,
          eventFeedback: formData.eventFeedback || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save submission");
      }

      // Redirect to submissions page
      router.push(`/sessions/${sessionId}/submissions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save submission");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto text-bfl-green animate-spin mb-4" />
          <p className="text-bfl-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show warning if no email
  if (!hasValidEmail) {
    return (
      <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
        <EmailWarningBanner
          sessionId={sessionId}
          message="You need a contact email to submit a project"
        />
      </div>
    );
  }

  // Show warning if no team
  if (!hasTeam) {
    return (
      <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
        <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-sm">
          <p className="text-amber-200 font-medium mb-2">You must be part of a team to submit a project</p>
          <Link
            href={`/sessions/${sessionId}/teams`}
            className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Go to Teams →
          </Link>
        </div>
      </div>
    );
  }

  // Show deadline passed message if trying to create new submission after deadline
  if (!submission && isDeadlinePassed) {
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
            Submit Project
          </h1>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 p-12 md:p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-normal text-white tracking-tighter uppercase mb-4">
            Submissions Closed
          </h2>
          <p className="text-bfl-muted font-medium max-w-md mx-auto mb-2">
            The submission deadline has passed. New submissions are no longer being accepted.
          </p>
          <p className="text-xs text-bfl-muted/60 font-mono">
            Deadline was January 25, 2026 at 2:15 PM
          </p>
          <Link
            href={`/sessions/${sessionId}/submissions`}
            className="inline-flex items-center gap-2 mt-8 text-bfl-green hover:text-bfl-green/80 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-mono uppercase tracking-wider">Back to Submissions</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <Link
          href={`/sessions/${sessionId}/submissions`}
          className="inline-flex items-center gap-2 text-bfl-muted hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-mono uppercase tracking-wider">Back to Submissions</span>
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">
            {team?.name} · Team #{team?.teamNumber}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-normal text-white tracking-tighter uppercase mb-4">
          {submission ? "Edit Submission" : "Submit Project"}
        </h1>
        <p className="text-bfl-muted font-medium">
          {submission
            ? "Update your project submission details."
            : "Submit your hackathon project. Any team member can create or edit the submission."}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,application/pdf,video/*"
          className="hidden"
        />

        {/* Project Name */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="block text-sm text-bfl-muted mb-2">Project Name *</label>
          <input
            type="text"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            placeholder="e.g., AI Code Assistant"
            required
            maxLength={100}
            className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
          />
        </div>

        {/* GitHub Link */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="flex items-center gap-2 text-sm text-bfl-muted mb-2">
            <Github size={16} />
            GitHub Repository *
          </label>
          <input
            type="url"
            value={formData.githubLink}
            onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
            placeholder="https://github.com/your-team/project"
            required
            className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
          />
        </div>

        {/* Demo Link */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="flex items-center gap-2 text-sm text-bfl-muted mb-2">
            <ExternalLink size={16} />
            Demo Link *
          </label>
          <input
            type="url"
            value={formData.demoLink}
            onChange={(e) => setFormData({ ...formData, demoLink: e.target.value })}
            placeholder="https://your-demo.vercel.app"
            required
            className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
          />
        </div>

        {/* Problem Statement */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="block text-sm text-bfl-muted mb-2">Problem Statement *</label>
          <p className="text-xs text-bfl-muted/70 mb-3">What problem does your project solve?</p>
          <textarea
            value={formData.problemStatement}
            onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
            placeholder="Describe the problem your project addresses..."
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
          />
          <p className="mt-2 text-xs text-bfl-muted text-right">
            {formData.problemStatement.length}/1000
          </p>
        </div>

        {/* Description */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="block text-sm text-bfl-muted mb-2">Project Description *</label>
          <p className="text-xs text-bfl-muted/70 mb-3">Describe your solution, features, and how it works.</p>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell us about your project..."
            required
            minLength={10}
            maxLength={2000}
            rows={6}
            className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
          />
          <p className="mt-2 text-xs text-bfl-muted text-right">
            {formData.description.length}/2000
          </p>
        </div>

        {/* Tech Stack */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="block text-sm text-bfl-muted mb-2">Tech Stack *</label>
          <p className="text-xs text-bfl-muted/70 mb-3">List technologies used (comma-separated)</p>
          <input
            type="text"
            value={formData.techStack}
            onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
            placeholder="React, Next.js, OpenAI, PostgreSQL"
            required
            maxLength={500}
            className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
          />
        </div>

        {/* Sponsor Tech */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="block text-sm text-bfl-muted mb-2">Which sponsor tech did you use?</label>
          <p className="text-xs text-bfl-muted/70 mb-4">Select all that apply</p>
          <div className="grid grid-cols-2 gap-3">
            {SPONSOR_TECH_OPTIONS.map((tech) => {
              const isSelected = formData.sponsorTech.includes(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setFormData({
                        ...formData,
                        sponsorTech: formData.sponsorTech.filter((t) => t !== tech),
                      });
                    } else {
                      setFormData({
                        ...formData,
                        sponsorTech: [...formData.sponsorTech, tech],
                      });
                    }
                  }}
                  className={`px-4 py-3 border text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-bfl-green/20 border-bfl-green text-bfl-green"
                      : "bg-white/[0.04] border-white/15 text-bfl-muted hover:border-white/30 hover:text-white"
                  }`}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>

        {/* File Uploads */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="block text-sm text-bfl-muted mb-2">Attachments (optional)</label>
          <p className="text-xs text-bfl-muted/70 mb-4">
            Upload screenshots, diagrams, or demo videos (max 5 files, 50MB each)
          </p>

          {/* Uploaded files */}
          {fileUploads.length > 0 && (
            <div className="space-y-2 mb-4">
              {fileUploads.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/[0.04] border border-white/10"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-bfl-green hover:underline truncate flex-1 mr-4"
                  >
                    {url.split("/").pop()}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {fileUploads.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-6 py-4 border-2 border-dashed border-white/20 text-bfl-muted hover:border-bfl-green/50 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload File
                </>
              )}
            </button>
          )}
        </div>

        {/* Sponsor Feature Feedback (optional) */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="block text-sm text-bfl-muted mb-2">
            Did you use any feature from the sponsor that you loved? Or didn't know beforehand? (optional)
          </label>
          <textarea
            value={formData.sponsorFeatureFeedback}
            onChange={(e) => setFormData({ ...formData, sponsorFeatureFeedback: e.target.value })}
            placeholder="Share any sponsor features you discovered or enjoyed..."
            rows={3}
            maxLength={1000}
            className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
          />
          <p className="mt-2 text-xs text-bfl-muted text-right">
            {formData.sponsorFeatureFeedback.length}/1000
          </p>
        </div>

        {/* Media Permission */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.mediaPermission === "true"}
              onChange={(e) =>
                setFormData({ ...formData, mediaPermission: e.target.checked ? "true" : "false" })
              }
              className="mt-1 w-5 h-5 rounded border-white/30 bg-white/[0.06] text-bfl-green focus:ring-bfl-green focus:ring-offset-0"
            />
            <div>
              <span className="text-sm text-white font-medium">Media Permission</span>
              <p className="text-xs text-bfl-muted/70 mt-1">
                Do you grant permission for the use of multimedia (including photos and video recordings)
                taken during the event in which you may be included? These materials may be used for
                promotional, news, online/multimedia, research, and educational purposes by the hackathon
                organizers and sponsors.
              </p>
            </div>
          </label>
        </div>

        {/* Event Feedback (optional) */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8">
          <label className="block text-sm text-bfl-muted mb-2">
            Anything else? Any quick feedback about the event? Any other sponsors you want to see? (optional)
          </label>
          <textarea
            value={formData.eventFeedback}
            onChange={(e) => setFormData({ ...formData, eventFeedback: e.target.value })}
            placeholder="Share your thoughts about the event..."
            rows={3}
            maxLength={1000}
            className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
          />
          <p className="mt-2 text-xs text-bfl-muted text-right">
            {formData.eventFeedback.length}/1000
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Link
            href={`/sessions/${sessionId}/submissions`}
            className="flex-1 px-6 py-4 border border-white/10 text-bfl-muted font-bold text-xs uppercase tracking-[0.15em] hover:text-white hover:bg-white/5 transition-all text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={
              saving ||
              !formData.projectName ||
              !formData.githubLink ||
              !formData.demoLink ||
              formData.description.length < 10 ||
              formData.problemStatement.length < 10 ||
              !formData.techStack
            }
            className="flex-1 px-6 py-4 bg-bfl-green text-black font-bold text-xs uppercase tracking-[0.15em] hover:bg-bfl-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {submission ? "Update Submission" : "Submit Project"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
