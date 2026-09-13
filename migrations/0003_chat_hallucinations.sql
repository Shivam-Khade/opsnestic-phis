CREATE TABLE IF NOT EXISTS chat_hallucination_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  was_hallucinated TINYINT(1) NOT NULL,
  user_decision ENUM('hallucination', 'factual') NULL,
  user_reasoning TEXT NULL,
  is_correct TINYINT(1) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_hallucination_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
