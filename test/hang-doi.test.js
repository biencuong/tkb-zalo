import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { moDb, dongDb, chay, nhieu, mot, datCaiDat } from "../src/main/db.js";
import { ghiLichSu, lichSuGui, dsLoiDot, gomLoiDot } from "../src/main/kho-gui.js";
import * as hd from "../src/main/hang-doi.js";

let kho = "";
const goi = [];              // nhật ký các lượt gọi Zalo giả
let kichBan = () => ({ ok: true, msg_id: "m" });

const zaloGia = {
  daKetNoi: () => true,
  ngau: () => 1,
  trangThai: { uid: "uid-gui" },
  guiAnh: async (uid, p, cap) => { goi.push({ viec: "anh", uid, p, cap }); return kichBan("anh", uid); },
  guiTep: async (uid, p) => { goi.push({ viec: "tep", uid, p }); return kichBan("tep", uid); },
  guiChu: async (uid, s) => { goi.push({ viec: "chu", uid, s }); return kichBan("chu", uid); },
  loiTamThoi: (e) => String(e?.message || "").includes("mạng"),
  loiMatPhien: (e) => String(e?.message || "").includes("401"),
};

function taoDot(soMuc, { coAnh = true, coTep = true, laBan = true } = {}) {
  const r = chay("INSERT INTO dot_gui(ten,trang_thai,tong) VALUES('Thử','moi',?)", soMuc);
  const dotId = Number(r.lastInsertRowid);
  for (let i = 1; i <= soMuc; i++) {
    chay(
      `INSERT INTO viec_gui(dot_id,tkb_id,loai,ma,nguoi_loai,nguoi_id,nguoi_ten,sdt,uid,caption,
       anh_path,anh_w,anh_h,docx_path,van_tay,buoc,trang_thai,la_ban)
       VALUES(?,NULL,'gv',?,'gv',?,?,?,?,?,?,?,?,?,?,?,'cho',?)`,
      dotId, "GV" + i, i, "Giáo viên " + i, "09000000" + String(i).padStart(2, "0"), "uid" + i,
      "Xin chào giáo viên " + i,
      coAnh ? path.join(kho, "a.png") : "", 1080, 1400,
      coTep ? path.join(kho, "b.docx") : "", "vt" + i,
      "gui_anh", laBan ? 1 : 0
    );
  }
  return dotId;
}

before(() => {
  kho = fs.mkdtempSync(path.join(os.tmpdir(), "tkbzalo-hd-"));
  moDb(kho);
  fs.writeFileSync(path.join(kho, "a.png"), "anh");
  fs.writeFileSync(path.join(kho, "b.docx"), "tep");
  for (const k of ["nhip_2_tin_min", "nhip_2_tin_max", "nhip_2_nguoi_min", "nhip_2_nguoi_max", "nghi_min", "nghi_max"]) datCaiDat(k, "1");
  datCaiDat("nghi_moi_n", "1000");
  datCaiDat("lui_khi_loi_ms", "1");
  datCaiDat("gioi_han_ban_24h", "9999");
  datCaiDat("gioi_han_la_24h", "9999");
  datCaiDat("gioi_han_tin_24h", "9999");
  datCaiDat("gioi_han_moi_dot", "9999");
  hd.datZaloThu(zaloGia);
});
after(() => {
  hd.datZaloThu(null);
  dongDb();
  try { fs.rmSync(kho, { recursive: true, force: true }); } catch { /* */ }
});
beforeEach(() => { goi.length = 0; kichBan = () => ({ ok: true, msg_id: "m" }); });

