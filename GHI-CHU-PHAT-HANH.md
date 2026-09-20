# Ghi chú phát hành — TKB Zalo

Khối mới nhất nằm trên cùng. Nội dung khối đầu tiên được dùng làm mô tả bản phát hành
trên GitHub và hiện trong hộp cập nhật của phần mềm.

---

## 0.1.7 — Gửi trùng chỉ cảnh báo, không chặn nữa

- **Bỏ khoá gửi trùng.** Trước đây phần mềm tự bỏ qua người đã nhận y nguyên, nên bấm gửi lại là
  không gửi được gì. Nay **gửi lại luôn được**, phần mềm chỉ cảnh báo và đánh dấu mục nào từng nhận
  đúng nội dung đó. Máy đã dùng bản cũ được gỡ khoá tự động một lần.
- Muốn khỏi gửi trùng thì tự tích **Bỏ qua người đã nhận y nguyên** hoặc **Chỉ gửi người có thay đổi**.
- Bảng xem trước đổi nhãn cho đúng nghĩa: *lần đầu* · *có thay đổi* · *gửi lại · đã nhận y nguyên*.
- Hướng dẫn ghi rõ **tệp duy nhất cần có**: tệp Excel tổng tên bắt đầu bằng `SS.`
  (ví dụ `SS.2609201832133477.xlsx`), lấy từ *Hệ thống → Chuyển đổi dữ liệu sang Excel*.

---

## 0.1.6 — Gửi vào nhóm Zalo, hộp gửi nói rõ ai nhận được

**Nhóm Zalo**

- Màn **Kết nối Zalo** thêm **Chọn nhóm nhận thời khoá biểu**: đọc danh sách nhóm của tài khoản
  đang đăng nhập, gõ tên để lọc, tích nhóm nào thì nhóm đó thành người nhận.
- **Gửi vào nhóm không cần số điện thoại, không cần kết bạn** — dùng thẳng mã nhóm.
  Hợp với nhóm tổ chuyên môn hay nhóm toàn trường.
- Nhóm hiện ở mục *Người nhận ngoài danh sách*, ghi rõ tên nhóm và số thành viên.

**Hộp tuỳ chọn gửi làm lại**

- Mở ra thấy ngay bốn con số: **gửi được ngay · chưa kết bạn · chưa dò Zalo · không gửi được**.
- Chia ba tab: *Gửi cho ai* · *Gửi cái gì* · *Lời nhắn*, thay cho một màn dồn hết mọi thứ.
- Danh sách người nhận nay ghi rõ từng người: **có số điện thoại chưa, đã dò Zalo chưa,
  đã kết bạn chưa**. Người không gửi được thì làm mờ và không tích vào được.
- Có **ô tìm** và **bộ lọc theo trạng thái** (chỉ người đã kết bạn, chỉ nhóm, chỉ người chưa kết bạn…),
  nút chọn hết và bỏ hết.
- Còn người chưa dò Zalo thì có nút **Dò Zalo ngay** ngay trong hộp, dò xong tự quay lại.

---

## 0.1.5 — Ảnh thời khoá biểu vẽ lại cho điện thoại, chỉ cần một tệp là chạy

**Ảnh thời khoá biểu**

- Vẽ lại cho **màn hình điện thoại**: bỏ hẳn cột ngày cả tuần không có tiết và các tiết trống ở cuối
  buổi, nên cột rộng ra, chữ to hơn, nhìn trong khung chat Zalo vẫn đọc được.
- Gộp sáng và chiều vào **một bảng**, ngăn nhau bằng một hàng mỏng, thay cho hai bảng lặp hàng tiêu đề.
- Thông tin đầu ảnh chuyển thành các **thẻ tròn** gọn: số thời khoá biểu, ngày thực hiện, học kỳ,
  năm học, lớp chủ nhiệm.
- **Ảnh không bị co kéo**: chiều cao chạy theo đúng nội dung, giữ dáng tự nhiên.

**Chuẩn bị dữ liệu nhẹ đi**

- **Chỉ cần MỘT tệp Excel tổng là gửi được.** Ảnh vốn được vẽ từ số liệu trong tệp này, không cần
  tệp Word nào. Khi chưa có danh sách giáo viên, phần mềm **tạo giáo viên thẳng từ bảng phân công**
  (suy mã viết tắt từ môn và lớp dạy); bạn chỉ cần điền số điện thoại ngay trên bảng.
- Thả tệp vào là **báo rõ tệp nào cần, tệp nào không**: Bắt buộc / Nên có / Tuỳ chọn / Không dùng được,
  kèm một câu giải thích thiếu nó thì mất gì.
