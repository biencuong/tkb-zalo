/**
 * Nghiệp vụ Giáo viên + Người nhận ngoài danh sách.
 */
import { mot, nhieu, chay, giaoDich, ghiNhatKy } from "./db.js";
import { docDsGv } from "./nhap-xlsx.js";
import { chuanHoaKhoangTrang, chuanSdt, chuanHoaTen, boDau } from "./khop.js";

const bayGio = () => new Date().toLocaleString("sv-SE").replace("T", " ");

export function dsGiaoVien({ tim = "", chiHoatDong = false, sapXep = "ten" } = {}) {
  let sql = "SELECT * FROM giao_vien";
  const dk = [];
  if (chiHoatDong) dk.push("hoat_dong=1");
  if (dk.length) sql += " WHERE " + dk.join(" AND ");
  sql += sapXep === "ma" ? " ORDER BY ma_gv COLLATE NOCASE" : " ORDER BY ten COLLATE NOCASE, ho_dem COLLATE NOCASE";
  let ds = nhieu(sql);
  const t = boDau(tim).toLowerCase();
  if (t) {
    ds = ds.filter((g) =>
      boDau(g.ho_ten).toLowerCase().includes(t) ||
      boDau(g.ma_gv).toLowerCase().includes(t) ||
      boDau(g.ma_gv_2).toLowerCase().includes(t) ||
      g.dien_thoai.includes(t) ||
      boDau(g.to_chuyen_mon).toLowerCase().includes(t)
    );
  }
  return ds;
}

export const layGiaoVien = (id) => mot("SELECT * FROM giao_vien WHERE id=?", id);

function kiemTraGv(gv, idBoQua = null) {
  const loi = [];
  if (!chuanHoaKhoangTrang(gv.ten)) loi.push("Thiếu tên giáo viên.");
  const ma = chuanHoaKhoangTrang(gv.ma_gv);
  if (!ma) loi.push("Thiếu Mã GV (tên viết tắt dùng trong thời khoá biểu).");
  else {
    const trung = nhieu("SELECT id, ho_ten FROM giao_vien WHERE lower(ma_gv)=lower(?)", ma)
      .filter((x) => x.id !== idBoQua);
    if (trung.length) loi.push(`Mã GV "${ma}" đã dùng cho ${trung[0].ho_ten}.`);
  }
  const sdt = chuanSdt(gv.dien_thoai);
  if (sdt && !/^0\d{9}$/.test(sdt)) loi.push(`Số điện thoại "${gv.dien_thoai}" không hợp lệ (cần 10 số, bắt đầu bằng 0).`);
  return loi;
}

