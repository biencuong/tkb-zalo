/**
 * Lớp cơ sở dữ liệu SQLite (node:sqlite của Node 22+ đi kèm Electron).
 * Không module native → không cần rebuild, bộ cài chạy ngay.
 *
 * LƯU Ý: DatabaseSync KHÔNG có db.transaction() như better-sqlite3 → dùng giaoDich() bên dưới.
 *        Hàng trả về có prototype null → luôn sao chép {...row} trước khi đưa ra ngoài.
 */
import fs from "node:fs";
import path from "node:path";

let db = null;
let duongDanDb = "";

const PHIEN_BAN_LUOC_DO = 1;

function napSqlite() {
  // Nạp kiểu này (không import tĩnh) để nếu runtime thiếu node:sqlite thì báo lỗi tử tế thay vì chết lúc khởi động.
  try {
    if (typeof process.getBuiltinModule === "function") return process.getBuiltinModule("node:sqlite");
  } catch { /* rơi xuống dưới */ }
  throw new Error(
    "Phiên bản Electron này không có node:sqlite nên không lưu được dữ liệu. Hãy cài lại TKB Zalo bằng bộ cài mới nhất."
  );
}

/** Mở (hoặc tạo) CSDL tại thư mục dữ liệu người dùng. */
export function moDb(thuMucDuLieu) {
  if (db) return db;
  const { DatabaseSync } = napSqlite();
  fs.mkdirSync(thuMucDuLieu, { recursive: true });
  duongDanDb = path.join(thuMucDuLieu, "tkb.sqlite");
  db = new DatabaseSync(duongDanDb);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000; PRAGMA foreign_keys=ON;");
  taoLuocDo();
  return db;
}

export const layDb = () => { if (!db) throw new Error("Chưa mở cơ sở dữ liệu."); return db; };
export const duongDanCsdl = () => duongDanDb;

/** Giao dịch — thay cho db.transaction() của better-sqlite3 (node:sqlite không có). */
export function giaoDich(fn) {
  const d = layDb();
  d.exec("BEGIN IMMEDIATE");
  try { const kq = fn(); d.exec("COMMIT"); return kq; }
  catch (e) { try { if (d.isTransaction) d.exec("ROLLBACK"); } catch { /* */ } throw e; }
}

const sao = (r) => (r == null ? r : { ...r });
export const mot = (sql, ...t) => sao(layDb().prepare(sql).get(...t));
export const nhieu = (sql, ...t) => layDb().prepare(sql).all(...t).map(sao);
export const chay = (sql, ...t) => layDb().prepare(sql).run(...t);

