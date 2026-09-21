/**
 * Khung giao diện: thanh bên theo QUY TRÌNH 3 BƯỚC, định tuyến, trạng thái chung.
 *
 * Luồng bắt buộc: có dữ liệu → có Zalo → mới gửi được.
 * Bước sau bị KHOÁ cho tới khi bước trước xong, và nói rõ còn thiếu gì.
 * Thanh bên có chế độ thu gọn (chỉ icon) và mở rộng; chân thanh bên là phiên bản + nút nối Zalo.
 */
import { $, $$, esc, bao, baoXau } from "./chung.js";
import { moHopCapNhat, ganTuDongKiem, banMoiDaBiet } from "./cap-nhat.js";
import { ganChipZalo, veChipZalo } from "./zalo-nhanh.js";

/** Mỗi mục có thể là một trang, hoặc nhiều tab cùng nhóm. */
const MUC = [
  // Tổng quan là trang chủ: mở app là vào đây, quay lại bằng cách bấm tên phần mềm ở đầu thanh bên.
  { ma: "tong-quan", ten: "Tổng quan", vt: "Tổng quan", bd: "◆", an: true, nap: () => import("./trang/tong-quan.js") },

  { nhom: "Quy trình", vt: "Quy trình" },
  { ma: "du-lieu", ten: "Dữ liệu", vt: "Dữ liệu", bd: "1", buoc: 0, nap: () => import("./trang/du-lieu.js") },
  { ma: "zalo", ten: "Kết nối Zalo", vt: "Zalo", bd: "2", buoc: 1, nap: () => import("./trang/zalo.js") },
  { ma: "gui", ten: "Gửi", vt: "Gửi", bd: "3", buoc: 2, nap: () => import("./trang/lich-su.js") },

  { nhom: "Khác", vt: "Khác" },
  { ma: "thong-ke", ten: "Thống kê số tiết", vt: "Thống kê", bd: "▦", nap: () => import("./trang/thong-ke.js") },
  {
    ma: "cai-dat", ten: "Cài đặt", vt: "Cài đặt", bd: "⚙",
    tab: [
      { ma: "cai-dat", ten: "Cài đặt", nap: () => import("./trang/cai-dat.js") },
      { ma: "tro-giup", ten: "Hướng dẫn sử dụng", nap: () => import("./trang/tro-giup.js") },
    ],
  },
];

export const trangThaiApp = { thongTin: null, caiDat: {}, zalo: {}, tienDo: null, trang: "", tab: "", huy: [] };

const timMuc = (ma) => MUC.find((m) => m.ma === ma);

function veDieuHuong() {
  const td = trangThaiApp.tienDo;
  $("#dieu-huong").innerHTML = MUC.filter((m) => !m.an).map((m) => {
    if (m.nhom) return `<div class="nhom-mnu"><span class="nm-day">${esc(m.nhom)}</span><span class="nm-vt">${esc(m.vt || m.nhom)}</span></div>`;
    const b = m.buoc != null ? td?.buoc?.[m.buoc] : null;
    const khoa = Boolean(b?.khoa);
    const xong = Boolean(b?.xong);
    const bd = m.buoc != null
      ? `<span class="bd so-buoc ${xong ? "xong" : khoa ? "khoa" : "dang"}">${xong ? "✓" : esc(m.bd)}</span>`
      : `<span class="bd">${esc(m.bd)}</span>`;
    const phu = b && !xong ? `<span class="viec-nho">${esc(b.viec)}</span>` : "";
    const nhac = khoa ? `Còn thiếu: ${(b.thieu || []).join(", ")}` : b && !xong ? b.viec : m.ten;
    // Khi thanh bên thu gọn chỉ còn icon, kèm chữ viết tắt rất nhỏ bên dưới cho dễ nhận ra.
    return `<button class="mnu ${khoa ? "khoa" : ""}" data-trang="${m.ma}" title="${esc(m.ten)} — ${esc(nhac)}">
      ${bd}<span class="mnu-chu">${esc(m.ten)}${phu}</span><span class="mnu-vt">${esc(m.vt || m.ten)}</span>${khoa ? '<span class="o-khoa">🔒</span>' : ""}</button>`;
  }).join("");
}

// ------------------------------------------------- thanh bên thu gọn / mở rộng

const KHOA_MINI = "tkbzalo.ben.mini";

