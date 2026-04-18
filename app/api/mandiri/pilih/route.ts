export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiriPemilihan, users, generus, mandiriAntrean, mandiri } from "@/lib/schema";
import { eq, and, or, count, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nomorUnikReq = searchParams.get("nomorUnik");
        const tokenReq = searchParams.get("token");

        let currentGenerusId: string | null = null;
        let isAdmin = false;

        const session = await getSession();
        if (session) {
            currentGenerusId = session.generusId || null;
            isAdmin = ["admin", "kmm_daerah", "admin_romantic_room", "pengurus_daerah", "tim_pnkb"].includes(session.role);
        }

        // If not logged in but has token, verify token
        if (!currentGenerusId && nomorUnikReq && tokenReq) {
            const m = await db.select({ generusId: mandiri.generusId })
                .from(mandiri)
                .innerJoin(generus, eq(mandiri.generusId, generus.id))
                .where(and(eq(generus.nomorUnik, nomorUnikReq), eq(mandiri.lastSessionToken, tokenReq)))
                .limit(1);
            if (m.length > 0) currentGenerusId = m[0].generusId;
        }

        if (!currentGenerusId && !isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (isAdmin && searchParams.get("all") === "true") {
            const g1 = alias(generus, "g1");
            const g2 = alias(generus, "g2");

            const allSelections = await db.select({
                id: mandiriPemilihan.id,
                status: mandiriPemilihan.status,
                createdAt: mandiriPemilihan.createdAt,
                pengirimNama: g1.nama,
                pengirimNo: g1.nomorUnik,
                penerimaNama: g2.nama,
                penerimaNo: g2.nomorUnik
            })
            .from(mandiriPemilihan)
            .innerJoin(g1, eq(mandiriPemilihan.pengirimId, g1.id))
            .innerJoin(g2, eq(mandiriPemilihan.penerimaId, g2.id))
            .orderBy(desc(mandiriPemilihan.createdAt));

            return NextResponse.json(allSelections);
        }

        const targetPengirimId = searchParams.get("pengirimId") || currentGenerusId;
        if (!targetPengirimId) return NextResponse.json({ error: "Identitas tidak ditemukan" }, { status: 400 });

        const selections = await db.select({
            id: mandiriPemilihan.id,
            status: mandiriPemilihan.status,
            penerimaId: mandiriPemilihan.penerimaId,
            createdAt: mandiriPemilihan.createdAt,
            penerimaNama: generus.nama,
            penerimaNo: generus.nomorUnik,
            penerimaNoUrut: mandiri.nomorUrut
        })
        .from(mandiriPemilihan)
        .innerJoin(generus, eq(mandiriPemilihan.penerimaId, generus.id))
        .leftJoin(mandiri, eq(generus.id, mandiri.generusId))
        .where(eq(mandiriPemilihan.pengirimId, targetPengirimId))
        .orderBy(desc(mandiriPemilihan.createdAt));

        return NextResponse.json(selections);
    } catch (error) {
        console.error("GET selection error:", error);
        return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { targetId, nomorUnik, token } = body;

        let pengirimId: string | null = null;

        const session = await getSession();
        if (session) {
            pengirimId = session.generusId || null;
        }

        // Token validation for independent participants
        if (!pengirimId && nomorUnik && token) {
             const m = await db.select({ generusId: mandiri.generusId })
                .from(mandiri)
                .innerJoin(generus, eq(mandiri.generusId, generus.id))
                .where(and(eq(generus.nomorUnik, nomorUnik), eq(mandiri.lastSessionToken, token)))
                .limit(1);
            if (m.length > 0) pengirimId = m[0].generusId;
        }

        if (!pengirimId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!targetId) return NextResponse.json({ error: "Target pilihan tidak valid" }, { status: 400 });
        if (pengirimId === targetId) return NextResponse.json({ error: "Tidak dapat memilih diri sendiri" }, { status: 400 });

        // Check if already selected
        const existing = await db.query.mandiriPemilihan.findFirst({
            where: and(eq(mandiriPemilihan.pengirimId, pengirimId), eq(mandiriPemilihan.penerimaId, targetId))
        });
        if (existing) return NextResponse.json({ error: "Anda sudah memilih peserta ini" }, { status: 400 });

        // Count active selections (max 3)
        const activeCount = await db.select({ value: count() }).from(mandiriPemilihan)
            .where(and(eq(mandiriPemilihan.pengirimId, pengirimId), or(eq(mandiriPemilihan.status, "Menunggu"), eq(mandiriPemilihan.status, "Diterima"))));
        
        const countVal = Number(activeCount[0]?.value || 0);
        if (countVal >= 3) {
             return NextResponse.json({ error: "Anda telah mencapai batas maksimum 3 pemilihan" }, { status: 403 });
        }

        const id = uuidv4();
        await db.insert(mandiriPemilihan).values({
            id,
            pengirimId,
            penerimaId: targetId,
            status: "Menunggu"
        });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("POST selection error:", error);
        return NextResponse.json({ error: "Gagal memproses pilihan" }, { status: 500 });
    }
}

