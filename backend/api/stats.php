<?php
// backend/api/stats.php

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    respondJson(['error' => 'Method not allowed'], 405);
}

try {
    // 1. Total players
    $totalPlayers = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE is_admin = 0")->fetchColumn();
    
    // 2. Average points
    $avgPoints = (float)$pdo->query("SELECT IFNULL(AVG(points_total), 0) FROM users WHERE is_admin = 0")->fetchColumn();
    
    // 3. Favorite teams (Top 5)
    $stmtFav = $pdo->query("
        SELECT favorite_team AS code, t.name, COUNT(*) AS count 
        FROM users u
        JOIN teams t ON u.favorite_team = t.code
        WHERE u.is_admin = 0 AND favorite_team IS NOT NULL AND favorite_team != ''
        GROUP BY favorite_team 
        ORDER BY count DESC 
        LIMIT 5
    ");
    $favTeams = $stmtFav->fetchAll();
    
    // 4. Champion predictions (Top 5)
    $stmtChamp = $pdo->query("
        SELECT champion_predicted_code AS code, t.name, COUNT(*) AS count 
        FROM users u
        JOIN teams t ON u.champion_predicted_code = t.code
        WHERE u.is_admin = 0 AND champion_predicted_code IS NOT NULL AND champion_predicted_code != ''
        GROUP BY champion_predicted_code 
        ORDER BY count DESC 
        LIMIT 5
    ");
    $champPredictions = $stmtChamp->fetchAll();
    
    // 5. Total group predictions placed
    $totalPredictions = (int)$pdo->query("SELECT COUNT(*) FROM group_predictions")->fetchColumn() +
                         (int)$pdo->query("SELECT COUNT(*) FROM bracket_predictions")->fetchColumn();
                         
    // 6. Finished matches count
    $finishedMatches = (int)$pdo->query("SELECT COUNT(*) FROM matches WHERE finished = 1")->fetchColumn();
    
    respondJson([
        'status' => 'success',
        'stats' => [
            'total_players' => $totalPlayers,
            'average_points' => round($avgPoints, 1),
            'favorite_teams' => $favTeams,
            'champion_predictions' => $champPredictions,
            'total_predictions_placed' => $totalPredictions,
            'finished_matches' => $finishedMatches
        ]
    ]);
    
} catch (Exception $e) {
    respondJson(['error' => 'Error al recopilar estadísticas: ' . $e->getMessage()], 500);
}
