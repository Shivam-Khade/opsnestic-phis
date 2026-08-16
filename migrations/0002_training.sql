-- Migration: 0002_training.sql
-- Creates training-session, attempt, performance, and skill tracking tables

CREATE TABLE IF NOT EXISTS training_sessions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at   DATETIME NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_attempts (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id          INT UNSIGNED NOT NULL,
  user_id             INT UNSIGNED NOT NULL,
  scenario_id         INT UNSIGNED NOT NULL,
  user_decision       ENUM('phishing', 'legitimate') NOT NULL,
  indicators_selected JSON NOT NULL,
  is_correct          TINYINT(1) NOT NULL DEFAULT 0,
  score               SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  responded_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_session  FOREIGN KEY (session_id)  REFERENCES training_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_user     FOREIGN KEY (user_id)     REFERENCES users(id)             ON DELETE CASCADE,
  CONSTRAINT fk_attempts_scenario FOREIGN KEY (scenario_id) REFERENCES scenarios(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_performance (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  category_id     INT UNSIGNED NOT NULL,
  indicator_type  VARCHAR(100) NOT NULL DEFAULT 'general',
  difficulty_id   INT UNSIGNED NOT NULL,
  correct_count   INT UNSIGNED NOT NULL DEFAULT 0,
  incorrect_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_updated    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_perf (user_id, category_id, indicator_type, difficulty_id),
  CONSTRAINT fk_perf_user       FOREIGN KEY (user_id)     REFERENCES users(id)             ON DELETE CASCADE,
  CONSTRAINT fk_perf_category   FOREIGN KEY (category_id) REFERENCES categories(id)        ON DELETE RESTRICT,
  CONSTRAINT fk_perf_difficulty FOREIGN KEY (difficulty_id) REFERENCES difficulty_levels(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_skills (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           INT UNSIGNED NOT NULL,
  skill_area        VARCHAR(100) NOT NULL,
  proficiency_level ENUM('strong', 'moderate', 'weak') NOT NULL DEFAULT 'moderate',
  accuracy_score    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_skill (user_id, skill_area),
  CONSTRAINT fk_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
