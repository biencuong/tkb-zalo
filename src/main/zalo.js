/**
 * Kết nối Zalo cá nhân bằng zca-js: quét QR → lưu phiên → dò UID theo số điện thoại → gửi tin.
 *
 * CẢNH BÁO: zca-js là thư viện KHÔNG CHÍNH THỨC, mô phỏng Zalo Web. Gửi nhiều tin cho người lạ
 * có thể khiến tài khoản bị hạn chế hoặc khoá. Mọi nhịp gửi đều cố ý chậm.
 *
 * Bài học đã đúc kết (OSZalo-247 + cầu nối SmartScheduler):
 *  - KHÔNG xoá file phiên khi login lỗi tạm thời (mạng chập) — cookie vẫn còn giá trị.
 *  - Ghi lại phiên định kỳ vì zca-js xoay cookie trong RAM.
 *  - Gửi ảnh bằng Buffer + metadata để tránh lỗi tách tên file theo "/" trên Windows.
 *  - sendMessage với attachments bắt buộc có msg (dù là chuỗi rỗng), nếu không sẽ ném TypeError.
 */
import fs from "node:fs";
import path from "node:path";
import { chuanSdt } from "./khop.js";

let Zalo = null, ThreadType = null;
let api = null;
let duongDanPhien = "";
let hetHanGhiPhien = null;

export const trangThai = {
  status: "chua_dang_nhap",   // chua_dang_nhap | cho_quet_qr | dang_dang_nhap | da_ket_noi | loi
  qr: null, uid: null, ten: null, sdt: null, loi: null,
  ket_noi_luc: null,
};

async function napThuVien() {
  if (Zalo) return;
  const mod = await import("zca-js");
  Zalo = mod.Zalo;
  ThreadType = mod.ThreadType;
}

export function datDuongDanPhien(p) { duongDanPhien = p; }

function luuPhien() {
  try {
    if (!api || !duongDanPhien) return;
    const ctx = api.getContext?.();
    if (!ctx) return;
    // Lưu GỌN: chỉ thứ cần để đăng nhập lại (getContext trả cả đống cấu hình không cần thiết)
    const goi = {
      imei: ctx.imei,
      userAgent: ctx.userAgent,
      language: ctx.language || "vi",
      cookie: ctx.cookie?.toJSON ? ctx.cookie.toJSON().cookies : ctx.cookie,
    };
    if (!goi.imei || !goi.cookie) return;
    const tmp = duongDanPhien + ".tmp";
    fs.mkdirSync(path.dirname(duongDanPhien), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(goi), { mode: 0o600 });
    fs.renameSync(tmp, duongDanPhien);
  } catch (e) { console.error("[zalo] lưu phiên lỗi:", e?.message || e); }
}

function batGhiPhienDinhKy() {
  if (hetHanGhiPhien) return;
  hetHanGhiPhien = setInterval(() => { if (trangThai.status === "da_ket_noi") luuPhien(); }, 30 * 60 * 1000);
  hetHanGhiPhien.unref?.();
}

let dangNghe = false;
let baoTrangThaiTin = null;

/** Đăng ký nơi nhận tin báo "đã tới máy" / "đã xem" từ Zalo. */
export function datBaoTrangThaiTin(fn) { baoTrangThaiTin = fn; }

/**
 * BẮT BUỘC bật trình nghe WebSocket sau khi đăng nhập.
 *
 * Thư viện tải tệp đính kèm (không phải ảnh) theo kiểu: gửi từng phần lên máy chủ, rồi
 * ĐỢI SỰ KIỆN "file_done" bay về qua WebSocket mới coi là xong. Không bật trình nghe thì
 * sự kiện đó không bao giờ tới, lời gọi gửi tệp treo vĩnh viễn — ảnh vẫn gửi được vì ảnh
 * không phải đợi sự kiện nào. Đây đúng là lỗi "nhận được ảnh mà không thấy tệp Word".
 */
