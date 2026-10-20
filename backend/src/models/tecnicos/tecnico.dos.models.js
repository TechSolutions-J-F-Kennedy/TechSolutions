import connection from "../../database/db.js";

// Obtener todos los técnicos con sus coordenadas principales
export const getTecnicosConUbicacion = async (categoria = null) => {
    let sql = `
        SELECT 
            u.id,
            u.nombre,
            u.email,
            u.telefono,
            u.categoria,
            d.direccion_completa,
            d.latitud,
            d.longitud
        FROM Usuarios u
        INNER JOIN direcciones_usuario d ON u.id = d.usuario_id
        WHERE u.rol = ? AND d.es_principal = 1
    `;

    const params = ["tecnico"];

    if (categoria) {
        sql += ` AND u.categoria = ?`;
        params.push(categoria);
    }

    const [rows] = await connection.query(sql, params);
    return rows;
};