/**
 * Cài đặt — chia bốn tab nhỏ cho đỡ rối: Chung · An toàn khi gửi · Lời nhắn · Hệ thống.
 * Mỗi dòng một việc: nhãn bên trái, ô nhập nhỏ bên phải.
 * Các tab ẩn vẫn nằm trong DOM nên bấm Lưu là lưu được hết một lượt.
 */
import { esc, so, gioVn, baoOk, baoKetQua, hoi, moHop, bang, ganKhung,} from "../chung.js";
import { moHopCapNhat } from "../cap-nhat.js";
import { moHopRuiRo } from "../rui-ro.js";

/** Một dòng cài đặt: nhãn — ô nhập — đơn vị — ghi chú nhỏ. */
const dong = (id, nhan, giaTri, { donVi = "", goiY = "", rong = "92px", kieu = "number" } = {}) => `
  <div class="cd-dong">
    <label for="${id}">${esc(nhan)}${goiY ? `<span class="cd-goi">${esc(goiY)}</span>` : ""}</label>
    <span class="cd-o"><input type="${kieu}" id="${id}" value="${esc(giaTri)}" min="0" style="width:${rong}">
      ${donVi ? `<span class="cd-dv">${esc(donVi)}</span>` : ""}</span>
  </div>`;

/** Dòng chọn từ danh sách. */
const dongChon = (id, nhan, muc, giaTri) => `
  <div class="cd-dong">
    <label for="${id}">${esc(nhan)}</label>
    <span class="cd-o"><select id="${id}" style="width:170px">
      ${muc.map(([v, t]) => `<option value="${esc(v)}" ${String(giaTri ?? "") === v ? "selected" : ""}>${esc(t)}</option>`).join("")}
    </select></span>
  </div>`;

const giay = (ms) => (Number(ms) / 1000).toFixed(Number(ms) % 1000 ? 1 : 0);

/** Tab đang mở, nhớ giữa các lần vào trang. */
let tabCd = "chung";

const TAB_CD = [
  { ma: "chung", ten: "Chung" },
  { ma: "an-toan", ten: "An toàn khi gửi" },
  { ma: "loi-nhan", ten: "Lời nhắn" },
  { ma: "he-thong", ten: "Hệ thống" },
];

