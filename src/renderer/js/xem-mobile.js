/**
 * XEM THỬ TRÊN ĐIỆN THOẠI — dựng lại đúng thứ người nhận sẽ thấy trong cửa sổ chat:
 * lời nhắn, ảnh thời khoá biểu xem ngay, và thẻ tệp Word để tải về.
 *
 * Nội dung lấy từ chính bộ dựng đợt gửi (`gui:xem-thu`) nên không phải phỏng đoán:
 * chữ nào, tệp nào hiện ở đây thì lúc gửi thật cũng đúng như vậy.
 */
import { esc, so, moHop, baoXau, baoKetQua } from "./chung.js";

const coTep = (n) => {
  if (!n) return "";
  if (n > 1048576) return (n / 1048576).toFixed(1) + " MB";
  return Math.max(1, Math.round(n / 1024)) + " KB";
};

const gioBayGio = () =>
  new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });

function veDienThoai(d) {
  const chu = String(d.caption || "").trim();
  return `
  <div class="dt-khung">
    <div class="dt-may">
      <div class="dt-tai"></div>
      <div class="dt-man">
        <div class="dt-thanh"><span>${esc(gioBayGio())}</span><span>▮▮ ▲ ▰</span></div>
        <div class="dt-dau">
          <span class="dt-lui">‹</span>
          <span class="dt-anh-dd">${esc((d.nguoi_ten || "?").trim().slice(0, 1).toUpperCase())}</span>
          <span class="dt-ten">${esc(d.nguoi_ten || "Người nhận")}
            <span class="dt-phu">${d.la_ban === 0 ? "chưa kết bạn" : "đang hoạt động"}</span></span>
        </div>
        <div class="dt-chat">
          ${d.la_ban === 0 ? `<div class="dt-nhac">Người này chưa kết bạn — tin vào mục “Tin nhắn từ người lạ”,
            có thể không được đọc.</div>` : ""}
          ${d.co_anh ? `<div class="dt-bong">
              ${d.anh
                ? `<img class="dt-tkb" src="${esc(d.anh)}" alt="Ảnh thời khoá biểu">`
                : '<div class="dt-thieu">Chưa tạo ảnh cho mục này</div>'}
              ${chu ? `<div class="dt-chu">${esc(chu)}</div>` : ""}
              <div class="dt-gio">${esc(gioBayGio())}</div>
            </div>` : chu ? `<div class="dt-bong"><div class="dt-chu">${esc(chu)}</div>
              <div class="dt-gio">${esc(gioBayGio())}</div></div>` : ""}
          ${d.co_docx ? `<div class="dt-bong">
              <div class="dt-tep">
                <span class="dt-tep-bd">W</span>
                <span class="dt-tep-chu"><b>${esc(d.docx_ten)}</b><span>${esc(coTep(d.docx_co))} · Word</span></span>
                <span class="dt-tep-tai">↓</span>
              </div>
              <div class="dt-gio">${esc(gioBayGio())}</div>
            </div>` : ""}
          ${!d.co_anh && !d.co_docx && !chu
            ? '<div class="dt-nhac">Không có gì để gửi cho mục này.</div>' : ""}
        </div>
        <div class="dt-nhap"><span>Nhập tin nhắn…</span></div>
      </div>
    </div>
  </div>`;
}

/**
 * Mở hộp xem thử. loai = "gv" | "lop", ma = mã giáo viên hoặc tên lớp.
 */
export async function moXemMobile(tkbId, { loai, ma } = {}) {
  if (!tkbId) return baoXau("Chưa chọn thời khoá biểu.");
  const d = await window.api.gui.xemThu(tkbId, { loai, ma });
  if (!d.ok) return baoKetQua(d);

  const thieu = [];
  if (!d.co_anh) thieu.push("chưa có ảnh");
  if (!d.co_docx) thieu.push("chưa có tệp Word");

  return moHop({
    tieuDe: `Người nhận sẽ thấy thế này — ${loai === "lop" ? "lớp " + ma : ma}`,
    rong: "rong",
    noiDung: `
      <div class="xem-dt">
        ${veDienThoai(d)}
        <div class="xem-dt-ben">
          <h3 style="margin:.1rem 0 .5rem">Gửi cho ${esc(d.nguoi_ten || "—")}</h3>
          <table class="b"><tbody>
            <tr><td style="width:42%">Nội dung</td><td>${loai === "lop"
              ? `Thời khoá biểu lớp <b>${esc(ma)}</b>` : "Thời khoá biểu cá nhân"}
              ${d.so_tiet ? `<br><span class="nho mo">${so(d.so_tiet)} tiết/tuần</span>` : ""}</td></tr>
            <tr><td>Số điện thoại</td><td class="mono">${esc(d.sdt || "—")}</td></tr>
            <tr><td>Ảnh xem ngay</td><td>${d.co_anh
              ? '<span class="nhan n-ok">có</span>' : '<span class="nhan n-xau">chưa có</span>'}</td></tr>
            <tr><td>Tệp tải về in</td><td>${d.co_docx
              ? `<span class="nhan n-ok">có</span> <span class="nho mo">${esc(coTep(d.docx_co))}</span>`
              : '<span class="nhan n-xau">chưa có</span>'}</td></tr>
          </tbody></table>
          ${thieu.length ? `<div class="bao canh" style="margin-top:.6rem"><b>Thiếu: ${esc(thieu.join(", "))}.</b>
            <span class="sua">Bấm “Tạo ảnh” ở khu Thời khoá biểu, hoặc nhập thêm tệp Word.</span></div>`
            : '<div class="bao ok" style="margin-top:.6rem">Đủ ảnh và tệp, gửi được.</div>'}
          <p class="nho mo" style="margin:.6rem 0 0">Đây là mô phỏng để kiểm tra chữ và ảnh trước khi gửi.
            Màn hình thật của từng máy có thể khác đôi chút.</p>
        </div>
      </div>`,
    nut: [{ ten: "Đóng", kieu: "chinh", giaTri: true }],
  });
}
