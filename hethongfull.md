# VietTravel AI — Project README

> **Mục đích file này**: Cung cấp cho AI (hoặc developer mới) toàn bộ ngữ cảnh cần thiết để hiểu và làm việc với dự án một cách chính xác. Đọc toàn bộ trước khi viết bất kỳ dòng code nào.

---

## 1. Tổng Quan Dự Án

**VietTravel AI** là ứng dụng du lịch Việt Nam full-stack, cho phép người dùng:

- Khám phá **điểm đến** (destinations), **khách sạn** (hotels), **tour du lịch** (tours)
- Tạo **lịch trình thông minh bằng AI** (AI Planner) dựa trên ngân sách, sở thích
- **Đặt tour / đặt phòng** và thanh toán qua VNPay
- **Đánh giá** tour, hotel, điểm đến sau khi trải nghiệm
- Quản lý toàn bộ nội dung qua **Admin Dashboard**

---

## 2. Tech Stack

| Layer | Công nghệ | Version / Ghi chú |
|---|---|---|
| Framework | **Next.js** (App Router + RSC + Server Actions) | `16.1.6` |
| Language | **TypeScript** strict mode | `^5` |
| Styling | **Tailwind CSS v4** + **shadcn/ui** | Radix Nova theme |
| Animation | **Framer Motion** | `^12.38` |
| Form | **react-hook-form** + **Zod v4** | Custom hook wrapper |
| Backend/DB | **Supabase** (PostgreSQL + Auth + Storage + RLS) | `@supabase/ssr ^0.9` |
| AI | **Google Generative AI** (`@google/genai`) | Thay thế OpenAI |
| Payment | **VNPay** (Sandbox) | HMAC-SHA512 |
| Icons | **Lucide React** | `^0.577` |
| Toast | **Sonner** | `^2.0` |
| AI Model (prompt log) | gpt-4o-mini (legacy, đã chuyển sang Google) | Xem `ai_prompt_logs.model` |

> **Lưu ý**: `package.json` có cả `@google/genai` và `@google/generative-ai` — dùng `@google/genai` (SDK mới hơn).

---

## 3. Cấu Trúc Thư Mục

