//Pedidos de los clientes (tabla Solicitudes) y su reparto a los técnicos cercanos
import connection from "../database/db.js";
import { RADIO_KM, sqlDistanciaKm } from "../utils/geo.js";

//Ubicación de cada técnico: su dirección principal guardada en direcciones_usuario
const UBICACION_TECNICO = `JOIN direcciones_usuario d ON d.id = (
        SELECT d2.id FROM direcciones_usuario d2
        WHERE d2.usuario_id = t.id AND d2.latitud IS NOT NULL AND d2.longitud IS NOT NULL
        ORDER BY d2.es_principal DESC, d2.id ASC LIMIT 1
    )`;

//Guardar un pedido nuevo con su ubicación (queda 'Solicitado' hasta que un técnico lo acepte)
export const crearSolicitud = async (clienteId, { direccion, descripcion, latitud, longitud }) => {
    const [resultado] = await connection.query(
        `INSERT INTO Solicitudes (id_usuario, direccion, descripcion, latitud, longitud)
        VALUES (?, ?, ?, ?, ?)`,
        [clienteId, direccion, descripcion, latitud, longitud]
    );
    return resultado.insertId;
};

//Técnicos a RADIO_KM o menos de un punto, del más cercano al más lejano
export const getTecnicosCercanos = async (latitud, longitud) => {
    const distancia = sqlDistanciaKm("?", "?", "d.latitud", "d.longitud");
    const [rows] = await connection.query(
        `SELECT t.id, ${distancia} AS distancia_km
        FROM Usuarios t
        ${UBICACION_TECNICO}
        WHERE t.rol = 'tecnico'
        HAVING distancia_km <= ?
        ORDER BY distancia_km ASC`,
        [latitud, longitud, latitud, RADIO_KM]
    );
    return rows;
};

//Pedidos sin técnico que están cerca de un técnico (para su pantalla de Inicio)
export const getSolicitudesCercanas = async (tecnicoId) => {
    const distancia = sqlDistanciaKm("s.latitud", "s.longitud", "d.latitud", "d.longitud");
    const [rows] = await connection.query(
        `SELECT s.id, s.descripcion, s.direccion,
            UNIX_TIMESTAMP(s.fecha_creacion) * 1000 AS fecha,
            CONCAT_WS(' ', c.nombre_real, c.apellido) AS cliente,
            c.nombre AS cliente_usuario,
            ROUND(${distancia}, 1) AS distancia_km
        FROM Solicitudes s
        JOIN Usuarios c ON c.id = s.id_usuario
        JOIN Usuarios t ON t.id = ?
        ${UBICACION_TECNICO}
        WHERE s.estado = 'Solicitado' AND s.latitud IS NOT NULL AND s.longitud IS NOT NULL
        HAVING distancia_km <= ?
        ORDER BY s.fecha_creacion DESC`,
        [tecnicoId, RADIO_KM]
    );
    return rows;
};

//Un técnico acepta un pedido: el primero que llega se lo queda y se crea el Servicio.
//Devuelve el servicio nuevo, o null si otro técnico lo aceptó antes.
export const aceptarSolicitud = async (tecnicoId, solicitudId) => {
    const conexion = await connection.getConnection();
    try {
        await conexion.beginTransaction();

        //Solo cambia si sigue 'Solicitado': si dos aceptan a la vez, gana uno solo
        const [cambio] = await conexion.query(
            "UPDATE Solicitudes SET estado = 'Asignado' WHERE id = ? AND estado = 'Solicitado'",
            [solicitudId]
        );
        if (cambio.affectedRows === 0) {
            await conexion.rollback();
            return null;
        }

        const [[solicitud]] = await conexion.query(
            "SELECT id_usuario, descripcion, direccion, latitud, longitud FROM Solicitudes WHERE id = ?",
            [solicitudId]
        );

        //Servicios.descripcion admite hasta 255 caracteres
        const [nuevo] = await conexion.query(
            `INSERT INTO Servicios (cliente_id, tecnico_id, Estado, descripcion, direccion, ubicacion_lat_long, fecha_creacion)
            VALUES (?, ?, 'pendiente', ?, ?, ?, NOW())`,
            [
                solicitud.id_usuario,
                tecnicoId,
                String(solicitud.descripcion).slice(0, 255),
                solicitud.direccion,
                `${solicitud.latitud},${solicitud.longitud}`
            ]
        );

        await conexion.commit();
        return { id: nuevo.insertId, cliente_id: solicitud.id_usuario };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
};

//Técnicos cercanos a un pedido ya guardado (para avisarles que alguien lo tomó)
export const getTecnicosCercanosDeSolicitud = async (solicitudId) => {
    const [[s]] = await connection.query("SELECT latitud, longitud FROM Solicitudes WHERE id = ?", [solicitudId]);
    if (!s || s.latitud === null || s.longitud === null) return [];
    return getTecnicosCercanos(s.latitud, s.longitud);
};
