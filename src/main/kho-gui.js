/**
 * Đợt gửi: dựng danh sách "ai nhận gì", phát hiện GỬI TRÙNG (đã gửi y nguyên trước đó),
 * lọc "chỉ gửi phần thay đổi", và ghi LỊCH SỬ GỬI đầy đủ.
 */
import path from "node:path";
import { mot, nhieu, chay, giaoDich, ghiNhatKy, layCaiDat } from "./db.js";
import { ngayVn } from "./thong-ke.js";

export const TUY_CHON_MAC_DINH = {
  gui_tkb_gv: true,          // TKB giáo viên cho chính giáo viên
  gui_tkb_lop_gvcn: true,    // TKB lớp cho giáo viên chủ nhiệm
  gui_nguoi_ngoai: false,    // người ngoài danh sách theo đăng ký
  gui_anh: true,
  gui_docx: true,
  chi_thay_doi: false,       // chỉ gửi người có thay đổi so với lần gửi trước
  bo_qua_trung: true,        // bỏ qua người đã nhận y nguyên nội dung này
  anh_gom: "ca_ngay",        // ca_ngay | sang | chieu
  kho_giay: "",              // "" = theo TKB
  chi_chon: null,            // [{nguoi_loai,nguoi_id}] nếu người dùng chọn tay
  chi_gvcn: false,
};

const rutGon = (s, n = 400) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));

/** Thay biến trong mẫu tin. */
export function dungTin(mau, bien) {
  return String(mau || "").replace(/\{(\w+)\}/g, (m, k) => (bien[k] == null ? "" : String(bien[k])));
}

/**
 * Dựng danh sách việc gửi cho một TKB (chưa ghi CSDL) — dùng cho bảng xem trước.
 * → { muc: [...], tom_tat: {...}, canh_bao: [...] }
 */
