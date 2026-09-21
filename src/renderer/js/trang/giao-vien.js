/** Danh sách giáo viên: xem đủ thông tin, thêm/sửa/xoá, dò Zalo, người nhận ngoài danh sách. */
import {
  esc, so, moHop, hoi, baoOk, baoXau, baoCanh, baoKetQua, hopCho, bang, $, $$, coHoac, vungTha, htmlVungTha,
  ganDsTich, ganKhung, ICON_XOA,} from "../chung.js";
import { canZalo } from "../zalo-nhanh.js";

let tab = "gv";

const nhanZalo = (g) => {
  if (!g.dien_thoai) return '<span class="nhan n-xam">Chưa có số</span>';
  if (!g.zalo_uid) return g.zalo_trang_thai === "khong_thay"
    ? '<span class="nhan n-xau">Không có Zalo</span>'
    : '<span class="nhan n-canh">Chưa dò</span>';
  if (g.la_ban === 0) return '<span class="nhan n-canh">Chưa kết bạn</span>';
  return '<span class="nhan n-ok">Sẵn sàng</span>';
};

async function hopSuaGv(gv = null) {
  const d = gv || {};
  const noiDung = `
    <div class="luoi c2">
      <div class="o-nhap"><label>Họ và tên đệm</label><input type="text" id="f-ho" value="${esc(d.ho_dem || "")}" placeholder="Nguyễn Thị Thu"></div>
      <div class="o-nhap"><label>Tên <span style="color:var(--bad)">*</span></label><input type="text" id="f-ten" value="${esc(d.ten || "")}" placeholder="Hà"></div>
      <div class="o-nhap"><label>Mã GV <span style="color:var(--bad)">*</span></label><input type="text" id="f-ma" value="${esc(d.ma_gv || "")}" placeholder="Thuy Ha">
        <div class="goi-y">Tên viết tắt mà phần mềm xếp thời khoá biểu dùng. Phải khớp đúng để nhận được thời khoá biểu.</div></div>
      <div class="o-nhap"><label>Mã GV dự phòng</label><input type="text" id="f-ma2" value="${esc(d.ma_gv_2 || "")}">
        <div class="goi-y">Dùng khi bản thời khoá biểu khác đặt mã khác.</div></div>
      <div class="o-nhap"><label>Điện thoại (Zalo)</label><input type="tel" id="f-sdt" value="${esc(d.dien_thoai || "")}" placeholder="0912345678">
        </div>
      <div class="o-nhap"><label>Email</label><input type="email" id="f-email" value="${esc(d.email || "")}"></div>
      <div class="o-nhap"><label>Tổ chuyên môn</label><input type="text" id="f-to" value="${esc(d.to_chuyen_mon || "")}" placeholder="Tổ Tự nhiên">
        <div class="goi-y">Dùng để lọc khi thống kê và khi chọn người gửi.</div></div>
      <div class="o-nhap"><label>Lớp chủ nhiệm mặc định</label><input type="text" id="f-cn" value="${esc(d.lop_cn_mac_dinh || "")}" placeholder="6A1"></div>
    </div>
    <div class="o-nhap"><label>Ghi chú</label><input type="text" id="f-ghi" value="${esc(d.ghi_chu || "")}"></div>
    <div class="o-nhap"><label>Zalo UID</label><input type="text" id="f-uid" value="${esc(d.zalo_uid || "")}" class="mono">
      </div>
    <label class="tich"><input type="checkbox" id="f-hd" ${d.hoat_dong === 0 ? "" : "checked"}><span>Đang công tác</span></label>`;

  const chon = await moHop({
    tieuDe: gv ? "Sửa giáo viên" : "Thêm giáo viên", noiDung, rong: "rong",
    nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Lưu", kieu: "chinh", giaTri: "luu" }],
    khiMo: (h) => h.querySelector("#f-ten")?.focus(),
  });
  if (chon !== "luu") return false;
  const g = (id) => document.querySelector(id)?.value || "";
  // hộp đã đóng → đọc từ biến tạm đã lưu trước khi đóng
  return null;
}

