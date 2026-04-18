import { v2 as cloudinary } from "cloudinary";

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("DEBUG: Cloudinary credentials missing in .env.local", {
    cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
    api_key: !!process.env.CLOUDINARY_API_KEY,
    api_secret: !!process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.log("DEBUG: Cloudinary config found for cloud:", process.env.CLOUDINARY_CLOUD_NAME);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 120000,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = "jb2-id",
  resourceType: "auto" | "image" | "video" | "raw" = "auto",
  mimeType: string = "image/jpeg"
) => {
  const start = Date.now();

  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("File buffer kosong atau tidak valid");
  }

  // Selalu pakai image/jpeg untuk gambar agar data URL valid di Cloudinary
  const safeMime = resourceType === "video" ? mimeType : "image/jpeg";

  console.log(`DEBUG: Cloudinary upload start — folder: ${folder}, size: ${(fileBuffer.length / 1024).toFixed(2)} KB, mime: ${safeMime}`);

  const base64 = fileBuffer.toString("base64");
  const dataUrl = `data:${safeMime};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder,
    resource_type: resourceType,
    timeout: 300000,
  });

  console.log(`DEBUG: Cloudinary upload success in ${Date.now() - start}ms`);
  return result;
};

export default cloudinary;
