# Tài liệu Đặc tả Sản phẩm: FIFA World Cup 2026 Schedule Dashboard

Bản đặc tả sản phẩm này tổng hợp chi tiết các tính năng, giải pháp kiến trúc nâng cao và cấu trúc dữ liệu đã được xây dựng và tối ưu hóa 100% cho ứng dụng **FIFA World Cup 2026 Schedule Dashboard**.

---

## 🏗️ Tổng quan Công nghệ & Kiến trúc (Tech Stack)

*   **Framework cốt lõi:** Next.js (App Router) chạy trên cơ chế Turbopack biên dịch siêu tốc.
*   **Ngôn ngữ lập trình:** TypeScript khai báo kiểu dữ liệu tĩnh mạnh mẽ, đảm bảo an toàn mã nguồn.
*   **Thiết kế Giao diện (CSS & Styling):**
    *   Sử dụng Vanilla TailwindCSS với hệ màu HSL cao cấp tùy biến (Dark & Light Mode).
    *   Áp dụng kỹ nghệ Glassmorphism cao cấp (nền mờ như kính, viền phát sáng gradient).
*   **Cấu trúc Modular & Tái cấu trúc gọn nhẹ:** Tách biệt hoàn toàn bảng điều khiển chính thành các component con (`HeroBanner`, `FavoriteTeamsTab`, `GroupStandings`, `KnockoutBracket`, `MatchCard`), giúp tối giản hóa mã nguồn và dễ dàng phát triển mở rộng.
*   **Quản lý trạng thái độc lập (Decoupled & Self-contained Architecture):** Đóng gói hoàn toàn Modal chi tiết và trạng thái yêu thích bên trong `MatchCard`, giảm thiểu tối đa coupling (sự phụ thuộc) lên Dashboard cha.

---

## 🌟 Tổng hợp các Tính năng chính đã Thực hiện

### 1. Giải pháp Máy chủ API Proxy & Đồng bộ Dữ liệu (CORS Bypass Server Proxy)
*   **API Route Proxy (`/api/matches`):** Xây dựng một Next.js API Route ở phía server để trung chuyển (proxy) các cuộc gọi API lấy dữ liệu trận đấu của VNExpress. Giải pháp này giúp loại bỏ 100% lỗi chặn CORS từ trình duyệt khi client-side truy cập chéo tên miền.
*   **Cơ chế Cache tối ưu:** Thiết lập revalidate cache 60 giây (`s-maxage=60`) phía server để tăng tốc độ tải trang và tránh làm quá tải máy chủ VNExpress.
*   **Bộ Parser hiệu năng cao:** Phân tích dữ liệu CSV thô thành cấu trúc bản ghi `Match` chuẩn hóa, tự động làm sạch các dấu ngoặc kép dư thừa.
*   **Bản dịch Tiếng Việt chuẩn:** Tự động chuyển đổi các nhãn vòng đấu viết tắt (ví dụ: `round32` thành `Vòng 32 Đội`, `semifinal` thành `Bán Kết`).
*   **Chế độ Ngoại tuyến (Offline Fallback):** Chứa sẵn chuỗi CSV tĩnh 104 trận đấu dự phòng an toàn để ứng dụng luôn tải được ngay cả khi API máy chủ gặp sự cố.

### 2. Banner Hero Động Đẳng cấp (Dynamic Hero Banner Carousel)
*   **Bộ chọn Slide 3 Tab thông minh:** Carousel tự động chuyển đổi slide mỗi 6 giây độc lập:
    *   **Hot nhất:** Tự động hiển thị các trận cầu sắp diễn ra có sự góp mặt của các quốc gia hạt giống hàng đầu trong Top 10 Bảng xếp hạng FIFA (Brazil, Argentina, Pháp, Anh, Đức, Tây Ban Nha...).
    *   **Cận kề:** Lọc trận đấu sắp diễn ra sớm nhất toàn giải theo thời gian thực để người hâm mộ không bỏ lỡ.
    *   **Yêu thích:** Hiển thị trận đấu sắp diễn ra tiếp theo của các quốc gia nằm trong danh sách yêu thích của người dùng (fallback về trận Chung kết nếu chưa có đội yêu thích).
