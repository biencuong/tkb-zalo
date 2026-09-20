/**
 * Nghiệp vụ Thời khoá biểu: nhập từ Excel SmartScheduler, khớp giáo viên, GVCN,
 * cảnh báo trùng số + lưu vết phiên bản, cắt file Word, tính vân tay nội dung.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { mot, nhieu, chay, giaoDich, ghiNhatKy } from "./db.js";
import { docTkbSs } from "./nhap-xlsx.js";
import { catDocx, lietKeBang } from "./cat-docx.js";
import { timTheoMa, timTheoTen } from "./kho-gv.js";
import { chuanHoaKhoangTrang, chuanHoaLop, chuanHoaMa } from "./khop.js";

export const khoiCuaLop = (lop) => (String(lop).match(/^(\d+)/)?.[1] || "");

/**
 * VÂN TAY NỘI DUNG — dùng để phát hiện "gửi lại y nguyên" và lọc "chỉ gửi người có thay đổi".
 * CỐ Ý không gồm số TKB / ngày áp dụng: nếu lịch dạy của người đó không đổi thì coi là không cần gửi lại.
 */
export function vanTay(loai, ma, dsTiet) {
  const khoa = dsTiet
    .map((t) => `${t.thu}.${t.buoi}.${t.tiet}.${chuanHoaKhoangTrang(t.mon)}.${chuanHoaLop(t.lop)}.${chuanHoaMa(t.ma_gv || "")}`)
    .sort()
    .join(";");
  return crypto.createHash("sha256").update(`${loai}|${chuanHoaKhoangTrang(ma)}|${khoa}`).digest("hex").slice(0, 32);
}

/** Đọc file Excel và dựng bản xem trước (chưa ghi CSDL) — để hỏi người dùng trước khi nhập. */
export async function xemTruocTkb(duongDanXlsx) {
  const d = await docTkbSs(duongDanXlsx);
  const canhBao = [...d.canh_bao];

  // Khớp giáo viên
  const khopTen = new Map(), khopMa = new Map(), chuaKhop = [];
  for (const r of d.pcgd) {
    const gv = timTheoTen(r.ho_ten) || (r.ma_gv ? timTheoMa(r.ma_gv) : null);
    if (gv) khopTen.set(r.ho_ten, gv);
    else chuaKhop.push({ loai: "pcgd", gia_tri: r.ho_ten, phan_cong: r.phan_cong });
  }
  for (const ma of d.gv_ma) {
    const gv = timTheoMa(ma);
    if (gv) khopMa.set(ma, gv);
    else chuaKhop.push({ loai: "ma", gia_tri: ma });
  }

  // GVCN: PCGD cột CN là nguồn chính, tiêu đề lớp "(mã)" là nguồn phụ
  const cnTheoLop = new Map();
  for (const r of d.pcgd) {
    if (!r.cn) continue;
    const gv = khopTen.get(r.ho_ten);
    cnTheoLop.set(chuanHoaLop(r.cn), { ho_ten: r.ho_ten, ma: gv?.ma_gv || "", giao_vien_id: gv?.id || null, nguon: "pcgd" });
  }
  const lop = d.lop.map((l) => {
    const k = chuanHoaLop(l.ten);
    let cn = cnTheoLop.get(k);
    if (!cn && l.gvcn_ma) {
      const gv = timTheoMa(l.gvcn_ma);
      cn = { ho_ten: gv?.ho_ten || "", ma: l.gvcn_ma, giao_vien_id: gv?.id || null, nguon: "tieu_de_tkb" };
    }
    return { ten: l.ten, khoi: khoiCuaLop(l.ten), gvcn: cn || null };
  });
  const lopThieuCn = lop.filter((l) => !l.gvcn || !l.gvcn.giao_vien_id).map((l) => l.ten);
  if (lopThieuCn.length) {
    canhBao.push(
      `${lopThieuCn.length}/${lop.length} lớp chưa xác định được giáo viên chủ nhiệm (${lopThieuCn.join(", ")}) → ` +
      "sẽ KHÔNG gửi được thời khoá biểu lớp cho giáo viên chủ nhiệm các lớp này. " +
      "Hãy nhập Danh sách giáo viên chủ nhiệm trong SmartScheduler rồi xuất lại, hoặc chọn tay trong màn Thời khoá biểu."
    );
  }

  // Trùng số TKB?
  const cu = mot(
    "SELECT * FROM tkb WHERE nam_hoc=? AND ifnull(hoc_ky,-1)=ifnull(?,-1) AND so_tkb=?",
    d.thong_tin.nam_hoc, d.thong_tin.hoc_ky, d.thong_tin.so_tkb
  );
  let trung = null;
  if (cu) {
    const soGvCu = mot("SELECT COUNT(*) n FROM tkb_gv WHERE tkb_id=?", cu.id).n;
    const soTietCu = mot("SELECT COUNT(*) n FROM tiet WHERE tkb_id=?", cu.id).n;
    trung = {
      tkb_id: cu.id, phien_ban: cu.phien_ban, nhap_luc: cu.nhap_luc,
      cu: { ngay_ap_dung: cu.ngay_ap_dung, so_gv: soGvCu, so_tiet: soTietCu },
      moi: { ngay_ap_dung: d.thong_tin.ngay_ap_dung, so_gv: d.pcgd.length, so_tiet: d.tiet.length },
      da_gui: mot("SELECT COUNT(*) n FROM lich_su_gui WHERE tkb_id=? AND ket_qua='xong'", cu.id).n,
    };
  }

  return {
    thong_tin: d.thong_tin,
    so_lop: lop.length, so_gv_pcgd: d.pcgd.length, so_tiet: d.tiet.length,
    lop, lop_thieu_cn: lopThieuCn,
    chua_khop: chuaKhop,
    da_khop: { ten: khopTen.size, ma: khopMa.size },
    trung, canh_bao: canhBao,
    nguon_xlsx: duongDanXlsx,
  };
}