```
travel_ai/
├── app/
│   ├── layout.tsx                    # Root layout: Geist font + Toaster (Sonner)
│   ├── error.tsx / loading.tsx / not-found.tsx
│   ├── (client)/                     # Route group: có Header + Footer
│   │   ├── page.tsx                  # Trang chủ (SSR, fetch featured destinations/tours)
│   │   ├── layout.tsx                # Wrap Header + Footer
│   │   ├── destinations/
│   │   │   ├── page.tsx              # Danh sách destinations (filter/search)
│   │   │   └── [slug]/page.tsx       # Detail: gallery, attractions, reviews, AI planner CTA
│   │   ├── hotels/
│   │   │   ├── page.tsx              # Danh sách hotels (filter: star, province)
│   │   │   └── [slug]/page.tsx       # Detail: gallery, room types, amenities, reviews
│   │   ├── tours/
│   │   │   ├── page.tsx              # Danh sách tours (filter: price, duration, destination)
│   │   │   └── [slug]/page.tsx       # Detail: itinerary, reviews, booking CTA
│   │   └── (features)/               # Protected routes (phải đăng nhập)
│   │       ├── profile/page.tsx      # ❌ Shell only — chưa implement
│   │       ├── itineraries/page.tsx  # ❌ Shell only — chưa implement
│   │       └── my-tours/page.tsx     # ❌ Shell only — danh sách booking của user
│   ├── ai-planner/                   # AI lịch trình (standalone, không có Header/Footer group)
│   ├── auth/                         # Supabase Auth callbacks
│   ├── login/ register/              # Auth pages
│   ├── forgot-password/
│   ├── link-expired/
│   └── reset-password/
│
├── components/
│   ├── ui/                           # ~14 shadcn components
│   ├── common/search-input.tsx       # Debounce search input
│   ├── home/                         # 5 sections: Hero, Featured, AI CTA, ...
│   ├── destination/                  # List + Detail + actions (wishlist, review)
│   ├── hotel/                        # List + Detail + actions
│   ├── tour/                         # List + Detail + booking CTA
│   ├── ai-planner/                   # Form nhập + hiển thị kết quả AI
│   ├── features/feature-sidebar.tsx
│   ├── login/ register/
│   └── layout/
│       ├── client/header.tsx         # Responsive header, Framer Motion nav indicator
│       └── server/footer.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser singleton client
│   │   ├── server.ts                 # Cookie-based server client (SSR)
│   │   ├── proxy.ts                  # Middleware auth guard logic
│   │   └── admin.ts                  # Service role client (bypass RLS) — chỉ dùng trong Server Actions admin
│   ├── constants/common.ts           # NAV_ITEMS, ADMIN_NAV_ITEMS, DESTINATION_TYPES, ...
│   ├── schema/auth.ts                # Zod schemas: login, register
│   └── utils/
│       ├── common.ts                 # formatPrice (VNĐ), timeAgo, getInitials
│       └── server-actions.ts         # createServerAction wrapper
│
├── hooks/
│   ├── use-form-with-server-action.ts   # RHF + useActionState (React 19)
│   └── use-action-result-handlers.ts
│
├── types/
│   ├── database.ts                   # Auto-gen: `supabase gen types typescript --linked`
│   ├── destination.ts                # Destination, DestinationDetail, Review, ...
│   ├── hotel.ts                      # Hotel, HotelDetail, ...
│   ├── tour.ts                       # Tour, TourDetail
│   ├── profile.ts                    # Profile, Itinerary
│   ├── user.ts                       # Profile (alias)
│   └── common.ts                     # ServerActionResult<T>
│
├── supabase/migrations/              # 13 migration files (xem Phần 5)
├── proxy.ts                          # Next.js middleware entry point
└── styles/globals.css
```

---

## 4. Kiến Trúc & Patterns Quan Trọng

### 4.1 Supabase Client — 4 loại, dùng đúng ngữ cảnh

```
Client Component   →  lib/supabase/client.ts   (browser singleton)
Server Component   →  lib/supabase/server.ts   (cookie-based, đọc session)
Middleware         →  lib/supabase/proxy.ts    (updateSession)
Admin Actions      →  lib/supabase/admin.ts    (service role, bypass RLS)
```

> ⚠️ **Quan trọng**: Admin actions **phải** dùng `admin.ts` để bypass RLS. Không dùng `server.ts` cho admin CRUD vì RLS sẽ block.

### 4.2 Server Action Pattern

Mọi server action đều wrap bởi `createServerAction` → trả về `ServerActionResult<T>`:

```ts
type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

- Nếu action throw `NEXT_REDIRECT` hoặc `NEXT_NOT_FOUND` → **re-throw**, không nuốt lỗi.
- FormData deserialization: hỗ trợ `File`, `File[]`, `object` (JSON.stringify), `null` (`__NULL__`), primitive.

### 4.3 Form Pattern

```
useFormWithServerAction
  ├── useForm (react-hook-form + zodResolver)
  ├── useActionState (React 19)
  └── useActionResultHandler (success/error callback → toast)
```

### 4.4 Middleware Auth Guard (`proxy.ts` → `lib/supabase/proxy.ts`)

```
Logic:
  1. Refresh Supabase session
  2. Chưa đăng nhập + PRIVATE route  → redirect /login
  3. Đã đăng nhập + AUTH page         → redirect /
  4. Vào /admin + role ≠ 'admin'      → redirect /
