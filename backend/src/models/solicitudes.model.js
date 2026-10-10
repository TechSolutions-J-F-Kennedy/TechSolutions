const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: {
        rejectUnauthorized: false
    }
});

async function crearSolicitud(datos) {
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

    const [resultado] = await db.execute(sql, valores);

    return {
        id: resultado.insertId,
        estado: "Solicitado"
    };
}

module.exports = {
    crearSolicitud
};