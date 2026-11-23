ALTER TABLE "clips"
  ADD COLUMN IF NOT EXISTS "category_id" bigint REFERENCES "categories" (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clip_category ON "clips" (category_id);
