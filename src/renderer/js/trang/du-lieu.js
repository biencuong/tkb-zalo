/**
 * TRANG DỮ LIỆU — gom tất cả đầu vào vào MỘT trang:
 *   1. Nhập tệp  (kéo thả, tệp chờ xử lý, kho tệp)
 *   2. Giáo viên (danh sách, người nhận ngoài danh sách)
 *   3. Thời khoá biểu (chọn theo số, xem, tạo ảnh, gửi)
 * Ba khu cuộn liền nhau, có thanh nhảy nhanh ở trên.
 */
import {
  esc, so, ngayVn, gioVn, moHop, hoi, baoOk, baoXau, baoKetQua, hopCho, vungTha, htmlVungTha,
} from "../chung.js";
import { di, capNhatTienDo } from "../app.js";

let thuMucDangXem = "";
let boTha = [];

const CHU_MUC = { dat: "Đạt", thieu: "Thiếu", loi: "Lỗi" };

function veKiem(k) {
  if (!k) return "";
  return `<div class="the" style="margin-bottom:.5rem">
    <div class="the-dau"><h3 style="margin:0">${esc(k.ten_tep)}</h3>
      <span class="nhan ${k.so_loi ? "n-xau" : k.so_thieu ? "n-canh" : "n-ok"}">${esc(k.tom_tat)}</span></div>
    ${(k.kiem || []).map((x) => `<div class="bao ${x.muc === "loi" ? "xau" : x.muc === "thieu" ? "canh" : "ok"}">
      <b>${CHU_MUC[x.muc]}:</b> ${esc(x.noi_dung)}${x.cach_sua ? `<span class="sua">→ ${esc(x.cach_sua)}</span>` : ""}</div>`).join("")}
  </div>`;
}

const NHAN_CAN = {
  bat_buoc: '<span class="nhan n-xau">Bắt buộc</span>',
  nen_co: '<span class="nhan n-canh">Nên có</span>',
  tuy_chon: '<span class="nhan n-xam">Tuỳ chọn</span>',
  khong_can: '<span class="nhan n-xam">Không cần</span>',
};

/** Hộp BÁO CÁO sau khi nhận tệp: từng tệp thành gì, đặt tên gì, để ở đâu, còn thiếu gì. */
async function hopBaoCaoNhan(r) {
  const hang = (x) => {
    const nhan = x.dat
      ? (x.ghi_de ? '<span class="nhan n-canh">Thay tệp cũ</span>' : '<span class="nhan n-ok">Đã nhận</span>')
      : x.trung ? '<span class="nhan n-xam">Trùng, bỏ qua</span>'
      : '<span class="nhan n-xau">Không nhận</span>';
    const loi = (x.kiem || []).filter((k) => k.muc !== "dat");
    return `<tr class="${x.dat ? "" : x.trung ? "mo" : "lech"}">
      <td><b>${esc(x.ten_goc)}</b><br><span class="nho mo">${esc(x.chu_loai)}</span></td>
      <td>${nhan}</td>
      <td class="nho">${x.ten_moi ? `<span class="mono">${esc(x.ten_moi)}</span>` : "—"}
        ${x.noi ? `<br><span class="mo">${esc(x.noi)}</span>` : ""}</td>
      <td class="nho">${NHAN_CAN[x.can] || ""}<br>${esc(x.tac_dung || "")}</td>
      <td class="nho">${x.tom_tat ? esc(x.tom_tat) : ""}
        ${x.ly_do ? `<br><span class="mo">${esc(x.ly_do)}</span>` : ""}
        ${x.loi ? `<br><span style="color:var(--bad)">${esc(x.loi)}</span>` : ""}
        ${loi.length ? loi.slice(0, 3).map((k) => `<br><span class="mo">• ${esc(k.noi_dung)}${k.cach_sua ? " → " + esc(k.cach_sua) : ""}</span>`).join("") : ""}</td>
    </tr>`;
  };

  return moHop({
    tieuDe: "Kết quả nhận tệp", rong: "rat-rong",
    noiDung: `
      <div class="luoi c4" style="margin-bottom:.6rem">
        <div class="o-so ${r.so_nhan ? "vach-ok" : "vach-xau"}"><b>Đã nhận</b><span class="v">${so(r.so_nhan)}</span>
          <span class="g">${so(r.so_thay)} tệp thay bản cũ</span></div>
        <div class="o-so ${r.so_trung ? "vach" : "vach"}"><b>Trùng</b><span class="v">${so(r.so_trung)}</span>
          <span class="g">nội dung y hệt, không lưu thêm</span></div>
        <div class="o-so ${r.so_bo_qua ? "vach-xau" : "vach"}"><b>Không nhận</b><span class="v">${so(r.so_bo_qua)}</span>
          <span class="g">sai định dạng hoặc hỏng</span></div>
        <div class="o-so ${r.so_canh_bao ? "vach-xau" : "vach-ok"}"><b>Thiếu dữ liệu</b><span class="v">${so(r.so_canh_bao)}</span>
          <span class="g">nhận rồi nhưng chưa đủ để nhập</span></div>
      </div>
      ${r.thieu_bat_buoc?.length
        ? `<div class="bao xau"><b>Chưa nhập được.</b>
            <span class="sua">Còn thiếu: ${esc(r.thieu_bat_buoc.join("; "))}.</span></div>`
        : `<div class="bao ok"><b>Đủ tệp để gửi ảnh thời khoá biểu.</b>
            <span class="sua">Chỉ cần tệp Excel tổng là chạy được. Tệp Word chỉ thêm bản in, không bắt buộc.</span></div>`}
      ${r.thua?.length ? `<div class="bao canh"><b>${so(r.thua.length)} tệp thả vào không dùng được:</b>
          <span class="sua">${esc(r.thua.slice(0, 6).join(", "))}. Phần mềm chỉ cần
          <b>Excel tổng</b> (bắt buộc), <b>Excel danh sách giáo viên</b> (nên có) và
          <b>Word thời khoá biểu</b> (tuỳ chọn).</span></div>` : ""}
      ${r.bao_cao.some((x) => x.dat && x.loai === "ds_gv_xlsx") ? `<div class="bao tin">
        <b>Việc tiếp theo: nhập danh sách giáo viên trước.</b>
        <span class="sua">Có danh sách rồi thì thời khoá biểu mới khớp được vào từng người.</span></div>` : ""}
      ${r.thieu_ss ? `<div class="bao canh"><b>Có tệp Word nhưng thiếu tệp Excel tổng.</b>
        <span class="sua">Tên tệp Word đang ghi CHUA-RO vì chưa biết thuộc thời khoá biểu số mấy.
        Thả thêm tệp Excel tổng (SS….xlsx) là đủ bộ.</span></div>` : ""}
      <div class="bang-cuon cuon-doc"><table class="b">
        <thead><tr><th>Tệp thả vào</th><th>Kết quả</th><th>Lưu thành</th><th>Cần hay không</th><th>Chi tiết</th></tr></thead>
        <tbody>${r.bao_cao.map(hang).join("")}</tbody></table></div>
      <p class="nho mo" style="margin:.6rem 0 0">Tên chuẩn: <span class="mono">TKB-&lt;năm học&gt;-So-&lt;số&gt;-TONG/GV/LOP</span>,
        danh sách giáo viên là <span class="mono">DS-GV.xlsx</span>.</p>`,
    nut: [{ ten: "Mở thư mục", giaTri: "mo" }, { ten: "Đóng", kieu: "chinh", giaTri: null }],
  });
}

