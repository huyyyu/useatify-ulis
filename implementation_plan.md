# Kế Hoạch Hoàn Thiện USEATIFY – Chuẩn Hóa Vận Hành Thực Tế & Hệ Thống Mã Ra Vào 2 Tiếng

Bản cập nhật này chuẩn hóa **USEATIFY – ULIS** để đưa vào vận hành chính thức: nâng cấp hệ thống phông chữ hiện đại và thoáng mắt hơn, đơn giản hóa quy trình đăng ký Thẻ sinh viên số (chỉ cần **Ảnh thẻ chân dung** + chọn **Cơ sở Homies đang đứng**, kết hợp kiểm tra định dạng Email sinh viên ULIS bắt đầu bằng **`2X04`**), mở rộng quyền duyệt tài khoản cho **cả Staff cơ sở tương ứng và Tài khoản Tổng (`homies_admin`)**, nâng cấp quy tắc **mã số ra vào có hiệu lực 2 tiếng** kèm cảnh báo chéo liên cơ sở, đưa mục **Đánh giá & Góp ý ẩn danh** trở về trang **GUEST**, và loại bỏ hoàn toàn các hộp chọn nhanh tài khoản kiểm thử.

---

## Các Quyết Định Đã Thống Nhất

> [!IMPORTANT]
> Dưới đây là các quyết định nghiệp vụ cốt lõi đã được xác nhận để triển khai chính thức:

- **Điều kiện Email sinh viên ULIS (`2X04...@vnu.edu.vn`)**: Hệ thống chỉ chấp nhận đăng ký với Email sinh viên có đuôi `@vnu.edu.vn` và **4 chữ số đầu bắt buộc là `2X04`** (trong đó `X` là chữ số năm đăng ký/nhập học từ `0–9`, ví dụ: `2204xxxx@vnu.edu.vn`, `2304xxxx@vnu.edu.vn`, `2404xxxx@vnu.edu.vn`, `2504xxxx@vnu.edu.vn`, `2604xxxx@vnu.edu.vn`), đồng thời tự động điền và đối chiếu khớp với Mã số sinh viên (`2X04xxxx`).
- **Xử lý khi xin mã ở cơ sở thứ 2 trong vòng 2 tiếng**: Cho phép sinh viên gửi yêu cầu, đồng thời hệ thống tự động gắn **Cảnh báo nổi bật cho Staff cơ sở mới** biết chi tiết lần cấp mã đầu tiên (cơ sở đã cấp, mã số và thời điểm cấp trong 2 tiếng đó).
- **Phân quyền phê duyệt tài khoản Thẻ sinh viên số**: Khi sinh viên chọn mục *"Bạn đang ở Homies nào?"* lúc đăng ký, **cả Staff phụ trách cơ sở Homies đó và Tài khoản Tổng (`homies_admin`)** đều nhìn thấy hồ sơ và có quyền phê duyệt kích hoạt.
- **Tên đề mục trên thanh chọn góc phải**: Đổi tên mục thứ 2 thành **`STUDENT PASS - Thẻ sinh viên số`** sau khi đưa phần Đánh giá & Hòm thư góp ý trở về trang **GUEST**.
- **Chế độ vận hành thực tế (Production-Ready)**: Xóa toàn bộ danh sách chọn nhanh 5 tài khoản/mật khẩu kiểm thử ở màn hình đăng nhập Staff và các nhãn thử nghiệm.

---

## 1. Tổng Quan & Giá Trị Cốt Lõi

- **Mục tiêu**: Biến USEATIFY thành hệ thống vận hành thực tế tại 4 cơ sở Homies – ULIS, vừa đảm bảo xác thực chặt chẽ đúng sinh viên ULIS (`2X04...@vnu.edu.vn`) tại quầy trong lần đầu đăng ký, vừa thuận tiện tối đa cho sinh viên ở các lần ra vào tiếp theo bằng mã số 2 tiếng.
- **Đối tượng sử dụng**:
  - **Sinh viên ULIS**: Tra cứu chỗ ngồi, gửi đánh giá 5 sao & góp ý ẩn danh ngay tại trang `GUEST`; đăng ký Thẻ sinh viên số tại quầy bằng email `2X04...@vnu.edu.vn` và xin mã số ra vào 2 tiếng tại mục `STUDENT PASS - Thẻ sinh viên số`.
  - **Staff 4 cơ sở & Tài khoản Tổng (`homies_admin`)**: Đếm chỗ (`+1/-1`), duyệt tài khoản sinh viên đăng ký tại cơ sở mình phụ trách, phát mã ra vào 2 tiếng (có cảnh báo nếu sinh viên đã được cấp mã ở cơ sở khác trong 2 tiếng qua), và kiểm duyệt đánh giá/góp ý.

