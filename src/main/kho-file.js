/**
 * Kho tệp dữ liệu: thư mục chuẩn do app tạo sẵn, hộp thư "chờ xử lý" để người dùng thả tệp vào,
 * bộ KIỂM TRA tệp (đúng cấu trúc chưa, thiếu gì) và việc lưu tệp theo năm học + số TKB.
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { docTkbSs, docDsGv } from "./nhap-xlsx.js";
import { lietKeBang, khoGiay, tachBody } from "./cat-docx.js";
import { timTheoMa, timTheoTen } from "./kho-gv.js";
import { chuanHoaLop, chuanSdt } from "./khop.js";
import { nhieu } from "./db.js";
import crypto from "node:crypto";
import JSZip from "jszip";

export const TEN_THU_MUC_GOC = "TKB Zalo";
export const CHO_XU_LY = "1 - CHO XU LY (tha tep vao day)";
export const DU_LIEU = "2 - DU LIEU DA NHAP";
export const DS_GV = "3 - DANH SACH GIAO VIEN";
export const KET_XUAT = "4 - KET XUAT (Excel, PDF)";

/** Các loại tệp phần mềm hiểu được. */
const LOAI = { SS: "ss_xlsx", DSGV: "ds_gv_xlsx", DOCX_GV: "docx_gv", DOCX_LOP: "docx_lop", LA: "khong_ro" };

const HUONG_DAN_TXT = `THƯ MỤC DỮ LIỆU CỦA PHẦN MỀM TKB ZALO
=======================================

Thư mục này do phần mềm tạo sẵn. Cứ để nguyên cấu trúc, đừng đổi tên các thư mục.

1 - CHO XU LY (tha tep vao day)
   Đây là "hộp thư vào". Chép (hoặc kéo thả) các tệp vừa xuất từ phần mềm xếp thời khoá biểu
   vào đây, rồi mở TKB Zalo bấm "Quét thư mục chờ xử lý" — phần mềm tự nhận ra từng tệp là gì,
   kiểm tra đủ dữ liệu chưa và hỏi bạn có nhập hay không.

   Nên chép đủ 3 tệp cho mỗi lần phát hành thời khoá biểu:
     - Tệp Excel tổng (tên thường bắt đầu bằng SS. ...xlsx) — BẮT BUỘC
     - Tệp Word thời khoá biểu GIÁO VIÊN (khổ A4 hoặc A5)
     - Tệp Word thời khoá biểu LỚP (khổ A4 hoặc A5)

2 - DU LIEU DA NHAP
   Phần mềm tự cất tệp gốc vào đây theo năm học và số thời khoá biểu, ví dụ:
     2 - DU LIEU DA NHAP\\2025-2026\\So 01\\
   Bạn cũng có thể tự chép sẵn tệp vào đúng thư mục theo mẫu đó cho nhanh; phần mềm đọc được ngay.
   Trong mỗi thư mục "So xx" còn có:
     gv\\   — thời khoá biểu Word cắt riêng từng giáo viên
     lop\\  — thời khoá biểu Word cắt riêng từng lớp
     anh\\  — ảnh thời khoá biểu để gửi Zalo

3 - DANH SACH GIAO VIEN
   Để tệp Excel danh sách giáo viên (họ tên, mã giáo viên, số điện thoại) ở đây.

4 - KET XUAT (Excel, PDF)
   Nơi phần mềm lưu các bảng thống kê bạn xuất ra.

LƯU Ý: đừng để tệp Word đang mở trong Microsoft Word khi nhập — Windows khoá tệp, phần mềm sẽ báo lỗi.
`;

/** Tạo (nếu chưa có) toàn bộ cây thư mục chuẩn. */
export function taoThuMucChuan(thuMucGoc) {
  const g = thuMucGoc;
  for (const t of [g, path.join(g, CHO_XU_LY), path.join(g, DU_LIEU), path.join(g, DS_GV), path.join(g, KET_XUAT)]) {
    fs.mkdirSync(t, { recursive: true });
  }
  const hd = path.join(g, "HUONG DAN THU MUC.txt");
  if (!fs.existsSync(hd)) fs.writeFileSync(hd, HUONG_DAN_TXT, "utf8");
  return {
    goc: g,
    cho_xu_ly: path.join(g, CHO_XU_LY),
    du_lieu: path.join(g, DU_LIEU),
    ds_gv: path.join(g, DS_GV),
    ket_xuat: path.join(g, KET_XUAT),
    huong_dan: hd,
  };
}

export const KHONG_RO = "KHONG DUNG DINH DANG";

