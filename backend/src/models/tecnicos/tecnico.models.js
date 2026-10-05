import connection from "../../database/db.js";

export const getTodosLosTecnicos = async (categoria) => {
    if (!categoria || categoria.toLowerCase()==="todos"){
        const sql = "SELECT id, nombre, nombre_real, apellido, rol, categoria, reputacion_promedio, descripcion FROM Usuarios WHERE rol = ?";
        const [rows] = await connection.query(sql, ["tecnico"]);
        return rows;
    }
    else{
        const sql = "SELECT id, nombre, nombre_real, apellido, rol, categoria, reputacion_promedio, descripcion FROM Usuarios WHERE rol = ? AND categoria = ?";
        const [rows] = await connection.query(sql, ["tecnico", categoria]);
        return rows;
    }
};