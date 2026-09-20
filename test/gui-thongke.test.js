import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { moDb, dongDb, chay, nhieu, mot, datCaiDat } from "../src/main/db.js";
import { nhapDsGvTuExcel, dsGiaoVien, capNhatUid } from "../src/main/kho-gv.js";
import { nhapTkb, dsTkb, chiTietTkb, datGvcn } from "../src/main/kho-tkb.js";
import { chuanBiDotGui, taoDotGui, ghiLichSu, lichSuGui, tongHopDaNhan, thongKeGui, dungTin } from "../src/main/kho-gui.js";
import { thongKe, nguonLoc, xuatExcel, moTaLoc, maTran, duLieuIn } from "../src/main/thong-ke.js";

const MAU = path.join(path.dirname(fileURLToPath(import.meta.url)), "mau");
const SS = path.join(MAU, "SS.2609201832133477.xlsx");
let kho = "", tkbId = 0;

before(async () => {
  kho = fs.mkdtempSync(path.join(os.tmpdir(), "tkbzalo-gui-"));
  moDb(kho);
  datCaiDat("ten_truong", "Trường THCS Minh Khai");
  await nhapDsGvTuExcel(path.join(MAU, "ds gv.xlsx"));
  const r = await nhapTkb({
    duongDanXlsx: SS, thuMucKho: kho,
    docxGv: path.join(MAU, "TKBgvA4.docx"), docxLop: path.join(MAU, "TKB lop.docx"),
  });
  tkbId = r.tkb_id;
  // Giả lập đã dò UID cho toàn bộ giáo viên
  capNhatUid(dsGiaoVien().map((g) => ({ nguoi_loai: "gv", id: g.id, uid: "uid" + g.id, ten: g.ho_ten, trang_thai: "da_co", la_ban: 1 })));
});
after(() => {
  dongDb();
  try { fs.rmSync(kho, { recursive: true, force: true }); } catch { /* */ }
});

test("thống kê theo giáo viên: khớp PCGD, không lệch, có cả giáo viên 0 tiết", () => {
  const kq = thongKe({ tkb_ids: [tkbId] }, "gv");
  assert.equal(kq.tong.tiet_tuan, 585);
  assert.equal(kq.tong.so_lech, 0, "không được lệch với số tiết PCGD khai");
  assert.equal(kq.dong.length, 40, "phải có đủ 40 giáo viên kể cả người 0 tiết");
  const nhan = kq.dong.find((d) => d.ma_gv === "D.Nhàn");
  assert.equal(nhan.tiet_tuan, 0);
  const loan = kq.dong.find((d) => d.ma_gv === "Loan");
  assert.equal(loan.tiet_tuan, 24);
});

test("thống kê theo lớp, theo môn, theo thứ/buổi", () => {
  const lop = thongKe({ tkb_ids: [tkbId] }, "lop");
  assert.equal(lop.dong.length, 20);
  assert.equal(lop.tong.tiet_tuan, 585);
  const mon = thongKe({ tkb_ids: [tkbId] }, "mon");
  assert.equal(mon.dong.length, 16);
  assert.equal(mon.dong[0].mon, "Toán");
  const tb = thongKe({ tkb_ids: [tkbId] }, "thu_buoi");
  assert.equal(tb.tong.tiet_tuan, 585);
  assert.ok(tb.dong.every((d) => d.thu >= 2 && d.thu <= 7));
});

test("lọc đa chiều: khối + môn + buổi + thứ cùng lúc", () => {
  const kq = thongKe({ tkb_ids: [tkbId], khoi: ["6"], mon: ["Toán"], buoi: ["S"] }, "gv");
  const kiem = nhieu(
    "SELECT COUNT(*) n FROM tiet WHERE tkb_id=? AND khoi='6' AND mon='Toán' AND buoi='S'", tkbId
  )[0].n;
  assert.equal(kq.tong.tiet_tuan, kiem);
  assert.ok(kq.tong.tiet_tuan > 0);

  const mot_thu = thongKe({ tkb_ids: [tkbId], thu: [2] }, "lop");
  const kiem2 = nhieu("SELECT COUNT(*) n FROM tiet WHERE tkb_id=? AND thu=2", tkbId)[0].n;
  assert.equal(mot_thu.tong.tiet_tuan, kiem2);

  const theoLop = thongKe({ tkb_ids: [tkbId], lop: ["6A1", "6A2"] }, "lop");
  assert.equal(theoLop.dong.length, 2);
});

