-- Khôi phục các bảng của hệ thống khách sạn bị thiếu trên DB remote
-- (room_types, hotel_images, amenities, hotel_amenities, room_amenities, hotel_tags).
-- Idempotent: chạy nhiều lần không lỗi, không ảnh hưởng dữ liệu hiện có.

CREATE TABLE IF NOT EXISTS public.hotel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel ON public.hotel_images(hotel_id);

CREATE TABLE IF NOT EXISTS public.hotel_tags (
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (hotel_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hotel_amenities (
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (hotel_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_per_night NUMERIC(12,0) NOT NULL,
  max_guests INT DEFAULT 2,
  bed_type TEXT,
  room_size NUMERIC(6,1),
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_room_types_hotel ON public.room_types(hotel_id);

CREATE TABLE IF NOT EXISTS public.room_amenities (
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['hotel_images','hotel_tags','amenities','hotel_amenities','room_types','room_amenities'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_select_all') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t||'_select_all', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_admin_all') THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (public.is_admin())', t||'_admin_all', t);
    END IF;
  END LOOP;
END $$;

INSERT INTO public.amenities (name, icon, category) VALUES
  ('Wifi miễn phí', 'Wifi', 'general'),
  ('Hồ bơi', 'Waves', 'hotel'),
  ('Bãi đỗ xe', 'Car', 'hotel'),
  ('Nhà hàng', 'UtensilsCrossed', 'hotel'),
  ('Điều hòa', 'AirVent', 'room'),
  ('TV', 'Tv', 'room')
ON CONFLICT (name) DO NOTHING;

-- ===== WISHLISTS (Lưu yêu thích) =====
DO $$ BEGIN
  CREATE TYPE public.wishlist_target_type AS ENUM ('destination', 'hotel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.wishlist_target_type NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wishlists' AND policyname='wishlists_select_own') THEN
    CREATE POLICY wishlists_select_own ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wishlists' AND policyname='wishlists_insert_own') THEN
    CREATE POLICY wishlists_insert_own ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wishlists' AND policyname='wishlists_delete_own') THEN
    CREATE POLICY wishlists_delete_own ON public.wishlists FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
