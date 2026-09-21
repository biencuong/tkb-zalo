/** Thời khoá biểu: danh sách theo số và ngày, chi tiết từng lớp/giáo viên, chọn chủ nhiệm, tạo ảnh. */
import { esc, so, ngayVn, gioVn, moHop, hoi, baoOk, baoXau, baoKetQua, hopCho, luoiTkb, bang, $$, coHoac, ganKhung, ICON_XOA,} from "../chung.js";
import { di, capNhatTienDo } from "../app.js";
import { chipZalo } from "../zalo-nhanh.js";
import { moGui } from "../gui-modal.js";
import { moXemMobile } from "../xem-mobile.js";
import { damBaoTep } from "../dam-bao-tep.js";

let dangXem = null;

/**
 * Đưa thời khoá biểu lên Cơ sở dữ liệu ngành giáo dục (csdl.moet.gov.vn) — CHƯA LÀM ĐƯỢC.
 *
 * Đã tra ngày 21/9/2026: CSDL ngành chia sẻ dữ liệu qua API dùng token của hệ thống đăng nhập
 * một lần (SSO), và CHỈ mở cho phần mềm quản lý nhà trường đã được Bộ thẩm định rồi cấp kết nối
 * trục dữ liệu (K12Online/K12Connect, EnetViet, ONEDU…). Không có API công khai cho phần mềm
 * cá nhân, và phần mềm đã kết nối còn bị cấm chia sẻ dữ liệu cho bên thứ ba.
 * → Đường khả thi: XUẤT TỆP đúng mẫu để người dùng tự tải lên bằng tài khoản của trường.
 *   Muốn làm đúng mẫu thì cần lấy tệp mẫu từ chính tài khoản CSDL của trường (phải đăng nhập).
 */
function moHopCsdlNganh() {
  return moHop({
    tieuDe: "Đưa thời khoá biểu lên CSDL ngành giáo dục", rong: "rong",
    noiDung: `
      <div class="bao tin"><b>Chức năng đang chờ làm.</b>
        <span class="sua">Nút này để sẵn chỗ. Dưới đây là kết quả tìm hiểu, để biết làm được tới đâu.</span></div>

      <h3>Vì sao chưa tự đẩy thẳng lên được</h3>
      <ul class="ds-gon">
        <li>Cơ sở dữ liệu ngành (<span class="mono">truong.csdl.moet.gov.vn</span>) trao đổi dữ liệu
          qua API có <b>token đăng nhập một lần (SSO)</b>.</li>
        <li>Kết nối đó chỉ cấp cho <b>phần mềm quản lý nhà trường đã được Bộ thẩm định</b>
          (K12Online, EnetViet, ONEDU…), theo hợp đồng kết nối trục dữ liệu — <b>không có API công khai</b>
          cho phần mềm cá nhân.</li>
        <li>Phần mềm đã kết nối còn bị <b>cấm chia sẻ dữ liệu cho bên thứ ba</b>; vi phạm thì bị cắt kết nối.</li>
      </ul>

      <h3>Cách làm được, khi bạn muốn</h3>
      <ol class="ds-gon">
        <li><b>Xuất tệp đúng mẫu nhập của CSDL ngành</b> (giống cách nhập danh sách học sinh từ Excel),
          rồi bạn tự tải lên bằng tài khoản của trường. Hợp lệ, không cần xin phép ai.</li>
        <li>Để làm đúng mẫu, cần <b>tệp mẫu tải từ chính tài khoản CSDL của trường</b> — tôi không đăng nhập
          được nên phải nhờ bạn tải về rồi đưa vào đây.</li>
      </ol>

      <p class="nho mo">Có tệp mẫu thì phần này làm nhanh: đọc mẫu, ánh xạ cột, xuất ra tệp tải lên được.</p>`,
    nut: [{ ten: "Đã rõ", kieu: "chinh", giaTri: true }],
  });
}

/**
 * XOÁ THỜI KHOÁ BIỂU — một hộp cho cả ba cách: tích từng số, tích cả một đợt
 * (năm học · học kỳ), hoặc "Chọn tất cả". Lịch sử gửi giữ nguyên.
 * Trả về true nếu đã xoá.
 */
