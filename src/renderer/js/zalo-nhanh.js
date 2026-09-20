/**
 * Kết nối Zalo NHANH — dùng chung cho mọi chỗ cần.
 *
 * - chipZalo()      : nút icon nhỏ gắn vào tiêu đề bất kỳ trang nào.
 * - moKetNoiZalo()  : hộp thoại quét QR ngay tại chỗ; xong thì hiện thông tin
 *                     tài khoản rồi TỰ ĐÓNG SAU 5 GIÂY. Trả về true nếu đã kết nối.
 * - canZalo()       : bảo đảm đã kết nối trước khi làm việc (gửi tin, dò UID…).
 */
import { esc, so, moHop, dongHop, baoOk, hoi } from "./chung.js";

const GIAY_TU_DONG = 5;

/** Nhãn trạng thái ngắn. */
const NHAN = {
  da_ket_noi: { chu: "Zalo", lop: "n-ok", bd: "●" },
  cho_quet_qr: { chu: "Quét QR", lop: "n-canh", bd: "◔" },
  dang_dang_nhap: { chu: "Đang nối", lop: "n-coral", bd: "◔" },
};
const NHAN_TAT = { chu: "Nối Zalo", lop: "n-xam", bd: "○" };

/** HTML nút icon kết nối Zalo. Gắn ở đâu cũng được, tự cập nhật theo trạng thái. */
export function chipZalo({ chu = true } = {}) {
  return `<button class="chip-zalo" data-chip-zalo title="Kết nối Zalo"${chu ? "" : ' data-chi-icon="1"'}>
    <span class="cz-bd">○</span><span class="cz-chu">Nối Zalo</span></button>`;
}

/**
 * Đèn nhịp ở góc phải: XANH ĐẬP = đang kết nối, VÀNG = đang chờ quét mã, XÁM ĐỨNG YÊN = chưa nối.
 * Còn đập là còn online — đập do CSS nên chỉ cần đổi lớp, không tốn gì.
 */
function veNhipZalo(t) {
  const e = document.getElementById("nhip-zalo");
  if (!e) return;
  const noi = t?.status === "da_ket_noi";
  const cho = t?.status === "cho_quet_qr" || t?.status === "dang_dang_nhap";
  e.className = noi ? "noi" : cho ? "cho" : "tat";
  const chu = e.querySelector(".nz-chu");
  if (chu) chu.textContent = noi ? (t.ten || "Zalo") : cho ? "Đang nối" : "Zalo";
  e.title = noi
    ? `Đang kết nối Zalo: ${t.ten || ""} ${t.sdt || ""}`.trim()
    : cho ? "Đang chờ quét mã QR" : "Chưa kết nối Zalo — bấm để quét mã";
}

/** Vẽ lại mọi chip trên màn hình theo trạng thái mới. */
export function veChipZalo(t) {
  veNhipZalo(t);
  const n = NHAN[t?.status] || NHAN_TAT;
  for (const el of document.querySelectorAll("[data-chip-zalo]")) {
    el.className = "chip-zalo " + n.lop + (t?.status === "da_ket_noi" ? " noi" : "");
    el.querySelector(".cz-bd").textContent = n.bd;
    const c = el.querySelector(".cz-chu");
    if (c) {
      const trongBen = el.closest("#ben");
      c.textContent = t?.status === "da_ket_noi"
        ? (trongBen ? "Zalo" : (t.ten || "Đã kết nối"))
        : (trongBen ? "Zalo" : n.chu);
    }
    el.title = t?.status === "da_ket_noi"
      ? `Zalo: ${t.ten || ""} ${t.sdt || ""} — bấm để xem hoặc đổi tài khoản`
      : "Chưa kết nối Zalo — bấm để quét mã QR";
  }
}

/** Bắt sự kiện bấm chip ở bất kỳ đâu (gắn một lần ở app.js). */
export function ganChipZalo() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-chip-zalo]") || e.target.closest("#nhip-zalo")) moKetNoiZalo();
  });

  // Phiên Zalo có thể đứt lặng lẽ (hết hạn, đăng nhập chỗ khác). Hỏi lại định kỳ để đèn
  // không đập tiếp khi thật ra đã mất kết nối — "còn đập là còn online" phải đúng.
  setInterval(async () => {
    try { veChipZalo(await window.api.zalo.trangThai()); } catch { /* */ }
  }, 30000);
}

