# Bàn giao — TKB Zalo

Cập nhật: 21/9/2026 · Bản 0.1.11 · Đã phát hành trên GitHub và cài chạy thật trên máy `bienc`

## 1. Trạng thái

**Xong và đã kiểm chứng thật:**

| Hạng mục | Kiểm chứng |
|---|---|
| Đọc Excel xuất từ phần mềm xếp TKB | 40 giáo viên, 20 lớp, 585 tiết, số TKB 1, ngày 18/08/2025, 6 lớp có chủ nhiệm |
| Khớp giáo viên | 40/40 theo tên, 38/38 theo mã, số tiết đếm khớp bảng phân công tuyệt đối |
| Cắt tệp Word | 120 tệp từ 4 tệp gốc (A4 + A5), mỗi tệp đúng 1 bảng, bản A5 đã dọn 240 phần rỗng |
| Trùng số thời khoá biểu | Cảnh báo, cập nhật thì tăng bản và lưu vết, không nhân đôi dữ liệu |
| Vẽ ảnh | 58 ảnh (38 giáo viên + 20 lớp), đúng 2160 px ngang, đã soi mắt thường |
| Chống gửi trùng | 44 mục lần đầu → lần hai nhận ra 44 mục trùng → đổi lịch 1 người thì chỉ còn 1 mục |
| Hàng đợi gửi | Tắt giữa chừng tiếp tục đúng chỗ, 3 lỗi liên tiếp tự dừng, mất phiên thì nhắc quét lại QR |
| Giới hạn an toàn | Tách nhóm đã/chưa kết bạn; hết mức nhóm này vẫn gửi nhóm kia; đổi tài khoản Zalo thì mức đầy lại |
| Danh sách lỗi | Nêu từng giáo viên không nhận được kèm số điện thoại, lý do, cách sửa |
| Thống kê | Lọc đa chiều, 6 cách xem, xuất Excel 4 sheet, dựng được trang in |
| Giao diện | Mọi trang mở được, không lỗi console; trang Dữ liệu gom đủ ba khu |
| Thanh bên thu gọn | 76 px ở chế độ thu gọn, 232 px khi mở; chữ viết tắt dưới icon không bị cắt |
| Số hiệu phiên bản | Lấy từ `package.json`, hiện ở chân thanh bên, so sánh đúng chuẩn SemVer |
| Bộ cài | `TKBZalo-Setup-0.1.0.exe` 100 MB, cài không cần quyền quản trị, có trang điều khoản bắt buộc |
| Kiểm bản đóng gói | `scripts/kiem-goi.mjs` nạp thử mọi mô-đun trong app.asar và dùng thật exceljs/jszip/zca-js |
| Cài thật trên máy này | Cài xong mở được, tạo `tkb.sqlite` và cây thư mục trong Tài liệu, hiện màn điều khoản lần đầu |

**Số liệu kiểm thử:** `npm test` 75/75 đạt · `scripts/thu-chay.mjs` tất cả đạt · `scripts/kiem-goi.mjs` đạt.

**Nếu đóng gói báo `EPERM ... win-unpacked.tmp`:** đóng gói vào thư mục khác rồi đổi tên —
`npx electron-builder --win nsis -c.directories.output=_dist` rồi `mv _dist dist`.

## 2. Việc người dùng cần làm để dùng thật

1. **Chuẩn bị dữ liệu trong phần mềm xếp thời khoá biểu:**
   - **Nhập “Danh sách giáo viên chủ nhiệm”** rồi xuất Excel lại. Hiện tệp mẫu mới có 6/20 lớp;
     14 lớp còn lại sẽ không gửi được thời khoá biểu lớp.
   - Xuất tệp Word thời khoá biểu giáo viên và lớp (A4 hoặc A5).
2. **Bổ sung số điện thoại giáo viên** — tệp `ds gv.xlsx` hiện chỉ có 1/40 số.
   Trong Excel nhớ đặt định dạng ô là **Văn bản** để không mất số 0 đầu.
3. **Kết bạn Zalo với giáo viên trước khi gửi.** Người chưa kết bạn hoặc đã tắt nhận tin từ người lạ
   sẽ không nhận được. App có nút gửi lời mời, nên rải 20–30 lời mời mỗi ngày.
