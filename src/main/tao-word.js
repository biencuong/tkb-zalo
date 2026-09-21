/**
 * TỰ TẠO FILE WORD thời khoá biểu cho từng giáo viên và từng lớp, ĐÚNG MẪU Word của Smart Scheduler,
 * thẳng từ dữ liệu tệp Excel — khỏi phải xuất Word từ Smart Scheduler.
 *
 * Khuôn (src/main/mau-word/{gv,lop}-{a4,a5}.docx) là MỘT bảng cắt từ chính tệp Word Smart Scheduler
 * xuất ra, mọi chữ đã thay bằng ô giữ chỗ {{…}} (scripts/tao-khuon-word.mjs). Nhờ vậy giữ nguyên phông,
 * khung, độ rộng cột, ô gộp — và khuôn không mang theo tên người thật nào.
 *
 * Bảng mẫu 18 hàng: 0–2 tiêu đề (trường · năm học · học kỳ | THỜI KHOÁ BIỂU / Giáo viên X / ngày | Số N),
 * 3 trống, 4 "Buổi sáng", 5 THỨ 2…7, 6–10 tiết 1–5, 11 "Buổi chiều", 12 THỨ, 13–17 tiết 1–5.
 * Ô tiết ghi "Môn - Lớp" (giáo viên) hoặc "Môn - Mã GV" (lớp).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { mot, nhieu, chay, layCaiDat } from "./db.js";

const THU_MUC_KHUON = path.join(path.dirname(fileURLToPath(import.meta.url)), "mau-word");
export const SO_TIET = 5;
export const THU = [2, 3, 4, 5, 6, 7];

const escXml = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const tenTep = (s) => String(s || "khong-ten").replace(/[\\/:*?"<>|]/g, "_").trim() || "khong-ten";

// ------------------------------------------------------------------ DỰNG KHUÔN (chạy lúc phát triển)

const MAU_TR = /<w:tr\b[\s\S]*?<\/w:tr>/g;
const MAU_TC = /<w:tc>[\s\S]*?<\/w:tc>/g;
const MAU_P = /<w:p\b[^>]*>[\s\S]*?<\/w:p>|<w:p\b[^>]*\/>/g;
const MAU_R = /<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;

/** Thay chữ của đoạn thứ i trong một ô bằng `chu`, giữ định dạng chữ của đoạn đó. */
function datChuDoan(pXml, chu) {
  const rPr = (pXml.match(/<w:pPr>[\s\S]*?(<w:rPr>[\s\S]*?<\/w:rPr>)[\s\S]*?<\/w:pPr>/) || [])[1] || "";
  let p = pXml.replace(MAU_R, "").replace(/<w:proofErr\b[^>]*\/>/g, "");
  if (p.endsWith("/>")) p = p.replace(/\/>$/, "></w:p>");
  const chay1 = chu === null ? "" : `<w:r>${rPr}<w:t xml:space="preserve">${chu}</w:t></w:r>`;
  return p.replace(/<\/w:p>$/, chay1 + "</w:p>");
}

/** Đặt chữ cho các đoạn trong một ô: dsChu[i] cho đoạn i (null = để trống). */
function datChuO(tcXml, dsChu) {
  let i = 0;
  return tcXml.replace(MAU_P, (p) => {
    const chu = i < dsChu.length ? dsChu[i] : null;
    i++;
    return datChuDoan(p, chu);
  });
}

/**
 * Biến một tệp Word MỘT bảng (cắt từ Smart Scheduler) thành khuôn có ô giữ chỗ.
 * Ném lỗi nếu bảng không đúng dáng 18 hàng như mẫu — thà dừng còn hơn ra khuôn sai.
 */
