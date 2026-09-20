/**
 * Thống kê số tiết: lọc đa chiều, nhiều cách xem, xuất Excel, in theo bộ lọc.
 *
 * Hai kiểu tính:
 *  - Theo TKB đang chọn: đếm thẳng số tiết/tuần.
 *  - Theo khoảng ngày: mỗi TKB có hiệu lực trong khoảng được nhân với số tuần giao nhau.
 */
import ExcelJS from "exceljs";
import { nhieu, mot } from "./db.js";
import { chuanHoaKhoangTrang } from "./khop.js";

const THU_TEN = { 2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4", 5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7" };
const BUOI_TEN = { S: "Sáng", C: "Chiều" };

/** Số ngày giao nhau giữa hai khoảng [a1,a2] và [b1,b2] (chuỗi YYYY-MM-DD). */
function soNgayGiao(a1, a2, b1, b2) {
  const t = (s) => new Date(s + "T00:00:00").getTime();
  const d1 = Math.max(t(a1), t(b1)), d2 = Math.min(t(a2), t(b2));
  if (!(d2 >= d1)) return 0;
  return Math.round((d2 - d1) / 86400000) + 1;
}

/** Các TKB nằm trong bộ lọc, kèm hệ số số tuần áp dụng. */
export function tkbTrongLoc(loc = {}) {
  let sql = "SELECT * FROM tkb WHERE 1=1";
  const t = [];
  if (loc.tkb_ids?.length) { sql += ` AND id IN (${loc.tkb_ids.map(() => "?").join(",")})`; t.push(...loc.tkb_ids); }
  if (loc.nam_hoc) { sql += " AND nam_hoc=?"; t.push(loc.nam_hoc); }
  if (loc.hoc_ky != null && loc.hoc_ky !== "") { sql += " AND hoc_ky=?"; t.push(Number(loc.hoc_ky)); }
  sql += " ORDER BY nam_hoc, hoc_ky, so_tkb";
  let ds = nhieu(sql, ...t);

  if (loc.tu_ngay && loc.den_ngay) {
    ds = ds
      .map((x) => {
        const batDau = x.ngay_ap_dung || loc.tu_ngay;
        const ketThuc = x.ngay_ket_thuc || loc.den_ngay;
        const ngay = soNgayGiao(batDau, ketThuc, loc.tu_ngay, loc.den_ngay);
        return { ...x, so_ngay_ap_dung: ngay, he_so_tuan: Math.round((ngay / 7) * 100) / 100 };
      })
      .filter((x) => x.so_ngay_ap_dung > 0);
  } else {
    ds = ds.map((x) => ({ ...x, so_ngay_ap_dung: null, he_so_tuan: 1 }));
  }
  return ds;
}

/** Lấy các tiết khớp bộ lọc, kèm hệ số tuần của TKB chứa nó. */
function tietTrongLoc(loc = {}) {
  const dsTkb = tkbTrongLoc(loc);
  if (!dsTkb.length) return { dsTkb, tiet: [] };
  const heSo = new Map(dsTkb.map((x) => [x.id, x.he_so_tuan]));

  let sql = `SELECT t.*, g.ho_ten gv_ten, g.ma_gv gv_ma, g.to_chuyen_mon, g.hoat_dong gv_hoat_dong,
                    l.giao_vien_id AS gvcn_id
             FROM tiet t
             LEFT JOIN giao_vien g ON g.id=t.giao_vien_id
             LEFT JOIN tkb_lop l ON l.tkb_id=t.tkb_id AND upper(l.lop)=upper(t.lop)
             WHERE t.tkb_id IN (${dsTkb.map(() => "?").join(",")})`;
  const t = dsTkb.map((x) => x.id);
  const them = (dk, gt) => { sql += ` AND ${dk}`; t.push(...gt); };
  if (loc.giao_vien_ids?.length) them(`t.giao_vien_id IN (${loc.giao_vien_ids.map(() => "?").join(",")})`, loc.giao_vien_ids);
  if (loc.khoi?.length) them(`t.khoi IN (${loc.khoi.map(() => "?").join(",")})`, loc.khoi.map(String));
  if (loc.lop?.length) them(`upper(t.lop) IN (${loc.lop.map(() => "?").join(",")})`, loc.lop.map((x) => String(x).toUpperCase()));
  if (loc.mon?.length) them(`t.mon IN (${loc.mon.map(() => "?").join(",")})`, loc.mon);
  if (loc.buoi?.length) them(`t.buoi IN (${loc.buoi.map(() => "?").join(",")})`, loc.buoi);
  if (loc.thu?.length) them(`t.thu IN (${loc.thu.map(() => "?").join(",")})`, loc.thu.map(Number));
  if (loc.to_chuyen_mon?.length) them(`g.to_chuyen_mon IN (${loc.to_chuyen_mon.map(() => "?").join(",")})`, loc.to_chuyen_mon);
  if (loc.chi_gvcn) sql += " AND t.giao_vien_id IS NOT NULL AND t.giao_vien_id = l.giao_vien_id";

  const tiet = nhieu(sql, ...t).map((x) => ({ ...x, he_so: heSo.get(x.tkb_id) ?? 1 }));
  return { dsTkb, tiet };
}

