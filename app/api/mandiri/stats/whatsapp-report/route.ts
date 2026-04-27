import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
    mandiriAbsensi, 
    mandiriKegiatan, 
    formPanitiaDanPengurus, 
    generus, 
    mandiriDesa,
    mandiriPemilihan,
    mandiriAntrean,
    mandiri
} from "@/lib/schema";
import { eq, desc, and, sql, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !["admin", "kmm_daerah", "admin_romantic_room", "pengurus_daerah", "tim_pnkb"].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get the latest activity
        const latestActivity = await db.select().from(mandiriKegiatan).orderBy(desc(mandiriKegiatan.tanggal)).limit(1);
        if (latestActivity.length === 0) {
            return NextResponse.json({ error: "No activity found" }, { status: 404 });
        }
        const kegiatanId = latestActivity[0].id;

        // 2. Get all regions (Desa)
        const regions = await db.select().from(mandiriDesa);

        const reports = [];

        for (const region of regions) {
            // Stats for this region
            
            // a. Participants attendance (Only those in the 'mandiri' table)
            const participantsAttendance = await db
                .select({ 
                    count: sql<number>`count(distinct ${generus.id})`,
                    male: sql<number>`count(distinct case when ${generus.jenisKelamin} = 'L' then ${generus.id} end)`,
                    female: sql<number>`count(distinct case when ${generus.jenisKelamin} = 'P' then ${generus.id} end)`
                })
                .from(mandiriAbsensi)
                .innerJoin(generus, eq(mandiriAbsensi.generusId, generus.id))
                .innerJoin(mandiri, eq(generus.id, mandiri.generusId))
                .where(and(
                    eq(mandiriAbsensi.kegiatanId, kegiatanId),
                    eq(generus.mandiriDesaId, region.id)
                ));

            // b. Committee attendance
            const committeeAttendance = await db
                .select({ 
                    count: sql<number>`count(distinct ${formPanitiaDanPengurus.id})`,
                    male: sql<number>`count(distinct case when ${formPanitiaDanPengurus.jenisKelamin} = 'L' then ${formPanitiaDanPengurus.id} end)`,
                    female: sql<number>`count(distinct case when ${formPanitiaDanPengurus.jenisKelamin} = 'P' then ${formPanitiaDanPengurus.id} end)`
                })
                .from(mandiriAbsensi)
                .innerJoin(formPanitiaDanPengurus, eq(mandiriAbsensi.generusId, formPanitiaDanPengurus.generusId))
                .where(and(
                    eq(mandiriAbsensi.kegiatanId, kegiatanId),
                    eq(formPanitiaDanPengurus.mandiriDesaId, region.id)
                ));

            // c. Romantic Room Results
            // We count a result for a region if at least one person in the pair is from this region.
            // But wait, the user says "per setiap daerah/kota". 
            // If I count results by region, it's better to count how many pairs involving people from this region had which result.
            // To avoid double counting pairs where both are from the same region, we just need to be careful.
            
            const pemilihanResults = await db
                .select({
                    id: mandiriPemilihan.id,
                    h1: mandiriPemilihan.hasilPengirim,
                    h2: mandiriPemilihan.hasilPenerima,
                })
                .from(mandiriPemilihan)
                .leftJoin(generus, or(eq(mandiriPemilihan.pengirimId, generus.id), eq(mandiriPemilihan.penerimaId, generus.id)))
                .where(and(
                    eq(mandiriPemilihan.status, "Selesai"),
                    eq(generus.mandiriDesaId, region.id)
                ))
                .groupBy(mandiriPemilihan.id);

            const rrStats = {
                lanjutLanjut: 0,
                tidakLanjutLanjut: 0,
                tidakLanjutTidakLanjut: 0,
                raguRaguRaguRagu: 0,
                raguRaguLanjut: 0,
                raguRaguTidakLanjut: 0
            };

            pemilihanResults.forEach(p => {
                const h1 = p.h1;
                const h2 = p.h2;

                if (h1 === "Lanjut" && h2 === "Lanjut") rrStats.lanjutLanjut++;
                else if ((h1 === "Lanjut" && h2 === "Tidak Lanjut") || (h1 === "Tidak Lanjut" && h2 === "Lanjut")) rrStats.tidakLanjutLanjut++;
                else if (h1 === "Tidak Lanjut" && h2 === "Tidak Lanjut") rrStats.tidakLanjutTidakLanjut++;
                else if (h1 === "Ragu-ragu" && h2 === "Ragu-ragu") rrStats.raguRaguRaguRagu++;
                else if ((h1 === "Ragu-ragu" && h2 === "Lanjut") || (h1 === "Lanjut" && h2 === "Ragu-ragu")) rrStats.raguRaguLanjut++;
                else if ((h1 === "Ragu-ragu" && h2 === "Tidak Lanjut") || (h1 === "Tidak Lanjut" && h2 === "Ragu-ragu")) rrStats.raguRaguTidakLanjut++;
            });

            // d. Menunggu Antrean
            const waitingCount = await db
                .select({ count: sql<number>`count(distinct ${mandiriAntrean.id})` })
                .from(mandiriAntrean)
                .innerJoin(generus, eq(mandiriAntrean.generusId, generus.id))
                .where(and(
                    eq(mandiriAntrean.status, "Menunggu"),
                    eq(generus.mandiriDesaId, region.id)
                ));

            reports.push({
                region: region.nama,
                kota: region.kota,
                pesertaHadir: participantsAttendance[0].count || 0,
                pesertaLaki: participantsAttendance[0].male || 0,
                pesertaPerempuan: participantsAttendance[0].female || 0,
                panitiaHadir: committeeAttendance[0].count || 0,
                panitiaLaki: committeeAttendance[0].male || 0,
                panitiaPerempuan: committeeAttendance[0].female || 0,
                rr: rrStats,
                menungguAntrean: waitingCount[0].count || 0
            });
        }

        const grandTotal = {
            pesertaHadir: reports.reduce((acc, r) => acc + r.pesertaHadir, 0),
            panitiaHadir: reports.reduce((acc, r) => acc + r.panitiaHadir, 0)
        };

        return NextResponse.json({ 
            kegiatan: latestActivity[0].judul,
            reports,
            grandTotal
        });

    } catch (error) {
        console.error("WhatsApp report error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
