import { getTodosLosServiciosByTecnico, getServiciosPendientesByTecnico, actualizarDisponibilidadTecnico, actualizarPerfilTecnico, getServicioDeTecnico, actualizarEstadoServicio, actualizarFotoServicio, getUbicacionTecnico, guardarUbicacionTecnico } from "../models/tecnico.models.js";
import connection from "../database/db.js";
import { getSolicitudesCercanas, aceptarSolicitud, getTecnicosCercanosDeSolicitud } from "../models/solicitud.models.js";
import { enviarEvento } from "../utils/tiempoReal.js";
import { geocodificar, direccionDesdeCoordenadas, coordenadasValidas } from "../utils/geo.js";

export const getServiciosPendientes = async (req, res) => {
    try {
        const { id } = req.params;
        const servicios = await getServiciosPendientesByTecnico(id);
        return res.json({ payload: servicios });
    } catch (error) {
        console.error("Error al obtener servicios pendientes:", error);
        return res.status(500).json({ error: "Error al consultar los servicios pendientes" });
    }
};

export const getTodosLosServicios = async (req, res) => {
    try {
        const { id } = req.params;
        const servicios = await getTodosLosServiciosByTecnico({ tecnicoId: id });
        return res.json({ payload: servicios });
    } catch (error) {
        console.error("Error al obtener servicios pendientes:", error);
        return res.status(500).json({ error: "Error al consultar los servicios pendientes" });
    }
};

export const patchDisponibilidadTecnico = async (req, res) => {
    try {
        const { id } = req.params;
        const { disponibilidad } = req.body;
        const valoresPermitidos = ["disponible", "no disponible"];

        if (!valoresPermitidos.includes(disponibilidad)) {
            return res.status(400).json({
                error: "La disponibilidad debe ser 'disponible' o 'no disponible'"
            });
        }

        const actualizado = await actualizarDisponibilidadTecnico(id, disponibilidad);
        if (!actualizado) {
            return res.status(404).json({ error: "No se encontró el técnico" });
        }

        return res.status(200).json({ disponibilidad });
    } catch (error) {
        console.error("Error al actualizar disponibilidad del técnico:", error);
        return res.status(500).json({ error: "Error al actualizar la disponibilidad" });
    }
};

export const patchPerfilTecnico = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_real, apellido, email, telefono, categoria, password } = req.body;

        if (
            typeof nombre_real !== "string" || !nombre_real.trim() ||
            typeof apellido !== "string" || !apellido.trim() ||
            typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            typeof telefono !== "string" ||
            typeof categoria !== "string" || !categoria.trim() ||
            (password !== undefined && typeof password !== "string")
        ) {
            return res.status(400).json({ error: "Revisá el nombre, apellido, email, teléfono y categoría" });
        }

        const usuario = await actualizarPerfilTecnico(id, {
            nombre_real: nombre_real.trim(),
            apellido: apellido.trim(),
            email: email.trim(),
            telefono: telefono.trim(),
            categoria: categoria.trim(),
            password
        });
        if (!usuario) {
            return res.status(404).json({ error: "No se encontró el técnico" });
        }

        return res.status(200).json({ usuario });
    } catch (error) {
        console.error("Error al actualizar el perfil del técnico:", error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Ese email ya está asociado a otra cuenta" });
        }
        return res.status(500).json({ error: "Error al actualizar el perfil" });
    }
};

export const getServicio = async (req, res) => {
    try {
        const { id, servicioId } = req.params;
        const servicio = await getServicioDeTecnico(id, servicioId);
        if (!servicio) {
            return res.status(404).json({ error: "No se encontró el servicio" });
        }
        return res.json({ payload: servicio });
    } catch (error) {
        console.error("Error al obtener el servicio:", error);
        return res.status(500).json({ error: "Error al consultar el servicio" });
    }
};

export const patchEstadoServicio = async (req, res) => {
    try {
        const { id, servicioId } = req.params;
        const { estado } = req.body;
        const valoresPermitidos = ["pendiente", "yendo", "en proceso", "finalizado"];

        if (!valoresPermitidos.includes(estado)) {
            return res.status(400).json({
                error: "El estado debe ser 'pendiente', 'yendo', 'en proceso' o 'finalizado'"
            });
        }

        const actualizado = await actualizarEstadoServicio(id, servicioId, estado);
        if (!actualizado) {
            return res.status(404).json({ error: "No se encontró el servicio" });
        }

        return res.status(200).json({ estado });
    } catch (error) {
        console.error("Error al actualizar el estado del servicio:", error);
        return res.status(500).json({ error: "Error al actualizar el estado" });
    }
};

//Foto del trabajo terminado: imagen JPG/PNG/WEBP en base64, de hasta ~375 KB
export const putFotoServicio = async (req, res) => {
    try {
        const { id, servicioId } = req.params;
        const { foto } = req.body;

        if (foto !== null && (typeof foto !== "string" || foto.length > 500000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(foto))) {
            return res.status(400).json({ error: "La foto tiene que ser una imagen JPG, PNG o WEBP de menos de 375 KB" });
        }

        const actualizado = await actualizarFotoServicio(id, servicioId, foto);
        if (!actualizado) {
            return res.status(404).json({ error: "No se encontró el servicio" });
        }
        return res.json({ foto });
    } catch (error) {
        console.error("Error al guardar la foto del trabajo:", error);
        return res.status(500).json({ error: "Error al guardar la foto del trabajo" });
    }
};

//GET /api/tecnicos/:id/solicitudes-cercanas -> pedidos sin técnico cerca de su taller
export const getSolicitudesCerca = async (req, res) => {
    try {
        return res.json({ payload: await getSolicitudesCercanas(req.params.id) });
    } catch (error) {
        console.error("Error al obtener los pedidos cercanos:", error);
        return res.status(500).json({ error: "Error al consultar los pedidos cercanos" });
    }
};

