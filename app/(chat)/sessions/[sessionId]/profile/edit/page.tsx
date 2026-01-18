"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Loader2, Upload, Image as ImageIcon, Sparkles, X } from "lucide-react";

const AI_ENGINE_API_URL = "https://api.aiengine.exchange";

interface Profile {
  id: string;
  displayName: string;
  images: string[];
  whatIOffer: string;
  whatImLookingFor: string;
  linkedinUrl?: string | null;
}

export default function EditProfilePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    displayName: "",
    whatIOffer: "",
    whatImLookingFor: "",
  });

  // Image state
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<"current" | "uploaded" | "generated" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prompt state
  const DEFAULT_PROMPT = "camping in a forest by a campfire, high quality, professional lighting, warm natural atmosphere";
  const [imagePrompt, setImagePrompt] = useState(DEFAULT_PROMPT);

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/me?sessionId=${sessionId}`);

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const profile: Profile = await response.json();
        setFormData({
          displayName: profile.displayName,
          whatIOffer: profile.whatIOffer,
          whatImLookingFor: profile.whatImLookingFor,
        });

        // Load current image if exists
        if (profile.images?.[0]) {
          setCurrentImage(profile.images[0]);
          setSelectedImageType("current");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [sessionId]);

  // Handle image file selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setImageError("Please upload an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setImageError("Image must be less than 10MB");
        return;
      }
      setUploadedImage(file);
      setImageError(null);
      const previewUrl = URL.createObjectURL(file);
      setUploadedImagePreview(previewUrl);
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
    if (selectedImageType === "uploaded") {
      setSelectedImageType(currentImage ? "current" : generatedImage ? "generated" : null);
    }
  };

  // Generate AI image
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
      apiFormData.append("prompt", `Professional headshot of ${userName} ${imagePrompt}`);

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
        setGeneratedImage(result.imageURL);
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
      // First get the profile ID
      const profileResponse = await fetch(`/api/profiles/me?sessionId=${sessionId}`);
      if (!profileResponse.ok) {
        throw new Error("Failed to get profile");
      }
      const profile: Profile = await profileResponse.json();

      // Handle image upload based on selection
      let images: string[] = profile.images || [];

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
      } else if (selectedImageType === "current" && currentImage) {
        images = [currentImage];
      }

      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: formData.displayName,
          images,
          whatIOffer: formData.whatIOffer,
          whatImLookingFor: formData.whatImLookingFor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Redirect back to profile view
      router.push(`/sessions/${sessionId}/profile`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mb-6 mx-auto">
            <div className="absolute inset-0 border-2 border-bfl-green/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-bfl-green rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="text-bfl-green" size={24} />
            </div>
          </div>
          <p className="font-mono text-xs font-bold text-white uppercase tracking-[0.5em]">Loading Profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 md:px-12 max-w-4xl mx-auto">
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-bfl-green" />
          <span className="font-mono text-[10px] text-bfl-green uppercase tracking-[0.4em] font-bold">Update Info</span>
        </div>
        <h2 className="text-6xl font-extrabold text-white tracking-tighter italic uppercase">Edit Profile</h2>
        <p className="text-bfl-muted mt-4 font-medium">Update your profile. AI matching will be recalculated.</p>
      </div>

      <div className="bg-white/[0.02] subtle-border p-10">
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Profile Image Section */}
          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">01 / Profile Image</span>
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="text-bfl-green" size={20} />
              <h4 className="text-2xl font-bold text-white italic">Profile Image</h4>
            </div>
            <p className="text-sm text-bfl-muted mb-6">
              Upload a new photo or generate an AI-enhanced version. Click on an image to select it.
            </p>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              disabled={loading}
            />

            <div className="space-y-6">
              {/* Current image - displayed above */}
              {currentImage && (
                <button
                  type="button"
                  onClick={() => setSelectedImageType("current")}
                  className="text-left w-full"
                  disabled={loading}
                >
                  <p className="text-xs text-bfl-muted font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
                    Current
                    {selectedImageType === "current" && (
                      <span className="text-bfl-green">• Selected</span>
                    )}
                  </p>
                  <div
                    className={`relative w-48 h-48 bg-white/[0.02] rounded-sm overflow-hidden transition-all ${
                      selectedImageType === "current"
                        ? "ring-2 ring-bfl-green ring-offset-2 ring-offset-black"
                        : "hover:ring-1 hover:ring-white/30"
                    }`}
                  >
                    <img
                      src={currentImage}
                      alt="Current"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              )}

              {/* Upload and AI Generate boxes in 2-column grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Uploaded image */}
                {uploadedImagePreview ? (
                  <div className="text-left">
                    <p className="text-xs text-bfl-muted font-mono mb-2 uppercase tracking-wider flex items-center gap-2">
                      New Upload
                      {selectedImageType === "uploaded" && (
                        <span className="text-bfl-green">• Selected</span>
                      )}
                    </p>
                    <div
                      onClick={() => !loading && setSelectedImageType("uploaded")}
                      className={`relative aspect-square bg-white/[0.02] rounded-sm overflow-hidden transition-all cursor-pointer ${
                        selectedImageType === "uploaded"
                          ? "ring-2 ring-bfl-green ring-offset-2 ring-offset-black"
                          : "hover:ring-1 hover:ring-white/30"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-left"
                    disabled={loading}
                  >
                    <p className="text-xs text-bfl-muted font-mono mb-2 uppercase tracking-wider">Upload New</p>
                    <div className="aspect-square border-2 border-dashed border-white/20 rounded-sm flex flex-col items-center justify-center gap-2 hover:border-bfl-green/50 hover:bg-white/[0.02] transition-all">
                      <Upload className="text-bfl-muted" size={24} />
                      <span className="text-xs text-bfl-muted/60">Click to upload</span>
                    </div>
                  </button>
                )}

                {/* Generated image */}
                <button
                  type="button"
                  onClick={() => generatedImage && setSelectedImageType("generated")}
                  className={`text-left ${!generatedImage ? "cursor-default" : ""}`}
                  disabled={loading || !generatedImage}
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
                        <Loader2 className="w-6 h-6 mx-auto text-bfl-green animate-spin" />
                        <p className="text-xs text-bfl-muted">Generating...</p>
                      </div>
                    ) : generatedImage ? (
                      <img
                        src={generatedImage}
                        alt="AI Generated"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Sparkles className="w-6 h-6 mx-auto text-bfl-muted/40 mb-1" />
                        <p className="text-[10px] text-bfl-muted/60">Generate below</p>
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* AI Generation Controls */}
              {uploadedImagePreview && (
                <div className="space-y-4 p-4 bg-white/[0.02] rounded-sm border border-white/10">
                  <p className="text-xs text-bfl-muted font-mono uppercase tracking-wider">AI Image Prompt</p>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the style for your AI image..."
                    rows={2}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 text-sm leading-relaxed focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none disabled:opacity-50"
                  />
                  <p className="text-xs text-bfl-muted/60">
                    Your image will be generated as: "Professional headshot of [name] {imagePrompt.substring(0, 40)}..."
                  </p>

                  <button
                    type="button"
                    onClick={generateAIImage}
                    disabled={isGeneratingImage || !uploadedImage || loading}
                    className="w-full px-6 py-3 bg-bfl-green/10 border border-bfl-green/30 text-bfl-green font-bold text-xs uppercase tracking-[0.2em] hover:bg-bfl-green/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-sm flex items-center justify-center gap-2"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate AI Image
                      </>
                    )}
                  </button>
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

          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">02 / Name</span>
            <label htmlFor="displayName" className="text-2xl font-bold text-white italic mb-6 block">Display Name *</label>
            <input
              id="displayName"
              type="text"
              placeholder="How should others see you?"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
              maxLength={50}
              disabled={loading}
              className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all disabled:opacity-50"
            />
          </div>

          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">03 / What I'm Looking For</span>
            <label htmlFor="whatImLookingFor" className="text-2xl font-bold text-white italic mb-6 block">"I'm looking for..." *</label>
            <textarea
              id="whatImLookingFor"
              placeholder="Describe the qualities, interests, and values you're looking for in a match..."
              value={formData.whatImLookingFor}
              onChange={(e) => setFormData({ ...formData, whatImLookingFor: e.target.value })}
              required
              minLength={10}
              maxLength={1000}
              disabled={loading}
              rows={5}
              className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none disabled:opacity-50"
            />
            <p className="font-mono text-[10px] text-bfl-muted mt-2 tracking-widest">
              {formData.whatImLookingFor.length}/1000 characters (min 10)
            </p>
          </div>

          <div className="relative pt-8 border-t border-white/10">
            <span className="absolute top-0 left-0 -translate-y-full font-mono text-[9px] text-bfl-muted uppercase tracking-[0.5em] py-2">04 / What I Offer</span>
            <label htmlFor="whatIOffer" className="text-2xl font-bold text-white italic mb-6 block">"I am currently offering..." *</label>
            <textarea
              id="whatIOffer"
              placeholder="Describe yourself, your interests, values, and what you bring to a connection..."
              value={formData.whatIOffer}
              onChange={(e) => setFormData({ ...formData, whatIOffer: e.target.value })}
              required
              minLength={10}
              maxLength={1000}
              disabled={loading}
              rows={5}
              className="w-full px-6 py-5 bg-white/[0.02] border border-white/10 rounded-sm text-white placeholder-white/20 font-mono text-sm tracking-widest focus:ring-1 focus:ring-bfl-green outline-none transition-all resize-none disabled:opacity-50"
            />
            <p className="font-mono text-[10px] text-bfl-muted mt-2 tracking-widest">
              {formData.whatIOffer.length}/1000 characters (min 10)
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
              <p className="font-mono text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.push(`/sessions/${sessionId}/profile`)}
              disabled={loading}
              className="flex-1 px-6 py-4 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all rounded-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.displayName ||
                formData.whatIOffer.length < 10 ||
                formData.whatImLookingFor.length < 10
              }
              className="flex-1 px-12 py-4 bg-white text-bfl-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-bfl-offwhite transition-all rounded-none disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>

          {loading && (
            <p className="text-center font-mono text-[10px] text-bfl-muted uppercase tracking-[0.3em]">
              Regenerating AI embeddings... This may take a moment.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

