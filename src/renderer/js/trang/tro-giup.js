/** Hướng dẫn sử dụng đầy đủ, đọc ngay trong phần mềm (không cần mạng). */
import { esc, $, $$ } from "../chung.js";
import { moHopRuiRo } from "../rui-ro.js";
import { MUC_TRO_GIUP as MUC } from "../noi-dung.js";
import { moHopCapNhat } from "../cap-nhat.js";
import { di } from "../app.js";


export async function ve(khung) {
  khung.innerHTML = `
  <div class="dau-trang">
    <div><h1>Hướng dẫn sử dụng</h1>
      </div>
    <div class="hang-nut">
      <input type="search" id="tim-hd" placeholder="Tìm trong hướng dẫn…" style="max-width:260px">
      <button class="nut" id="kiem-cn">Kiểm tra cập nhật</button>
    </div>
  </div>
  <div style="display:flex;gap:1rem;align-items:flex-start">
    <nav class="the" style="flex:0 0 260px;position:sticky;top:0;max-height:calc(100vh - 120px);overflow-y:auto">
      <h3 style="margin:0 0 .4rem">Mục lục</h3>
      ${MUC.map((m) => `<button class="mnu" data-muc="${m.ma}" style="font-size:.85rem"><span>${esc(m.ten)}</span></button>`).join("")}
    </nav>
    <div style="flex:1;min-width:0" id="noi-hd">
      ${MUC.map((m) => `<section class="the" id="hd-${m.ma}"><h2>${esc(m.ten)}</h2>${m.noi}</section>`).join("")}
      <div class="the giua">
        <p class="mo">Còn vướng chỗ nào? Mở mục Cài đặt để xem nhật ký hoạt động, hoặc xem lại điều khoản và rủi ro.</p>
        <div class="hang-nut" style="justify-content:center">
          <button class="nut" id="xem-rui-ro">Điều khoản và rủi ro</button>
          <button class="nut" id="di-cai-dat">Mở Cài đặt</button>
        </div>
      </div>
    </div>
  </div>`;

  khung.querySelector("nav").addEventListener("click", (e) => {
    const b = e.target.closest("[data-muc]");
    if (!b) return;
    khung.querySelector("#hd-" + b.dataset.muc)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  khung.querySelector("#tim-hd").addEventListener("input", (e) => {
    const v = e.target.value.trim().toLowerCase();
    $$("#noi-hd section", khung).forEach((s) => {
      s.hidden = Boolean(v) && !s.textContent.toLowerCase().includes(v);
    });
    $$("nav [data-muc]", khung).forEach((b) => {
      const s = khung.querySelector("#hd-" + b.dataset.muc);
      b.style.display = s && s.hidden ? "none" : "";
    });
  });

  khung.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "xem-rui-ro") moHopRuiRo({});
    if (b.id === "di-cai-dat") di("cai-dat");
    if (b.id === "kiem-cn") moHopCapNhat({ tuTay: true });
  });
}
