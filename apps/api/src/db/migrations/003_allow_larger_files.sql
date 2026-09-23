ALTER TABLE files
  DROP CONSTRAINT IF EXISTS files_size_check;

ALTER TABLE files
  ADD CONSTRAINT files_size_check CHECK (size >= 0 AND size <= 10485760);
