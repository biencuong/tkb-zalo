# Nghiệp vụ thiết kế app — cách bố cục giao diện theo luồng công việc

Cập nhật: 20/9/2026 · Rút ra từ quá trình làm TKB Zalo

Tài liệu này không nói về màu sắc hay phông chữ (phần đó ở skill `giao-dien-claude`).
Nó nói về **cách sắp xếp chức năng** để người dùng không phải học cách dùng phần mềm.

---

## 1. Nguyên tắc gốc: giao diện phải kể được câu chuyện nghiệp vụ

Người dùng mở phần mềm lên không đọc hướng dẫn. Họ nhìn màn hình và đoán.
Vậy màn hình phải tự nói ra: **bắt đầu từ đâu, đang ở bước nào, còn thiếu gì, làm gì tiếp.**

Câu hỏi kiểm tra một thiết kế: *người chưa từng dùng, nhìn 5 giây, có biết phải bấm vào đâu không?*
Nếu phải giải thích thì thiết kế sai, không phải người dùng dốt.

---

## 2. Rút menu về đúng các bước nghiệp vụ

**Việc làm:** liệt kê mọi việc phần mềm làm được, gom theo **thứ tự thật sự phải làm**,
mỗi bước thành một mục menu. Việc phụ trợ đẩy xuống nhóm "Khác".

Ở TKB Zalo, nghiệp vụ thật là: *có dữ liệu → nối được Zalo → mới gửi được*.
Menu vì thế còn đúng ba bước, đánh số 1-2-3, cộng hai mục phụ.

| Trước | Sau |
|---|---|
| 10 mục ngang hàng: Tổng quan, Nhập dữ liệu, Giáo viên, Thời khoá biểu, Kết nối Zalo, Gửi, Lịch sử, Thống kê, Cài đặt, Trợ giúp | Nhóm **Quy trình**: 1 Dữ liệu · 2 Kết nối Zalo · 3 Gửi. Nhóm **Khác**: Thống kê · Cài đặt |

**Mẹo đếm:** menu quá 7 mục là dấu hiệu chưa gom. Gom được thì gom, đừng bày hết ra cho "đầy đủ".

## 3. Khoá bước sau cho tới khi bước trước xong

Bước chưa đủ điều kiện thì **làm mờ, khoá lại, và nói rõ còn thiếu gì** — không để người dùng
bấm vào rồi nhận một thông báo lỗi cụt lủn.

```
Bước 3 · Gửi   🔒   "Cần: chưa kết nối Zalo"
```

Cách làm: một lệnh duy nhất ở tiến trình chính (`app:tien-do`) trả về cho từng bước
`{ xong, khoa, thieu[], viec }`. Giao diện chỉ vẽ lại theo đó, không tự suy luận điều kiện ở nhiều nơi —
suy luận rải rác là nguồn gốc của giao diện mâu thuẫn.

Sau mỗi việc làm đổi trạng thái (nhập tệp, kết nối, gửi xong) thì gọi lại lệnh đó và vẽ lại thanh bên.

## 4. Gom mọi thứ cùng một nhóm việc vào MỘT trang, chia tab bên trong

Người dùng nghĩ theo "việc", không nghĩ theo "màn hình". Ba trang Nhập tệp / Giáo viên /
Thời khoá biểu thực chất là một việc: **chuẩn bị dữ liệu**. Gom lại thành một mục menu,
bên trong chia tab.

**Tab, không phải cuộn dài.** Đã thử để ba khu cuộn liên tiếp: trang dài lê thê, không ai cuộn hết.
Chia tab thì mỗi lần chỉ dựng khu đang mở, vào trang nhanh hơn và mắt không bị ngợp.

```js
// Chỉ dựng khu đang mở; đổi tab mới dựng, và nhớ tab giữa các lần vào trang
const veKhu = async (ma) => { if (daVe.has(ma)) return; daVe.add(ma); ... };
```

## 5. Hành động đặt ngay chỗ người dùng đang nhìn, đừng bắt đi vòng

Bỏ hẳn trang "Gửi thời khoá biểu" riêng. Nút **Gửi qua Zalo** nằm ngay đầu khu Thời khoá biểu,
bấm là mở hộp thoại chạy trọn luồng: tuỳ chọn → xem trước → chạy → danh sách lỗi.

Quy tắc: **một việc trọn vẹn thì một hộp thoại**, đừng cắt thành ba trang phải đi qua lại.
Trang riêng chỉ dành cho thứ người dùng cần quay lại nhiều lần (lịch sử, thống kê).

## 6. Điều kiện thiếu thì mở ngay chỗ khắc phục, không đuổi người dùng sang màn khác

Bấm Gửi mà chưa kết nối Zalo: **mở thẳng hộp quét mã QR**, quét xong đi tiếp luồng gửi.
Không hiện "Bạn chưa kết nối, hãy vào mục Kết nối Zalo" rồi bắt tự tìm đường quay lại.

