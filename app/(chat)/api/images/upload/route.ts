import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "File size should be less than 10MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          file.type
        ),
      {
        message: "File type should be JPEG, PNG, WebP, or GIF",
      }
    ),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const extension = file.type.split("/")[1] || "jpg";
    const filename = `profile-${session.user.id}-${Date.now()}.${extension}`;

    const blob = await put(`profile-images/${filename}`, fileBuffer, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error("Failed to upload image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
