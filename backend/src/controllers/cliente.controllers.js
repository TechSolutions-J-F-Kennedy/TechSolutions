import { esCliente, getSolicitudesByCliente, getServiciosByCliente, getDireccionesCliente, getServicioDeCliente, existeResena, crearResena, actualizarPerfilCliente } from "../models/cliente.models.js";
import { crearSolicitud, getTecnicosCercanos } from "../models/solicitud.models.js";
import { geocodificar } from "../utils/geo.js";
import { enviarEvento } from "../utils/tiempoReal.js";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//GET /api/clientes/:id/pedidos -> solicitudes pendientes + servicios con técnico
export const getPedidos = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(await esCliente(id))) {
            return res.status(404).json({ error: "No se encontró el cliente" });
        }
        const [solicitudes, servicios] = await Promise.all([getSolicitudesByCliente(id), getServiciosByCliente(id)]);
        return res.json({ payload: { solicitudes, servicios } });
    } catch (error) {
        console.error("Error al obtener los pedidos del cliente:", error);
        return res.status(500).json({ error: "Error al consultar tus pedidos" });
    }
};

//GET /api/clientes/:id/direcciones -> direcciones guardadas para elegir al pedir
export const getDirecciones = async (req, res) => {
    try {
        return res.json({ payload: await getDireccionesCliente(req.params.id) });
    } catch (error) {
        console.error("Error al obtener las direcciones:", error);
        return res.status(500).json({ error: "Error al consultar tus direcciones" });
    }
};

//POST /api/clientes/:id/solicitudes -> pedir un servicio
//Body: { descripcion, direccion_id } (dirección guardada) o { descripcion, direccion } (dirección nueva)
export const postSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const { direccion, direccion_id } = req.body;
        const descripcion = typeof req.body.descripcion === "string" ? req.body.descripcion.trim() : "";

        if (!descripcion || descripcion.length > 2000) {
            return res.status(400).json({ error: "Contanos qué necesitás" });
        }
        if (!direccion_id && (typeof direccion !== "string" || !direccion.trim() || direccion.length > 200)) {
            return res.status(400).json({ error: "Elegí o escribí la dirección" });
        }
        if (!(await esCliente(id))) {
            return res.status(404).json({ error: "No se encontró el cliente" });
        }

        //1. Averiguar dónde es el pedido (latitud y longitud)
        let lugar;
        if (direccion_id) {
            const guardada = (await getDireccionesCliente(id)).find((d) => d.id == direccion_id);
            if (!guardada || guardada.latitud === null || guardada.longitud === null) {
                return res.status(400).json({ error: "Esa dirección guardada no tiene ubicación en el mapa" });
            }
            lugar = { direccion: guardada.direccion_completa, latitud: Number(guardada.latitud), longitud: Number(guardada.longitud) };
        } else {
            const encontrado = await geocodificar(direccion.trim());
            if (!encontrado) {
                return res.status(400).json({ error: "No encontramos esa dirección en el mapa. Probá agregando la localidad (ej: Maipú 320, Banfield)" });
            }
            lugar = { ...encontrado, direccion: direccion.trim() };
        }

        //2. Guardar el pedido
        const nuevoId = await crearSolicitud(id, {
            descripcion,
            direccion: lugar.direccion.slice(0, 200),
            latitud: lugar.latitud,
            longitud: lugar.longitud
        });

        //3. Avisar al instante a los técnicos cercanos
        const tecnicos = await getTecnicosCercanos(lugar.latitud, lugar.longitud);
        tecnicos.forEach((t) => enviarEvento(t.id, "solicitud-nueva", { id: nuevoId }));

        return res.status(201).json({ id: nuevoId, tecnicos_avisados: tecnicos.length });
    } catch (error) {
        console.error("Error al crear la solicitud:", error);
        return res.status(500).json({ error: "Error al guardar tu pedido" });
    }
};

//POST /api/clientes/:id/resenas -> calificar un servicio finalizado
export const postResena = async (req, res) => {
    try {
        const { id } = req.params;
        const { servicio_id, comentario } = req.body;
        const estrella = Number(req.body.estrella);

        if (!Number.isInteger(estrella) || estrella < 1 || estrella > 5) {
            return res.status(400).json({ error: "Elegí de 1 a 5 estrellas" });
        }
        if (comentario !== undefined && comentario !== null && (typeof comentario !== "string" || comentario.length > 500)) {
            return res.status(400).json({ error: "El comentario puede tener hasta 500 caracteres" });
        }

        const servicio = await getServicioDeCliente(id, servicio_id);
        if (!servicio) {
            return res.status(404).json({ error: "No se encontró el servicio" });
        }
        if (String(servicio.Estado || "").toLowerCase() !== "finalizado") {
            return res.status(400).json({ error: "Solo podés calificar un servicio finalizado" });
        }
        if (await existeResena(servicio.id)) {
            return res.status(409).json({ error: "Ya calificaste este servicio" });
        }

        await crearResena({
            servicio_id: servicio.id,
            cliente_id: Number(id),
            tecnico_id: servicio.tecnico_id,
            estrella,
            comentario: comentario?.trim() || null
        });
        return res.status(201).json({ estrella });
    } catch (error) {
        console.error("Error al guardar la reseña:", error);
        return res.status(500).json({ error: "Error al guardar tu calificación" });
    }
};

//PATCH /api/clientes/:id/perfil -> editar datos del cliente
export const patchPerfilCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_real, apellido, email, telefono, password } = req.body;

        if (
            typeof nombre_real !== "string" || !nombre_real.trim() ||
            typeof apellido !== "string" || !apellido.trim() ||
            typeof email !== "string" || !EMAIL_VALIDO.test(email.trim()) ||
            typeof telefono !== "string" ||
            (password !== undefined && typeof password !== "string")
        ) {
            return res.status(400).json({ error: "Revisá el nombre, apellido, email y teléfono" });
        }
        if (!(await esCliente(id))) {
            return res.status(404).json({ error: "No se encontró el cliente" });
        }

        const usuario = await actualizarPerfilCliente(id, {
            nombre_real: nombre_real.trim(),
            apellido: apellido.trim(),
            email: email.trim(),
            telefono: telefono.trim(),
            password
        });
        return res.json({ usuario });
    } catch (error) {
        console.error("Error al actualizar el perfil del cliente:", error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Ese email ya está asociado a otra cuenta" });
        }
        return res.status(500).json({ error: "Error al actualizar el perfil" });
    }
};