---

## 2. Trải Nghiệm Người Dùng & Thiết Kế Giao Diện (UI/UX)

### A. Hệ Thống Phông Chữ (Typography) & Độ Thoáng Giao Diện
- **Phông chữ chủ đạo**: Sử dụng đồng bộ **Plus Jakarta Sans** kết hợp **Inter** cho toàn bộ văn bản giao diện và **JetBrains Mono (`tabular-nums`)** cho các con số thống kê, mã số ra vào và đồng hồ đếm ngược.
- **Tinh chỉnh kích thước & khoảng cách dòng**:
  - Tăng chiều cao dòng (`line-height: 1.65`) và khoảng cách chữ vừa phải cho phần mô tả, biểu mẫu và thẻ thông tin để mắt đọc thoải mái hơn.
  - Chuẩn hóa kích thước tiêu đề thẻ (`18px–20px`, `font-bold`), nội dung chính (`14px–15px`) và nhãn phụ (`12px–13px`) tạo sự cân đối, thoáng đãng giữa các khối.

### B. Mục "WHY CHOOSE USEATIFY?" (Theo Mẫu Ảnh Đính Kèm)
- Thiết kế dạng lưới 2x2 thoáng rộng theo đúng bố cục mẫu (`/public/assets/aistudio/image_cc7e5def.png`):
  - **Mục 01 – Tra cứu, so sánh và cập nhật chỗ ngồi**: Gộp nội dung mục 01 và mục 03 cũ trong ảnh (theo dõi tổng số chỗ, số chỗ đang sử dụng, số chỗ còn trống tại các cơ sở Homies và đồng bộ trực tiếp từ nhân viên trực theo thời điểm cập nhật gần nhất).
  - **Mục 02 – Chủ động lựa chọn – Tiết kiệm thời gian**: Lựa chọn cơ sở Homies phù hợp trước khi di chuyển, hạn chế tình trạng đến cơ sở đã hết chỗ.
  - **Mục 03 – STUDENT PASS – Thẻ sinh viên số & Mã ra vào**: Mô tả ngắn gọn tính năng đăng ký Thẻ sinh viên số một lần tại quầy và xin cấp mã số ra vào trực tiếp trên website cho các lần tiếp theo.
  - **Mục 04 – Đánh giá và góp ý**: Cho phép sinh viên đánh giá 5 sao kèm ảnh thực tế và gửi góp ý ẩn danh về cơ sở vật chất, tình trạng tại Homies.

### C. Đưa Mục Đánh Giá 5 Sao & Hòm Thư Góp Ý Ẩn Danh Về Lại Trang `GUEST`
- Khôi phục đầy đủ khu vực **Đánh giá 5 sao kèm ảnh thực tế (có kiểm duyệt)**, **Hòm thư Góp ý nội bộ** và **Góp ý Website** ngay bên dưới mục `WHY CHOOSE USEATIFY?` tại trang `GUEST` như ban đầu.
- Thanh chọn đề mục ở góc trên bên phải hiển thị 3 mục:
  1. `GUEST • Tra cứu chỗ ngồi`
  2. `STUDENT PASS - Thẻ sinh viên số`
  3. `STAFF • Quản trị hệ thống`

### D. Quy Trình Mới Tại Mục `STUDENT PASS - Thẻ sinh viên số`
1. **Hộp chú thích quy định nổi bật**:
   - Hiển thị rõ ràng dòng chú thích tại cả màn hình Đăng ký/Đăng nhập và màn hình Xin cấp mã của sinh viên:
     > *"Trong lần đăng kí đầu tiên, thẻ sinh viên số cần được đăng kí bằng thẻ sinh viên gốc tại quầy ra vào homies. Từ các lần sau sinh viên chỉ cần yêu cầu xin cấp mã số ra vào trực tiếp trên website, mỗi mã số chỉ ra vào được 1 cơ sở và chỉ xin cấp lại được sau 2 tiếng"*
