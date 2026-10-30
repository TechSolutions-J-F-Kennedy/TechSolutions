import connection from "../database/db.js";

export const getPedidosById = async (clienteId) => {
        const sql = `
        SELECT 
        s.*,
        u.nombre_real AS tecnico_nombre,
        u.apellido AS tecnico_apellido,
        u.email AS tecnico_email,
        u.telefono AS tecnico_telefono,
        u.categoria AS tecnico_categoria,
        u.reputacion_promedio AS tecnico_reputacion
        FROM Servicios s
        INNER JOIN Usuarios u ON s.tecnico_id = u.id
        WHERE s.cliente_id = ?`;
        const [rows] = await connection.query(sql, clienteId);
        return rows;     
}

