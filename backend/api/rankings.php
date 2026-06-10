<?php
// backend/api/rankings.php

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$db = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'global') {
        // Obtener ranking actual general
        $stmt = $db->query("
            SELECT u.id, u.name, u.avatar_url, u.points_total, u.hits_total, u.favorite_team, u.country,
                   t.name AS champion_name, t.logo_url AS champion_logo, t.eliminated AS champion_eliminated,
                   u.champion_predicted_code
            FROM users u
            LEFT JOIN teams t ON u.champion_predicted_code = t.code
            ORDER BY u.points_total DESC, u.hits_total DESC, u.hits_eliminatory DESC, u.created_at ASC
        ");
        $users = $stmt->fetchAll();

        // Encontrar la fecha de ranking histórica más reciente anterior a hoy
        $historyDateStmt = $db->query("
            SELECT MAX(ranking_date) 
            FROM ranking_history 
            WHERE ranking_date < CURRENT_DATE()
        ");
        $prevDate = $historyDateStmt->fetchColumn();

        // Obtener historial anterior si existe para calcular tendencias
        $prevPositions = [];
        if ($prevDate) {
            $prevStmt = $db->prepare("
                SELECT user_id, position 
                FROM ranking_history 
                WHERE ranking_date = :prev_date
            ");
            $prevStmt->execute(['prev_date' => $prevDate]);
            $prevPositions = $prevStmt->fetchAll(PDO::FETCH_KEY_PAIR); // Retorna array asociativo [user_id => position]
        }

        // Armar el ranking con posiciones y tendencias
        $rankedUsers = [];
        $pos = 1;
        foreach ($users as $u) {
            $userId = $u['id'];
            $trend = 'SAME'; // Default: sin cambios (⚪)
            
            if (isset($prevPositions[$userId])) {
                $oldPos = $prevPositions[$userId];
                if ($oldPos > $pos) {
                    $trend = 'UP'; // Subió (🟢)
                } elseif ($oldPos < $pos) {
                    $trend = 'DOWN'; // Bajó (🔴)
                }
            }

            $rankedUsers[] = [
                "position" => $pos,
                "user_id" => $userId,
                "name" => $u['name'],
                "avatar_url" => $u['avatar_url'],
                "country" => $u['country'],
                "points_total" => intval($u['points_total']),
                "hits_total" => intval($u['hits_total']),
                "hits" => intval($u['hits_total']),
                "favorite_team" => $u['favorite_team'],
                "trend" => $trend,
                "champion_predicted" => $u['champion_predicted_code'],
                "champion_alive" => $u['champion_name'] ? !$u['champion_eliminated'] : false,
                "champion" => $u['champion_name'] ? [
                    "name" => $u['champion_name'],
                    "logo" => $u['champion_logo'],
                    "active" => !$u['champion_eliminated']
                ] : null
            ];
            $pos++;
        }

        sendResponse(["rankings" => $rankedUsers]);
    }

    if ($action === 'history') {
        $currentUser = requireAuth();
        
        // Obtener el historial de evolución del usuario
        $stmt = $db->prepare("
            SELECT ranking_date as date, points, position 
            FROM ranking_history 
            WHERE user_id = :user_id 
            ORDER BY ranking_date ASC
        ");
        $stmt->execute(['user_id' => $currentUser['id']]);
        $history = $stmt->fetchAll();
        
        // Si no tiene registros en el historial, creamos uno inicial con su posición actual
        if (empty($history)) {
            // Calcular posición actual
            $posStmt = $db->prepare("
                SELECT COUNT(*) + 1 
                FROM users 
                WHERE points_total > (SELECT points_total FROM users WHERE id = :uid)
            ");
            $posStmt->execute(['uid' => $currentUser['id']]);
            $currPos = $posStmt->fetchColumn();
            
            $stmt = $db->prepare("SELECT points_total FROM users WHERE id = :uid");
            $stmt->execute(['uid' => $currentUser['id']]);
            $currPts = $stmt->fetchColumn();
            
            $history = [
                ["date" => date('Y-m-d'), "points" => intval($currPts), "position" => intval($currPos)]
            ];
        }

        sendResponse(["history" => $history]);
    }
}

sendError("Acción no soportada.");
