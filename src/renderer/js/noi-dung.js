/**
 * Nội dung chữ dùng chung: cảnh báo rủi ro và hướng dẫn sử dụng.
 * Tách riêng, KHÔNG phụ thuộc trình duyệt, để vừa hiện trong app vừa sinh ra docs/HUONG-DAN.md.
 * Sửa ở đây là cả hai nơi cùng đổi — không được chép thành hai bản.
 * Viết NGẮN: mỗi câu một ý, bỏ chữ thừa.
 */

export const NOI_DUNG_RUI_RO = `
<div class="bao xau"><b>Thư viện Zalo dùng ở đây không phải của Zalo. Gửi nhiều có thể bị khoá tài khoản.</b>
  <span class="sua">Vì vậy hãy gửi bằng <b>tài khoản Zalo phụ</b>, giữ tài khoản chính cho việc hằng ngày.</span></div>

<h3>Rủi ro</h3>
<ul>
  <li>Zalo có thể <b>hạn chế gửi tin</b> hoặc <b>khoá tài khoản</b>. Không ai lấy lại được.</li>
  <li>Người <b>chưa kết bạn</b> hoặc <b>tắt nhận tin người lạ</b> sẽ không nhận được, dù app báo đã gửi.</li>
</ul>

<h3>App đã làm gì</h3>
<ul>
  <li>Gửi tuần tự: 3–6 giây mỗi tin, 8–15 giây mỗi người, nghỉ sau mỗi 10 người.</li>
  <li>Giới hạn theo nhóm: <b>300 người đã kết bạn</b> và <b>30 người chưa kết bạn</b> mỗi 24 giờ.</li>
  <li>Dừng khi gặp 3 lỗi liên tiếp. Cảnh báo người chưa kết bạn.</li>
</ul>

<h3>Nên làm</h3>
<ul>
  <li><b>Dùng một tài khoản Zalo phụ để gửi</b>, đừng dùng tài khoản chính hằng ngày.
      Bị hạn chế hay khoá thì cũng không mất liên lạc, không mất việc riêng.</li>
  <li><b>Kết bạn với giáo viên trước.</b></li>
  <li>Gửi thử 3 người rồi mới gửi cả trường.</li>
  <li>Không mở Zalo Web hay Zalo PC cùng tài khoản khi đang gửi.</li>
</ul>

<p class="nho mo">App miễn phí, không liên kết với Zalo. Dữ liệu và phiên đăng nhập chỉ nằm trên máy bạn.
Bạn tự chịu trách nhiệm khi dùng.</p>
`;

