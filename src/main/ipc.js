/**
 * Cầu nối giữa giao diện và phần xử lý: mỗi việc người dùng làm là một lệnh ở đây.
 * Mọi lệnh đều trả về đối tượng thường (không ném lỗi ra giao diện) để dễ hiện thông báo tử tế.
 */
import fs from "node:fs";
import path from "node:path";
import { app, dialog, shell, ipcMain, BrowserWindow } from "electron";
import * as db from "./db.js";
import * as gv from "./kho-gv.js";
import * as tkb from "./kho-tkb.js";
import * as gui from "./kho-gui.js";
import * as tk from "./thong-ke.js";
import * as tep from "./kho-file.js";
import * as tepKiem from "./kho-file-kiem.js";
import { phienBan } from "./phien-ban.js";
import * as zalo from "./zalo.js";
import * as hangDoi from "./hang-doi.js";
import * as anh from "./anh-tkb.js";
import * as taoWord from "./tao-word.js";
import * as capNhat from "./cap-nhat.js";
import * as tm from "./thu-muc.js";

let cua = null;
let duongDan = {};

export function datCuaSo(w) { cua = w; }
export function datDuongDan(d) { duongDan = d; }

const day = (kenh, du) => { try { if (cua && !cua.isDestroyed()) cua.webContents.send(kenh, du); } catch { /* */ } };

/** Bọc mọi lệnh: lỗi thành {ok:false, loi:[...]} kèm ghi nhật ký. */
function dangKy(ten, fn) {
  ipcMain.handle(ten, async (_su, ...t) => {
    try {
      const kq = await fn(...t);
      return kq === undefined ? { ok: true } : kq;
    } catch (e) {
      console.error(`[${ten}]`, e);
      try { db.ghiNhatKy("loi_lenh", { doi_tuong: ten, mo_ta: String(e?.message || e), muc: "loi" }); } catch { /* */ }
      return { ok: false, loi: [String(e?.message || e)] };
    }
  });
}

