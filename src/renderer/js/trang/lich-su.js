/**
 * Bước 3 — GỬI. Chia hai tab cho khỏi dồn một trang:
 *   · Gửi      — chọn thời khoá biểu, xem giới hạn còn lại, bấm gửi, tiếp đợt dở.
 *   · Lịch sử  — ai đã nhận gì, lọc bằng thanh chip + hộp thoại như trang Thống kê.
 */
import {
  esc, so, gioVn, ngayVn, moHop, nhanKetQuaGui, bang, $$, coHoac, baoXau, ganKhung,} from "../chung.js";
import { chipZalo } from "../zalo-nhanh.js";
import { moGui, moHopLoi } from "../gui-modal.js";

let loc = {};
let tabG = "gui";
let tabLs = "chi-tiet";

const TAB_G = [{ ma: "gui", ten: "Gửi" }, { ma: "lich-su", ten: "Lịch sử gửi" }];

const CHU_KQ = { xong: "Thành công", loi: "Lỗi" };

/**
 * Trạng thái THẬT của tin, do Zalo báo lại qua kênh sự kiện:
 *   đã xem > đã tới máy > mới gửi đi.
 * "Đã gửi" chỉ nghĩa là máy chủ Zalo nhận, chưa chắc tới tay người ta.
 */
function nhanDenNoi(x) {
  if (x.ket_qua !== "xong") return '<span class="mo">—</span>';
  if (x.xem_luc) return `<span class="nhan n-ok">Đã xem</span><br><span class="nho mo">${esc(gioVn(x.xem_luc))}</span>`;
  if (x.nhan_luc) return `<span class="nhan n-ok">Đã tới máy</span><br><span class="nho mo">${esc(gioVn(x.nhan_luc))}</span>`;
  return '<span class="nhan n-canh">Chưa xác nhận</span><br><span class="nho mo">chưa thấy báo nhận</span>';
}
const CHU_LOAI = { gv: "Thời khoá biểu cá nhân", lop: "Thời khoá biểu lớp" };

/** Bộ lọc lịch sử có khác mặc định không. */
const daLoc = (l) => Object.values(l || {}).some((v) => v !== undefined && v !== "");

/** Tóm tắt bộ lọc thành mấy con chữ ngắn. */
function veChipLoc(l, dsTkb) {
  const c = [];
  const t = dsTkb.find((x) => x.id === l.tkb_id);
  if (t) c.push(["Thời khoá biểu", `số ${t.so_tkb} · ${t.nam_hoc}`]);
  if (l.loai) c.push(["Loại", CHU_LOAI[l.loai] || l.loai]);
  if (l.ket_qua) c.push(["Kết quả", CHU_KQ[l.ket_qua] || l.ket_qua]);
  if (l.tim) c.push(["Tìm", l.tim]);
  if (l.tu_ngay || l.den_ngay) c.push(["Khoảng ngày", `${ngayVn(l.tu_ngay) || "…"} – ${ngayVn(l.den_ngay) || "…"}`]);
  if (!c.length) return '<span class="mo nho">Chưa lọc gì — đang xem tất cả.</span>';
  return c.map(([k, v]) => `<span class="chip-loc"><b>${esc(k)}</b> ${esc(v)}</span>`).join("");
}