/** Hộp nhập một thời khoá biểu, rồi tạo ảnh luôn cho đỡ một bước. */
export async function hopNhapTkb({ xlsx, docxGv, docxLop, donSauKhiXong = [] }) {
  const cho = hopCho("Đang đọc tệp", "Đọc bảng phân công và thời khoá biểu…");
  let xt;
  try { xt = await window.api.tkb.xemTruoc(xlsx); }
  catch (e) { cho.dong(); await cho.doi; baoXau("<b>Không đọc được tệp.</b><br>" + esc(e?.message || e)); return false; }
  cho.dong(); await cho.doi;

  const tt = xt.thong_tin, trung = xt.trung;
  const soGvHienCo = (await window.api.gv.ds({}).catch(() => ({ ds: [] }))).ds?.length || 0;
  const noiDung = `
    <div class="luoi c3" style="margin-bottom:.7rem">
      <div class="o-so vach"><b>Số thời khoá biểu</b><span class="v">${tt.so_tkb ?? "?"}</span>
        <span class="g">${esc(tt.nam_hoc || "chưa rõ")}${tt.hoc_ky ? " · HK " + tt.hoc_ky : ""}</span></div>
      <div class="o-so vach"><b>Thực hiện từ</b><span class="v" style="font-size:1.05rem">${esc(ngayVn(tt.ngay_ap_dung)) || "?"}</span>
        <span class="g">${esc(tt.ten_truong || "chưa rõ tên trường")}</span></div>
      <div class="o-so vach"><b>Quy mô</b><span class="v">${so(xt.so_tiet)}</span>
        <span class="g">${so(xt.so_lop)} lớp · ${so(xt.so_gv_pcgd)} giáo viên</span></div>
    </div>
    ${trung ? `<div class="bao canh"><b>Đã có thời khoá biểu số ${tt.so_tkb} (bản ${trung.phien_ban}, nhập ${esc(gioVn(trung.nhap_luc))}).</b>
      <span class="sua">Cũ: ${so(trung.cu.so_tiet)} tiết, áp dụng ${esc(ngayVn(trung.cu.ngay_ap_dung)) || "?"}, đã gửi ${so(trung.da_gui)} lượt.
      Mới: ${so(trung.moi.so_tiet)} tiết, áp dụng ${esc(ngayVn(trung.moi.ngay_ap_dung)) || "?"}.</span></div>` : ""}
    ${(xt.canh_bao || []).map((c) => `<div class="bao canh">${esc(c)}</div>`).join("")}
    ${xt.chua_khop?.length
      ? `<div class="bao xau"><b>${xt.chua_khop.length} mục chưa khớp danh sách giáo viên:</b>
          <span class="sua">${esc(xt.chua_khop.slice(0, 10).map((x) => x.gia_tri).join(", "))}${xt.chua_khop.length > 10 ? "…" : ""}</span></div>`
      : '<div class="bao ok">Khớp đủ giáo viên với danh sách.</div>'}
    ${soGvHienCo === 0 ? `<div class="bao tin">
        <b>Chưa có danh sách giáo viên.</b>
        <span class="sua">Bảng phân công trong tệp này đã có đủ họ tên, phần mềm tạo giáo viên thẳng từ đó được —
        chỉ thiếu số điện thoại, điền sau ngay trên bảng. Nhờ vậy chỉ cần một tệp Excel tổng là chạy được.</span>
        <label class="tich" style="margin-top:.4rem"><input type="checkbox" id="tao-gv" checked>
          <span>Tạo <b>${so(tt.so_gv_pcgd || 0)} giáo viên</b> từ bảng phân công</span></label>
      </div>` : ""}
    ${!docxGv && !docxLop ? `<div class="bao tin">
      <b>Không có tệp Word — vẫn dùng được bình thường.</b>
      <span class="sua">Ảnh thời khoá biểu dựng từ chính tệp Excel này, không cần Word.
      Mỗi giáo viên sẽ nhận <b>một ảnh xem ngay</b>. Muốn họ tải về in nữa thì lần sau thả thêm tệp Word.</span>
    </div>` : ""}
    ${tt.so_tkb == null || !tt.ngay_ap_dung || !tt.nam_hoc ? `<hr class="tach">
      <div class="luoi c3">
        ${tt.so_tkb == null ? '<div class="o-nhap"><label>Số thời khoá biểu</label><input type="number" id="ghi-so" min="1" value="1"></div>' : ""}
        ${!tt.ngay_ap_dung ? '<div class="o-nhap"><label>Thực hiện từ ngày</label><input type="date" id="ghi-ngay"></div>' : ""}
        ${!tt.nam_hoc ? '<div class="o-nhap"><label>Năm học</label><input type="text" id="ghi-nam" placeholder="2025-2026"></div>' : ""}
      </div>` : ""}`;

  let ghiDe = {};
  let taoGv = false;
  const chon = await moHop({
    tieuDe: "Xem trước trước khi nhập", noiDung, rong: "rong",
    nut: [{ ten: "Huỷ", giaTri: null },
          { ten: trung ? "Cập nhật (giữ lưu vết bản cũ)" : "Nhập vào phần mềm", kieu: "chinh", giaTri: trung ? "cap_nhat" : "tao_moi" }],
    khiMo: (hop) => {
      hop.querySelector(".hop-chan .nut.chinh")?.addEventListener("click", () => {
        const g = (id) => hop.querySelector(id)?.value;
        ghiDe = {};
        if (g("#ghi-so")) ghiDe.so_tkb = Number(g("#ghi-so"));
        if (g("#ghi-ngay")) ghiDe.ngay_ap_dung = g("#ghi-ngay");
        if (g("#ghi-nam")) ghiDe.nam_hoc = g("#ghi-nam").trim();
        taoGv = Boolean(hop.querySelector("#tao-gv")?.checked);
      }, true);
    },
  });
  if (!chon) return false;

  const cho2 = hopCho("Đang nhập dữ liệu", "Đọc tiết học, khớp giáo viên, cắt tệp Word…");
  let r;
  try {
    r = await window.api.tkb.nhap({
      duongDanXlsx: xlsx, docxGv, docxLop,
      chePhu: chon === "cap_nhat" ? "cap_nhat" : undefined,
      ghiDeThongTin: Object.keys(ghiDe).length ? ghiDe : undefined,
      taoGvThieu: taoGv,
    });
  } finally { cho2.dong(); await cho2.doi; }
  if (!r.ok) { baoKetQua(r); return false; }
  if (donSauKhiXong.length) await window.api.tep.donHopThu(donSauKhiXong);

  const cho3 = hopCho("Đang tạo ảnh thời khoá biểu", "Chuẩn bị…");
  const boNghe = window.api.anh.onTienDo((x) => cho3.capNhat(`${x.da}/${x.tong} — ${esc(x.ten)}`));
  let ra;
  try { ra = await window.api.anh.chuanBi(r.tkb_id, {}); }
  finally { boNghe(); cho3.dong(); await cho3.doi; }

  const cat = r.cat_docx;
  await capNhatTienDo();
  const c = await moHop({
    tieuDe: "Đã nhập xong",
    noiDung: `<div class="bao ok"><b>${so(r.so_tiet)} tiết · ${so(r.so_lop)} lớp · ${so(r.so_gv)} giáo viên.</b>
        ${r.phien_ban > 1 ? `<span class="sua">Lưu thành bản ${r.phien_ban}, bản cũ đã được lưu vết.</span>` : ""}</div>
      ${cat ? `<div class="bao ${cat.khong_khop?.length ? "canh" : "ok"}">Cắt Word: ${so(cat.gv?.daCat || 0)} giáo viên, ${so(cat.lop?.daCat || 0)} lớp.
        ${(cat.khong_khop || []).slice(0, 3).map((x) => `<span class="sua">${esc(x)}</span>`).join("")}</div>` : ""}
      ${r.gv_tao_moi?.length ? `<div class="bao ok"><b>Đã tạo ${so(r.gv_tao_moi.length)} giáo viên từ bảng phân công.</b>
        <span class="sua">Còn thiếu số điện thoại — mở tab Giáo viên, bấm thẳng vào ô Điện thoại để điền,
        rời ô là tự lưu.</span></div>` : ""}
      ${r.gv_bo_qua?.length ? `<div class="bao canh"><b>${so(r.gv_bo_qua.length)} người chưa tạo được:</b>
        <span class="sua">${esc(r.gv_bo_qua.slice(0, 5).map((x) => x.ho_ten + " (" + x.ly_do + ")").join("; "))}</span></div>` : ""}
      <div class="bao ${ra?.ok ? "ok" : "canh"}">Tạo ảnh: ${so(ra?.tao_moi || 0)} ảnh.
        ${(ra?.loi || []).slice(0, 2).map((x) => `<span class="sua">${esc(x)}</span>`).join("")}</div>`,
    nut: [{ ten: "Đóng", giaTri: null }, { ten: "Mở thời khoá biểu", kieu: "chinh", giaTri: "tkb" }],
  });
  if (c === "tkb") di("du-lieu", { tkbId: r.tkb_id, neo: "khu-tkb" });
  return true;
}

