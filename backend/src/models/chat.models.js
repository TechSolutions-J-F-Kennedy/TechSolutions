//Consultas SQL de la tabla Mensajes (chat entre técnico y usuario)
import connection from "../database/db.js";

//Columnas según quién soy: el técnico usa tecnico_id y el usuario usa usuario_id
const COLUMNAS = {
    tecnico: { mia: "tecnico_id", otra: "usuario_id", servMia: "tecnico_id", servOtra: "cliente_id", otroRol: "usuario" },
    usuario: { mia: "usuario_id", otra: "tecnico_id", servMia: "cliente_id", servOtra: "tecnico_id", otroRol: "tecnico" }
};

//UNIX_TIMESTAMP devuelve la hora exacta sin importar la zona horaria del servidor
const CAMPOS_MENSAJE = `id, usuario_id, tecnico_id, remitente, mensaje,
    UNIX_TIMESTAMP(created_at) * 1000 AS fecha`;

//Rol de un usuario ('tecnico', 'usuario', ...) o null si no existe
export const getRolUsuario = async (usuarioId) => {
    const [rows] = await connection.query('SELECT rol FROM Usuarios WHERE id = ?', [usuarioId]);
    return rows[0]?.rol ?? null;
};

//Lista de conversaciones: personas con las que ya hay mensajes
//o que están vinculadas por un servicio (técnico <-> cliente)
export const getConversacionesByUsuario = async (usuarioId, rol) => {
    const c = COLUMNAS[rol];
    const sql = `SELECT u.id, u.nombre, u.nombre_real, u.apellido, u.rol,
        m.mensaje AS ultimo_mensaje,
        m.remitente AS ultimo_remitente,
        UNIX_TIMESTAMP(m.created_at) * 1000 AS ultima_fecha
        FROM Usuarios u
        LEFT JOIN Mensajes m ON m.id = (
            SELECT MAX(m2.id) FROM Mensajes m2
            WHERE m2.${c.otra} = u.id AND m2.${c.mia} = ?
        )
        WHERE u.id <> ? AND u.rol = ? AND (
            m.id IS NOT NULL
            OR u.id IN (SELECT ${c.servOtra} FROM Servicios WHERE ${c.servMia} = ?)
        )
        ORDER BY ultima_fecha IS NULL, ultima_fecha DESC`;
    const [rows] = await connection.query(sql, [usuarioId, usuarioId, c.otroRol, usuarioId]);
    return rows;
};

//Todos los mensajes entre un usuario y un técnico, del más viejo al más nuevo
export const getMensajesConversacion = async (usuarioId, tecnicoId) => {
    const [rows] = await connection.query(
        `SELECT ${CAMPOS_MENSAJE} FROM Mensajes
        WHERE usuario_id = ? AND tecnico_id = ?
        ORDER BY id ASC`,
        [usuarioId, tecnicoId]
    );
    return rows;
};

//Guardar un mensaje nuevo y devolverlo completo
export const crearMensaje = async ({ usuario_id, tecnico_id, remitente, mensaje }) => {
    const [resultado] = await connection.query(
        'INSERT INTO Mensajes (usuario_id, tecnico_id, remitente, mensaje) VALUES (?, ?, ?, ?)',
        [usuario_id, tecnico_id, remitente, mensaje]
    );
    const [rows] = await connection.query(
        `SELECT ${CAMPOS_MENSAJE} FROM Mensajes WHERE id = ?`,
        [resultado.insertId]
    );
    return rows[0];
};
