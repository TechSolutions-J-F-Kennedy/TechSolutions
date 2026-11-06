import connection from "../database/db.js";

export const crearResenaModel = async ({ servicio_id, cliente_id, tecnico_id, estrella, comentario }) => {
    const sql = `
        INSERT INTO resenas (servicio_id, cliente_id, tecnico_id, estrella, comentario, fecha)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await connection.query(sql, [
        servicio_id || null,
        cliente_id,
        tecnico_id,
        estrella,
        comentario || ''
    ]);
    return result.insertId;
};

export const actualizarResenaModel = async ({ servicio_id, estrella, comentario }) => {
    const sql = `
        UPDATE resenas 
        SET estrella = ?, comentario = ?, fecha = NOW()
        WHERE servicio_id = ?
    `;
    const [result] = await connection.query(sql, [estrella, comentario || '', servicio_id]);
    return result;
};

export const getResenaByServicioId = async (servicioId) => {
    const sql = `SELECT * FROM resenas WHERE servicio_id = ? LIMIT 1`;
    const [rows] = await connection.query(sql, [servicioId]);
    return rows[0] || null;
};

// --- NUEVAS FUNCIONES ---

// Obtener todas las reseñas hechas por un cliente
export const getResenasPorClienteModel = async (clienteId) => {
    const sql = `
        SELECT r.*, u.nombre AS tecnico_nombre
        FROM resenas r
        LEFT JOIN Usuarios u ON r.tecnico_id = u.id
        WHERE r.cliente_id = ?
        ORDER BY r.fecha DESC
    `;
    const [rows] = await connection.query(sql, [clienteId]);
    return rows;
};

// Eliminar reseña por ID
export const eliminarResenaModel = async (resenaId, clienteId) => {
    const sql = `DELETE FROM resenas WHERE id = ? AND cliente_id = ?`;
    const [result] = await connection.query(sql, [resenaId, clienteId]);
    return result.affectedRows > 0;
};