async function hopXoaTkb(ds, chonSan = []) {
  if (!ds.length) return false;
  const dot = new Map();
  for (const t of ds) {
    const k = `${t.nam_hoc || "chưa rõ năm học"}${t.hoc_ky ? " · học kỳ " + t.hoc_ky : ""}`;
    if (!dot.has(k)) dot.set(k, []);
    dot.get(k).push(t);
  }
  const idMoiNhat = ds[0].id;
  let chon = [];
  let xoaTep = true;
  const kq = await moHop({
    tieuDe: "Xoá thời khoá biểu", rong: "rong",
    noiDung: `
      <p class="nho mo" style="margin:0 0 .6rem">Tích <b>từng số</b>, tích <b>cả một đợt</b>, hoặc
        <b>chọn tất cả</b>. Lịch sử gửi vẫn giữ; tệp gốc đã nạp vẫn còn trong thư mục dữ liệu, cần thì nạp lại.</p>
      <label class="tich the-tich" style="margin-bottom:.6rem"><input type="checkbox" id="xt-het">
        <span><b>Chọn tất cả</b><span class="g">${so(ds.length)} thời khoá biểu</span></span></label>
      <div class="ds-dot-xoa">
      ${[...dot.entries()].map(([ten, dsT], i) => `
        <div class="dot-xoa">
          <label class="tich dot-dau"><input type="checkbox" data-dot="${i}">
            <span><b>Đợt ${esc(ten)}</b><span class="g">${so(dsT.length)} số — tích để chọn cả đợt</span></span></label>
          ${dsT.map((t) => `<label class="tich dot-muc"><input type="checkbox" name="xt" value="${t.id}" data-thuoc="${i}"
              ${chonSan.includes(t.id) ? "checked" : ""}>
            <span>Số <b>${t.so_tkb}</b> · từ ${esc(ngayVn(t.ngay_ap_dung)) || "?"}
              ${t.id === idMoiNhat ? '<span class="nhan n-ok">mới nhất</span>' : ""}
              <span class="g">${so(t.so_lop)} lớp · ${so(t.so_gv)} giáo viên${t.da_gui ? ` · đã gửi ${so(t.da_gui)} lượt` : ""}</span></span></label>`).join("")}
        </div>`).join("")}
      </div>
      <label class="tich" style="margin-top:.7rem"><input type="checkbox" id="xt-tep" checked>
        <span>Xoá luôn ảnh và tệp Word đã tạo của các bản này
          <span class="g">Tạo lại được bất cứ lúc nào bằng cách nạp lại tệp gốc.</span></span></label>`,
    nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Xoá", kieu: "xau", giaTri: "xoa" }],
    khiMo: (hop) => {
      const muc = () => $$('input[name="xt"]', hop);
      const nutXoa = hop.querySelector(".hop-chan .nut.xau");
      const capNhat = () => {
        const n = muc().filter((x) => x.checked).length;
        if (nutXoa) {
          nutXoa.disabled = !n;
          nutXoa.textContent = !n ? "Chưa chọn bản nào" : n === ds.length ? "Xoá toàn bộ" : `Xoá ${so(n)} thời khoá biểu`;
        }
        hop.querySelector("#xt-het").checked = n === muc().length;
        $$("[data-dot]", hop).forEach((d) => {
          const con = muc().filter((x) => x.dataset.thuoc === d.dataset.dot);
          d.checked = con.every((x) => x.checked);
          d.indeterminate = !d.checked && con.some((x) => x.checked);
        });
      };
      hop.addEventListener("change", (e) => {
        const x = e.target;
        if (x.id === "xt-het") muc().forEach((m) => { m.checked = x.checked; });
        else if (x.dataset.dot != null) {
          muc().filter((m) => m.dataset.thuoc === x.dataset.dot).forEach((m) => { m.checked = x.checked; });
        }
        capNhat();
      });
      capNhat();
      nutXoa?.addEventListener("click", () => {
        chon = muc().filter((x) => x.checked).map((x) => Number(x.value));
        xoaTep = hop.querySelector("#xt-tep").checked;
      }, true);
    },
  });
  if (kq !== "xoa" || !chon.length) return false;

  const tatCa = chon.length === ds.length;
  if (!(await hoi(tatCa ? "Xoá TOÀN BỘ thời khoá biểu?" : `Xoá ${so(chon.length)} thời khoá biểu?`,
    (tatCa ? "Phần mềm sẽ không còn thời khoá biểu nào — phải nạp lại mới gửi được. " : "")
      + "Không hoàn tác được. Lịch sử gửi vẫn giữ.",
    { nutOk: "Xoá", kieu: "xau" }))) return false;

  const r = await window.api.tkb.xoaNhieu(chon, { xoaTep });
  return baoKetQua(r, `Đã xoá ${so(r.so)} thời khoá biểu`
    + (r.so_thu_muc ? `, dọn ${so(r.so_thu_muc)} thư mục ảnh và Word.` : "."));
}

