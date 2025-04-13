-- Add assessment_id column to custom_question_responses table
ALTER TABLE custom_question_responses 
ADD COLUMN assessment_id INTEGER REFERENCES assessments(id);

-- Create an index on assessment_id to improve query performance
CREATE INDEX idx_custom_question_responses_assessment_id ON custom_question_responses(assessment_id);

-- Create an index on the pair (question_id, assessment_id) for faster lookups
CREATE INDEX idx_custom_question_responses_question_assessment ON custom_question_responses(question_id, assessment_id);