2. **Biểu mẫu Đăng ký Thẻ sinh viên số (Kiểm tra Email `2X04...@vnu.edu.vn` & Không cần chụp Thẻ SV)**:
   - Không còn bắt buộc chụp/tải ảnh mặt trước Thẻ sinh viên hay quét mã vạch.
   - Sinh viên điền:
     - **Họ và tên sinh viên**
     - **Email sinh viên (`2X04...@vnu.edu.vn`)**: Bắt buộc có 4 số đầu là `2X04` (trong đó `X` là chữ số năm đăng ký/khóa học tại ULIS, mã trường `04`) và kết thúc bằng `@vnu.edu.vn`. Khi sinh viên nhập email hợp lệ, hệ thống tự động điền và đối chiếu Mã số sinh viên (`2X04...`). Nếu email không bắt đầu bằng `2X04`, hệ thống báo lỗi rõ ràng ngay lập tức.
     - **Mã số sinh viên (MSSV)**: Bắt đầu bằng `2X04` và khớp với phần đầu của Email sinh viên.
     - **Mật khẩu tài khoản**
     - **Bạn đang ở Homies nào?** (`HOMIES Đa năng`, `Thư viện A2`, `HOMIES B2`, `HOMIES C3`) — để gửi hồ sơ trực tiếp cho Staff đang trực tại quầy cơ sở đó đối chiếu thẻ gốc và phê duyệt.
     - **Ảnh thẻ chân dung sinh viên** (hỗ trợ mở Camera chụp trực tiếp hoặc tải ảnh lên, tự động nén chuẩn JPEG `< 60KB`).
3. **Hệ thống Mã số ra vào hiệu lực 2 tiếng (`02:00:00`)**:
   - Mỗi mã số 6 chữ số sau khi được Staff chấp nhận sẽ có hiệu lực trong **2 tiếng (120 phút)**.
   - Tại **cùng một cơ sở**, sinh viên chỉ có 1 mã đang hoạt động và chỉ có thể xin cấp lại tại cơ sở đó sau khi hết 2 tiếng.
   - Nếu đang trong thời gian 2 tiếng mà sinh viên chọn xin cấp mã ở **một cơ sở Homies khác**, hệ thống vẫn cho phép gửi yêu cầu nhưng tự động đính kèm **thông tin lần cấp mã đầu tiên** (tên cơ sở đầu tiên, mã số đã cấp, thời điểm cấp và thời gian còn lại) để cảnh báo trực tiếp trên màn hình phê duyệt của Staff cơ sở mới.

### E. Nâng Cấp Phân Quyền Duyệt Tài Khoản & Gỡ Bỏ Dữ Liệu Kiểm Thử Ở `STAFF`
- **Gỡ bỏ hoàn toàn phần kiểm thử**: Xóa bỏ danh sách *"Chọn nhanh 5 tài khoản Staff (Hỗ trợ kiểm thử nhanh)"* ở màn hình đăng nhập `STAFF`, đảm bảo tính bảo mật khi đưa web ra vận hành chính thức.
- **Mở rộng mục `🪪 Duyệt Tài khoản Sinh viên` cho cả Staff 4 cơ sở**:
  - Trước đây chỉ hiển thị cho `homies_admin`, nay mục `🪪 Duyệt Tài khoản Sinh viên` được mở trên thanh dọc của **tất cả 5 tài khoản Staff**.
  - **Staff cơ sở nào** sẽ nhìn thấy và phê duyệt được các hồ sơ sinh viên chọn *"Đang ở Homies đó"* lúc đăng ký.
  - **Tài khoản Tổng (`homies_admin`)** nhìn thấy và phê duyệt được hồ sơ của tất cả 4 cơ sở.

---

## 3. Các Quyết Định Kỹ Thuật & Đánh Đổi

- **Quyết định 1: Kiểm tra biểu thức chính quy Email & MSSV chuẩn ULIS (`^2\d04`)**
  - *Cách tiếp cận*: Áp dụng biểu thức kiểm tra `/^2\d04\d{4,}@vnu\.edu\.vn$/i` (hoặc phần tên hộp thư bắt đầu bằng `2X04` kèm đuôi `@vnu.edu.vn`), đảm bảo chỉ sinh viên thuộc Trường Đại học Ngoại ngữ – ĐHQGHN (mã `04`, khóa `2X`) mới đăng ký được Thẻ sinh viên số.
