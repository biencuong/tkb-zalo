/**
 * Cắt file Word do SmartScheduler xuất (mỗi trang một bảng TKB lớp / giáo viên) thành từng file riêng.
 * Thao tác CHUỖI trên word/document.xml — giữ nguyên từng byte của mọi phần khác trong gói docx.
 *
 * Cấu trúc body đã kiểm (20/9/2026): [w:tbl][w:p có w:sectPr trong pPr] lặp; cuối: [w:tbl][w:p không sectPr][w:sectPr].
 * Bản A5 có headerReference/footerReference trỏ tới 120 header + 120 footer rỗng → bỏ tham chiếu + dọn part.
 */
import JSZip from "jszip";
import { chuanHoaKhoangTrang } from "./khop.js";

const giaiMa = (s) =>
  s.replace(/&amp;|&lt;|&gt;|&quot;|&apos;|&#(\d+);|&#x([0-9a-fA-F]+);/g, (m, d, h) => {
    if (d) return String.fromCodePoint(Number(d));
    if (h) return String.fromCodePoint(parseInt(h, 16));
    return { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" }[m];
  });

/** Tách body thành mảng phần tử cấp 1: {loai: 'tbl'|'p'|'sectPr'|'khac', xml}. */
export function tachBody(xml) {
  const mo = xml.indexOf("<w:body>");
  const dong = xml.lastIndexOf("</w:body>");
  if (mo < 0 || dong < 0) throw new Error("document.xml không có <w:body>.");
  const b0 = mo + "<w:body>".length;
  const body = xml.slice(b0, dong);
  const items = [];
  let i = 0;
  const boQuaKhoangTrang = () => { while (i < body.length && /\s/.test(body[i])) i++; };
  boQuaKhoangTrang();
  while (i < body.length) {
    if (body.startsWith("<w:tbl>", i) || body.startsWith("<w:tbl ", i)) {
      let depth = 0, j = i;
      for (;;) {
        const o1 = body.indexOf("<w:tbl>", j + 1), o2 = body.indexOf("<w:tbl ", j + 1);
        const o = o1 < 0 ? o2 : o2 < 0 ? o1 : Math.min(o1, o2);
        const c = body.indexOf("</w:tbl>", j + 1);
        if (c < 0) throw new Error("Bảng không đóng trong document.xml.");
        if (o !== -1 && o < c) { depth++; j = o; }
        else if (depth === 0) { j = c + "</w:tbl>".length; break; }
        else { depth--; j = c; }
      }
      items.push({ loai: "tbl", xml: body.slice(i, j) }); i = j;
    } else if (body.startsWith("<w:p/>", i)) {
      items.push({ loai: "p", xml: "<w:p/>" }); i += 6;
    } else if (body.startsWith("<w:p>", i) || body.startsWith("<w:p ", i)) {
      // đoạn có thể tự đóng dạng <w:p .../>
      const dongGoc = body.indexOf(">", i);
      if (body[dongGoc - 1] === "/") { items.push({ loai: "p", xml: body.slice(i, dongGoc + 1) }); i = dongGoc + 1; }
      else {
        const j = body.indexOf("</w:p>", i);
        if (j < 0) throw new Error("Đoạn văn không đóng trong document.xml.");
        items.push({ loai: "p", xml: body.slice(i, j + "</w:p>".length) }); i = j + "</w:p>".length;
      }
    } else if (body.startsWith("<w:sectPr", i)) {
      const dongGoc = body.indexOf(">", i);
      if (body[dongGoc - 1] === "/") { items.push({ loai: "sectPr", xml: body.slice(i, dongGoc + 1) }); i = dongGoc + 1; }
      else {
        const j = body.indexOf("</w:sectPr>", i);
        items.push({ loai: "sectPr", xml: body.slice(i, j + "</w:sectPr>".length) }); i = j + "</w:sectPr>".length;
      }
    } else if (body.startsWith("<", i)) {
      // phần tử khác (w:sdt, w:bookmarkStart...) — giữ nguyên theo tên thẻ
      const m = /^<([\w:]+)([^>]*)>/.exec(body.slice(i, i + 200));
      if (!m) throw new Error("Phần tử lạ ở body: " + body.slice(i, i + 60));
      const ten = m[1];
      if (m[2].endsWith("/")) { items.push({ loai: "khac", xml: body.slice(i, i + m[0].length) }); i += m[0].length; }
      else {
        const j = body.indexOf(`</${ten}>`, i);
        if (j < 0) throw new Error(`Phần tử ${ten} không đóng.`);
        const cuoi = j + ten.length + 3;
        items.push({ loai: "khac", xml: body.slice(i, cuoi) }); i = cuoi;
      }
    } else throw new Error("Ký tự lạ ở body: " + body.slice(i, i + 40));
    boQuaKhoangTrang();
  }
  return { head: xml.slice(0, b0), items, tail: xml.slice(dong) };
}

/** Text của một ô/đoạn: nối mọi w:t, giải mã entity, chuẩn khoảng trắng, NFC. */
export function textXml(xmlDoan) {
  return chuanHoaKhoangTrang(giaiMa([...xmlDoan.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("")));
}

/**
 * Tên bảng: quét các ô, tìm "Giáo viên X" / "Lớp Y" (chấp nhận "Lớp 6A1 (D.Nhàn)").
 * → {loai:'gv'|'lop', ma, ghi_chu} | null
 */
export function tenBang(tblXml) {
  for (const tc of tblXml.matchAll(/<w:tc>[\s\S]*?<\/w:tc>|<w:tc [\s\S]*?<\/w:tc>/g)) {
    const t = textXml(tc[0]);
    if (!t) continue;
    const m = /^(Giáo viên|Lớp)\s+(.+?)(?:\s*\(([^)]*)\))?$/i.exec(t);
    if (m) return { loai: /^l/i.test(m[1]) ? "lop" : "gv", ma: m[2].trim(), ghi_chu: (m[3] || "").trim() };
  }
  return null;
}

