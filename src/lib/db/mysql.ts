import { createPool } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Verify MySQL environment variables
const {
  MYSQL_HOST = 'localhost',
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_PORT,
  MYSQL_SOCKET_PATH,
  MYSQL_SSL
} = process.env;

if (!MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
  throw new Error('Missing required MySQL environment variables');
}

// Parse SSL config if provided
let sslConfig = undefined;
if (MYSQL_SSL) {
  try {
    sslConfig = JSON.parse(MYSQL_SSL);
  } catch (error) {
    console.error('Error parsing MYSQL_SSL config:', error);
  }
}

// Create connection config
const connectionConfig: any = {
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Add port if specified
if (MYSQL_PORT) {
  connectionConfig.port = parseInt(MYSQL_PORT, 10);
}

// Add socket path if specified (for Google Cloud SQL socket connections)
if (MYSQL_SOCKET_PATH) {
  connectionConfig.socketPath = MYSQL_SOCKET_PATH;
}

// Add SSL if specified
if (sslConfig) {
  connectionConfig.ssl = sslConfig;
}

// Create the connection pool
export const mysqlPool = createPool(connectionConfig);

export async function initializeMysql() {
  const connection = await mysqlPool.getConnection();
  try {
    // Create students table first
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        ern_number VARCHAR(10) UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        branch VARCHAR(50),
        batch_year INTEGER,
        section VARCHAR(5),
        mobile_number VARCHAR(15),
        password VARCHAR(255),
        first_login BOOLEAN DEFAULT TRUE,
        interests JSON DEFAULT NULL,
        profile_pic_url TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_ern (ern_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create messaging tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id BIGINT,
        student_id BIGINT,
        PRIMARY KEY (conversation_id, student_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT,
        sender_id BIGINT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id),
        FOREIGN KEY (sender_id) REFERENCES students(id),
        INDEX idx_conversation (conversation_id),
        INDEX idx_sender (sender_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } finally {
    connection.release();
  }
} 