/** Thời khoá biểu: danh sách theo số và ngày, chi tiết từng lớp/giáo viên, chọn chủ nhiệm, tạo ảnh. */
import { esc, so, ngayVn, gioVn, moHop, hoi, baoOk, baoXau, baoKetQua, hopCho, luoiTkb, bang, $$, coHoac } from "../chung.js";
import { di } from "../app.js";
import { chipZalo } from "../zalo-nhanh.js";
import { moGui } from "../gui-modal.js";
import { moXemMobile } from "../xem-mobile.js";

let dangXem = null;

export async function ve(khung, thamSo = {}) {
  const gon = Boolean(thamSo.gon);
  const r = await window.api.tkb.ds();
  const ds = r.ds || [];
  if (thamSo?.tkbId) dangXem = thamSo.tkbId;
  if (!dangXem && ds.length) dangXem = ds[0].id;

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
        ${ds.map((t) => `<option value="${t.id}" ${t.id === dangXem ? "selected" : ""}>Số ${t.so_tkb} · ${esc(t.nam_hoc)}${t.hoc_ky ? ` · HK${t.hoc_ky}` : ""} · từ ${esc(ngayVn(t.ngay_ap_dung)) || "?"}</option>`).join("")}
      </select>
    </div>
    <div class="hang-nut">
      ${chipZalo()}
      <button class="nut nho" id="tao-anh">Tạo ảnh</button>
      <button class="nut nho" id="mo-thu-muc">Mở thư mục</button>
      <button class="nut chinh" id="di-gui">Gửi qua Zalo</button>
    </div>
  </div>

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
  ${coAnh < tongMuc ? `<div class="bao canh" style="display:flex;justify-content:space-between;align-items:center;gap:1rem">
    <span><b>Mới có ${coAnh}/${tongMuc} ảnh.</b> Thiếu ảnh thì không gửi được.</span>
    <button class="nut nho chinh" id="tao-anh">Tạo ảnh ngay</button></div>` : ""}

  <div class="tab">
    <button class="chon" data-tab="lop">Lớp (${ct.lop.length})</button>
    <button data-tab="gv">Giáo viên (${ct.gv.length})</button>
    <button data-tab="ban">Lịch sử bản (${ct.phien_ban_cu.length + 1})</button>
  </div>

  <div id="tab-lop">
    <div class="the">
      <div class="the-dau"><h2>Các lớp</h2>
        <span class="hang-nut">
          <button class="nut nho" id="tao-anh-2">Tạo lại toàn bộ ảnh</button>
        </span></div>
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
      <div class="the-dau"><h3 style="margin:0">Xoá thời khoá biểu này</h3></div>
      <p class="nho mo">Lịch sử gửi vẫn giữ.</p>
      <button class="nut xau" id="xoa-tkb">Xoá thời khoá biểu số ${ct.so_tkb}</button>
    </div>
  </div>`;

  khung.querySelector("#chon-tkb").addEventListener("change", (e) => { dangXem = Number(e.target.value); ve(khung, thamSo); });
  khung.querySelector(".tab").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    $$(".tab button", khung).forEach((x) => x.classList.toggle("chon", x === b));
    for (const t of ["lop", "gv", "ban"]) khung.querySelector("#tab-" + t).hidden = t !== b.dataset.tab;
  });

  const taoAnh = async () => {
    const cho = hopCho("Đang tạo ảnh thời khoá biểu", "Chuẩn bị…");
    const boNghe = window.api.anh.onTienDo((t) => cho.capNhat(`${t.da}/${t.tong} — ${esc(t.ten)}`));
    let kq;
    try { kq = await window.api.anh.chuanBi(dangXem, { ve_lai: true }); }
    finally { boNghe(); cho.dong(); await cho.doi; }
    if (kq.ok) baoOk(`Đã tạo ${kq.tao_moi} ảnh.`);
    else baoXau("<b>Tạo ảnh có lỗi.</b><br>" + esc((kq.loi || []).slice(0, 3).join("<br>")));
    ve(khung, thamSo);
  };

  khung.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "di-gui") { await moGui(dangXem); return ve(khung, thamSo); }
    if (b.dataset.dt) {
      const [loai, ...r] = b.dataset.dt.split(":");
      return moXemMobile(dangXem, { loai, ma: r.join(":") });
    }
    if (b.id === "mo-thu-muc") return window.api.app.moThuMuc(ct.thu_muc);
    if (b.id === "tao-anh" || b.id === "tao-anh-2") return taoAnh();

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

    if (b.id === "xoa-tkb") {
      if (!(await hoi("Xoá thời khoá biểu?",
        `Xoá <b>số ${ct.so_tkb}</b> (${esc(ct.nam_hoc)}) cùng ${so(ct.lop.length)} lớp. Lịch sử gửi và tệp gốc vẫn giữ.`, { nutOk: "Xoá", kieu: "xau" }))) return;
      const r2 = await window.api.tkb.xoa(dangXem);
      if (baoKetQua(r2, "Đã xoá.")) { dangXem = null; ve(khung, thamSo); }
      return;
    }
  });
}