export function dangKyTatCa() {
  // Zalo báo lại khi tin ĐÃ TỚI MÁY người nhận và khi họ ĐÃ XEM — ghi vào lịch sử
  // rồi đẩy lên giao diện, để người dùng biết tin có thật sự đến nơi hay không.
  zalo.datBaoTrangThaiTin((loai, dsMsgId) => {
    try {
      const n = gui.danhDauTrangThaiTin(loai, dsMsgId);
      if (n > 0) cua?.webContents.send("gui:trang-thai-tin", { loai, so: n });
    } catch (e) { console.error("[gui] ghi trạng thái tin lỗi:", e?.message || e); }
  });

  // ------------------------------------------------ CHUNG
  dangKy("app:thong-tin", () => ({
    ok: true, phien_ban: phienBan(), ten: app.getName(),
    duong_dan: duongDan,
    dien_tu: process.versions.electron, node: process.versions.node,
  }));
  dangKy("app:cai-dat", () => ({ ok: true, cai_dat: db.tatCaCaiDat() }));
  dangKy("app:luu-cai-dat", (d) => {
    for (const [k, v] of Object.entries(d || {})) db.datCaiDat(k, v);
    db.ghiNhatKy("sua_cai_dat", { mo_ta: Object.keys(d || {}).join(", ") });
    return { ok: true, cai_dat: db.tatCaCaiDat() };
  });
  dangKy("app:mo-thu-muc", (p) => { shell.openPath(p || duongDan.goc_tai_lieu); return { ok: true }; });
  dangKy("app:mo-tep", (p) => { shell.openPath(p); return { ok: true }; });
  dangKy("app:mo-web", (u) => { shell.openExternal(u); return { ok: true }; });
  dangKy("app:nhat-ky", (n = 200) => ({ ok: true, ds: db.nhieu("SELECT * FROM nhat_ky ORDER BY id DESC LIMIT ?", n) }));
  dangKy("app:tong-quan", () => {
    const t = tkb.dsTkb();
    return {
      ok: true,
      so_gv: db.mot("SELECT COUNT(*) n FROM giao_vien WHERE hoat_dong=1").n,
      so_gv_co_uid: db.mot("SELECT COUNT(*) n FROM giao_vien WHERE hoat_dong=1 AND zalo_uid<>''").n,
      so_gv_co_sdt: db.mot("SELECT COUNT(*) n FROM giao_vien WHERE hoat_dong=1 AND dien_thoai<>''").n,
      so_nguoi_ngoai: db.mot("SELECT COUNT(*) n FROM nguoi_nhan WHERE hoat_dong=1").n,
      tkb_moi_nhat: t[0] || null, so_tkb: t.length,
      gui: gui.thongKeGui(),
      zalo: { ...zalo.trangThai, qr: undefined },
      gioi_han: hangDoi.kiemGioiHan(),
    };
  });

  /**
   * TIẾN ĐỘ 3 BƯỚC — quyết định bước nào mở được, bước nào còn khoá.
   * Luồng bắt buộc: có dữ liệu → có Zalo → mới gửi được.
   */
  dangKy("app:tien-do", () => {
    const soGv = db.mot("SELECT COUNT(*) n FROM giao_vien WHERE hoat_dong=1").n;
    const soSdt = db.mot("SELECT COUNT(*) n FROM giao_vien WHERE hoat_dong=1 AND dien_thoai<>''").n;
    const soUid = db.mot("SELECT COUNT(*) n FROM giao_vien WHERE hoat_dong=1 AND zalo_uid<>''").n;
    const t = db.mot("SELECT * FROM tkb ORDER BY nam_hoc DESC, so_tkb DESC LIMIT 1");
    const soTkb = db.mot("SELECT COUNT(*) n FROM tkb").n;
    let canTep = 0, coAnh = 0, coDocx = 0, thieuCn = 0;
    if (t) {
      canTep = db.mot("SELECT COUNT(*) n FROM tkb_gv WHERE tkb_id=? AND so_tiet_dem>0", t.id).n
             + db.mot("SELECT COUNT(*) n FROM tkb_lop WHERE tkb_id=?", t.id).n;
      coAnh = db.mot("SELECT COUNT(*) n FROM tkb_gv WHERE tkb_id=? AND anh_path<>''", t.id).n
            + db.mot("SELECT COUNT(*) n FROM tkb_lop WHERE tkb_id=? AND anh_path<>''", t.id).n;
      coDocx = db.mot("SELECT COUNT(*) n FROM tkb_gv WHERE tkb_id=? AND docx_path<>''", t.id).n
             + db.mot("SELECT COUNT(*) n FROM tkb_lop WHERE tkb_id=? AND docx_path<>''", t.id).n;
      thieuCn = db.mot("SELECT COUNT(*) n FROM tkb_lop WHERE tkb_id=? AND giao_vien_id IS NULL", t.id).n;
    }
    const daKetNoi = zalo.trangThai.status === "da_ket_noi";

    // Người nhận được tin: số điện thoại (giáo viên hoặc người ngoài) hoặc nhóm Zalo đã có mã nhóm.
    const soSdtNgoai = db.mot(
      "SELECT COUNT(*) n FROM nguoi_nhan WHERE hoat_dong=1 AND ifnull(la_nhom,0)=0 AND dien_thoai<>''").n;
    const soNhom = db.mot(
      "SELECT COUNT(*) n FROM nguoi_nhan WHERE hoat_dong=1 AND ifnull(la_nhom,0)=1 AND zalo_uid<>''").n;
    const soNguoiNhan = soSdt + soSdtNgoai + soNhom;
    const CHUA_CO_NGUOI = "chưa có ai để gửi — cần ít nhất 1 số điện thoại hoặc 1 nhóm Zalo";

    const b1 = { ma: "du-lieu", ten: "Dữ liệu", xong: false, thieu: [], viec: "" };
    if (!soTkb) b1.thieu.push("chưa nạp thời khoá biểu");
    if (!soNguoiNhan) b1.thieu.push(CHUA_CO_NGUOI);
    if (soTkb && coAnh < canTep) b1.thieu.push(`mới có ${coAnh}/${canTep} ảnh`);
    b1.xong = b1.thieu.length === 0;
    b1.viec = !soTkb ? "Nạp tệp Excel từ Smart Scheduler"
      : !soNguoiNhan ? "Điền số điện thoại hoặc chọn nhóm Zalo"
      : coAnh < canTep ? "Tạo ảnh thời khoá biểu" : "Đã đủ dữ liệu";

    // Không khoá: chọn nhóm Zalo phải kết nối trước, và kết nối lúc nào cũng được.
    const b2 = { ma: "zalo", ten: "Kết nối Zalo", xong: false, thieu: [], viec: "", khoa: false };
    if (!daKetNoi) b2.thieu.push("chưa quét mã QR");
    b2.xong = daKetNoi;
    b2.viec = !daKetNoi ? "Quét mã QR"
      : soUid || soNhom ? "Đã sẵn sàng" : "Đã kết nối — bấm Gửi, phần mềm tự dò Zalo";

    // Chỉ khoá vì thứ phần mềm không tự làm được: chưa có thời khoá biểu, chưa có ai để gửi.
    // Chưa kết nối Zalo → bấm Gửi là hộp QR tự hiện; chưa dò Zalo → hộp gửi tự dò.
    const b3 = { ma: "gui", ten: "Gửi", xong: false, thieu: [], viec: "", khoa: !(soTkb && soNguoiNhan) };
    const daGui = db.mot("SELECT COUNT(*) n FROM lich_su_gui WHERE ket_qua='xong'").n;
    b3.xong = daGui > 0;
    b3.viec = b3.khoa ? "Cần thời khoá biểu và người nhận"
      : daGui ? "Đã gửi " + daGui + " lượt"
      : !daKetNoi ? "Bấm là hiện mã QR Zalo" : "Gửi thời khoá biểu";
    // Nêu ĐÚNG thứ còn thiếu, đừng nói gộp.
    if (b3.khoa) {
      if (!soTkb) b3.thieu.push("chưa nạp thời khoá biểu");
      if (!soNguoiNhan) b3.thieu.push(CHUA_CO_NGUOI);
    }

    return {
      ok: true,
      buoc: [b1, b2, b3],
      so: {
        gv: soGv, sdt: soSdt, uid: soUid, tkb: soTkb,
        can_tep: canTep, co_anh: coAnh, co_docx: coDocx, thieu_cn: thieuCn, da_gui: daGui,
      },
      tkb_moi_nhat: t || null,
      zalo: { status: zalo.trangThai.status, ten: zalo.trangThai.ten, uid: zalo.trangThai.uid },
    };
  });

  // ------------------------------------------------ CHỌN TỆP
  dangKy("tep:chon", async ({ loc = "excel", nhieu: nhieuTep = false, tieu_de = "Chọn tệp" } = {}) => {
    const boLoc = loc === "word"
      ? [{ name: "Tệp Word", extensions: ["docx"] }]
      : loc === "excel"
      ? [{ name: "Tệp Excel", extensions: ["xlsx", "xlsm"] }]
      : [{ name: "Tệp Excel hoặc Word", extensions: ["xlsx", "xlsm", "docx"] }];
    const r = await dialog.showOpenDialog(cua, {
      title: tieu_de, properties: nhieuTep ? ["openFile", "multiSelections"] : ["openFile"], filters: boLoc,
    });
    return { ok: !r.canceled, duong_dan: r.filePaths || [] };
  });
  dangKy("tep:luu-o-dau", async ({ ten_goi_y = "ket-qua.xlsx", loc = "excel" } = {}) => {
    const r = await dialog.showSaveDialog(cua, {
      title: "Lưu tệp", defaultPath: path.join(duongDan.ket_xuat || app.getPath("documents"), ten_goi_y),
      filters: loc === "pdf" ? [{ name: "PDF", extensions: ["pdf"] }] : [{ name: "Excel", extensions: ["xlsx"] }],
    });
    return { ok: !r.canceled, duong_dan: r.filePath || "" };
  });
  dangKy("tep:kiem-tra", (p) => tep.kiemTraTep(p));
  dangKy("tep:quet-hop-thu", () => tep.quetHopThu(duongDan.cho_xu_ly));
  dangKy("tep:quet-ds-gv", async () => {
    const r = await tep.quetDsGv(duongDan.ds_gv);
    const daNap = db.layCaiDat("ds_gv_da_nap") || "";
    const moiNhat = r.ds[0] || null;
    const dau = String(db.layCaiDat("ds_gv_lan_dau") || "1") === "1";
    return {
      ...r,
      moi_nhat: moiNhat,
      // Có tệp mà chưa nạp bao giờ, hoặc tệp đã đổi so với lần nạp trước → nên nạp lại.
      nen_nap: Boolean(moiNhat) && daNap !== `${moiNhat.duong_dan}|${moiNhat.sua_luc_ms}`,
      lan_dau: dau,
    };
  });
  dangKy("tep:soi-thu-muc", (p) => tepKiem.soiThuMuc(p));
  dangKy("tep:duyet-kho", (soiKy = false) => tepKiem.duyetKhoVaDoiChieu(duongDan.goc_tai_lieu, { soiKy }));
  dangKy("tep:don-hop-thu", (ds) => tep.donHopThu(duongDan.cho_xu_ly, ds));
  dangKy("tep:tao-thu-muc-chuan", () => ({ ok: true, ...tep.taoThuMucChuan(duongDan.goc_tai_lieu) }));

  // ------------------------------------------------ THAO TÁC THƯ MỤC (kéo thả, tạo/sửa/xoá)
  // Thả vào vùng chính: tự phân loại theo nội dung, đặt tên chuẩn, bỏ tệp trùng, báo cáo đủ.
  dangKy("tm:nhan-tep", (ds) => tep.xepTepVaoKho(ds, duongDan));
  // Thả vào một thư mục người dùng tự chọn trong trình quản lý kho: chép nguyên như cũ.
  dangKy("tm:tha-tep", (ds, dich) => tm.nhanTepThaVao(dich || duongDan.cho_xu_ly, ds, duongDan.goc_tai_lieu));
  dangKy("tm:liet", (p) => tm.liet(p || duongDan.goc_tai_lieu, duongDan.goc_tai_lieu));
  dangKy("tm:tao", (cha, ten) => tm.taoThuMuc(cha || duongDan.goc_tai_lieu, ten, duongDan.goc_tai_lieu));
  dangKy("tm:doi-ten", (p, ten) => tm.doiTen(p, ten, duongDan.goc_tai_lieu));
  dangKy("tm:xoa", (p) => tm.xoa(p, duongDan.goc_tai_lieu));
  dangKy("tm:chuyen", (p, dich) => tm.chuyen(p, dich, duongDan.goc_tai_lieu));

  // ------------------------------------------------ GIÁO VIÊN
  dangKy("gv:ds", (loc) => ({ ok: true, ds: gv.dsGiaoVien(loc || {}) }));
  dangKy("gv:luu", (g) => gv.luuGiaoVien(g));
  dangKy("gv:xoa", (id, ep) => gv.xoaGiaoVien(id, { ep: Boolean(ep) }));
  dangKy("gv:xem-truoc-excel", (p) => gv.xemTruocDsGv(p));
  dangKy("gv:xoa-tat-ca", () => {
    const r = gv.xoaTatCaGiaoVien();
    // Cho phép nạp lại đúng tệp cũ: bỏ dấu "đã nạp tệp này".
    if (r.ok) db.datCaiDat("ds_gv_da_nap", "");
    return r;
  });
  dangKy("gv:nhap-excel", async (p) => {
    const r = await gv.nhapDsGvTuExcel(p);
    if (r?.ok) {
      // Ghi dấu tệp đã nạp để lần sau biết tệp trong kho có thay đổi hay không.
      let sua = 0;
      try { sua = Math.round(fs.statSync(p).mtimeMs); } catch { /* */ }
      db.datCaiDat("ds_gv_da_nap", `${p}|${sua}`);
      db.datCaiDat("ds_gv_lan_dau", "0");
    }
    return r;
  });
  dangKy("gv:nguoi-nhan", () => ({ ok: true, ds: gv.dsNguoiNhan() }));
  dangKy("gv:luu-nguoi-nhan", (n) => gv.luuNguoiNhan(n));
  dangKy("gv:xoa-nguoi-nhan", (id) => gv.xoaNguoiNhan(id));
  dangKy("gv:dat-nhan-nhanh", (id, loai) => gv.datNhanNhanh(id, loai));

  // ------------------------------------------------ THỜI KHOÁ BIỂU
  dangKy("tkb:ds", () => ({ ok: true, ds: tkb.dsTkb() }));
  dangKy("tkb:chi-tiet", (id) => ({ ok: true, tkb: tkb.chiTietTkb(id) }));
  dangKy("tkb:xem-truoc", (p) => tkb.xemTruocTkb(p));
  dangKy("tkb:kiem-word", (p) => tkb.kiemFileWord(p));
  dangKy("tkb:nhap", async (p) => {
    const xt = await tkb.xemTruocTkb(p.duongDanXlsx);
    const namHoc = p.ghiDeThongTin?.nam_hoc || xt.thong_tin.nam_hoc;
    const soTkb = p.ghiDeThongTin?.so_tkb ?? xt.thong_tin.so_tkb;
    // Cất tệp gốc vào kho theo năm học + số thời khoá biểu
    const luu = tep.luuVaoKho(duongDan.goc_tai_lieu, namHoc, soTkb, {
      xlsx: p.duongDanXlsx, docx_gv: p.docxGv, docx_lop: p.docxLop,
    });
    const r = await tkb.nhapTkb({
      ...p,
      duongDanXlsx: luu.tep.xlsx || p.duongDanXlsx,
      docxGv: luu.tep.docx_gv || p.docxGv,
      docxLop: luu.tep.docx_lop || p.docxLop,
      thuMucKho: duongDan.goc_tai_lieu,
    });
    if (r.ok) db.chay("UPDATE tkb SET thu_muc=? WHERE id=?", luu.thu_muc, r.tkb_id);
    return { ...r, thu_muc: luu.thu_muc };
  });
  dangKy("tkb:xoa", (id) => tkb.xoaTkb(id));
  dangKy("tkb:xoa-nhieu", (ids, { xoaTep = false } = {}) =>
    tkb.xoaNhieuTkb(ids, { xoaTep: Boolean(xoaTep), gocKho: duongDan.goc_tai_lieu }));
  dangKy("tkb:dat-gvcn", (id, lop, gvId) => tkb.datGvcn(id, lop, gvId));
  dangKy("tkb:luoi", (id, p) => ({ ok: true, ds: tkb.luoiTiet(id, p || {}) }));

  // ------------------------------------------------ ẢNH
  dangKy("anh:chuan-bi", async (tkbId, p = {}) => {
    const t = db.mot("SELECT thu_muc FROM tkb WHERE id=?", tkbId);
    const r = await anh.chuanBiAnh(tkbId, {
      thuMuc: t?.thu_muc || duongDan.goc_tai_lieu,
      html: duongDan.ve_tkb_html,
      gom: p.gom, veLai: p.ve_lai,
      onTienDo: (x) => day("anh:tien-do", x),
    });
    // Word theo mẫu Smart Scheduler, cả A4 và A5, tạo thẳng từ dữ liệu Excel.
    // Tệp cắt từ Word Smart Scheduler (nếu người dùng có thả) được giữ nguyên.
    let word;
    try {
      word = await taoWord.taoWordTuDuLieu(tkbId, {
        thuMuc: t?.thu_muc || duongDan.goc_tai_lieu,
        khoUuTien: db.layCaiDat("kho_giay_mac_dinh") || "A4",
        veLai: p.ve_lai,
        onTienDo: (x) => day("anh:tien-do", { ...x, ten: "Word · " + x.ten }),
      });
    } catch (e) { word = { ok: false, tao_moi: 0, loi: [String(e?.message || e)] }; }
    return { ok: r.ok, ...r, word };
  });
  dangKy("anh:xem-truoc", (tkbId, p) => anh.xemTruocAnh(tkbId, {
    ...p, html: duongDan.ve_tkb_html, thuMucTam: app.getPath("temp"),
  }));

  /**
   * Xem thử ĐÚNG NHƯ NGƯỜI NHẬN SẼ THẤY: lời nhắn, ảnh và tệp đính kèm của một người cụ thể.
   * Lấy thẳng từ bộ dựng đợt gửi nên nội dung y hệt lúc gửi thật.
   */
  dangKy("gui:xem-thu", async (tkbId, { loai, ma } = {}) => {
    const r = gui.chuanBiDotGui(tkbId, {});
    if (r.ok === false) return r;
    const m = (r.muc || []).find((x) => x.loai === loai && String(x.ma) === String(ma))
      || (r.muc || []).find((x) => x.loai === loai);
    if (!m) return { ok: false, loi: ["Chưa dựng được nội dung gửi cho mục này."] };
    let anhData = null;
    try {
      const a = await anh.xemTruocAnh(tkbId, { loai, ma, html: duongDan.ve_tkb_html, thuMucTam: app.getPath("temp") });
      anhData = a?.anh || null;
    } catch { /* chưa có ảnh thì hiện rõ là chưa có */ }
    const tenTep = (p2) => (p2 ? path.basename(p2) : "");
    let coTep = 0, coTep2 = 0;
    try { coTep = m.docx_path ? fs.statSync(m.docx_path).size : 0; } catch { /* */ }
    try { coTep2 = m.docx_path_2 ? fs.statSync(m.docx_path_2).size : 0; } catch { /* */ }
    return {
      ok: true,
      nguoi_ten: m.nguoi_ten, sdt: m.sdt, la_ban: m.la_ban,
      caption: m.caption || "",
      anh: anhData, co_anh: Boolean(m.anh_path), anh_ten: tenTep(m.anh_path),
      co_docx: Boolean(m.docx_path), docx_ten: tenTep(m.docx_path), docx_co: coTep,
      docx_ten_2: tenTep(m.docx_path_2), docx_co_2: coTep2,
      loai: m.loai, ma: m.ma, so_tiet: m.so_tiet,
    };
  });

  // ------------------------------------------------ ZALO
  dangKy("zalo:trang-thai", () => ({ ok: true, ...zalo.trangThai, gioi_han_tep: zalo.gioiHanTep() }));
  dangKy("zalo:dang-nhap", (quetMoi) => zalo.dangNhap({
    quetMoi: Boolean(quetMoi), onDoi: (t) => day("zalo:doi", t),
  }));
  dangKy("zalo:dang-xuat", (xoaPhien) => ({ ok: true, ...zalo.dangXuat({ xoaPhien: xoaPhien !== false }) }));
  dangKy("zalo:do-uid", async ({ chiThieu = true } = {}) => {
    // Dò là dò CẢ NHÓM: tên nhóm và số thành viên đổi theo thời gian, nhóm đã rời thì phải biết.
    const nhom = await lamMoiNhom();
    const ds = gv.canDoUid({ chiThieu });
    if (!ds.length) {
      return {
        ok: true, n: 0, so_nhom: nhom.so_nhom, nhom_mat: nhom.mat,
        ghi_chu: nhom.so_nhom
          ? `Mọi người đã có Zalo. Đã làm mới ${nhom.so_nhom} nhóm.`
          : "Không có ai cần dò (mọi người đã có Zalo UID).",
      };
    }
    const map = await zalo.doUid(ds.map((x) => x.dien_thoai), (t) => day("zalo:do-tien-do", t));
    const capNhatDs = ds.map((x) => {
      const u = map.get(x.dien_thoai);
      return { nguoi_loai: x.nguoi_loai, id: x.id, uid: u?.uid || "", ten: u?.ten || "", trang_thai: u ? "da_co" : "khong_thay" };
    });
    gv.capNhatUid(capNhatDs);
    const thay = capNhatDs.filter((x) => x.uid).length;
    db.ghiNhatKy("do_uid", { mo_ta: `Dò ${ds.length} số, tìm thấy ${thay}, làm mới ${nhom.so_nhom} nhóm` });
    return {
      ok: true, n: ds.length, tim_thay: thay, khong_thay: ds.length - thay,
      so_nhom: nhom.so_nhom, nhom_mat: nhom.mat,
    };
  });
  dangKy("zalo:doi-chieu-ban-be", async () => {
    const tap = await zalo.dsBanBe();
    gv.capNhatLaBan(tap);
    const nhom = await lamMoiNhom();
    return { ok: true, so_ban: tap.size, so_nhom: nhom.so_nhom, nhom_mat: nhom.mat };
  });

  /**
   * Làm mới các NHÓM đã nhận: tên nhóm và số thành viên đổi theo thời gian, và nhóm mình đã rời
   * thì phải đánh dấu để khỏi gửi vào chỗ không còn ở đó.
   */
  async function lamMoiNhom() {
    const daCo = db.nhieu("SELECT id, zalo_uid, ho_ten FROM nguoi_nhan WHERE ifnull(la_nhom,0)=1");
    if (!daCo.length) return { so_nhom: 0, mat: [] };
    let ds = [];
    try { ds = await zalo.dsNhom(); } catch { return { so_nhom: 0, mat: [] }; }
    const theoId = new Map(ds.map((n) => [String(n.id), n]));
    const mat = [];
    for (const x of daCo) {
      const n = theoId.get(String(x.zalo_uid));
      if (n) {
        db.chay(
          "UPDATE nguoi_nhan SET ho_ten=?, zalo_ten=?, ghi_chu=?, la_ban=1, zalo_trang_thai='da_co' WHERE id=?",
          n.ten, n.ten, `Nhóm Zalo · ${n.so_thanh_vien || 0} thành viên`, x.id
        );
      } else {
        db.chay("UPDATE nguoi_nhan SET zalo_trang_thai='khong_thay', ghi_chu=? WHERE id=?",
          "Nhóm Zalo · không còn thấy nhóm này (có thể đã rời nhóm)", x.id);
        mat.push(x.ho_ten);
      }
    }
    return { so_nhom: daCo.length, mat };
  }
  dangKy("zalo:ds-nhom", async () => ({ ok: true, ds: await zalo.dsNhom() }));
  /** Dò RIÊNG NHÓM: lấy lại mã nhóm, tên và số thành viên cho các nhóm đã nhận. */
  dangKy("zalo:lam-moi-nhom", async () => {
    const r = await lamMoiNhom();
    return { ok: true, so_nhom: r.so_nhom, nhom_mat: r.mat };
  });

  /**
   * Thêm nhóm Zalo vào danh sách người nhận. Nhóm không cần số điện thoại — dùng thẳng mã nhóm,
   * và coi như đã kết bạn vì mình vốn ở trong nhóm.
   */
  dangKy("gv:them-nhom", (ds, nhan = "tat_ca_lop") => {
    let them = 0, capNhat = 0;
    for (const n of ds || []) {
      const cu2 = db.mot("SELECT id FROM nguoi_nhan WHERE zalo_uid=?", String(n.id));
      let id;
      if (cu2) {
        db.chay(
          "UPDATE nguoi_nhan SET ho_ten=?, ghi_chu=?, la_nhom=1, la_ban=1, zalo_trang_thai='da_co', hoat_dong=1 WHERE id=?",
          n.ten, `Nhóm Zalo · ${n.so_thanh_vien || 0} thành viên`, cu2.id
        );
        id = cu2.id;
        capNhat += 1;
      } else {
        const r = db.chay(
          `INSERT INTO nguoi_nhan(ho_ten,chuc_danh,dien_thoai,zalo_uid,zalo_ten,zalo_trang_thai,la_ban,la_nhom,ghi_chu,hoat_dong)
           VALUES(?,?,?,?,?,?,?,?,?,1)`,
          n.ten, "Nhóm Zalo", "", String(n.id), n.ten, "da_co", 1, 1,
          `Nhóm Zalo · ${n.so_thanh_vien || 0} thành viên`
        );
        id = Number(r.lastInsertRowid);
        them += 1;
      }
      // KHÔNG CÓ ĐĂNG KÝ THÌ KHÔNG CÓ GÌ ĐỂ GỬI — đây là lý do trước đây thêm nhóm xong
      // bấm gửi vẫn không có tin nào vào nhóm.
      if (nhan && nhan !== "khong") {
        const daCo = db.mot("SELECT id FROM nguoi_nhan_dk WHERE nguoi_nhan_id=? AND loai=?", id, nhan);
        if (!daCo) db.chay("INSERT INTO nguoi_nhan_dk(nguoi_nhan_id,loai,lop,giao_vien_id) VALUES(?,?,'',NULL)", id, nhan);
      }
    }
    db.ghiNhatKy("them_nhom_zalo", { mo_ta: `${them} thêm mới, ${capNhat} cập nhật, nhận: ${nhan}` });
    return { ok: true, them, capNhat, nhan };
  });

  dangKy("zalo:moi-ket-ban", async (uid, loiNhan) => zalo.moiKetBan(uid, loiNhan));

  // ------------------------------------------------ GỬI
  dangKy("gui:chuan-bi", (tkbId, tuyChon) => gui.chuanBiDotGui(tkbId, tuyChon || {}));
  dangKy("gui:tao-dot", (tkbId, tuyChon, muc) => {
    db.datCaiDat("tuy_chon_gui_json", JSON.stringify(tuyChon || {}));
    return gui.taoDotGui(tkbId, tuyChon, muc, { zaloUid: zalo.trangThai.uid || "", zaloTen: zalo.trangThai.ten || "" });
  });
  dangKy("gui:gioi-han", (dotId) => ({ ok: true, ...hangDoi.kiemGioiHan(dotId || null) }));
  dangKy("gui:chay", (dotId) => hangDoi.chay_(dotId));
  dangKy("gui:thu", (dotId, n) => hangDoi.guiThu(dotId, n || 3));
  dangKy("gui:tam-dung", (lyDo) => hangDoi.tamDung(lyDo));
  dangKy("gui:gui-lai-loi", (dotId) => hangDoi.guiLaiLoi(dotId));
  dangKy("gui:tinh-trang", () => ({ ok: true, ...hangDoi.layTinhTrang() }));
  dangKy("gui:ds-dot", (n) => ({ ok: true, ds: gui.dsDotGui(n || 50) }));
  dangKy("gui:chi-tiet-dot", (id) => ({ ok: true, dot: gui.chiTietDotGui(id) }));
  dangKy("gui:lich-su", (loc, n) => ({ ok: true, ds: gui.lichSuGui(loc || {}, n || 500) }));
  dangKy("gui:da-nhan", (tkbId) => ({ ok: true, ds: gui.tongHopDaNhan(tkbId || null) }));
  dangKy("gui:ds-loi", (dotId) => ({ ok: true, ...gui.gomLoiDot(dotId) }));

  // ------------------------------------------------ THỐNG KÊ
  dangKy("tk:nguon-loc", () => ({ ok: true, ...tk.nguonLoc() }));
  dangKy("tk:thong-ke", (loc, cachXem) => ({ ok: true, ...tk.thongKe(loc || {}, cachXem || "gv") }));
  dangKy("tk:ma-tran", (loc, truc) => ({ ok: true, ...tk.maTran(loc || {}, truc || "lop") }));
  dangKy("tk:du-lieu-in", (loc, cachXem) => ({ ok: true, ...tk.duLieuIn(loc || {}, cachXem || "gv") }));
  dangKy("tk:xuat-excel", async (loc, cachXem, duongDanRa) => {
    const f = duongDanRa || path.join(duongDan.ket_xuat, `Thong-ke-tiet-${new Date().toISOString().slice(0, 10)}.xlsx`);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    const r = await tk.xuatExcel({
      loc: loc || {}, cachXem: cachXem?.length ? cachXem : ["gv"], duongDan: f,
      tenTruong: db.layCaiDat("ten_truong"),
    });
    db.ghiNhatKy("xuat_excel", { doi_tuong: f });
    return r;
  });
  dangKy("tk:in", async (html) => {
    const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    await w.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
    return new Promise((giai) => {
      w.webContents.print({ silent: false, printBackground: true }, (ok, loi) => {
        w.destroy();
        giai(ok ? { ok: true } : { ok: false, loi: [loi || "Đã huỷ in."] });
      });
    });
  });
  dangKy("tk:xuat-pdf", async (html, duongDanRa) => {
    const f = duongDanRa || path.join(duongDan.ket_xuat, `Thong-ke-${Date.now()}.pdf`);
    const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
    await w.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
    const pdf = await w.webContents.printToPDF({ printBackground: true, pageSize: "A4", margins: { marginType: "default" } });
    w.destroy();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, pdf);
    return { ok: true, duong_dan: f };
  });

  // ------------------------------------------------ CẬP NHẬT
  dangKy("cap-nhat:kiem", (dungCache) => capNhat.kiemTraBanMoi({ dungCache: dungCache !== false }));
  dangKy("cap-nhat:tai-va-cai", () => capNhat.taiVaCai((t) => day("cap-nhat:tien-do", t)));
  dangKy("cap-nhat:bo-qua", (ban) => capNhat.boQuaBan(ban));
  dangKy("cap-nhat:mo-trang", () => capNhat.moTrangPhatHanh());

  // Hàng đợi đẩy tiến độ lên giao diện
  hangDoi.datBaoTienDo((t) => day("gui:tien-do", t));
}
