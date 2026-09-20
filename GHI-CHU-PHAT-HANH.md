# Ghi chú phát hành — TKB Zalo

Khối mới nhất nằm trên cùng. Nội dung khối đầu tiên được dùng làm mô tả bản phát hành
trên GitHub và hiện trong hộp cập nhật của phần mềm.

---

## 0.1.1 — Gọn lại giao diện, sửa kiểm tra cập nhật

- **Cài đặt** chia bốn tab: Chung · An toàn khi gửi · Lời nhắn · Hệ thống.
- **Gửi** chia hai tab: Gửi và Lịch sử gửi. Lịch sử lọc bằng thanh tóm tắt cộng hộp thoại,
  không còn bày sẵn sáu ô lọc chiếm chỗ.
- **Bộ lọc thống kê** chia ba nhóm theo đúng câu hỏi đang tự hỏi: tính trên gì · của ai ·
  phần nào của thời khoá biểu. Mỗi ô chọn nhiều có đếm số đã chọn, nút chọn hết / bỏ hết,
  và ô tìm nhanh khi danh sách dài.
- **Mặc định gửi thời khoá biểu mới nhất.** Chọn bản cũ thì nhắc ngay tại chỗ.
- **Kiểm tra cập nhật**: chưa lập trang phát hành thì nói đúng bản chất, không còn hiện
  "Máy chủ trả mã 404" làm người dùng tưởng máy mình hỏng. Các mã lỗi khác cũng dịch sang
  câu nói rõ nên làm gì.
- Bộ cài tải về nay **được kiểm mã băm SHA-256** trước khi chạy (trước đây hỏng vì ghi chú
  phát hành viết bằng Markdown).
- Ô chọn ngày hiện **dd/mm/yyyy** thay vì kiểu Mỹ.

---

## 0.1.0 — Bản đầu tiên

Gửi thời khoá biểu cho giáo viên qua Zalo cá nhân: mỗi người nhận một ảnh xem ngay và một tệp Word để in.

- **Nhập dữ liệu** từ tệp Excel và Word xuất ra từ phần mềm xếp thời khoá biểu. Có thư mục chờ xử lý,
  tự nhận diện từng tệp, kiểm tra đủ dữ liệu chưa và báo rõ thiếu gì.
- **Kho dữ liệu theo năm học và số thời khoá biểu**; cảnh báo khi thư mục có tệp chưa nạp hoặc mới hơn
  lần nạp gần nhất.
- **Quản lý giáo viên**: nhập từ Excel, thêm sửa xoá, dò Zalo theo số điện thoại, đánh dấu người chưa kết bạn.
  Thêm được người nhận ngoài danh sách (hiệu trưởng, tổ trưởng…).
- **Thời khoá biểu theo số và ngày phát hành**; nhập trùng số thì cảnh báo và giữ lưu vết bản cũ.
- **Ảnh thời khoá biểu** rộng 2160 điểm ảnh, chữ to, xem rõ trên điện thoại.
- **Gửi Zalo** với hộp tuỳ chọn nhiều loại: chọn gửi gì, cho ai, dạng tệp nào; xem trước ai nhận gì;
  gửi thử vài người trước.
- **Chống gửi trùng**: nhận ra người đã nhận y nguyên nội dung, và tuỳ chọn chỉ gửi người có thay đổi.
- **Giới hạn an toàn tách theo trạng thái kết bạn**: 300 người đã kết bạn và 30 người chưa kết bạn
  trong 24 giờ, 700 tin. Hết mức nhóm này vẫn gửi tiếp nhóm kia. Đếm theo từng tài khoản Zalo nên
  đổi tài khoản là mức đầy lại. Giãn nhịp ngẫu nhiên, nghỉ sau mỗi 10 người, tự dừng khi 3 lỗi liên tiếp.
