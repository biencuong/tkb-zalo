/** Kết nối Zalo bằng quét mã QR. */
import { esc, so, baoOk, baoXau, baoKetQua, hoi, chuTrangThaiZalo, hopCho } from "../chung.js";
import { moHopRuiRo } from "../rui-ro.js";

export async function ve(khung) {
  let t = await window.api.zalo.trangThai();

  const veNoiDung = () => {
    const daNoi = t.status === "da_ket_noi";
    khung.innerHTML = `
    <div class="dau-trang">
      <div><h1>Kết nối Zalo</h1>
        <p class="mo-ta">Quét mã QR một lần. Phiên lưu trên máy này.</p></div>
      <div class="hang-nut"><button class="nut" id="xem-rui-ro">Xem rủi ro</button></div>
    </div>

    <div class="luoi c2">
      <div class="the">
        <div class="the-dau"><h2>Trạng thái</h2>
          <span class="nhan ${daNoi ? "n-ok" : t.status === "cho_quet_qr" ? "n-canh" : "n-xam"}">${esc(chuTrangThaiZalo(t.status))}</span></div>
        ${daNoi ? `
          <table class="b"><tbody>
            <tr><td style="width:38%">Tài khoản</td><td><b>${esc(t.ten || "(không rõ tên)")}</b></td></tr>
            ${t.sdt ? `<tr><td>Số điện thoại</td><td class="mono">${esc(t.sdt)}</td></tr>` : ""}
            <tr><td>Zalo UID</td><td class="mono nho">${esc(t.uid || "")}</td></tr>
            ${t.gioi_han_tep ? `<tr><td>Tệp tối đa</td><td>${so(t.gioi_han_tep.max_size_mb)} MB</td></tr>` : ""}
          </tbody></table>
          <div class="bao ok" style="margin-top:.6rem">Sẵn sàng gửi.</div>
          <div class="hang-nut" style="margin-top:.6rem">
            <button class="nut" id="quet-lai">Quét bằng tài khoản khác</button>
            <button class="nut xau" id="dang-xuat">Đăng xuất</button>
          </div>`
        : t.status === "cho_quet_qr" ? `
          <div class="qr-khung">
            ${t.qr ? `<img src="${t.qr}" alt="Mã QR đăng nhập Zalo">` : '<div class="xoay"></div><p class="mo">Đang lấy mã QR…</p>'}
            <p class="giua" style="margin:0">Mở <b>Zalo trên điện thoại</b> → quét mã.</p>
            <button class="nut" id="quet-lai">Lấy mã mới</button>
          </div>`
        : t.status === "dang_dang_nhap" ? `
          <div class="qr-khung"><div class="xoay"></div><p class="mo">Đang kết nối lại bằng phiên đã lưu…</p></div>`
        : `
          <p class="mo">Chưa kết nối.</p>
          ${t.loi ? `<div class="bao xau"><b>Lần trước không kết nối được.</b><span class="sua">${esc(t.loi)}</span></div>` : ""}
          <div class="hang-nut"><button class="nut chinh" id="dang-nhap">Đăng nhập Zalo (quét QR)</button></div>`}
      </div>

      <div class="the">
        <h2>Cần biết</h2>
        <div class="bao canh"><b>Gửi nhiều có thể bị Zalo hạn chế tài khoản.</b>
          <span class="sua">Nên dùng tài khoản phụ để gửi, giữ tài khoản chính cho việc hằng ngày.</span></div>
        <ul class="nho" style="padding-left:1.1rem">
          <li><b>Dùng tài khoản Zalo phụ</b>, đừng dùng tài khoản chính.</li>
          <li>Không mở Zalo Web hay Zalo PC cùng tài khoản khi đang gửi.</li>
          <li>Phiên lưu trên máy, lần sau tự vào.</li>
        </ul>
        ${daNoi ? `<hr class="tach">
          <h3>Đối chiếu bạn bè</h3>
          <p class="nho mo">Người chưa kết bạn có thể không nhận được tin.</p>
          <button class="nut" id="doi-chieu">Đối chiếu bạn bè</button>` : ""}
      </div>
    </div>`;
  };
  veNoiDung();

  const boNghe = window.api.zalo.onDoi((moi) => { t = { ...t, ...moi }; veNoiDung(); });

  khung.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "xem-rui-ro") return moHopRuiRo({});
    if (b.id === "dang-nhap") { await window.api.zalo.dangNhap(false); return; }
    if (b.id === "quet-lai") {
      if (t.status === "da_ket_noi" && !(await hoi("Đổi tài khoản Zalo?",
        "Phải quét mã QR bằng tài khoản mới."))) return;
      await window.api.zalo.dangNhap(true);
      return;
    }
    if (b.id === "dang-xuat") {
      if (!(await hoi("Đăng xuất Zalo?", "Lần sau phải quét lại mã QR.", { nutOk: "Đăng xuất", kieu: "xau" }))) return;
      t = await window.api.zalo.dangXuat(true);
      veNoiDung();
      baoOk("Đã đăng xuất.");
      return;
    }
    if (b.id === "doi-chieu") {
      const cho = hopCho("Đang lấy danh sách bạn bè từ Zalo");
      let r;
      try { r = await window.api.zalo.doiChieuBanBe(); } finally { cho.dong(); await cho.doi; }
      if (r.ok) baoOk(`Đã đối chiếu với ${r.so_ban} người bạn trên Zalo.`);
      else baoKetQua(r);
      return;
    }
  });

  return () => boNghe();
}
