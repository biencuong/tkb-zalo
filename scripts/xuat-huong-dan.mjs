/**
 * Sinh docs/HUONG-DAN.md từ chính nội dung hiển thị trong phần mềm (src/renderer/js/noi-dung.js).
 * Nhờ vậy hướng dẫn trong app và tệp tài liệu không bao giờ lệch nhau.
 *
 * Chạy: npm run huong-dan   (nên chạy lại mỗi khi sửa nội dung trợ giúp)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { MUC_TRO_GIUP } = await import(pathToFileURL(path.join(GOC, "src/renderer/js/noi-dung.js")).href);

const giaiMa = (s) => s
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Đổi bảng HTML thành bảng Markdown. */
function bang(html) {
  const hang = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) =>
    [...m[1].matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/g)].map((o) => chu(o[2]))
  );
  if (!hang.length) return "";
  const coTieuDe = /<thead/.test(html);
  const dau = coTieuDe ? hang[0] : hang[0].map(() => " ");
  const than = coTieuDe ? hang.slice(1) : hang;
  return [
    "| " + dau.join(" | ") + " |",
    "|" + dau.map(() => "---").join("|") + "|",
    ...than.map((h) => "| " + h.join(" | ") + " |"),
  ].join("\n") + "\n";
}

/** Bỏ thẻ, giữ in đậm và mã. */
const chu = (html) => giaiMa(
  String(html)
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<(b|strong)>([\s\S]*?)<\/\1>/g, "**$2**")
    .replace(/<span class="mono">([\s\S]*?)<\/span>/g, "`$1`")
    .replace(/<span class="nhan[^"]*">([\s\S]*?)<\/span>/g, "[$1]")
    .replace(/<[^>]+>/g, "")
).replace(/\s+/g, " ").trim();

function doi(html) {
  let s = String(html);
  const ra = [];
  // cắt theo khối cấp 1 để giữ thứ tự
  const khoi = s.match(/<(h3|p|ul|ol|table|div)[^>]*>[\s\S]*?<\/\1>/g) || [];
  for (const k of khoi) {
    if (/^<h3/.test(k)) ra.push("### " + chu(k));
    else if (/^<table/.test(k)) ra.push(bang(k));
    else if (/^<ul/.test(k)) ra.push([...k.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => "- " + chu(m[1])).join("\n"));
    else if (/^<ol/.test(k)) ra.push([...k.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m, i) => `${i + 1}. ` + chu(m[1])).join("\n"));
    else if (/^<div class="bao/.test(k)) ra.push("> " + chu(k).replace(/\. /g, ".\n> "));
    else ra.push(chu(k));
  }
  return ra.filter(Boolean).join("\n\n");
}

const hom_nay = new Date().toLocaleDateString("vi-VN");
const noi =
  `# Hướng dẫn sử dụng TKB Zalo\n\n` +
  `> Tệp này được **sinh tự động** từ nội dung Trợ giúp trong phần mềm\n` +
  `> (\`src/renderer/js/noi-dung.js\`). Đừng sửa trực tiếp tệp này —\n` +
  `> sửa ở mô-đun nội dung rồi chạy \`npm run huong-dan\`.\n>\n` +
  `> Cập nhật: ${hom_nay}\n\n` +
  `## Mục lục\n\n` +
  MUC_TRO_GIUP.map((m) => `- [${m.ten}](#${m.ma})`).join("\n") + "\n\n---\n\n" +
  MUC_TRO_GIUP.map((m) => `<a id="${m.ma}"></a>\n\n## ${m.ten}\n\n${doi(m.noi)}`).join("\n\n---\n\n") + "\n";

fs.mkdirSync(path.join(GOC, "docs"), { recursive: true });
fs.writeFileSync(path.join(GOC, "docs", "HUONG-DAN.md"), noi, "utf8");
console.log(`Đã sinh docs/HUONG-DAN.md — ${MUC_TRO_GIUP.length} mục, ${noi.length.toLocaleString("vi-VN")} ký tự.`);
