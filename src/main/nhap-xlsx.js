/**
 * Đọc file Excel: Danh sách giáo viên (bản chủ) và bản xuất SmartScheduler (PCGD + TKB lớp/GV).
 * Chỉ đọc, không ghi DB — trả về cấu trúc thuần để lớp nghiệp vụ xử lý.
 */
import ExcelJS from "exceljs";
import { boDau, chuanHoaKhoangTrang, chuanSdt, tachTieuDeLop, tachOTkb } from "./khop.js";

/** Lấy text của một ô exceljs (xử lý rich text, công thức, hyperlink, ngày). */
export function textCua(cell) {
  if (!cell) return "";
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text ?? "").join("");
    if (v instanceof Date) return v.toISOString();
    if (v.result != null) return typeof v.result === "object" ? textCua({ value: v.result }) : String(v.result);
    if (v.text != null) return typeof v.text === "object" ? textCua({ value: v.text }) : String(v.text);
    if (v.hyperlink && v.text == null) return String(v.hyperlink);
    return "";
  }
  return String(v);
}
const sach = (cell) => chuanHoaKhoangTrang(textCua(cell));
const sachGiuXuongDong = (cell) =>
  String(textCua(cell) ?? "").normalize("NFC").replace(/ /g, " ").replace(/\r/g, "").trim();
const khoa = (s) => boDau(s).toLowerCase();

async function moWorkbook(duongDan) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(duongDan);
  return wb;
}

// ---------------------------------------------------------------- DANH SÁCH GIÁO VIÊN

/**
 * Đọc "ds gv.xlsx": tìm dòng tiêu đề theo tên cột (không phụ thuộc thứ tự cột).
 * → [{tt, ho_dem, ten, ho_ten, ma_gv, ma_gv_2, dien_thoai, email, zalo_uid, ghi_chu, lop_cn}]
 */
export async function docDsGv(duongDan) {
  const wb = await moWorkbook(duongDan);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("File Excel không có sheet nào.");
  let hdrRow = 0, cot = {};
  for (let r = 1; r <= Math.min(ws.rowCount, 30); r++) {
    const m = {};
    for (let c = 1; c <= ws.columnCount; c++) {
      const t = khoa(sach(ws.getCell(r, c)));
      if (!t) continue;
      if (t === "tt" || t === "stt") m.tt = c;
      else if (t.startsWith("ho dem") || t === "ho" || t === "ho va ten dem") m.ho_dem = c;
      else if (t === "ten") m.ten = c;
      else if (t === "ma gv 2" || t === "ma gv2" || t === "ma 2") m.ma_gv_2 = c;
      else if (t === "ma gv" || t === "ma giao vien" || t === "ma") m.ma_gv = c;
      else if (t.includes("dien thoai") || t === "sdt" || t === "so dt") m.dien_thoai = c;
      else if (t === "email" || t === "e-mail") m.email = c;
      else if (t.includes("zalo")) m.zalo_uid = c;
      else if (t.includes("ghi chu")) m.ghi_chu = c;
      else if (t.includes("chu nhiem") || t === "cn" || t === "lop cn") m.lop_cn = c;
      else if (t === "ho ten" || t === "ho va ten" || t === "giao vien") m.ho_ten = c;
    }
    if (m.ma_gv && (m.ten || m.ho_ten)) { hdrRow = r; cot = m; break; }
  }
  if (!hdrRow) {
    throw new Error("Không tìm thấy dòng tiêu đề. File cần có các cột: Họ đệm, Tên (hoặc Họ tên), Mã GV, Điện thoại di động.");
  }
  const ds = [];
  for (let r = hdrRow + 1; r <= ws.rowCount; r++) {
    const lay = (k) => (cot[k] ? sach(ws.getCell(r, cot[k])) : "");
    let ho_dem = lay("ho_dem"), ten = lay("ten");
    if (!ten && cot.ho_ten) {
      const phan = lay("ho_ten").split(" ");
      ten = phan.pop() || "";
      ho_dem = phan.join(" ");
    }
    const ma_gv = lay("ma_gv");
    if (!ten && !ma_gv) continue;
    ds.push({
      tt: lay("tt"),
      ho_dem, ten,
      ho_ten: `${ho_dem} ${ten}`.trim(),
      ma_gv,
      ma_gv_2: lay("ma_gv_2"),
      dien_thoai: chuanSdt(lay("dien_thoai")),
      email: lay("email"),
      zalo_uid: lay("zalo_uid").replace(/\D/g, ""),
      ghi_chu: lay("ghi_chu"),
      lop_cn: lay("lop_cn"),
      dong: r,
    });
  }
  return ds;
}

