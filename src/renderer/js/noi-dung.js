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
  <li>Trên <b>Smart Scheduler</b>: chọn <b>Hệ thống | Chuyển đổi dữ liệu sang Excel</b>, bấm
      <b>Chấp nhận</b>, lưu tệp Excel vừa tạo.</li>
  <li><b>Kéo thả</b> tệp đó vào trang <b>Dữ liệu</b> (hoặc bấm <b>＋ Thêm tệp dữ liệu</b>) → xem thử →
      bấm <b>Nạp dữ liệu</b>. Phần mềm tự tạo danh sách giáo viên và ảnh thời khoá biểu.</li>
  <li>Lần đầu: <b>điền số điện thoại</b> giáo viên ngay trên bảng, rồi <b>quét mã QR Zalo</b>.</li>
  <li>Bấm <b>Gửi</b>: chọn gửi gì cho ai rồi gửi. Muốn chắc thì gửi thử vài người trước.</li>
</ol>
<p>Lần sau có thời khoá biểu mới: xuất tệp mới, thả vào, nạp, bấm <b>Gửi</b>.</p>
<h3>Màn hình có gì</h3>
<p>Thanh bên trái là <b>ba bước theo đúng thứ tự</b>: Dữ liệu → Kết nối Zalo → Gửi.
<b>Gửi</b> chỉ khoá khi chưa có thời khoá biểu hoặc chưa có ai để gửi — cần ít nhất
<b>1 số điện thoại</b> hoặc <b>1 nhóm Zalo</b>. Chưa kết nối Zalo vẫn bấm Gửi được: hộp quét mã QR tự hiện,
quét xong đi tiếp. Rê chuột vào bước bị khoá là thấy còn thiếu gì.</p>
<ul>
  <li><b>Dữ liệu</b> gom cả ba việc vào một trang: nhập tệp, danh sách giáo viên, thời khoá biểu.
      Thanh nhảy nhanh ở đầu trang đưa tới đúng khu.</li>
  <li>Nút <b>«</b> ở góc trên thanh bên (hoặc <b>Ctrl + B</b>) thu gọn thanh bên còn icon kèm chữ viết tắt,
      để màn hình rộng hơn. Bấm lại để mở ra.</li>
  <li>Cuối thanh bên là <b>số hiệu phiên bản</b> — bấm vào là kiểm tra cập nhật.
      Trạng thái Zalo xem ở <b>đèn góc trên bên phải</b>, bấm đèn là mở luôn màn kết nối.</li>
</ul>
<h3>Vì sao có phần mềm này</h3>
<p>Cách chính thống để gửi thời khoá biểu là qua <b>email</b> hoặc <b>Zalo OA của trường</b>,
nhưng <b>cài đặt khá phức tạp</b>, Zalo OA còn phải đăng ký và chờ được duyệt.</p>
<p>Phần mềm này <b>đi đường đơn giản</b>: dùng chính tài khoản Zalo cá nhân sẵn có, quét mã QR một lần
là gửi được ngay — không đăng ký, không chờ duyệt, không tốn phí. Đổi lại, phải gửi chừng mực để
tài khoản không bị hạn chế (xem mục <b>Điều khoản và rủi ro</b>), nên khuyến cáo dùng
<b>một tài khoản Zalo phụ</b>.</p>
<p>Ngoài việc gửi, phần mềm làm thêm mấy việc mà gửi tay không làm được:</p>
<ul>
  <li>Mỗi thầy/cô nhận đúng thời khoá biểu của mình: <b>dạng ảnh xem ngay</b> trên điện thoại
      và <b>file Word để in</b>; chủ nhiệm nhận thêm thời khoá biểu lớp.</li>
  <li><b>Gửi vào nhóm Zalo</b> của tổ chuyên môn, của trường, của nhóm cha mẹ học sinh...</li>
  <li><b>Thống kê số tiết</b> theo giáo viên, lớp, môn, buổi; xuất Excel và in biểu mẫu báo cáo.</li>
  <li><b>Lịch sử gửi</b> có trạng thái tin đã tới nơi hay chưa, ai chưa nhận được và vì sao.</li>
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
<div class="bao ok"><b>Chỉ cần một tệp: tệp Excel do Smart Scheduler chuyển đổi ra.</b>
  <span class="sua">Tệp này có đủ bảng phân công, họ tên giáo viên và toàn bộ tiết học.</span></div>

