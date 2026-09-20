import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { moDb, dongDb, mot, nhieu } from "../src/main/db.js";
import { nhapDsGvTuExcel, dsGiaoVien, luuGiaoVien, xoaGiaoVien, luuNguoiNhan, dsNguoiNhan } from "../src/main/kho-gv.js";
import { xemTruocTkb, nhapTkb, dsTkb, chiTietTkb, luoiTiet, datGvcn, vanTay } from "../src/main/kho-tkb.js";

const MAU = path.join(path.dirname(fileURLToPath(import.meta.url)), "mau");
const DS = path.join(MAU, "ds gv.xlsx");
const SS = path.join(MAU, "SS.2609201832133477.xlsx");
let kho = "";

before(() => {
  kho = fs.mkdtempSync(path.join(os.tmpdir(), "tkbzalo-test-"));
  moDb(kho);
});
after(() => {
  dongDb();
  try { fs.rmSync(kho, { recursive: true, force: true }); } catch { /* */ }
});

test("nhập danh sách giáo viên từ Excel", async () => {
  const r = await nhapDsGvTuExcel(DS);
  assert.equal(r.ok, true);
  assert.equal(r.them, 40);
  assert.equal(r.capNhat, 0);
  const ds = dsGiaoVien();
  assert.equal(ds.length, 40);
  const nhan = ds.find((g) => g.ma_gv === "D.Nhàn");
  assert.equal(nhan.ho_ten, "Đỗ Thị Ngọc Nhàn");
  // nhập lại lần 2 = cập nhật, không nhân đôi
  const r2 = await nhapDsGvTuExcel(DS);
  assert.equal(r2.them, 0);
  assert.equal(r2.capNhat, 40);
  assert.equal(dsGiaoVien().length, 40);
});

test("thêm/sửa giáo viên, chặn trùng mã và số điện thoại sai", () => {
  const r = luuGiaoVien({ ho_dem: "Nguyễn Văn", ten: "Test", ma_gv: "TEST1", dien_thoai: "0912345678" });
  assert.equal(r.ok, true);
  const trung = luuGiaoVien({ ho_dem: "Trần", ten: "Hai", ma_gv: "test1" });
  assert.equal(trung.ok, false);
  assert.match(trung.loi[0], /đã dùng cho/);
  const sai = luuGiaoVien({ ho_dem: "Trần", ten: "Ba", ma_gv: "TEST2", dien_thoai: "123" });
  assert.equal(sai.ok, false);
  assert.match(sai.loi[0], /không hợp lệ/);
  assert.equal(xoaGiaoVien(r.id).ok, true);
  assert.equal(dsGiaoVien().length, 40);
});

test("xem trước TKB: khớp hết giáo viên, thấy 6 GVCN và 14 lớp thiếu", async () => {
  const x = await xemTruocTkb(SS);
  assert.equal(x.thong_tin.so_tkb, 1);
  assert.equal(x.so_lop, 20);
  assert.equal(x.so_gv_pcgd, 40);
  assert.equal(x.chua_khop.length, 0, JSON.stringify(x.chua_khop));
  assert.equal(x.lop.filter((l) => l.gvcn?.giao_vien_id).length, 6);
  assert.equal(x.lop_thieu_cn.length, 14);
  assert.equal(x.trung, null);
  assert.ok(x.canh_bao.some((c) => c.includes("chưa xác định được giáo viên chủ nhiệm")));
});

test("nhập TKB + cắt Word, gắn đúng file cho từng giáo viên và lớp", async () => {
  const r = await nhapTkb({
    duongDanXlsx: SS, thuMucKho: kho,
    docxGv: path.join(MAU, "TKBgvA4.docx"),
    docxLop: path.join(MAU, "TKB lop.docx"),
  });
  assert.equal(r.ok, true);
  assert.equal(r.so_tiet, 585);
  assert.equal(r.so_lop, 20);
  assert.equal(r.so_gv, 40);
  assert.equal(r.cat_docx.kho, "A4");
  assert.equal(r.cat_docx.gv.daCat, 40);
  assert.equal(r.cat_docx.lop.daCat, 20);
  assert.deepEqual(r.cat_docx.khong_khop, []);

  const ct = chiTietTkb(r.tkb_id);
  assert.equal(ct.lop.length, 20);
  assert.equal(ct.lop.filter((l) => l.giao_vien_id).length, 6);
  assert.equal(ct.gv.filter((g) => g.docx_path).length, 40);
  assert.equal(ct.lop.filter((l) => l.docx_path).length, 20);
  for (const l of ct.lop) assert.ok(fs.existsSync(l.docx_path), l.lop);

  const thuyHa = ct.gv.find((g) => g.ma_trong_tkb === "Thuy Ha");
  assert.equal(thuyHa.so_tiet_dem, 13);
  assert.equal(thuyHa.so_tiet_khai, 13);
  const luoi = luoiTiet(r.tkb_id, { giaoVienId: thuyHa.giao_vien_id });
  assert.equal(luoi.length, 13);
  const o = luoi.find((x) => x.thu === 2 && x.buoi === "S" && x.tiet === 1);
  assert.deepEqual([o.mon, o.lop], ["Lý", "6A3"]);
});

