<?php
// backend/config/setup_db.php

require_once __DIR__ . '/db.php';

// If running from web, show JSON. If CLI, print text.
$is_cli = (php_sapi_name() === 'cli');

if (!$is_cli) {
    header('Content-Type: application/json');
}

try {
    // Connect without selecting DB to create it first
    $pdo = getDBConnection(false);
    
    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `" . DB_NAME . "`");
    
    if ($is_cli) echo "Database created/selected successfully.\n";
    
    // Create Tables
    $queries = [
        "users" => "CREATE TABLE IF NOT EXISTS users (
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        
        "teams" => "CREATE TABLE IF NOT EXISTS teams (
            code VARCHAR(10) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            group_name CHAR(1) NOT NULL,
            logo_url VARCHAR(255) NULL,
            eliminated BOOLEAN DEFAULT FALSE
        )",
        
        "matches" => "CREATE TABLE IF NOT EXISTS matches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            stage ENUM('GROUPS', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERS', 'SEMIS', 'FINAL') NOT NULL,
            group_name CHAR(1) NULL,
            match_index INT NULL,
            team_a_code VARCHAR(10) NOT NULL,
            team_b_code VARCHAR(10) NOT NULL,
            team_a_score INT NULL,
            team_b_score INT NULL,
            winner_code VARCHAR(10) NULL,
            match_date DATETIME NOT NULL,
            finished BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (team_a_code) REFERENCES teams(code) ON DELETE CASCADE,
            FOREIGN KEY (team_b_code) REFERENCES teams(code) ON DELETE CASCADE,
            FOREIGN KEY (winner_code) REFERENCES teams(code) ON DELETE SET NULL
        )",
        
        "group_predictions" => "CREATE TABLE IF NOT EXISTS group_predictions (
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
        )",
        
        "bracket_predictions" => "CREATE TABLE IF NOT EXISTS bracket_predictions (
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
        )",
        
        "leagues" => "CREATE TABLE IF NOT EXISTS leagues (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(10) NOT NULL UNIQUE,
            creator_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        
        "league_members" => "CREATE TABLE IF NOT EXISTS league_members (
            league_id INT NOT NULL,
            user_id INT NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (league_id, user_id),
            FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )",
        
        "ranking_history" => "CREATE TABLE IF NOT EXISTS ranking_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            ranking_date DATE NOT NULL,
            points INT NOT NULL,
            position INT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY user_date (user_id, ranking_date)
        )"
    ];
    
    // Drop all tables first to allow recreating them with new columns
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("DROP TABLE IF EXISTS ranking_history;");
    $pdo->exec("DROP TABLE IF EXISTS league_members;");
    $pdo->exec("DROP TABLE IF EXISTS leagues;");
    $pdo->exec("DROP TABLE IF EXISTS bracket_predictions;");
    $pdo->exec("DROP TABLE IF EXISTS group_predictions;");
    $pdo->exec("DROP TABLE IF EXISTS matches;");
    $pdo->exec("DROP TABLE IF EXISTS teams;");
    $pdo->exec("DROP TABLE IF EXISTS users;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    
    foreach ($queries as $tableName => $sql) {
        $pdo->exec($sql);
        if ($is_cli) echo "Table '$tableName' verified/created.\n";
    }
    
    // Seed Teams (48 teams: 12 groups A to L, 4 teams per group)
    $groups = [
        'A' => [
            ['USA', 'Estados Unidos'],
            ['PAN', 'Panamá'],
            ['JAM', 'Jamaica'],
            ['CIV', 'Costa de Marfil']
        ],
        'B' => [
            ['MEX', 'México'],
            ['ECU', 'Ecuador'],
            ['AUS', 'Australia'],
            ['NGA', 'Nigeria']
        ],
        'C' => [
            ['CAN', 'Canadá'],
            ['PER', 'Perú'],
            ['MAR', 'Marruecos'],
            ['JPN', 'Japón']
        ],
        'D' => [
            ['ARG', 'Argentina'],
            ['ENG', 'Inglaterra'],
            ['SEN', 'Senegal'],
            ['KOR', 'Corea del Sur']
        ],
        'E' => [
            ['BRA', 'Brasil'],
            ['GER', 'Alemania'],
            ['GHA', 'Ghana'],
            ['IRN', 'Irán']
        ],
        'F' => [
            ['FRA', 'Francia'],
            ['COL', 'Colombia'],
            ['EGY', 'Egipto'],
            ['KSA', 'Arabia Saudita']
        ],
        'G' => [
            ['ESP', 'España'],
            ['URU', 'Uruguay'],
            ['DZA', 'Argelia'],
            ['IRQ', 'Irak']
        ],
        'H' => [
            ['ITA', 'Italia'],
            ['CHI', 'Chile'],
            ['CMR', 'Camerún'],
            ['QAT', 'Catar']
        ],
        'I' => [
            ['POR', 'Portugal'],
            ['NED', 'Países Bajos'],
            ['CRC', 'Costa Rica'],
            ['RSA', 'Sudáfrica']
        ],
        'J' => [
            ['BEL', 'Bélgica'],
            ['CRO', 'Croacia'],
            ['PAR', 'Paraguay'],
            ['TUN', 'Túnez']
        ],
        'K' => [
            ['UKR', 'Ucrania'],
            ['SUI', 'Suiza'],
            ['VEN', 'Venezuela'],
            ['MLI', 'Malí']
        ],
        'L' => [
            ['DEN', 'Dinamarca'],
            ['SWE', 'Suecia'],
            ['BOL', 'Bolivia'],
            ['NZL', 'Nueva Zelanda']
        ]
    ];
    
    // Insert Teams
    $stmtTeam = $pdo->prepare("INSERT INTO teams (code, name, group_name, logo_url) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)");
    foreach ($groups as $groupChar => $teamsList) {
        foreach ($teamsList as $team) {
            $code = $team[0];
            $name = $team[1];
            $logoUrl = "https://flagcdn.com/w80/" . strtolower(substr($code, 0, 2)) . ".png";
            // Adjust exceptions for flags
            if ($code === 'USA') $logoUrl = "https://flagcdn.com/w80/us.png";
            if ($code === 'MEX') $logoUrl = "https://flagcdn.com/w80/mx.png";
            if ($code === 'JAM') $logoUrl = "https://flagcdn.com/w80/jm.png";
            if ($code === 'SEN') $logoUrl = "https://flagcdn.com/w80/sn.png";
            if ($code === 'KOR') $logoUrl = "https://flagcdn.com/w80/kr.png";
            if ($code === 'IRQ') $logoUrl = "https://flagcdn.com/w80/iq.png";
            if ($code === 'TUN') $logoUrl = "https://flagcdn.com/w80/tn.png";
            if ($code === 'UKR') $logoUrl = "https://flagcdn.com/w80/ua.png";
            if ($code === 'ENG') $logoUrl = "https://flagcdn.com/w80/gb-eng.png";
            if ($code === 'GER') $logoUrl = "https://flagcdn.com/w80/de.png";
            if ($code === 'POR') $logoUrl = "https://flagcdn.com/w80/pt.png";
            if ($code === 'DEN') $logoUrl = "https://flagcdn.com/w80/dk.png";
            if ($code === 'CRO') $logoUrl = "https://flagcdn.com/w80/hr.png";
            if ($code === 'SUI') $logoUrl = "https://flagcdn.com/w80/ch.png";
            if ($code === 'SWE') $logoUrl = "https://flagcdn.com/w80/se.png";
            if ($code === 'RSA') $logoUrl = "https://flagcdn.com/w80/za.png";
            if ($code === 'NGA') $logoUrl = "https://flagcdn.com/w80/ng.png";
            if ($code === 'KSA') $logoUrl = "https://flagcdn.com/w80/sa.png";
            if ($code === 'CHI') $logoUrl = "https://flagcdn.com/w80/cl.png";
            if ($code === 'URU') $logoUrl = "https://flagcdn.com/w80/uy.png";
            if ($code === 'PAR') $logoUrl = "https://flagcdn.com/w80/py.png";
            
            $stmtTeam->execute([$code, $name, $groupChar, $logoUrl]);
        }
    }
    if ($is_cli) echo "Teams seeded successfully.\n";
    
    // Seed Group Matches (72 matches)
    // Clear matches table to prevent duplication issues or regenerate cleanly
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0; TRUNCATE TABLE matches; SET FOREIGN_KEY_CHECKS = 1;");
    
    $stmtMatch = $pdo->prepare("INSERT INTO matches (stage, group_name, team_a_code, team_b_code, match_date) VALUES ('GROUPS', ?, ?, ?, ?)");
    
    $startDate = new DateTime('2026-06-11 15:00:00');
    $matchIntervalHours = 4; // Space matches by 4 hours
    
    foreach ($groups as $groupChar => $teamsList) {
        // Round Robin pairings for 4 teams
        $pairings = [
            [0, 1], // Match 1
            [2, 3], // Match 2
            [0, 2], // Match 3
            [1, 3], // Match 4
            [0, 3], // Match 5
            [1, 2]  // Match 6
        ];
        
        foreach ($pairings as $pair) {
            $teamA = $teamsList[$pair[0]][0];
            $teamB = $teamsList[$pair[1]][0];
            
            // Format match date
            $dateStr = $startDate->format('Y-m-d H:i:s');
            $stmtMatch->execute([$groupChar, $teamA, $teamB, $dateStr]);
            
            // Increment date for the next match
            $startDate->modify("+$matchIntervalHours hours");
        }
    }
    if ($is_cli) echo "Group matches seeded successfully.\n";

    // Seed Admin Account
    $adminEmail = 'admin@polla.com';
    $adminPasswordHash = password_hash('M1un1c4cl4v3', PASSWORD_DEFAULT);
    $stmtAdmin = $pdo->prepare("INSERT INTO users (name, email, password_hash, is_admin, country) VALUES ('Administrador', ?, ?, 1, 'México') ON DUPLICATE KEY UPDATE is_admin=1, password_hash=VALUES(password_hash)");
    $stmtAdmin->execute([$adminEmail, $adminPasswordHash]);
    if ($is_cli) echo "Admin account seeded successfully.\n";

    // Seed a couple of test users for ranking demonstration (starting at 0 points/hits for clean testing)
    $testUsers = [
        ['Juan Perez', 'juan@gmail.com', 'user123', 'Marketing Alterno', 'ARG', 0, 0, 0],
        ['Maria Lopez', 'maria@gmail.com', 'user123', 'Soporte Promocional', 'COL', 0, 0, 0],
        ['Carlos Silva', 'carlos@gmail.com', 'user123', 'TYS365', 'BRA', 0, 0, 0],
        ['Diego Maradona', 'diego@gmail.com', 'user123', 'Marketing Alterno', 'ARG', 0, 0, 0]
    ];
    
    $stmtUser = $pdo->prepare("INSERT IGNORE INTO users (name, email, password_hash, country, favorite_team, points_total, hits_total, hits_eliminatory) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($testUsers as $u) {
        $hash = password_hash($u[2], PASSWORD_DEFAULT);
        $stmtUser->execute([$u[0], $u[1], $hash, $u[3], $u[4], $u[5], $u[6], $u[7]]);
    }
    if ($is_cli) echo "Test users seeded successfully.\n";
    
    // Historic rankings are not seeded for a completely clean slate during testing.
    // If needed, they will populate as the user plays.

    // Add foreign key constraint to users table for champion_predicted_code
    try {
        $pdo->exec("ALTER TABLE users ADD CONSTRAINT fk_users_champion FOREIGN KEY (champion_predicted_code) REFERENCES teams(code) ON DELETE SET NULL");
    } catch (Exception $ex) {
        // Ignore if already exists
    }
    
    if ($is_cli) {
        echo "Database setup completed successfully.\n";
    } else {
        echo json_encode(['status' => 'success', 'message' => 'Database initialized successfully. Teams, matches, admin, and test users seeded.']);
    }
    
} catch (Exception $e) {
    if ($is_cli) {
        echo "Error: " . $e->getMessage() . "\n";
    } else {
        header('Content-Type: application/json', true, 500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