/** Danh sách giá trị để dựng bộ lọc trên giao diện. */
export function nguonLoc() {
  return {
    tkb: nhieu("SELECT id, so_tkb, hoc_ky, nam_hoc, ngay_ap_dung, ngay_ket_thuc FROM tkb ORDER BY nam_hoc DESC, so_tkb DESC"),
    nam_hoc: nhieu("SELECT DISTINCT nam_hoc FROM tkb WHERE nam_hoc<>'' ORDER BY nam_hoc DESC").map((x) => x.nam_hoc),
    khoi: nhieu("SELECT DISTINCT khoi FROM tiet WHERE khoi<>'' ORDER BY khoi").map((x) => x.khoi),
    lop: nhieu("SELECT DISTINCT lop FROM tiet ORDER BY lop").map((x) => x.lop),
    mon: nhieu("SELECT DISTINCT mon FROM tiet ORDER BY mon").map((x) => x.mon),
    to_chuyen_mon: nhieu("SELECT DISTINCT to_chuyen_mon FROM giao_vien WHERE to_chuyen_mon<>'' ORDER BY to_chuyen_mon").map((x) => x.to_chuyen_mon),
    giao_vien: nhieu("SELECT id, ho_ten, ma_gv FROM giao_vien WHERE hoat_dong=1 ORDER BY ten COLLATE NOCASE"),
    thu: [2, 3, 4, 5, 6, 7].map((x) => ({ gia_tri: x, ten: THU_TEN[x] })),
    buoi: [{ gia_tri: "S", ten: "Sáng" }, { gia_tri: "C", ten: "Chiều" }],
  };
}

/**
 * Thống kê theo cách xem.
 * @param {string} cachXem gv | lop | mon | thu_buoi | gv_lop | gv_thu
 */
