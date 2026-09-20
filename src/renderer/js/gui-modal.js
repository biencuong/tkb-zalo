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
    <div class="o-so vach"><b>Gửi lại</b><span class="v">${so(tt.trung)}</span>
      <span class="g">từng nhận y nguyên nội dung này</span></div>
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
        : m.trung ? '<span class="nhan n-xam">gửi lại · đã nhận y nguyên</span>'
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

/** Xếp hạng người nhận: gửi được ngay / gửi được nhưng rủi ro / chưa gửi được. */
function xepHang(g) {
  if (g.la_nhom) return { ma: "nhom", nhan: '<span class="nhan n-ok">Nhóm Zalo</span>', thu: 0 };
  if (!g.dien_thoai) return { ma: "thieu_sdt", nhan: '<span class="nhan n-xau">Chưa có số</span>', thu: 3 };
  if (!g.zalo_uid) {
    return g.zalo_trang_thai === "khong_thay"
      ? { ma: "khong_zalo", nhan: '<span class="nhan n-xau">Số không có Zalo</span>', thu: 3 }
      : { ma: "chua_do", nhan: '<span class="nhan n-canh">Chưa dò Zalo</span>', thu: 2 };
  }
  if (g.la_ban === 0) return { ma: "chua_ban", nhan: '<span class="nhan n-canh">Chưa kết bạn</span>', thu: 1 };
  return { ma: "san_sang", nhan: '<span class="nhan n-ok">Sẵn sàng</span>', thu: 0 };
}

/** Một dòng người nhận trong bảng chọn tay. */
function veDongNguoi(g) {
  const h = xepHang(g);
  const chonDuoc = h.ma !== "thieu_sdt" && h.ma !== "khong_zalo";
  return `<label class="ng-o ${chonDuoc ? "" : "tat"} h-${h.ma}"
      data-tim="${esc((g.ho_ten + " " + (g.ma_gv || "") + " " + (g.dien_thoai || "") + " " + (g.to_chuyen_mon || "")).toLowerCase())}"
      data-hang="${h.ma}">
    <input type="checkbox" name="ng" value="${g.la_nhom ? "ngoai" : "gv"}:${g.id}"
      ${chonDuoc ? "checked" : "disabled"}>
    <span class="ng-chu">
      <b>${esc(g.ho_ten)}</b>
      <span class="ng-phu">${g.la_nhom
        ? esc(g.ghi_chu || "Nhóm Zalo")
        : `${esc(g.ma_gv || "")}${g.to_chuyen_mon ? " · " + esc(g.to_chuyen_mon) : ""}${g.dien_thoai ? " · " + esc(g.dien_thoai) : " · chưa có số"}`}</span>
    </span>
    ${h.nhan}
  </label>`;
}

