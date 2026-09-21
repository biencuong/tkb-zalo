# Kinh nghiệm và bẫy đã dính — TKB Zalo

Mỗi mục: **vấn đề → nguyên nhân thật → cách xử lý**. Viết để lần sau không mất thời gian lại.

---

## [20/9/2026] Electron ESM: `import { app } from "electron"` trả về undefined

**Vấn đề:** chạy `npx electron scripts/thu-chay.mjs` báo
`SyntaxError: The requested module 'electron' does not provide an export named 'BrowserWindow'`,
đổi sang `import electron from "electron"` thì `electron` là `undefined`.

**Nguyên nhân thật:** biến môi trường **`ELECTRON_RUN_AS_NODE=1` còn sót trong phiên shell**.
Khi có biến này, Electron chạy như Node thuần (`process.type === undefined`), và `electron` được phân giải
sang **gói npm** `node_modules/electron/index.js` — gói này chỉ xuất đường dẫn tệp chạy, không phải API.

**Cách xử lý:** kiểm `process.type` trước khi nghi ngờ mã nguồn. Chạy bằng
`env -u ELECTRON_RUN_AS_NODE npx electron …`. Với `process.type === "browser"` thì
`import { app, BrowserWindow } from "electron"` hoạt động bình thường trong ESM.

**Ghi nhớ:** script nào đặt `ELECTRON_RUN_AS_NODE` (ví dụ script kiểm `node:sqlite`) thì chỉ đặt cho
tiến trình con, đừng đặt vào phiên shell.

---

## [20/9/2026] Chụp ảnh ngoài màn hình: lần chụp ĐẦU TIÊN luôn hỏng `UnknownVizError`

**Vấn đề:** `capturePage()` ngay sau khi tạo cửa sổ offscreen và nạp trang luôn ném `UnknownVizError`;
lần thứ hai trở đi mới chạy.

**Nguyên nhân:** bộ dựng ảnh (viz/compositor) của Chromium chưa sẵn sàng ngay sau `loadFile`.

**Cách xử lý:** sau khi nạp trang, **hâm nóng**: chờ sự kiện `paint` đầu tiên (kèm hạn 1,5 giây), rồi gọi
một lần `capturePage()` mồi và bỏ qua lỗi. Ngoài ra mọi lần chụp đều bọc trong vòng thử lại 4 lần
(bắt cả ngoại lệ lẫn ảnh rỗng), giãn 250 ms × số lần.

---

## [20/9/2026] `image.getSize()` ở chế độ offscreen đã là SỐ ĐIỂM ẢNH THẬT

**Vấn đề:** ảnh ghi ra đúng 2160×2642 nhưng hàm trả về 4320×5284 vì mã nhân thêm `deviceScaleFactor`.

**Nguyên nhân:** tài liệu Electron nói `getSize()` trả DIP, nhưng với
`webPreferences.offscreen.deviceScaleFactor = 2` thì giá trị trả về **đã nhân sẵn**.

**Cách xử lý:** dùng thẳng `getSize()`. Số này đi vào `metadata` của tin ảnh Zalo nên sai là ảnh hiển thị lệch.

---

## [20/9/2026] HUỶ cửa sổ offscreen rồi TẠO LẠI ngay → treo cả tiến trình

**Vấn đề:** vẽ một ảnh → `destroy()` cửa sổ → vẽ ảnh tiếp theo → `loadFile` trả `ERR_FAILED (-2)`,
sau đó tiến trình Electron **đứng im, không ném lỗi, không thoát**.

**Nguyên nhân:** huỷ và tạo lại cửa sổ offscreen trong thời gian ngắn làm hỏng trạng thái compositor.

**Cách xử lý:** **giữ một cửa sổ vẽ duy nhất cho cả vòng đời app**, chỉ huỷ khi thoát
(`app.on("before-quit")`). Bỏ lời gọi huỷ ở cuối hàm tạo ảnh hàng loạt. Thêm vòng thử lại cho `loadFile`
làm lưới an toàn.

---

## [20/9/2026] Electron tự thoát giữa chừng khi cửa sổ ẩn bị đóng

**Vấn đề:** kịch bản kiểm thử dừng im ở bước 4, **mã thoát 0**, không báo lỗi gì.