export function luuGiaoVien(gv) {
  const loi = kiemTraGv(gv, gv.id || null);
  if (loi.length) return { ok: false, loi };
  const ho_dem = chuanHoaKhoangTrang(gv.ho_dem), ten = chuanHoaKhoangTrang(gv.ten);
  const d = {
    ho_dem, ten, ho_ten: `${ho_dem} ${ten}`.trim(),
    ma_gv: chuanHoaKhoangTrang(gv.ma_gv), ma_gv_2: chuanHoaKhoangTrang(gv.ma_gv_2),
    dien_thoai: chuanSdt(gv.dien_thoai), email: chuanHoaKhoangTrang(gv.email),
    zalo_uid: String(gv.zalo_uid || "").replace(/\D/g, ""),
    to_chuyen_mon: chuanHoaKhoangTrang(gv.to_chuyen_mon),
    lop_cn_mac_dinh: chuanHoaKhoangTrang(gv.lop_cn_mac_dinh).toUpperCase(),
    ghi_chu: chuanHoaKhoangTrang(gv.ghi_chu),
    hoat_dong: gv.hoat_dong === 0 ? 0 : 1,
  };
  return giaoDich(() => {
    if (gv.id) {
      const cu = layGiaoVien(gv.id);
      if (!cu) return { ok: false, loi: ["Không tìm thấy giáo viên này (có thể đã bị xoá)."] };
      // Đổi số điện thoại → UID cũ không còn đúng, phải dò lại
      const doiSdt = cu.dien_thoai !== d.dien_thoai;
      chay(
        `UPDATE giao_vien SET ho_dem=?,ten=?,ho_ten=?,ma_gv=?,ma_gv_2=?,dien_thoai=?,email=?,zalo_uid=?,
         to_chuyen_mon=?,lop_cn_mac_dinh=?,ghi_chu=?,hoat_dong=?,sua_luc=?
         ${doiSdt ? ", zalo_trang_thai='chua_do', zalo_ten='', la_ban=-1" : ""} WHERE id=?`,
        d.ho_dem, d.ten, d.ho_ten, d.ma_gv, d.ma_gv_2, d.dien_thoai, d.email,
        doiSdt ? "" : d.zalo_uid, d.to_chuyen_mon, d.lop_cn_mac_dinh, d.ghi_chu, d.hoat_dong, bayGio(), gv.id
      );
      ghiNhatKy("sua_giao_vien", { doi_tuong: d.ho_ten, truoc: cu, sau: d });
      return { ok: true, id: gv.id, doiSdt };
    }
    const r = chay(
      `INSERT INTO giao_vien(ho_dem,ten,ho_ten,ma_gv,ma_gv_2,dien_thoai,email,zalo_uid,to_chuyen_mon,
       lop_cn_mac_dinh,ghi_chu,hoat_dong) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      d.ho_dem, d.ten, d.ho_ten, d.ma_gv, d.ma_gv_2, d.dien_thoai, d.email, d.zalo_uid,
      d.to_chuyen_mon, d.lop_cn_mac_dinh, d.ghi_chu, d.hoat_dong
    );
    ghiNhatKy("them_giao_vien", { doi_tuong: d.ho_ten, sau: d });
    return { ok: true, id: Number(r.lastInsertRowid) };
  });
}

/** Xoá giáo viên. Có dữ liệu liên quan thì chỉ cho ngừng hoạt động, trừ khi ép xoá. */
export function xoaGiaoVien(id, { ep = false } = {}) {
  const gv = layGiaoVien(id);
  if (!gv) return { ok: false, loi: ["Không tìm thấy giáo viên."] };
  const soTiet = mot("SELECT COUNT(*) n FROM tiet WHERE giao_vien_id=?", id).n;
  const soGui = mot("SELECT COUNT(*) n FROM lich_su_gui WHERE nguoi_loai='gv' AND nguoi_id=?", id).n;
  if (!ep && (soTiet || soGui)) {
    return {
      ok: false, canXacNhan: true,
      loi: [`Giáo viên "${gv.ho_ten}" đang có ${soTiet} tiết trong thời khoá biểu và ${soGui} lượt đã gửi. ` +
            "Nên chọn Ngừng hoạt động để giữ lịch sử. Vẫn muốn xoá hẳn?"],
    };
  }
  return giaoDich(() => {
    chay("DELETE FROM giao_vien WHERE id=?", id);
    ghiNhatKy("xoa_giao_vien", { doi_tuong: gv.ho_ten, truoc: gv, muc: "canh_bao" });
    return { ok: true };
  });
}

/**
 * Nhập danh sách giáo viên từ Excel. Khoá khớp: Mã GV, rồi Họ tên.
 * → {them, capNhat, boQua, chiTiet:[]}
 */
export async function nhapDsGvTuExcel(duongDan) {
  const ds = await docDsGv(duongDan);
  if (!ds.length) return { ok: false, loi: ["File không có dòng giáo viên nào."] };
  return giaoDich(() => {
    let them = 0, capNhat = 0, boQua = 0;
    const chiTiet = [];
    for (const g of ds) {
      if (!g.ten && !g.ma_gv) { boQua++; continue; }
      let cu = g.ma_gv ? mot("SELECT * FROM giao_vien WHERE lower(ma_gv)=lower(?)", g.ma_gv) : null;
      if (!cu && g.ho_ten) {
        const theoTen = nhieu("SELECT * FROM giao_vien WHERE lower(ho_ten)=lower(?)", g.ho_ten);
        if (theoTen.length === 1) cu = theoTen[0];
      }
      if (cu) {
        chay(
          `UPDATE giao_vien SET ho_dem=?,ten=?,ho_ten=?,ma_gv=?,ma_gv_2=?,
           dien_thoai=CASE WHEN ?<>'' THEN ? ELSE dien_thoai END,
           email=CASE WHEN ?<>'' THEN ? ELSE email END,
           zalo_uid=CASE WHEN ?<>'' THEN ? ELSE zalo_uid END,
           lop_cn_mac_dinh=CASE WHEN ?<>'' THEN ? ELSE lop_cn_mac_dinh END,
           ghi_chu=CASE WHEN ?<>'' THEN ? ELSE ghi_chu END, sua_luc=? WHERE id=?`,
          g.ho_dem, g.ten, g.ho_ten, g.ma_gv || cu.ma_gv, g.ma_gv_2 || cu.ma_gv_2,
          g.dien_thoai, g.dien_thoai, g.email, g.email, g.zalo_uid, g.zalo_uid,
          g.lop_cn, g.lop_cn.toUpperCase(), g.ghi_chu, g.ghi_chu, bayGio(), cu.id
        );
        if (g.dien_thoai && g.dien_thoai !== cu.dien_thoai) {
          chay("UPDATE giao_vien SET zalo_trang_thai='chua_do', zalo_ten='', la_ban=-1 WHERE id=?", cu.id);
        }
        capNhat++;
        chiTiet.push({ ho_ten: g.ho_ten, viec: "cập nhật" });
      } else {
        chay(
          `INSERT INTO giao_vien(ho_dem,ten,ho_ten,ma_gv,ma_gv_2,dien_thoai,email,zalo_uid,lop_cn_mac_dinh,ghi_chu)
           VALUES(?,?,?,?,?,?,?,?,?,?)`,
          g.ho_dem, g.ten, g.ho_ten, g.ma_gv, g.ma_gv_2, g.dien_thoai, g.email, g.zalo_uid,
          g.lop_cn.toUpperCase(), g.ghi_chu
        );
        them++;
        chiTiet.push({ ho_ten: g.ho_ten, viec: "thêm mới" });
      }
    }
    ghiNhatKy("nhap_ds_gv", { doi_tuong: duongDan, mo_ta: `Thêm ${them}, cập nhật ${capNhat}, bỏ qua ${boQua}` });
    return { ok: true, them, capNhat, boQua, tong: ds.length, chiTiet };
  });
}

// ---------------------------------------------------------------- NGƯỜI NHẬN NGOÀI DANH SÁCH

export function dsNguoiNhan() {
  const ds = nhieu("SELECT * FROM nguoi_nhan ORDER BY ho_ten COLLATE NOCASE");
  for (const n of ds) {
    n.dang_ky = nhieu(
      `SELECT dk.*, gv.ho_ten AS gv_ten, gv.ma_gv AS gv_ma FROM nguoi_nhan_dk dk
       LEFT JOIN giao_vien gv ON gv.id=dk.giao_vien_id WHERE dk.nguoi_nhan_id=? ORDER BY dk.loai, dk.lop`,
      n.id
    );
  }
  return ds;
}

/**
 * Đặt nhanh "nhận thời khoá biểu nào" cho một người nhận ngoài / nhóm Zalo.
 * loai: tat_ca_lop | tat_ca_gv. Ghi đè đăng ký cũ.
 */
export function datNhanNhanh(id, loai) {
  if (!["tat_ca_lop", "tat_ca_gv"].includes(loai)) return { ok: false, loi: ["Lựa chọn nhận không hợp lệ."] };
  const n = mot("SELECT id, ho_ten FROM nguoi_nhan WHERE id=?", id);
  if (!n) return { ok: false, loi: ["Không tìm thấy người nhận này."] };
  return giaoDich(() => {
    chay("DELETE FROM nguoi_nhan_dk WHERE nguoi_nhan_id=?", id);
    chay("INSERT INTO nguoi_nhan_dk(nguoi_nhan_id,loai,lop,giao_vien_id) VALUES(?,?,'',NULL)", id, loai);
    ghiNhatKy("dat_nhan_nguoi_ngoai", { doi_tuong: n.ho_ten, mo_ta: loai });
    return { ok: true, id, loai };
  });
}

export function luuNguoiNhan(n) {
  const ho_ten = chuanHoaKhoangTrang(n.ho_ten);
  if (!ho_ten) return { ok: false, loi: ["Thiếu họ tên người nhận."] };
  // Sửa người đã có mà giao diện không gửi kèm mã Zalo thì GIỮ mã cũ. Trước đây câu lệnh
  // cập nhật ghi đè zalo_uid bằng chuỗi rỗng — với nhóm Zalo là mất luôn mã nhóm.
  const cu0 = n.id ? mot("SELECT * FROM nguoi_nhan WHERE id=?", n.id) : null;
  const laNhom = Boolean(cu0?.la_nhom) || Boolean(n.la_nhom);
  const sdt = laNhom ? "" : chuanSdt(n.dien_thoai);
  const uidMoi = String(n.zalo_uid || "").replace(/\D/g, "");
  const uid = uidMoi || String(cu0?.zalo_uid || "");
  // Nhóm Zalo không có số điện thoại, gửi bằng mã nhóm.
  if (!laNhom && !sdt && !uid) return { ok: false, loi: ["Cần số điện thoại Zalo (hoặc Zalo UID) để gửi tin."] };
  if (laNhom && !uid) return { ok: false, loi: ["Nhóm này chưa có mã nhóm Zalo. Chọn lại nhóm ở màn Kết nối Zalo."] };
  if (sdt && !/^0\d{9}$/.test(sdt)) return { ok: false, loi: [`Số điện thoại "${n.dien_thoai}" không hợp lệ.`] };
  return giaoDich(() => {
    let id = n.id;
    if (id) {
      const cu = cu0;
      const doiSdt = !laNhom && cu && cu.dien_thoai !== sdt;
      chay(
        `UPDATE nguoi_nhan SET ho_ten=?,chuc_danh=?,dien_thoai=?,zalo_uid=?,ghi_chu=?,hoat_dong=?
         ${doiSdt ? ", zalo_trang_thai='chua_do', zalo_ten='', la_ban=-1" : ""} WHERE id=?`,
        ho_ten, chuanHoaKhoangTrang(n.chuc_danh), sdt, doiSdt ? "" : uid,
        chuanHoaKhoangTrang(n.ghi_chu), n.hoat_dong === 0 ? 0 : 1, id
      );
    } else {
      const r = chay(
        "INSERT INTO nguoi_nhan(ho_ten,chuc_danh,dien_thoai,zalo_uid,ghi_chu) VALUES(?,?,?,?,?)",
        ho_ten, chuanHoaKhoangTrang(n.chuc_danh), sdt, uid, chuanHoaKhoangTrang(n.ghi_chu)
      );
      id = Number(r.lastInsertRowid);
    }
    chay("DELETE FROM nguoi_nhan_dk WHERE nguoi_nhan_id=?", id);
    for (const dk of n.dang_ky || []) {
      if (!["lop", "gv", "tat_ca_lop", "tat_ca_gv"].includes(dk.loai)) continue;
      chay(
        "INSERT INTO nguoi_nhan_dk(nguoi_nhan_id,loai,lop,giao_vien_id) VALUES(?,?,?,?)",
        id, dk.loai, chuanHoaKhoangTrang(dk.lop).toUpperCase(), dk.giao_vien_id || null
      );
    }
    ghiNhatKy(n.id ? "sua_nguoi_nhan" : "them_nguoi_nhan", { doi_tuong: ho_ten, sau: { ho_ten, sdt } });
    return { ok: true, id };
  });
}

export function xoaNguoiNhan(id) {
  const n = mot("SELECT * FROM nguoi_nhan WHERE id=?", id);
  if (!n) return { ok: false, loi: ["Không tìm thấy người nhận."] };
  chay("DELETE FROM nguoi_nhan WHERE id=?", id);
  ghiNhatKy("xoa_nguoi_nhan", { doi_tuong: n.ho_ten, truoc: n, muc: "canh_bao" });
  return { ok: true };
}

/** Cập nhật kết quả dò UID Zalo cho hàng loạt người (giáo viên hoặc người nhận ngoài). */
export function capNhatUid(ds) {
  return giaoDich(() => {
    let n = 0;
    for (const x of ds) {
      const bang = x.nguoi_loai === "ngoai" ? "nguoi_nhan" : "giao_vien";
      chay(
        `UPDATE ${bang} SET zalo_uid=?, zalo_ten=?, zalo_trang_thai=?, la_ban=? WHERE id=?`,
        String(x.uid || ""), String(x.ten || ""), x.trang_thai || (x.uid ? "da_co" : "khong_thay"),
        x.la_ban == null ? -1 : (x.la_ban ? 1 : 0), x.id
      );
      n++;
    }
    return { ok: true, n };
  });
}

/** Danh sách số điện thoại cần dò UID. */
export function canDoUid({ chiThieu = true } = {}) {
  const dk = chiThieu ? "AND (zalo_uid='' OR zalo_trang_thai='chua_do')" : "";
  const gv = nhieu(
    `SELECT id, ho_ten, dien_thoai, zalo_uid FROM giao_vien WHERE hoat_dong=1 AND dien_thoai<>'' ${dk}`
  ).map((x) => ({ ...x, nguoi_loai: "gv" }));
  // Nhóm Zalo không có số điện thoại — dò theo số là vô nghĩa, bỏ qua hẳn.
  const ng = nhieu(
    `SELECT id, ho_ten, dien_thoai, zalo_uid FROM nguoi_nhan
     WHERE hoat_dong=1 AND dien_thoai<>'' AND ifnull(la_nhom,0)=0 ${dk}`
  ).map((x) => ({ ...x, nguoi_loai: "ngoai" }));
  return [...gv, ...ng];
}

/** Gắn nhãn "là bạn / chưa là bạn" từ danh sách UID bạn bè lấy về từ Zalo. */
export function capNhatLaBan(tapUid) {
  const t = new Set([...tapUid].map(String));
  return giaoDich(() => {
    let n = 0;
    for (const bang of ["giao_vien", "nguoi_nhan"]) {
      // NHÓM ZALO không nằm trong danh sách bạn bè, nhưng mình vốn ở trong nhóm nên luôn gửi được.
      // Không loại trừ ở đây thì mỗi lần đối chiếu là nhóm bị đánh dấu "chưa kết bạn" rồi bị chặn.
      const boNhom = bang === "nguoi_nhan" ? " AND ifnull(la_nhom,0)=0" : "";
      for (const r of nhieu(`SELECT id, zalo_uid FROM ${bang} WHERE zalo_uid<>''${boNhom}`)) {
        chay(`UPDATE ${bang} SET la_ban=? WHERE id=?`, t.has(String(r.zalo_uid)) ? 1 : 0, r.id);
        n++;
      }
    }
    // Nhóm luôn ở trạng thái gửi được
    chay("UPDATE nguoi_nhan SET la_ban=1 WHERE ifnull(la_nhom,0)=1");
    return { ok: true, n };
  });
}

/** Tìm giáo viên theo mã (dùng khi khớp dữ liệu TKB). */
export function timTheoMa(ma) {
  const m = chuanHoaKhoangTrang(ma);
  if (!m) return null;
  return mot("SELECT * FROM giao_vien WHERE lower(ma_gv)=lower(?) OR lower(ma_gv_2)=lower(?)", m, m);
}

/** Tìm giáo viên theo họ tên (đúng dấu trước, bỏ dấu sau; chỉ nhận khi duy nhất). */
export function timTheoTen(hoTen) {
  const t = chuanHoaTen(hoTen);
  if (!t) return null;
  const dung = nhieu("SELECT * FROM giao_vien WHERE lower(ho_ten)=?", t);
  if (dung.length === 1) return dung[0];
  const bd = boDau(t);
  const ds = nhieu("SELECT * FROM giao_vien").filter((g) => boDau(g.ho_ten).toLowerCase() === bd);
  return ds.length === 1 ? ds[0] : null;
}