const LUOC_DO = `
CREATE TABLE IF NOT EXISTS luoc_do (phien_ban INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS giao_vien (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ho_dem TEXT NOT NULL DEFAULT '', ten TEXT NOT NULL DEFAULT '',
  ho_ten TEXT NOT NULL DEFAULT '',
  ma_gv TEXT NOT NULL DEFAULT '', ma_gv_2 TEXT NOT NULL DEFAULT '',
  dien_thoai TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
  zalo_uid TEXT NOT NULL DEFAULT '', zalo_ten TEXT NOT NULL DEFAULT '',
  zalo_trang_thai TEXT NOT NULL DEFAULT 'chua_do',
  la_ban INTEGER NOT NULL DEFAULT -1,
  to_chuyen_mon TEXT NOT NULL DEFAULT '',
  lop_cn_mac_dinh TEXT NOT NULL DEFAULT '',
  ghi_chu TEXT NOT NULL DEFAULT '',
  hoat_dong INTEGER NOT NULL DEFAULT 1,
  tao_luc TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  sua_luc TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS ix_gv_ma ON giao_vien(ma_gv);
CREATE INDEX IF NOT EXISTS ix_gv_sdt ON giao_vien(dien_thoai);

CREATE TABLE IF NOT EXISTS nguoi_nhan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ho_ten TEXT NOT NULL, chuc_danh TEXT NOT NULL DEFAULT '',
  dien_thoai TEXT NOT NULL DEFAULT '',
  zalo_uid TEXT NOT NULL DEFAULT '', zalo_ten TEXT NOT NULL DEFAULT '',
  zalo_trang_thai TEXT NOT NULL DEFAULT 'chua_do',
  la_ban INTEGER NOT NULL DEFAULT -1,
  ghi_chu TEXT NOT NULL DEFAULT '',
  hoat_dong INTEGER NOT NULL DEFAULT 1,
  tao_luc TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS nguoi_nhan_dk (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nguoi_nhan_id INTEGER NOT NULL REFERENCES nguoi_nhan(id) ON DELETE CASCADE,
  loai TEXT NOT NULL,
  lop TEXT NOT NULL DEFAULT '',
  giao_vien_id INTEGER REFERENCES giao_vien(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_dk_nguoi ON nguoi_nhan_dk(nguoi_nhan_id);

CREATE TABLE IF NOT EXISTS tkb (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  so_tkb INTEGER NOT NULL, hoc_ky INTEGER, nam_hoc TEXT NOT NULL DEFAULT '',
  ten_truong TEXT NOT NULL DEFAULT '',
  ngay_ap_dung TEXT NOT NULL DEFAULT '', ngay_ket_thuc TEXT NOT NULL DEFAULT '',
  so_tuan REAL,
  nguon_xlsx TEXT NOT NULL DEFAULT '',
  nguon_docx_gv TEXT NOT NULL DEFAULT '', nguon_docx_lop TEXT NOT NULL DEFAULT '',
  kho_giay TEXT NOT NULL DEFAULT '',
  phien_ban INTEGER NOT NULL DEFAULT 1,
  thu_muc TEXT NOT NULL DEFAULT '',
  ghi_chu TEXT NOT NULL DEFAULT '',
  nhap_luc TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  sua_luc TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tkb ON tkb(nam_hoc, hoc_ky, so_tkb);

CREATE TABLE IF NOT EXISTS tkb_phien_ban (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tkb_id INTEGER NOT NULL REFERENCES tkb(id) ON DELETE CASCADE,
  phien_ban INTEGER NOT NULL,
  nhap_luc TEXT NOT NULL DEFAULT '',
  tom_tat TEXT NOT NULL DEFAULT '',
  snapshot_json TEXT NOT NULL DEFAULT '',
  tao_luc TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS tkb_gv (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tkb_id INTEGER NOT NULL REFERENCES tkb(id) ON DELETE CASCADE,
  giao_vien_id INTEGER REFERENCES giao_vien(id) ON DELETE SET NULL,
  ho_ten_pcgd TEXT NOT NULL DEFAULT '',
  ma_trong_tkb TEXT NOT NULL DEFAULT '',
  kiem_nhiem TEXT NOT NULL DEFAULT '',
  lop_cn TEXT NOT NULL DEFAULT '',
  cn_nguon TEXT NOT NULL DEFAULT '',
  phan_cong TEXT NOT NULL DEFAULT '',
  so_tiet_khai REAL, so_tiet_dem INTEGER NOT NULL DEFAULT 0,
  docx_path TEXT NOT NULL DEFAULT '', anh_path TEXT NOT NULL DEFAULT '',
  van_tay TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_tkbgv ON tkb_gv(tkb_id);

CREATE TABLE IF NOT EXISTS tkb_lop (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tkb_id INTEGER NOT NULL REFERENCES tkb(id) ON DELETE CASCADE,
  lop TEXT NOT NULL, khoi TEXT NOT NULL DEFAULT '',
  gvcn_ma TEXT NOT NULL DEFAULT '', giao_vien_id INTEGER REFERENCES giao_vien(id) ON DELETE SET NULL,
  cn_nguon TEXT NOT NULL DEFAULT '',
  so_tiet INTEGER NOT NULL DEFAULT 0,
  docx_path TEXT NOT NULL DEFAULT '', anh_path TEXT NOT NULL DEFAULT '',
  van_tay TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_tkblop ON tkb_lop(tkb_id);

CREATE TABLE IF NOT EXISTS tiet (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tkb_id INTEGER NOT NULL REFERENCES tkb(id) ON DELETE CASCADE,
  thu INTEGER NOT NULL, buoi TEXT NOT NULL, tiet INTEGER NOT NULL,
  lop TEXT NOT NULL, khoi TEXT NOT NULL DEFAULT '',
  mon TEXT NOT NULL, ma_gv TEXT NOT NULL DEFAULT '',
  giao_vien_id INTEGER REFERENCES giao_vien(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS ix_tiet_tkb ON tiet(tkb_id);
CREATE INDEX IF NOT EXISTS ix_tiet_gv ON tiet(tkb_id, giao_vien_id);
CREATE INDEX IF NOT EXISTS ix_tiet_lop ON tiet(tkb_id, lop);

CREATE TABLE IF NOT EXISTS dot_gui (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tkb_id INTEGER REFERENCES tkb(id) ON DELETE SET NULL,
  ten TEXT NOT NULL DEFAULT '',
  tuy_chon_json TEXT NOT NULL DEFAULT '',
  mau_tin TEXT NOT NULL DEFAULT '',
  trang_thai TEXT NOT NULL DEFAULT 'moi',
  tong INTEGER NOT NULL DEFAULT 0, da_gui INTEGER NOT NULL DEFAULT 0,
  loi INTEGER NOT NULL DEFAULT 0, bo_qua INTEGER NOT NULL DEFAULT 0,
  zalo_uid_gui TEXT NOT NULL DEFAULT '', zalo_ten_gui TEXT NOT NULL DEFAULT '',
  tao_luc TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  xong_luc TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS viec_gui (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dot_id INTEGER NOT NULL REFERENCES dot_gui(id) ON DELETE CASCADE,
  tkb_id INTEGER, loai TEXT NOT NULL,
  ma TEXT NOT NULL DEFAULT '',
  nguoi_loai TEXT NOT NULL DEFAULT 'gv',
  nguoi_id INTEGER, nguoi_ten TEXT NOT NULL DEFAULT '',
  sdt TEXT NOT NULL DEFAULT '', uid TEXT NOT NULL DEFAULT '', la_ban INTEGER NOT NULL DEFAULT -1,
  caption TEXT NOT NULL DEFAULT '',
  anh_path TEXT NOT NULL DEFAULT '', anh_w INTEGER, anh_h INTEGER,
  docx_path TEXT NOT NULL DEFAULT '',
  van_tay TEXT NOT NULL DEFAULT '',
  trung INTEGER NOT NULL DEFAULT 0,
  buoc TEXT NOT NULL DEFAULT 'gui_anh',
  trang_thai TEXT NOT NULL DEFAULT 'cho',
  ly_do_bo_qua TEXT NOT NULL DEFAULT '',
  so_lan_thu INTEGER NOT NULL DEFAULT 0,
  ma_loi INTEGER, loi_cuoi TEXT NOT NULL DEFAULT '',
  msg_id_anh TEXT NOT NULL DEFAULT '', msg_id_file TEXT NOT NULL DEFAULT '',
  gui_luc TEXT NOT NULL DEFAULT '',
  cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS ix_viec_dot ON viec_gui(dot_id, trang_thai);
CREATE INDEX IF NOT EXISTS ix_viec_vantay ON viec_gui(van_tay);

CREATE TABLE IF NOT EXISTS lich_su_gui (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dot_id INTEGER, viec_id INTEGER,
  tkb_id INTEGER, so_tkb INTEGER, nam_hoc TEXT NOT NULL DEFAULT '', hoc_ky INTEGER,
  tkb_phien_ban INTEGER NOT NULL DEFAULT 1,
  loai TEXT NOT NULL DEFAULT '', ma TEXT NOT NULL DEFAULT '',
  nguoi_loai TEXT NOT NULL DEFAULT '', nguoi_id INTEGER, nguoi_ten TEXT NOT NULL DEFAULT '',
  sdt TEXT NOT NULL DEFAULT '', uid TEXT NOT NULL DEFAULT '',
  la_ban INTEGER NOT NULL DEFAULT -1,
  co_anh INTEGER NOT NULL DEFAULT 0, co_docx INTEGER NOT NULL DEFAULT 0,
  caption TEXT NOT NULL DEFAULT '',
  anh_ten TEXT NOT NULL DEFAULT '', docx_ten TEXT NOT NULL DEFAULT '',
  van_tay TEXT NOT NULL DEFAULT '',
  ket_qua TEXT NOT NULL DEFAULT 'xong',
  ma_loi INTEGER, loi TEXT NOT NULL DEFAULT '',
  msg_id_anh TEXT NOT NULL DEFAULT '', msg_id_file TEXT NOT NULL DEFAULT '',
  zalo_uid_gui TEXT NOT NULL DEFAULT '',
  luc TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS ix_ls_vantay ON lich_su_gui(van_tay, ket_qua);
CREATE INDEX IF NOT EXISTS ix_ls_nguoi ON lich_su_gui(nguoi_loai, nguoi_id);
CREATE INDEX IF NOT EXISTS ix_ls_tkb ON lich_su_gui(tkb_id);

CREATE TABLE IF NOT EXISTS nhat_ky (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  luc TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  muc TEXT NOT NULL DEFAULT 'tin',
  hanh_dong TEXT NOT NULL, doi_tuong TEXT NOT NULL DEFAULT '',
  mo_ta TEXT NOT NULL DEFAULT '',
  truoc_json TEXT NOT NULL DEFAULT '', sau_json TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS ix_nk_luc ON nhat_ky(luc);

CREATE TABLE IF NOT EXISTS cai_dat (khoa TEXT PRIMARY KEY, gia_tri TEXT NOT NULL DEFAULT '');
`;

