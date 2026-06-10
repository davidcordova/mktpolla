<?php
// backend/api/auth.php

require_once __DIR__ . '/common.php';
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$db = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'register') {
        $data = getJsonInput();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $country = trim($data['country'] ?? '');
        $favorite_team = trim($data['favorite_team'] ?? $data['favoriteTeam'] ?? '');
        
        if (empty($name) || empty($email) || empty($password)) {
            sendError("Todos los campos obligatorios deben completarse.");
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendError("El formato del correo electrónico no es válido.");
        }
        
        // Verificar si el correo ya existe
        $stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            sendError("El correo electrónico ya está registrado.");
        }
        
        // Crear el usuario
        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("
            INSERT INTO users (name, email, password_hash, provider, country, favorite_team) 
            VALUES (:name, :email, :password_hash, 'email', :country, :favorite_team)
        ");
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'password_hash' => $password_hash,
            'country' => $country ?: null,
            'favorite_team' => $favorite_team ?: null
        ]);
        
        $userId = $db->lastInsertId();
        $user = [
            "id" => $userId,
            "name" => $name,
            "email" => $email,
            "is_admin" => false,
            "country" => $country,
            "favorite_team" => $favorite_team,
            "champion_predicted_code" => null,
            "champion_predicted_id" => null
        ];
        $token = generateToken($user);
        
        sendResponse([
            "status" => "success",
            "token" => $token,
            "user" => $user
        ]);
    }
    
    if ($action === 'login') {
        $data = getJsonInput();
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $provider = $data['provider'] ?? 'email';
        
        // Manejo de Login Social (Simulado)
        if ($provider !== 'email') {
            $name = trim($data['name'] ?? '');
            $avatar_url = trim($data['avatar_url'] ?? '');
            $country = trim($data['country'] ?? 'Desconocido');
            
            if (empty($email) || empty($name)) {
                sendError("Datos incompletos para el inicio de sesión social.");
            }
            
            // Buscar si ya existe el usuario por email
            $stmt = $db->prepare("SELECT * FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch();
            
            if (!$user) {
                // Registrar nuevo usuario social
                $stmt = $db->prepare("
                    INSERT INTO users (name, email, provider, avatar_url, country, points_total) 
                    VALUES (:name, :email, :provider, :avatar_url, :country, 0)
                ");
                $stmt->execute([
                    'name' => $name,
                    'email' => $email,
                    'provider' => $provider,
                    'avatar_url' => $avatar_url ?: null,
                    'country' => $country
                ]);
                
                $stmt = $db->prepare("SELECT * FROM users WHERE id = :id");
                $stmt->execute(['id' => $db->lastInsertId()]);
                $user = $stmt->fetch();
            }
            
            $token = generateToken($user);
            sendResponse([
                "status" => "success",
                "token" => $token,
                "user" => [
                    "id" => $user['id'],
                    "name" => $user['name'],
                    "email" => $user['email'],
                    "is_admin" => (bool)$user['is_admin'],
                    "avatar_url" => $user['avatar_url'],
                    "country" => $user['country'],
                    "favorite_team" => $user['favorite_team'],
                    "champion_predicted_code" => $user['champion_predicted_code'] ?? null,
                    "champion_predicted_id" => $user['champion_predicted_code'] ?? null
                ]
            ]);
        }
        
        // Login Clásico (Email + Password)
        if (empty($email) || empty($password)) {
            sendError("Correo y contraseña son requeridos.");
        }
        
        $stmt = $db->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            sendError("Credenciales incorrectas.");
        }
        
        $token = generateToken($user);
        sendResponse([
            "status" => "success",
            "token" => $token,
            "user" => [
                "id" => $user['id'],
                "name" => $user['name'],
                "email" => $user['email'],
                "is_admin" => (bool)$user['is_admin'],
                "avatar_url" => $user['avatar_url'],
                "country" => $user['country'],
                "favorite_team" => $user['favorite_team'],
                "champion_predicted_code" => $user['champion_predicted_code'] ?? null,
                "champion_predicted_id" => $user['champion_predicted_code'] ?? null
            ]
        ]);
    }
    
    if ($action === 'logout') {
        session_destroy();
        sendResponse(["success" => true, "message" => "Sesión cerrada correctamente."]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'status') {
        $currentUser = getCurrentUser(false);
        if (!$currentUser) {
            sendResponse(["authenticated" => false]);
        }
        
        sendResponse([
            "authenticated" => true,
            "user" => [
                "id" => $currentUser['id'],
                "name" => $currentUser['name'],
                "email" => $currentUser['email'],
                "is_admin" => (bool)$currentUser['is_admin'],
                "avatar_url" => $currentUser['avatar_url'],
                "country" => $currentUser['country'],
                "favorite_team" => $currentUser['favorite_team'],
                "points_total" => $currentUser['points_total'],
                "hits_total" => $currentUser['hits_total'],
                "champion_predicted_code" => $currentUser['champion_predicted_code'] ?? null,
                "champion_predicted_id" => $currentUser['champion_predicted_code'] ?? null
            ]
        ]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if ($action === 'update_profile') {
        $currentUser = requireAuth();
        $data = getJsonInput();
        $country = trim($data['country'] ?? '');
        $favorite_team = trim($data['favorite_team'] ?? '');
        $avatar_url = trim($data['avatar_url'] ?? '');
        
        $stmt = $db->prepare("
            UPDATE users 
            SET country = :country, favorite_team = :favorite_team, avatar_url = :avatar_url 
            WHERE id = :id
        ");
        $stmt->execute([
            'country' => $country ?: null,
            'favorite_team' => $favorite_team ?: null,
            'avatar_url' => $avatar_url ?: null,
            'id' => $currentUser['id']
        ]);
        
        sendResponse(["success" => true, "message" => "Perfil actualizado correctamente."]);
    }
}

sendError("Acción no soportada.");
