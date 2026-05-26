# Tài liệu Đặc tả Sản phẩm: FIFA World Cup 2026 Schedule Dashboard

Bản đặc tả sản phẩm này tổng hợp chi tiết các tính năng, giải pháp kiến trúc nâng cao và cấu trúc dữ liệu đã được xây dựng và tối ưu hóa 100% cho ứng dụng **FIFA World Cup 2026 Schedule Dashboard**.

---

## 🏗️ Tổng quan Công nghệ & Kiến trúc (Tech Stack)

*   **Framework cốt lõi:** Next.js (Phiên bản 16+) chạy trên cơ chế Turbopack biên dịch siêu tốc.
*   **Ngôn ngữ lập trình:** TypeScript khai báo kiểu dữ liệu tĩnh mạnh mẽ, đảm bảo an toàn mã nguồn.
*   **Thiết kế Giao diện (CSS & Styling):**
    *   Sử dụng Vanilla TailwindCSS với hệ màu HSL cao cấp tùy biến (Dark & Light Mode).
    *   Áp dụng kỹ nghệ Glassmorphism cao cấp (nền mờ như kính, viền phát sáng gradient).
*   **Quản lý trạng thái độc lập (Decoupled & Self-contained Architecture):** Đóng gói hoàn toàn Modal chi tiết và trạng thái yêu thích bên trong `MatchCard`, giảm thiểu tối đa coupling (sự phụ thuộc) lên Dashboard cha.

---

## 🌟 Tổng hợp các Tính năng chính đã Thực hiện

### 1. Đồng bộ & Phân tích Dữ liệu API Máy chủ (VNExpress Server-Side Sync)
*   **Nguồn dữ liệu:** Tự động fetch trực tiếp danh sách lịch thi đấu cập nhật mới nhất từ API CSV của VNExpress.
*   **Bộ Parser hiệu năng cao:** Phân tích dữ liệu CSV thô thành cấu trúc bản ghi `Match` chuẩn hóa, tự động làm sạch các dấu ngoặc kép dư thừa.
*   **Bản dịch Tiếng Việt chuẩn:** Tự động chuyển đổi các nhãn vòng đấu viết tắt (ví dụ: `round32` thành `Vòng 32 Đội`, `semifinal` thành `Bán Kết`).
*   **Chế độ Ngoại tuyến (Offline Fallback):** Chứa sẵn chuỗi CSV tĩnh 104 trận đấu dự phòng an toàn để ứng dụng luôn tải được ngay cả khi API máy chủ gặp sự cố.

### 2. Bảng Thống kê & Phân tích Trực quan (Top stats dashboard)
*   Hiển thị 3 thẻ chỉ số thiết kế Glassmorphism sang trọng ở đầu trang:
    *   **Tổng số trận đấu:** Cố định `104` trận đấu toàn giải.
    *   **Vòng bảng:** `72` trận đấu vòng bảng.
    *   **Trận yêu thích:** Đếm số lượng trận đấu được người dùng lưu trữ thời gian thực.

### 3. Lịch thi đấu theo ngày với Bộ chọn Lịch Premium (Calendar Picker)
*   **Lưới Ngày Tháng Thông Minh:** Bộ chọn lịch popover hiển thị toàn bộ các ngày có trận đấu trong tháng 6 & 7 năm 2026.
*   **Chấm Chỉ báo (Dot indicators):** Ngày nào có trận đấu thực tế sẽ hiển thị một chấm tròn nhỏ bên dưới số ngày để người dùng dễ nhận diện.
*   **Tìm kiếm Toàn diện:** Tìm kiếm tức thời theo tên quốc gia (không dấu/có dấu), thành phố, và sân vận động.

### 4. Tab "Tất cả trận đấu" Phân nhóm theo ngày
*   Hiển thị toàn bộ 104 trận đấu của giải đấu.
*   **Phân nhóm Ngày (Daily Sections):** Tự động chia lịch thi đấu thành từng phân đoạn ngày riêng biệt, có tiêu đề hiển thị rõ thứ ngày và số lượng trận đấu diễn ra trong ngày đó.

