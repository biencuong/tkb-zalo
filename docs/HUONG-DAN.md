# Hướng dẫn sử dụng TKB Zalo

> Tệp này được **sinh tự động** từ nội dung Trợ giúp trong phần mềm
> (`src/renderer/js/noi-dung.js`). Đừng sửa trực tiếp tệp này —
> sửa ở mô-đun nội dung rồi chạy `npm run huong-dan`.
>
> Cập nhật: 21/9/2026

## Mục lục

- [1. App làm gì](#bat-dau)
- [2. Cài đặt và cập nhật](#cai-dat)
- [3. Chuẩn bị tệp](#chuan-bi)
- [4. Nạp dữ liệu](#thu-muc)
- [5. Danh sách giáo viên](#giao-vien)
- [6. Thời khoá biểu](#nhap-tkb)
- [7. Kết nối Zalo](#zalo)
- [8. Vì sao có người không nhận được](#ket-ban)
- [9. Gửi thời khoá biểu](#gui)
- [10. Gửi lại và cảnh báo trùng](#trung)
- [11. Lịch sử gửi](#lich-su)
- [12. Thống kê số tiết](#thong-ke)
- [13. Lỗi thường gặp](#loi)
- [14. Điều khoản và rủi ro](#rui-ro)

---

<a id="bat-dau"></a>

## 1. App làm gì

Nhận thời khoá biểu bạn xuất từ phần mềm xếp TKB, gửi cho từng giáo viên qua Zalo cá nhân của bạn. Mỗi người nhận **một ảnh** (xem ngay trên điện thoại) và **một tệp Word** (tải về in). Giáo viên chủ nhiệm nhận thêm thời khoá biểu lớp mình.

### Làm theo thứ tự

1. Trên **Smart Scheduler**: chọn **Hệ thống | Chuyển đổi dữ liệu sang Excel**, bấm **Chấp nhận**, lưu tệp Excel vừa tạo.
2. **Kéo thả** tệp đó vào trang **Dữ liệu** (hoặc bấm **＋ Thêm tệp dữ liệu**) → xem thử → bấm **Nạp dữ liệu**. Phần mềm tự tạo danh sách giáo viên và ảnh thời khoá biểu.
3. Lần đầu: **điền số điện thoại** giáo viên ngay trên bảng, rồi **quét mã QR Zalo**.
4. Bấm **Gửi**: chọn gửi gì cho ai rồi gửi. Muốn chắc thì gửi thử vài người trước.

Lần sau có thời khoá biểu mới: xuất tệp mới, thả vào, nạp, bấm **Gửi**.

### Màn hình có gì

Thanh bên trái là **ba bước theo đúng thứ tự**: Dữ liệu → Kết nối Zalo → Gửi. **Gửi** chỉ khoá khi chưa có thời khoá biểu hoặc chưa có ai để gửi — cần ít nhất **1 số điện thoại** hoặc **1 nhóm Zalo**. Chưa kết nối Zalo vẫn bấm Gửi được: hộp quét mã QR tự hiện, quét xong đi tiếp. Rê chuột vào bước bị khoá là thấy còn thiếu gì.

- **Dữ liệu** gom cả ba việc vào một trang: nhập tệp, danh sách giáo viên, thời khoá biểu. Thanh nhảy nhanh ở đầu trang đưa tới đúng khu.
- Nút **«** ở góc trên thanh bên (hoặc **Ctrl + B**) thu gọn thanh bên còn icon kèm chữ viết tắt, để màn hình rộng hơn. Bấm lại để mở ra.
- Cuối thanh bên là **số hiệu phiên bản** — bấm vào là kiểm tra cập nhật. Trạng thái Zalo xem ở **đèn góc trên bên phải**, bấm đèn là mở luôn màn kết nối.

### Vì sao có phần mềm này

Cách chính thống để gửi thời khoá biểu là qua **email** hoặc **Zalo OA của trường**, nhưng **cài đặt khá phức tạp**, Zalo OA còn phải đăng ký và chờ được duyệt.

Phần mềm này **đi đường đơn giản**: dùng chính tài khoản Zalo cá nhân sẵn có, quét mã QR một lần là gửi được ngay — không đăng ký, không chờ duyệt, không tốn phí. Đổi lại, phải gửi chừng mực để tài khoản không bị hạn chế (xem mục **Điều khoản và rủi ro**), nên khuyến cáo dùng **một tài khoản Zalo phụ**.

Ngoài việc gửi, phần mềm làm thêm mấy việc mà gửi tay không làm được:

- Mỗi thầy/cô nhận đúng thời khoá biểu của mình: **dạng ảnh xem ngay** trên điện thoại và **file Word để in**; chủ nhiệm nhận thêm thời khoá biểu lớp.
- **Gửi vào nhóm Zalo** của tổ chuyên môn, của trường, của nhóm cha mẹ học sinh...
- **Thống kê số tiết** theo giáo viên, lớp, môn, buổi; xuất Excel và in biểu mẫu báo cáo.
- **Lịch sử gửi** có trạng thái tin đã tới nơi hay chưa, ai chưa nhận được và vì sao.

App miễn phí, không liên kết với Zalo hay phần mềm xếp TKB nào.

---

<a id="cai-dat"></a>

## 2. Cài đặt và cập nhật

Chạy `TKBZalo-Setup-x.y.z.exe`. Bộ cài hiện bảng điều khoản, phải bấm **Tôi đồng ý** mới cài tiếp. Cài vào thư mục người dùng nên **không cần quyền quản trị**. Không cần Word, Python hay Node.

Lần đầu Windows có thể cảnh báo SmartScreen vì bộ cài chưa ký số: bấm “Thông tin thêm” → “Vẫn chạy”.

### Cập nhật

Số hiệu đánh theo chuẩn **chính.phụ.vá** (ví dụ `1.2.0`): số cuối là sửa lỗi, số giữa là thêm chức năng, số đầu là thay đổi lớn. Bản thử nghiệm có thêm đuôi (`1.2.0-beta.1`) và luôn được coi là cũ hơn bản chính thức cùng số.

App **tự hỏi** có bản mới không: lúc mở, rồi **cứ mỗi giờ**, và khi bạn quay lại cửa sổ sau một lúc lâu. Để app mở cả ngày vẫn được báo. Có bản mới thì:

- Hiện **thông báo ở góc dưới** kèm nút xem nội dung cập nhật.
- **Số hiệu ở cuối thanh bên** chuyển màu và có chấm đỏ.

Bấm vào đó để xem **nội dung bản mới và các bản trước**, rồi chọn **Tải và cài** / **Để sau** / **Bỏ qua bản này**. Tự kiểm tra bất cứ lúc nào: bấm số hiệu ở cuối thanh bên, hoặc vào **Cài đặt → Kiểm tra cập nhật**.

Cập nhật **không mất** dữ liệu. Gỡ app cũng không xoá thư mục **Tài liệu → TKB Zalo**.

---

<a id="chuan-bi"></a>

## 3. Chuẩn bị tệp

> **Chỉ cần một tệp: tệp Excel do Smart Scheduler chuyển đổi ra.** Tệp này có đủ bảng phân công, họ tên giáo viên và toàn bộ tiết học.

### Lấy tệp Excel từ Smart Scheduler

1. Chọn **Hệ thống | Chuyển đổi dữ liệu sang Excel**.
2. Hộp **Chuyển đổi dữ liệu sang Excel** hiện ra. Giữ tích ít nhất ba ô: **Bảng phân công giảng dạy**, **TKB lớp học**, **TKB giáo viên** (mặc định đã tích sẵn). Các ô khác để nguyên cũng được.
3. Bấm **Chấp nhận**. Smart Scheduler chuyển toàn bộ dữ liệu sang một tệp Excel — lưu tệp đó lại.
4. Sang TKB Zalo: **kéo thả** tệp đó vào trang **Dữ liệu**, hoặc bấm **＋ Thêm tệp dữ liệu** → xem thử → **Nạp dữ liệu**.

> **Đừng bỏ tích “TKB giáo viên”.** Phần mềm dùng sheet đó để nhận ra mã viết tắt của từng giáo viên khi tạo danh sách giáo viên từ bảng phân công.

### Phần mềm tự làm từ tệp đó

- **Tạo danh sách giáo viên** từ bảng phân công và tự nhận ra mã viết tắt của từng người (`P.Ha`, `Thuy Ha`…) — kể cả chủ nhiệm không dạy tiết nào.
- **Ghép từng tiết** vào đúng giáo viên, đúng lớp.
- **Vẽ ảnh thời khoá biểu** cho từng giáo viên và từng lớp, xem ngay trên điện thoại.
- **Tạo file Word để in** cho từng giáo viên và từng lớp, **đúng mẫu Word của Smart Scheduler**, cả khổ **A4** và **A5**.

Việc duy nhất phải làm thêm: **điền số điện thoại** giáo viên, vì tệp Excel không có số. Chỉ làm một lần, những lần sau phần mềm nhớ.

### Thêm tệp nếu muốn

| Tệp | Lấy ở đâu trên Smart Scheduler | Được thêm gì |
|---|---|---|
| **Danh sách giáo viên** có số điện thoại | Mục **Dữ liệu giáo viên**, chọn **Excel | Copy file dữ liệu mẫu**. Mở ra điền danh sách và số điện thoại rồi lưu. | Khỏi gõ số điện thoại từng người. |
| **Tệp Word** — thường **không cần** | Mục **In ấn → In TKB cá nhân**: **In TKB giáo viên** / **In TKB lớp học**, tích **Chọn tất cả**, chọn khổ, bấm **Chấp nhận**. | Chỉ khi bạn đã **sửa tay** trên Word của Smart Scheduler và muốn gửi đúng bản đó. Phần mềm dùng tệp này thay cho bản tự tạo cùng khổ. |


> **Có thêm tệp thì thả cùng lượt với tệp Excel tổng.** Thả cùng lượt thì tệp Word mới biết nó thuộc thời khoá biểu số mấy.

### Nhớ nhập giáo viên chủ nhiệm

> **Chưa nhập thì phần mềm không biết gửi thời khoá biểu lớp cho ai.** Nhập “Danh sách giáo viên chủ nhiệm” trên Smart Scheduler rồi xuất Excel lại.
> Hoặc chọn tay từng lớp ở tab Thời khoá biểu.

Đóng Word và Excel trước khi nạp, nếu không phần mềm báo lỗi đọc tệp.

---

<a id="thu-muc"></a>

## 4. Nạp dữ liệu

### Kéo thả, xem thử, nạp

1. Ở trang **Dữ liệu**, **kéo thả** tệp vào, hoặc bấm **＋ Thêm tệp dữ liệu** để chọn tệp.
2. Hộp **Xem thử và nạp dữ liệu** hiện ra: số thời khoá biểu, ngày thực hiện, số lớp, số tiết, giáo viên nào được thêm hay cập nhật, lớp nào chưa có chủ nhiệm. **Lúc này chưa ghi gì.**
3. Bấm **Nạp dữ liệu**. Phần mềm nạp đúng thứ tự — danh sách giáo viên trước, thời khoá biểu sau — rồi **tự tạo ảnh**.

> **Chưa có danh sách giáo viên cũng nạp được.** Hộp xem thử có sẵn ô **Tạo giáo viên từ bảng phân công**, đã tích sẵn.

Bấm **Để sau** thì tệp nằm chờ ở tab **Nhập tệp**; khi sẵn sàng bấm **Xem thử và nạp** trên thẻ tệp.

### Phần mềm tự đặt tên và cất tệp

Phần mềm **đọc nội dung từng tệp** để biết đó là gì, rồi tự đặt tên chuẩn:

|   |   |
|---|---|
| Excel tổng | `TKB-2025-2026-So-01-TONG.xlsx` |
| Word thời khoá biểu giáo viên | `TKB-2025-2026-So-01-GV-A4.docx` |
| Word thời khoá biểu lớp | `TKB-2025-2026-So-01-LOP-A4.docx` |
| Danh sách giáo viên | `DS-GV.xlsx` |
| Không nhận ra | để riêng trong `KHONG DUNG DINH DANG`, không xoá |


**Không lưu trùng:** thả lại tệp có nội dung y hệt (kể cả khác tên) thì phần mềm bỏ qua. Tệp nào không dùng được, hộp xem thử nói rõ vì sao và cần tệp nào thay.

### Thư mục dữ liệu

Mọi tệp nằm trong **Tài liệu → TKB Zalo**:

|   |   |
|---|---|
| 1 - CHO XU LY | Tệp vừa thả, chờ nạp. |
| 2 - DU LIEU DA NHAP | Tệp gốc theo năm học và số thời khoá biểu, kèm ảnh và tệp Word đã cắt. |
| 3 - DANH SACH GIAO VIEN | Tệp Excel danh sách giáo viên. |
| 4 - KET XUAT | Bảng thống kê bạn xuất ra. |


Tab **Nhập tệp** có mục **Kho tệp** để xem, tạo, đổi tên, xoá thư mục ngay trong phần mềm. Phần mềm đối chiếu thư mục với dữ liệu đã nạp: có tệp **chưa nạp** hoặc **mới hơn lần nạp** thì hiện nút nạp ngay, tránh gửi nhầm thời khoá biểu cũ.

---

<a id="giao-vien"></a>

## 5. Danh sách giáo viên

Nạp tệp Excel tổng là phần mềm tự tạo danh sách giáo viên từ bảng phân công. Nếu muốn có sẵn số điện thoại, thả kèm tệp danh sách giáo viên với các cột dưới đây.

### Các cột trong tệp Excel danh sách giáo viên

| Cột | Ý nghĩa |
|---|---|
| **Họ đệm**, **Tên** | Hai cột riêng. |
| **Mã GV** | **Quan trọng nhất.** Tên viết tắt trong thời khoá biểu (`P.Ha`, `Thuy Ha`). Sai mã là không khớp được. |
| **Mã GV 2** | Mã dự phòng khi bản TKB khác đặt mã khác. |
| **Điện thoại di động** | Số dùng Zalo. Không có thì không gửi được. |
| Email, Ghi chú, Zalo UID | Không bắt buộc. Zalo UID để trống, app tự dò. |


> **Số điện thoại hay mất số 0 đầu.** Định dạng ô Excel là **Văn bản** trước khi nhập số.

Nhập lại tệp thì người đã có được **cập nhật**, không nhân đôi.

### Người nhận ngoài danh sách

Hiệu trưởng, tổ trưởng… muốn nhận nhưng không dạy tiết nào thì thêm ở tab **Người nhận ngoài danh sách**, chọn nhận **tất cả lớp**, **một số lớp**, hoặc TKB của **một số giáo viên**.

Phần **Nhận thời khoá biểu nào** xếp **hai cột**: bên trái Từng lớp, bên phải Từng giáo viên. Mỗi cột có ô tìm, số đã chọn và nút **Chọn hết** / **Bỏ hết** — trường đông giáo viên vẫn chọn nhanh, khỏi cuộn dài.

### Sửa ngay trên bảng

Bấm thẳng vào ô **họ tên, mã GV, tổ, điện thoại, email, lớp chủ nhiệm** rồi gõ. Rời ô là **tự lưu**, ô sáng xanh một nhịp cho biết đã lưu. Enter để lưu nhanh, Esc để bỏ.

Đổi số điện thoại thì nhớ bấm **Dò Zalo** lại cho người đó. Nút **⋯** mở hộp đầy đủ khi cần sửa nhiều trường một lúc.

### Xoá toàn bộ giáo viên

Biểu tượng **thùng rác** ở cuối thanh tiêu đề bảng Giáo viên xoá hết danh sách. Phải tích **Tôi hiểu** thì nút xoá mới bấm được.

- Mất cả số điện thoại đã nhập và kết quả dò Zalo. Không hoàn tác được.
- Vẫn giữ: lịch sử gửi, nhóm Zalo, người nhận ngoài danh sách.
- Xoá xong, **nạp lại tệp thời khoá biểu** để phần mềm tạo và ghép lại giáo viên.

---

<a id="nhap-tkb"></a>

## 6. Thời khoá biểu

Nạp xong, thời khoá biểu hiện ở tab **Thời khoá biểu** của trang Dữ liệu, **mặc định là bản mới nhất**. Ảnh đã được tạo sẵn.

### Hộp xem thử kiểm tra gì

- Số thời khoá biểu, ngày thực hiện, năm học, học kỳ, tên trường. Thiếu thì cho điền tay ngay.
- Số lớp, số giáo viên, tổng tiết.
- **Lớp nào chưa có giáo viên chủ nhiệm.**
- Giáo viên nào **chưa khớp** danh sách — có ô **Tạo thêm những người còn thiếu** từ bảng phân công.

### Nạp trùng số

> **Số đã có thì hộp xem thử nói rõ, kèm so sánh cũ – mới.** Bấm **Nạp dữ liệu (cập nhật bản đã có)** thì bản cũ được lưu vết ở tab Lịch sử bản.
> Không mất gì.

### Ảnh

Mỗi giáo viên và mỗi lớp một ảnh, chữ to, xem rõ trên điện thoại. Bấm **Xem** hoặc **Trên ĐT** ở từng dòng để soi trước.

### Không cần bấm tạo — phần mềm tự làm mới

Ảnh và file Word **tự tạo** khi nạp, và **tự làm mới** khi số liệu dùng để vẽ ra chúng thay đổi: nạp bản cập nhật cùng số, đổi chủ nhiệm, sửa tên giáo viên, đổi tên trường, đổi “ảnh gồm buổi nào”. Làm mới thì **ghi đè đúng tên tệp cũ**, không sinh thêm tệp.

> **Mỗi lần gửi, phần mềm kiểm lại từng tệp trước.** Tệp nào lệch với số liệu mới nhất thì tạo lại ngay rồi mới gửi — không bao giờ gửi tệp cũ.
> Hộp **Xem trước đợt gửi** ghi rõ đã kiểm và vừa làm mới bao nhiêu tệp.

### File Word

Nạp xong là phần mềm **tự tạo file Word** cho từng giáo viên và từng lớp, **đúng mẫu Word của Smart Scheduler** (cùng khung, phông, cách ghi “Môn - Lớp”), cả khổ **A4** và **A5**. Tệp nằm trong thư mục `wordgv` và `wordlop`, tên có đuôi `_A4` / `_A5`.

Nếu bạn có thả tệp Word của Smart Scheduler, phần mềm dùng tệp đó cho khổ tương ứng và chỉ tự tạo khổ còn lại.

### Xoá thời khoá biểu

Bấm **Xoá…** ở đầu khu Thời khoá biểu. Trong hộp xoá, chọn một trong ba cách:

- Tích **từng số**.
- Tích **cả một đợt** — các số cùng năm học và học kỳ.
- Tích **Chọn tất cả** để xoá toàn bộ.

Mặc định xoá luôn ảnh và tệp Word đã tạo của các bản đó. **Lịch sử gửi vẫn giữ**; tệp gốc vẫn còn trong thư mục dữ liệu, cần thì nạp lại.

---

<a id="zalo"></a>

## 7. Kết nối Zalo

Vào **Kết nối Zalo** → **Đăng nhập Zalo (quét QR)**. Mở Zalo trên điện thoại, quét mã. Quét một lần, lần sau tự vào.

### Đèn báo ở góc trên bên phải

Lúc nào cũng thấy, ở mọi trang:

|   |   |
|---|---|
| **Chấm xanh đang đập** | Đang kết nối, gửi được. Còn đập là còn kết nối. |
| **Chấm vàng** | Đang chờ bạn quét mã QR. |
| **Chấm xám đứng yên** | Chưa kết nối. Bấm vào để quét mã. |


Phiên Zalo đứt giữa chừng thì đèn tắt trong vòng 30 giây, không để bạn gửi nhầm khi đã mất kết nối.

### Gửi vào nhóm Zalo

Ở màn **Kết nối Zalo** bấm **Chọn nhóm nhận thời khoá biểu**. Phần mềm đọc danh sách nhóm của tài khoản đang đăng nhập, gõ tên để lọc, tích nhóm nào thì nhóm đó thành người nhận.

> **Gửi vào nhóm không cần số điện thoại và không cần kết bạn.** Mình đã ở trong nhóm rồi nên tin chắc chắn tới.
> Hợp với nhóm tổ chuyên môn hoặc nhóm toàn trường: một lần gửi là cả nhóm thấy.

> **Phải chọn nhóm nhận thời khoá biểu nào, nếu không gửi sẽ không ra tin.** Ngay trong hộp chọn nhóm có ô **Nhóm được nhận thời khoá biểu nào**: tất cả các lớp, hoặc tất cả giáo viên.
> Phần mềm không tự đoán được nên không đặt thì nó không biết gửi gì vào nhóm.

Nhóm đã chọn hiện ở **Dữ liệu → Giáo viên → Người nhận ngoài danh sách**, ghi rõ tên nhóm và số thành viên. Sửa lại ở đó nếu muốn nhóm nhận thứ khác.

### Sửa nhóm ở đâu

- **Ngay trong hộp gửi:** tab **Gửi cái gì**, khối **Nhóm Zalo và người ngoài danh sách nhận gì**. Mỗi dòng có hai ô **Tất cả lớp** và **Tất cả GV** — tích được **cả hai**. Muốn chỉ vài lớp, vài giáo viên thì bấm **Chọn lớp, GV cụ thể…** (hộp hai cột, có ô tìm). Lưu xong quay lại đúng tab, các tuỳ chọn đang chỉnh vẫn giữ.
- Tab **Gửi cho ai**: dòng nhóm chưa đặt nhận gì có sẵn ô **Chọn nhận gì…** để đặt nhanh.
- **Dữ liệu → Giáo viên → Người nhận ngoài danh sách:** có nút **Thêm nhóm Zalo** và **Dò nhóm Zalo**. Bấm **Sửa** ở dòng nhóm để đổi nhóm nhận thời khoá biểu nào.

> **Nhóm không có số điện thoại, và không cần.** Hộp sửa nhóm không hỏi số, chỉ hiện mã nhóm.
> Nút **Dò Zalo** theo số điện thoại cũng bỏ qua nhóm; muốn làm mới nhóm thì bấm **Dò nhóm Zalo**.

Bấm **Dò Zalo** hoặc **Dò nhóm Zalo** thì phần mềm cập nhật tên và số thành viên của nhóm, và báo nếu bạn đã rời nhóm nào đó.

### Nút nối nhanh

Không cần vào tận màn đó: nút tròn **Nối Zalo** có mặt ở cuối thanh bên, trang Tổng quan, trang Dữ liệu và trang Gửi. Màu nút cho biết trạng thái:

|   |   |
|---|---|
| [○ Nối Zalo] | chưa kết nối — bấm để quét mã |
| [◔ Quét QR] | mã QR đang chờ bạn quét |
| [● Tên bạn] | đã kết nối, sẵn sàng gửi |


Bấm nút là hiện ngay hộp mã QR. Quét xong, hộp hiện **tên tài khoản, số điện thoại, Zalo UID** rồi **tự đóng sau 5 giây** để bạn làm tiếp. Nếu bấm **Gửi** khi chưa kết nối, app cũng mở thẳng hộp này, kết nối xong là đi tiếp không phải bấm lại.

### Dò Zalo

App cần biết Zalo UID của mỗi người. Vào màn **Giáo viên** → **Dò Zalo**. Việc này chạy chậm cho an toàn: 40 số mất khoảng 2 phút. Số không có Zalo bị đánh dấu và bỏ qua khi gửi.

> **Không mở Zalo Web hay Zalo PC cùng tài khoản khi đang gửi.**

---

<a id="ket-ban"></a>

## 8. Vì sao có người không nhận được

> **Đây là nguyên nhân phổ biến nhất.**

### Hai trường hợp

1. **Chưa kết bạn Zalo với tài khoản gửi** — tin rơi vào mục “Tin nhắn từ người lạ”, nhiều người không mở.
2. **Đã tắt nhận tin từ người lạ** — tin không đến được, nhưng app vẫn báo gửi thành công.

### App giúp gì

- Bấm **Đối chiếu bạn bè** ở màn Kết nối Zalo → người chưa kết bạn mang nhãn **Chưa kết bạn**.
- Hộp gửi đếm sẵn số người này và cảnh báo trước.
- Mỗi dòng có nút **Mời kết bạn**.

### Cách làm đúng

**Kết bạn trước, gửi sau.** Rải 20–30 lời mời mỗi ngày, hoặc nhờ giáo viên nhắn trước một tin cho bạn.

---

<a id="gui"></a>

## 9. Gửi thời khoá biểu

Có hai lối vào, đều mở cùng một hộp thoại:

- Trang **Dữ liệu** → khu **Thời khoá biểu** → nút **Gửi qua Zalo** (gửi đúng bản đang xem).
- Bước **3 · Gửi** ở thanh bên → chọn số thời khoá biểu ở đầu trang → **Gửi qua Zalo**.

Chưa kết nối Zalo thì app mở hộp quét mã QR trước, xong là đi tiếp.

### Hộp tuỳ chọn

Mở ra là thấy ngay **bốn con số**: gửi được ngay · chưa kết bạn · chưa dò Zalo · không gửi được. Bên dưới chia ba tab:

|   |   |
|---|---|
| **Gửi cho ai** | Danh sách từng người, mỗi dòng ghi rõ **có số điện thoại chưa**, **đã dò Zalo chưa**, **đã kết bạn chưa**. Dòng mờ là không gửi được, không tích vào được. Có ô tìm và bộ lọc theo trạng thái, nút chọn hết / bỏ hết. |
| **Gửi cái gì** | Thời khoá biểu cá nhân · lớp cho chủ nhiệm · người ngoài và nhóm Zalo; ảnh hay tệp Word; tránh gửi trùng. |
| **Lời nhắn** | Sửa riêng cho đợt này, không ảnh hưởng mẫu trong Cài đặt. |


Còn người **chưa dò Zalo** thì hộp hiện nút **Dò Zalo ngay** — dò xong tự quay lại hộp với số liệu mới, khỏi phải thoát ra làm rồi vào lại.

|   |   |
|---|---|
| **Gửi gì** | TKB cá nhân · TKB lớp cho chủ nhiệm · người ngoài danh sách. Tích bao nhiêu cũng được. |
| **Dạng tệp** | Ảnh · Word · cả hai. Ảnh chọn được cả ngày, chỉ sáng, hoặc chỉ chiều. **Khổ file Word:** A4, A5, hoặc **cả hai** (người nhận được hai tệp). Lựa chọn được nhớ cho lần sau; mặc định theo **Cài đặt → Khổ giấy mặc định**. |
| **Tránh trùng** | Bỏ qua người đã nhận y nguyên · chỉ gửi người có thay đổi (mục 10). |
| **Người nhận** | Tất cả · chỉ chủ nhiệm · chọn tay từng người. |
| **Lời nhắn** | Sửa ngay trong hộp. |


Bấm **Xem trước danh sách** để thấy **ai nhận gì**, kèm lý do nếu bị bỏ qua.

### Xem thử trên điện thoại

Nút **Trên ĐT** ở mỗi dòng dựng lại **đúng màn hình người nhận sẽ thấy**: lời nhắn, ảnh thời khoá biểu và thẻ tệp Word để tải về. Nội dung lấy từ chính đợt gửi nên không lệch. Nút này có ở cả khu Thời khoá biểu và bảng xem trước đợt gửi.

Dùng để soát chữ và ảnh trước khi gửi cho cả trường.

### Gửi thử trước

Luôn bấm **Gửi thử 3 người**, mở Zalo kiểm tra, rồi mới **Bắt đầu gửi tất cả**.

### Trong lúc gửi

- Nhật ký hiện từng người: ✓ xong, ✗ lỗi kèm lý do.
- **Tạm dừng** bất cứ lúc nào, phần còn lại vẫn trong hàng chờ.
- **Tắt app giữa chừng cũng được** — mở lại bấm **Tiếp tục**, không gửi lại ảnh cho người đã nhận.
- Mục lỗi thì bấm **Gửi lại lỗi**.
- Xong đợt, app hiện **Danh sách lỗi**: ai không nhận được, số điện thoại, vì sao, sửa thế nào. Chép được sang Excel.

### Giới hạn an toàn

Zalo không công bố con số chính thức. Theo kinh nghiệm, rủi ro nằm gần hết ở việc nhắn cho **người lạ** (khoảng 10–40 tin/ngày là đã bị để ý), còn nhắn cho **người đã kết bạn** là việc bình thường. Vì vậy app đặt hai mức riêng:

|   |   |
|---|---|
| **Người đã kết bạn** | 300 người / 24 giờ |
| **Người chưa kết bạn** | 30 người / 24 giờ |
| Tổng số tin | 700 tin / 24 giờ |
| Mỗi đợt | 120 người — vượt thì chỉ cảnh báo |


**Trường đông hơn 100 giáo viên:** kết bạn với họ trước, rồi nâng mức “đã kết bạn” trong **Cài đặt**. Hết mức người lạ thì app **vẫn gửi tiếp cho người đã kết bạn**, chỉ hoãn nhóm còn lại.

Hạn mức tính theo **từng tài khoản Zalo**: đổi sang tài khoản khác là đếm lại từ đầu. Gặp **3 lỗi liên tiếp** thì tự dừng.

---

<a id="trung"></a>

## 10. Gửi lại và cảnh báo trùng

Phần mềm nhớ **nội dung lịch dạy** của từng người ở mỗi lần gửi thành công, nên biết lần này có gì khác lần trước không.

> **Gửi lại luôn được, phần mềm không chặn.** Giáo viên xoá mất tin, đổi máy, hay nhà trường muốn nhắc lại — đều gửi lại bình thường.
> Phần mềm chỉ **cảnh báo** và đánh dấu mục nào đã từng nhận y nguyên nội dung đó.

### Ba nhãn trong bảng xem trước

|   |   |
|---|---|
| [lần đầu] | Người này chưa từng nhận thời khoá biểu này. |
| [có thay đổi] | Từng nhận rồi, nhưng lịch dạy nay đã khác. |
| [gửi lại · đã nhận y nguyên] | Từng nhận đúng nội dung này. Vẫn gửi, chỉ là bạn nên biết. |


### Muốn khỏi gửi trùng thì tích thêm

- **Bỏ qua người đã nhận y nguyên** — chỉ gửi cho ai chưa nhận.
- **Chỉ gửi người có thay đổi** — bỏ qua cả người chưa từng nhận, chỉ gửi ai có lịch khác trước.

Dấu nhận biết là nội dung lịch dạy, không phải số thời khoá biểu. Đổi số mà lịch y nguyên thì vẫn tính là trùng.

---

<a id="lich-su"></a>

## 11. Lịch sử gửi

Ghi lại **mọi lượt gửi**, không bao giờ xoá, kể cả khi bạn xoá thời khoá biểu.

Mỗi dòng có: thời điểm, người nhận và số điện thoại, nhận TKB nào, tệp nào, kết quả, mã tin Zalo, và **nguyên văn lời nhắn** đã gửi.

Lọc theo TKB, loại, kết quả, khoảng ngày, hoặc tìm theo tên và số. Tab **Tổng hợp** cho biết mỗi người đã nhận gì, bao nhiêu lần, lần gần nhất khi nào.

---

<a id="thong-ke"></a>

## 12. Thống kê số tiết

Đếm số tiết theo **một thời khoá biểu** hoặc theo **khoảng thời gian**.

### Lọc nhiều chiều cùng lúc

Khoảng ngày · thời khoá biểu · giáo viên · tổ chuyên môn · khối · lớp · môn · buổi · thứ · chỉ chủ nhiệm.

### Sáu cách xem

Theo giáo viên · lớp · môn · thứ và buổi · giáo viên × lớp · giáo viên × thứ.

### Theo khoảng thời gian

Mỗi TKB được nhân với **số tuần nó có hiệu lực** trong khoảng đó. Ngày kết thúc của một TKB là ngày trước ngày thực hiện của TKB kế tiếp.

### Đối chiếu bảng phân công

Xem theo giáo viên với đúng một TKB thì app so **số tiết đếm được** với **số tiết khai**. Dòng lệch tô đỏ.

### Xuất và in

- **Xuất Excel**: nhiều cách xem, mỗi cách một sheet, kèm sheet ghi điều kiện lọc.
- **In** hoặc **Lưu PDF**: khổ A4, đầu trang có tên trường, điều kiện lọc và ngày in.

---

<a id="loi"></a>

## 13. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| **Không đọc được tệp Word** | Tệp đang mở trong Word. Đóng Word rồi thử lại. |
| **Giáo viên không khớp TKB** | Cột **Mã GV** khác tên viết tắt trong TKB. Sửa lại, hoặc điền ô **Mã GV 2**. |
| **Lớp không gửi được cho chủ nhiệm** | Lớp chưa có chủ nhiệm. Nhập ở phần mềm xếp TKB rồi xuất lại, hoặc chọn tay. |
| **Chưa dò được Zalo** | Chưa bấm dò, hoặc số đó không có Zalo. |
| **Báo gửi xong nhưng người ta không thấy** | Chưa kết bạn hoặc họ chặn tin người lạ — xem mục 8. |
| **Phiên Zalo hết hạn** | Quét lại mã QR rồi bấm **Tiếp tục**. Phần đã gửi không bị gửi lại. |
| **Dừng vì 3 lỗi liên tiếp** | Mất mạng, hoặc Zalo đang hạn chế. Thử gửi tay một tin trên Zalo xem còn được không. |
| **Chạm giới hạn an toàn** | Đã gửi đủ mức trong 24 giờ. Hôm sau mở lại bấm **Tiếp tục**. |
| **Ảnh / Word chưa có** | Tự tạo khi mở tab Thời khoá biểu hoặc khi bấm gửi — không cần làm gì. |
| **Thư mục báo “Có tệp mới hơn”** | Bạn chép tệp mới mà chưa nạp lại. Bấm **Nạp lại**. |


---

<a id="rui-ro"></a>

## 14. Điều khoản và rủi ro

> **Thư viện Zalo dùng ở đây không phải của Zalo.
> Gửi nhiều có thể bị khoá tài khoản.** Vì vậy hãy gửi bằng **tài khoản Zalo phụ**, giữ tài khoản chính cho việc hằng ngày.

### Rủi ro

- Zalo có thể **hạn chế gửi tin** hoặc **khoá tài khoản**. Không ai lấy lại được.
- Người **chưa kết bạn** hoặc **tắt nhận tin người lạ** sẽ không nhận được, dù app báo đã gửi.

### App đã làm gì

- Gửi tuần tự: 3–6 giây mỗi tin, 8–15 giây mỗi người, nghỉ sau mỗi 10 người.
- Giới hạn theo nhóm: **300 người đã kết bạn** và **30 người chưa kết bạn** mỗi 24 giờ.
- Dừng khi gặp 3 lỗi liên tiếp. Cảnh báo người chưa kết bạn.

### Nên làm

- **Dùng một tài khoản Zalo phụ để gửi**, đừng dùng tài khoản chính hằng ngày. Bị hạn chế hay khoá thì cũng không mất liên lạc, không mất việc riêng.
- **Kết bạn với giáo viên trước.**
- Gửi thử 3 người rồi mới gửi cả trường.
- Không mở Zalo Web hay Zalo PC cùng tài khoản khi đang gửi.

App miễn phí, không liên kết với Zalo. Dữ liệu và phiên đăng nhập chỉ nằm trên máy bạn. Bạn tự chịu trách nhiệm khi dùng.
