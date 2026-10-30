//Consultas SQL de la tabla Mensajes (chat entre técnico y usuario)
import connection from "../database/db.js";

//Columnas según quién soy: el técnico usa tecnico_id y el usuario usa usuario_id
const COLUMNAS = {
    tecnico: { mia: "tecnico_id", otra: "usuario_id", servMia: "tecnico_id", servOtra: "cliente_id", otroRol: "usuario" },
    usuario: { mia: "usuario_id", otra: "tecnico_id", servMia: "cliente_id", servOtra: "tecnico_id", otroRol: "tecnico" }
};

//¿Ya existe la columna Mensajes.imagen? Mientras no exista, el chat sigue andando sin fotos.
//Cuando aparece, se recuerda y no se vuelve a preguntar.
let hayColumnaImagen = false;
export const chatAceptaFotos = async () => {
    if (!hayColumnaImagen) {
        const [rows] = await connection.query("SHOW COLUMNS FROM Mensajes LIKE 'imagen'");
        hayColumnaImagen = rows.length > 0;
    }
    return hayColumnaImagen;
};

//UNIX_TIMESTAMP devuelve la hora exacta sin importar la zona horaria del servidor.
//La foto no viaja en la lista (pesa mucho): solo se avisa si tiene, y se pide aparte.
const camposMensaje = async (prefijo = "") => `${prefijo}id, ${prefijo}usuario_id, ${prefijo}tecnico_id,
    ${prefijo}remitente, ${prefijo}mensaje,
    UNIX_TIMESTAMP(${prefijo}created_at) * 1000 AS fecha,
    ${(await chatAceptaFotos()) ? `${prefijo}imagen IS NOT NULL` : "0"} AS tiene_imagen`;

//Rol de un usuario ('tecnico', 'usuario', ...) o null si no existe
export const getRolUsuario = async (usuarioId) => {
    const [rows] = await connection.query('SELECT rol FROM Usuarios WHERE id = ?', [usuarioId]);
    return rows[0]?.rol ?? null;
};

//Lista de conversaciones: personas con las que ya hay mensajes
//o que están vinculadas por un servicio (técnico <-> cliente)
export const getConversacionesByUsuario = async (usuarioId, rol) => {
    const c = COLUMNAS[rol];
    const conFotos = await chatAceptaFotos();
    const sql = `SELECT u.id, u.nombre, u.nombre_real, u.apellido, u.rol,
        m.mensaje AS ultimo_mensaje,
        m.remitente AS ultimo_remitente,
        UNIX_TIMESTAMP(m.created_at) * 1000 AS ultima_fecha,
        ${conFotos ? "m.imagen IS NOT NULL" : "0"} AS ultimo_tiene_imagen
        FROM Usuarios u
        LEFT JOIN Mensajes m ON m.id = (
            SELECT MAX(m2.id) FROM Mensajes m2
            WHERE m2.${c.otra} = u.id AND m2.${c.mia} = ?
        )
        WHERE u.id <> ? AND u.rol = ? AND (
            m.id IS NOT NULL
            OR u.id IN (SELECT ${c.servOtra} FROM Servicios WHERE ${c.servMia} = ?)
        )
        ORDER BY ultima_fecha IS NULL, ultima_fecha DESC`;
    const [rows] = await connection.query(sql, [usuarioId, usuarioId, c.otroRol, usuarioId]);
    return rows;
};

//Todos los mensajes entre un usuario y un técnico, del más viejo al más nuevo
export const getMensajesConversacion = async (usuarioId, tecnicoId) => {
    const [rows] = await connection.query(
        `SELECT ${await camposMensaje()} FROM Mensajes
        WHERE usuario_id = ? AND tecnico_id = ?
        ORDER BY id ASC`,
        [usuarioId, tecnicoId]
    );
    return rows;
};

//Guardar un mensaje nuevo (texto, foto o las dos cosas) y devolverlo completo
export const crearMensaje = async ({ usuario_id, tecnico_id, remitente, mensaje, imagen }) => {
    const [resultado] = imagen
        ? await connection.query(
            'INSERT INTO Mensajes (usuario_id, tecnico_id, remitente, mensaje, imagen) VALUES (?, ?, ?, ?, ?)',
            [usuario_id, tecnico_id, remitente, mensaje, imagen]
        )
        : await connection.query(
            'INSERT INTO Mensajes (usuario_id, tecnico_id, remitente, mensaje) VALUES (?, ?, ?, ?)',
            [usuario_id, tecnico_id, remitente, mensaje]
        );
    const [rows] = await connection.query(
        `SELECT ${await camposMensaje()} FROM Mensajes WHERE id = ?`,
        [resultado.insertId]
    );
    return rows[0];
};

//La foto de un mensaje (para mostrarla con <img src="...">)
export const getImagenMensaje = async (mensajeId) => {
    if (!(await chatAceptaFotos())) return null;
    const [rows] = await connection.query('SELECT imagen FROM Mensajes WHERE id = ?', [mensajeId]);
    return rows[0]?.imagen ?? null;
};
