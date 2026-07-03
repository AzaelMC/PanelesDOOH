<?php
/**
 * DOOH Maps API - Usuarios
 *
 * GET  /usuarios.php
 * POST /usuarios.php  (solo administrador)
 */

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metodo === 'GET') {
        $incluirInactivos = (($usuario['rol'] ?? '') === 'administrador') && (($_GET['incluirInactivos'] ?? '') === '1');

        $where = $incluirInactivos ? '1 = 1' : 'u.esta_activo = 1';

        $stmt = $pdo->prepare("
            SELECT
                u.id,
                u.nombre,
                u.correo,
                u.rol,
                u.esta_activo,
                u.ultimo_acceso,
                u.fecha_creacion,
                u.fecha_actualizacion,
                COUNT(c.id) AS total_cotizaciones_creadas
            FROM ntp_dooh_usuarios u
            LEFT JOIN ntp_dooh_cotizaciones c
                ON c.creado_por_usuario_id = u.id
            WHERE $where
            GROUP BY u.id
            ORDER BY u.nombre ASC
        ");
        $stmt->execute();

        $usuarios = array_map(static function (array $fila): array {
            return [
                'id' => (int) $fila['id'],
                'nombre' => $fila['nombre'],
                'correo' => $fila['correo'],
                'area' => '',
                'rol' => $fila['rol'],
                'estaActivo' => ((int) $fila['esta_activo']) === 1,
                'estadoCredenciales' => ((int) $fila['esta_activo']) === 1 ? 'Activo' : 'Inactivo',
                'ultimoAcceso' => $fila['ultimo_acceso'],
                'totalCotizacionesCreadas' => (int) $fila['total_cotizaciones_creadas'],
                'fechaCreacion' => $fila['fecha_creacion'],
                'fechaActualizacion' => $fila['fecha_actualizacion'],
            ];
        }, $stmt->fetchAll());

        responder_json([
            'ok' => true,
            'usuarios' => $usuarios,
        ]);
    }

    if ($metodo === 'POST') {
        requerir_rol($usuario, ['administrador']);

        $datos = leer_json_body();

        $nombre = texto_limpio(valor_de($datos, ['nombre']));
        $correo = normalizar_correo(texto_limpio(valor_de($datos, ['correo', 'email'])));
        $contrasena = texto_limpio(valor_de($datos, ['contrasena', 'password']));
        $rol = texto_limpio(valor_de($datos, ['rol']), 'editor');

        if ($nombre === '' || $correo === '' || $contrasena === '') {
            responder_json([
                'ok' => false,
                'mensaje' => 'Nombre, correo y contrasena son obligatorios',
            ], 400);
        }

        if (!in_array($rol, ['administrador', 'editor', 'comercial', 'tecnico', 'visor'], true)) {
            responder_json([
                'ok' => false,
                'mensaje' => 'Rol no valido',
            ], 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO ntp_dooh_usuarios (
                nombre,
                correo,
                hash_contrasena,
                rol,
                esta_activo,
                fecha_creacion,
                fecha_actualizacion
            ) VALUES (
                :nombre,
                :correo,
                :hash_contrasena,
                :rol,
                1,
                NOW(),
                NOW()
            )
        ");

        $stmt->execute([
            ':nombre' => $nombre,
            ':correo' => $correo,
            ':hash_contrasena' => password_hash($contrasena, PASSWORD_DEFAULT),
            ':rol' => $rol,
        ]);

        $nuevoUsuarioId = (int) $pdo->lastInsertId();

        registrar_bitacora(
            (int) $usuario['id'],
            'usuario_creado',
            'usuario',
            $nuevoUsuarioId,
            null,
            null,
            ['correo' => $correo, 'rol' => $rol]
        );

        responder_json([
            'ok' => true,
            'mensaje' => 'Usuario creado correctamente',
            'usuarioId' => $nuevoUsuarioId,
        ], 201);
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Metodo no permitido',
    ], 405);
} catch (Throwable $error) {
    responder_json([
        'ok' => false,
        'mensaje' => 'Error procesando usuarios',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
