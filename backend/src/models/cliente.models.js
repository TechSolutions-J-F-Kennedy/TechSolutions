//Consultas SQL de las pantallas del cliente (rol 'usuario'):
import connection from "../database/db.js";

//Verificar que el id sea de un cliente
export const esCliente = async (clienteId) => {
    const [rows] = await connection.query("SELECT id FROM Usuarios WHERE id = ? AND rol = 'usuario'", [clienteId]);
    return rows.length > 0;
};

//Solicitudes que el cliente pidió y que todavía ningún técnico aceptó
export const getSolicitudesByCliente = async (clienteId) => {
    const [rows] = await connection.query(
        `SELECT id, direccion, descripcion, estado,
            UNIX_TIMESTAMP(fecha_creacion) * 1000 AS fecha
        FROM Solicitudes
        WHERE id_usuario = ? AND estado = 'Solicitado'
        ORDER BY fecha_creacion DESC`,
        [clienteId]
    );
    return rows;
};

//Direcciones guardadas del cliente (tabla direcciones_usuario), la principal primero
export const getDireccionesCliente = async (clienteId) => {
    const [rows] = await connection.query(
        `SELECT id, alias, direccion_completa, latitud, longitud
        FROM direcciones_usuario
        WHERE usuario_id = ?
        ORDER BY es_principal DESC, id ASC`,
        [clienteId]
    );
    return rows;
};

//Servicios del cliente, con el técnico asignado y la reseña (si ya calificó)
export const getServiciosByCliente = async (clienteId) => {
    const [rows] = await connection.query(
        `SELECT Servicios.*,
            CONCAT_WS(' ', t.nombre_real, t.apellido) AS tecnico,
            t.nombre AS tecnico_usuario,
            t.categoria AS tecnico_categoria,
            t.reputacion_promedio AS tecnico_reputacion,
            r.estrella AS mi_estrella
        FROM Servicios
        LEFT JOIN Usuarios t ON Servicios.tecnico_id = t.id
        LEFT JOIN resenas r ON r.servicio_id = Servicios.id AND r.cliente_id = Servicios.cliente_id
        WHERE Servicios.cliente_id = ?
        ORDER BY Servicios.fecha_creacion DESC`,
        [clienteId]
    );
    return rows;
};


//Servicio del cliente (para validar la reseña)
export const getServicioDeCliente = async (clienteId, servicioId) => {
    const [rows] = await connection.query(
        "SELECT id, tecnico_id, Estado FROM Servicios WHERE id = ? AND cliente_id = ?",
        [servicioId, clienteId]
    );
    return rows[0];
};

export const existeResena = async (servicioId) => {
    const [rows] = await connection.query("SELECT id FROM resenas WHERE servicio_id = ?", [servicioId]);
    return rows.length > 0;
};

//Guardar la reseña y recalcular el promedio de estrellas del técnico
export const crearResena = async ({ servicio_id, cliente_id, tecnico_id, estrella, comentario }) => {
    await connection.query(
        `INSERT INTO resenas (servicio_id, cliente_id, tecnico_id, estrella, comentario, fecha)
        VALUES (?, ?, ?, ?, ?, CURDATE())`,
        [servicio_id, cliente_id, tecnico_id, estrella, comentario]
    );
    await connection.query(
        `UPDATE Usuarios
        SET reputacion_promedio = (SELECT AVG(estrella) FROM resenas WHERE tecnico_id = ?)
        WHERE id = ?`,
        [tecnico_id, tecnico_id]
    );
};

//Cambiar datos del perfil del cliente
export const actualizarPerfilCliente = async (clienteId, { nombre_real, apellido, email, telefono, password }) => {
    const passwordSql = password ? ", password = ?" : "";
    const valores = [nombre_real, apellido, email, telefono];
    if (password) valores.push(password);
    valores.push(clienteId);

    await connection.query(
        `UPDATE Usuarios
        SET nombre_real = ?, apellido = ?, email = ?, telefono = ?${passwordSql}
        WHERE id = ? AND rol = 'usuario'`,
        valores
    );

    const [rows] = await connection.query(
        `SELECT id, nombre, nombre_real, apellido, email, telefono, categoria, rol, disponibilidad
        FROM Usuarios WHERE id = ?`,
        [clienteId]
    );
    return rows[0];
};
