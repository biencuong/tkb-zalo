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

---

## [21/9/2026] Giao diện khoá một việc mà phần mềm đã tự làm được

**Hiện tượng:** người dùng tưởng phải có danh sách giáo viên mới nạp được thời khoá biểu.

**Nguyên nhân:** tính năng *tạo giáo viên từ bảng phân công* đã có trong hộp nhập thời khoá biểu từ trước,
nhưng giao diện vẫn giữ luật cũ: thẻ tệp **khoá nút nhập** và báo "Nạp danh sách giáo viên trước" khi chưa
có ai, hướng dẫn cũng ghi "nút nhập thời khoá biểu sẽ bị khoá". Người dùng không bao giờ tới được hộp có
tính năng mới. Thêm khả năng mới mà **không rà lại các chỗ chặn cũ** thì khả năng đó như không có.

**Sửa:** bỏ hai chỗ chặn `!soGv`, bỏ khoá nút, đổi thanh thứ tự thành *Thời khoá biểu → Số điện thoại*,
viết lại hướng dẫn. **Luật:** thêm một cách làm tự động thì `grep` mọi câu chặn, câu cảnh báo và câu hướng
dẫn nói điều ngược lại.

**Bẫy kèm theo:** chủ nhiệm **không dạy tiết nào** thì không suy được mã từ phân công, nên bị bỏ qua —
đúng những người cần nhận thời khoá biểu lớp. Mã của họ có sẵn trong tiêu đề cột lớp `6A1 (D.Nhàn)`.
Kiểm thử bằng tệp thật mới lộ ra: trước 38/40, sau 40/40.

---

## [21/9/2026] Đường dẫn menu Smart Scheduler — đã đối chiếu trang chính thức

Nguồn: `https://help.tinhochoanggia.com/smartscheduler/` (đọc 21/9/2026). **Đừng viết đường dẫn menu theo trí nhớ** —
bản cũ của hướng dẫn ghi "Hệ thống → In ấn" cho tệp Word, trang chính thức không nói vậy.

| Việc | Trang chính thức ghi | Trang |
|---|---|---|
| Excel tổng | **Hệ thống \| Chuyển đổi dữ liệu sang Excel** → chọn các lựa chọn → **Chấp nhận**. Chuyển PCGD, TKB lớp, giáo viên, phòng học. | `chuc-nang/chuyen-doi-du-lieu/excel/` |
| Mẫu danh sách giáo viên | Mục Dữ liệu giáo viên: **Excel \| Copy file dữ liệu mẫu**; nhập lại bằng **Excel \| Nhập dữ liệu từ Excel** (khớp theo Mã giáo viên) | `chuc-nang/du-lieu/du-lieu-giao-vien/` |
| Word từng người / từng lớp | **In ấn → In TKB cá nhân** → *In TKB giáo viên* / *In TKB lớp học*, khổ **A4 hoặc A5**, có *Chọn tất cả*, *Chấp nhận* | `chuc-nang/in-an/tkb-ca-nhan/` |
| (không dùng) TKB toàn trường | In ấn → In TKB toàn trường: Excel 8 mẫu hoặc Word A3/A4 — bảng cả trường, KHÔNG cắt theo người được | `chuc-nang/in-an/tkb-toan-truong/` |

Hộp *Chuyển đổi dữ liệu sang Excel* có các ô: Bảng phân công giảng dạy, TKB lớp học, TKB giáo viên, TKB phòng học,
Hiển thị TKB sáng / chiều / sáng & chiều, TKB nhóm… Phần mềm cần **PCGD + TKB lớp học + TKB giáo viên**;
thiếu TKB giáo viên thì không suy được mã viết tắt khi tạo giáo viên từ bảng phân công.

---

## [21/9/2026] Chặn người dùng bằng trạng thái đã cũ

**Hiện tượng:** đã có 2 giáo viên có số điện thoại và đã dò ra Zalo, bấm **Gửi** vẫn báo
"Còn thiếu: chưa ai có số điện thoại, chưa dò được Zalo của ai".

**Nguyên nhân:** tiến độ ba bước được tính một lần, lưu trong bộ nhớ giao diện. Sửa số điện thoại trên
bảng và bấm Dò Zalo không tính lại, nên nút Gửi vẫn dựa vào số liệu lúc chưa ai có số. (Máy người dùng lúc
đó còn chạy 0.1.12 với điều kiện cũ — bản 0.1.13 đã phát hành nhưng **chưa cài**.)