- **Danh sách lỗi sau mỗi đợt**: ai không nhận được, số điện thoại, vì sao, cách sửa — chép được sang Excel.
- **Tắt máy giữa chừng vẫn tiếp tục được** đúng chỗ, không gửi lại ảnh cho người đã nhận.
- **Lịch sử gửi đầy đủ**: ai nhận gì, lúc nào, tệp nào, kết quả ra sao.
- **Thống kê số tiết** lọc đa chiều, sáu cách xem, xuất Excel và in theo đúng bộ lọc.
- **Hướng dẫn sử dụng chi tiết ngay trong phần mềm**, đọc được khi không có mạng.

**Giao diện theo quy trình**

- Thanh bên rút còn sáu mục, trong đó ba bước bắt buộc theo thứ tự: **Dữ liệu → Kết nối Zalo → Gửi**.
  Bước sau khoá cho tới khi bước trước xong và nói rõ còn thiếu gì.
- **Mọi thứ về dữ liệu đầu vào gom vào một trang**: nhập tệp, giáo viên, thời khoá biểu — có thanh
  nhảy nhanh giữa ba khu. Kéo thả tệp vào là xong, kể cả danh sách giáo viên.
- **Gửi ngay tại chỗ**: nút *Gửi qua Zalo* ở khu Thời khoá biểu mở hộp tuỳ chọn, không phải sang trang khác.
- **Nút nối Zalo nhanh** ở thanh bên và các trang cần dùng. Bấm Gửi khi chưa kết nối thì app mở thẳng
  hộp quét mã QR; kết nối xong hiện thông tin tài khoản rồi tự đóng sau 5 giây.
- **Thanh bên thu gọn được** bằng nút `«` hoặc `Ctrl + B`, vẫn giữ chữ viết tắt dưới mỗi icon.
- **Số hiệu phiên bản ở cuối thanh bên**, bấm để kiểm tra cập nhật; có bản mới thì hiện chấm đỏ.
  Số hiệu đánh theo đúng chuẩn SemVer, bản thử nghiệm luôn được coi là cũ hơn bản chính thức cùng số.
- Trang **Cài đặt** gọn lại: mỗi dòng một việc, có ước lượng thời gian gửi mỗi người ngay khi chỉnh nhịp.
- Trang **Dữ liệu** chia ba tab (Nhập tệp · Giáo viên · Thời khoá biểu), không cuộn dài một mạch.
- **Thống kê** rút bộ lọc thành một thanh gọn: chip tóm tắt điều kiện đang áp dụng, bấm “Bộ lọc…” mới mở hộp đủ chiều.
- Trang chủ bỏ khỏi menu, quay lại bằng cách **bấm tên phần mềm** ở đầu thanh bên.

**Nhận tệp thông minh**

- Kéo thả tệp vào là phần mềm **đọc nội dung để phân loại**, tự đặt **tên chuẩn**
  (`TKB-2025-2026-So-01-TONG.xlsx`, `DS-GV.xlsx`…) và cất đúng thư mục.
- **Không lưu trùng**: tệp có nội dung y hệt tệp đã có trong kho thì bỏ qua, dù tên khác.
- Sau mỗi lần thả có **báo cáo đủ trạng thái**: từng tệp thành gì, tên gì, ở đâu, cái nào không nhận và vì sao.
- Tệp không nhận ra vẫn được giữ trong thư mục riêng, không xoá.
- **Nạp danh sách giáo viên trước** rồi mới nhập được thời khoá biểu, có dải tiến độ nhắc thứ tự.

**Soát trước khi gửi**

- Nút **Trên ĐT** dựng lại đúng màn hình điện thoại người nhận: lời nhắn, ảnh và thẻ tệp Word.
- **Sửa giáo viên ngay trên bảng**, rời ô là tự lưu, không phải mở hộp thoại.
- Khuyến cáo đổi lại: **nên gửi bằng tài khoản Zalo phụ**, giữ tài khoản chính cho việc hằng ngày.
