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