<h3>Lấy tệp Excel từ Smart Scheduler</h3>
<ol>
  <li>Chọn <b>Hệ thống | Chuyển đổi dữ liệu sang Excel</b>.</li>
  <li>Hộp <b>Chuyển đổi dữ liệu sang Excel</b> hiện ra. Giữ tích ít nhất ba ô:
      <b>Bảng phân công giảng dạy</b>, <b>TKB lớp học</b>, <b>TKB giáo viên</b>
      (mặc định đã tích sẵn). Các ô khác để nguyên cũng được.</li>
  <li>Bấm <b>Chấp nhận</b>. Smart Scheduler chuyển toàn bộ dữ liệu sang một tệp Excel — lưu tệp đó lại.</li>
  <li>Sang TKB Zalo: <b>kéo thả</b> tệp đó vào trang <b>Dữ liệu</b>, hoặc bấm <b>＋ Thêm tệp dữ liệu</b>
      → xem thử → <b>Nạp dữ liệu</b>.</li>
</ol>
<div class="bao canh"><b>Đừng bỏ tích “TKB giáo viên”.</b>
  <span class="sua">Phần mềm dùng sheet đó để nhận ra mã viết tắt của từng giáo viên khi tạo danh sách
  giáo viên từ bảng phân công.</span></div>

<h3>Phần mềm tự làm từ tệp đó</h3>
<ul>
  <li><b>Tạo danh sách giáo viên</b> từ bảng phân công và tự nhận ra mã viết tắt của từng người
      (<span class="mono">P.Ha</span>, <span class="mono">Thuy Ha</span>…) — kể cả chủ nhiệm không dạy tiết nào.</li>
  <li><b>Ghép từng tiết</b> vào đúng giáo viên, đúng lớp.</li>
  <li><b>Vẽ ảnh thời khoá biểu</b> cho từng giáo viên và từng lớp, xem ngay trên điện thoại.</li>
  <li><b>Tạo file Word để in</b> cho từng giáo viên và từng lớp, <b>đúng mẫu Word của Smart Scheduler</b>,
      cả khổ <b>A4</b> và <b>A5</b>.</li>
</ul>
<p>Việc duy nhất phải làm thêm: <b>điền số điện thoại</b> giáo viên, vì tệp Excel không có số.
Chỉ làm một lần, những lần sau phần mềm nhớ.</p>

<h3>Thêm tệp nếu muốn</h3>
<table class="b"><thead><tr><th style="width:24%">Tệp</th><th>Lấy ở đâu trên Smart Scheduler</th><th style="width:28%">Được thêm gì</th></tr></thead><tbody>
  <tr><td><b>Danh sách giáo viên</b> có số điện thoại</td>
      <td>Mục <b>Dữ liệu giáo viên</b>, chọn <b>Excel | Copy file dữ liệu mẫu</b>.
          Mở ra điền danh sách và số điện thoại rồi lưu.</td>
      <td>Khỏi gõ số điện thoại từng người.</td></tr>
  <tr><td><b>Tệp Word</b> — thường <b>không cần</b></td>
      <td>Mục <b>In ấn → In TKB cá nhân</b>: <b>In TKB giáo viên</b> / <b>In TKB lớp học</b>, tích
          <b>Chọn tất cả</b>, chọn khổ, bấm <b>Chấp nhận</b>.</td>
      <td>Chỉ khi bạn đã <b>sửa tay</b> trên Word của Smart Scheduler và muốn gửi đúng bản đó.
          Phần mềm dùng tệp này thay cho bản tự tạo cùng khổ.</td></tr>
</tbody></table>
<div class="bao tin"><b>Có thêm tệp thì thả cùng lượt với tệp Excel tổng.</b>
  <span class="sua">Thả cùng lượt thì tệp Word mới biết nó thuộc thời khoá biểu số mấy.</span></div>

