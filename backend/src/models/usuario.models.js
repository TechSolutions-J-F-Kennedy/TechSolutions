// Consultas SQL sobre la tabla Usuarios (compartidas por todos los roles):
import connection from "../database/db.js";
import { verificarPassword } from "../utils/passwords.js";

// Buscar si el nombre de usuario o el correo ya están registrados
export const buscarUsuarioPorNombreOEmail = async (nombre, email) => {
    const sql = 'SELECT id, nombre, email FROM Usuarios WHERE nombre = ? OR email = ?';
    const [rows] = await connection.query(sql, [nombre, email]);
    return rows;
};

// Foto de perfil (imagen guardada como texto base64 en Usuarios.foto_perfil)
export const getFotoPerfil = async (usuarioId) => {
    const [rows] = await connection.query('SELECT foto_perfil FROM Usuarios WHERE id = ?', [usuarioId]);
    return rows.length ? rows[0].foto_perfil : undefined;
};

export const actualizarFotoPerfil = async (usuarioId, foto) => {
    const [resultado] = await connection.query('UPDATE Usuarios SET foto_perfil = ? WHERE id = ?', [foto, usuarioId]);
    return resultado.affectedRows > 0;
};

export const crearUsuario = async ({ nombre, email, password, telefono }) => {
    const sql = "INSERT INTO Usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?)";
    const [resultado] = await connection.query(sql, [nombre, email, password, telefono, "usuario"]);
    return resultado.insertId;
};

export const inicioSesion = async ({ email, password }) => {
    const sql = 'SELECT id, nombre, email, rol, telefono FROM Usuarios WHERE (email = ? OR nombre = ?) AND password = ?';
    const [resultado] = await connection.query(sql, [email, email, password]);
    return resultado[0];
};

// Obtener contraseña actual del usuario (para validación de seguridad)
export const obtenerPasswordUsuario = async (id) => {
    const sql = 'SELECT password FROM Usuarios WHERE id = ?';
    const [rows] = await connection.query(sql, [id]);
    return rows[0] ? rows[0].password : null;
};

// Cambiar contraseña
export const cambiarPasswordUsuario = async (id, nuevaPassword) => {
    const sql = 'UPDATE Usuarios SET password = ? WHERE id = ?';
    const [resultado] = await connection.query(sql, [nuevaPassword, id]);
    return resultado.affectedRows > 0;
};

// Actualizar información del perfil de usuario
export const actualizarUsuario = async (id, { nombre, email, telefono }) => {
    const sql = "UPDATE Usuarios SET nombre = ?, email = ?, telefono = ? WHERE id = ?";
    const [resultado] = await connection.query(sql, [nombre, email, telefono, id]);
    return resultado.affectedRows > 0;
};