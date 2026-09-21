/** Thống kê số tiết: lọc đa chiều, nhiều cách xem, xuất Excel, in theo bộ lọc. */
import {
  esc, so, ngayVn, moHop, baoOk, baoXau, baoKetQua, hopCho, dsTich, dsTichCoThanh, ganDsTich, layTich, $, $$, ganKhung,} from "../chung.js";

let loc = {};
let cachXem = "gv";
let nguon = null;

const TEN_CACH_XEM = {
  gv: "Theo giáo viên", lop: "Theo lớp", mon: "Theo môn", thu_buoi: "Theo thứ và buổi",
  gv_lop: "Giáo viên × lớp", gv_thu: "Giáo viên × thứ",
};

function veBangKq(kq) {
  const cot = {
    gv: [["ho_ten", "Giáo viên"], ["ma_gv", "Mã"], ["to_chuyen_mon", "Tổ"], ["lop_cn", "Chủ nhiệm"],
         ["tiet_tuan", "Tiết/tuần", 1], ["so_tiet_khai", "PCGD khai", 1], ["lech", "Lệch", 1], ["tong_tiet", "Tổng tiết", 1]],
    lop: [["lop", "Lớp"], ["khoi", "Khối"], ["tiet_tuan", "Tiết/tuần", 1], ["tong_tiet", "Tổng tiết", 1]],
    mon: [["mon", "Môn"], ["tiet_tuan", "Tiết/tuần", 1], ["tong_tiet", "Tổng tiết", 1]],
    thu_buoi: [["thu_ten", "Thứ"], ["buoi_ten", "Buổi"], ["tiet_tuan", "Tiết/tuần", 1], ["tong_tiet", "Tổng tiết", 1]],
    gv_lop: [["ho_ten", "Giáo viên"], ["ma_gv", "Mã"], ["lop", "Lớp"], ["tiet_tuan", "Tiết/tuần", 1], ["tong_tiet", "Tổng tiết", 1]],
    gv_thu: [["ho_ten", "Giáo viên"], ["ma_gv", "Mã"], ["thu_ten", "Thứ"], ["buoi_ten", "Buổi"], ["tiet_tuan", "Tiết/tuần", 1], ["tong_tiet", "Tổng tiết", 1]],
  }[kq.cach_xem];

  if (!kq.dong.length) return '<div class="trong"><span class="bd">▦</span>Không có dữ liệu khớp bộ lọc.</div>';
  return `<div class="bang-cuon cuon-doc"><table class="b">
    <thead><tr>${cot.map(([, t, s]) => `<th class="${s ? "so" : ""}">${esc(t)}</th>`).join("")}</tr></thead>
    <tbody>${kq.dong.map((d) => `<tr class="${d.lech != null && d.lech !== 0 ? "lech" : d.tiet_tuan === 0 ? "mo" : ""}">
      ${cot.map(([k, , s]) => {
        let v = d[k];
        if (k === "lech" && v != null && v !== 0) v = (v > 0 ? "+" : "") + v;
        return `<td class="${s ? "so" : ""}">${v == null || v === "" ? '<span class="mo">—</span>' : esc(String(v))}</td>`;
      }).join("")}</tr>`).join("")}</tbody>
    <tfoot><tr class="day">${cot.map(([k, , s], i) =>
      `<td class="${s ? "so" : ""}">${i === 0 ? "TỔNG CỘNG" : k === "tiet_tuan" ? so(kq.tong.tiet_tuan) : k === "tong_tiet" ? so(kq.tong.tong_tiet, 1) : ""}</td>`).join("")}</tr></tfoot>
  </table></div>`;
}

/** Dựng HTML trang in theo đúng bộ lọc đang xem. */
/** Cột số thì căn phải. */
const COT_SO = ["tiet_tuan", "so_tiet_khai", "lech", "tong_tiet", "so_lop", "so_gv", "so_mon"];

