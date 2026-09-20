/** Hộp thông báo cập nhật có lịch sử thay đổi (gọn theo kiểu bảng điều khiển S22U). */
import { moHop, esc, ngayVn, baoOk, baoXau, bao, dongHop } from "./chung.js";

let daNhacPhien = false;

/** Kết quả kiểm tra gần nhất (null nếu đang là bản mới nhất). */
export let banMoiDaBiet = null;

function veLichSu(ls) {
  if (!ls || !ls.length) return "";
  return `<h3 style="margin:.9rem 0 .35rem">Các bản gần đây</h3>
    <div style="border:1px solid var(--line);border-radius:var(--r-nho);overflow:hidden">
      ${ls.map((b) => `
        <div class="ban-hang ${b.dang_dung ? "dang" : ""}">
          <span class="so">${esc(b.ban)}</span>
          <span class="ngay">${esc(ngayVn(b.ngay))}</span>
          <span class="noi">${esc(tomTat(b.ghi_chu))}</span>
          ${b.dang_dung ? '<span class="the-dang">đang dùng</span>' : ""}
        </div>`).join("")}
    </div>`;
}

const tomTat = (s) => {
  const d = String(s || "").split("\n").map((x) => x.replace(/^[-*#>\s]+/, "").trim()).filter(Boolean);
  return d.slice(0, 2).join(" · ").slice(0, 180) || "(không có ghi chú)";
};

/** Mở hộp cập nhật. tuTay = người dùng tự bấm kiểm tra. */
export async function moHopCapNhat({ tuTay = false, ketQua = null } = {}) {
  let kq = ketQua;
  if (!kq) {
    const cho = moHop({
      tieuDe: "Kiểm tra cập nhật", khongDongNgoai: true,
      noiDung: `<div style="display:flex;gap:.8rem;align-items:center"><div class="xoay"></div><span class="mo">Đang hỏi máy chủ…</span></div>`,
    });
    try { kq = await window.api.capNhat.kiem(false); } catch (e) { kq = { ok: false, loi: [String(e?.message || e)] }; }
    dongHop();
    await cho;
  }
  if (kq && kq.ok === false) {
    const chu = (kq.loi || []).join(" ");
    return moHop({
      tieuDe: "Kiểm tra cập nhật",
      noiDung: `<div class="bao canh"><b>Chưa hỏi được trang phát hành.</b>
          <span class="sua">${esc(chu) || "Không rõ nguyên nhân."}</span>
          <span class="sua">Phần mềm vẫn chạy bình thường, chỉ là lần này chưa biết có bản mới hay không.</span></div>`,
      nut: [{ ten: "Đóng", kieu: "chinh", giaTri: true }],
    });
  }

  // Tác giả chưa lập trang phát hành: nói thẳng, đừng để người dùng tưởng máy mình hỏng.
  if (kq.chua_co_kho) {
    return moHop({
      tieuDe: "Kiểm tra cập nhật",
      noiDung: `<div class="bao tin"><b>Phần mềm chưa có trang phát hành trên mạng.</b>
          <span class="sua">Bạn đang dùng bản <b class="mono">${esc(kq.ban_hien_tai)}</b>, đây là bản mới nhất bạn có.</span>
          <span class="sua">Khi tác giả lập trang phát hành, phần mềm sẽ tự báo khi có bản mới.
          Trong lúc chờ, cài bản mới bằng cách chạy tệp cài tác giả gửi.</span></div>
        <p class="nho mo" style="margin:.6rem 0 0">Nếu bạn tự dựng trang phát hành riêng,
          đặt biến môi trường <span class="mono">TKBZALO_REPO</span> trỏ tới kho đó.</p>`,
      nut: [{ ten: "Đóng", kieu: "chinh", giaTri: true }],
    });
  }

  const co = kq.co_ban_moi;
  banMoiDaBiet = co ? kq : null;
  document.dispatchEvent(new CustomEvent("tkb:ban-moi", { detail: co ? kq : null }));
  const ghiChu = String(kq.ghi_chu || "").trim();
  const noiDung = `
    <div style="display:flex;flex-direction:column;gap:4px;padding:.6rem .75rem;margin-bottom:.8rem;
                border-radius:var(--r-nho);background:var(--chim);border:1px solid var(--line);font-size:.92rem">
      <div><span class="mo" style="display:inline-block;min-width:130px">Bản đang dùng:</span> <b class="mono">${esc(kq.ban_hien_tai)}</b></div>
      <div><span class="mo" style="display:inline-block;min-width:130px">Bản mới nhất:</span> <b class="mono">${esc(kq.ban_moi)}</b>${kq.ngay ? ` <span class="mo nho">(${esc(ngayVn(kq.ngay))})</span>` : ""}</div>
    </div>
    <p class="day" style="color:${co ? "var(--accent-ink)" : "var(--ok)"};margin:0 0 .4rem">
      ${co ? "Đã có phiên bản mới." : "Bạn đang dùng bản mới nhất."}
    </p>
    ${co && ghiChu ? `<h3 style="margin:.8rem 0 .3rem">Nội dung bản mới</h3>
      <div style="max-height:200px;overflow-y:auto;padding:.55rem .7rem;border-radius:var(--r-nho);
                  background:var(--chim);border:1px solid var(--line);font-size:.88rem;line-height:1.55;
                  white-space:pre-wrap;word-break:break-word">${esc(ghiChu)}</div>` : ""}
    ${veLichSu(kq.lich_su)}
    <p class="nho mo" style="margin:.7rem 0 0">Bản cập nhật tải từ trang phát hành của phần mềm. Dữ liệu và danh sách giáo viên của bạn được giữ nguyên.</p>
  `;

  const nut = co
    ? [
        { ten: "Bỏ qua bản này", giaTri: "bo_qua" },
        { ten: "Để sau", giaTri: null },
        { ten: "Tải và cài", kieu: "chinh", giaTri: "cai" },
      ]
    : [{ ten: "Xem trang phát hành", giaTri: "trang" }, { ten: "Đóng", kieu: "chinh", giaTri: null }];

  const chon = await moHop({ tieuDe: co ? "Có bản cập nhật mới" : "Kiểm tra cập nhật", noiDung, nut, rong: "rong" });

  if (chon === "bo_qua") {
    await window.api.capNhat.boQua(kq.ban_moi);
    baoOk(`Sẽ không nhắc lại bản ${kq.ban_moi}. Vào Trợ giúp › Kiểm tra cập nhật khi cần.`);
  } else if (chon === "trang") {
    await window.api.capNhat.moTrang();
  } else if (chon === "cai") {
    const cho = moHop({
      tieuDe: "Đang cập nhật", khongDongNgoai: true,
      noiDung: `<div style="display:flex;gap:.8rem;align-items:center">
        <div class="xoay"></div><div id="cn-buoc">Đang tải bộ cài…</div></div>
        <div class="thanh" style="margin-top:.7rem"><i id="cn-thanh" style="width:8%"></i></div>
        <p class="nho mo" style="margin:.6rem 0 0">Tải xong, phần mềm sẽ đóng và mở bộ cài. Bạn chỉ cần bấm tiếp theo hướng dẫn.</p>`,
    });
    const boNghe = window.api.capNhat.onTienDo((t) => {
      const b = document.getElementById("cn-buoc"), th = document.getElementById("cn-thanh");
      if (b && t.buoc) b.textContent = t.buoc;
      if (th && t.phan_tram) th.style.width = Math.max(8, t.phan_tram) + "%";
    });
    const r = await window.api.capNhat.taiVaCai();
    boNghe();
    if (!r.ok) {
      dongHop();
      await cho;
      baoXau("<b>Không cập nhật được.</b><br>" + esc((r.loi || []).join(" ")));
      if (r.mo_trang) await window.api.capNhat.moTrang();
    }
  }
  return chon;
}

/**
 * Nghe thông báo có bản mới do tiến trình chính gửi lên sau khi khởi động.
 * khiCoMoi(kq) để chỗ khác (chip phiên bản ở chân thanh bên) hiện dấu chấm đỏ.
 */
export function ganTuDongKiem(khiCoMoi = null) {
  window.api.capNhat.onCoBanMoi((kq) => {
    banMoiDaBiet = kq;
    khiCoMoi?.(kq);
    if (daNhacPhien) return;
    daNhacPhien = true;
    const t = bao(
      `<b>Đã có TKB Zalo bản ${esc(kq.ban_moi)}.</b>
       <span class="sua">Đang dùng bản ${esc(kq.ban_hien_tai)}.</span>
       <button class="nut nho chinh" id="tb-cn" style="margin-top:.35rem">Xem nội dung cập nhật</button>`,
      "canh", 20
    );
    t.querySelector("#tb-cn")?.addEventListener("click", () => { t.remove(); moHopCapNhat({ ketQua: kq }); });
  });
}
