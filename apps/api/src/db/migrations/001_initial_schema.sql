CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login varchar(100) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_name varchar(255) NOT NULL,
  sample_number varchar(100) NOT NULL,
  organization varchar(255),
  customer varchar(255),
  mode1 varchar(255),
  mode2 varchar(255),
  mode3 varchar(255),
  measurement_date date NOT NULL,
  measurement_time time,
  is_reference boolean NOT NULL DEFAULT false,
  is_repair boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL UNIQUE REFERENCES measurements(id) ON DELETE CASCADE,
  original_name varchar(255) NOT NULL,
  object_key text NOT NULL UNIQUE,
  size integer NOT NULL CHECK (size >= 0 AND size <= 10240),
  mime_type varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX measurements_date_idx ON measurements (measurement_date DESC);
CREATE INDEX measurements_reference_idx ON measurements (is_reference);
CREATE INDEX measurements_repair_idx ON measurements (is_repair);
CREATE INDEX measurements_sample_name_trgm_idx ON measurements USING gin (sample_name gin_trgm_ops);
CREATE INDEX measurements_sample_number_trgm_idx ON measurements USING gin (sample_number gin_trgm_ops);
CREATE INDEX measurements_organization_trgm_idx ON measurements USING gin (organization gin_trgm_ops);
CREATE INDEX measurements_customer_trgm_idx ON measurements USING gin (customer gin_trgm_ops);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER measurements_set_updated_at
BEFORE UPDATE ON measurements
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