function batTrinhNghe() {
  if (!api?.listener || dangNghe) return;
  try {
    api.listener.on("error", (e) => { console.error("[zalo] trình nghe lỗi:", e?.message || e); });
    api.listener.on("closed", () => { dangNghe = false; });

    // Zalo báo lại khi tin ĐÃ TỚI MÁY người nhận và khi họ ĐÃ XEM.
    // Đây là bằng chứng thật, khác hẳn với "app đã gửi đi".
    const gom = (ds) => (Array.isArray(ds) ? ds : [ds])
      .map((x) => String(x?.data?.msgId ?? x?.msgId ?? "")).filter(Boolean);
    api.listener.on("delivered_messages", (ds) => { try { baoTrangThaiTin?.("nhan", gom(ds)); } catch { /* */ } });
    api.listener.on("seen_messages", (ds) => { try { baoTrangThaiTin?.("xem", gom(ds)); } catch { /* */ } });
    api.listener.start({ retryOnClose: true });
    dangNghe = true;
  } catch (e) {
    dangNghe = false;
    console.error("[zalo] không bật được trình nghe:", e?.message || e);
  }
}

function tatTrinhNghe() {
  if (!api?.listener || !dangNghe) return;
  try { api.listener.stop(); } catch { /* */ }
  dangNghe = false;
}

export const dangNgheSuKien = () => dangNghe;

export const coPhienCu = () => Boolean(duongDanPhien && fs.existsSync(duongDanPhien));

/**
 * Đăng nhập. quetMoi=true → bỏ phiên cũ, hiện QR mới.
 * Chạy nền; giao diện hỏi trangThai để lấy ảnh QR và kết quả.
 */
export async function dangNhap({ quetMoi = false, onDoi } = {}) {
  if (trangThai.status === "dang_dang_nhap" || trangThai.status === "cho_quet_qr") return trangThai;
  await napThuVien();
  const bao = () => { try { onDoi?.({ ...trangThai }); } catch { /* */ } };
  trangThai.loi = null;
  trangThai.status = "dang_dang_nhap";
  bao();

  try {
    const zalo = new Zalo({ selfListen: false, checkUpdate: false, logging: false });
    let phienCu = null;
    if (!quetMoi && coPhienCu()) {
      try { phienCu = JSON.parse(fs.readFileSync(duongDanPhien, "utf8")); } catch { /* hỏng thì quét lại */ }
    }

    if (phienCu?.cookie && phienCu?.imei) {
      api = await zalo.login(phienCu);
    } else {
      trangThai.status = "cho_quet_qr";
      trangThai.qr = null;
      bao();
      api = await zalo.loginQR(undefined, (ev) => {
        const img = ev?.data?.image || ev?.data?.qrCode || ev?.image;
        if (!img) return;
        trangThai.qr = String(img).startsWith("data:") ? img : `data:image/png;base64,${img}`;
        trangThai.status = "cho_quet_qr";
        bao();
      });
    }

    trangThai.status = "da_ket_noi";
    trangThai.qr = null;
    trangThai.ket_noi_luc = new Date().toISOString();
    batTrinhNghe();
    try { trangThai.uid = String(api.getOwnId?.() ?? ""); } catch { /* */ }
    try {
      const info = await api.fetchAccountInfo?.();
      const p = info?.profile || {};
      trangThai.ten = p.displayName || p.zaloName || null;
      trangThai.sdt = p.phoneNumber || null;
      if (!trangThai.uid && p.userId) trangThai.uid = String(p.userId);
    } catch { /* không lấy được tên cũng không sao */ }
    luuPhien();
    batGhiPhienDinhKy();
    bao();
    return { ...trangThai };
  } catch (e) {
    api = null;
    // KHÔNG xoá file phiên: lỗi thường chỉ là tạm thời, xoá đi là buộc quét QR oan.
    trangThai.status = "chua_dang_nhap";
    trangThai.qr = null;
    trangThai.loi = String(e?.message || e);
    bao();
    return { ...trangThai };
  }
}

export function dangXuat({ xoaPhien = true } = {}) {
  tatTrinhNghe();
  try { api?.listener?.stop?.(); } catch { /* */ }
  api = null;
  Object.assign(trangThai, { status: "chua_dang_nhap", qr: null, uid: null, ten: null, sdt: null, loi: null, ket_noi_luc: null });
  if (xoaPhien && duongDanPhien) { try { fs.unlinkSync(duongDanPhien); } catch { /* */ } }
  return { ...trangThai };
}

/** Trả về đối tượng API của thư viện — dùng cho các việc chưa bọc hàm riêng. */
export const layApi = () => api;