/**
 * Cột thêm vào sau khi đã phát hành — `CREATE TABLE IF NOT EXISTS` KHÔNG tự thêm cột cho
 * cơ sở dữ liệu đã tồn tại, nên phải vá tay. Thiếu bước này là máy đã cài bản cũ sẽ lỗi
 * "no such column" ngay khi mở app (đã dính 20/9 với cột lich_su_gui.la_ban).
 */
const COT_THEM = [
  ["lich_su_gui", "la_ban", "INTEGER NOT NULL DEFAULT -1"],
  ["giao_vien", "to_chuyen_mon", "TEXT NOT NULL DEFAULT ''"],
  ["giao_vien", "la_ban", "INTEGER NOT NULL DEFAULT -1"],
  ["nguoi_nhan", "la_ban", "INTEGER NOT NULL DEFAULT -1"],
  ["viec_gui", "la_ban", "INTEGER NOT NULL DEFAULT -1"],
  ["viec_gui", "ly_do_bo_qua", "TEXT NOT NULL DEFAULT ''"],
  ["tkb", "so_tuan", "REAL"],
  ["tkb_gv", "co_docx", "INTEGER NOT NULL DEFAULT 0"],
];

function vaCotThieu() {
  for (const [bang, cot, kieu] of COT_THEM) {
    try {
      const co = db.prepare(`PRAGMA table_info(${bang})`).all().some((c) => c.name === cot);
      if (!co) {
        db.exec(`ALTER TABLE ${bang} ADD COLUMN ${cot} ${kieu}`);
        console.log(`[db] đã thêm cột ${bang}.${cot}`);
      }
    } catch (e) {
      console.error(`[db] không thêm được cột ${bang}.${cot}:`, e?.message || e);
    }
  }
}

