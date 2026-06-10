<?php
// backend/api/test_db.php
header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS ===\n\n";

echo "1. Comprobando existencia de la clase PDO...\n";
if (class_exists('PDO')) {
    echo "✓ Clase PDO disponible.\n";
    echo "Controladores PDO instalados: " . implode(', ', PDO::getAvailableDrivers()) . "\n\n";
} else {
    echo "❌ ERROR: La clase PDO no existe en este servidor PHP. Debes activar la extensión PDO en tu panel de hosting.\n\n";
    exit;
}

echo "2. Cargando configuración de db.php...\n";
$db_path = __DIR__ . '/../config/db.php';
if (file_exists($db_path)) {
    echo "✓ Archivo db.php encontrado.\n";
    require_once $db_path;
    echo "Parámetros cargados:\n";
    echo "- DB_HOST: " . (defined('DB_HOST') ? DB_HOST : 'No definido') . "\n";
    echo "- DB_USER: " . (defined('DB_USER') ? DB_USER : 'No definido') . "\n";
    echo "- DB_NAME: " . (defined('DB_NAME') ? DB_NAME : 'No definido') . "\n";
    echo "- DB_PASS: (Longitud: " . (defined('DB_PASS') ? strlen(DB_PASS) : 'No definido') . " caracteres)\n\n";
} else {
    echo "❌ ERROR: No se encontró el archivo db.php en: $db_path\n\n";
    exit;
}

echo "3. Intentando conectar a la base de datos con PDO...\n";
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ];
    
    $start = microtime(true);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    $time = round(microtime(true) - $start, 4);
    
    echo "✓ CONEXIÓN EXITOSA EN $time SEGUNDOS.\n\n";
    
    echo "4. Comprobando existencia de tablas clave...\n";
    $tables = ['users', 'teams', 'matches', 'group_predictions', 'bracket_predictions'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) FROM $table");
            $count = $stmt->fetchColumn();
            echo "- Tabla '$table': EXISTE (Registros: $count)\n";
        } catch (PDOException $te) {
            echo "- Tabla '$table': ❌ ERROR - " . $te->getMessage() . "\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ ERROR DE CONEXIÓN: " . $e->getMessage() . "\n";
    echo "Código de error: " . $e->getCode() . "\n";
}
