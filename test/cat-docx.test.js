import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { fileURLToPath } from "node:url";
import { catDocx, lietKeBang } from "../src/main/cat-docx.js";

const MAU = path.join(path.dirname(fileURLToPath(import.meta.url)), "mau");

async function kiemFile(buf) {
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml").async("string");
  const soTbl = (xml.match(/<w:tbl>/g) || []).length;
  const soSect = (xml.match(/<w:sectPr\b/g) || []).length;
  const coHeader = /<w:(header|footer)Reference\b/.test(xml);
  const partHeader = Object.keys(zip.files).filter((p) => /^word\/(header|footer)\d+\.xml$/.test(p)).length;
  return { soTbl, soSect, coHeader, partHeader, kichThuoc: buf.length };
}

for (const [ten, soBang, loai, maDau, kho] of [
  ["TKBgvA4.docx", 40, "gv", "D.Nhàn", "A4"],
  ["TKB lop.docx", 20, "lop", "6A1", "A4"],
  ["TKBgvA5.docx", 40, "gv", "D.Nhàn", "A5"],
  ["TKB lop a5.docx", 20, "lop", "6A1", "A5"],
]) {
  test(`cắt ${ten} → ${soBang} file, mỗi file 1 bảng 1 sectPr`, async () => {
    const buf = fs.readFileSync(path.join(MAU, ten));
    const ds = await lietKeBang(buf);
    assert.equal(ds.length, soBang);
    assert.equal(ds[0].loai, loai);
    assert.equal(ds[0].ma, maDau);
    const ra = [];
    const kq = await catDocx(buf, (t, b) => { ra.push({ t, b }); });
    assert.equal(kq.daCat, soBang);
    assert.equal(kq.kho, kho);
    for (const { t, b } of ra) {
      const k = await kiemFile(b);
      assert.equal(k.soTbl, 1, `${t.ma}: ${k.soTbl} bảng`);
      assert.equal(k.soSect, 1, `${t.ma}: ${k.soSect} sectPr`);
      assert.equal(k.coHeader, false);
      assert.equal(k.partHeader, 0);
      assert.ok(k.kichThuoc < 80_000, `${t.ma}: file ${k.kichThuoc} byte quá lớn`);
      assert.ok(t.ten_tep.endsWith(".docx"));
    }
    assert.equal(new Set(ra.map((x) => x.t.ma)).size, soBang, "mã trùng nhau");
  });
}

test("tenBang chấp nhận 'Lớp 6A1 (D.Nhàn)'", async () => {
  const { tenBang } = await import("../src/main/cat-docx.js");
  const xml = `<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Lớp 6A1 (D.Nhàn)</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`;
  assert.deepEqual(tenBang(xml), { loai: "lop", ma: "6A1", ghi_chu: "D.Nhàn" });
  const xml2 = `<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Giáo viên </w:t></w:r><w:r><w:t>Vu Ha</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`;
  assert.deepEqual(tenBang(xml2), { loai: "gv", ma: "Vu Ha", ghi_chu: "" });
});
