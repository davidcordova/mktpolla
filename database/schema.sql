-- Desactivar llaves foráneas temporalmente para recrear tablas si es necesario
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS ranking_history;
DROP TABLE IF EXISTS league_members;
DROP TABLE IF EXISTS leagues;
DROP TABLE IF EXISTS bracket_predictions;
DROP TABLE IF EXISTS group_predictions;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Tabla de Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    provider VARCHAR(50) DEFAULT 'email',
    provider_id VARCHAR(255) NULL,
    avatar_url VARCHAR(255) NULL,
    country VARCHAR(100) NULL,
    favorite_team VARCHAR(50) NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    points_total INT DEFAULT 0,
    hits_total INT DEFAULT 0,
    hits_eliminatory INT DEFAULT 0,
    champion_predicted_code VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_points (points_total DESC, hits_total DESC)
) ENGINE=InnoDB;

-- Tabla de Equipos
CREATE TABLE teams (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    group_name CHAR(1) NOT NULL, -- 'A' a 'L'
    logo_url VARCHAR(255) NULL,
    eliminated BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- Tabla de Partidos
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stage ENUM('GROUPS', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERS', 'SEMIS', 'FINAL') NOT NULL,
    group_name CHAR(1) NULL,
    match_index INT NULL, -- NULL para fase de grupos, 0+ para eliminatorias (bracket)
    team_a_code VARCHAR(10) NOT NULL,
    team_b_code VARCHAR(10) NOT NULL,
    team_a_score INT NULL,
    team_b_score INT NULL,
    winner_code VARCHAR(10) NULL,
    match_date DATETIME NOT NULL,
    finished BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (team_a_code) REFERENCES teams(code) ON DELETE CASCADE,
    FOREIGN KEY (team_b_code) REFERENCES teams(code) ON DELETE CASCADE,
    FOREIGN KEY (winner_code) REFERENCES teams(code) ON DELETE SET NULL,
    INDEX idx_stage (stage)
) ENGINE=InnoDB;

-- Tabla de Pronósticos de Fase de Grupos
CREATE TABLE group_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    match_id INT NOT NULL,
    prediction ENUM('A', 'DRAW', 'B') NOT NULL,
    predicted_team_a_score INT NULL,
    predicted_team_b_score INT NULL,
    points_awarded INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    UNIQUE KEY user_match (user_id, match_id)
) ENGINE=InnoDB;

-- Tabla de Pronósticos de Fase Eliminatoria (Bracket)
CREATE TABLE bracket_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    stage ENUM('ROUND_OF_32', 'ROUND_OF_16', 'QUARTERS', 'SEMIS', 'FINAL') NOT NULL,
    match_index INT NOT NULL,
    predicted_team_a_code VARCHAR(10) NOT NULL,
    predicted_team_b_code VARCHAR(10) NOT NULL,
    winner_code VARCHAR(10) NOT NULL,
    predicted_team_a_score INT NULL,
    predicted_team_b_score INT NULL,
    points_awarded INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (predicted_team_a_code) REFERENCES teams(code) ON DELETE CASCADE,
    FOREIGN KEY (predicted_team_b_code) REFERENCES teams(code) ON DELETE CASCADE,
    FOREIGN KEY (winner_code) REFERENCES teams(code) ON DELETE CASCADE,
    UNIQUE KEY user_stage_match (user_id, stage, match_index)
) ENGINE=InnoDB;

-- Tabla de Ligas Privadas
CREATE TABLE leagues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    creator_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Miembros de Ligas Privadas
CREATE TABLE league_members (
    league_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (league_id, user_id),
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Historial de Rankings
CREATE TABLE ranking_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ranking_date DATE NOT NULL,
    points INT NOT NULL,
    position INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY user_date (user_id, ranking_date)
) ENGINE=InnoDB;

-- Modificación en usuarios para agregar relación de campeón sugerido
ALTER TABLE users ADD FOREIGN KEY (champion_predicted_code) REFERENCES teams(code) ON DELETE SET NULL;
