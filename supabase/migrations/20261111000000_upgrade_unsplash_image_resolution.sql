-- Nâng độ phân giải ảnh mẫu Unsplash (w=600/800 bị mờ khi hiển thị full-width)
-- Idempotent: chỉ đổi những URL chưa có w=1920.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
    ('destinations', 'cover_image'),
    ('destination_images', 'image_url'),
    ('hotels', 'cover_image'),
    ('hotel_images', 'image_url'),
    ('room_types', 'image_url'),
    ('attractions', 'image_url'),
    ('tours', 'cover_image')
  ) AS v(tbl, col)
  LOOP
    EXECUTE format(
      'UPDATE %I SET %I = split_part(%I, ''?'', 1) || ''?w=1920&q=85&auto=format&fit=crop''
       WHERE %I LIKE ''%%images.unsplash.com%%'' AND %I NOT LIKE ''%%w=1920%%''',
      t.tbl, t.col, t.col, t.col, t.col
    );
  END LOOP;
END $$;
