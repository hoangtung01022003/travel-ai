# VietTravel AI - Nền tảng du lịch thông minh

Dự án website du lịch hiện đại tích hợp AI (Gemini) để lập kế hoạch lịch trình, sử dụng Next.js 16, Supabase SSR và cổng thanh toán VNPay.

## 🚀 Hướng dẫn cài đặt và chạy dự án

### 1. Yêu cầu hệ thống

- **Node.js**: Phiên bản 18.x hoặc mới hơn.
- **NPM / PNPM / Bun**: Trình quản lý gói.
- **Supabase Project**: Để quản lý Database & Auth.
- **Gemini API Key**: Để chạy tính năng lập kế hoạch bằng AI.

### 2. Thiết lập biến môi trường

Tạo file `.env.local` tại thư mục gốc và cấu hình các thông tin sau (Tham khảo `.env.example` nếu có):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Configuration (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# VNPay Payment Gateway
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# Base URL (Dùng cho VNPay Callback - Cần Public URL khi test IPN)
BASE_URL=http://localhost:3000
```

> [!TIP]
> Để test tính năng thanh toán VNPay (IPN callback), bạn nên sử dụng một công cụ tunnel như **Cloudflare Tunnel** hoặc **Ngrok** để nhận được phản hồi từ máy chủ VNPay về localhost. Sau đó cập nhật `BASE_URL` thành URL tunnel đó.

### 3. Cài đặt và Chạy

Mở terminal và thực hiện các lệnh sau:

```bash
# Cài đặt phụ thuộc
npm install


npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) để xem kết quả.

## 🏗 Kiến trúc hệ thống & Tối ưu hóa

Dự án đã được tối ưu hóa để đảm bảo tính ổn định cao nhất:

- **Centralized Auth**: Toàn bộ các mutation (Logout, Profile Update, Booking) được xử lý qua **Server Actions** để tránh xung đột Cookie và Race Condition.
- **Atomic Booking**: Quy trình đặt chỗ và tạo link thanh toán VNPay được hợp nhất trong một giao dịch duy nhất tại Server.
- **Lazy Auth Middleware**: Middleware chỉ kiểm tra xác thực ở các route cần thiết (Admin/Private) để tăng tốc độ tải trang Public.

## 🛠 Công nghệ sử dụng

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Framer Motion.
- **Backend**: Supabase SSR (@supabase/ssr), Postgresql.
- **AI**: Google Gemini Pro API.
- **Payment**: VNPay SDK integration.

---
*Phát triển bởi đội ngũ VietTravel AI Team.*
