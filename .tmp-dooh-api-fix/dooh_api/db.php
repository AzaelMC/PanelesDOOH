<?php
/**
 * DOOH Maps API - Conexion y helpers base
 *
 * Ruta esperada:
 * /public_html/Dooh/dooh_api/db.php
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

function configurar_cors(): void
{
    $origen = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (defined('ALLOWED_ORIGINS') && in_array($origen, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origen);
    }

    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Content-Type: application/json; charset=utf-8');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function responder_json(array $respuesta, int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode($respuesta, JSON_OPTIONS);
    exit;
}

function obtener_conexion(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        DB_HOST,
        DB_NAME,
        DB_CHARSET
    );

    $pdo = new PDO(
        $dsn,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    return $pdo;
}

function requerir_metodo(string $metodo): void
{
    $metodoActual = $_SERVER['REQUEST_METHOD'] ?? '';

    if (strtoupper($metodoActual) !== strtoupper($metodo)) {
        responder_json([
            'ok' => false,
            'mensaje' => 'Metodo no permitido',
            'metodo_esperado' => strtoupper($metodo),
            'metodo_recibido' => $metodoActual,
        ], 405);
    }
}

function leer_json_body(): array
{
    $contenido = file_get_contents('php://input');

    if ($contenido === false || trim($contenido) === '') {
        return [];
    }

    $datos = json_decode($contenido, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($datos)) {
        responder_json([
            'ok' => false,
            'mensaje' => 'JSON invalido',
            'detalle' => json_last_error_msg(),
        ], 400);
    }

    return $datos;
}

function obtener_ip_cliente(): ?string
{
    return $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR']
        ?? null;
}

function obtener_navegador_usuario(): ?string
{
    return $_SERVER['HTTP_USER_AGENT'] ?? null;
}

function normalizar_correo(string $correo): string
{
    return strtolower(trim($correo));
}

configurar_cors();