4. **Gửi thử 3 người** trước khi gửi cả trường.

## 3. Việc còn dở / chưa làm

| Việc | Ghi chú |
|---|---|
| **Chưa gửi thử Zalo thật** | Toàn bộ luồng gửi mới kiểm bằng Zalo giả trong kiểm thử. Cần một lần gửi thật cho chính số của người dùng để xác nhận ảnh và tệp hiển thị đúng trên điện thoại. |
| ~~Chưa có kho phát hành~~ **ĐÃ XONG 21/9** | Kho công khai `https://github.com/biencuong/tkb-zalo`, đã phát hành `v0.1.0` và `v0.1.1` kèm bộ cài. Máy khách bản cũ đã thử và phát hiện đúng bản mới, đọc được ghi chú và mã băm SHA-256. Đổi kho bằng biến môi trường `TKBZALO_REPO`. |
| **Chưa ký số bộ cài** | Windows SmartScreen sẽ cảnh báo lần đầu. Muốn hết thì mua chứng thư ký mã hoặc dùng SignPath. |
| **Mã lỗi Zalo khi bị chặn tin** | Chưa xác định được mã cụ thể. App đã ghi `ma_loi` + `loi` vào lịch sử; sau đợt gửi thật đầu tiên nên xem lại để bổ sung bảng mã “bỏ qua người này” và “dừng cả đợt”. |
| **Bản macOS** | Chưa làm. Cấu hình `build` mới có phần Windows. |

## 4. Nếu cần sửa tiếp — nên bắt đầu từ đâu

| Muốn sửa gì | Mở tệp nào |
|---|---|
| Cách đọc Excel của phần mềm xếp TKB | `src/main/nhap-xlsx.js` |
| Cách cắt tệp Word | `src/main/cat-docx.js` |
| Bố cục ảnh gửi Zalo | `src/renderer/ve-tkb.html` |
| Nhịp gửi, giới hạn an toàn | `src/main/hang-doi.js` + mục Cài đặt |
| Nội dung hướng dẫn và cảnh báo rủi ro | `src/renderer/js/noi-dung.js` → chạy `npm run huong-dan` |
| Thanh bên, các bước, thu gọn, chip phiên bản | `src/renderer/js/app.js` (mảng `MUC`, hàm `datMini`, `veChipBan`) |
| Trang Dữ liệu gộp ba khu | `src/renderer/js/trang/du-lieu.js` (gọi `giao-vien.js` và `tkb.js` với `{ gon: true }`) |
| Toàn bộ luồng gửi (hộp thoại) | `src/renderer/js/gui-modal.js` — không còn trang Gửi riêng |
| Nút và hộp kết nối Zalo nhanh | `src/renderer/js/zalo-nhanh.js` (`chipZalo`, `moKetNoiZalo`, `canZalo`) |
| Quy tắc đánh số phiên bản | `src/main/phien-ban.js` + `soSanhBan` trong `src/main/cap-nhat.js` |
| Phân loại tệp khi kéo thả, tên chuẩn, chống trùng | `xepTepVaoKho` + `tenChuan` trong `src/main/kho-file.js` |
| Màn xem thử trên điện thoại | `src/renderer/js/xem-mobile.js` + lệnh `gui:xem-thu` |
| Nguyên tắc bố cục giao diện | `docs/NGHIEP-VU-THIET-KE-APP.md` (và skill `thiet-ke-app-theo-luong`) |
| Màu sắc, phông chữ | `src/renderer/style.css` + `scripts/copy-fonts.mjs` |
| Lược đồ cơ sở dữ liệu | `src/main/db.js` (hằng `LUOC_DO`) |

**Trước khi giao bản mới, chạy đủ ba bước:**
```bash
npm test                              # 75 test
npx electron scripts/thu-chay.mjs     # chạy app thật, chụp màn hình
npm run dist                          # đóng gói + tự kiểm gói
```

## 5. Nơi để dữ liệu