```

- **AUTH_PATHS** (trang auth, đã login redirect về /): `/login`, `/register`, `/forgot-password`, `/link-expired`
- **PRIVATE_PATHS** (phải login): `/profile`, `/my-tours`, `/itineraries`, `/checkout`, ...
- **PUBLIC_PATHS** (ai cũng vào được): `/`, `/tours`, `/destinations`, `/hotels`, `/ai-planner`

---

## 5. Database Schema — Toàn Bộ

### 5.1 Migration Files (theo thứ tự)

| File | Nội dung |
|---|---|
| `20260321020711_remove_guest_role` | Xóa role 'guest', còn lại: `user`, `staff`, `admin` |
| `20260321023542_add_is_admin_function` | Function `is_admin()` dùng trong RLS |
| `20260328140355_update_profile_and_role_enum` | Role về `user`/`admin`, thêm cột profiles |
| `20260328141408_add_tour_system_tables` | Toàn bộ hệ thống destinations, tours, reviews, wishlists |
| `20260329014304_add_hotel_system` | Hotels, room_types, amenities, trigger avg_rating |
| `20260329014927_add_ai_itinerary_schema` | ai_itineraries, ai_prompt_logs |
| `20260329015250_insert_scrape_data` | Seed data: destinations, hotels, tours, tags, amenities |
| `20260403064500_add_booking_system` | bookings, tour_tags, mở rộng tours, trigger booking_count |
| `20260403170000_add_payment_logs` | payment_logs (VNPay audit trail) |
| `20260406070000_add_hotel_booking_support` | hotel_id trong bookings, booking_type enum |
| `20260406080000_add_review_system` | 'completed' vào booking_status, booking_id trong reviews |

### 5.2 Enum Types

| Enum | Values |
|---|---|
| `user_role` | `user`, `admin` |
| `user_status` | `active`, `banned` |
| `destination_type` | `beach`, `mountain`, `culture`, `city`, `countryside`, `island` |
| `review_target_type` | `destination`, `hotel`, `tour` |
| `wishlist_target_type` | `destination`, `hotel` |
| `report_status` | `pending`, `reviewed`, `dismissed` |
| `booking_status` | `pending`, `confirmed`, `cancelled`, `refunded`, `completed` |
| `payment_status` | `unpaid`, `paid`, `refunded` |
| `booking_type` | `tour`, `hotel` |

### 5.3 Bảng Chính — Cấu Trúc

#### `profiles` (extends Supabase Auth users)
```
id uuid PK (= auth.uid())
email text
full_name text
phone text
avatar_url text
role user_role DEFAULT 'user'
status user_status DEFAULT 'active'
created_at / updated_at timestamptz
```

#### `destinations`
```
id, name, slug (UNIQUE), description
region (Bắc/Trung/Nam), province
destination_type destination_type
cover_image text (Supabase Storage URL)
avg_rating numeric(2,1), review_count int
min_price numeric(12,0), suggested_days int
is_featured bool, view_count int
created_at / updated_at
```

#### `hotels`
```
id, name, slug (UNIQUE), description, address
province, destination_id FK→destinations (nullable)
star_rating int (1-5), cover_image
avg_rating, review_count, min_price
latitude, longitude numeric
is_featured bool, view_count int
created_at / updated_at
```

#### `tours`
```
id, name, slug (UNIQUE), description
destination_id FK→destinations (nullable)
duration_days int, price numeric(12,0)
max_group_size int DEFAULT 20
cover_image, avg_rating, review_count
is_active bool
-- Thêm từ booking migration:
booking_count int DEFAULT 0
available_slots int (NULL = không giới hạn)
start_dates date[]
includes text[], excludes text[]
created_at / updated_at
```

#### `bookings`
```
id uuid PK
user_id FK→profiles
tour_id FK→tours (nullable khi booking_type='hotel')
hotel_id FK→hotels (nullable khi booking_type='tour')
booking_type booking_type DEFAULT 'tour'
status booking_status DEFAULT 'pending'
num_people int (≥1)
travel_date date
total_price numeric(12,0)   -- snapshot: price × num_people tại thời điểm đặt
note text
payment_method text DEFAULT 'vnpay'
payment_ref text UNIQUE      -- VNPay vnp_TxnRef
payment_status payment_status DEFAULT 'unpaid'
paid_at timestamptz
created_at / updated_at