```js
if (!(await canZalo("Phải kết nối Zalo mới gửi được."))) return;
// tới đây chắc chắn đã có phiên, đi tiếp
```

Hệ quả: những trạng thái dùng ở nhiều nơi nên có **một nút dùng chung** (`chipZalo()`) gắn được
vào tiêu đề bất kỳ trang nào, và **một hàm bảo đảm điều kiện** (`canZalo()`) gọi ở đầu mọi việc cần nó.

## 7. Cái gì máy làm được thì đừng hỏi người dùng

- Mở hộp quét mã QR là **tự xin mã luôn**, không bắt bấm thêm nút "Lấy mã QR".
- Kết nối xong hiện thông tin tài khoản rồi **tự đóng sau 5 giây**.
- Nhập thời khoá biểu xong thì **tạo ảnh luôn**, không bắt bấm thêm một bước nữa.
- Kéo tệp vào thì **tự phân loại theo nội dung**, tự đặt tên chuẩn, tự cất đúng thư mục.
- Sửa ô trong bảng thì **rời ô là tự lưu**, không cần nút Lưu, không cần mở hộp thoại.

Nút chỉ nên tồn tại khi người dùng thật sự có quyết định phải ra.

## 8. Việc tự động vẫn phải BÁO CÁO ĐỦ

Tự động mà im lặng thì người dùng mất kiểm soát và không tin phần mềm nữa.
Mỗi việc tự động phải trả lời được bốn câu: **nhận cái gì · thành cái gì · để ở đâu · cái nào không được và vì sao.**

Ví dụ báo cáo sau khi thả tệp:

| Tệp thả vào | Kết quả | Lưu thành | Chi tiết |
|---|---|---|---|
| SS.2609…xlsx | Đã nhận | `TKB-2025-2026-So-01-TONG.xlsx` · 1 - CHO XU LY | 20 lớp, 585 tiết |
| TKBgvA4.docx | Đã nhận | `TKB-2025-2026-So-01-GV-A4.docx` | 40 bảng, khổ A4 |
| ds gv.xlsx | Trùng, bỏ qua | `DS-GV.xlsx` | Trong kho đã có tệp y hệt |
| ghi chu.docx | Không nhận | `KHONG DUNG DINH DANG\ghi chu.docx` | Không phải dữ liệu thời khoá biểu |

Kèm bốn con số ở đầu: **đã nhận · trùng · không nhận · thiếu dữ liệu**.

Tệp không nhận ra thì **vẫn giữ lại trong một thư mục riêng**, không xoá — người dùng còn xem lại được.

## 9. Ép đúng thứ tự nạp dữ liệu

Dữ liệu có quan hệ với nhau thì thứ tự nạp không tuỳ tiện. Thời khoá biểu phải khớp vào giáo viên,
nên **danh sách giáo viên luôn nạp trước**.

Thể hiện ra giao diện, ba lớp cùng lúc:
1. Thẻ danh sách giáo viên **xếp trên**, đánh số 1; thẻ thời khoá biểu số 2.
2. Chưa có giáo viên thì nút nhập thời khoá biểu **bị khoá**, kèm một câu giải thích.
3. Một dải tiến độ nhỏ: `✓ Danh sách giáo viên (40 người) → 2 Thời khoá biểu`.

## 10. Chữ ít nhất có thể, nhưng đủ để hành động

- Nhãn 1–3 từ. Câu giải thích không quá 12 từ.
- Cảnh báo viết theo mẫu: **chuyện gì xảy ra** + **làm gì để sửa**. Bỏ hết chữ đệm.
  - Sai: "Rất tiếc, hệ thống không thể thực hiện thao tác gửi do phiên đăng nhập đã hết hạn."
  - Đúng: **"Hết phiên Zalo."** → "Quét lại mã QR."
- Số liệu để trong ô số hoặc bảng, đừng nhét vào câu văn.
- Danh sách lỗi phải kèm **cách sửa cho từng người**, không chỉ mã lỗi.

## 11. Thanh bên thu gọn: icon KHÔNG bao giờ đứng một mình

Thu gọn để lấy chỗ là tốt, nhưng chỉ còn icon thì người dùng không đoán ra mục nào là mục nào —
kể cả icon quen thuộc. Luôn để **chữ viết tắt rất nhỏ (≈10px) ngay dưới icon**.

Rộng 76px là vừa đủ cho "Thống kê", "Dữ liệu", "Cài đặt". Kiểm bằng `scrollWidth <= clientWidth`
để chắc chữ không bị cắt.

## 12. Trang chủ không cần một mục menu

Tổng quan là nơi mở app vào đầu tiên, không phải một điểm đến ngang hàng với các bước.
Bỏ khỏi menu, quay lại bằng cách **bấm vào tên phần mềm ở đầu thanh bên** — thói quen sẵn có từ web.
Khi đang ở trang chủ thì tên phần mềm đổi màu kèm chữ "Trang chủ" để biết mình đang ở đâu.

## 13. Bộ lọc nhiều chiều: thanh gọn + hộp thoại

