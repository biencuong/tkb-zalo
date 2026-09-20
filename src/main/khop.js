/**
 * Chuẩn hoá chuỗi tiếng Việt + khớp giáo viên giữa Danh sách GV (bản chủ) và dữ liệu SmartScheduler.
 * Thuần JS, không phụ thuộc — dùng chung cho main, test và (qua IPC) renderer.
 */

/** Gộp khoảng trắng, NFC, bỏ NBSP. */
export const chuanHoaKhoangTrang = (s) =>
  String(s ?? "").normalize("NFC").replace(/ /g, " ").replace(/\r/g, "").replace(/\s+/g, " ").trim();

/** Tên để so sánh: chuẩn khoảng trắng + chữ thường. */
export const chuanHoaTen = (s) => chuanHoaKhoangTrang(s).toLowerCase();

/** Bỏ dấu tiếng Việt (đ → d). */
export function boDau(s) {
  return chuanHoaKhoangTrang(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFC");
}

/** Mã GV (tên tắt SmartScheduler) để so sánh: chuẩn khoảng trắng + chữ thường. */
export const chuanHoaMa = (s) => chuanHoaTen(s);

/** Tên lớp để so sánh: bỏ khoảng trắng, chữ hoa. */
export const chuanHoaLop = (s) => chuanHoaKhoangTrang(s).replace(/\s+/g, "").toUpperCase();

/** Số điện thoại VN: chỉ số, 84xxx → 0xxx, 9 số thiếu số 0 đầu (Excel cắt) → thêm 0. */
export function chuanSdt(s) {
  let d = String(s ?? "").replace(/\D/g, "");
  if (d.startsWith("84") && d.length >= 11) d = "0" + d.slice(2);
  if (d.length === 9 && !d.startsWith("0")) d = "0" + d;
  return d;
}

export const sdtHopLe = (s) => /^0\d{9}$/.test(chuanSdt(s));

/**
 * So hai tên: 2 = khớp đúng (có dấu), 1 = khớp sau khi bỏ dấu, 0 = khác.
 */
export function mucKhopTen(a, b) {
  const x = chuanHoaTen(a), y = chuanHoaTen(b);
  if (!x || !y) return 0;
  if (x === y) return 2;
  if (boDau(x) === boDau(y)) return 1;
  return 0;
}

/**
 * Tách tiêu đề cột lớp của SmartScheduler: "6A1", "6A1\n(D.Nhàn)", "6A1 (D.Nhàn)".
 * → { ten: "6A1", gvcn_ma: "D.Nhàn" | "" }
 */
export function tachTieuDeLop(raw) {
  const s = chuanHoaKhoangTrang(raw);
  const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(s);
  if (m) return { ten: m[1].trim(), gvcn_ma: m[2].trim() };
  return { ten: s, gvcn_ma: "" };
}

/** Tách ô TKB "Môn - Mã" (TKB lớp) hoặc "Môn - Lớp" (TKB GV). */
export function tachOTkb(raw) {
  const s = chuanHoaKhoangTrang(raw);
  const i = s.indexOf(" - ");
  if (i < 0) return { mon: s, phan_sau: "" };
  return { mon: s.slice(0, i).trim(), phan_sau: s.slice(i + 3).trim() };
}

/**
 * Phân tích chuỗi phân công chuyên môn của PCGD:
 * "CNghệ (7A1, 7A2) + Lý (6A1, 6A2) + HĐTN (8A5)" → [{mon:"CNghệ", lop:["7A1","7A2"]}, ...]
 */
export function phanTichPhanCong(raw) {
  const s = chuanHoaKhoangTrang(raw);
  if (!s) return [];
  const kq = [];
  for (const phan of s.split(/\s*\+\s*/)) {
    const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(phan);
    if (m) kq.push({ mon: m[1].trim(), lop: m[2].split(/\s*,\s*/).map((x) => x.trim()).filter(Boolean) });
    else if (phan.trim()) kq.push({ mon: phan.trim(), lop: [] });
  }
  return kq;
}

/** Chữ ký phân công: tập "môn|lớp" — dùng để suy mã GV ↔ tên GV khi thiếu Danh sách GV. */
export function chuKyPhanCong(danhSachMonLop) {
  const tap = new Set();
  for (const { mon, lop } of danhSachMonLop) for (const l of lop) tap.add(`${chuanHoaTen(mon)}|${chuanHoaLop(l)}`);
  return [...tap].sort().join(";");
}

/**
 * Suy mã GV cho từng dòng PCGD bằng cách so chữ ký phân công (PCGD) với tập môn|lớp thực dạy trong TKB_GV.
 * pcgd: [{ho_ten, phan_cong}], tietGv: [{ma_gv, mon, lop}]
 * → Map<ho_ten, ma_gv> (chỉ những cặp chữ ký khớp DUY NHẤT cả hai chiều)
 */
export function suyMaTuPhanCong(pcgd, tietGv) {
  const chuKyTheoMa = new Map();
  const gom = new Map();
  for (const t of tietGv) {
    if (!gom.has(t.ma_gv)) gom.set(t.ma_gv, new Map());
    const m = gom.get(t.ma_gv);
    const k = chuanHoaTen(t.mon);
    if (!m.has(k)) m.set(k, new Set());
    m.get(k).add(chuanHoaLop(t.lop));
  }
  for (const [ma, m] of gom) {
    const ds = [...m].map(([mon, lops]) => ({ mon, lop: [...lops] }));
    chuKyTheoMa.set(ma, chuKyPhanCong(ds));
  }
  const maTheoChuKy = new Map();
  for (const [ma, ck] of chuKyTheoMa) {
    if (!ck) continue;
    if (!maTheoChuKy.has(ck)) maTheoChuKy.set(ck, []);
    maTheoChuKy.get(ck).push(ma);
  }
  const chuKyTheoTen = new Map();
  for (const r of pcgd) {
    const ck = chuKyPhanCong(phanTichPhanCong(r.phan_cong));
    if (!ck) continue;
    if (!chuKyTheoTen.has(ck)) chuKyTheoTen.set(ck, []);
    chuKyTheoTen.get(ck).push(r.ho_ten);
  }
  const kq = new Map();
  for (const [ck, tens] of chuKyTheoTen) {
    const mas = maTheoChuKy.get(ck) || [];
    if (tens.length === 1 && mas.length === 1) kq.set(tens[0], mas[0]);
  }
  return kq;
}

/**
 * Khớp danh sách GV (bản chủ trong DB) với dữ liệu TKB.
 * dsGv: [{id, ho_ten, ma_gv, ma_gv_2}]
 * pcgd: [{ho_ten, ...}]           maTkb: ["P.Ha", ...]
 * → {
 *   theoTen: Map<ho_ten(PCGD), {gv, muc}>          (muc 2 đúng dấu, 1 bỏ dấu)
 *   theoMa:  Map<ma(TKB), gv>
 *   pcgdChuaKhop: [ho_ten...], maChuaKhop: [ma...]
 * }
 */
export function khopGiaoVien({ dsGv, pcgd, maTkb }) {
  const theoTenDung = new Map(), theoTenBoDau = new Map(), theoMa = new Map();
  for (const gv of dsGv) {
    const t = chuanHoaTen(gv.ho_ten);
    if (t) {
      if (!theoTenDung.has(t)) theoTenDung.set(t, []);
      theoTenDung.get(t).push(gv);
      const bd = boDau(t);
      if (!theoTenBoDau.has(bd)) theoTenBoDau.set(bd, []);
      theoTenBoDau.get(bd).push(gv);
    }
    for (const m of [gv.ma_gv, gv.ma_gv_2]) {
      const k = chuanHoaMa(m);
      if (k && !theoMa.has(k)) theoMa.set(k, gv);
    }
  }
  const kqTen = new Map(), pcgdChuaKhop = [];
  for (const r of pcgd) {
    const t = chuanHoaTen(r.ho_ten);
    const dung = theoTenDung.get(t);
    if (dung && dung.length === 1) { kqTen.set(r.ho_ten, { gv: dung[0], muc: 2 }); continue; }
    const bd = theoTenBoDau.get(boDau(t));
    if (bd && bd.length === 1) { kqTen.set(r.ho_ten, { gv: bd[0], muc: 1 }); continue; }
    pcgdChuaKhop.push(r.ho_ten);
  }
  const kqMa = new Map(), maChuaKhop = [];
  for (const ma of maTkb) {
    const gv = theoMa.get(chuanHoaMa(ma));
    if (gv) kqMa.set(ma, gv); else maChuaKhop.push(ma);
  }
  return { theoTen: kqTen, theoMa: kqMa, pcgdChuaKhop, maChuaKhop };
}