export async function ve(khung, thamSo = {}) {
  const gon = Boolean(thamSo.gon);
  const r = await window.api.tkb.ds();
  const ds = r.ds || [];
  // ds đã xếp mới nhất lên đầu. Mặc định luôn là BẢN MỚI NHẤT; bản đang xem mà bị xoá
  // hoặc chưa chọn gì thì quay về bản mới nhất, không để trỏ vào chỗ trống.
  if (thamSo?.tkbId) dangXem = thamSo.tkbId;
  if (ds.length && !ds.some((t) => t.id === dangXem)) dangXem = ds[0].id;
  const idMoiNhat = ds.length ? ds[0].id : null;

  if (!ds.length) {
    khung.innerHTML = `<div class="dau-trang"><div><h1>Thời khoá biểu</h1></div></div>
      <div class="the"><div class="trong"><span class="bd">▤</span>
        Chưa có thời khoá biểu nào.<br><span class="nho">Vào mục Nhập dữ liệu để đưa tệp từ phần mềm xếp thời khoá biểu vào.</span>
        <div class="hang-nut" style="justify-content:center;margin-top:.8rem"><button class="nut chinh" id="di-du-lieu">Nhập dữ liệu</button></div>
      </div></div>`;
    khung.querySelector("#di-du-lieu").onclick = () => di("du-lieu");
    return;
  }

  const ct = (await window.api.tkb.chiTiet(dangXem)).tkb;
  const thieuCn = ct.lop.filter((l) => !l.giao_vien_id);
  const coAnh = ct.gv.filter((g) => g.anh_path).length + ct.lop.filter((l) => l.anh_path).length;
  const coDocx = ct.gv.filter((g) => g.docx_path).length + ct.lop.filter((l) => l.docx_path).length;
  const tongMuc = ct.gv.filter((g) => g.so_tiet_dem > 0).length + ct.lop.length;

  khung.innerHTML = `
  <div class="${gon ? "khu-dau" : "dau-trang"}">
    <div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap">
      <${gon ? "h2" : "h1"} style="margin:0">Thời khoá biểu</${gon ? "h2" : "h1"}>
      <select id="chon-tkb" style="max-width:300px;width:auto">
        ${ds.map((t) => `<option value="${t.id}" ${t.id === dangXem ? "selected" : ""}>Số ${t.so_tkb} · ${esc(t.nam_hoc)}${t.hoc_ky ? ` · HK${t.hoc_ky}` : ""} · từ ${esc(ngayVn(t.ngay_ap_dung)) || "?"}${t.id === idMoiNhat ? " · mới nhất" : ""}</option>`).join("")}
      </select>
    </div>
    <div class="hang-nut">
      ${chipZalo()}
      <button class="nut nho" id="mo-thu-muc">Mở thư mục</button>
      <button class="nut nho xau" id="xoa-nhieu-tkb" title="Xoá thời khoá biểu: từng số, từng đợt hoặc toàn bộ">${ICON_XOA} Xoá…</button>
      <button class="nut nho" id="len-csdl" title="Đưa thời khoá biểu lên cơ sở dữ liệu ngành giáo dục">
        Lên CSDL ngành <span class="nhan n-xam">sắp có</span></button>
      <button class="nut chinh" id="di-gui">Gửi qua Zalo</button>
    </div>
  </div>

  ${dangXem !== idMoiNhat ? `<div class="bao canh" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
    <span><b>Đây không phải thời khoá biểu mới nhất.</b>
      <span class="sua">Bản mới nhất là số ${ds[0].so_tkb} (${esc(ds[0].nam_hoc)}), thực hiện từ ${esc(ngayVn(ds[0].ngay_ap_dung)) || "?"}.</span></span>
    <button class="nut nho chinh" id="ve-moi-nhat">Xem bản mới nhất</button>
  </div>` : ""}

  <div class="luoi c4" style="margin-bottom:.75rem">
    <div class="o-so vach"><b>Quy mô</b><span class="v">${so(ct.lop.length)}</span>
      <span class="g">lớp · ${so(ct.gv.filter((g) => g.so_tiet_dem > 0).length)} giáo viên có tiết</span></div>
    <div class="o-so vach"><b>Tổng tiết/tuần</b><span class="v">${so(ct.lop.reduce((s, l) => s + l.so_tiet, 0))}</span>
      <span class="g">thực hiện từ ${esc(ngayVn(ct.ngay_ap_dung)) || "?"}${ct.ngay_ket_thuc ? ` đến ${esc(ngayVn(ct.ngay_ket_thuc))}` : ""}</span></div>
    <div class="o-so ${thieuCn.length ? "vach-xau" : "vach-ok"}"><b>Giáo viên chủ nhiệm</b><span class="v">${so(ct.lop.length - thieuCn.length)}/${so(ct.lop.length)}</span>
      <span class="g">${thieuCn.length ? `thiếu ${thieuCn.length} lớp` : "đủ cả"}</span></div>
    <div class="o-so ${coAnh ? "vach-ok" : "vach-xau"}"><b>Tệp để gửi</b><span class="v">${so(coAnh)}</span>
      <span class="g">ảnh · ${so(coDocx)} tệp Word · cần ${so(tongMuc)}</span></div>
  </div>

  ${thieuCn.length ? `<div class="bao canh">
    <b>${thieuCn.length} lớp chưa có giáo viên chủ nhiệm: ${esc(thieuCn.map((l) => l.lop).join(", "))}.</b>
    <span class="sua">Cách sửa: nhập “Danh sách giáo viên chủ nhiệm” trong phần mềm xếp thời khoá biểu rồi xuất lại, hoặc chọn tay bên dưới.</span>
  </div>` : ""}

  <div class="tab">
    <button class="chon" data-tab="lop">Lớp (${ct.lop.length})</button>
    <button data-tab="gv">Giáo viên (${ct.gv.length})</button>
    <button data-tab="ban">Lịch sử bản (${ct.phien_ban_cu.length + 1})</button>
  </div>

  <div id="tab-lop">
    <div class="the">
      <div class="the-dau"><h2>Các lớp</h2>
        <span class="nho mo">Ảnh và file Word tự tạo, tự cập nhật khi số liệu đổi.</span></div>
      <div class="bang-cuon"><table class="b">
        <thead><tr><th>Lớp</th><th class="so">Tiết/tuần</th><th>Giáo viên chủ nhiệm</th><th>Nguồn</th><th>Tệp</th><th></th></tr></thead>
        <tbody>${ct.lop.map((l) => `<tr class="${l.giao_vien_id ? "" : "lech"}">
          <td><b>${esc(l.lop)}</b></td>
          <td class="so">${so(l.so_tiet)}</td>
          <td>${l.gvcn_ten ? esc(l.gvcn_ten) : '<span class="nhan n-xau">Chưa có</span>'}
            ${l.gvcn_ma_gv ? `<span class="mono nho mo"> ${esc(l.gvcn_ma_gv)}</span>` : ""}</td>
          <td class="nho mo">${{ pcgd: "Bảng phân công", tieu_de_tkb: "Tiêu đề TKB", nhap_tay: "Nhập tay" }[l.cn_nguon] || "—"}</td>
          <td class="nho">${l.anh_path ? '<span class="nhan n-ok">ảnh</span>' : '<span class="nhan n-xam">chưa có ảnh</span>'}
            ${l.docx_path ? ' <span class="nhan n-ok">Word</span>' : ' <span class="nhan n-xam">không Word</span>'}</td>
          <td><span class="hang-nut">
            <button class="nut nho" data-xem-lop="${esc(l.lop)}">Xem</button>
            <button class="nut nho" data-dt="lop:${esc(l.lop)}" title="Xem như trên điện thoại người nhận">Trên ĐT</button>
            <button class="nut nho" data-cn="${esc(l.lop)}">Chọn chủ nhiệm</button>
          </span></td></tr>`).join("")}</tbody></table></div>
    </div>
  </div>

  <div id="tab-gv" hidden>
    <div class="the">
      <div class="bang-cuon"><table class="b">
        <thead><tr><th>Giáo viên</th><th>Mã</th><th class="so">Tiết đếm</th><th class="so">PCGD khai</th><th>Chủ nhiệm</th><th>Zalo</th><th>Tệp</th><th></th></tr></thead>
        <tbody>${ct.gv.map((g) => {
          const lech = g.so_tiet_khai != null && g.so_tiet_khai !== g.so_tiet_dem;
          return `<tr class="${lech ? "lech" : g.so_tiet_dem ? "" : "mo"}">
          <td><b>${esc(g.ho_ten || g.ho_ten_pcgd)}</b>${g.giao_vien_id ? "" : ' <span class="nhan n-xau">chưa khớp</span>'}</td>
          <td class="mono">${coHoac(g.ma_trong_tkb)}</td>
          <td class="so">${so(g.so_tiet_dem)}</td>
          <td class="so">${g.so_tiet_khai == null ? "—" : so(g.so_tiet_khai)}</td>
          <td>${coHoac(g.lop_cn)}</td>
          <td>${g.zalo_uid ? (g.la_ban === 0 ? '<span class="nhan n-canh">chưa kết bạn</span>' : '<span class="nhan n-ok">sẵn sàng</span>') : '<span class="nhan n-xam">chưa có</span>'}</td>
          <td class="nho">${g.anh_path ? '<span class="nhan n-ok">ảnh</span>' : '<span class="nhan n-xam">—</span>'}
            ${g.docx_path ? ' <span class="nhan n-ok">Word</span>' : ""}</td>
          <td>${g.so_tiet_dem ? `<span class="hang-nut">
            <button class="nut nho" data-xem-gv="${esc(g.ma_trong_tkb || g.giao_vien_id)}">Xem</button>
            <button class="nut nho" data-dt="gv:${esc(g.ma_trong_tkb || "")}" title="Xem như trên điện thoại người nhận">Trên ĐT</button>
          </span>` : ""}</td>
        </tr>`; }).join("")}</tbody></table></div>
      <p class="nho mo" style="margin:.5rem 0 0">Dòng đỏ: số tiết đếm khác số tiết khai ở bảng phân công.</p>
    </div>
  </div>

  <div id="tab-ban" hidden>
    <div class="the">
      <h2>Lịch sử các bản</h2>
      <div class="bang-cuon"><table class="b">
        <thead><tr><th>Bản</th><th>Nhập lúc</th><th>Thay đổi</th></tr></thead>
        <tbody>
          <tr><td><b>Bản ${ct.phien_ban}</b> <span class="nhan n-ok">đang dùng</span></td>
            <td>${esc(gioVn(ct.nhap_luc))}</td><td class="nho mo">bản hiện hành</td></tr>
          ${ct.phien_ban_cu.map((p) => `<tr><td>Bản ${p.phien_ban}</td><td>${esc(gioVn(p.nhap_luc))}</td>
            <td class="nho">${esc(p.tom_tat)}</td></tr>`).join("")}
        </tbody></table></div>
    </div>
    <div class="the">
      <div class="the-dau"><h3 style="margin:0">Xoá thời khoá biểu</h3></div>
      <p class="nho mo">Xoá bản này, cả một đợt hoặc toàn bộ. Lịch sử gửi vẫn giữ.</p>
      <button class="nut xau" id="xoa-tkb">${ICON_XOA} Xoá thời khoá biểu số ${ct.so_tkb}…</button>
    </div>
  </div>`;

  khung.querySelector("#chon-tkb").addEventListener("change", (e) => { dangXem = Number(e.target.value); ve(khung, thamSo); });
  khung.querySelector(".tab").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    $$(".tab button", khung).forEach((x) => x.classList.toggle("chon", x === b));
    for (const t of ["lop", "gv", "ban"]) khung.querySelector("#tab-" + t).hidden = t !== b.dataset.tab;
  });

  ganKhung(khung, "click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "ve-moi-nhat") { dangXem = idMoiNhat; return ve(khung, { ...thamSo, tkbId: idMoiNhat }); }
    if (b.id === "di-gui") { await moGui(dangXem); return ve(khung, thamSo); }
    if (b.dataset.dt) {
      const [loai, ...r] = b.dataset.dt.split(":");
      return moXemMobile(dangXem, { loai, ma: r.join(":") });
    }
    if (b.id === "len-csdl") return moHopCsdlNganh();
    if (b.id === "mo-thu-muc") return window.api.app.moThuMuc(ct.thu_muc);

    if (b.dataset.xemLop || b.dataset.xemGv) {
      const laLop = Boolean(b.dataset.xemLop);
      const ma = b.dataset.xemLop || b.dataset.xemGv;
      const t = await window.api.tkb.luoi(dangXem, laLop ? { lop: ma } : { maGv: ma });
      const anh = await window.api.anh.xemTruoc(dangXem, { loai: laLop ? "lop" : "gv", ma }).catch(() => null);
      return moHop({
        tieuDe: (laLop ? "Lớp " : "Giáo viên ") + ma, rong: "rat-rong",
        noiDung: `<div class="tab"><button class="chon" data-x="luoi">Lưới thời khoá biểu</button><button data-x="anh">Ảnh sẽ gửi qua Zalo</button></div>
          <div id="x-luoi">${luoiTkb(t.ds, laLop ? "lop" : "gv")}</div>
          <div id="x-anh" hidden style="text-align:center">${anh?.anh
            ? `<img src="${anh.anh}" style="max-width:100%;border:1px solid var(--line);border-radius:var(--r)">
               <p class="nho mo">Ảnh thật gửi đi: ${anh.width} × ${anh.height} điểm ảnh.</p>`
            : '<div class="bao canh">Chưa tạo được ảnh xem trước.</div>'}</div>`,
        nut: [{ ten: "Đóng", kieu: "chinh", giaTri: true }],
        khiMo: (hop) => hop.querySelector(".tab").addEventListener("click", (ev) => {
          const x = ev.target.closest("[data-x]");
          if (!x) return;
          $$(".tab button", hop).forEach((y) => y.classList.toggle("chon", y === x));
          hop.querySelector("#x-luoi").hidden = x.dataset.x !== "luoi";
          hop.querySelector("#x-anh").hidden = x.dataset.x !== "anh";
        }),
      });
    }

    if (b.dataset.cn) {
      const lop = b.dataset.cn;
      const gvDs = (await window.api.gv.ds({})).ds.filter((g) => g.hoat_dong);
      const hienTai = ct.lop.find((l) => l.lop === lop);
      const chon = await moHop({
        tieuDe: `Giáo viên chủ nhiệm lớp ${lop}`,
        noiDung: `<div class="o-nhap"><label>Chọn giáo viên</label>
            <select id="cn-gv"><option value="">— không có chủ nhiệm —</option>
              ${gvDs.map((g) => `<option value="${g.id}" ${g.id === hienTai?.giao_vien_id ? "selected" : ""}>${esc(g.ho_ten)} (${esc(g.ma_gv)})</option>`).join("")}
            </select></div>
          <p class="nho mo">Bền hơn: nhập “Danh sách giáo viên chủ nhiệm” trong phần mềm xếp thời khoá biểu rồi xuất lại.</p>`,
        nut: [{ ten: "Huỷ", giaTri: null }, {
          ten: "Lưu", kieu: "chinh", giuMo: true,
          khiBam: async (hop, dong) => {
            const v = hop.querySelector("#cn-gv").value;
            const r2 = await window.api.tkb.datGvcn(dangXem, lop, v ? Number(v) : null);
            if (baoKetQua(r2, "Đã cập nhật chủ nhiệm.")) dong("luu");
          },
        }],
      });
      if (chon === "luu") ve(khung, thamSo);
      return;
    }

    if (b.id === "xoa-tkb" || b.id === "xoa-nhieu-tkb") {
      // Nút trong thẻ "Xoá thời khoá biểu" chọn sẵn bản đang xem; nút trên đầu trang để trống.
      if (await hopXoaTkb(ds, b.id === "xoa-tkb" ? [dangXem] : [])) {
        dangXem = null;
        await capNhatTienDo();
        ve(khung, thamSo);
      }
      return;
    }
  });

  // Ảnh + Word tự đảm bảo: thiếu hoặc đã cũ (đổi chủ nhiệm, sửa tên, cập nhật số…) thì tự tạo lại.
  // Vẽ lại MỘT lần sau khi tạo — lần vẽ lại đó không kiểm nữa, tránh vòng lặp khi có tệp lỗi.
  if (dangXem && !thamSo.__daDamBao) {
    const r = await damBaoTep(dangXem);
    if (r.tao) ve(khung, { ...thamSo, tkbId: dangXem, __daDamBao: true });
  }
}