//POST /api/tecnicos/:id/solicitudes/:solicitudId/aceptar -> el técnico se queda con el pedido
export const postAceptarSolicitud = async (req, res) => {
    try {
        const { id, solicitudId } = req.params;
        const [tecnicos] = await connection.query("SELECT id FROM Usuarios WHERE id = ? AND rol = 'tecnico'", [id]);
        if (tecnicos.length === 0) {
            return res.status(404).json({ error: "No se encontró el técnico" });
        }

        const servicio = await aceptarSolicitud(Number(id), solicitudId);
        if (!servicio) {
            return res.status(409).json({ error: "Otro técnico ya aceptó este pedido" });
        }

        //Avisar: a los técnicos cercanos que se lo saquen de la lista, y al cliente que ya tiene técnico
        const cercanos = await getTecnicosCercanosDeSolicitud(solicitudId);
        cercanos.forEach((t) => enviarEvento(t.id, "solicitud-tomada", { id: Number(solicitudId) }));
        enviarEvento(servicio.cliente_id, "pedido-asignado", { solicitud_id: Number(solicitudId), servicio_id: servicio.id });

        return res.status(201).json({ servicio_id: servicio.id });
    } catch (error) {
        console.error("Error al aceptar el pedido:", error);
        return res.status(500).json({ error: "Error al aceptar el pedido" });
    }
};

//GET /api/tecnicos/:id/ubicacion -> dónde trabaja el técnico (de acá se calculan los pedidos cercanos)
export const getUbicacion = async (req, res) => {
    try {
        return res.json({ payload: await getUbicacionTecnico(req.params.id) });
    } catch (error) {
        console.error("Error al obtener la ubicación del técnico:", error);
        return res.status(500).json({ error: "Error al consultar tu ubicación" });
    }
};

//PUT /api/tecnicos/:id/ubicacion
//Body: { latitud, longitud } (GPS del celular) o { direccion } (escrita a mano)
export const putUbicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const [tecnicos] = await connection.query("SELECT id FROM Usuarios WHERE id = ? AND rol = 'tecnico'", [id]);
        if (tecnicos.length === 0) {
            return res.status(404).json({ error: "No se encontró el técnico" });
        }

        let lugar;
        if (req.body.latitud !== undefined && req.body.longitud !== undefined) {
            const latitud = Number(req.body.latitud);
            const longitud = Number(req.body.longitud);
            if (!coordenadasValidas(latitud, longitud)) {
                return res.status(400).json({ error: "Esa ubicación no parece estar en Argentina" });
            }
            const direccion = (await direccionDesdeCoordenadas(latitud, longitud)) || `${latitud}, ${longitud}`;
            lugar = { direccion, latitud, longitud };
        } else {
            const escrita = typeof req.body.direccion === "string" ? req.body.direccion.trim() : "";
            if (!escrita || escrita.length > 200) {
                return res.status(400).json({ error: "Escribí tu dirección (calle, número y localidad)" });
            }
            const encontrado = await geocodificar(escrita);
            if (!encontrado) {
                return res.status(400).json({ error: "No encontramos esa dirección en el mapa. Probá agregando la localidad (ej: Maipú 320, Banfield)" });
            }
            lugar = encontrado;
        }

        lugar.direccion = lugar.direccion.slice(0, 255);
        return res.json({ payload: await guardarUbicacionTecnico(id, lugar) });
    } catch (error) {
        console.error("Error al guardar la ubicación del técnico:", error);
        return res.status(500).json({ error: "Error al guardar tu ubicación" });
    }
};
import { obtenerDireccionesPorUsuario } from "../models/direccion.models.js";

import { 
    getTodosTecnicosConUbicacion, 
    getTecnicosPorCategoriaConUbicacion 
} from "../models/tecnicos/tecnico.models.js";

const calcularDistanciaKM = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
};

// 2. Controlador principal
export const getTecnicosCercanosController = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { categoria } = req.query;

        const direcciones = await obtenerDireccionesPorUsuario(usuarioId);
        const dirCliente = direcciones.find(d => d.es_principal === 1) || direcciones[0];

        if (!dirCliente || !dirCliente.latitud || !dirCliente.longitud) {
            return res.status(400).json({ error: "El cliente no tiene una ubicación válida configurada." });
        }

        let tecnicos;
        if (categoria && categoria.toLowerCase() !== "todos") {
            tecnicos = await getTecnicosPorCategoriaConUbicacion(categoria);
        } else {
            tecnicos = await getTodosTecnicosConUbicacion();
        }

        const tecnicosConDistancia = tecnicos.map(tecnico => {
            const distancia = calcularDistanciaKM(
                dirCliente.latitud,
                dirCliente.longitud,
                tecnico.latitud,
                tecnico.longitud
            );
            return { ...tecnico, distancia_km: distancia };
        });

        tecnicosConDistancia.sort((a, b) => a.distancia_km - b.distancia_km);

        return res.status(200).json({
            origen: dirCliente.direccion_completa,
            tecnicos: tecnicosConDistancia
        });

    } catch (error) {
        console.error("Error al obtener técnicos cercanos:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};

export const postSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // Buscar el usuario en la BD

        const usuarioEncontrado = await inicioSesion({ email, password });

        // Si no se encontró ningún registro
        if (!usuarioEncontrado) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Si existe, devolver mensaje Y los datos del usuario para el frontend
        return res.status(200).json({
            mensaje: "Inicio de sesión exitoso",
            usuario: usuarioEncontrado
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        return res.status(500).json({ error: "Error en la búsqueda en la base de datos" });
    }
};
