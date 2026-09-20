/** Màn cảnh báo rủi ro khi dùng Zalo cá nhân — bắt buộc đọc và đồng ý trước khi gửi. */
import { moHop, baoOk, $$ } from "./chung.js";
import { NOI_DUNG_RUI_RO } from "./noi-dung.js";
export { NOI_DUNG_RUI_RO };


/** Mở hộp rủi ro. batBuoc = lần đầu chạy, phải tích đồng ý mới đóng được. */
export async function moHopRuiRo({ batBuoc = false } = {}) {
  const noiDung = NOI_DUNG_RUI_RO + (batBuoc
    ? `<hr class="tach"><label class="tich" style="font-size:.95rem">
         <input type="checkbox" id="dong-y">
         <span><b>Tôi đã đọc và hiểu các rủi ro trên. Tôi tự chịu trách nhiệm khi dùng phần mềm này.</b></span>
       </label>`
    : "");
  const r = await moHop({
    tieuDe: "Điều khoản và rủi ro khi dùng Zalo cá nhân",
    noiDung, rong: "rong", khongDongNgoai: batBuoc,
    nut: batBuoc
      ? [{ ten: "Tôi đồng ý, bắt đầu dùng", kieu: "chinh", giaTri: true, tat: true }]
      : [{ ten: "Đã hiểu", kieu: "chinh", giaTri: true }],
    khiMo: (hop) => {
      const t = hop.querySelector("#dong-y");
      const n = hop.querySelector(".hop-chan .nut");
      if (t && n) t.addEventListener("change", () => { n.disabled = !t.checked; });
    },
  });
  if (batBuoc && r === true) {
    await window.api.app.luuCaiDat({ da_dong_y_rui_ro: "1" });
    baoOk("Đã ghi nhận. Bạn có thể xem lại mục này bất cứ lúc nào ở Trợ giúp.");
  }
  return r === true;
}

/** Khối cảnh báo ngắn hiện ngay trong hộp tuỳ chọn gửi. */
export const NHAC_NGAN = `
<div class="bao canh"><b>Người chưa kết bạn Zalo có thể không nhận được tin.</b></div>`;