/** Bản sửa dùng hộp giữ mở để đọc được giá trị trước khi đóng. */
function moHopGv(gv = null) {
  const d = gv || {};
  return new Promise((giai) => {
    moHop({
      tieuDe: gv ? "Sửa giáo viên" : "Thêm giáo viên", rong: "rong",
      noiDung: `
      <div class="luoi c2">
        <div class="o-nhap"><label>Họ và tên đệm</label><input type="text" id="f-ho" value="${esc(d.ho_dem || "")}" placeholder="Nguyễn Thị Thu"></div>
        <div class="o-nhap"><label>Tên <span style="color:var(--bad)">*</span></label><input type="text" id="f-ten" value="${esc(d.ten || "")}" placeholder="Hà"></div>
        <div class="o-nhap"><label>Mã GV <span style="color:var(--bad)">*</span></label><input type="text" id="f-ma" value="${esc(d.ma_gv || "")}" placeholder="Thuy Ha">
          <div class="goi-y">Tên viết tắt trong thời khoá biểu, phải khớp đúng.</div></div>
        <div class="o-nhap"><label>Mã GV dự phòng</label><input type="text" id="f-ma2" value="${esc(d.ma_gv_2 || "")}"></div>
        <div class="o-nhap"><label>Điện thoại (Zalo)</label><input type="tel" id="f-sdt" value="${esc(d.dien_thoai || "")}" placeholder="0912345678"></div>
        <div class="o-nhap"><label>Email</label><input type="email" id="f-email" value="${esc(d.email || "")}"></div>
        <div class="o-nhap"><label>Tổ chuyên môn</label><input type="text" id="f-to" value="${esc(d.to_chuyen_mon || "")}" placeholder="Tổ Tự nhiên"></div>
        <div class="o-nhap"><label>Lớp chủ nhiệm mặc định</label><input type="text" id="f-cn" value="${esc(d.lop_cn_mac_dinh || "")}" placeholder="6A1"></div>
      </div>
      <div class="o-nhap"><label>Ghi chú</label><input type="text" id="f-ghi" value="${esc(d.ghi_chu || "")}"></div>
      <div class="o-nhap"><label>Zalo UID <span class="g">(để trống, app tự dò)</span></label><input type="text" id="f-uid" class="mono" value="${esc(d.zalo_uid || "")}"></div>
      <label class="tich"><input type="checkbox" id="f-hd" ${d.hoat_dong === 0 ? "" : "checked"}><span>Đang công tác</span></label>`,
      nut: [
        { ten: "Huỷ", giaTri: null },
        {
          ten: "Lưu", kieu: "chinh", giuMo: true,
          khiBam: async (hop, dong) => {
            const v = (id) => hop.querySelector(id)?.value?.trim() || "";
            const r = await window.api.gv.luu({
              id: d.id, ho_dem: v("#f-ho"), ten: v("#f-ten"), ma_gv: v("#f-ma"), ma_gv_2: v("#f-ma2"),
              dien_thoai: v("#f-sdt"), email: v("#f-email"), to_chuyen_mon: v("#f-to"),
              lop_cn_mac_dinh: v("#f-cn"), ghi_chu: v("#f-ghi"), zalo_uid: v("#f-uid"),
              hoat_dong: hop.querySelector("#f-hd")?.checked ? 1 : 0,
            });
            if (!r.ok) return baoKetQua(r);
            baoOk(d.id ? "Đã lưu." : "Đã thêm giáo viên.");
            dong("luu");
          },
        },
      ],
      khiMo: (h) => setTimeout(() => h.querySelector("#f-ten")?.focus(), 30),
    }).then((r) => giai(r === "luu"));
  });
}

/**
 * Mở hộp sửa MỘT người nhận / nhóm Zalo từ màn khác (hộp gửi gọi tới), tự nạp danh sách
 * giáo viên và lớp. Trả về true nếu đã lưu.
 */
export async function moSuaNguoiNhan(id) {
  const [rNn, rGv, rTkb] = await Promise.all([
    window.api.gv.nguoiNhan(), window.api.gv.ds({}), window.api.tkb.ds(),
  ]);
  const n = (rNn.ds || []).find((x) => x.id === Number(id));
  if (!n) return false;
  const dsLop = rTkb.ds?.length
    ? (await window.api.tkb.chiTiet(rTkb.ds[0].id)).tkb.lop.map((l) => l.lop)
    : [];
  return moHopNguoiNhan(n, (rGv.ds || []).filter((g) => g.hoat_dong), dsLop);
}

