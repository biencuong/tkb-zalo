/**
 * Kiểm bản ĐÃ ĐÓNG GÓI: nạp thử mọi mô-đun xử lý từ trong app.asar để bắt lỗi thiếu tệp
 * do bộ lọc đóng gói cắt nhầm (bẫy 20/9: exceljs cần lib/doc/ nhưng bị lọc "doc" xoá mất).
 *
 * Chạy:  node scripts/kiem-goi.mjs [đường dẫn win-unpacked]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const THU_MUC = process.argv[2] || path.join(GOC, "dist", "win-unpacked");
const EXE = path.join(THU_MUC, "TKBZalo.exe");
if (!fs.existsSync(EXE)) { console.error("Chưa có bản đóng gói:", EXE); process.exit(1); }

// Chỉ nạp các mô-đun KHÔNG phụ thuộc API Electron — bộ kiểm chạy ở chế độ Node nên
// anh-tkb.js / cap-nhat.js / ipc.js / main.js / thu-muc.js / phien-ban.js sẽ báo thiếu export "app", "shell"
// một cách giả. Phần giao diện đã được scripts/thu-chay.mjs kiểm riêng.
const MO_DUN = [
  "db.js", "khop.js", "nhap-xlsx.js", "cat-docx.js", "kho-gv.js", "kho-tkb.js",
  "kho-file.js", "kho-file-kiem.js", "kho-gui.js", "hang-doi.js", "thong-ke.js", "zalo.js",
];
// Chạy trong Electron ở chế độ Node để nạp thẳng từ app.asar
const ma = `
(async () => {
  const path = require("node:path");
  const { pathToFileURL } = require("node:url");
  const goc = path.join(process.resourcesPath, "app.asar", "src", "main");
  const loi = [];
  for (const m of ${JSON.stringify(MO_DUN)}) {
    try { await import(pathToFileURL(path.join(goc, m)).href); }
    catch (e) { loi.push(m + ": " + e.message); }
  }
  // Thử dùng thật hai thư viện hay bị cắt nhầm
  try {
    const ExcelJS = require(path.join(process.resourcesPath, "app.asar", "node_modules", "exceljs"));
    const wb = new ExcelJS.Workbook(); wb.addWorksheet("thu").addRow(["a", 1]);
    await wb.xlsx.writeBuffer();
  } catch (e) { loi.push("exceljs dùng thật: " + e.message); }
  try {
    const JSZip = require(path.join(process.resourcesPath, "app.asar", "node_modules", "jszip"));
    await new JSZip().file("a.txt", "x").generateAsync({ type: "nodebuffer" });
  } catch (e) { loi.push("jszip dùng thật: " + e.message); }
  try { await import("zca-js"); } catch (e) { loi.push("zca-js: " + e.message); }
  // Tệp giao diện và phông phải nằm trong gói, nếu không app mở ra trắng trơn
  const fs = require("node:fs");
  for (const t of ["src/renderer/index.html", "src/renderer/ve-tkb.html", "src/renderer/style.css",
                   "src/renderer/fonts/fonts.css", "src/renderer/js/app.js", "src/renderer/js/noi-dung.js",
                   "src/renderer/js/zalo-nhanh.js", "src/renderer/js/gui-modal.js",
                   "src/renderer/js/trang/du-lieu.js", "src/renderer/js/trang/lich-su.js",
                   "src/preload/preload.cjs", "src/main/main.js"]) {
    if (!fs.existsSync(path.join(process.resourcesPath, "app.asar", t))) loi.push("thiếu trong gói: " + t);
  }
  const soPhong = fs.readdirSync(path.join(process.resourcesPath, "app.asar", "src/renderer/fonts"))
    .filter((x) => x.endsWith(".woff2")).length;
  if (soPhong < 20) loi.push("thiếu phông chữ trong gói (chỉ có " + soPhong + " tệp)");
  console.log(loi.length ? "LOI|" + loi.join(" || ") : "DAT|" + ${JSON.stringify(MO_DUN.length)} + " mô-đun + exceljs + jszip + zca-js");
})();
`;
const tmp = path.join(THU_MUC, "_kiem-goi.cjs");
fs.writeFileSync(tmp, ma);
try {
  const ra = execFileSync(EXE, [tmp], {
    encoding: "utf8", env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, timeout: 120000,
  }).trim();
  const dong = ra.split("\n").filter((x) => x.startsWith("DAT|") || x.startsWith("LOI|")).pop() || ra;
  if (dong.startsWith("DAT|")) { console.log("ĐẠT — nạp được", dong.slice(4)); process.exit(0); }
  console.error("KHÔNG ĐẠT:\n  " + dong.slice(4).split(" || ").join("\n  "));
  process.exit(1);
} finally { try { fs.unlinkSync(tmp); } catch { /* */ } }
