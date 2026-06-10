<?php
// backend/api/matches.php

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/scoring.php';

$action = $_GET['action'] ?? '';
$db = getDBConnection();

// GET: Obtener partidos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stage = $_GET['stage'] ?? '';
    
    $query = "
        SELECT m.*, 
               ta.name AS team_a_name, ta.logo_url AS team_a_logo,
               tb.name AS team_b_name, tb.logo_url AS team_b_logo,
               tw.name AS winner_name
        FROM matches m
        JOIN teams ta ON m.team_a_code = ta.code
        JOIN teams tb ON m.team_b_code = tb.code
        LEFT JOIN teams tw ON m.winner_code = tw.code
    ";
    
    $params = [];
    if ($stage === 'GROUPS') {
        $query .= " WHERE m.stage = 'GROUPS' ORDER BY m.match_date ASC";
    } elseif ($stage === 'ELIMINATORY') {
        $query .= " WHERE m.stage != 'GROUPS' ORDER BY m.stage DESC, m.match_index ASC";
    } elseif (!empty($stage)) {
        $validStages = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTERS', 'SEMIS', 'FINAL'];
        if (in_array($stage, $validStages)) {
            $query .= " WHERE m.stage = :stage ORDER BY m.match_index ASC";
            $params['stage'] = $stage;
        } else {
            $query .= " ORDER BY m.stage ASC, m.match_date ASC";
        }
    } else {
        $query .= " ORDER BY m.stage ASC, m.match_date ASC";
    }
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $matches = $stmt->fetchAll();
    
    // Obtener los equipos para referencia
    $teams = $db->query("SELECT * FROM teams")->fetchAll();
    
    sendResponse([
        "matches" => $matches,
        "teams" => $teams
    ]);
}