/** Bước 1: hộp tuỳ chọn. */
async function hopTuyChon(tuyChonCu, dsGv, dsNhom) {
  const cd = (await window.api.app.caiDat()).cai_dat;
  const tc = { ...tuyChonCu };
  const nguoi = [...dsNhom.map((n) => ({ ...n, la_nhom: 1 })), ...dsGv]
    .sort((a, b) => xepHang(a).thu - xepHang(b).thu || String(a.ho_ten).localeCompare(String(b.ho_ten), "vi"));

  const dem = { san_sang: 0, nhom: 0, chua_ban: 0, chua_do: 0, thieu_sdt: 0, khong_zalo: 0 };
  for (const g of nguoi) dem[xepHang(g).ma] += 1;
  const guiDuoc = dem.san_sang + dem.nhom + dem.chua_ban;

  const noiDung = `
    <div class="luoi c4" style="margin-bottom:.7rem">
      <div class="o-so vach-ok"><b>Gửi được ngay</b><span class="v">${so(dem.san_sang + dem.nhom)}</span>
        <span class="g">${so(dem.nhom)} nhóm · ${so(dem.san_sang)} người đã kết bạn</span></div>
      <div class="o-so ${dem.chua_ban ? "vach-xau" : "vach"}"><b>Chưa kết bạn</b><span class="v">${so(dem.chua_ban)}</span>
        <span class="g">có thể không nhận được tin</span></div>
      <div class="o-so ${dem.chua_do ? "vach-xau" : "vach"}"><b>Chưa dò Zalo</b><span class="v">${so(dem.chua_do)}</span>
        <span class="g">có số nhưng chưa tra Zalo</span></div>
      <div class="o-so ${dem.thieu_sdt + dem.khong_zalo ? "vach-xau" : "vach"}"><b>Không gửi được</b>
        <span class="v">${so(dem.thieu_sdt + dem.khong_zalo)}</span>
        <span class="g">${so(dem.thieu_sdt)} chưa có số · ${so(dem.khong_zalo)} số không có Zalo</span></div>
    </div>

    ${dem.chua_do ? `<div class="bao canh" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
      <span><b>${so(dem.chua_do)} người có số điện thoại nhưng chưa tra Zalo.</b>
        <span class="sua">Tra xong mới gửi được cho họ.</span></span>
      <button type="button" class="nut nho chinh" id="do-ngay">Dò Zalo ngay</button>
    </div>` : ""}
    ${dem.chua_ban ? `<div class="bao canh"><b>${so(dem.chua_ban)} người chưa kết bạn Zalo.</b>
      <span class="sua">Tin rơi vào mục “Tin nhắn từ người lạ”, nhiều người không mở. Nên kết bạn trước.</span></div>` : ""}
    ${NHAC_NGAN}

    <div class="tab" id="tab-gui">
      <button class="chon" data-tg="ai">Gửi cho ai (${so(guiDuoc)})</button>
      <button data-tg="gi">Gửi cái gì</button>
      <button data-tg="loi">Lời nhắn</button>
    </div>

    <div data-khu-tg="ai">
      <div class="hang-nut" style="margin:.2rem 0 .5rem">
        <input type="search" id="loc-ng" placeholder="Tìm tên, mã, số điện thoại, tổ…" style="flex:1;min-width:200px">
        <select id="loc-hang" style="width:auto">
          <option value="">Tất cả</option>
          <option value="san_sang">Chỉ người đã kết bạn</option>
          <option value="nhom">Chỉ nhóm Zalo</option>
          <option value="chua_ban">Chỉ người chưa kết bạn</option>
          <option value="chua_do">Chỉ người chưa dò Zalo</option>
        </select>
        <button type="button" class="nut nho" id="chon-het">Chọn hết</button>
        <button type="button" class="nut nho" id="bo-het">Bỏ hết</button>
      </div>
      <p class="nho mo" id="dem-ng" style="margin:0 0 .4rem"></p>
      <div class="ds-nguoi" id="ds-ng">${nguoi.map(veDongNguoi).join("")}</div>
      <p class="nho mo" style="margin:.5rem 0 0">Dòng mờ là không gửi được: chưa có số điện thoại,
        hoặc số đó không dùng Zalo.</p>
    </div>

    <div data-khu-tg="gi" hidden>
      <div class="luoi c2">
        <div>
          <h3>Gửi những gì</h3>
          <label class="tich"><input type="checkbox" id="t-gv" ${tc.gui_tkb_gv !== false ? "checked" : ""}>
            <span>Thời khoá biểu <b>cá nhân</b> cho giáo viên</span></label>
          <label class="tich"><input type="checkbox" id="t-lop" ${tc.gui_tkb_lop_gvcn !== false ? "checked" : ""}>
            <span>Thời khoá biểu <b>lớp</b> cho chủ nhiệm<span class="g">Lớp chưa có chủ nhiệm sẽ bị bỏ qua.</span></span></label>
          <label class="tich"><input type="checkbox" id="t-ngoai" ${tc.gui_nguoi_ngoai ? "checked" : ""}>
            <span>Người <b>ngoài danh sách</b> và <b>nhóm Zalo</b> đã đăng ký</span></label>
        </div>
        <div>
          <h3>Dạng tệp</h3>
          <label class="tich"><input type="checkbox" id="t-anh" ${tc.gui_anh !== false ? "checked" : ""}>
            <span><b>Ảnh</b> — xem ngay trên điện thoại</span></label>
          <label class="tich"><input type="checkbox" id="t-docx" ${tc.gui_docx !== false ? "checked" : ""}>
            <span><b>Tệp Word</b> — tải về in<span class="g">Không có tệp Word thì mục này tự bỏ qua.</span></span></label>
          <div class="o-nhap" style="max-width:240px"><label>Ảnh gồm buổi nào</label>
            <select id="t-gom">
              <option value="ca_ngay" ${tc.anh_gom !== "sang" && tc.anh_gom !== "chieu" ? "selected" : ""}>Cả ngày</option>
              <option value="sang" ${tc.anh_gom === "sang" ? "selected" : ""}>Chỉ sáng</option>
              <option value="chieu" ${tc.anh_gom === "chieu" ? "selected" : ""}>Chỉ chiều</option>
            </select></div>

          <h3>Gửi lại</h3>
          <p class="nho mo" style="margin:0 0 .3rem">Mặc định <b>gửi lại được thoải mái</b>.
            Phần mềm chỉ đánh dấu mục nào từng gửi y nguyên để bạn biết, không chặn.</p>
          <label class="tich"><input type="checkbox" id="t-botrung" ${tc.bo_qua_trung === true ? "checked" : ""}>
            <span>Bỏ qua người <b>đã nhận y nguyên</b><span class="g">Tích vào nếu chỉ muốn gửi cho người chưa nhận.</span></span></label>
          <label class="tich"><input type="checkbox" id="t-thaydoi" ${tc.chi_thay_doi ? "checked" : ""}>
            <span>Chỉ gửi người <b>có thay đổi</b><span class="g">Bỏ qua cả người chưa từng nhận.</span></span></label>
        </div>
      </div>
    </div>

    <div data-khu-tg="loi" hidden>
      <div class="o-nhap"><label>Lời nhắn kèm thời khoá biểu cá nhân</label>
        <textarea id="t-mau-gv" rows="3">${esc(tc.mau_tin_gv || cd.mau_tin_gv)}</textarea>
        <div class="goi-y">{truong} {ten} {so_tkb} {ngay} {nam_hoc} {hoc_ky} {lop} {so_tiet}</div></div>
      <div class="o-nhap"><label>Lời nhắn kèm thời khoá biểu lớp</label>
        <textarea id="t-mau-lop" rows="3">${esc(tc.mau_tin_lop || cd.mau_tin_lop)}</textarea></div>
    </div>`;

  let doLai = false;
  const chon = await moHop({
    tieuDe: "Gửi thời khoá biểu — tuỳ chọn", rong: "rat-rong", noiDung,
    nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Xem trước", kieu: "chinh", giaTri: "xem" }],
    khiMo: (hop, xong) => {
      const dsO = hop.querySelector("#ds-ng");
      const demLai = () => {
        const n = $$('input[name="ng"]:checked', hop).length;
        hop.querySelector("#dem-ng").textContent = n
          ? `Đang chọn ${n} người nhận.` : "Chưa chọn ai — sẽ không gửi cho người nào.";
      };
      demLai();

      const locLai = () => {
        const v = hop.querySelector("#loc-ng").value.trim().toLowerCase();
        const h = hop.querySelector("#loc-hang").value;
        $$(".ng-o", dsO).forEach((l) => {
          const hop1 = !v || l.dataset.tim.includes(v);
          const hop2 = !h || l.dataset.hang === h;
          l.style.display = hop1 && hop2 ? "" : "none";
        });
      };
      hop.querySelector("#loc-ng").oninput = locLai;
      hop.querySelector("#loc-hang").onchange = locLai;
      hop.querySelector("#chon-het").onclick = () => {
        $$(".ng-o", dsO).forEach((l) => {
          if (l.style.display === "none") return;
          const x = l.querySelector("input");
          if (!x.disabled) x.checked = true;
        });
        demLai();
      };
      hop.querySelector("#bo-het").onclick = () => {
        $$('input[name="ng"]', dsO).forEach((x) => { x.checked = false; });
        demLai();
      };
      dsO.addEventListener("change", demLai);

      hop.querySelector("#do-ngay")?.addEventListener("click", () => { doLai = true; xong("do"); });

      hop.querySelector("#tab-gui").addEventListener("click", (e) => {
        const b = e.target.closest("[data-tg]");
        if (!b) return;
        $$("#tab-gui button", hop).forEach((x) => x.classList.toggle("chon", x === b));
        $$("[data-khu-tg]", hop).forEach((k) => { k.hidden = k.dataset.khuTg !== b.dataset.tg; });
      });

      hop.querySelector(".hop-chan .nut.chinh").addEventListener("click", () => {
        const g = (id) => hop.querySelector(id);
        const daChon = $$('input[name="ng"]:checked', hop)
          .map((x) => { const [l, i] = x.value.split(":"); return { nguoi_loai: l, nguoi_id: Number(i) }; });
        const tongChonDuoc = $$('input[name="ng"]:not(:disabled)', hop).length;
        Object.assign(tc, {
          gui_tkb_gv: g("#t-gv").checked, gui_tkb_lop_gvcn: g("#t-lop").checked, gui_nguoi_ngoai: g("#t-ngoai").checked,
          gui_anh: g("#t-anh").checked, gui_docx: g("#t-docx").checked, anh_gom: g("#t-gom").value,
          bo_qua_trung: g("#t-botrung").checked, chi_thay_doi: g("#t-thaydoi").checked,
          chi_gvcn: false,
          // Chọn hết thì để trống cho nhẹ, chọn một phần mới lọc theo danh sách
          chi_chon: daChon.length && daChon.length < tongChonDuoc ? daChon : null,
          mau_tin_gv: g("#t-mau-gv").value, mau_tin_lop: g("#t-mau-lop").value,
        });
      }, true);
    },
  });

  if (chon === "do") return { doLai: true };
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
      // Zalo báo lại khi tin thật sự tới máy người nhận — hiện ngay trong nhật ký.
      const boNgheTin = window.api.gui.onTrangThaiTin((x) => {
        themDongLog(log, x.loai === "xem"
          ? `👁 ${x.so} tin đã được mở xem`
          : `✓✓ ${x.so} tin đã tới máy người nhận`, "ok");
      });
      hop.addEventListener("tkb:dong", () => boNgheTin?.(), { once: true });

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
    document.getElementById("hop")?.dispatchEvent(new CustomEvent("tkb:dong"));
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
  const dsNhom = ((await window.api.gv.nguoiNhan()).ds || []).filter((x) => x.la_nhom && x.hoat_dong !== 0);

  const tc = await hopTuyChon(tcCu, dsGv, dsNhom);
  if (!tc) return;

  // Người dùng bấm "Dò Zalo ngay" ngay trong hộp: dò xong quay lại hộp với số liệu mới.
  if (tc.doLai) {
    const cho0 = hopCho("Đang dò Zalo theo số điện thoại", "Dò chậm cho an toàn…");
    const boNghe = window.api.zalo.onDoTienDo((t) => cho0.capNhat(`Đã dò ${t.da}/${t.tong} số — ${esc(t.sdt)}`));
    let kq;
    try { kq = await window.api.zalo.doUid({ chiThieu: true }); }
    finally { boNghe(); cho0.dong(); await cho0.doi; }
    if (kq?.ok) {
      await window.api.zalo.doiChieuBanBe().catch(() => {});
      baoOk(`Dò xong ${kq.n} số: tìm thấy ${kq.tim_thay}, không có Zalo ${kq.khong_thay}.`);
    } else baoKetQua(kq);
    return moGui(tkbId);
  }

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
