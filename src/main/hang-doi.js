/**
 * Hàng đợi gửi Zalo: tuần tự, giãn nhịp, tự dừng khi lỗi liên tiếp, lưu trạng thái vào CSDL
 * để tắt app giữa chừng mở lại vẫn tiếp tục đúng chỗ (không gửi ảnh hai lần).
 */
import { mot, nhieu, chay, layCaiDat } from "./db.js";
import { ghiLichSu } from "./kho-gui.js";
import * as zaloThat from "./zalo.js";

// Điểm tiêm phụ thuộc: kiểm thử thay bằng Zalo giả, chạy thật thì dùng zalo.js.
let zalo = zaloThat;
export function datZaloThu(z) { zalo = z ? { ...zaloThat, ...z } : zaloThat; }

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
const so = (k, md) => { const v = Number(layCaiDat(k)); return Number.isFinite(v) && v > 0 ? v : md; };

export const tinhTrang = {
  dang_chay: false, dot_id: null, buoc: "", da: 0, tong: 0,
  loi_lien_tiep: 0, tam_dung: false, ly_do_dung: "",
};

let yeuCauDung = false;
let bao = null;   // hàm đẩy tiến độ lên giao diện

export function datBaoTienDo(fn) { bao = fn; }
const day = (kieu, d = {}) => { try { bao?.({ kieu, ...tinhTrang, ...d }); } catch { /* */ } };

function capNhatViec(id, d) {
  const cot = Object.keys(d);
  chay(
    `UPDATE viec_gui SET ${cot.map((c) => c + "=?").join(",")}, cap_nhat_luc=datetime('now','localtime') WHERE id=?`,
    ...cot.map((c) => d[c]), id
  );
}

function demLai(dotId) {
  const d = mot(
    `SELECT COUNT(*) tong,
       SUM(CASE WHEN trang_thai='xong' THEN 1 ELSE 0 END) xong,
       SUM(CASE WHEN trang_thai='loi' THEN 1 ELSE 0 END) loi,
       SUM(CASE WHEN trang_thai='bo_qua' THEN 1 ELSE 0 END) bo_qua,
       SUM(CASE WHEN trang_thai='cho' THEN 1 ELSE 0 END) cho
     FROM viec_gui WHERE dot_id=?`, dotId
  );
  chay("UPDATE dot_gui SET da_gui=?, loi=?, bo_qua=? WHERE id=?", d.xong || 0, d.loi || 0, d.bo_qua || 0, dotId);
  return d;
}

/**
 * GIỚI HẠN AN TOÀN — giữ nhịp gửi ở mức người thật, tránh bị Zalo hạn chế hoặc khoá tài khoản.
 * Đếm theo 24 giờ gần nhất trên LỊCH SỬ GỬI (tính cả các đợt trước, kể cả đã đóng app).
 */
export function demGanDay() {
  // Hạn mức thuộc về TỪNG TÀI KHOẢN ZALO: đổi sang tài khoản khác là bộ đếm tính lại từ đầu,
  // vì Zalo hạn chế theo tài khoản chứ không theo máy.
  const uid = String(zalo.trangThai?.uid || "");
  const loc = uid ? "AND l.zalo_uid_gui=?" : "";
  const t = uid ? [uid] : [];
  const d = mot(
    `SELECT COUNT(*) so_tin,
            COUNT(DISTINCT l.nguoi_loai || ':' || l.nguoi_id) so_nguoi
     FROM lich_su_gui l
     WHERE l.ket_qua='xong' AND l.luc >= datetime('now','localtime','-24 hours') ${loc}`, ...t
  );
  // Tách người đã kết bạn / chưa kết bạn: rủi ro bị Zalo để ý nằm gần hết ở nhóm CHƯA kết bạn.
  // Dùng cột la_ban GHI LÚC GỬI, không tra lại bảng giáo viên — vì trạng thái kết bạn có thể đã đổi.
  const chiaNhom = (laBan) => mot(
    `SELECT COUNT(DISTINCT l.nguoi_loai || ':' || l.nguoi_id) n
     FROM lich_su_gui l
     WHERE l.ket_qua='xong' AND l.luc >= datetime('now','localtime','-24 hours') ${loc}
       AND l.la_ban ${laBan ? "=" : "<>"} 1`, ...t
  ).n || 0;
  return {
    so_tin: d.so_tin || 0, so_nguoi: d.so_nguoi || 0,
    so_ban: chiaNhom(true), so_la: chiaNhom(false),
    tai_khoan: uid || "(chưa kết nối)",
  };
}

