/**
 * Soi thư mục dữ liệu: nhận ra tệp ĐÚNG / THỪA / HỎNG và cảnh báo khi thư mục có dữ liệu
 * mới hơn lần nhập gần nhất (người dùng tự chép tệp vào mà quên nạp lại).
 */
import fs from "node:fs";
import path from "node:path";
import { mot } from "./db.js";
import { kiemTraTep, nhanDien, DU_LIEU, thuMucTkb } from "./kho-file.js";

/** Bộ tệp chuẩn mà một thư mục thời khoá biểu NÊN có (đúng như dữ liệu mẫu). */
export const BO_TEP_CHUAN = [
  { vai: "xlsx", ten: "Tệp Excel tổng (SS….xlsx)", bat_buoc: true,
    mo_ta: "Chứa bảng phân công giảng dạy và toàn bộ tiết học. Không có tệp này thì không nhập được." },
  { vai: "docx_gv", ten: "Word thời khoá biểu giáo viên (A4 hoặc A5)", bat_buoc: false,
    mo_ta: "Để cắt riêng cho từng giáo viên tải về in. Thiếu thì chỉ gửi được ảnh." },
  { vai: "docx_lop", ten: "Word thời khoá biểu lớp (A4 hoặc A5)", bat_buoc: false,
    mo_ta: "Để cắt riêng cho từng lớp gửi giáo viên chủ nhiệm. Thiếu thì chỉ gửi được ảnh." },
];

const THU_MUC_CON_HOP_LE = new Set(["gv", "lop", "anh", "da nhap"]);
const DUOI_VAN_PHONG = /\.(xlsx|xlsm|xls|docx|doc)$/i;

/** Mô tả vì sao một tệp bị coi là thừa / hỏng — nói rõ để người dùng biết phải làm gì. */
function moTaTepLa(ten) {
  const ext = path.extname(ten).toLowerCase();
  if (ten.startsWith("~$")) {
    return { muc: "thua", ly_do: "Tệp tạm do Microsoft Word/Excel tạo khi đang mở tệp.",
      cach_sua: "Đóng Word/Excel rồi xoá tệp này. Phần mềm tự bỏ qua nên không ảnh hưởng." };
  }
  if (ext === ".xls" || ext === ".doc") {
    return { muc: "hong", ly_do: `Định dạng cũ (${ext}) — phần mềm chỉ đọc .xlsx và .docx.`,
      cach_sua: "Mở bằng Word/Excel rồi Lưu thành dạng .xlsx hoặc .docx, hoặc xuất lại từ phần mềm xếp thời khoá biểu." };
  }
  if (ext === ".pdf") {
    return { muc: "thua", ly_do: "Tệp PDF không dùng để nhập dữ liệu (phần mềm cần tệp Excel/Word gốc).",
      cach_sua: "Chuyển tệp PDF ra khỏi thư mục này, hoặc cứ để lại — phần mềm bỏ qua." };
  }
  if (/\.(png|jpe?g|gif|bmp|webp)$/i.test(ten)) {
    return { muc: "thua", ly_do: "Tệp ảnh — phần mềm tự tạo ảnh thời khoá biểu, không đọc ảnh có sẵn.",
      cach_sua: "Để lại cũng không sao; ảnh do phần mềm tạo nằm trong thư mục con anh\\." };
  }
  if (/\.(zip|rar|7z)$/i.test(ten)) {
    return { muc: "thua", ly_do: "Tệp nén — phần mềm không tự giải nén.",
      cach_sua: "Giải nén rồi chép các tệp .xlsx/.docx bên trong vào thư mục này." };
  }
  return { muc: "thua", ly_do: `Phần mềm không dùng loại tệp này (${ext || "không có phần mở rộng"}).`,
    cach_sua: "Chỉ cần tệp Excel tổng và tệp Word thời khoá biểu; các tệp khác có thể xoá cho gọn." };
}

/**
 * Soi một thư mục dữ liệu: liệt kê TỪNG tệp là đúng loại gì, thừa hay hỏng ra sao.
 * @param {string} duongDan thư mục cần soi
 * @param {{bat_buoc_xlsx?:boolean}} tuyChon
 */
