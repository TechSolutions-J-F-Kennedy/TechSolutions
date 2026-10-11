import connection from "../database/db.js";

export const crearUsuario = async ({ nombre, email, password, telefono }) => {
    const sql = "INSERT INTO Usuarios (nombre, email, password, telefono, rol) VALUES (?, ?, ?, ?, ?)";
    const [resultado] = await connection.query(sql, [nombre, email, password, telefono, "usuario"]);
    return resultado.insertId;
};

export const inicioSesion = async ({ email, password }) => {
    const sql = 'SELECT id, nombre, email, rol, telefono FROM Usuarios WHERE (email = ? OR nombre = ?) AND password = ?';
    const [resultado] = await connection.query(sql, [email, email, password]);
    return resultado[0]; // Retorna el usuario encontrado o undefined
};


