/**
 * Chỉ MỘT tệp Excel xuất từ phần mềm xếp thời khoá biểu, KHÔNG có danh sách giáo viên:
 * phải tạo đủ giáo viên (kể cả chủ nhiệm không dạy tiết nào) và ghép đúng mọi tiết.
 * Kèm các thao tác xoá: nhiều thời khoá biểu một lúc, toàn bộ giáo viên.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { moDb, dongDb, mot, datCaiDat } from "../src/main/db.js";
import { dsGiaoVien, xemTruocDsGv, xoaTatCaGiaoVien, luuNguoiNhan, datNhanTatCa, dsNguoiNhan } from "../src/main/kho-gv.js";
import { nhapTkb, dsTkb, xoaNhieuTkb } from "../src/main/kho-tkb.js";
import { taoWordTuDuLieu, demWordCanTao } from "../src/main/tao-word.js";
import { chuanBiDotGui } from "../src/main/kho-gui.js";
import JSZip from "jszip";

const MAU = path.join(path.dirname(fileURLToPath(import.meta.url)), "mau");
const DS = path.join(MAU, "ds gv.xlsx");
const SS = path.join(MAU, "SS.2609201832133477.xlsx");
let kho = "";

before(() => {
  kho = fs.mkdtempSync(path.join(os.tmpdir(), "tkbzalo-motep-"));
  moDb(kho);
});
after(() => {
  dongDb();
  try { fs.rmSync(kho, { recursive: true, force: true }); } catch { /* */ }
});

test("chỉ một tệp Excel: tạo đủ 40 giáo viên, kể cả chủ nhiệm không có tiết", async () => {
  assert.equal(dsGiaoVien().length, 0);
  const r = await nhapTkb({
    duongDanXlsx: SS, thuMucKho: kho, taoGvThieu: true,
    docxGv: path.join(MAU, "TKBgvA4.docx"),
  });
  assert.equal(r.ok, true);
  assert.equal(r.gv_tao_moi.length, 40, "phải tạo đủ 40 người trong bảng phân công");
  assert.deepEqual(r.gv_bo_qua, []);
  assert.equal(dsGiaoVien().length, 40);

  // Mọi tiết đều ghép được vào một giáo viên
  const tietMoCoi = mot("SELECT COUNT(*) n FROM tiet WHERE tkb_id=? AND giao_vien_id IS NULL", r.tkb_id).n;
  assert.equal(tietMoCoi, 0, "không tiết nào được thiếu giáo viên");
  // Mọi lớp có chủ nhiệm trong tệp đều gắn được với người
  const lopCoCn = mot("SELECT COUNT(*) n FROM tkb_lop WHERE tkb_id=? AND giao_vien_id IS NOT NULL", r.tkb_id).n;
  assert.ok(lopCoCn >= 6, `chỉ ${lopCoCn} lớp gắn được chủ nhiệm`);
});