test("số tiết đếm được khớp số tiết khai của PCGD cho mọi giáo viên có mã", () => {
  const t = dsTkb()[0];
  const lech = nhieu(
    `SELECT ho_ten_pcgd, ma_trong_tkb, so_tiet_khai, so_tiet_dem FROM tkb_gv
     WHERE tkb_id=? AND ma_trong_tkb<>'' AND so_tiet_khai IS NOT NULL AND so_tiet_khai<>so_tiet_dem`, t.id
  );
  assert.deepEqual(lech, []);
});

test("nhập lại cùng số TKB: báo trùng, chọn cập nhật thì tăng phiên bản và lưu vết", async () => {
  const x = await xemTruocTkb(SS);
  assert.ok(x.trung, "phải phát hiện trùng số");
  assert.equal(x.trung.phien_ban, 1);
  assert.equal(x.trung.cu.so_tiet, 585);

  const chan = await nhapTkb({ duongDanXlsx: SS, thuMucKho: kho });
  assert.equal(chan.ok, false);
  assert.equal(chan.trung, true);

  const r = await nhapTkb({ duongDanXlsx: SS, thuMucKho: kho, chePhu: "cap_nhat" });
  assert.equal(r.ok, true);
  assert.equal(r.phien_ban, 2);
  assert.equal(dsTkb().length, 1, "không được tạo TKB thứ hai");
  const ct = chiTietTkb(r.tkb_id);
  assert.equal(ct.phien_ban_cu.length, 1);
  assert.match(ct.phien_ban_cu[0].tom_tat, /585 tiết/);
  assert.equal(nhieu("SELECT * FROM tiet WHERE tkb_id=?", r.tkb_id).length, 585, "không được nhân đôi tiết");
});

test("đặt giáo viên chủ nhiệm bằng tay cho lớp còn thiếu", () => {
  const t = dsTkb()[0];
  const ct = chiTietTkb(t.id);
  const thieu = ct.lop.find((l) => !l.giao_vien_id);
  assert.ok(thieu, "phải còn lớp thiếu chủ nhiệm");
  const gv = dsGiaoVien().find((g) => g.ma_gv === "Thảo");
  datGvcn(t.id, thieu.lop, gv.id);
  const sau = chiTietTkb(t.id).lop.find((l) => l.lop === thieu.lop);
  assert.equal(sau.giao_vien_id, gv.id);
  assert.equal(sau.cn_nguon, "nhap_tay");
  assert.equal(mot("SELECT lop_cn_mac_dinh FROM giao_vien WHERE id=?", gv.id).lop_cn_mac_dinh, thieu.lop.toUpperCase());
});

test("vân tay đổi khi lịch dạy đổi, giữ nguyên khi chỉ đổi thứ tự", () => {
  const a = [{ thu: 2, buoi: "S", tiet: 1, mon: "Toán", lop: "6A1", ma_gv: "P.Ha" },
             { thu: 3, buoi: "C", tiet: 2, mon: "Lý", lop: "6A2", ma_gv: "P.Ha" }];
  const b = [a[1], a[0]];
  assert.equal(vanTay("gv", "P.Ha", a), vanTay("gv", "P.Ha", b));
  const c = [...a, { thu: 4, buoi: "S", tiet: 1, mon: "Toán", lop: "6A3", ma_gv: "P.Ha" }];
  assert.notEqual(vanTay("gv", "P.Ha", a), vanTay("gv", "P.Ha", c));
});

test("người nhận ngoài danh sách: lưu kèm đăng ký nhận", () => {
  const gv = dsGiaoVien()[0];
  const r = luuNguoiNhan({
    ho_ten: "Nguyễn Thị Hiệu Trưởng", chuc_danh: "Hiệu trưởng", dien_thoai: "0912000111",
    dang_ky: [{ loai: "tat_ca_lop" }, { loai: "gv", giao_vien_id: gv.id }],
  });
  assert.equal(r.ok, true);
  const ds = dsNguoiNhan();
  assert.equal(ds.length, 1);
  assert.equal(ds[0].dang_ky.length, 2);
  const thieuSdt = luuNguoiNhan({ ho_ten: "Không số" });
  assert.equal(thieuSdt.ok, false);
});