<h3>Nhớ nhập giáo viên chủ nhiệm</h3>
<div class="bao canh"><b>Chưa nhập thì phần mềm không biết gửi thời khoá biểu lớp cho ai.</b>
  <span class="sua">Nhập “Danh sách giáo viên chủ nhiệm” trên Smart Scheduler rồi xuất Excel lại.
  Hoặc chọn tay từng lớp ở tab Thời khoá biểu.</span></div>

<p class="nho mo">Đóng Word và Excel trước khi nạp, nếu không phần mềm báo lỗi đọc tệp.</p>`,
  },
  {
    ma: "thu-muc", ten: "4. Nạp dữ liệu",
    noi: `
<h3>Kéo thả, xem thử, nạp</h3>
<ol>
  <li>Ở trang <b>Dữ liệu</b>, <b>kéo thả</b> tệp vào, hoặc bấm <b>＋ Thêm tệp dữ liệu</b> để chọn tệp.</li>
  <li>Hộp <b>Xem thử và nạp dữ liệu</b> hiện ra: số thời khoá biểu, ngày thực hiện, số lớp, số tiết,
      giáo viên nào được thêm hay cập nhật, lớp nào chưa có chủ nhiệm. <b>Lúc này chưa ghi gì.</b></li>
  <li>Bấm <b>Nạp dữ liệu</b>. Phần mềm nạp đúng thứ tự — danh sách giáo viên trước, thời khoá biểu sau —
      rồi <b>tự tạo ảnh</b>.</li>
</ol>
<div class="bao tin"><b>Chưa có danh sách giáo viên cũng nạp được.</b>
  <span class="sua">Hộp xem thử có sẵn ô <b>Tạo giáo viên từ bảng phân công</b>, đã tích sẵn.</span></div>
<p>Bấm <b>Để sau</b> thì tệp nằm chờ ở tab <b>Nhập tệp</b>; khi sẵn sàng bấm <b>Xem thử và nạp</b> trên thẻ tệp.</p>

<h3>Phần mềm tự đặt tên và cất tệp</h3>
<p>Phần mềm <b>đọc nội dung từng tệp</b> để biết đó là gì, rồi tự đặt tên chuẩn:</p>
<table class="b"><tbody>
  <tr><td style="width:34%">Excel tổng</td><td><span class="mono">TKB-2025-2026-So-01-TONG.xlsx</span></td></tr>
  <tr><td>Word thời khoá biểu giáo viên</td><td><span class="mono">TKB-2025-2026-So-01-GV-A4.docx</span></td></tr>
  <tr><td>Word thời khoá biểu lớp</td><td><span class="mono">TKB-2025-2026-So-01-LOP-A4.docx</span></td></tr>
  <tr><td>Danh sách giáo viên</td><td><span class="mono">DS-GV.xlsx</span></td></tr>
  <tr><td>Không nhận ra</td><td>để riêng trong <span class="mono">KHONG DUNG DINH DANG</span>, không xoá</td></tr>
</tbody></table>
<p><b>Không lưu trùng:</b> thả lại tệp có nội dung y hệt (kể cả khác tên) thì phần mềm bỏ qua.
Tệp nào không dùng được, hộp xem thử nói rõ vì sao và cần tệp nào thay.</p>

<h3>Thư mục dữ liệu</h3>
<p>Mọi tệp nằm trong <b>Tài liệu → TKB Zalo</b>:</p>
<table class="b"><tbody>
  <tr><td class="mono" style="width:40%">1 - CHO XU LY</td><td>Tệp vừa thả, chờ nạp.</td></tr>
  <tr><td class="mono">2 - DU LIEU DA NHAP</td>
      <td>Tệp gốc theo năm học và số thời khoá biểu, kèm ảnh và tệp Word đã cắt.</td></tr>
  <tr><td class="mono">3 - DANH SACH GIAO VIEN</td><td>Tệp Excel danh sách giáo viên.</td></tr>
  <tr><td class="mono">4 - KET XUAT</td><td>Bảng thống kê bạn xuất ra.</td></tr>
</tbody></table>
<p>Tab <b>Nhập tệp</b> có mục <b>Kho tệp</b> để xem, tạo, đổi tên, xoá thư mục ngay trong phần mềm.
Phần mềm đối chiếu thư mục với dữ liệu đã nạp: có tệp <b>chưa nạp</b> hoặc <b>mới hơn lần nạp</b>
thì hiện nút nạp ngay, tránh gửi nhầm thời khoá biểu cũ.</p>`,
  },
  {
    ma: "giao-vien", ten: "5. Danh sách giáo viên",
    noi: `