CONSTRAINT: (tour_id IS NOT NULL AND hotel_id IS NULL) OR (hotel_id IS NOT NULL AND tour_id IS NULL)
```

#### `reviews`
```
id uuid PK
user_id FK→profiles
target_type review_target_type   -- 'destination' | 'hotel' | 'tour'
target_id uuid                   -- ID của destination/hotel/tour
booking_id FK→bookings (nullable, UNIQUE) -- 1 booking = tối đa 1 review
rating int (1-5)
comment text
like_count int DEFAULT 0
is_visible bool DEFAULT true
created_at / updated_at
```

#### `ai_itineraries`
```
id uuid PK
user_id FK→profiles
title text
prompt text
result JSONB                 -- structured itinerary từ AI
destination_name text
duration_days int
budget numeric(12,0)
num_people int
created_at
```

#### `payment_logs`
```
id uuid PK
booking_id FK→bookings (nullable)
source text ('callback' | 'ipn')
raw_query JSONB
response_code text
is_valid_sig bool
created_at
```

### 5.4 Junction Tables

| Bảng | Quan hệ |
|---|---|
| `destination_tags` | destinations ↔ tags |
| `hotel_tags` | hotels ↔ tags |
| `tour_tags` | tours ↔ tags (dùng để AI filter tour) |
| `hotel_amenities` | hotels ↔ amenities |
| `room_amenities` | room_types ↔ amenities |
| `destination_images` | images của destination |
| `hotel_images` | images của hotel |
| `review_likes` | users thích review |

### 5.5 Triggers & Functions Quan Trọng

| Trigger/Function | Mô tả |
|---|---|
| `update_updated_at()` | Auto-update `updated_at` trên profiles, destinations, tours, attractions, reviews, bookings, room_types, hotels |
| `update_avg_rating()` | Sau INSERT/UPDATE/DELETE trên `reviews` → cập nhật `avg_rating` + `review_count` của destination/hotel/tour tương ứng |
| `update_review_like_count()` | Sau INSERT/DELETE trên `review_likes` → cập nhật `like_count` của review |
| `sync_tour_booking_count()` | Sau UPDATE status trên `bookings` → cộng/trừ `booking_count` của tour khi confirmed/cancelled |
| `is_admin()` | Helper function dùng trong RLS: `SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'` |

### 5.6 Sơ Đồ Quan Hệ

```
profiles ──< bookings >── tours ──< tour_itineraries
profiles ──< reviews >── (destinations | hotels | tours)
profiles ──< wishlists >── (destinations | hotels)
profiles ──< ai_itineraries

destinations ──< destination_images
destinations ──< attractions
destinations ──< destination_tags >── tags
destinations ──< hotels

hotels ──< hotel_images
hotels ──< room_types ──< room_amenities >── amenities
hotels ──< hotel_amenities >── amenities
hotels ──< hotel_tags >── tags

tours ──< tour_itineraries
tours ──< tour_tags >── tags

reviews ──< review_likes
reviews ──< review_reports

bookings ──< payment_logs
```

### 5.7 RLS Policy — Nguyên tắc

- **Public read**: destinations, hotels, tours, tour_itineraries, destination_images, hotel_images, attractions, tags, amenities, room_types — ai cũng đọc được.
- **User chỉ CRUD của mình**: reviews (tạo/sửa/xóa review của mình), bookings (xem/tạo/hủy của mình), wishlists, ai_itineraries.
- **Admin**: dùng `is_admin()` để có toàn quyền trên mọi bảng.
- **Service role** (`admin.ts`): bypass hoàn toàn RLS, chỉ dùng trong server actions có guard middleware `role=admin`.

### 5.8 View: `booking_summary`

View denormalized dùng cho admin dashboard — join bookings + tours + profiles:
```sql
SELECT b.*, t.name AS tour_name, t.slug, t.price AS tour_unit_price,
       p.full_name AS user_name, p.email AS user_email, p.phone AS user_phone
FROM bookings b JOIN tours t ... JOIN profiles p ...
```

---

## 6. Seed Data

File `20260329015250_insert_scrape_data_for_mutiple_table.sql` chứa:

