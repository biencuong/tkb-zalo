import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { docDsGv, docTkbSs } from "../src/main/nhap-xlsx.js";
import { khopGiaoVien, suyMaTuPhanCong, tachTieuDeLop, chuanSdt, phanTichPhanCong } from "../src/main/khop.js";

const MAU = path.join(path.dirname(fileURLToPath(import.meta.url)), "mau");
const DS = path.join(MAU, "ds gv.xlsx");
const SS = path.join(MAU, "SS.2609201832133477.xlsx");

test("tachTieuDeLop bóc tên lớp và mã GVCN", () => {
  assert.deepEqual(tachTieuDeLop("6A1\n(D.Nhàn)"), { ten: "6A1", gvcn_ma: "D.Nhàn" });
  assert.deepEqual(tachTieuDeLop("6A1 (D.Nhàn)"), { ten: "6A1", gvcn_ma: "D.Nhàn" });
  assert.deepEqual(tachTieuDeLop("7A2"), { ten: "7A2", gvcn_ma: "" });
});

test("chuanSdt", () => {
  // Số bịa, không phải số thật của ai — tệp mẫu chứa dữ liệu thật thì không đưa lên kho.
  assert.equal(chuanSdt("0912345678"), "0912345678");
  assert.equal(chuanSdt("912345678"), "0912345678");
  assert.equal(chuanSdt("+84 912 345 678"), "0912345678");
});

test("phanTichPhanCong", () => {
  assert.deepEqual(phanTichPhanCong("CNghệ (7A1, 7A2) + Lý (6A1) + HĐTN (8A5)"), [
    { mon: "CNghệ", lop: ["7A1", "7A2"] }, { mon: "Lý", lop: ["6A1"] }, { mon: "HĐTN", lop: ["8A5"] },
  ]);
});

test("docDsGv đọc 40 giáo viên, đúng cột", async () => {
  const ds = await docDsGv(DS);
  assert.equal(ds.length, 40);
  assert.equal(ds[0].ho_ten, "Đỗ Thị Ngọc Nhàn");
  assert.equal(ds[0].ma_gv, "D.Nhàn");
  assert.match(ds[4].dien_thoai, /^0\d{9}$/, "số điện thoại đọc ra phải đúng dạng 10 số bắt đầu bằng 0");
});

test("docTkbSs đọc đúng thông tin, lớp, GVCN, tiết", async () => {
  const kq = await docTkbSs(SS);
  assert.equal(kq.thong_tin.ten_truong, "Trường THCS Minh Khai");
  assert.equal(kq.thong_tin.nam_hoc, "2025-2026");
  assert.equal(kq.thong_tin.hoc_ky, 2);
  assert.equal(kq.thong_tin.so_tkb, 1);
  assert.equal(kq.thong_tin.ngay_ap_dung, "2025-08-18");
  assert.equal(kq.lop.length, 20);
  assert.deepEqual(kq.lop.slice(0, 2).map((l) => [l.ten, l.gvcn_ma]), [["6A1", "D.Nhàn"], ["6A2", "H.Loan"]]);
  assert.equal(kq.lop.filter((l) => l.gvcn_ma).length, 6);
  assert.equal(kq.lop_thieu_cn.length, 14);
  assert.equal(kq.pcgd.length, 40);
  assert.equal(kq.pcgd.filter((r) => r.cn).length, 6);
  const tongTiet = kq.pcgd.reduce((s, r) => s + (r.so_tiet || 0), 0);
  assert.equal(tongTiet, 585);
  assert.equal(kq.tiet.length, tongTiet);
  assert.equal(kq.tiet_gv.length, tongTiet);
  assert.equal(kq.gv_ma.length, 38);
  const o = kq.tiet.find((t) => t.lop === "6A1" && t.thu === 2 && t.buoi === "S" && t.tiet === 1);
  assert.deepEqual([o.mon, o.ma_gv], ["Toán", "P.Ha"]);
  assert.ok(!kq.canh_bao.some((c) => c.includes("lệch")), kq.canh_bao.join(" | "));
});

test("khopGiaoVien khớp 40/40 tên và 38/38 mã", async () => {
  const ds = await docDsGv(DS);
  const kq = await docTkbSs(SS);
  const dsGv = ds.map((x, i) => ({ id: i + 1, ho_ten: x.ho_ten, ma_gv: x.ma_gv, ma_gv_2: x.ma_gv_2 }));
  const k = khopGiaoVien({ dsGv, pcgd: kq.pcgd, maTkb: kq.gv_ma });
  assert.equal(k.pcgdChuaKhop.length, 0, k.pcgdChuaKhop.join(", "));
  assert.equal(k.maChuaKhop.length, 0, k.maChuaKhop.join(", "));
  assert.equal(k.theoTen.size, 40);
  assert.equal(k.theoMa.size, 38);
});

test("suyMaTuPhanCong suy được mã cho hầu hết GV có tiết", async () => {
  const kq = await docTkbSs(SS);
  const m = suyMaTuPhanCong(kq.pcgd, kq.tiet_gv);
  assert.equal(m.get("Nguyen Thi Thuy Ha"), "Thuy Ha");
  assert.equal(m.get("Phung Thi Thu Ha"), "P.Ha");
  assert.ok(m.size >= 30, `chỉ suy được ${m.size}`);
});