export async function ve(khung, thamSo = {}) {
  const cd = (await window.api.app.caiDat()).cai_dat;
  const ti = await window.api.app.thongTin();
  const nk = (await window.api.app.nhatKy(100)).ds;
  if (thamSo?.tabCaiDat && TAB_CD.some((t) => t.ma === thamSo.tabCaiDat)) tabCd = thamSo.tabCaiDat;

  const tChung = `
    <div class="luoi c2">
      <div class="the">
        <h2>Nhà trường</h2>
        <div class="cd-bang">
          <div class="cd-dong">
            <label for="c-truong">Tên trường<span class="cd-goi">Để trống thì lấy từ tệp Excel.</span></label>
            <span class="cd-o"><input type="text" id="c-truong" value="${esc(cd.ten_truong || "")}"
              placeholder="Trường THCS Minh Khai" style="width:230px"></span>
          </div>
          ${dongChon("c-kho", "Khổ giấy mặc định", [["A4", "A4"], ["A5", "A5"]], cd.kho_giay_mac_dinh === "A5" ? "A5" : "A4")}
        </div>
      </div>

      <div class="the">
        <h2>Hiển thị và cập nhật</h2>
        <div class="cd-bang">
          ${dongChon("c-toi", "Giao diện", [["", "Theo hệ điều hành"], ["0", "Luôn sáng"], ["1", "Luôn tối"]], cd.giao_dien_toi || "")}
          <div class="cd-dong">
            <label for="c-tu-kiem">Tự kiểm tra bản mới<span class="cd-goi">Đang dùng bản ${esc(ti.phien_ban)}.</span></label>
            <span class="cd-o"><label class="tich" style="margin:0"><input type="checkbox" id="c-tu-kiem"
              ${cd.tu_kiem_cap_nhat !== "0" ? "checked" : ""}><span></span></label></span>
          </div>
        </div>
        <div class="hang-nut" style="margin-top:.5rem">
          <button class="nut nho" id="kiem-cap-nhat">Kiểm tra cập nhật</button>
        </div>
      </div>
    </div>`;

  const tAnToan = `
    <div class="bao canh" style="margin-bottom:.7rem"><b>Rủi ro nằm ở người chưa kết bạn.</b>
      <span class="sua">Nhắn cho người đã kết bạn là việc bình thường nên mức rộng hơn nhiều.
      Nên gửi bằng tài khoản Zalo phụ, giữ tài khoản chính cho việc hằng ngày.</span></div>
    <div class="luoi c2">
      <div class="the">
        <h2>Giới hạn mỗi 24 giờ</h2>
        <div class="cd-bang">
          ${dong("c-han-ban", "Người ĐÃ kết bạn", cd.gioi_han_ban_24h, { donVi: "người" })}
          ${dong("c-han-la", "Người CHƯA kết bạn", cd.gioi_han_la_24h,
            { donVi: "người", goiY: "Zalo hạn chế tài khoản chủ yếu vì nhóm này." })}
          ${dong("c-han-tin", "Tổng số tin", cd.gioi_han_tin_24h, { donVi: "tin" })}
          ${dong("c-han-dot", "Tối đa mỗi đợt", cd.gioi_han_moi_dot,
            { donVi: "người", goiY: "Vượt mức chỉ cảnh báo, vẫn gửi được." })}
          ${dong("c-dung-loi", "Dừng sau mấy lỗi liên tiếp", cd.dung_sau_n_loi, { donVi: "lỗi", rong: "72px" })}
        </div>
        <p class="nho mo" style="margin:.45rem 0 0">Đếm riêng cho từng tài khoản Zalo. Đổi tài khoản là tính lại từ đầu.</p>
      </div>

      <div class="the">
        <h2>Nhịp gửi</h2>
        <p class="nho mo" style="margin:.1rem 0 .4rem">Gửi chậm thì an toàn hơn. Hiện mỗi người mất khoảng
          <b id="cd-uoc">${giay(Number(cd.nhip_2_nguoi_min) + Number(cd.nhip_2_nguoi_max))}</b> giây.</p>
        <div class="cd-bang">
          ${dong("c-tin-min", "Giữa 2 tin", cd.nhip_2_tin_min, { donVi: "→", rong: "86px" })}
          ${dong("c-tin-max", "…đến", cd.nhip_2_tin_max, { donVi: "mili giây", rong: "86px" })}
          ${dong("c-ng-min", "Giữa 2 người", cd.nhip_2_nguoi_min, { donVi: "→", rong: "86px" })}
          ${dong("c-ng-max", "…đến", cd.nhip_2_nguoi_max, { donVi: "mili giây", rong: "86px" })}
          ${dong("c-nghi-n", "Nghỉ sau mỗi", cd.nghi_moi_n, { donVi: "người", rong: "72px" })}
          ${dong("c-nghi-min", "Nghỉ", cd.nghi_min, { donVi: "→", rong: "86px" })}
          ${dong("c-nghi-max", "…đến", cd.nghi_max, { donVi: "mili giây", rong: "86px" })}
          ${dong("c-lui", "Lùi khi lỗi tạm thời", cd.lui_khi_loi_ms, { donVi: "mili giây", rong: "86px" })}
        </div>
        <p class="nho mo" style="margin:.45rem 0 0">1000 mili giây = 1 giây.</p>
      </div>
    </div>
    <div class="hang-nut"><button class="nut nho" id="xem-rui-ro">Xem đầy đủ điều khoản và rủi ro</button></div>`;

  const tLoiNhan = `
    <div class="the">
      <h2>Lời nhắn mặc định</h2>
      <p class="nho mo" style="margin:.1rem 0 .5rem">Thay được: <span class="mono">{truong} {ten} {gv} {so_tkb} {ngay}
        {nam_hoc} {hoc_ky} {lop} {so_tiet}</span>. Mỗi đợt gửi vẫn sửa riêng được ngay trong hộp gửi.</p>
      <div class="o-nhap" style="margin-bottom:.5rem"><label>Kèm thời khoá biểu cá nhân</label>
        <textarea id="c-mau-gv" rows="3">${esc(cd.mau_tin_gv || "")}</textarea></div>
      <div class="o-nhap" style="margin-bottom:0"><label>Kèm thời khoá biểu lớp</label>
        <textarea id="c-mau-lop" rows="3">${esc(cd.mau_tin_lop || "")}</textarea></div>
    </div>

    <div class="the">
      <h2>Lời nhắn gửi vào nhóm Zalo</h2>
      <p class="nho mo" style="margin:.1rem 0 .5rem">Cả nhóm cùng đọc nên lời nhắn khác hẳn gửi riêng:
        không xưng tên một thầy/cô, không nói “lớp thầy/cô chủ nhiệm”. Thay thêm được
        <span class="mono">{nhom}</span> (tên nhóm) và <span class="mono">{gv}</span> (tên giáo viên
        của thời khoá biểu).</p>
      <div class="o-nhap" style="margin-bottom:.5rem"><label>Kèm thời khoá biểu lớp</label>
        <textarea id="c-mau-nhom-lop" rows="3">${esc(cd.mau_tin_nhom_lop || "")}</textarea></div>
      <div class="o-nhap" style="margin-bottom:0"><label>Kèm thời khoá biểu cá nhân</label>
        <textarea id="c-mau-nhom-gv" rows="3">${esc(cd.mau_tin_nhom_gv || "")}</textarea></div>
    </div>`;

  const tHeThong = `
    <div class="the">
      <h2>Thư mục dữ liệu</h2>
      <table class="b"><tbody>
        ${[["Thư mục dữ liệu", ti.duong_dan?.goc_tai_lieu], ["Chờ xử lý", ti.duong_dan?.cho_xu_ly],
           ["Kết xuất", ti.duong_dan?.ket_xuat], ["Cơ sở dữ liệu", ti.duong_dan?.csdl]]
          .map(([t, d]) => `<tr><td style="width:24%">${esc(t)}</td><td class="mono nho">${esc(d || "")}</td>
            <td style="width:1%"><button class="nut nho" data-mo="${esc(d || "")}">Mở</button></td></tr>`).join("")}
      </tbody></table>
      <div class="hang-nut" style="margin-top:.5rem">
        <button class="nut nho" id="tao-thu-muc">Tạo lại thư mục chuẩn</button>
        <button class="nut nho" id="mo-huong-dan">Hướng dẫn thư mục</button>
        <button class="nut nho" id="xem-nhat-ky">Nhật ký hoạt động (${nk.length})</button>
      </div>
    </div>

    <div class="the">
      <h2>Phần mềm</h2>
      <table class="b"><tbody>
        <tr><td style="width:24%">Phiên bản</td><td class="mono">TKB Zalo ${esc(ti.phien_ban)}</td></tr>
        <tr><td>Nền tảng</td><td class="nho mono">Electron ${esc(ti.dien_tu)} · Node ${esc(ti.node)}</td></tr>
      </tbody></table>
    </div>`;

  const NOI = { chung: tChung, "an-toan": tAnToan, "loi-nhan": tLoiNhan, "he-thong": tHeThong };

  khung.innerHTML = `
  <div class="dau-trang" style="margin-bottom:.5rem">
    <div><h1 style="margin:0">Cài đặt</h1></div>
    <div class="hang-nut"><button class="nut chinh" id="luu">Lưu</button></div>
  </div>

  <div class="tab tab-lon" id="tab-cd">
    ${TAB_CD.map((t) => `<button class="${t.ma === tabCd ? "chon" : ""}" data-tab-cd="${t.ma}">${esc(t.ten)}</button>`).join("")}
  </div>

  ${TAB_CD.map((t) => `<section data-khu-cd="${t.ma}" ${t.ma === tabCd ? "" : "hidden"}>${NOI[t.ma]}</section>`).join("")}`;

  // Ước lượng thời gian mỗi người, cập nhật ngay khi sửa nhịp.
  const uoc = () => {
    const v = (id) => Number(khung.querySelector(id)?.value || 0);
    const e = khung.querySelector("#cd-uoc");
    if (e) e.textContent = giay((v("#c-ng-min") + v("#c-ng-max")) / 2 + (v("#c-tin-min") + v("#c-tin-max")) / 2);
  };
  for (const id of ["#c-ng-min", "#c-ng-max", "#c-tin-min", "#c-tin-max"]) {
    khung.querySelector(id)?.addEventListener("input", uoc);
  }
  uoc();

  khung.querySelector("#tab-cd").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab-cd]");
    if (!b || b.dataset.tabCd === tabCd) return;
    tabCd = b.dataset.tabCd;
    for (const t of TAB_CD) {
      khung.querySelector(`[data-tab-cd="${t.ma}"]`).classList.toggle("chon", t.ma === tabCd);
      khung.querySelector(`[data-khu-cd="${t.ma}"]`).hidden = t.ma !== tabCd;
    }
    document.getElementById("chinh").scrollTop = 0;
  });

  ganKhung(khung, "click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.mo) return window.api.app.moThuMuc(b.dataset.mo);
    if (b.id === "mo-huong-dan") return window.api.app.moTep(ti.duong_dan?.huong_dan_thu_muc);
    if (b.id === "tao-thu-muc") {
      return baoKetQua(await window.api.tep.taoThuMucChuan(), "Đã tạo lại cây thư mục chuẩn.");
    }
    if (b.id === "kiem-cap-nhat") return moHopCapNhat({ tuTay: true });
    if (b.id === "xem-rui-ro") return moHopRuiRo({});
    if (b.id === "xem-nhat-ky") {
      return moHop({
        tieuDe: "Nhật ký hoạt động", rong: "rat-rong",
        noiDung: bang(nk, [
          { ten: "Lúc", ve: (x) => `<span class="nho">${esc(gioVn(x.luc))}</span>` },
          { ten: "Việc", ve: (x) => `<b>${esc(x.hanh_dong)}</b>` },
          { ten: "Đối tượng", ve: (x) => `<span class="nho">${esc(x.doi_tuong)}</span>` },
          { ten: "Mô tả", ve: (x) => `<span class="nho mo">${esc(x.mo_ta)}</span>` },
        ], { trong: "Chưa có hoạt động nào." }),
        nut: [{ ten: "Đóng", kieu: "chinh", giaTri: true }],
      });
    }
    if (b.id === "luu") {
      const v = (id) => khung.querySelector(id).value;
      const r = await window.api.app.luuCaiDat({
        ten_truong: v("#c-truong").trim(),
        kho_giay_mac_dinh: v("#c-kho"),
        giao_dien_toi: v("#c-toi"),
        gioi_han_moi_dot: v("#c-han-dot"), gioi_han_ban_24h: v("#c-han-ban"), gioi_han_la_24h: v("#c-han-la"),
        gioi_han_tin_24h: v("#c-han-tin"), dung_sau_n_loi: v("#c-dung-loi"),
        nhip_2_tin_min: v("#c-tin-min"), nhip_2_tin_max: v("#c-tin-max"),
        nhip_2_nguoi_min: v("#c-ng-min"), nhip_2_nguoi_max: v("#c-ng-max"),
        nghi_moi_n: v("#c-nghi-n"), nghi_min: v("#c-nghi-min"), nghi_max: v("#c-nghi-max"),
        lui_khi_loi_ms: v("#c-lui"),
        mau_tin_gv: v("#c-mau-gv"), mau_tin_lop: v("#c-mau-lop"),
        mau_tin_nhom_lop: v("#c-mau-nhom-lop"), mau_tin_nhom_gv: v("#c-mau-nhom-gv"),
        tu_kiem_cap_nhat: khung.querySelector("#c-tu-kiem").checked ? "1" : "0",
      });
      if (baoKetQua(r, "Đã lưu cài đặt.")) {
        const t = v("#c-toi");
        if (t === "1") document.documentElement.dataset.theme = "dark";
        else if (t === "0") document.documentElement.dataset.theme = "light";
        else delete document.documentElement.dataset.theme;
      }
      return;
    }
  });
}
