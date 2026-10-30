import connection from "../database/db.js";

export const crearDireccion = async ({ usuario_id, alias, direccion_completa, latitud, longitud, es_principal }) => {
    const sql = `
        INSERT INTO direcciones_usuario 
        (usuario_id, alias, direccion_completa, latitud, longitud, es_principal) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.query(sql, [
        usuario_id, 
        alias || 'Casa', 
        direccion_completa, 
        latitud || null, 
        longitud || null, 
        es_principal ? 1 : 0
    ]);
    return result.insertId;
};

export const obtenerDireccionesPorUsuario = async (usuario_id) => {
    const sql = `SELECT * FROM direcciones_usuario WHERE usuario_id = ? ORDER BY es_principal DESC`;
    const [rows] = await connection.query(sql, [usuario_id]);
    return rows;
};