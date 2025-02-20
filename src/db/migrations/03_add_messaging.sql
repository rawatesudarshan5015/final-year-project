-- Check if column exists first
SELECT COUNT(*) INTO @exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'students' 
AND column_name = 'interests';

-- Add column only if it doesn't exist
SET @query = IF(@exists = 0,
    'ALTER TABLE students ADD COLUMN interests JSON DEFAULT NULL',
    'SELECT "Column interests already exists" AS message'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if conversations table exists
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE()
AND table_name = 'conversations';

SET @sql = CASE 
  WHEN @table_exists = 0 THEN 
    'CREATE TABLE conversations (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
  ELSE 
    'SELECT ''Conversations table already exists'' AS message'
END;

SELECT @sql AS migration_sql;

-- Check if conversation_participants table exists
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE()
AND table_name = 'conversation_participants';

SET @sql = CASE 
  WHEN @table_exists = 0 THEN 
    'CREATE TABLE conversation_participants (
      conversation_id BIGINT,
      student_id BIGINT,
      PRIMARY KEY (conversation_id, student_id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
  ELSE 
    'SELECT ''Conversation participants table already exists'' AS message'
END;

SELECT @sql AS migration_sql;

-- Check if messages table exists
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.tables 
WHERE table_schema = DATABASE()
AND table_name = 'messages';

SET @sql = CASE 
  WHEN @table_exists = 0 THEN 
    'CREATE TABLE messages (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      conversation_id BIGINT,
      sender_id BIGINT,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES students(id),
      INDEX idx_conversation (conversation_id),
      INDEX idx_sender (sender_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
  ELSE 
    'SELECT ''Messages table already exists'' AS message'
END;

SELECT @sql AS migration_sql; 