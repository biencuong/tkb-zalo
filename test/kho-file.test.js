import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { moDb, dongDb } from "../src/main/db.js";
import { nhapDsGvTuExcel } from "../src/main/kho-gv.js";
import { nhapTkb } from "../src/main/kho-tkb.js";
import { taoThuMucChuan, kiemTraTep, quetHopThu, luuVaoKho, thuMucTkb, donHopThu } from "../src/main/kho-file.js";
import { soiThuMuc, duyetKhoVaDoiChieu, kiemThuMucTkb } from "../src/main/kho-file-kiem.js";

const MAU = path.join(path.dirname(fileURLToPath(import.meta.url)), "mau");
const SS = path.join(MAU, "SS.2609201832133477.xlsx");
let kho = "", tm = null;

before(() => {
  kho = fs.mkdtempSync(path.join(os.tmpdir(), "tkbzalo-file-"));
  moDb(path.join(kho, "db"));
  tm = taoThuMucChuan(path.join(kho, "TKB Zalo"));
});
after(() => {
  dongDb();
  try { fs.rmSync(kho, { recursive: true, force: true }); } catch { /* */ }
});

test("tạo cây thư mục chuẩn kèm file hướng dẫn", () => {
  for (const t of [tm.cho_xu_ly, tm.du_lieu, tm.ds_gv, tm.ket_xuat]) assert.ok(fs.existsSync(t), t);
  const hd = fs.readFileSync(tm.huong_dan, "utf8");
  assert.match(hd, /CHO XU LY/);
  assert.match(hd, /SS\. \.\.\.xlsx|SS\. ?\.\.\./);
  // gọi lại không hỏng gì
  taoThuMucChuan(tm.goc);
  assert.ok(fs.existsSync(tm.huong_dan));
});

test("kiểm tra tệp Excel tổng: nhận đúng loại và liệt kê thiếu sót", async () => {
  const r = await kiemTraTep(SS);
  assert.equal(r.loai, "ss_xlsx");
  assert.equal(r.dung_duoc, true);
  assert.equal(r.thong_tin.so_tkb, 1);
  assert.equal(r.thong_tin.so_lop, 20);
  assert.equal(r.thong_tin.so_gvcn, 6);
  const txt = r.kiem.map((k) => k.noi_dung).join(" | ");
  assert.match(txt, /Thiếu giáo viên chủ nhiệm của 14\/20 lớp/);
  assert.match(txt, /Chưa có danh sách giáo viên trong phần mềm/);
  const cn = r.kiem.find((k) => k.noi_dung.includes("chủ nhiệm"));
  assert.match(cn.cach_sua, /Danh sách giáo viên chủ nhiệm/);
});

test("sau khi có danh sách giáo viên thì báo đã khớp hết", async () => {
  await nhapDsGvTuExcel(path.join(MAU, "ds gv.xlsx"));
  const r = await kiemTraTep(SS);
  const txt = r.kiem.map((k) => k.noi_dung).join(" | ");
  assert.match(txt, /Mọi mã giáo viên trong thời khoá biểu đều khớp danh sách/);
  assert.match(txt, /Số tiết trong bảng phân công khớp với thời khoá biểu/);
});

test("kiểm tra danh sách giáo viên: báo thiếu số điện thoại", async () => {
  const r = await kiemTraTep(path.join(MAU, "ds gv.xlsx"));
  assert.equal(r.loai, "ds_gv_xlsx");
  assert.equal(r.thong_tin.so_dong, 40);
  const txt = r.kiem.map((k) => k.noi_dung).join(" | ");
  assert.match(txt, /39\/40 người chưa có số điện thoại/);
  assert.match(txt, /Mọi giáo viên đều có Mã GV/);
});

