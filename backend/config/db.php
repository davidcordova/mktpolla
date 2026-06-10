<?php
// backend/config/db.php

// Detección dinámica de entorno (local vs producción)
$isLocal = false;
if (php_sapi_name() === 'cli') {
    $isLocal = true;
} elseif (isset($_SERVER['HTTP_HOST']) && (
    str_starts_with($_SERVER['HTTP_HOST'], 'localhost') || 
    str_starts_with($_SERVER['HTTP_HOST'], '127.0.0.1')
)) {
    $isLocal = true;
}

if ($isLocal) {
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'polla_mundialista_2026');
} else {
    define('DB_HOST', 'localhost');
    define('DB_USER', 'alterno_mktpolla');
    define('DB_PASS', 'M1un1c4cl4v3');
    define('DB_NAME', 'alterno_mktpolla');
}

function getDBConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
    try {
        // Intentar conectar con la base de datos específica
        $pdo = new PDO($dsn . ";dbname=" . DB_NAME, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        // Si la base de datos no existe, intentar crearla
        if ($e->getCode() == 1049 || strpos($e->getMessage(), 'Unknown database') !== false) {
            try {
                // Conectar sin base de datos
                $tempPdo = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                
                // Cargar e inicializar base de datos usando schema.sql y seed.sql
                $schemaPath = __DIR__ . '/../../database/schema.sql';
                $seedPath = __DIR__ . '/../../database/seed.sql';
                
                if (file_exists($schemaPath)) {
                    $schemaSql = file_get_contents($schemaPath);
                    // Ejecutar múltiples queries separadas por ;
                    $tempPdo->exec($schemaSql);
                }
                
                if (file_exists($seedPath)) {
                    $seedSql = file_get_contents($seedPath);
                    $tempPdo->exec($seedSql);
                }
                
                // Conectar de nuevo ahora que ya existe
                $pdo = new PDO($dsn . ";dbname=" . DB_NAME, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
                return $pdo;
            } catch (PDOException $e2) {
                http_response_code(500);
                echo json_encode([
                    "error" => "Error al inicializar la base de datos: " . $e2->getMessage()
                ]);
                exit;
            }
        } else {
            http_response_code(500);
            echo json_encode([
                "error" => "Error de conexión a la base de datos: " . $e->getMessage()
            ]);
            exit;
        }
    }
}
