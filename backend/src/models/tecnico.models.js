//Define las funciones que ejecutan las consultas SQL en la base de datos:
import connection from "../database/db.js";

//Obtener todos los servicios de un técnico específico
export const getTodosLosServiciosByTecnico = async ({tecnicoId }) => {
    const sql = `SELECT Servicios.*,
        CONCAT_WS(' ', Usuarios.nombre_real, Usuarios.apellido) AS cliente
        FROM Servicios
        LEFT JOIN Usuarios ON Servicios.cliente_id = Usuarios.id
        WHERE Servicios.tecnico_id = ?
        ORDER BY Servicios.fecha_creacion DESC`;
    const [rows] = await connection.query(sql, [tecnicoId]);
    return rows;
}

//Obtener solo los servicios pendientes de un técnico específico
export const getServiciosPendientesByTecnico = async (tecnicoId) => {
    const sql = `SELECT Servicios.*,
        Usuarios.telefono AS telefono,
        CONCAT_WS(' ', Usuarios.nombre_real, Usuarios.apellido) AS cliente
        FROM Servicios
        LEFT JOIN Usuarios ON Servicios.cliente_id = Usuarios.id
        WHERE Servicios.tecnico_id = ? AND Servicios.Estado = ?
        ORDER BY Servicios.fecha_creacion DESC`;
    const [rows] = await connection.query(sql, [tecnicoId, 'pendiente']);
    return rows;
};

//Cambiar la disponibilidad del técnico (disponible o no disponible) con el switch del inicio
export const actualizarDisponibilidadTecnico = async (tecnicoId, disponibilidad) => {
    const sql = 'UPDATE Usuarios SET disponibilidad = ? WHERE id = ? AND rol = ?';
    const [resultado] = await connection.query(sql, [disponibilidad, tecnicoId, 'tecnico']);
    return resultado.affectedRows > 0;
};

//Cambiar datos del perfil del técnico
export const actualizarPerfilTecnico = async (tecnicoId, { nombre_real, apellido, email, telefono, categoria, password }) => {
    const [tecnicos] = await connection.query(
        'SELECT id FROM Usuarios WHERE id = ? AND rol = ?',[tecnicoId, 'tecnico']
    );
    if (tecnicos.length === 0) return null;

    const passwordSql = password ? ', password = ?' : '';
    const valores = [nombre_real, apellido, email, telefono, categoria];
    if (password) valores.push(password);
    valores.push(tecnicoId);

    await connection.query(
        `UPDATE Usuarios
        SET nombre_real = ?, apellido = ?, email = ?, telefono = ?, categoria = ?${passwordSql}
        WHERE id = ? AND rol = 'tecnico'`,
        valores
    );

    const [actualizados] = await connection.query(
        `SELECT id, nombre, nombre_real, apellido, email, telefono, categoria, rol, disponibilidad
        FROM Usuarios WHERE id = ?`,
        [tecnicoId]
    );
    return actualizados[0];
};

//Form de inicio de sesion
export const inicioSesion = async ({ email, password }) => {
    const sql = `SELECT id, nombre, nombre_real, apellido, email, telefono, categoria, rol, disponibilidad
        FROM Usuarios WHERE (email = ? OR nombre = ?) AND password = ?`;
    const [resultado] = await connection.query(sql, [email, email, password]);
    return resultado[0]; // Retorna el usuario encontrado o undefined
};
