export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generus, desa, kelompok, usersOld, mandiri, mandiriDesa, mandiriKelompok, settings, formPanitiaDanPengurus } from "@/lib/schema";
import { eq, and, or, like, sql, isNull, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nUnik = searchParams.get("nomorUnik");
    const sToken = searchParams.get("sessionToken");

    let isAuthorizedModifier = false;
    if (nUnik && sToken) {
      const authCheck = await db.select({ 
        role: formPanitiaDanPengurus.dapukan 
      })
      .from(generus)
      .leftJoin(mandiri, eq(generus.id, mandiri.generusId))
      .leftJoin(formPanitiaDanPengurus, eq(generus.id, formPanitiaDanPengurus.generusId))
      .where(and(eq(generus.nomorUnik, nUnik), eq(mandiri.lastSessionToken, sToken)))
      .limit(1);

      if (authCheck[0]?.role === "Panitia" || authCheck[0]?.role === "Pengurus") {
        isAuthorizedModifier = true;
      }
    }

    // 1. Check Public Access Status
    const publicStatusSet = await db.select().from(settings).where(eq(settings.key, "mandiri_katalog_public_status"));
    const isPublicOpen = publicStatusSet[0]?.value === "open";

    if (!isPublicOpen && !isAuthorizedModifier) {
      return NextResponse.json({ error: "Katalog sedang tidak dibuka untuk publik." }, { status: 403 });
    }
    const search = (searchParams.get("search") || "").trim();
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const jenisKelamin = searchParams.get("jenisKelamin") || "all";
    const status = searchParams.get("status") || "all";
    const pendidikan = searchParams.get("pendidikan") || "all";
    const mandiriDesaId = searchParams.get("mandiriDesaId") || "all";
    const desaId = searchParams.get("desaId") || "all";

    // Build conditions
    const conditions: any[] = [];
    
    if (search) {
      conditions.push(
        or(
          like(generus.nama, `%${search}%`),
          like(generus.nomorUnik, `%${search}%`),
          like(mandiri.nomorUrut, `%${search}%`),
          like(mandiriDesa.kota, `%${search}%`),
          like(mandiriDesa.nama, `%${search}%`),
          like(desa.nama, `%${search}%`),
          like(kelompok.nama, `%${search}%`)
        )
      );
    }

    if (jenisKelamin && (jenisKelamin === "L" || jenisKelamin === "P")) {
      conditions.push(eq(generus.jenisKelamin, jenisKelamin as "L" | "P"));
    }

    if (status === "panitia") {
      conditions.push(
        or(
          and(sql`${usersOld.role} IS NOT NULL`, sql`${usersOld.role} != 'generus'`),
          isNotNull(formPanitiaDanPengurus.id)
        )
      );
    } else if (status === "peserta") {
      conditions.push(
        and(
          or(eq(usersOld.role, "generus"), isNull(usersOld.role)),
          isNull(formPanitiaDanPengurus.id)
        )
      );
    }

    if (pendidikan && pendidikan !== "all") {
      if (/^[SD][1-4]$/i.test(pendidikan)) {
        const char = pendidikan[0].toUpperCase();
        const num = pendidikan[1];
        conditions.push(or(
          like(generus.pendidikan, `${char}${num}%`),
          like(generus.pendidikan, `${char}-${num}%`),
          like(generus.pendidikan, `${char} ${num}%`),
          like(generus.pendidikan, `${char}.${num}%`)
        ));
      } else {
        conditions.push(like(generus.pendidikan, `${pendidikan}%`));
      }
    }

    if (mandiriDesaId && mandiriDesaId !== "all") {
      conditions.push(eq(generus.mandiriDesaId, Number(mandiriDesaId)));
    }

    if (desaId && desaId !== "all") {
      conditions.push(eq(generus.desaId, Number(desaId)));
    }

    const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch Data
    const dataQuery = db
      .select({
        id: generus.id,
        nomorUnik: generus.nomorUnik,
        nama: generus.nama,
        jenisKelamin: generus.jenisKelamin,
        kategoriUsia: generus.kategoriUsia,
        statusNikah: generus.statusNikah,
        suku: generus.suku,
        foto: generus.foto,
        desaNama: desa.nama,
        kelompokNama: kelompok.nama,
        mandiriDesaNama: mandiriDesa.nama,
        mandiriDesaKota: mandiriDesa.kota,
        mandiriKelompokNama: mandiriKelompok.nama,
        createdAt: generus.createdAt,
        tempatLahir: generus.tempatLahir,
        tanggalLahir: generus.tanggalLahir,
        pendidikan: generus.pendidikan,
        pekerjaan: generus.pekerjaan,
        hobi: generus.hobi,
        makananMinumanFavorit: generus.makananMinumanFavorit,
        instagram: generus.instagram,
        alamat: generus.alamat,
        role: usersOld.role,
        nomorUrut: mandiri.nomorUrut,
        panitiaStatus: formPanitiaDanPengurus.dapukan,
      })
      .from(generus)
      .innerJoin(mandiri, eq(generus.id, mandiri.generusId))
      .leftJoin(desa, eq(generus.desaId, desa.id))
      .leftJoin(kelompok, eq(generus.kelompokId, kelompok.id))
      .leftJoin(mandiriDesa, eq(generus.mandiriDesaId, mandiriDesa.id))
      .leftJoin(mandiriKelompok, eq(generus.mandiriKelompokId, mandiriKelompok.id))
      .leftJoin(usersOld, eq(generus.id, usersOld.generusId))
      .leftJoin(formPanitiaDanPengurus, eq(generus.id, formPanitiaDanPengurus.generusId));

    // Count Query - MUST have same joins as dataQuery for conditions that use joined tables
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(generus)
      .innerJoin(mandiri, eq(generus.id, mandiri.generusId))
      .leftJoin(usersOld, eq(generus.id, usersOld.generusId))
      .leftJoin(mandiriDesa, eq(generus.mandiriDesaId, mandiriDesa.id))
      .leftJoin(desa, eq(generus.desaId, desa.id))
      .leftJoin(kelompok, eq(generus.kelompokId, kelompok.id))
      .leftJoin(formPanitiaDanPengurus, eq(generus.id, formPanitiaDanPengurus.generusId));

    const [data, countResult] = await Promise.all([
      dataQuery
        .where(finalWhere)
        .orderBy(generus.nama)
        .limit(limit)
        .offset(offset),
      countQuery.where(finalWhere),
    ]);

    return NextResponse.json({
      data,
      total: Number(countResult[0]?.count || 0),
      page,
      limit
    });
  } catch (error: any) {
    console.error("Public Katalog error:", error);
    return NextResponse.json({ error: "Gagal mengambil data katalog publik" }, { status: 500 });
  }
}
