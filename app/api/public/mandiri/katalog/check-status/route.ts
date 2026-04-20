export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiriAbsensi, mandiriKegiatan, generus, mandiri, mandiriDesa, formPanitiaDanPengurus } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nomorUnik = searchParams.get("nomorUnik");
    const nomorPeserta = searchParams.get("nomorPeserta");
    const sessionToken = searchParams.get("sessionToken");
    const deviceId = searchParams.get("deviceId");

    if (!nomorUnik && !nomorPeserta) {
      return NextResponse.json({ error: "Nomor identitas diperlukan" }, { status: 400 });
    }

    // 1. Get the latest activity
    const latestActivity = await db.select().from(mandiriKegiatan).orderBy(desc(mandiriKegiatan.tanggal)).limit(1);
    if (latestActivity.length === 0) {
      return NextResponse.json({ status: "no_activity" });
    }

    const kegiatanId = latestActivity[0].id;

    // 2. Find the generus - Require BOTH nomorPeserta AND nomorUnik for explicit login
    let generusId = null;

    if (nomorPeserta && nomorUnik) {
        // Find user that matches BOTH nomorUrut in mandiri table AND nomorUnik in generus table
        const userMatch = await db.select({ id: generus.id })
            .from(generus)
            .innerJoin(mandiri, eq(generus.id, mandiri.generusId))
            .where(and(
                eq(mandiri.nomorUrut, Number(nomorPeserta)),
                eq(generus.nomorUnik, nomorUnik)
            ))
            .limit(1);
        
        if (userMatch.length > 0) generusId = userMatch[0].id;
    } else if (nomorUnik) {
        // Fallback or passive check using only nomorUnik/sessionToken
        const u = await db.select({ id: generus.id })
            .from(generus)
            .where(eq(generus.nomorUnik, nomorUnik))
            .limit(1);
        if (u.length > 0) generusId = u[0].id;
    }

    if (!generusId) {
      return NextResponse.json({ status: "not_found" });
    }

    // 3. Check if attended the latest activity
    const attendance = await db.select()
      .from(mandiriAbsensi)
      .where(and(
        eq(mandiriAbsensi.kegiatanId, kegiatanId),
        eq(mandiriAbsensi.generusId, generusId)
      ))
      .limit(1);

    if (attendance.length > 0) {
      // Find the user's name and last session token
      const user = await db.select({ 
          id: generus.id,
          nama: generus.nama,
          nomorUrut: mandiri.nomorUrut,
          nomorUnik: generus.nomorUnik,
          lastSessionToken: mandiri.lastSessionToken,
          deviceId: mandiri.deviceId,
          mandiriDesaNama: mandiriDesa.nama,
          mandiriDesaKota: mandiriDesa.kota,
          jenisKelamin: generus.jenisKelamin,
          role: formPanitiaDanPengurus.dapukan
      })
      .from(generus)
      .leftJoin(mandiri, eq(generus.id, mandiri.generusId))
      .leftJoin(mandiriDesa, eq(generus.mandiriDesaId, mandiriDesa.id))
      .leftJoin(formPanitiaDanPengurus, eq(generus.id, formPanitiaDanPengurus.generusId))
      .where(eq(generus.id, generusId))
      .limit(1);

      // Verify session token if provided (passive check for existing sessions)
      // This is what prevents multiple simultaneous sessions
      const isAdminRole = user[0]?.role === "Admin Romantic Room" || user[0]?.role === "admin_romantic_room";
      
      if (!isAdminRole && sessionToken && user[0]?.lastSessionToken && sessionToken !== user[0].lastSessionToken) {
          return NextResponse.json({ status: "multi_login" });
      }

      // If logging in via nomorPeserta (explicit login)
      if (nomorPeserta) {
        // Generate new token to invalidate other sessions (except for admins)
        const finalSessionToken = isAdminRole && user[0]?.lastSessionToken ? user[0].lastSessionToken : uuidv4();
        
        // Update both deviceId and lastSessionToken
        // For admins, we keep the lastSessionToken if it exists to allow multiple sessions sharing the same token
        await db.update(mandiri)
            .set({ 
              deviceId: deviceId || user[0]?.deviceId, 
              lastSessionToken: finalSessionToken 
            })
            .where(eq(mandiri.generusId, generusId));

        return NextResponse.json({ 
          status: "attended", 
          id: user[0]?.id,
          kegiatanId,
          kegiatanJudul: latestActivity[0].judul,
          nama: user[0]?.nama || "Peserta",
          nomorUrut: user[0]?.nomorUrut || "-",
          nomorUnik: user[0]?.nomorUnik || nomorUnik,
          mandiriDesaNama: user[0]?.mandiriDesaNama,
          mandiriDesaKota: user[0]?.mandiriDesaKota,
          jenisKelamin: user[0]?.jenisKelamin,
          role: user[0]?.role || "Peserta",
          sessionToken: finalSessionToken
        });
      }

      // If it's a passive check (sessionToken provided), we already verified it above.
      // If it's just a nomorUnik check without a token, return the current state
      // (This part might be used for initial loading)
      return NextResponse.json({ 
        status: "attended", 
        id: user[0]?.id,
        kegiatanId,
        kegiatanJudul: latestActivity[0].judul,
        nama: user[0]?.nama || "Peserta",
        nomorUrut: user[0]?.nomorUrut || "-",
        nomorUnik: user[0]?.nomorUnik || nomorUnik,
        mandiriDesaNama: user[0]?.mandiriDesaNama,
        mandiriDesaKota: user[0]?.mandiriDesaKota,
        jenisKelamin: user[0]?.jenisKelamin,
        role: user[0]?.role || "Peserta",
        sessionToken: sessionToken || user[0]?.lastSessionToken
      });
    }

    return NextResponse.json({ status: "waiting", kegiatanId });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
