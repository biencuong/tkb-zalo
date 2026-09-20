/**
 * Sao chép phông chữ woff2 (latin + vietnamese) từ các gói @fontsource vào src/renderer/fonts/
 * và sinh fonts.css — để app chạy hoàn toàn offline, không tải Google Fonts.
 * Chạy: npm run fonts  (sau npm install; lặp lại khi đổi phông)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DICH = path.join(GOC, "src", "renderer", "fonts");
fs.mkdirSync(DICH, { recursive: true });

// [gói, family, trọng số cần, file tiền tố trong gói]
const CAU_HINH = [
  // Bộ phông của bản server S22U (Vé247 dashboard): Inter · Barlow Semi Condensed · JetBrains Mono.
  // Cả ba đều có bộ dấu tiếng Việt riêng trong @fontsource (đã kiểm: 4–8 KB mỗi tệp vietnamese).
  ["@fontsource/inter", "Inter", [400, 500, 600, 700], "inter"],
  ["@fontsource/barlow-semi-condensed", "Barlow Semi Condensed", [500, 600, 700], "barlow-semi-condensed"],
  ["@fontsource/jetbrains-mono", "JetBrains Mono", [400, 500, 700], "jetbrains-mono"],
];
const SUBSET = ["latin", "vietnamese", "latin-ext"];
const RANGE = {
  latin: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  "latin-ext": "U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
  vietnamese: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB",
};

let css = "/* Sinh tự động bởi scripts/copy-fonts.mjs — không sửa tay */\n";
let dem = 0;
for (const [goi, family, trongSo, tienTo] of CAU_HINH) {
  const thuMuc = path.join(GOC, "node_modules", goi, "files");
  if (!fs.existsSync(thuMuc)) { console.error("Thiếu gói", goi, "— chạy npm install trước."); process.exit(1); }
  for (const w of trongSo) {
    for (const sub of SUBSET) {
      const ten = `${tienTo}-${sub}-${w}-normal.woff2`;
      const nguon = path.join(thuMuc, ten);
      if (!fs.existsSync(nguon)) continue;
      fs.copyFileSync(nguon, path.join(DICH, ten));
      dem++;
      css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url("./${ten}") format("woff2");unicode-range:${RANGE[sub]}}\n`;
    }
  }
}
fs.writeFileSync(path.join(DICH, "fonts.css"), css);
console.log(`Đã chép ${dem} tệp phông vào ${DICH}`);