/** Hộp lọc lịch sử gửi. Trả về bộ lọc mới, hoặc null nếu huỷ. */
async function hopLocLichSu(l, dsTkb) {
  let moi = null;
  const chon = await moHop({
    tieuDe: "Lọc lịch sử gửi", rong: "rong",
    noiDung: `
      <div class="luoi-loc">
        <section class="nhom-loc">
          <h3><span class="nl-so">1</span>Của thời khoá biểu nào</h3>
          <div class="o-nhap"><label>Thời khoá biểu</label>
            <select id="l-tkb"><option value="">Tất cả</option>
              ${dsTkb.map((t) => `<option value="${t.id}" ${l.tkb_id === t.id ? "selected" : ""}>Số ${t.so_tkb} · ${esc(t.nam_hoc)}</option>`).join("")}
            </select></div>
          <div class="o-nhap"><label>Loại nội dung</label>
            <select id="l-loai"><option value="">Tất cả</option>
              <option value="gv" ${l.loai === "gv" ? "selected" : ""}>Thời khoá biểu cá nhân</option>
              <option value="lop" ${l.loai === "lop" ? "selected" : ""}>Thời khoá biểu lớp</option>
            </select></div>
        </section>

        <section class="nhom-loc">
          <h3><span class="nl-so">2</span>Kết quả và thời điểm</h3>
          <div class="o-nhap"><label>Kết quả</label>
            <select id="l-kq"><option value="">Tất cả</option>
              <option value="xong" ${l.ket_qua === "xong" ? "selected" : ""}>Thành công</option>
              <option value="loi" ${l.ket_qua === "loi" ? "selected" : ""}>Lỗi</option>
            </select></div>
          <div class="luoi c2" style="gap:.4rem">
            <div class="o-nhap"><label>Từ ngày</label><input type="date" id="l-tu" value="${esc(l.tu_ngay || "")}"></div>
            <div class="o-nhap"><label>Đến ngày</label><input type="date" id="l-den" value="${esc(l.den_ngay || "")}"></div>
          </div>
        </section>

        <section class="nhom-loc">
          <h3><span class="nl-so">3</span>Tìm người nhận</h3>
          <div class="o-nhap"><label>Tên, số điện thoại hoặc lớp</label>
            <input type="search" id="l-tim" value="${esc(l.tim || "")}" placeholder="Nguyễn Thị… / 6A1 / 0983…"></div>
          <p class="nl-mo">Gõ một phần cũng tìm được.</p>
        </section>
      </div>`,
    nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Xem tất cả", giaTri: "het" },
          { ten: "Áp dụng", kieu: "chinh", giaTri: "ap" }],
    khiMo: (hop) => {
      hop.querySelector(".hop-chan .nut.chinh").addEventListener("click", () => {
        const v = (id) => hop.querySelector(id).value;
        moi = {
          tkb_id: v("#l-tkb") ? Number(v("#l-tkb")) : undefined,
          loai: v("#l-loai") || undefined, ket_qua: v("#l-kq") || undefined,
          tim: v("#l-tim").trim() || undefined,
          tu_ngay: v("#l-tu") || undefined, den_ngay: v("#l-den") || undefined,
        };
      }, true);
    },
  });
  if (chon === "het") return {};
  return chon === "ap" ? (moi || {}) : null;
}