function moHopNguoiNhan(n, dsGv, dsLop) {
  const d = n || { dang_ky: [] };
  const dk = d.dang_ky || [];
  const coLoai = (l) => dk.some((x) => x.loai === l);
  const soLop = dk.filter((x) => x.loai === "lop").length;
  const soGv = dk.filter((x) => x.loai === "gv").length;
  // NHÓM ZALO gửi bằng mã nhóm, không có số điện thoại — đừng hỏi số, cũng đừng bắt buộc.
  const laNhom = Boolean(d.la_nhom);
  return new Promise((giai) => {
    moHop({
      tieuDe: laNhom ? "Nhóm Zalo nhận thời khoá biểu" : (n ? "Sửa người nhận" : "Thêm người nhận ngoài danh sách"),
      rong: "rat-rong",
      noiDung: `
      ${laNhom
        ? `<div class="bao tin"><b>Đây là nhóm Zalo.</b>
             <span class="sua">Gửi bằng mã nhóm, không cần số điện thoại và không cần kết bạn.
             Chỉ cần chọn nhóm nhận thời khoá biểu nào ở bên dưới.</span></div>`
        : '<p class="nho mo">Hiệu trưởng, tổ trưởng… muốn nhận nhưng không dạy tiết nào.</p>'}
      <div class="luoi c2">
        <div class="o-nhap"><label>${laNhom ? "Tên nhóm" : "Họ và tên"} <span style="color:var(--bad)">*</span></label>
          <input type="text" id="n-ten" value="${esc(d.ho_ten || "")}"></div>
        <div class="o-nhap"><label>${laNhom ? "Loại" : "Chức danh"}</label>
          <input type="text" id="n-cd" value="${esc(d.chuc_danh || "")}" placeholder="${laNhom ? "Nhóm Zalo" : "Hiệu trưởng"}"></div>
        ${laNhom
          ? `<div class="o-nhap"><label>Mã nhóm Zalo</label>
               <input type="text" class="mono" value="${esc(d.zalo_uid || "")}" readonly>
               <div class="goi-y">Lấy tự động khi chọn nhóm ở màn Kết nối Zalo.</div></div>`
          : `<div class="o-nhap"><label>Điện thoại (Zalo) <span style="color:var(--bad)">*</span></label>
               <input type="tel" id="n-sdt" value="${esc(d.dien_thoai || "")}"></div>`}
        <div class="o-nhap"><label>Ghi chú</label><input type="text" id="n-ghi" value="${esc(d.ghi_chu || "")}"></div>
      </div>
      <hr class="tach"><h3>Nhận thời khoá biểu nào</h3>
      <div class="luoi c2" style="gap:.5rem;margin-bottom:.5rem">
        <label class="tich the-tich"><input type="checkbox" id="dk-tat-lop" ${coLoai("tat_ca_lop") ? "checked" : ""}>
          <span>Tất cả các lớp<span class="g">mỗi lớp một tin</span></span></label>
        <label class="tich the-tich"><input type="checkbox" id="dk-tat-gv" ${coLoai("tat_ca_gv") ? "checked" : ""}>
          <span>Tất cả giáo viên<span class="g">rất nhiều tin</span></span></label>
      </div>

      <p class="nho mo" style="margin:0 0 .4rem">Hoặc chọn từng mục bên dưới. Hai cột để cuộn ít, dễ tìm.</p>
      <div class="luoi c2">
        <div class="o-loc">
          <div class="o-loc-dau"><label>Từng lớp</label>
            <span class="o-loc-dem ${soLop ? "co" : ""}" data-dem="dk-lop">${soLop ? soLop + " đã chọn" : "chưa chọn"}</span></div>
          <input type="search" class="o-loc-tim" data-tim="dk-lop" placeholder="Tìm lớp…">
          <div class="ds-tich" data-ds="dk-lop" style="max-height:300px">${dsLop.map((l) =>
            `<label class="tich"><input type="checkbox" name="dk-lop" value="${esc(l)}" ${dk.some((x) => x.loai === "lop" && x.lop === l) ? "checked" : ""}><span>${esc(l)}</span></label>`).join("") || '<span class="mo nho">Chưa có lớp nào</span>'}</div>
          <div class="o-loc-nut">
            <button type="button" class="lien" data-chon-het="dk-lop">Chọn hết</button>
            <button type="button" class="lien" data-bo-het="dk-lop">Bỏ hết</button>
          </div>
        </div>

        <div class="o-loc">
          <div class="o-loc-dau"><label>Từng giáo viên</label>
            <span class="o-loc-dem ${soGv ? "co" : ""}" data-dem="dk-gv">${soGv ? soGv + " đã chọn" : "chưa chọn"}</span></div>
          <input type="search" class="o-loc-tim" data-tim="dk-gv" placeholder="Tìm tên hoặc mã giáo viên…">
          <div class="ds-tich" data-ds="dk-gv" style="max-height:300px">${dsGv.map((g) =>
            `<label class="tich"><input type="checkbox" name="dk-gv" value="${g.id}" ${dk.some((x) => x.loai === "gv" && x.giao_vien_id === g.id) ? "checked" : ""}><span>${esc(g.ho_ten)} <span class="g">${esc(g.ma_gv)}</span></span></label>`).join("")}</div>
          <div class="o-loc-nut">
            <button type="button" class="lien" data-chon-het="dk-gv">Chọn hết</button>
            <button type="button" class="lien" data-bo-het="dk-gv">Bỏ hết</button>
          </div>
        </div>
      </div>`,
      khiMo: (hop) => { ganDsTich(hop); },
      nut: [
        { ten: "Huỷ", giaTri: null },
        {
          ten: "Lưu", kieu: "chinh", giuMo: true,
          khiBam: async (hop, dong) => {
            const v = (id) => hop.querySelector(id)?.value?.trim() || "";
            const dangKy = [];
            if (hop.querySelector("#dk-tat-lop").checked) dangKy.push({ loai: "tat_ca_lop" });
            if (hop.querySelector("#dk-tat-gv").checked) dangKy.push({ loai: "tat_ca_gv" });
            $$('input[name="dk-lop"]:checked', hop).forEach((x) => dangKy.push({ loai: "lop", lop: x.value }));
            $$('input[name="dk-gv"]:checked', hop).forEach((x) => dangKy.push({ loai: "gv", giao_vien_id: Number(x.value) }));
            if (!dangKy.length) {
              return baoXau("<b>Chưa chọn nhận thời khoá biểu nào.</b><br>Không chọn thì người này sẽ không nhận được gì.");
            }
            const r = await window.api.gv.luuNguoiNhan({
              id: d.id, ho_ten: v("#n-ten"), chuc_danh: v("#n-cd"), dien_thoai: v("#n-sdt"),
              ghi_chu: v("#n-ghi"), dang_ky: dangKy, la_nhom: laNhom ? 1 : 0,
            });
            if (!r.ok) return baoKetQua(r);
            baoOk("Đã lưu người nhận.");
            dong("luu");
          },
        },
      ],
    }).then((r) => giai(r === "luu"));
  });
}