export function chuanBiDotGui(tkbId, tuyChonVao = {}) {
  const tc = { ...TUY_CHON_MAC_DINH, ...tuyChonVao };
  const t = mot("SELECT * FROM tkb WHERE id=?", tkbId);
  if (!t) return { ok: false, loi: ["Không tìm thấy thời khoá biểu."] };

  const tenTruong = layCaiDat("ten_truong") || t.ten_truong || "Nhà trường";
  const mauGv = tuyChonVao.mau_tin_gv || layCaiDat("mau_tin_gv");
  const mauLop = tuyChonVao.mau_tin_lop || layCaiDat("mau_tin_lop");
  const bienChung = { truong: tenTruong, so_tkb: t.so_tkb, ngay: ngayVn(t.ngay_ap_dung), nam_hoc: t.nam_hoc, hoc_ky: t.hoc_ky ?? "" };

  const chon = tc.chi_chon ? new Set(tc.chi_chon.map((x) => `${x.nguoi_loai}:${x.nguoi_id}`)) : null;
  const muc = [];
  const canhBao = [];

  const themMuc = (m) => {
    if (chon && !chon.has(`${m.nguoi_loai}:${m.nguoi_id}`)) return;
    // Trạng thái so với lịch sử
    const daGui = mot(
      `SELECT luc, so_tkb, tkb_phien_ban FROM lich_su_gui
       WHERE nguoi_loai=? AND nguoi_id=? AND loai=? AND ma=? AND van_tay=? AND ket_qua='xong'
       ORDER BY id DESC LIMIT 1`,
      m.nguoi_loai, m.nguoi_id, m.loai, m.ma, m.van_tay
    );
    const tungGui = mot(
      `SELECT luc, van_tay, so_tkb FROM lich_su_gui
       WHERE nguoi_loai=? AND nguoi_id=? AND loai=? AND ma=? AND ket_qua='xong'
       ORDER BY id DESC LIMIT 1`,
      m.nguoi_loai, m.nguoi_id, m.loai, m.ma
    );
    m.trung = Boolean(daGui);
    m.gui_lan_truoc = daGui?.luc || tungGui?.luc || "";
    m.thay_doi = Boolean(tungGui) && !daGui;   // từng gửi nhưng nội dung nay khác
    m.lan_dau = !tungGui;

    if (!m.uid) { m.bo_qua = "khong_co_uid"; m.ly_do = "Chưa dò được Zalo."; }
    else if (tc.bo_qua_trung && m.trung) { m.bo_qua = "trung"; m.ly_do = `Đã gửi lúc ${daGui.luc}.`; }
    else if (tc.chi_thay_doi && !m.thay_doi && !m.lan_dau) { m.bo_qua = "khong_doi"; m.ly_do = "Không đổi so với lần trước."; }
    else if (!m.co_anh && !m.co_docx) { m.bo_qua = "khong_co_tep"; m.ly_do = "Chưa có ảnh hoặc tệp."; }
    muc.push(m);
  };

  // 1) TKB giáo viên
  if (tc.gui_tkb_gv) {
    const ds = nhieu(
      `SELECT g.*, v.ho_ten, v.dien_thoai, v.zalo_uid, v.zalo_ten, v.la_ban, v.hoat_dong
       FROM tkb_gv g JOIN giao_vien v ON v.id=g.giao_vien_id
       WHERE g.tkb_id=? AND v.hoat_dong=1 AND g.so_tiet_dem>0`, tkbId
    );
    for (const g of ds) {
      if (tc.chi_gvcn && !g.lop_cn) continue;
      themMuc({
        loai: "gv", ma: g.ma_trong_tkb || g.ho_ten_pcgd,
        nguoi_loai: "gv", nguoi_id: g.giao_vien_id, nguoi_ten: g.ho_ten,
        sdt: g.dien_thoai, uid: g.zalo_uid, la_ban: g.la_ban,
        van_tay: g.van_tay,
        co_anh: tc.gui_anh && Boolean(g.anh_path), co_docx: tc.gui_docx && Boolean(g.docx_path),
        anh_path: tc.gui_anh ? g.anh_path : "", docx_path: tc.gui_docx ? g.docx_path : "",
        so_tiet: g.so_tiet_dem, lop_cn: g.lop_cn,
        caption: dungTin(mauGv, { ...bienChung, ten: g.ho_ten, lop: g.lop_cn, so_tiet: g.so_tiet_dem }),
      });
    }
  }

  // 2) TKB lớp cho giáo viên chủ nhiệm
  if (tc.gui_tkb_lop_gvcn) {
    const ds = nhieu(
      `SELECT l.*, v.ho_ten, v.dien_thoai, v.zalo_uid, v.la_ban, v.hoat_dong
       FROM tkb_lop l LEFT JOIN giao_vien v ON v.id=l.giao_vien_id WHERE l.tkb_id=? ORDER BY l.lop`, tkbId
    );
    const thieu = [];
    for (const l of ds) {
      if (!l.giao_vien_id || !l.hoat_dong) { thieu.push(l.lop); continue; }
      themMuc({
        loai: "lop", ma: l.lop,
        nguoi_loai: "gv", nguoi_id: l.giao_vien_id, nguoi_ten: l.ho_ten,
        sdt: l.dien_thoai, uid: l.zalo_uid, la_ban: l.la_ban,
        van_tay: l.van_tay,
        co_anh: tc.gui_anh && Boolean(l.anh_path), co_docx: tc.gui_docx && Boolean(l.docx_path),
        anh_path: tc.gui_anh ? l.anh_path : "", docx_path: tc.gui_docx ? l.docx_path : "",
        so_tiet: l.so_tiet, lop_cn: l.lop,
        caption: dungTin(mauLop, { ...bienChung, ten: l.ho_ten, lop: l.lop, so_tiet: l.so_tiet }),
      });
    }
    if (thieu.length) {
      canhBao.push(
        `${thieu.length} lớp chưa có chủ nhiệm nên bỏ qua: ${thieu.join(", ")}.`
      );
    }
  }

  // 3) Người ngoài danh sách theo đăng ký
  if (tc.gui_nguoi_ngoai) {
    const ds = nhieu("SELECT * FROM nguoi_nhan WHERE hoat_dong=1");
    for (const n of ds) {
      const dk = nhieu("SELECT * FROM nguoi_nhan_dk WHERE nguoi_nhan_id=?", n.id);
      const lops = new Set(), gvs = new Set();
      for (const d of dk) {
        if (d.loai === "lop" && d.lop) lops.add(d.lop.toUpperCase());
        else if (d.loai === "gv" && d.giao_vien_id) gvs.add(d.giao_vien_id);
        else if (d.loai === "tat_ca_lop") for (const l of nhieu("SELECT lop FROM tkb_lop WHERE tkb_id=?", tkbId)) lops.add(l.lop.toUpperCase());
        else if (d.loai === "tat_ca_gv") for (const g of nhieu("SELECT giao_vien_id FROM tkb_gv WHERE tkb_id=? AND giao_vien_id IS NOT NULL", tkbId)) gvs.add(g.giao_vien_id);
      }
      for (const lop of lops) {
        const l = mot("SELECT * FROM tkb_lop WHERE tkb_id=? AND upper(lop)=?", tkbId, lop);
        if (!l) continue;
        themMuc({
          loai: "lop", ma: l.lop, nguoi_loai: "ngoai", nguoi_id: n.id, nguoi_ten: n.ho_ten,
          sdt: n.dien_thoai, uid: n.zalo_uid, la_ban: n.la_ban, van_tay: l.van_tay,
          co_anh: tc.gui_anh && Boolean(l.anh_path), co_docx: tc.gui_docx && Boolean(l.docx_path),
          anh_path: tc.gui_anh ? l.anh_path : "", docx_path: tc.gui_docx ? l.docx_path : "",
          so_tiet: l.so_tiet, lop_cn: l.lop,
          caption: dungTin(mauLop, { ...bienChung, ten: n.ho_ten, lop: l.lop, so_tiet: l.so_tiet }),
        });
      }
      for (const gid of gvs) {
        const g = mot(
          `SELECT g.*, v.ho_ten FROM tkb_gv g JOIN giao_vien v ON v.id=g.giao_vien_id
           WHERE g.tkb_id=? AND g.giao_vien_id=?`, tkbId, gid
        );
        if (!g) continue;
        themMuc({
          loai: "gv", ma: g.ma_trong_tkb, nguoi_loai: "ngoai", nguoi_id: n.id, nguoi_ten: n.ho_ten,
          sdt: n.dien_thoai, uid: n.zalo_uid, la_ban: n.la_ban, van_tay: g.van_tay,
          co_anh: tc.gui_anh && Boolean(g.anh_path), co_docx: tc.gui_docx && Boolean(g.docx_path),
          anh_path: tc.gui_anh ? g.anh_path : "", docx_path: tc.gui_docx ? g.docx_path : "",
          so_tiet: g.so_tiet_dem, lop_cn: g.lop_cn,
          caption: dungTin(mauGv, { ...bienChung, ten: `${n.ho_ten} (TKB của ${g.ho_ten})`, lop: g.lop_cn, so_tiet: g.so_tiet_dem }),
        });
      }
    }
  }

  const seGui = muc.filter((m) => !m.bo_qua);
  const tomTat = {
    tong: muc.length,
    se_gui: seGui.length,
    bo_qua: muc.length - seGui.length,
    trung: muc.filter((m) => m.trung).length,
    thay_doi: muc.filter((m) => m.thay_doi).length,
    lan_dau: muc.filter((m) => m.lan_dau).length,
    thieu_uid: muc.filter((m) => m.bo_qua === "khong_co_uid").length,
    chua_la_ban: seGui.filter((m) => m.la_ban === 0).length,
    thieu_tep: muc.filter((m) => m.bo_qua === "khong_co_tep").length,
    so_tin: seGui.reduce((s, m) => s + (m.co_anh ? 1 : 0) + (m.co_docx ? 1 : 0), 0),
    so_nguoi: new Set(seGui.map((m) => `${m.nguoi_loai}:${m.nguoi_id}`)).size,
  };

  if (tomTat.trung && tc.bo_qua_trung) {
    canhBao.push(`Bỏ qua ${tomTat.trung} mục đã gửi y nguyên.`);
  } else if (tomTat.trung) {
    canhBao.push(`GỬI TRÙNG: ${tomTat.trung} mục đã gửi y nguyên trước đó.`);
  }
  if (tomTat.thieu_uid) canhBao.push(`${tomTat.thieu_uid} người chưa dò được Zalo.`);
  if (tomTat.chua_la_ban) {
    canhBao.push(
      `${tomTat.chua_la_ban} người chưa kết bạn Zalo, có thể không nhận được.`
    );
  }
  if (tomTat.thieu_tep) canhBao.push(`${tomTat.thieu_tep} mục chưa có ảnh hoặc tệp.`);

  return { ok: true, tkb: t, tuy_chon: tc, muc, tom_tat: tomTat, canh_bao: canhBao };
}