export const MUC_TRO_GIUP = [
  {
    ma: "bat-dau", ten: "1. App làm gì",
    noi: `
<p>Nhận thời khoá biểu bạn xuất từ phần mềm xếp TKB, gửi cho từng giáo viên qua Zalo cá nhân của bạn.
Mỗi người nhận <b>một ảnh</b> (xem ngay trên điện thoại) và <b>một tệp Word</b> (tải về in).
Giáo viên chủ nhiệm nhận thêm thời khoá biểu lớp mình.</p>

<h3>Làm theo thứ tự</h3>
<ol>
  <li>Nhập <b>danh sách giáo viên</b> có số điện thoại — làm một lần.</li>
  <li>Mỗi lần đổi TKB: <b>nhập tệp</b> vừa xuất ra.</li>
  <li><b>Tạo ảnh</b>.</li>
  <li><b>Kết nối Zalo</b> bằng quét QR — làm một lần.</li>
  <li><b>Gửi</b>: chọn gửi gì cho ai, gửi thử vài người, rồi gửi cả trường.</li>
</ol>
<h3>Màn hình có gì</h3>
<p>Thanh bên trái là <b>ba bước theo đúng thứ tự</b>: Dữ liệu → Kết nối Zalo → Gửi.
Bước sau bị khoá cho tới khi bước trước xong, rê chuột vào là thấy còn thiếu gì.</p>
<ul>
  <li><b>Dữ liệu</b> gom cả ba việc vào một trang: nhập tệp, danh sách giáo viên, thời khoá biểu.
      Thanh nhảy nhanh ở đầu trang đưa tới đúng khu.</li>
  <li>Nút <b>«</b> ở góc trên thanh bên (hoặc <b>Ctrl + B</b>) thu gọn thanh bên còn icon kèm chữ viết tắt,
      để màn hình rộng hơn. Bấm lại để mở ra.</li>
  <li>Cuối thanh bên là nút <b>Nối Zalo</b> và <b>số hiệu phiên bản</b> — bấm số hiệu là kiểm tra cập nhật.</li>
</ul>
<p class="nho mo">App miễn phí, không liên kết với Zalo hay phần mềm xếp TKB nào.</p>`,
  },
  {
    ma: "cai-dat", ten: "2. Cài đặt và cập nhật",
    noi: `
<p>Chạy <span class="mono">TKBZalo-Setup-x.y.z.exe</span>. Bộ cài hiện bảng điều khoản, phải bấm
<b>Tôi đồng ý</b> mới cài tiếp. Cài vào thư mục người dùng nên <b>không cần quyền quản trị</b>.
Không cần Word, Python hay Node.</p>
<p class="nho mo">Lần đầu Windows có thể cảnh báo SmartScreen vì bộ cài chưa ký số: bấm “Thông tin thêm” → “Vẫn chạy”.</p>

<h3>Cập nhật</h3>
<p>Số hiệu đánh theo chuẩn <b>chính.phụ.vá</b> (ví dụ <span class="mono">1.2.0</span>): số cuối là sửa lỗi,
số giữa là thêm chức năng, số đầu là thay đổi lớn. Bản thử nghiệm có thêm đuôi
(<span class="mono">1.2.0-beta.1</span>) và luôn được coi là cũ hơn bản chính thức cùng số.</p>
<p>Mỗi lần mở, app tự hỏi có bản mới không. Có thì:</p>
<ul>
  <li>Hiện <b>thông báo ở góc dưới</b> kèm nút xem nội dung cập nhật.</li>
  <li><b>Số hiệu ở cuối thanh bên</b> chuyển màu và có chấm đỏ.</li>
</ul>
<p>Bấm vào đó để xem <b>nội dung bản mới và các bản trước</b>, rồi chọn
<b>Tải và cài</b> / <b>Để sau</b> / <b>Bỏ qua bản này</b>.
Tự kiểm tra bất cứ lúc nào: bấm số hiệu ở cuối thanh bên, hoặc vào <b>Cài đặt → Kiểm tra cập nhật</b>.</p>
<p>Cập nhật <b>không mất</b> dữ liệu. Gỡ app cũng không xoá thư mục <b>Tài liệu → TKB Zalo</b>.</p>`,
  },
  {
    ma: "chuan-bi", ten: "3. Chuẩn bị tệp",
    noi: `
<h3>Cần ít nhất bao nhiêu tệp?</h3>
<p><b>Một tệp là chạy được.</b> Ảnh thời khoá biểu do phần mềm tự vẽ từ số liệu trong tệp Excel tổng,
không cần tệp Word nào. Thêm tệp chỉ để tiện hơn:</p>

<table class="b"><thead><tr><th style="width:14%">Mức</th><th>Tệp cần có</th><th>Người nhận được gì</th></tr></thead><tbody>
  <tr><td><b>Tối thiểu</b><br><span class="nhan n-ok">1 tệp</span></td>
      <td><b>Excel tổng</b> (<span class="mono">SS….xlsx</span>)</td>
      <td>Một <b>ảnh</b> thời khoá biểu xem ngay trên điện thoại.
          Phần mềm tạo luôn danh sách giáo viên từ bảng phân công trong tệp này;
          bạn chỉ cần điền <b>số điện thoại</b> ngay trên bảng.</td></tr>
  <tr><td><b>Nên dùng</b><br><span class="nhan n-ok">2 tệp</span></td>
      <td>Thêm <b>Excel danh sách giáo viên</b></td>
      <td>Như trên, nhưng số điện thoại có sẵn trong tệp, khỏi gõ tay từng người.</td></tr>
  <tr><td><b>Đầy đủ</b><br><span class="nhan n-ok">4 tệp</span></td>
      <td>Thêm <b>2 tệp Word</b> (thời khoá biểu giáo viên và lớp)</td>
      <td>Ảnh xem ngay <b>và</b> tệp Word để tải về in.</td></tr>
</tbody></table>

<div class="bao tin"><b>Tệp Word chỉ dùng để cắt ra bản in.</b>
  <span class="sua">Không có Word thì mọi thứ vẫn chạy, giáo viên vẫn nhận đủ thời khoá biểu của mình
  dưới dạng ảnh. Chỉ khác là không tải về in được.</span></div>

<h3>Lấy tệp ra khỏi phần mềm xếp thời khoá biểu</h3>
<table class="b"><thead><tr><th style="width:8%">Bước</th><th>Vào đâu</th><th>Ra tệp gì</th></tr></thead><tbody>
  <tr><td><b>1</b></td>
      <td><b>Hệ thống → Chuyển đổi dữ liệu sang Excel</b></td>
      <td><b>Bắt buộc.</b> Tệp Excel tổng <span class="mono">SS….xlsx</span> — bảng phân công và toàn bộ tiết học.
          Riêng tệp này là đủ để gửi ảnh.</td></tr>
  <tr><td><b>2</b></td>
      <td><b>Dữ liệu → Dữ liệu giáo viên → Danh sách giáo viên</b>, bấm <b>biểu tượng Excel</b>,
          chọn <b>Copy file dữ liệu mẫu</b></td>
      <td>Nên có. Tệp Excel danh sách giáo viên đúng mẫu. Mở ra điền <b>số điện thoại</b> từng người rồi lưu.</td></tr>
  <tr><td><b>3</b></td>
      <td><b>Hệ thống → In ấn → Thời khoá biểu theo lớp</b>, rồi <b>theo giáo viên</b>, xuất ra tệp Word</td>
      <td>Tuỳ chọn. Hai tệp Word để giáo viên tải về in.</td></tr>
</tbody></table>

<div class="bao tin"><b>Thả tất cả vào phần mềm này một lượt.</b>
  <span class="sua">Thả cùng lượt thì tệp Word mới biết nó thuộc thời khoá biểu số mấy.
  Phần mềm tự phân loại, đặt tên chuẩn và cất đúng chỗ.</span></div>

<h3>Nhớ nhập danh sách giáo viên chủ nhiệm</h3>
<div class="bao canh"><b>Chưa nhập thì cột chủ nhiệm trống, phần mềm không biết gửi thời khoá biểu lớp cho ai.</b>
  <span class="sua">Nhập “Danh sách giáo viên chủ nhiệm” trong phần mềm xếp thời khoá biểu rồi xuất Excel lại.
  Hoặc chọn tay từng lớp trong khu Thời khoá biểu.</span></div>

<h3>Thứ tự nạp</h3>
<ol>
  <li><b>Danh sách giáo viên trước</b> — nếu có tệp danh sách. Không có thì bỏ qua, phần mềm tự tạo
      từ bảng phân công khi bạn nhập thời khoá biểu.</li>
  <li><b>Thời khoá biểu sau</b> — nhập xong phần mềm tạo ảnh luôn.</li>
  <li><b>Điền số điện thoại</b> còn thiếu ngay trên bảng ở tab Giáo viên, rời ô là tự lưu.</li>
</ol>

<p class="nho mo">Đóng Word và Excel trước khi nhập, nếu không phần mềm báo lỗi đọc tệp.</p>`,
  },
  {
    ma: "thu-muc", ten: "4. Thư mục dữ liệu",
    noi: `
<p>App tạo sẵn cây thư mục trong <b>Tài liệu → TKB Zalo</b>:</p>
<table class="b"><tbody>
  <tr><td class="mono" style="width:40%">1 - CHO XU LY</td>
      <td><b>Hộp thư vào.</b> Chép tệp vừa xuất vào đây, bấm <b>Quét lại</b> ở mục Nhập dữ liệu.</td></tr>
  <tr><td class="mono">2 - DU LIEU DA NHAP</td>
      <td>Tệp gốc theo năm học và số TKB, ví dụ <span class="mono">2025-2026\\So 01\\</span>.
          Bên trong có <span class="mono">gv\\</span>, <span class="mono">lop\\</span>, <span class="mono">anh\\</span>.</td></tr>
  <tr><td class="mono">3 - DANH SACH GIAO VIEN</td><td>Tệp Excel danh sách giáo viên.</td></tr>
  <tr><td class="mono">4 - KET XUAT</td><td>Bảng thống kê bạn xuất ra.</td></tr>
</tbody></table>

<h3>Cách nhanh</h3>
<p>Tự tạo thư mục <span class="mono">2 - DU LIEU DA NHAP\\&lt;năm học&gt;\\So &lt;số&gt;\\</span> rồi chép ba tệp vào.
App thấy ngay ở tab <b>Kho dữ liệu đã lưu</b>.</p>
<div class="bao tin"><b>App đối chiếu thư mục với dữ liệu đã nạp.</b>
<span class="sua">Có tệp mà chưa nạp → báo <b>Chưa nạp</b>. Tệp mới hơn lần nạp → báo <b>Có tệp mới hơn</b>, tránh gửi nhầm TKB cũ.</span></div>

<h3>Tệp thừa, tệp sai</h3>
<p>Bấm <b>Soi thư mục</b> để xem tệp nào đúng, tệp nào <b>thừa</b>, tệp nào <b>hỏng</b> và hỏng thế nào.
Ví dụ tệp <span class="mono">.doc</span> đời cũ phải lưu lại thành <span class="mono">.docx</span>.</p>
<h3>Kéo thả là xong</h3>
<p>Thả tệp vào vùng <b>Kéo tệp vào đây</b> ở trang Dữ liệu. Phần mềm <b>đọc nội dung từng tệp</b>
để biết đó là gì, rồi tự đặt tên chuẩn và cất đúng thư mục:</p>
<table class="b"><tbody>
  <tr><td style="width:34%">Excel tổng hợp</td><td><span class="mono">TKB-2025-2026-So-01-TONG.xlsx</span> → thư mục chờ xử lý</td></tr>
  <tr><td>Word thời khoá biểu giáo viên</td><td><span class="mono">TKB-2025-2026-So-01-GV-A4.docx</span></td></tr>
  <tr><td>Word thời khoá biểu lớp</td><td><span class="mono">TKB-2025-2026-So-01-LOP-A4.docx</span></td></tr>
  <tr><td>Danh sách giáo viên</td><td><span class="mono">DS-GV.xlsx</span> → thư mục danh sách giáo viên</td></tr>
  <tr><td>Không nhận ra</td><td>để riêng trong <span class="mono">KHONG DUNG DINH DANG</span>, không xoá</td></tr>
</tbody></table>
<p>Tệp Word không tự nói được nó thuộc thời khoá biểu số mấy, nên hãy <b>thả cùng lượt với tệp Excel tổng</b>.
Thả riêng thì tên ghi <span class="mono">CHUA-RO</span>, vẫn nhập được.</p>

<h3>Không lưu trùng</h3>
<p>Thả lại tệp đã có, phần mềm nhận ra <b>nội dung y hệt</b> (kể cả khi tên khác) và <b>không lưu thêm</b>.
Nội dung có đổi thì thay tệp cũ, kho luôn chỉ một bản.</p>

<h3>Xong là có báo cáo</h3>
<p>Sau mỗi lần thả, phần mềm hiện bảng: từng tệp <b>thành gì · đặt tên gì · để ở đâu · cái nào không nhận và vì sao</b>,
kèm bốn con số đã nhận / trùng / không nhận / thiếu dữ liệu.</p>

<h3>Thứ tự nạp</h3>
<div class="bao canh"><b>Nạp danh sách giáo viên trước, thời khoá biểu sau.</b>
  <span class="sua">Chưa có ai trong danh sách thì không khớp được thời khoá biểu vào từng người,
  nên nút nhập thời khoá biểu sẽ bị khoá.</span></div>
`,
  },
  {
    ma: "giao-vien", ten: "5. Danh sách giáo viên",
    noi: `
<h3>Các cột trong tệp Excel</h3>
<table class="b"><thead><tr><th>Cột</th><th>Ý nghĩa</th></tr></thead><tbody>
  <tr><td><b>Họ đệm</b>, <b>Tên</b></td><td>Hai cột riêng.</td></tr>
  <tr><td><b>Mã GV</b></td><td><b>Quan trọng nhất.</b> Tên viết tắt trong thời khoá biểu
      (<span class="mono">P.Ha</span>, <span class="mono">Thuy Ha</span>). Sai mã là không khớp được.</td></tr>
  <tr><td><b>Mã GV 2</b></td><td>Mã dự phòng khi bản TKB khác đặt mã khác.</td></tr>
  <tr><td><b>Điện thoại di động</b></td><td>Số dùng Zalo. Không có thì không gửi được.</td></tr>
  <tr><td>Email, Ghi chú, Zalo UID</td><td>Không bắt buộc. Zalo UID để trống, app tự dò.</td></tr>
</tbody></table>
<div class="bao canh"><b>Số điện thoại hay mất số 0 đầu.</b>
<span class="sua">Định dạng ô Excel là <b>Văn bản</b> trước khi nhập số.</span></div>

<p>Nhập lại tệp thì người đã có được <b>cập nhật</b>, không nhân đôi.</p>

<h3>Người nhận ngoài danh sách</h3>
<p>Hiệu trưởng, tổ trưởng… muốn nhận nhưng không dạy tiết nào thì thêm ở tab
<b>Người nhận ngoài danh sách</b>, chọn nhận <b>tất cả lớp</b>, <b>một số lớp</b>, hoặc TKB của <b>một số giáo viên</b>.</p>
<h3>Sửa ngay trên bảng</h3>
<p>Bấm thẳng vào ô <b>họ tên, mã GV, tổ, điện thoại, email, lớp chủ nhiệm</b> rồi gõ.
Rời ô là <b>tự lưu</b>, ô sáng xanh một nhịp cho biết đã lưu. Enter để lưu nhanh, Esc để bỏ.</p>
<p>Đổi số điện thoại thì nhớ bấm <b>Dò Zalo</b> lại cho người đó.
Nút <b>⋯</b> mở hộp đầy đủ khi cần sửa nhiều trường một lúc.</p>
`,
  },
  {
    ma: "nhap-tkb", ten: "6. Nhập thời khoá biểu",
    noi: `
<p>Vào <b>Nhập dữ liệu</b>, chọn nhóm tệp rồi bấm <b>Nhập vào phần mềm</b>. App hiện bảng <b>xem trước</b> để bạn kiểm tra.</p>

<h3>App kiểm tra gì</h3>
<ul>
  <li>Số TKB, ngày thực hiện, năm học, học kỳ, tên trường. Thiếu thì cho điền tay ngay.</li>
  <li>Số lớp, số giáo viên, tổng tiết.</li>
  <li><b>Lớp nào chưa có giáo viên chủ nhiệm.</b></li>
  <li>Giáo viên nào <b>chưa khớp</b> danh sách.</li>
  <li>Số tiết bảng phân công có khớp thời khoá biểu không.</li>
</ul>

<h3>Nhập trùng số</h3>
<div class="bao canh"><b>Số đã có thì app cảnh báo kèm so sánh cũ – mới.</b>
<span class="sua">Chọn <b>Cập nhật</b> thì bản cũ được lưu vết ở tab Lịch sử bản. Không mất gì.</span></div>

<h3>Tạo ảnh</h3>
<p>Vào màn <b>Thời khoá biểu</b> bấm <b>Tạo ảnh</b>. Mỗi giáo viên và mỗi lớp một ảnh, chữ to, xem rõ trên điện thoại.
Bấm <b>Xem</b> ở từng dòng để soi trước.</p>`,
  },
  {
    ma: "zalo", ten: "7. Kết nối Zalo",
    noi: `
<p>Vào <b>Kết nối Zalo</b> → <b>Đăng nhập Zalo (quét QR)</b>. Mở Zalo trên điện thoại, quét mã.
Quét một lần, lần sau tự vào.</p>

<h3>Đèn báo ở góc trên bên phải</h3>
<p>Lúc nào cũng thấy, ở mọi trang:</p>
<table class="b"><tbody>
  <tr><td style="width:34%"><b>Chấm xanh đang đập</b></td><td>Đang kết nối, gửi được. Còn đập là còn kết nối.</td></tr>
  <tr><td><b>Chấm vàng</b></td><td>Đang chờ bạn quét mã QR.</td></tr>
  <tr><td><b>Chấm xám đứng yên</b></td><td>Chưa kết nối. Bấm vào để quét mã.</td></tr>
</tbody></table>
<p class="nho mo">Phiên Zalo đứt giữa chừng thì đèn tắt trong vòng 30 giây, không để bạn gửi nhầm khi đã mất kết nối.</p>

<h3>Nút nối nhanh</h3>
<p>Không cần vào tận màn đó: nút tròn <b>Nối Zalo</b> có mặt ở cuối thanh bên, trang Tổng quan,
trang Dữ liệu và trang Gửi. Màu nút cho biết trạng thái:</p>
<table class="b"><tbody>
  <tr><td style="width:30%"><span class="nhan n-xam">○ Nối Zalo</span></td><td>chưa kết nối — bấm để quét mã</td></tr>
  <tr><td><span class="nhan n-canh">◔ Quét QR</span></td><td>mã QR đang chờ bạn quét</td></tr>
  <tr><td><span class="nhan n-ok">● Tên bạn</span></td><td>đã kết nối, sẵn sàng gửi</td></tr>
</tbody></table>
<p>Bấm nút là hiện ngay hộp mã QR. Quét xong, hộp hiện <b>tên tài khoản, số điện thoại, Zalo UID</b>
rồi <b>tự đóng sau 5 giây</b> để bạn làm tiếp. Nếu bấm <b>Gửi</b> khi chưa kết nối, app cũng mở thẳng hộp này,
kết nối xong là đi tiếp không phải bấm lại.</p>

<h3>Dò Zalo</h3>
<p>App cần biết Zalo UID của mỗi người. Vào màn <b>Giáo viên</b> → <b>Dò Zalo</b>.
Việc này chạy chậm cho an toàn: 40 số mất khoảng 2 phút.
Số không có Zalo bị đánh dấu và bỏ qua khi gửi.</p>

<div class="bao canh"><b>Không mở Zalo Web hay Zalo PC cùng tài khoản khi đang gửi.</b></div>`,
  },
  {
    ma: "ket-ban", ten: "8. Vì sao có người không nhận được",
    noi: `
<div class="bao xau"><b>Đây là nguyên nhân phổ biến nhất.</b></div>

<h3>Hai trường hợp</h3>
<ol>
  <li><b>Chưa kết bạn Zalo với tài khoản gửi</b> — tin rơi vào mục “Tin nhắn từ người lạ”, nhiều người không mở.</li>
  <li><b>Đã tắt nhận tin từ người lạ</b> — tin không đến được, nhưng app vẫn báo gửi thành công.</li>
</ol>

<h3>App giúp gì</h3>
<ul>
  <li>Bấm <b>Đối chiếu bạn bè</b> ở màn Kết nối Zalo → người chưa kết bạn mang nhãn <b>Chưa kết bạn</b>.</li>
  <li>Hộp gửi đếm sẵn số người này và cảnh báo trước.</li>
  <li>Mỗi dòng có nút <b>Mời kết bạn</b>.</li>
</ul>

<h3>Cách làm đúng</h3>
<p><b>Kết bạn trước, gửi sau.</b> Rải 20–30 lời mời mỗi ngày, hoặc nhờ giáo viên nhắn trước một tin cho bạn.</p>`,
  },
  {
    ma: "gui", ten: "9. Gửi thời khoá biểu",
    noi: `
<p>Có hai lối vào, đều mở cùng một hộp thoại:</p>
<ul>
  <li>Trang <b>Dữ liệu</b> → khu <b>Thời khoá biểu</b> → nút <b>Gửi qua Zalo</b> (gửi đúng bản đang xem).</li>
  <li>Bước <b>3 · Gửi</b> ở thanh bên → chọn số thời khoá biểu ở đầu trang → <b>Gửi qua Zalo</b>.</li>
</ul>
<p>Chưa kết nối Zalo thì app mở hộp quét mã QR trước, xong là đi tiếp.</p>

<h3>Hộp tuỳ chọn</h3>
<table class="b"><tbody>
  <tr><td style="width:26%"><b>Gửi gì</b></td><td>TKB cá nhân · TKB lớp cho chủ nhiệm · người ngoài danh sách. Tích bao nhiêu cũng được.</td></tr>
  <tr><td><b>Dạng tệp</b></td><td>Ảnh · Word · cả hai. Ảnh chọn được cả ngày, chỉ sáng, hoặc chỉ chiều.</td></tr>
  <tr><td><b>Tránh trùng</b></td><td>Bỏ qua người đã nhận y nguyên · chỉ gửi người có thay đổi (mục 10).</td></tr>
  <tr><td><b>Người nhận</b></td><td>Tất cả · chỉ chủ nhiệm · chọn tay từng người.</td></tr>
  <tr><td><b>Lời nhắn</b></td><td>Sửa ngay trong hộp.</td></tr>
</tbody></table>

<p>Bấm <b>Xem trước danh sách</b> để thấy <b>ai nhận gì</b>, kèm lý do nếu bị bỏ qua.</p>

<h3>Xem thử trên điện thoại</h3>
<p>Nút <b>Trên ĐT</b> ở mỗi dòng dựng lại <b>đúng màn hình người nhận sẽ thấy</b>: lời nhắn,
ảnh thời khoá biểu và thẻ tệp Word để tải về. Nội dung lấy từ chính đợt gửi nên không lệch.
Nút này có ở cả khu Thời khoá biểu và bảng xem trước đợt gửi.</p>
<p class="nho mo">Dùng để soát chữ và ảnh trước khi gửi cho cả trường.</p>

<h3>Gửi thử trước</h3>
<p>Luôn bấm <b>Gửi thử 3 người</b>, mở Zalo kiểm tra, rồi mới <b>Bắt đầu gửi tất cả</b>.</p>

<h3>Trong lúc gửi</h3>
<ul>
  <li>Nhật ký hiện từng người: ✓ xong, ✗ lỗi kèm lý do.</li>
  <li><b>Tạm dừng</b> bất cứ lúc nào, phần còn lại vẫn trong hàng chờ.</li>
  <li><b>Tắt app giữa chừng cũng được</b> — mở lại bấm <b>Tiếp tục</b>, không gửi lại ảnh cho người đã nhận.</li>
  <li>Mục lỗi thì bấm <b>Gửi lại lỗi</b>.</li>
  <li>Xong đợt, app hiện <b>Danh sách lỗi</b>: ai không nhận được, số điện thoại, vì sao, sửa thế nào.
      Chép được sang Excel.</li>
</ul>

<h3>Giới hạn an toàn</h3>
<p>Zalo không công bố con số chính thức. Theo kinh nghiệm, rủi ro nằm gần hết ở việc nhắn cho
<b>người lạ</b> (khoảng 10–40 tin/ngày là đã bị để ý), còn nhắn cho <b>người đã kết bạn</b> là việc bình thường.
Vì vậy app đặt hai mức riêng:</p>
<table class="b"><tbody>
  <tr><td style="width:46%"><b>Người đã kết bạn</b></td><td>300 người / 24 giờ</td></tr>
  <tr><td><b>Người chưa kết bạn</b></td><td>30 người / 24 giờ</td></tr>
  <tr><td>Tổng số tin</td><td>700 tin / 24 giờ</td></tr>
  <tr><td>Mỗi đợt</td><td>120 người — vượt thì chỉ cảnh báo</td></tr>
</tbody></table>
<p><b>Trường đông hơn 100 giáo viên:</b> kết bạn với họ trước, rồi nâng mức “đã kết bạn” trong <b>Cài đặt</b>.
Hết mức người lạ thì app <b>vẫn gửi tiếp cho người đã kết bạn</b>, chỉ hoãn nhóm còn lại.</p>
<p>Hạn mức tính theo <b>từng tài khoản Zalo</b>: đổi sang tài khoản khác là đếm lại từ đầu.
Gặp <b>3 lỗi liên tiếp</b> thì tự dừng.</p>`,
  },
  {
    ma: "trung", ten: "10. Chống gửi trùng",
    noi: `
<p>App nhớ <b>nội dung lịch dạy</b> của từng người ở mỗi lần gửi thành công, nên biết lần này có gì khác không.</p>
<table class="b"><thead><tr><th>Trạng thái</th><th>Nghĩa là</th></tr></thead><tbody>
  <tr><td><span class="nhan n-ok">lần đầu</span></td><td>Chưa từng nhận.</td></tr>
  <tr><td><span class="nhan n-coral">có thay đổi</span></td><td>Từng nhận, nay lịch dạy khác.</td></tr>
  <tr><td><span class="nhan n-canh">trùng</span></td><td><b>Đã nhận đúng nội dung này rồi.</b></td></tr>
</tbody></table>

<h3>Hai tuỳ chọn</h3>
<ul>
  <li><b>Bỏ qua người đã nhận y nguyên</b> (bật sẵn). Bỏ tích thì vẫn gửi được, app hiện cảnh báo gửi trùng.</li>
  <li><b>Chỉ gửi người có thay đổi</b> — hợp khi sửa TKB giữa chừng mà chỉ vài người bị ảnh hưởng.</li>
</ul>
<p class="nho mo">App so nội dung lịch dạy, không so số TKB. Đổi số mà lịch không đổi thì vẫn tính là trùng.</p>`,
  },
  {
    ma: "lich-su", ten: "11. Lịch sử gửi",
    noi: `
<p>Ghi lại <b>mọi lượt gửi</b>, không bao giờ xoá, kể cả khi bạn xoá thời khoá biểu.</p>
<p>Mỗi dòng có: thời điểm, người nhận và số điện thoại, nhận TKB nào, tệp nào, kết quả, mã tin Zalo,
và <b>nguyên văn lời nhắn</b> đã gửi.</p>
<p>Lọc theo TKB, loại, kết quả, khoảng ngày, hoặc tìm theo tên và số. Tab <b>Tổng hợp</b> cho biết mỗi người
đã nhận gì, bao nhiêu lần, lần gần nhất khi nào.</p>`,
  },
  {
    ma: "thong-ke", ten: "12. Thống kê số tiết",
    noi: `
<p>Đếm số tiết theo <b>một thời khoá biểu</b> hoặc theo <b>khoảng thời gian</b>.</p>

<h3>Lọc nhiều chiều cùng lúc</h3>
<p>Khoảng ngày · thời khoá biểu · giáo viên · tổ chuyên môn · khối · lớp · môn · buổi · thứ · chỉ chủ nhiệm.</p>

<h3>Sáu cách xem</h3>
<p>Theo giáo viên · lớp · môn · thứ và buổi · giáo viên × lớp · giáo viên × thứ.</p>

<h3>Theo khoảng thời gian</h3>
<p>Mỗi TKB được nhân với <b>số tuần nó có hiệu lực</b> trong khoảng đó. Ngày kết thúc của một TKB là ngày
trước ngày thực hiện của TKB kế tiếp.</p>

<h3>Đối chiếu bảng phân công</h3>
<p>Xem theo giáo viên với đúng một TKB thì app so <b>số tiết đếm được</b> với <b>số tiết khai</b>.
Dòng lệch tô đỏ.</p>

<h3>Xuất và in</h3>
<ul>
  <li><b>Xuất Excel</b>: nhiều cách xem, mỗi cách một sheet, kèm sheet ghi điều kiện lọc.</li>
  <li><b>In</b> hoặc <b>Lưu PDF</b>: khổ A4, đầu trang có tên trường, điều kiện lọc và ngày in.</li>
</ul>`,
  },
  {
    ma: "loi", ten: "13. Lỗi thường gặp",
    noi: `
<table class="b"><thead><tr><th style="width:34%">Hiện tượng</th><th>Cách xử lý</th></tr></thead><tbody>
  <tr><td><b>Không đọc được tệp Word</b></td><td>Tệp đang mở trong Word. Đóng Word rồi thử lại.</td></tr>
  <tr><td><b>Giáo viên không khớp TKB</b></td><td>Cột <b>Mã GV</b> khác tên viết tắt trong TKB. Sửa lại, hoặc điền ô <b>Mã GV 2</b>.</td></tr>
  <tr><td><b>Lớp không gửi được cho chủ nhiệm</b></td><td>Lớp chưa có chủ nhiệm. Nhập ở phần mềm xếp TKB rồi xuất lại, hoặc chọn tay.</td></tr>
  <tr><td><b>Chưa dò được Zalo</b></td><td>Chưa bấm dò, hoặc số đó không có Zalo.</td></tr>
  <tr><td><b>Báo gửi xong nhưng người ta không thấy</b></td><td>Chưa kết bạn hoặc họ chặn tin người lạ — xem mục 8.</td></tr>
  <tr><td><b>Phiên Zalo hết hạn</b></td><td>Quét lại mã QR rồi bấm <b>Tiếp tục</b>. Phần đã gửi không bị gửi lại.</td></tr>
  <tr><td><b>Dừng vì 3 lỗi liên tiếp</b></td><td>Mất mạng, hoặc Zalo đang hạn chế. Thử gửi tay một tin trên Zalo xem còn được không.</td></tr>
  <tr><td><b>Chạm giới hạn an toàn</b></td><td>Đã gửi đủ mức trong 24 giờ. Hôm sau mở lại bấm <b>Tiếp tục</b>.</td></tr>
  <tr><td><b>Ảnh chưa tạo</b></td><td>Vào màn Thời khoá biểu bấm <b>Tạo ảnh</b>.</td></tr>
  <tr><td><b>Thư mục báo “Có tệp mới hơn”</b></td><td>Bạn chép tệp mới mà chưa nạp lại. Bấm <b>Nạp lại</b>.</td></tr>
</tbody></table>`,
  },
  {
    ma: "rui-ro", ten: "14. Điều khoản và rủi ro",
    noi: NOI_DUNG_RUI_RO,
  },
];
