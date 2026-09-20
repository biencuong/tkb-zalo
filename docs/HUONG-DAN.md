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
- [4. Thư mục dữ liệu](#thu-muc)
- [5. Danh sách giáo viên](#giao-vien)
- [6. Nhập thời khoá biểu](#nhap-tkb)
- [7. Kết nối Zalo](#zalo)
- [8. Vì sao có người không nhận được](#ket-ban)
- [9. Gửi thời khoá biểu](#gui)
- [10. Chống gửi trùng](#trung)
- [11. Lịch sử gửi](#lich-su)
- [12. Thống kê số tiết](#thong-ke)
- [13. Lỗi thường gặp](#loi)
- [14. Điều khoản và rủi ro](#rui-ro)

---

<a id="bat-dau"></a>

## 1. App làm gì

Nhận thời khoá biểu bạn xuất từ phần mềm xếp TKB, gửi cho từng giáo viên qua Zalo cá nhân của bạn. Mỗi người nhận **một ảnh** (xem ngay trên điện thoại) và **một tệp Word** (tải về in). Giáo viên chủ nhiệm nhận thêm thời khoá biểu lớp mình.

### Làm theo thứ tự

1. Nhập **danh sách giáo viên** có số điện thoại — làm một lần.
2. Mỗi lần đổi TKB: **nhập tệp** vừa xuất ra.
3. **Tạo ảnh**.
4. **Kết nối Zalo** bằng quét QR — làm một lần.
5. **Gửi**: chọn gửi gì cho ai, gửi thử vài người, rồi gửi cả trường.

### Màn hình có gì

Thanh bên trái là **ba bước theo đúng thứ tự**: Dữ liệu → Kết nối Zalo → Gửi. Bước sau bị khoá cho tới khi bước trước xong, rê chuột vào là thấy còn thiếu gì.

- **Dữ liệu** gom cả ba việc vào một trang: nhập tệp, danh sách giáo viên, thời khoá biểu. Thanh nhảy nhanh ở đầu trang đưa tới đúng khu.
- Nút **«** ở góc trên thanh bên (hoặc **Ctrl + B**) thu gọn thanh bên còn icon kèm chữ viết tắt, để màn hình rộng hơn. Bấm lại để mở ra.
- Cuối thanh bên là nút **Nối Zalo** và **số hiệu phiên bản** — bấm số hiệu là kiểm tra cập nhật.

App miễn phí, không liên kết với Zalo hay phần mềm xếp TKB nào.

---

<a id="cai-dat"></a>

## 2. Cài đặt và cập nhật

Chạy `TKBZalo-Setup-x.y.z.exe`. Bộ cài hiện bảng điều khoản, phải bấm **Tôi đồng ý** mới cài tiếp. Cài vào thư mục người dùng nên **không cần quyền quản trị**. Không cần Word, Python hay Node.

Lần đầu Windows có thể cảnh báo SmartScreen vì bộ cài chưa ký số: bấm “Thông tin thêm” → “Vẫn chạy”.

### Cập nhật

Số hiệu đánh theo chuẩn **chính.phụ.vá** (ví dụ `1.2.0`): số cuối là sửa lỗi, số giữa là thêm chức năng, số đầu là thay đổi lớn. Bản thử nghiệm có thêm đuôi (`1.2.0-beta.1`) và luôn được coi là cũ hơn bản chính thức cùng số.

Mỗi lần mở, app tự hỏi có bản mới không. Có thì:

- Hiện **thông báo ở góc dưới** kèm nút xem nội dung cập nhật.
- **Số hiệu ở cuối thanh bên** chuyển màu và có chấm đỏ.

Bấm vào đó để xem **nội dung bản mới và các bản trước**, rồi chọn **Tải và cài** / **Để sau** / **Bỏ qua bản này**. Tự kiểm tra bất cứ lúc nào: bấm số hiệu ở cuối thanh bên, hoặc vào **Cài đặt → Kiểm tra cập nhật**.

Cập nhật **không mất** dữ liệu. Gỡ app cũng không xoá thư mục **Tài liệu → TKB Zalo**.

---

<a id="chuan-bi"></a>

## 3. Chuẩn bị tệp

### Cần ít nhất bao nhiêu tệp?

**Một tệp là chạy được.** Ảnh thời khoá biểu do phần mềm tự vẽ từ số liệu trong tệp Excel tổng, không cần tệp Word nào. Thêm tệp chỉ để tiện hơn:

| Mức | Tệp cần có | Người nhận được gì |
|---|---|---|
| **Tối thiểu** [1 tệp] | **Excel tổng** (`SS….xlsx`) | Một **ảnh** thời khoá biểu xem ngay trên điện thoại. Phần mềm tạo luôn danh sách giáo viên từ bảng phân công trong tệp này; bạn chỉ cần điền **số điện thoại** ngay trên bảng. |
| **Nên dùng** [2 tệp] | Thêm **Excel danh sách giáo viên** | Như trên, nhưng số điện thoại có sẵn trong tệp, khỏi gõ tay từng người. |
| **Đầy đủ** [4 tệp] | Thêm **2 tệp Word** (thời khoá biểu giáo viên và lớp) | Ảnh xem ngay **và** tệp Word để tải về in. |


> **Tệp Word chỉ dùng để cắt ra bản in.** Không có Word thì mọi thứ vẫn chạy, giáo viên vẫn nhận đủ thời khoá biểu của mình dưới dạng ảnh.
> Chỉ khác là không tải về in được.

### Lấy tệp ra khỏi phần mềm xếp thời khoá biểu

| Bước | Vào đâu | Ra tệp gì |
|---|---|---|
| **1** | **Hệ thống → Chuyển đổi dữ liệu sang Excel** | **Bắt buộc.** Tệp Excel tổng `SS….xlsx` — bảng phân công và toàn bộ tiết học. Riêng tệp này là đủ để gửi ảnh. |
| **2** | **Dữ liệu → Dữ liệu giáo viên → Danh sách giáo viên**, bấm **biểu tượng Excel**, chọn **Copy file dữ liệu mẫu** | Nên có. Tệp Excel danh sách giáo viên đúng mẫu. Mở ra điền **số điện thoại** từng người rồi lưu. |
| **3** | **Hệ thống → In ấn → Thời khoá biểu theo lớp**, rồi **theo giáo viên**, xuất ra tệp Word | Tuỳ chọn. Hai tệp Word để giáo viên tải về in. |


> **Thả tất cả vào phần mềm này một lượt.** Thả cùng lượt thì tệp Word mới biết nó thuộc thời khoá biểu số mấy.
> Phần mềm tự phân loại, đặt tên chuẩn và cất đúng chỗ.

### Nhớ nhập danh sách giáo viên chủ nhiệm

> **Chưa nhập thì cột chủ nhiệm trống, phần mềm không biết gửi thời khoá biểu lớp cho ai.** Nhập “Danh sách giáo viên chủ nhiệm” trong phần mềm xếp thời khoá biểu rồi xuất Excel lại.
> Hoặc chọn tay từng lớp trong khu Thời khoá biểu.

### Thứ tự nạp

1. **Danh sách giáo viên trước** — nếu có tệp danh sách. Không có thì bỏ qua, phần mềm tự tạo từ bảng phân công khi bạn nhập thời khoá biểu.
2. **Thời khoá biểu sau** — nhập xong phần mềm tạo ảnh luôn.
3. **Điền số điện thoại** còn thiếu ngay trên bảng ở tab Giáo viên, rời ô là tự lưu.

Đóng Word và Excel trước khi nhập, nếu không phần mềm báo lỗi đọc tệp.

---

<a id="thu-muc"></a>

## 4. Thư mục dữ liệu

App tạo sẵn cây thư mục trong **Tài liệu → TKB Zalo**:

|   |   |
|---|---|
| 1 - CHO XU LY | **Hộp thư vào.** Chép tệp vừa xuất vào đây, bấm **Quét lại** ở mục Nhập dữ liệu. |
| 2 - DU LIEU DA NHAP | Tệp gốc theo năm học và số TKB, ví dụ `2025-2026\So 01\`. Bên trong có `gv\`, `lop\`, `anh\`. |
| 3 - DANH SACH GIAO VIEN | Tệp Excel danh sách giáo viên. |
| 4 - KET XUAT | Bảng thống kê bạn xuất ra. |


### Cách nhanh

Tự tạo thư mục `2 - DU LIEU DA NHAP\<năm học>\So <số>\` rồi chép ba tệp vào. App thấy ngay ở tab **Kho dữ liệu đã lưu**.

> **App đối chiếu thư mục với dữ liệu đã nạp.** Có tệp mà chưa nạp → báo **Chưa nạp**.
> Tệp mới hơn lần nạp → báo **Có tệp mới hơn**, tránh gửi nhầm TKB cũ.

### Tệp thừa, tệp sai

Bấm **Soi thư mục** để xem tệp nào đúng, tệp nào **thừa**, tệp nào **hỏng** và hỏng thế nào. Ví dụ tệp `.doc` đời cũ phải lưu lại thành `.docx`.

### Kéo thả là xong

Thả tệp vào vùng **Kéo tệp vào đây** ở trang Dữ liệu. Phần mềm **đọc nội dung từng tệp** để biết đó là gì, rồi tự đặt tên chuẩn và cất đúng thư mục:

|   |   |
|---|---|
| Excel tổng hợp | `TKB-2025-2026-So-01-TONG.xlsx` → thư mục chờ xử lý |
| Word thời khoá biểu giáo viên | `TKB-2025-2026-So-01-GV-A4.docx` |
| Word thời khoá biểu lớp | `TKB-2025-2026-So-01-LOP-A4.docx` |
| Danh sách giáo viên | `DS-GV.xlsx` → thư mục danh sách giáo viên |
| Không nhận ra | để riêng trong `KHONG DUNG DINH DANG`, không xoá |


Tệp Word không tự nói được nó thuộc thời khoá biểu số mấy, nên hãy **thả cùng lượt với tệp Excel tổng**. Thả riêng thì tên ghi `CHUA-RO`, vẫn nhập được.

### Không lưu trùng

Thả lại tệp đã có, phần mềm nhận ra **nội dung y hệt** (kể cả khi tên khác) và **không lưu thêm**. Nội dung có đổi thì thay tệp cũ, kho luôn chỉ một bản.

### Xong là có báo cáo

Sau mỗi lần thả, phần mềm hiện bảng: từng tệp **thành gì · đặt tên gì · để ở đâu · cái nào không nhận và vì sao**, kèm bốn con số đã nhận / trùng / không nhận / thiếu dữ liệu.

### Thứ tự nạp

> **Nạp danh sách giáo viên trước, thời khoá biểu sau.** Chưa có ai trong danh sách thì không khớp được thời khoá biểu vào từng người, nên nút nhập thời khoá biểu sẽ bị khoá.

---

<a id="giao-vien"></a>

## 5. Danh sách giáo viên

### Các cột trong tệp Excel

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

### Sửa ngay trên bảng

Bấm thẳng vào ô **họ tên, mã GV, tổ, điện thoại, email, lớp chủ nhiệm** rồi gõ. Rời ô là **tự lưu**, ô sáng xanh một nhịp cho biết đã lưu. Enter để lưu nhanh, Esc để bỏ.

Đổi số điện thoại thì nhớ bấm **Dò Zalo** lại cho người đó. Nút **⋯** mở hộp đầy đủ khi cần sửa nhiều trường một lúc.

---

<a id="nhap-tkb"></a>

## 6. Nhập thời khoá biểu

Vào **Nhập dữ liệu**, chọn nhóm tệp rồi bấm **Nhập vào phần mềm**. App hiện bảng **xem trước** để bạn kiểm tra.

### App kiểm tra gì

- Số TKB, ngày thực hiện, năm học, học kỳ, tên trường. Thiếu thì cho điền tay ngay.
- Số lớp, số giáo viên, tổng tiết.
- **Lớp nào chưa có giáo viên chủ nhiệm.**
- Giáo viên nào **chưa khớp** danh sách.
- Số tiết bảng phân công có khớp thời khoá biểu không.

### Nhập trùng số

> **Số đã có thì app cảnh báo kèm so sánh cũ – mới.** Chọn **Cập nhật** thì bản cũ được lưu vết ở tab Lịch sử bản.
> Không mất gì.

### Tạo ảnh

Vào màn **Thời khoá biểu** bấm **Tạo ảnh**. Mỗi giáo viên và mỗi lớp một ảnh, chữ to, xem rõ trên điện thoại. Bấm **Xem** ở từng dòng để soi trước.

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

Nhóm đã chọn hiện ở **Dữ liệu → Giáo viên → Người nhận ngoài danh sách**, ghi rõ tên nhóm và số thành viên. Muốn nhóm nhận thời khoá biểu nào thì đặt đăng ký cho nhóm đó như với người ngoài.

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
| **Dạng tệp** | Ảnh · Word · cả hai. Ảnh chọn được cả ngày, chỉ sáng, hoặc chỉ chiều. |
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

## 10. Chống gửi trùng

App nhớ **nội dung lịch dạy** của từng người ở mỗi lần gửi thành công, nên biết lần này có gì khác không.

| Trạng thái | Nghĩa là |
|---|---|
| [lần đầu] | Chưa từng nhận. |
| [có thay đổi] | Từng nhận, nay lịch dạy khác. |
| [trùng] | **Đã nhận đúng nội dung này rồi.** |


### Hai tuỳ chọn

- **Bỏ qua người đã nhận y nguyên** (bật sẵn). Bỏ tích thì vẫn gửi được, app hiện cảnh báo gửi trùng.
- **Chỉ gửi người có thay đổi** — hợp khi sửa TKB giữa chừng mà chỉ vài người bị ảnh hưởng.

App so nội dung lịch dạy, không so số TKB. Đổi số mà lịch không đổi thì vẫn tính là trùng.

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
| **Ảnh chưa tạo** | Vào màn Thời khoá biểu bấm **Tạo ảnh**. |
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