export async function soiThuMuc(duongDan, { bat_buoc_xlsx = true } = {}) {
  if (!fs.existsSync(duongDan)) {
    return { ok: false, duong_dan: duongDan, loi: ["Thư mục không tồn tại."], tep: [], thieu: [], thua: [], hong: [] };
  }
  const muc = fs.readdirSync(duongDan, { withFileTypes: true });
  const tep = [], thua = [], hong = [];
  const thayVai = {};

  for (const e of muc) {
    if (e.isDirectory()) {
      if (!THU_MUC_CON_HOP_LE.has(e.name.toLowerCase())) {
        thua.push({ ten: e.name, la_thu_muc: true, ly_do: "Thư mục con lạ — phần mềm chỉ dùng gv\\, lop\\, anh\\.",
          cach_sua: "Để lại cũng không sao, phần mềm bỏ qua." });
      }
      continue;
    }
    const ten = e.name;
    const dd = path.join(duongDan, ten);
    // Bắt tệp tạm và định dạng đời cũ TRƯỚC — để báo đúng lý do thay vì "không nhận ra nội dung".
    const ext = path.extname(ten).toLowerCase();
    if (!DUOI_VAN_PHONG.test(ten) || ten.startsWith("~$") || ext === ".doc" || ext === ".xls") {
      const m = moTaTepLa(ten);
      (m.muc === "hong" ? hong : thua).push({ ten, ...m });
      continue;
    }
    const kq = await kiemTraTep(dd);
    tep.push(kq);
    if (kq.loai === "khong_ro" || !kq.dung_duoc) {
      hong.push({
        ten, ly_do: kq.kiem.filter((k) => k.muc === "loi").map((k) => k.noi_dung).join(" ") || "Không nhận ra nội dung tệp.",
        cach_sua: kq.kiem.find((k) => k.muc === "loi")?.cach_sua || "Xuất lại tệp từ phần mềm xếp thời khoá biểu.",
      });
      continue;
    }
    const vai = kq.loai === "ss_xlsx" ? "xlsx" : kq.loai === "docx_gv" ? "docx_gv" : kq.loai === "docx_lop" ? "docx_lop" : "ds_gv";
    if (thayVai[vai]) {
      thua.push({ ten, ly_do: `Đã có một tệp cùng loại (${path.basename(thayVai[vai])}) trong thư mục.`,
        cach_sua: "Mỗi loại chỉ nên để một tệp; phần mềm sẽ dùng tệp đầu tiên." });
    } else thayVai[vai] = dd;
  }

  const thieu = BO_TEP_CHUAN
    .filter((b) => (b.bat_buoc || b.vai !== "xlsx") && !thayVai[b.vai])
    .filter((b) => (b.vai === "xlsx" ? bat_buoc_xlsx : true))
    .map((b) => ({ ...b, muc: b.bat_buoc ? "bat_buoc" : "nen_co" }));

  return {
    ok: hong.length === 0 && !thieu.some((t) => t.muc === "bat_buoc"),
    duong_dan: duongDan, tep, tim_thay: thayVai, thieu, thua, hong,
    tom_tat:
      hong.length ? `${hong.length} tệp hỏng/sai định dạng.`
      : thieu.some((t) => t.muc === "bat_buoc") ? "Thiếu tệp Excel tổng — chưa nhập được."
      : thieu.length ? `Dùng được, nhưng thiếu ${thieu.length} tệp nên chức năng bị hạn chế.`
      : thua.length ? `Đủ tệp cần thiết, có ${thua.length} tệp thừa (bỏ qua được).`
      : "Thư mục đủ và đúng chuẩn.",
  };
}

const luc = (p) => { try { return fs.statSync(p).mtimeMs; } catch { return 0; } };

/**
 * Duyệt kho dữ liệu, ĐỐI CHIẾU với những gì đã nhập vào phần mềm.
 * Cảnh báo khi: thư mục có dữ liệu nhưng chưa nhập, hoặc tệp mới hơn lần nhập gần nhất.
 */
