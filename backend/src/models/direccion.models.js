import connection from "../database/db.js";

export const crearDireccion = async ({ usuario_id, alias, direccion_completa, latitud, longitud, es_principal }) => {
    // Si viene marcada como principal, desmarcamos las demás del mismo usuario primero
    if (es_principal) {
        await connection.query(
            `UPDATE direcciones_usuario SET es_principal = 0 WHERE usuario_id = ?`,
            [usuario_id]
        );
    }

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
    const sql = `SELECT * FROM direcciones_usuario WHERE usuario_id = ? ORDER BY es_principal DESC, id DESC`;
    const [rows] = await connection.query(sql, [usuario_id]);
    return rows;
};

// Nueva: Marca una dirección específica como principal y desmarca el resto
export const marcarDireccionPrincipal = async (usuario_id, direccion_id) => {
    // 1. Desmarcar todas las direcciones actuales del usuario
    await connection.query(
        `UPDATE direcciones_usuario SET es_principal = 0 WHERE usuario_id = ?`,
        [usuario_id]
    );

    // 2. Establecer como principal la seleccionada
    const sql = `UPDATE direcciones_usuario SET es_principal = 1 WHERE id = ? AND usuario_id = ?`;
    const [result] = await connection.query(sql, [direccion_id, usuario_id]);

    return result.affectedRows > 0;
};