test("gửi trọn đợt: mỗi người 2 tin (ảnh có lời nhắn + file), ghi lịch sử đủ", async () => {
  const dot = taoDot(3);
  const kq = await hd.chay_(dot);
  assert.equal(kq.ok, true);
  assert.equal(kq.xong, 3);
  assert.equal(kq.loi, 0);
  assert.equal(goi.length, 6);
  assert.deepEqual(goi.map((g) => g.viec), ["anh", "tep", "anh", "tep", "anh", "tep"]);
  assert.equal(goi[0].cap, "Xin chào giáo viên 1", "lời nhắn phải đi kèm ảnh, không gửi riêng");
  assert.equal(mot("SELECT trang_thai FROM dot_gui WHERE id=?", dot).trang_thai, "xong");
  const ls = lichSuGui({});
  assert.equal(ls.length, 3);
  assert.ok(ls.every((x) => x.ket_qua === "xong" && x.co_anh === 1 && x.co_docx === 1 && x.zalo_uid_gui === "uid-gui"));
  assert.ok(ls.every((x) => x.anh_ten === "a.png" && x.docx_ten === "b.docx"));
});

test("chỉ có file (không ảnh): lời nhắn gửi riêng rồi mới tới file", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(2, { coAnh: false });
  await hd.chay_(dot);
  assert.deepEqual(goi.map((g) => g.viec), ["chu", "tep", "chu", "tep"]);
  assert.equal(goi[0].s, "Xin chào giáo viên 1");
});

test("tắt app giữa chừng: mở lại KHÔNG gửi lại ảnh, chỉ gửi nốt file", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(2);
  // giả lập: người 1 đã gửi xong ảnh thì app tắt (bước đã ghi là gui_file, trạng thái kẹt ở 'dang')
  const v1 = nhieu("SELECT * FROM viec_gui WHERE dot_id=? ORDER BY id", dot)[0];
  chay("UPDATE viec_gui SET buoc='gui_file', trang_thai='dang', msg_id_anh='da-gui' WHERE id=?", v1.id);

  await hd.chay_(dot);
  const cuaNguoi1 = goi.filter((g) => g.uid === "uid1");
  assert.deepEqual(cuaNguoi1.map((g) => g.viec), ["tep"], "không được gửi lại ảnh");
  const sau = mot("SELECT * FROM viec_gui WHERE id=?", v1.id);
  assert.equal(sau.trang_thai, "xong");
  assert.equal(sau.msg_id_anh, "da-gui", "giữ mã tin ảnh đã gửi trước đó");
});

test("lỗi tạm thời (mạng) thì thử lại, không tính là hỏng", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(1);
  let lan = 0;
  kichBan = (viec) => {
    if (viec === "anh") { lan++; if (lan <= 2) throw new Error("lỗi mạng tạm thời"); }
    return { ok: true, msg_id: "m" };
  };
  const kq = await hd.chay_(dot);
  assert.equal(kq.xong, 1);
  assert.equal(lan, 3, "phải thử lại đủ 3 lần mới thành công");
  assert.equal(mot("SELECT so_lan_thu FROM viec_gui WHERE dot_id=?", dot).so_lan_thu, 2);
});

test("ba lỗi liên tiếp thì TỰ DỪNG, phần còn lại vẫn ở hàng chờ", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(6);
  kichBan = () => { const e = new Error("Zalo từ chối"); e.code = 114; throw e; };
  const kq = await hd.chay_(dot);
  assert.equal(kq.loi, 3, "dừng ngay sau 3 lỗi");
  assert.equal(kq.cho, 3, "ba mục còn lại vẫn chờ");
  const d = mot("SELECT * FROM dot_gui WHERE id=?", dot);
  assert.equal(d.trang_thai, "dung_loi");
  assert.match(hd.layTinhTrang().ly_do_dung, /3 lỗi liên tiếp/);
  const ls = lichSuGui({ ket_qua: "loi" });
  assert.equal(ls.length, 3);
  assert.equal(ls[0].ma_loi, 114);
  assert.match(ls[0].loi, /Zalo từ chối/);
});

