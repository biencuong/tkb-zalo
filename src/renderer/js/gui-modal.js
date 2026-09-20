/**
 * Gửi thời khoá biểu — toàn bộ nằm trong HỘP THOẠI, gọi từ trang Thời khoá biểu.
 * Ba bước trong một hộp: tuỳ chọn → xem trước → chạy và theo dõi.
 */
import {
  esc, so, moHop, hoi, baoOk, baoXau, baoKetQua, hopCho, themDongLog, $$,
} from "./chung.js";
import { NHAC_NGAN, moHopRuiRo } from "./rui-ro.js";
import { canZalo } from "./zalo-nhanh.js";

const CHU_BO_QUA = {
  khong_co_uid: "Chưa dò được Zalo", trung: "Đã gửi y nguyên",
  khong_doi: "Nội dung không đổi", khong_co_tep: "Chưa có ảnh/tệp",
};

function veTomTat(tt) {
  return `<div class="luoi c4" style="margin-bottom:.6rem">
    <div class="o-so vach-ok"><b>Sẽ gửi</b><span class="v">${so(tt.se_gui)}</span><span class="g">${so(tt.so_nguoi)} người · ${so(tt.so_tin)} tin</span></div>
    <div class="o-so ${tt.trung ? "vach-xau" : "vach"}"><b>Trùng</b><span class="v">${so(tt.trung)}</span><span class="g">đã gửi y nguyên</span></div>
    <div class="o-so vach"><b>Có thay đổi</b><span class="v">${so(tt.thay_doi)}</span><span class="g">lần đầu: ${so(tt.lan_dau)}</span></div>
    <div class="o-so ${tt.bo_qua ? "vach-xau" : "vach"}"><b>Bỏ qua</b><span class="v">${so(tt.bo_qua)}</span>
      <span class="g">thiếu Zalo ${so(tt.thieu_uid)} · thiếu tệp ${so(tt.thieu_tep)}</span></div>
  </div>`;
}

