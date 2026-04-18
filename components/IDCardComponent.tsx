"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { CreditCard, User } from "lucide-react";

interface IDCardProps {
  nama: string;
  nomorUnik: string;
  dapukan: string;
  daerah: string;
  desa: string;
  foto?: string;
  gradient?: string;
}

export default function IDCardComponent({
  nama,
  nomorUnik,
  dapukan,
  daerah,
  desa,
  foto,
  gradient = "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
}: IDCardProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);

  useEffect(() => {
    // Initial logo fetch if already in window
    if (typeof window !== 'undefined') {
      const globalLogo = (window as any).__SITE_LOGO__;
      if (globalLogo) {
        setSiteLogo(globalLogo);
      } else {
        // Fallback fetch if not in window yet
        fetch("/api/settings")
          .then(res => res.json())
          .then(data => {
            if (data.site_logo) {
              setSiteLogo(data.site_logo);
              (window as any).__SITE_LOGO__ = data.site_logo;
            }
          })
          .catch(err => console.error("Error fetching logo for ID card:", err));
      }
      
      const handleLogoUpdate = () => {
        setSiteLogo((window as any).__SITE_LOGO__ || null);
      };
      window.addEventListener('site-logo-updated', handleLogoUpdate);
      return () => window.removeEventListener('site-logo-updated', handleLogoUpdate);
    }
  }, []);

  useEffect(() => {
    if (qrCanvasRef.current && nomorUnik) {
      QRCode.toCanvas(qrCanvasRef.current, nomorUnik, {
        width: 100,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }
  }, [nomorUnik]);

  return (
    <div className="id-card-wrapper">
      <div className="id-card-main" style={{ background: gradient }}>
        <div className="id-card-decoration">
          <div className="dec-circle c1" />
          <div className="dec-circle c2" />
        </div>

        <div className="id-card-content">
          <div className="id-header">
            <div className="id-logo">
              {siteLogo ? (
                <img src={siteLogo} alt="Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
              ) : (
                <div style={{ width: "32px", height: "32px", background: "rgba(255,255,255,0.1)", borderRadius: "6px" }} />
              )}
            </div>
            <div className="id-brand">
              <h1>ID CARD</h1>
              <p>PDKT V2.0</p>
            </div>
          </div>

          <div className="id-photo-container">
            <div className="id-photo-frame">
              {foto ? (
                <img src={foto} alt="Profile" />
              ) : (
                <div className="photo-placeholder">
                  <User size={64} />
                </div>
              )}
            </div>
          </div>

          <div className="id-info">
            <h2 className="id-name">{nama.toUpperCase() || "NAMA LENGKAP"}</h2>
            <div className="id-role">{(dapukan || "PANITIA / PENGURUS").toUpperCase()}</div>

            <div className="id-details">
              <div className="detail-item">
                <label>ASAL DAERAH</label>
                <span>{daerah || "-"}</span>
              </div>
              <div className="detail-item">
                <label>ASAL DESA</label>
                <span>{desa || "-"}</span>
              </div>
            </div>
          </div>

          <div className="id-qr-box">
            <div className="qr-container">
              <canvas ref={qrCanvasRef} />
            </div>
            <div className="id-number">{nomorUnik}</div>
          </div>
        </div>

        <div className="id-footer-seal">
          <span>DIGITAL IDENTITY VERIFIED</span>
        </div>
      </div>

      <style jsx>{`
        .id-card-wrapper {
          padding: 10px;
          background: white;
          border-radius: 20px;
          display: inline-block;
        }

        .id-card-main {
          width: 350px;
          height: 560px;
          border-radius: 15px;
          position: relative;
          overflow: hidden;
          color: white;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .id-card-decoration {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          opacity: 0.15;
        }

        .dec-circle {
          position: absolute;
          border-radius: 50%;
          background: white;
        }

        .c1 { width: 300px; height: 300px; top: -100px; right: -50px; }
        .c2 { width: 200px; height: 200px; bottom: -50px; left: -80px; }

        .id-card-content {
          padding: 30px;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .id-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          width: 100%;
        }

        .id-logo {
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .id-brand h1 { font-size: 20px; font-weight: 900; margin: 0; line-height: 1; }
        .id-brand p { font-size: 9px; margin: 4px 0 0 0; font-weight: 700; opacity: 0.8; letter-spacing: 1px; }

        .id-photo-container { margin-bottom: 24px; }
        .id-photo-frame {
          width: 160px;
          height: 160px;
          border-radius: 16px;
          padding: 6px;
          background: white;
          box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }
        .id-photo-frame img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
        .photo-placeholder {
          width: 100%; height: 100%; background: #f1f5f9; color: #cbd5e1;
          display: flex; align-items: center; justify-content: center; border-radius: 12px;
        }

        .id-info { text-align: center; width: 100%; }
        .id-name { font-size: 20px; font-weight: 900; margin: 0 0 6px 0; line-height: 1.2; }
        .id-role {
          display: inline-block; padding: 3px 14px; background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px); border-radius: 30px; font-size: 11px; font-weight: 800;
          margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.3);
        }

        .id-details {
          display: flex; justify-content: space-around; background: rgba(0,0,0,0.1);
          padding: 12px; border-radius: 14px; width: 100%; text-align: left;
        }
        .detail-item label { display: block; font-size: 8px; font-weight: 800; opacity: 0.7; margin-bottom: 2px; }
        .detail-item span { font-size: 12px; font-weight: 700; }

        .id-qr-box { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .qr-container { padding: 8px; background: white; border-radius: 12px; }
        .id-number { font-size: 12px; font-weight: 900; letter-spacing: 1.5px; color: #ffffff; opacity: 1; }

        .id-footer-seal {
          padding: 12px; text-align: center; background: rgba(0,0,0,0.1);
          font-size: 8px; font-weight: 800; letter-spacing: 1px;
        }
      `}</style>
    </div>
  );
}