export function thongKe(loc = {}, cachXem = "gv") {
  const { dsTkb, tiet } = tietTrongLoc(loc);
  const coKhoang = Boolean(loc.tu_ngay && loc.den_ngay);
  const gom = new Map();
  const cong = (khoa, nhan, t) => {
    if (!gom.has(khoa)) gom.set(khoa, { ...nhan, tiet_tuan: 0, tong_tiet: 0 });
    const g = gom.get(khoa);
    g.tiet_tuan += 1;
    g.tong_tiet += t.he_so;
  };

  if (cachXem === "gv") {
    for (const t of tiet) {
      const khoa = t.giao_vien_id ?? `ma:${t.ma_gv}`;
      cong(khoa, {
        giao_vien_id: t.giao_vien_id, ho_ten: t.gv_ten || "(chưa khớp giáo viên)",
        ma_gv: t.gv_ma || t.ma_gv, to_chuyen_mon: t.to_chuyen_mon || "",
      }, t);
    }
  } else if (cachXem === "lop") {
    for (const t of tiet) cong(t.lop, { lop: t.lop, khoi: t.khoi }, t);
  } else if (cachXem === "mon") {
    for (const t of tiet) cong(t.mon, { mon: t.mon }, t);
  } else if (cachXem === "thu_buoi") {
    for (const t of tiet) cong(`${t.thu}|${t.buoi}`, { thu: t.thu, thu_ten: THU_TEN[t.thu], buoi: t.buoi, buoi_ten: BUOI_TEN[t.buoi] }, t);
  } else if (cachXem === "gv_lop") {
    for (const t of tiet) {
      cong(`${t.giao_vien_id ?? t.ma_gv}|${t.lop}`, {
        giao_vien_id: t.giao_vien_id, ho_ten: t.gv_ten || "(chưa khớp)", ma_gv: t.gv_ma || t.ma_gv, lop: t.lop,
      }, t);
    }
  } else if (cachXem === "gv_thu") {
    for (const t of tiet) {
      cong(`${t.giao_vien_id ?? t.ma_gv}|${t.thu}|${t.buoi}`, {
        giao_vien_id: t.giao_vien_id, ho_ten: t.gv_ten || "(chưa khớp)", ma_gv: t.gv_ma || t.ma_gv,
        thu: t.thu, thu_ten: THU_TEN[t.thu], buoi: t.buoi, buoi_ten: BUOI_TEN[t.buoi],
      }, t);
    }
  } else throw new Error("Cách xem không hợp lệ: " + cachXem);

  let dong = [...gom.values()].map((x) => ({ ...x, tong_tiet: Math.round(x.tong_tiet * 10) / 10 }));

  // Đối chiếu số tiết khai trong PCGD (chỉ có nghĩa khi xem theo giáo viên và chọn đúng 1 TKB)
  if (cachXem === "gv" && dsTkb.length === 1) {
    const khai = new Map(
      nhieu("SELECT giao_vien_id, so_tiet_khai, lop_cn FROM tkb_gv WHERE tkb_id=?", dsTkb[0].id)
        .filter((x) => x.giao_vien_id).map((x) => [x.giao_vien_id, x])
    );
    for (const d of dong) {
      const k = khai.get(d.giao_vien_id);
      d.so_tiet_khai = k?.so_tiet_khai ?? null;
      d.lop_cn = k?.lop_cn || "";
      d.lech = d.so_tiet_khai == null ? null : Math.round((d.tiet_tuan - d.so_tiet_khai) * 10) / 10;
    }
    // Giáo viên có trong PCGD nhưng không có tiết nào
    if (!loc.giao_vien_ids?.length && !loc.chi_co_tiet) {
      const coRoi = new Set(dong.map((d) => d.giao_vien_id));
      for (const g of nhieu(
        `SELECT tg.giao_vien_id, tg.so_tiet_khai, tg.lop_cn, v.ho_ten, v.ma_gv, v.to_chuyen_mon
         FROM tkb_gv tg JOIN giao_vien v ON v.id=tg.giao_vien_id WHERE tg.tkb_id=?`, dsTkb[0].id
      )) {
        if (coRoi.has(g.giao_vien_id)) continue;
        dong.push({
          giao_vien_id: g.giao_vien_id, ho_ten: g.ho_ten, ma_gv: g.ma_gv, to_chuyen_mon: g.to_chuyen_mon || "",
          tiet_tuan: 0, tong_tiet: 0, so_tiet_khai: g.so_tiet_khai ?? null, lop_cn: g.lop_cn || "",
          lech: g.so_tiet_khai == null ? null : -g.so_tiet_khai,
        });
      }
    }
  }

  const sapXep = {
    gv: (a, b) => b.tiet_tuan - a.tiet_tuan || String(a.ho_ten).localeCompare(String(b.ho_ten), "vi"),
    lop: (a, b) => String(a.lop).localeCompare(String(b.lop), "vi"),
    mon: (a, b) => b.tiet_tuan - a.tiet_tuan,
    thu_buoi: (a, b) => a.thu - b.thu || (a.buoi === "S" ? -1 : 1),
    gv_lop: (a, b) => String(a.ho_ten).localeCompare(String(b.ho_ten), "vi") || String(a.lop).localeCompare(String(b.lop), "vi"),
    gv_thu: (a, b) => String(a.ho_ten).localeCompare(String(b.ho_ten), "vi") || a.thu - b.thu || (a.buoi === "S" ? -1 : 1),
  }[cachXem];
  dong.sort(sapXep);

  return {
    cach_xem: cachXem,
    co_khoang: coKhoang,
    tkb: dsTkb.map((x) => ({
      id: x.id, so_tkb: x.so_tkb, hoc_ky: x.hoc_ky, nam_hoc: x.nam_hoc,
      ngay_ap_dung: x.ngay_ap_dung, ngay_ket_thuc: x.ngay_ket_thuc,
      so_ngay_ap_dung: x.so_ngay_ap_dung, he_so_tuan: x.he_so_tuan,
    })),
    dong,
    tong: {
      so_dong: dong.length,
      tiet_tuan: dong.reduce((s, d) => s + d.tiet_tuan, 0),
      tong_tiet: Math.round(dong.reduce((s, d) => s + d.tong_tiet, 0) * 10) / 10,
      so_lech: dong.filter((d) => d.lech != null && d.lech !== 0).length,
    },
  };
}

