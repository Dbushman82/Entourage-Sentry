-- Drop existing table if needed
DROP TABLE IF EXISTS api_keys;

-- Create API Keys table
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  documentation_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add indexes
CREATE INDEX idx_api_keys_name ON api_keys(name);
CREATE INDEX idx_api_keys_created_by ON api_keys(created_by);