🏗️ System Analysis — VietTravel AI (Tech Lead Perspective)

Bước 1: System Analysis
1.1 Các Module Chính
6 module cốt lõi, mỗi module độc lập về responsibility nhưng liên kết qua shared data layer:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    AUTH     │  │    TOUR     │  │   BOOKING   │
│             │  │             │  │             │
│ Supabase    │  │ List/Detail │  │ Checkout    │
│ Auth        │  │ CRUD admin  │  │ Payment     │
│ RLS guard   │  │ Review      │  │ History     │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ AI PLANNER  │  │   REVIEW    │  │    ADMIN    │
│             │  │             │  │             │
│ Prompt build│  │ CRUD review │  │ Dashboard   │
│ LLM call    │  │ Like/Report │  │ CRUD all    │
│ Tour filter │  │ Moderation  │  │ Analytics   │
└─────────────┘  └─────────────┘  └─────────────┘

1.2 User Flows
Flow 1: Đặt Tour
User xem danh sách tour
  → Filter (giá, ngày, destination)
  → Xem chi tiết tour (gallery, itinerary, reviews)
  → Click "Đặt tour"
  → [Auth guard] → nếu chưa login → redirect /login → quay lại
  → Checkout form (số người, ngày đi, ghi chú)
  → Confirm order → tạo booking status = 'pending'
  → Redirect sang VNPay
  → VNPay callback → verify signature → update booking status = 'confirmed'
  → Email confirmation (optional)
  → Booking hiển thị trong /my-tours
Flow 2: Tạo AI Itinerary
User vào /destinations/[slug] hoặc /ai-planner
  → Chọn destination (bắt buộc)
  → Điền params: số ngày, ngân sách, sở thích, số người
  → Submit → gọi POST /api/ai/generate-itinerary
  → Server build prompt với destination context từ DB
  → Gọi OpenAI API → nhận JSON structured itinerary
  → Parse + validate JSON schema
  → Lưu vào ai_itineraries (nếu user đã login)
  → Extract tags từ itinerary → query tours phù hợp
  → Trả về: itinerary + suggested tours
  → User có thể lưu / share / đặt tour từ gợi ý
Flow 3: Admin Quản Lý
Admin login → middleware check role=admin
  → Dashboard: aggregate data (users, bookings, revenue, tours)
  → CRUD Tour: tạo/sửa/xóa tour + upload ảnh
  → CRUD Booking: xem chi tiết, update status thủ công
  → CRUD Destination: thêm địa điểm mới
  → User management: ban/unban, đổi role
  → Moderation: duyệt/ẩn reviews bị report
  → AI Logs: xem prompt logs, token usage

1.3 Các Thành Phần Hệ Thống
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 16 (App Router + RSC + Server Actions)     │
│  Tailwind + shadcn/ui + Framer Motion               │
└────────────────────┬─────────────────────────────────┘
                     │ Server Actions / API Routes
