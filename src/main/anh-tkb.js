/**
 * Vẽ ảnh thời khoá biểu bằng chính Chromium của Electron (cửa sổ ẩn, chụp màn hình ngoài màn hình).
 *
 * Vì sao dùng offscreen + deviceScaleFactor: ảnh ra luôn đúng 2160 px bất kể máy người dùng
 * để tỉ lệ hiển thị 100 % hay 150 % — nếu chụp cửa sổ thường thì kích thước ảnh đổi theo máy.
 */
import fs from "node:fs";
import path from "node:path";
import { BrowserWindow } from "electron";
import { nhieu, mot, chay } from "./db.js";
import { duLieuAnhGv, duLieuAnhLop, vanTayAnh, dsGvCoTiet, dsLopCoTep, gomDangChon } from "./du-lieu-tep.js";

const RONG = 1080;          // bề ngang trang (px CSS) — ảnh xuất ra gấp đôi
const TI_LE = 2;

let cua = null;
let dangNap = null;

async function moCuaSo(duongDanHtml) {
  if (cua && !cua.isDestroyed()) return cua;
  if (dangNap) return dangNap;
  dangNap = (async () => {
    const w = new BrowserWindow({
      show: false, frame: false, width: RONG, height: 800,
      backgroundColor: "#F0EEE6",
      webPreferences: {
        offscreen: { deviceScaleFactor: TI_LE },
        backgroundThrottling: false,   // không có cờ này, cửa sổ ẩn bị bóp nhịp vẽ
        contextIsolation: true, sandbox: false, nodeIntegration: false,
        javascript: true, images: true,
      },
    });
    w.webContents.setFrameRate(20);
    // Nạp có thử lại: nếu vừa huỷ một cửa sổ vẽ trước đó, lần nạp đầu đôi khi trả ERR_FAILED.
    for (let lan = 1; ; lan++) {
      try { await w.loadFile(duongDanHtml); break; }
      catch (e) {
        if (lan >= 3) { try { w.destroy(); } catch { /* */ } throw e; }
        await new Promise((r) => setTimeout(r, 400 * lan));
      }
    }
    // HÂM NÓNG: bộ dựng ảnh ngoài màn hình chưa sẵn sàng ngay sau khi nạp trang —
    // lần capturePage() đầu tiên sẽ ném UnknownVizError. Chờ khung hình đầu rồi mới dùng.
    await new Promise((r) => {
      let xong = false;
      const kt = () => { if (!xong) { xong = true; r(); } };
      w.webContents.once("paint", kt);
      setTimeout(kt, 1500);
    });
    try { await w.webContents.capturePage(); } catch { /* lần chụp mồi, hỏng cũng không sao */ }
    cua = w;
    return w;
  })();
  try { return await dangNap; } finally { dangNap = null; }
}

/** Mở sẵn cửa sổ vẽ ẩn (dùng cho kịch bản tự kiểm lúc thoát app). */
export const hamNongCuaSoVe = (duongDanHtml) => moCuaSo(duongDanHtml);

export function dongCuaSoVe() {
  try { if (cua && !cua.isDestroyed()) cua.destroy(); } catch { /* */ }
  cua = null;
}

const doi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Vẽ một ảnh từ dữ liệu, ghi ra tệp PNG. → {duong_dan, width, height} */
export async function veMotAnh(duLieu, duongDanRa, duongDanHtml) {
  const w = await moCuaSo(duongDanHtml);
  const cao = await w.webContents.executeJavaScript(`window.veTKB(${JSON.stringify(duLieu)})`, true);
  const caoAn = Math.max(200, Math.min(6000, Math.ceil(Number(cao) || 800)));
  w.setContentSize(RONG, caoAn);

  // Chờ khung hình mới sau khi đổi kích thước, nếu không sẽ chụp đúng kích thước cũ
  await new Promise((r) => {
    let xong = false;
    const kt = () => { if (!xong) { xong = true; r(); } };
    w.webContents.once("paint", kt);
    setTimeout(kt, 700);
  });

  // Chụp có thử lại: đổi kích thước xong bộ dựng ảnh đôi khi cần thêm một nhịp.
  let anh = null, loiCuoi = null;
  for (let lan = 1; lan <= 4; lan++) {
    try {
      const a = await w.webContents.capturePage();
      if (!a.isEmpty()) { anh = a; break; }
      loiCuoi = new Error("ảnh rỗng");
    } catch (e) { loiCuoi = e; }
    await doi(250 * lan);
  }
  if (!anh) {
    throw new Error("Không chụp được ảnh thời khoá biểu sau 4 lần thử" + (loiCuoi ? ` (${loiCuoi.message})` : "") + ".");
  }

  fs.mkdirSync(path.dirname(duongDanRa), { recursive: true });
  fs.writeFileSync(duongDanRa, anh.toPNG());
  // getSize() ở chế độ ngoài màn hình đã trả về SỐ ĐIỂM ẢNH THẬT (đã nhân deviceScaleFactor).
  const kt = anh.getSize();
  return { duong_dan: duongDanRa, width: kt.width, height: kt.height };
}

