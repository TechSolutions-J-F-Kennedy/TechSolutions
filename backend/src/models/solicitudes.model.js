import connection from "../database/db.js";

export async function crearSolicitud(datos) {
    const sql = `
        INSERT INTO Solicitudes
        (id_usuario, direccion, descripcion, foto, estado)
        VALUES (?, ?, ?, ?, 'Solicitado')
    `;

    const valores = [
        datos.id_usuario,
        datos.direccion,
        datos.descripcion,
        datos.foto
    ];

    const [resultado] = await connection.query(sql, valores);

    return {
        id: resultado.insertId,
        estado: "Solicitado"
    };
}

export default {
    crearSolicitud
};