┌────────────────────▼─────────────────────────────────┐
│                  BACKEND LAYER                        │
│  Next.js API Routes (/api/*)                         │
│  ├── /api/ai/generate-itinerary  (LLM integration)  │
│  ├── /api/payment/vnpay-callback  (Payment IPN)     │
│  └── /api/webhooks/*                                 │
│                                                      │
│  Server Actions (Supabase direct)                    │
│  └── CRUD: tours, bookings, reviews, destinations    │
└────────────────────┬─────────────────────────────────┘
          ┌──────────┴──────────┐
┌─────────▼────────┐  ┌────────▼──────────┐
│   Supabase       │  │   OpenAI API      │
│  ├── PostgreSQL  │  │  gpt-4o-mini      │
│  ├── Auth        │  │  JSON mode        │
│  ├── Storage     │  └───────────────────┘
│  └── RLS         │
└──────────────────┘
         │
┌────────▼──────────┐
│   VNPay Gateway   │
│  (Demo/Sandbox)   │
└───────────────────┘

Bước 2: High-level Architecture
2.1 Quyết Định Kiến Trúc: Monolith (Next.js Full-stack)
Không dùng NestJS riêng — lý do thực tế:
Tiêu chí	NestJS riêng	Next.js Full-stack
Codebase đã có	Phải rewrite toàn bộ	Tiếp tục từ code hiện tại
Deployment	2 service (FE + BE)	1 service (Vercel/Railway)
Team size phù hợp	3+ devs	1-2 devs
Scalability ở phase này	Over-engineering	Vừa đủ
Auth session	Cross-origin phức tạp	Cùng domain, đơn giản
Time-to-market	Chậm hơn 2-3x	Nhanh hơn
Khi nào mới tách NestJS? Khi có >10k DAU, cần scale BE độc lập, hoặc cần multi-client (mobile app riêng). Ở giai đoạn này, Next.js API Routes đủ mạnh.
Kiến trúc cụ thể:
Next.js Full-stack
├── Server Components     → Data fetching (SSR/SSG)
├── Server Actions        → Mutations (CRUD)
├── API Routes (/api)     → Webhooks, LLM, Payment callback
└── Client Components     → Interactive UI

2.2 AI Planner — Cơ Chế Hoạt Động
1. USER INPUT
   { destination_slug, days, budget, preferences, num_people }
         │
2. SERVER: Build Context
   ├── Fetch destination từ DB (name, type, province, attractions)
   ├── Fetch related tours (giá, slug, name, duration)
   └── Fetch hotels (star_rating, min_price, slug)
         │
3. PROMPT CONSTRUCTION
   System: "You are a Vietnam travel expert. Return ONLY valid JSON..."
   User: "Plan a {days}-day trip to {destination.name}..."
   Context: [destination details, attractions list, budget constraint]
         │
4. LLM CALL (OpenAI gpt-4o-mini, JSON mode)
   → response_format: { type: "json_object" }
         │
5. PARSE & VALIDATE
   ├── Zod schema validation
   ├── Extract tags/keywords từ itinerary
   └── Fallback nếu parse fail
         │
6. ENRICH RESPONSE
   ├── Query tours WHERE tags OVERLAP extracted_tags
   ├── Query hotels thuộc destination
   └── Combine: { itinerary, suggested_tours, suggested_hotels }
         │
7. PERSIST (nếu đã login)
   └── INSERT ai_itineraries (user_id, result JSONB, ...)
         │
8. RETURN TO CLIENT

Bước 3: Database Design
Schema bổ sung cho các tính năng mới
Ngoài schema hiện có, cần thêm/mở rộng:
Bảng bookings (bảng quan trọng nhất cần thêm)
bookings
├── id uuid PK
├── user_id uuid FK → profiles
├── tour_id uuid FK → tours
├── status enum: pending | confirmed | cancelled | refunded
├── num_people int
├── travel_date date
├── total_price numeric(12,0)
├── note text
├── payment_method text default 'vnpay'
├── payment_ref text          -- mã giao dịch VNPay
├── payment_status enum: unpaid | paid | refunded
├── paid_at timestamptz
├── created_at / updated_at timestamptz
Bảng tours (mở rộng từ hiện có)
Thêm vào tours:
├── available_slots int       -- số chỗ còn lại
├── start_dates date[]        -- các ngày khởi hành
├── includes text[]           -- bao gồm gì (ăn sáng, vé...)
├── excludes text[]           -- không bao gồm gì
└── booking_count int default 0
Bảng tour_tags (mới - dùng cho AI filter)
tour_tags
├── tour_id uuid FK → tours
├── tag_id uuid FK → tags
└── PRIMARY KEY (tour_id, tag_id)
Quan hệ tổng thể:
profiles ──< bookings >── tours ──< tour_itineraries
profiles ──< reviews >── (destinations | hotels | tours)
profiles ──< wishlists
profiles ──< ai_itineraries
tours ──< tour_tags >── tags ──< destination_tags >── destinations
hotels ──< room_types
hotels ──< hotel_amenities >── amenities
bookings: payment_ref → VNPay transaction ID

Bước 4: Feature Breakdown
Module 1: Tour
Luồng:
List page: fetch tours (filter: destination, price_range, duration, available_date)
Detail page: fetch tour + itineraries + reviews + available_slots
Booking CTA: disabled nếu available_slots = 0
API / Server Actions cần:
getToursAction(filters)          → list + count (đã có, cần mở rộng filter)
getTourBySlugAction(slug)        → detail + reviews + itineraries (đã có)
checkAvailabilityAction(tour_id, date, num_people)  → boolean + remaining slots
Logic chính:
available_slots cần được tính real-time: max_group_size - SUM(bookings.num_people WHERE status IN ('pending','confirmed') AND travel_date = date)
Hoặc đơn giản hơn: dùng trigger Postgres update booking_count khi booking confirmed

Module 2: Booking & Payment
Flow Checkout chi tiết:
STEP 1 — Checkout Form (client)
  Validate: tour còn slot không? (server action check)
  Input: num_people, travel_date, note
  Calculate: total_price = tour.price × num_people

STEP 2 — Create Booking (server action)
  INSERT bookings (status='pending', payment_status='unpaid')
  → Trả về booking_id

STEP 3 — Build VNPay URL (API route)
  POST /api/payment/create-payment-url
  Body: { booking_id, amount, return_url }
  → Build VNPay params + HMAC signature
  → Redirect user sang VNPay gateway

STEP 4 — VNPay Callback (API route - QUAN TRỌNG)
  GET /api/payment/vnpay-callback?vnp_*=...
  ├── Verify HMAC signature (security critical)
  ├── Check vnp_ResponseCode = '00' → success
  ├── UPDATE bookings SET status='confirmed', payment_status='paid'
  ├── UPDATE tours SET booking_count = booking_count + num_people
  └── Redirect user → /my-tours?booking=success
  
STEP 5 — IPN (server-to-server, optional với demo)
  POST /api/payment/vnpay-ipn
  → Same logic as callback nhưng từ VNPay server
Lưu ý VNPay Demo:
Dùng vnpay-sandbox.vnpayment.vn
TMN Code + Hash Secret lấy từ VNPay sandbox portal
Luôn verify vnp_SecureHash trước khi xử lý

Module 3: AI Planner
JSON Structure của itinerary:
{
  "destination": "Sa Pa",
  "duration_days": 3,
  "budget_per_person": 3000000,
  "num_people": 2,
  "overview": "Hành trình 3 ngày khám phá...",
  "days": [
    {
      "day": 1,
      "title": "Khám phá trung tâm Sa Pa",
      "theme": "cultural",
      "activities": [
        {
          "time": "08:00",
          "title": "Thăm Chợ Bắc Hà",
          "duration_minutes": 120,
          "type": "attraction",
          "estimated_cost": 0,
          "notes": "Họp chợ vào sáng Chủ nhật..."
        }
      ],
      "meals": {
        "breakfast": "Phở Sa Pa tại chợ",
        "lunch": "Cơm lam gà nướng",
        "dinner": "Lẩu cá hồi"
      },
      "estimated_daily_cost": 800000
    }
  ],
  "total_estimated_cost": 2400000,
  "tags": ["mountain", "trekking", "culture", "ethnic-minority"],
  "tips": ["Mang áo ấm...", "Đặt phòng trước..."],
  "best_time": "Tháng 9-11 hoặc 3-5"
}
Cách dùng tags để filter tour:
1. AI trả về tags: ["mountain", "trekking", "culture"]
2. Query: SELECT tours WHERE id IN (
     SELECT tour_id FROM tour_tags 
     WHERE tag_id IN (SELECT id FROM tags WHERE slug IN ('mountain', 'trekking', 'culture'))
   ) AND destination_id = {destination.id}
   ORDER BY match_count DESC
3. Rank by số tags match nhiều nhất
Prompt Template (system prompt cốt lõi):
System: You are a Vietnam travel expert. 
Return ONLY a valid JSON object following the exact schema provided.
Do not include markdown, explanations, or any text outside the JSON.
All costs in VND. All times in HH:MM format.

Context:
- Destination: {destination.name} ({destination.province})
- Type: {destination.destination_type}
- Attractions: {attractions_list}
- Average budget range: {min_price} VND/day

User Request:
- Duration: {days} days
- Budget: {budget} VND total (for {num_people} people)
- Preferences: {preferences}
Caching strategy:
Cache result trong ai_itineraries theo hash(destination_id + params)
Nếu cùng params trong 24h → return cached
Tránh gọi LLM lặp cho cùng input → tiết kiệm cost

Module 4: Admin
Dashboard data flow:
/admin → AdminDashboard (server component)
  ├── getAdminStats():
  │   ├── COUNT users
  │   ├── COUNT bookings (by status)
  │   ├── SUM bookings.total_price WHERE payment_status='paid' (revenue)
  │   └── COUNT tours
  ├── getRecentBookings(limit=10)
  └── getPendingReports(limit=5)
CRUD operations — pattern nhất quán:
Mỗi entity có:
├── List page: server component, filter + pagination
├── Create/Edit: form với validation (zod)
├── Delete: confirm dialog + soft delete (is_active = false)
└── Admin client: dùng lib/supabase/admin.ts (service role, bypass RLS)
Lưu ý quan trọng: Admin actions PHẢI dùng service role client để bypass RLS, kết hợp với middleware check role=admin ở route level.

Bước 5: Implementation Roadmap
Phase 1 — Hoàn thiện nền móng (1-2 tuần)
✅ Đã có: Auth, destinations, hotels, tours (list+detail), header/footer
🔨 Cần làm:
  1. Reviews: submit review form trên detail page (destination/hotel/tour)
  2. Wishlist: connect logic vào UI button đã có
  3. AI Planner: implement API route + prompt builder + OpenAI call
  4. Fix hardcode count trong destination-page-client.tsx
Phase 2 — Tour Booking (1-2 tuần)
🔨 Cần làm:
  1. Mở rộng schema tours (available_slots, start_dates)
  2. Thêm bảng bookings + migration
  3. Checkout flow (form → create booking → payment URL)
  4. VNPay integration (sandbox)
  5. /my-tours page: list bookings của user
  6. Email confirmation (Supabase Edge Functions hoặc Resend)
Phase 3 — Admin Dashboard (1 tuần)
🔨 Cần làm:
  1. /admin layout + navigation (ADMIN_NAV_ITEMS đã có trong constants)
  2. Dashboard stats page
  3. CRUD tours (form upload ảnh lên Supabase Storage)
  4. CRUD destinations
  5. Booking management (view + status update)
  6. User management (ban/unban)
  7. Review moderation (ẩn review bị report)
Phase 4 — Optimization (sau khi MVP stable)
🔨 Cần làm:
  1. AI result caching (hash-based)
  2. Tour recommendation nâng cao (dựa trên booking history)
  3. Google OAuth
  4. ISR/SSG cho destination/hotel/tour detail pages
  5. Trang /profile (đổi avatar, thông tin cá nhân)
  6. /itineraries: list AI itineraries đã lưu

Bước 6: Sub-prompts
Prompt 1 — Generate DB Migration (Booking)
Bạn là Supabase/PostgreSQL expert. Tạo migration SQL cho bảng bookings 
trong hệ thống tour booking Vietnam, với các yêu cầu sau:

Tech: Supabase (PostgreSQL), RLS bật, uuid-ossp extension đã có.

Schema cần:
- bookings: id, user_id (FK profiles), tour_id (FK tours), 
  status enum (pending/confirmed/cancelled/refunded),
  num_people int, travel_date date, total_price numeric(12,0),
  note text, payment_method text, payment_ref text,
  payment_status enum (unpaid/paid/refunded), paid_at timestamptz,
  created_at/updated_at timestamptz

RLS policies:
- User chỉ xem/tạo booking của mình
- Admin xem tất cả, có thể update status

Triggers:
- auto update_updated_at
- Khi booking confirmed: cộng booking_count vào tours

Indexes: user_id, tour_id, status, travel_date

Prompt 2 — Generate API Route (AI Itinerary)
Bạn là Next.js 16 + TypeScript expert. Tạo API Route tại 
app/api/ai/generate-itinerary/route.ts với yêu cầu:

Stack: Next.js 16 App Router, OpenAI SDK, Supabase server client, Zod v4.

Input (POST body):
{ destination_slug, days, budget, preferences, num_people }

Logic:
1. Validate input với Zod
2. Fetch destination từ Supabase (name, type, province, attractions)
3. Fetch related tours thuộc destination đó
4. Build system prompt với context
5. Gọi OpenAI gpt-4o-mini với response_format json_object
6. Parse + validate JSON response với Zod schema
7. Query tours có tags trùng với itinerary.tags
8. Nếu user đã login → lưu vào ai_itineraries
9. Return { itinerary, suggested_tours }

Error handling: Timeout 30s, fallback message nếu AI fail.
Rate limit: 10 requests/user/hour (dùng Supabase để track).

JSON schema output phải có: days[], tags[], total_estimated_cost, tips.

Prompt 3 — Generate AI Itinerary JSON (Strict Schema)
Bạn là chuyên gia du lịch Việt Nam. Tạo lịch trình du lịch CHI TIẾT.

Trả về ĐÚNG JSON theo schema sau, KHÔNG thêm text nào ngoài JSON:

{
  "destination": string,
  "duration_days": number,
  "budget_per_person": number,
  "num_people": number,
  "overview": string (2-3 câu),
  "days": [
    {
      "day": number,
      "title": string,
      "theme": "cultural"|"nature"|"beach"|"food"|"adventure",
      "activities": [
        {
          "time": "HH:MM",
          "title": string,
          "duration_minutes": number,
          "type": "attraction"|"meal"|"transport"|"hotel",
          "estimated_cost": number (VND),
          "notes": string (optional)
        }
      ],
      "meals": { "breakfast": string, "lunch": string, "dinner": string },
      "estimated_daily_cost": number
    }
  ],
  "total_estimated_cost": number,
  "tags": string[] (5-8 tags tiếng Anh, lowercase, dùng để filter tour),
  "tips": string[] (3-5 mẹo thực tế),
  "best_time": string
}

Context về destination:
{INJECT_DESTINATION_CONTEXT}

Yêu cầu: {days} ngày, ngân sách {budget} VND, {num_people} người.
Sở thích: {preferences}.

Prompt 4 — Generate VNPay Integration
Bạn là Next.js + TypeScript expert. Implement VNPay payment integration 
(sandbox) cho hệ thống tour booking.

Cần tạo:
1. lib/payment/vnpay.ts — helper functions:
   - createPaymentUrl(params): string
   - verifyCallback(query): { isValid, responseCode, transactionRef }
   - Dùng crypto để tạo HMAC-SHA512 signature
   
2. app/api/payment/create-payment-url/route.ts (POST)
   Input: { booking_id, amount, order_desc }
   Logic: fetch booking, build VNPay params, return { paymentUrl }
   
3. app/api/payment/vnpay-callback/route.ts (GET)
   Logic: verify signature → update booking → redirect user
   
4. app/api/payment/vnpay-ipn/route.ts (POST, server-to-server)
   Logic: verify → update → return RspCode='00'

ENV vars cần: VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL (sandbox)

Lưu ý quan trọng:
- LUÔN verify signature trước khi xử lý
- Idempotent: nếu booking đã paid thì không update lại
- Log tất cả callbacks vào DB để audit

Prompt 5 — Generate Admin Dashboard
Bạn là Next.js 16 + TypeScript + shadcn/ui expert.

Tạo Admin Dashboard tại app/admin/ với yêu cầu:

Layout: sidebar navigation (dùng ADMIN_NAV_ITEMS từ lib/constants/common.ts)
Protected: middleware đã guard role=admin

Trang /admin/page.tsx (Dashboard):
- Stats cards: Total Users, Total Bookings, Revenue (tháng này), Active Tours
- Recent bookings table (10 mới nhất)
- Pending reviews to moderate

Data fetching:
- Dùng lib/supabase/admin.ts (service role client)
- Server components, không dùng client-side fetch
- Parallel fetching với Promise.all

UI: Dùng shadcn Card, Table, Badge. Consistent với design system hiện tại 
(Tailwind v4, radix-nova theme). Không thêm thư viện chart mới — dùng số thuần.

Type: Import từ @/types/*, không tự define.

Tổng Kết — Decision Matrix
Quyết định	Lựa chọn	Lý do
Backend architecture	Next.js Full-stack (không tách NestJS)	Code base đã có, team nhỏ, time-to-market
AI Model	gpt-4o-mini	Cost thấp, JSON mode ổn định, đủ chất lượng
Payment	VNPay Sandbox	Phổ biến ở VN, có demo env
Admin data access	Service role client (bypass RLS)	Cần full access, bảo vệ bằng middleware
Tour filtering từ AI	Tag matching qua junction table	Đơn giản, không cần vector search ở giai đoạn này
Booking concurrency	Check slots ở server action + DB constraint	Đủ cho scale hiện tại, tránh over-engineering
AI caching	Hash-based, lưu vào ai_itineraries	Giảm cost API, tái sử dụng kết quả