test("tự tạo Word đúng mẫu Smart Scheduler, cả A4 và A5, không đè tệp đã cắt", async () => {
  const tkbId = dsTkb()[0].id;
  const thuMuc = path.join(kho, "tkb-word");
  const r = await taoWordTuDuLieu(tkbId, { thuMuc });
  assert.equal(r.ok, true, (r.loi || []).join("; "));
  const soGv = mot("SELECT COUNT(*) n FROM tkb_gv WHERE tkb_id=? AND giao_vien_id IS NOT NULL AND so_tiet_dem>0", tkbId).n;
  const soLop = mot("SELECT COUNT(*) n FROM tkb_lop WHERE tkb_id=?", tkbId).n;
  // Giáo viên đã có Word A4 cắt từ Smart Scheduler → chỉ tạo thêm A5; lớp chưa có → tạo cả hai khổ.
  assert.equal(r.tao_moi, soGv + soLop * 2);

  const l = mot("SELECT docx_a4, docx_a5 FROM tkb_lop WHERE tkb_id=? AND lop='6A1'", tkbId);
  const doc = async (f) => (await JSZip.loadAsync(fs.readFileSync(f))).file("word/document.xml").async("string");
  const a4 = await doc(l.docx_a4), a5 = await doc(l.docx_a5);
  const chu = [...a4.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]);
  for (const c of ["Lớp 6A1", "THỜI KHOÁ BIỂU", "Số 1", "Toán - P.Ha", "(Thực hiện từ ngày 18 tháng 08 năm 2025)", "Buổi sáng"]) {
    assert.ok(chu.includes(c), `thiếu "${c}"`);
  }
  assert.ok(!a4.includes("{{") && !a5.includes("{{"), "còn ô giữ chỗ chưa điền");
  assert.match(a4, /<w:pgSz[^>]*w:w="16840"/, "A4 ngang");
  assert.match(a5, /<w:pgSz[^>]*w:w="11900"/, "A5 ngang");
  assert.ok(l.docx_a4.endsWith("_A4.docx") && l.docx_a5.endsWith("_A5.docx"), "tên tệp có đuôi khổ");

  const g = mot("SELECT docx_a4, docx_path FROM tkb_gv WHERE tkb_id=? AND so_tiet_dem>0 LIMIT 1", tkbId);
  assert.ok(!/[\\/]word[\\/]/.test(g.docx_a4), "tệp A4 cắt từ Smart Scheduler phải được giữ nguyên");

  const r2 = await taoWordTuDuLieu(tkbId, { thuMuc });
  assert.equal(r2.tao_moi, 0, "chạy lại không tạo trùng");
});

test("gửi chọn khổ Word: A5, hoặc cả hai thì có tệp thứ hai", () => {
  const tkbId = dsTkb()[0].id;
  const lopA5 = chuanBiDotGui(tkbId, { kho_word: "a5" }).muc.find((m) => m.loai === "lop");
  assert.ok(lopA5 && lopA5.docx_path.endsWith("_A5.docx") && !lopA5.docx_path_2);
  const lopCa = chuanBiDotGui(tkbId, { kho_word: "ca_hai" }).muc.find((m) => m.loai === "lop");
  assert.ok(lopCa.docx_path.endsWith("_A4.docx") && lopCa.docx_path_2.endsWith("_A5.docx"));
});

test("Word đã cũ thì tự tạo lại, ghi đè đúng tên (đổi tên trường)", async () => {
  const tkbId = dsTkb()[0].id;
  const thuMuc = path.join(kho, "tkb-word");
  assert.equal(demWordCanTao(tkbId), 0, "vừa tạo xong thì không có tệp cũ");
  const truoc = mot("SELECT docx_a4 FROM tkb_lop WHERE tkb_id=? AND lop='6A1'", tkbId).docx_a4;

  datCaiDat("ten_truong", "Trường Thử Nghiệm");
  const can = demWordCanTao(tkbId);
  assert.ok(can > 0, "đổi tên trường thì Word phải thành cũ");
  const r = await taoWordTuDuLieu(tkbId, { thuMuc });
  assert.equal(r.tao_moi, can);
  const sau = mot("SELECT docx_a4 FROM tkb_lop WHERE tkb_id=? AND lop='6A1'", tkbId).docx_a4;
  assert.equal(sau, truoc, "ghi đè đúng tên tệp cũ, không đẻ tệp mới");
  const xml = await (await JSZip.loadAsync(fs.readFileSync(sau))).file("word/document.xml").async("string");
  assert.ok(xml.includes("Trường Thử Nghiệm"));
  assert.equal(demWordCanTao(tkbId), 0);
  datCaiDat("ten_truong", "");
  await taoWordTuDuLieu(tkbId, { thuMuc });
});