function veBangMuc(muc) {
  if (!muc.length) return '<div class="trong">Không có mục nào.</div>';
  return `<div class="bang-cuon cuon-doc"><table class="b">
    <thead><tr><th>Người nhận</th><th>Gửi gì</th><th>Tệp</th><th>Trạng thái</th></tr></thead>
    <tbody>${muc.map((m) => `<tr class="${m.bo_qua ? "mo" : ""}">
      <td><b>${esc(m.nguoi_ten)}</b>${m.nguoi_loai === "ngoai" ? ' <span class="nhan n-xam">ngoài DS</span>' : ""}
        <br><span class="mono nho mo">${esc(m.sdt || "")}</span>${m.la_ban === 0 ? ' <span class="nhan n-canh">chưa kết bạn</span>' : ""}</td>
      <td class="nho">${m.loai === "lop" ? `TKB lớp <b>${esc(m.ma)}</b>` : "TKB cá nhân"}<br><span class="mo">${so(m.so_tiet)} tiết</span></td>
      <td class="nho">${m.co_anh ? '<span class="nhan n-ok">ảnh</span>' : ""} ${m.co_docx ? '<span class="nhan n-ok">Word</span>' : ""}
        ${!m.co_anh && !m.co_docx ? '<span class="nhan n-xau">không có</span>' : ""}
        <br><button class="nut nho" data-dt="${esc(m.loai)}:${esc(m.ma)}" title="Xem như trên điện thoại người nhận">Trên ĐT</button></td>
      <td class="nho">${m.bo_qua
        ? `<span class="nhan n-xam">${esc(CHU_BO_QUA[m.bo_qua] || m.bo_qua)}</span><br><span class="mo">${esc(m.ly_do || "")}</span>`
        : m.trung ? '<span class="nhan n-canh">gửi lại (trùng)</span>'
        : m.thay_doi ? '<span class="nhan n-coral">có thay đổi</span>' : '<span class="nhan n-ok">lần đầu</span>'}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

/** Hộp danh sách lỗi: ai không nhận được, vì sao, sửa thế nào. */
export async function moHopLoi(dotId) {
  if (!dotId) return baoXau("Chưa có đợt gửi nào.");
  const r = await window.api.gui.dsLoi(dotId);
  if (!r.ok) return baoKetQua(r);
  if (!r.tong) {
    return moHop({ tieuDe: "Danh sách lỗi",
      noiDung: '<div class="bao ok"><b>Không có lỗi.</b> Mọi người trong đợt đều đã nhận được.</div>',
      nut: [{ ten: "Đóng", kieu: "chinh", giaTri: true }] });
  }
  const chon = await moHop({
    tieuDe: `Danh sách lỗi — ${r.tong} người không nhận được`, rong: "rat-rong",
    noiDung: r.nhom.map((g) => `<div class="bao canh"><b>${g.so_nguoi} người:</b> ${esc(g.cach_sua)}
        <span class="sua">${esc(g.nguoi.slice(0, 12).join(", "))}${g.nguoi.length > 12 ? "…" : ""}</span></div>`).join("") +
      `<div class="bang-cuon cuon-doc"><table class="b">
        <thead><tr><th>Người nhận</th><th>Liên hệ</th><th>Gửi gì</th><th>Vì sao</th><th>Cách sửa</th></tr></thead>
        <tbody>${r.chi_tiet.map((x) => `<tr class="${x.trang_thai === "loi" ? "lech" : ""}">
          <td><b>${esc(x.ho_ten)}</b>${x.ma_gv ? `<span class="mono nho mo"> ${esc(x.ma_gv)}</span>` : ""}
            ${x.lop_cn ? `<br><span class="nho mo">Chủ nhiệm ${esc(x.lop_cn)}</span>` : ""}</td>
          <td class="nho"><span class="mono">${esc(x.dien_thoai) || "—"}</span><br>
            ${x.zalo_uid ? (x.la_ban === 0 ? '<span class="nhan n-canh">chưa kết bạn</span>' : '<span class="nhan n-ok">có Zalo</span>')
              : '<span class="nhan n-xau">chưa có Zalo</span>'}</td>
          <td class="nho">${esc(x.noi_dung)}<br><span class="mo">${esc(x.tep)}</span></td>
          <td class="nho">${x.trang_thai === "loi" ? '<span class="nhan n-xau">Lỗi</span>' : '<span class="nhan n-xam">Bỏ qua</span>'}
            ${esc(x.ly_do)}${x.ma_loi ? ` <span class="mo">(mã ${x.ma_loi})</span>` : ""}</td>
          <td class="nho">${esc(x.cach_sua)}</td>
        </tr>`).join("")}</tbody></table></div>`,
    nut: [{ ten: "Chép danh sách", giaTri: "chep" },
          { ten: "Gửi lại các mục lỗi", giaTri: "gui_lai" },
          { ten: "Đóng", kieu: "chinh", giaTri: null }],
  });
  if (chon === "chep") {
    const TAB = String.fromCharCode(9), XD = String.fromCharCode(10);
    const chu = [["Họ tên", "Mã GV", "Điện thoại", "Nội dung", "Lý do", "Cách sửa"].join(TAB)]
      .concat(r.chi_tiet.map((x) => [x.ho_ten, x.ma_gv, x.dien_thoai, x.noi_dung, x.ly_do, x.cach_sua].join(TAB)))
      .join(XD);
    try { await navigator.clipboard.writeText(chu); baoOk("Đã chép. Dán vào Excel là ra bảng."); }
    catch { baoXau("Không chép được."); }
  } else if (chon === "gui_lai") {
    const kq = await window.api.gui.guiLaiLoi(dotId);
    baoKetQua(kq, `Đã đặt ${kq.n} mục lỗi về hàng chờ. Mở lại Gửi để chạy tiếp.`);
  }
}

/** Bước 1: hộp tuỳ chọn. */
async function hopTuyChon(tuyChonCu, dsGv) {
  const cd = (await window.api.app.caiDat()).cai_dat;
  const tc = { ...tuyChonCu };
  const noiDung = `
    ${NHAC_NGAN}
    <div class="luoi c2">
      <div>
        <h3>Gửi những gì</h3>
        <label class="tich"><input type="checkbox" id="t-gv" ${tc.gui_tkb_gv !== false ? "checked" : ""}>
          <span>Thời khoá biểu <b>cá nhân</b> cho giáo viên</span></label>
        <label class="tich"><input type="checkbox" id="t-lop" ${tc.gui_tkb_lop_gvcn !== false ? "checked" : ""}>
          <span>Thời khoá biểu <b>lớp</b> cho chủ nhiệm<span class="g">Lớp chưa có chủ nhiệm sẽ bị bỏ qua.</span></span></label>
        <label class="tich"><input type="checkbox" id="t-ngoai" ${tc.gui_nguoi_ngoai ? "checked" : ""}>
          <span>Người <b>ngoài danh sách</b> đã đăng ký</span></label>

        <h3>Dạng tệp</h3>
        <label class="tich"><input type="checkbox" id="t-anh" ${tc.gui_anh !== false ? "checked" : ""}>
          <span><b>Ảnh</b> — xem ngay trên điện thoại</span></label>
        <label class="tich"><input type="checkbox" id="t-docx" ${tc.gui_docx !== false ? "checked" : ""}>
          <span><b>Tệp Word</b> — tải về in</span></label>
        <div class="o-nhap" style="max-width:240px"><label>Ảnh gồm buổi nào</label>
          <select id="t-gom">
            <option value="ca_ngay" ${tc.anh_gom !== "sang" && tc.anh_gom !== "chieu" ? "selected" : ""}>Cả ngày</option>
            <option value="sang" ${tc.anh_gom === "sang" ? "selected" : ""}>Chỉ sáng</option>
            <option value="chieu" ${tc.anh_gom === "chieu" ? "selected" : ""}>Chỉ chiều</option>
          </select></div>
      </div>
      <div>
        <h3>Tránh gửi trùng</h3>
        <label class="tich"><input type="checkbox" id="t-botrung" ${tc.bo_qua_trung !== false ? "checked" : ""}>
          <span>Bỏ qua người <b>đã nhận y nguyên</b></span></label>
        <label class="tich"><input type="checkbox" id="t-thaydoi" ${tc.chi_thay_doi ? "checked" : ""}>
          <span>Chỉ gửi người <b>có thay đổi</b></span></label>

        <h3>Người nhận</h3>
        <label class="tich"><input type="radio" name="ai" value="tat_ca" checked><span>Tất cả</span></label>
        <label class="tich"><input type="radio" name="ai" value="gvcn"><span>Chỉ giáo viên chủ nhiệm</span></label>
        <label class="tich"><input type="radio" name="ai" value="chon"><span>Chọn tay</span></label>
        <div id="khung-chon" hidden>
          <div class="hang-nut" style="margin:.3rem 0">
            <button type="button" class="nut nho" id="chon-het">Chọn hết</button>
            <button type="button" class="nut nho" id="bo-het">Bỏ hết</button>
            <input type="search" id="loc-gv" placeholder="Lọc tên…" style="max-width:150px">
          </div>
          <div class="ds-tich" id="ds-chon" style="max-height:170px">${dsGv.map((g) =>
            `<label class="tich" data-ten="${esc(g.ho_ten.toLowerCase())}"><input type="checkbox" name="ng" value="gv:${g.id}" checked>
              <span>${esc(g.ho_ten)} <span class="g">${esc(g.ma_gv)}</span></span></label>`).join("")}</div>
        </div>
      </div>
    </div>
    <hr class="tach">
    <div class="o-nhap"><label>Lời nhắn kèm thời khoá biểu cá nhân</label>
      <textarea id="t-mau-gv" rows="2">${esc(tc.mau_tin_gv || cd.mau_tin_gv)}</textarea>
      <div class="goi-y">{truong} {ten} {so_tkb} {ngay} {nam_hoc} {hoc_ky} {lop} {so_tiet}</div></div>
    <div class="o-nhap"><label>Lời nhắn kèm thời khoá biểu lớp</label>
      <textarea id="t-mau-lop" rows="2">${esc(tc.mau_tin_lop || cd.mau_tin_lop)}</textarea></div>`;

  const chon = await moHop({
    tieuDe: "Gửi thời khoá biểu — tuỳ chọn", rong: "rong", noiDung,
    nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Xem trước", kieu: "chinh", giaTri: "xem" }],
    khiMo: (hop) => {
      const kc = hop.querySelector("#khung-chon");
      $$('input[name="ai"]', hop).forEach((r) => r.addEventListener("change", () => {
        kc.hidden = hop.querySelector('input[name="ai"]:checked').value !== "chon";
      }));
      hop.querySelector("#chon-het").onclick = () => $$('input[name="ng"]', hop).forEach((x) => { x.checked = true; });
      hop.querySelector("#bo-het").onclick = () => $$('input[name="ng"]', hop).forEach((x) => { x.checked = false; });
      hop.querySelector("#loc-gv").oninput = (e) => {
        const v = e.target.value.toLowerCase();
        $$("#ds-chon .tich", hop).forEach((l) => { l.style.display = l.dataset.ten.includes(v) ? "" : "none"; });
      };
      hop.querySelector(".hop-chan .nut.chinh").addEventListener("click", () => {
        const g = (id) => hop.querySelector(id);
        const ai = hop.querySelector('input[name="ai"]:checked').value;
        Object.assign(tc, {
          gui_tkb_gv: g("#t-gv").checked, gui_tkb_lop_gvcn: g("#t-lop").checked, gui_nguoi_ngoai: g("#t-ngoai").checked,
          gui_anh: g("#t-anh").checked, gui_docx: g("#t-docx").checked, anh_gom: g("#t-gom").value,
          bo_qua_trung: g("#t-botrung").checked, chi_thay_doi: g("#t-thaydoi").checked,
          chi_gvcn: ai === "gvcn",
          chi_chon: ai === "chon"
            ? $$('input[name="ng"]:checked', hop).map((x) => { const [l, i] = x.value.split(":"); return { nguoi_loai: l, nguoi_id: Number(i) }; })
            : null,
          mau_tin_gv: g("#t-mau-gv").value, mau_tin_lop: g("#t-mau-lop").value,
        });
      }, true);
    },
  });
  return chon === "xem" ? tc : null;
}

/** Bước 3: hộp chạy — thanh tiến độ, nhật ký, tạm dừng. */
function hopChay(dotId, tomTat) {
  let boNghe = null;
  return moHop({
    tieuDe: "Đang gửi", rong: "rong", khongDongNgoai: false,
    noiDung: `
      <div class="thanh" style="margin-bottom:.5rem"><i id="g-thanh" style="width:0%"></i></div>
      <p class="nho mo" id="g-buoc" style="margin:0 0 .6rem">Sẵn sàng gửi ${so(tomTat.se_gui)} mục.</p>
      <div class="hang-nut" style="margin-bottom:.6rem">
        <button class="nut" id="g-thu">Gửi thử 3 người</button>
        <button class="nut chinh" id="g-het">Bắt đầu gửi tất cả</button>
        <button class="nut" id="g-dung" disabled>Tạm dừng</button>
      </div>
      <div class="console" id="g-log"></div>`,
    nut: [{ ten: "Danh sách lỗi", giaTri: "loi" }, { ten: "Đóng", kieu: "chinh", giaTri: null }],
    khiMo: (hop) => {
      const log = hop.querySelector("#g-log");
      const th = hop.querySelector("#g-thanh"), bu = hop.querySelector("#g-buoc");
      themDongLog(log, `Đợt gửi: ${tomTat.se_gui} mục sẽ gửi, ${tomTat.bo_qua} bỏ qua.`, "mo");
      boNghe = window.api.gui.onTienDo((t) => {
        if (t.tong) th.style.width = Math.round((t.da / t.tong) * 100) + "%";
        if (bu) bu.textContent = `${t.da}/${t.tong} — ${t.buoc || ""}`;
        if (t.kieu === "xong_mot") themDongLog(log, `✓ ${t.viec.nguoi_ten} — ${t.viec.loai === "lop" ? "TKB lớp " + t.viec.ma : "TKB cá nhân"}`, "ok");
        else if (t.kieu === "loi_mot") themDongLog(log, `✗ ${t.viec.nguoi_ten} — ${t.loi}${t.ma_loi ? " (mã " + t.ma_loi + ")" : ""}`, "xau");
        else if (t.kieu === "thu_lai") themDongLog(log, `↻ Thử lại lần ${t.lan}: ${t.viec.nguoi_ten}`, "canh");
        else if (t.kieu === "nghi") themDongLog(log, "⏸ " + t.buoc, "mo");
        else if (t.kieu === "cham_gioi_han") themDongLog(log, "⛔ " + (t.gioi_han?.canh_bao?.[0] || "Chạm giới hạn."), "canh");
        else if (t.kieu === "hoan_tat") themDongLog(log, "Hoàn tất.", "ok");
        else if (t.kieu === "da_dung") themDongLog(log, "Dừng: " + (t.ly_do_dung || ""), "canh");
      });
      const chay = async (n) => {
        hop.querySelector("#g-thu").disabled = true;
        hop.querySelector("#g-het").disabled = true;
        hop.querySelector("#g-dung").disabled = false;
        const r = n ? await window.api.gui.thu(dotId, n) : await window.api.gui.chay(dotId);
        hop.querySelector("#g-thu").disabled = false;
        hop.querySelector("#g-het").disabled = false;
        hop.querySelector("#g-dung").disabled = true;
        if (!r.ok) baoKetQua(r);
        else if (n) baoOk(`Đã gửi thử ${r.gui_thu} người. Kiểm tra Zalo rồi bấm “Bắt đầu gửi tất cả”.`);
        else baoOk(`Xong: gửi ${r.xong}, lỗi ${r.loi}, còn chờ ${r.cho}.`);
        const d = await window.api.gui.dsLoi(dotId).catch(() => null);
        if (d?.tong) themDongLog(log, `${d.tong} người không nhận được — bấm “Danh sách lỗi”.`, "xau");
      };
      hop.querySelector("#g-thu").onclick = () => chay(3);
      hop.querySelector("#g-het").onclick = () => chay(0);
      hop.querySelector("#g-dung").onclick = async () => {
        await window.api.gui.tamDung("Người dùng bấm tạm dừng.");
        themDongLog(log, "Đang dừng sau khi xong mục hiện tại…", "canh");
      };
    },
  }).then(async (r) => {
    boNghe?.();
    if (r === "loi") await moHopLoi(dotId);
  });
}

/** Mở luồng gửi cho một thời khoá biểu. */
export async function moGui(tkbId) {
  // Chưa kết nối thì mở ngay hộp quét QR, kết nối xong đi tiếp không phải bấm lại.
  if (!(await canZalo("Phải kết nối Zalo mới gửi được. Quét mã QR bằng Zalo trên điện thoại."))) return;

  const cd = (await window.api.app.caiDat()).cai_dat;
  let tcCu = {};
  try { tcCu = JSON.parse(cd.tuy_chon_gui_json || "{}"); } catch { /* */ }
  const dsGv = (await window.api.gv.ds({})).ds.filter((g) => g.hoat_dong);

  const tc = await hopTuyChon(tcCu, dsGv);
  if (!tc) return;

  const cho = hopCho("Đang dựng danh sách gửi");
  let r;
  try { r = await window.api.gui.chuanBi(tkbId, tc); } finally { cho.dong(); await cho.doi; }
  if (!r.ok) return baoKetQua(r);

  const gh = await window.api.gui.gioiHan(null);
  const xacNhan = await moHop({
    tieuDe: "Xem trước đợt gửi", rong: "rat-rong",
    // Bấm “Trên ĐT” thì đóng bảng xem trước, mở màn mô phỏng điện thoại, xong quay lại đây.
    khiMo: (hop, xong) => hop.addEventListener("click", (e) => {
      const b = e.target.closest("[data-dt]");
      if (b) xong("dt:" + b.dataset.dt);
    }),
    noiDung: veTomTat(r.tom_tat) +
      (r.canh_bao || []).map((c) => `<div class="bao canh">${esc(c)}</div>`).join("") +
      (gh.canh_bao || []).map((c) => `<div class="bao canh">${esc(c)}</div>`).join("") +
      `<p class="nho mo">Hôm nay còn gửi được ${so(gh.con_ban)} người đã kết bạn và ${so(gh.con_la)} người chưa kết bạn.</p>` +
      veBangMuc(r.muc),
    nut: [{ ten: "Quay lại", giaTri: "lai" }, { ten: "Xem rủi ro", giaTri: "rui_ro" },
          { ten: `Bắt đầu (${r.tom_tat.se_gui} mục)`, kieu: "chinh", giaTri: "tao", tat: r.tom_tat.se_gui === 0 }],
  });
  if (typeof xacNhan === "string" && xacNhan.startsWith("dt:")) {
    const [loai, ...r] = xacNhan.slice(3).split(":");
    const { moXemMobile } = await import("./xem-mobile.js");
    await moXemMobile(tkbId, { loai, ma: r.join(":") });
    return moGui(tkbId);
  }
  if (xacNhan === "rui_ro") { await moHopRuiRo({}); return moGui(tkbId); }
  if (xacNhan === "lai") return moGui(tkbId);
  if (xacNhan !== "tao") return;

  const rt = await window.api.gui.taoDot(tkbId, tc, r.muc);
  if (!rt.ok) return baoKetQua(rt);
  await hopChay(rt.dot_id, r.tom_tat);
  (await import("./app.js")).capNhatTienDo();
}

/** Mở lại một đợt còn dở. */
export async function moTiepDot(dotId) {
  const d = (await window.api.gui.chiTietDot(dotId)).dot;
  if (!d) return baoXau("Không tìm thấy đợt gửi.");
  const cho = d.muc.filter((m) => m.trang_thai === "cho").length;
  await hopChay(dotId, { se_gui: cho, bo_qua: d.bo_qua || 0 });
}
