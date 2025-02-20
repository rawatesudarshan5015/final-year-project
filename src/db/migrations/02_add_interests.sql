-- Check if interests column exists
SELECT COUNT(*) INTO @column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'interests';

-- Add column if it doesn't exist
SET @sql = CASE 
  WHEN @column_exists = 0 THEN 
    'ALTER TABLE students ADD COLUMN interests JSON DEFAULT NULL'
  ELSE 
    'SELECT ''Column interests already exists'' AS message'
END;

SELECT @sql AS migration_sql;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'interests'
    ) 
    THEN 'SELECT ''Column interests already exists'' AS message'
    ELSE 'ALTER TABLE students ADD COLUMN interests JSON DEFAULT NULL'
  END AS migration_sql; 