**Nguyên nhân:** không có handler `window-all-closed` nên Electron dùng mặc định: đóng cửa sổ cuối cùng
là thoát app. Cửa sổ vẽ ảnh ẩn cũng tính là cửa sổ.

**Cách xử lý:** trong kịch bản kiểm thử đăng ký `app.on("window-all-closed", () => {})`.
Trong app thật thì cửa sổ chính luôn mở nên không dính, nhưng vẫn cần nhớ khi viết công cụ phụ.

---

## [20/9/2026] Heredoc của Bash hỏng khi nội dung là SQL dài có nháy đơn

**Vấn đề:** `cat > file << 'EOF'` với nội dung JavaScript chứa khối SQL
(`datetime('now','localtime')`) bên trong chuỗi mẫu backtick báo
`unexpected EOF while looking for matching '`.

**Cách xử lý:** tệp mã dài thì ghi bằng công cụ ghi tệp; sửa nhỏ thì dùng `python - << 'PYEOF'`
với tìm-thay có `assert` để lỡ không khớp thì báo ngay thay vì sửa trượt.

---

## [20/9/2026] Bản A5 của phần mềm xếp TKB kéo theo 240 phần rỗng

**Vấn đề:** cắt tệp Word A5 ra 40 tệp thì mỗi tệp vẫn nặng vì mang theo 120 header + 120 footer.

**Nguyên nhân:** mỗi `sectPr` của bản A5 tham chiếu 6 header/footer; tất cả đều **rỗng**.
Bản A4 không có phần này.

**Cách xử lý:** khi cắt, xoá mọi `headerReference`/`footerReference` trong `sectPr`, rồi dọn
`Relationship` tương ứng trong rels, `Override` trong `[Content_Types].xml`, và `zip.remove()` các part.
Cả ba đều là danh sách phẳng nên regex an toàn.

---

## [20/9/2026] Không suy đoán giáo viên chủ nhiệm từ môn dạy

**Vấn đề:** file mẫu lúc đầu không có cột chủ nhiệm; ý định suy từ môn Hoạt động trải nghiệm.

**Vì sao sai:** đếm thật — 20 lớp nhưng chỉ 12 giáo viên dạy HĐTN, có người dạy 2–3 lớp.
Suy đoán chắc chắn gán nhầm.

**Cách xử lý:** chỉ lấy từ nguồn chính thức (cột `CN` của bảng phân công, hoặc mã trong ngoặc ở tiêu đề
cột lớp). Thiếu thì **cảnh báo và bỏ qua**, kèm hướng dẫn nhập “Danh sách giáo viên chủ nhiệm” trong phần
mềm xếp thời khoá biểu; cho người dùng chọn tay nếu muốn.

---

## [20/9/2026] `zca-js`: hai bẫy khi gửi tệp

