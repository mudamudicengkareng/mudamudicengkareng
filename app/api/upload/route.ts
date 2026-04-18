import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Max file size: 8 MB (in bytes)
const MAX_FILE_SIZE = 8 * 1024 * 1024;

// Allowed MIME types for photo uploads
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: ${file.type}. Gunakan JPG, PNG, atau WEBP.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file terlalu besar (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Maksimal 8 MB.` },
        { status: 400 }
      );
    }

    console.log(`DEBUG: Target upload file size: ${(buffer.length / 1024).toFixed(2)} KB, type: ${file.type}`);

    // Determine resource type based on mime type
    const resourceType = file.type.startsWith("video/") ? "video" : "image";

    // Upload to Cloudinary — pass actual MIME type for correct base64 encoding
    const result: any = await uploadToCloudinary(buffer, "uploads", resourceType, file.type);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error("Cloudinary upload error details:", error);
    return NextResponse.json(
      {
        error: "Gagal mengupload foto ke Cloudinary: " + (error.message || "Unknown error"),
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