const tenAnToan = (s) => String(s).replace(/[\\/:*?"<>|]/g, "_").trim() || "khong_ten";

/**
 * Chuẩn bị ảnh cho cả một thời khoá biểu (giáo viên + lớp).
 * @param {number} tkbId
 * @param {{thuMuc:string, html:string, gom?:string, onTienDo?:Function, veLai?:boolean}} p
 */
export async function chuanBiAnh(tkbId, p) {
  const tkb = mot("SELECT * FROM tkb WHERE id=?", tkbId);
  if (!tkb) throw new Error("Không tìm thấy thời khoá biểu.");
  const gom = p.gom || gomDangChon();
  const thuMucAnh = path.join(p.thuMuc || tkb.thu_muc || ".", "anh");
  fs.mkdirSync(thuMucAnh, { recursive: true });

  const dsGv = dsGvCoTiet(tkbId);
  const dsLop = dsLopCoTep(tkbId);
  const tong = dsGv.length + dsLop.length;
  let da = 0, taoMoi = 0, boQua = 0;
  const loi = [];

  for (const g of dsGv) {
    const f = path.join(thuMucAnh, "GV_" + tenAnToan(g.ma_trong_tkb || g.ho_ten_pcgd) + ".png");
    try {
      // Còn mới (đủ tệp, vân tay số liệu khớp) thì thôi; lệch là đã cũ → vẽ lại, ghi đè đúng tên.
      const d = duLieuAnhGv(tkb, g, gom), vt = vanTayAnh(d);
      if (!p.veLai && fs.existsSync(f) && g.anh_path === f && g.anh_vt === vt) { boQua++; }
      else {
        const r = await veMotAnh(d, f, p.html);
        chay("UPDATE tkb_gv SET anh_path=?, anh_vt=? WHERE id=?", r.duong_dan, vt, g.id);
        taoMoi++;
      }
      if (g.anh_path !== f) chay("UPDATE tkb_gv SET anh_path=? WHERE id=?", f, g.id);
    } catch (e) { loi.push(`Giáo viên ${g.ho_ten || g.ma_trong_tkb}: ${e.message}`); }
    p.onTienDo?.({ da: ++da, tong, ten: g.ho_ten || g.ma_trong_tkb, loai: "gv" });
  }
  for (const l of dsLop) {
    const f = path.join(thuMucAnh, "LOP_" + tenAnToan(l.lop) + ".png");
    try {
      const d = duLieuAnhLop(tkb, l, gom), vt = vanTayAnh(d);
      if (!p.veLai && fs.existsSync(f) && l.anh_path === f && l.anh_vt === vt) { boQua++; }
      else {
        const r = await veMotAnh(d, f, p.html);
        chay("UPDATE tkb_lop SET anh_path=?, anh_vt=? WHERE id=?", r.duong_dan, vt, l.id);
        taoMoi++;
      }
      if (l.anh_path !== f) chay("UPDATE tkb_lop SET anh_path=? WHERE id=?", f, l.id);
    } catch (e) { loi.push(`Lớp ${l.lop}: ${e.message}`); }
    p.onTienDo?.({ da: ++da, tong, ten: "Lớp " + l.lop, loai: "lop" });
  }

  // CỐ Ý không huỷ cửa sổ vẽ ở đây: huỷ rồi tạo lại ngay làm lần nạp trang sau thất bại
  // (ERR_FAILED) và treo cả tiến trình. Cửa sổ chỉ bị huỷ khi thoát phần mềm.
  return { ok: loi.length === 0, tong, tao_moi: taoMoi, bo_qua: boQua, loi, thu_muc: thuMucAnh };
}

/** Vẽ một ảnh xem trước rồi trả về dạng data URL (không ghi vào kho). */
export async function xemTruocAnh(tkbId, { loai, ma, gom = gomDangChon(), html, thuMucTam }) {
  const tkb = mot("SELECT * FROM tkb WHERE id=?", tkbId);
  if (!tkb) throw new Error("Không tìm thấy thời khoá biểu.");
  let d;
  if (loai === "lop") {
    const l = mot(
      `SELECT l.*, v.ho_ten gvcn_ten FROM tkb_lop l LEFT JOIN giao_vien v ON v.id=l.giao_vien_id
       WHERE l.tkb_id=? AND upper(l.lop)=upper(?)`, tkbId, ma
    );
    if (!l) throw new Error("Không tìm thấy lớp " + ma);
    d = duLieuAnhLop(tkb, l, gom);
  } else {
    const g = mot(
      `SELECT g.*, v.ho_ten FROM tkb_gv g LEFT JOIN giao_vien v ON v.id=g.giao_vien_id
       WHERE g.tkb_id=? AND (lower(g.ma_trong_tkb)=lower(?) OR g.giao_vien_id=?)`, tkbId, ma, Number(ma) || -1
    );
    if (!g) throw new Error("Không tìm thấy giáo viên " + ma);
    d = duLieuAnhGv(tkb, g, gom);
  }
  const f = path.join(thuMucTam, `xem-truoc-${Date.now()}.png`);
  const r = await veMotAnh(d, f, html);
  const base64 = fs.readFileSync(f).toString("base64");
  try { fs.unlinkSync(f); } catch { /* */ }
  return { anh: "data:image/png;base64," + base64, width: r.width, height: r.height };
}