/** Hộp nhập một dòng chữ. */
export function hopNhapChu(tieuDe, nhan, macDinh = "") {
  return new Promise((giai) => {
    moHop({
      tieuDe,
      noiDung: `<div class="o-nhap"><label>${esc(nhan)}</label><input type="text" id="np-chu" value="${esc(macDinh)}"></div>`,
      nut: [{ ten: "Huỷ", giaTri: null },
            { ten: "Xong", kieu: "chinh", giuMo: true, khiBam: (hop, dong) => dong(hop.querySelector("#np-chu").value.trim()) }],
      khiMo: (hop) => setTimeout(() => { const i = hop.querySelector("#np-chu"); i?.focus(); i?.select(); }, 30),
    }).then(giai);
  });
}

/** Trình quản lý thư mục gọn. */
async function veKho(khung, ti) {
  const r = await window.api.tm.liet(thuMucDangXem || ti.duong_dan?.goc_tai_lieu);
  if (!r.ok) { khung.innerHTML = `<div class="bao xau">${esc((r.loi || []).join(" "))}</div>`; return; }
  thuMucDangXem = r.thu_muc;
  const goc = ti.duong_dan?.goc_tai_lieu || "";
  const duong = r.thu_muc.startsWith(goc) ? "TKB Zalo" + r.thu_muc.slice(goc.length) : r.thu_muc;
  const co = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

  khung.innerHTML = `
    <div class="tm-thanh">
      ${r.cha ? `<button class="nut nho" data-len="${esc(r.cha)}">↑ Lên</button>` : ""}
      <span class="tm-duong" title="${esc(r.thu_muc)}">${esc(duong)}</span>
      <span style="flex:1"></span>
      <button class="nut nho" id="tm-tao">+ Thư mục</button>
      <button class="nut nho" id="tm-mo">Mở trong Windows</button>
    </div>
    <div class="tm-ds">
      ${r.muc.length ? r.muc.map((m) => `
        <div class="tm-dong ${m.la_thu_muc || m.dung_duoc ? "" : "la"}">
          <span class="bd">${m.la_thu_muc ? "📁" : m.dung_duoc ? "📄" : "·"}</span>
          <span class="ten ${m.la_thu_muc ? "co-the-bam" : ""}" ${m.la_thu_muc ? `data-vao="${esc(m.duong_dan)}"` : ""}>${esc(m.ten)}</span>
          <span class="phu">${m.la_thu_muc ? "" : co(m.kich_thuoc)}</span>
          <span class="phu">${esc(m.sua_luc)}</span>
          <span class="hang-nut">
            <button class="nut nho" data-ten="${esc(m.duong_dan)}">Đổi tên</button>
            <button class="nut nho xau" data-xoa="${esc(m.duong_dan)}">Xoá</button>
          </span>
        </div>`).join("") : '<div class="trong">Thư mục trống.</div>'}
    </div>`;

  khung.onclick = async (e) => {
    const b = e.target.closest("[data-vao],[data-len],[data-ten],[data-xoa],#tm-tao,#tm-mo");
    if (!b) return;
    if (b.dataset.vao) { thuMucDangXem = b.dataset.vao; return veKho(khung, ti); }
    if (b.dataset.len) { thuMucDangXem = b.dataset.len; return veKho(khung, ti); }
    if (b.id === "tm-mo") return window.api.app.moThuMuc(thuMucDangXem);
    if (b.id === "tm-tao") {
      const ten = await hopNhapChu("Tạo thư mục mới", "Tên thư mục");
      if (ten && baoKetQua(await window.api.tm.tao(thuMucDangXem, ten), "Đã tạo thư mục.")) veKho(khung, ti);
      return;
    }
    if (b.dataset.ten) {
      const cu = b.dataset.ten.split(/[\\/]/).pop();
      const ten = await hopNhapChu("Đổi tên", "Tên mới", cu);
      if (ten && ten !== cu && baoKetQua(await window.api.tm.doiTen(b.dataset.ten, ten), "Đã đổi tên.")) veKho(khung, ti);
      return;
    }
    if (b.dataset.xoa) {
      const ten = b.dataset.xoa.split(/[\\/]/).pop();
      if (!(await hoi("Xoá?", `Xoá <b>${esc(ten)}</b>? Chuyển vào Thùng rác của Windows.`, { nutOk: "Xoá", kieu: "xau" }))) return;
      if (baoKetQua(await window.api.tm.xoa(b.dataset.xoa), "Đã xoá.")) veKho(khung, ti);
      return;
    }
  };
}

