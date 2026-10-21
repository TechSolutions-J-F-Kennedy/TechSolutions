//Define las funciones que ejecutan las consultas SQL en la base de datos:
import connection from "../database/db.js";
import { encriptarPassword } from "../utils/passwords.js";

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
    if (password) valores.push(await encriptarPassword(password));
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

//Obtener un servicio puntual del técnico (para la pantalla de pedido actual)
export const getServicioDeTecnico = async (tecnicoId, servicioId) => {
    const sql = `SELECT Servicios.*,
        Usuarios.telefono AS telefono,
        CONCAT_WS(' ', Usuarios.nombre_real, Usuarios.apellido) AS cliente
        FROM Servicios
        LEFT JOIN Usuarios ON Servicios.cliente_id = Usuarios.id
        WHERE Servicios.id = ? AND Servicios.tecnico_id = ?`;
    const [rows] = await connection.query(sql, [servicioId, tecnicoId]);
    return rows[0];
};

//Cambiar el estado de un servicio del técnico (pendiente, yendo, en proceso, finalizado)
export const actualizarEstadoServicio = async (tecnicoId, servicioId, estado) => {
    const sql = 'UPDATE Servicios SET Estado = ? WHERE id = ? AND tecnico_id = ?';
    const [resultado] = await connection.query(sql, [estado, servicioId, tecnicoId]);
    return resultado.affectedRows > 0;
};

//Guardar (o quitar con null) la foto del trabajo terminado de un servicio del técnico
export const actualizarFotoServicio = async (tecnicoId, servicioId, foto) => {
    const sql = 'UPDATE Servicios SET foto_final = ? WHERE id = ? AND tecnico_id = ?';
    const [resultado] = await connection.query(sql, [foto, servicioId, tecnicoId]);
    return resultado.affectedRows > 0;
};