Bộ lọc mười mấy chiều bày hết ra trang thì chiếm hết màn hình mà phần lớn thời gian không ai đụng tới.

- Trên trang chỉ để **một nút "Bộ lọc…"** và **các chip tóm tắt điều kiện đang áp dụng**
  (`Thời khoá biểu: số 1` · `Khối: 6, 7` · `Buổi: sáng`).
- Bấm nút mới mở hộp thoại đủ chiều, có nút "Xem tất cả" để xoá nhanh.
- Nút "Bỏ lọc" chỉ bật khi thật sự đang lọc.

## 14. Chỗ nào cần xác nhận trước khi làm thật thì cho XEM TRƯỚC ĐÚNG NHƯ THẬT

Trước khi gửi hàng loạt ra ngoài, dựng lại **màn hình điện thoại của người nhận**: đúng lời nhắn,
đúng ảnh, đúng thẻ tệp đính kèm. Nội dung lấy từ chính bộ dựng dữ liệu sẽ gửi, không phải bản mô phỏng
viết riêng — mô phỏng viết riêng sẽ lệch dần với thật và thành vô dụng.

Nguyên tắc chung: **việc không hoàn tác được thì phải xem trước được.**

## 15. Ẩn thứ đã xong, chừa nút mở lại có nhãn

Vùng kéo thả tệp rất cần lúc chưa có dữ liệu, nhưng khi đã có đủ thì nó chỉ chiếm chỗ.
Có dữ liệu rồi thì thu lại sau một nút nhỏ **có nhãn rõ** (`＋ Thêm tệp dữ liệu`) đặt ở chỗ dễ thấy.

Đừng ẩn sau một icon không nhãn — người dùng sẽ không tìm ra.

## 16. Trạng thái kỹ thuật luôn ở chân thanh bên

Hai thứ người dùng cần liếc bất cứ lúc nào: **đang nối tài khoản nào** và **đang dùng bản nào**.
Đặt cố định ở chân thanh bên, bấm được:

- Nút Zalo: màu theo trạng thái, bấm là mở hộp kết nối.
- Số hiệu phiên bản: bấm là kiểm tra cập nhật; có bản mới thì hiện chấm đỏ.

---

## 17. Bảng kiểm trước khi coi là xong một giao diện

- [ ] Menu ≤ 7 mục, các bước nghiệp vụ đánh số theo đúng thứ tự phải làm.
- [ ] Bước chưa đủ điều kiện bị khoá **và** nói rõ thiếu gì.
- [ ] Không có trang nào chỉ để "đi qua" — vào là làm được việc.
- [ ] Mọi việc máy tự làm được đều đã tự làm, và đều có báo cáo đủ trạng thái.
- [ ] Điều kiện thiếu thì mở ngay chỗ khắc phục tại chỗ.
- [ ] **Mỗi cảnh báo đều bấm sửa được ngay tại dòng/màn đang báo** — thử từng cái một bằng tay.
- [ ] Không dòng nào vừa bị khoá vừa không có đường thoát ngay cạnh.
- [ ] Thêm một cách làm tự động thì rà lại mọi chỗ **chặn**, **cảnh báo** và **hướng dẫn** nói điều ngược lại — khoá cũ còn đó thì tính năng mới như không có.
- [ ] Không có nhãn nào dài quá 3 từ; không có cảnh báo nào thiếu cách sửa.
- [ ] Thu gọn thanh bên vẫn đọc được tên mục.
- [ ] Việc không hoàn tác được đều có màn xem trước đúng như thật.
- [ ] Chạy được kịch bản tự động mở lần lượt mọi trang, không lỗi nào trong bảng điều khiển.

### 17b. Ba câu phải trả lời được cho MỌI cảnh báo

Rút ra từ lỗi thật trong chính dự án này: app báo *"nhóm chưa đặt nhận thời khoá biểu nào → vào
Dữ liệu › Giáo viên › Người nhận ngoài danh sách mà sửa"*. Người dùng sang đó thì hộp sửa đòi số
điện thoại mà nhóm không có số, còn dòng đang bị cảnh báo thì khoá không tích được. Ngõ cụt.

1. **Bấm được gì ngay tại đây?** Sửa nhanh thì đặt luôn ô chọn / ô nhập trên chính dòng đang báo.
   Chỉ đường sang màn khác là phương án cuối, và phải tự mở màn đó kiểm lại là sửa được thật.
2. **Đã khoá thì đường thoát nằm ở đâu?** Khoá mà không có lối ra là bắt người dùng đoán.
3. **Sửa xong màn hình tự tính lại chưa?** Cảnh báo phải biến mất ngay, không bắt đóng ra mở lại.

Luật dữ liệu hay đi kèm: **trường khoá mà giao diện không gửi lên thì giữ giá trị cũ**, đừng coi
`undefined` là lệnh xoá — nếu không, lưu một lần là mất định danh (ở đây là mã nhóm Zalo), hết gửi được.
