<?php
// backend/api/bootstrap.php

// Fallback for CLI testing
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
}

// Enable error reporting for debugging, but in JSON
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Handle CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Disable Caching for API endpoints
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection(true);

/**
 * Generate a token for a user.
 */
function generateToken($user) {
    $payload = [
        'id' => $user['id'],
        'email' => $user['email'],
        'time' => time()
    ];
    return base64_encode(json_encode($payload));
}

/**
 * Retrieve the current authenticated user.
 */
function getCurrentUser($required = true) {
    global $pdo;
    
    $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
    $authHeader = null;
    
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    
    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        $decoded = json_decode(base64_decode($token), true);
        
        if (isset($decoded['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$decoded['id']]);
            $user = $stmt->fetch();
            
            if ($user) {
                unset($user['password_hash']); // Security clean
                $user['is_admin'] = (bool)$user['is_admin'];
                $user['champion_predicted_id'] = $user['champion_predicted_code'] ?? null;
                return $user;
            }
        }
    }
    
    if ($required) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Unauthorized. Please log in.']);
        exit;
    }
    
    return null;
}

/**
 * Utility to read JSON payload from request body.
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?: [];
}

/**
 * Utility to respond with JSON.
 */
function respondJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
