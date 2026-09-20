/** Tiện ích dùng chung cho mọi trang giao diện. */

export const $ = (s, g = document) => g.querySelector(s);
export const $$ = (s, g = document) => [...g.querySelectorAll(s)];

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const ngayVn = (s) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4) : (s || ""));
export const gioVn = (s) => {
  if (!s) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s);
  return m ? `${m[4]}:${m[5]} ${m[3]}/${m[2]}/${m[1]}` : s;
};
export const so = (n, le = 0) => (n == null || n === "" ? "" : Number(n).toLocaleString("vi-VN", { maximumFractionDigits: le }));
export const coHoac = (v, md = "—") => (v == null || v === "" ? `<span class="mo">${md}</span>` : esc(v));

/** Thông báo nổi góc dưới bên phải. */
export function bao(noiDung, kieu = "", giay = 4) {
  const h = document.createElement("div");
  h.className = "tb " + kieu;
  h.innerHTML = noiDung;
  document.getElementById("thong-bao").appendChild(h);
  setTimeout(() => { h.style.opacity = "0"; setTimeout(() => h.remove(), 250); }, giay * 1000);
  return h;
}
export const baoOk = (s) => bao(s, "ok");
export const baoXau = (s) => bao(s, "xau", 8);
export const baoCanh = (s) => bao(s, "canh", 6);

/** Hiện lỗi trả về từ lệnh (mảng loi) — luôn nói rõ lỗi gì. */
export function baoKetQua(r, khiOk = "Xong.") {
  if (r && r.ok) { if (khiOk) baoOk(khiOk); return true; }
  const ds = (r && r.loi) || ["Không rõ lỗi."];
  baoXau("<b>Không thực hiện được.</b><br>" + ds.map(esc).join("<br>"));
  return false;
}

// ---------------------------------------------------------------- HỘP THOẠI

let dongHopHienTai = null;

/**
 * Mở hộp thoại. noiDung là HTML; nut là [{ten, kieu, giaTri, dong}].
 * Trả về Promise giá trị nút người dùng bấm (null nếu đóng).
 */
export function moHop({ tieuDe, noiDung, nut = [], rong = "", khiMo = null, khongDongNgoai = false }) {
  return new Promise((giai) => {
    const pm = document.getElementById("phu-man");
    const hop = document.getElementById("hop");
    hop.className = "hop " + rong;
    hop.innerHTML =
      `<div class="hop-dau"><h2>${esc(tieuDe)}</h2><button class="x" data-dong="1" title="Đóng">✕</button></div>` +
      `<div class="hop-than">${noiDung}</div>` +
      (nut.length ? `<div class="hop-chan">${nut.map((n, i) =>
        `<button class="nut ${n.kieu || ""}" data-i="${i}"${n.tat ? " disabled" : ""}>${esc(n.ten)}</button>`).join("")}</div>` : "");
    pm.classList.add("mo");

    const xong = (gt) => {
      if (dongHopHienTai !== xong) return;
      pm.classList.remove("mo");
      hop.innerHTML = "";
      document.removeEventListener("keydown", phim);
      dongHopHienTai = null;
      giai(gt);
    };
    dongHopHienTai = xong;
    const phim = (e) => { if (e.key === "Escape" && !khongDongNgoai) xong(null); };
    document.addEventListener("keydown", phim);

    hop.onclick = (e) => {
      const d = e.target.closest("[data-dong]");
      if (d) return xong(null);
      const b = e.target.closest("[data-i]");
      if (b) {
        const n = nut[Number(b.dataset.i)];
        if (n.giuMo) { n.khiBam?.(hop, xong); return; }
        xong(n.giaTri !== undefined ? n.giaTri : n.ten);
      }
    };
    pm.onclick = (e) => { if (e.target === pm && !khongDongNgoai) xong(null); };
    khiMo?.(hop, xong);
  });
}

export function dongHop() { dongHopHienTai?.(null); }

/** Hỏi xác nhận. */
export async function hoi(tieuDe, noiDung, { nutOk = "Đồng ý", kieu = "chinh" } = {}) {
  const r = await moHop({
    tieuDe, noiDung: typeof noiDung === "string" ? `<p style="margin:0">${noiDung}</p>` : noiDung,
    nut: [{ ten: "Huỷ", giaTri: false }, { ten: nutOk, kieu, giaTri: true }],
  });
  return r === true;
}

/** Hộp chờ có thể cập nhật nội dung. */
export function hopCho(tieuDe, noiDungDau = "Đang xử lý…") {
  let capNhat = () => {};
  const p = moHop({
    tieuDe, khongDongNgoai: true,
    noiDung: `<div id="cho-noi" style="display:flex;gap:.8rem;align-items:center"><div class="xoay"></div><div id="cho-chu">${noiDungDau}</div></div>`,
    khiMo: (hop) => { capNhat = (s) => { const e = hop.querySelector("#cho-chu"); if (e) e.innerHTML = s; }; },
  });
  return { doi: p, capNhat: (s) => capNhat(s), dong: () => dongHop() };
}

