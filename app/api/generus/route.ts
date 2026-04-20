export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generus, desa, kelompok, usersOld, mandiri, mandiriDesa, mandiriKelompok, formPanitiaDanPengurus } from "@/lib/schema";
import { eq, and, or, like, sql, not, isNull, isNotNull, ne, inArray, notInArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx-js-style"; // Import library styling

function generateNomorUnik() {
  const prefix = "GNR";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
}

function buildWhereClause(
  session: Awaited<ReturnType<typeof getSession>>,
  search?: string,
  ignoreRoleRestriction?: boolean,
  statusNikah?: string,
  desaId?: string,
  kelompokId?: string,
  jenisKelamin?: string,
  status?: string,
  kategoriUsia?: string,
  notInMandiri?: boolean,
  isGenerus?: boolean,
  pendidikan?: string,
  mandiriDesaId?: string
) {
  const conditions: any[] = [];

  if (isGenerus) {
    conditions.push(eq(generus.isGenerus, 1));
  }

  if (notInMandiri) {
    conditions.push(isNull(mandiri.id));
  }

  // 1. Role-based restrictions
  if (!ignoreRoleRestriction) {
    if ((session?.role === "desa" || (session?.role === "tim_pnkb" && !session.kelompokId)) && session.desaId) {
      conditions.push(eq(generus.desaId, session.desaId));
    } else if ((session?.role === "kelompok" || (session?.role === "tim_pnkb" && session.kelompokId)) && session.kelompokId) {
      conditions.push(eq(generus.kelompokId, session.kelompokId));
    }
  }

  // 2. Explicit User Filters
  if (desaId && desaId !== "all" && !isNaN(Number(desaId))) {
    conditions.push(eq(generus.desaId, Number(desaId)));
  }
  if (kelompokId && kelompokId !== "all" && !isNaN(Number(kelompokId))) {
    conditions.push(eq(generus.kelompokId, Number(kelompokId)));
  }
  if (mandiriDesaId && mandiriDesaId !== "all" && !isNaN(Number(mandiriDesaId))) {
    conditions.push(eq(generus.mandiriDesaId, Number(mandiriDesaId)));
  }

  // 3. Other filters
  if (statusNikah && statusNikah !== "all") {
    conditions.push(eq(generus.statusNikah, statusNikah as any));
  }

  if (kategoriUsia && kategoriUsia !== "all") {
    conditions.push(eq(generus.kategoriUsia, kategoriUsia as any));
  }

  if (pendidikan && pendidikan !== "all") {
    // If it's a standard level like S1, D3, handle common variations (S-1, S 1, etc.)
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

  if (search) {
    const isGnrCode = /^GNR\d+$/i.test(search.trim());
    if (isGnrCode) {
      // Exact match for codes is much faster
      conditions.push(eq(generus.nomorUnik, search.trim().toUpperCase()));
    } else {
      conditions.push(
        or(
          like(generus.nama, `%${search}%`),
          like(generus.nomorUnik, `%${search}%`),
          like(mandiriDesa.kota, `%${search}%`),
          like(mandiriDesa.nama, `%${search}%`),
          like(desa.nama, `%${search}%`),
          like(kelompok.nama, `%${search}%`),
          like(generus.alamat, `%${search}%`)
        )
      );
    }
  }

  if (jenisKelamin && (jenisKelamin === "L" || jenisKelamin === "P")) {
    conditions.push(eq(generus.jenisKelamin, jenisKelamin as "L" | "P"));
  }

  if (status === "panitia") {
    conditions.push(
      or(
        not(or(isNull(usersOld.role), eq(usersOld.role, "generus"))!),
        isNotNull(formPanitiaDanPengurus.id)
      )
    );
  } else if (status === "peserta") {
    conditions.push(
      and(
        or(isNull(usersOld.role), eq(usersOld.role, "generus")),
        isNull(formPanitiaDanPengurus.id)
      )
    );
  } else if (status === "all" && isGenerus) {
    // If we are in the main Data Generus view (isGenerus=1), we can skip the role check join 
    // for the 'all' view to maximize performance. The isGenerus flag is our source of truth here.
  }

  return (conditions.length > 0 ? and(...conditions) : undefined) as any;
}


export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const downloadExcel = searchParams.get("download") === "true";
    const all = searchParams.get("all") === "true";
    const mandiriOnly = searchParams.get("mandiriOnly") === "true";
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const finalWhere = buildWhereClause(
      session, search, all,
      searchParams.get("statusNikah") || "all",
      searchParams.get("desaId") || "",
      searchParams.get("kelompokId") || "",
      searchParams.get("jenisKelamin") || "all",
      searchParams.get("status") || "all",
      searchParams.get("kategoriUsia") || "all",
      searchParams.get("notInMandiri") === "true",
      (!all && !mandiriOnly),
      searchParams.get("pendidikan") || "all",
      searchParams.get("mandiriDesaId") || ""
    );

    const canSeePrivateData = ["admin", "kmm_daerah", "admin_romantic_room", "pengurus_daerah", "tim_pnkb"].includes(session.role);

    // Common Select - Pastikan nama field sesuai
    // Common Select - Pastikan semua field yang dibutuhkan frontend ada di sini
    const commonSelect = {
      id: generus.id,
      nomorUnik: generus.nomorUnik,
      nama: generus.nama,
      foto: generus.foto, // <--- TAMBAHKAN INI LAGI
      jenisKelamin: generus.jenisKelamin,
      nomorUrut: mandiri.nomorUrut,
      desaNama: desa.nama,
      mandiriDesaNama: mandiriDesa.nama,
      mandiriDesaKota: mandiriDesa.kota, // Tambahkan ini juga jika dibutuhkan
      pendidikan: generus.pendidikan,
      pekerjaan: generus.pekerjaan, // Tambahkan ini juga
      statusNikah: generus.statusNikah,
      instagram: generus.instagram, // Tambahkan ini agar link IG tidak hilang
      noTelp: canSeePrivateData ? generus.noTelp : sql<string | null>`NULL`,
      panitiaStatus: formPanitiaDanPengurus.dapukan, // Tambahkan ini agar badge Panitia muncul
    };

    let dataQuery = db
      .select(commonSelect)
      .from(generus)
      .leftJoin(desa, eq(generus.desaId, desa.id))
      .leftJoin(mandiriDesa, eq(generus.mandiriDesaId, mandiriDesa.id))
      .leftJoin(formPanitiaDanPengurus, eq(generus.id, formPanitiaDanPengurus.generusId));

    if (mandiriOnly) {
      dataQuery = (dataQuery as any).innerJoin(mandiri, eq(generus.id, mandiri.generusId));
    } else {
      dataQuery = (dataQuery as any).leftJoin(mandiri, eq(generus.id, mandiri.generusId));
    }

    // --- LOGIKA EXPORT EXCEL ---
    if (downloadExcel) {
      // Jalankan query untuk mengambil SEMUA data sesuai filter (tanpa limit)
      const rawData = await dataQuery.where(finalWhere).orderBy(generus.nama);

      // 1. Definisikan Header (Tanpa Daerah)
      const header = ["NO", "NO. URUT", "NAMA LENGKAP", "L/P", "DESA/CABANG", "PENDIDIKAN", "STATUS"];

      // 2. Map Data (Pastikan menggunakan properti dari commonSelect)
      const rows = rawData.map((item, index) => [
        index + 1,
        item.nomorUrut || "-",
        item.nama?.toUpperCase(),
        item.jenisKelamin || "-",
        item.mandiriDesaNama || item.desaNama || "-",
        item.pendidikan || "-",
        item.statusNikah || "-"
      ]);

      const dataAOA = [header, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(dataAOA);

      // 3. Styling Header & Tabel (Menggunakan xlsx-js-style)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1"; // Baris 1 (Header)
        if (!worksheet[address]) continue;

        worksheet[address].s = {
          fill: { fgColor: { rgb: "2F5597" } }, // Background Biru
          font: { color: { rgb: "FFFFFF" }, bold: true }, // Teks Putih Tebal
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" }
          }
        };
      }

      // 4. Tambah Border ke semua sel data
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[address]) worksheet[address] = { v: "" };
          worksheet[address].s = {
            alignment: { vertical: "center" },
            border: {
              top: { style: "thin" }, bottom: { style: "thin" },
              left: { style: "thin" }, right: { style: "thin" }
            }
          };
        }
      }

      // 5. Atur Lebar Kolom
      worksheet['!cols'] = [
        { wch: 5 }, { wch: 10 }, { wch: 35 }, { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Generus");

      // 6. Generate Buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="Data_Katalog_${new Date().getTime()}.xlsx"`,
        },
      });
    }

    // --- LOGIKA NORMAL (JSON) ---
    const [data, countResult] = await Promise.all([
      dataQuery.where(finalWhere).orderBy(generus.nama).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(generus).where(finalWhere)
    ]);

    return NextResponse.json({ data, total: Number(countResult[0]?.count || 0), page, limit });

  } catch (error: any) {
    console.error("Generus GET error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      nama, tempatLahir, tanggalLahir, jenisKelamin, kategoriUsia, alamat, noTelp,
      pendidikan, pekerjaan, statusNikah, desaId, kelompokId,
      mandiriDesaId, mandiriKelompokId,
      hobi, makananMinumanFavorit, suku, foto
    } = body;

    if (!nama || !jenisKelamin || !kategoriUsia || (!desaId && !mandiriDesaId)) {
      return NextResponse.json({ error: "Nama dan Wilayah wajib diisi" }, { status: 400 });
    }

    // Duplicate Check
    const duplicateConditions = [];
    if (nama && tanggalLahir) {
      duplicateConditions.push(and(eq(generus.nama, nama), eq(generus.tanggalLahir, tanggalLahir)));
    }
    if (noTelp) {
      duplicateConditions.push(eq(generus.noTelp, noTelp));
    }

    const duplicate = duplicateConditions.length > 0
      ? await db.query.generus.findFirst({ where: or(...duplicateConditions) })
      : null;

    if (duplicate) {
      return NextResponse.json({
        error: `Data dengan Nama "${nama}" atau Nomor HP "${noTelp}" sudah terdaftar sebelumnya.`
      }, { status: 400 });
    }

    // Access control
    if ((session.role === "kelompok") && session.kelompokId && session.kelompokId !== Number(kelompokId)) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }
    if ((session.role === "desa") && session.desaId && !session.kelompokId && session.desaId !== Number(desaId)) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
    }

    let nomorUnik = generateNomorUnik();
    // Ensure unique
    let existing = await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) });
    while (existing) {
      nomorUnik = generateNomorUnik();
      existing = await db.query.generus.findFirst({ where: eq(generus.nomorUnik, nomorUnik) });
    }

    const id = uuidv4();
    await db.insert(generus).values({
      id,
      nomorUnik,
      nama,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      kategoriUsia,
      alamat,
      noTelp,
      pendidikan,
      pekerjaan,
      statusNikah: statusNikah || "Belum Menikah",
      desaId: desaId ? Number(desaId) : null,
      kelompokId: kelompokId ? Number(kelompokId) : null,
      mandiriDesaId: mandiriDesaId ? Number(mandiriDesaId) : null,
      mandiriKelompokId: mandiriKelompokId ? Number(mandiriKelompokId) : null,
      hobi,
      makananMinumanFavorit,
      suku,
      foto,
      createdBy: session.userId,
      isGenerus: 1,
    });

    // AUTO-CREATE USER ACCOUNT for Generus role (in usersOld)
    const { email: customEmail, password: customPassword } = body;
    let finalEmail = customEmail ? customEmail.toLowerCase() : `${nomorUnik.toLowerCase()}@jb2.id`;
    const finalPassword = customPassword || nomorUnik;

    // Check email uniqueness in usersOld
    const existingEmail = await db.query.usersOld.findFirst({ where: eq(usersOld.email, finalEmail) });
    if (existingEmail) {
      finalEmail = `${uuidv4().substring(0, 4)}_${finalEmail}`;
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    await db.insert(usersOld).values({
      id: uuidv4(),
      name: nama,
      email: finalEmail,
      passwordHash,
      role: "generus",
      generusId: id,
      desaId: desaId ? Number(desaId) : null,
      kelompokId: kelompokId ? Number(kelompokId) : null,
    });

    return NextResponse.json({ success: true, id, nomorUnik });
  } catch (error) {
    console.error("Generus POST error:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}
