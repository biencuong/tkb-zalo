/**
 * Cầu nối an toàn giữa giao diện và tiến trình chính.
 * Giao diện KHÔNG được chạm thẳng vào Node — mọi thứ đi qua danh sách lệnh dưới đây.
 */
const { contextBridge, ipcRenderer, webUtils } = require("electron");

const goi = (ten) => (...t) => ipcRenderer.invoke(ten, ...t);
const nghe = (kenh) => (fn) => {
  const bo = (_su, du) => fn(du);
  ipcRenderer.on(kenh, bo);
  return () => ipcRenderer.removeListener(kenh, bo);
};

contextBridge.exposeInMainWorld("api", {
  app: {
    thongTin: goi("app:thong-tin"),
    caiDat: goi("app:cai-dat"),
    luuCaiDat: goi("app:luu-cai-dat"),
    moThuMuc: goi("app:mo-thu-muc"),
    moTep: goi("app:mo-tep"),
    moWeb: goi("app:mo-web"),
    nhatKy: goi("app:nhat-ky"),
    tongQuan: goi("app:tong-quan"),
    tienDo: goi("app:tien-do"),
  },
  tep: {
    chon: goi("tep:chon"),
    luuODau: goi("tep:luu-o-dau"),
    kiemTra: goi("tep:kiem-tra"),
    quetHopThu: goi("tep:quet-hop-thu"),
    quetDsGv: goi("tep:quet-ds-gv"),
    soiThuMuc: goi("tep:soi-thu-muc"),
    duyetKho: goi("tep:duyet-kho"),
    donHopThu: goi("tep:don-hop-thu"),
    taoThuMucChuan: goi("tep:tao-thu-muc-chuan"),
  },
  tm: {
    nhanTep: goi("tm:nhan-tep"),
    thaTep: goi("tm:tha-tep"),
    liet: goi("tm:liet"),
    tao: goi("tm:tao"),
    doiTen: goi("tm:doi-ten"),
    xoa: goi("tm:xoa"),
    chuyen: goi("tm:chuyen"),
  },
  gv: {
    ds: goi("gv:ds"),
    luu: goi("gv:luu"),
    xoa: goi("gv:xoa"),
    nhapExcel: goi("gv:nhap-excel"),
    nguoiNhan: goi("gv:nguoi-nhan"),
    luuNguoiNhan: goi("gv:luu-nguoi-nhan"),
    xoaNguoiNhan: goi("gv:xoa-nguoi-nhan"),
  },
  tkb: {
    ds: goi("tkb:ds"),
    chiTiet: goi("tkb:chi-tiet"),
    xemTruoc: goi("tkb:xem-truoc"),
    kiemWord: goi("tkb:kiem-word"),
    nhap: goi("tkb:nhap"),
    xoa: goi("tkb:xoa"),
    datGvcn: goi("tkb:dat-gvcn"),
    luoi: goi("tkb:luoi"),
  },
  anh: {
    chuanBi: goi("anh:chuan-bi"),
    xemTruoc: goi("anh:xem-truoc"),
    onTienDo: nghe("anh:tien-do"),
  },
  zalo: {
    trangThai: goi("zalo:trang-thai"),
    dangNhap: goi("zalo:dang-nhap"),
    dangXuat: goi("zalo:dang-xuat"),
    doUid: goi("zalo:do-uid"),
    doiChieuBanBe: goi("zalo:doi-chieu-ban-be"),
    moiKetBan: goi("zalo:moi-ket-ban"),
    onDoi: nghe("zalo:doi"),
    onDoTienDo: nghe("zalo:do-tien-do"),
  },
  gui: {
    chuanBi: goi("gui:chuan-bi"),
    taoDot: goi("gui:tao-dot"),
    gioiHan: goi("gui:gioi-han"),
    chay: goi("gui:chay"),
    thu: goi("gui:thu"),
    tamDung: goi("gui:tam-dung"),
    guiLaiLoi: goi("gui:gui-lai-loi"),
    tinhTrang: goi("gui:tinh-trang"),
    dsDot: goi("gui:ds-dot"),
    chiTietDot: goi("gui:chi-tiet-dot"),
    lichSu: goi("gui:lich-su"),
    daNhan: goi("gui:da-nhan"),
    dsLoi: goi("gui:ds-loi"),
    xemThu: goi("gui:xem-thu"),
    onTienDo: nghe("gui:tien-do"),
  },
  tk: {
    nguonLoc: goi("tk:nguon-loc"),
    thongKe: goi("tk:thong-ke"),
    maTran: goi("tk:ma-tran"),
    duLieuIn: goi("tk:du-lieu-in"),
    xuatExcel: goi("tk:xuat-excel"),
    in: goi("tk:in"),
    xuatPdf: goi("tk:xuat-pdf"),
  },
  capNhat: {
    kiem: goi("cap-nhat:kiem"),
    taiVaCai: goi("cap-nhat:tai-va-cai"),
    boQua: goi("cap-nhat:bo-qua"),
    moTrang: goi("cap-nhat:mo-trang"),
    onCoBanMoi: nghe("cap-nhat:co-ban-moi"),
    onTienDo: nghe("cap-nhat:tien-do"),
  },
  // Lấy đường dẫn thật của tệp người dùng KÉO THẢ vào cửa sổ.
  // Electron đời mới đã bỏ File.path, phải hỏi qua webUtils ở lớp preload.
  duongDanTep: (file) => { try { return webUtils.getPathForFile(file); } catch { return ""; } },
  onDieuHuong: nghe("dieu-huong"),
  onMoCapNhat: nghe("mo-cap-nhat"),
});