export function datMini(mini, ghiNho = true) {
  const ben = $("#ben");
  ben.classList.toggle("mini", mini);
  const n = $("#thu-gon");
  if (n) {
    n.textContent = mini ? "»" : "«";
    n.title = mini ? "Mở rộng thanh bên (Ctrl+B)" : "Thu gọn thanh bên (Ctrl+B)";
  }
  if (ghiNho) { try { localStorage.setItem(KHOA_MINI, mini ? "1" : "0"); } catch { /* */ } }
}

function ganThuGon() {
  let mini = false;
  try { mini = localStorage.getItem(KHOA_MINI) === "1"; } catch { /* */ }
  datMini(mini, false);
  $("#thu-gon").addEventListener("click", () => datMini(!$("#ben").classList.contains("mini")));
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
      e.preventDefault();
      datMini(!$("#ben").classList.contains("mini"));
    }
  });
}

// ------------------------------------------------- chân thanh bên: phiên bản

/** Chip phiên bản — bấm để kiểm tra cập nhật; có bản mới thì hiện chấm đỏ. */
function veChipBan({ banMoi = "" } = {}) {
  const e = $("#ban-app");
  if (!e) return;
  const ban = trangThaiApp.thongTin?.phien_ban || "?";
  const co = Boolean(banMoi);
  e.classList.toggle("co-moi", co);
  e.innerHTML = (co ? '<span class="cham-moi"></span>' : "") + `<span class="cb-chu">v${esc(ban)}</span>`;
  e.classList.toggle("dai", ban.length > 6);
  e.title = co
    ? `Đã có bản ${banMoi} — bấm để cập nhật (đang dùng ${ban})`
    : `TKB Zalo ${ban} — bấm để kiểm tra cập nhật`;
}

// ------------------------------------------------- định tuyến

/** Chuyển trang. thamSo.tab để mở đúng tab. */
export async function di(ma, thamSo = null) {
  const m = timMuc(ma) || MUC[0];
  let b = m.buoc != null ? trangThaiApp.tienDo?.buoc?.[m.buoc] : null;
  // Trạng thái khoá có thể đã CŨ (vừa điền số điện thoại, vừa dò Zalo, vừa chọn nhóm…).
  // Tính lại một lần rồi mới từ chối — đừng chặn người dùng bằng số liệu cũ.
  if (b?.khoa) {
    await capNhatTienDo();
    b = trangThaiApp.tienDo?.buoc?.[m.buoc] || null;
  }
  if (b?.khoa) {
    bao(`<b>Chưa mở được “${esc(m.ten)}”.</b><br>Còn thiếu: ${esc((b.thieu || []).join(", "))}.`, "canh", 7);
    return;
  }

  for (const h of trangThaiApp.huy) { try { h(); } catch { /* */ } }
  trangThaiApp.huy = [];
  trangThaiApp.trang = m.ma;
  $$(".mnu").forEach((x) => x.classList.toggle("chon", x.dataset.trang === m.ma));
  $("#hieu")?.classList.toggle("dang-o-nha", m.ma === "tong-quan");

  const khung = $("#noi-dung");
  if (!m.tab) {
    trangThaiApp.tab = "";
    return moTrang(m, khung, thamSo);
  }

  const tab = m.tab.find((t) => t.ma === thamSo?.tab) || m.tab[0];
  trangThaiApp.tab = tab.ma;
  khung.innerHTML = `<div class="tab tab-lon" id="tab-nhom">
      ${m.tab.map((t) => `<button class="${t.ma === tab.ma ? "chon" : ""}" data-tab-nhom="${t.ma}">${esc(t.ten)}</button>`).join("")}
    </div><div id="noi-tab"></div>`;
  $("#tab-nhom").addEventListener("click", (e) => {
    const x = e.target.closest("[data-tab-nhom]");
    if (x) di(m.ma, { ...thamSo, tab: x.dataset.tabNhom });
  });
  return moTrang(tab, $("#noi-tab"), thamSo);
}

async function moTrang(m, khung, thamSo) {
  khung.innerHTML = `<div class="the"><div style="display:flex;gap:.8rem;align-items:center"><div class="xoay"></div><span class="mo">Đang mở…</span></div></div>`;
  try {
    const mod = await m.nap();
    const don = await mod.ve(khung, thamSo);
    if (typeof don === "function") trangThaiApp.huy.push(don);
    veChipZalo(trangThaiApp.zalo);
    $("#chinh").scrollTop = 0;
  } catch (e) {
    console.error(e);
    khung.innerHTML = `<div class="the"><div class="bao xau"><b>Không mở được ${esc(m.ten)}.</b>
      <span class="sua">${esc(e?.message || e)}</span></div></div>`;
  }
}