/** Ma trận giáo viên × lớp (hoặc × thứ) để xem nhanh. */
export function maTran(loc = {}, truc = "lop") {
  const { tiet } = tietTrongLoc(loc);
  const hang = new Map(), cot = new Set();
  for (const t of tiet) {
    const kh = t.giao_vien_id ?? `ma:${t.ma_gv}`;
    const kc = truc === "thu" ? `${t.thu}${t.buoi}` : t.lop;
    cot.add(kc);
    if (!hang.has(kh)) hang.set(kh, { ho_ten: t.gv_ten || "(chưa khớp)", ma_gv: t.gv_ma || t.ma_gv, o: {}, tong: 0 });
    const h = hang.get(kh);
    h.o[kc] = (h.o[kc] || 0) + 1;
    h.tong++;
  }
  const cots = [...cot].sort((a, b) => String(a).localeCompare(String(b), "vi"));
  return {
    cot: cots,
    hang: [...hang.values()].sort((a, b) => String(a.ho_ten).localeCompare(String(b.ho_ten), "vi")),
  };
}

/** Mô tả bộ lọc bằng lời — dùng cho đầu trang khi in và sheet "Bộ lọc" khi xuất Excel. */
export function moTaLoc(loc = {}) {
  const d = [];
  if (loc.tu_ngay && loc.den_ngay) d.push(["Khoảng thời gian", `${ngayVn(loc.tu_ngay)} đến ${ngayVn(loc.den_ngay)}`]);
  if (loc.nam_hoc) d.push(["Năm học", loc.nam_hoc]);
  if (loc.hoc_ky) d.push(["Học kỳ", String(loc.hoc_ky)]);
  if (loc.tkb_ids?.length) {
    const ds = nhieu(`SELECT so_tkb, nam_hoc FROM tkb WHERE id IN (${loc.tkb_ids.map(() => "?").join(",")})`, ...loc.tkb_ids);
    d.push(["Thời khoá biểu", ds.map((x) => `số ${x.so_tkb} (${x.nam_hoc})`).join(", ")]);
  }
  if (loc.giao_vien_ids?.length) {
    const ds = nhieu(`SELECT ho_ten FROM giao_vien WHERE id IN (${loc.giao_vien_ids.map(() => "?").join(",")})`, ...loc.giao_vien_ids);
    d.push(["Giáo viên", ds.map((x) => x.ho_ten).join(", ")]);
  }
  if (loc.to_chuyen_mon?.length) d.push(["Tổ chuyên môn", loc.to_chuyen_mon.join(", ")]);
  if (loc.khoi?.length) d.push(["Khối", loc.khoi.join(", ")]);
  if (loc.lop?.length) d.push(["Lớp", loc.lop.join(", ")]);
  if (loc.mon?.length) d.push(["Môn", loc.mon.join(", ")]);
  if (loc.buoi?.length) d.push(["Buổi", loc.buoi.map((b) => BUOI_TEN[b] || b).join(", ")]);
  if (loc.thu?.length) d.push(["Thứ", loc.thu.map((x) => THU_TEN[x] || x).join(", ")]);
  if (loc.chi_gvcn) d.push(["Chỉ tiết của giáo viên chủ nhiệm", "Có"]);
  if (!d.length) d.push(["Phạm vi", "Toàn bộ dữ liệu"]);
  return d;
}

export const ngayVn = (s) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.slice(8) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4) : (s || ""));

const COT = {
  gv: [["ho_ten", "Giáo viên", 28], ["ma_gv", "Mã GV", 12], ["to_chuyen_mon", "Tổ chuyên môn", 18],
       ["lop_cn", "Chủ nhiệm", 12], ["tiet_tuan", "Tiết/tuần", 11], ["so_tiet_khai", "PCGD khai", 11],
       ["lech", "Lệch", 9], ["tong_tiet", "Tổng tiết", 12]],
  lop: [["lop", "Lớp", 12], ["khoi", "Khối", 8], ["tiet_tuan", "Tiết/tuần", 11], ["tong_tiet", "Tổng tiết", 12]],
  mon: [["mon", "Môn", 20], ["tiet_tuan", "Tiết/tuần", 11], ["tong_tiet", "Tổng tiết", 12]],
  thu_buoi: [["thu_ten", "Thứ", 10], ["buoi_ten", "Buổi", 10], ["tiet_tuan", "Tiết/tuần", 11], ["tong_tiet", "Tổng tiết", 12]],
  gv_lop: [["ho_ten", "Giáo viên", 28], ["ma_gv", "Mã GV", 12], ["lop", "Lớp", 10], ["tiet_tuan", "Tiết/tuần", 11], ["tong_tiet", "Tổng tiết", 12]],
  gv_thu: [["ho_ten", "Giáo viên", 28], ["ma_gv", "Mã GV", 12], ["thu_ten", "Thứ", 10], ["buoi_ten", "Buổi", 10], ["tiet_tuan", "Tiết/tuần", 11], ["tong_tiet", "Tổng tiết", 12]],
};
export const TEN_CACH_XEM = {
  gv: "Theo giáo viên", lop: "Theo lớp", mon: "Theo môn", thu_buoi: "Theo thứ và buổi",
  gv_lop: "Giáo viên × lớp", gv_thu: "Giáo viên × thứ",
};

