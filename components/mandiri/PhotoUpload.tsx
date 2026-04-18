"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Check, RefreshCw, Image as ImageIcon } from "lucide-react";
import Swal from "sweetalert2";

interface PhotoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
}

export default function PhotoUpload({ value, onChange, label, helperText }: PhotoUploadProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(s);
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      Swal.fire({ 
        icon: "error", 
        title: "Kamera Tidak Diakses", 
        text: "Mohon izinkan akses kamera untuk mengambil foto.",
        confirmButtonColor: "#3b82f6"
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Mirror the image if using front camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      stopCamera();
      uploadFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format: JPEG, JPG, PNG only
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({ 
        icon: "error", 
        title: "Format Tidak Didukung", 
        text: "Mohon unggah file dengan format JPEG, JPG, atau PNG saja.",
        confirmButtonColor: "#3b82f6"
      });
      e.target.value = "";
      return;
    }

    // Max 10MB for client-side processing
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ 
        icon: "error", 
        title: "File Terlalu Besar", 
        text: "Ukuran foto maksimal adalah 10 MB.",
        confirmButtonColor: "#3b82f6"
      });
      e.target.value = "";
      return;
    }

    uploadFile(file);
    e.target.value = ""; // Reset
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    
    // Create local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      // Image compression before upload
      let finalFile: File = file;
      if (file.size > 800 * 1024) { // If > 800KB
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1200;
        const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
        if (blob) finalFile = new File([blob], "photo.jpg", { type: "image/jpeg" });
      }

      const fd = new FormData();
      fd.append("file", finalFile);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      
      if (json.url) {
        setPreview(json.url);
        onChange(json.url);
        Swal.fire({
          icon: 'success',
          title: 'Foto Berhasil Diunggah!',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        throw new Error(json.error || "Gagal mengunggah foto");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setPreview(value || null); // Revert to old value
      Swal.fire({ 
        icon: "error", 
        title: "Upload Gagal", 
        text: err.message || "Terjadi kesalahan saat mengunggah foto.",
        confirmButtonColor: "#3b82f6"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="photo-upload-container" style={{ width: "100%" }}>
      {label && (
        <label className="form-label" style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px", color: "var(--text)" }}>
          {label}
        </label>
      )}

      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "200px",
        height: "200px",
        margin: "0 auto",
        borderRadius: "20px",
        overflow: "hidden",
        background: "#f1f5f9",
        border: "2px dashed #cbd5e1",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: preview ? "0 10px 25px -5px rgba(0, 0, 0, 0.1)" : "none"
      }}>
        {preview ? (
          <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Photo Preview" />
        ) : (
          <>
            <ImageIcon size={48} color="#94a3b8" />
            <p style={{ margin: "12px 0 0", color: "#64748b", fontSize: "12px", fontWeight: "500" }}>Belum ada foto</p>
          </>
        )}

        {uploading && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5
          }}>
            <div className="spinner" style={{ border: "3px solid #f3f3f3", borderTop: "3px solid #3b82f6", borderRadius: "50%", width: "30px", height: "30px", animation: "spin 1s linear infinite" }}></div>
            <p style={{ marginTop: "10px", fontSize: "12px", fontWeight: "bold", color: "#3b82f6" }}>Mengunggah...</p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "16px" }}>
        <button 
          type="button" 
          onClick={startCamera}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#eff6ff",
            color: "#2563eb",
            border: "none",
            padding: "10px 16px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#dbeafe")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#eff6ff")}
        >
          <Camera size={18} /> Ambil Foto
        </button>

        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#f8fafc",
            color: "#475569",
            border: "1px solid #e2e8f0",
            padding: "10px 16px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#f8fafc")}
        >
          <Upload size={18} /> Pilih File
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/jpeg,image/jpg,image/png" 
          onChange={handleFileChange}
        />
      </div>

      {helperText && (
        <p style={{ 
          fontSize: "11px", 
          color: "var(--text-muted)", 
          marginTop: "12px", 
          textAlign: "center",
          lineHeight: "1.5",
          maxWidth: "280px",
          margin: "12px auto 0"
        }}>
          {helperText}
        </p>
      )}

      {/* Camera Modal Overlay */}
      {isCameraOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.95)", zIndex: 99999, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(5px)"
        }}>
          <div style={{ 
            position: "relative", 
            width: "100%", 
            maxWidth: "600px", 
            aspectRatio: "3/4", 
            background: "#1e293b", 
            borderRadius: "24px", 
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            border: "2px solid rgba(255,255,255,0.1)"
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} 
            />
            
            {/* Guide Overlay */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "70%",
              height: "70%",
              border: "2px dashed rgba(255,255,255,0.4)",
              borderRadius: "50%",
              pointerEvents: "none"
            }}></div>

            <div style={{ 
              position: "absolute", 
              bottom: "30px", 
              left: 0, 
              width: "100%", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              gap: "24px",
              padding: "0 20px"
            }}>
              <button 
                type="button" 
                onClick={stopCamera}
                style={{ 
                  background: "rgba(255,255,255,0.15)", 
                  color: "white", 
                  border: "none", 
                  width: "50px", 
                  height: "50px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)"
                }}>
                <X size={24} />
              </button>
              
              <button 
                type="button" 
                onClick={capturePhoto} 
                style={{ 
                  background: "white", 
                  color: "#1e293b", 
                  border: "none", 
                  width: "70px", 
                  height: "70px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(255,255,255,0.3)",
                  transition: "transform 0.1s active"
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{ width: "56px", height: "56px", border: "2px solid #1e293b", borderRadius: "50%" }}></div>
              </button>
              
              <div style={{ width: "50px" }}></div> {/* Placeholder for symmetry */}
            </div>
          </div>
          
          <p style={{ color: "white", marginTop: "20px", fontSize: "14px", fontWeight: "500", opacity: 0.8 }}>
            Posisikan wajah di dalam lingkaran
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
