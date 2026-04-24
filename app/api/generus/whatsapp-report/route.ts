import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generus, mandiri, mandiriDesa, usersOld, formPanitiaDanPengurus } from "@/lib/schema";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "pengurus_daerah", "tim_pnkb", "admin_romantic_room", "kmm_daerah", "admin_pdkt"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all participants registered in mandiri
    const data = await db
      .select({
        id: generus.id,
        jenisKelamin: generus.jenisKelamin,
        role: usersOld.role,
        panitiaStatus: formPanitiaDanPengurus.dapukan,
        kota: mandiriDesa.kota,
        desa: mandiriDesa.nama,
      })
      .from(generus)
      .innerJoin(mandiri, eq(generus.id, mandiri.generusId))
      .leftJoin(mandiriDesa, eq(generus.mandiriDesaId, mandiriDesa.id))
      .leftJoin(usersOld, eq(generus.id, usersOld.generusId))
      .leftJoin(formPanitiaDanPengurus, eq(generus.id, formPanitiaDanPengurus.generusId));

    if (data.length === 0) {
      return NextResponse.json({ error: "Tidak ada data peserta." }, { status: 400 });
    }

    // Aggregate data
    const report: Record<string, Record<string, any>> = {};
    let totalPeserta = 0;
    let totalPanitia = 0;

    data.forEach((item) => {
      const kota = item.kota || "Tanpa Kota";
      const desa = item.desa || "Tanpa Desa";
      const isPanitia = !!(item.panitiaStatus || item.role === "admin" || (item.role && item.role !== "generus" && item.role !== "peserta"));

      if (!report[kota]) report[kota] = {};
      if (!report[kota][desa]) {
        report[kota][desa] = {
          pesertaL: 0,
          pesertaP: 0,
          panitiaL: 0,
          panitiaP: 0,
        };
      }

      if (isPanitia) {
        totalPanitia++;
        if (item.jenisKelamin === "L") report[kota][desa].panitiaL++;
        else report[kota][desa].panitiaP++;
      } else {
        totalPeserta++;
        if (item.jenisKelamin === "L") report[kota][desa].pesertaL++;
        else report[kota][desa].pesertaP++;
      }
    });

    // Construct Message
    let message = "*LAPORAN DATA PESERTA & PANITIA*\n";
    message += "--------------------------------\n\n";

    for (const [kota, desas] of Object.entries(report)) {
      message += `*DAERAH/KOTA: ${kota.toUpperCase()}*\n`;
      for (const [desa, stats] of Object.entries(desas)) {
        message += `- Desa ${desa}:\n`;
        message += `  • Peserta: ${stats.pesertaL + stats.pesertaP} (L: ${stats.pesertaL}, P: ${stats.pesertaP})\n`;
        message += `  • Panitia: ${stats.panitiaL + stats.panitiaP} (L: ${stats.panitiaL}, P: ${stats.panitiaP})\n`;
      }
      message += "\n";
    }

    message += "--------------------------------\n";
    message += `*TOTAL SELURUHNYA*\n`;
    message += `Total Peserta: ${totalPeserta}\n`;
    message += `Total Panitia: ${totalPanitia}\n`;
    message += `Grand Total: ${totalPeserta + totalPanitia}\n\n`;

    const targetNumber = "085159522624";
    let sent = false;

    // Try to send via local WhatsApp Bot API
    try {
      const botRes = await fetch("http://localhost:3001/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: targetNumber,
          message: message
        })
      });
      if (botRes.ok) {
        const botJson = await botRes.json();
        if (botJson.success) sent = true;
      }
    } catch (e) {
      console.log("Local bot not running, fallback to manual.");
    }

    // Check for an external WhatsApp Gateway (e.g. Fonnte)
    /*
    const apiKey = process.env.FONNTE_API_KEY;
    if (!sent && apiKey) {
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { "Authorization": apiKey },
        body: new URLSearchParams({
          target: targetNumber,
          message: message
        })
      });
      if (res.ok) sent = true;
    }
    */

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil dibuat.",
      whatsappMessage: message,
      targetNumber,
      sent
    });

  } catch (error: any) {
    console.error("Report Error:", error);
    return NextResponse.json({ error: "Gagal membuat laporan: " + error.message }, { status: 500 });
  }
}