*   **Lọc Thời gian Thực tế (`matchTime > now`):** Sử dụng hàm tiện ích dùng chung `getMatchTimestamp` để kiểm tra thời gian trận đấu, bảo đảm banner chỉ ghim các trận bóng chuẩn bị diễn ra trong tương lai.

### 3. Cá nhân hóa Đa Đội tuyển & Tab "Đội yêu thích" (Multi-Favorites & Custom Tab)
*   **Mảng đội tuyển yêu thích (`wc2026_my_teams`):** Nâng cấp bộ lưu trữ trong `localStorage` từ một đội tuyển duy nhất thành mảng nhiều đội tuyển. Hỗ trợ tự động di trú (migration) dữ liệu cũ từ `wc2026_my_team` (chuỗi) sang định dạng mảng JSON mới khi người dùng tải trang lần đầu.
*   **Tab "Đội yêu thích" cao cấp:**
    *   **Đội tuyển Yêu thích của tôi:** Hiển thị các quốc gia đã thả tim dưới dạng lưới Glassmorphic. Trên thẻ hiển thị quốc kỳ, bảng đấu, liên kết xem Wiki Profile và nút tháo tim nhanh.
    *   **Lịch thi đấu Đội yêu thích:** Tự động tổng hợp và sắp xếp theo trình tự thời gian tất cả các trận đấu có sự tham gia của các đội tuyển yêu thích.
    *   **Khám phá 48 Quốc gia tham dự:** Lưới danh sách đầy đủ 48 quốc gia tham gia giải đấu chia theo 12 bảng đấu (A đến L). Hỗ trợ tìm kiếm tức thời (Instant Search) và thả tim trực tiếp trên Dashboard mà không cần truy cập trang Wiki riêng lẻ.
*   **Làm nổi bật Đội tuyển yêu thích (MatchCard Highlights):**
    *   Trong tất cả danh sách lịch đấu, đội tuyển yêu thích sẽ được làm nổi bật với biểu tượng trái tim hồng nhịp đập (`❤️`) bên cạnh quốc kỳ.
    *   Tên đội tuyển yêu thích được nhấn mạnh bằng màu hồng đỏ nổi bật (`text-rose-600 dark:text-rose-400 font-extrabold`).
*   **Chỉ báo Số lượng Tab thời gian thực:** Hiển thị số lượng đếm ngay trên tiêu đề Tab: "Trận yêu thích (X)" và "Đội yêu thích (Y)" đồng bộ tức thì nhờ sự kiện CustomEvent.

### 4. Bảng xếp hạng 12 Bảng đấu Động (Real-time Group Standings)
*   **Tính toán Tự động (Derived State):** Tự động tính toán điểm số, số trận đã chơi, số trận thắng-hòa-thua, tổng số bàn thắng/bàn thua, và hiệu số bàn thắng bại (Goal Difference) của 12 bảng đấu (A đến L) trực tiếp từ tỷ số trong dữ liệu.
*   **Xếp hạng chuẩn FIFA:** Tự động sắp xếp các đội trong bảng dựa trên thứ tự ưu tiên nghiêm ngặt: Điểm &rarr; Hiệu số (HS) &rarr; Số bàn thắng (BT) &rarr; Tên đội.
*   **Nhãn Đi Tiếp có Điều kiện:** Tự động tô màu nền xanh nhẹ và hiển thị nhãn hạt giống "Đi tiếp" cho 2 đội dẫn đầu bảng khi bảng đấu đã bắt đầu diễn ra thực tế (số trận đã chơi > 0).

