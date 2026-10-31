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
    const [rows] = await connection.query(sql, [clienteId]);
    return rows;     
};

// 1. Obtener un servicio por su ID (para verificar estado antes de cancelar)
export const getPedidoByServicioId = async (servicioId) => {
    const sql = `SELECT * FROM Servicios WHERE id = ?`;
    const [rows] = await connection.query(sql, [servicioId]);
    return rows[0] || null;
};

// 2. Actualizar el estado del servicio a 'cancelado'
export const cancelarPedidoModel = async (servicioId) => {
    const sql = `UPDATE Servicios SET Estado = 'cancelado' WHERE id = ?`;
    const [result] = await connection.query(sql, [servicioId]);
    return result;
};