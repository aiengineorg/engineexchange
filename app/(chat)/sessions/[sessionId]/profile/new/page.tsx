"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Sparkles, Search, Upload, Image as ImageIcon, Loader2, X, Mail, CheckCircle, Users, Linkedin, Globe } from "lucide-react";

const AI_ENGINE_API_URL = "https://api.aiengine.exchange";

export default function NewProfilePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
    whatIOffer: "",
    whatImLookingFor: "",
    linkedinUrl: "",
    websiteOrGithub: "",
    hasTeam: false,
    contactEmail: "",
  });

  // Image upload and generation state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image selection and prompt state
  const [selectedImageType, setSelectedImageType] = useState<"uploaded" | "generated" | null>(null);
  const [generationMode, setGenerationMode] = useState<"enhance" | "create">("enhance");
  const DEFAULT_ENHANCE_PROMPT = "reimagined in the black forest, surrounded by tall pine trees, mystical fog, and soft ethereal lighting";
  const DEFAULT_CREATE_PROMPT = "a whimsical forest creature made of code and pixels, sitting by a glowing campfire in the black forest, magical and playful";
  const [imagePrompt, setImagePrompt] = useState(DEFAULT_ENHANCE_PROMPT);

  // Email verification state
  const [lumaEmail, setLumaEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState<"email" | "code" | "verified">("email");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantHasTeam, setParticipantHasTeam] = useState(false);

  // Pre-fill display name with Discord username if available
  useEffect(() => {
    if (session?.user?.discordUsername && !formData.displayName) {
      setFormData((prev) => ({
        ...prev,
        displayName: session.user.discordUsername || "",
      }));
    }
  }, [session?.user?.discordUsername, formData.displayName]);

  // Send verification code to email
  const handleSendVerification = async () => {
    if (!lumaEmail) return;

    setVerificationLoading(true);
    setVerificationError("");

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lumaEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setParticipantName(data.participantName || "");
      setVerificationStep("code");
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setVerificationLoading(false);
    }
  };

  // Verify the code and get participant data
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return;

    setVerificationLoading(true);
    setVerificationError("");

    try {
      const response = await fetch("/api/auth/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      // Auto-fill form fields from participant data
      setFormData((prev) => ({
        ...prev,
        whatIOffer: data.participant?.profileSummary || prev.whatIOffer,
        displayName: data.participant?.name && !prev.displayName ? data.participant.name : prev.displayName,
        linkedinUrl: data.participant?.linkedin || prev.linkedinUrl,
        websiteOrGithub: data.participant?.websiteOrGithub || prev.websiteOrGithub,
        hasTeam: data.participant?.hasTeam || false,
      }));

      // Store team status for display
      setParticipantHasTeam(data.participant?.hasTeam || false);

      setVerificationStep("verified");
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : "Failed to verify");
    } finally {
      setVerificationLoading(false);
    }
  };

  // Handle image file selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setImageError("Please upload an image file");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setImageError("Image must be less than 10MB");
        return;
      }
      setUploadedImage(file);
      setImageError(null);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setUploadedImagePreview(previewUrl);
      // Auto-select uploaded image
      setSelectedImageType("uploaded");
    }
  };

  // Clear uploaded image
  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // If uploaded was selected, switch to generated if available
    if (selectedImageType === "uploaded") {
      setSelectedImageType(generatedImage ? "generated" : null);
    }
  };

  // Generate AI image - either enhance uploaded image or create from prompt
  const generateAIImage = async () => {
    const userEmail = session?.user?.email;
    if (!userEmail) {
      setImageError("Please sign in to generate an image");
      return;
    }

    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const userName = session?.user?.name || formData.displayName || "person";
      const apiFormData = new FormData();
      apiFormData.append("userEmail", userEmail);

      if (generationMode === "enhance" && uploadedImage) {
        // Image-to-image: enhance the uploaded photo
        apiFormData.append("image", uploadedImage);
        apiFormData.append(
          "prompt",
          `Professional portrait of ${userName} ${imagePrompt}`
        );
      } else {
        // Text-to-image: generate from prompt only
        apiFormData.append(
          "prompt",
          imagePrompt
        );
      }

      const response = await fetch(`${AI_ENGINE_API_URL}/api/images/generate`, {
        method: "POST",
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.imageURL) {
        // Store the Runware URL for preview - will upload to blob on profile creation
        setGeneratedImage(result.imageURL);
        // Auto-select generated image
        setSelectedImageType("generated");
      } else {
        throw new Error(result.error || "Failed to generate image");
      }
    } catch (err) {
      console.error("AI generation failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to generate AI image";

      if (errorMessage.includes("Rate limit exceeded")) {
        setImageError("Daily generation limit reached. Try again tomorrow.");
      } else if (errorMessage.includes("User not found")) {
        setImageError("User not found. Please ensure you're signed in.");
      } else {
        setImageError(errorMessage);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Upload selected image to blob storage
      let images: string[] = [];

      if (selectedImageType === "generated" && generatedImage) {
        // Upload generated image from URL
        const uploadResponse = await fetch("/api/images/upload-from-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: generatedImage }),
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          images = [uploadResult.url];
        } else {
          console.error("Failed to upload generated image to blob storage");
        }
      } else if (selectedImageType === "uploaded" && uploadedImage) {
        // Upload the original file directly
        const uploadFormData = new FormData();
        uploadFormData.append("file", uploadedImage);

        const uploadResponse = await fetch("/api/images/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          images = [uploadResult.url];
        } else {
          console.error("Failed to upload image to blob storage");
        }
      }

      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          displayName: formData.displayName,
          images,
          whatIOffer: formData.whatIOffer,
          whatImLookingFor: formData.whatImLookingFor,
          linkedinUrl: formData.linkedinUrl || undefined,
          websiteOrGithub: formData.websiteOrGithub || undefined,
          hasTeam: formData.hasTeam,
          contactEmail: formData.contactEmail || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create profile");
      }

      // Redirect to discover feed
      router.push(`/sessions/${sessionId}/discover`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mb-6 mx-auto">
            <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-bfl-green" size={24} />
            </div>
          </div>
          <p className="font-mono text-xs font-normal text-white uppercase tracking-[0.5em] mb-2">Creating Profile</p>
          <p className="text-sm text-bfl-muted">Generating AI embeddings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Get Started</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-normal text-white tracking-tighter uppercase mb-4">
          Create Profile
        </h1>
        <p className="text-bfl-muted font-medium max-w-lg">
          Tell us about yourself. Our AI will analyze your profile to find the best matches for you.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Display Name Section */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              01 / Identity
            </span>
            <div className="flex items-center gap-3 mb-6">
              <User className="text-bfl-green" size={20} />
              <h2 className="text-xl font-normal text-white">Display Name</h2>
            </div>
            <input
              type="text"
              id="displayName"
              placeholder="How should others see you?"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              required
              maxLength={50}
              className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all"
            />
            {session?.user?.discordUsername && (
              <p className="mt-3 text-xs text-bfl-muted font-mono">
                Pre-filled from Discord: {session.user.discordUsername}
              </p>
            )}
          </div>
        </div>

        {/* What I'm Looking For Section */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              02 / What I'm Looking For
            </span>
            <div className="flex items-center gap-3 mb-4">
              <Search className="text-bfl-green" size={20} />
              <h2 className="text-xl font-normal text-white">What I'm Looking For</h2>
            </div>
            <p className="text-sm text-bfl-muted mb-6">
              Describe the qualities, interests, and values you're looking for in a match.
            </p>
            <textarea
              id="whatImLookingFor"
              placeholder="I'm looking for someone who..."
              value={formData.whatImLookingFor}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  whatImLookingFor: e.target.value,
                })
              }
              required
              minLength={10}
              maxLength={1000}
              rows={5}
              className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
            />
            <div className="flex justify-between mt-3">
              <p className="text-xs text-bfl-muted font-mono">Min 10 characters</p>
              <p className="text-xs text-bfl-muted font-mono">
                {formData.whatImLookingFor.length}/1000
              </p>
            </div>
          </div>
        </div>

        {/* What I Offer Section - Combined with Luma Verification */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              03 / What I Offer
            </span>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-bfl-green" size={20} />
              <h2 className="text-xl font-normal text-white">What I Offer</h2>
            </div>

            {/* Luma Auto-fill Card - Show when not verified */}
            {verificationStep !== "verified" && (
              <div className="mb-6 p-6 bg-gradient-to-br from-bfl-green/10 to-bfl-green/5 border-2 border-dashed border-bfl-green/40 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-bfl-green/20 rounded-lg">
                    <Mail className="text-bfl-green" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">Auto-fill from your Luma registration</h3>
                    <p className="text-sm text-bfl-muted mb-4">
                      We have your profile summary from when you registered. Verify your email to auto-fill this section.
                    </p>

                    {verificationStep === "email" && (
                      <div className="space-y-3">
                        <input
                          type="email"
                          placeholder="Enter your Luma registration email"
                          value={lumaEmail}
                          onChange={(e) => setLumaEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-black/30 border border-bfl-green/30 rounded-md text-white placeholder-white/30 font-mono text-sm focus:ring-2 focus:ring-bfl-green/50 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleSendVerification}
                          disabled={!lumaEmail || verificationLoading}
                          className="w-full px-6 py-3 bg-bfl-green text-black font-bold text-xs uppercase tracking-[0.15em] hover:bg-bfl-green/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-md flex items-center justify-center gap-2"
                        >
                          {verificationLoading ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Sending Code...
                            </>
                          ) : (
                            <>
                              <Mail size={16} />
                              Send Verification Code
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {verificationStep === "code" && (
                      <div className="space-y-3">
                        <p className="text-sm text-bfl-green font-medium">
                          Code sent to {lumaEmail}
                          {participantName && <span className="text-bfl-muted font-normal"> - Found: {participantName}</span>}
                        </p>
                        <input
                          type="text"
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="w-full px-4 py-4 bg-black/30 border border-bfl-green/30 rounded-md text-white placeholder-white/20 font-mono text-3xl tracking-[0.8em] text-center focus:ring-2 focus:ring-bfl-green/50 outline-none transition-all"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setVerificationStep("email");
                              setVerificationCode("");
                              setVerificationError("");
                            }}
                            className="px-4 py-3 border border-white/20 text-bfl-muted font-bold text-xs uppercase tracking-[0.15em] hover:text-white hover:bg-white/5 transition-all rounded-md"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={verificationCode.length !== 6 || verificationLoading}
                            className="flex-1 px-6 py-3 bg-bfl-green text-black font-bold text-xs uppercase tracking-[0.15em] hover:bg-bfl-green/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-md flex items-center justify-center gap-2"
                          >
                            {verificationLoading ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} />
                                Verify & Auto-fill
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {verificationError && (
                      <div className="mt-3 bg-red-500/20 border border-red-500/30 p-3 rounded-md">
                        <p className="text-red-400 text-sm">{verificationError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Verified Success Message */}
            {verificationStep === "verified" && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-bfl-green/15 border border-bfl-green/40 rounded-lg">
                <CheckCircle className="text-bfl-green flex-shrink-0" size={24} />
                <div>
                  <p className="text-bfl-green font-medium">Profile auto-filled from Luma!</p>
                  <p className="text-sm text-bfl-muted">Feel free to edit the text below.</p>
                </div>
              </div>
            )}

            {/* Textarea - more prominent when verified or has content */}
            <div className={verificationStep === "email" && !formData.whatIOffer ? "opacity-50" : ""}>
              <p className="text-sm text-bfl-muted mb-4">
                {verificationStep === "verified"
                  ? "Your profile summary from Luma registration:"
                  : "Or write your own description of yourself, your interests, and what you bring to a connection."
                }
              </p>
              <textarea
                id="whatIOffer"
                placeholder="I'm passionate about..."
                value={formData.whatIOffer}
                onChange={(e) =>
                  setFormData({ ...formData, whatIOffer: e.target.value })
                }
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
              />
              <div className="flex justify-between mt-3">
                <p className="text-xs text-bfl-muted font-mono">Min 10 characters</p>
                <p className="text-xs text-bfl-muted font-mono">
                  {formData.whatIOffer.length}/1000
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team & Links Section - After Luma verification populates fields */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              04 / Team & Links
            </span>
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-bfl-green" size={20} />
              <h2 className="text-xl font-normal text-white">Team & Links</h2>
            </div>

            {/* Team Status - Yes/No Buttons */}
            <div className="mb-6">
              <label className="block text-sm text-bfl-muted mb-3">
                Do you already have a team for this hackathon?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasTeam: true })}
                  className={`flex-1 px-6 py-4 font-bold text-xs uppercase tracking-[0.15em] transition-all rounded-sm ${
                    formData.hasTeam
                      ? "bg-bfl-green text-black"
                      : "bg-white/[0.06] border border-white/15 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasTeam: false })}
                  className={`flex-1 px-6 py-4 font-bold text-xs uppercase tracking-[0.15em] transition-all rounded-sm ${
                    !formData.hasTeam
                      ? "bg-bfl-green text-black"
                      : "bg-white/[0.06] border border-white/15 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  No
                </button>
              </div>
              {participantHasTeam && verificationStep === "verified" && (
                <p className="mt-2 text-xs text-bfl-green font-mono">
                  ✓ Pre-filled from your Luma registration
                </p>
              )}
            </div>

            {/* LinkedIn URL */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-bfl-muted mb-2">
                <Linkedin size={16} />
                LinkedIn Profile
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 font-mono text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
              />
              {formData.linkedinUrl && verificationStep === "verified" && (
                <p className="mt-2 text-xs text-bfl-green font-mono">
                  ✓ Pre-filled from your Luma registration
                </p>
              )}
            </div>

            {/* Website/GitHub URL */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-bfl-muted mb-2">
                <Globe size={16} />
                Website / GitHub
              </label>
              <input
                type="url"
                placeholder="https://github.com/yourusername"
                value={formData.websiteOrGithub}
                onChange={(e) => setFormData({ ...formData, websiteOrGithub: e.target.value })}
                className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 font-mono text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
              />
              {formData.websiteOrGithub && verificationStep === "verified" && (
                <p className="mt-2 text-xs text-bfl-green font-mono">
                  ✓ Pre-filled from your Luma registration
                </p>
              )}
            </div>

            {/* Contact Email for Teams/Submissions */}
            <div>
              <label className="flex items-center gap-2 text-sm text-bfl-muted mb-2">
                <Mail size={16} />
                Contact Email
                <span className="text-xs text-amber-400">(Required for team participation)</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-6 py-4 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 font-mono text-sm focus:ring-1 focus:ring-bfl-green outline-none transition-all"
              />
              <p className="mt-2 text-xs text-bfl-muted">
                This email will be used for team invites and project submissions. It will be visible to other participants.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Image Section */}
        <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              05 / Profile Image
            </span>
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="text-bfl-green" size={20} />
              <h2 className="text-xl font-normal text-white">Profile Image</h2>
            </div>
            <p className="text-sm text-bfl-muted mb-6">
              It's a generative media hackathon, so of course you'll have a fun profile photo. Upload your own photo to reimagine yourself in the black forest (labs), or prompt something completely out of the ordinary.
            </p>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="space-y-6">
              {/* Mode toggle */}
              <div className="flex gap-2 p-1 bg-white/[0.02] rounded-sm border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setGenerationMode("enhance");
                    setImagePrompt(DEFAULT_ENHANCE_PROMPT);
                  }}
                  className={`flex-1 px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all rounded-sm ${
                    generationMode === "enhance"
                      ? "bg-bfl-green/20 text-bfl-green border border-bfl-green/30"
                      : "text-bfl-muted hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <Upload size={14} className="inline mr-2" />
                  Upload & Enhance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGenerationMode("create");
                    setImagePrompt(DEFAULT_CREATE_PROMPT);
                  }}
                  className={`flex-1 px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all rounded-sm ${
                    generationMode === "create"
                      ? "bg-bfl-green/20 text-bfl-green border border-bfl-green/30"
                      : "text-bfl-muted hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <Sparkles size={14} className="inline mr-2" />
                  Generate from Scratch
                </button>
              </div>

              {/* Enhance mode - Upload area */}
              {generationMode === "enhance" && (
                <>
                  {!uploadedImagePreview ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-white/20 rounded-sm flex flex-col items-center justify-center gap-3 hover:border-bfl-green/50 hover:bg-white/[0.02] transition-all"
                    >
                      <Upload className="text-bfl-muted" size={32} />
                      <span className="text-sm text-bfl-muted font-mono">Upload your photo to transform</span>
                      <span className="text-xs text-bfl-muted/60">PNG, JPG up to 10MB</span>
                    </button>
                  ) : (
                    <div className="space-y-6">
                      {/* Image preview grid with selection */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Uploaded image - selectable */}
                        <div className="text-left">
                          <p className="text-xs text-bfl-muted font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
                            Original
                            {selectedImageType === "uploaded" && (
                              <span className="text-bfl-green">• Selected</span>
                            )}
                          </p>
                          <div
                            onClick={() => setSelectedImageType("uploaded")}
                            className={`relative aspect-square bg-white/[0.02] rounded-sm overflow-hidden transition-all cursor-pointer ${
                              selectedImageType === "uploaded"
                                ? "ring-2 ring-bfl-green ring-offset-2 ring-offset-black"
                                : "hover:ring-1 hover:ring-white/30"
                            }`}
                          >
                            <img
                              src={uploadedImagePreview}
                              alt="Uploaded preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearUploadedImage();
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                            >
                              <X size={14} className="text-white" />
                            </button>
                          </div>
                        </div>

                        {/* Generated image - selectable */}
                        <button
                          type="button"
                          onClick={() => generatedImage && setSelectedImageType("generated")}
                          className={`text-left ${!generatedImage ? "cursor-default" : ""}`}
                          disabled={!generatedImage}
                        >
                          <p className="text-xs text-bfl-muted font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
                            AI Enhanced
                            {selectedImageType === "generated" && (
                              <span className="text-bfl-green">• Selected</span>
                            )}
                          </p>
                          <div
                            className={`relative aspect-square bg-white/[0.02] rounded-sm overflow-hidden flex items-center justify-center transition-all ${
                              selectedImageType === "generated"
                                ? "ring-2 ring-bfl-green ring-offset-2 ring-offset-black"
                                : generatedImage
                                ? "hover:ring-1 hover:ring-white/30"
                                : ""
                            }`}
                          >
                            {isGeneratingImage ? (
                              <div className="text-center space-y-2">
                                <Loader2 className="w-8 h-8 mx-auto text-bfl-green animate-spin" />
                                <p className="text-xs text-bfl-muted">Creating magic...</p>
                              </div>
                            ) : generatedImage ? (
                              <img
                                src={generatedImage}
                                alt="AI Generated"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <Sparkles className="w-8 h-8 mx-auto text-bfl-muted/40 mb-2" />
                                <p className="text-xs text-bfl-muted/60">Your enhanced photo will appear here</p>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Create mode - Generated image preview */}
              {generationMode === "create" && generatedImage && (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setSelectedImageType("generated")}
                    className="text-left w-full"
                  >
                    <p className="text-xs text-bfl-muted font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
                      AI Generated
                      {selectedImageType === "generated" && (
                        <span className="text-bfl-green">• Selected</span>
                      )}
                    </p>
                    <div
                      className={`relative w-48 h-48 bg-white/[0.02] rounded-sm overflow-hidden transition-all ${
                        selectedImageType === "generated"
                          ? "ring-2 ring-bfl-green ring-offset-2 ring-offset-black"
                          : "hover:ring-1 hover:ring-white/30"
                      }`}
                    >
                      <img
                        src={generatedImage}
                        alt="AI Generated"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                </div>
              )}

              {/* AI Generation Controls - Show for create mode always, or enhance mode with uploaded image */}
              {(generationMode === "create" || (generationMode === "enhance" && uploadedImagePreview)) && (
                <div className="space-y-4 p-4 bg-white/[0.02] rounded-sm border border-white/10">
                  <p className="text-xs text-bfl-muted font-mono uppercase tracking-wider">
                    {generationMode === "enhance" ? "Transformation Style" : "What would you like to create?"}
                  </p>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder={generationMode === "enhance"
                      ? "Describe how you want to transform your photo..."
                      : "Describe the image you want to create..."
                    }
                    rows={2}
                    className="w-full px-4 py-3 bg-white/[0.06] border border-white/15 rounded-sm text-white placeholder-white/30 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
                  />
                  {generationMode === "enhance" && (
                    <p className="text-xs text-bfl-muted/60">
                      Your photo will be transformed: "{imagePrompt.substring(0, 60)}..."
                    </p>
                  )}

                  {/* Generate button */}
                  <button
                    type="button"
                    onClick={generateAIImage}
                    disabled={isGeneratingImage || (generationMode === "enhance" && !uploadedImage)}
                    className="w-full px-6 py-4 bg-bfl-green/10 border border-bfl-green/30 text-bfl-green font-bold text-xs uppercase tracking-[0.2em] hover:bg-bfl-green/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm flex items-center justify-center gap-2"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating magic...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        {generationMode === "enhance" ? "Transform Photo" : "Generate Image"}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Loading state for create mode */}
              {generationMode === "create" && isGeneratingImage && !generatedImage && (
                <div className="w-48 h-48 bg-white/[0.02] rounded-sm flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 mx-auto text-bfl-green animate-spin" />
                    <p className="text-xs text-bfl-muted">Creating magic...</p>
                  </div>
                </div>
              )}

              {/* Selection hint */}
              {!selectedImageType && (uploadedImagePreview || generatedImage) && (
                <p className="text-xs text-amber-400 font-mono text-center">
                  Click on an image above to select it for your profile
                </p>
              )}

              {/* Image error message */}
              {imageError && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-sm">
                  <p className="text-red-400 text-xs font-mono">{imageError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm">
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex-1 px-8 py-5 border border-white/10 text-bfl-muted font-bold text-xs uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all rounded-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              !formData.displayName ||
              formData.whatIOffer.length < 10 ||
              formData.whatImLookingFor.length < 10
            }
            className="flex-[2] px-12 py-5 bg-white text-bfl-black font-medium text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
          >
            Create Profile
          </button>
        </div>
      </form>
    </div>
  );
}
