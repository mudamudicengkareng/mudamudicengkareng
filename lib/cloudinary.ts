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
  console.log(`DEBUG: Start Cloudinary stream upload to folder: ${folder}, size: ${(fileBuffer.length / 1024).toFixed(2)} KB, type: ${mimeType}...`);

  return new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        timeout: 300000,
      },
      (error, result) => {
        if (error) {
          console.error(`DEBUG: Cloudinary stream error after ${Date.now() - start}ms:`, error);
          reject(error);
        } else {
          console.log(`DEBUG: Cloudinary upload success in ${Date.now() - start}ms`);
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
