import { NextResponse } from "next/server";
import { z } from "zod";
import { put } from "@vercel/blob";
import { auth } from "@/app/(auth)/auth";
import { getTeamByUserId, hasValidContactEmail } from "@/lib/db/queries";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: "File size should be less than 50MB",
    })
    .refine(
      (file) =>
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "application/pdf",
          "video/mp4",
          "video/quicktime",
        ].includes(file.type),
      {
        message: "Unsupported file type. Allowed: images, PDFs, and videos",
      }
    ),
});

// POST /api/submissions/upload - Upload a file for a submission
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const sessionId = formData.get("sessionId") as string;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = FileSchema.safeParse({ file });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if user has valid contact email
    const hasEmail = await hasValidContactEmail(session.user.id, sessionId);
    if (!hasEmail) {
      return NextResponse.json(
        { error: "You must have a valid contact email to upload files" },
        { status: 403 }
      );
    }

    // Check if user is in a team
    const team = await getTeamByUserId(session.user.id);
    if (!team) {
      return NextResponse.json(
        { error: "You must be part of a team to upload files" },
        { status: 403 }
      );
    }

    // Upload to Vercel Blob
    const fileBuffer = await file.arrayBuffer();
    const extension = file.type.split("/")[1] || "bin";
    const filename = `submission-${team.id}-${Date.now()}.${extension}`;

    const blob = await put(`submission-files/${filename}`, fileBuffer, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Failed to upload file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