<p>Nạp tệp Excel tổng là phần mềm tự tạo danh sách giáo viên từ bảng phân công.
Nếu muốn có sẵn số điện thoại, thả kèm tệp danh sách giáo viên với các cột dưới đây.</p>
<h3>Các cột trong tệp Excel danh sách giáo viên</h3>
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
<p>Phần <b>Nhận thời khoá biểu nào</b> xếp <b>hai cột</b>: bên trái <i>Từng lớp</i>, bên phải
<i>Từng giáo viên</i>. Mỗi cột có ô tìm, số đã chọn và nút <b>Chọn hết</b> / <b>Bỏ hết</b> —
trường đông giáo viên vẫn chọn nhanh, khỏi cuộn dài.</p>
<h3>Sửa ngay trên bảng</h3>
<p>Bấm thẳng vào ô <b>họ tên, mã GV, tổ, điện thoại, email, lớp chủ nhiệm</b> rồi gõ.
Rời ô là <b>tự lưu</b>, ô sáng xanh một nhịp cho biết đã lưu. Enter để lưu nhanh, Esc để bỏ.</p>
<p>Đổi số điện thoại thì nhớ bấm <b>Dò Zalo</b> lại cho người đó.
Nút <b>⋯</b> mở hộp đầy đủ khi cần sửa nhiều trường một lúc.</p>

<h3>Xoá toàn bộ giáo viên</h3>
<p>Biểu tượng <b>thùng rác</b> ở cuối thanh tiêu đề bảng Giáo viên xoá hết danh sách. Phải tích
<b>Tôi hiểu</b> thì nút xoá mới bấm được.</p>
<ul>
  <li>Mất cả số điện thoại đã nhập và kết quả dò Zalo. Không hoàn tác được.</li>
  <li>Vẫn giữ: lịch sử gửi, nhóm Zalo, người nhận ngoài danh sách.</li>
  <li>Xoá xong, <b>nạp lại tệp thời khoá biểu</b> để phần mềm tạo và ghép lại giáo viên.</li>
</ul>
`,
  },
  {
    ma: "nhap-tkb", ten: "6. Thời khoá biểu",
    noi: `
<p>Nạp xong, thời khoá biểu hiện ở tab <b>Thời khoá biểu</b> của trang Dữ liệu,
<b>mặc định là bản mới nhất</b>. Ảnh đã được tạo sẵn.</p>

<h3>Hộp xem thử kiểm tra gì</h3>
<ul>
  <li>Số thời khoá biểu, ngày thực hiện, năm học, học kỳ, tên trường. Thiếu thì cho điền tay ngay.</li>
  <li>Số lớp, số giáo viên, tổng tiết.</li>
  <li><b>Lớp nào chưa có giáo viên chủ nhiệm.</b></li>
  <li>Giáo viên nào <b>chưa khớp</b> danh sách — có ô <b>Tạo thêm những người còn thiếu</b> từ bảng phân công.</li>
</ul>

<h3>Nạp trùng số</h3>
<div class="bao canh"><b>Số đã có thì hộp xem thử nói rõ, kèm so sánh cũ – mới.</b>
<span class="sua">Bấm <b>Nạp dữ liệu (cập nhật bản đã có)</b> thì bản cũ được lưu vết ở tab Lịch sử bản. Không mất gì.</span></div>

<h3>Ảnh</h3>
<p>Mỗi giáo viên và mỗi lớp một ảnh, chữ to, xem rõ trên điện thoại. Bấm <b>Xem</b> hoặc <b>Trên ĐT</b>
ở từng dòng để soi trước. Sửa chủ nhiệm xong thì bấm <b>Tạo ảnh + Word</b> để tạo lại.</p>

