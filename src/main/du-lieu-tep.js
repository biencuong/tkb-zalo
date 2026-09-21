/**
 * Số liệu dựng ẢNH cho từng giáo viên / lớp, và DẤU VÂN TAY của số liệu đó.
 *
 * Ảnh và Word lưu kèm vân tay lúc tạo. Số liệu đổi — sửa tên giáo viên, đổi chủ nhiệm, đổi tên trường,
 * cập nhật thời khoá biểu, đổi "ảnh gồm buổi nào" — thì vân tay lệch → tự tạo lại, GHI ĐÈ đúng tên tệp cũ.
 * Không phải móc vào từng sự kiện, cũng không cần nút bấm tay.
 *
 * Mô-đun thuần (không dùng Electron) để kiểm thử được bằng node --test.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nhieu, mot, layCaiDat } from "./db.js";
import { ngayVn } from "./thong-ke.js";

export const vanTayTep = (x) => crypto.createHash("sha1").update(JSON.stringify(x)).digest("hex").slice(0, 16);

/** Vân tay một tệp mẫu (ve-tkb.html, khuôn Word). Cập nhật app mà đổi mẫu thì tệp cũ tự được làm mới. */
const boNhoMau = new Map();
export function vanTayMau(duongDan) {
  if (!boNhoMau.has(duongDan)) {
    let vt = "";
    try { vt = crypto.createHash("sha1").update(fs.readFileSync(duongDan)).digest("hex").slice(0, 12); } catch { /* */ }
    boNhoMau.set(duongDan, vt);
  }
  return boNhoMau.get(duongDan);
}
const MAU_ANH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "renderer", "ve-tkb.html");

/** Vân tay của MỘT ảnh = số liệu vẽ + phiên bản mẫu vẽ. */
export const vanTayAnh = (duLieu) => vanTayTep([duLieu, vanTayMau(MAU_ANH)]);

/** Tên trường in lên ảnh / Word: Cài đặt trước, không có thì lấy trong tệp Excel. */
export const tenTruongIn = (tkb) => layCaiDat("ten_truong") || tkb.ten_truong || "";

/** "Ảnh gồm buổi nào" đang chọn ở hộp gửi (lưu trong tuỳ chọn gửi). */
export function gomDangChon() {
  try { return JSON.parse(layCaiDat("tuy_chon_gui_json") || "{}").anh_gom || "ca_ngay"; }
  catch { return "ca_ngay"; }
}

export function dsGvCoTiet(tkbId) {
  return nhieu(
    `SELECT g.*, v.ho_ten FROM tkb_gv g LEFT JOIN giao_vien v ON v.id=g.giao_vien_id
     WHERE g.tkb_id=? AND g.giao_vien_id IS NOT NULL AND g.so_tiet_dem>0`, tkbId);
}

export function dsLopCoTep(tkbId) {
  return nhieu(
    `SELECT l.*, v.ho_ten gvcn_ten FROM tkb_lop l LEFT JOIN giao_vien v ON v.id=l.giao_vien_id
     WHERE l.tkb_id=? ORDER BY l.lop`, tkbId);
}

/** Số liệu vẽ ảnh cho một giáo viên. */
export function duLieuAnhGv(tkb, g, gom) {
  const tiet = nhieu(
    "SELECT thu,buoi,tiet,lop,mon FROM tiet WHERE tkb_id=? AND giao_vien_id=? ORDER BY thu,buoi DESC,tiet",
    tkb.id, g.giao_vien_id
  );
  const phu = [];
  if (g.lop_cn) phu.push("Chủ nhiệm lớp " + g.lop_cn);
  if (g.kiem_nhiem) phu.push(g.kiem_nhiem);
  return {
    loai: "gv", ten: g.ho_ten || g.ho_ten_pcgd, phu: phu.join(" · "),
    truong: tenTruongIn(tkb), so_tkb: tkb.so_tkb, ngay: ngayVn(tkb.ngay_ap_dung),
    nam_hoc: tkb.nam_hoc, hoc_ky: tkb.hoc_ky, gom, tiet,
  };
}

/** Số liệu vẽ ảnh cho một lớp. */
export function duLieuAnhLop(tkb, l, gom) {
  const tiet = nhieu(
    "SELECT thu,buoi,tiet,mon,ma_gv FROM tiet WHERE tkb_id=? AND upper(lop)=upper(?) ORDER BY thu,buoi DESC,tiet",
    tkb.id, l.lop
  );
  return {
    loai: "lop", ten: "Lớp " + l.lop,
    phu: l.gvcn_ten ? "Giáo viên chủ nhiệm: " + l.gvcn_ten : "",
    truong: tenTruongIn(tkb), so_tkb: tkb.so_tkb, ngay: ngayVn(tkb.ngay_ap_dung),
    nam_hoc: tkb.nam_hoc, hoc_ky: tkb.hoc_ky, gom, tiet,
  };
}

const cu = (f, vtLuu, vtMoi) => !f || !fs.existsSync(f) || vtLuu !== vtMoi;

/** Số ảnh còn thiếu hoặc đã cũ (vân tay lệch) của một thời khoá biểu. */
export function demAnhCanTao(tkbId, gom = gomDangChon()) {
  const tkb = mot("SELECT * FROM tkb WHERE id=?", tkbId);
  if (!tkb) return 0;
  let n = 0;
  for (const g of dsGvCoTiet(tkbId)) if (cu(g.anh_path, g.anh_vt, vanTayAnh(duLieuAnhGv(tkb, g, gom)))) n++;
  for (const l of dsLopCoTep(tkbId)) if (cu(l.anh_path, l.anh_vt, vanTayAnh(duLieuAnhLop(tkb, l, gom)))) n++;
  return n;
}