**Amenities** (16 items): Wifi, Hồ bơi, Bãi đỗ xe, Nhà hàng, Phòng gym, Spa, Điều hòa, Minibar, Ban công, Bồn tắm, TV, Két sắt, Máy sấy tóc, Dịch vụ phòng 24h, Đưa đón sân bay, Quầy bar.

**Tags** (12): Biển, Núi, Nghỉ dưỡng, Văn hóa, Phiêu lưu, Ẩm thực, Gia đình, Lãng mạn, Thành phố, Làng quê, Di sản, Sinh thái.

**Destinations** (10 nổi bật): Vịnh Hạ Long, Phố Cổ Hội An, Sa Pa, Đà Nẵng, Phú Quốc, Ninh Bình, Mũi Né, Nha Trang, Đà Lạt, Huế.

**Hotels, Tours, Attractions**: Dữ liệu mẫu đầy đủ cho mỗi destination.

---

## 7. API Routes

| Route | Method | Mô tả |
|---|---|---|
| `/api/ai/generate-itinerary` | POST | Nhận params → build prompt → gọi Google GenAI → trả về itinerary JSON + suggested tours |
| `/api/payment/create-payment-url` | POST | Tạo VNPay payment URL với HMAC-SHA512 |
| `/api/payment/vnpay-callback` | GET | Xử lý VNPay redirect callback → verify sig → update booking → redirect user |
| `/api/payment/vnpay-ipn` | POST | Server-to-server IPN → verify → update → trả `RspCode='00'` |

### AI Itinerary — Input/Output

**Input** (POST body):
```json
{
  "destination_slug": "da-nang",
  "days": 3,
  "budget": 5000000,
  "preferences": "biển, ẩm thực",
  "num_people": 2
}
```

**Output JSON schema** (từ AI):
```json
{
  "destination": "string",
  "duration_days": "number",
  "budget_per_person": "number",
  "num_people": "number",
  "overview": "string (2-3 câu)",
  "days": [{
    "day": "number",
    "title": "string",
    "theme": "cultural|nature|beach|food|adventure",
    "activities": [{
      "time": "HH:MM",
      "title": "string",
      "duration_minutes": "number",
      "type": "attraction|meal|transport|hotel",
      "estimated_cost": "number (VNĐ)",
      "notes": "string (optional)"
    }],
    "meals": { "breakfast": "string", "lunch": "string", "dinner": "string" },
    "estimated_daily_cost": "number"
  }],
  "total_estimated_cost": "number",
  "tags": ["string (5-8 tags lowercase, dùng để filter tour)"],
  "tips": ["string (3-5 mẹo)"],
  "best_time": "string"
}
```

---

## 8. Payment — VNPay Integration