/**
 * Ba bước lấy tệp ra khỏi phần mềm xếp thời khoá biểu. Chỉ hiện khi máy còn trắng —
 * có dữ liệu rồi thì người dùng đã biết đường, bày ra nữa là thừa.
 */
const veBaBuoc = () => `
  <div class="the" style="border-left:3px solid var(--accent)">
    <div class="the-dau"><h3 style="margin:0">Lấy tệp ra khỏi phần mềm xếp thời khoá biểu</h3>
      <button class="nut nho" id="mo-huong-dan-tep">Xem hướng dẫn đầy đủ</button></div>
    <div class="ba-buoc">
      <div><span class="bb-so">1</span>
        <b>Danh sách giáo viên</b>
        <span>Dữ liệu → Dữ liệu giáo viên → Danh sách giáo viên → bấm biểu tượng Excel →
          <b>Copy file dữ liệu mẫu</b>. Mở ra điền số điện thoại rồi lưu.</span></div>
      <div><span class="bb-so">2</span>
        <b>Excel tổng</b>
        <span>Hệ thống → <b>Chuyển đổi dữ liệu sang Excel</b>. Ra tệp <span class="mono">SS….xlsx</span>
          chứa phân công và toàn bộ tiết học.</span></div>
      <div><span class="bb-so">3</span>
        <b>Hai tệp Word</b>
        <span>Hệ thống → In ấn → Thời khoá biểu <b>theo lớp</b>, rồi <b>theo giáo viên</b>,
          xuất ra tệp Word để in.</span></div>
    </div>
    <p class="nho mo" style="margin:.6rem 0 0">Đủ ba loại rồi thì kéo thả tất cả vào vùng bên dưới
      <b>một lượt</b> — thả cùng lượt thì tệp Word mới biết nó thuộc thời khoá biểu số mấy.</p>
  </div>`;

