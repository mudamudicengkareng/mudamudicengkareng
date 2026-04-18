export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mandiriKomentar } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";

import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const penerimaId = searchParams.get("penerimaId");
        const pengirimId = searchParams.get("pengirimId");

        if (pengirimId) {
            // Fetch comments sent by this user
            const data = await db.query.mandiriKomentar.findMany({
                where: eq(mandiriKomentar.pengirimId, pengirimId),
                orderBy: [desc(mandiriKomentar.createdAt)],
                limit: 200
            });
            return NextResponse.json(data);
        }

        if (!penerimaId) {
            return NextResponse.json({ error: "penerimaId or pengirimId required" }, { status: 400 });
        }

        const data = await db.query.mandiriKomentar.findMany({
            where: eq(mandiriKomentar.penerimaId, penerimaId),
            orderBy: [desc(mandiriKomentar.createdAt)],
            limit: 50
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("GET komentar error:", error);
        return NextResponse.json({ error: "Gagal mengambil komentar" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { penerimaId, pengirimId, pengirimNama, isAnonim, komentar } = body;

        if (!penerimaId || !komentar) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        // Enforce global one comment limit in catalog per sender
        if (pengirimId) {
            const totalSent = await db.query.mandiriKomentar.findFirst({
                where: eq(mandiriKomentar.pengirimId, pengirimId)
            });

            if (totalSent) {
                return NextResponse.json({ error: "Anda hanya diperbolehkan mengirimkan satu komentar di katalog." }, { status: 400 });
            }
        }

        const id = uuidv4();
        await db.insert(mandiriKomentar).values({
            id,
            penerimaId,
            pengirimId: pengirimId || null,
            pengirimNama: isAnonim ? "Anonim" : pengirimNama,
            isAnonim: isAnonim ? 1 : 0,
            komentar,
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error("POST komentar error:", error);
        return NextResponse.json({ error: "Gagal mengirim komentar" }, { status: 500 });
    }
}
