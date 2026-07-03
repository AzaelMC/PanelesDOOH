<?php
/**
 * DOOH Maps API - Helpers de autenticacion
 * Version: auth_fix_2026_06_30_v1
 */
declare(strict_types=1);

require_once __DIR__ . '/db.php';

function crear_hash_token(string $token): string
{
    return hash_hmac('sha256', $token, APP_SECRET);
}

function obtener_headers_servidor(): array
{
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            return $headers;
        }
    }

    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (is_array($headers)) {
            return $headers;
        }
    }

    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (strpos($key, 'HTTP_') === 0) {
            $nombre = str_replace('_', '-', strtolower(substr($key, 5)));
            $headers[$nombre] = $value;
        }
    }
    return $headers;
}

function obtener_candidatos_autorizacion_servidor(): array
{
    $candidatos = [];
    $headers = obtener_headers_servidor();

    foreach ($headers as $key => $value) {
        if (strtolower((string) $key) === 'authorization' && is_string($value)) {
            $valor = trim($value);
            if ($valor !== '') {
                $candidatos[] = $valor;
            }
        }
    }

    $serverKeys = [
        'HTTP_AUTHORIZATION',
        'REDIRECT_HTTP_AUTHORIZATION',
        'REDIRECT_REDIRECT_HTTP_AUTHORIZATION',
        'AUTHORIZATION',
        'ORIG_HTTP_AUTHORIZATION',
        'CGI_HTTP_AUTHORIZATION',
    ];

    foreach ($serverKeys as $serverKey) {
        if (!isset($_SERVER[$serverKey]) || !is_string($_SERVER[$serverKey])) {
            continue;
        }

        $valor = trim($_SERVER[$serverKey]);
        if ($valor !== '') {
            $candidatos[] = $valor;
        }
    }

    return array_values(array_unique($candidatos));
}

function obtener_token_autorizacion(): ?string
{
    $candidatos = obtener_candidatos_autorizacion_servidor();

    foreach ($candidatos as $authorization) {
        if (preg_match('/^Bearer\s+([a-f0-9]{64})$/i', $authorization, $matches)) {
            return $matches[1];
        }
    }

    return null;
}

function formatear_usuario(array $usuario): array
{
    return [
        'id' => (int) $usuario['id'],
        'nombre' => $usuario['nombre'],
        'correo' => $usuario['correo'],
        'rol' => $usuario['rol'],
        'estaActivo' => ((int) $usuario['esta_activo']) === 1,
        'ultimoAcceso' => $usuario['ultimo_acceso'],
    ];
}

function obtener_usuario_por_token(?string $token): ?array
{
    if (!is_string($token) || trim($token) === '') {
        return null;
    }

    if (!preg_match('/^[a-f0-9]{64}$/i', $token)) {
        return null;
    }

    $pdo = obtener_conexion();
    $hashToken = crear_hash_token($token);

    $stmt = $pdo->prepare("
        SELECT
            u.id,
            u.nombre,
            u.correo,
            u.rol,
            u.esta_activo,
            u.ultimo_acceso,
            s.id AS sesion_id,
            s.fecha_expiracion,
            s.revocada
        FROM ntp_dooh_sesiones s
        INNER JOIN ntp_dooh_usuarios u
            ON u.id = s.usuario_id
        WHERE s.hash_token = :hash_token
          AND s.revocada = 0
          AND u.esta_activo = 1
          AND s.fecha_expiracion > NOW()
        LIMIT 1
    ");

    $stmt->execute([':hash_token' => $hashToken]);
    $usuario = $stmt->fetch();

    return $usuario ?: null;
}

function obtener_usuario_sesion_actual(): ?array
{
    $token = obtener_token_autorizacion();

    if (!$token) {
        return null;
    }

    return obtener_usuario_por_token($token);
}

function requerir_sesion(): array
{
    $usuario = obtener_usuario_sesion_actual();

    if (!$usuario) {
        responder_json([
            'ok' => false,
            'mensaje' => 'Sesion no valida o expirada',
            'autenticado' => false,
        ], 401);
    }

    return $usuario;
}

function requerir_rol(array $usuario, array $rolesPermitidos): void
{
    if (!in_array($usuario['rol'], $rolesPermitidos, true)) {
        responder_json([
            'ok' => false,
            'mensaje' => 'No tienes permisos para realizar esta accion',
        ], 403);
    }
}

function registrar_bitacora(
    ?int $usuarioId,
    string $accion,
    string $tipoEntidad = 'sistema',
    ?int $entidadId = null,
    ?int $cotizacionId = null,
    ?array $valoresAnteriores = null,
    ?array $valoresNuevos = null
): void {
    try {
        $pdo = obtener_conexion();

        $stmt = $pdo->prepare("
            INSERT INTO ntp_dooh_bitacora (
                usuario_id,
                cotizacion_id,
                accion,
                tipo_entidad,
                entidad_id,
                valores_anteriores,
                valores_nuevos,
                direccion_ip,
                navegador_usuario,
                fecha_creacion
            ) VALUES (
                :usuario_id,
                :cotizacion_id,
                :accion,
                :tipo_entidad,
                :entidad_id,
                :valores_anteriores,
                :valores_nuevos,
                :direccion_ip,
                :navegador_usuario,
                NOW()
            )
        ");

        $stmt->execute([
            ':usuario_id' => $usuarioId,
            ':cotizacion_id' => $cotizacionId,
            ':accion' => $accion,
            ':tipo_entidad' => $tipoEntidad,
            ':entidad_id' => $entidadId,
            ':valores_anteriores' => $valoresAnteriores ? json_encode($valoresAnteriores, JSON_OPTIONS) : null,
            ':valores_nuevos' => $valoresNuevos ? json_encode($valoresNuevos, JSON_OPTIONS) : null,
            ':direccion_ip' => obtener_ip_cliente(),
            ':navegador_usuario' => obtener_navegador_usuario(),
        ]);
    } catch (Throwable $error) {
        error_log('Error registrando bitacora DOOH Maps: ' . $error->getMessage());
    }
}