<h3>File Word</h3>
<p>Nạp xong là phần mềm <b>tự tạo file Word</b> cho từng giáo viên và từng lớp, <b>đúng mẫu Word của
Smart Scheduler</b> (cùng khung, phông, cách ghi “Môn - Lớp”), cả khổ <b>A4</b> và <b>A5</b>.
Tệp nằm trong thư mục <span class="mono">word\gv</span> và <span class="mono">word\lop</span>,
tên có đuôi <span class="mono">_A4</span> / <span class="mono">_A5</span>.</p>
<p>Nếu bạn có thả tệp Word của Smart Scheduler, phần mềm dùng tệp đó cho khổ tương ứng và chỉ tự tạo khổ còn lại.</p>

<h3>Xoá thời khoá biểu</h3>
<p>Bấm <b>Xoá…</b> ở đầu khu Thời khoá biểu. Trong hộp xoá, chọn một trong ba cách:</p>
<ul>
  <li>Tích <b>từng số</b>.</li>
  <li>Tích <b>cả một đợt</b> — các số cùng năm học và học kỳ.</li>
  <li>Tích <b>Chọn tất cả</b> để xoá toàn bộ.</li>
</ul>
<p>Mặc định xoá luôn ảnh và tệp Word đã tạo của các bản đó. <b>Lịch sử gửi vẫn giữ</b>; tệp gốc vẫn còn
trong thư mục dữ liệu, cần thì nạp lại.</p>`,
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

<h3>Gửi vào nhóm Zalo</h3>
<p>Ở màn <b>Kết nối Zalo</b> bấm <b>Chọn nhóm nhận thời khoá biểu</b>. Phần mềm đọc danh sách nhóm
của tài khoản đang đăng nhập, gõ tên để lọc, tích nhóm nào thì nhóm đó thành người nhận.</p>
<div class="bao tin"><b>Gửi vào nhóm không cần số điện thoại và không cần kết bạn.</b>
  <span class="sua">Mình đã ở trong nhóm rồi nên tin chắc chắn tới. Hợp với nhóm tổ chuyên môn
  hoặc nhóm toàn trường: một lần gửi là cả nhóm thấy.</span></div>
<div class="bao canh"><b>Phải chọn nhóm nhận thời khoá biểu nào, nếu không gửi sẽ không ra tin.</b>
  <span class="sua">Ngay trong hộp chọn nhóm có ô <b>Nhóm được nhận thời khoá biểu nào</b>:
  tất cả các lớp, hoặc tất cả giáo viên. Phần mềm không tự đoán được nên không đặt thì nó không
  biết gửi gì vào nhóm.</span></div>
<p>Nhóm đã chọn hiện ở <b>Dữ liệu → Giáo viên → Người nhận ngoài danh sách</b>, ghi rõ tên nhóm và
số thành viên. Sửa lại ở đó nếu muốn nhóm nhận thứ khác.</p>
<h3>Sửa nhóm ở đâu</h3>
<ul>
  <li><b>Ngay trong hộp gửi:</b> tab <b>Gửi cho ai</b>, dòng nhóm chưa đặt nhận gì có sẵn ô
      <b>Chọn nhận gì…</b>. Chọn xong là tích gửi được ngay.</li>
  <li><b>Dữ liệu → Giáo viên → Người nhận ngoài danh sách:</b> có nút <b>Thêm nhóm Zalo</b> và
      <b>Dò nhóm Zalo</b>. Bấm <b>Sửa</b> ở dòng nhóm để đổi nhóm nhận thời khoá biểu nào.</li>
</ul>
<div class="bao tin"><b>Nhóm không có số điện thoại, và không cần.</b>
  <span class="sua">Hộp sửa nhóm không hỏi số, chỉ hiện mã nhóm. Nút <b>Dò Zalo</b> theo số điện thoại
  cũng bỏ qua nhóm; muốn làm mới nhóm thì bấm <b>Dò nhóm Zalo</b>.</span></div>
<p>Bấm <b>Dò Zalo</b> hoặc <b>Dò nhóm Zalo</b> thì phần mềm cập nhật tên và số thành viên của nhóm,
và báo nếu bạn đã rời nhóm nào đó.</p>

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
<p>Mở ra là thấy ngay <b>bốn con số</b>: gửi được ngay · chưa kết bạn · chưa dò Zalo · không gửi được.
Bên dưới chia ba tab:</p>
<table class="b"><tbody>
  <tr><td style="width:22%"><b>Gửi cho ai</b></td>
      <td>Danh sách từng người, mỗi dòng ghi rõ <b>có số điện thoại chưa</b>, <b>đã dò Zalo chưa</b>,
          <b>đã kết bạn chưa</b>. Dòng mờ là không gửi được, không tích vào được.
          Có ô tìm và bộ lọc theo trạng thái, nút chọn hết / bỏ hết.</td></tr>
  <tr><td><b>Gửi cái gì</b></td><td>Thời khoá biểu cá nhân · lớp cho chủ nhiệm · người ngoài và nhóm Zalo;
          ảnh hay tệp Word; tránh gửi trùng.</td></tr>
  <tr><td><b>Lời nhắn</b></td><td>Sửa riêng cho đợt này, không ảnh hưởng mẫu trong Cài đặt.</td></tr>
</tbody></table>
<p>Còn người <b>chưa dò Zalo</b> thì hộp hiện nút <b>Dò Zalo ngay</b> — dò xong tự quay lại hộp
với số liệu mới, khỏi phải thoát ra làm rồi vào lại.</p>
<table class="b"><tbody>
  <tr><td style="width:26%"><b>Gửi gì</b></td><td>TKB cá nhân · TKB lớp cho chủ nhiệm · người ngoài danh sách. Tích bao nhiêu cũng được.</td></tr>
  <tr><td><b>Dạng tệp</b></td><td>Ảnh · Word · cả hai. Ảnh chọn được cả ngày, chỉ sáng, hoặc chỉ chiều.
      <b>Khổ file Word:</b> A4, A5, hoặc <b>cả hai</b> (người nhận được hai tệp). Lựa chọn được nhớ cho lần sau;
      mặc định theo <b>Cài đặt → Khổ giấy mặc định</b>.</td></tr>
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
    ma: "trung", ten: "10. Gửi lại và cảnh báo trùng",
    noi: `