test("mất phiên (401) thì dừng ngay và nhắc quét lại QR", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(4);
  kichBan = () => { throw new Error("HTTP 401 unauthorized"); };
  const kq = await hd.chay_(dot);
  assert.equal(kq.loi, 1, "dừng ngay sau lỗi đầu tiên");
  assert.equal(kq.cho, 3);
  assert.match(hd.layTinhTrang().ly_do_dung, /Quét lại mã QR/);
});

test("gửi lại các mục lỗi", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(2);
  kichBan = () => { const e = new Error("hỏng"); e.code = 1; throw e; };
  await hd.chay_(dot);
  assert.equal(mot("SELECT COUNT(*) n FROM viec_gui WHERE dot_id=? AND trang_thai='loi'", dot).n, 2);

  kichBan = () => ({ ok: true, msg_id: "m" });
  const r = hd.guiLaiLoi(dot);
  assert.equal(r.n, 2);
  const kq = await hd.chay_(dot);
  assert.equal(kq.xong, 2);
  assert.equal(kq.loi, 0);
});

test("gửi thử 2 người rồi giữ phần còn lại ở hàng chờ", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(5);
  const kq = await hd.guiThu(dot, 2);
  assert.equal(kq.gui_thu, 2);
  assert.equal(mot("SELECT COUNT(*) n FROM viec_gui WHERE dot_id=? AND trang_thai='xong'", dot).n, 2);
  assert.equal(mot("SELECT COUNT(*) n FROM viec_gui WHERE dot_id=? AND trang_thai='cho'", dot).n, 3);
  assert.equal(mot("SELECT trang_thai FROM dot_gui WHERE id=?", dot).trang_thai, "tam_dung");
});

test("tiến độ được đẩy ra giao diện", async () => {
  chay("DELETE FROM lich_su_gui");
  const kieu = [];
  hd.datBaoTienDo((t) => kieu.push(t.kieu));
  const dot = taoDot(2);
  await hd.chay_(dot);
  hd.datBaoTienDo(null);
  assert.ok(kieu.includes("bat_dau"));
  assert.ok(kieu.filter((k) => k === "xong_mot").length === 2);
  assert.ok(kieu.includes("hoan_tat"));
});

test("chạm giới hạn 24 giờ thì DỪNG, phần còn lại giữ trong hàng chờ", async () => {
  chay("DELETE FROM lich_su_gui");
  datCaiDat("gioi_han_ban_24h", "2");
  const dot = taoDot(5);
  const kq = await hd.chay_(dot);
  assert.equal(kq.xong, 2, "chỉ gửi tới mức giới hạn");
  assert.equal(kq.cho, 3, "phần còn lại vẫn chờ, không mất");
  assert.match(hd.layTinhTrang().ly_do_dung, /giới hạn an toàn/);
  datCaiDat("gioi_han_ban_24h", "9999");
});

test("chặn ngay từ đầu nếu hôm nay đã gửi hết hạn mức", async () => {
  chay("DELETE FROM lich_su_gui");
  datCaiDat("gioi_han_ban_24h", "1");
  const dot0 = taoDot(1);
  await hd.chay_(dot0);
  const dot = taoDot(3);
  const kq = await hd.chay_(dot);
  assert.equal(kq.ok, false);
  assert.equal(kq.cham_gioi_han, true);
  assert.match(kq.loi[0], /Chạm giới hạn an toàn/);
  datCaiDat("gioi_han_ban_24h", "9999");
});

test("kiemGioiHan báo số còn gửi được và cảnh báo đợt quá lớn", async () => {
  chay("DELETE FROM lich_su_gui");
  datCaiDat("gioi_han_moi_dot", "2");
  const dot = taoDot(5);
  const g = hd.kiemGioiHan(dot);
  assert.equal(g.chan, false);
  assert.equal(g.so_trong_dot, 5);
  assert.ok(g.canh_bao.some((c) => c.includes("vượt mức khuyến nghị")));
  datCaiDat("gioi_han_moi_dot", "9999");
});

