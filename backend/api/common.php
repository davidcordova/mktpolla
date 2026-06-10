<?php
// backend/api/common.php

require_once __DIR__ . '/bootstrap.php';

/**
 * Envía una respuesta JSON de éxito.
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    if (is_array($data) && !isset($data['status'])) {
        $data['status'] = 'success';
    }
    echo json_encode($data);
    exit;
}

/**
 * Envía una respuesta JSON de error.
 */
function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        "status" => "error",
        "error" => $message
    ]);
    exit;
}

/**
 * Retorna el usuario actualmente autenticado o falla.
 */
function requireAuth() {
    $user = getCurrentUser(true);
    return $user;
}

/**
 * Retorna el usuario si es admin o falla.
 */
function requireAdmin() {
    $user = requireAuth();
    if (empty($user['is_admin'])) {
        sendError("Acceso denegado. Se requieren permisos de administrador.", 403);
    }
    return $user;
}