/** Ghi đợt gửi vào CSDL và trả về id (hàng đợi sẽ chạy từ đây). */
export function taoDotGui(tkbId, tuyChon, muc, { ten = "", zaloUid = "", zaloTen = "" } = {}) {
  const t = mot("SELECT * FROM tkb WHERE id=?", tkbId);
  return giaoDich(() => {
    const r = chay(
      `INSERT INTO dot_gui(tkb_id,ten,tuy_chon_json,trang_thai,tong,zalo_uid_gui,zalo_ten_gui)
       VALUES(?,?,?,'moi',0,?,?)`,
      tkbId, ten || `TKB số ${t?.so_tkb ?? "?"} — ${new Date().toLocaleString("vi-VN")}`,
      JSON.stringify(tuyChon || {}), zaloUid, zaloTen
    );
    const dotId = Number(r.lastInsertRowid);
    let n = 0, boQua = 0;
    for (const m of muc) {
      const trangThai = m.bo_qua ? "bo_qua" : "cho";
      if (m.bo_qua) boQua++; else n++;
      chay(
        `INSERT INTO viec_gui(dot_id,tkb_id,loai,ma,nguoi_loai,nguoi_id,nguoi_ten,sdt,uid,la_ban,caption,
         anh_path,anh_w,anh_h,docx_path,van_tay,trung,buoc,trang_thai,ly_do_bo_qua)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        dotId, tkbId, m.loai, m.ma, m.nguoi_loai, m.nguoi_id, m.nguoi_ten, m.sdt || "", m.uid || "",
        m.la_ban == null ? -1 : m.la_ban, m.caption || "",
        m.co_anh ? m.anh_path : "", m.anh_w || null, m.anh_h || null,
        m.co_docx ? m.docx_path : "", m.van_tay || "", m.trung ? 1 : 0,
        m.co_anh ? "gui_anh" : "gui_file", trangThai, m.ly_do || ""
      );
    }
    chay("UPDATE dot_gui SET tong=?, bo_qua=? WHERE id=?", n, boQua, dotId);
    ghiNhatKy("tao_dot_gui", {
      doi_tuong: `TKB số ${t?.so_tkb ?? "?"}`,
      mo_ta: `${n} mục sẽ gửi, ${boQua} bỏ qua`,
    });
    return { ok: true, dot_id: dotId, se_gui: n, bo_qua: boQua };
  });
}

/** Ghi một dòng lịch sử gửi (gọi sau mỗi mục xong/lỗi — không bao giờ xoá). */
export function ghiLichSu(viec, ketQua, thongTin = {}) {
  const t = viec.tkb_id ? mot("SELECT so_tkb, nam_hoc, hoc_ky, phien_ban FROM tkb WHERE id=?", viec.tkb_id) : null;
  chay(
    `INSERT INTO lich_su_gui(dot_id,viec_id,tkb_id,so_tkb,nam_hoc,hoc_ky,tkb_phien_ban,loai,ma,
     nguoi_loai,nguoi_id,nguoi_ten,sdt,uid,la_ban,co_anh,co_docx,caption,anh_ten,docx_ten,van_tay,
     ket_qua,ma_loi,loi,msg_id_anh,msg_id_file,zalo_uid_gui)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    viec.dot_id, viec.id, viec.tkb_id, t?.so_tkb ?? null, t?.nam_hoc || "", t?.hoc_ky ?? null, t?.phien_ban ?? 1,
    viec.loai, viec.ma, viec.nguoi_loai, viec.nguoi_id, viec.nguoi_ten, viec.sdt, viec.uid,
    viec.la_ban == null ? -1 : viec.la_ban,
    viec.anh_path ? 1 : 0, viec.docx_path ? 1 : 0, rutGon(viec.caption),
    viec.anh_path ? path.basename(viec.anh_path) : "", viec.docx_path ? path.basename(viec.docx_path) : "",
    viec.van_tay, ketQua, thongTin.ma_loi ?? null, rutGon(thongTin.loi || "", 300),
    thongTin.msg_id_anh || "", thongTin.msg_id_file || "", thongTin.zalo_uid_gui || ""
  );
}

// ---------------------------------------------------------------- ĐỌC LỊCH SỬ

export function dsDotGui(gioiHan = 50) {
  return nhieu(
    `SELECT d.*, t.so_tkb, t.nam_hoc, t.hoc_ky,
      (SELECT COUNT(*) FROM viec_gui WHERE dot_id=d.id AND trang_thai='xong') n_xong,
      (SELECT COUNT(*) FROM viec_gui WHERE dot_id=d.id AND trang_thai='loi') n_loi,
      (SELECT COUNT(*) FROM viec_gui WHERE dot_id=d.id AND trang_thai='cho') n_cho
     FROM dot_gui d LEFT JOIN tkb t ON t.id=d.tkb_id ORDER BY d.id DESC LIMIT ?`, gioiHan
  );
}

export function chiTietDotGui(dotId) {
  const d = mot("SELECT * FROM dot_gui WHERE id=?", dotId);
  if (!d) return null;
  return { ...d, muc: nhieu("SELECT * FROM viec_gui WHERE dot_id=? ORDER BY id", dotId) };
}

/** Lịch sử gửi có lọc đa chiều — "gửi gì cho ai, lúc nào". */
export function lichSuGui(loc = {}, gioiHan = 500) {
  let sql = "SELECT * FROM lich_su_gui WHERE 1=1";
  const t = [];
  if (loc.tkb_id) { sql += " AND tkb_id=?"; t.push(loc.tkb_id); }
  if (loc.so_tkb) { sql += " AND so_tkb=?"; t.push(loc.so_tkb); }
  if (loc.nam_hoc) { sql += " AND nam_hoc=?"; t.push(loc.nam_hoc); }
  if (loc.nguoi_loai) { sql += " AND nguoi_loai=?"; t.push(loc.nguoi_loai); }
  if (loc.nguoi_id) { sql += " AND nguoi_id=?"; t.push(loc.nguoi_id); }
  if (loc.loai) { sql += " AND loai=?"; t.push(loc.loai); }
  if (loc.ma) { sql += " AND upper(ma)=upper(?)"; t.push(loc.ma); }
  if (loc.ket_qua) { sql += " AND ket_qua=?"; t.push(loc.ket_qua); }
  if (loc.tu_ngay) { sql += " AND date(luc)>=date(?)"; t.push(loc.tu_ngay); }
  if (loc.den_ngay) { sql += " AND date(luc)<=date(?)"; t.push(loc.den_ngay); }
  if (loc.tim) { sql += " AND (nguoi_ten LIKE ? OR sdt LIKE ? OR ma LIKE ?)"; const k = `%${loc.tim}%`; t.push(k, k, k); }
  sql += " ORDER BY id DESC LIMIT ?";
  t.push(gioiHan);
  return nhieu(sql, ...t);
}

/** Lần gửi gần nhất của từng người (bảng "ai đã nhận gì"). */
export function tongHopDaNhan(tkbId = null) {
  const dk = tkbId ? "WHERE tkb_id=?" : "";
  const t = tkbId ? [tkbId] : [];
  return nhieu(
    `SELECT nguoi_loai, nguoi_id, nguoi_ten, loai, ma,
            MAX(luc) lan_cuoi, COUNT(*) so_lan,
            SUM(CASE WHEN ket_qua='xong' THEN 1 ELSE 0 END) so_thanh_cong,
            SUM(CASE WHEN ket_qua='loi' THEN 1 ELSE 0 END) so_loi
     FROM lich_su_gui ${dk}
     GROUP BY nguoi_loai, nguoi_id, loai, ma
     ORDER BY lan_cuoi DESC`, ...t
  );
}

/**
 * DANH SÁCH LỖI của một đợt gửi — nói rõ ai không nhận được và vì sao.
 * Gồm cả mục LỖI khi gửi lẫn mục BỊ BỎ QUA (thiếu Zalo, thiếu tệp, chưa kết bạn…).
 */
export function dsLoiDot(dotId) {
  const ds = nhieu(
    `SELECT v.*, g.ho_ten gv_ten, g.ma_gv, g.dien_thoai gv_sdt, g.email, g.to_chuyen_mon, g.lop_cn_mac_dinh,
            n.ho_ten ng_ten, n.chuc_danh, n.dien_thoai ng_sdt
     FROM viec_gui v
     LEFT JOIN giao_vien g ON v.nguoi_loai='gv' AND g.id=v.nguoi_id
     LEFT JOIN nguoi_nhan n ON v.nguoi_loai='ngoai' AND n.id=v.nguoi_id
     WHERE v.dot_id=? AND v.trang_thai IN ('loi','bo_qua')
     ORDER BY CASE v.trang_thai WHEN 'loi' THEN 0 ELSE 1 END, v.nguoi_ten`, dotId
  );
  return ds.map((v) => {
    const laLoi = v.trang_thai === "loi";
    return {
      id: v.id,
      trang_thai: v.trang_thai,
      nguoi_loai: v.nguoi_loai,
      ho_ten: v.gv_ten || v.ng_ten || v.nguoi_ten,
      ma_gv: v.ma_gv || "",
      chuc_danh: v.chuc_danh || "",
      to_chuyen_mon: v.to_chuyen_mon || "",
      lop_cn: v.lop_cn_mac_dinh || "",
      dien_thoai: v.gv_sdt || v.ng_sdt || v.sdt || "",
      email: v.email || "",
      zalo_uid: v.uid || "",
      la_ban: v.la_ban,
      noi_dung: v.loai === "lop" ? `Thời khoá biểu lớp ${v.ma}` : "Thời khoá biểu cá nhân",
      tep: [v.anh_path ? "ảnh" : "", v.docx_path ? "Word" : ""].filter(Boolean).join(" + ") || "chỉ tin nhắn",
      ma_loi: v.ma_loi,
      ly_do: laLoi ? (v.loi_cuoi || "Không rõ lỗi") : (v.ly_do_bo_qua || "Bị bỏ qua"),
      cach_sua: cachSua(v, laLoi),
      so_lan_thu: v.so_lan_thu,
      luc: v.cap_nhat_luc,
    };
  });
}


function cachSua(v, laLoi) {
  if (!v.uid) return "Bổ sung số điện thoại rồi bấm Dò Zalo ở màn Giáo viên.";
  if (!laLoi && !v.anh_path && !v.docx_path) return "Bấm Tạo ảnh ở màn Thời khoá biểu.";
  const s = String(v.loi_cuoi || "").toLowerCase();
  if (s.includes("401") || s.includes("403") || s.includes("login") || s.includes("session") || s.includes("đăng nhập")) {
    return "Phiên Zalo hết hạn. Vào màn Kết nối Zalo quét lại mã QR rồi bấm Gửi lại lỗi.";
  }
  if (s.includes("fetch") || s.includes("network") || s.includes("timeout") || s.includes("econn")) {
    return "Lỗi mạng. Kiểm tra internet rồi bấm Gửi lại lỗi.";
  }
  if (v.la_ban === 0) return "Người này chưa kết bạn Zalo. Gửi lời mời kết bạn rồi thử lại.";
  if (!laLoi) return "Xem lại dữ liệu của người này ở màn Giáo viên.";
  return "Bấm Gửi lại lỗi. Nếu vẫn hỏng, kiểm tra tài khoản Zalo còn gửi được không.";
}

/** Gom lỗi theo nguyên nhân để nhìn một cái là biết hỏng ở đâu. */
export function gomLoiDot(dotId) {
  const ds = dsLoiDot(dotId);
  const nhom = new Map();
  for (const x of ds) {
    const k = x.cach_sua;
    if (!nhom.has(k)) nhom.set(k, { cach_sua: k, so_nguoi: 0, nguoi: [] });
    const g = nhom.get(k);
    g.so_nguoi++;
    g.nguoi.push(x.ho_ten);
  }
  return { tong: ds.length, nhom: [...nhom.values()].sort((a, b) => b.so_nguoi - a.so_nguoi), chi_tiet: ds };
}

export function thongKeGui() {
  return {
    tong_luot: mot("SELECT COUNT(*) n FROM lich_su_gui").n,
    thanh_cong: mot("SELECT COUNT(*) n FROM lich_su_gui WHERE ket_qua='xong'").n,
    loi: mot("SELECT COUNT(*) n FROM lich_su_gui WHERE ket_qua='loi'").n,
    so_nguoi: mot("SELECT COUNT(DISTINCT nguoi_loai || ':' || nguoi_id) n FROM lich_su_gui WHERE ket_qua='xong'").n,
    dot_gan_nhat: mot("SELECT * FROM dot_gui ORDER BY id DESC LIMIT 1"),
  };
}
