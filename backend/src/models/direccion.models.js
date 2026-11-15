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

export const desmarcarDireccionesPrincipales = async (usuario_id) => {
    const sql = `UPDATE direcciones_usuario SET es_principal = 0 WHERE usuario_id = ?`;
    await connection.query(sql, [usuario_id]);
};

export const obtenerDireccionesPorUsuario = async (usuario_id) => {
    const sql = `SELECT * FROM direcciones_usuario WHERE usuario_id = ? ORDER BY es_principal DESC, id DESC`;
    const [rows] = await connection.query(sql, [usuario_id]);
    return rows;
};

export const obtenerDireccionPorId = async (direccion_id) => {
    const sql = `SELECT id, usuario_id, alias, direccion_completa, latitud, longitud, es_principal FROM direcciones_usuario WHERE id = ?`;
    const [rows] = await connection.query(sql, [direccion_id]);
    return rows[0] || null;
};

export const actualizarDireccionUsuario = async (direccion_id, usuario_id, { alias, direccion_completa, latitud, longitud }) => {
    const sql = `
        UPDATE direcciones_usuario 
        SET alias = ?, direccion_completa = ?, latitud = ?, longitud = ? 
        WHERE id = ? AND usuario_id = ?
    `;
    const [result] = await connection.query(sql, [alias, direccion_completa, latitud, longitud, direccion_id, usuario_id]);
    return result.affectedRows > 0;
};

export const eliminarDireccionUsuario = async (direccion_id, usuario_id) => {
    const sql = `DELETE FROM direcciones_usuario WHERE id = ? AND usuario_id = ? AND es_principal = 0`;
    const [result] = await connection.query(sql, [direccion_id, usuario_id]);
    return result.affectedRows > 0;
};

export const marcarDireccionPrincipal = async (usuario_id, direccion_id) => {
    await desmarcarDireccionesPrincipales(usuario_id);
    const sql = `UPDATE direcciones_usuario SET es_principal = 1 WHERE id = ? AND usuario_id = ?`;
    const [result] = await connection.query(sql, [direccion_id, usuario_id]);
    return result.affectedRows > 0;
};

export const getDireccionPrincipalBD = async (usuarioId) => {
    const sql = `
        SELECT id, direccion_completa, latitud, longitud, es_principal
        FROM direcciones_usuario
        WHERE usuario_id = ? AND es_principal = 1
        LIMIT 1
    `;
    const [rows] = await connection.query(sql, [usuarioId]);
    return rows[0] || null;
};