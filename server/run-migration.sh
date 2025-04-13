#!/bin/bash

# Make the script exit on any error
set -e

echo "Starting migration process..."

# Run the migration script
echo "Running migration to add assessment_id to custom_question_responses table..."
tsx server/migrations/run-migration.ts

echo "Migration completed successfully!"