"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Sparkles, Search, Upload, Image as ImageIcon, Loader2, X } from "lucide-react";

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
  const DEFAULT_PROMPT = "camping in a forest by a campfire, high quality, professional lighting, warm natural atmosphere";
  const [imagePrompt, setImagePrompt] = useState(DEFAULT_PROMPT);

  // Pre-fill display name with Discord username if available
  useEffect(() => {
    if (session?.user?.discordUsername && !formData.displayName) {
      setFormData((prev) => ({
        ...prev,
        displayName: session.user.discordUsername || "",
      }));
    }
  }, [session?.user?.discordUsername, formData.displayName]);

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

  // Generate AI image using the uploaded image
  const generateAIImage = async () => {
    if (!uploadedImage) {
      setImageError("Please upload an image first");
      return;
    }

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
      apiFormData.append("image", uploadedImage);
      apiFormData.append("userEmail", userEmail);
      apiFormData.append(
        "prompt",
        `Professional headshot of ${userName} ${imagePrompt}`
      );

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
          <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em] mb-2">Creating Profile</p>
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
        <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tighter italic uppercase mb-4">
          Create Profile
        </h1>
        <p className="text-bfl-muted font-medium max-w-lg">
          Tell us about yourself. Our AI will analyze your profile to find the best matches for you.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Display Name Section */}
        <div className="bg-white/[0.02] subtle-border p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              01 / Identity
            </span>
            <div className="flex items-center gap-3 mb-6">
              <User className="text-bfl-green" size={20} />
              <h2 className="text-xl font-bold text-white italic">Display Name</h2>
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
              className="w-full px-6 py-4 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all"
            />
            {session?.user?.discordUsername && (
              <p className="mt-3 text-xs text-bfl-muted font-mono">
                Pre-filled from Discord: {session.user.discordUsername}
              </p>
            )}
          </div>
        </div>

        {/* What I'm Looking For Section */}
        <div className="bg-white/[0.02] subtle-border p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              02 / What I'm Looking For
            </span>
            <div className="flex items-center gap-3 mb-4">
              <Search className="text-bfl-green" size={20} />
              <h2 className="text-xl font-bold text-white italic">What I'm Looking For</h2>
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
              className="w-full px-6 py-4 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
            />
            <div className="flex justify-between mt-3">
              <p className="text-xs text-bfl-muted font-mono">Min 10 characters</p>
              <p className="text-xs text-bfl-muted font-mono">
                {formData.whatImLookingFor.length}/1000
              </p>
            </div>
          </div>
        </div>

        {/* What I Offer Section */}
        <div className="bg-white/[0.02] subtle-border p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              03 / What I Offer
            </span>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="text-bfl-green" size={20} />
              <h2 className="text-xl font-bold text-white italic">What I Offer</h2>
            </div>
            <p className="text-sm text-bfl-muted mb-6">
              Describe yourself, your interests, values, and what you bring to a connection.
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
              className="w-full px-6 py-4 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
            />
            <div className="flex justify-between mt-3">
              <p className="text-xs text-bfl-muted font-mono">Min 10 characters</p>
              <p className="text-xs text-bfl-muted font-mono">
                {formData.whatIOffer.length}/1000
              </p>
            </div>
          </div>
        </div>

        {/* Profile Image Section */}
        <div className="bg-white/[0.02] subtle-border p-8 md:p-10">
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">
              04 / Profile Image
            </span>
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="text-bfl-green" size={20} />
              <h2 className="text-xl font-bold text-white italic">Profile Image</h2>
            </div>
            <p className="text-sm text-bfl-muted mb-6">
              Upload a photo and optionally generate an AI-enhanced version. Click on an image to select it for your profile.
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
              {/* Upload area */}
              {!uploadedImagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-white/20 rounded-sm flex flex-col items-center justify-center gap-3 hover:border-bfl-green/50 hover:bg-white/[0.02] transition-all"
                >
                  <Upload className="text-bfl-muted" size={32} />
                  <span className="text-sm text-bfl-muted font-mono">Click to upload an image</span>
                  <span className="text-xs text-bfl-muted/60">PNG, JPG up to 10MB</span>
                </button>
              ) : (
                <div className="space-y-6">
                  {/* Image preview grid with selection */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Uploaded image - selectable */}
                    <div className="text-left">
                      <p className="text-xs text-bfl-muted font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
                        Uploaded
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
                        AI Generated
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
                            <p className="text-xs text-bfl-muted">Generating...</p>
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
                            <p className="text-xs text-bfl-muted/60">Generate an AI image below</p>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* AI Generation Controls */}
                  <div className="space-y-4 p-4 bg-white/[0.02] rounded-sm border border-white/10">
                    <p className="text-xs text-bfl-muted font-mono uppercase tracking-wider">AI Image Prompt</p>
                    <textarea
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the style for your AI image..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none"
                    />
                    <p className="text-xs text-bfl-muted/60">
                      Your image will be generated as: "Professional headshot of [name] {imagePrompt.substring(0, 50)}..."
                    </p>

                    {/* Generate button */}
                    <button
                      type="button"
                      onClick={generateAIImage}
                      disabled={isGeneratingImage || !uploadedImage}
                      className="w-full px-6 py-4 bg-bfl-green/10 border border-bfl-green/30 text-bfl-green font-bold text-xs uppercase tracking-[0.2em] hover:bg-bfl-green/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm flex items-center justify-center gap-2"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Generate AI Image
                        </>
                      )}
                    </button>
                  </div>

                  {/* Selection hint */}
                  {!selectedImageType && (uploadedImagePreview || generatedImage) && (
                    <p className="text-xs text-amber-400 font-mono text-center">
                      Click on an image above to select it for your profile
                    </p>
                  )}
                </div>
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
            className="flex-[2] px-12 py-5 bg-white text-bfl-black font-black text-xs uppercase tracking-[0.3em] hover:bg-bfl-offwhite transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm"
          >
            Create Profile
          </button>
        </div>
      </form>
    </div>
  );
}