### 5. Bảng xếp hạng 12 Bảng đấu Động (Real-time Group Standings)
*   **Tính toán Tự động (Derived State):** Tự động tính toán điểm số, số trận đã chơi, số trận thắng-hòa-thua, tổng số bàn thắng/bàn thua, và hiệu số bàn thắng bại (Goal Difference) của 12 bảng đấu (A đến L) trực tiếp từ tỷ số trong dữ liệu.
*   **Xếp hạng chuẩn FIFA:** Tự động sắp xếp các đội trong bảng dựa trên thứ tự ưu tiên nghiêm ngặt: Điểm &rarr; Hiệu số (HS) &rarr; Số bàn thắng (BT) &rarr; Tên đội.
*   **Nhãn Đi Tiếp có Điều kiện:** Tự động tô màu nền xanh nhẹ và hiển thị nhãn hạt giống "Đi tiếp" cho 2 đội dẫn đầu bảng khi bảng đấu đã bắt đầu diễn ra thực tế (số trận đã chơi > 0).

### 6. Nhánh đấu Loại trực tiếp Hoàn mỹ (Knockout Bracket Tree View)
*   **Chế độ Danh sách (List View):** Hiển thị toàn bộ các trận đấu knockout chia theo từng vòng từ Vòng 32 Đội, Vòng 16 Đội, Tứ Kết, Bán Kết đến Chung Kết.
*   **Sơ đồ Cây Nhánh (Tree View) Pixel-Perfect:**
    *   **Giải pháp hình học tĩnh:** Thiết lập chiều cao cột cố định **`2088px`** và tính toán các khoảng đệm margin `py-[65px]`, `py-[197px]`, `py-[461px]` hoàn toàn chính xác theo toán học.
    *   **Đường nối nhánh thẳng tắp:** Các đường nối vuông góc (Bracket Lines) nối giữa các vòng đấu chạy **hoàn toàn song song, nằm ngang phẳng tắp**, không bị lệch dù chỉ `0.5px`, tạo nên cấu trúc đối xứng hoàn mỹ như sơ đồ vẽ CAD.
    *   **Đồng bộ tên đội hạt giống:** Giải mã khóa trận đấu VNExpress (sử dụng khóa số chuỗi nguyên gốc) để tự động hiển thị tên đội hạt giống chiến thắng thực tế hoặc placeholder động (ví dụ: `Thắng Trận 74`, `2A`, `1B`).

