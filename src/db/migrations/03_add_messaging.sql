-- Add interests column if not already added
ALTER TABLE students
ADD COLUMN IF NOT EXISTS interests JSON DEFAULT NULL;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id BIGINT UNSIGNED,
  student_id BIGINT UNSIGNED,
  PRIMARY KEY (conversation_id, student_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
); 