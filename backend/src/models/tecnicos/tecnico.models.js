import connection from "../../database/db.js";

// 1. Consulta fija para obtener TODOS los técnicos con su ubicación
export const getTodosTecnicosConUbicacion = async () => {
    const sql = `
        SELECT 
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.categoria,
            u.descripcion,
            u.reputacion_promedio,
            d.direccion_completa,
            d.latitud,
            d.longitud
        FROM Usuarios u
        INNER JOIN direcciones_usuario d ON u.id = d.usuario_id
        WHERE u.rol = ? AND d.es_principal = 1
    `;

    const [rows] = await connection.query(sql, ["tecnico"]);
    return rows;
};

// 2. Consulta fija para obtener técnicos por CATEGORÍA con su ubicación
export const getTecnicosPorCategoriaConUbicacion = async (categoria) => {
    const sql = `
        SELECT 
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.categoria,
            u.descripcion,
            u.reputacion_promedio,
            d.direccion_completa,
            d.latitud,
            d.longitud
        FROM Usuarios u
        INNER JOIN direcciones_usuario d ON u.id = d.usuario_id
        WHERE u.rol = ? AND u.categoria = ? AND d.es_principal = 1
    `;

    const [rows] = await connection.query(sql, ["tecnico", categoria]);
    return rows;
};