/** Kiểm tra trước khi gửi: còn gửi được bao nhiêu người nữa. */
export function kiemGioiHan(dotId = null) {
  const ganDay = demGanDay();
  const hanBan = so("gioi_han_ban_24h", 300);
  const hanLa = so("gioi_han_la_24h", 30);
  const hanTin = so("gioi_han_tin_24h", 700);
  const hanDot = so("gioi_han_moi_dot", 120);
  const conBan = Math.max(0, hanBan - ganDay.so_ban);
  const conLa = Math.max(0, hanLa - ganDay.so_la);
  const conTin = Math.max(0, hanTin - ganDay.so_tin);

  let soTrongDot = 0, dotBan = 0, dotLa = 0;
  if (dotId) {
    const d = mot(
      `SELECT COUNT(DISTINCT nguoi_loai || ':' || nguoi_id) tong,
              COUNT(DISTINCT CASE WHEN la_ban=1 THEN nguoi_loai || ':' || nguoi_id END) ban,
              COUNT(DISTINCT CASE WHEN la_ban<>1 THEN nguoi_loai || ':' || nguoi_id END) la
       FROM viec_gui WHERE dot_id=? AND trang_thai='cho'`, dotId
    );
    soTrongDot = d.tong || 0; dotBan = d.ban || 0; dotLa = d.la || 0;
  }

  const canhBao = [];
  if (conBan === 0) canhBao.push(`Chạm giới hạn an toàn ${hanBan} người đã kết bạn trong 24 giờ. Chờ sang ngày mai.`);
  else if (dotBan && conBan < dotBan) canhBao.push(`Hôm nay còn gửi được ${conBan} người đã kết bạn, đợt này có ${dotBan}. Phần vượt giữ cho lần sau.`);
  if (conLa === 0 && dotLa) canhBao.push(`Chạm giới hạn ${hanLa} người chưa kết bạn trong 24 giờ. Hãy kết bạn trước rồi gửi.`);
  else if (dotLa && conLa < dotLa) canhBao.push(`Đợt này có ${dotLa} người chưa kết bạn, hôm nay chỉ còn gửi an toàn ${conLa}. Nên kết bạn trước.`);
  if (conTin === 0) canhBao.push(`Chạm giới hạn ${hanTin} tin trong 24 giờ.`);
  if (soTrongDot > hanDot) canhBao.push(`${soTrongDot} người, vượt mức khuyến nghị ${hanDot}. Nên chia nhiều đợt.`);

  // CHẶN khi hết mức của nhóm mà đợt đang cần gửi, hoặc hết mức tin.
  const chan = conTin === 0
    || (conBan === 0 && (dotBan > 0 || !dotId))
    || (conLa === 0 && dotLa > 0);

  return {
    gan_day: ganDay,
    han_ban: hanBan, han_la: hanLa, han_tin: hanTin, han_dot: hanDot,
    con_ban: conBan, con_la: conLa, con_tin: conTin,
    so_trong_dot: soTrongDot, dot_ban: dotBan, dot_la: dotLa,
    // giữ tên cũ cho giao diện: "còn gửi được" = mức của nhóm đã kết bạn
    con_nguoi: conBan, han_nguoi: hanBan,
    chan, canh_bao: canhBao,
  };
}

