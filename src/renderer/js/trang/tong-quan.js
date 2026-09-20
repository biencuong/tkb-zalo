/** Tổng quan: quy trình 3 bước, chỉ hiện việc cần làm tiếp. */
import { esc, so, ngayVn, hopCho, baoOk, baoXau } from "../chung.js";
import { di, capNhatTienDo } from "../app.js";

/** Thanh 3 bước — bấm vào là nhảy tới bước đó. Dùng lại ở các trang khác. */
export function thanhBuoc(td, { hienViec = true } = {}) {
  const b = td?.buoc || [];
  const dang = b.findIndex((x) => !x.xong && !x.khoa);
  return `<div class="buoc-thanh">${b.map((x, i) => {
    const lop = x.xong ? "xong" : x.khoa ? "khoa" : (i === dang ? "dang" : "");
    return `<button class="buoc-o ${lop}" data-di-buoc="${esc(x.ma)}"${x.khoa ? " disabled" : ""}>
      <span class="tron">${x.xong ? "✓" : x.khoa ? "🔒" : i + 1}</span>
      <span><span class="ten">${esc(x.ten)}</span>
        ${hienViec ? `<span class="mo-ta">${esc(x.khoa ? "Cần: " + (x.thieu || []).join(", ") : x.viec)}</span>` : ""}</span>
    </button>`;
  }).join("")}</div>`;
}

export async function ve(khung) {
  const td = await capNhatTienDo();
  if (!td) {
    khung.innerHTML = '<div class="the"><div class="bao xau"><b>Không đọc được trạng thái.</b> Đóng app rồi mở lại.</div></div>';
    return;
  }
  const s = td.so;
  const t = td.tkb_moi_nhat;
  const dang = td.buoc.find((x) => !x.xong && !x.khoa) || td.buoc[2];

  const viecTiep = {
    "du-lieu": !s.gv ? { chu: "Nhập danh sách giáo viên từ Excel.", nut: "Mở Giáo viên", di: ["du-lieu", { neo: "khu-gv" }] }
      : !s.sdt ? { chu: "Bổ sung số điện thoại cho giáo viên.", nut: "Mở Giáo viên", di: ["du-lieu", { neo: "khu-gv" }] }
      : !s.tkb ? { chu: "Nhập thời khoá biểu từ tệp Excel và Word.", nut: "Nhập tệp", di: ["du-lieu", { neo: "khu-nhap" }] }
      : { chu: `Tạo ảnh thời khoá biểu — mới có ${s.co_anh}/${s.can_tep}.`, nut: "Tạo ảnh ngay", lam: "tao-anh" },
    zalo: td.zalo.status !== "da_ket_noi"
      ? { chu: "Quét mã QR bằng Zalo trên điện thoại.", nut: "Kết nối Zalo", lam: "noi-zalo" }
      : { chu: "Dò Zalo theo số điện thoại giáo viên.", nut: "Mở Kết nối Zalo", di: ["zalo"] },
    gui: { chu: "Chọn gửi gì cho ai, gửi thử vài người rồi gửi cả trường.", nut: "Mở màn Gửi", di: ["gui"] },
  }[dang.ma];

  khung.innerHTML = `
  ${thanhBuoc(td)}

  <div class="the" style="border-left:3px solid var(--accent)">
    <div class="the-dau">
      <h2 style="margin:0">Việc tiếp theo</h2>
      <span class="nhan n-coral">Bước ${td.buoc.indexOf(dang) + 1}</span>
    </div>
    <p style="margin:.1rem 0 .7rem">${esc(viecTiep.chu)}</p>
    <div class="hang-nut">
      <button class="nut chinh" id="lam-ngay">${esc(viecTiep.nut)}</button>
      ${s.da_gui ? '<button class="nut" data-di-trang="gui">Lịch sử gửi</button>' : ""}
    </div>
  </div>

  <div class="luoi c4">
    <div class="o-so ${s.gv && s.sdt >= s.gv ? "vach-ok" : "vach-xau"}"><b>Giáo viên</b><span class="v">${so(s.gv)}</span>
      <span class="g">${so(s.sdt)} có số · ${so(s.uid)} có Zalo</span></div>
    <div class="o-so ${t ? "vach-ok" : "vach-xau"}"><b>Thời khoá biểu</b><span class="v">${t ? "Số " + t.so_tkb : "—"}</span>
      <span class="g">${t ? esc(t.nam_hoc) + " · từ " + (ngayVn(t.ngay_ap_dung) || "?") : "chưa nhập"}</span></div>
    <div class="o-so ${s.can_tep && s.co_anh >= s.can_tep ? "vach-ok" : "vach"}"><b>Tệp để gửi</b>
      <span class="v">${so(s.co_anh)}${s.can_tep ? "/" + so(s.can_tep) : ""}</span>
      <span class="g">ảnh · ${so(s.co_docx)} tệp Word</span></div>
    <div class="o-so ${s.da_gui ? "vach-ok" : "vach"}"><b>Đã gửi</b><span class="v">${so(s.da_gui)}</span><span class="g">lượt</span></div>
  </div>

  ${s.thieu_cn ? `<div class="bao canh" style="display:flex;justify-content:space-between;align-items:center;gap:1rem">
    <span><b>${s.thieu_cn} lớp chưa có chủ nhiệm</b> — không gửi được thời khoá biểu lớp.</span>
    <button class="nut nho" data-di-tab="tkb">Chọn chủ nhiệm</button></div>` : ""}`;

  khung.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.diBuoc) return di(b.dataset.diBuoc);
    if (b.dataset.diTab) return di("du-lieu", { neo: "khu-" + b.dataset.diTab });
    if (b.dataset.diTrang) return di(b.dataset.diTrang);
    if (b.id === "lam-ngay") {
      if (viecTiep.lam === "noi-zalo") {
        const { moKetNoiZalo } = await import("../zalo-nhanh.js");
        await moKetNoiZalo();
        return ve(khung);
      }
      if (viecTiep.lam === "tao-anh") {
        const cho = hopCho("Đang tạo ảnh thời khoá biểu", "Chuẩn bị…");
        const boNghe = window.api.anh.onTienDo((x) => cho.capNhat(`${x.da}/${x.tong} — ${esc(x.ten)}`));
        let kq;
        try { kq = await window.api.anh.chuanBi(t.id, {}); }
        finally { boNghe(); cho.dong(); await cho.doi; }
        if (kq?.ok) baoOk(`Đã tạo ${kq.tao_moi} ảnh.`);
        else baoXau("<b>Tạo ảnh có lỗi.</b><br>" + esc((kq?.loi || []).slice(0, 3).join("<br>")));
        return ve(khung);
      }
      return di(...viecTiep.di);
    }
  });
}
