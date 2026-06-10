<?php
// backend/utils/scoring.php

require_once __DIR__ . '/../config/db.php';

/**
 * Recalcula los puntos y aciertos totales para un usuario.
 * Retorna un desglose detallado de los puntos.
 */
function recalculateUserPoints($userId) {
    $db = getDBConnection();

    // Inicializar desglose
    $breakdown = [
        'groups' => 0,
        'round_of_32' => 0,
        'round_of_16' => 0,
        'quarters' => 0,
        'semis' => 0,
        'final' => 0,
        'bonus_quarters' => 0,
        'bonus_semis' => 0,
        'bonus_finalists' => 0,
        'bonus_champion' => 0,
        'total' => 0,
        'hits_groups' => 0,
        'hits_eliminatory' => 0,
        'hits_total' => 0
    ];

    // 1. PUNTOS POR FASE DE GRUPOS (+1 punto por acierto, +1 punto adicional por marcador exacto)
    $stmt = $db->prepare("
        SELECT gp.prediction, gp.predicted_team_a_score, gp.predicted_team_b_score, m.team_a_score, m.team_b_score 
        FROM group_predictions gp
        JOIN matches m ON gp.match_id = m.id
        WHERE gp.user_id = :user_id AND m.stage = 'GROUPS' AND m.finished = 1
    ");
    $stmt->execute(['user_id' => $userId]);
    $groupPredictions = $stmt->fetchAll();

    foreach ($groupPredictions as $gp) {
        $actualResult = 'DRAW';
        if ($gp['team_a_score'] > $gp['team_b_score']) {
            $actualResult = 'A';
        } elseif ($gp['team_a_score'] < $gp['team_b_score']) {
            $actualResult = 'B';
        }

        if ($gp['prediction'] === $actualResult) {
            $pts = 1;
            // Verificar si el marcador coincide exactamente
            if ($gp['predicted_team_a_score'] !== null && $gp['predicted_team_b_score'] !== null &&
                intval($gp['predicted_team_a_score']) === intval($gp['team_a_score']) &&
                intval($gp['predicted_team_b_score']) === intval($gp['team_b_score'])) {
                $pts += 1; // +1 adicional (total 2)
            }
            $breakdown['groups'] += $pts;
            $breakdown['hits_groups'] += 1;
        }
    }

    // 2. PUNTOS POR FASE ELIMINATORIA (Dieciseisavos a Final, con bonos por marcador exacto)
    $stagePoints = [
        'ROUND_OF_32' => 2,
        'ROUND_OF_16' => 5,
        'QUARTERS' => 10,
        'SEMIS' => 15,
        'FINAL' => 25
    ];

    $stageExactPoints = [
        'ROUND_OF_32' => 2,
        'ROUND_OF_16' => 3,
        'QUARTERS' => 5,
        'SEMIS' => 5,
        'FINAL' => 10
    ];

    $stmt = $db->prepare("
        SELECT bp.stage, bp.winner_code as predicted_winner, m.winner_code as official_winner,
               bp.predicted_team_a_score, bp.predicted_team_b_score, m.team_a_score, m.team_b_score
        FROM bracket_predictions bp
        JOIN matches m ON m.stage = bp.stage AND m.match_index = bp.match_index
        WHERE bp.user_id = :user_id AND m.finished = 1
    ");
    $stmt->execute(['user_id' => $userId]);
    $bracketPredictions = $stmt->fetchAll();

    foreach ($bracketPredictions as $bp) {
        if ($bp['predicted_winner'] === $bp['official_winner']) {
            $pts = $stagePoints[$bp['stage']] ?? 0;
            
            // Verificar si el marcador coincide exactamente
            if ($bp['predicted_team_a_score'] !== null && $bp['predicted_team_b_score'] !== null &&
                intval($bp['predicted_team_a_score']) === intval($bp['team_a_score']) &&
                intval($bp['predicted_team_b_score']) === intval($bp['team_b_score'])) {
                $pts += $stageExactPoints[$bp['stage']] ?? 0;
            }
            
            $stageKey = strtolower($bp['stage']);
            if ($stageKey === 'round_of_32') $breakdown['round_of_32'] += $pts;
            elseif ($stageKey === 'round_of_16') $breakdown['round_of_16'] += $pts;
            elseif ($stageKey === 'quarters') $breakdown['quarters'] += $pts;
            elseif ($stageKey === 'semis') $breakdown['semis'] += $pts;
            elseif ($stageKey === 'final') $breakdown['final'] += $pts;

            $breakdown['hits_eliminatory'] += 1;
        }
    }

    // 3. BONOS POR CLASIFICADOS

    // A. Bonus Cuartos (+10 por equipo que llegue a Cuartos de Final)
    // Equipos oficiales en Cuartos de Final (los que juegan en la ronda QUARTERS)
    $stmt = $db->query("
        SELECT DISTINCT team_code FROM (
            SELECT team_a_code AS team_code FROM matches WHERE stage = 'QUARTERS'
            UNION 
            SELECT team_b_code AS team_code FROM matches WHERE stage = 'QUARTERS'
        ) as t WHERE team_code IS NOT NULL AND team_code != ''
    ");
    $officialQuarters = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($officialQuarters)) {
        // Equipos predichos por el usuario para Cuartos de Final (ganadores de ROUND_OF_16)
        $stmt = $db->prepare("
            SELECT winner_code FROM bracket_predictions 
            WHERE user_id = :user_id AND stage = 'ROUND_OF_16'
        ");
        $stmt->execute(['user_id' => $userId]);
        $predictedQuarters = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $correctQuarters = array_intersect($officialQuarters, $predictedQuarters);
        $breakdown['bonus_quarters'] = count($correctQuarters) * 10;
    }

    // B. Bonus Semis (+15 por equipo que llegue a Semifinales)
    $stmt = $db->query("
        SELECT DISTINCT team_code FROM (
            SELECT team_a_code AS team_code FROM matches WHERE stage = 'SEMIS'
            UNION 
            SELECT team_b_code AS team_code FROM matches WHERE stage = 'SEMIS'
        ) as t WHERE team_code IS NOT NULL AND team_code != ''
    ");
    $officialSemis = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($officialSemis)) {
        // Equipos predichos por el usuario para Semis (ganadores de QUARTERS)
        $stmt = $db->prepare("
            SELECT winner_code FROM bracket_predictions 
            WHERE user_id = :user_id AND stage = 'QUARTERS'
        ");
        $stmt->execute(['user_id' => $userId]);
        $predictedSemis = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $correctSemis = array_intersect($officialSemis, $predictedSemis);
        $breakdown['bonus_semis'] = count($correctSemis) * 15;
    }

    // C. Bonus Finalistas (+25 por equipo que llegue a la Final)
    $stmt = $db->query("
        SELECT DISTINCT team_code FROM (
            SELECT team_a_code AS team_code FROM matches WHERE stage = 'FINAL'
            UNION 
            SELECT team_b_code AS team_code FROM matches WHERE stage = 'FINAL'
        ) as t WHERE team_code IS NOT NULL AND team_code != ''
    ");
    $officialFinalists = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($officialFinalists)) {
        // Equipos predichos por el usuario para la Final (ganadores de SEMIS)
        $stmt = $db->prepare("
            SELECT winner_code FROM bracket_predictions 
            WHERE user_id = :user_id AND stage = 'SEMIS'
        ");
        $stmt->execute(['user_id' => $userId]);
        $predictedFinalists = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $correctFinalists = array_intersect($officialFinalists, $predictedFinalists);
        $breakdown['bonus_finalists'] = count($correctFinalists) * 25;
    }

    // D. Bonus Campeón (+50 puntos)
    // Ganador oficial de la final
    $stmt = $db->query("SELECT winner_code FROM matches WHERE stage = 'FINAL' AND finished = 1 LIMIT 1");
    $officialChampion = $stmt->fetchColumn();

    if ($officialChampion) {
        // Obtener el campeón predicho del perfil del usuario
        $stmt = $db->prepare("SELECT champion_predicted_code FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $predictedChampion = $stmt->fetchColumn();

        if ($predictedChampion && $predictedChampion === $officialChampion) {
            $breakdown['bonus_champion'] = 50;
        }
    }

    // 4. CALCULAR TOTALES
    $breakdown['total'] = $breakdown['groups'] + $breakdown['round_of_32'] + $breakdown['round_of_16'] + 
                          $breakdown['quarters'] + $breakdown['semis'] + $breakdown['final'] + 
                          $breakdown['bonus_quarters'] + $breakdown['bonus_semis'] + 
                          $breakdown['bonus_finalists'] + $breakdown['bonus_champion'];

    $breakdown['hits_total'] = $breakdown['hits_groups'] + $breakdown['hits_eliminatory'];

    // Actualizar base de datos
    $updateStmt = $db->prepare("
        UPDATE users 
        SET points_total = :points, hits_total = :hits_total, hits_eliminatory = :hits_el 
        WHERE id = :user_id
    ");
    $updateStmt->execute([
        'points' => $breakdown['total'],
        'hits_total' => $breakdown['hits_total'],
        'hits_el' => $breakdown['hits_eliminatory'],
        'user_id' => $userId
    ]);

    return $breakdown;
}

/**
 * Recalcula los puntajes de todos los usuarios en el sistema y toma una foto del ranking.
 */
function recalculateAllUsers() {
    $db = getDBConnection();
    $users = $db->query("SELECT id FROM users")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($users as $userId) {
        recalculateUserPoints($userId);
    }
    takeRankingSnapshot();
}

/**
 * Toma una captura diaria de la posición de cada usuario para la gráfica de evolución.
 */
function takeRankingSnapshot() {
    $db = getDBConnection();
    
    // Obtener tabla general ordenada
    $stmt = $db->query("
        SELECT id, points_total 
        FROM users 
        ORDER BY points_total DESC, hits_total DESC, hits_eliminatory DESC, id ASC
    ");
    $leaderboard = $stmt->fetchAll();
    
    $today = date('Y-m-d');
    
    $db->beginTransaction();
    try {
        $pos = 1;
        $insertStmt = $db->prepare("
            INSERT INTO ranking_history (user_id, ranking_date, points, position) 
            VALUES (:user_id, :ranking_date, :points, :position)
            ON DUPLICATE KEY UPDATE points = :points2, position = :position2
        ");
        foreach ($leaderboard as $row) {
            $insertStmt->execute([
                'user_id' => $row['id'],
                'ranking_date' => $today,
                'points' => $row['points_total'],
                'position' => $pos,
                'points2' => $row['points_total'],
                'position2' => $pos
            ]);
            $pos++;
        }
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
    }
}