/**
 * Thẻ tệp đang chờ. DANH SÁCH GIÁO VIÊN LUÔN ĐỨNG TRƯỚC: thời khoá biểu phải khớp được
 * với giáo viên mới nhập được, chưa có ai trong danh sách thì nhập thời khoá biểu là vô nghĩa.
 */
function veNhom(hop, coGv) {
  const n = hop.nhom || [];
  const g = hop.ds_gv || [];
  if (!n.length && !g.length) {
    return '<div class="the"><div class="trong" style="padding:1.1rem"><span class="bd">📭</span>Chưa có tệp nào chờ xử lý.</div></div>';
  }

  const theGv = g.map((x, i) => `
    <div class="the" style="border-left:3px solid var(--accent)">
      <div class="the-dau">
        <h3 style="margin:0"><span class="stt-buoc">1</span> Danh sách giáo viên — ${esc(x.ten_tep)}</h3>
        <span class="nhan ${x.so_loi ? "n-xau" : "n-ok"}">${esc(x.tom_tat)}</span></div>
      <p class="nho mo" style="margin:.1rem 0 .55rem">Nạp danh sách này trước, rồi mới nhập thời khoá biểu.</p>
      <div class="hang-nut"><button class="nut chinh" data-nhap-gv="${i}">Nhập danh sách</button></div>
    </div>`).join("");

  const theTkb = n.map((x, i) => `
    <div class="the${coGv ? "" : " mo"}">
      <div class="the-dau">
        <h3 style="margin:0"><span class="stt-buoc">2</span> Thời khoá biểu số ${x.so_tkb ?? "?"} · ${esc(x.nam_hoc || "?")}</h3>
        <span class="nhan ${x.san_sang ? "n-ok" : "n-xau"}">${x.san_sang ? "Sẵn sàng" : "Chưa dùng được"}</span>
      </div>
      <p class="nho mo" style="margin:.1rem 0 .55rem">
        Từ ${esc(ngayVn(x.ngay_ap_dung)) || "?"} · ${so(x.xlsx.thong_tin.so_lop)} lớp · ${so(x.xlsx.thong_tin.so_tiet)} tiết ·
        ${so(x.xlsx.thong_tin.so_gvcn)}/${so(x.xlsx.thong_tin.so_lop)} lớp có chủ nhiệm ·
        Word ${x.docx_gv ? "GV ✓" : "GV ✗"} ${x.docx_lop ? "lớp ✓" : "lớp ✗"}</p>
      ${coGv ? "" : '<div class="bao canh" style="margin:.2rem 0 .5rem"><b>Nạp danh sách giáo viên trước đã.</b> Chưa có ai trong danh sách thì không khớp được thời khoá biểu.</div>'}
      <div class="hang-nut">
        <button class="nut chinh" data-nhap-nhom="${i}"${x.san_sang && coGv ? "" : " disabled"}>Nhập vào phần mềm</button>
        <button class="nut nho" data-xem-kiem="${i}">Chi tiết kiểm tra</button>
      </div>
    </div>`).join("");

  return theGv + theTkb;
}

