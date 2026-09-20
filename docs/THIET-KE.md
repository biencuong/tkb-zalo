# TKB Zalo — Tài liệu thiết kế

Cập nhật: 20/9/2026 · Bản 0.1.0

## 1. Bài toán

Trường phổ thông xếp thời khoá biểu bằng phần mềm chuyên dụng, xuất ra Excel (bảng phân công + lưới tiết)
và Word (mỗi giáo viên/lớp một trang in). Việc phát thời khoá biểu tới từng giáo viên đang làm tay.

App này nhận hai nguồn đó, khớp với danh sách giáo viên có số điện thoại, tạo **ảnh** (xem ngay trên điện
thoại) và **tệp Word cắt riêng** (tải về in), rồi gửi qua **Zalo cá nhân** đúng người, đúng lớp chủ nhiệm.

**Ràng buộc chốt với người dùng (20/9/2026):** sản phẩm cá nhân, miễn phí, không gắn thương hiệu phần mềm
xếp thời khoá biểu; Electron + giao diện tự viết (không dùng Theia); cài không cần bổ trợ; cảnh báo rõ rủi ro Zalo.

## 2. Vì sao chọn Electron

| Yêu cầu | Hệ quả |
|---|---|
| Gửi Zalo cá nhân | Chỉ có `zca-js` (Node) làm được → bắt buộc có runtime Node |
| Không cài bổ trợ | Electron gói sẵn Node + Chromium; `node:sqlite` không cần biên dịch lại |
| Ảnh đẹp, kích thước xác định | Dùng chính Chromium để dựng rồi chụp — không cần thư viện vẽ ảnh |
| In và xuất PDF | `webContents.print()` / `printToPDF()` có sẵn |

Tauri nhẹ hơn nhưng vẫn phải kèm Node cho `zca-js` nên không lợi gì.

## 3. Kiến trúc

```
main (Node 24 của Electron 44)                    renderer (HTML/CSS/JS thuần, không framework)
├─ db.js          node:sqlite + giaoDich()        ├─ app.js        định tuyến, thanh bên
├─ khop.js        chuẩn hoá tiếng Việt, khớp GV   ├─ chung.js      hộp thoại, bảng, thông báo
├─ nhap-xlsx.js   đọc Excel (exceljs)             ├─ rui-ro.js     màn cảnh báo bắt buộc
├─ cat-docx.js    cắt Word (jszip + chuỗi)        ├─ cap-nhat.js   hộp cập nhật có lịch sử bản
├─ kho-gv.js      giáo viên, người nhận ngoài     ├─ trang/*.js    10 trang chức năng
├─ kho-tkb.js     nhập TKB, phiên bản, vân tay    └─ ve-tkb.html   khuôn vẽ ảnh (dùng bởi main)
├─ kho-file.js    thư mục chuẩn, kiểm tra tệp
├─ kho-file-kiem.js  soi thư mục, đối chiếu đã nạp
├─ kho-gui.js     dựng đợt gửi, phát hiện trùng
├─ hang-doi.js    hàng đợi gửi + giới hạn an toàn
├─ zalo.js        zca-js: QR, phiên, dò UID, gửi
├─ anh-tkb.js     vẽ ảnh bằng cửa sổ ngoài màn hình
├─ thong-ke.js    lọc đa chiều, xuất Excel, in
├─ cap-nhat.js    tự cập nhật qua GitHub Releases
└─ ipc.js         đăng ký toàn bộ lệnh cho giao diện
```

Renderer **không chạm Node**: mọi thứ qua `preload.cjs` (contextBridge) → `ipc.js`.
Mỗi lệnh luôn trả `{ok:false, loi:[...]}` thay vì ném lỗi, để giao diện hiện thông báo tử tế.

## 4. Dữ liệu

### 4.1 Nguồn vào (đã soi thật, không đoán)

**Excel xuất từ phần mềm xếp TKB**
- `PCGD`: TT · Giáo viên (họ tên đầy đủ) · Kiêm nhiệm · **CN** (lớp chủ nhiệm) · Phân công chuyên môn
  (`Toán (6A1, 8A2) + HĐTN (8A5)`) · Số tiết. Ô F1 `Số 1`, F2 ngày áp dụng.