test("lọc theo khoảng ngày nhân hệ số tuần", () => {
  // TKB áp dụng từ 18/08/2025, chưa có TKB sau nên ngày kết thúc trống → dùng đến hết khoảng lọc
  const kq = thongKe({ tu_ngay: "2025-08-18", den_ngay: "2025-09-14" }, "gv"); // 4 tuần chẵn
  assert.equal(kq.co_khoang, true);
  assert.equal(kq.tkb.length, 1);
  assert.equal(kq.tkb[0].he_so_tuan, 4);
  assert.equal(kq.tong.tiet_tuan, 585);
  assert.equal(kq.tong.tong_tiet, 585 * 4);

  const ngoai = thongKe({ tu_ngay: "2025-01-01", den_ngay: "2025-02-01" }, "gv");
  assert.equal(ngoai.tkb.length, 0, "TKB chưa áp dụng thì không được tính");
});

test("ma trận giáo viên × lớp", () => {
  const m = maTran({ tkb_ids: [tkbId] }, "lop");
  assert.equal(m.cot.length, 20);
  const tong = m.hang.reduce((s, h) => s + h.tong, 0);
  assert.equal(tong, 585);
});

test("mô tả bộ lọc bằng lời", () => {
  const d = moTaLoc({ tkb_ids: [tkbId], khoi: ["6", "7"], buoi: ["S"] });
  const txt = d.map((x) => x.join(": ")).join(" | ");
  assert.match(txt, /Thời khoá biểu: số 1/);
  assert.match(txt, /Khối: 6, 7/);
  assert.match(txt, /Buổi: Sáng/);
  assert.match(moTaLoc({}).map((x) => x.join(": ")).join(""), /Toàn bộ dữ liệu/);
});

test("xuất Excel nhiều cách xem, có sheet Bộ lọc", async () => {
  const f = path.join(kho, "thong-ke.xlsx");
  const r = await xuatExcel({ loc: { tkb_ids: [tkbId] }, cachXem: ["gv", "lop", "mon"], duongDan: f, tenTruong: "THCS Minh Khai" });
  assert.equal(r.ok, true);
  assert.equal(r.so_sheet, 4);
  assert.ok(fs.statSync(f).size > 5000);
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(f);
  assert.deepEqual(wb.worksheets.map((w) => w.name), ["Bộ lọc", "Theo giáo viên", "Theo lớp", "Theo môn"]);
  const ws = wb.getWorksheet("Theo giáo viên");
  assert.equal(ws.getRow(1).getCell(1).value, "Giáo viên");
  assert.equal(ws.lastRow.getCell(1).value, "TỔNG CỘNG");
  assert.equal(ws.rowCount, 42); // 1 tiêu đề + 40 GV + 1 tổng
});

test("dữ liệu in kèm mô tả bộ lọc và tên trường", () => {
  const d = duLieuIn({ tkb_ids: [tkbId], khoi: ["9"] }, "gv");
  assert.equal(d.ten_truong, "Trường THCS Minh Khai");
  assert.ok(d.cot.length > 3);
  assert.ok(d.mo_ta_loc.length >= 2);
  assert.ok(d.in_luc);
});

test("nguồn lọc đủ dữ liệu dựng giao diện", () => {
  const n = nguonLoc();
  assert.equal(n.tkb.length, 1);
  assert.equal(n.lop.length, 20);
  assert.equal(n.mon.length, 16);
  assert.equal(n.giao_vien.length, 40);
  assert.equal(n.thu.length, 6);
});

test("mẫu tin thay đúng biến", () => {
  const s = dungTin("{truong} gửi {ten} TKB số {so_tkb} từ {ngay}", { truong: "THCS A", ten: "Cô B", so_tkb: 1, ngay: "18/08/2025" });
  assert.equal(s, "THCS A gửi Cô B TKB số 1 từ 18/08/2025");
});

test("chuẩn bị đợt gửi: đủ giáo viên + lớp có chủ nhiệm, cảnh báo lớp thiếu chủ nhiệm", () => {
  const r = chuanBiDotGui(tkbId, { gui_anh: false, gui_docx: true });
  assert.equal(r.ok, true);
  const gv = r.muc.filter((m) => m.loai === "gv");
  const lop = r.muc.filter((m) => m.loai === "lop");
  assert.equal(gv.length, 38, "chỉ giáo viên có tiết");
  assert.equal(lop.length, 6, "chỉ lớp đã có chủ nhiệm");
  assert.equal(r.tom_tat.se_gui, 44);
  assert.equal(r.tom_tat.lan_dau, 44);
  assert.equal(r.tom_tat.trung, 0);
  assert.ok(r.canh_bao.some((c) => c.includes("14 lớp chưa có chủ nhiệm")));
  assert.ok(r.muc[0].caption.includes("Trường THCS Minh Khai"));
  assert.ok(r.muc[0].caption.includes("số 1"));
});