export async function duyetKhoVaDoiChieu(thuMucGoc, { soiKy = false } = {}) {
  const goc = path.join(thuMucGoc, DU_LIEU);
  const kq = [];
  if (!fs.existsSync(goc)) return { muc: [], canh_bao: [] };

  for (const nam of fs.readdirSync(goc, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const tNam = path.join(goc, nam.name);
    for (const so of fs.readdirSync(tNam, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const t = path.join(tNam, so.name);
      const soTkb = Number(String(so.name).replace(/\D+/g, "")) || null;
      const tepTrong = fs.readdirSync(t, { withFileTypes: true }).filter((e) => e.isFile() && DUOI_VAN_PHONG.test(e.name) && !e.name.startsWith("~$"));
      if (!tepTrong.length) continue;

      const tkb = soTkb == null ? null : mot(
        "SELECT * FROM tkb WHERE nam_hoc=? AND so_tkb=? ORDER BY id DESC LIMIT 1", nam.name, soTkb
      );
      const moiNhat = Math.max(...tepTrong.map((e) => luc(path.join(t, e.name))));
      const nhapLuc = tkb?.nhap_luc ? new Date(tkb.nhap_luc.replace(" ", "T")).getTime() : 0;

      const m = {
        nam_hoc: nam.name, so_tkb: soTkb, thu_muc: t, ten_thu_muc: so.name,
        so_tep: tepTrong.length,
        tep: tepTrong.map((e) => e.name),
        tep_moi_nhat_luc: new Date(moiNhat).toLocaleString("vi-VN"),
        da_nhap: Boolean(tkb),
        tkb_id: tkb?.id || null,
        nhap_luc: tkb?.nhap_luc || "",
        phien_ban: tkb?.phien_ban || 0,
        trang_thai: "",
        canh_bao: "",
      };
      if (!tkb) {
        m.trang_thai = "chua_nap";
        m.canh_bao = `Thư mục có ${tepTrong.length} tệp nhưng CHƯA nạp vào phần mềm. Bấm "Nạp thư mục này" để dùng.`;
      } else if (moiNhat > nhapLuc + 60000) {
        m.trang_thai = "co_ban_moi";
        m.canh_bao =
          `Tệp trong thư mục MỚI HƠN lần nạp gần nhất (tệp sửa lúc ${m.tep_moi_nhat_luc}, nạp lúc ${tkb.nhap_luc}). ` +
          "Có thể bạn đã chép thời khoá biểu mới vào đây mà chưa nạp lại — bấm \"Nạp lại\" để cập nhật.";
      } else {
        m.trang_thai = "da_nhap";
      }
      if (soiKy) m.soi = await soiThuMuc(t);
      kq.push(m);
    }
  }

  kq.sort((a, b) => String(b.nam_hoc).localeCompare(a.nam_hoc) || (b.so_tkb || 0) - (a.so_tkb || 0));
  const canhBao = kq.filter((x) => x.canh_bao).map((x) => `[${x.nam_hoc} · ${x.ten_thu_muc}] ${x.canh_bao}`);
  return { muc: kq, canh_bao: canhBao, chua_nap: kq.filter((x) => x.trang_thai === "chua_nap").length,
    co_ban_moi: kq.filter((x) => x.trang_thai === "co_ban_moi").length };
}

/** Kiểm tra nhanh một thư mục TKB cụ thể (dùng khi người dùng bấm vào một dòng trong kho). */
export async function kiemThuMucTkb(thuMucGoc, namHoc, soTkb) {
  const t = thuMucTkb(thuMucGoc, namHoc, soTkb);
  const soi = await soiThuMuc(t);
  const tkb = mot("SELECT * FROM tkb WHERE nam_hoc=? AND so_tkb=? ORDER BY id DESC LIMIT 1", namHoc, soTkb);
  return { ...soi, da_nhap: Boolean(tkb), tkb_id: tkb?.id || null, nhap_luc: tkb?.nhap_luc || "" };
}