let boThaGv = [];

/** Kiểm tệp rồi nhập danh sách giáo viên. Dùng cho cả kéo thả lẫn nút chọn tệp. */
async function napTuTep(duongDan, khiXong) {
  if (!duongDan) return false;
  const k = await window.api.tep.kiemTra(duongDan);
  const dong = await moHop({
    tieuDe: "Kiểm tra tệp danh sách giáo viên", rong: "rong",
    noiDung: `<div class="bao ${k.so_loi ? "xau" : k.so_thieu ? "canh" : "ok"}"><b>${esc(k.ten_tep)} — ${esc(k.tom_tat)}</b></div>` +
      (k.kiem || []).map((x) => `<div class="bao ${x.muc === "loi" ? "xau" : x.muc === "thieu" ? "canh" : "ok"}">
        ${esc(x.noi_dung)}${x.cach_sua ? `<span class="sua">→ ${esc(x.cach_sua)}</span>` : ""}</div>`).join(""),
    nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Nhập vào phần mềm", kieu: "chinh", giaTri: "nhap", tat: !k.dung_duoc }],
  });
  if (dong !== "nhap") return false;
  const cho = hopCho("Đang nhập danh sách giáo viên");
  let kq;
  try { kq = await window.api.gv.nhapExcel(duongDan); } finally { cho.dong(); await cho.doi; }
  if (!baoKetQua(kq, `Đã thêm ${kq.them}, cập nhật ${kq.capNhat} giáo viên.`)) return false;
  khiXong?.();
  return true;
}

