"use client";

import { useState, useEffect } from "react";

interface Props {
  showDate?: boolean;
  showTime?: boolean;
  className?: string;
}

export default function DigitalClock({ showDate = true, showTime = true, className }: Props) {
  const [dateTime, setDateTime] = useState<{ 
    date: string; 
    dateMedium: string; 
    dateShort: string; 
    time: string 
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const now = new Date();

      // Desktop: Sabtu, 18 April 2026
      const dateStr = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      // Tablet: Sabtu, 18 Apr 2026
      const dateMediumStr = now.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      // Mobile: 18 Apr 2026
      const dateShortStr = now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) + " WIB";

      setDateTime({ 
        date: dateStr, 
        dateMedium: dateMediumStr, 
        dateShort: dateShortStr, 
        time: timeStr 
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className={className || "topbar-date"} 
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {!dateTime ? (
        <span>Memuat waktu...</span>
      ) : (
        <>
          {showDate && (
            <>
              <span className="date-desktop" suppressHydrationWarning>{dateTime.date}</span>
              <span className="date-tablet" suppressHydrationWarning>{dateTime.dateMedium}</span>
              <span className="date-mobile" suppressHydrationWarning>{dateTime.dateShort}</span>
            </>
          )}
          {showTime && (
            <span className="digital-clock" style={{ display: 'inline-flex', alignItems: 'center' }} suppressHydrationWarning>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {dateTime.time}
            </span>
          )}
        </>
      )}

      <style jsx>{`
        .date-desktop { display: inline; margin-right: 12px; }
        .date-tablet { display: none; margin-right: 12px; }
        .date-mobile { display: none; margin-right: 12px; }
        
        .digital-clock svg { margin-right: 6px; }

        @media (max-width: 1024px) {
          .date-desktop { display: none; }
          .date-tablet { display: inline; }
        }

        @media (max-width: 768px) {
          .date-tablet { display: none; }
          .date-mobile { display: inline; }
        }
        
        @media (max-width: 480px) {
          .date-mobile { font-size: 11px; }
          .digital-clock { font-size: 11px; }
          .topbar-date { gap: 4px; }
        }
      `}</style>
    </div>
  );
}
