/**
 * Chạy thử app thật trong Electron: mở cửa sổ, nạp dữ liệu mẫu, chụp màn hình từng trang,
 * vẽ thử ảnh thời khoá biểu. Dùng để kiểm chứng giao diện mà không cần bấm tay.
 *
 * Chạy:  npx electron scripts/thu-chay.mjs
 * Ảnh ra thư mục:  <thư mục tạm>/tkbzalo-thu/
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";

const GOC = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MAU = path.join(GOC, "test", "mau");
const RA = path.join(os.tmpdir(), "tkbzalo-thu");
// Xoá sạch dữ liệu lần chạy trước để lần nào cũng bắt đầu từ máy trắng, kết quả mới so sánh được.
fs.rmSync(RA, { recursive: true, force: true });
fs.mkdirSync(RA, { recursive: true });

const loi = [];
const ghi = (s) => { console.log(s); };
const kiem = (dk, ten) => { if (dk) ghi("  ✔ " + ten); else { loi.push(ten); ghi("  ✖ " + ten); } };

// Không để Electron tự thoát khi cửa sổ vẽ ảnh bị đóng — nếu không, bài kiểm tra dừng giữa chừng.
app.on("window-all-closed", () => {});
app.disableHardwareAcceleration();
app.setPath("userData", path.join(RA, "du-lieu"));
app.setPath("documents", path.join(RA, "tai-lieu"));

app.whenReady().then(async () => {
  try {
    const db = await import("../src/main/db.js");
    const tep = await import("../src/main/kho-file.js");
    const gv = await import("../src/main/kho-gv.js");
    const tkbMod = await import("../src/main/kho-tkb.js");
    const anh = await import("../src/main/anh-tkb.js");
    const gui = await import("../src/main/kho-gui.js");
    const ipc = await import("../src/main/ipc.js");
    const zalo = await import("../src/main/zalo.js");

    ghi("\n[1] Mở cơ sở dữ liệu và tạo thư mục chuẩn");
    db.moDb(app.getPath("userData"));
    const tm = tep.taoThuMucChuan(path.join(app.getPath("documents"), "TKB Zalo"));
    kiem(fs.existsSync(tm.cho_xu_ly), "tạo được cây thư mục chuẩn");

    ghi("\n[2] Nhập dữ liệu mẫu");
    const r1 = await gv.nhapDsGvTuExcel(path.join(MAU, "ds gv.xlsx"));
    kiem(r1.them === 40, `nhập 40 giáo viên (thực tế ${r1.them})`);
    const r2 = await tkbMod.nhapTkb({
      duongDanXlsx: path.join(MAU, "SS.2609201832133477.xlsx"),
      docxGv: path.join(MAU, "TKBgvA4.docx"), docxLop: path.join(MAU, "TKB lop.docx"),
      thuMucKho: tm.goc,
    });
    kiem(r2.ok && r2.so_tiet === 585, `nhập thời khoá biểu 585 tiết (thực tế ${r2.so_tiet})`);
    kiem(r2.cat_docx?.gv?.daCat === 40, "cắt 40 tệp Word giáo viên");
    db.datCaiDat("ten_truong", "Trường THCS Minh Khai");
    db.datCaiDat("da_dong_y_rui_ro", "1");
    // giả lập đã dò Zalo để màn Gửi có dữ liệu
    gv.capNhatUid(gv.dsGiaoVien().map((g) => ({ nguoi_loai: "gv", id: g.id, uid: "uid" + g.id, ten: g.ho_ten, trang_thai: "da_co", la_ban: 1 })));

    ghi("\n[3] Vẽ ảnh thời khoá biểu (cửa sổ ẩn, chụp ngoài màn hình)");
    const html = path.join(GOC, "src", "renderer", "ve-tkb.html");
    const ct = tkbMod.chiTietTkb(r2.tkb_id);
    const gvThu = ct.gv.find((g) => g.ma_trong_tkb === "Thuy Ha");
    const a1 = await anh.veMotAnh({
      loai: "gv", ten: gvThu.ho_ten, phu: "Chủ nhiệm lớp 8A5",
      truong: "Trường THCS Minh Khai", so_tkb: 1, ngay: "18/08/2025", nam_hoc: "2025-2026", hoc_ky: 2,
      gom: "ca_ngay",
      tiet: tkbMod.luoiTiet(r2.tkb_id, { giaoVienId: gvThu.giao_vien_id }),
    }, path.join(RA, "anh-giao-vien.png"), html);
    kiem(a1.width === 2160 && a1.height > 1000, `ảnh giáo viên ${a1.width}×${a1.height} (mong 2160 ngang)`);

    const a2 = await anh.veMotAnh({
      loai: "lop", ten: "Lớp 6A1", phu: "Giáo viên chủ nhiệm: Đỗ Thị Ngọc Nhàn",
      truong: "Trường THCS Minh Khai", so_tkb: 1, ngay: "18/08/2025", nam_hoc: "2025-2026", hoc_ky: 2,
      gom: "ca_ngay", tiet: tkbMod.luoiTiet(r2.tkb_id, { lop: "6A1" }),
    }, path.join(RA, "anh-lop.png"), html);
    kiem(a2.width === 2160 && a2.height > 1000, `ảnh lớp ${a2.width}×${a2.height}`);

    ghi("\n[4] Chuẩn bị ảnh hàng loạt cho toàn bộ thời khoá biểu");
    const ra = await anh.chuanBiAnh(r2.tkb_id, { thuMuc: ct.thu_muc, html, onTienDo: () => {} });
    kiem(ra.ok && ra.tao_moi === 58, `tạo ${ra.tao_moi} ảnh (38 giáo viên có tiết + 20 lớp = 58)`);

    ghi("\n[5] Dựng danh sách gửi");
    const cb = gui.chuanBiDotGui(r2.tkb_id, {});
    kiem(cb.ok && cb.tom_tat.se_gui === 44, `44 mục sẽ gửi (thực tế ${cb.tom_tat.se_gui})`);
    kiem(cb.canh_bao.some((c) => c.includes("chưa có chủ nhiệm")), "cảnh báo lớp thiếu chủ nhiệm");

    ghi("\n[6] Mở giao diện thật và chụp màn hình từng trang");
    zalo.datDuongDanPhien(path.join(app.getPath("userData"), "zalo-phien.json"));
    ipc.datDuongDan({
      du_lieu: app.getPath("userData"), goc_tai_lieu: tm.goc, cho_xu_ly: tm.cho_xu_ly,
      du_lieu_tkb: tm.du_lieu, ds_gv: tm.ds_gv, ket_xuat: tm.ket_xuat, huong_dan_thu_muc: tm.huong_dan,
      ve_tkb_html: html, csdl: db.duongDanCsdl(),
    });
    ipc.dangKyTatCa();

    const cua = new BrowserWindow({
      width: 1400, height: 940, show: false, backgroundColor: "#F0EEE6",
      webPreferences: {
        preload: path.join(GOC, "src", "preload", "preload.cjs"),
        contextIsolation: true, nodeIntegration: false, sandbox: false,
      },
    });
    ipc.datCuaSo(cua);
    const loiTrang = [];
    cua.webContents.on("console-message", (e) => {
      if (e.level === "error" || e.level === "warning") loiTrang.push(`${e.message} (${e.sourceId}:${e.lineNumber})`);
    });
    await cua.loadFile(path.join(GOC, "src", "renderer", "index.html"));
    await new Promise((r) => setTimeout(r, 2500));

    const trangDs = [
      ["tong-quan", null], ["du-lieu", null], ["zalo", null], ["gui", null],
      ["thong-ke", null], ["cai-dat", null], ["cai-dat", { tab: "tro-giup" }],
    ];
    // Tổng quan là trang chủ: không nằm trong menu, vào lại bằng tiêu đề phần mềm.
    const menu = await cua.webContents.executeJavaScript(
      `[...document.querySelectorAll(".mnu")].map((x) => x.dataset.trang).join(",")`, true);
    kiem(!menu.split(",").includes("tong-quan"), `menu không còn mục Tổng quan (${menu})`);
    kiem(Boolean(await cua.webContents.executeJavaScript(`Boolean(document.getElementById("ve-nha"))`, true)),
      "tiêu đề phần mềm bấm được để về trang chủ");
    for (const [t, ts] of trangDs) {
      const ten = t + (ts?.tab ? "-" + ts.tab : "");
      await cua.webContents.executeJavaScript(
        `import("./js/app.js").then(m => m.di(${JSON.stringify(t)}, ${JSON.stringify(ts)}))`, true
      ).catch(() => {});
      await new Promise((r) => setTimeout(r, 1600));
      const img = await cua.webContents.capturePage();
      fs.writeFileSync(path.join(RA, `man-${ten}.png`), img.toPNG());
      const coNoiDung = await cua.webContents.executeJavaScript(
        `document.querySelector("#noi-dung")?.textContent.trim().length || 0`, true
      );
      kiem(coNoiDung > 200, `trang ${ten} có nội dung (${coNoiDung} ký tự)`);
    }

    // Trang Dữ liệu phải gom đủ ba khu; thanh bên phải thu gọn / mở lại được.
    await cua.webContents.executeJavaScript(`import("./js/app.js").then(m => m.di("du-lieu"))`, true).catch(() => {});
    await new Promise((r) => setTimeout(r, 2200));
    // Trang Dữ liệu có ba tab; bấm lần lượt phải ra nội dung, không để cuộn dài một mạch.
    const khu = [];
    for (const [tab, id] of [["nhap", "khu-nhap"], ["gv", "khu-gv"], ["tkb", "khu-tkb"]]) {
      await cua.webContents.executeJavaScript(
        `document.querySelector('[data-tab-dl="${tab}"]')?.click()`, true).catch(() => {});
      await new Promise((r) => setTimeout(r, 1400));
      const n = await cua.webContents.executeJavaScript(
        `(document.getElementById("${id}")?.hidden === false) ? document.getElementById("${id}").textContent.trim().length : 0`, true);
      if (n > 40) khu.push(`${tab}:${n}`);
    }
    kiem(khu.length === 3, `trang Dữ liệu đủ ba tab có nội dung (${khu.join(" ") || "không tab nào"})`);

    const soChip = await cua.webContents.executeJavaScript(
      `document.querySelectorAll("[data-chip-zalo], #nhip-zalo").length`, true);
    kiem(soChip >= 2, `có chỗ kết nối Zalo nhanh (${soChip} chỗ: đèn góc phải + chân thanh bên)`);

    const rongThuong = await cua.webContents.executeJavaScript(
      `import("./js/app.js").then(m => { m.datMini(true, false); return document.getElementById("ben").offsetWidth; })`, true);
    // Thu gọn: giấu nhãn dài, nhưng PHẢI còn chữ viết tắt dưới mỗi icon thì mới biết mục nào là mục nào.
    // (Chụp ảnh cửa sổ ẩn hay bị trễ khung hình nên đo bằng CSS.)
    const goiTat = await cua.webContents.executeJavaScript(`(() => {
      const hien = (s) => { const e = document.querySelector(s); return Boolean(e) && getComputedStyle(e).display !== "none"; };
      const an = (s) => !hien(s);
      const vt = [...document.querySelectorAll(".mnu-vt")].map((e) => e.textContent.trim());
      const trao = [...document.querySelectorAll(".mnu-vt")].every((e) => e.scrollWidth <= e.clientWidth + 1);
      return { an_nhan_dai: an(".mnu-chu") && an("#hieu .chu"),
               hien_viet_tat: hien(".mnu-vt") && hien(".chip-zalo .cz-chu") && hien(".chip-ban .cb-chu"),
               du_cho: trao, chu: vt.join("|") };
    })()`, true);
    kiem(goiTat.an_nhan_dai, "thu gọn thì giấu nhãn dài");
    kiem(goiTat.hien_viet_tat, `thu gọn vẫn hiện chữ viết tắt (${goiTat.chu})`);
    kiem(goiTat.du_cho, "chữ viết tắt không bị cắt mất");
    const rongRong = await cua.webContents.executeJavaScript(
      `import("./js/app.js").then(m => { m.datMini(false, false); return document.getElementById("ben").offsetWidth; })`, true);
    kiem(rongThuong < 80 && rongRong > 180, `thanh bên thu gọn ${rongThuong}px, mở rộng ${rongRong}px`);
    fs.writeFileSync(path.join(RA, "man-du-lieu-day-du.png"), (await cua.webContents.capturePage()).toPNG());

    // Hộp kết nối Zalo phải TỰ xin mã QR ngay khi mở, không bắt bấm thêm nút.
    // (window.api do contextBridge dựng nên không thay thế được để đếm lời gọi — kiểm phần người dùng thấy.)
    const hopQr = await cua.webContents.executeJavaScript(`(async () => {
      const m = await import("./js/zalo-nhanh.js");
      m.moKetNoiZalo();
      await new Promise((r) => setTimeout(r, 600));
      const than = document.querySelector("#zn-than");
      const co = {
        chu: than ? than.textContent.replace(/\s+/g, " ").trim().slice(0, 60) : "KHONG CO HOP",
        nut_thua: Boolean(than && than.querySelector('[data-zn="noi"]')),
        dang_lay: Boolean(than && (than.querySelector(".xoay") || than.querySelector("img"))),
      };
      document.querySelector("#hop .x")?.click();
      await new Promise((r) => setTimeout(r, 300));
      return co;
    })()`, true);
    kiem(hopQr.dang_lay && !hopQr.nut_thua, `mở hộp là tự lấy mã QR, không phải bấm thêm (${hopQr.chu})`);

    // Đèn nhịp góc phải: xám đứng yên khi chưa nối, xanh đập khi đã nối.
    const den = await cua.webContents.executeJavaScript(`(async () => {
      const e = document.getElementById("nhip-zalo");
      if (!e) return { co: false };
      // Bài kiểm mã QR ở trên để lại một phiên đang chờ quét — huỷ hẳn rồi mới đo,
      // nếu không sự kiện trạng thái bay về sẽ ghi đè lên.
      const m = await import("./js/zalo-nhanh.js");
      await window.api.zalo.dangXuat(true).catch(() => {});
      m.veChipZalo({ status: "chua_dang_nhap" });
      await new Promise((r) => setTimeout(r, 600));
      const g = getComputedStyle(e.querySelector(".nz-tim"));
      return { co: true, lop: e.className, dap: g.animationName !== "none",
               chu: e.querySelector(".nz-chu")?.textContent || "" };
    })()`, true);
    kiem(den.co, "có đèn nhịp Zalo ở góc phải");
    kiem(den.lop === "tat" && !den.dap, `chưa nối thì đèn xám đứng yên (lớp ${den.lop}, đập ${den.dap})`);

    const denNoi = await cua.webContents.executeJavaScript(`(async () => {
      const m = await import("./js/zalo-nhanh.js");
      m.veChipZalo({ status: "da_ket_noi", ten: "Tai khoan thu" });
      await new Promise((r) => setTimeout(r, 120));
      const e = document.getElementById("nhip-zalo");
      const g = getComputedStyle(e.querySelector(".nz-tim"));
      const kq = { lop: e.className, dap: g.animationName !== "none", chuky: g.animationDuration, chu: e.querySelector(".nz-chu").textContent };
      m.veChipZalo({ status: "chua_dang_nhap" });
      return kq;
    })()`, true);
    kiem(denNoi.lop === "noi" && denNoi.dap && denNoi.chuky === "1s",
      `nối rồi thì đèn xanh đập mỗi giây (lớp ${denNoi.lop}, chu kỳ ${denNoi.chuky}, chữ "${denNoi.chu}")`);

    const chipBan = await cua.webContents.executeJavaScript(`document.getElementById("ban-app")?.textContent.trim() || ""`, true);
    kiem(/^v\d+\.\d+\.\d+/.test(chipBan), `chân thanh bên hiện số hiệu chuẩn (${chipBan})`);

    if (loiTrang.length) {
      ghi("\n  Lỗi trong giao diện:");
      for (const l of [...new Set(loiTrang)].slice(0, 12)) ghi("   ! " + l);
      loi.push(`${loiTrang.length} lỗi giao diện`);
    }

    ghi(`\nẢnh và màn hình đã lưu ở: ${RA}`);
    ghi(loi.length ? `\nKẾT QUẢ: ${loi.length} mục KHÔNG ĐẠT\n` : "\nKẾT QUẢ: TẤT CẢ ĐẠT\n");
  } catch (e) {
    console.error("\nLỖI KHI CHẠY THỬ:", e?.stack || e);
    loi.push(String(e?.message || e));
  }
  app.exit(loi.length ? 1 : 0);
});