export const daKetNoi = () => trangThai.status === "da_ket_noi" && Boolean(api);

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));
export const ngau = (a, b) => Math.round(a + Math.random() * (b - a));

/** Giới hạn chia sẻ tệp mà Zalo cho phép (đọc lúc đăng nhập) — chặn sớm tệp quá lớn/đuôi cấm. */
export function gioiHanTep() {
  try {
    const f = api?.getContext?.()?.settings?.features?.sharefile;
    if (!f) return null;
    return {
      max_size_mb: Math.round((f.max_size_share_file_v3 || f.max_size_share_file || 0) / 1048576),
      duoi_cam: String(f.restricted_ext_file || "").split(/[,\s]+/).filter(Boolean),
      max_file: f.max_file || null,
    };
  } catch { return null; }
}

/**
 * Dò UID theo số điện thoại: dùng API hàng loạt trước, thiếu đâu mới dò từng số.
 * @param {string[]} dsSdt
 * @param {(tien:{da:number,tong:number,sdt:string})=>void} onTienDo
 */
export async function doUid(dsSdt, onTienDo) {
  if (!daKetNoi()) throw new Error("Chưa kết nối Zalo. Hãy quét QR ở màn Kết nối Zalo trước.");
  const ds = [...new Set(dsSdt.map(chuanSdt).filter((s) => /^0\d{9}$/.test(s)))];
  const kq = new Map();
  let da = 0;
  for (let i = 0; i < ds.length; i += 20) {
    const lo = ds.slice(i, i + 20);
    try {
      const r = await api.getMultiUsersByPhones(lo);
      for (const [k, u] of Object.entries(r || {})) {
        const uid = String(u?.uid ?? u?.userId ?? "");
        if (uid) kq.set(chuanSdt(k), { uid, ten: u.display_name || u.zalo_name || u.displayName || "" });
      }
    } catch { /* rơi xuống dò từng số */ }
    for (const s of lo) {
      if (!kq.has(s)) {
        try {
          const u = await api.findUser(s);
          const uid = String(u?.uid ?? u?.userId ?? "");
          if (uid) kq.set(s, { uid, ten: u.display_name || u.zalo_name || u.displayName || "" });
        } catch { /* 216 = không có tài khoản Zalo */ }
        await nghi(ngau(1500, 3000));
      }
      da++;
      onTienDo?.({ da, tong: ds.length, sdt: s });
    }
    await nghi(ngau(2000, 4000));
  }
  return kq;
}

/** Lấy toàn bộ UID bạn bè để gắn nhãn "chưa là bạn". */
export async function dsBanBe() {
  if (!daKetNoi()) throw new Error("Chưa kết nối Zalo.");
  const tap = new Set();
  for (let trang = 0; trang < 40; trang++) {
    let lo;
    try { lo = await api.getAllFriends(100, trang); } catch { break; }
    const arr = Array.isArray(lo) ? lo : lo?.friends || [];
    if (!arr.length) break;
    for (const b of arr) {
      const uid = String(b?.userId ?? b?.uid ?? "");
      if (uid) tap.add(uid);
    }
    if (arr.length < 100) break;
    await nghi(ngau(800, 1500));
  }
  return tap;
}

/** Gửi lời mời kết bạn. Các mã 225/215/222 coi như đã xử lý xong, không phải lỗi. */
export async function moiKetBan(uid, loiNhan = "") {
  if (!daKetNoi()) throw new Error("Chưa kết nối Zalo.");
  try {
    await api.sendFriendRequest(loiNhan || "Xin chào, tôi gửi thời khoá biểu của nhà trường qua Zalo.", String(uid));
    return { ok: true };
  } catch (e) {
    const ma = e?.code ?? null;
    if ([225, 215, 222].includes(ma)) return { ok: true, ghi_chu: "Đã là bạn hoặc lời mời đã tồn tại." };
    return { ok: false, ma_loi: ma, loi: String(e?.message || e) };
  }
}

/** Gửi ẢNH kèm lời nhắn — một tin duy nhất. Dùng Buffer + metadata (tránh lỗi đường dẫn Windows). */
/**
 * Danh sách nhóm Zalo của tài khoản đang đăng nhập.
 * Gửi vào nhóm KHÔNG cần số điện thoại — dùng thẳng mã nhóm.
 */
