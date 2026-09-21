# TKB Zalo

Gửi thời khoá biểu cho giáo viên qua Zalo cá nhân: mỗi người nhận **một ảnh xem ngay** và
**một tệp Word để in**. Giáo viên chủ nhiệm nhận thêm thời khoá biểu lớp mình.

Phần mềm cá nhân, miễn phí, **không liên kết với Zalo** hay bất kỳ phần mềm xếp thời khoá biểu nào.

**Cách dùng:** trên Smart Scheduler chọn *Hệ thống | Chuyển đổi dữ liệu sang Excel* → *Chấp nhận*, lưu tệp →
kéo thả vào trang **Dữ liệu** → xem thử → **Nạp dữ liệu** (tự tạo danh sách giáo viên và ảnh) →
lần đầu điền số điện thoại và quét mã QR Zalo → **Gửi**. Chỉ cần một tệp Excel đó.

> **Cảnh báo:** phần mềm dùng thư viện Zalo không chính thức. Gửi nhiều tin cho người lạ có thể
> khiến tài khoản Zalo bị hạn chế hoặc khoá. Đọc `build/DIEU-KHOAN-RUI-RO.txt` trước khi dùng.

## Chạy khi phát triển

```bash
npm install
npm run fonts        # chép phông offline vào src/renderer/fonts
npm start
```

## Kiểm thử

```bash
npm test                                  # 79 test cho phần xử lý
npx electron scripts/thu-chay.mjs         # chạy app thật, chụp màn hình từng trang
npm run kiem-sqlite                       # xác nhận node:sqlite có trong Electron
```

Nếu `npx electron` báo lỗi nhập mô-đun `electron`, kiểm tra biến `ELECTRON_RUN_AS_NODE`
(xem `docs/KINH-NGHIEM.md`).

## Dữ liệu mẫu

Thư mục `test/mau/` chứa tệp Excel và Word thật của một trường (họ tên giáo viên, số điện thoại)
nên **không được đưa lên kho công khai**. Muốn chạy `npm test`, tự chép vào đó các tệp xuất từ
phần mềm xếp thời khoá biểu: một tệp `SS*.xlsx`, một tệp danh sách giáo viên, và các tệp Word
thời khoá biểu giáo viên/lớp.

## Đóng gói

```bash
npm run dist         # ra dist/TKBZalo-Setup-x.y.z.exe
```

Bộ cài hiện trang điều khoản, người dùng phải bấm **Tôi đồng ý** mới cài tiếp được.
Cài vào thư mục người dùng nên không cần quyền quản trị.

## Tài liệu

| Tệp | Nội dung |
|---|---|
| `docs/THIET-KE.md` | Kiến trúc, lược đồ dữ liệu, quyết định kỹ thuật và lý do |
| `docs/KINH-NGHIEM.md` | Bẫy đã dính và cách xử lý |
| `docs/BAN-GIAO.md` | Trạng thái, việc còn dở, bước tiếp theo |
| `docs/HUONG-DAN.md` | Hướng dẫn sử dụng (bản trong phần mềm ở mục Trợ giúp) |
| `docs/NGHIEP-VU-THIET-KE-APP.md` | Nguyên tắc bố cục giao diện theo luồng nghiệp vụ |
| `GHI-CHU-PHAT-HANH.md` | Ghi chú từng bản, dùng làm mô tả bản phát hành |

## Cấu trúc

```
src/main/       xử lý: cơ sở dữ liệu, đọc Excel/Word, Zalo, hàng đợi gửi, ảnh, thống kê
src/preload/    cầu nối an toàn giữa giao diện và xử lý
src/renderer/   giao diện (HTML/CSS/JS thuần), phông offline, khuôn vẽ ảnh
test/           kiểm thử (dữ liệu mẫu để ở test/mau/, KHÔNG đưa lên kho vì có dữ liệu thật)
scripts/        chép phông, kiểm SQLite, chạy thử app
```

## Cập nhật tự động

Phần mềm hỏi trang phát hành của kho này (GitHub Releases) mỗi lần mở, tìm tệp
`TKBZalo-Setup-*.exe` ở bản mới nhất và so số hiệu theo chuẩn SemVer. Có bản mới thì hiện thông báo
kèm nội dung thay đổi, người dùng chọn tải và cài.

Phát hành một bản mới:

```bash
# 1. tăng version trong package.json, viết khối mới ở đầu GHI-CHU-PHAT-HANH.md
npm test && npm run dist
# 2. đẩy mã và tạo bản phát hành kèm bộ cài
git add -A && git commit -m "Bản x.y.z" && git push
gh release create vx.y.z "dist/TKBZalo-Setup-x.y.z.exe" --title "TKB Zalo x.y.z" --notes-file GHI-CHU-PHAT-HANH.md
```

Đặt biến môi trường `TKBZALO_REPO` để trỏ sang kho khác.