function taoLuocDo() {
  db.exec(LUOC_DO);
  vaCotThieu();
  const v = db.prepare("SELECT phien_ban FROM luoc_do LIMIT 1").get();
  if (!v) db.prepare("INSERT INTO luoc_do(phien_ban) VALUES (?)").run(PHIEN_BAN_LUOC_DO);
}

// ---------------------------------------------------------------- CÀI ĐẶT

export const CAI_DAT_MAC_DINH = {
  ten_truong: "",
  mau_tin_gv:
    "{truong} gửi thầy/cô {ten} THỜI KHOÁ BIỂU số {so_tkb}, thực hiện từ ngày {ngay}.\n" +
    "Ảnh kèm để xem nhanh; file đính kèm tin sau để tải về in. Thầy/cô kiểm tra và phản hồi nếu có sai sót.",
  mau_tin_lop:
    "{truong} gửi thầy/cô {ten} THỜI KHOÁ BIỂU LỚP {lop} (lớp thầy/cô chủ nhiệm), số {so_tkb}, " +
    "thực hiện từ ngày {ngay}.",
  nhip_2_tin_min: "3000", nhip_2_tin_max: "6000",
  nhip_2_nguoi_min: "8000", nhip_2_nguoi_max: "15000",
  nghi_moi_n: "10", nghi_min: "60000", nghi_max: "90000",
  dung_sau_n_loi: "3",
  lui_khi_loi_ms: "10000",
  // GIỚI HẠN AN TOÀN — tránh bị Zalo hạn chế/khoá tài khoản.
  // Zalo KHÔNG công bố con số chính thức. Mức dưới đây dựa trên kinh nghiệm cộng đồng:
  // rủi ro nằm ở việc gửi cho NGƯỜI LẠ (khoảng 10–40 tin/ngày là đã bị để ý), còn nhắn cho
  // người ĐÃ KẾT BẠN là hành vi bình thường nên rộng hơn nhiều. Vì vậy tách làm hai mức.
  gioi_han_moi_dot: "120",       // số NGƯỜI tối đa trong một đợt (chỉ cảnh báo, không chặn)
  gioi_han_ban_24h: "300",       // số người ĐÃ KẾT BẠN tối đa trong 24 giờ
  gioi_han_la_24h: "30",         // số người CHƯA KẾT BẠN tối đa trong 24 giờ — giữ thấp
  gioi_han_tin_24h: "700",       // tổng số TIN tối đa trong 24 giờ
  canh_bao_nguoi_la: "1",        // cảnh báo khi gửi cho người chưa kết bạn
  da_dong_y_rui_ro: "0",
  kho_giay_mac_dinh: "A4",
  tu_kiem_cap_nhat: "1",
  bo_qua_ban: "",
  tuy_chon_gui_json: "",
};

