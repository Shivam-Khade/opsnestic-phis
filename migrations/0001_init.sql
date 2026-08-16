-- Migration: 0001_init.sql
-- Creates the foundational tables: users, categories, difficulty_levels,
-- scenarios, scenario_indicators, validation_results

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS difficulty_levels (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(50) NOT NULL,
  slug         VARCHAR(50) NOT NULL UNIQUE,
  numeric_rank TINYINT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scenarios (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id               INT UNSIGNED NOT NULL,
  difficulty_id             INT UNSIGNED NOT NULL,
  sender                    VARCHAR(500) NOT NULL,
  recipient                 VARCHAR(500) NOT NULL,
  subject                   VARCHAR(500) NOT NULL,
  body                      LONGTEXT NOT NULL,
  is_phishing               TINYINT(1) NOT NULL DEFAULT 0,
  source                    ENUM('ai_generated', 'fallback') NOT NULL DEFAULT 'ai_generated',
  validation_status         ENUM('passed', 'failed', 'pending') NOT NULL DEFAULT 'pending',
  explanation               TEXT NOT NULL,
  recommended_training_skill VARCHAR(100) NULL,
  created_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scenarios_category  FOREIGN KEY (category_id)  REFERENCES categories(id)         ON DELETE RESTRICT,
  CONSTRAINT fk_scenarios_difficulty FOREIGN KEY (difficulty_id) REFERENCES difficulty_levels(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scenario_indicators (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scenario_id    INT UNSIGNED NOT NULL,
  indicator_type VARCHAR(100) NOT NULL,
  description    TEXT NOT NULL,
  is_present     TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_indicators_scenario FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS validation_results (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scenario_id   INT UNSIGNED NOT NULL,
  passed        TINYINT(1) NOT NULL DEFAULT 0,
  failed_checks JSON NOT NULL,
  retry_count   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  used_fallback TINYINT(1) NOT NULL DEFAULT 0,
  validated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_validation_scenario FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
