-- Add industry_id column to assessments table
ALTER TABLE assessments ADD COLUMN industry_id INTEGER REFERENCES industries(id);

-- Update the schema version
INSERT INTO schema_migrations (version)
VALUES ('02-add-industry-id-to-assessments');