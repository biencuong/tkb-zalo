/**
 * Tự cập nhật qua GitHub Releases: kiểm bản mới, tải bộ cài, chạy bộ cài rồi thoát app.
 * Lịch sử thay đổi lấy từ phần ghi chú phát hành (nội dung tệp GHI-CHU-PHAT-HANH.md khi phát hành).
 *
 * Không dùng electron-updater để khỏi thêm phụ thuộc nặng; chỉ cần https + child_process.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import https from "node:https";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { app, shell } from "electron";
import { layCaiDat, datCaiDat } from "./db.js";
import { phienBan } from "./phien-ban.js";

const KHO = process.env.TKBZALO_REPO || "biencuong/tkb-zalo";
const API = `https://api.github.com/repos/${KHO}/releases?per_page=20`;
const MAU_TEP = /^TKBZalo-Setup-.*\.exe$/i;

export const tinhTrangCapNhat = { dang: false, buoc: "", phan_tram: 0, loi: "" };
let etag = "";
let nhoTam = null;

function tai(url, { header = {}, nhiPhan = false, redirect = 0 } = {}) {
  return new Promise((giai, hong) => {
    if (redirect > 5) return hong(new Error("Chuyển hướng quá nhiều lần."));
    const req = https.get(url, {
      headers: {
        "User-Agent": "TKBZalo/" + phienBan(),
        Accept: nhiPhan ? "application/octet-stream" : "application/vnd.github+json",
        ...header,
      },
      timeout: 120000,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return giai(tai(res.headers.location, { header, nhiPhan, redirect: redirect + 1 }));
      }
      if (res.statusCode === 304) { res.resume(); return giai({ khongDoi: true }); }
      if (res.statusCode !== 200) {
        res.resume();
        // Nói bằng tiếng người, kèm mã để còn tra khi cần.
        const chu = {
          403: "Trang phát hành tạm khoá lượt hỏi (quá nhiều lần trong một giờ). Thử lại sau ít phút.",
          404: "Chưa có trang phát hành cho phần mềm này.",
          410: "Trang phát hành đã bị gỡ.",
          500: "Máy chủ phát hành đang lỗi. Thử lại sau.",
          502: "Máy chủ phát hành đang lỗi. Thử lại sau.",
          503: "Máy chủ phát hành đang bận. Thử lại sau.",
        }[res.statusCode] || `Máy chủ trả mã ${res.statusCode}.`;
        const e = new Error(chu);
        e.ma = res.statusCode;
        return hong(e);
      }
      const phan = [];
      res.on("data", (c) => phan.push(c));
      res.on("end", () => giai({
        du_lieu: Buffer.concat(phan), etag: res.headers.etag || "", tong: Number(res.headers["content-length"] || 0),
      }));
      res.on("error", hong);
    });
    req.on("timeout", () => { req.destroy(new Error("Quá hạn chờ khi tải.")); });
    req.on("error", hong);
  });
}

/** Số hiệu chuẩn SemVer 2.0.0: MAJOR.MINOR.PATCH[-tienPhatHanh][+dungBan]. */
const MAU_SEMVER = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

/** Tách số hiệu. Không đúng chuẩn → null. */
export function tachBan(s) {
  const m = MAU_SEMVER.exec(String(s || "").trim());
  if (!m) return null;
  return {
    chinh: Number(m[1]), phu: Number(m[2]), va: Number(m[3]),
    truoc: m[4] ? m[4].split(".") : [],
    dung: m[5] || "",
    chuan: `${Number(m[1])}.${Number(m[2])}.${Number(m[3])}${m[4] ? "-" + m[4] : ""}`,
  };
}

export const banHopLe = (s) => tachBan(s) !== null;

/**
 * So hai số hiệu theo đúng quy tắc SemVer — trả >0 nếu a mới hơn b.
 * Bản có đuôi tiền phát hành (1.2.0-beta.1) LUÔN cũ hơn bản chính thức cùng số (1.2.0).
 * Phần dựng bản sau dấu + không tính.
 */
export function soSanhBan(a, b) {
  const x = tachBan(a), y = tachBan(b);
  if (!x || !y) {
    // Số hiệu lạ: so từng cụm số cho đỡ hỏng, không để ném lỗi.
    const t = (s) => String(s).replace(/^v/i, "").split(/[.\-+]/).map((v) => parseInt(v, 10) || 0);
    const p = t(a), q = t(b);
    for (let i = 0; i < Math.max(p.length, q.length); i++) {
      const d = (p[i] || 0) - (q[i] || 0);
      if (d) return d;
    }
    return 0;
  }
  for (const k of ["chinh", "phu", "va"]) {
    if (x[k] !== y[k]) return x[k] - y[k];
  }
  if (!x.truoc.length && !y.truoc.length) return 0;
  if (!x.truoc.length) return 1;          // bản chính thức mới hơn bản thử
  if (!y.truoc.length) return -1;
  for (let i = 0; i < Math.max(x.truoc.length, y.truoc.length); i++) {
    const p = x.truoc[i], q = y.truoc[i];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    const sp = /^\d+$/.test(p), sq = /^\d+$/.test(q);
    if (sp && sq) { const d = Number(p) - Number(q); if (d) return d; }
    else if (sp !== sq) return sp ? -1 : 1; // cụm số < cụm chữ
    else if (p !== q) return p < q ? -1 : 1;
  }
  return 0;
}

/**
 * Kiểm tra bản mới.
 * → { co_ban_moi, ban_hien_tai, ban_moi, ngay, ghi_chu, lich_su:[{ban,ngay,ghi_chu}], tep:{ten,url,co}, sha256 }
 */