/** Nạp lại tiến độ rồi vẽ lại thanh bên. Gọi sau mỗi việc làm đổi trạng thái. */
export async function capNhatTienDo() {
  try {
    const td = await window.api.app.tienDo();
    if (td?.ok) trangThaiApp.tienDo = td;
  } catch { /* */ }
  veDieuHuong();
  return trangThaiApp.tienDo;
}

async function kiemDongYRuiRo() {
  if (trangThaiApp.caiDat.da_dong_y_rui_ro === "1") return;
  const { moHopRuiRo } = await import("./rui-ro.js");
  await moHopRuiRo({ batBuoc: true });
  const cd = await window.api.app.caiDat();
  trangThaiApp.caiDat = cd.cai_dat || {};
}

async function batDau() {
  const ti = await window.api.app.thongTin();
  trangThaiApp.thongTin = ti;
  veChipBan();
  const cd = await window.api.app.caiDat();
  trangThaiApp.caiDat = cd.cai_dat || {};
  if (trangThaiApp.caiDat.giao_dien_toi === "1") document.documentElement.dataset.theme = "dark";
  else if (trangThaiApp.caiDat.giao_dien_toi === "0") document.documentElement.dataset.theme = "light";

  ganThuGon();
  ganChipZalo();
  try {
    trangThaiApp.zalo = await window.api.zalo.trangThai();
    veChipZalo(trangThaiApp.zalo);
  } catch { /* */ }
  await capNhatTienDo();

  $("#dieu-huong").addEventListener("click", (e) => {
    const b = e.target.closest("[data-trang]");
    if (b) di(b.dataset.trang);
  });
  $("#ban-app").addEventListener("click", () => moHopCapNhat({ tuTay: true, ketQua: banMoiDaBiet }));
  for (const id of ["#ve-nha", "#ve-nha-mini"]) $(id)?.addEventListener("click", () => di("tong-quan"));
  document.addEventListener("tkb:ban-moi", (e) => veChipBan({ banMoi: e.detail?.ban_moi || "" }));

  window.api.zalo.onDoi(async (t) => {
    trangThaiApp.zalo = { ...trangThaiApp.zalo, ...t };
    veChipZalo(trangThaiApp.zalo);
    await capNhatTienDo();
  });
  window.api.onDieuHuong(async (ma) => {
    if (ma === "rui-ro") { const { moHopRuiRo } = await import("./rui-ro.js"); moHopRuiRo({}); }
    else if (ma === "tro-giup") di("cai-dat", { tab: "tro-giup" });
    else di(ma);
  });
  window.api.onMoCapNhat(() => moHopCapNhat({ tuTay: true }));
  ganTuDongKiem((kq) => veChipBan({ banMoi: kq?.ban_moi || "" }));

  await di("tong-quan");
  await kiemDongYRuiRo();
}

/**
 * Lỗi lập trình lọt ra ngoài: báo kèm CHỖ XẢY RA (tệp:dòng) để người dùng chụp màn hình là đủ
 * dữ kiện sửa. Lỗi giống hệt nhau trong 5 giây chỉ hiện MỘT lần, khỏi ngập kín màn hình.
 */
const loiVuaBao = new Map();

function baoLoiLapTrinh(chu, noi) {
  const khoa = chu + "|" + noi;
  const gio = Date.now();
  if (gio - (loiVuaBao.get(khoa) || 0) < 5000) return;
  loiVuaBao.set(khoa, gio);
  baoXau("<b>Lỗi trong phần mềm.</b><br>" + esc(chu)
    + (noi ? "<br><span class=\"mono nho mo\">" + esc(noi) + "</span>" : "")
    + "<br><span class=\"nho\">Việc đang làm có thể chưa xong."
    + " Chụp lại thông báo này để báo lỗi.</span>");
}

/** Rút gọn stack còn đúng dòng đầu tiên trong mã của mình. */
const goNoi = (st) => String(st || "").split("\n").slice(1, 2).join("").trim()
  .replace(/^at\s+/, "").replace(/.*\/js\//, "js/").slice(0, 120);

window.addEventListener("error", (e) => baoLoiLapTrinh(e.message,
  e.filename ? String(e.filename).replace(/.*\/js\//, "js/") + ":" + e.lineno : goNoi(e.error?.stack)));
window.addEventListener("unhandledrejection", (e) => baoLoiLapTrinh(
  String(e.reason?.message || e.reason), goNoi(e.reason?.stack)));

batDau();
