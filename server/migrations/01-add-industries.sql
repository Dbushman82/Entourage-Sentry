-- Create industries table
CREATE TABLE IF NOT EXISTS industries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES users(id)
);

-- Create junction table for question-industry relationships
CREATE TABLE IF NOT EXISTS question_industries (
  question_id INTEGER NOT NULL REFERENCES custom_questions(id) ON DELETE CASCADE,
  industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, industry_id)
);

-- Add question category enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_category') THEN
    CREATE TYPE question_category AS ENUM ('global', 'industry', 'assessment');
  END IF;
END
$$;

-- Alter custom_questions table to add category column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'custom_questions' AND column_name = 'category') THEN
    ALTER TABLE custom_questions 
    ADD COLUMN category question_category NOT NULL DEFAULT 'assessment';
  END IF;
END
$$;

-- Add some initial industry categories
INSERT INTO industries (name, description, created_by)
VALUES 
  ('Healthcare', 'Medical facilities, healthcare providers, and related services', 1),
  ('Finance', 'Banks, investment firms, insurance companies, and financial services', 1),
  ('Education', 'Schools, universities, educational technology, and training', 1),
  ('Manufacturing', 'Production facilities, factories, and industrial equipment', 1),
  ('Retail', 'Stores, e-commerce, and consumer goods companies', 1),
  ('Technology', 'Software development, IT services, and tech hardware', 1),
  ('Legal', 'Law firms, legal services, and compliance', 1),
  ('Construction', 'Building, contracting, and construction services', 1),
  ('Hospitality', 'Hotels, restaurants, and tourism services', 1),
  ('Professional Services', 'Consulting, accounting, and business services', 1)
ON CONFLICT (name) DO NOTHING;