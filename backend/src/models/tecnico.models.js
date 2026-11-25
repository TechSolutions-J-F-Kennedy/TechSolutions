//Define las funciones que ejecutan las consultas SQL en la base de datos:
import connection from "../database/db.js";
import { verificarPassword } from "../utils/passwords.js";

//Obtener todos los servicios de un técnico específico
export const getTodosLosServiciosByTecnico = async ({tecnicoId }) => {
    const sql = `SELECT Servicios.*,
        CONCAT_WS(' ',
            COALESCE(NULLIF(TRIM(Usuarios.nombre_real), ''), NULLIF(TRIM(Usuarios.nombre), '')),
            NULLIF(TRIM(Usuarios.apellido), '')
        ) AS cliente
        FROM Servicios
        LEFT JOIN Usuarios ON Servicios.cliente_id = Usuarios.id
        WHERE Servicios.tecnico_id = ?
        ORDER BY CASE
                WHEN LOWER(TRIM(COALESCE(Servicios.Estado, ''))) IN ('en proceso', 'yendo') THEN 0
                ELSE 1
            END ASC,
            Servicios.fecha_servicio IS NULL ASC,
            Servicios.fecha_servicio ASC,
            Servicios.hora_servicio IS NULL ASC,
            Servicios.hora_servicio ASC,
            Servicios.fecha_creacion ASC,
            Servicios.id ASC`;
    const [rows] = await connection.query(sql, [tecnicoId]);
    return rows;
}

//Obtener los servicios no finalizados de un técnico específico
export const getServiciosNoFinalizadosByTecnico = async (tecnicoId) => {
    const sql = `SELECT Servicios.*,
        Usuarios.telefono AS telefono,
        CONCAT_WS(' ',
            COALESCE(NULLIF(TRIM(Usuarios.nombre_real), ''), NULLIF(TRIM(Usuarios.nombre), '')),
            NULLIF(TRIM(Usuarios.apellido), '')
        ) AS cliente
        FROM Servicios
        LEFT JOIN Usuarios ON Servicios.cliente_id = Usuarios.id
        WHERE Servicios.tecnico_id = ?
            AND (
                Servicios.Estado IS NULL
                OR LOWER(TRIM(Servicios.Estado)) NOT IN ('finalizado', 'completado', 'cancelado')
            )
        ORDER BY CASE
                WHEN LOWER(TRIM(COALESCE(Servicios.Estado, ''))) IN ('en proceso', 'yendo') THEN 0
                ELSE 1
            END ASC,
            Servicios.fecha_servicio IS NULL ASC,
            Servicios.fecha_servicio ASC,
            Servicios.hora_servicio IS NULL ASC,
            Servicios.hora_servicio ASC,
            Servicios.fecha_creacion ASC,
            Servicios.id ASC`;
    const [rows] = await connection.query(sql, [tecnicoId]);
    return rows;
};

//Cambiar la disponibilidad del técnico (disponible o no disponible) con el switch del inicio
export const actualizarDisponibilidadTecnico = async (tecnicoId, disponibilidad) => {
    const sql = 'UPDATE Usuarios SET disponibilidad = ? WHERE id = ? AND rol = ?';
    const [resultado] = await connection.query(sql, [disponibilidad, tecnicoId, 'tecnico']);
    return resultado.affectedRows > 0;
};

//Cambiar datos del perfil del técnico
export const verificarPasswordActualTecnico = async (tecnicoId, passwordActual) => {
    const [tecnicos] = await connection.query(
        'SELECT password FROM Usuarios WHERE id = ? AND rol = ?',
        [tecnicoId, 'tecnico']
    );
    if (tecnicos.length === 0) return false;
    return verificarPassword(passwordActual, tecnicos[0].password);
};

export const actualizarPerfilTecnico = async (tecnicoId, { email, telefono, categoria, password }) => {
    const [tecnicos] = await connection.query(
        'SELECT id FROM Usuarios WHERE id = ? AND rol = ?',[tecnicoId, 'tecnico']
    );
    if (tecnicos.length === 0) return null;

    const passwordSql = password ? ', password = ?' : '';
    const valores = [email, telefono, categoria];
    if (password) valores.push(password);
    valores.push(tecnicoId);

    await connection.query(
        `UPDATE Usuarios
        SET email = ?, telefono = ?, categoria = ?${passwordSql}
        WHERE id = ? AND rol = 'tecnico'`,
        valores
    );

    const [actualizados] = await connection.query(
        `SELECT id, nombre, nombre_real, apellido, email, telefono, categoria, rol, disponibilidad
        FROM Usuarios WHERE id = ?`,
        [tecnicoId]
    );
    return actualizados[0];
};