- `TKB_LOP_S/_C/_SC`, `TKB_GV_S/_C/_SC`: tiêu đề cột ở hàng 5 (một buổi) hoặc hàng 4–5 (gộp, mỗi cột đôi
  Sáng–Chiều). Dữ liệu hàng 6–35 = 6 thứ × 5 tiết. Ô dạng `Môn - Mã` hoặc `Môn - Lớp`.
- **Lớp có chủ nhiệm thì tiêu đề cột thành `6A1\n(D.Nhàn)`** (bản gộp: `6A1 (D.Nhàn)`). Đây là nguồn
  GVCN thứ hai, phải khớp với cột CN của PCGD.
- A1 mọi sheet: `Trường …\nNăm học 2025 - 2026\nHọc kỳ 2`.

**Word xuất từ phần mềm xếp TKB**
- Body = chuỗi `[w:tbl][w:p có w:sectPr trong pPr]` lặp lại, cuối cùng là `[w:tbl][w:p không sectPr][w:sectPr]`.
- Mọi `sectPr` giống hệt nhau. A4 ngang 16838×11906 twip; A5 ngang 11906×8391.
- **Bản A5 có 120 header + 120 footer RỖNG** được tham chiếu trong mỗi sectPr; bản A4 không có.
- Ô tên: `Giáo viên D.Nhàn` / `Lớp 6A1` (có thể thành `Lớp 6A1 (D.Nhàn)` khi đã nhập GVCN).

### 4.2 Lược đồ SQLite (14 bảng)

`giao_vien` · `nguoi_nhan` + `nguoi_nhan_dk` · `tkb` + `tkb_phien_ban` · `tkb_gv` · `tkb_lop` · `tiet` ·
`dot_gui` + `viec_gui` · `lich_su_gui` · `nhat_ky` · `cai_dat` · `luoc_do`.

Quyết định đáng chú ý:
- **`lich_su_gui` không bao giờ xoá**, kể cả khi xoá thời khoá biểu — để trả lời được "ai đã nhận gì".
- **`viec_gui.buoc`** (`gui_anh` → `gui_file` → `xong`) ghi ngay sau mỗi tin gửi thành công, nhờ đó tắt app
  giữa chừng mở lại không gửi lại ảnh.
- **`van_tay`** = băm SHA-256 của tập `thu.buoi.tiet.môn.lớp.mã` đã sắp xếp. **Cố ý không gồm số TKB và
  ngày** — nếu lịch dạy của một người không đổi thì coi như không cần gửi lại, kể cả khi đổi số TKB.

## 5. Các quyết định kỹ thuật và lý do

### 5.1 `node:sqlite` thay cho better-sqlite3
Electron 44 kèm Node 24.21 nên có sẵn. Không phải biên dịch lại theo ABI, bộ cài chạy ngay.
Đổi lại: **không có `db.transaction()`** → tự bọc `giaoDich()` bằng `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`,
và hàng trả về có prototype null nên luôn sao chép `{...row}` trước khi đưa ra ngoài.

### 5.2 Cắt DOCX bằng thao tác chuỗi, không dùng DOM
`word/document.xml` là **một dòng 1,2–2,8 MB**. Phân tích rồi serialize lại bằng thư viện XML dễ đổi thứ tự
thuộc tính, mất namespace, hỏng `mc:Ignorable`. Cách làm: quét body thành mảng phần tử cấp 1 (đếm độ sâu
`w:tbl` để chịu được bảng lồng), rồi ghép `head + bảng + đoạn cuối + sectPr + tail`. Mọi byte khác giữ nguyên.

Hai bẫy đã xử lý:
- **Không** dùng đoạn `p` có `sectPr` làm đoạn cuối — sẽ sinh hai section và trang trắng.
- Bản A5: xoá `headerReference`/`footerReference` trong sectPr rồi dọn luôn 240 part mồ côi khỏi
  `[Content_Types].xml`, rels và gói zip (nếu không, mỗi tệp cắt ra kéo theo 240 tệp rỗng).