/** Bắt đầu (hoặc tiếp tục) chạy một đợt gửi. */
export async function chay_(dotId) {
  if (tinhTrang.dang_chay) return { ok: false, loi: ["Đang có đợt gửi chạy dở. Hãy chờ hoặc tạm dừng đợt đó."] };
  if (!zalo.daKetNoi()) return { ok: false, loi: ["Chưa kết nối Zalo. Vào màn Kết nối Zalo quét QR trước."] };
  const dot = mot("SELECT * FROM dot_gui WHERE id=?", dotId);
  if (!dot) return { ok: false, loi: ["Không tìm thấy đợt gửi."] };
  // Hồi phục TRƯỚC khi đếm: tắt app giữa chừng thì việc còn dở đang ở trạng thái 'dang'.
  // Đếm giới hạn chỉ nhìn việc ở trạng thái 'cho', nên đếm trước khi hồi phục sẽ ra 0 việc
  // và báo nhầm "chạm giới hạn" — đợt dở không bao giờ chạy tiếp được.
  chay("UPDATE viec_gui SET trang_thai='cho' WHERE dot_id=? AND trang_thai IN ('dang','cho_nhom_khac')", dotId);

  const gh0 = kiemGioiHan(dotId);
  const guiDuocAi = gh0.con_tin > 0 && ((gh0.dot_ban > 0 && gh0.con_ban > 0) || (gh0.dot_la > 0 && gh0.con_la > 0));
  if (!guiDuocAi) return { ok: false, cham_gioi_han: true, gioi_han: gh0, loi: gh0.canh_bao.length ? gh0.canh_bao : ["Chạm giới hạn an toàn trong 24 giờ."] };

  chay("UPDATE dot_gui SET trang_thai='dang' WHERE id=?", dotId);

  Object.assign(tinhTrang, {
    dang_chay: true, dot_id: dotId, buoc: "Bắt đầu", loi_lien_tiep: 0,
    tam_dung: false, ly_do_dung: "",
    da: demLai(dotId).xong || 0, tong: mot("SELECT COUNT(*) n FROM viec_gui WHERE dot_id=? AND trang_thai<>'bo_qua'", dotId).n,
  });
  yeuCauDung = false;
  day("bat_dau");

  const nhip2TinMin = so("nhip_2_tin_min", 3000), nhip2TinMax = so("nhip_2_tin_max", 6000);
  const nhip2NguoiMin = so("nhip_2_nguoi_min", 8000), nhip2NguoiMax = so("nhip_2_nguoi_max", 15000);
  const nghiMoiN = so("nghi_moi_n", 10), nghiMin = so("nghi_min", 60000), nghiMax = so("nghi_max", 90000);
  const dungSauNLoi = so("dung_sau_n_loi", 3);

  let daGuiLuot = 0;
  try {
    for (;;) {
      if (yeuCauDung) { tinhTrang.tam_dung = true; tinhTrang.ly_do_dung = tinhTrang.ly_do_dung || "Người dùng tạm dừng."; break; }
      const v = mot("SELECT * FROM viec_gui WHERE dot_id=? AND trang_thai='cho' ORDER BY id LIMIT 1", dotId);
      if (!v) break;
      // Chỉ chặn theo ĐÚNG nhóm của người sắp gửi: hết mức người lạ thì vẫn gửi tiếp cho bạn bè.
      const gh = kiemGioiHan();
      const hetMuc = gh.con_tin === 0 || (v.la_ban === 1 ? gh.con_ban === 0 : gh.con_la === 0);
      if (hetMuc) {
        const conLai = mot(
          `SELECT COUNT(*) n FROM viec_gui WHERE dot_id=? AND trang_thai='cho'
             AND ${gh.con_tin === 0 ? "1=1" : (v.la_ban === 1 ? "la_ban=1" : "la_ban<>1")}`, dotId
        ).n;
        // Còn người thuộc nhóm khác thì đẩy mục này xuống cuối, gửi tiếp thay vì dừng cả đợt
        const conNhomKhac = mot(
          "SELECT COUNT(*) n FROM viec_gui WHERE dot_id=? AND trang_thai='cho' AND id<>?", dotId, v.id
        ).n - conLai + 1;
        if (gh.con_tin > 0 && conNhomKhac > 0 && daGuiLuot < tinhTrang.tong) {
          capNhatViec(v.id, { trang_thai: "cho_nhom_khac" });
          continue;
        }
        tinhTrang.tam_dung = true;
        tinhTrang.ly_do_dung = (gh.canh_bao[0] || "Chạm giới hạn an toàn.") + " Phần còn lại vẫn trong hàng chờ.";
        yeuCauDung = true;
        day("cham_gioi_han", { gioi_han: gh });
        break;
      }
      capNhatViec(v.id, { trang_thai: "dang" });
      tinhTrang.buoc = `${v.nguoi_ten} — ${v.loai === "lop" ? "TKB lớp " + v.ma : "TKB giáo viên"}`;
      day("dang_gui", { viec: v });

      try {
        let msgAnh = v.msg_id_anh, msgFile = v.msg_id_file;

        if (v.buoc === "gui_anh" && v.anh_path) {
          const r = await zalo.guiAnh(v.uid, v.anh_path, v.caption, { width: v.anh_w, height: v.anh_h });
          msgAnh = r.msg_id || "";
          capNhatViec(v.id, { buoc: v.docx_path ? "gui_file" : "xong", msg_id_anh: msgAnh });
          v.buoc = v.docx_path ? "gui_file" : "xong";
          if (v.docx_path) await nghi(zalo.ngau(nhip2TinMin, nhip2TinMax));
        } else if (v.buoc === "gui_anh" && !v.anh_path) {
          // Không có ảnh: lời nhắn đi kèm tệp, hoặc gửi riêng nếu cũng không có tệp
          if (v.docx_path && v.caption) {
            await zalo.guiChu(v.uid, v.caption);
            await nghi(zalo.ngau(nhip2TinMin, nhip2TinMax));
          }
          capNhatViec(v.id, { buoc: v.docx_path ? "gui_file" : "xong" });
          v.buoc = v.docx_path ? "gui_file" : "xong";
        }

        if (v.buoc === "gui_file" && v.docx_path) {
          const r = await zalo.guiTep(v.uid, v.docx_path);
          msgFile = r.msg_id || "";
          capNhatViec(v.id, { buoc: "xong", msg_id_file: msgFile });
        }

        capNhatViec(v.id, { trang_thai: "xong", gui_luc: new Date().toLocaleString("sv-SE").replace("T", " "), loi_cuoi: "", ma_loi: null });
        ghiLichSu({ ...v, msg_id_anh: msgAnh, msg_id_file: msgFile }, "xong", {
          msg_id_anh: msgAnh, msg_id_file: msgFile, zalo_uid_gui: zalo.trangThai.uid || "",
        });
        tinhTrang.loi_lien_tiep = 0;
        tinhTrang.da = demLai(dotId).xong || 0;
        daGuiLuot++;
        day("xong_mot", { viec: { ...v, trang_thai: "xong" } });

        if (daGuiLuot % nghiMoiN === 0) {
          tinhTrang.buoc = `Nghỉ giữa chừng cho an toàn (đã gửi ${daGuiLuot} người)`;
          day("nghi");
          await nghi(zalo.ngau(nghiMin, nghiMax));
        } else {
          await nghi(zalo.ngau(nhip2NguoiMin, nhip2NguoiMax));
        }
      } catch (e) {
        const tamThoi = zalo.loiTamThoi(e);
        const lan = (v.so_lan_thu || 0) + 1;
        if (tamThoi && lan <= 3) {
          capNhatViec(v.id, { trang_thai: "cho", so_lan_thu: lan, loi_cuoi: String(e?.message || e) });
          day("thu_lai", { viec: v, lan, loi: String(e?.message || e) });
          await nghi(so("lui_khi_loi_ms", 10000) * lan);
          continue;
        }
        capNhatViec(v.id, {
          trang_thai: "loi", so_lan_thu: lan,
          ma_loi: e?.code ?? null, loi_cuoi: String(e?.message || e),
        });
        ghiLichSu(v, "loi", { ma_loi: e?.code ?? null, loi: String(e?.message || e), zalo_uid_gui: zalo.trangThai.uid || "" });
        demLai(dotId);
        tinhTrang.loi_lien_tiep++;
        day("loi_mot", { viec: v, loi: String(e?.message || e), ma_loi: e?.code ?? null });

        if (zalo.loiMatPhien(e)) {
          tinhTrang.ly_do_dung = "Phiên Zalo hết hạn. Quét lại mã QR rồi bấm Tiếp tục.";
          yeuCauDung = true;
        } else if (tinhTrang.loi_lien_tiep >= dungSauNLoi) {
          tinhTrang.ly_do_dung = `Dừng vì ${tinhTrang.loi_lien_tiep} lỗi liên tiếp.`;
          yeuCauDung = true;
        }
        await nghi(zalo.ngau(5000, 8000));
      }
    }
  } finally {
    chay("UPDATE viec_gui SET trang_thai='cho' WHERE dot_id=? AND trang_thai='cho_nhom_khac'", dotId);
    const d = demLai(dotId);
    const xongHet = (d.cho || 0) === 0 && !yeuCauDung;
    chay(
      "UPDATE dot_gui SET trang_thai=?, xong_luc=? WHERE id=?",
      xongHet ? "xong" : (tinhTrang.ly_do_dung ? "dung_loi" : "tam_dung"),
      xongHet ? new Date().toLocaleString("sv-SE").replace("T", " ") : "", dotId
    );
    Object.assign(tinhTrang, { dang_chay: false, buoc: xongHet ? "Hoàn tất" : (tinhTrang.ly_do_dung || "Đã tạm dừng") });
    day(xongHet ? "hoan_tat" : "da_dung", { thong_ke: d });
  }
  return { ok: true, ...demLai(dotId) };
}