function veThan(t, conLai) {
  if (t.status === "da_ket_noi") {
    return `<div class="zn-xong">
      <div class="zn-vong">✓</div>
      <p class="zn-tit">Đã kết nối Zalo</p>
      <table class="b" style="margin-top:.5rem"><tbody>
        <tr><td style="width:40%">Tài khoản</td><td><b>${esc(t.ten || "(không rõ tên)")}</b></td></tr>
        ${t.sdt ? `<tr><td>Số điện thoại</td><td class="mono">${esc(t.sdt)}</td></tr>` : ""}
        <tr><td>Zalo UID</td><td class="mono nho">${esc(t.uid || "")}</td></tr>
        ${t.gioi_han_tep ? `<tr><td>Tệp tối đa</td><td>${so(t.gioi_han_tep.max_size_mb)} MB</td></tr>` : ""}
      </tbody></table>
      <p class="nho mo" style="margin:.6rem 0 0">Tự đóng sau <b id="zn-dem">${conLai}</b> giây.</p>
    </div>`;
  }
  if (t.status === "cho_quet_qr") {
    return `<div class="qr-khung">
      ${t.qr ? `<img src="${esc(t.qr)}" alt="Mã QR đăng nhập Zalo">`
             : '<div class="xoay"></div><p class="mo">Đang lấy mã QR…</p>'}
      <p class="giua" style="margin:0">Mở <b>Zalo trên điện thoại</b> → Thêm → Quét mã.</p>
      <button class="nut nho" data-zn="lai">Mã mờ hoặc hết hạn? Lấy mã khác</button>
    </div>`;
  }
  if (t.status === "dang_dang_nhap") {
    return '<div class="qr-khung"><div class="xoay"></div><p class="mo">Đang vào lại bằng phiên đã lưu…</p></div>';
  }
  // Chưa kết nối: hộp tự xin mã ngay khi mở, nên trạng thái này chỉ gặp khi mã hết hạn hoặc lỗi.
  return `<div class="qr-khung">
    ${t.loi
      ? `<div class="bao xau" style="width:100%"><b>Mã hết hạn hoặc chưa lấy được.</b>
           <span class="sua">${esc(t.loi)}</span></div>`
      : '<div class="xoay"></div><p class="mo">Đang lấy mã QR…</p>'}
    <p class="giua" style="margin:0">Quét một lần, phiên lưu trên máy này.</p>
    ${t.loi ? '<button class="nut chinh" data-zn="lai">Lấy mã mới</button>' : ""}
  </div>`;
}

let dangMo = null;

/**
 * Mở hộp kết nối Zalo. Trả về true nếu kết thúc ở trạng thái đã kết nối.
 * Mở hộp là TỰ XIN MÃ QR luôn, người dùng không phải bấm thêm nút nào;
 * chỉ khi mã hết hạn hoặc lỗi mới phải bấm “Lấy mã mới”.
 */
export function moKetNoiZalo({ loiNhac = "" } = {}) {
  if (dangMo) return dangMo;
  dangMo = (async () => {
    let t = await window.api.zalo.trangThai();
    let boNghe = null, dem = null;

    const kq = await moHop({
      tieuDe: "Kết nối Zalo",
      noiDung: (loiNhac ? `<div class="bao canh">${esc(loiNhac)}</div>` : "") + `<div id="zn-than">${veThan(t, GIAY_TU_DONG)}</div>`,
      nut: [{ ten: "Đóng", giaTri: false }],
      khiMo: (hop, xong) => {
        const than = hop.querySelector("#zn-than");
        const ve = () => { than.innerHTML = veThan(t, GIAY_TU_DONG); };

        const demNguoc = () => {
          clearInterval(dem);
          let n = GIAY_TU_DONG;
          dem = setInterval(() => {
            n -= 1;
            const e = hop.querySelector("#zn-dem");
            if (e) e.textContent = String(n);
            if (n <= 0) { clearInterval(dem); xong(true); }
          }, 1000);
        };

        boNghe = window.api.zalo.onDoi((moi) => {
          const truoc = t.status;
          t = { ...t, ...moi };
          veChipZalo(t);
          ve();
          if (t.status === "da_ket_noi") {
            if (truoc !== "da_ket_noi") baoOk(`Đã kết nối Zalo: ${t.ten || t.uid || ""}`);
            demNguoc();
          }
        });

        than.addEventListener("click", async (e) => {
          const b = e.target.closest("[data-zn]");
          if (!b) return;
          if (b.dataset.zn === "noi" || b.dataset.zn === "lai") {
            b.disabled = true;
            await window.api.zalo.dangNhap(b.dataset.zn === "lai");
          }
          if (b.dataset.zn === "doi") {
            if (!(await hoi("Đổi tài khoản Zalo?", "Phải quét mã QR bằng tài khoản mới. Giới hạn gửi tính lại theo tài khoản mới."))) return;
            clearInterval(dem);
            await window.api.zalo.dangNhap(true);
          }
        });

        if (t.status === "da_ket_noi") demNguoc();
        else if (t.status !== "cho_quet_qr" && t.status !== "dang_dang_nhap") {
          // Tự xin mã ngay, khỏi bắt người dùng bấm thêm một nút vô nghĩa.
          window.api.zalo.dangNhap(false);
        }
      },
    });

    clearInterval(dem);
    boNghe?.();
    const cuoi = await window.api.zalo.trangThai();
    veChipZalo(cuoi);
    return kq === true || cuoi.status === "da_ket_noi";
  })();
  dangMo.finally(() => { dangMo = null; });
  return dangMo;
}

/** Bảo đảm đã kết nối Zalo; chưa thì mở hộp cho kết nối ngay. */
export async function canZalo(loiNhac = "Phải kết nối Zalo mới gửi được.") {
  const t = await window.api.zalo.trangThai();
  if (t.status === "da_ket_noi") return true;
  return moKetNoiZalo({ loiNhac });
}
