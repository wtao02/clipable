CREATE TABLE IF NOT EXISTS "categories" (
  id          bigserial                 PRIMARY KEY,
  creator_id  bigint                    NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  name        varchar                   NOT NULL,
  created_at  timestamp with time zone  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_category_creator_name
  ON "categories" (creator_id, lower(name));
