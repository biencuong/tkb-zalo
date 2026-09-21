/**
 * Tiến trình chính của TKB Zalo.
 */
import path from "node:path";
import fs from "node:fs";
import { app, BrowserWindow, Menu, shell, dialog } from "electron";
import { fileURLToPath } from "node:url";
import * as db from "./db.js";
import * as tep from "./kho-file.js";
import * as zalo from "./zalo.js";
import * as capNhat from "./cap-nhat.js";
import { dangKyTatCa, datCuaSo, datDuongDan } from "./ipc.js";
import { dongCuaSoVe, hamNongCuaSoVe } from "./anh-tkb.js";

const GOC = path.dirname(path.dirname(fileURLToPath(import.meta.url)));   // …/src
const RENDERER = path.join(GOC, "renderer");

app.setName("TKB Zalo");
// Đặt tiếng Việt cho cả Chromium: ô chọn ngày mới hiện dd/mm/yyyy thay vì mm/dd/yyyy kiểu Mỹ.
app.commandLine.appendSwitch("lang", "vi-VN");

/** Ghi một dòng vào loi.log trong thư mục dữ liệu người dùng (dùng cả cho vết khởi động). */
function ghiLoiRaTep(chu) {
  try {
    fs.appendFileSync(path.join(app.getPath("userData"), "loi.log"),
      "[" + new Date().toISOString() + "] " + chu + String.fromCharCode(10));
  } catch { /* không ghi được thì thôi, không để chết app */ }
}

// Thư mục dữ liệu riêng cho kịch bản kiểm thử (không đụng dữ liệu thật). Phải đặt TRƯỚC khoá một bản.
if (process.env.TKBZALO_DU_LIEU) app.setPath("userData", process.env.TKBZALO_DU_LIEU);

// Chỉ cho chạy một bản. Bản thứ hai thoát ngay và đánh thức bản đang mở.
if (!app.requestSingleInstanceLock()) {
  ghiLoiRaTep("[khoi dong] da co ban dang chay, ban nay thoat");
  app.quit();
  process.exit(0);
}
ghiLoiRaTep(`[khoi dong] ${app.getVersion()} · dong goi=${app.isPackaged} · ${process.execPath}`);

let cua = null;
let duongDan = {};

function chuanBiDuongDan() {
  const duLieu = app.getPath("userData");
  const goc = path.join(app.getPath("documents"), tep.TEN_THU_MUC_GOC);
  const t = tep.taoThuMucChuan(goc);
  duongDan = {
    du_lieu: duLieu,
    goc_tai_lieu: goc,
    cho_xu_ly: t.cho_xu_ly, du_lieu_tkb: t.du_lieu, ds_gv: t.ds_gv, ket_xuat: t.ket_xuat,
    huong_dan_thu_muc: t.huong_dan,
    phien_zalo: path.join(duLieu, "zalo-phien.json"),
    ve_tkb_html: path.join(RENDERER, "ve-tkb.html"),
    csdl: "",
  };
  return duongDan;
}

function taoCuaSo() {
  cua = new BrowserWindow({
    width: 1320, height: 880, minWidth: 1024, minHeight: 640,
    backgroundColor: "#F0EEE6",
    title: "TKB Zalo",
    show: false,
    webPreferences: {
      preload: path.join(GOC, "preload", "preload.cjs"),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      spellcheck: false,
    },
  });
  cua.once("ready-to-show", () => { cua.show(); if (process.env.TKBZALO_DEVTOOLS) cua.webContents.openDevTools({ mode: "detach" }); });
  cua.on("closed", () => {
    cua = null;
    // ĐÓNG CỬA SỔ CHÍNH LÀ THOÁT HẲN. Không đợi "window-all-closed": cửa sổ vẽ ảnh ẨN vẫn còn nên sự kiện
    // đó không bao giờ tới → app chạy ngầm không cửa sổ, lần mở sau bị chặn "đã có bản đang chạy",
    // phải khởi động lại máy mới mở được (lỗi người dùng báo 21/9/2026).
    ghiLoiRaTep("[thoat] dong cua so chinh");
    app.quit();
  });

  // Lỗi bên trong giao diện cũng ghi vào loi.log để còn biết đường sửa khi người dùng báo hỏng.
  cua.webContents.on("console-message", (e) => {
    if (e.level !== "error" && e.level !== "warning") return;
    ghiLoiRaTep(`[giao dien ${e.level}] ${e.message} (${e.sourceId || "?"}:${e.lineNumber || 0})`);
  });
  cua.webContents.on("render-process-gone", (_e, ct) => {
    ghiLoiRaTep(`[giao dien thoat] ${ct.reason} ma ${ct.exitCode}`);
  });
  cua.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  cua.loadFile(path.join(RENDERER, "index.html"));
  return cua;
}

function dungMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Tệp",
      submenu: [
        { label: "Mở thư mục dữ liệu", click: () => shell.openPath(duongDan.goc_tai_lieu) },
        { label: "Mở thư mục chờ xử lý", click: () => shell.openPath(duongDan.cho_xu_ly) },
        { type: "separator" },
        { label: "Thoát", role: "quit" },
      ],
    },
    {
      label: "Xem",
      submenu: [
        { label: "Tải lại", role: "reload" },
        { label: "Phóng to", role: "zoomIn" },
        { label: "Thu nhỏ", role: "zoomOut" },
        { label: "Cỡ chữ mặc định", role: "resetZoom" },
        { type: "separator" },
        { label: "Công cụ nhà phát triển", role: "toggleDevTools" },
      ],
    },
    {
      label: "Trợ giúp",
      submenu: [
        { label: "Hướng dẫn sử dụng", click: () => cua?.webContents.send("dieu-huong", "tro-giup") },
        { label: "Rủi ro khi dùng Zalo cá nhân", click: () => cua?.webContents.send("dieu-huong", "rui-ro") },
        { type: "separator" },
        { label: "Kiểm tra cập nhật", click: () => cua?.webContents.send("mo-cap-nhat") },
        {
          label: "Giới thiệu",
          click: () => dialog.showMessageBox(cua, {
            type: "info", title: "TKB Zalo",
            message: "TKB Zalo " + app.getVersion(),
            detail:
              "Gửi thời khoá biểu cho giáo viên qua Zalo cá nhân.\n" +
              "Phần mềm miễn phí, không liên kết với Zalo hay bất kỳ phần mềm xếp thời khoá biểu nào.\n\n" +
              `Electron ${process.versions.electron} · Node ${process.versions.node}`,
            buttons: ["Đóng"],
          }),
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  ghiLoiRaTep("[khoi dong] san sang, dang dung thu muc");
  chuanBiDuongDan();
  try {
    db.moDb(duongDan.du_lieu);
    duongDan.csdl = db.duongDanCsdl();
  } catch (e) {
    dialog.showErrorBox("Không mở được dữ liệu", String(e?.message || e));
    app.quit();
    return;
  }
  zalo.datDuongDanPhien(duongDan.phien_zalo);
  datDuongDan(duongDan);
  dangKyTatCa();
  dungMenu();
  taoCuaSo();
  datCuaSo(cua);
  ghiLoiRaTep("[khoi dong] da mo cua so");

  // Kịch bản tự kiểm thoát (chỉ khi đặt biến môi trường): mở cửa sổ vẽ ẩn như lúc tạo ảnh,
  // rồi đóng cửa sổ chính — tiến trình phải kết thúc hẳn.
  if (process.env.TKBZALO_TU_KIEM_THOAT) {
    setTimeout(async () => {
      try { await hamNongCuaSoVe(duongDan.ve_tkb_html); ghiLoiRaTep("[tu kiem] da mo cua so ve an"); }
      catch (e) { ghiLoiRaTep("[tu kiem] khong mo duoc cua so ve: " + e.message); }
      cua?.close();
    }, 2500);
  }

  // Tự đăng nhập lại Zalo bằng phiên đã lưu (im lặng, không hiện QR)
  if (zalo.coPhienCu()) {
    setTimeout(() => {
      zalo.dangNhap({ onDoi: (t) => { try { cua?.webContents.send("zalo:doi", t); } catch { /* */ } } })
        .catch(() => { /* để người dùng tự quét lại khi cần */ });
    }, 2500).unref?.();
  }

  // Kiểm tra bản mới sau khi app đã chạy ổn định
  capNhat.kiemNenSauKhoiDong((kq) => { try { cua?.webContents.send("cap-nhat:co-ban-moi", kq); } catch { /* */ } });
  // Quay lại cửa sổ sau một lúc lâu: hỏi bản mới ngay (không đợi tới giờ hỏi định kỳ).
  app.on("browser-window-focus", () => capNhat.hoiNeuDaLau());

  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) { taoCuaSo(); datCuaSo(cua); } });
}).catch((e) => {
  // Lỗi ở đây trước nay im lặng nên app "tắt ngóm" không rõ vì sao — nay ghi lại và nói cho người dùng.
  ghiLoiRaTep("[khoi dong THAT BAI] " + String(e?.stack || e));
  try { dialog.showErrorBox("Không mở được phần mềm", String(e?.message || e)); } catch { /* */ }
  app.quit();
});

app.on("second-instance", () => {
  // Bản đang chạy mà không còn cửa sổ chính (chạy ngầm) thì MỞ LẠI cửa sổ — đừng để người dùng bấm mãi
  // mà không thấy gì hiện lên.
  if (!cua || cua.isDestroyed()) {
    ghiLoiRaTep("[khoi dong] bam mo lan nua ma khong con cua so - mo lai cua so");
    taoCuaSo();
    datCuaSo(cua);
    return;
  }
  if (cua.isMinimized()) cua.restore();
  cua.show();
  cua.focus();
});

app.on("window-all-closed", () => {
  ghiLoiRaTep("[thoat] het cua so");
  if (process.platform !== "darwin") app.quit();
});

let dangThoat = false;
app.on("before-quit", () => {
  if (dangThoat) return;
  dangThoat = true;
  dongCuaSoVe();
  try { db.dongDb(); } catch { /* */ }
  // Chốt chặn: còn thứ gì giữ tiến trình (kết nối Zalo, cửa sổ ẩn…) thì 5 giây sau vẫn thoát hẳn.
  setTimeout(() => { ghiLoiRaTep("[thoat] ep thoat sau 5 giay"); app.exit(0); }, 5000);
});
app.on("will-quit", () => ghiLoiRaTep("[thoat] xong"));

process.on("uncaughtException", (e) => {
  console.error("Loi khong bat duoc:", e);
  ghiLoiRaTep(String(e?.stack || e));
});