test("kiểm tra tệp Word: nhận loại, khổ giấy, số bảng", async () => {
  const gv = await kiemTraTep(path.join(MAU, "TKBgvA4.docx"));
  assert.equal(gv.loai, "docx_gv");
  assert.equal(gv.thong_tin.so_gv, 40);
  assert.equal(gv.thong_tin.kho_giay, "A4");
  assert.equal(gv.dung_duoc, true);
  const lop = await kiemTraTep(path.join(MAU, "TKB lop a5.docx"));
  assert.equal(lop.loai, "docx_lop");
  assert.equal(lop.thong_tin.kho_giay, "A5");
  assert.equal(lop.thong_tin.so_lop, 20);
});

test("tệp lạ bị báo rõ là không dùng được", async () => {
  const f = path.join(kho, "ghi-chu.txt");
  fs.writeFileSync(f, "không phải dữ liệu");
  const r = await kiemTraTep(f);
  assert.equal(r.loai, "khong_ro");
  assert.equal(r.dung_duoc, false);
  assert.match(r.kiem[0].cach_sua, /chỉ đọc/);
});

test("quét hộp thư chờ: gom nhóm đúng, cảnh báo khi thiếu tệp Excel", async () => {
  const trong = await quetHopThu(tm.cho_xu_ly);
  assert.equal(trong.so_tep, 0);
  assert.match(trong.canh_bao[0], /đang trống/);

  fs.copyFileSync(path.join(MAU, "TKBgvA4.docx"), path.join(tm.cho_xu_ly, "TKBgvA4.docx"));
  const chiWord = await quetHopThu(tm.cho_xu_ly);
  assert.ok(chiWord.canh_bao.some((c) => c.includes("THIẾU tệp Excel tổng")));

  fs.copyFileSync(SS, path.join(tm.cho_xu_ly, "SS.2609201832133477.xlsx"));
  fs.copyFileSync(path.join(MAU, "TKB lop.docx"), path.join(tm.cho_xu_ly, "TKB lop.docx"));
  const du = await quetHopThu(tm.cho_xu_ly);
  assert.equal(du.nhom.length, 1);
  assert.equal(du.nhom[0].so_tkb, 1);
  assert.equal(du.nhom[0].nam_hoc, "2025-2026");
  assert.ok(du.nhom[0].docx_gv && du.nhom[0].docx_lop);
  assert.equal(du.nhom[0].san_sang, true);
});

test("soi thư mục: chỉ ra tệp thừa và tệp hỏng kèm lý do", async () => {
  const t = path.join(kho, "soi");
  fs.mkdirSync(t, { recursive: true });
  fs.copyFileSync(SS, path.join(t, "SS.xlsx"));
  fs.writeFileSync(path.join(t, "ghi chu.pdf"), "x");
  fs.writeFileSync(path.join(t, "~$TKB.docx"), "x");
  fs.writeFileSync(path.join(t, "cu.doc"), "x");
  fs.mkdirSync(path.join(t, "linh tinh"), { recursive: true });

  const r = await soiThuMuc(t);
  assert.equal(r.tim_thay.xlsx, path.join(t, "SS.xlsx"));
  const thua = r.thua.map((x) => x.ten);
  assert.ok(thua.includes("ghi chu.pdf"));
  assert.ok(thua.includes("~$TKB.docx"));
  assert.ok(thua.includes("linh tinh"));
  assert.equal(r.hong.length, 1);
  assert.equal(r.hong[0].ten, "cu.doc");
  assert.match(r.hong[0].ly_do, /Định dạng cũ/);
  assert.match(r.hong[0].cach_sua, /\.xlsx/);
  assert.match(r.thua.find((x) => x.ten === "~$TKB.docx").ly_do, /Tệp tạm do Microsoft/);
  // thiếu 2 tệp Word → nên có, không bắt buộc
  assert.equal(r.thieu.length, 2);
  assert.ok(r.thieu.every((x) => x.muc === "nen_co"));
  assert.equal(r.ok, false, "có tệp hỏng nên không ok");
  assert.match(r.tom_tat, /1 tệp hỏng/);
});

