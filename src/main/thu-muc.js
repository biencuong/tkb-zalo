/**
 * Thao tác thư mục cho người dùng: nhận tệp kéo thả, tạo / đổi tên / xoá thư mục,
 * liệt kê nội dung như trình quản lý tệp của Windows.
 *
 * Mọi thao tác đều BỊ GIỚI HẠN trong thư mục dữ liệu của app — không cho đụng chỗ khác.
 */
import fs from "node:fs";
import path from "node:path";
import { shell } from "electron";

const DUOI_NHAN = /\.(xlsx|xlsm|docx)$/i;

/** Chặn thoát khỏi thư mục gốc (kể cả bằng ".." hay liên kết). */
function trongGoc(goc, duongDan) {
  const a = path.resolve(goc), b = path.resolve(duongDan);
  return b === a || b.startsWith(a + path.sep);
}
function kiem(goc, duongDan) {
  if (!trongGoc(goc, duongDan)) throw new Error("Chỉ thao tác được trong thư mục dữ liệu của phần mềm.");
  return path.resolve(duongDan);
}

const tenHopLe = (s) => {
  const t = String(s || "").trim();
  if (!t) return "Tên không được để trống.";
  if (/[\\/:*?"<>|]/.test(t)) return 'Tên không được chứa \\ / : * ? " < > |';
  if (t === "." || t === "..") return "Tên không hợp lệ.";
  if (t.length > 80) return "Tên quá dài.";
  return "";
};

/** Chép các tệp người dùng kéo thả vào một thư mục (mặc định là hộp thư chờ). */
export function nhanTepThaVao(thuMucDich, dsDuongDan, goc) {
  const dich = kiem(goc, thuMucDich);
  fs.mkdirSync(dich, { recursive: true });
  const nhan = [], boQua = [];
  for (const p of dsDuongDan || []) {
    try {
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        // Kéo cả thư mục: lấy các tệp hợp lệ bên trong (một cấp)
        for (const e of fs.readdirSync(p, { withFileTypes: true })) {
          if (e.isFile() && DUOI_NHAN.test(e.name) && !e.name.startsWith("~$")) {
            fs.copyFileSync(path.join(p, e.name), path.join(dich, e.name));
            nhan.push(e.name);
          }
        }
        continue;
      }
      const ten = path.basename(p);
      if (!DUOI_NHAN.test(ten) || ten.startsWith("~$")) {
        boQua.push({ ten, ly_do: "Chỉ nhận tệp .xlsx và .docx" });
        continue;
      }
      fs.copyFileSync(p, path.join(dich, ten));
      nhan.push(ten);
    } catch (e) {
      boQua.push({ ten: path.basename(p), ly_do: String(e?.message || e) });
    }
  }
  return { ok: true, nhan, bo_qua: boQua, thu_muc: dich };
}

/** Liệt kê một thư mục: thư mục con trước, rồi tệp. */
export function liet(thuMuc, goc) {
  const t = kiem(goc, thuMuc);
  if (!fs.existsSync(t)) return { ok: false, loi: ["Thư mục không tồn tại."] };
  const muc = fs.readdirSync(t, { withFileTypes: true }).map((e) => {
    const p = path.join(t, e.name);
    let co = 0, luc = "";
    try { const st = fs.statSync(p); co = st.size; luc = st.mtime.toLocaleString("vi-VN"); } catch { /* */ }
    return {
      ten: e.name, duong_dan: p, la_thu_muc: e.isDirectory(),
      kich_thuoc: e.isDirectory() ? null : co, sua_luc: luc,
      dung_duoc: e.isDirectory() ? null : DUOI_NHAN.test(e.name) && !e.name.startsWith("~$"),
    };
  });
  muc.sort((a, b) => (b.la_thu_muc - a.la_thu_muc) || a.ten.localeCompare(b.ten, "vi"));
  const cha = path.dirname(t);
  return {
    ok: true, thu_muc: t, ten: path.basename(t),
    cha: trongGoc(goc, cha) && cha !== t ? cha : null,
    muc,
  };
}

export function taoThuMuc(thuMucCha, ten, goc) {
  const loi = tenHopLe(ten);
  if (loi) return { ok: false, loi: [loi] };
  const cha = kiem(goc, thuMucCha);
  const moi = path.join(cha, ten.trim());
  if (fs.existsSync(moi)) return { ok: false, loi: ["Đã có thư mục hoặc tệp tên này."] };
  fs.mkdirSync(moi, { recursive: true });
  return { ok: true, duong_dan: moi };
}

export function doiTen(duongDan, tenMoi, goc) {
  const loi = tenHopLe(tenMoi);
  if (loi) return { ok: false, loi: [loi] };
  const cu = kiem(goc, duongDan);
  if (path.resolve(cu) === path.resolve(goc)) return { ok: false, loi: ["Không đổi tên thư mục gốc được."] };
  const moi = path.join(path.dirname(cu), tenMoi.trim());
  if (fs.existsSync(moi)) return { ok: false, loi: ["Đã có thư mục hoặc tệp tên này."] };
  try { fs.renameSync(cu, moi); }
  catch (e) { return { ok: false, loi: ["Không đổi tên được: " + (e?.message || e) + ". Có thể tệp đang mở."] }; }
  return { ok: true, duong_dan: moi };
}

/** Xoá vào Thùng rác của Windows để người dùng còn lấy lại được. */
export async function xoa(duongDan, goc) {
  const p = kiem(goc, duongDan);
  if (path.resolve(p) === path.resolve(goc)) return { ok: false, loi: ["Không xoá thư mục gốc được."] };
  try { await shell.trashItem(p); return { ok: true, vao_thung_rac: true }; }
  catch {
    try {
      fs.rmSync(p, { recursive: true, force: true });
      return { ok: true, vao_thung_rac: false };
    } catch (e) {
      return { ok: false, loi: ["Không xoá được: " + (e?.message || e) + ". Có thể tệp đang mở."] };
    }
  }
}

/** Chuyển tệp sang thư mục khác (kéo thả trong app). */
export function chuyen(duongDan, thuMucDich, goc) {
  const nguon = kiem(goc, duongDan), dich = kiem(goc, thuMucDich);
  const moi = path.join(dich, path.basename(nguon));
  if (path.resolve(nguon) === path.resolve(moi)) return { ok: true, duong_dan: moi };
  if (fs.existsSync(moi)) return { ok: false, loi: ["Bên đó đã có tệp trùng tên."] };
  try { fs.renameSync(nguon, moi); }
  catch (e) { return { ok: false, loi: ["Không chuyển được: " + (e?.message || e)] }; }
  return { ok: true, duong_dan: moi };
}
