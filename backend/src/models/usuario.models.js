//Consultas SQL sobre la tabla Usuarios (compartidas por todos los roles):
import connection from "../database/db.js";

export const crearUsuario = async ({ nombre, email, password, telefono }) => {
    const sql = "INSERT INTO usuarios (nombre, email, password, telefono) VALUES (?, ?, ?, ?)";
    const [resultado] = await connection.query(sql, [nombre, email, password, telefono]);
    return resultado.insertId;
};

//Form de inicio de sesion: busca por email o nombre de usuario
export const inicioSesion = async ({ email, password }) => {
    const sql = `SELECT id, nombre, nombre_real, apellido, email, telefono, categoria, rol, disponibilidad
        FROM Usuarios WHERE (email = ? OR nombre = ?) AND password = ?`;
    const [resultado] = await connection.query(sql, [email, email, password]);
    return resultado[0]; // Retorna el usuario encontrado o undefined
};