test("soi thư mục đủ chuẩn thì báo đủ", async () => {
  const t = path.join(kho, "chuan");
  fs.mkdirSync(t, { recursive: true });
  fs.copyFileSync(SS, path.join(t, "SS.xlsx"));
  fs.copyFileSync(path.join(MAU, "TKBgvA4.docx"), path.join(t, "gv.docx"));
  fs.copyFileSync(path.join(MAU, "TKB lop.docx"), path.join(t, "lop.docx"));
  const r = await soiThuMuc(t);
  assert.equal(r.ok, true);
  assert.equal(r.thieu.length, 0);
  assert.equal(r.thua.length, 0);
  assert.equal(r.hong.length, 0);
  assert.match(r.tom_tat, /đủ và đúng chuẩn/);
});

test("lưu vào kho theo năm học + số TKB", () => {
  const r = luuVaoKho(tm.goc, "2025-2026", 1, {
    xlsx: SS, docx_gv: path.join(MAU, "TKBgvA4.docx"), docx_lop: path.join(MAU, "TKB lop.docx"),
  });
  assert.equal(r.thu_muc, thuMucTkb(tm.goc, "2025-2026", 1));
  assert.match(r.thu_muc, /2025-2026[\\/]So 01$/);
  for (const f of Object.values(r.tep)) assert.ok(fs.existsSync(f));
});

test("CẢNH BÁO thư mục có dữ liệu nhưng chưa nạp vào phần mềm", async () => {
  const d = await duyetKhoVaDoiChieu(tm.goc);
  assert.equal(d.muc.length, 1);
  assert.equal(d.muc[0].trang_thai, "chua_nap");
  assert.equal(d.chua_nap, 1);
  assert.match(d.canh_bao[0], /CHƯA nạp vào phần mềm/);
  assert.match(d.canh_bao[0], /2025-2026/);
});

test("sau khi nạp thì hết cảnh báo; chép tệp mới vào thì lại cảnh báo có bản mới", async () => {
  const thu = thuMucTkb(tm.goc, "2025-2026", 1);
  await nhapTkb({
    duongDanXlsx: path.join(thu, path.basename(SS)), thuMucKho: path.join(kho, "db"),
    docxGv: path.join(thu, "TKBgvA4.docx"), docxLop: path.join(thu, "TKB lop.docx"),
  });
  const sauNhap = await duyetKhoVaDoiChieu(tm.goc);
  assert.equal(sauNhap.muc[0].trang_thai, "da_nhap");
  assert.equal(sauNhap.canh_bao.length, 0);

  // Người dùng chép đè tệp mới hơn (giả lập sửa thời khoá biểu rồi quên nạp lại)
  const f = path.join(thu, path.basename(SS));
  const sau = new Date(Date.now() + 10 * 60000);
  fs.utimesSync(f, sau, sau);
  const coMoi = await duyetKhoVaDoiChieu(tm.goc);
  assert.equal(coMoi.muc[0].trang_thai, "co_ban_moi");
  assert.equal(coMoi.co_ban_moi, 1);
  assert.match(coMoi.canh_bao[0], /MỚI HƠN lần nạp gần nhất/);
  assert.match(coMoi.canh_bao[0], /Nạp lại/);
});

test("kiểm một thư mục TKB cụ thể", async () => {
  const r = await kiemThuMucTkb(tm.goc, "2025-2026", 1);
  assert.equal(r.da_nhap, true);
  assert.ok(r.tkb_id > 0);
  assert.equal(r.ok, true);
});

test("dọn hộp thư sau khi nhập", () => {
  const ds = fs.readdirSync(tm.cho_xu_ly).filter((x) => /\.(xlsx|docx)$/i.test(x)).map((x) => path.join(tm.cho_xu_ly, x));
  const r = donHopThu(tm.cho_xu_ly, ds);
  assert.equal(r.da_don.length, 3);
  assert.equal(fs.readdirSync(tm.cho_xu_ly).filter((x) => /\.(xlsx|docx)$/i.test(x)).length, 0);
  assert.equal(fs.readdirSync(path.join(tm.cho_xu_ly, "da nhap")).length, 3);
});