<p>Phần mềm nhớ <b>nội dung lịch dạy</b> của từng người ở mỗi lần gửi thành công, nên biết lần này
có gì khác lần trước không.</p>

<div class="bao ok"><b>Gửi lại luôn được, phần mềm không chặn.</b>
  <span class="sua">Giáo viên xoá mất tin, đổi máy, hay nhà trường muốn nhắc lại — đều gửi lại bình thường.
  Phần mềm chỉ <b>cảnh báo</b> và đánh dấu mục nào đã từng nhận y nguyên nội dung đó.</span></div>

<h3>Ba nhãn trong bảng xem trước</h3>
<table class="b"><tbody>
  <tr><td style="width:34%"><span class="nhan n-ok">lần đầu</span></td><td>Người này chưa từng nhận thời khoá biểu này.</td></tr>
  <tr><td><span class="nhan n-coral">có thay đổi</span></td><td>Từng nhận rồi, nhưng lịch dạy nay đã khác.</td></tr>
  <tr><td><span class="nhan n-xam">gửi lại · đã nhận y nguyên</span></td><td>Từng nhận đúng nội dung này. Vẫn gửi, chỉ là bạn nên biết.</td></tr>
</tbody></table>

<h3>Muốn khỏi gửi trùng thì tích thêm</h3>
<ul>
  <li><b>Bỏ qua người đã nhận y nguyên</b> — chỉ gửi cho ai chưa nhận.</li>
  <li><b>Chỉ gửi người có thay đổi</b> — bỏ qua cả người chưa từng nhận, chỉ gửi ai có lịch khác trước.</li>
</ul>
<p class="nho mo">Dấu nhận biết là nội dung lịch dạy, không phải số thời khoá biểu. Đổi số mà lịch y nguyên
thì vẫn tính là trùng.</p>`,
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
  <tr><td><b>Ảnh chưa tạo</b></td><td>Ảnh tự tạo khi nạp. Thiếu thì vào tab Thời khoá biểu bấm <b>Tạo ảnh</b>.</td></tr>
  <tr><td><b>Thư mục báo “Có tệp mới hơn”</b></td><td>Bạn chép tệp mới mà chưa nạp lại. Bấm <b>Nạp lại</b>.</td></tr>
</tbody></table>`,
  },
  {
    ma: "rui-ro", ten: "14. Điều khoản và rủi ro",
    noi: NOI_DUNG_RUI_RO,
  },
];
