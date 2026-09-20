/**
 * Số hiệu phiên bản — MỘT nguồn duy nhất là package.json, theo chuẩn SemVer 2.0.0.
 *
 * Khi đóng gói, electron-builder chép package.json vào app.asar nên đọc được y nguyên.
 * Khi chạy từ mã nguồn (npx electron scripts/...), app.getVersion() trả về số hiệu của
 * Electron chứ không phải của phần mềm — nên phải ưu tiên package.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";

const GOC_SRC = path.dirname(path.dirname(fileURLToPath(import.meta.url)));   // …/src
let nho = "";

export function phienBan() {
  if (nho) return nho;
  for (const p of [
    path.join(GOC_SRC, "..", "package.json"),
    path.join(app?.getAppPath?.() || "", "package.json"),
  ]) {
    try {
      const v = JSON.parse(fs.readFileSync(p, "utf8")).version;
      if (v && /^\d+\.\d+\.\d+/.test(v)) { nho = String(v); return nho; }
    } catch { /* thử chỗ tiếp theo */ }
  }
  nho = app?.getVersion?.() || "0.0.0";
  return nho;
}