export function tamDung(lyDo = "") {
  if (!tinhTrang.dang_chay) return { ok: false, loi: ["Không có đợt gửi nào đang chạy."] };
  yeuCauDung = true;
  tinhTrang.ly_do_dung = lyDo || "Người dùng tạm dừng.";
  return { ok: true };
}

/** Đặt lại các mục lỗi về hàng chờ để gửi lại. */
export function guiLaiLoi(dotId) {
  const n = chay(
    "UPDATE viec_gui SET trang_thai='cho', so_lan_thu=0, loi_cuoi='', ma_loi=NULL WHERE dot_id=? AND trang_thai='loi'",
    dotId
  );
  demLai(dotId);
  return { ok: true, n: n.changes };
}

/** Gửi thử một số ít người trước khi chạy cả đợt. */
export async function guiThu(dotId, soNguoi = 3) {
  const ds = nhieu("SELECT id FROM viec_gui WHERE dot_id=? AND trang_thai='cho' ORDER BY id LIMIT ?", dotId, soNguoi);
  if (!ds.length) return { ok: false, loi: ["Không còn mục nào để gửi thử."] };
  const giu = nhieu("SELECT id FROM viec_gui WHERE dot_id=? AND trang_thai='cho' AND id NOT IN (" + ds.map(() => "?").join(",") + ")",
    dotId, ...ds.map((x) => x.id));
  // Tạm cất phần còn lại, chạy, rồi trả về hàng chờ
  for (const g of giu) chay("UPDATE viec_gui SET trang_thai='tam_cat' WHERE id=?", g.id);
  const kq = await chay_(dotId);
  for (const g of giu) chay("UPDATE viec_gui SET trang_thai='cho' WHERE id=? AND trang_thai='tam_cat'", g.id);
  chay("UPDATE dot_gui SET trang_thai='tam_dung' WHERE id=? AND trang_thai='xong'", dotId);
  demLai(dotId);
  return { ...kq, gui_thu: ds.length };
}

export const layTinhTrang = () => ({ ...tinhTrang });
