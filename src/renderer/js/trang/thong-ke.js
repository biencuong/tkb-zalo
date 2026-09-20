/** Thống kê số tiết: lọc đa chiều, nhiều cách xem, xuất Excel, in theo bộ lọc. */
import {
  esc, so, ngayVn, moHop, baoOk, baoXau, baoKetQua, hopCho, dsTich, dsTichCoThanh, ganDsTich, layTich, $, $$,
} from "../chung.js";

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
function htmlIn(d) {
  const cot = d.cot;
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${esc(d.tieu_de)}</title>
  <style>
    @page{size:A4;margin:14mm 12mm}
    body{font-family:"Segoe UI",Arial,sans-serif;font-size:10.5pt;color:#000;margin:0}
    h1{font-size:15pt;margin:0 0 2mm;text-align:center;text-transform:uppercase}
    .truong{text-align:center;font-size:11pt;font-weight:600;margin:0 0 1mm}
    .loc{font-size:9pt;color:#333;margin:0 0 3mm;border:1px solid #bbb;padding:2mm 3mm;border-radius:2mm}
    .loc b{color:#000}
    table{width:100%;border-collapse:collapse;font-size:9.5pt}
    th,td{border:1px solid #999;padding:1.4mm 2mm}
    th{background:#eee;text-align:left}
    td.so,th.so{text-align:right}
    tr.lech td{background:#fbe6e2}
    tfoot td{font-weight:700;background:#f4f4f4}
    .chan{margin-top:3mm;font-size:8.5pt;color:#555;display:flex;justify-content:space-between}
  </style></head><body>
    ${d.ten_truong ? `<p class="truong">${esc(d.ten_truong)}</p>` : ""}
    <h1>Thống kê số tiết — ${esc(d.tieu_de)}</h1>
    <div class="loc">${d.mo_ta_loc.map(([k, v]) => `<div><b>${esc(k)}:</b> ${esc(v)}</div>`).join("")}</div>
    <table>
      <thead><tr>${cot.map((c) => `<th class="${["tiet_tuan", "so_tiet_khai", "lech", "tong_tiet"].includes(c.khoa) ? "so" : ""}">${esc(c.ten)}</th>`).join("")}</tr></thead>
      <tbody>${d.dong.map((r) => `<tr class="${r.lech != null && r.lech !== 0 ? "lech" : ""}">
        ${cot.map((c) => `<td class="${["tiet_tuan", "so_tiet_khai", "lech", "tong_tiet"].includes(c.khoa) ? "so" : ""}">${r[c.khoa] == null || r[c.khoa] === "" ? "" : esc(String(r[c.khoa]))}</td>`).join("")}</tr>`).join("")}</tbody>
      <tfoot><tr>${cot.map((c, i) => `<td class="${["tiet_tuan", "so_tiet_khai", "lech", "tong_tiet"].includes(c.khoa) ? "so" : ""}">${
        i === 0 ? "TỔNG CỘNG" : c.khoa === "tiet_tuan" ? d.tong.tiet_tuan : c.khoa === "tong_tiet" ? d.tong.tong_tiet : ""}</td>`).join("")}</tr></tfoot>
    </table>
    <div class="chan"><span>In lúc ${esc(d.in_luc)}</span><span>Phần mềm TKB Zalo</span></div>
  </body></html>`;
}

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

  khung.addEventListener("click", async (e) => {
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
