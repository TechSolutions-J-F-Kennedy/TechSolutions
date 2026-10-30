import connection from "../database/db.js";

// 1. Guardar un nuevo mensaje
export const crearMensaje = async ({ usuario_id, tecnico_id, remitente, mensaje }) => {
    const sql = `INSERT INTO Mensajes (usuario_id, tecnico_id, remitente, mensaje) VALUES (?, ?, ?, ?)`;
    const [resultado] = await connection.query(sql, [usuario_id, tecnico_id, remitente, mensaje]);
    return resultado.insertId;
};

// 2. Obtener historial y limpiar mensajes antiguos (ej: mayores a 24 horas)
export const obtenerMensajesPorChat = async (usuario_id, tecnico_id) => {
    // Opcional: Borrar mensajes con más de 24 horas de antigüedad antes de consultar
    await connection.query(
        `DELETE FROM Mensajes WHERE created_at < NOW() - INTERVAL 24 HOUR`
    );

    // Obtener los mensajes vigentes entre este usuario y este técnico
    const sql = `
        SELECT remitente, mensaje, DATE_FORMAT(created_at, '%H:%i') as hora 
        FROM Mensajes 
        WHERE usuario_id = ? AND tecnico_id = ? 
        ORDER BY created_at ASC
    `;
    const [resultado] = await connection.query(sql, [usuario_id, tecnico_id]);
    return resultado;
};
export const obtenerChatsPorUsuario = async (usuario_id) => {
    const sql = `
        SELECT 
            m.tecnico_id,
            u.nombre AS nombre_tecnico, 
            m.mensaje AS ultimo_mensaje,
            m.created_at
        FROM Mensajes m
        JOIN Usuarios u ON m.tecnico_id = u.id
        WHERE m.usuario_id = ? AND m.created_at = (
            SELECT MAX(m2.created_at) 
            FROM Mensajes m2 
            WHERE m2.usuario_id = m.usuario_id AND m2.tecnico_id = m.tecnico_id
        )
        ORDER BY m.created_at DESC;
    `;
    const [resultado] = await connection.query(sql, [usuario_id]);
    return resultado;
};