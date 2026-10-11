import connection from "../../database/db.js";

export const getTodosLosTecnicos = async () => {
        const sql = "SELECT * FROM Usuarios WHERE rol = ?";
        const [rows] = await connection.query(sql, ["tecnico"]);
        return rows;     
}
export const getTecnicosByCategoria = async (categoria) => {
    const sql = "SELECT * FROM Usuarios WHERE rol = ? AND categoria = ?";
    const [rows] = await connection.query(sql, ["tecnico", categoria]);
    return rows;
}