| Thứ | Đường dẫn |
|---|---|
| Cơ sở dữ liệu, phiên Zalo, nhật ký lỗi | `%APPDATA%\TKB Zalo\` |
| Thư mục làm việc của người dùng | `Tài liệu\TKB Zalo\` (theo OneDrive nếu Windows chuyển hướng) |
| Bản cài | `%LOCALAPPDATA%\Programs\TKBZalo\` |

Gỡ phần mềm **không xoá** dữ liệu trong hai thư mục đầu.

## 5b. Làm thêm trong ngày 21/9/2026 (bản 0.1.4 → 0.1.11)

**Đã gửi thật thành công** (tài khoản "Trần Lụa" → một giáo viên): ảnh và tệp Word đều tới nơi.
Lỗi đắt nhất: tệp Word treo vô hạn không báo gì vì `zca-js` chờ sự kiện WebSocket `file_done`
mà trình nghe chưa bật bao giờ — sửa bằng `api.listener.start({retryOnClose:true})` + hạn chờ 120 giây.

| Bản | Nội dung |
|---|---|
| 0.1.4 | Sửa lỗi không gửi được tệp Word; bật trình nghe để biết tin đã tới / đã xem |
| 0.1.5–0.1.6 | Ảnh thời khoá biểu vẽ lại chuẩn màn hình điện thoại; tối thiểu chỉ cần MỘT tệp Excel |
| 0.1.7 | Gửi trùng chỉ cảnh báo, không chặn (có migration mở khoá một lần) |
| 0.1.8–0.1.9 | Gửi vào **nhóm Zalo**: chọn nhóm từ danh sách, dùng mã nhóm, không cần số điện thoại |
| 0.1.10 | Hộp chọn "nhận thời khoá biểu nào" tách hai cột lớp \| giáo viên |
| 0.1.11 | Sửa lỗi listener chồng; lời nhắn riêng cho nhóm; chỉnh "ai nhận gì" ngay trong hộp gửi; biểu mẫu in chuẩn; nút chờ "Lên CSDL ngành" |

**Phát hành:** kho công khai `github.com/biencuong/tkb-zalo`. Quy trình mỗi bản: tăng `version` →
viết khối đầu `GHI-CHU-PHAT-HANH.md` → `npm test` → `npx electron-builder --win nsis
-c.directories.output=<thư mục ngoài dự án>` → `gh release create vX.Y.Z <exe> --notes-file <ghi chú>`.
Ghi chú **phải có dòng** `**SHA-256:** \`<64 ký tự hex>\`` thì bộ tự cập nhật mới kiểm được tệp tải về.
Bộ cài ~100 MB nên **chỉ đính kèm bản phát hành, không commit vào kho**.

**Việc còn lại:**
1. Chưa thử gửi cho **nhiều người một lượt**.
2. Tin gửi vào **nhóm Zalo** đã sinh đúng việc gửi kèm mã nhóm, nhưng chưa xác nhận tin nằm trong
   nhóm thật.
3. Bộ cài **chưa ký số** → SmartScreen cảnh báo lần đầu.
4. **Lên CSDL ngành** mới có nút chờ. Muốn làm tiếp phải có tệp mẫu nhập tải từ tài khoản CSDL của
   trường — không có API công khai (xem `KINH-NGHIEM.md` 21/9).
5. Sau đợt gửi thật đầu tiên: xem `lich_su_gui.ma_loi` để lập bảng mã lỗi Zalo.

**Tài liệu giới thiệu:** `docs/TIN-GIOI-THIEU-ZALO.txt` — ba bản tin dán thẳng vào Zalo kèm link
tải `https://github.com/biencuong/tkb-zalo/releases/latest`.

## 6. Cảnh báo giữ nguyên, đừng bỏ

Phần mềm dùng thư viện Zalo không chính thức. Mọi cảnh báo rủi ro (trang điều khoản trong bộ cài,
màn bắt buộc đồng ý lần đầu, nhắc trong hộp gửi, mục 14 của Trợ giúp) là **có chủ ý**, không phải thừa.
Giới hạn gửi mặc định cũng vậy — nới rộng là tăng nguy cơ người dùng mất tài khoản Zalo.
