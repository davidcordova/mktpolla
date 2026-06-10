<?php
// backend/api/predictions.php

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/scoring.php';

$currentUser = requireAuth();
$stage = $_GET['stage'] ?? '';
$action = $_GET['action'] ?? '';
$db = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($stage === 'GROUPS') {
        $stmt = $db->prepare("
            SELECT match_id, prediction, predicted_team_a_score, predicted_team_b_score 
            FROM group_predictions 
            WHERE user_id = :user_id
        ");
        $stmt->execute(['user_id' => $currentUser['id']]);
        $predictions = $stmt->fetchAll();
        
        sendResponse(["predictions" => $predictions]);
    }
    
    if ($stage === 'ELIMINATORY') {
        $stmt = $db->prepare("
            SELECT stage, match_index, predicted_team_a_code, predicted_team_b_code, winner_code, predicted_team_a_score, predicted_team_b_score 
            FROM bracket_predictions 
            WHERE user_id = :user_id
        ");
        $stmt->execute(['user_id' => $currentUser['id']]);
        $predictions = $stmt->fetchAll();
        
        sendResponse(["predictions" => $predictions]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();
    
    if ($stage === 'GROUPS') {
        $predictions = $data['predictions'] ?? [];
        if (!is_array($predictions)) {
            sendError("Estructura de pronósticos inválida.");
        }
        
        // Guardar cada predicción
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                INSERT INTO group_predictions (user_id, match_id, prediction, predicted_team_a_score, predicted_team_b_score) 
                VALUES (:user_id, :match_id, :prediction, :score_a, :score_b)
                ON DUPLICATE KEY UPDATE 
                    prediction = :prediction2,
                    predicted_team_a_score = :score_a2,
                    predicted_team_b_score = :score_b2
            ");
            
            foreach ($predictions as $pred) {
                $matchId = intval($pred['match_id'] ?? 0);
                $predVal = trim($pred['prediction'] ?? '');
                
                $scoreA = isset($pred['predicted_team_a_score']) && $pred['predicted_team_a_score'] !== null && $pred['predicted_team_a_score'] !== '' ? intval($pred['predicted_team_a_score']) : null;
                $scoreB = isset($pred['predicted_team_b_score']) && $pred['predicted_team_b_score'] !== null && $pred['predicted_team_b_score'] !== '' ? intval($pred['predicted_team_b_score']) : null;
                
                if ($matchId > 0 && in_array($predVal, ['A', 'DRAW', 'B'])) {
                    // Si se ingresaron ambos marcadores, recalculamos predVal por consistencia
                    if ($scoreA !== null && $scoreB !== null) {
                        $predVal = 'DRAW';
                        if ($scoreA > $scoreB) {
                            $predVal = 'A';
                        } elseif ($scoreA < $scoreB) {
                            $predVal = 'B';
                        }
                    } else {
                        // Si no se ingresaron marcadores, forzamos que se guarden como NULL
                        $scoreA = null;
                        $scoreB = null;
                    }
                    
                    $stmt->execute([
                        'user_id' => $currentUser['id'],
                        'match_id' => $matchId,
                        'prediction' => $predVal,
                        'score_a' => $scoreA,
                        'score_b' => $scoreB,
                        'prediction2' => $predVal,
                        'score_a2' => $scoreA,
                        'score_b2' => $scoreB
                    ]);
                }
            }
            $db->commit();
            
            // Recalcular puntos del usuario por si el partido ya se jugó
            $breakdown = recalculateUserPoints($currentUser['id']);
            
            sendResponse([
                "success" => true, 
                "message" => "Pronósticos de fase de grupos guardados correctamente.",
                "points_breakdown" => $breakdown
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            sendError("Error al guardar pronósticos: " . $e->getMessage());
        }
    }
    
    if ($stage === 'ELIMINATORY') {
        $predictions = $data['predictions'] ?? [];
        if (!is_array($predictions)) {
            sendError("Estructura de llaves inválida.");
        }
        
        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                INSERT INTO bracket_predictions 
                (user_id, stage, match_index, predicted_team_a_code, predicted_team_b_code, winner_code, predicted_team_a_score, predicted_team_b_score) 
                VALUES (:user_id, :stage, :idx, :a_code, :b_code, :winner, :score_a, :score_b)
                ON DUPLICATE KEY UPDATE 
                    predicted_team_a_code = :a_code2, 
                    predicted_team_b_code = :b_code2, 
                    winner_code = :winner2,
                    predicted_team_a_score = :score_a2,
                    predicted_team_b_score = :score_b2
            ");
            
            foreach ($predictions as $pred) {
                $pStage = $pred['stage'] ?? ''; // 'ROUND_OF_32', etc.
                $idx = intval($pred['match_index'] ?? 0);
                $aCode = $pred['predicted_team_a_code'] ?? '';
                $bCode = $pred['predicted_team_b_code'] ?? '';
                $wCode = $pred['winner_code'] ?? '';
                
                $scoreA = isset($pred['predicted_team_a_score']) && $pred['predicted_team_a_score'] !== '' ? intval($pred['predicted_team_a_score']) : null;
                $scoreB = isset($pred['predicted_team_b_score']) && $pred['predicted_team_b_score'] !== '' ? intval($pred['predicted_team_b_score']) : null;
                
                if (in_array($pStage, ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTERS', 'SEMIS', 'FINAL']) && 
                    !empty($aCode) && !empty($bCode) && !empty($wCode)) {
                    
                    $stmt->execute([
                        'user_id' => $currentUser['id'],
                        'stage' => $pStage,
                        'idx' => $idx,
                        'a_code' => $aCode,
                        'b_code' => $bCode,
                        'winner' => $wCode,
                        'score_a' => $scoreA,
                        'score_b' => $scoreB,
                        'a_code2' => $aCode,
                        'b_code2' => $bCode,
                        'winner2' => $wCode,
                        'score_a2' => $scoreA,
                        'score_b2' => $scoreB
                    ]);
                }
            }
            $db->commit();
            
            // Recalcular
            $breakdown = recalculateUserPoints($currentUser['id']);
            
            sendResponse([
                "success" => true, 
                "message" => "Pronósticos de fase eliminatoria guardados correctamente.",
                "points_breakdown" => $breakdown
            ]);
        } catch (Exception $e) {
            $db->rollBack();
            sendError("Error al guardar pronósticos del bracket: " . $e->getMessage());
        }
    }
    
    if ($action === 'champion') {
        $championCode = trim($data['champion_code'] ?? '');
        if (empty($championCode)) {
            sendError("Código de campeón inválido.");
        }
        
        $stmt = $db->prepare("UPDATE users SET champion_predicted_code = :champ WHERE id = :user_id");
        $stmt->execute([
            'champ' => $championCode,
            'user_id' => $currentUser['id']
        ]);
        
        recalculateUserPoints($currentUser['id']);
        
        sendResponse(["success" => true, "message" => "Campeón seleccionado correctamente."]);
    }
}

sendError("Acción no soportada.");