**Sửa:** hàm điều hướng tính lại trước khi từ chối; các thao tác đổi dữ liệu gọi cập nhật.
**Luật:** mọi chỗ **chặn** người dùng phải kiểm lại bằng số liệu tươi — chặn nhầm tệ hơn cho qua rồi báo.
**Kèm:** phát hành xong phải **cài lên máy người dùng ngay**, nếu không họ vẫn gặp lỗi đã sửa.

## [21/9/2026] Câu chữ hứa nhiều hơn phần mềm làm được

Tin giới thiệu, README và Trợ giúp viết "ảnh xem ngay **và file Word để in**" ngay cạnh "chỉ cần **một tệp
Excel**". Người dùng hiểu (đúng theo câu chữ) là một tệp Excel cho ra cả Word, thả vào thì không thấy Word.
Lúc đó phần mềm chỉ **cắt** Word của Smart Scheduler, không tự tạo. Đã làm cho câu chữ thành sự thật: tự tạo
Word đúng mẫu từ dữ liệu Excel. **Luật:** hai ý đặt cạnh nhau trong một câu quảng bá sẽ được đọc là một —
kiểm từng lời hứa bằng cách chạy thử đúng như người dùng sẽ làm.

---

## [21/9/2026] Bước kiểm gói "đạt" mà không kiểm gì bản mới

`scripts/kiem-goi.mjs` mặc định soi `dist/win-unpacked` trong dự án. Từ khi chuyển sang đóng gói ra
`%TEMP%\tkbzalo-dist` (tránh EPERM), thư mục `dist/` là **bản 0.1.9 cũ** — mọi lần "ĐẠT" từ 0.1.10 tới 0.1.13
đều kiểm nhầm bản cũ. Lộ ra khi thêm khuôn Word: bộ kiểm báo thiếu khuôn lớp, trong khi gói mới có đủ.

Cùng lúc lộ thêm: dòng kiểm `import("zca-js")` trần — Node tìm lên thư mục cha, chạy cạnh mã nguồn thì vớ
`node_modules` của dự án, nên "đạt" dù gói có thiếu cũng không biết.

**Sửa:** mặc định soi `%TEMP%\tkbzalo-dist`, **so phiên bản trong gói với `package.json`** (khác là báo lỗi),
nạp zca-js bằng đường dẫn trong `app.asar`. **Luật:** bộ kiểm nào cũng phải tự chứng minh nó đang kiểm đúng
đối tượng (in ra đối tượng + phiên bản), nếu không một chữ "ĐẠT" chẳng nói lên gì.

---

## [21/9/2026] Đường dẫn Windows trong biểu thức chính quy: `[\\/]`, không phải `[\/]`

`laTepTuTao()` nhận tệp Word tự tạo bằng `/[\\/]word[\\/](gv|lop)[\\/]/`. Một lần sinh mã bằng
Python (chuỗi lồng heredoc) làm rơi mất một dấu `\`, còn `[\/]` — chỉ khớp `/`. Trên Windows đường dẫn
dùng `\` nên mọi tệp tự tạo bị coi là tệp Smart Scheduler → **không bao giờ được làm mới**. Kiểm thử
"đổi tên trường thì Word thành cũ" bắt được ngay. **Luật:** có kiểm thử chạy bằng đường dẫn thật của Windows
cho mọi hàm nhận dạng đường dẫn; sinh mã có dấu `\` thì ghi bằng `chr(92)` rồi rà lại bằng máy.

## [21/9/2026] Tuỳ chọn có trên giao diện mà không có tác dụng

"Ảnh gồm buổi nào" (cả ngày / sáng / chiều) được lưu nhưng không ai đọc — ảnh luôn vẽ cả ngày. Lộ ra khi
làm vân tay (buổi phải nằm trong số liệu ảnh). Nay mỗi lần gửi ảnh được đảm bảo đúng buổi đã chọn.
**Luật:** mỗi tuỳ chọn trên giao diện phải có ít nhất một chỗ đọc nó — `grep` tên khoá trong `src/main`.
