/**
 * Kéo thả tệp vào phần mềm: tự nhận ra tệp nào là gì, đặt tên chuẩn, cất đúng chỗ,
 * không lưu trùng, và báo cáo đủ trạng thái từng tệp.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { moDb, dongDb } from "../src/main/db.js";
import { taoThuMucChuan, xepTepVaoKho, tenChuan } from "../src/main/kho-file.js";

const MAU = path.join(path.dirname(fileURLToPath(import.meta.url)), "mau");
const SS = path.join(MAU, "SS.2609201832133477.xlsx");
const DS_GV = path.join(MAU, "ds gv.xlsx");
const DOCX_GV = path.join(MAU, "TKBgvA4.docx");
const DOCX_LOP = path.join(MAU, "TKB lop.docx");

let kho = "", tm = null, duongDan = null;

before(() => {
  kho = fs.mkdtempSync(path.join(os.tmpdir(), "tkbzalo-nhan-"));
  moDb(path.join(kho, "db"));
  tm = taoThuMucChuan(path.join(kho, "TKB Zalo"));
  duongDan = { cho_xu_ly: tm.cho_xu_ly, ds_gv: tm.ds_gv, goc_tai_lieu: tm.goc };
});
after(() => {
  dongDb();
  try { fs.rmSync(kho, { recursive: true, force: true }); } catch { /* */ }
});

test("tên chuẩn đọc là biết ngay năm nào, số mấy, loại gì", () => {
  assert.equal(tenChuan("ss_xlsx", { nam_hoc: "2025-2026", so_tkb: 1 }, ".xlsx"), "TKB-2025-2026-So-01-TONG.xlsx");
  assert.equal(tenChuan("docx_gv", { nam_hoc: "2025-2026", so_tkb: 12, kho_giay: "A5" }, ".docx"), "TKB-2025-2026-So-12-GV-A5.docx");
  assert.equal(tenChuan("docx_lop", { nam_hoc: "2025-2026", so_tkb: 1, kho_giay: "A4" }, ".docx"), "TKB-2025-2026-So-01-LOP-A4.docx");
  assert.equal(tenChuan("ds_gv_xlsx", {}, ".xlsx"), "DS-GV.xlsx");
  // Thiếu thông tin thì ghi CHUA-RO chứ không đặt tên bừa
  assert.match(tenChuan("ss_xlsx", {}, ".xlsx"), /CHUA-RO/);
});

test("thả một lượt đủ bộ: phân đúng loại, đặt đúng tên, cất đúng thư mục", async () => {
  const r = await xepTepVaoKho([DS_GV, SS, DOCX_GV, DOCX_LOP], duongDan);
  assert.equal(r.ok, true);
  assert.equal(r.so_nhan, 4, "phải nhận đủ 4 tệp");
  assert.equal(r.so_bo_qua, 0);

  const theoLoai = Object.fromEntries(r.bao_cao.map((x) => [x.loai, x]));
  assert.equal(theoLoai.ds_gv_xlsx.ten_moi, "DS-GV.xlsx");
  assert.ok(theoLoai.ds_gv_xlsx.thu_muc.endsWith(path.basename(tm.ds_gv)), "danh sách giáo viên phải vào thư mục riêng");
  assert.equal(theoLoai.ss_xlsx.ten_moi, "TKB-2025-2026-So-01-TONG.xlsx");
  // Tệp Word không tự biết mình thuộc thời khoá biểu số mấy → mượn của tệp Excel tổng cùng lượt
  assert.equal(theoLoai.docx_gv.ten_moi, "TKB-2025-2026-So-01-GV-A4.docx");
  assert.equal(theoLoai.docx_lop.ten_moi, "TKB-2025-2026-So-01-LOP-A4.docx");

  for (const x of r.bao_cao) assert.ok(fs.existsSync(path.join(x.thu_muc, x.ten_moi)), `thiếu tệp ${x.ten_moi}`);
});

test("thả lại y hệt thì không lưu thêm bản nào", async () => {
  const truoc = fs.readdirSync(tm.cho_xu_ly).length + fs.readdirSync(tm.ds_gv).length;
  const r = await xepTepVaoKho([DS_GV, SS, DOCX_GV, DOCX_LOP], duongDan);
  assert.equal(r.so_trung, 4, "cả 4 tệp phải bị nhận ra là trùng");
  assert.equal(r.so_nhan, 0);
  const sau = fs.readdirSync(tm.cho_xu_ly).length + fs.readdirSync(tm.ds_gv).length;
  assert.equal(sau, truoc, "số tệp trong kho không được tăng");
  for (const x of r.bao_cao) assert.match(x.ly_do || "", /y hệt/);
});

test("thả hai bản y hệt trong cùng một lượt chỉ lấy một", async () => {
  const tam = path.join(kho, "ban-sao.xlsx");
  fs.copyFileSync(SS, tam);
  const kho2 = fs.mkdtempSync(path.join(os.tmpdir(), "tkbzalo-nhan2-"));
  const tm2 = taoThuMucChuan(path.join(kho2, "TKB Zalo"));
  const r = await xepTepVaoKho([SS, tam], { cho_xu_ly: tm2.cho_xu_ly, ds_gv: tm2.ds_gv, goc_tai_lieu: tm2.goc });
  assert.equal(r.so_nhan, 1);
  assert.equal(r.so_trung, 1);
  assert.equal(fs.readdirSync(tm2.cho_xu_ly).filter((f) => f.endsWith(".xlsx")).length, 1);
  fs.rmSync(kho2, { recursive: true, force: true });
});

test("tệp lạ không bị vứt đi mà để riêng, kèm lý do rõ ràng", async () => {
  const la = path.join(kho, "ghi chu linh tinh.docx");
  fs.writeFileSync(la, "day khong phai thoi khoa bieu");
  const r = await xepTepVaoKho([la], duongDan);
  assert.equal(r.so_nhan, 0);
  const x = r.bao_cao[0];
  assert.ok(x.noi.includes("KHONG DUNG DINH DANG"), "phải để vào thư mục riêng");
  assert.ok(String(x.ly_do || "").length > 10, "phải nói rõ vì sao không nhận");
  assert.ok(fs.existsSync(path.join(x.thu_muc, x.ten_moi)), "vẫn giữ tệp lại cho người dùng xem");
});

test("nội dung đổi thì thay tệp cũ, không đẻ thêm bản thứ hai", async () => {
  const kho3 = fs.mkdtempSync(path.join(os.tmpdir(), "tkbzalo-nhan3-"));
  const tm3 = taoThuMucChuan(path.join(kho3, "TKB Zalo"));
  const dd = { cho_xu_ly: tm3.cho_xu_ly, ds_gv: tm3.ds_gv, goc_tai_lieu: tm3.goc };
  await xepTepVaoKho([DS_GV], dd);

  // Giả lập bản xuất lại: cùng là danh sách giáo viên nhưng nội dung khác vài byte
  const suaDoi = path.join(kho3, "ds gv moi.xlsx");
  const buf = fs.readFileSync(DS_GV);
  fs.writeFileSync(suaDoi, Buffer.concat([buf, Buffer.from([0])]));
  const r = await xepTepVaoKho([suaDoi], dd);

  assert.equal(r.so_nhan + r.so_bo_qua, 1);
  const chi = fs.readdirSync(tm3.ds_gv).filter((f) => f.endsWith(".xlsx"));
  assert.equal(chi.length, 1, "vẫn chỉ một tệp danh sách giáo viên trong kho");
  fs.rmSync(kho3, { recursive: true, force: true });
});
