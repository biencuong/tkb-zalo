/** Số hiệu phiên bản phải theo đúng SemVer 2.0.0 thì mới so sánh và thông báo cập nhật đúng. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * cap-nhat.js nạp electron nên không import thẳng được khi chạy bằng Node thuần.
 * Cắt đúng đoạn hàm số hiệu ra tệp tạm rồi nạp.
 */
async function napHamPhienBan() {
  const s = fs.readFileSync(path.join(GOC, "src/main/cap-nhat.js"), "utf8");
  const i = s.indexOf("/** Số hiệu chuẩn SemVer");
  const j = s.indexOf("/**\n * Kiểm tra bản mới.");
  assert.ok(i > 0 && j > i, "không tìm thấy đoạn hàm số hiệu trong cap-nhat.js");
  const tam = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tkb-ban-")), "ban.mjs");
  fs.writeFileSync(tam, s.slice(i, j), "utf8");
  return import(pathToFileURL(tam).href);
}

test("số hiệu trong package.json đúng chuẩn SemVer", async () => {
  const { banHopLe, tachBan } = await napHamPhienBan();
  const p = JSON.parse(fs.readFileSync(path.join(GOC, "package.json"), "utf8"));
  assert.ok(banHopLe(p.version), `version "${p.version}" không đúng dạng MAJOR.MINOR.PATCH`);
  assert.equal(tachBan(p.version).chuan, p.version, "version không được có tiền tố v hay số 0 thừa");
});

test("so sánh phiên bản theo đúng quy tắc SemVer", async () => {
  const { soSanhBan } = await napHamPhienBan();
  const bo = [
    ["1.0.0", "0.9.9", 1], ["1.0.0", "1.0.0", 0], ["0.2.0", "0.10.0", -1],
    ["1.0.1", "1.0.0", 1], ["2.0.0", "1.99.99", 1],
    ["1.0.0-beta", "1.0.0", -1],          // bản thử cũ hơn bản chính thức
    ["1.0.0-alpha", "1.0.0-beta", -1],
    ["1.0.0-beta.2", "1.0.0-beta.10", -1], // cụm số so theo số, không theo chữ
    ["1.2.0+build.5", "1.2.0", 0],         // phần dựng bản không tính
    ["v1.3.0", "1.2.9", 1],                // có tiền tố v vẫn đọc được
  ];
  for (const [a, b, mong] of bo) {
    assert.equal(Math.sign(soSanhBan(a, b)), mong, `soSanhBan("${a}","${b}")`);
  }
});

test("số hiệu sai chuẩn vẫn so được, không ném lỗi", async () => {
  const { soSanhBan, banHopLe } = await napHamPhienBan();
  assert.equal(banHopLe("1.2"), false);
  assert.equal(Math.sign(soSanhBan("1.2", "1.1")), 1);
  assert.equal(Math.sign(soSanhBan("", "")), 0);
});