**ENV vars cần thiết**:
```
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

**Flow**:
1. Client checkout → Server Action tạo booking `status='pending'`, `payment_status='unpaid'`
2. POST `/api/payment/create-payment-url` → build VNPay params + HMAC-SHA512 → trả `paymentUrl`
3. Redirect user sang VNPay
4. VNPay redirect về `/api/payment/vnpay-callback` (GET) → verify sig → update booking `status='confirmed'`, `payment_status='paid'`, `paid_at=now()` → redirect `/my-tours`
5. VNPay gọi `/api/payment/vnpay-ipn` (POST) → verify → idempotent update → trả `{"RspCode":"00"}`
6. Mọi callback đều được log vào `payment_logs` (audit trail)

**Idempotent**: Nếu booking đã `paid` → không update lại.

---

## 9. Trạng Thái Tính Năng (Feature Status)

| Tính năng | Trạng thái | Ghi chú |
|---|---|---|
| Trang chủ (Hero + Featured sections) | ✅ Done | SSR |
| Destinations: List + Detail | ✅ Done | Filter, gallery, attractions, reviews hiển thị |
| Hotels: List + Detail | ✅ Done | Star rating, room types, amenities |
| Tours: List + Detail | ✅ Done | Itinerary mẫu, booking CTA |
| Auth: Login / Register / Signout | ✅ Done | Supabase Auth |
| Forgot / Reset Password | ✅ Done | Email flow |
| Header responsive + user dropdown | ✅ Done | Framer Motion |
| AI Planner UI (`/ai-planner`) | ✅ UI Done | API route cần kiểm tra |
| Wishlist | ❌ Chưa implement | UI button có, logic chưa có |
| Reviews: submit, like, report | ❌ Chưa implement | Chỉ hiển thị, không submit |
| `/profile` | ❌ Shell only | Chưa có nội dung |
| `/itineraries` | ❌ Shell only | Danh sách AI itineraries đã lưu |
| `/my-tours` | ❌ Shell only | Danh sách bookings của user |
| Booking flow (checkout → payment) | ✅ Schema done | UI flow cần implement |
| Admin Dashboard | ❌ Chưa làm | ADMIN_NAV_ITEMS có trong constants |
| Google OAuth | ❌ Chưa làm | |
| Email confirmation sau booking | ❌ Chưa làm | Supabase Edge Functions hoặc Resend |

---

## 10. Module Breakdown

### Module 1: Tour Booking Flow

```
STEP 1 — Checkout Form (client)
  Validate: tour còn slot không? (server action check)
  Input: num_people, travel_date (chọn từ tours.start_dates), note
  Calculate: total_price = tour.price × num_people

STEP 2 — Create Booking (server action)
  INSERT bookings (status='pending', payment_status='unpaid')
  → Trả về booking_id

STEP 3 — Build VNPay URL (API route)
  POST /api/payment/create-payment-url
  Body: { booking_id, amount, order_desc }
  → Build VNPay params + HMAC-SHA512 signature
  → Redirect user sang VNPay gateway

STEP 4 — VNPay Callback (GET /api/payment/vnpay-callback)
  Verify HMAC signature
  Check response_code == '00'
  UPDATE booking: status='confirmed', payment_status='paid', paid_at=now()
  Trigger: sync_tour_booking_count() → cộng booking_count
  Log vào payment_logs
  Redirect → /my-tours

STEP 5 — VNPay IPN (POST /api/payment/vnpay-ipn)
  Server-to-server confirm
  Idempotent: nếu đã paid → return '00' mà không update
  Return: { RspCode: '00', Message: 'Confirm Success' }
```

### Module 2: AI Planner Flow

```
1. USER INPUT: { destination_slug, days, budget, preferences, num_people }
2. SERVER: Fetch destination (name, type, province, attractions list)
           Fetch related tours (giá, slug, duration)
           Fetch hotels của destination (star_rating, min_price)
3. BUILD PROMPT: System + User context (destination details + budget constraint)
4. LLM CALL: Google GenAI (JSON mode)
5. PARSE + VALIDATE: Zod schema validation, fallback nếu fail
6. ENRICH: Query tours WHERE tags OVERLAP extracted_tags
           Query hotels thuộc destination
7. PERSIST (nếu đã login): INSERT ai_itineraries
8. RETURN: { itinerary, suggested_tours, suggested_hotels }
```

**Caching**: Hash-based theo (destination_id + params). Cùng params trong 24h → return cached từ `ai_itineraries`.

**Rate limit**: 10 requests/user/hour (track qua Supabase).

### Module 3: Admin Dashboard

```
Route: /admin (protected bằng middleware role=admin)
Data access: lib/supabase/admin.ts (service role, bypass RLS)

/admin             → Stats (users, bookings, revenue, tours) + recent bookings + pending reports
/admin/tours       → CRUD tours + upload ảnh lên Supabase Storage
/admin/destinations→ CRUD destinations
/admin/hotels      → CRUD hotels
/admin/bookings    → Xem + update status (confirmed/cancelled/refunded/completed)
/admin/users       → Ban/unban user, đổi role
/admin/reviews     → Moderation: ẩn review bị report
/admin/ai-logs     → Xem ai_prompt_logs (prompt, token usage)
```

---

## 11. TypeScript Types Quan Trọng

```ts
// types/common.ts
type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// types/destination.ts
type Review = Pick<reviews.Row, 'id' | 'rating' | 'comment' | 'created_at'>
  & { profiles: Pick<Profile, 'full_name' | 'avatar_url'> }

