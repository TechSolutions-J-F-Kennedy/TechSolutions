import connection from "../database/db.js";

// Obtener todos los pedidos de un cliente con datos del técnico y reseña asociada
export const getPedidosById = async (clienteId) => {
    const sql = `
        SELECT 
            s.*,
            u.nombre_real AS tecnico_nombre,
            u.apellido AS tecnico_apellido,
            u.email AS tecnico_email,
            u.telefono AS tecnico_telefono,
            u.categoria AS tecnico_categoria,
            u.reputacion_promedio AS tecnico_reputacion,
            r.id AS resena_id,
            r.estrella AS resena_estrella,
            r.comentario AS resena_comentario
        FROM Servicios s
        INNER JOIN Usuarios u ON s.tecnico_id = u.id
        LEFT JOIN resenas r ON s.id = r.servicio_id
        WHERE s.cliente_id = ?`;
    const [rows] = await connection.query(sql, [clienteId]);
    return rows;     
};

// Obtener un pedido específico por ID
export const getPedidoByServicioId = async (servicioId) => {
    const sql = `SELECT * FROM Servicios WHERE id = ?`;
    const [rows] = await connection.query(sql, [servicioId]);
    return rows[0] || null;
};

// Cancelar un pedido
export const cancelarPedidoModel = async (servicioId) => {
    const sql = `UPDATE Servicios SET Estado = 'cancelado' WHERE id = ?`;
    const [result] = await connection.query(sql, [servicioId]);
    return result;
};

// Actualizar el estado de un pedido (ej: finalizado, completado, cancelado)
export const actualizarEstadoPedidoModel = async (servicioId, nuevoEstado) => {
    const sql = `UPDATE Servicios SET Estado = ? WHERE id = ?`;
    const [result] = await connection.query(sql, [nuevoEstado, servicioId]);
    return result;
};

// Reprogramar fecha y hora de un pedido y reestablecer su estado a pendiente
export const reprogramarPedidoModel = async (servicioId, fechaServicio, horaServicio) => {
    const sql = `UPDATE Servicios SET fecha_servicio = ?, hora_servicio = ?, Estado = 'pendiente' WHERE id = ?`;
    const [result] = await connection.query(sql, [fechaServicio, horaServicio, servicioId]);
    return result;
};