/** "Tuyên Quang, ngày 21 tháng 9 năm 2026" — đúng lối ghi của văn bản hành chính. */
function dongNgayThang(noi = "") {
  const n = new Date();
  return `${noi ? esc(noi) + ", n" : "N"}gày ${n.getDate()} tháng ${n.getMonth() + 1} năm ${n.getFullYear()}`;
}

/**
 * Biểu mẫu báo cáo để in hoặc lưu PDF.
 * Theo lối trình bày quen thuộc của văn bản hành chính: khối đầu hai bên, tên biểu ở giữa,
 * bảng kẻ khung đầy đủ, và chỗ ký ở cuối.
 */
function htmlIn(d) {
  const cot = d.cot;
  const laSo = (k) => COT_SO.includes(k);
  const o = (r, c) => (r[c.khoa] == null || r[c.khoa] === "" ? "" : esc(String(r[c.khoa])));
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${esc(d.tieu_de)}</title>
  <style>
    @page{size:A4;margin:18mm 14mm 16mm}
    body{font-family:"Times New Roman",serif;font-size:13pt;color:#000;margin:0;line-height:1.35}

    .dau{display:flex;justify-content:space-between;gap:8mm;margin-bottom:6mm}
    .dau .ben{text-align:center;flex:1}
    .dau .co-quan{font-weight:700;text-transform:uppercase;font-size:12pt}
    .dau .quoc-hieu{font-weight:700;text-transform:uppercase;font-size:12pt}
    .dau .tieu-ngu{font-weight:700;font-size:13pt}
    .gach{display:block;width:60%;margin:1mm auto 0;border-bottom:1px solid #000}
    .gach.dai{width:80%}

    h1{font-size:14pt;margin:0;text-align:center;text-transform:uppercase;font-weight:700}
    .phu-de{text-align:center;font-size:12pt;font-style:italic;margin:1mm 0 4mm}

    .loc{font-size:11pt;margin:0 0 3mm;border:1px solid #000;padding:2mm 3mm}
    .loc div{display:inline-block;margin-right:6mm}
    .loc b{font-weight:700}

    table{width:100%;border-collapse:collapse;font-size:11.5pt}
    thead{display:table-header-group}
    tr{page-break-inside:avoid}
    th,td{border:1px solid #000;padding:1.3mm 2mm;vertical-align:top}
    th{background:#e8e8e8;text-align:center;font-weight:700}
    td.so,th.so{text-align:right}
    td.tt,th.tt{text-align:center;width:12mm}
    tr.lech td{background:#f2f2f2}
    tfoot td{font-weight:700;background:#e8e8e8}
    tfoot{display:table-footer-group}

    .ky{display:flex;justify-content:space-between;gap:10mm;margin-top:8mm;page-break-inside:avoid}
    .ky .o-ky{flex:1;text-align:center;font-size:12pt}
    .ky .chuc{font-weight:700;text-transform:uppercase}
    .ky .ngay{font-style:italic;margin-bottom:1mm}
    .ky .cho-ten{margin-top:18mm}
    .chan-in{margin-top:4mm;font-size:9pt;color:#444;text-align:right}
  </style></head><body>
    <div class="dau">
      <div class="ben">
        <div class="co-quan">${esc(d.ten_truong || "Nhà trường")}</div>
        <span class="gach"></span>
      </div>
      <div class="ben">
        <div class="quoc-hieu">Cộng hoà xã hội chủ nghĩa Việt Nam</div>
        <div class="tieu-ngu">Độc lập - Tự do - Hạnh phúc</div>
        <span class="gach dai"></span>
      </div>
    </div>

    <h1>Thống kê số tiết</h1>
    <p class="phu-de">${esc(d.tieu_de)}</p>

    ${d.mo_ta_loc?.length
      ? `<div class="loc">${d.mo_ta_loc.map(([k, v]) => `<div><b>${esc(k)}:</b> ${esc(v)}</div>`).join("")}</div>`
      : ""}

    <table>
      <thead><tr><th class="tt">TT</th>${cot.map((c) =>
        `<th class="${laSo(c.khoa) ? "so" : ""}">${esc(c.ten)}</th>`).join("")}</tr></thead>
      <tbody>${d.dong.map((r, i) => `<tr class="${r.lech != null && r.lech !== 0 ? "lech" : ""}">
        <td class="tt">${i + 1}</td>${cot.map((c) =>
          `<td class="${laSo(c.khoa) ? "so" : ""}">${o(r, c)}</td>`).join("")}</tr>`).join("")}</tbody>
      <tfoot><tr><td class="tt"></td>${cot.map((c, i) => `<td class="${laSo(c.khoa) ? "so" : ""}">${
        i === 0 ? "TỔNG CỘNG"
          : c.khoa === "tiet_tuan" ? d.tong.tiet_tuan
          : c.khoa === "tong_tiet" ? d.tong.tong_tiet : ""}</td>`).join("")}</tr></tfoot>
    </table>

    <div class="ky">
      <div class="o-ky">
        <div class="chuc">Người lập biểu</div>
        <div class="cho-ten"></div>
      </div>
      <div class="o-ky">
        <div class="ngay">${dongNgayThang()}</div>
        <div class="chuc">Hiệu trưởng</div>
        <div class="cho-ten"></div>
      </div>
    </div>
    <div class="chan-in">In lúc ${esc(d.in_luc)} · TKB Zalo</div>
  </body></html>`;
}

/** Dùng cho kịch bản kiểm thử: dựng bản in từ dữ liệu có sẵn. */
export const __htmlInThu = htmlIn;

/** Bộ lọc có khác mặc định không (mặc định = một thời khoá biểu mới nhất). */
function daLocRieng(l) {
  const k = Object.keys(l || {}).filter((x) => x !== "tkb_ids");
  return k.length > 0 || (l.tkb_ids || []).length > 1;
}

/** Tóm tắt bộ lọc thành mấy con chữ ngắn, nhìn là biết đang xem cái gì. */
function veChipLoc(l, ng) {
  const chip = [];
  const ten = (ds, max = 3) => ds.slice(0, max).join(", ") + (ds.length > max ? ` +${ds.length - max}` : "");

  if (l.tu_ngay && l.den_ngay) chip.push(["Khoảng ngày", `${ngayVn(l.tu_ngay)} – ${ngayVn(l.den_ngay)}`]);
  const tkb = (l.tkb_ids || []).map((id) => ng.tkb.find((t) => t.id === id)).filter(Boolean);
  if (tkb.length) chip.push(["Thời khoá biểu", ten(tkb.map((t) => `số ${t.so_tkb}`))]);
  const gv = (l.giao_vien_ids || []).map((id) => ng.giao_vien.find((g) => g.id === id)).filter(Boolean);
  if (gv.length) chip.push(["Giáo viên", ten(gv.map((g) => g.ho_ten), 2)]);
  if (l.to_chuyen_mon?.length) chip.push(["Tổ", ten(l.to_chuyen_mon, 2)]);
  if (l.khoi?.length) chip.push(["Khối", ten(l.khoi.map(String))]);
  if (l.lop?.length) chip.push(["Lớp", ten(l.lop.map(String))]);
  if (l.mon?.length) chip.push(["Môn", ten(l.mon.map(String))]);
  if (l.buoi?.length) chip.push(["Buổi", ten(l.buoi.map((b) => (b === "S" ? "sáng" : "chiều")))]);
  if (l.thu?.length) chip.push(["Thứ", ten(l.thu.map((t) => "thứ " + t))]);
  if (l.chi_gvcn) chip.push(["Chỉ", "tiết của chủ nhiệm ở lớp mình"]);

  if (!chip.length) return '<span class="mo nho">Chưa lọc gì — đang xem tất cả.</span>';
  return chip.map(([k, v]) => `<span class="chip-loc"><b>${esc(k)}</b> ${esc(v)}</span>`).join("");
}

/**
 * Hộp chọn bộ lọc — chia ba nhóm theo đúng câu hỏi người dùng đang tự hỏi:
 *   TÍNH TRÊN GÌ (thời khoá biểu, khoảng ngày) · CỦA AI (giáo viên, tổ) · PHẦN NÀO (khối/lớp/môn/buổi/thứ).
 * Trả về bộ lọc mới, hoặc null nếu người dùng huỷ.
 */
async function hopBoLoc(l, ng) {
  let moi = null;
  const nhom = (stt, ten, moTa, noi) => `
    <section class="nhom-loc">
      <h3><span class="nl-so">${stt}</span>${esc(ten)}</h3>
      <p class="nl-mo">${esc(moTa)}</p>
      ${noi}
    </section>`;

  const chon = await moHop({
    tieuDe: "Bộ lọc thống kê", rong: "rat-rong",
    noiDung: `
      <div class="luoi-loc">
        ${nhom(1, "Tính trên gì", "Không chọn thời khoá biểu nào là tính tất cả.", `
          ${dsTichCoThanh("f-tkb", "Thời khoá biểu", ng.tkb.map((t) => ({
              gia_tri: t.id,
              ten: `Số ${t.so_tkb} · ${t.nam_hoc}${t.hoc_ky ? " · HK" + t.hoc_ky : ""} · từ ${ngayVn(t.ngay_ap_dung)}`,
            })), l.tkb_ids || [], { cao: "148px" })}
          <div class="o-loc">
            <div class="o-loc-dau"><label>Khoảng ngày</label>
              <span class="o-loc-dem${l.tu_ngay ? " co" : ""}">${l.tu_ngay ? "đang đặt" : "cả kỳ"}</span></div>
            <div class="luoi c2" style="gap:.4rem">
              <div class="o-nhap"><input type="date" id="f-tu" value="${esc(l.tu_ngay || "")}" title="Từ ngày"></div>
              <div class="o-nhap"><input type="date" id="f-den" value="${esc(l.den_ngay || "")}" title="Đến ngày"></div>
            </div>
            <div class="o-loc-nut"><button type="button" class="lien" id="xoa-ngay">Bỏ khoảng ngày</button>
              <span class="o-loc-goi">Có khoảng ngày thì tổng tiết nhân với số tuần áp dụng.</span></div>
          </div>`)}

        ${nhom(2, "Của ai", "Bỏ trống là tính cho mọi giáo viên.", `
          ${dsTichCoThanh("f-gv", "Giáo viên", ng.giao_vien.map((g) => ({ gia_tri: g.id, ten: `${g.ho_ten} (${g.ma_gv})` })),
            l.giao_vien_ids || [], { cao: "148px", tim: true })}
          ${ng.to_chuyen_mon.length
            ? dsTichCoThanh("f-to", "Tổ chuyên môn", ng.to_chuyen_mon, l.to_chuyen_mon || [], { cao: "84px" })
            : `<div class="o-loc"><div class="o-loc-dau"><label>Tổ chuyên môn</label></div>
                 <p class="nho mo" style="margin:0">Chưa điền tổ cho giáo viên nào.</p></div>`}
          <label class="tich"><input type="checkbox" id="f-gvcn" ${l.chi_gvcn ? "checked" : ""}>
            <span>Chỉ tiết của giáo viên chủ nhiệm ở lớp mình</span></label>`)}

        ${nhom(3, "Phần nào của thời khoá biểu", "Lọc theo lớp học, môn học và thời điểm trong tuần.", `
          <div class="luoi c2" style="gap:.5rem">
            ${dsTichCoThanh("f-khoi", "Khối", ng.khoi, l.khoi || [], { cao: "84px" })}
            ${dsTichCoThanh("f-buoi", "Buổi", ng.buoi, l.buoi || [], { cao: "84px" })}
          </div>
          <div class="luoi c2" style="gap:.5rem">
            ${dsTichCoThanh("f-lop", "Lớp", ng.lop, l.lop || [], { cao: "112px", tim: true })}
            ${dsTichCoThanh("f-mon", "Môn", ng.mon, l.mon || [], { cao: "112px", tim: true })}
          </div>
          ${dsTichCoThanh("f-thu", "Thứ", ng.thu, l.thu || [], { cao: "78px" })}`)}
      </div>`,
    nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Xem tất cả", giaTri: "het" },
          { ten: "Áp dụng", kieu: "chinh", giaTri: "ap" }],
    khiMo: (hop) => {
      ganDsTich(hop);
      hop.querySelector("#xoa-ngay")?.addEventListener("click", (e) => {
        e.preventDefault();
        hop.querySelector("#f-tu").value = "";
        hop.querySelector("#f-den").value = "";
      });
      hop.querySelector(".hop-chan .nut.chinh").addEventListener("click", () => {
        const g = (id) => hop.querySelector(id);
        const x = {};
        const tu = g("#f-tu").value, den = g("#f-den").value;
        if (tu && den) { x.tu_ngay = tu; x.den_ngay = den; }
        const lay = (ten, laSo = false) => {
          const v = layTich(hop, ten);
          return laSo ? v.map(Number) : v;
        };
        const tkb = lay("f-tkb", true); if (tkb.length) x.tkb_ids = tkb;
        const gv = lay("f-gv", true); if (gv.length) x.giao_vien_ids = gv;
        const to = lay("f-to"); if (to.length) x.to_chuyen_mon = to;
        const khoi = lay("f-khoi"); if (khoi.length) x.khoi = khoi;
        const lop = lay("f-lop"); if (lop.length) x.lop = lop;
        const mon = lay("f-mon"); if (mon.length) x.mon = mon;
        const buoi = lay("f-buoi"); if (buoi.length) x.buoi = buoi;
        const thu = lay("f-thu", true); if (thu.length) x.thu = thu;
        if (g("#f-gvcn").checked) x.chi_gvcn = true;
        moi = x;
      }, true);
    },
  });
  if (chon === "het") return {};
  return chon === "ap" ? (moi || {}) : null;
}

export async function ve(khung) {
  if (!nguon) nguon = await window.api.tk.nguonLoc();
  if (!nguon.tkb.length) {
    khung.innerHTML = `<div class="dau-trang"><div><h1>Thống kê số tiết</h1></div></div>
      <div class="the"><div class="trong"><span class="bd">▦</span>Chưa có thời khoá biểu để thống kê.</div></div>`;
    return;
  }
  if (!loc.tkb_ids && !loc.tu_ngay) loc = { tkb_ids: [nguon.tkb[0].id] };

  const kq = await window.api.tk.thongKe(loc, cachXem);

  khung.innerHTML = `
  <div class="dau-trang">
    <div><h1>Thống kê số tiết</h1>
      <p class="mo-ta">Lọc nhiều chiều, xuất Excel hoặc in theo đúng bộ lọc.</p></div>
    <div class="hang-nut">
      <button class="nut" id="xuat-excel">Xuất Excel</button>
      <button class="nut" id="in">In</button>
      <button class="nut" id="xuat-pdf">Lưu PDF</button>
    </div>
  </div>

  <div class="loc-thanh">
    <button class="nut chinh nho" id="mo-loc">Bộ lọc…</button>
    <div class="loc-chip">${veChipLoc(loc, nguon)}</div>
    <button class="nut nho" id="bo-loc"${daLocRieng(loc) ? "" : " disabled"}>Bỏ lọc</button>
  </div>

  <div class="tab">
    ${Object.entries(TEN_CACH_XEM).map(([k, v]) => `<button class="${k === cachXem ? "chon" : ""}" data-xem="${k}">${esc(v)}</button>`).join("")}
  </div>

  <div class="luoi c4" style="margin-bottom:.75rem">
    <div class="o-so vach"><b>Số dòng</b><span class="v">${so(kq.tong.so_dong)}</span></div>
    <div class="o-so vach"><b>Tiết mỗi tuần</b><span class="v">${so(kq.tong.tiet_tuan)}</span></div>
    <div class="o-so vach"><b>Tổng tiết</b><span class="v">${so(kq.tong.tong_tiet, 1)}</span>
      <span class="g">${kq.co_khoang ? "đã nhân số tuần áp dụng" : "một tuần"}</span></div>
    <div class="o-so ${kq.tong.so_lech ? "vach-xau" : "vach-ok"}"><b>Lệch với PCGD</b><span class="v">${so(kq.tong.so_lech)}</span>
      <span class="g">${kq.tong.so_lech ? "dòng tô đỏ bên dưới" : "khớp hết"}</span></div>
  </div>

  ${kq.tkb.length ? `<div class="bao tin"><b>Đang tính trên ${kq.tkb.length} thời khoá biểu:</b>
    ${esc(kq.tkb.map((t) => `số ${t.so_tkb} (${t.nam_hoc})${kq.co_khoang ? ` × ${t.he_so_tuan} tuần` : ""}`).join(" · "))}</div>` : ""}

  <div class="the"><div class="the-dau"><h2>${esc(TEN_CACH_XEM[cachXem])}</h2></div>${veBangKq(kq)}</div>`;

  khung.querySelector(".tab").addEventListener("click", (e) => {
    const b = e.target.closest("[data-xem]");
    if (!b) return;
    cachXem = b.dataset.xem;
    ve(khung);
  });

  ganKhung(khung, "click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "mo-loc") {
      const l = await hopBoLoc(loc, nguon);
      if (l) { loc = l; ve(khung); }
      return;
    }
    if (b.id === "bo-loc") { loc = { tkb_ids: [nguon.tkb[0].id] }; return ve(khung); }

    if (b.id === "xuat-excel") {
      const chon = await moHop({
        tieuDe: "Xuất Excel",
        noiDung: `<p>Tệp gồm một sheet ghi lại <b>điều kiện lọc</b> và mỗi cách xem một sheet.</p>
          <label>Chọn cách xem để xuất</label>
          ${dsTich("x-cx", Object.entries(TEN_CACH_XEM).map(([k, v]) => ({ gia_tri: k, ten: v })), [cachXem])}`,
        nut: [{ ten: "Huỷ", giaTri: null }, { ten: "Xuất", kieu: "chinh", giaTri: "xuat" }],
        khiMo: (hop) => { hop.querySelector(".hop-chan .nut.chinh").addEventListener("click", () => {
          window.__cx = layTich(hop, "x-cx");
        }, true); },
      });
      if (chon !== "xuat") return;
      const cx = window.__cx?.length ? window.__cx : [cachXem];
      const nơi = await window.api.tep.luuODau({ ten_goi_y: `Thong-ke-tiet-${new Date().toISOString().slice(0, 10)}.xlsx` });
      if (!nơi.ok) return;
      const cho = hopCho("Đang xuất Excel");
      let r;
      try { r = await window.api.tk.xuatExcel(loc, cx, nơi.duong_dan); } finally { cho.dong(); await cho.doi; }
      if (r.ok) {
        baoOk(`Đã xuất ${r.so_sheet} sheet.`);
        if (await import("../chung.js").then((m) => m.hoi("Mở tệp vừa xuất?", esc(r.duong_dan), { nutOk: "Mở" }))) {
          window.api.app.moTep(r.duong_dan);
        }
      } else baoKetQua(r);
      return;
    }

    if (b.id === "in" || b.id === "xuat-pdf") {
      const d = await window.api.tk.duLieuIn(loc, cachXem);
      const html = htmlIn(d);
      if (b.id === "in") {
        const r = await window.api.tk.in(html);
        if (!r.ok) baoXau("Không in được: " + esc((r.loi || []).join(" ")));
        return;
      }
      const nơi = await window.api.tep.luuODau({ ten_goi_y: `Thong-ke-${cachXem}-${new Date().toISOString().slice(0, 10)}.pdf`, loc: "pdf" });
      if (!nơi.ok) return;
      const r = await window.api.tk.xuatPdf(html, nơi.duong_dan);
      if (r.ok) { baoOk("Đã lưu PDF."); window.api.app.moTep(r.duong_dan); }
      else baoKetQua(r);
      return;
    }
  });
}