1. **Ảnh gửi bằng đường dẫn trên Windows bị hỏng tên tệp** — thư viện cắt tên bằng
   `filePath.split("/").pop()`, mà Windows dùng `\`. → truyền
   `{ data: Buffer, filename, metadata:{totalSize,width,height} }`; cách này còn khỏi cần thư viện đọc
   kích thước ảnh.
2. **`sendMessage` có `attachments` mà `msg` là `undefined` sẽ ném TypeError.** Gửi `.docx` thì
   `msg` phải là **chuỗi rỗng**; có chữ sẽ tách thành hai tin (một tin chữ, một tin tệp).

Ngoài ra: `findUser` trả `null` khi số không có Zalo (mã 216, không ném lỗi);
`getMultiUsersByPhones` trả khoá theo dạng `84…` nên phải chuẩn hoá lại về `0…`.

---

## [20/9/2026] Phông Barlow Semi Condensed CÓ bộ dấu tiếng Việt

**Bối cảnh:** ghi chép cũ nói phông này thiếu glyph tiếng Việt nên đã loại.

**Kiểm lại:** gói `@fontsource/barlow-semi-condensed` có tệp `*-vietnamese-*.woff2` riêng
(8 KB cho trọng số 600) — tức Google có sinh bộ dấu. Lỗi vỡ dấu trước đây là do nạp qua Google Fonts
mà **không lấy subset `vietnamese`**.

**Cách xử lý:** chép phông từ `@fontsource` kèm đúng `unicode-range` cho ba subset
(latin, latin-ext, vietnamese). Đã dùng thật, chữ hai dấu hiển thị đúng.

---

## [20/9/2026] Vân tay chống gửi trùng phải loại số thời khoá biểu

**Vấn đề:** nếu đưa số TKB vào vân tay thì đổi số là mọi người thành "có thay đổi", chức năng
"chỉ gửi phần thay đổi" vô nghĩa.

**Cách xử lý:** vân tay chỉ gồm tập `thu.buoi.tiet.môn.lớp.mã` đã sắp xếp. Đúng ý nghiệp vụ:
*lịch dạy của người này có đổi không*, chứ không phải *có bản phát hành mới không*.

---

## [20/9/2026] Bộ lọc đóng gói cắt nhầm mã chạy → app cài xong là sập

**Vấn đề:** bộ cài chạy được, nhưng mở app hiện hộp lỗi
`A JavaScript error occurred in the main process — Cannot find module './doc/workbook'`.

**Nguyên nhân:** để giảm dung lượng, cấu hình `build.files` có dòng
`"!**/{test,tests,__tests__,spec,example,examples,doc,docs,demo,...}/**"`.
Thư viện `exceljs` có **`lib/doc/`** là **mã chạy thật** (workbook, worksheet, cell…), không phải tài liệu.
Bộ lọc xoá luôn thư mục đó.

**Cách xử lý:**
- Chỉ loại theo tên thư mục **chắc chắn không chạy**: `__tests__`, `.github`, `.vscode`, `coverage`, `.nyc_output`.
  **Không** loại theo `doc`, `docs`, `example`, `demo`, `spec`, `test` — nhiều gói dùng các tên này cho mã thật.
- Loại theo **phần mở rộng** an toàn hơn: `*.map`, `*.md`, `*.d.ts`, `*.flow`.
- Loại **đích danh** phần biết chắc không dùng: `node_modules/exceljs/dist/**` (bản dựng cho trình duyệt;
  phía Node dùng `./excel.js` → `lib/`), `node_modules/@types/**`.

**Phòng lần sau:** thêm `scripts/kiem-goi.mjs` — chạy bản đã đóng gói ở chế độ Node, nạp thử mọi mô-đun xử lý
trong `app.asar`, **dùng thật** exceljs/jszip/zca-js, và kiểm các tệp giao diện + phông có trong gói.
Gắn vào `npm run dist` nên mỗi lần đóng gói là tự kiểm. Bộ kiểm này bắt đúng lỗi trên ngay lập tức.

**Kết quả cắt dung lượng (an toàn):** `electronLanguages: ["vi","en-US"]` bỏ 53 gói ngôn ngữ không dùng —
locales 49 MB → 1,4 MB; `app.asar` 35 MB → 12 MB; bộ cài 112 MB → 100 MB.

---

## [20/9/2026] electron-builder báo `EPERM ... rename win-unpacked.tmp`

**Vấn đề:** đóng gói lần hai trở đi báo
`EPERM: operation not permitted, rename 'dist\win-unpacked.tmp' -> 'dist\win-unpacked'`,
xoá `dist` rồi thử lại vẫn hỏng.

**Nguyên nhân:** Windows còn giữ khoá trên thư mục `dist\win-unpacked.tmp` của lần chạy trước
(thường do bộ quét vi-rút hoặc tiến trình vừa bị tắt). `rm -rf dist` báo thành công nhưng thư mục `.tmp`
vẫn còn.

**Cách xử lý nhanh:** đóng gói vào thư mục khác rồi đổi tên:
`npx electron-builder --win nsis -c.directories.output=_dist` → kiểm gói → `mv _dist dist`.
Thư mục `.tmp` kẹt thì chuyển sang thư mục tạm để Windows tự dọn.


---

## [21/9/2026] Phần tử DÙNG LẠI + addEventListener = lỗi "undefined" khó hiểu

**Hiện tượng người dùng thấy:** bấm một nút, hiện **năm thông báo lỗi giống hệt nhau**
`Cannot read properties of undefined (reading 'nguoi_ten')`; lỗi còn hiện cả khi đã sang màn khác.

**Nguyên nhân:** app dùng lại hai phần tử cố định và chỉ thay `innerHTML`:
`#noi-dung` (khung của mọi trang) và `#hop` (mọi hộp thoại). Listener gắn vào PHẦN TỬ CON thì
chết theo `innerHTML`, nhưng listener gắn vào **chính hai phần tử đó thì còn nguyên**. Mỗi lần vẽ
lại là chồng thêm một cái, mỗi cái vẫn giữ mảng dữ liệu của lần vẽ cũ → cú bấm chạy N lần, N−1 lần
cũ tra `ds.find(...)` không ra → `undefined`. Số thông báo lặp chính là số lần đã vẽ lại.

**Ba cách sửa đã dùng:**
1. `moHop()` thay `#hop` bằng `hopCu.cloneNode(false)` + `replaceWith` — hộp mới sạch listener.
2. Khung trang: hàm `ganKhung(khung, loai, fn)` luôn `removeEventListener` cái cũ trước khi gắn
   (lưu cái đang gắn trong `khung.__nghe[loai]`).
3. Mọi `ds.find(...)` đều kiểm `if (!x) return baoXau(...)` — có phòng hờ thì lỗi không còn im lặng.

**Dấu hiệu nhận ra sớm:** thông báo lỗi **lặp lại đúng số lần**, tăng dần theo số lần vào ra trang.
Đó gần như luôn là listener chồng, không phải lỗi dữ liệu.

**Bẫy cùng họ, cùng phiên:** `Cannot read properties of undefined (reading 'trim')` trong hàm lọc
dùng chung — nó bắt `e.target.closest("[data-tim]")`, mà một màn khác lại đặt `data-tim` lên
`<label>` dòng danh sách (không có `.value`). Hai nơi trùng tên thuộc tính. Sửa: thu hẹp bộ chọn
thành `input[data-tim]`, kiểm `typeof o.value === "string"`, và đổi tên thuộc tính bên kia thành
`data-loc`. **Thuộc tính `data-*` dùng chung toàn app thì phải coi như tên biến toàn cục.**

**Bẫy thứ ba:** đợt gửi chạy hàng phút, xong mới `hop.querySelector("#g-thu").disabled = false` —
người dùng đã đóng hộp thì `querySelector` trả `null`. Việc chạy lâu thì **mọi thao tác DOM sau khi
chờ đều phải chịu được chuyện phần tử đã biến mất.**

---

## [21/9/2026] Chỉ có MỘT hộp thoại mỗi lúc — đừng mở hộp lồng hộp

`moHop()` giữ một biến `dongHopHienTai` để biết hộp nào đang mở. Mở hộp B khi hộp A còn mở thì B
chiếm biến đó, và lời gọi đóng của A bị bỏ qua (`if (dongHopHienTai !== xong) return`) → promise của
A **treo vĩnh viễn**, luồng đang chờ A không bao giờ chạy tiếp.

**Cách làm đúng** (đã dùng cho "Xem trên điện thoại" và "Chọn riêng…"): hộp A tự đóng với một mã
trả về (`"sua:12"`), hàm gọi đọc mã đó, mở hộp B, xong thì **mở lại A** với dữ liệu mới. Người dùng
thấy y như hộp lồng, mà không kẹt.

---

## [21/9/2026] CSDL ngành giáo dục: không có cửa cho phần mềm cá nhân

Tra ngày 21/9/2026 cho việc "đưa thời khoá biểu lên CSDL ngành":

- CSDL ngành (`truong.csdl.moet.gov.vn`) trao đổi dữ liệu qua API dùng **token SSO**.
- Kết nối chỉ cấp cho **phần mềm quản lý nhà trường đã được Bộ thẩm định** và ký kết nối trục dữ liệu
  (K12Online/K12Connect, EnetViet, ONEDU…). **Không có API công khai.**
- Phần mềm đã kết nối bị **cấm chia sẻ dữ liệu cho bên thứ ba**; vi phạm thì bị cắt kết nối vĩnh viễn.
- Trang hướng dẫn cũ `huongdan.csdl.moet.gov.vn` nay chuyển hướng về `moet.gov.vn` — không còn tra được.

→ **Đường khả thi duy nhất:** xuất tệp đúng mẫu nhập của CSDL ngành để người dùng tự tải lên bằng
tài khoản trường (giống cách nhập danh sách học sinh từ Excel). Muốn làm đúng mẫu thì phải có tệp mẫu
tải từ chính tài khoản đó — không đăng nhập được thì không đoán mò.
Trong app đã đặt sẵn nút **"Lên CSDL ngành"** kèm nhãn *sắp có*, bấm vào nói đúng hiện trạng này.
