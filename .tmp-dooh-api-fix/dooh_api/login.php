<?php
/**
 * DOOH Maps API - Login
 *
 * Metodo: POST
 * Ruta:
 * /public_html/Dooh/dooh_api/login.php
 *
 * Body aceptado:
 * {
 *   "correo": "elena@ntpmedia.com.mx",
 *   "contrasena": "mapas2026"
 * }
 *
 * Tambien acepta alias del frontend:
 * - usuario / email
 * - password
 */

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

requerir_metodo('POST');

try {
    $datos = leer_json_body();

    $correo = normalizar_correo(
        (string) (
            $datos['correo']
            ?? $datos['usuario']
            ?? $datos['email']
            ?? ''
        )
    );

    $contrasena = (string) (
        $datos['contrasena']
        ?? $datos['password']
        ?? ''
    );

    if ($correo === '' || $contrasena === '') {
        responder_json([
            'ok' => false,
            'mensaje' => 'Correo y contrasena son obligatorios',
        ], 400);
    }

    $pdo = obtener_conexion();

    $stmt = $pdo->prepare("
        SELECT
            id,
            nombre,
            correo,
            hash_contrasena,
            rol,
            esta_activo,
            ultimo_acceso
        FROM ntp_dooh_usuarios
        WHERE correo = :correo
        LIMIT 1
    ");

    $stmt->execute([
        ':correo' => $correo,
    ]);

    $usuario = $stmt->fetch();

    if (!$usuario || !password_verify($contrasena, $usuario['hash_contrasena'])) {
        responder_json([
            'ok' => false,
            'mensaje' => 'Correo o contrasena incorrectos',
        ], 401);
    }

    if ((int) $usuario['esta_activo'] !== 1) {
        responder_json([
            'ok' => false,
            'mensaje' => 'El usuario esta desactivado',
        ], 403);
    }

    $token = bin2hex(random_bytes(32));
    $hashToken = crear_hash_token($token);
    $fechaExpiracion = date('Y-m-d H:i:s', time() + ((int) SESSION_HOURS * 3600));

    $pdo->beginTransaction();

    $stmtSesion = $pdo->prepare("
        INSERT INTO ntp_dooh_sesiones (
            usuario_id,
            hash_token,
            fecha_expiracion,
            direccion_ip,
            navegador_usuario,
            revocada,
            fecha_creacion
        ) VALUES (
            :usuario_id,
            :hash_token,
            :fecha_expiracion,
            :direccion_ip,
            :navegador_usuario,
            0,
            NOW()
        )
    ");

    $stmtSesion->execute([
        ':usuario_id' => (int) $usuario['id'],
        ':hash_token' => $hashToken,
        ':fecha_expiracion' => $fechaExpiracion,
        ':direccion_ip' => obtener_ip_cliente(),
        ':navegador_usuario' => obtener_navegador_usuario(),
    ]);

    $stmtUpdate = $pdo->prepare("
        UPDATE ntp_dooh_usuarios
        SET ultimo_acceso = NOW(),
            fecha_actualizacion = NOW()
        WHERE id = :id
    ");

    $stmtUpdate->execute([
        ':id' => (int) $usuario['id'],
    ]);

    $pdo->commit();

    $usuario['ultimo_acceso'] = date('Y-m-d H:i:s');

    registrar_bitacora(
        (int) $usuario['id'],
        'login',
        'usuario',
        (int) $usuario['id'],
        null,
        null,
        ['correo' => $usuario['correo'], 'rol' => $usuario['rol']]
    );

    responder_json([
        'ok' => true,
        'mensaje' => 'Inicio de sesion correcto',
        'token' => $token,
        'expiraEn' => $fechaExpiracion,
        'usuario' => formatear_usuario($usuario),
    ]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Error al iniciar sesion',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
