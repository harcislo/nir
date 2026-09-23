ALTER TABLE sessions ADD COLUMN token_hash char(64);

UPDATE sessions
SET token_hash = encode(digest(id::text, 'sha256'), 'hex')
WHERE token_hash IS NULL;

ALTER TABLE sessions ALTER COLUMN token_hash SET NOT NULL;
ALTER TABLE sessions ADD CONSTRAINT sessions_token_hash_unique UNIQUE (token_hash);