/** Khu 1 — nhập tệp. */
async function veKhuNhap(khung, ti) {
  const hop = await window.api.tep.quetHopThu();
  // Nạp theo đúng thứ tự: có giáo viên rồi mới nhập được thời khoá biểu.
  const soGv = (await window.api.gv.ds({}).catch(() => ({ ds: [] }))).ds?.length || 0;
  const soTkb = (await window.api.tkb.ds().catch(() => ({ ds: [] }))).ds?.length || 0;
  const kho = await window.api.tep.duyetKho(false);
  const canNap = (kho.muc || []).filter((m) => m.canh_bao);
  const dsGvKho = await window.api.tep.quetDsGv().catch(() => ({ ds: [], nen_nap: false }));

  // Đã có dữ liệu rồi thì vùng kéo thả chiếm chỗ vô ích — thu lại sau một nút nhỏ có nhãn rõ.
  const daCoDuLieu = soGv > 0 && soTkb > 0;

  // Máy còn trắng: chỉ đường lấy tệp trước, rồi mới tới vùng kéo thả.
  const conTrang = soGv === 0 && soTkb === 0;

  khung.innerHTML = `
  ${conTrang ? veBaBuoc() : ""}
  ${daCoDuLieu ? `<div class="thanh-them">
      <button class="nut nho chinh" id="mo-tha" aria-expanded="false">＋ Thêm tệp dữ liệu</button>
      <span class="nho mo">Có thời khoá biểu mới thì thả tệp vào đây.</span>
    </div>` : ""}
  <div id="boc-tha" ${daCoDuLieu ? "hidden" : ""}>
    ${htmlVungTha("tha-tkb", "Kéo tệp vào đây",
      "Tệp Excel tổng (SS….xlsx), tệp Word thời khoá biểu, hoặc danh sách giáo viên.")}
  </div>

  ${dsGvKho.nen_nap && dsGvKho.moi_nhat ? `<div class="bao ${dsGvKho.lan_dau ? "canh" : "canh"}"
      style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
    <span><b>${dsGvKho.lan_dau ? "Có sẵn danh sách giáo viên trong kho." : "Danh sách giáo viên trong kho đã thay đổi."}</b>
      <span class="sua">${esc(dsGvKho.moi_nhat.ten_tep)} — ${esc(dsGvKho.moi_nhat.tom_tat || "")}</span></span>
    <button class="nut nho chinh" id="nap-ds-kho">Nạp danh sách này</button>
  </div>` : ""}

  <div class="thu-tu-nap">
    <span class="${soGv ? "xong" : "dang"}">${soGv ? "✓" : "1"} Danh sách giáo viên${soGv ? ` (${so(soGv)} người)` : ""}</span>
    <span class="mui">→</span>
    <span class="${soGv ? "dang" : "khoa"}">2 Thời khoá biểu</span>
  </div>

  <div id="ds-nhom">${veNhom(hop, soGv > 0)}</div>

  ${canNap.length ? `<div class="bao canh">
    ${canNap.slice(0, 3).map((m) => `<div>${esc(m.canh_bao)}</div>`).join("")}
    <div class="hang-nut" style="margin-top:.4rem">${canNap.slice(0, 4)
      .map((m, i) => `<button class="nut nho chinh" data-nap-kho="${i}">Nạp ${esc(m.nam_hoc)} · ${esc(m.ten_thu_muc)}</button>`).join("")}</div>
  </div>` : ""}

  <details class="the" id="khu-kho" style="padding:.7rem .95rem">
    <summary style="cursor:pointer;font-family:'Barlow Semi Condensed',sans-serif;font-weight:600;font-size:1rem">
      Kho tệp — xem, tạo, đổi tên, xoá thư mục</summary>
    <p class="nho mo" style="margin:.5rem 0">Mở mục này rồi kéo tệp vào vùng trên thì tệp vào <b>thư mục đang mở</b>.</p>
    <div id="tm-khung"></div>
  </details>`;

  boTha.forEach((f) => f());
  boTha = [vungTha(khung.querySelector("#tha-tkb"), async (ds) => {
    // Mở trình quản lý kho và đang đứng ở một thư mục cụ thể thì tôn ý người dùng, chép thẳng vào đó.
    const mo = khung.querySelector("#khu-kho")?.open;
    if (mo && thuMucDangXem && thuMucDangXem !== ti.duong_dan?.cho_xu_ly) {
      const t = await window.api.tm.thaTep(ds, thuMucDangXem);
      if (!t.ok) return baoKetQua(t);
      baoOk(`Đã chép ${t.nhan.length} tệp vào thư mục đang mở.`);
      return veKhuNhap(khung, ti);
    }
    const cho = hopCho("Đang đọc và phân loại tệp", "Xem từng tệp là loại gì…");
    let r;
    try { r = await window.api.tm.nhanTep(ds); } finally { cho.dong(); await cho.doi; }
    if (!r.ok) return baoKetQua(r);
    await veKhuNhap(khung, ti);
    const c = await hopBaoCaoNhan(r);
    if (c === "mo") window.api.app.moThuMuc(r.thu_muc_cho);
  })];

  await veKho(khung.querySelector("#tm-khung"), ti);

  khung.onclick = async (e) => {
    const b = e.target.closest("button");
    if (!b || b.closest("#tm-khung")) return;

    if (b.id === "mo-huong-dan-tep") {
      const { di: diTrang } = await import("../app.js");
      return diTrang("cai-dat", { tab: "tro-giup", muc: "chuan-bi" });
    }
    if (b.id === "mo-tha") {
      const boc = khung.querySelector("#boc-tha");
      const mo = boc.hidden;
      boc.hidden = !mo;
      b.setAttribute("aria-expanded", String(mo));
      b.textContent = mo ? "× Đóng vùng thả tệp" : "＋ Thêm tệp dữ liệu";
      if (mo) boc.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (b.dataset.chonTep) {
      const r = await window.api.tep.chon({ loc: "ca-hai", nhieu: true, tieu_de: "Chọn tệp" });
      if (!r.ok) return;
      const cho = hopCho("Đang đọc và phân loại tệp", "Xem từng tệp là loại gì…");
      let t;
      try { t = await window.api.tm.nhanTep(r.duong_dan); } finally { cho.dong(); await cho.doi; }
      if (!t.ok) return baoKetQua(t);
      await veKhuNhap(khung, ti);
      const c = await hopBaoCaoNhan(t);
      if (c === "mo") window.api.app.moThuMuc(t.thu_muc_cho);
      return;
    }
    if (b.id === "nap-ds-kho") return napDsGv(dsGvKho.moi_nhat.duong_dan, false, () => veKhuNhap(khung, ti));
    if (b.dataset.xemKiem != null) {
      const n = hop.nhom[Number(b.dataset.xemKiem)];
      return moHop({ tieuDe: "Chi tiết kiểm tra", rong: "rong",
        noiDung: veKiem(n.xlsx) + veKiem(n.docx_gv) + veKiem(n.docx_lop),
        nut: [{ ten: "Đóng", kieu: "chinh", giaTri: true }] });
    }
    if (b.dataset.nhapNhom != null) {
      if (!soGv) return baoXau("<b>Chưa có danh sách giáo viên.</b><br>Nạp danh sách giáo viên trước rồi mới nhập thời khoá biểu.");
      const n = hop.nhom[Number(b.dataset.nhapNhom)];
      if (await hopNhapTkb({
        xlsx: n.xlsx.duong_dan, docxGv: n.docx_gv?.duong_dan, docxLop: n.docx_lop?.duong_dan,
        donSauKhiXong: [n.xlsx.duong_dan, n.docx_gv?.duong_dan, n.docx_lop?.duong_dan].filter(Boolean),
      })) veTatCa();
      return;
    }
    if (b.dataset.nhapGv != null) {
      const g = hop.ds_gv[Number(b.dataset.nhapGv)];
      return napDsGv(g.duong_dan, true, () => veTatCa());
    }
    if (b.dataset.napKho != null) {
      if (!soGv) return baoXau("<b>Chưa có danh sách giáo viên.</b><br>Nạp danh sách giáo viên trước rồi mới nhập thời khoá biểu.");
      const m = canNap[Number(b.dataset.napKho)];
      const s = await window.api.tep.soiThuMuc(m.thu_muc);
      if (!s.tim_thay?.xlsx) return baoXau("<b>Thư mục thiếu tệp Excel tổng.</b>");
      if (await hopNhapTkb({ xlsx: s.tim_thay.xlsx, docxGv: s.tim_thay.docx_gv, docxLop: s.tim_thay.docx_lop })) veTatCa();
      return;
    }
  };
}

/** Nạp một tệp danh sách giáo viên. donHopThu = tệp nằm ở hộp thư chờ thì dọn đi sau khi nạp. */
async function napDsGv(duongDan, donHopThu, khiXong) {
  const cho = hopCho("Đang nhập danh sách giáo viên");
  let r;
  try { r = await window.api.gv.nhapExcel(duongDan); } finally { cho.dong(); await cho.doi; }
  if (!baoKetQua(r, `Đã thêm ${r.them}, cập nhật ${r.capNhat} giáo viên.`)) return false;
  if (donHopThu) await window.api.tep.donHopThu([duongDan]);
  await capNhatTienDo();
  khiXong?.();
  return true;
}

// Hàm vẽ lại khu đang xem, để các khu gọi được lẫn nhau.
let veTatCa = () => {};

/** Tab đang mở, nhớ giữa các lần vào trang. */
let tabDangXem = "nhap";

const TAB = [
  { ma: "nhap", ten: "Nhập tệp", khu: "khu-nhap" },
  { ma: "gv", ten: "Giáo viên", khu: "khu-gv" },
  { ma: "tkb", ten: "Thời khoá biểu", khu: "khu-tkb" },
];

export async function ve(khung, thamSo = {}) {
  const ti = await window.api.app.thongTin();
  if (thamSo?.tab && TAB.some((t) => t.ma === thamSo.tab)) tabDangXem = thamSo.tab;
  else if (thamSo?.neo) tabDangXem = (TAB.find((t) => t.khu === thamSo.neo) || TAB[0]).ma;
  else if (thamSo?.tkbId) tabDangXem = "tkb";

  khung.innerHTML = `
  <div class="dau-trang">
    <div><h1>Dữ liệu</h1>
      <p class="mo-ta">Kéo tệp vào là xong. Danh sách giáo viên và thời khoá biểu đều nằm ở trang này.</p></div>
    <div class="hang-nut">
      <button class="nut nho" id="mo-kho-win">Mở thư mục</button>
    </div>
  </div>

  <div class="tab tab-lon" id="tab-du-lieu">
    ${TAB.map((t) => `<button class="${t.ma === tabDangXem ? "chon" : ""}" data-tab-dl="${t.ma}">${esc(t.ten)}</button>`).join("")}
  </div>

  ${TAB.map((t) => `<section id="${t.khu}" class="khu" ${t.ma === tabDangXem ? "" : "hidden"}></section>`).join("")}`;

  const oKhu = (ma) => khung.querySelector("#" + TAB.find((t) => t.ma === ma).khu);
  const daVe = new Set();
  const don = {};

  // Chỉ vẽ khu đang mở — vào trang nhanh, không dựng thừa.
  const veKhu = async (ma, batBuoc = false) => {
    const el = oKhu(ma);
    if (!el) return;
    if (daVe.has(ma) && !batBuoc) return;
    daVe.add(ma);
    if (ma === "nhap") return veKhuNhap(el, ti);
    const mod = await import(ma === "gv" ? "./giao-vien.js" : "./tkb.js");
    don[ma]?.();
    const d = await mod.ve(el, { gon: true, ...(ma === "tkb" ? { tkbId: thamSo?.tkbId } : {}) });
    if (typeof d === "function") don[ma] = d;
  };

  veTatCa = async () => {
    daVe.clear();
    await veKhu(tabDangXem, true);
    await capNhatTienDo();
  };

  await veKhu(tabDangXem);

  khung.querySelector("#mo-kho-win").onclick = () => window.api.app.moThuMuc(ti.duong_dan?.goc_tai_lieu);

  khung.querySelector("#tab-du-lieu").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-tab-dl]");
    if (!b || b.dataset.tabDl === tabDangXem) return;
    tabDangXem = b.dataset.tabDl;
    for (const t of TAB) {
      khung.querySelector("#tab-du-lieu [data-tab-dl='" + t.ma + "']").classList.toggle("chon", t.ma === tabDangXem);
      oKhu(t.ma).hidden = t.ma !== tabDangXem;
    }
    await veKhu(tabDangXem);
    document.getElementById("chinh").scrollTop = 0;
  });

  return () => {
    boTha.forEach((f) => f());
    for (const f of Object.values(don)) { try { f(); } catch { /* */ } }
  };
}