// POST: Acciones de Administrador
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $admin = requireAdmin();
    $data = getJsonInput();

    if ($action === 'update') {
        $matchId = intval($data['id'] ?? 0);
        $teamAScore = isset($data['team_a_score']) ? intval($data['team_a_score']) : null;
        $teamBScore = isset($data['team_b_score']) ? intval($data['team_b_score']) : null;
        $winnerCode = trim($data['winner_code'] ?? '');
        $finished = isset($data['finished']) ? (bool)$data['finished'] : false;

        if ($matchId <= 0) {
            sendError("ID de partido inválido.");
        }

        // Obtener el partido original
        $stmt = $db->prepare("SELECT * FROM matches WHERE id = :id");
        $stmt->execute(['id' => $matchId]);
        $match = $stmt->fetch();

        if (!$match) {
            sendError("Partido no encontrado.");
        }

        // Si es eliminatoria y empatan, se requiere un ganador oficial
        if ($match['stage'] !== 'GROUPS' && $teamAScore === $teamBScore && empty($winnerCode) && $finished) {
            sendError("Los partidos de fase eliminatoria no pueden terminar en empate sin un ganador definido.");
        }

        // Si no se especifica ganador en eliminatoria pero no empataron
        if ($match['stage'] !== 'GROUPS' && $teamAScore !== $teamBScore && empty($winnerCode) && $finished) {
            $winnerCode = ($teamAScore > $teamBScore) ? $match['team_a_code'] : $match['team_b_code'];
        }

        // Actualizar el partido
        $stmt = $db->prepare("
            UPDATE matches 
            SET team_a_score = :score_a, team_b_score = :score_b, 
                winner_code = :winner, finished = :finished 
            WHERE id = :id
        ");
        $stmt->execute([
            'score_a' => $teamAScore,
            'score_b' => $teamBScore,
            'winner' => !empty($winnerCode) ? $winnerCode : null,
            'finished' => $finished ? 1 : 0,
            'id' => $matchId
        ]);

        // Si el partido terminó, disparar el avance y recálculo
        if ($finished) {
            checkAndAdvanceTournament();
            recalculateAllUsers();
        }

        sendResponse(["success" => true, "message" => "Resultado del partido actualizado correctamente."]);
    }

    if ($action === 'seed_test_data') {
        $stage = trim($data['stage'] ?? '');
        if (empty($stage)) {
            sendError("Etapa no especificada para la simulación.");
        }

        $validStages = ['GROUPS', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTERS', 'SEMIS', 'FINAL'];
        if (!in_array($stage, $validStages)) {
            sendError("Etapa inválida para simular: " . htmlspecialchars($stage));
        }

        $db->beginTransaction();
        try {
            // Verificar si hay partidos para esta etapa
            $stmt = $db->prepare("SELECT COUNT(*) FROM matches WHERE stage = :stage");
            $stmt->execute(['stage' => $stage]);
            $count = (int)$stmt->fetchColumn();

            if ($count === 0) {
                // Mensajes de error específicos amigables
                if ($stage === 'ROUND_OF_32') {
                    sendError("No se ha generado la fase de Dieciseisavos de Final todavía. Primero debes finalizar la Fase de Grupos.");
                } elseif ($stage === 'ROUND_OF_16') {
                    sendError("No se ha generado la fase de Octavos de Final todavía. Primero debes finalizar Dieciseisavos.");
                } elseif ($stage === 'QUARTERS') {
                    sendError("No se ha generado la fase de Cuartos de Final todavía. Primero debes finalizar Octavos.");
                } elseif ($stage === 'SEMIS') {
                    sendError("No se ha generado la fase de Semifinales todavía. Primero debes finalizar Cuartos.");
                } elseif ($stage === 'FINAL') {
                    sendError("No se ha generado la Final todavía. Primero debes finalizar Semifinales.");
                } else {
                    sendError("No hay partidos para la etapa: " . htmlspecialchars($stage));
                }
            }

            // Obtener todos los partidos de la etapa que aún no están finalizados
            $stmt = $db->prepare("SELECT * FROM matches WHERE stage = :stage AND finished = 0");
            $stmt->execute(['stage' => $stage]);
            $unfinishedMatches = $stmt->fetchAll();

            $updateStmt = $db->prepare("
                UPDATE matches 
                SET team_a_score = :score_a, team_b_score = :score_b, 
                    winner_code = :winner, finished = 1 
                WHERE id = :id
            ");

            foreach ($unfinishedMatches as $m) {
                $teamA = $m['team_a_code'];
                $teamB = $m['team_b_code'];

                if (empty($teamA) || empty($teamB)) {
                    // Si por alguna razón falta algún equipo en la llave, no podemos simularlo
                    continue;
                }

                $scoreA = rand(0, 4);
                $scoreB = rand(0, 4);
                $winner = null;

                if ($stage !== 'GROUPS') {
                    if ($scoreA > $scoreB) {
                        $winner = $teamA;
                    } elseif ($scoreA < $scoreB) {
                        $winner = $teamB;
                    } else {
                        // Empate en fase eliminatoria: simular ganador por penales
                        $winner = (rand(0, 1) === 0) ? $teamA : $teamB;
                    }
                }

                $updateStmt->execute([
                    'score_a' => $scoreA,
                    'score_b' => $scoreB,
                    'winner' => $winner,
                    'id' => $m['id']
                ]);
            }

            $db->commit();

            // Ejecutar el avance automático del torneo
            checkAndAdvanceTournament();

            // Ejecutar el recálculo general de los usuarios
            recalculateAllUsers();

            // Si es la final, buscar al campeón
            $champion = null;
            if ($stage === 'FINAL') {
                $champQuery = $db->query("SELECT winner_code FROM matches WHERE stage = 'FINAL' AND finished = 1 LIMIT 1");
                $champion = $champQuery->fetchColumn();
            }

            sendResponse([
                "success" => true,
                "message" => "Simulación de la etapa '" . $stage . "' ejecutada correctamente. Rankings actualizados.",
                "champion" => $champion
            ]);

        } catch (Exception $ex) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            sendError("Error en simulación: " . $ex->getMessage());
        }
    }

    if ($action === 'reset_tournament' || $action === 'reset') {
        // Re-iniciar la base de datos a un estado original
        try {
            $setupPath = __DIR__ . '/../config/setup_db.php';
            if (file_exists($setupPath)) {
                ob_start();
                include $setupPath;
                ob_end_clean();
                sendResponse(["success" => true, "message" => "El torneo se ha reiniciado correctamente a su estado inicial vacío."]);
            } else {
                sendError("No se encontró el archivo de inicialización de la base de datos.");
            }
        } catch (Exception $ex) {
            sendError("Error al reiniciar torneo: " . $ex->getMessage());
        }
    }

    if ($action === 'sync') {
        $apiUrl = 'http://localhost:8000/api/mock_external_api.php';
        
        $jsonContent = null;
        
        // Opción 1: HTTP Request con timeout rápido
        $ctx = stream_context_create(['http' => ['timeout' => 2]]);
        $jsonContent = @file_get_contents($apiUrl, false, $ctx);
        
        // Opción 2: Fallback de lectura local si no responde el puerto
        if (!$jsonContent) {
            $mockFile = __DIR__ . '/mock_external_api.php';
            if (file_exists($mockFile)) {
                ob_start();
                include $mockFile;
                $jsonContent = ob_get_clean();
            }
        }
        
        if (!$jsonContent) {
            sendError("No se pudo conectar a la API de resultados.");
        }
        
        $data = json_decode($jsonContent, true);
        if (!$data || !isset($data['matches'])) {
            sendError("Formato de respuesta de API inválido.");
        }
        
        $syncedCount = 0;
        $db->beginTransaction();
        try {
            $updateStmt = $db->prepare("
                UPDATE matches 
                SET team_a_score = :score_a, team_b_score = :score_b, 
                    winner_code = :winner, finished = 1 
                WHERE team_a_code = :ta AND team_b_code = :tb AND stage = :stage AND finished = 0
            ");
            
            foreach ($data['matches'] as $extMatch) {
                $ta = $extMatch['team_a'];
                $tb = $extMatch['team_b'];
                $stageVal = $extMatch['stage'];
                $scoreA = isset($extMatch['team_a_score']) ? intval($extMatch['team_a_score']) : null;
                $scoreB = isset($extMatch['team_b_score']) ? intval($extMatch['team_b_score']) : null;
                $finished = isset($extMatch['finished']) ? (bool)$extMatch['finished'] : false;
                
                if ($finished && $scoreA !== null && $scoreB !== null) {
                    $winner = null;
                    if ($stageVal !== 'GROUPS') {
                        if ($scoreA > $scoreB) $winner = $ta;
                        elseif ($scoreA < $scoreB) $winner = $tb;
                        else $winner = $extMatch['winner'] ?? null;
                    }
                    
                    $updateStmt->execute([
                        'score_a' => $scoreA,
                        'score_b' => $scoreB,
                        'winner' => $winner,
                        'ta' => $ta,
                        'tb' => $tb,
                        'stage' => $stageVal
                    ]);
                    
                    $syncedCount += $updateStmt->rowCount();
                }
            }
            $db->commit();
            
            if ($syncedCount > 0) {
                checkAndAdvanceTournament();
                recalculateAllUsers();
            }
            
            sendResponse([
                "success" => true,
                "message" => "Sincronización completada exitosamente.",
                "synced_count" => $syncedCount
            ]);
        } catch (Exception $ex) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            sendError("Error al sincronizar resultados: " . $ex->getMessage());
        }
    }
}

/**
 * Crea las llaves oficiales del ROUND_OF_32 basándose en las estadísticas de la fase de grupos.
 */
function createRoundOf32Matches($db) {
    // 1. Obtener todos los equipos y calcular estadísticas grupales
    $teams = $db->query("SELECT * FROM teams")->fetchAll();
    $groupStats = [];
    foreach ($teams as $t) {
        $groupStats[$t['code']] = [
            'code' => $t['code'],
            'group' => $t['group_name'],
            'points' => 0,
            'gd' => 0,
            'gf' => 0
        ];
    }

    // Recopilar puntajes de los partidos jugados
    $stmt = $db->query("SELECT * FROM matches WHERE stage = 'GROUPS' AND finished = 1");
    $playedMatches = $stmt->fetchAll();
    foreach ($playedMatches as $m) {
        $a = $m['team_a_code'];
        $b = $m['team_b_code'];
        $sa = $m['team_a_score'];
        $sb = $m['team_b_score'];

        $groupStats[$a]['gf'] += $sa;
        $groupStats[$b]['gf'] += $sb;
        $groupStats[$a]['gd'] += ($sa - $sb);
        $groupStats[$b]['gd'] += ($sb - $sa);

        if ($sa > $sb) {
            $groupStats[$a]['points'] += 3;
        } elseif ($sa < $sb) {
            $groupStats[$b]['points'] += 3;
        } else {
            $groupStats[$a]['points'] += 1;
            $groupStats[$b]['points'] += 1;
        }
    }

    // Agrupar equipos por grupo A-L
    $groups = [];
    foreach ($groupStats as $code => $stats) {
        $groups[$stats['group']][] = $stats;
    }

    $qualified = [];
    $thirdPlaces = [];

    // Obtener clasificados
    foreach ($groups as $gName => $gTeams) {
        usort($gTeams, function($x, $y) {
            if ($x['points'] !== $y['points']) return $y['points'] - $x['points'];
            if ($x['gd'] !== $y['gd']) return $y['gd'] - $x['gd'];
            return $y['gf'] - $x['gf'];
        });

        $qualified[] = $gTeams[0]['code'];
        $qualified[] = $gTeams[1]['code'];
        $thirdPlaces[] = $gTeams[2];
    }

    usort($thirdPlaces, function($x, $y) {
        if ($x['points'] !== $y['points']) return $y['points'] - $x['points'];
        if ($x['gd'] !== $y['gd']) return $y['gd'] - $x['gd'];
        return $y['gf'] - $x['gf'];
    });

    for ($i = 0; $i < 8; $i++) {
        $qualified[] = $thirdPlaces[$i]['code'];
    }

    // Crear partidos de Dieciseisavos (ROUND_OF_32)
    $db->exec("DELETE FROM matches WHERE stage != 'GROUPS'");

    $insertElimStmt = $db->prepare("
        INSERT INTO matches (stage, match_index, team_a_code, team_b_code, team_a_score, team_b_score, winner_code, match_date, finished)
        VALUES ('ROUND_OF_32', :idx, :a, :b, NULL, NULL, NULL, :mdate, 0)
    ");

    for ($i = 0; $i < 16; $i++) {
        $teamA = $qualified[$i * 2];
        $teamB = $qualified[$i * 2 + 1];
        $mdate = date('Y-m-d H:i:s', strtotime("+1 days"));
        $insertElimStmt->execute([
            'idx' => $i,
            'a' => $teamA,
            'b' => $teamB,
            'mdate' => $mdate
        ]);
    }
}

/**
 * Verifica si todas las partidas de una etapa están completadas, y de ser así,
 * avanza la base de datos a la siguiente etapa eliminatoria (generando o actualizando sus llaves).
 */
function checkAndAdvanceTournament() {
    global $db;
    
    // 1. Verificar si todos los partidos de GROUPS están finalizados
    $totalGroups = (int)$db->query("SELECT COUNT(*) FROM matches WHERE stage = 'GROUPS'")->fetchColumn();
    $finishedGroups = (int)$db->query("SELECT COUNT(*) FROM matches WHERE stage = 'GROUPS' AND finished = 1")->fetchColumn();
    
    if ($totalGroups > 0 && $finishedGroups === $totalGroups) {
        $existR32 = (int)$db->query("SELECT COUNT(*) FROM matches WHERE stage = 'ROUND_OF_32'")->fetchColumn();
        if ($existR32 === 0) {
            createRoundOf32Matches($db);
        }
    } else {
        return; // Fase de grupos no ha terminado totalmente
    }
    
    $koStages = [
        ['current' => 'ROUND_OF_32', 'next' => 'ROUND_OF_16', 'count' => 16, 'next_count' => 8, 'offset' => 4],
        ['current' => 'ROUND_OF_16', 'next' => 'QUARTERS', 'count' => 8, 'next_count' => 4, 'offset' => 7],
        ['current' => 'QUARTERS', 'next' => 'SEMIS', 'count' => 4, 'next_count' => 2, 'offset' => 10],
        ['current' => 'SEMIS', 'next' => 'FINAL', 'count' => 2, 'next_count' => 1, 'offset' => 13]
    ];
    
    foreach ($koStages as $step) {
        $currentStage = $step['current'];
        $nextStage = $step['next'];
        $expectedCount = $step['count'];
        $nextCount = $step['next_count'];
        $offset = $step['offset'];
        
        $finishedCountQuery = $db->prepare("SELECT COUNT(*) FROM matches WHERE stage = :stage AND finished = 1");
        $finishedCountQuery->execute(['stage' => $currentStage]);
        $finished = (int)$finishedCountQuery->fetchColumn();
        
        if ($finished === $expectedCount) {
            $winnersQuery = $db->prepare("SELECT winner_code FROM matches WHERE stage = :stage ORDER BY match_index ASC");
            $winnersQuery->execute(['stage' => $currentStage]);
            $winners = $winnersQuery->fetchAll(PDO::FETCH_COLUMN);
            
            $existNextQuery = $db->prepare("SELECT COUNT(*) FROM matches WHERE stage = :stage");
            $existNextQuery->execute(['stage' => $nextStage]);
            $existNext = (int)$existNextQuery->fetchColumn();
            
            if ($existNext === 0) {
                $insertStmt = $db->prepare("
                    INSERT INTO matches (stage, match_index, team_a_code, team_b_code, team_a_score, team_b_score, winner_code, match_date, finished)
                    VALUES (:stage, :idx, :a, :b, NULL, NULL, NULL, :mdate, 0)
                ");
                
                for ($i = 0; $i < $nextCount; $i++) {
                    $teamA = $winners[$i * 2] ?? '';
                    $teamB = $winners[$i * 2 + 1] ?? '';
                    $mdate = date('Y-m-d H:i:s', strtotime("+{$offset} days"));
                    
                    $insertStmt->execute([
                        'stage' => $nextStage,
                        'idx' => $i,
                        'a' => $teamA,
                        'b' => $teamB,
                        'mdate' => $mdate
                    ]);
                }
            } else {
                $selectStmt = $db->prepare("SELECT id, team_a_code, team_b_code FROM matches WHERE stage = :stage ORDER BY match_index ASC");
                $selectStmt->execute(['stage' => $nextStage]);
                $existingMatches = $selectStmt->fetchAll();
                
                $updateStmt = $db->prepare("UPDATE matches SET team_a_code = :a, team_b_code = :b WHERE id = :id");
                
                for ($i = 0; $i < $nextCount; $i++) {
                    $teamA = $winners[$i * 2] ?? '';
                    $teamB = $winners[$i * 2 + 1] ?? '';
                    $m = $existingMatches[$i];
                    
                    if ($m['team_a_code'] !== $teamA || $m['team_b_code'] !== $teamB) {
                        $updateStmt->execute([
                            'a' => $teamA,
                            'b' => $teamB,
                            'id' => $m['id']
                        ]);
                    }
                }
            }
        } else {
            break;
        }
    }
    
    $finalFinished = (int)$db->query("SELECT COUNT(*) FROM matches WHERE stage = 'FINAL' AND finished = 1")->fetchColumn();
    if ($finalFinished === 1) {
        $winner = $db->query("SELECT winner_code FROM matches WHERE stage = 'FINAL' LIMIT 1")->fetchColumn();
        if ($winner) {
            $db->prepare("UPDATE teams SET eliminated = 1 WHERE code != :champ")->execute(['champ' => $winner]);
            $db->prepare("UPDATE teams SET eliminated = 0 WHERE code = :champ")->execute(['champ' => $winner]);
        }
    }
}

if (php_sapi_name() !== 'cli') {
    sendError("Acción no soportada.");
}
