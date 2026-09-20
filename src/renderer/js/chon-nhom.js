/**
 * Chọn NHÓM ZALO làm người nhận.
 *
 * Gửi vào nhóm không cần số điện thoại và không cần kết bạn — mình đã ở trong nhóm rồi.
 * Hợp với nhóm tổ chuyên môn, nhóm toàn trường: một lần gửi là cả nhóm thấy.
 */
import { esc, so, moHop, hopCho, baoOk, baoXau, baoKetQua, $$ } from "./chung.js";
import { canZalo } from "./zalo-nhanh.js";

let nhoTam = null;   // nhớ trong phiên để khỏi hỏi lại máy chủ mỗi lần mở

function veDs(ds, daChon) {
  if (!ds.length) return '<div class="trong">Không tìm thấy nhóm nào.</div>';
  return `<div class="ds-nhom">${ds.map((n) => `
    <label class="nhom-o ${daChon.has(n.id) ? "chon" : ""}" data-ten="${esc(n.ten.toLowerCase())}">
      <input type="checkbox" name="nhom" value="${esc(n.id)}" ${daChon.has(n.id) ? "checked" : ""}>
      <span class="nhom-chu">
        <b>${esc(n.ten)}</b>
        <span>${so(n.so_thanh_vien)} thành viên${n.la_cong_dong ? " · cộng đồng" : ""}</span>
      </span>
    </label>`).join("")}</div>`;
}

/** Mở hộp chọn nhóm. Trả về số nhóm vừa thêm vào danh sách người nhận. */
export async function moChonNhom() {
  if (!(await canZalo("Phải kết nối Zalo mới đọc được danh sách nhóm."))) return 0;

  let ds = nhoTam;
  if (!ds) {
    const cho = hopCho("Đang đọc danh sách nhóm Zalo", "Hỏi từng lô cho nhẹ máy chủ…");
    let r;
    try { r = await window.api.zalo.dsNhom(); } finally { cho.dong(); await cho.doi; }
    if (!r.ok) { baoKetQua(r); return 0; }
    ds = r.ds || [];
    nhoTam = ds;
  }

  // Nhóm nào đã là người nhận rồi thì tích sẵn
  const daCo = new Set(
    ((await window.api.gv.nguoiNhan()).ds || []).filter((x) => x.la_nhom).map((x) => String(x.zalo_uid))
  );
  let chonHienTai = new Set(daCo);
  let nhanGi = "tat_ca_lop";

  const chon = await moHop({
    tieuDe: `Chọn nhóm Zalo — ${ds.length} nhóm`, rong: "rong",
    noiDung: `
      <p class="nho mo" style="margin:0 0 .5rem">Gửi vào nhóm <b>không cần số điện thoại</b> và
        không cần kết bạn. Tích nhóm nào thì nhóm đó thành người nhận, hiện ở tab Giáo viên,
        mục Người nhận ngoài danh sách.</p>
      <div class="o-nhap" style="margin-bottom:.5rem">
        <label for="nhom-nhan">Nhóm được nhận thời khoá biểu nào</label>
        <select id="nhom-nhan">
          <option value="tat_ca_lop">Thời khoá biểu của tất cả các lớp</option>
          <option value="tat_ca_gv">Thời khoá biểu của tất cả giáo viên</option>
          <option value="khong">Chưa chọn — tự đặt sau ở mục Người nhận ngoài danh sách</option>
        </select>
        <div class="goi-y">Không đặt mục này thì nhóm không nhận được gì, vì phần mềm không biết
          phải gửi thời khoá biểu nào vào nhóm.</div>
      </div>
      <div class="hang-nut" style="margin-bottom:.5rem">
        <input type="search" id="tim-nhom" placeholder="Gõ tên nhóm để lọc…" style="flex:1;min-width:220px">
        <button type="button" class="nut nho" id="nhom-bo-het">Bỏ tích hết</button>
      </div>
      <p class="nho mo" id="dem-nhom" style="margin:0 0 .4rem"></p>
      <div id="khung-nhom">${veDs(ds, chonHienTai)}</div>`,
    nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Thêm vào danh sách nhận", kieu: "chinh", giaTri: "them" }],
    khiMo: (hop) => {
      const dem = () => {
        const n = $$('input[name="nhom"]:checked', hop).length;
        hop.querySelector("#dem-nhom").textContent = n ? `Đang chọn ${n} nhóm.` : "Chưa chọn nhóm nào.";
      };
      dem();
      hop.querySelector("#tim-nhom").oninput = (e) => {
        const v = e.target.value.trim().toLowerCase();
        $$(".nhom-o", hop).forEach((l) => { l.style.display = !v || l.dataset.ten.includes(v) ? "" : "none"; });
      };
      hop.querySelector("#nhom-bo-het").onclick = () => {
        $$('input[name="nhom"]', hop).forEach((x) => { x.checked = false; x.closest(".nhom-o").classList.remove("chon"); });
        dem();
      };
      hop.addEventListener("change", (e) => {
        const x = e.target.closest('input[name="nhom"]');
        if (!x) return;
        x.closest(".nhom-o").classList.toggle("chon", x.checked);
        dem();
      });
      hop.querySelector(".hop-chan .nut.chinh").addEventListener("click", () => {
        chonHienTai = new Set($$('input[name="nhom"]:checked', hop).map((x) => x.value));
        nhanGi = hop.querySelector("#nhom-nhan").value;
      }, true);
    },
  });
  if (chon !== "them") return 0;

  const themVao = ds.filter((n) => chonHienTai.has(n.id));
  if (!themVao.length) { baoXau("<b>Chưa chọn nhóm nào.</b>"); return 0; }

  const r = await window.api.gv.themNhom(themVao, nhanGi);
  if (!r.ok) { baoKetQua(r); return 0; }
  const chuNhan = { tat_ca_lop: "thời khoá biểu tất cả các lớp", tat_ca_gv: "thời khoá biểu tất cả giáo viên" }[nhanGi];
  baoOk(`Đã thêm ${r.them} nhóm, cập nhật ${r.capNhat} nhóm.` + (chuNhan ? ` Nhóm sẽ nhận ${chuNhan}.` : ""));
  if (nhanGi === "khong") {
    baoXau("<b>Nhóm chưa đăng ký nhận gì.</b><br>Vào Dữ liệu › Giáo viên › Người nhận ngoài danh sách để đặt.");
  }
  return themVao.length;
}
