<?php
// backend/api/profile.php

require_once __DIR__ . '/bootstrap.php';

// Authenticate user, will terminate request if token is invalid
$currentUser = getCurrentUser(true);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return profile information along with team info if available
    respondJson([
        'status' => 'success',
        'user' => $currentUser
    ]);
} elseif ($method === 'POST' || $method === 'PUT') {
    // Read PUT/POST input (either raw JSON or form-urlencoded)
    $input = getJsonInput();
    
    $name = isset($input['name']) ? trim($input['name']) : $currentUser['name'];
    $country = isset($input['country']) ? trim($input['country']) : $currentUser['country'];
    $favoriteTeam = isset($input['favoriteTeam']) ? trim($input['favoriteTeam']) : $currentUser['favorite_team'];
    $avatarUrl = isset($input['avatarUrl']) ? trim($input['avatarUrl']) : $currentUser['avatar_url'];
    
    if (empty($name)) {
        respondJson(['error' => 'El nombre no puede estar vacío.'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE users 
            SET name = ?, country = ?, favorite_team = ?, avatar_url = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $country, $favoriteTeam, $avatarUrl, $currentUser['id']]);
        
        // Fetch updated user
        $stmtSelect = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmtSelect->execute([$currentUser['id']]);
        $updatedUser = $stmtSelect->fetch();
        unset($updatedUser['password_hash']);
        $updatedUser['is_admin'] = (bool)$updatedUser['is_admin'];
        $updatedUser['champion_predicted_id'] = $updatedUser['champion_predicted_code'] ?? null;
        
        respondJson([
            'status' => 'success',
            'message' => 'Perfil actualizado correctamente.',
            'user' => $updatedUser
        ]);
    } catch (Exception $e) {
        respondJson(['error' => 'Error al actualizar perfil: ' . $e->getMessage()], 500);
    }
} else {
    respondJson(['error' => 'Method not allowed'], 405);
}
