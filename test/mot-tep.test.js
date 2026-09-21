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
import { moDb, dongDb, mot } from "../src/main/db.js";
import { dsGiaoVien, xemTruocDsGv, xoaTatCaGiaoVien } from "../src/main/kho-gv.js";
import { nhapTkb, dsTkb, xoaNhieuTkb } from "../src/main/kho-tkb.js";

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