export async function kiemTraBanMoi({ dungCache = true } = {}) {
  const banHienTai = phienBan();
  if (dungCache && nhoTam && Date.now() - nhoTam.luc < 10 * 60000) return { ...nhoTam.kq, tu_cache: true };

  let r;
  try {
    r = await tai(API, etag ? { "If-None-Match": etag } : {});
  } catch (e) {
    // Chưa lập kho phát hành thì đây là chuyện bình thường, đừng doạ người dùng bằng chữ "lỗi".
    if (e?.ma === 404) {
      return {
        ban_hien_tai: banHienTai, ban_moi: banHienTai, ngay: "", ghi_chu: "",
        lich_su: [], co_ban_moi: false, chua_co_kho: true, kho: KHO,
      };
    }
    throw e;
  }
  if (r.khongDoi && nhoTam) return { ...nhoTam.kq, tu_cache: true };
  if (r.etag) etag = r.etag;

  const ds = JSON.parse(r.du_lieu.toString("utf8"))
    .filter((x) => !x.draft)
    .map((x) => ({
      ban: String(x.tag_name || x.name || "").replace(/^v/i, ""),
      ngay: (x.published_at || x.created_at || "").slice(0, 10),
      ghi_chu: String(x.body || "").trim(),
      truoc_phat_hanh: Boolean(x.prerelease),
      tep: (x.assets || []).find((a) => MAU_TEP.test(a.name)) || null,
    }))
    .filter((x) => x.ban)
    .sort((a, b) => soSanhBan(b.ban, a.ban));

  const moiNhat = ds.find((x) => !x.truoc_phat_hanh && x.tep) || ds[0] || null;
  const boQua = layCaiDat("bo_qua_ban");
  const kq = {
    ban_hien_tai: banHienTai,
    ban_moi: moiNhat?.ban || banHienTai,
    ngay: moiNhat?.ngay || "",
    ghi_chu: moiNhat?.ghi_chu || "",
    sha256: (moiNhat?.ghi_chu.match(/SHA-?256\s*[:=]\s*([0-9a-f]{64})/i) || [])[1] || "",
    tep: moiNhat?.tep ? { ten: moiNhat.tep.name, url: moiNhat.tep.browser_download_url, co: moiNhat.tep.size } : null,
    lich_su: ds.slice(0, 8).map((x) => ({
      ban: x.ban, ngay: x.ngay, ghi_chu: x.ghi_chu,
      dang_dung: soSanhBan(x.ban, banHienTai) === 0,
    })),
    co_ban_moi: Boolean(moiNhat && soSanhBan(moiNhat.ban, banHienTai) > 0),
    da_bo_qua: Boolean(moiNhat && boQua && boQua === moiNhat.ban),
    kho: KHO,
  };
  nhoTam = { luc: Date.now(), kq };
  return kq;
}

export function boQuaBan(ban) { datCaiDat("bo_qua_ban", String(ban || "")); return { ok: true }; }

/** Tải bộ cài về thư mục tạm, kiểm mã băm (nếu ghi chú phát hành có công bố), rồi chạy và thoát app. */
export async function taiVaCai(onTienDo) {
  if (tinhTrangCapNhat.dang) return { ok: false, loi: ["Đang tải bản cập nhật rồi."] };
  const tt = await kiemTraBanMoi({ dungCache: false });
  if (!tt.co_ban_moi) return { ok: false, loi: ["Bạn đang dùng bản mới nhất."] };
  if (!tt.tep) return { ok: false, loi: ["Bản phát hành chưa có bộ cài cho Windows."], mo_trang: `https://github.com/${KHO}/releases` };

  Object.assign(tinhTrangCapNhat, { dang: true, buoc: "Đang tải bộ cài…", phan_tram: 0, loi: "" });
  onTienDo?.({ ...tinhTrangCapNhat });
  try {
    const r = await tai(tt.tep.url, { nhiPhan: true });
    if (tt.sha256) {
      const bam = crypto.createHash("sha256").update(r.du_lieu).digest("hex");
      if (bam.toLowerCase() !== tt.sha256.toLowerCase()) {
        throw new Error("Tệp tải về không khớp mã kiểm tra — có thể tải lỗi. Hãy thử lại.");
      }
    }
    const dich = path.join(os.tmpdir(), tt.tep.ten);
    fs.writeFileSync(dich, r.du_lieu);
    Object.assign(tinhTrangCapNhat, { buoc: "Đang mở bộ cài…", phan_tram: 100 });
    onTienDo?.({ ...tinhTrangCapNhat });

    spawn(dich, [], { detached: true, stdio: "ignore" }).unref();
    setTimeout(() => app.quit(), 1200);
    return { ok: true, tep: dich, ban: tt.ban_moi };
  } catch (e) {
    Object.assign(tinhTrangCapNhat, { dang: false, buoc: "", loi: String(e?.message || e) });
    onTienDo?.({ ...tinhTrangCapNhat });
    return { ok: false, loi: [String(e?.message || e)], mo_trang: `https://github.com/${KHO}/releases` };
  }
}

export function moTrangPhatHanh() { shell.openExternal(`https://github.com/${KHO}/releases`); return { ok: true }; }

/** Kiểm tra nền sau khi app khởi động (im lặng nếu lỗi mạng). */
export function kiemNenSauKhoiDong(guiChoGiaoDien, tre = 15000) {
  if (layCaiDat("tu_kiem_cap_nhat") === "0") return;
  setTimeout(async () => {
    try {
      const kq = await kiemTraBanMoi();
      if (kq.co_ban_moi && !kq.da_bo_qua) guiChoGiaoDien(kq);
    } catch { /* không mạng thì thôi */ }
  }, tre).unref?.();
}
