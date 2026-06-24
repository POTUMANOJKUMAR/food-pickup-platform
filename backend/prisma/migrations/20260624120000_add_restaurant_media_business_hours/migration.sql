-- Migration: add BusinessHours, RestaurantSettings, RestaurantMedia

CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  day varchar(20) NOT NULL,
  open_time varchar(10) NOT NULL,
  close_time varchar(10) NOT NULL,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_hours_restaurant_id ON business_hours(restaurant_id);

CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid UNIQUE NOT NULL,
  tagline varchar(255),
  cuisine varchar(255),
  city varchar(100),
  state varchar(100),
  pincode varchar(20),
  email varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_settings_restaurant_id ON restaurant_settings(restaurant_id);

CREATE TABLE IF NOT EXISTS restaurant_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  type varchar(50) NOT NULL,
  url varchar(500) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_media_restaurant_id ON restaurant_media(restaurant_id);

-- Add foreign keys linking to restaurants
ALTER TABLE business_hours
  ADD CONSTRAINT fk_business_hours_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

ALTER TABLE restaurant_settings
  ADD CONSTRAINT fk_restaurant_settings_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

ALTER TABLE restaurant_media
  ADD CONSTRAINT fk_restaurant_media_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
