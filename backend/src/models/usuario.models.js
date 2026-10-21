//Consultas SQL sobre la tabla Usuarios (compartidas por todos los roles):
import connection from "../database/db.js";
import { encriptarPassword, estaEncriptada, verificarPassword } from "../utils/passwords.js";

//Roles que usan esta app. Las cuentas del panel web (rrhh, operaciones) se loguean con PHP,
//que todavía compara la contraseña sin encriptar, así que a esas no se las encripta al entrar.
const ROLES_APP = ["tecnico", "usuario"];

//Registro de un cliente nuevo (la contraseña se guarda encriptada)
export const crearUsuario = async ({ nombre, email, password, telefono }) => {
    const sql = "INSERT INTO Usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, 'usuario')";
    const [resultado] = await connection.query(sql, [nombre, email, await encriptarPassword(password), telefono]);
    return resultado.insertId;
};

//Form de inicio de sesion: busca por email o nombre de usuario y compara la contraseña
export const inicioSesion = async ({ email, password }) => {
    const sql = `SELECT id, nombre, nombre_real, apellido, email, telefono, categoria, rol, disponibilidad, password
        FROM Usuarios WHERE email = ? OR nombre = ?`;
    const [candidatos] = await connection.query(sql, [email, email]);

    for (const usuario of candidatos) {
        if (!(await verificarPassword(password, usuario.password))) continue;

        //Si la contraseña estaba guardada sin encriptar, aprovechamos para encriptarla
        if (!estaEncriptada(usuario.password) && ROLES_APP.includes(usuario.rol)) {
            await connection.query("UPDATE Usuarios SET password = ? WHERE id = ?", [await encriptarPassword(password), usuario.id]);
        }

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