function tenTepAnToan(s) {
  return String(s).replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, " ").trim() || "khong_ten";
}

/** Dọn header/footer mồ côi (bản A5): bỏ part, rels và Override — cả ba là danh sách phẳng. */
async function donHeaderFooter(zip) {
  const relsPath = "word/_rels/document.xml.rels";
  const rels = zip.file(relsPath);
  if (rels) {
    let x = await rels.async("string");
    x = x.replace(/<Relationship\b[^>]*\/>/g, (el) => (/Target="(header|footer)\d+\.xml"/.test(el) ? "" : el));
    zip.file(relsPath, x);
  }
  const ct = zip.file("[Content_Types].xml");
  if (ct) {
    let x = await ct.async("string");
    x = x.replace(/<Override\b[^>]*\/>/g, (el) => (/PartName="\/word\/(header|footer)\d+\.xml"/.test(el) ? "" : el));
    zip.file("[Content_Types].xml", x);
  }
  for (const p of Object.keys(zip.files)) {
    if (/^word\/(header|footer)\d+\.xml$/.test(p) || /^word\/_rels\/(header|footer)\d+\.xml\.rels$/.test(p)) zip.remove(p);
  }
}

/**
 * Liệt kê các bảng trong file Word (không tạo file). → [{index, loai, ma, ghi_chu}]
 */
export async function lietKeBang(bufGoc) {
  const zip = await JSZip.loadAsync(bufGoc);
  const xml = await zip.file("word/document.xml").async("string");
  const { items } = tachBody(xml);
  const kq = [];
  let idx = 0;
  for (const it of items) {
    if (it.loai !== "tbl") continue;
    const t = tenBang(it.xml);
    kq.push({ index: idx++, loai: t?.loai || null, ma: t?.ma || "", ghi_chu: t?.ghi_chu || "" });
  }
  return kq;
}

/** Khổ giấy theo sectPr: 'A4' | 'A5' | 'khac' (đơn vị twip; ngang). */
export function khoGiay(sectPrXml) {
  const m = /<w:pgSz\b[^>]*w:w="(\d+)"[^>]*w:h="(\d+)"/.exec(sectPrXml);
  if (!m) return "khac";
  const w = Number(m[1]), h = Number(m[2]);
  const lon = Math.max(w, h), nho = Math.min(w, h);
  if (Math.abs(lon - 16838) < 120 && Math.abs(nho - 11906) < 120) return "A4";
  if (Math.abs(lon - 11906) < 120 && Math.abs(nho - 8391) < 120) return "A5";
  return "khac";
}

/**
 * Cắt từng bảng thành file docx riêng.
 * @param {Buffer} bufGoc  file Word gốc
 * @param {(ten:{loai,ma,ghi_chu,index}, buffer:Buffer)=>Promise<void>|void} ghiFile
 * @param {{chiLay?: (ten)=>boolean}} [tuyChon]
 * @returns {{tong:number, daCat:number, boQua:number, kho:string, danhSach:[]}}
 */
export async function catDocx(bufGoc, ghiFile, tuyChon = {}) {
  const zip = await JSZip.loadAsync(bufGoc);
  const xmlGoc = await zip.file("word/document.xml").async("string");
  const { head, items, tail } = tachBody(xmlGoc);
  const sectCuoi = [...items].reverse().find((x) => x.loai === "sectPr");
  if (!sectCuoi) throw new Error("document.xml không có w:sectPr cuối body.");
  const sect = sectCuoi.xml.replace(/<w:(header|footer)Reference\b[^>]*\/>/g, "");
  const coHeaderFooter = /<w:(header|footer)Reference\b/.test(sectCuoi.xml);
  const pDuoi = [...items].reverse().find((x) => x.loai === "p" && !x.xml.includes("<w:sectPr"))?.xml || "<w:p/>";
  if (coHeaderFooter) await donHeaderFooter(zip);
  const app = zip.file("docProps/app.xml");
  if (app) zip.file("docProps/app.xml", (await app.async("string")).replace(/<Pages>\d+<\/Pages>/, "<Pages>1</Pages>"));

  const kho = khoGiay(sect);
  const danhSach = [];
  let tong = 0, daCat = 0, boQua = 0, index = 0;
  for (const it of items) {
    if (it.loai !== "tbl") continue;
    tong++;
    const t = tenBang(it.xml);
    const ten = { loai: t?.loai || null, ma: t?.ma || "", ghi_chu: t?.ghi_chu || "", index: index++ };
    if (!t || (tuyChon.chiLay && !tuyChon.chiLay(ten))) { boQua++; danhSach.push({ ...ten, cat: false }); continue; }
    zip.file("word/document.xml", head + it.xml + pDuoi + sect + tail);
    const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
    await ghiFile({ ...ten, ten_tep: tenTepAnToan(ten.ma) + ".docx" }, buf);
    daCat++;
    danhSach.push({ ...ten, cat: true });
  }
  return { tong, daCat, boQua, kho, danhSach };
}