export async function dungKhuon(bufMotBang) {
  const zip = await JSZip.loadAsync(bufMotBang);
  const xml = await zip.file("word/document.xml").async("string");
  const tbl = xml.match(/<w:tbl>[\s\S]*<\/w:tbl>/);
  if (!tbl) throw new Error("Tệp mẫu không có bảng.");
  const hang = tbl[0].match(MAU_TR) || [];
  if (hang.length !== 18) throw new Error(`Bảng mẫu có ${hang.length} hàng, cần đúng 18 như mẫu Smart Scheduler.`);

  const hangMoi = hang.map((tr, r) => {
    const o = tr.match(MAU_TC) || [];
    const sua = (ci, dsChu) => { o[ci] = datChuO(o[ci], dsChu); };
    if (r === 0) {
      if (o.length < 3) throw new Error("Hàng tiêu đề không đủ 3 ô.");
      sua(0, ["{{TRUONG}}", "{{DONG_NAM_HOC}}", "{{DONG_HOC_KY}}"]);
      sua(o.length - 1, ["{{DONG_SO}}"]);
    } else if (r === 1) {
      sua(1, ["{{TIEU_DE}}"]);
    } else if (r === 2) {
      sua(1, ["{{DONG_NGAY}}"]);
    } else if ((r >= 6 && r <= 10) || (r >= 13 && r <= 17)) {
      if (o.length !== THU.length) throw new Error(`Hàng ${r} có ${o.length} ô, cần ${THU.length}.`);
      const buoi = r <= 10 ? "S" : "C";
      const tiet = r <= 10 ? r - 5 : r - 12;
      o.forEach((_, ci) => sua(ci, [`{{${buoi}_${THU[ci]}_${tiet}}}`]));
    } else {
      return tr;    // hàng trống, "Buổi sáng/chiều", "THỨ 2…7": giữ nguyên
    }
    let k = 0;
    return tr.replace(MAU_TC, () => o[k++]);
  });

  let k = 0;
  const tblMoi = tbl[0].replace(MAU_TR, () => hangMoi[k++]);
  zip.file("word/document.xml", xml.replace(tbl[0], tblMoi));

  // Bỏ dấu vết người soạn tệp gốc.
  const core = zip.file("docProps/core.xml");
  if (core) {
    zip.file("docProps/core.xml", (await core.async("string"))
      .replace(/<dc:creator>[\s\S]*?<\/dc:creator>/, "<dc:creator>TKB Zalo</dc:creator>")
      .replace(/<cp:lastModifiedBy>[\s\S]*?<\/cp:lastModifiedBy>/, "<cp:lastModifiedBy>TKB Zalo</cp:lastModifiedBy>")
      .replace(/<dc:title>[\s\S]*?<\/dc:title>/, "<dc:title>Thời khoá biểu</dc:title>"));
  }
  const appXml = zip.file("docProps/app.xml");
  if (appXml) {
    zip.file("docProps/app.xml", (await appXml.async("string")).replace(/<Company>[\s\S]*?<\/Company>/, "<Company></Company>"));
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

// ------------------------------------------------------------------ ĐIỀN KHUÔN

const boNhoKhuon = new Map();
function docKhuon(loai, khoGiay) {
  const ten = `${loai}-${String(khoGiay || "A4").toLowerCase() === "a5" ? "a5" : "a4"}.docx`;
  if (!boNhoKhuon.has(ten)) boNhoKhuon.set(ten, fs.readFileSync(path.join(THU_MUC_KHUON, ten)));
  return boNhoKhuon.get(ten);
}

/** Điền giá trị vào khuôn. giaTri: { TRUONG, TIEU_DE, …, "S_2_1": "Toán - 6A1", … } */
export async function dienKhuon(bufKhuon, giaTri) {
  const zip = await JSZip.loadAsync(bufKhuon);
  const xml = await zip.file("word/document.xml").async("string");
  zip.file("word/document.xml", xml.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => escXml(giaTri[k] ?? "")));
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

/** "2025-08-18" → "(Thực hiện từ ngày 18 tháng 08 năm 2025)" — đúng lối ghi của Smart Scheduler. */
function dongNgay(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `(Thực hiện từ ngày ${m[3]} tháng ${m[2]} năm ${m[1]})` : "";
}

/** Giá trị phần tiêu đề dùng chung cho mọi tệp của một thời khoá biểu. */
function tieuDeChung(tkb) {
  const truong = layCaiDat("ten_truong") || tkb.ten_truong || "";
  return {
    TRUONG: truong,
    DONG_NAM_HOC: tkb.nam_hoc ? "Năm học " + String(tkb.nam_hoc).replace(/\s*-\s*/, " - ") : "",
    DONG_HOC_KY: tkb.hoc_ky ? "Học kỳ " + tkb.hoc_ky : "",
    DONG_SO: tkb.so_tkb != null ? "Số " + tkb.so_tkb : "",
    DONG_NGAY: dongNgay(tkb.ngay_ap_dung),
  };
}

/** Gom các tiết vào ô {{S_thu_tiet}} / {{C_thu_tiet}}. Trả thêm các tiết nằm ngoài khuôn (nếu có). */
function oTiet(dsTiet, chuO) {
  const o = {};
  const ngoai = [];
  for (const t of dsTiet) {
    const buoi = t.buoi === "C" ? "C" : "S";
    if (!THU.includes(Number(t.thu)) || Number(t.tiet) < 1 || Number(t.tiet) > SO_TIET) { ngoai.push(t); continue; }
    const k = `${buoi}_${t.thu}_${t.tiet}`;
    o[k] = o[k] ? o[k] + ", " + chuO(t) : chuO(t);
  }
  return { o, ngoai };
}

/** Tệp nằm trong thư mục Word tự tạo (để phân biệt với tệp cắt từ Word của Smart Scheduler). */
const laTepTuTao = (f) => /[\\/]word[\\/](gv|lop)[\\/]/i.test(String(f || ""));

export const KHO = ["A4", "A5"];
const cotKho = (kho) => (kho === "A5" ? "docx_a5" : "docx_a4");

/**
 * Tạo file Word CẢ HAI KHỔ (A4 và A5) cho mọi giáo viên có tiết và mọi lớp của một thời khoá biểu.
 * Tên tệp có đuôi _A4 / _A5 để người nhận cả hai không bị trùng tên.
 * Không đụng tệp đã cắt từ Word của Smart Scheduler. veLai = tạo lại cả tệp tự tạo cũ.
 * khoUuTien: khổ ghi vào docx_path (bản mặc định khi không chọn khổ).
 * → { ok, tong, tao_moi, bo_qua, loi[], canh_bao[] }
 */
export async function taoWordTuDuLieu(tkbId, { thuMuc, khoUuTien = "A4", veLai = false, onTienDo } = {}) {
  const tkb = mot("SELECT * FROM tkb WHERE id=?", tkbId);
  if (!tkb) return { ok: false, loi: ["Không tìm thấy thời khoá biểu."] };
  const goc = path.join(thuMuc || tkb.thu_muc || ".", "word");
  const chung = tieuDeChung(tkb);
  const uuTien = String(khoUuTien).toUpperCase() === "A5" ? "A5" : "A4";

  const dsGv = nhieu(
    `SELECT id, giao_vien_id, ma_trong_tkb, ho_ten_pcgd, docx_path, docx_a4, docx_a5 FROM tkb_gv
     WHERE tkb_id=? AND giao_vien_id IS NOT NULL AND so_tiet_dem>0`, tkbId);
  const dsLop = nhieu("SELECT id, lop, docx_path, docx_a4, docx_a5 FROM tkb_lop WHERE tkb_id=? ORDER BY lop", tkbId);
  const tong = dsGv.length + dsLop.length;
  let da = 0, taoMoi = 0, boQua = 0;
  const loi = [], canhBao = [];

  const canTao = (f) => {
    if (!f || !fs.existsSync(f)) return true;         // chưa có tệp
    if (!laTepTuTao(f)) return false;                 // tệp cắt từ Word Smart Scheduler: giữ nguyên
    return veLai;                                     // tệp tự tạo: chỉ tạo lại khi được yêu cầu
  };

  /** Tạo các khổ còn thiếu cho một dòng, rồi đặt docx_path = khổ ưu tiên. */
  const taoChoDong = async (bang, dong, loai, ten, tieuDe, dsTiet, chuO) => {
    const { o, ngoai } = oTiet(dsTiet, chuO);
    if (ngoai.length) canhBao.push(`${ten}: ${ngoai.length} tiết ngoài khuôn (tiết > ${SO_TIET} hoặc Chủ nhật) không in được.`);
    const tep = { A4: dong.docx_a4 || "", A5: dong.docx_a5 || "" };
    for (const kho of KHO) {
      if (!canTao(tep[kho])) { boQua++; continue; }
      const buf = await dienKhuon(docKhuon(loai, kho), { ...chung, TIEU_DE: tieuDe, ...o });
      const f = path.join(goc, loai, `${tenTep(loai === "gv" ? dong.ma_trong_tkb || dong.ho_ten_pcgd : dong.lop)}_${kho}.docx`);
      fs.writeFileSync(f, buf);
      chay(`UPDATE ${bang} SET ${cotKho(kho)}=? WHERE id=?`, f, dong.id);
      tep[kho] = f;
      taoMoi++;
    }
    // Bản mặc định: giữ tệp Smart Scheduler nếu có, không thì lấy khổ ưu tiên.
    if (!dong.docx_path || laTepTuTao(dong.docx_path) || !fs.existsSync(dong.docx_path)) {
      chay(`UPDATE ${bang} SET docx_path=? WHERE id=?`, tep[uuTien] || tep.A4 || tep.A5, dong.id);
    }
  };

  fs.mkdirSync(path.join(goc, "gv"), { recursive: true });
  fs.mkdirSync(path.join(goc, "lop"), { recursive: true });

  for (const g of dsGv) {
    const ma = g.ma_trong_tkb || g.ho_ten_pcgd;
    try {
      const tiet = nhieu("SELECT thu,buoi,tiet,lop,mon FROM tiet WHERE tkb_id=? AND giao_vien_id=?", tkbId, g.giao_vien_id);
      await taoChoDong("tkb_gv", g, "gv", "Giáo viên " + ma, "Giáo viên " + ma, tiet, (t) => `${t.mon} - ${t.lop}`);
    } catch (e) { loi.push(`Giáo viên ${ma}: ${e.message}`); }
    onTienDo?.({ da: ++da, tong, ten: ma, loai: "word" });
  }
  for (const l of dsLop) {
    try {
      const tiet = nhieu("SELECT thu,buoi,tiet,mon,ma_gv FROM tiet WHERE tkb_id=? AND upper(lop)=upper(?)", tkbId, l.lop);
      await taoChoDong("tkb_lop", l, "lop", "Lớp " + l.lop, "Lớp " + l.lop, tiet, (t) => `${t.mon} - ${t.ma_gv}`);
    } catch (e) { loi.push(`Lớp ${l.lop}: ${e.message}`); }
    onTienDo?.({ da: ++da, tong, ten: "Lớp " + l.lop, loai: "word" });
  }

  return { ok: loi.length === 0, tong, tao_moi: taoMoi, bo_qua: boQua, loi, canh_bao: canhBao, thu_muc: goc };
}