export function layCaiDat(khoa) {
  const r = mot("SELECT gia_tri FROM cai_dat WHERE khoa=?", khoa);
  return r ? r.gia_tri : (CAI_DAT_MAC_DINH[khoa] ?? "");
}
export function datCaiDat(khoa, giaTri) {
  chay(
    "INSERT INTO cai_dat(khoa,gia_tri) VALUES(?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri",
    khoa, String(giaTri ?? "")
  );
}
export function tatCaCaiDat() {
  const kq = { ...CAI_DAT_MAC_DINH };
  for (const r of nhieu("SELECT khoa,gia_tri FROM cai_dat")) kq[r.khoa] = r.gia_tri;
  return kq;
}

export function ghiNhatKy(hanh_dong, { doi_tuong = "", mo_ta = "", truoc = null, sau = null, muc = "tin" } = {}) {
  chay(
    "INSERT INTO nhat_ky(muc,hanh_dong,doi_tuong,mo_ta,truoc_json,sau_json) VALUES(?,?,?,?,?,?)",
    muc, hanh_dong, String(doi_tuong), String(mo_ta),
    truoc ? JSON.stringify(truoc) : "", sau ? JSON.stringify(sau) : ""
  );
}

export function dongDb() { try { db?.close(); } catch { /* */ } db = null; }