### 5. Nhánh đấu Loại trực tiếp Hoàn mỹ (Knockout Bracket Tree View)
*   **Chế độ Danh sách (List View):** Hiển thị toàn bộ các trận đấu knockout chia theo từng vòng từ Vòng 32 Đội, Vòng 16 Đội, Tứ Kết, Bán Kết đến Chung Kết.
*   **Sơ đồ Cây Nhánh (Tree View) Pixel-Perfect:**
    *   **Giải pháp hình học tĩnh:** Thiết lập chiều cao cột cố định **`2088px`** và tính toán các khoảng đệm margin `py-[65px]`, `py-[197px]`, `py-[461px]` hoàn toàn chính xác theo toán học.
    *   **Đường nối nhánh thẳng tắp:** Các đường nối vuông góc (Bracket Lines) nối giữa các vòng đấu chạy **hoàn toàn song song, nằm ngang phẳng tắp**, không bị lệch dù chỉ `0.5px`, tạo nên cấu trúc đối xứng hoàn mỹ như sơ đồ vẽ CAD.
    *   **Đồng bộ tên đội hạt giống:** Giải mã khóa trận đấu VNExpress (sử dụng khóa số chuỗi nguyên gốc) để tự động hiển thị tên đội hạt giống chiến thắng thực tế hoặc placeholder động (ví dụ: `Thắng Trận 74`, `2A`, `1B`).

### 6. Thẻ trận đấu MatchCard & Popup chi tiết Portal Modal
*   **Thẻ MatchCard Premium:** Hiển thị mã số trận monospaced nhỏ `#id` (ví dụ: `#73`), cờ quốc gia, giờ thi đấu Việt Nam, địa điểm sân vận động và tỷ số placeholder `- - -` cho trận chưa bắt đầu.
*   **Popup Chi Tiết Trận Đấu (React Portals Modal):** Nhấp vào thẻ trận đấu sẽ mở Modal chi tiết. Sử dụng `createPortal` để đưa Modal trực tiếp vào `document.body`, khắc phục triệt để lỗi hiển thị lệch/mờ mịt khi thẻ cha có hiệu ứng transform/filter. Hiển thị danh sách ghi bàn, trạng thái thời gian thực và thông tin sân vận động.

---

## 🚀 Lộ trình Phát triển Tính năng Đột phá Tương lai (Future Roadmap)

Dưới đây là kế hoạch kiến trúc và thiết kế cho các ý tưởng phát triển tiếp theo được đồng sáng tạo nhằm nâng cấp ứng dụng thành một **FIFA World Cup 2026 Companion Portal** đích thực:

### 1. Trang Wiki 16 Sân vận động & Tích hợp Bản đồ Google Maps
*   **Bản đồ Địa điểm Đăng cai:**
    *   Xây dựng Tab "Sân vận động" hiển thị danh sách 16 sân vận động tại Mỹ, Canada và Mexico dưới dạng thẻ Grid ảnh độ phân giải cao cực kỳ lộng lẫy.
    *   Khi click vào sân vận động: Mở ra một trang wiki thông tin chi tiết: Sức chứa (Capacity), Thành phố chủ nhà (Host City), Năm khánh thành, và danh sách các trận đấu thực tế sẽ diễn ra tại sân đó.
    *   **Tích hợp Bản đồ Google Maps:** Nhúng một iframe bản đồ Google Maps tương tác trực quan trỏ thẳng đến tọa độ GPS chính xác của sân vận động, cho phép người dùng zoom, xem chế độ vệ tinh và chỉ đường thực tế.

### 2. Thông báo Đẩy thông minh (Smart Push Notifications)
*   Tích hợp dịch vụ Service Worker và Push API của trình duyệt.
*   Người dùng có thể đăng ký nhận thông báo "Nhắc lịch" trước 15 phút khi trận đấu của đội tuyển yêu thích hoặc trận đấu hot trên Banner Hero bắt đầu lăn bóng.