export async function ve(khung, thamSo = {}) {
  if (thamSo?.tabGui && TAB_G.some((t) => t.ma === thamSo.tabGui)) tabG = thamSo.tabGui;

  const rTkb = await window.api.tkb.ds();
  const ds = (await window.api.gui.lichSu(loc, 1000)).ds;
  const tongHop = (await window.api.gui.daNhan(loc.tkb_id || null)).ds;
  const gh = await window.api.gui.gioiHan(null).catch(() => null);

  const thanhCong = ds.filter((x) => x.ket_qua === "xong").length;
  const soLoi = ds.filter((x) => x.ket_qua === "loi").length;
  const daToiNoi = ds.filter((x) => x.nhan_luc || x.xem_luc).length;
  const daXem = ds.filter((x) => x.xem_luc).length;
  const tkbMoi = rTkb.ds?.[0] || null;
  const dot = (await window.api.gui.dsDot(6).catch(() => ({ ds: [] }))).ds || [];
  const dotDo = dot.find((d) => d.trang_thai === "dang" || d.trang_thai === "tam_dung") || null;

  const tGui = `
    ${dotDo ? `<div class="bao canh" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
      <span><b>Còn một đợt gửi dở.</b> <span class="sua">${esc(dotDo.ten || "")} — ${so(dotDo.da_gui)}/${so(dotDo.tong)} đã gửi, ${so(dotDo.loi)} lỗi.</span></span>
      <span class="hang-nut">
        <button class="nut nho chinh" data-tiep="${dotDo.id}">Gửi tiếp</button>
        <button class="nut nho" data-loi="${dotDo.id}">Danh sách lỗi</button>
      </span></div>` : ""}

    <div class="the">
      <div class="the-dau"><h2 style="margin:0">Gửi thời khoá biểu</h2>${chipZalo()}</div>
      ${tkbMoi ? `
        <div class="o-nhap" style="margin:0">
          <label for="g-chon-tkb">Chọn thời khoá biểu</label>
          <div class="hang-gui">
            <select id="g-chon-tkb">
              ${rTkb.ds.map((t, i) => `<option value="${t.id}" ${i === 0 ? "selected" : ""}>Số ${t.so_tkb} · ${esc(t.nam_hoc)}${t.hoc_ky ? ` · HK${t.hoc_ky}` : ""} · từ ${esc(ngayVn(t.ngay_ap_dung)) || "?"}${i === 0 ? " · mới nhất" : ""}</option>`).join("")}
            </select>
            <button class="nut chinh" id="g-gui">Gửi qua Zalo</button>
          </div>
          <div class="goi-y" id="g-nhac">Mặc định gửi bản mới nhất.</div>
        </div>
        <p class="nho mo" style="margin:.5rem 0 0">Bấm gửi sẽ hiện hộp tuỳ chọn, bảng xem trước ai nhận gì,
          rồi mới chạy. Luôn gửi thử vài người trước.</p>`
        : '<div class="trong"><span class="bd">▤</span>Chưa có thời khoá biểu nào. Vào bước Dữ liệu để nhập tệp trước.</div>'}
    </div>

    <div class="luoi c4">
      <div class="o-so vach-ok"><b>Đã gửi</b><span class="v">${so(thanhCong)}</span><span class="g">lượt thành công</span></div>
      <div class="o-so ${soLoi ? "vach-xau" : "vach"}"><b>Lỗi</b><span class="v">${so(soLoi)}</span><span class="g">lượt không đến nơi</span></div>
      <div class="o-so vach"><b>Hôm nay còn gửi được</b><span class="v">${gh ? so(gh.con_ban) : "—"}</span>
        <span class="g">người đã kết bạn${gh ? ` · ${so(gh.con_la)} người lạ` : ""}</span></div>
      <div class="o-so vach"><b>Tài khoản Zalo</b><span class="v" style="font-size:1rem">${esc(gh?.tai_khoan || "chưa nối")}</span>
        <span class="g">giới hạn tính riêng theo tài khoản</span></div>
    </div>

    ${(gh?.canh_bao || []).map((c) => `<div class="bao canh">${esc(c)}</div>`).join("")}`;

  const tLichSu = `
    <div class="loc-thanh">
      <button class="nut chinh nho" id="mo-loc">Bộ lọc…</button>
      <div class="loc-chip">${veChipLoc(loc, rTkb.ds)}</div>
      <button class="nut nho" id="bo-loc"${daLoc(loc) ? "" : " disabled"}>Bỏ lọc</button>
    </div>

    <div class="luoi c4" style="margin-bottom:.75rem">
      <div class="o-so vach-ok"><b>Lượt thành công</b><span class="v">${so(thanhCong)}</span></div>
      <div class="o-so ${soLoi ? "vach-xau" : "vach"}"><b>Lượt lỗi</b><span class="v">${so(soLoi)}</span></div>
      <div class="o-so vach"><b>Người đã nhận</b>
        <span class="v">${so(new Set(ds.filter((x) => x.ket_qua === "xong").map((x) => x.nguoi_loai + ":" + x.nguoi_id)).size)}</span></div>
      <div class="o-so ${daToiNoi ? "vach-ok" : "vach"}"><b>Zalo xác nhận tới nơi</b><span class="v">${so(daToiNoi)}</span>
        <span class="g">${so(daXem)} lượt đã xem</span></div>
    </div>

    <div class="tab" id="tab-ls">
      <button class="${tabLs === "chi-tiet" ? "chon" : ""}" data-tab="chi-tiet">Từng lượt gửi (${ds.length})</button>
      <button class="${tabLs === "tong-hop" ? "chon" : ""}" data-tab="tong-hop">Tổng hợp ai đã nhận gì (${tongHop.length})</button>
    </div>

    <div id="tab-chi-tiet" ${tabLs === "chi-tiet" ? "" : "hidden"}>
      <div class="the">${bang(ds, [
        { ten: "Lúc", ve: (x) => `<span class="nho">${esc(gioVn(x.luc))}</span>` },
        { ten: "Người nhận", ve: (x) => `<b>${esc(x.nguoi_ten)}</b>${x.nguoi_loai === "ngoai" ? ' <span class="nhan n-xam">ngoài DS</span>' : ""}<br><span class="mono nho mo">${esc(x.sdt || "")}</span>` },
        { ten: "Nội dung", ve: (x) => `${x.loai === "lop" ? "TKB lớp <b>" + esc(x.ma) + "</b>" : "TKB cá nhân"}<br><span class="nho mo">số ${x.so_tkb ?? "?"} · ${esc(x.nam_hoc || "")}${x.tkb_phien_ban > 1 ? " · bản " + x.tkb_phien_ban : ""}</span>` },
        { ten: "Tệp đã gửi", ve: (x) => `<span class="nho">${x.co_anh ? esc(x.anh_ten) : ""}${x.co_anh && x.co_docx ? "<br>" : ""}${x.co_docx ? esc(x.docx_ten) : ""}${!x.co_anh && !x.co_docx ? '<span class="mo">chỉ tin nhắn</span>' : ""}</span>` },
        { ten: "Kết quả", ve: (x) => nhanKetQuaGui(x.ket_qua) + (x.loi ? `<br><span class="nho mo">${esc(x.loi)}</span>` : "") },
        { ten: "Đến nơi", ve: nhanDenNoi },
        { ten: "", ve: (x) => `<button class="nut nho" data-xem="${x.id}">Xem tin</button>` },
      ], { trong: "Chưa có lượt gửi nào khớp bộ lọc." })}</div>
    </div>

    <div id="tab-tong-hop" ${tabLs === "tong-hop" ? "" : "hidden"}>
      <div class="the">${bang(tongHop, [
        { ten: "Người nhận", ve: (x) => `<b>${esc(x.nguoi_ten)}</b>${x.nguoi_loai === "ngoai" ? ' <span class="nhan n-xam">ngoài DS</span>' : ""}` },
        { ten: "Nội dung", ve: (x) => (x.loai === "lop" ? "TKB lớp " + esc(x.ma) : "TKB cá nhân") },
        { ten: "Lần gần nhất", ve: (x) => `<span class="nho">${esc(gioVn(x.lan_cuoi))}</span>` },
        { ten: "Số lần", khoa: "so_lan", so: true },
        { ten: "Thành công", khoa: "so_thanh_cong", so: true },
        { ten: "Lỗi", ve: (x) => (x.so_loi ? `<span class="nhan n-xau">${x.so_loi}</span>` : '<span class="mo">0</span>') },
      ], { trong: "Chưa ai nhận thời khoá biểu." })}</div>
    </div>`;

  const NOI = { gui: tGui, "lich-su": tLichSu };

  khung.innerHTML = `
  <div class="dau-trang" style="margin-bottom:.5rem">
    <div><h1 style="margin:0">Gửi thời khoá biểu</h1>
      <p class="mo-ta">Gửi cho giáo viên, và xem lại ai đã nhận gì.</p></div>
  </div>

  <div class="tab tab-lon" id="tab-g">
    ${TAB_G.map((t) => `<button class="${t.ma === tabG ? "chon" : ""}" data-tab-g="${t.ma}">${esc(t.ten)}</button>`).join("")}
  </div>

  ${TAB_G.map((t) => `<section data-khu-g="${t.ma}" ${t.ma === tabG ? "" : "hidden"}>${NOI[t.ma]}</section>`).join("")}`;

  // Zalo báo tin tới nơi / đã xem thì làm mới bảng, khỏi bắt người dùng bấm lại.
  const boNgheTin = window.api.gui.onTrangThaiTin(() => {
    if (tabG === "lich-su") ve(khung);
  });

  khung.querySelector("#tab-g").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab-g]");
    if (!b || b.dataset.tabG === tabG) return;
    tabG = b.dataset.tabG;
    for (const t of TAB_G) {
      khung.querySelector(`[data-tab-g="${t.ma}"]`).classList.toggle("chon", t.ma === tabG);
      khung.querySelector(`[data-khu-g="${t.ma}"]`).hidden = t.ma !== tabG;
    }
    document.getElementById("chinh").scrollTop = 0;
  });

  // Chọn bản cũ thì nhắc ngay, kẻo gửi nhầm thời khoá biểu đã hết hiệu lực.
  const oChon = khung.querySelector("#g-chon-tkb");
  oChon?.addEventListener("change", () => {
    const nhac = khung.querySelector("#g-nhac");
    if (!nhac) return;
    const laMoiNhat = oChon.selectedIndex === 0;
    nhac.textContent = laMoiNhat
      ? "Mặc định gửi bản mới nhất."
      : `Đang chọn bản cũ. Bản mới nhất là số ${tkbMoi.so_tkb} (${tkbMoi.nam_hoc}).`;
    nhac.classList.toggle("nhac-cu", !laMoiNhat);
  });

  khung.querySelector("#tab-ls")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tabLs = b.dataset.tab;
    $$("#tab-ls button", khung).forEach((x) => x.classList.toggle("chon", x === b));
    khung.querySelector("#tab-chi-tiet").hidden = tabLs !== "chi-tiet";
    khung.querySelector("#tab-tong-hop").hidden = tabLs !== "tong-hop";
  });

  ganKhung(khung, "click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;

    if (b.id === "g-gui") {
      const id = Number(khung.querySelector("#g-chon-tkb")?.value || 0);
      if (!id) return baoXau("<b>Chưa có thời khoá biểu nào.</b><br>Vào bước Dữ liệu để nhập tệp trước.");
      await moGui(id);
      return ve(khung);
    }
    if (b.dataset.tiep) {
      const { moTiepDot } = await import("../gui-modal.js");
      await moTiepDot(Number(b.dataset.tiep));
      return ve(khung);
    }
    if (b.dataset.loi) return moHopLoi(Number(b.dataset.loi));
    if (b.id === "mo-loc") {
      const l = await hopLocLichSu(loc, rTkb.ds);
      if (l) { loc = l; ve(khung); }
      return;
    }
    if (b.id === "bo-loc") { loc = {}; return ve(khung); }
    if (b.dataset.xem) {
      const x = ds.find((y) => y.id === Number(b.dataset.xem));
      if (!x) return baoXau("Không còn thấy dòng này trong danh sách. Hãy tải lại trang Lịch sử.");
      return moHop({
        tieuDe: "Nội dung đã gửi", rong: "rong",
        noiDung: `<table class="b"><tbody>
            <tr><td style="width:32%">Người nhận</td><td><b>${esc(x.nguoi_ten)}</b> <span class="mono nho mo">${esc(x.sdt || "")}</span></td></tr>
            <tr><td>Gửi lúc</td><td>${esc(gioVn(x.luc))}</td></tr>
            <tr><td>Nội dung</td><td>${x.loai === "lop" ? "Thời khoá biểu lớp " + esc(x.ma) : "Thời khoá biểu cá nhân"} · số ${x.so_tkb ?? "?"} (${esc(x.nam_hoc || "")})</td></tr>
            <tr><td>Tệp</td><td class="nho">${coHoac(x.anh_ten)} ${x.docx_ten ? "· " + esc(x.docx_ten) : ""}</td></tr>
            <tr><td>Kết quả</td><td>${nhanKetQuaGui(x.ket_qua)} ${x.loi ? esc(x.loi) : ""}</td></tr>
            <tr><td>Mã tin Zalo</td><td class="mono nho">${coHoac(x.msg_id_anh)} ${x.msg_id_file ? "· " + esc(x.msg_id_file) : ""}</td></tr>
          </tbody></table>
          <h3 style="margin-top:.8rem">Lời nhắn đã gửi</h3>
          <div style="white-space:pre-wrap;padding:.6rem .75rem;background:var(--chim);border:1px solid var(--line);border-radius:var(--r-nho);font-size:.9rem">${esc(x.caption || "(không có)")}</div>`,
        nut: [{ ten: "Đóng", kieu: "chinh", giaTri: true }],
      });
    }
  });

  return () => boNgheTin?.();
}