- **Quyết định 2: Lưu vết lần cấp mã đầu tiên trong chu kỳ 2 tiếng (`priorActivePassWarning`)**
  - *Cách tiếp cận*: Khi một sinh viên gửi yêu cầu xin cấp mã tại cơ sở B, hệ thống kiểm tra toàn bộ các mã đã được cấp cho `studentId` đó trong vòng `2 tiếng` (`7,200,000 ms`) gần nhất. Nếu phát hiện đã có mã được cấp tại cơ sở A trong vòng 2 tiếng, bản ghi yêu cầu mới sẽ lưu kèm trường `priorActivePassWarning` chứa `{ branchId, branchName, code, approvedAt, expiresAt }` để hiển thị khung cảnh báo màu hổ phách/đỏ trên thẻ duyệt của Staff cơ sở B.
- **Quyết định 3: Phân quyền duyệt hồ sơ sinh viên theo `registeredBranchId`**
  - *Cách tiếp cận*: Mỗi tài khoản sinh viên mới tạo sẽ lưu thêm trường `registeredBranchId` (cơ sở Homies sinh viên đang đứng tại quầy). Bộ lọc danh sách duyệt tài khoản của Staff sẽ kiểm tra `isMaster || acc.allowedBranches.includes(stu.registeredBranchId)`, giúp cả Staff tại quầy và Admin Tổng đều duyệt được tức thời.

---

## 4. Kiến Trúc Kỹ Thuật & Luồng Dữ Liệu

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         HEADER (TOP-RIGHT DROPDOWN)                          │
│  [Logo USEATIFY + Slogan]        [GUEST • Tra cứu chỗ ngồi ▾] (Tự đóng chọn) │
│                                    ├─ GUEST • Tra cứu chỗ ngồi               │
│                                    ├─ STUDENT PASS - Thẻ sinh viên số        │
│                                    └─ STAFF • Quản trị hệ thống              │
└───────────────┬───────────────────────────────┬──────────────────────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────────┐ ┌────────────────────────────────────────────┐
│          PHÂN HỆ GUEST        │ │   STUDENT PASS - THẺ SINH VIÊN SỐ          │
│ 1. Tra cứu chỗ trống 4 cơ sở  │ │ • Chú thích quy định đăng ký lần đầu tại   │
│ 2. WHY CHOOSE USEATIFY (2x2): │ │   quầy & quy tắc mã 2 tiếng / 1 cơ sở      │
│    - 01: Gộp ý 1 + ý 3 cũ     │ │ • Đăng ký: Họ tên, Email 2X04...@vnu.edu.vn│
│    - 02: Chủ động thời gian   │ │   MSSV 2X04..., Chọn cơ sở Homies đang đứng│
│    - 03: Mô tả Student Pass   │ │   & Ảnh thẻ chân dung (Không cần ảnh Thẻ)  │
│    - 04: Đánh giá và góp ý    │ │ • Xin mã 6 số (Hiệu lực 2 tiếng = 120p):   │
│ 3. Đánh giá 5 sao & Hòm thư   │ │   - Chặn xin lại cùng cơ sở trong 2 tiếng  │
│    góp ý ẩn danh (Khôi phục)  │ │   - Xin ở cơ sở khác -> Gửi kèm cảnh báo   │
└───────────────────────────────┘ └─────────────────────┬──────────────────────┘
                                                        │ Đồng bộ Realtime DB
                                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                PHÂN HỆ STAFF (KHÔNG CÒN HỘP KIỂM THỬ MẬT KHẨU)               │
│  [Thanh dọc Ghim / Tự thu nhỏ]                                               │
│   ├─ 🪑 Đếm chỗ (+1/-1) & Ảnh cơ sở (Giao diện chuẩn 2 nút lớn -1 / +1)      │
│   ├─ 🎫 Cấp mã vào tạm thời (2 tiếng) -> Hiển thị CẢNH BÁO nếu SV đã được    │
│   │      cấp mã ở cơ sở khác trong vòng 2 tiếng qua                          │
│   ├─ 🪪 Duyệt Tài khoản Sinh viên -> Mở cho CẢ Staff cơ sở tương ứng & Admin │
│   └─ ⭐ Duyệt Đánh giá / 📥 Hòm thư / 📞 Liên hệ / 🔑 Đổi mật khẩu           │
└──────────────────────────────────────────────────────────────────────────────┘
```
