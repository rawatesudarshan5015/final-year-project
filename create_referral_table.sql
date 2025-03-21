USE college_social;

CREATE TABLE IF NOT EXISTS referral_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT NOT NULL,
  alumni_id BIGINT NOT NULL,
  post_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  resume_url VARCHAR(255),
  status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (alumni_id) REFERENCES students(id)
); 