// ---------------------------------------------------------------- KHÁC

/** Chuỗi trạng thái Zalo cho người đọc. */
export const chuTrangThaiZalo = (t) => ({
  chua_dang_nhap: "Chưa kết nối", cho_quet_qr: "Đang chờ quét mã QR",
  dang_dang_nhap: "Đang kết nối…", da_ket_noi: "Đã kết nối", loi: "Lỗi kết nối",
}[t] || t);

export const nhanKetQuaGui = (t) => ({
  xong: '<span class="nhan n-ok">Đã gửi</span>',
  loi: '<span class="nhan n-xau">Lỗi</span>',
  bo_qua: '<span class="nhan n-xam">Bỏ qua</span>',
  cho: '<span class="nhan n-canh">Chờ gửi</span>',
  dang: '<span class="nhan n-coral">Đang gửi</span>',
}[t] || `<span class="nhan n-xam">${esc(t)}</span>`);

/** Bảng đơn giản từ mảng dữ liệu. cot = [{khoa, ten, so?, ve?}] */
export function bang(ds, cot, { trong = "Chưa có dữ liệu.", lop = "" } = {}) {
  if (!ds || !ds.length) return `<div class="trong"><span class="bd">📭</span>${esc(trong)}</div>`;
  return `<div class="bang-cuon"><table class="b ${lop}">
    <thead><tr>${cot.map((c) => `<th class="${c.so ? "so" : ""}">${esc(c.ten)}</th>`).join("")}</tr></thead>
    <tbody>${ds.map((d) => `<tr${d.__lop ? ` class="${d.__lop}"` : ""}>${cot.map((c) =>
      `<td class="${c.so ? "so" : ""}">${c.ve ? c.ve(d) : coHoac(d[c.khoa])}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

/** Lưới thời khoá biểu (dùng ở màn xem chi tiết). */
export function luoiTkb(tiet, loai = "lop") {
  const THU = [2, 3, 4, 5, 6, 7];
  const khoi = (buoi) => {
    const co = tiet.filter((t) => t.buoi === buoi);
    if (!co.length) return "";
    const maxT = Math.max(5, ...co.map((t) => t.tiet));
    const m = new Map(co.map((t) => [t.thu + "-" + t.tiet, t]));
    let h = `<h3 style="margin:.6rem 0 .3rem">${buoi === "S" ? "Buổi sáng" : "Buổi chiều"}</h3>
      <table class="tkb-luoi"><thead><tr><th>Tiết</th>${THU.map((t) => `<th>Thứ ${t}</th>`).join("")}</tr></thead><tbody>`;
    for (let i = 1; i <= maxT; i++) {
      h += `<tr><th>${i}</th>`;
      for (const t of THU) {
        const o = m.get(t + "-" + i);
        h += o
          ? `<td class="co"><span class="m">${esc(o.mon)}</span><span class="p">${esc(loai === "lop" ? (o.ma_gv || "") : (o.lop || ""))}</span></td>`
          : "<td></td>";
      }
      h += "</tr>";
    }
    return h + "</tbody></table>";
  };
  const h = khoi("S") + khoi("C");
  return h || '<div class="trong">Không có tiết nào.</div>';
}

/** Ghi nhật ký kiểu console trong trang. */
export function themDongLog(khung, chu, kieu = "") {
  if (!khung) return;
  const d = document.createElement("div");
  d.className = "d " + kieu;
  const gio = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  d.textContent = `[${gio}] ${chu}`;
  khung.appendChild(d);
  khung.scrollTop = khung.scrollHeight;
  while (khung.childElementCount > 500) khung.firstChild.remove();
}

/** Ô chọn nhiều giá trị (dạng danh sách tích). */
export function dsTich(ten, muc, daChon = [], { cao = "" } = {}) {
  const tap = new Set((daChon || []).map(String));
  return `<div class="ds-tich" ${cao ? `style="max-height:${cao}"` : ""} data-ds="${esc(ten)}">
    ${muc.map((m) => {
      const gt = String(m.gia_tri ?? m);
      const nhan = m.ten ?? m;
      return `<label class="tich"><input type="checkbox" name="${esc(ten)}" value="${esc(gt)}"${tap.has(gt) ? " checked" : ""}><span>${esc(nhan)}</span></label>`;
    }).join("")}
  </div>`;
}

export const layTich = (goc, ten) => $$(`input[name="${ten}"]:checked`, goc).map((x) => x.value);

/**
 * Ô chọn nhiều có thanh công cụ: đếm đã chọn, chọn hết / bỏ hết, và ô tìm khi danh sách dài.
 * Gắn hành vi một lần cho cả trang bằng ganDsTich().
 */
export function dsTichCoThanh(ten, nhan, muc, daChon = [], { cao = "", tim = false, goiY = "" } = {}) {
  const n = (daChon || []).length;
  return `<div class="o-loc" data-o-loc="${esc(ten)}">
    <div class="o-loc-dau">
      <label>${esc(nhan)}</label>
      <span class="o-loc-dem" data-dem="${esc(ten)}">${n ? n + " đã chọn" : "tất cả"}</span>
    </div>
    ${tim ? `<input type="search" class="o-loc-tim" data-tim="${esc(ten)}" placeholder="Tìm nhanh…">` : ""}
    ${dsTich(ten, muc, daChon, { cao })}
    <div class="o-loc-nut">
      <button type="button" class="lien" data-chon-het="${esc(ten)}">Chọn hết</button>
      <button type="button" class="lien" data-bo-het="${esc(ten)}">Bỏ hết</button>
      ${goiY ? `<span class="o-loc-goi">${esc(goiY)}</span>` : ""}
    </div>
  </div>`;
}

/** Gắn hành vi cho mọi ô chọn nhiều bên trong một khung (hộp thoại hoặc trang). */
export function ganDsTich(khung) {
  if (!khung) return;
  const demLai = (ten) => {
    const e = khung.querySelector(`[data-dem="${ten}"]`);
    if (!e) return;
    const n = $$(`input[name="${ten}"]:checked`, khung).length;
    e.textContent = n ? n + " đã chọn" : "tất cả";
    e.classList.toggle("co", n > 0);
  };
  khung.addEventListener("click", (e) => {
    const b = e.target.closest("[data-chon-het],[data-bo-het]");
    if (!b) return;
    e.preventDefault();
    const ten = b.dataset.chonHet || b.dataset.boHet;
    const bat = Boolean(b.dataset.chonHet);
    $$(`input[name="${ten}"]`, khung).forEach((x) => {
      if (x.closest("label")?.style.display !== "none") x.checked = bat;
    });
    demLai(ten);
  });
  khung.addEventListener("change", (e) => {
    const x = e.target.closest?.("input[type=checkbox][name]");
    if (x) demLai(x.name);
  });
  khung.addEventListener("input", (e) => {
    const o = e.target.closest?.("[data-tim]");
    if (!o) return;
    const v = o.value.trim().toLowerCase();
    const boDau = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
    const k = boDau(v);
    $$(`[data-ds="${o.dataset.tim}"] .tich`, khung).forEach((l) => {
      l.style.display = !k || boDau(l.textContent).includes(k) ? "" : "none";
    });
  });
}

/** Tải nội dung xuống dạng tệp (dùng cho bản in). */
export function docSoTrongChuoi(s) { return Number(String(s).replace(/[^\d.-]/g, "")) || 0; }

/**
 * Biến một phần tử thành VÙNG KÉO THẢ tệp.
 * Trả về danh sách ĐƯỜNG DẪN thật (lấy qua preload vì Electron đời mới bỏ File.path).
 */
export function vungTha(el, khiTha, { loc = /\.(xlsx|xlsm|docx)$/i } = {}) {
  if (!el) return () => {};
  const vao = (e) => { e.preventDefault(); e.stopPropagation(); el.classList.add("dang-tha"); };
  const ra = (e) => { e.preventDefault(); e.stopPropagation(); el.classList.remove("dang-tha"); };
  const tha = async (e) => {
    e.preventDefault(); e.stopPropagation();
    el.classList.remove("dang-tha");
    const ds = [...(e.dataTransfer?.files || [])]
      .map((f) => window.api.duongDanTep(f))
      .filter(Boolean);
    if (!ds.length) return baoCanh("Không đọc được tệp vừa thả. Thử dùng nút chọn tệp.");
    const hopLe = loc ? ds.filter((p) => loc.test(p)) : ds;
    if (!hopLe.length) return baoCanh("Chỉ nhận tệp Excel (.xlsx) và Word (.docx).");
    await khiTha(hopLe, ds.length - hopLe.length);
  };
  el.addEventListener("dragenter", vao);
  el.addEventListener("dragover", vao);
  el.addEventListener("dragleave", ra);
  el.addEventListener("drop", tha);
  return () => {
    el.removeEventListener("dragenter", vao);
    el.removeEventListener("dragover", vao);
    el.removeEventListener("dragleave", ra);
    el.removeEventListener("drop", tha);
  };
}

/** Khối HTML cho vùng kéo thả. */
export const htmlVungTha = (id, chu, phu = "") => `
  <div class="vung-tha" id="${id}">
    <div class="vt-bd">⬇</div>
    <div class="vt-chu"><b>${esc(chu)}</b>${phu ? `<span>${esc(phu)}</span>` : ""}</div>
    <button class="nut nho" data-chon-tep="${id}">Hoặc chọn tệp</button>
  </div>`;
