import { inicioSesion, getTodosLosServiciosByTecnico, getServiciosPendientesByTecnico, actualizarDisponibilidadTecnico, actualizarPerfilTecnico } from "../models/tecnico.models.js";

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