/** Bỏ ký tự Windows không cho đặt tên tệp. */
const tenSach = (s) => String(s || "").replace(/[\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();

/**
 * TÊN CHUẨN cho tệp dữ liệu. Nhìn tên là biết ngay của năm nào, thời khoá biểu số mấy, loại gì.
 *   Tổng hợp (Excel):  TKB-2025-2026-So-01-TONG.xlsx
 *   Word giáo viên:    TKB-2025-2026-So-01-GV-A4.docx
 *   Word lớp:          TKB-2025-2026-So-01-LOP-A5.docx
 *   Danh sách giáo viên: DS-GV.xlsx
 * Thiếu năm học hay số thì ghi CHUA-RO, vẫn nhập được, chỉ là tên chưa đẹp.
 */
export function tenChuan(loai, thongTin = {}, duoi = ".xlsx") {
  if (loai === LOAI.DSGV) return "DS-GV" + duoi;
  const nam = tenSach(thongTin.nam_hoc) || "CHUA-RO";
  const so = thongTin.so_tkb != null && thongTin.so_tkb !== "" ? String(thongTin.so_tkb).padStart(2, "0") : "CHUA-RO";
  const goc = `TKB-${nam}-So-${so}`;
  if (loai === LOAI.SS) return `${goc}-TONG${duoi}`;
  const kho = tenSach(thongTin.kho_giay) || "";
  if (loai === LOAI.DOCX_GV) return `${goc}-GV${kho ? "-" + kho : ""}${duoi}`;
  if (loai === LOAI.DOCX_LOP) return `${goc}-LOP${kho ? "-" + kho : ""}${duoi}`;
  return tenSach(thongTin.ten_goc) || "tep" + duoi;
}

/** Tệp này dùng vào việc gì, và thiếu nó thì mất gì. Nói thẳng để người dùng khỏi chuẩn bị thừa. */
const TAC_DUNG = {
  [LOAI.SS]: { can: "bat_buoc", chu: "Bắt buộc — toàn bộ tiết học và bảng phân công lấy từ đây. Ảnh thời khoá biểu cũng vẽ từ tệp này." },
  [LOAI.DSGV]: { can: "nen_co", chu: "Nên có — lấy sẵn số điện thoại. Không có cũng được, phần mềm tạo giáo viên từ bảng phân công rồi bạn điền số sau." },
  [LOAI.DOCX_GV]: { can: "tuy_chon", chu: "Tuỳ chọn — chỉ để cắt bản in cho giáo viên tải về. Không có thì họ vẫn nhận ảnh đầy đủ." },
  [LOAI.DOCX_LOP]: { can: "tuy_chon", chu: "Tuỳ chọn — chỉ để cắt bản in thời khoá biểu lớp. Không có thì chủ nhiệm vẫn nhận ảnh." },
  [LOAI.LA]: { can: "khong_can", chu: "Không dùng được — phần mềm chỉ đọc Excel tổng, Excel danh sách giáo viên và Word thời khoá biểu." },
};

const CHU_LOAI = {
  [LOAI.SS]: "Excel tổng hợp thời khoá biểu",
  [LOAI.DSGV]: "Danh sách giáo viên",
  [LOAI.DOCX_GV]: "Word thời khoá biểu giáo viên",
  [LOAI.DOCX_LOP]: "Word thời khoá biểu lớp",
  [LOAI.LA]: "Không nhận ra",
};

/** Mã băm nội dung tệp — dùng để biết hai tệp có y hệt nhau không. */
function bamTep(duongDan) {
  try { return crypto.createHash("sha256").update(fs.readFileSync(duongDan)).digest("hex"); }
  catch { return ""; }
}

/** Tìm trong thư mục xem đã có tệp nào NỘI DUNG y hệt chưa (dù tên khác). */
function timTrungNoiDung(thuMuc, bam, duoi) {
  if (!bam || !fs.existsSync(thuMuc)) return "";
  for (const e of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    if (!e.isFile() || path.extname(e.name).toLowerCase() !== duoi) continue;
    if (bamTep(path.join(thuMuc, e.name)) === bam) return e.name;
  }
  return "";
}

/** Tên tệp chưa dùng: thêm (2), (3)… nếu đã có tệp khác cùng tên. */
function tenChuaDung(thuMuc, ten) {
  const e = path.extname(ten), g = path.basename(ten, e);
  let t = ten;
  for (let i = 2; fs.existsSync(path.join(thuMuc, t)); i++) t = `${g} (${i})${e}`;
  return t;
}

/**
 * NHẬN TỆP KÉO THẢ — tự phân loại theo NỘI DUNG, tự đặt tên chuẩn, tự cất đúng thư mục.
 *
 * - Danh sách giáo viên  → "3 - DANH SACH GIAO VIEN", tên DS-GV.xlsx (thay tệp cũ).
 * - Excel tổng + Word TKB → thư mục chờ xử lý, tên chuẩn theo năm học và số thời khoá biểu.
 *   Tệp Word không tự nói được nó thuộc thời khoá biểu số mấy, nên lấy theo tệp Excel tổng
 *   thả cùng lượt; không có thì ghi CHUA-RO.
 * - Không nhận ra → thư mục con "KHONG DUNG DINH DANG", giữ nguyên tên, báo rõ vì sao.
 *
 * Trả về BÁO CÁO ĐỦ TRẠNG THÁI cho từng tệp: nhận hay không, thành gì, đặt tên gì, để ở đâu,
 * kiểm tra nội dung ra sao, thiếu gì.
 */
export async function xepTepVaoKho(dsDuongDan, duongDan) {
  const thuMucCho = duongDan.cho_xu_ly;
  const thuMucGv = duongDan.ds_gv;
  fs.mkdirSync(thuMucCho, { recursive: true });
  fs.mkdirSync(thuMucGv, { recursive: true });

  // Bung thư mục thành các tệp bên trong (một cấp) để người dùng kéo cả thư mục cũng được.
  const tep = [];
  for (const p of dsDuongDan || []) {
    try {
      if (fs.statSync(p).isDirectory()) {
        for (const e of fs.readdirSync(p, { withFileTypes: true })) {
          if (e.isFile() && !e.name.startsWith("~$")) tep.push(path.join(p, e.name));
        }
      } else tep.push(p);
    } catch { tep.push(p); }
  }

  // Bước 1: soi nội dung từng tệp.
  const soi = [];
  for (const p of tep) {
    const ten = path.basename(p);
    if (ten.startsWith("~$")) {
      soi.push({ duong_dan: p, ten_goc: ten, loai: LOAI.LA, bo_qua: "Tệp tạm của Word/Excel, không phải dữ liệu." });
      continue;
    }
    if (!/\.(xlsx|xlsm|docx)$/i.test(ten)) {
      soi.push({ duong_dan: p, ten_goc: ten, loai: LOAI.LA, bo_qua: "Phần mềm chỉ nhận tệp .xlsx và .docx." });
      continue;
    }
    try {
      soi.push({ duong_dan: p, ten_goc: ten, bam: bamTep(p), ...(await kiemTraTep(p)) });
    } catch (e) {
      soi.push({ duong_dan: p, ten_goc: ten, loai: LOAI.LA, bo_qua: "Không mở được tệp: " + String(e?.message || e) });
    }
  }

  // Bước 2: tệp Word mượn năm học + số thời khoá biểu của tệp Excel tổng thả cùng lượt.
  const ss = soi.find((x) => x.loai === LOAI.SS && x.thong_tin?.so_tkb != null);
  const boSung = ss ? { nam_hoc: ss.thong_tin.nam_hoc, so_tkb: ss.thong_tin.so_tkb } : {};

  // Bước 3: cất từng tệp vào đúng chỗ với tên chuẩn.
  const bao = [];
  for (const x of soi) {
    const duoi = path.extname(x.ten_goc).toLowerCase();
    const muc = {
      ten_goc: x.ten_goc, loai: x.loai, chu_loai: CHU_LOAI[x.loai] || x.loai,
      can: TAC_DUNG[x.loai]?.can || "khong_can", tac_dung: TAC_DUNG[x.loai]?.chu || "",
      dat: false, ten_moi: "", thu_muc: "", noi: "", ghi_de: false,
      dung_duoc: Boolean(x.dung_duoc), tom_tat: x.tom_tat || "",
      kiem: x.kiem || [], thong_tin: x.thong_tin || {},
    };

    if (x.bo_qua || x.loai === LOAI.LA) {
      const dich = path.join(thuMucCho, KHONG_RO);
      try {
        fs.mkdirSync(dich, { recursive: true });
        const bamLa = x.bam || bamTep(x.duong_dan);
        const daCo = timTrungNoiDung(dich, bamLa, path.extname(x.ten_goc).toLowerCase());
        if (daCo) {
          Object.assign(muc, { trung: true, ten_moi: daCo, thu_muc: dich, noi: path.join(CHO_XU_LY, KHONG_RO) });
        } else {
          const ten = tenChuaDung(dich, tenSach(x.ten_goc));
          fs.copyFileSync(x.duong_dan, path.join(dich, ten));
          Object.assign(muc, { ten_moi: ten, thu_muc: dich, noi: path.join(CHO_XU_LY, KHONG_RO) });
        }
      } catch (e) { muc.loi = String(e?.message || e); }
      muc.ly_do = x.bo_qua || (x.kiem || []).find((k) => k.muc === "loi")?.noi_dung
        || "Không nhận ra đây là dữ liệu thời khoá biểu.";
      bao.push(muc);
      continue;
    }

    const laDsGv = x.loai === LOAI.DSGV;
    const dich = laDsGv ? thuMucGv : thuMucCho;
    const tt = { ...(x.thong_tin || {}), ...(x.loai === LOAI.SS ? {} : boSung), ten_goc: x.ten_goc };
    const ten = tenChuan(x.loai, tt, duoi);
    const bam = x.bam || bamTep(x.duong_dan);

    // Thả hai lần cùng một tệp trong cùng lượt thì chỉ lấy một.
    const daCoTrongLuot = bao.find((b) => b.dat && b.bam && b.bam === bam);
    if (daCoTrongLuot) {
      Object.assign(muc, {
        trung: true, ten_moi: daCoTrongLuot.ten_moi, thu_muc: daCoTrongLuot.thu_muc, noi: daCoTrongLuot.noi,
        ly_do: `Trùng y hệt tệp "${daCoTrongLuot.ten_goc}" vừa nhận trong lượt này — không lưu thêm.`,
      });
      bao.push(muc);
      continue;
    }

    // Đã có sẵn trong kho một tệp nội dung y hệt (dù tên khác) thì thôi, khỏi lưu thừa.
    const trungCu = timTrungNoiDung(dich, bam, duoi);
    if (trungCu) {
      Object.assign(muc, {
        trung: true, ten_moi: trungCu, thu_muc: dich, noi: laDsGv ? DS_GV : CHO_XU_LY, bam,
        ly_do: `Trong kho đã có tệp nội dung y hệt ("${trungCu}") — không lưu thêm bản nữa.`,
      });
      bao.push(muc);
      continue;
    }

    try {
      const dd = path.join(dich, ten);
      // Cùng loại, cùng số mà nội dung khác thì đây là bản xuất lại — thay tệp cũ, giữ hai bản chỉ tổ rối.
      muc.ghi_de = fs.existsSync(dd);
      fs.copyFileSync(x.duong_dan, dd);
      Object.assign(muc, {
        dat: true, ten_moi: ten, thu_muc: dich, bam,
        noi: laDsGv ? DS_GV : CHO_XU_LY,
      });
    } catch (e) {
      muc.loi = "Không chép được: " + String(e?.message || e);
    }
    bao.push(muc);
  }

  const nhan = bao.filter((x) => x.dat);
  const coLoai = (l) => nhan.some((x) => x.loai === l) ;
  return {
    ok: true,
    bao_cao: bao,
    // Nói thẳng còn thiếu tệp nào THẬT SỰ cần, và tệp nào thả vào cũng chẳng để làm gì.
    thieu_bat_buoc: coLoai(LOAI.SS) ? [] : ["Excel tổng (SS….xlsx) — thiếu tệp này thì chưa nhập được gì"],
    thua: bao.filter((x) => x.can === "khong_can").map((x) => x.ten_goc),
    du_de_gui_anh: coLoai(LOAI.SS),
    so_nhan: nhan.length,
    so_trung: bao.filter((x) => x.trung).length,
    so_thay: nhan.filter((x) => x.ghi_de).length,
    so_bo_qua: bao.filter((x) => !x.dat && !x.trung).length,
    so_canh_bao: nhan.filter((x) => !x.dung_duoc).length,
    thieu_ss: nhan.some((x) => x.loai === LOAI.DOCX_GV || x.loai === LOAI.DOCX_LOP) && !ss,
    thu_muc_cho: thuMucCho,
  };
}

/**
 * Quét thư mục "3 - DANH SACH GIAO VIEN": tìm các tệp danh sách giáo viên,
 * kèm thời điểm sửa để biết tệp có MỚI hơn lần nạp trước không.
 */
export async function quetDsGv(thuMucDsGv) {
  fs.mkdirSync(thuMucDsGv, { recursive: true });
  const tep = fs.readdirSync(thuMucDsGv, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith("~$") && /\.(xlsx|xlsm)$/i.test(e.name))
    .map((e) => path.join(thuMucDsGv, e.name));

  const ds = [];
  for (const t of tep) {
    const k = await kiemTraTep(t);
    let sua = 0;
    try { sua = Math.round(fs.statSync(t).mtimeMs); } catch { /* */ }
    ds.push({ ...k, sua_luc_ms: sua });
  }
  ds.sort((a, b) => b.sua_luc_ms - a.sua_luc_ms);
  return {
    ok: true, thu_muc: thuMucDsGv,
    ds: ds.filter((x) => x.loai === LOAI.DSGV),
    khong_ro: ds.filter((x) => x.loai !== LOAI.DSGV),
  };
}

export const thuMucTkb = (goc, namHoc, soTkb) =>
  path.join(goc, DU_LIEU, (namHoc || "khac").replace(/[\\/:*?"<>|]/g, "-"), "So " + String(soTkb).padStart(2, "0"));

// ---------------------------------------------------------------- NHẬN DIỆN & KIỂM TRA


/** Đoán nhanh tệp là loại gì (chỉ nhìn phần đầu, không đọc hết). */
export async function nhanDien(duongDan) {
  const ext = path.extname(duongDan).toLowerCase();
  if (ext === ".xlsx" || ext === ".xlsm") {
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(duongDan);
      const ten = wb.worksheets.map((w) => w.name);
      if (ten.includes("PCGD") || ten.some((x) => x.startsWith("TKB_"))) return LOAI.SS;
      return LOAI.DSGV;
    } catch { return LOAI.LA; }
  }
  if (ext === ".docx") {
    try {
      const ds = await lietKeBang(fs.readFileSync(duongDan));
      const gv = ds.filter((x) => x.loai === "gv").length, lop = ds.filter((x) => x.loai === "lop").length;
      if (gv > lop) return LOAI.DOCX_GV;
      if (lop > 0) return LOAI.DOCX_LOP;
      return LOAI.LA;
    } catch { return LOAI.LA; }
  }
  return LOAI.LA;
}

const ok = (s) => ({ muc: "dat", noi_dung: s });
const canh = (s, cach = "") => ({ muc: "thieu", noi_dung: s, cach_sua: cach });
const hong = (s, cach = "") => ({ muc: "loi", noi_dung: s, cach_sua: cach });

/**
 * KIỂM TRA MỘT TỆP: đúng cấu trúc chưa, đủ dữ liệu chưa, thiếu gì.
 * → { loai, ten_tep, dung_cau_truc, dung_duoc, tom_tat, kiem:[{muc,noi_dung,cach_sua}], thong_tin }
 */
export async function kiemTraTep(duongDan, { loaiEp = null } = {}) {
  const ten = path.basename(duongDan);
  const kq = { duong_dan: duongDan, ten_tep: ten, loai: loaiEp || (await nhanDien(duongDan)), kiem: [], thong_tin: {} };

  if (!fs.existsSync(duongDan)) {
    kq.kiem.push(hong("Không tìm thấy tệp.", "Kiểm tra lại đường dẫn hoặc chép tệp vào thư mục chờ xử lý."));
    return ketLuan(kq);
  }
  const cỡ = fs.statSync(duongDan).size;
  kq.thong_tin.kich_thuoc = cỡ;
  if (cỡ === 0) { kq.kiem.push(hong("Tệp rỗng (0 byte).", "Xuất lại tệp từ phần mềm xếp thời khoá biểu.")); return ketLuan(kq); }

  if (kq.loai === LOAI.SS) return ketLuan(await kiemSs(duongDan, kq));
  if (kq.loai === LOAI.DSGV) return ketLuan(await kiemDsGv(duongDan, kq));
  if (kq.loai === LOAI.DOCX_GV || kq.loai === LOAI.DOCX_LOP) return ketLuan(await kiemDocx(duongDan, kq));

  kq.kiem.push(hong(
    "Không nhận ra tệp này là dữ liệu thời khoá biểu.",
    "Phần mềm chỉ đọc: tệp Excel xuất từ phần mềm xếp thời khoá biểu (có sheet PCGD), " +
    "tệp Excel danh sách giáo viên, và tệp Word thời khoá biểu giáo viên/lớp."
  ));
  return ketLuan(kq);
}

function ketLuan(kq) {
  const loi = kq.kiem.filter((k) => k.muc === "loi").length;
  const thieu = kq.kiem.filter((k) => k.muc === "thieu").length;
  kq.so_loi = loi; kq.so_thieu = thieu;
  kq.dung_cau_truc = loi === 0;
  kq.dung_duoc = loi === 0;
  kq.tom_tat = loi ? `Không dùng được: ${loi} lỗi.`
    : thieu ? `Dùng được nhưng thiếu ${thieu} mục — xem chi tiết bên dưới.`
    : "Tệp đầy đủ, dùng được ngay.";
  return kq;
}

async function kiemSs(duongDan, kq) {
  let d;
  try { d = await docTkbSs(duongDan); }
  catch (e) {
    kq.kiem.push(hong("Không đọc được: " + e.message,
      "Đây phải là tệp Excel xuất từ phần mềm xếp thời khoá biểu (Hệ thống › Chuyển đổi dữ liệu sang Excel)."));
    return kq;
  }
  const tt = d.thong_tin;
  kq.thong_tin = {
    ten_truong: tt.ten_truong, nam_hoc: tt.nam_hoc, hoc_ky: tt.hoc_ky, so_tkb: tt.so_tkb,
    ngay_ap_dung: tt.ngay_ap_dung, so_lop: d.lop.length, so_gv: d.pcgd.length, so_tiet: d.tiet.length,
    so_gvcn: d.lop.filter((l) => l.gvcn_ma).length + d.pcgd.filter((r) => r.cn).length ? undefined : 0,
  };
  const coCn = new Set([
    ...d.pcgd.filter((r) => r.cn).map((r) => chuanHoaLop(r.cn)),
    ...d.lop.filter((l) => l.gvcn_ma).map((l) => chuanHoaLop(l.ten)),
  ]);
  kq.thong_tin.so_gvcn = coCn.size;

  kq.kiem.push(ok(`Có bảng phân công giảng dạy (PCGD) với ${d.pcgd.length} giáo viên.`));
  kq.kiem.push(ok(`Có thời khoá biểu ${d.lop.length} lớp, tổng ${d.tiet.length} tiết.`));

  if (tt.so_tkb == null) kq.kiem.push(canh("Không đọc được SỐ thời khoá biểu.", "Bạn sẽ phải nhập số bằng tay khi nhập dữ liệu."));
  else kq.kiem.push(ok(`Thời khoá biểu số ${tt.so_tkb}.`));

  if (!tt.ngay_ap_dung) kq.kiem.push(canh("Không đọc được ngày thực hiện.", "Nhập ngày bằng tay khi nhập dữ liệu; ngày này dùng để tính số tuần khi thống kê."));
  else kq.kiem.push(ok(`Thực hiện từ ngày ${tt.ngay_ap_dung.split("-").reverse().join("/")}.`));

  if (!tt.nam_hoc) kq.kiem.push(canh("Không đọc được năm học.", "Nhập năm học bằng tay; năm học dùng để xếp thư mục lưu tệp."));
  if (tt.hoc_ky == null) kq.kiem.push(canh("Không đọc được học kỳ.", "Nhập học kỳ bằng tay nếu cần phân biệt hai học kỳ."));
  if (!tt.ten_truong) kq.kiem.push(canh("Không đọc được tên trường.", "Đặt tên trường trong mục Cài đặt để hiện trên ảnh gửi giáo viên."));

  // Giáo viên chủ nhiệm
  const thieuCn = d.lop.filter((l) => !coCn.has(chuanHoaLop(l.ten))).map((l) => l.ten);
  if (thieuCn.length === d.lop.length) {
    kq.kiem.push(canh(
      `CHƯA có giáo viên chủ nhiệm cho lớp nào (${d.lop.length} lớp).`,
      "Trong phần mềm xếp thời khoá biểu, nhập 'Danh sách giáo viên chủ nhiệm' rồi xuất Excel lại. " +
      "Thiếu mục này thì KHÔNG gửi được thời khoá biểu lớp cho giáo viên chủ nhiệm (vẫn gửi được TKB cá nhân)."
    ));
  } else if (thieuCn.length) {
    kq.kiem.push(canh(
      `Thiếu giáo viên chủ nhiệm của ${thieuCn.length}/${d.lop.length} lớp: ${thieuCn.join(", ")}.`,
      "Bổ sung vào 'Danh sách giáo viên chủ nhiệm' của phần mềm xếp thời khoá biểu rồi xuất Excel lại, " +
      "hoặc chọn tay trong màn Thời khoá biểu của TKB Zalo."
    ));
  } else kq.kiem.push(ok(`Đủ giáo viên chủ nhiệm cho cả ${d.lop.length} lớp.`));

  // Khớp với danh sách giáo viên đang có
  const coDs = nhieu("SELECT COUNT(*) n FROM giao_vien")[0].n;
  if (!coDs) {
    kq.kiem.push(canh("Chưa có danh sách giáo viên trong phần mềm.",
      "Nhập tệp Excel danh sách giáo viên trước (có cột Mã GV và Điện thoại) để khớp được người nhận."));
  } else {
    const chuaKhopMa = d.gv_ma.filter((m) => !timTheoMa(m));
    const chuaKhopTen = d.pcgd.filter((r) => !timTheoTen(r.ho_ten) && !timTheoMa(r.ho_ten)).map((r) => r.ho_ten);
    if (chuaKhopMa.length) {
      kq.kiem.push(canh(
        `${chuaKhopMa.length} mã giáo viên trong thời khoá biểu chưa có trong danh sách: ${chuaKhopMa.slice(0, 10).join(", ")}${chuaKhopMa.length > 10 ? "…" : ""}.`,
        "Bổ sung cột 'Mã GV' cho những người này trong danh sách giáo viên, hoặc ghép tay khi nhập."
      ));
    } else kq.kiem.push(ok("Mọi mã giáo viên trong thời khoá biểu đều khớp danh sách."));
    if (chuaKhopTen.length) {
      kq.kiem.push(canh(
        `${chuaKhopTen.length} giáo viên trong bảng phân công chưa có trong danh sách: ${chuaKhopTen.slice(0, 8).join(", ")}${chuaKhopTen.length > 8 ? "…" : ""}.`,
        "Thêm họ vào danh sách giáo viên (kèm số điện thoại) để gửi được thời khoá biểu."
      ));
    }
  }

  // Lệch giữa TKB lớp và TKB giáo viên
  for (const c of d.canh_bao) {
    if (c.includes("lệch")) kq.kiem.push(canh(c, "Xuất lại tệp Excel từ phần mềm xếp thời khoá biểu để hai bảng khớp nhau."));
  }

  // Số tiết PCGD khai vs đếm được
  const lech = [];
  for (const r of d.pcgd) {
    if (r.so_tiet == null) continue;
    const gv = timTheoTen(r.ho_ten);
    const ma = gv?.ma_gv;
    if (!ma) continue;
    const dem = d.tiet.filter((t) => String(t.ma_gv).toLowerCase() === String(ma).toLowerCase()).length;
    if (dem !== r.so_tiet) lech.push(`${r.ho_ten} (khai ${r.so_tiet}, đếm ${dem})`);
  }
  if (lech.length) {
    kq.kiem.push(canh(`${lech.length} giáo viên có số tiết khai khác số tiết đếm được: ${lech.slice(0, 5).join("; ")}${lech.length > 5 ? "…" : ""}.`,
      "Kiểm tra lại trong phần mềm xếp thời khoá biểu; phần mềm vẫn nhập được và sẽ đánh dấu chỗ lệch ở mục Thống kê."));
  } else if (d.pcgd.some((r) => r.so_tiet != null)) {
    kq.kiem.push(ok("Số tiết trong bảng phân công khớp với thời khoá biểu."));
  }
  return kq;
}

async function kiemDsGv(duongDan, kq) {
  let ds;
  try { ds = await docDsGv(duongDan); }
  catch (e) {
    kq.kiem.push(hong("Không đọc được: " + e.message,
      "Tệp cần có dòng tiêu đề với các cột: Họ đệm, Tên (hoặc Họ tên), Mã GV, Điện thoại di động."));
    return kq;
  }
  kq.thong_tin.so_dong = ds.length;
  if (!ds.length) {
    kq.kiem.push(hong("Không có dòng giáo viên nào.", "Kiểm tra lại tệp, có thể dữ liệu nằm ở sheet khác."));
    return kq;
  }
  kq.kiem.push(ok(`Đọc được ${ds.length} giáo viên.`));

  const thieuMa = ds.filter((g) => !g.ma_gv).map((g) => g.ho_ten);
  if (thieuMa.length) {
    kq.kiem.push(canh(`${thieuMa.length} người thiếu Mã GV: ${thieuMa.slice(0, 8).join(", ")}${thieuMa.length > 8 ? "…" : ""}.`,
      "Mã GV là tên viết tắt mà phần mềm xếp thời khoá biểu dùng (ví dụ P.Ha, Thuy Ha). Thiếu mã thì không khớp được thời khoá biểu."));
  } else kq.kiem.push(ok("Mọi giáo viên đều có Mã GV."));

  const thieuSdt = ds.filter((g) => !g.dien_thoai).map((g) => g.ho_ten);
  const saiSdt = ds.filter((g) => g.dien_thoai && !/^0\d{9}$/.test(chuanSdt(g.dien_thoai)));
  if (thieuSdt.length) {
    kq.kiem.push(canh(`${thieuSdt.length}/${ds.length} người chưa có số điện thoại: ${thieuSdt.slice(0, 8).join(", ")}${thieuSdt.length > 8 ? "…" : ""}.`,
      "Không có số điện thoại thì không dò được Zalo, sẽ không gửi được cho người đó."));
  } else kq.kiem.push(ok("Mọi giáo viên đều có số điện thoại."));
  if (saiSdt.length) {
    kq.kiem.push(canh(`${saiSdt.length} số điện thoại không đúng dạng: ${saiSdt.slice(0, 5).map((g) => `${g.ho_ten} (${g.dien_thoai})`).join(", ")}.`,
      "Số điện thoại Việt Nam có 10 chữ số, bắt đầu bằng 0. Trong Excel nên định dạng ô là Văn bản để không mất số 0 đầu."));
  }

  const dem = new Map();
  for (const g of ds) {
    const k = String(g.ma_gv).toLowerCase();
    if (!k) continue;
    dem.set(k, (dem.get(k) || 0) + 1);
  }
  const trung = [...dem].filter(([, n]) => n > 1).map(([k]) => k);
  if (trung.length) kq.kiem.push(hong(`Mã GV bị trùng: ${trung.join(", ")}.`, "Mỗi giáo viên phải có một mã riêng."));
  return kq;
}

async function kiemDocx(duongDan, kq) {
  let ds, kho = "";
  try {
    const buf = fs.readFileSync(duongDan);
    ds = await lietKeBang(buf);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml").async("string");
    const { items } = tachBody(xml);
    const sect = [...items].reverse().find((x) => x.loai === "sectPr");
    kho = sect ? khoGiay(sect.xml) : "";
  } catch (e) {
    kq.kiem.push(hong("Không đọc được tệp Word: " + e.message,
      "Tệp có thể đang mở trong Microsoft Word (Windows khoá tệp) hoặc không phải .docx. Đóng Word rồi thử lại."));
    return kq;
  }
  const gv = ds.filter((x) => x.loai === "gv"), lop = ds.filter((x) => x.loai === "lop");
  const khongRo = ds.filter((x) => !x.loai);
  kq.thong_tin = { so_bang: ds.length, so_gv: gv.length, so_lop: lop.length, kho_giay: kho };

  if (!ds.length) {
    kq.kiem.push(hong("Tệp Word không có bảng thời khoá biểu nào.",
      "Dùng chức năng In/Xuất thời khoá biểu ra Word của phần mềm xếp thời khoá biểu (mỗi người/lớp một trang)."));
    return kq;
  }
  kq.kiem.push(ok(
    kq.loai === LOAI.DOCX_GV
      ? `Thời khoá biểu GIÁO VIÊN, ${gv.length} người, khổ ${kho || "không rõ"}.`
      : `Thời khoá biểu LỚP, ${lop.length} lớp, khổ ${kho || "không rõ"}.`
  ));
  if (!kho) {
    kq.kiem.push(canh("Không nhận ra khổ giấy (không phải A4 hay A5 ngang).",
      "Vẫn cắt được, nhưng khi in có thể lệch khổ."));
  }
  if (khongRo.length) {
    kq.kiem.push(canh(`${khongRo.length} bảng không đọc được tên giáo viên/lớp.`,
      "Những bảng này sẽ bị bỏ qua khi cắt. Kiểm tra lại tệp Word gốc."));
  }
  if (gv.length && lop.length) {
    kq.kiem.push(canh("Tệp lẫn cả thời khoá biểu giáo viên và lớp.",
      "Phần mềm sẽ tự tách đúng loại, nhưng nên xuất riêng hai tệp cho gọn."));
  }

  // Khớp với dữ liệu đang có
  if (kq.loai === LOAI.DOCX_GV) {
    const coDs = nhieu("SELECT COUNT(*) n FROM giao_vien")[0].n;
    if (coDs) {
      const chua = gv.filter((x) => !timTheoMa(x.ma)).map((x) => x.ma);
      if (chua.length) {
        kq.kiem.push(canh(`${chua.length} giáo viên trong tệp Word chưa có trong danh sách: ${chua.slice(0, 8).join(", ")}${chua.length > 8 ? "…" : ""}.`,
          "Những người này sẽ không được gắn tệp Word riêng. Bổ sung Mã GV trong danh sách giáo viên."));
      } else kq.kiem.push(ok("Mọi giáo viên trong tệp Word đều khớp danh sách."));
    }
  } else {
    const lopDb = nhieu("SELECT DISTINCT lop FROM tkb_lop").map((x) => chuanHoaLop(x.lop));
    if (lopDb.length) {
      const chua = lop.filter((x) => !lopDb.includes(chuanHoaLop(x.ma))).map((x) => x.ma);
      if (chua.length) {
        kq.kiem.push(canh(`${chua.length} lớp trong tệp Word không có trong thời khoá biểu đã nhập: ${chua.join(", ")}.`,
          "Có thể tệp Word thuộc một thời khoá biểu khác. Kiểm tra lại."));
      }
    }
  }
  return kq;
}

// ---------------------------------------------------------------- HỘP THƯ CHỜ XỬ LÝ

/**
 * Quét thư mục "chờ xử lý": nhận diện từng tệp, kiểm tra, gom nhóm theo số TKB + năm học.
 */
export async function quetHopThu(thuMucCho) {
  fs.mkdirSync(thuMucCho, { recursive: true });
  const tep = fs.readdirSync(thuMucCho, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith("~$") && /\.(xlsx|xlsm|docx)$/i.test(e.name))
    .map((e) => path.join(thuMucCho, e.name));

  const kq = [];
  for (const t of tep) kq.push(await kiemTraTep(t));

  // Gom nhóm: tệp SS quyết định số TKB / năm học; Word đi kèm
  const nhom = [];
  const ss = kq.filter((x) => x.loai === LOAI.SS);
  const docxGv = kq.filter((x) => x.loai === LOAI.DOCX_GV);
  const docxLop = kq.filter((x) => x.loai === LOAI.DOCX_LOP);
  const dsGv = kq.filter((x) => x.loai === LOAI.DSGV);
  const la = kq.filter((x) => x.loai === LOAI.LA);

  for (const s of ss) {
    nhom.push({
      so_tkb: s.thong_tin.so_tkb, nam_hoc: s.thong_tin.nam_hoc, hoc_ky: s.thong_tin.hoc_ky,
      ngay_ap_dung: s.thong_tin.ngay_ap_dung,
      xlsx: s,
      docx_gv: docxGv[0] || null, docx_lop: docxLop[0] || null,
      san_sang: s.dung_duoc,
    });
  }
  return {
    thu_muc: thuMucCho,
    so_tep: tep.length,
    nhom,
    ds_gv: dsGv,
    le: [...(ss.length ? [] : docxGv), ...(ss.length ? [] : docxLop)],
    khong_ro: la,
    canh_bao: [
      ...(tep.length === 0 ? ["Thư mục chờ xử lý đang trống. Hãy chép tệp Excel/Word vừa xuất từ phần mềm xếp thời khoá biểu vào đây."] : []),
      ...(ss.length === 0 && (docxGv.length || docxLop.length) ? ["Mới có tệp Word, THIẾU tệp Excel tổng (SS....xlsx) — không nhập được vì thiếu dữ liệu tiết học."] : []),
      ...(ss.length > 1 ? [`Có ${ss.length} tệp Excel tổng trong thư mục — mỗi lần chỉ nên để một thời khoá biểu.`] : []),
      ...(docxGv.length > 1 ? ["Có nhiều tệp Word thời khoá biểu giáo viên — phần mềm sẽ lấy tệp đầu tiên."] : []),
      ...la.map((x) => `Không nhận ra tệp "${x.ten_tep}".`),
    ],
  };
}

/** Chép tệp nguồn vào kho theo năm học + số TKB, trả về đường dẫn mới. */
export function luuVaoKho(thuMucGoc, namHoc, soTkb, dsTep) {
  const dich = thuMucTkb(thuMucGoc, namHoc, soTkb);
  fs.mkdirSync(dich, { recursive: true });
  const kq = {};
  for (const [vai, nguon] of Object.entries(dsTep)) {
    if (!nguon || !fs.existsSync(nguon)) continue;
    const f = path.join(dich, path.basename(nguon));
    if (path.resolve(f) !== path.resolve(nguon)) fs.copyFileSync(nguon, f);
    kq[vai] = f;
  }
  return { thu_muc: dich, tep: kq };
}

/** Dọn tệp khỏi hộp thư chờ sau khi đã nhập (chuyển sang thư mục "da-nhap"). */
export function donHopThu(thuMucCho, dsTep) {
  const luu = path.join(thuMucCho, "da nhap");
  fs.mkdirSync(luu, { recursive: true });
  const daDon = [];
  for (const t of dsTep) {
    if (!t || !fs.existsSync(t)) continue;
    try {
      fs.renameSync(t, path.join(luu, path.basename(t)));
      daDon.push(path.basename(t));
    } catch { /* tệp đang mở thì bỏ qua */ }
  }
  return { da_don: daDon };
}

/** Liệt kê các thư mục TKB người dùng tự chép sẵn vào kho (để đọc nhanh, không cần qua hộp thư). */
export function duyetKho(thuMucGoc) {
  const goc = path.join(thuMucGoc, DU_LIEU);
  if (!fs.existsSync(goc)) return [];
  const kq = [];
  for (const nam of fs.readdirSync(goc, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const tNam = path.join(goc, nam.name);
    for (const so of fs.readdirSync(tNam, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const t = path.join(tNam, so.name);
      const tep = fs.readdirSync(t, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name);
      kq.push({
        nam_hoc: nam.name, thu_muc_so: so.name, duong_dan: t,
        so_tkb: Number(String(so.name).replace(/\D+/g, "")) || null,
        xlsx: tep.find((x) => /\.xlsx?$/i.test(x) && !/^~\$/.test(x)) || null,
        docx: tep.filter((x) => /\.docx$/i.test(x) && !/^~\$/.test(x)),
        co_anh: fs.existsSync(path.join(t, "anh")),
        co_gv: fs.existsSync(path.join(t, "gv")),
        co_lop: fs.existsSync(path.join(t, "lop")),
      });
    }
  }
  return kq.sort((a, b) => String(b.nam_hoc).localeCompare(a.nam_hoc) || (b.so_tkb || 0) - (a.so_tkb || 0));
}
