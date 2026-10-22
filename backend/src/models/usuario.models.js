//Consultas SQL sobre la tabla Usuarios (compartidas por todos los roles):
import connection from "../database/db.js";
import { verificarPassword } from "../utils/passwords.js";

//Registro de un cliente nuevo
export const crearUsuario = async ({ nombre, email, password, telefono }) => {
    const sql = "INSERT INTO Usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, 'usuario')";
    const [resultado] = await connection.query(sql, [nombre, email, password, telefono]);
    return resultado.insertId;
};

//Form de inicio de sesion: busca por email o nombre de usuario y compara la contraseña
export const inicioSesion = async ({ email, password }) => {
    const sql = `SELECT id, nombre, nombre_real, apellido, email, telefono, categoria, rol, disponibilidad, password
        FROM Usuarios WHERE email = ? OR nombre = ?`;
    const [candidatos] = await connection.query(sql, [email, email]);

    for (const usuario of candidatos) {
        if (!(await verificarPassword(password, usuario.password))) continue;
        delete usuario.password; // nunca se manda la contraseña al frontend
        return usuario;
    }
    return undefined; // usuario o contraseña incorrectos
};

//Foto de perfil (imagen guardada como texto base64 en Usuarios.foto_perfil)
export const getFotoPerfil = async (usuarioId) => {
    const [rows] = await connection.query('SELECT foto_perfil FROM Usuarios WHERE id = ?', [usuarioId]);
    return rows.length ? rows[0].foto_perfil : undefined;
};

export const actualizarFotoPerfil = async (usuarioId, foto) => {
    const [resultado] = await connection.query('UPDATE Usuarios SET foto_perfil = ? WHERE id = ?', [foto, usuarioId]);
    return resultado.affectedRows > 0;
};