test("nạp bản cập nhật cùng số: Word tạo lại, ghi đè đúng tên cũ", async () => {
  const tkbId = dsTkb()[0].id;
  const thuMuc = path.join(kho, "tkb-word");
  const truoc = mot("SELECT docx_a5 FROM tkb_lop WHERE tkb_id=? AND lop='6A1'", tkbId).docx_a5;
  const r = await nhapTkb({ duongDanXlsx: SS, thuMucKho: kho, chePhu: "cap_nhat",
    docxGv: path.join(MAU, "TKBgvA4.docx") });
  assert.equal(r.ok, true);
  assert.equal(r.tkb_id, tkbId, "cùng số thì cập nhật đúng bản đó");
  assert.ok(demWordCanTao(tkbId) > 0, "dữ liệu nạp lại thì tệp cũ phải được tạo lại");
  await taoWordTuDuLieu(tkbId, { thuMuc });
  assert.equal(mot("SELECT docx_a5 FROM tkb_lop WHERE tkb_id=? AND lop='6A1'", tkbId).docx_a5, truoc);
  assert.equal(demWordCanTao(tkbId), 0);
});

test("người ngoài / nhóm nhận gì: tích được cả hai ô, giữ lớp chọn riêng", () => {
  const r = luuNguoiNhan({ ho_ten: "Hiệu trưởng thử", dien_thoai: "0912000111",
    dang_ky: [{ loai: "lop", lop: "6A1" }] });
  assert.equal(r.ok, true);
  const id = dsNguoiNhan().find((x) => x.ho_ten === "Hiệu trưởng thử").id;
  const loai = () => dsNguoiNhan().find((x) => x.id === id).dang_ky.map((d) => d.loai).sort();

  assert.equal(datNhanTatCa(id, { lop: true, gv: true }).ok, true);
  assert.deepEqual(loai(), ["lop", "tat_ca_gv", "tat_ca_lop"], "cả hai ô + lớp chọn riêng vẫn còn");
  datNhanTatCa(id, { lop: false, gv: true });
  assert.deepEqual(loai(), ["lop", "tat_ca_gv"]);

  const muc = chuanBiDotGui(dsTkb()[0].id, { gui_nguoi_ngoai: true }).muc
    .filter((m) => m.nguoi_loai === "ngoai" && m.nguoi_id === id);
  assert.ok(muc.some((m) => m.loai === "lop" && m.ma === "6A1"), "vẫn nhận lớp 6A1 đã chọn riêng");
  assert.ok(muc.filter((m) => m.loai === "gv").length >= 30, "nhận thời khoá biểu của tất cả giáo viên");
});

test("xem thử danh sách giáo viên: không ghi gì, báo đúng ai được cập nhật", async () => {
  const truoc = dsGiaoVien().length;
  const x = await xemTruocDsGv(DS);
  assert.equal(x.ok, true);
  assert.ok(x.cap_nhat > 0, "người đã tạo từ phân công phải được nhận ra là cập nhật");
  assert.equal(x.them + x.cap_nhat + x.bo_qua, x.tong);
  assert.equal(dsGiaoVien().length, truoc, "xem thử không được thêm ai");
});

test("xoá nhiều thời khoá biểu, xoá luôn thư mục ảnh/Word trong kho", () => {
  const ds = dsTkb();
  assert.equal(ds.length, 1);
  const thuMuc = ds[0].thu_muc;
  assert.ok(thuMuc && fs.existsSync(thuMuc), "phải có thư mục tệp Word đã cắt");

  const r = xoaNhieuTkb([ds[0].id], { xoaTep: true, gocKho: kho });
  assert.equal(r.ok, true);
  assert.equal(r.so, 1);
  assert.equal(r.so_thu_muc, 1);
  assert.equal(dsTkb().length, 0);
  assert.equal(fs.existsSync(thuMuc), false);

  assert.equal(xoaNhieuTkb([]).ok, false, "không chọn gì thì báo lỗi");
});

test("xoá toàn bộ giáo viên", () => {
  const r = xoaTatCaGiaoVien();
  assert.equal(r.ok, true);
  assert.equal(r.so, 40);
  assert.equal(dsGiaoVien().length, 0);
  assert.equal(xoaTatCaGiaoVien().so, 0);
});