test("CẢNH BÁO GỬI TRÙNG sau khi đã gửi, và tuỳ chọn chỉ gửi phần thay đổi", () => {
  const r1 = chuanBiDotGui(tkbId, { gui_anh: false, gui_docx: true });
  const d = taoDotGui(tkbId, { gui_docx: true }, r1.muc, { zaloUid: "u1", zaloTen: "Tài khoản thử" });
  assert.equal(d.se_gui, 44);

  // Giả lập gửi xong toàn bộ
  for (const v of nhieu("SELECT * FROM viec_gui WHERE dot_id=? AND trang_thai='cho'", d.dot_id)) {
    chay("UPDATE viec_gui SET trang_thai='xong', buoc='xong' WHERE id=?", v.id);
    ghiLichSu(v, "xong", { msg_id_file: "m" + v.id, zalo_uid_gui: "u1" });
  }
  assert.equal(lichSuGui({}).length, 44);
  assert.equal(thongKeGui().thanh_cong, 44);

  // Lần 2: mọi thứ y nguyên → tất cả là trùng
  const r2 = chuanBiDotGui(tkbId, { gui_anh: false, gui_docx: true });
  assert.equal(r2.tom_tat.trung, 44);
  assert.equal(r2.tom_tat.se_gui, 0, "bỏ qua trùng theo mặc định");
  assert.ok(r2.canh_bao.some((c) => c.includes("đã gửi y nguyên")));

  // Bỏ tích "bỏ qua trùng" → vẫn gửi được nhưng có cảnh báo
  const r3 = chuanBiDotGui(tkbId, { gui_anh: false, gui_docx: true, bo_qua_trung: false });
  assert.equal(r3.tom_tat.se_gui, 44);
  assert.ok(r3.canh_bao.some((c) => c.includes("GỬI TRÙNG")));

  // Đổi lịch dạy của 1 giáo viên → chỉ người đó "thay đổi"
  const gv = chiTietTkb(tkbId).gv.find((g) => g.ma_trong_tkb === "Thuy Ha");
  chay("UPDATE tkb_gv SET van_tay='van-tay-moi' WHERE id=?", gv.id);
  const r4 = chuanBiDotGui(tkbId, { gui_anh: false, gui_docx: true, chi_thay_doi: true });
  assert.equal(r4.tom_tat.se_gui, 1);
  assert.equal(r4.muc.find((m) => !m.bo_qua).nguoi_ten, gv.ho_ten);
  assert.equal(r4.tom_tat.thay_doi, 1);
});

test("lịch sử gửi lọc được và tổng hợp ai đã nhận gì", () => {
  const ls = lichSuGui({ loai: "lop" });
  assert.equal(ls.length, 6);
  assert.ok(ls.every((x) => x.ket_qua === "xong" && x.docx_ten.endsWith(".docx")));
  assert.equal(lichSuGui({ tim: "6A1" }).length, 1);
  const th = tongHopDaNhan(tkbId);
  assert.equal(th.length, 44);
  assert.ok(th.every((x) => x.so_thanh_cong === 1));
});

test("người chưa có UID thì bị bỏ qua kèm lý do rõ ràng", () => {
  const gv = dsGiaoVien().find((g) => g.ma_gv === "Luỹ");
  chay("UPDATE giao_vien SET zalo_uid='', zalo_trang_thai='khong_thay' WHERE id=?", gv.id);
  const r = chuanBiDotGui(tkbId, { gui_anh: false, gui_docx: true, bo_qua_trung: false });
  const m = r.muc.find((x) => x.nguoi_id === gv.id && x.loai === "gv");
  assert.equal(m.bo_qua, "khong_co_uid");
  assert.match(m.ly_do, /Chưa dò được Zalo/);
  assert.ok(r.canh_bao.some((c) => c.includes("chưa dò được Zalo")));
  chay("UPDATE giao_vien SET zalo_uid=?, zalo_trang_thai='da_co' WHERE id=?", "uid" + gv.id, gv.id);
});

test("cảnh báo người chưa kết bạn Zalo", () => {
  const gv = dsGiaoVien().find((g) => g.ma_gv === "Tâm");
  chay("UPDATE giao_vien SET la_ban=0 WHERE id=?", gv.id);
  const r = chuanBiDotGui(tkbId, { gui_anh: false, gui_docx: true, bo_qua_trung: false });
  assert.ok(r.tom_tat.chua_la_ban >= 1);
  assert.ok(r.canh_bao.some((c) => c.includes("chưa kết bạn Zalo")));
  chay("UPDATE giao_vien SET la_ban=1 WHERE id=?", gv.id);
});