type DestinationDetail = Destination & {
  reviews: Review[]
  destination_images: [...]
  attractions: [...]
  tags: [...]
}

// types/hotel.ts
type HotelDetail = Hotel & {
  reviews: Review[]
  hotel_images: [...]
  room_types: room_types.Row[]
  amenities: [...]
}

// types/tour.ts
type TourDetail = Tour & {
  tour_itineraries: [...]
  reviews: Review[]
}

// types/profile.ts
type Itinerary = ai_itineraries.Row
```

> **Luôn import types từ `@/types/*`**. Không tự định nghĩa lại type đã có.

---

## 12. Constants Quan Trọng

Trong `lib/constants/common.ts`:

- `NAV_ITEMS`: Navigation items cho header (destinations, hotels, tours, ai-planner)
- `ADMIN_NAV_ITEMS`: Navigation items cho admin sidebar
- `DESTINATION_TYPES`: Mapping từ enum value → label tiếng Việt + icon
- `formatPrice(n)`: Format số VNĐ → "1.500.000 ₫"
- `timeAgo(date)`: "2 ngày trước"
- `getInitials(name)`: "Nguyễn Văn A" → "NA"

---

## 13. Quyết Định Kiến Trúc

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Backend architecture | Next.js Full-stack (không tách NestJS) | Team nhỏ, codebase đã có, time-to-market nhanh hơn |
| AI Provider | Google GenAI (thay OpenAI) | `@google/genai` có trong package.json |
| Payment | VNPay Sandbox | Phổ biến tại VN, có demo env |
| Admin data access | Service role client (bypass RLS) | Cần full access, bảo vệ bằng middleware |
| Tour filtering từ AI | Tag matching qua `tour_tags` junction table | Đơn giản, không cần vector search |
| Booking concurrency | Check slots ở server action + DB constraint | Đủ cho scale hiện tại |
| AI caching | Hash-based, lưu vào `ai_itineraries` | Giảm cost API |
| Booking for hotels | booking_type enum + nullable tour_id/hotel_id | Schema đã có, cần implement UI |

---

## 14. Conventions & Rules Khi Viết Code

1. **Luôn dùng `createServerAction` wrapper** cho mọi server action.
2. **Không dùng `server.ts` cho admin actions** — phải dùng `admin.ts`.
3. **Server Components** làm data fetching (SSR). **Client Components** chỉ khi cần interactivity.
4. **Không tự define types đã có** trong `@/types/*` hoặc `database.ts`.
5. **Validate input với Zod** trước khi gọi Supabase trong mọi API route và server action.
6. **Error handling**: Mọi Supabase call phải check `error`, log và trả về `{ success: false, error: string }`.
7. **RLS-aware**: Biết route nào dùng client nào. Không vô tình dùng sai client.
8. **VNPay callbacks**: Luôn verify HMAC-SHA512 trước khi xử lý. Luôn log vào `payment_logs`.
9. **Admin routes**: Middleware guard `role=admin` ở route level, không rely vào client-side check.
10. **Formatting**: Dùng `formatPrice` từ `lib/utils/common.ts` cho mọi giá tiền (VNĐ).

---

## 15. Environment Variables Cần Thiết

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Chỉ dùng server-side

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=

# VNPay (Sandbox)
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://yourdomain.com/api/payment/vnpay-callback
VNPAY_IPN_URL=https://yourdomain.com/api/payment/vnpay-ipn
```

---

## 16. Scripts

```bash
pnpm dev          # Next.js dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm type-check   # TypeScript check (tsc --noEmit)
pnpm db:types     # Regenerate types/database.ts từ Supabase
pnpm db:migrate   # Push migrations + regenerate types
```

---

*README này được tổng hợp từ toàn bộ source code, migrations, và system analysis tính đến ngày 07/04/2026.*