- Mục *Chuẩn bị tệp* viết lại theo ba mức: tối thiểu 1 tệp · nên dùng 2 tệp · đầy đủ 4 tệp.

- Nút **Gửi qua Zalo** ở bước 3 nay thẳng hàng và cao bằng ô chọn thời khoá biểu.

**Biết tin có đến nơi thật không**

- Zalo báo lại khi tin **đã tới máy người nhận** và khi họ **đã xem** — phần mềm ghi vào lịch sử và
  hiện cột *Đến nơi*: Đã xem / Đã tới máy / Chưa xác nhận.
- Trong lúc gửi, nhật ký hiện ngay dòng *✓✓ đã tới máy người nhận*.
- Lưu ý: chỉ bắt được tin báo khi phần mềm đang mở. Tin tới nơi lúc đã tắt máy thì không ghi nhận được.

---

## 0.1.4 — SỬA LỖI KHÔNG GỬI ĐƯỢC TỆP WORD

- **Người nhận chỉ thấy ảnh, không thấy tệp Word.** Nguyên nhân: thư viện Zalo tải tệp đính kèm
  lên theo từng phần rồi **đợi một sự kiện báo "tải xong" qua WebSocket** mới coi là hoàn tất,
  mà phần mềm chưa bật kênh nhận sự kiện đó. Ảnh không phải đợi nên vẫn gửi được, còn tệp Word
  thì treo vĩnh viễn, không báo lỗi. Nay phần mềm **bật kênh nhận sự kiện ngay sau khi đăng nhập**.
- Thêm **hạn chờ 2 phút** khi gửi tệp: quá hạn thì báo lỗi rõ ràng thay vì treo im lặng.
- **Sửa lỗi đợt gửi dở không chạy tiếp được**, báo nhầm *"Chạm giới hạn an toàn trong 24 giờ"*
  trong khi chưa gửi cho ai. Nguyên nhân: việc còn dở nằm ở trạng thái *đang gửi*, mà phép đếm
  giới hạn chỉ nhìn việc *đang chờ*, và bước khôi phục lại chạy sau phép đếm.
- Đợt gửi đang dở nay **tự chạy tiếp đúng chỗ**: người đã nhận ảnh rồi thì chỉ gửi nốt tệp Word,
  không gửi lại ảnh.
- Đã kiểm chứng bằng tài khoản Zalo thật: ảnh và tệp Word đều đến nơi.

**Hướng dẫn lấy tệp từ phần mềm xếp thời khoá biểu**

- Mục *Chuẩn bị tệp* nay ghi đủ ba bước: (1) Dữ liệu → Dữ liệu giáo viên → Danh sách giáo viên →
  biểu tượng Excel → **Copy file dữ liệu mẫu**; (2) Hệ thống → **Chuyển đổi dữ liệu sang Excel**;
  (3) Hệ thống → In ấn → Thời khoá biểu **theo lớp** và **theo giáo viên**, xuất ra tệp Word.
- Ba bước này cũng hiện ngay ở trang Dữ liệu khi máy còn trắng, kèm nút mở hướng dẫn đầy đủ.

---

## 0.1.3 — Nói đúng thứ còn thiếu ở bước Gửi

- **Sửa lỗi gây hiểu nhầm:** đã quét mã QR xong mà bước Gửi vẫn báo *"Còn thiếu: chưa kết nối Zalo"*.
  Thật ra còn thiếu việc **dò Zalo theo số điện thoại của từng giáo viên**. Nay bước bị khoá nêu
  đúng từng thứ còn thiếu, không nói gộp nữa.
- Trang **Kết nối Zalo** nay phân biệt rõ hai việc: kết nối xong nhưng chưa dò được ai thì hiện
  ngay *"Kết nối xong, nhưng chưa gửi được"* kèm số người đã có Zalo và nút **Dò Zalo ngay**.
- Bỏ dòng *"Tệp tối đa 0 MB"* khi chưa đọc được giới hạn thật từ Zalo.

---

## 0.1.2 — Đèn báo kết nối Zalo

- **Đèn nhịp ở góc trên bên phải**, thấy ở mọi trang: chấm **xanh đang đập** là đang kết nối,
  chấm **vàng** là đang chờ quét mã, chấm **xám đứng yên** là chưa kết nối. Bấm vào để quét mã.
- Phiên Zalo đứt giữa chừng thì đèn tắt trong vòng 30 giây, không để gửi nhầm khi đã mất kết nối.
- Bỏ nút Zalo trùng ở đầu trang Tổng quan và Dữ liệu, vì đèn góc phải đã nói đủ.

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
