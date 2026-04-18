import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Max file size: 8 MB (in bytes)
const MAX_FILE_SIZE = 8 * 1024 * 1024;

// Allowed MIME types for photo uploads
const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/pjpeg",
  "image/png", "image/x-png",
  "image/webp",
  "image/heic", "image/heif", "image/heic-sequence",
  "application/octet-stream" // Fallback for some mobile uploads
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    // Validate MIME type or Extension
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(fileType);
    const isAllowedExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!isAllowedMime && !isAllowedExt) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: ${file.type || "unknown"}. Gunakan JPG, PNG, atau WEBP.` },
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

    // Validasi buffer tidak kosong
    if (buffer.length < 100) {
      return NextResponse.json(
        { error: `File terlalu kecil atau corrupt (${buffer.length} bytes). Coba ambil foto ulang.` },
        { status: 400 }
      );
    }

    console.log(`DEBUG: Received file — name: ${file.name}, type: ${file.type}, size: ${(buffer.length / 1024).toFixed(2)} KB`);

    // Cek magic bytes untuk memastikan ini benar-benar JPEG
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isWebp = buffer.slice(8, 12).toString() === "WEBP";
    console.log(`DEBUG: Magic bytes check — JPEG: ${isJpeg}, PNG: ${isPng}, WEBP: ${isWebp}`);

    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    const result: any = await uploadToCloudinary(buffer, "uploads", resourceType, "image/jpeg");

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