// ---------------------------------------------------------------- BẢN XUẤT SMARTSCHEDULER

/** Quét 6 dòng đầu của mọi sheet lấy tên trường, năm học, học kỳ, số TKB, ngày áp dụng. */
function docThongTin(wb) {
  const tt = { ten_truong: "", nam_hoc: "", hoc_ky: null, so_tkb: null, ngay_ap_dung: null, ngay_ap_dung_text: "" };
  for (const ws of wb.worksheets) {
    for (let r = 1; r <= Math.min(6, ws.rowCount); r++) {
      for (let c = 1; c <= Math.min(30, ws.columnCount); c++) {
        const raw = sachGiuXuongDong(ws.getCell(r, c));
        if (!raw) continue;
        const dong = raw.split(/\n+/).map((x) => x.trim()).filter(Boolean);
        for (const d of dong) {
          let m;
          if (!tt.ten_truong && /^tr(ư|u)(ờ|o)ng\b/i.test(boDau(d) === d ? d : d) && /^tr/i.test(boDau(d).toLowerCase())) {
            if (/^tr/i.test(boDau(d)) && !/th(ờ|o)i kho(á|a) bi(ể|e)u/i.test(boDau(d))) tt.ten_truong = d;
          }
          if ((m = /n(ă|a)m h(ọ|o)c\s*(\d{4})\s*[-–]\s*(\d{4})/i.exec(boDau(d)))) tt.nam_hoc = `${m[3]}-${m[4]}`;
          if ((m = /h(ọ|o)c k(ỳ|y)\s*(\d)/i.exec(boDau(d))) && tt.hoc_ky == null) tt.hoc_ky = Number(m[3]);
          if ((m = /th(ờ|o)i kho(á|a) bi(ể|e)u\s*s(ố|o)\s*(\d+)/i.exec(boDau(d))) && tt.so_tkb == null) tt.so_tkb = Number(m[4]);
          if ((m = /^s(ố|o)\s*(\d+)$/i.exec(boDau(d))) && tt.so_tkb == null) tt.so_tkb = Number(m[2]);
          if ((m = /th(ự|u)c hi(ệ|e)n t(ừ|u) ng(à|a)y\s*(\d{1,2})\s*th(á|a)ng\s*(\d{1,2})\s*n(ă|a)m\s*(\d{4})/i.exec(boDau(d))) && !tt.ngay_ap_dung) {
            const dd = String(m[5]).padStart(2, "0"), mm = String(m[7]).padStart(2, "0");
            tt.ngay_ap_dung = `${m[9]}-${mm}-${dd}`;
            tt.ngay_ap_dung_text = d;
          }
        }
      }
    }
  }
  return tt;
}

/** Sheet PCGD → [{tt, ho_ten, kiem_nhiem, cn, phan_cong, so_tiet, dong}] */
function docPcgd(ws) {
  let hdrRow = 0, cot = {};
  for (let r = 1; r <= Math.min(ws.rowCount, 15); r++) {
    const m = {};
    for (let c = 1; c <= ws.columnCount; c++) {
      const t = khoa(sach(ws.getCell(r, c)));
      if (!t) continue;
      if (t === "tt" || t === "stt") m.tt = c;
      else if (t === "giao vien" || t === "ho ten" || t === "ho va ten") m.ho_ten = c;
      else if (t.startsWith("kiem nhiem")) m.kiem_nhiem = c;
      else if (t === "cn" || t.includes("chu nhiem")) m.cn = c;
      else if (t.startsWith("phan cong")) m.phan_cong = c;
      else if (t.startsWith("so tiet")) m.so_tiet = c;
    }
    if (m.ho_ten && m.phan_cong) { hdrRow = r; cot = m; break; }
  }
  if (!hdrRow) throw new Error("Sheet PCGD không có dòng tiêu đề (TT, Giáo viên, Kiêm nhiệm, CN, Phân công chuyên môn, Số tiết).");
  const ds = [];
  for (let r = hdrRow + 1; r <= ws.rowCount; r++) {
    const lay = (k) => (cot[k] ? sach(ws.getCell(r, cot[k])) : "");
    const ho_ten = lay("ho_ten");
    if (!ho_ten) continue;
    const st = lay("so_tiet").replace(",", ".");
    ds.push({
      tt: lay("tt"), ho_ten,
      kiem_nhiem: lay("kiem_nhiem"),
      cn: lay("cn"),
      phan_cong: lay("phan_cong"),
      so_tiet: st === "" || Number.isNaN(Number(st)) ? null : Number(st),
      dong: r,
    });
  }
  return ds;
}