### 5.3 Vẽ ảnh bằng cửa sổ ngoài màn hình
`offscreen: { deviceScaleFactor: 2 }` cho ảnh **luôn 2160 px ngang** bất kể máy người dùng để tỉ lệ hiển thị
100 % hay 150 %. Cửa sổ thường thì kích thước ảnh đổi theo máy.

Ba bẫy đã xử lý (xem `docs/KINH-NGHIEM.md`): hâm nóng trước lần chụp đầu, chụp có thử lại,
và **không huỷ cửa sổ vẽ giữa chừng**.

### 5.4 Giới hạn an toàn khi gửi Zalo — tách theo trạng thái kết bạn
`zca-js` là thư viện không chính thức. Zalo **không công bố** con số chính thức; theo kinh nghiệm cộng đồng,
rủi ro nằm gần hết ở việc nhắn cho **người lạ** (khoảng 10–40 tin/ngày là đã bị để ý), còn nhắn cho
**người đã kết bạn** là hành vi bình thường. Vì vậy giới hạn được **tách làm hai nhóm**:

| Mức | Mặc định | Ghi chú |
|---|---|---|
| Người **đã kết bạn** / 24 giờ | 300 | Trường đông giáo viên thì kết bạn trước rồi nâng mức này |
| Người **chưa kết bạn** / 24 giờ | 30 | Giữ thấp — đây mới là chỗ bị Zalo để ý |
| Tổng số tin / 24 giờ | 700 | |
| Người mỗi đợt | 120 | Chỉ **cảnh báo**, không chặn |

Nhịp gửi: 3–6 s giữa hai tin, 8–15 s giữa hai người, nghỉ 60–90 s sau mỗi 10 người.
Dừng sau 3 lỗi liên tiếp; dừng ngay khi nghi mất phiên.

Ba điểm quan trọng trong cách đếm:
- **Đếm theo từng tài khoản Zalo** (`lich_su_gui.zalo_uid_gui`): đổi sang tài khoản khác là mức đầy lại,
  vì Zalo hạn chế theo tài khoản chứ không theo máy.
- Trạng thái kết bạn lấy từ cột **`lich_su_gui.la_ban` ghi lúc gửi**, không tra lại bảng giáo viên
  (trạng thái có thể đã đổi sau đó).
- Hết mức nhóm này thì **vẫn gửi tiếp cho nhóm kia**: mục thuộc nhóm đã hết bị hoãn
  (`trang_thai='cho_nhom_khac'`) rồi trả về hàng chờ khi đợt kết thúc.

Chạm giới hạn thì **giữ nguyên hàng chờ**, hôm sau bấm Tiếp tục là chạy tiếp.