test("hết mức người LẠ thì vẫn gửi tiếp cho người ĐÃ KẾT BẠN", async () => {
  chay("DELETE FROM lich_su_gui");
  datCaiDat("gioi_han_la_24h", "1");
  const dot = taoDot(3, { laBan: true });
  // ba người nữa chưa kết bạn, thêm vào cùng đợt
  for (let i = 10; i < 13; i++) {
    chay(
      `INSERT INTO viec_gui(dot_id,loai,ma,nguoi_loai,nguoi_id,nguoi_ten,sdt,uid,caption,
       anh_path,anh_w,anh_h,docx_path,van_tay,buoc,trang_thai,la_ban)
       VALUES(?,'gv',?,'gv',?,?,?,?,?,?,?,?,?,?,'gui_anh','cho',0)`,
      dot, "L" + i, i, "Người lạ " + i, "09110000" + i, "uidla" + i, "chào",
      path.join(kho, "a.png"), 1080, 1400, path.join(kho, "b.docx"), "vtla" + i
    );
  }
  const kq = await hd.chay_(dot);
  assert.equal(kq.xong, 4, "3 người đã kết bạn + 1 người lạ trong hạn mức");
  assert.equal(kq.cho, 2, "2 người lạ vượt hạn mức vẫn nằm trong hàng chờ");
  datCaiDat("gioi_han_la_24h", "9999");
});

test("đổi tài khoản Zalo thì hạn mức tính lại từ đầu", async () => {
  chay("DELETE FROM lich_su_gui");
  datCaiDat("gioi_han_ban_24h", "2");
  const dot = taoDot(2);
  await hd.chay_(dot);
  assert.equal(hd.kiemGioiHan().con_ban, 0, "tài khoản hiện tại đã hết mức");

  zaloGia.trangThai.uid = "uid-khac";
  assert.equal(hd.kiemGioiHan().con_ban, 2, "tài khoản khác thì mức đầy lại");
  assert.equal(hd.demGanDay().tai_khoan, "uid-khac");

  zaloGia.trangThai.uid = "uid-gui";
  datCaiDat("gioi_han_ban_24h", "9999");
});

test("danh sách lỗi nêu đúng giáo viên, lý do và cách sửa", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(2);
  // một người mất phiên, một người lỗi Zalo thường
  let lan = 0;
  kichBan = () => { lan++; if (lan === 1) throw new Error("HTTP 401 unauthorized"); const e = new Error("Zalo từ chối"); e.code = 114; throw e; };
  await hd.chay_(dot);

  const ds = dsLoiDot(dot);
  assert.ok(ds.length >= 1);
  const x = ds[0];
  assert.equal(x.trang_thai, "loi");
  assert.equal(x.ho_ten, "Giáo viên 1");
  assert.equal(x.dien_thoai, "0900000001");
  assert.equal(x.noi_dung, "Thời khoá biểu cá nhân");
  assert.match(x.ly_do, /401/);
  assert.match(x.cach_sua, /quét lại mã QR/i);

  const gom = gomLoiDot(dot);
  assert.ok(gom.tong >= 1);
  assert.ok(gom.nhom[0].so_nguoi >= 1);
  assert.ok(gom.nhom[0].nguoi.includes("Giáo viên 1"));
});

test("người bị BỎ QUA cũng nằm trong danh sách lỗi kèm cách sửa", async () => {
  chay("DELETE FROM lich_su_gui");
  const dot = taoDot(1);
  chay("UPDATE viec_gui SET trang_thai='bo_qua', ly_do_bo_qua='Chưa dò được Zalo.', uid='' WHERE dot_id=?", dot);
  const ds = dsLoiDot(dot);
  assert.equal(ds.length, 1);
  assert.equal(ds[0].trang_thai, "bo_qua");
  assert.match(ds[0].ly_do, /Chưa dò được Zalo/);
  assert.match(ds[0].cach_sua, /Dò Zalo/);
});