/**
 * Đọc lưới TKB (lớp hoặc GV). Trả về các ô có nội dung.
 * kieuSC = true: header 2 dòng (tên + Sáng/Chiều). buoiCoDinh: "S"/"C" cho sheet một buổi.
 */
function docLuoi(ws, { kieuSC, buoiCoDinh }) {
  let hr = 0;
  for (let r = 1; r <= Math.min(12, ws.rowCount); r++) {
    if (khoa(sach(ws.getCell(r, 1))) === "thu") { hr = r; break; }
  }
  if (!hr) throw new Error(`Sheet ${ws.name}: không tìm thấy dòng tiêu đề "THỨ / TIẾT".`);
  const cotDs = [];
  let tenHienTai = "";
  for (let c = 3; c <= ws.columnCount; c++) {
    const h = sachGiuXuongDong(ws.getCell(hr, c));
    if (h) tenHienTai = h;
    let buoi = buoiCoDinh;
    if (kieuSC) {
      const b = khoa(sach(ws.getCell(hr + 1, c)));
      buoi = b.startsWith("sang") ? "S" : b.startsWith("chieu") ? "C" : null;
      if (!buoi) continue;
    }
    if (!tenHienTai) continue;
    cotDs.push({ col: c, ten_raw: tenHienTai, buoi });
  }
  const batDau = kieuSC ? hr + 2 : hr + 1;
  const o = [];
  let thu = null;
  for (let r = batDau; r <= ws.rowCount; r++) {
    const a = sach(ws.getCell(r, 1));
    if (a) { const n = parseInt(a, 10); thu = Number.isNaN(n) ? null : n; }
    const t = parseInt(sach(ws.getCell(r, 2)), 10);
    if (!thu || Number.isNaN(t)) continue;
    for (const cd of cotDs) {
      const v = sach(ws.getCell(r, cd.col));
      if (!v) continue;
      o.push({ thu, tiet: t, buoi: cd.buoi, ten_raw: cd.ten_raw, noi_dung: v });
    }
  }
  const tenRaw = [...new Set(cotDs.map((x) => x.ten_raw))];
  return { tenRaw, o };
}

function layLuoi(wb, tienTo) {
  const sc = wb.getWorksheet(`${tienTo}_SC`);
  if (sc) return docLuoi(sc, { kieuSC: true });
  const s = wb.getWorksheet(`${tienTo}_S`), c = wb.getWorksheet(`${tienTo}_C`);
  if (!s && !c) return null;
  const ks = s ? docLuoi(s, { kieuSC: false, buoiCoDinh: "S" }) : { tenRaw: [], o: [] };
  const kc = c ? docLuoi(c, { kieuSC: false, buoiCoDinh: "C" }) : { tenRaw: [], o: [] };
  return { tenRaw: [...new Set([...ks.tenRaw, ...kc.tenRaw])], o: [...ks.o, ...kc.o] };
}

/**
 * Đọc bản xuất SmartScheduler.
 * → {
 *   thong_tin: {ten_truong, nam_hoc, hoc_ky, so_tkb, ngay_ap_dung 'YYYY-MM-DD'},
 *   pcgd: [...], lop: [{ten, gvcn_ma}], gv_ma: [...],
 *   tiet: [{thu, buoi, tiet, lop, mon, ma_gv}]      (từ TKB lớp)
 *   tiet_gv: [{thu, buoi, tiet, ma_gv, mon, lop}]   (từ TKB GV — để đối chiếu)
 *   canh_bao: [string]
 * }
 */
