<?php
// backend/api/leagues.php

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/db.php';

$currentUser = requireAuth();
$action = $_GET['action'] ?? '';
$db = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();

    if ($action === 'create') {
        $name = trim($data['name'] ?? '');
        if (empty($name)) {
            sendError("El nombre de la liga es obligatorio.");
        }

        // Generar un código único de 6 caracteres
        $codeUnique = false;
        $code = '';
        while (!$codeUnique) {
            $code = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 7));
            $stmt = $db->prepare("SELECT id FROM leagues WHERE code = :code");
            $stmt->execute(['code' => $code]);
            if (!$stmt->fetch()) {
                $codeUnique = true;
            }
        }

        $db->beginTransaction();
        try {
            // Crear liga
            $stmt = $db->prepare("INSERT INTO leagues (name, code, creator_id) VALUES (:name, :code, :creator)");
            $stmt->execute([
                'name' => $name,
                'code' => $code,
                'creator' => $currentUser['id']
            ]);
            
            $leagueId = $db->lastInsertId();

            // Unir al creador automáticamente
            $stmt = $db->prepare("INSERT INTO league_members (league_id, user_id) VALUES (:l_id, :u_id)");
            $stmt->execute([
                'l_id' => $leagueId,
                'u_id' => $currentUser['id']
            ]);

            $db->commit();
            sendResponse([
                "success" => true,
                "message" => "Liga creada correctamente.",
                "league" => [
                    "id" => $leagueId,
                    "name" => $name,
                    "code" => $code
                ]
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            sendError("Error al crear la liga: " . $e->getMessage());
        }
    }

    if ($action === 'join') {
        $code = strtoupper(trim($data['code'] ?? ''));
        if (empty($code)) {
            sendError("El código de la liga es obligatorio.");
        }

        // Buscar liga
        $stmt = $db->prepare("SELECT * FROM leagues WHERE code = :code");
        $stmt->execute(['code' => $code]);
        $league = $stmt->fetch();

        if (!$league) {
            sendError("No se encontró ninguna liga con el código proporcionado.");
        }

        // Verificar si ya es miembro
        $stmt = $db->prepare("SELECT * FROM league_members WHERE league_id = :l_id AND user_id = :u_id");
        $stmt->execute([
            'l_id' => $league['id'],
            'u_id' => $currentUser['id']
        ]);
        if ($stmt->fetch()) {
            sendResponse([
                "success" => true,
                "message" => "Ya eres miembro de esta liga.",
                "league" => [
                    "id" => $league['id'],
                    "name" => $league['name'],
                    "code" => $league['code']
                ]
            ]);
        }

        // Unirse a la liga
        try {
            $stmt = $db->prepare("INSERT INTO league_members (league_id, user_id) VALUES (:l_id, :u_id)");
            $stmt->execute([
                'l_id' => $league['id'],
                'u_id' => $currentUser['id']
            ]);

            sendResponse([
                "success" => true,
                "message" => "Te has unido a la liga exitosamente.",
                "league" => [
                    "id" => $league['id'],
                    "name" => $league['name'],
                    "code" => $league['code']
                ]
            ]);
        } catch (Exception $e) {
            sendError("Error al unirse a la liga: " . $e->getMessage());
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        // Listar ligas a las que pertenece el usuario
        $stmt = $db->prepare("
            SELECT l.id, l.name, l.code, l.created_at, u.name as creator_name,
                   (SELECT COUNT(*) FROM league_members lm2 WHERE lm2.league_id = l.id) as total_members
            FROM league_members lm
            JOIN leagues l ON lm.league_id = l.id
            JOIN users u ON l.creator_id = u.id
            WHERE lm.user_id = :user_id
        ");
        $stmt->execute(['user_id' => $currentUser['id']]);
        $leagues = $stmt->fetchAll();

        sendResponse(["leagues" => $leagues]);
    }

    // Obtener ranking y miembros de una liga
    $leagueId = intval($_GET['id'] ?? 0);
    if ($leagueId > 0) {
        // Verificar que el usuario pertenezca a la liga
        $stmt = $db->prepare("SELECT 1 FROM league_members WHERE league_id = :l_id AND user_id = :u_id");
        $stmt->execute(['l_id' => $leagueId, 'u_id' => $currentUser['id']]);
        if (!$stmt->fetch()) {
            sendError("Acceso denegado. No eres miembro de esta liga.", 403);
        }

        // Obtener detalles de la liga
        $stmt = $db->prepare("SELECT * FROM leagues WHERE id = :id");
        $stmt->execute(['id' => $leagueId]);
        $leagueDetails = $stmt->fetch();

        // Obtener ranking de miembros
        $stmt = $db->prepare("
            SELECT u.id as user_id, u.name, u.avatar_url, u.points_total, u.hits_total, u.country,
                   t.name AS champion_name, t.logo_url AS champion_logo, t.eliminated AS champion_eliminated,
                   u.champion_predicted_code
            FROM league_members lm
            JOIN users u ON lm.user_id = u.id
            LEFT JOIN teams t ON u.champion_predicted_code = t.code
            WHERE lm.league_id = :l_id
            ORDER BY u.points_total DESC, u.hits_total DESC, u.hits_eliminatory DESC, u.created_at ASC
        ");
        $stmt->execute(['l_id' => $leagueId]);
        $members = $stmt->fetchAll();

        // Asignar posición
        $rankedMembers = [];
        $pos = 1;
        foreach ($members as $m) {
            $rankedMembers[] = [
                "position" => $pos,
                "user_id" => $m['user_id'],
                "name" => $m['name'],
                "avatar_url" => $m['avatar_url'],
                "country" => $m['country'],
                "points_total" => intval($m['points_total']),
                "hits_total" => intval($m['hits_total']),
                "hits" => intval($m['hits_total']),
                "champion_predicted" => $m['champion_predicted_code'] ?? null,
                "champion_alive" => $m['champion_name'] ? !$m['champion_eliminated'] : false,
                "champion" => $m['champion_name'] ? [
                    "name" => $m['champion_name'],
                    "logo" => $m['champion_logo'],
                    "active" => !$m['champion_eliminated']
                ] : null
            ];
            $pos++;
        }

        sendResponse([
            "league" => $leagueDetails,
            "rankings" => $rankedMembers,
            "members" => $rankedMembers
        ]);
    }
}

sendError("Acción no soportada.");