export async function dsNhom() {
  if (!daKetNoi()) throw new Error("Chưa kết nối Zalo.");
  const g = await api.getAllGroups();
  const ids = Object.keys(g?.gridVerMap || {});
  const ra = [];
  // Hỏi thông tin theo lô cho nhẹ máy chủ
  for (let i = 0; i < ids.length; i += 50) {
    const lo = ids.slice(i, i + 50);
    const info = await api.getGroupInfo(lo);
    const m = info?.gridInfoMap || {};
    for (const id of Object.keys(m)) {
      const x = m[id];
      ra.push({
        id: String(x.groupId || id),
        ten: String(x.name || "(nhóm không tên)"),
        so_thanh_vien: Number(x.totalMember || 0),
        la_cong_dong: Number(x.type) === 2,
      });
    }
    if (i + 50 < ids.length) await new Promise((r) => setTimeout(r, ngau(400, 900)));
  }
  ra.sort((a, b) => b.so_thanh_vien - a.so_thanh_vien || a.ten.localeCompare(b.ten, "vi"));
  return ra;
}

export async function guiAnh(uid, duongDanAnh, loiNhan, { width, height, laNhom = false } = {}) {
  if (!daKetNoi()) throw new Error("Chưa kết nối Zalo.");
  const data = fs.readFileSync(duongDanAnh);
  const r = await api.sendMessage(
    {
      msg: String(loiNhan ?? ""),
      attachments: [{
        data,
        filename: path.basename(duongDanAnh),
        metadata: { totalSize: data.length, width: width || 1080, height: height || 1080 },
      }],
    },
    String(uid), laNhom ? ThreadType.Group : ThreadType.User
  );
  return { ok: true, msg_id: r?.attachment?.[0]?.msgId ? String(r.attachment[0].msgId) : (r?.message?.msgId ? String(r.message.msgId) : "") };
}

/** Gửi TỆP (docx). msg phải là chuỗi rỗng — có chữ sẽ thành 2 tin. */
/** Chạy một việc có hạn chờ; quá hạn thì ném lỗi thay vì treo mãi. */
function coHanCho(viec, giay, loiNeuQua) {
  return Promise.race([
    viec,
    new Promise((_, hong) => setTimeout(() => hong(new Error(loiNeuQua)), giay * 1000)),
  ]);
}

export async function guiTep(uid, duongDanTep, { laNhom = false } = {}) {
  if (!daKetNoi()) throw new Error("Chưa kết nối Zalo.");
  // Gửi tệp phải đợi sự kiện "file_done" qua WebSocket. Thiếu trình nghe là treo.
  batTrinhNghe();
  if (!dangNghe) throw new Error("Chưa bật được kênh nhận sự kiện của Zalo nên không gửi tệp được. Thử quét lại mã QR.");

  const r = await coHanCho(
    api.sendMessage({ msg: "", attachments: [duongDanTep] }, String(uid), laNhom ? ThreadType.Group : ThreadType.User),
    120,
    "Gửi tệp quá 2 phút chưa xong. Có thể mạng chậm hoặc Zalo chưa xác nhận tải lên."
  );
  return { ok: true, msg_id: r?.attachment?.[0]?.msgId ? String(r.attachment[0].msgId) : "" };
}

/** Gửi tin văn bản thuần (Zalo không hiểu Markdown). */
export async function guiChu(uid, noiDung) {
  if (!daKetNoi()) throw new Error("Chưa kết nối Zalo.");
  const r = await api.sendMessage({ msg: String(noiDung ?? "") }, String(uid), ThreadType.User);
  return { ok: true, msg_id: r?.message?.msgId ? String(r.message.msgId) : "" };
}

/** Lỗi mạng/HTTP (không có mã Zalo) coi là tạm thời → đáng thử lại. */
export function loiTamThoi(e) {
  const ma = e?.code;
  if (ma != null && Number.isFinite(Number(ma))) return false;
  const s = String(e?.message || e).toLowerCase();
  return s.includes("fetch") || s.includes("network") || s.includes("timeout") || s.includes("econn") || s.includes("socket");
}

/** Dấu hiệu phiên Zalo đã hỏng → phải quét QR lại. */
export function loiMatPhien(e) {
  const s = String(e?.message || e).toLowerCase();
  return s.includes("401") || s.includes("403") || s.includes("login") || s.includes("đăng nhập") || s.includes("session");
}