export async function ve(khung, tuyChon = {}) {
  const gon = Boolean(tuyChon.gon);
  const [rGv, rNn, rTkb] = await Promise.all([
    window.api.gv.ds({}), window.api.gv.nguoiNhan(), window.api.tkb.ds(),
  ]);
  const ds = rGv.ds || [];
  const nn = rNn.ds || [];
  const dsLop = rTkb.ds?.length
    ? (await window.api.tkb.chiTiet(rTkb.ds[0].id)).tkb.lop.map((l) => l.lop)
    : [];

  const coSdt = ds.filter((g) => g.dien_thoai).length;
  const coUid = ds.filter((g) => g.zalo_uid).length;
  const chuaBan = ds.filter((g) => g.zalo_uid && g.la_ban === 0).length;

  khung.innerHTML = `
  <div class="${gon ? "khu-dau" : "dau-trang"}">
    <div><${gon ? "h2" : "h1"} style="margin:0">Giáo viên</${gon ? "h2" : "h1"}>
      ${gon ? "" : '<p class="mo-ta">Mã GV phải khớp với phần mềm xếp thời khoá biểu.</p>'}</div>
    <div class="hang-nut">
      <button class="nut nho" id="nhap-excel">Nhập Excel</button>
      <button class="nut nho" id="do-uid">Dò Zalo</button>
      <button class="nut nho chinh" id="them">Thêm</button>
      <button class="nut nho xau nut-icon" id="xoa-het-gv" title="Xoá toàn bộ danh sách giáo viên"
        aria-label="Xoá toàn bộ giáo viên"${ds.length ? "" : " disabled"}>${ICON_XOA}</button>
    </div>
  </div>

  ${ds.length ? "" : htmlVungTha("tha-gv", "Kéo tệp danh sách giáo viên vào đây",
    "Tệp Excel có cột Họ đệm, Tên, Mã GV, Điện thoại di động.")}

  <div class="luoi c4" style="margin-bottom:.75rem">
    <div class="o-so vach"><b>Tổng</b><span class="v">${so(ds.length)}</span><span class="g">đang công tác: ${so(ds.filter((g) => g.hoat_dong).length)}</span></div>
    <div class="o-so ${coSdt < ds.length ? "vach-xau" : "vach-ok"}"><b>Có số điện thoại</b><span class="v">${so(coSdt)}</span><span class="g">thiếu ${so(ds.length - coSdt)}</span></div>
    <div class="o-so ${coUid < coSdt ? "vach-xau" : "vach-ok"}"><b>Dò được Zalo</b><span class="v">${so(coUid)}</span><span class="g">chưa dò/không có: ${so(coSdt - coUid)}</span></div>
    <div class="o-so ${chuaBan ? "vach-xau" : "vach-ok"}"><b>Chưa kết bạn</b><span class="v">${so(chuaBan)}</span><span class="g">có thể không nhận được tin</span></div>
  </div>

  ${chuaBan ? `<div class="bao canh"><b>${chuaBan} người chưa kết bạn Zalo</b> — có thể không nhận được tin. Bấm “Mời kết bạn” ở từng dòng.</div>` : ""}

  <div class="tab">
    <button class="${tab === "gv" ? "chon" : ""}" data-tab="gv">Giáo viên (${ds.length})</button>
    <button class="${tab === "nn" ? "chon" : ""}" data-tab="nn">Người nhận ngoài danh sách (${nn.length})</button>
  </div>

  <div id="tab-gv" ${tab === "gv" ? "" : "hidden"}>
    <div class="the">
      <div class="the-dau">
        <input type="search" id="tim" placeholder="Tìm theo tên, mã, số điện thoại, tổ…" style="max-width:340px">
        <span class="nho mo" id="dem-tim"></span>
      </div>
      <div id="bang-gv"></div>
    </div>
  </div>

  <div id="tab-nn" ${tab === "nn" ? "" : "hidden"}>
    <div class="the">
      <div class="the-dau"><h2>Người nhận ngoài danh sách</h2>
        <span class="hang-nut">
          <button class="nut nho" id="do-nhom">Dò nhóm Zalo</button>
          <button class="nut nho" id="them-nhom-zalo">Thêm nhóm Zalo</button>
          <button class="nut chinh nho" id="them-nn">Thêm người nhận</button>
        </span></div>
      <p class="nho mo" style="margin:.1rem 0 .5rem">Nhóm Zalo gửi bằng <b>mã nhóm</b>, không cần số điện thoại
        và không cần kết bạn. Bấm <b>Dò nhóm Zalo</b> để lấy lại mã nhóm, tên và số thành viên.</p>
      ${nn.length ? `<div class="bang-cuon"><table class="b">
        <thead><tr><th>Họ tên</th><th>Chức danh</th><th>Điện thoại</th><th>Zalo</th><th>Nhận thời khoá biểu</th><th></th></tr></thead>
        <tbody>${nn.map((n) => `<tr>
          <td><b>${esc(n.ho_ten)}</b>${n.la_nhom ? ' <span class="nhan n-ok">nhóm</span>' : ""}
            ${n.la_nhom && !n.dang_ky.length ? '<br><span class="nhan n-xau">chưa đặt nhận gì</span>' : ""}</td>
          <td>${coHoac(n.chuc_danh)}</td>
          <td class="mono">${n.la_nhom ? `<span class="nho mo">mã nhóm ${esc(String(n.zalo_uid).slice(0, 8))}…</span>` : coHoac(n.dien_thoai)}</td>
          <td>${nhanZalo(n)}</td>
          <td class="nho">${n.dang_ky.length ? esc(n.dang_ky.map((d) =>
            d.loai === "tat_ca_lop" ? "tất cả lớp" : d.loai === "tat_ca_gv" ? "tất cả giáo viên"
            : d.loai === "lop" ? "lớp " + d.lop : "GV " + (d.gv_ten || d.gv_ma || "")).join(", ")) : '<span class="mo">chưa đăng ký</span>'}</td>
          <td><span class="hang-nut">
            <button class="nut nho" data-sua-nn="${n.id}">Sửa</button>
            <button class="nut nho xau" data-xoa-nn="${n.id}">Xoá</button></span></td>
        </tr>`).join("")}</tbody></table></div>`
        : `<div class="trong"><span class="bd">👤</span>Chưa có ai.</div>`}
    </div>
  </div>`;

  /** Ô sửa tại chỗ: gõ xong rời ô là tự lưu, không cần mở hộp thoại. */
  const oSua = (g, khoa, gt, { mono = false, goi = "" } = {}) =>
    `<span class="o-sua${mono ? " mono" : ""}" contenteditable="plaintext-only" spellcheck="false"
       data-id="${g.id}" data-khoa="${khoa}" data-cu="${esc(gt || "")}"
       ${goi ? `data-goi="${esc(goi)}" title="${esc(goi)} — bấm vào để sửa, rời ô là tự lưu"` : ""}>${esc(gt || "")}</span>`;

  const veBang = (loc = "") => {
    const l = loc.trim().toLowerCase();
    const boDau = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
    const loc2 = boDau(l);
    const dsLoc = !l ? ds : ds.filter((g) =>
      boDau(g.ho_ten).includes(loc2) || boDau(g.ma_gv).includes(loc2) ||
      boDau(g.ma_gv_2 || "").includes(loc2) || (g.dien_thoai || "").includes(l) ||
      boDau(g.to_chuyen_mon || "").includes(loc2));
    khung.querySelector("#dem-tim").textContent = l ? `${dsLoc.length}/${ds.length} người` : `${ds.length} người`;
    khung.querySelector("#bang-gv").innerHTML = bang(dsLoc.map((g) => ({ ...g, __lop: g.hoat_dong ? "" : "mo" })), [
      { ten: "Họ và tên", ve: (g) => `${oSua(g, "ho_ten", g.ho_ten, { goi: "Họ và tên" })}
          ${g.hoat_dong ? "" : ' <span class="nhan n-xam">ngừng</span>'}
          ${g.lop_cn_mac_dinh ? `<br><span class="nho mo">Chủ nhiệm ${oSua(g, "lop_cn_mac_dinh", g.lop_cn_mac_dinh, { goi: "lớp chủ nhiệm" })}</span>`
            : `<br><span class="nho mo">CN ${oSua(g, "lop_cn_mac_dinh", "", { goi: "lớp chủ nhiệm" })}</span>`}` },
      { ten: "Mã GV", ve: (g) => `${oSua(g, "ma_gv", g.ma_gv, { mono: true, goi: "Mã GV" })}
          <br>${oSua(g, "ma_gv_2", g.ma_gv_2, { mono: true, goi: "mã dự phòng" })}` },
      { ten: "Tổ", ve: (g) => oSua(g, "to_chuyen_mon", g.to_chuyen_mon, { goi: "Tổ" }) },
      { ten: "Điện thoại", ve: (g) => oSua(g, "dien_thoai", g.dien_thoai, { mono: true, goi: "Số điện thoại" }) },
      { ten: "Zalo", ve: (g) => nhanZalo(g) + (g.zalo_ten ? `<br><span class="nho mo">${esc(g.zalo_ten)}</span>` : "") },
      { ten: "Email", ve: (g) => `<span class="nho">${oSua(g, "email", g.email, { goi: "Email" })}</span>` },
      {
        ten: "", ve: (g) => `<span class="hang-nut">
          ${g.zalo_uid && g.la_ban === 0 ? `<button class="nut nho" data-moi="${g.zalo_uid}" title="Gửi lời mời kết bạn">Mời kết bạn</button>` : ""}
          <button class="nut nho" data-sua="${g.id}" title="Mở đầy đủ">⋯</button>
          <button class="nut nho xau" data-xoa="${g.id}">Xoá</button></span>`,
      },
    ], { trong: "Chưa có giáo viên nào." });
  };
  veBang();

  khung.querySelector("#tim")?.addEventListener("input", (e) => veBang(e.target.value));
  khung.querySelector(".tab").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    tab = b.dataset.tab;
    $$(".tab button", khung).forEach((x) => x.classList.toggle("chon", x === b));
    khung.querySelector("#tab-gv").hidden = tab !== "gv";
    khung.querySelector("#tab-nn").hidden = tab !== "nn";
  });

  /** Lưu một ô vừa sửa. Trả về true nếu đã lưu. */
  const luuO = async (el) => {
    const id = Number(el.dataset.id), khoa = el.dataset.khoa;
    const moiGt = el.textContent.replace(/\s+/g, " ").trim();
    if (moiGt === (el.dataset.cu || "")) return false;
    const g = ds.find((x) => x.id === id);
    if (!g) return;
    if (!g) return false;

    const ban = { ...g };
    if (khoa === "ho_ten") {
      // Tên là từ cuối, phần còn lại là họ đệm — đúng cách danh sách giáo viên vẫn ghi.
      const t = moiGt.split(" ").filter(Boolean);
      if (!t.length) { el.textContent = el.dataset.cu || ""; return baoXau("<b>Tên không được để trống.</b>"), false; }
      ban.ten = t.pop();
      ban.ho_dem = t.join(" ");
    } else ban[khoa] = moiGt;

    const r = await window.api.gv.luu(ban);
    if (!r.ok) {
      el.textContent = el.dataset.cu || "";
      baoXau("<b>Không lưu được.</b><br>" + esc((r.loi || []).join(" ")));
      return false;
    }
    el.dataset.cu = moiGt;
    Object.assign(g, ban, { ho_ten: `${ban.ho_dem} ${ban.ten}`.trim() });
    el.classList.add("da-luu");
    setTimeout(() => el.classList.remove("da-luu"), 1400);
    // Đổi số điện thoại thì Zalo cũ không còn đúng nữa, phải dò lại.
    if (khoa === "dien_thoai") baoOk("Đã lưu số mới. Bấm “Dò Zalo” để tìm lại Zalo của người này.");
    return true;
  };

  // Sửa tại chỗ: rời ô là lưu; Enter để lưu nhanh, Esc để bỏ.
  ganKhung(khung, "focusout", (e) => {
    const el = e.target.closest?.(".o-sua");
    if (el) luuO(el);
  });
  ganKhung(khung, "keydown", (e) => {
    const el = e.target.closest?.(".o-sua");
    if (!el) return;
    if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    else if (e.key === "Escape") { el.textContent = el.dataset.cu || ""; el.blur(); }
  });

  // Kéo thả tệp danh sách giáo viên vào bất kỳ đâu trong khu này.
  boThaGv.forEach((f) => f());
  boThaGv = [vungTha(khung, async (dsTep) => {
    await napTuTep(dsTep[0], () => ve(khung, tuyChon));
  }, { loc: /\.(xlsx|xlsm)$/i })];

  ganKhung(khung, "click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;

    if (b.dataset.chonTep === "tha-gv") {
      const r = await window.api.tep.chon({ loc: "excel", tieu_de: "Chọn tệp danh sách giáo viên" });
      if (r.ok) await napTuTep(r.duong_dan[0], () => ve(khung, tuyChon));
      return;
    }
    if (b.id === "them") { if (await moHopGv(null)) ve(khung, tuyChon); return; }
    if (b.id === "xoa-het-gv") {
      if (!ds.length) return;
      const coSdt = ds.filter((g) => g.dien_thoai).length;
      const kq = await moHop({
        tieuDe: "Xoá toàn bộ giáo viên",
        noiDung: `<div class="bao xau"><b>Xoá hết ${so(ds.length)} giáo viên khỏi phần mềm.</b>
            <span class="sua">Mất luôn số điện thoại${coSdt ? ` đã nhập (${so(coSdt)} người có số)` : ""}
            và kết quả dò Zalo. Không hoàn tác được.</span></div>
          <ul class="ds-gon">
            <li><b>Vẫn giữ:</b> lịch sử gửi, nhóm Zalo, người nhận ngoài danh sách.</li>
            <li>Người ngoài danh sách đang đăng ký nhận thời khoá biểu của <b>từng giáo viên cụ thể</b>
              sẽ mất phần đăng ký đó.</li>
            <li>Thời khoá biểu đã nạp mất liên kết với giáo viên — <b>nạp lại tệp thời khoá biểu</b>
              để phần mềm tạo và ghép lại.</li>
          </ul>
          <label class="tich"><input type="checkbox" id="xg-dong-y">
            <span>Tôi hiểu, xoá hết ${so(ds.length)} giáo viên</span></label>`,
        nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Xoá toàn bộ", kieu: "xau", giaTri: "xoa", tat: true }],
        khiMo: (hop) => {
          const o = hop.querySelector("#xg-dong-y");
          const n = hop.querySelector(".hop-chan .nut.xau");
          o.addEventListener("change", () => { n.disabled = !o.checked; });
        },
      });
      if (kq !== "xoa") return;
      const r = await window.api.gv.xoaTatCa();
      if (baoKetQua(r, `Đã xoá ${so(r.so)} giáo viên.`)) {
        await (await import("../app.js")).capNhatTienDo();
        ve(khung, tuyChon);
      }
      return;
    }
    if (b.dataset.sua) { if (await moHopGv(ds.find((x) => x.id === Number(b.dataset.sua)))) ve(khung, tuyChon); return; }
    if (b.dataset.xoa) {
      const g = ds.find((x) => x.id === Number(b.dataset.xoa));
      if (!g) return baoXau("Không còn thấy giáo viên này. Hãy tải lại trang.");
      let r = await window.api.gv.xoa(g.id, false);
      if (!r.ok && r.canXacNhan) {
        if (!(await hoi("Xoá hẳn giáo viên?", esc(r.loi[0]), { nutOk: "Xoá hẳn", kieu: "xau" }))) return;
        r = await window.api.gv.xoa(g.id, true);
      }
      if (baoKetQua(r, "Đã xoá.")) ve(khung, tuyChon);
      return;
    }
    if (b.id === "them-nn") { if (await moHopNguoiNhan(null, ds, dsLop)) ve(khung, tuyChon); return; }
    if (b.id === "them-nhom-zalo") {
      const { moChonNhom } = await import("../chon-nhom.js");
      if (await moChonNhom()) ve(khung, tuyChon);
      return;
    }
    if (b.id === "do-nhom") {
      const { canZalo } = await import("../zalo-nhanh.js");
      if (!(await canZalo("Phải kết nối Zalo mới dò được nhóm."))) return;
      const cho = hopCho("Đang dò nhóm Zalo", "Lấy lại mã nhóm, tên và số thành viên…");
      let r;
      try { r = await window.api.zalo.lamMoiNhom(); } finally { cho.dong(); await cho.doi; }
      if (!r.ok) return baoKetQua(r);
      if (!r.so_nhom) {
        baoCanh("Chưa có nhóm nào trong danh sách nhận. Bấm “Thêm nhóm Zalo” để chọn.");
      } else {
        baoOk(`Đã dò xong ${r.so_nhom} nhóm.`);
        if (r.nhom_mat?.length) {
          baoXau(`<b>Không còn thấy ${r.nhom_mat.length} nhóm:</b><br>${esc(r.nhom_mat.join(", "))}`
            + "<br>Có thể bạn đã rời nhóm. Gửi vào đó sẽ lỗi.");
        }
      }
      return ve(khung, tuyChon);
    }
    if (b.dataset.suaNn) { if (await moHopNguoiNhan(nn.find((x) => x.id === Number(b.dataset.suaNn)), ds, dsLop)) ve(khung, tuyChon); return; }
    if (b.dataset.xoaNn) {
      const n = nn.find((x) => x.id === Number(b.dataset.xoaNn));
      if (!(await hoi("Xoá người nhận?", `Xoá <b>${esc(n.ho_ten)}</b> khỏi danh sách người nhận ngoài?`, { nutOk: "Xoá", kieu: "xau" }))) return;
      if (baoKetQua(await window.api.gv.xoaNguoiNhan(n.id), "Đã xoá.")) ve(khung, tuyChon);
      return;
    }
    if (b.dataset.moi) {
      const r = await window.api.zalo.moiKetBan(b.dataset.moi, "Xin chào, tôi gửi thời khoá biểu của nhà trường qua Zalo.");
      if (r.ok) baoOk("Đã gửi lời mời kết bạn." + (r.ghi_chu ? " " + r.ghi_chu : ""));
      else baoXau("<b>Không gửi được lời mời.</b><br>" + esc(r.loi || ""));
      return;
    }

    if (b.id === "nhap-excel") {
      const r = await window.api.tep.chon({ loc: "excel", tieu_de: "Chọn tệp danh sách giáo viên" });
      if (r.ok) await napTuTep(r.duong_dan[0], () => ve(khung, tuyChon));
      return;
    }

    if (b.id === "do-uid") {
      if (!(await canZalo("Phải kết nối Zalo mới dò được số."))) return;
      const chiThieu = await moHop({
        tieuDe: "Dò Zalo",
        noiDung: `
          <div class="bao tin">Dò chậm cho an toàn: ${so(coSdt)} số mất khoảng ${Math.ceil(coSdt * 2.5 / 60)} phút.</div>`,
        nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Dò lại tất cả", giaTri: "tat_ca" }, { ten: "Chỉ dò người chưa có", kieu: "chinh", giaTri: "thieu" }],
      });
      if (!chiThieu) return;
      const cho = hopCho("Đang dò Zalo", "Bắt đầu…");
      const boNghe = window.api.zalo.onDoTienDo((t) => cho.capNhat(`Đã dò ${t.da}/${t.tong} số — ${esc(t.sdt)}`));
      let kq;
      try { kq = await window.api.zalo.doUid({ chiThieu: chiThieu === "thieu" }); }
      finally { boNghe(); cho.dong(); await cho.doi; }
      if (kq.ok) {
        await window.api.zalo.doiChieuBanBe().catch(() => {});
        baoOk(`Dò xong ${kq.n} số: tìm thấy ${kq.tim_thay}, không có Zalo ${kq.khong_thay}.`
          + (kq.so_nhom ? ` Làm mới ${kq.so_nhom} nhóm Zalo.` : ""));
        if (kq.nhom_mat?.length) {
          baoXau(`<b>Không còn thấy ${kq.nhom_mat.length} nhóm:</b><br>${esc(kq.nhom_mat.join(", "))}`
            + "<br>Có thể bạn đã rời nhóm. Gửi vào đó sẽ lỗi.");
        }
        ve(khung, tuyChon);
      } else baoKetQua(kq);
      return;
    }
  });

  return () => boThaGv.forEach((f) => f());
}