/**
 * Xuất Excel: sheet "Bộ lọc" ghi điều kiện + một sheet cho mỗi cách xem được chọn.
 */
export async function xuatExcel({ loc = {}, cachXem = ["gv"], duongDan, tenTruong = "" }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TKB Zalo";
  wb.created = new Date();

  const wsL = wb.addWorksheet("Bộ lọc");
  wsL.columns = [{ width: 28 }, { width: 70 }];
  wsL.addRow([tenTruong || "Thống kê số tiết"]).font = { bold: true, size: 14 };
  wsL.addRow(["Xuất lúc", new Date().toLocaleString("vi-VN")]);
  wsL.addRow([]);
  wsL.addRow(["ĐIỀU KIỆN LỌC"]).font = { bold: true };
  for (const [k, v] of moTaLoc(loc)) wsL.addRow([k, v]);
  const dsTkb = tkbTrongLoc(loc);
  if (dsTkb.length) {
    wsL.addRow([]);
    wsL.addRow(["THỜI KHOÁ BIỂU ĐƯỢC TÍNH"]).font = { bold: true };
    wsL.addRow(["Số TKB", "Năm học", "Học kỳ", "Áp dụng từ", "Đến", "Số tuần tính"]).font = { bold: true };
    for (const t of dsTkb) {
      wsL.addRow([t.so_tkb, t.nam_hoc, t.hoc_ky ?? "", ngayVn(t.ngay_ap_dung), ngayVn(t.ngay_ket_thuc), t.he_so_tuan]);
    }
  }

  for (const cx of cachXem) {
    const kq = thongKe(loc, cx);
    const ws = wb.addWorksheet(TEN_CACH_XEM[cx] || cx);
    const cot = COT[cx];
    ws.columns = cot.map(([, ten, w]) => ({ header: ten, width: w }));
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0EEE6" } };
    ws.getRow(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    for (const d of kq.dong) {
      const r = ws.addRow(cot.map(([k]) => (d[k] === undefined || d[k] === null ? "" : d[k])));
      const iLech = cot.findIndex(([k]) => k === "lech");
      if (iLech >= 0 && d.lech != null && d.lech !== 0) {
        r.getCell(iLech + 1).font = { color: { argb: "FFA23B2A" }, bold: true };
        r.getCell(iLech + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7DED9" } };
      }
    }
    const tong = ws.addRow(cot.map(([k]) =>
      k === "tiet_tuan" ? kq.tong.tiet_tuan : k === "tong_tiet" ? kq.tong.tong_tiet : k === cot[0][0] ? "TỔNG CỘNG" : ""
    ));
    tong.font = { bold: true };
    tong.border = { top: { style: "thin" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cot.length } };
  }

  await wb.xlsx.writeFile(duongDan);
  return { ok: true, duong_dan: duongDan, so_sheet: cachXem.length + 1 };
}

/** Dữ liệu để renderer dựng trang in (cùng nội dung với bảng đang xem). */
export function duLieuIn(loc = {}, cachXem = "gv") {
  const kq = thongKe(loc, cachXem);
  return {
    ...kq,
    tieu_de: TEN_CACH_XEM[cachXem] || cachXem,
    mo_ta_loc: moTaLoc(loc),
    cot: COT[cachXem].map(([khoa, ten]) => ({ khoa, ten })),
    ten_truong: mot("SELECT gia_tri FROM cai_dat WHERE khoa='ten_truong'")?.gia_tri
      || mot("SELECT ten_truong FROM tkb WHERE ten_truong<>'' ORDER BY id DESC LIMIT 1")?.ten_truong
      || "",
    in_luc: new Date().toLocaleString("vi-VN"),
  };
}