### 7. Thẻ trận đấu MatchCard tích hợp mã số Trận đấu (#id)
*   Thiết kế Glassmorphism nổi bật hiệu ứng hover vi mô.
*   Hiển thị cờ quốc gia tích hợp hình ảnh CDN chất lượng cao.
*   Hiển thị giờ thi đấu theo múi giờ Việt Nam tiện lợi và địa điểm sân vận động.
*   **Mã Số Trận Đấu (#id):** Đặt một badge monospaced nhỏ `#id` (ví dụ: `#73`) ở góc trên bên phải để người dùng dễ tra cứu vị trí trận đấu.
*   **Hiển thị Tỷ số thanh lịch:** Hiển thị chuỗi placeholder `- - -` cho các trận đấu chưa bắt đầu thay vì tỷ số giả định `0-0` gây nhầm lẫn.

### 8. Popup Chi Tiết Trận Đấu Kháng Lệch Vị Trí (React Portals Modal)
*   Nhấp vào thẻ trận đấu sẽ hiển thị một Modal chi tiết cực kỳ sang trọng.
*   **Cơ chế React Portal:** Modal được tiêm trực tiếp vào `document.body` bằng `createPortal`, miễn dịch hoàn toàn với lỗi "Containing Block" (lệch modal hoặc mờ mịt do thẻ cha có thuộc tính hiệu ứng `transform` hoặc `filter`).
*   **Nội dung phong phú:** Bảng điểm lớn, cờ quốc gia phóng to, trạng thái trận đấu (Chưa diễn ra, Đang đá, Đã kết thúc), danh sách cầu thủ ghi bàn của cả hai đội và thông tin đầy đủ về sân vận động.

### 9. Hệ thống Yêu thích Trận đấu Không Prop-Drilling (CustomEvent Favorites)
*   Tất cả các thẻ đấu khác và màn hình dashboard cha đều lắng nghe sự kiện này để cập nhật trạng thái đồng bộ tức thì trên giao diện mà không cần truyền bất kỳ một callback props nào từ trên xuống, tối ưu hóa tối đa hiệu năng render của React.

---

## 🚀 Lộ trình Phát triển Tính năng Đột phá Tương lai (Future Roadmap)

Dưới đây là kế hoạch kiến trúc và thiết kế cho các ý tưởng phát triển tiếp theo được đồng sáng tạo nhằm nâng cấp ứng dụng thành một **FIFA World Cup 2026 Companion Portal (Cổng Thông Tin Bạn Đồng Hành World Cup 2026)** đích thực:

### 1. Banner Hero Động (Dynamic Hero Feature Match)
*   **Thiết kế hiển thị:** Thay thế thẻ đấu mở màn tĩnh trên banner Hero bằng một vùng hiển thị thông minh, tự động luân chuyển giữa 3 thẻ:
    *   **Trận đấu Hot nhất:** Tự động lọc các trận đấu có sự tham gia của các đội tuyển hạt giống lớn theo top 10 Bảng xếp hạng của Fifa (ví dụ: Brazil, Argentina, Pháp, Anh, Đức, Tây Ban Nha, Bồ Đào Nha...).
    *   **Trận sắp diễn ra gần nhất:** Quét lịch đấu thời gian thực và hiển thị trận đấu yêu thích sắp diễn ra, nếu không có thì fallback sang trận đấu có trạng thái `notstarted` với thời gian bắt đầu cận kề nhất.
    *   **Trận của Đội tuyển yêu thích:** Nếu người dùng đã chọn một hoặc nhiều "Đội bóng tôi yêu", trận đấu tiếp theo của đội tuyển đó sẽ tự động được ghim lên Banner Hero với hiệu ứng hào quang (glow accent) tuyệt đẹp để nhắc lịch.

### 2. Trang Wiki 48 Quốc Gia & Cá nhân hóa "Đội bóng Tôi Yêu"
*   **Trang Wiki Đội tuyển:**
    *   Xây dựng một Tab giao diện mới hiển thị danh sách 48 quốc gia tham dự, chia theo 12 bảng đấu từ A đến L với cờ quốc gia lớn và đồng bộ màu sắc thương hiệu của mỗi nước.
    *   Khi click vào quốc gia: Mở ra một hồ sơ (wiki profile) gồm: Huấn luyện viên trưởng, Thứ hạng FIFA, Danh sách đội hình giả lập (Squad list 23-26 cầu thủ chia theo vị trí GK, DF, MF, FW) và Lịch sử thành tích World Cup.
    *   **Tính năng "Đội bóng tôi yêu" (Primary Favorite Team):**
        *   Tích hợp nút thả tim lớn ở trang hồ sơ quốc gia, lưu trữ đội bóng yêu thích nhất vào `localStorage` (ví dụ: `wc2026_my_team: "ENG"`).
        *   Khi đã chọn, tất cả các trận đấu có đội tuyển này thi đấu trên toàn bộ ứng dụng (lịch theo ngày, tất cả trận, bảng đấu) sẽ tự động hiển thị hiệu ứng viền phát sáng (Glow border), có ngôi sao đặc biệt và được ưu tiên đưa lên đầu các bộ lọc tìm kiếm.

### 3. Trang Wiki 16 Sân vận động & Tích hợp Bản đồ Google Maps
*   **Bản đồ Địa điểm Đăng cai:**
    *   Xây dựng Tab "Sân vận động" hiển thị danh sách 16 sân vận động tại Mỹ, Canada và Mexico dưới dạng thẻ Grid ảnh độ phân giải cao cực kỳ lộng lẫy.
    *   Khi click vào sân vận động: Mở ra một trang wiki thông tin chi tiết: Sức chứa (Capacity), Thành phố chủ nhà (Host City), Năm khánh thành, và danh sách các trận đấu thực tế sẽ diễn ra tại sân đó.
    *   **Tích hợp Bản đồ Google Maps:** Nhúng một iframe bản đồ Google Maps tương tác trực quan trỏ thẳng đến tọa độ GPS chính xác của sân vận động, cho phép người dùng zoom, xem chế độ vệ tinh và chỉ đường thực tế.

