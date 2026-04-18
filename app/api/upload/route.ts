import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // 1. Validasi keberadaan file
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File tidak ditemukan atau kosong" }, { status: 400 });
    }

    // 2. Cek ukuran file (Limit Vercel Free adalah 4.5MB)
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file terlalu besar (Maksimal 4MB)" }, { status: 400 });
    }

    // 3. Konversi File ke Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Deteksi Tipe Resource
    const resourceType = file.type.startsWith("video/") ? "video" : "image";

    // 5. Eksekusi Upload dengan Promise
    const result: any = await uploadToCloudinary(buffer, "my_app_uploads", resourceType);

    // 6. Respon Sukses
    return NextResponse.json({ 
      success: true, 
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error: any) {
    // Logging detail untuk mempermudah cek di Vercel Dashboard Logs
    console.error("CLOUDINARY_UPLOAD_ERROR:", error);
    
    return NextResponse.json({ 
      error: "Gagal mengupload file",
      message: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}