/**
 * Nhập TKB vào CSDL.
 * @param {object} p
 *   duongDanXlsx, docxGv?, docxLop?, thuMucKho (thư mục dữ liệu app),
 *   chePhu: 'tao_moi' | 'cap_nhat'  (khi trùng số),
 *   ghepTay: {ma|ho_ten → giao_vien_id}, cnTay: {lop → giao_vien_id}, ghiDeThongTin?: {so_tkb, ngay_ap_dung,...}
 */
export async function nhapTkb(p) {
  const d = await docTkbSs(p.duongDanXlsx);
  const tt = { ...d.thong_tin, ...(p.ghiDeThongTin || {}) };
  if (tt.so_tkb == null) throw new Error("Chưa có số thời khoá biểu — hãy nhập số trước khi lưu.");

  const ghep = p.ghepTay || {};
  const cnTay = p.cnTay || {};

  const gvTheoMa = new Map();
  for (const ma of d.gv_ma) {
    const gv = (ghep[`ma:${ma}`] ? { id: ghep[`ma:${ma}`] } : null) || timTheoMa(ma);
    if (gv) gvTheoMa.set(chuanHoaMa(ma), gv.id);
  }
  const gvTheoTen = new Map();
  for (const r of d.pcgd) {
    const id = ghep[`ten:${r.ho_ten}`] || timTheoTen(r.ho_ten)?.id || null;
    if (id) gvTheoTen.set(r.ho_ten, id);
  }

  const cu = mot(
    "SELECT * FROM tkb WHERE nam_hoc=? AND ifnull(hoc_ky,-1)=ifnull(?,-1) AND so_tkb=?",
    tt.nam_hoc, tt.hoc_ky, tt.so_tkb
  );
  if (cu && p.chePhu !== "cap_nhat") {
    return { ok: false, trung: true, loi: [`Đã có thời khoá biểu số ${tt.so_tkb} (${tt.nam_hoc}, học kỳ ${tt.hoc_ky ?? "?"}).`] };
  }

  const ketQua = giaoDich(() => {
    let tkbId, phienBan = 1;
    if (cu) {
      // Lưu vết bản cũ trước khi đè
      phienBan = cu.phien_ban + 1;
      const snapshot = {
        tkb: cu,
        tkb_gv: nhieu("SELECT * FROM tkb_gv WHERE tkb_id=?", cu.id),
        tkb_lop: nhieu("SELECT * FROM tkb_lop WHERE tkb_id=?", cu.id),
        tiet: nhieu("SELECT thu,buoi,tiet,lop,mon,ma_gv FROM tiet WHERE tkb_id=?", cu.id),
      };
      const tomTat =
        `Bản ${cu.phien_ban}: ${snapshot.tiet.length} tiết, ${snapshot.tkb_gv.length} giáo viên, ` +
        `áp dụng ${cu.ngay_ap_dung || "?"} → bản ${phienBan}: ${d.tiet.length} tiết, ${d.pcgd.length} giáo viên, ` +
        `áp dụng ${tt.ngay_ap_dung || "?"}`;
      chay(
        "INSERT INTO tkb_phien_ban(tkb_id,phien_ban,nhap_luc,tom_tat,snapshot_json) VALUES(?,?,?,?,?)",
        cu.id, cu.phien_ban, cu.nhap_luc, tomTat, JSON.stringify(snapshot)
      );
      tkbId = cu.id;
      chay("DELETE FROM tiet WHERE tkb_id=?", tkbId);
      chay("DELETE FROM tkb_gv WHERE tkb_id=?", tkbId);
      chay("DELETE FROM tkb_lop WHERE tkb_id=?", tkbId);
      chay(
        `UPDATE tkb SET ten_truong=?, ngay_ap_dung=?, nguon_xlsx=?, phien_ban=?,
         sua_luc=datetime('now','localtime') WHERE id=?`,
        tt.ten_truong, tt.ngay_ap_dung || "", p.duongDanXlsx, phienBan, tkbId
      );
      ghiNhatKy("cap_nhat_tkb", {
        doi_tuong: `TKB số ${tt.so_tkb} ${tt.nam_hoc}`,
        mo_ta: tomTat, muc: "canh_bao",
      });
    } else {
      const r = chay(
        `INSERT INTO tkb(so_tkb,hoc_ky,nam_hoc,ten_truong,ngay_ap_dung,nguon_xlsx,phien_ban)
         VALUES(?,?,?,?,?,?,1)`,
        tt.so_tkb, tt.hoc_ky, tt.nam_hoc, tt.ten_truong, tt.ngay_ap_dung || "", p.duongDanXlsx
      );
      tkbId = Number(r.lastInsertRowid);
      ghiNhatKy("nhap_tkb", { doi_tuong: `TKB số ${tt.so_tkb} ${tt.nam_hoc}`, mo_ta: `${d.tiet.length} tiết` });
    }

    // Tiết
    const stTiet = `INSERT INTO tiet(tkb_id,thu,buoi,tiet,lop,khoi,mon,ma_gv,giao_vien_id) VALUES(?,?,?,?,?,?,?,?,?)`;
    for (const t of d.tiet) {
      chay(stTiet, tkbId, t.thu, t.buoi, t.tiet, t.lop, khoiCuaLop(t.lop), t.mon, t.ma_gv,
        gvTheoMa.get(chuanHoaMa(t.ma_gv)) || null);
    }

    // GVCN theo lớp
    const cnTheoLop = new Map();
    for (const r of d.pcgd) {
      if (!r.cn) continue;
      const id = gvTheoTen.get(r.ho_ten) || null;
      cnTheoLop.set(chuanHoaLop(r.cn), { ma: "", id, nguon: "pcgd" });
    }
    for (const l of d.lop) {
      const k = chuanHoaLop(l.ten);
      if (!cnTheoLop.has(k) && l.gvcn_ma) {
        cnTheoLop.set(k, { ma: l.gvcn_ma, id: gvTheoMa.get(chuanHoaMa(l.gvcn_ma)) || null, nguon: "tieu_de_tkb" });
      }
      if (cnTay[l.ten]) cnTheoLop.set(k, { ma: "", id: cnTay[l.ten], nguon: "nhap_tay" });
    }

    // Bảng lớp
    for (const l of d.lop) {
      const k = chuanHoaLop(l.ten);
      const cn = cnTheoLop.get(k) || { ma: "", id: null, nguon: "" };
      const tietLop = d.tiet.filter((t) => chuanHoaLop(t.lop) === k);
      chay(
        `INSERT INTO tkb_lop(tkb_id,lop,khoi,gvcn_ma,giao_vien_id,cn_nguon,so_tiet,van_tay)
         VALUES(?,?,?,?,?,?,?,?)`,
        tkbId, l.ten, khoiCuaLop(l.ten), cn.ma || l.gvcn_ma || "", cn.id, cn.nguon,
        tietLop.length, vanTay("lop", l.ten, tietLop)
      );
    }

    // Bảng giáo viên
    for (const r of d.pcgd) {
      const id = gvTheoTen.get(r.ho_ten) || null;
      const gv = id ? mot("SELECT ma_gv FROM giao_vien WHERE id=?", id) : null;
      const ma = gv?.ma_gv || "";
      const tietGv = ma ? d.tiet.filter((t) => chuanHoaMa(t.ma_gv) === chuanHoaMa(ma)) : [];
      chay(
        `INSERT INTO tkb_gv(tkb_id,giao_vien_id,ho_ten_pcgd,ma_trong_tkb,kiem_nhiem,lop_cn,cn_nguon,
         phan_cong,so_tiet_khai,so_tiet_dem,van_tay) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        tkbId, id, r.ho_ten, ma, r.kiem_nhiem,
        r.cn ? String(r.cn).toUpperCase() : (cnTay.__gv?.[r.ho_ten] || ""),
        r.cn ? "pcgd" : "", r.phan_cong, r.so_tiet, tietGv.length, vanTay("gv", ma || r.ho_ten, tietGv)
      );
    }

    // Ngày kết thúc của TKB liền trước = ngày áp dụng của TKB này - 1
    capNhatNgayKetThuc(tt.nam_hoc);
    return { tkbId, phienBan };
  });

  // Cắt file Word (ngoài giao dịch vì có I/O)
  const thuMuc = path.join(p.thuMucKho, "tkb", (tt.nam_hoc || "khac").replace(/\W+/g, "-"), `so-${tt.so_tkb}`);
  let ketQuaCat = null;
  if (p.docxGv || p.docxLop) {
    ketQuaCat = await catVaLuu({ tkbId: ketQua.tkbId, thuMuc, docxGv: p.docxGv, docxLop: p.docxLop });
  }
  chay("UPDATE tkb SET thu_muc=?, nguon_docx_gv=?, nguon_docx_lop=?, kho_giay=? WHERE id=?",
    thuMuc, p.docxGv || "", p.docxLop || "", ketQuaCat?.kho || "", ketQua.tkbId);

  return {
    ok: true, tkb_id: ketQua.tkbId, phien_ban: ketQua.phienBan,
    so_tiet: d.tiet.length, so_lop: d.lop.length, so_gv: d.pcgd.length,
    cat_docx: ketQuaCat, canh_bao: d.canh_bao,
  };
}

/** Tính lại ngày kết thúc + số tuần cho mọi TKB trong một năm học. */
export function capNhatNgayKetThuc(namHoc) {
  const ds = nhieu(
    "SELECT id, ngay_ap_dung FROM tkb WHERE nam_hoc=? AND ngay_ap_dung<>'' ORDER BY ngay_ap_dung, so_tkb", namHoc
  );
  for (let i = 0; i < ds.length; i++) {
    const sau = ds[i + 1];
    let ketThuc = "";
    if (sau) {
      const t = new Date(sau.ngay_ap_dung + "T00:00:00");
      t.setDate(t.getDate() - 1);
      ketThuc = t.toISOString().slice(0, 10);
    }
    let soTuan = null;
    if (ketThuc) {
      const a = new Date(ds[i].ngay_ap_dung + "T00:00:00"), b = new Date(ketThuc + "T00:00:00");
      soTuan = Math.round(((b - a) / 86400000 + 1) / 7 * 10) / 10;
    }
    chay("UPDATE tkb SET ngay_ket_thuc=?, so_tuan=? WHERE id=?", ketThuc, soTuan, ds[i].id);
  }
}

/** Cắt file Word thành từng tệp và gắn vào tkb_gv / tkb_lop. */
export async function catVaLuu({ tkbId, thuMuc, docxGv, docxLop }) {
  const kq = { gv: null, lop: null, kho: "", khong_khop: [] };
  if (docxGv) {
    const dich = path.join(thuMuc, "gv");
    fs.mkdirSync(dich, { recursive: true });
    const r = await catDocx(fs.readFileSync(docxGv), (t, buf) => {
      if (t.loai !== "gv") return;
      const f = path.join(dich, t.ten_tep);
      fs.writeFileSync(f, buf);
      const n = chay("UPDATE tkb_gv SET docx_path=? WHERE tkb_id=? AND lower(ma_trong_tkb)=lower(?)", f, tkbId, t.ma);
      if (!n.changes) kq.khong_khop.push(`Giáo viên "${t.ma}" trong file Word không khớp giáo viên nào.`);
    });
    kq.gv = r; kq.kho = r.kho;
  }
  if (docxLop) {
    const dich = path.join(thuMuc, "lop");
    fs.mkdirSync(dich, { recursive: true });
    const r = await catDocx(fs.readFileSync(docxLop), (t, buf) => {
      if (t.loai !== "lop") return;
      const f = path.join(dich, t.ten_tep);
      fs.writeFileSync(f, buf);
      const n = chay("UPDATE tkb_lop SET docx_path=? WHERE tkb_id=? AND upper(lop)=upper(?)", f, tkbId, t.ma);
      if (!n.changes) kq.khong_khop.push(`Lớp "${t.ma}" trong file Word không khớp lớp nào.`);
    });
    kq.lop = r; kq.kho = kq.kho || r.kho;
  }
  return kq;
}

/** Kiểm tra nhanh file Word có đúng loại (giáo viên / lớp) không, trước khi nhập. */
export async function kiemFileWord(duongDan) {
  const ds = await lietKeBang(fs.readFileSync(duongDan));
  const gv = ds.filter((x) => x.loai === "gv").length, lop = ds.filter((x) => x.loai === "lop").length;
  return { tong: ds.length, gv, lop, loai: gv > lop ? "gv" : lop > 0 ? "lop" : "khong_ro", ma: ds.slice(0, 5).map((x) => x.ma) };
}

// ---------------------------------------------------------------- ĐỌC

export function dsTkb() {
  return nhieu(
    `SELECT t.*,
      (SELECT COUNT(*) FROM tiet WHERE tkb_id=t.id) so_tiet,
      (SELECT COUNT(*) FROM tkb_lop WHERE tkb_id=t.id) so_lop,
      (SELECT COUNT(*) FROM tkb_gv WHERE tkb_id=t.id) so_gv,
      (SELECT COUNT(*) FROM tkb_lop WHERE tkb_id=t.id AND giao_vien_id IS NULL) lop_thieu_cn,
      (SELECT COUNT(*) FROM lich_su_gui WHERE tkb_id=t.id AND ket_qua='xong') da_gui
     FROM tkb t ORDER BY t.nam_hoc DESC, t.hoc_ky DESC, t.so_tkb DESC`
  );
}

export function chiTietTkb(id) {
  const t = mot("SELECT * FROM tkb WHERE id=?", id);
  if (!t) return null;
  return {
    ...t,
    lop: nhieu(
      `SELECT l.*, gv.ho_ten gvcn_ten, gv.ma_gv gvcn_ma_gv, gv.dien_thoai gvcn_sdt, gv.zalo_uid gvcn_uid
       FROM tkb_lop l LEFT JOIN giao_vien gv ON gv.id=l.giao_vien_id WHERE l.tkb_id=? ORDER BY l.lop`, id
    ),
    gv: nhieu(
      `SELECT g.*, v.ho_ten, v.dien_thoai, v.zalo_uid, v.zalo_trang_thai, v.la_ban
       FROM tkb_gv g LEFT JOIN giao_vien v ON v.id=g.giao_vien_id WHERE g.tkb_id=? ORDER BY v.ten COLLATE NOCASE`, id
    ),
    phien_ban_cu: nhieu("SELECT id,phien_ban,nhap_luc,tom_tat,tao_luc FROM tkb_phien_ban WHERE tkb_id=? ORDER BY phien_ban DESC", id),
  };
}

/** Lưới tiết của một lớp hoặc một giáo viên (để vẽ ảnh và xem trong app). */
export function luoiTiet(tkbId, { lop, giaoVienId, maGv } = {}) {
  let sql = "SELECT thu,buoi,tiet,lop,mon,ma_gv FROM tiet WHERE tkb_id=?";
  const t = [tkbId];
  if (lop) { sql += " AND upper(lop)=upper(?)"; t.push(lop); }
  if (giaoVienId) { sql += " AND giao_vien_id=?"; t.push(giaoVienId); }
  else if (maGv) { sql += " AND lower(ma_gv)=lower(?)"; t.push(maGv); }
  sql += " ORDER BY thu, buoi DESC, tiet";
  return nhieu(sql, ...t);
}

/** Đặt giáo viên chủ nhiệm bằng tay cho một lớp. */
export function datGvcn(tkbId, lop, giaoVienId) {
  const gv = giaoVienId ? mot("SELECT ho_ten, ma_gv FROM giao_vien WHERE id=?", giaoVienId) : null;
  chay(
    "UPDATE tkb_lop SET giao_vien_id=?, gvcn_ma=?, cn_nguon='nhap_tay' WHERE tkb_id=? AND upper(lop)=upper(?)",
    giaoVienId || null, gv?.ma_gv || "", tkbId, lop
  );
  if (giaoVienId) chay("UPDATE giao_vien SET lop_cn_mac_dinh=? WHERE id=?", String(lop).toUpperCase(), giaoVienId);
  chay("UPDATE tkb_gv SET lop_cn=?, cn_nguon='nhap_tay' WHERE tkb_id=? AND giao_vien_id=?", String(lop).toUpperCase(), tkbId, giaoVienId || -1);
  ghiNhatKy("dat_gvcn", { doi_tuong: `Lớp ${lop}`, mo_ta: gv ? `Chủ nhiệm: ${gv.ho_ten}` : "Bỏ chủ nhiệm" });
  return { ok: true };
}

export function xoaTkb(id) {
  const t = mot("SELECT * FROM tkb WHERE id=?", id);
  if (!t) return { ok: false, loi: ["Không tìm thấy thời khoá biểu."] };
  const daGui = mot("SELECT COUNT(*) n FROM lich_su_gui WHERE tkb_id=? AND ket_qua='xong'", id).n;
  chay("DELETE FROM tkb WHERE id=?", id);
  ghiNhatKy("xoa_tkb", { doi_tuong: `TKB số ${t.so_tkb} ${t.nam_hoc}`, muc: "canh_bao", mo_ta: `Đã từng gửi ${daGui} lượt (lịch sử gửi vẫn giữ)` });
  return { ok: true };
}
