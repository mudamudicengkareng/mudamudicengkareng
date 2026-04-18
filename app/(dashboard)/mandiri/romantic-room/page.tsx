"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { 
    Heart, MessageSquare, User, Phone, MapPin, ClipboardList, 
    CheckCircle, Star, Download, Sparkles, Send, Timer, 
    Globe, Plus, Trash2, LogOut, Users, DoorOpen
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function RomanticRoomPage() {
    const [loading, setLoading] = useState(true);
    const [myProfile, setMyProfile] = useState<any>(null);
    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [allQueue, setAllQueue] = useState<any[]>([]); // Status "Menunggu"
    const [allParticipants, setAllParticipants] = useState<any[]>([]);
    const [resultFilter, setResultFilter] = useState("Semua");
    const [myRoom, setMyRoom] = useState<any>(null);
    const [myQueueStatus, setMyQueueStatus] = useState<any>(null);
    const [visitHistory, setVisitHistory] = useState<any[]>([]);
    const [attendanceCount, setAttendanceCount] = useState<number>(0);
    
    const [showSurvey, setShowSurvey] = useState(false);
    const [form, setForm] = useState({
        namaPnkb: "",
        noHpPnkb: "",
        tanggapan: "Baik",
        rekomendasi: "Lanjut"
    });

    // Helper for independent auth
    const getAuthHeaders = () => {
        const headers: any = { "Content-Type": "application/json" };
        const u = localStorage.getItem("attended_nomor_unik");
        const t = localStorage.getItem("attended_session_token");
        if (u) headers["x-nomor-unik"] = u;
        if (t) headers["x-session-token"] = t;
        return headers;
    };

    const isAdmin = ["admin", "kmm_daerah", "admin_romantic_room", "pengurus_daerah", "tim_pnkb"].includes(myProfile?.role || "");

    const fetchData = async () => {
        setLoading(true);
        try {
            const h = getAuthHeaders();
            const profRes = await fetch("/api/profile", { headers: h });
            const profJson = await profRes.json();
            
            if (profRes.status === 401) {
                // If not authorized as independent OR session, redirect back
                Swal.fire("Akses Ditolak", "Silakan login atau masukkan Nomor Peserta di Katalog terlebih dahulu.", "error").then(() => {
                    window.location.href = "/mandiri/katalog";
                });
                return;
            }

            setMyProfile(profJson);

            const isUserAdmin = ["admin", "kmm_daerah", "admin_romantic_room", "pengurus_daerah", "tim_pnkb"].includes(profJson.role);

            // Fetch Rooms
            const roomsRes = await fetch("/api/mandiri/rooms", { headers: h });
            const roomsJson = await roomsRes.json();
            setAllRooms(Array.isArray(roomsJson) ? roomsJson : []);

            if (isUserAdmin) {
                // Fetch All Selections for Queue
                const qRes = await fetch("/api/mandiri/pilih?all=true");
                const qJson = await qRes.json();
                const waiting = Array.isArray(qJson) ? qJson.filter((q: any) => q.status === "Menunggu") : [];
                setAllQueue(waiting);

                // Fetch Visit History
                const histRes = await fetch("/api/mandiri/kunjungan", { headers: h });
                const histJson = await histRes.json();
                setVisitHistory(Array.isArray(histJson) ? histJson : []);

                // Fetch All Participants for Manual Dropdown
                const pRes = await fetch("/api/mandiri?limit=1000", { headers: h });
                const pJson = await pRes.json();
                setAllParticipants(Array.isArray(pJson.data) ? pJson.data : []);

                // Fetch Attendance Stats
                const statsRes = await fetch("/api/mandiri/stats/attendance");
                const statsJson = await statsRes.json();
                setAttendanceCount(statsJson.count || 0);
            } else {
                // Check if user is in a room or queue
                const myRooms = (Array.isArray(roomsJson) ? roomsJson : []).find((r: any) => 
                    r.pemilihanId && r.status === "Terisi" && 
                    (r.pengirimNama === profJson.nama || r.penerimaNama === profJson.nama)
                );
                
                if (myRooms) {
                    setMyRoom(myRooms);
                    setMyQueueStatus(null);
                } else {
                    const u = localStorage.getItem("attended_nomor_unik");
                    const t = localStorage.getItem("attended_session_token");
                    const selRes = await fetch(`/api/mandiri/pilih?nomorUnik=${u || ""}&token=${t || ""}`);
                    const selJson = await selRes.json();
                    if (Array.isArray(selJson)) {
                        const inQueue = selJson.find((s: any) => s.status === "Menunggu");
                        setMyQueueStatus(inQueue);
                        setMyRoom(null);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s for status updates
        return () => clearInterval(interval);
    }, []);

   
    const handleCreateRoom = async () => {
        const { value: roomName } = await Swal.fire({
            title: 'Buat Ruangan Baru',
            input: 'text',
            inputLabel: 'Nama Ruangan',
            inputPlaceholder: 'Contoh: Room 1',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Nama ruangan tidak boleh kosong!'
                }
            }
        });

        if (roomName) {
            try {
                const res = await fetch("/api/mandiri/rooms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nama: roomName })
                });
                if (res.ok) {
                    Swal.fire("Berhasil", `Ruangan ${roomName} berhasil dibuat`, "success");
                    fetchData();
                } else {
                    const err = await res.json();
                    throw new Error(err.error || "Gagal membuat ruangan");
                }
            } catch (err: any) {
                Swal.fire("Error", err.message, "error");
            }
        }
    };

    const handleBulkCreateRooms = async () => {
        const result = await Swal.fire({
            title: 'Buat 10 Ruangan?',
            text: "Sistem akan otomatis membuat 10 ruangan baru",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Buat!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            Swal.fire({
                title: 'Sedang memproses...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const prefix = "Room";
                const startCount = allRooms.length + 1;
                const promises = [];
                for (let i = 0; i < 10; i++) {
                    promises.push(
                        fetch("/api/mandiri/rooms", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ nama: `${prefix} ${startCount + i}` })
                        })
                    );
                }
                await Promise.all(promises);
                Swal.fire("Berhasil", "10 Ruangan 'Room' berhasil dibuat", "success");
                fetchData();
            } catch (err) {
                Swal.fire("Error", "Gagal membuat beberapa ruangan", "error");
            }
        }
    };

    const handleDeleteRoom = async (id: string) => {
        const result = await Swal.fire({
            title: 'Hapus Ruangan?',
            text: "Data ruangan akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            confirmButtonText: 'Ya, Hapus!'
        });

        if (result.isConfirmed) {
            try {
                await fetch(`/api/mandiri/rooms/${id}`, { method: "DELETE" });
                fetchData();
            } catch (err) {
                Swal.fire("Error", "Gagal menghapus ruangan", "error");
            }
        }
    };

    const handleAssignToRoom = async (pemilihanId: string, pengirim: string, penerima: string) => {
        const availableRooms = allRooms.filter(r => r.status === "Kosong");
        if (availableRooms.length === 0) {
            Swal.fire("Penuh", "Tidak ada ruangan kosong tersedia. Silakan buat ruangan baru.", "warning");
            return;
        }

        const { value: roomId } = await Swal.fire({
            title: 'Pilih Ruangan',
            input: 'select',
            inputOptions: Object.fromEntries(availableRooms.map(r => [r.id, r.nama])),
            inputPlaceholder: 'Pilih ruangan...',
            showCancelButton: true
        });

        if (roomId) {
            try {
                const res = await fetch(`/api/mandiri/rooms/${roomId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pemilihanId, action: "assign" })
                });
                if (res.ok) {
                    Swal.fire("Berhasil", `${pengirim} & ${penerima} telah masuk ke ruangan.`, "success");
                    fetchData();
                }
            } catch (err) {
                Swal.fire("Error", "Gagal memproses validasi", "error");
            }
        }
    };

    const handleDeleteAllRooms = async () => {
        const result = await Swal.fire({
            title: 'Hapus Semua Ruangan?',
            text: "Seluruh data ruangan akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f43f5e',
            confirmButtonText: 'Ya, Hapus Semua!'
        });

        if (result.isConfirmed) {
            try {
                await fetch("/api/mandiri/rooms", { method: "DELETE" });
                fetchData();
            } catch (err) {
                Swal.fire("Error", "Gagal menghapus semua ruangan", "error");
            }
        }
    };

    const handleClearRoom = async (id: string) => {
        const room = allRooms.find(r => r.id === id);
        if (!room) return;

        const { value: formValues } = await Swal.fire({
            title: 'Selesaikan Sesi?',
            html: `
                <div style="text-align: left; margin-bottom: 20px;">
                    <p style="font-size: 14px; margin-bottom: 15px; color: #64748b;">Tentukan hasil pertemuan untuk kedua belah pihak:</p>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #1e293b; margin-bottom: 8px; letter-spacing: 0.5px;">
                            Pemilih: <span style="color: #f43f5e; margin-left: 4px;">${room.pengirimNama}</span>
                        </label>
                        <div style="display: flex; gap: 8px;">
                            <input type="radio" id="p_lanjut" name="hasil_p" value="Lanjut" checked style="display:none">
                            <label for="p_lanjut" class="swal-custom-radio">Lanjut</label>
                            
                            <input type="radio" id="p_tidak" name="hasil_p" value="Tidak Lanjut" style="display:none">
                            <label for="p_tidak" class="swal-custom-radio">Tidak Lanjut</label>
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #1e293b; margin-bottom: 8px; letter-spacing: 0.5px;">
                            Terpilih: <span style="color: #f43f5e; margin-left: 4px;">${room.penerimaNama}</span>
                        </label>
                        <div style="display: flex; gap: 8px;">
                            <input type="radio" id="t_lanjut" name="hasil_t" value="Lanjut" checked style="display:none">
                            <label for="t_lanjut" class="swal-custom-radio">Lanjut</label>
                            
                            <input type="radio" id="t_tidak" name="hasil_t" value="Tidak Lanjut" style="display:none">
                            <label for="t_tidak" class="swal-custom-radio">Tidak Lanjut</label>
                        </div>
                    </div>

                    <style>
                        .swal-custom-radio { 
                            flex: 1; 
                            padding: 10px; 
                            border: 2px solid #f1f5f9; 
                            border-radius: 10px; 
                            text-align: center; 
                            cursor: pointer; 
                            font-weight: 800; 
                            font-size: 12px;
                            transition: all 0.2s;
                            color: #64748b;
                        }
                        .swal-custom-radio:hover {
                            background: #f8fafc;
                            border-color: #e2e8f0;
                        }
                        input[id$="_lanjut"]:checked + .swal-custom-radio { 
                            background: #f0fdf4; 
                            color: #16a34a; 
                            border-color: #16a34a; 
                        }
                        input[id$="_tidak"]:checked + .swal-custom-radio { 
                            background: #fef2f2; 
                            color: #dc2626; 
                            border-color: #dc2626; 
                        }
                        .swal2-html-container { margin: 1.5em 1.6em 0.5em !important; }
                    </style>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Simpan & Selesaikan',
            confirmButtonColor: '#1e293b',
            cancelButtonText: 'Batal',
            preConfirm: () => {
                const p = (document.querySelector('input[name="hasil_p"]:checked') as HTMLInputElement)?.value;
                const t = (document.querySelector('input[name="hasil_t"]:checked') as HTMLInputElement)?.value;
                return { hasilPengirim: p, hasilPenerima: t };
            }
        });

        if (formValues) {
            try {
                await fetch(`/api/mandiri/rooms/${id}`, { 
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        action: "clear",
                        hasilPengirim: formValues.hasilPengirim,
                        hasilPenerima: formValues.hasilPenerima
                    })
                });
                fetchData();
            } catch (err) {
                Swal.fire("Error", "Gagal mengosongkan ruangan", "error");
            }
        }
    };



    const handleSubmitSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const u = localStorage.getItem("attended_nomor_unik");
            const t = localStorage.getItem("attended_session_token");
            const res = await fetch("/api/mandiri/kuisioner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pemilihanId: myRoom?.pemilihanId,
                    nomorUnik: u,
                    token: t,
                    ...form
                })
            });
            if (!res.ok) throw new Error("Gagal menyimpan kuisioner");
            Swal.fire("Berhasil", "Kuisioner berhasil disimpan. Terima kasih.", "success");
            setShowSurvey(false);
            fetchData();
        } catch (err: any) {
            Swal.fire("Error", err.message, "error");
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(244, 63, 94);
        doc.text("Laporan Pertemuan PDKT", 105, 20, { align: "center" });
        
        const tableData = [
            ["1. Nama PNKB", form.namaPnkb || "-"],
            ["2. No. HP PNKB", form.noHpPnkb || "-"],
            ["3. Nama Lengkap", myProfile?.nama || "-"],
            ["4. No. Peserta", myProfile?.nomorUrut || "-"],
            ["5. Daerah/Kota", `${myProfile?.mandiriDesaNama || "-"} / ${myProfile?.kota || "-"}`],
            ["6. Lawan Bicara", myRoom?.pengirimNama === myProfile?.nama ? myRoom?.penerimaNama : myRoom?.pengirimNama],
            ["7. Tanggapan", form.tanggapan],
            ["8. Hasil", form.rekomendasi]
        ];

        autoTable(doc, {
            startY: 40,
            head: [['Kriteria', 'Keterangan']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [244, 63, 94] }
        });

        doc.save(`Kuisioner_PDKT_${myProfile?.nama}.pdf`);
    };

    const handleExportExcel = () => {
        const data = visitHistory.map(item => ({
            "Nomor Peserta Pemilih": item.pemilihNomorUrut,
            "Nama Pemilih": item.pemilihNama,
            "Status Pemilih": item.pemilihStatus,
            "Hasil Pemilih": item.pemilihHasil || "-",
            "Nomor Peserta Terpilih": item.terpilihNomorUrut,
            "Nama Terpilih": item.terpilihNama,
            "Status Terpilih": item.terpilihStatus,
            "Hasil Terpilih": item.terpilihHasil || "-",
            "Nomor Room": item.roomNama,
            "Waktu": item.createdAt ? new Date(item.createdAt).toLocaleString("id-ID") : "-"
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");
        XLSX.writeFile(wb, "Laporan_Hasil_Romantic_Room.xlsx");
    };

    const filteredHistory = visitHistory.filter(item => {
        if (resultFilter === "Semua") return true;
        const res1 = item.pemilihHasil;
        const res2 = item.terpilihHasil;
        
        if (resultFilter === "Lanjut - Lanjut") {
            return res1 === "Lanjut" && res2 === "Lanjut";
        }
        if (resultFilter === "Lanjut - Tidak Lanjut") {
            return (res1 === "Lanjut" && res2 === "Tidak Lanjut") || (res1 === "Tidak Lanjut" && res2 === "Lanjut");
        }
        if (resultFilter === "Tidak Lanjut - Tidak Lanjut") {
            return res1 === "Tidak Lanjut" && res2 === "Tidak Lanjut";
        }
        return true;
    });

    if (loading && !myProfile) return <div className="room-loading">Membuka Romantic Room...</div>;

    if (isAdmin) {
        return (
            <div className="romantic-container admin-layout">
                <header className="room-header">
                    <div className="header-main">
                        <div>
                            <h1>Management <span>Romantic Room</span></h1>
                            <p>Kelola antrean peserta dan alokasi ruangan pertemuan</p>
                        </div>
                    </div>
                </header>

                <div className="admin-grid">
                    {/* Queue Box */}
                    <div className="admin-card queue-box">
                        <div className="card-header">
                            <div className="header-title">
                                <Timer size={20} />
                                <h3>Kotak Antrean</h3>
                            </div>
                            <span className="count-badge">{allQueue.length} Antrean</span>
                        </div>
                        <div className="card-body scrollable">
                            {allQueue.length === 0 ? (
                                <div className="empty-state">Antrean kosong</div>
                            ) : (
                                allQueue.map((item: any) => (
                                    <div key={item.id} className="queue-item">
                                        <div className="pair-names">
                                            <span className="p-name">{item.pengirimNama}</span>
                                            <Heart size={12} fill="#f43f5e" color="#f43f5e" />
                                            <span className="p-name">{item.penerimaNama}</span>
                                        </div>
                                        <button className="btn-validate" onClick={() => handleAssignToRoom(item.id, item.pengirimNama, item.penerimaNama)}>
                                            Validasi & Masuk Room
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Rooms Box */}
                    <div className="admin-card rooms-box">
                        <div className="card-header">
                            <div className="header-title">
                                <DoorOpen size={20} />
                                <h3>Daftar Ruangan</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn-delete-all" onClick={handleDeleteAllRooms}>
                                    <Trash2 size={12} /> Clear All
                                </button>
                                <button className="btn-add-room-bulk" onClick={handleBulkCreateRooms}>
                                    <Plus size={14} /> +10 Rooms
                                </button>
                                <button className="btn-add-room" onClick={handleCreateRoom}>
                                    <Plus size={14} /> Create Ruangan
                                </button>
                            </div>
                        </div>
                        <div className="card-body grid-rooms">
                            {[...allRooms].sort((a, b) => a.nama.localeCompare(b.nama, undefined, { numeric: true, sensitivity: 'base' })).map((room) => (
                                <div key={room.id} className={`room-tile ${room.status?.toLowerCase()}`}>
                                    <div className="room-top">
                                        <span className="room-name">{room.nama}</span>
                                        <button className="btn-delete-room" onClick={() => handleDeleteRoom(room.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="room-middle">
                                        {room.status === "Terisi" ? (
                                            <div className="occupied-info">
                                                <div className="occupied-pair">
                                                    <span>{room.pengirimNama}</span>
                                                    <span>&</span>
                                                    <span>{room.penerimaNama}</span>
                                                </div>
                                                <button className="btn-clear" onClick={() => handleClearRoom(room.id)}>
                                                    <LogOut size={12} /> Selesaikan
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="empty-label">Kosong</span>
                                        )}
                                    </div>
                                    <div className="room-footer">
                                        <span className={`status-dot ${room.status?.toLowerCase()}`}></span>
                                        {room.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visit History Box */}
                    <div className="admin-card history-box">
                        <div className="card-header">
                            <div className="header-title">
                                <h3>Laporan Hasil Romantic Room Peserta & Panitia</h3>
                            </div>
                            <div className="manual-record-box">
                                <button className="btn-export-excel" onClick={handleExportExcel} style={{ marginRight: '10px', background: '#16a34a' }}>
                                    <Download size={16} /> Export Excel
                                </button>
                                <select 
                                    className="dropdown-peserta"
                                    value={resultFilter}
                                    onChange={(e) => setResultFilter(e.target.value)}
                                >
                                    <option value="Semua">Tampilkan Semua Hasil</option>
                                    <option value="Lanjut - Lanjut">Lanjut - Lanjut</option>
                                    <option value="Lanjut - Tidak Lanjut">Lanjut - Tidak Lanjut</option>
                                    <option value="Tidak Lanjut - Tidak Lanjut">Tidak Lanjut - Tidak Lanjut</option>
                                </select>
                                <span className="count-badge">{filteredHistory.length} Record</span>
                            </div>
                        </div>
                        <div className="card-body scrollable">
                            {filteredHistory.length === 0 ? (
                                <div className="empty-state">Tidak ada data yang sesuai dengan filter</div>
                            ) : (
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Nomor Peserta Pemilih</th>
                                            <th>Nama Pemilih</th>
                                            <th>Status Pemilih</th>
                                            <th>Hasil Pemilih</th>
                                            <th>Nomor Peserta Terpilih</th>
                                            <th>Nama Terpilih</th>
                                            <th>Status Terpilih</th>
                                            <th>Hasil Terpilih</th>
                                            <th className="text-center">Nomor Room</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((item: any, idx) => (
                                            <tr key={idx}>
                                                <td>{item.pemilihNomorUrut}</td>
                                                <td className="font-bold">{item.pemilihNama}</td>
                                                <td>{item.pemilihStatus}</td>
                                                <td>
                                                    {item.pemilihHasil && (
                                                        <span className={`result-badge ${item.pemilihHasil === 'Lanjut' ? 'badge-success' : 'badge-danger'}`}>
                                                            {item.pemilihHasil}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{item.terpilihNomorUrut}</td>
                                                <td className="font-bold">{item.terpilihNama}</td>
                                                <td>{item.terpilihStatus}</td>
                                                <td>
                                                    {item.terpilihHasil && (
                                                        <span className={`result-badge ${item.terpilihHasil === 'Lanjut' ? 'badge-success' : 'badge-danger'}`}>
                                                            {item.terpilihHasil}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <span className="visit-count">{item.roomNama}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .admin-layout { max-width: 1200px; padding: 10px; margin: 0 auto; }
                    .admin-grid { display: grid; grid-template-columns: 240px 1fr; gap: 15px; }
                    .admin-card { background: white; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                    .header-main { display: flex; justify-content: space-between; align-items: center; width: 100%; }
                    .attendance-status { display: flex; gap: 15px; }
                    .stat-item { background: white; padding: 8px 15px; border-radius: 12px; border: 1px solid #fecdd3; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 4px rgba(244, 63, 94, 0.1); }
                    .stat-info { display: flex; flex-direction: column; }
                    .stat-value { font-size: 18px; font-weight: 900; color: #f43f5e; line-height: 1; }
                    .stat-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    .card-header { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
                    .header-title { display: flex; align-items: center; gap: 6px; color: #1e293b; }
                    .header-title h3 { font-size: 13px; font-weight: 800; margin: 0; }
                    .count-badge { background: #fef2f2; color: #f43f5e; padding: 1px 6px; border-radius: 20px; font-size: 9px; font-weight: 700; }
                    
                    .card-body { padding: 8px; flex: 1; }
                    .scrollable { max-height: 450px; overflow-y: auto; }
                    .empty-state { text-align: center; color: #94a3b8; padding: 15px; font-style: italic; font-size: 11px; }

                    .queue-item { background: white; border: 1px solid #f1f5f9; padding: 8px; border-radius: 8px; margin-bottom: 6px; transition: transform 0.2s; }
                    .queue-item:hover { transform: translateX(3px); border-color: #fecdd3; }
                    .pair-names { display: flex; align-items: center; gap: 4px; margin-bottom: 6px; font-weight: 700; font-size: 12px; flex-wrap: wrap; }
                    .p-name { color: #1e293b; }
                    .btn-validate { width: 100%; background: #f43f5e; color: white; border: none; padding: 4px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer; }
                    
                    .btn-add-room { background: #1e293b; color: white; border: none; padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; cursor: pointer; }
                    .btn-add-room-bulk { background: #0891b2; color: white; border: none; padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                    .btn-add-room-bulk:hover { background: #0e7490; }
                    .btn-delete-all { background: #f43f5e; color: white; border: none; padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                    .btn-delete-all:hover { background: #e11d48; }
                    .grid-rooms { 
                        display: grid; 
                        grid-template-columns: repeat(10, 1fr); 
                        gap: 10px; 
                        padding-bottom: 10px;
                    }
                    @media (max-width: 1400px) {
                        .grid-rooms { grid-template-columns: repeat(8, 1fr); }
                    }
                    @media (max-width: 1100px) {
                        .grid-rooms { grid-template-columns: repeat(5, 1fr); }
                    }
                    @media (max-width: 768px) {
                        .grid-rooms { grid-template-columns: repeat(3, 1fr); }
                    }

                    
                    .room-tile { min-width: 0; border-radius: 8px; border: 1px solid #e2e8f0; padding: 8px; display: flex; flex-direction: column; gap: 6px; transition: all 0.3s; }
                    .room-tile.terisi { background: #f0fdf4; border-color: #bbf7d0; }
                    .room-tile.kosong { background: #fef2f2; border-color: #fecdd3; }
                    
                    .room-top { display: flex; justify-content: space-between; align-items: center; }
                    .room-name { font-weight: 800; font-size: 11px; color: #1e293b; }
                    .btn-delete-room { color: #94a3b8; background: none; border: none; cursor: pointer; padding: 0; }
                    .btn-delete-room:hover { color: #ef4444; }
                    
                    .room-middle { min-height: 35px; display: flex; align-items: center; justify-content: center; text-align: center; }
                    .empty-label { color: #f43f5e; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .occupied-pair { display: flex; flex-direction: column; font-size: 10px; font-weight: 700; color: #166534; margin-bottom: 2px; }
                    .btn-clear { background: #166534; color: white; border: none; border-radius: 3px; padding: 1px 4px; font-size: 8px; cursor: pointer; display: flex; align-items: center; gap: 2px; }
                    
                    .room-footer { border-top: 1px solid rgba(0,0,0,0.05); padding-top: 3px; display: flex; align-items: center; gap: 3px; font-size: 8px; font-weight: 800; text-transform: uppercase; color: #64748b; }
                    .status-dot { width: 5px; height: 5px; border-radius: 50%; }
                    .status-dot.kosong { background: #f43f5e; box-shadow: 0 0 5px #f43f5e; }
                    .status-dot.terisi { background: #22c55e; box-shadow: 0 0 5px #22c55e; }

                    .history-table { width: 100%; border-collapse: collapse; }
                    .history-table th { text-align: center; font-size: 11px; color: #64748b; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
                    .history-table td { padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 12px; text-align: center; }
                    .history-table tr:last-child td { border: none; }
                    .visit-count { background: #f0f9ff; color: #0369a1; padding: 1px 6px; border-radius: 10px; font-weight: 800; font-size: 10px; }
                    .font-bold { font-weight: 700; color: #1e293b; }
                    .text-sm { font-size: 11px; }
                    .text-slate-500 { color: #64748b; }
                    .text-center { text-align: center; }
                    .history-box { grid-column: span 2; margin-top: 10px; }
                    
                    .manual-record-box { display: flex; align-items: center; gap: 8px; }
                    .dropdown-peserta { padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; outline: none; min-width: 200px; background: white; }
                    .dropdown-peserta:focus { border-color: #f43f5e; box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.1); }
                    .btn-record-manual { background: #1e293b; color: white; border: none; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                    .btn-record-manual:hover { background: #334155; }
                    .btn-export-excel { background: #16a34a; color: white; border: none; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                    .btn-export-excel:hover { background: #15803d; }

                    .result-badge { 
                        padding: 4px 10px; 
                        border-radius: 4px; 
                        font-size: 10px; 
                        font-weight: 800; 
                        text-transform: uppercase;
                        color: white !important;
                    }
                    .result-badge.badge-success { background: #16a34a; }
                    .result-badge.badge-danger { background: #dc2626; }
                `}</style>
            </div>
        );
    }

    // User View
    if (myRoom) {
        const partnerName = myRoom.pengirimNama === myProfile?.nama ? myRoom.penerimaNama : myRoom.pengirimNama;
        return (
            <div className="romantic-container">
                <header className="room-header">
                    <h1>Romantic <span>Room</span> <Sparkles size={24} color="#f43f5e" /></h1>
                    <p>Selamat! Anda telah masuk ke ruangan <b>{myRoom.nama}</b></p>
                </header>

                <div className="room-card">
                    <div className="partner-section">
                        <div className="partner-avatar">
                            <div className="avatar-placeholder">{partnerName?.charAt(0) || "P"}</div>
                        </div>
                        <div className="partner-info">
                            <h2>{partnerName}</h2>
                            <p className="partner-tagline">Teman Obrolan Anda</p>
                        </div>
                    </div>

                    <div className="room-content">
                        {!showSurvey ? (
                            <div className="welcome-chat">
                                <div className="chat-bubble">
                                    <p>Silakan nikmati waktu Anda di <b>{myRoom.nama}</b> bersama <b>{partnerName}</b>. Setelah sesi obrolan selesai, mohon lengkapi kuisioner di bawah ini.</p>
                                </div>
                                <button className="btn-start-survey" onClick={() => setShowSurvey(true)}>
                                    <ClipboardList size={20} />
                                    Isi Kuisioner Pertemuan
                                </button>
                            </div>
                        ) : (
                            <form className="survey-form" onSubmit={handleSubmitSurvey}>
                                <h3 className="form-title">Kuisioner Pertemuan</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nama PNKB</label>
                                        <input value={form.namaPnkb} onChange={e => setForm({...form, namaPnkb: e.target.value})} placeholder="Nama pendamping..." />
                                    </div>
                                    <div className="form-group">
                                        <label>No. HP PNKB</label>
                                        <input value={form.noHpPnkb} onChange={e => setForm({...form, noHpPnkb: e.target.value})} placeholder="08xxxx" />
                                    </div>
                                    <div className="form-group span-2">
                                        <label>Lawan Bicara</label>
                                        <div className="readonly-info">{partnerName}</div>
                                    </div>
                                    <div className="form-group span-2">
                                        <label>Tanggapan Anda</label>
                                        <div className="tanggapan-options">
                                            {["Baik", "Humble", "Pendiam", "Penyabar", "Friendly"].map(opt => (
                                                <button 
                                                    key={opt}
                                                    type="button" 
                                                    className={form.tanggapan === opt ? "active" : ""} 
                                                    onClick={() => setForm({...form, tanggapan: opt})}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group span-2">
                                        <label>Hasil Pertemuan</label>
                                        <div className="radio-group-pdkt">
                                            {["Lanjut", "Ragu-Ragu", "Tidak Lanjut"].map(opt => (
                                                <button key={opt} type="button" className={form.rekomendasi === opt ? "active" : ""} onClick={() => setForm({...form, rekomendasi: opt})}>{opt}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel-room" onClick={() => setShowSurvey(false)}>Batal</button>
                                    <button type="button" className="btn-pdf-room" onClick={handleExportPDF}><Download size={18} /> PDF</button>
                                    <button type="submit" className="btn-submit-room"><Send size={18} /> Kirim & Selesai</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    .romantic-container { padding: 40px 20px; max-width: 800px; margin: 0 auto; min-height: 100vh; }
                    .room-header { margin-bottom: 40px; text-align: center; }
                    .room-header h1 { font-size: 36px; font-weight: 900; color: #1e293b; display: flex; align-items: center; justify-content: center; gap: 12px; }
                    .room-header h1 span { color: #f43f5e; }
                    .room-header p { color: #64748b; margin-top: 10px; font-size: 15px; }
                    .room-card { background: white; border-radius: 30px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(244, 63, 94, 0.15); border: 1px solid #fecdd3; }
                    .partner-section { background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%); padding: 40px; display: flex; align-items: center; gap: 30px; color: white; }
                    .partner-avatar { width: 80px; height: 80px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; color: #fb7185; border: 4px solid rgba(255,255,255,0.3); }
                    .partner-info h2 { font-size: 24px; font-weight: 800; margin: 0; }
                    .partner-tagline { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
                    .room-content { padding: 40px; }
                    .welcome-chat { text-align: center; }
                    .chat-bubble { background: #fef2f2; padding: 24px; border-radius: 20px; color: #9f1239; font-size: 15px; margin-bottom: 30px; border: 1px dashed #fda4af; }
                    .btn-start-survey { background: #f43f5e; color: white; border: none; padding: 16px 32px; border-radius: 16px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; }
                    .survey-form { animation: slideUp 0.4s ease-out; }
                    .form-title { font-size: 18px; font-weight: 800; border-left: 4px solid #f43f5e; padding-left: 12px; margin-bottom: 20px; }
                    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                    .span-2 { grid-column: span 2; }
                    .form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #64748b; }
                    .form-group input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; }
                    .readonly-info { background: #f8fafc; padding: 12px; border-radius: 10px; color: #1e293b; font-weight: 700; }
                    .tanggapan-options { display: flex; flex-wrap: wrap; gap: 8px; }
                    .tanggapan-options button { padding: 8px 16px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-size: 13px; }
                    .tanggapan-options button.active { background: #f43f5e; color: white; border-color: #f43f5e; }
                    .radio-group-pdkt { display: flex; gap: 10px; }
                    .radio-group-pdkt button { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; font-weight: 700; cursor: pointer; font-size: 14px; }
                    .radio-group-pdkt button.active { border-color: #f43f5e; background: #fff1f2; color: #f43f5e; }
                    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px; }
                    .btn-submit-room { background: #f43f5e; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
                    .btn-pdf-room { background: white; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; cursor: pointer; }
                    .btn-cancel-room { border: none; background: none; color: #94a3b8; font-weight: 700; cursor: pointer; }
                    .room-loading { padding: 100px; text-align: center; color: #f43f5e; font-weight: 800; font-size: 20px; }
                    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>
            </div>
        );
    }

    if (myQueueStatus) {
        return (
            <div className="romantic-container empty-state-view">
                <Timer size={64} style={{ color: '#fda4af', marginBottom: 20 }} />
                <h2>Sedang Dalam Antrean</h2>
                <p>Anda sudah memilih <b>{myQueueStatus.penerimaNama || "Peserta"}</b>. Mohon tunggu admin melakukan validasi untuk masuk keruangan pertemuan.</p>
                <div className="queue-badge">Status: Menunggu Antrean</div>
                
                <style jsx>{`
                    .romantic-container { padding: 40px 20px; max-width: 800px; margin: 0 auto; min-height: 100vh; }
                    .empty-state-view { text-align: center; padding: 100px 40px; background: white; border-radius: 20px; border: 2px dashed #fecdd3; display: flex; flex-direction: column; align-items: center; margin-top: 40px; }
                    .queue-badge { margin-top: 20px; background: #fff1f2; color: #f43f5e; padding: 8px 20px; border-radius: 20px; font-weight: 800; text-transform: uppercase; font-size: 12px; }
                    h2 { color: #1e293b; font-weight: 800; }
                    p { color: #64748b; max-width: 400px; line-height: 1.6; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="romantic-container empty-state-view">
            <Heart size={64} style={{ color: '#fda4af', marginBottom: 20 }} />
            <h2>Belum Ada Pertemuan Aktif</h2>
            <p>Silakan lakukan pemilihan peserta di Katalog PDKT terlebih dahulu.</p>
            <style jsx>{`
                .romantic-container { padding: 40px 20px; max-width: 800px; margin: 0 auto; min-height: 100vh; }
                .empty-state-view { text-align: center; padding: 100px 40px; background: white; border-radius: 20px; border: 2px dashed #fecdd3; display: flex; flex-direction: column; align-items: center; margin-top: 40px; }
                h2 { color: #1e293b; font-weight: 800; }
                p { color: #64748b; max-width: 400px; line-height: 1.6; }
            `}</style>
        </div>
    );
}