export async function docTkbSs(duongDan) {
  const wb = await moWorkbook(duongDan);
  const canh_bao = [];
  const wsP = wb.getWorksheet("PCGD");
  if (!wsP) throw new Error("File không có sheet PCGD — đây không phải file Excel xuất từ SmartScheduler.");
  const thong_tin = docThongTin(wb);
  const pcgd = docPcgd(wsP);

  const luoiLop = layLuoi(wb, "TKB_LOP");
  if (!luoiLop) throw new Error("File không có sheet TKB_LOP_SC (hoặc TKB_LOP_S/TKB_LOP_C).");
  const lop = luoiLop.tenRaw.map((raw) => ({ ...tachTieuDeLop(raw), raw }));
  const tenLopTheoRaw = new Map(lop.map((l) => [l.raw, l.ten]));
  const tiet = luoiLop.o.map((x) => {
    const { mon, phan_sau } = tachOTkb(x.noi_dung);
    return { thu: x.thu, buoi: x.buoi, tiet: x.tiet, lop: tenLopTheoRaw.get(x.ten_raw), mon, ma_gv: phan_sau, raw: x.noi_dung };
  });

  const luoiGv = layLuoi(wb, "TKB_GV");
  const gv_ma = luoiGv ? luoiGv.tenRaw.map((x) => chuanHoaKhoangTrang(x)) : [];
  const tiet_gv = luoiGv
    ? luoiGv.o.map((x) => {
        const { mon, phan_sau } = tachOTkb(x.noi_dung);
        return { thu: x.thu, buoi: x.buoi, tiet: x.tiet, ma_gv: chuanHoaKhoangTrang(x.ten_raw), mon, lop: phan_sau, raw: x.noi_dung };
      })
    : [];
  if (!luoiGv) canh_bao.push("Không có sheet TKB_GV_* — bỏ qua đối chiếu chéo TKB lớp ↔ TKB giáo viên.");

  // Đối chiếu chéo lớp ↔ GV
  if (luoiGv) {
    const k = (t) => `${t.thu}|${t.buoi}|${t.tiet}|${String(t.lop).toUpperCase()}|${String(t.ma_gv).toLowerCase()}`;
    const A = new Set(tiet.map(k)), B = new Set(tiet_gv.map(k));
    const chiLop = [...A].filter((x) => !B.has(x)), chiGv = [...B].filter((x) => !A.has(x));
    if (chiLop.length || chiGv.length) {
      canh_bao.push(`TKB lớp và TKB giáo viên lệch nhau: ${chiLop.length} ô chỉ có ở TKB lớp, ${chiGv.length} ô chỉ có ở TKB GV` +
        (chiLop[0] ? ` (vd ${chiLop[0]})` : chiGv[0] ? ` (vd ${chiGv[0]})` : "") + ".");
    }
  }

  // Đối chiếu GVCN: PCGD cột CN ↔ tiêu đề lớp "(mã)"
  const cnTheoLop = new Map();
  for (const r of pcgd) if (r.cn) cnTheoLop.set(r.cn.toUpperCase(), r);
  for (const l of lop) {
    const p = cnTheoLop.get(l.ten.toUpperCase());
    if (l.gvcn_ma && !p) canh_bao.push(`Lớp ${l.ten}: tiêu đề TKB ghi GVCN "${l.gvcn_ma}" nhưng PCGD cột CN không có lớp này.`);
  }
  for (const [lopCn, r] of cnTheoLop) {
    if (!lop.some((l) => l.ten.toUpperCase() === lopCn)) canh_bao.push(`PCGD: "${r.ho_ten}" chủ nhiệm lớp ${r.cn} nhưng TKB không có lớp này.`);
  }
  const lopThieuCn = lop.filter((l) => !l.gvcn_ma && !cnTheoLop.has(l.ten.toUpperCase())).map((l) => l.ten);

  if (thong_tin.so_tkb == null) canh_bao.push("Không đọc được SỐ thời khoá biểu (ô 'THỜI KHOÁ BIỂU số N') — cần nhập tay.");
  if (!thong_tin.ngay_ap_dung) canh_bao.push("Không đọc được ngày áp dụng ('Thực hiện từ ngày ...') — cần nhập tay.");

  return { thong_tin, pcgd, lop, gv_ma, tiet, tiet_gv, lop_thieu_cn: lopThieuCn, canh_bao };
}
