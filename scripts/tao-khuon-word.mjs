/**
 * Dựng 4 khuôn Word (giáo viên / lớp × A4 / A5) cho việc tự tạo Word từ dữ liệu Excel.
 *
 *   node scripts/tao-khuon-word.mjs "<thư mục chứa 4 tệp Word xuất từ Smart Scheduler>"
 *
 * Lấy BẢNG ĐẦU TIÊN của từng tệp (bằng chính catDocx), thay mọi chữ bằng ô giữ chỗ, ghi ra
 * src/main/mau-word/. Sau đó kiểm: khuôn không còn chữ nào của dữ liệu gốc.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { catDocx } from "../src/main/cat-docx.js";
import { dungKhuon } from "../src/main/tao-word.js";

const GOC = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const RA = path.join(GOC, "src", "main", "mau-word");
const nguon = process.argv[2] || path.dirname(GOC);

const DS = [
  { ra: "gv-a4.docx", vao: ["TKBgvA4.docx"] },
  { ra: "gv-a5.docx", vao: ["TKBgvA5.docx"] },
  { ra: "lop-a4.docx", vao: ["TKB lop.docx", "TKB lop a4.docx"] },
  { ra: "lop-a5.docx", vao: ["TKB lop a5.docx"] },
];

fs.mkdirSync(RA, { recursive: true });
let loi = 0;
for (const m of DS) {
  const f = m.vao.map((x) => path.join(nguon, x)).find((x) => fs.existsSync(x));
  if (!f) { console.log(`✖ thiếu tệp mẫu cho ${m.ra} (${m.vao.join(" / ")})`); loi++; continue; }
  let motBang = null;
  await catDocx(fs.readFileSync(f), async (_ten, buf) => { if (!motBang) motBang = buf; },
    { chiLay: (t) => t.index === 0 });
  if (!motBang) { console.log(`✖ ${path.basename(f)}: không cắt được bảng nào`); loi++; continue; }

  const khuon = await dungKhuon(motBang);
  fs.writeFileSync(path.join(RA, m.ra), khuon);

  // Khuôn không được còn dữ liệu gốc: chỉ còn chữ cố định của mẫu và ô giữ chỗ.
  const zip = await JSZip.loadAsync(khuon);
  const xml = await zip.file("word/document.xml").async("string");
  const chu = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((x) => x[1]).filter((x) => x.trim());
  const CO_DINH = /^(\{\{[A-Z0-9_]+\}\}|THỜI KHOÁ BIỂU|Buổi sáng|Buổi chiều|THỨ [2-7])$/;
  const la = chu.filter((x) => !CO_DINH.test(x.trim()));
  const oGiuCho = chu.filter((x) => /^\{\{/.test(x)).length;
  console.log(`${la.length ? "✖" : "✔"} ${m.ra} ← ${path.basename(f)} · ${oGiuCho} ô giữ chỗ`
    + (la.length ? ` · CÒN CHỮ LẠ: ${la.slice(0, 5).join(" | ")}` : ""));
  if (la.length) loi++;
}
process.exit(loi ? 1 : 0);