### 5.5 Gửi ảnh bằng Buffer, không bằng đường dẫn
`zca-js` lấy tên tệp bằng `filePath.split("/").pop()` — trên Windows đường dẫn dùng `\` nên tên tệp thành
cả đường dẫn. Truyền `{ data: Buffer, filename, metadata:{totalSize,width,height} }` vừa tránh lỗi này
vừa khỏi cần thư viện đọc kích thước ảnh (ta đã biết từ lúc vẽ).

Với tệp `.docx` thì truyền đường dẫn được, nhưng `msg` **bắt buộc là chuỗi rỗng** — có chữ sẽ thành hai tin.

### 5.6 Giao diện tự viết
Vanilla ES modules, không bundler. Phông đóng gói offline (Inter · Barlow Semi Condensed · JetBrains Mono —
cùng bộ với bản server S22U), bảng màu kem–coral. Mỗi trang là một mô-đun xuất hàm `ve(khung, thamSo)`,
trả về hàm dọn nếu có đăng ký sự kiện ngoài khung.

### 5.7 Bố cục theo quy trình, gom trang đầu vào làm một

Thanh bên chỉ còn **sáu mục**, trong đó ba mục giữa là ba bước bắt buộc theo thứ tự
(`app:tien-do` tính `khoa` / `xong` / `thieu` cho từng bước; `di()` từ chối mở bước còn khoá và nói rõ
còn thiếu gì). Mọi trang đầu vào gom vào **một trang Dữ liệu** gồm ba khu cuộn liền nhau —
nhập tệp, giáo viên, thời khoá biểu — với thanh nhảy nhanh ở đầu trang và `IntersectionObserver`
tô mục đang xem. `giao-vien.js` và `tkb.js` nhận `{ gon: true }` để vẽ tiêu đề khu thay vì tiêu đề trang,
nên vẫn dùng lại được nguyên vẹn.

Trang **Gửi thời khoá biểu** riêng đã bỏ vì thừa: toàn bộ luồng gửi nằm trong `gui-modal.js`
(`moGui(tkbId)` → tuỳ chọn → xem trước → chạy → danh sách lỗi), gọi từ nút **Gửi qua Zalo**
ở khu Thời khoá biểu và ở bước 3.

**Thanh bên thu gọn:** nút `«` hoặc `Ctrl + B` bật lớp `.mini` (76 px). Chế độ này giấu nhãn dài
nhưng **giữ chữ viết tắt rất nhỏ dưới mỗi icon** — chỉ icon thì người dùng không đoán được mục nào.
Lựa chọn lưu ở `localStorage`, không đụng cơ sở dữ liệu.

**Chân thanh bên** giữ hai thứ dùng thường xuyên: nút **Nối Zalo** và **số hiệu phiên bản** bấm được
để kiểm tra cập nhật (có bản mới thì hiện chấm đỏ).

### 5.8 Kết nối Zalo ở mọi nơi cần

`zalo-nhanh.js` cung cấp `chipZalo()` (nút icon gắn vào tiêu đề bất kỳ trang nào),
`veChipZalo(trangThai)` (vẽ lại mọi nút khi trạng thái đổi) và `moKetNoiZalo()` — hộp quét mã QR
ngay tại chỗ, kết nối xong hiện tên tài khoản / số điện thoại / UID rồi **tự đóng sau 5 giây**.
`canZalo(lời nhắc)` dùng ở đầu mọi việc cần phiên Zalo (gửi tin, dò UID): chưa kết nối thì mở
thẳng hộp QR và đi tiếp khi xong, thay vì bắt người dùng sang màn khác rồi quay lại.

### 5.9 Nhận tệp: phân loại theo nội dung, tên chuẩn, chống trùng

`xepTepVaoKho()` trong `kho-file.js` đọc **nội dung** từng tệp (`kiemTraTep`) để biết loại,
rồi đặt tên theo `tenChuan()` và cất vào đúng thư mục. Tệp Word không mang thông tin số thời khoá biểu
nên **mượn của tệp Excel tổng thả cùng lượt**; không có thì ghi `CHUA-RO`.

Chống lưu thừa bằng **mã băm SHA-256 nội dung**: trùng với tệp đã có trong thư mục đích (kể cả tên khác)
hoặc trùng trong cùng lượt thả thì bỏ qua; nội dung khác mà cùng tên chuẩn thì thay tệp cũ.
Tệp không nhận ra được giữ trong `1 - CHO XU LY\KHONG DUNG DINH DANG`, không xoá.

Hàm trả về **báo cáo từng tệp** (`bao_cao[]`) gồm loại, tên mới, thư mục, kết quả kiểm nội dung
và lý do nếu không nhận — giao diện dựng thẳng thành bảng, không diễn giải lại.

### 5.10 Xem thử đúng như người nhận thấy

`gui:xem-thu` lấy mục cần xem **từ chính `chuanBiDotGui()`** rồi ghép với ảnh xem trước, nên lời nhắn
và tệp hiện trong màn mô phỏng đúng bằng thứ sẽ gửi thật. `xem-mobile.js` dựng khung điện thoại
với bong bóng chat, ảnh và thẻ tệp Word. Không viết bản mô phỏng riêng — bản riêng sẽ lệch dần với thật.

### 5.11 Số hiệu phiên bản

`src/main/phien-ban.js` đọc `version` trong `package.json` làm **nguồn duy nhất**
(`app.getVersion()` trả về số hiệu của Electron khi chạy từ mã nguồn nên không tin được).
`soSanhBan()` cài đúng quy tắc **SemVer 2.0.0**, kể cả thứ tự đuôi tiền phát hành
(`1.0.0-alpha` < `1.0.0-beta.2` < `1.0.0-beta.10` < `1.0.0`) và bỏ qua phần dựng bản sau dấu `+`.
Số hiệu sai chuẩn vẫn so được theo từng cụm số để không ném lỗi. Có `test/phien-ban.test.js` canh
cả hai việc: `package.json` đúng chuẩn, và bảng so sánh mười cặp.

## 6. Luồng nghiệp vụ chính

1. **Nhập danh sách giáo viên** → khoá khớp `ma_gv`, rồi `ho_ten`. Nhập lại là cập nhật, không nhân đôi.
2. **Nhập thời khoá biểu** → xem trước (kiểm tra đủ chưa, thiếu gì) → cất tệp vào kho theo năm học + số →
   ghi tiết → cắt Word. Trùng số thì cảnh báo, chọn cập nhật thì snapshot bản cũ vào `tkb_phien_ban`.
3. **Tạo ảnh** cho từng giáo viên và từng lớp.
4. **Kết nối Zalo** (QR) → **dò UID** theo số điện thoại → đối chiếu bạn bè.
5. **Gửi**: hộp tuỳ chọn → dựng danh sách + phát hiện trùng → xem trước → tạo đợt → gửi thử → gửi cả đợt →
   **danh sách lỗi** (`gomLoiDot`) nêu từng giáo viên không nhận được, số điện thoại, lý do và cách sửa;
   chép được sang Excel.
6. **Lịch sử** và **thống kê**.

## 7. Xác định giáo viên chủ nhiệm

Nguồn theo thứ tự: (1) cột `CN` của PCGD; (2) mã trong ngoặc ở tiêu đề cột lớp; (3) người dùng chọn tay.
**Không suy đoán từ môn dạy** — đã kiểm: chỉ 12 giáo viên dạy HĐTN cho 20 lớp nên suy đoán chắc chắn sai.

Lớp thiếu chủ nhiệm thì **cảnh báo và bỏ qua** khi gửi thời khoá biểu lớp, không tự gán bừa.

## 8. Tự cập nhật

GitHub Releases → lọc asset `TKBZalo-Setup-*.exe` → so semver. Ghi chú phát hành lấy từ
`GHI-CHU-PHAT-HANH.md` lúc phát hành, hiện trong hộp cập nhật kèm **danh sách các bản trước**.
Có SHA-256 trong ghi chú thì kiểm mã băm trước khi chạy bộ cài. Người dùng chọn Tải và cài / Để sau /
Bỏ qua bản này (`cai_dat.bo_qua_ban`).

## 9. Bộ cài

NSIS, `perMachine: false` (không cần quyền quản trị), **`license` = `build/DIEU-KHOAN-RUI-RO.txt`** nên
người dùng **phải bấm “Tôi đồng ý”** mới cài tiếp được. Không cho đổi thư mục cài để bớt bước.
`asar: true`, `npmRebuild: false`, không module native.

## 10. Kiểm chứng

- `npm test`: 69 test cho parser, cắt DOCX, khớp giáo viên, thống kê, hàng đợi, kiểm tra tệp, số hiệu phiên bản.
- `npx electron scripts/thu-chay.mjs`: chạy app thật trên dữ liệu sạch (xoá thư mục thử trước mỗi lần chạy) —
  nhập dữ liệu mẫu, vẽ 58 ảnh, dựng đợt gửi, mở lần lượt từng trang và chụp màn hình,
  kiểm trang Dữ liệu gom đủ ba khu, thanh bên thu gọn/mở rộng và chữ viết tắt không bị cắt,
  chân thanh bên hiện đúng số hiệu; mọi lỗi và cảnh báo trong giao diện đều bị bắt.
- Lỗi phát sinh trong giao diện lúc chạy thật cũng được ghi vào `loi.log` ở thư mục dữ liệu người dùng.