//Obtener un servicio puntual del técnico (para la pantalla de pedido actual)
export const getServicioDeTecnico = async (tecnicoId, servicioId) => {
    const sql = `SELECT Servicios.*,
        Usuarios.telefono AS telefono,
        CONCAT_WS(' ',
            COALESCE(NULLIF(TRIM(Usuarios.nombre_real), ''), NULLIF(TRIM(Usuarios.nombre), '')),
            NULLIF(TRIM(Usuarios.apellido), '')
        ) AS cliente,
        EXISTS (
            SELECT 1
            FROM Servicios AS otro
            WHERE otro.tecnico_id = ?
                AND otro.id <> Servicios.id
                AND LOWER(TRIM(COALESCE(otro.Estado, ''))) IN ('yendo', 'en proceso')
        ) AS otro_servicio_en_curso
        FROM Servicios
        LEFT JOIN Usuarios ON Servicios.cliente_id = Usuarios.id
        WHERE Servicios.id = ? AND Servicios.tecnico_id = ?`;
    const [rows] = await connection.query(sql, [tecnicoId, servicioId, tecnicoId]);
    return rows[0];
};

//Cambiar el estado de un servicio del técnico (pendiente, yendo, en proceso, finalizado)
export const actualizarEstadoServicio = async (tecnicoId, servicioId, estado) => {
    const conexion = await connection.getConnection();
    try {
        await conexion.beginTransaction();

        const [tecnicos] = await conexion.query(
            'SELECT id FROM Usuarios WHERE id = ? AND rol = ? FOR UPDATE',
            [tecnicoId, 'tecnico']
        );
        if (tecnicos.length === 0) {
            await conexion.rollback();
            return 'not_found';
        }

        const [servicios] = await conexion.query(
            'SELECT Estado FROM Servicios WHERE id = ? AND tecnico_id = ? FOR UPDATE',
            [servicioId, tecnicoId]
        );
        if (servicios.length === 0) {
            await conexion.rollback();
            return 'not_found';
        }

        if (estado === 'cancelado' && ['finalizado', 'completado', 'cancelado'].includes(
            String(servicios[0].Estado || '').trim().toLowerCase()
        )) {
            await conexion.rollback();
            return 'not_found';
        }

        if (['yendo', 'en proceso'].includes(estado)) {
            const [serviciosEnCurso] = await conexion.query(
                `SELECT id
                FROM Servicios
                WHERE tecnico_id = ?
                    AND id <> ?
                    AND LOWER(TRIM(COALESCE(Estado, ''))) IN ('yendo', 'en proceso')
                LIMIT 1`,
                [tecnicoId, servicioId]
            );
            if (serviciosEnCurso.length > 0) {
                await conexion.rollback();
                return 'in_progress_exists';
            }
        }

        await conexion.query(
            'UPDATE Servicios SET Estado = ? WHERE id = ? AND tecnico_id = ?',
            [estado, servicioId, tecnicoId]
        );
        await conexion.commit();
        return 'updated';
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
};

//Guardar (o quitar con null) la foto del trabajo terminado de un servicio del técnico
export const actualizarFotoServicio = async (tecnicoId, servicioId, foto) => {
    const sql = 'UPDATE Servicios SET foto_final = ? WHERE id = ? AND tecnico_id = ?';
    const [resultado] = await connection.query(sql, [foto, servicioId, tecnicoId]);
    return resultado.affectedRows > 0;
};

//Ubicación de trabajo del técnico: su dirección principal en direcciones_usuario
export const getUbicacionTecnico = async (tecnicoId) => {
    const [rows] = await connection.query(
        `SELECT id, alias, direccion_completa, latitud, longitud
        FROM direcciones_usuario
        WHERE usuario_id = ?
        ORDER BY es_principal DESC, id ASC LIMIT 1`,
        [tecnicoId]
    );
    return rows[0] || null;
};

//Guardar la ubicación real del técnico (actualiza su dirección principal o crea una nueva)
export const guardarUbicacionTecnico = async (tecnicoId, { direccion, latitud, longitud }) => {
    const actual = await getUbicacionTecnico(tecnicoId);
    if (actual) {
        await connection.query(
            "UPDATE direcciones_usuario SET direccion_completa = ?, latitud = ?, longitud = ?, es_principal = 1 WHERE id = ?",
            [direccion, latitud, longitud, actual.id]
        );
    } else {
        await connection.query(
            `INSERT INTO direcciones_usuario (usuario_id, alias, direccion_completa, latitud, longitud, es_principal)
            VALUES (?, 'Taller', ?, ?, ?, 1)`,
            [tecnicoId, direccion, latitud, longitud]
        );
    }
    return getUbicacionTecnico(tecnicoId);
};

// Obtener todos los técnicos con su ubicación principal
export const getTodosTecnicosConUbicacion = async () => {
    const sql = `
        SELECT 
            u.id,
            u.nombre_real AS nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.categoria,
            u.descripcion,
            u.precio,
            u.foto_perfil AS foto,
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

// 2. Obtener técnicos por categoría con su ubicación principal
export const getTecnicosPorCategoriaConUbicacion = async (categoria) => {
    const sql = `
        SELECT 
            u.id,
            u.nombre_real AS nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.categoria,
            u.descripcion,
            u.precio,
            u.foto_perfil AS foto,
            d.direccion_completa,
            d.latitud,
            d.longitud
        FROM Usuarios u
        INNER JOIN direcciones_usuario d ON u.id = d.usuario_id
        WHERE u.rol = ? AND LOWER(u.categoria) = LOWER(?) AND d.es_principal = 1
    `;
    const [rows] = await connection.query(sql, ["tecnico", categoria]);
    return rows;
};

// 3. Obtener el promedio real de estrellas y total de reseñas de un técnico
export const getReputacionTecnico = async (tecnicoId) => {
    const sql = `
        SELECT 
            COALESCE(ROUND(AVG(estrella), 1), 0.0) AS reputacion_promedio,
            COUNT(id) AS total_resenas
        FROM resenas
        WHERE tecnico_id = ?
    `;
    const [rows] = await connection.query(sql, [tecnicoId]);
    return rows[0];
};

// 4. Obtener la lista de reseñas de un técnico para su perfil
export const getResenasByTecnicoId = async (tecnicoId) => {
    const sql = `
        SELECT 
            r.id,
            r.estrella,
            r.comentario,
            r.fecha,
            r.cliente_id,
            u.nombre AS cliente_nombre
        FROM resenas r
        INNER JOIN Usuarios u ON r.cliente_id = u.id
        WHERE r.tecnico_id = ?
        ORDER BY r.fecha DESC
    `;
    const [rows] = await connection.query(sql, [tecnicoId]);
    return rows;
};

// 5. Obtener los datos de un único técnico por ID
export const getTecnicoById = async (tecnicoId) => {
    const sql = `
        SELECT 
            u.id,
            u.nombre_real AS nombre,
            u.apellido,
            u.email,
            u.telefono,
            u.categoria,
            u.descripcion,
            u.precio,
            u.foto_perfil AS foto,
            d.direccion_completa,
            d.latitud,
            d.longitud
        FROM Usuarios u
        LEFT JOIN direcciones_usuario d ON u.id = d.usuario_id AND d.es_principal = 1
        WHERE u.id = ? AND u.rol = ?
    `;
    const [rows] = await connection.query(sql, [tecnicoId, "tecnico"]);
    return rows[0] || null;
};

export const getProductosDisponiblesParaTecnicos = async () => {
    const [rows] = await connection.query(`
        SELECT id, codigo_sku, nombre, descripcion, stock_actual
        FROM Productos_stock
        WHERE activo = 1 AND stock_actual > 0
        ORDER BY nombre ASC
    `);
    return rows;
};

export const crearSolicitudInsumoTecnico = async ({
    tecnicoId,
    productoId,
    cantidad,
    tokenHash
}) => {
    const conexion = await connection.getConnection();
    try {
        await conexion.beginTransaction();

        const [tecnicos] = await conexion.execute(
            "SELECT id FROM Usuarios WHERE id = ? AND rol = 'tecnico' FOR UPDATE",
            [tecnicoId]
        );
        if (tecnicos.length === 0) {
            await conexion.commit();
            return { estado: "tecnico_no_encontrado" };
        }

        const [productos] = await conexion.execute(
            `SELECT id, codigo_sku, nombre, stock_actual
            FROM Productos_stock
            WHERE id = ? AND activo = 1
            FOR UPDATE`,
            [productoId]
        );
        if (productos.length === 0) {
            await conexion.commit();
            return { estado: "producto_no_encontrado" };
        }
        if (Number(productos[0].stock_actual) < cantidad) {
            await conexion.commit();
            return { estado: "stock_insuficiente" };
        }

        const [resultado] = await conexion.execute(
            `INSERT INTO Solicitudes_insumos
                (token_hash, tecnico_id, producto_id, cantidad, estado, creado_en, vence_en)
            VALUES (?, ?, ?, ?, 'pendiente', CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE))`,
            [tokenHash, tecnicoId, productoId, cantidad]
        );

        await conexion.commit();
        return {
            estado: "creada",
            id: resultado.insertId,
            producto: productos[0]
        };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
};

export const getSolicitudesInsumosTecnico = async (tecnicoId) => {
    await connection.execute(
        `UPDATE Solicitudes_insumos
        SET estado = 'vencida'
        WHERE tecnico_id = ? AND estado = 'pendiente' AND vence_en <= CURRENT_TIMESTAMP`,
        [tecnicoId]
    );
    const [rows] = await connection.execute(
        `SELECT
            solicitud.id,
            solicitud.producto_id,
            COALESCE(producto.nombre, 'Producto no disponible') AS producto,
            solicitud.cantidad,
            solicitud.estado,
            solicitud.creado_en,
            solicitud.vence_en,
            solicitud.entregado_en
        FROM Solicitudes_insumos AS solicitud
        LEFT JOIN Productos_stock AS producto ON producto.id = solicitud.producto_id
        WHERE solicitud.tecnico_id = ?
        ORDER BY solicitud.creado_en DESC, solicitud.id DESC
        LIMIT 25`,
        [tecnicoId]
    );
    return rows;
};

export const confirmarEntregaInsumo = async (tokenHash) => {
    const conexion = await connection.getConnection();
    try {
        await conexion.beginTransaction();

        const [solicitudes] = await conexion.execute(
            `SELECT id, tecnico_id, producto_id, cantidad, estado, vence_en,
                (vence_en <= CURRENT_TIMESTAMP) AS vencida
            FROM Solicitudes_insumos
            WHERE token_hash = ?
            FOR UPDATE`,
            [tokenHash]
        );
        if (solicitudes.length === 0) {
            await conexion.commit();
            return { estado: "no_encontrada" };
        }

        const solicitud = solicitudes[0];
        if (solicitud.estado !== "pendiente") {
            const [productosEntregados] = await conexion.execute(
                "SELECT nombre FROM Productos_stock WHERE id = ?",
                [solicitud.producto_id]
            );
            await conexion.commit();
            return {
                estado: solicitud.estado,
                solicitudId: solicitud.id,
                tecnicoId: solicitud.tecnico_id,
                producto: productosEntregados[0]?.nombre || "Producto",
                cantidad: Number(solicitud.cantidad)
            };
        }
        if (Boolean(solicitud.vencida)) {
            await conexion.execute(
                "UPDATE Solicitudes_insumos SET estado = 'vencida' WHERE id = ?",
                [solicitud.id]
            );
            await conexion.commit();
            return { estado: "vencida", solicitudId: solicitud.id };
        }

        const [productos] = await conexion.execute(
            `SELECT id, nombre, stock_actual
            FROM Productos_stock
            WHERE id = ? AND activo = 1
            FOR UPDATE`,
            [solicitud.producto_id]
        );
        if (
            productos.length === 0 ||
            Number(productos[0].stock_actual) < Number(solicitud.cantidad)
        ) {
            await conexion.execute(
                "UPDATE Solicitudes_insumos SET estado = 'sin_stock' WHERE id = ?",
                [solicitud.id]
            );
            await conexion.commit();
            return { estado: "sin_stock", solicitudId: solicitud.id };
        }

        const [descuento] = await conexion.execute(
            `UPDATE Productos_stock
            SET stock_actual = stock_actual - ?
            WHERE id = ? AND activo = 1 AND stock_actual >= ?`,
            [solicitud.cantidad, solicitud.producto_id, solicitud.cantidad]
        );
        if (descuento.affectedRows !== 1) {
            await conexion.rollback();
            return { estado: "sin_stock", solicitudId: solicitud.id };
        }

        await conexion.execute(
            `UPDATE Solicitudes_insumos
            SET estado = 'entregado', entregado_en = CURRENT_TIMESTAMP
            WHERE id = ? AND estado = 'pendiente'`,
            [solicitud.id]
        );
        await conexion.commit();
        return {
            estado: "entregado",
            solicitudId: solicitud.id,
            tecnicoId: solicitud.tecnico_id,
            producto: productos[0].nombre,
            cantidad: Number(solicitud.cantidad)
        };
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
};