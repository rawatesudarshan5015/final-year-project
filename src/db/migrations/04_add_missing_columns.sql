-- Check if mobile_number column exists
SELECT COUNT(*) INTO @column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'mobile_number';

SET @sql = CASE 
  WHEN @column_exists = 0 THEN 
    'ALTER TABLE students ADD COLUMN mobile_number VARCHAR(15)'
  ELSE 
    'SELECT ''Column mobile_number already exists'' AS message'
END;

SELECT @sql AS migration_sql;

-- Check if interests column exists
SELECT COUNT(*) INTO @column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'interests';

SET @sql = CASE 
  WHEN @column_exists = 0 THEN 
    'ALTER TABLE students ADD COLUMN interests JSON DEFAULT NULL'
  ELSE 
    'SELECT ''Column interests already exists'' AS message'
END;

SELECT @sql AS migration_sql; 