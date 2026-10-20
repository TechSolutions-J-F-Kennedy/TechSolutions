import { getTecnicosConUbicacion } from "../models/tecnicos/tecnico.dos.models.js";
import { obtenerDireccionesPorUsuario } from "../models/direccion.models.js";

// Función auxiliar en JS para calcular distancia entre 2 puntos (Fórmula Haversine)
const calcularDistanciaKM = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2)); // Retorna KM con 2 decimales
};

export const getTecnicosCercanosController = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { categoria } = req.query;

        // 1. Obtener la ubicación del cliente desde el modelo de direcciones
        const direcciones = await obtenerDireccionesPorUsuario(usuarioId);
        const dirCliente = direcciones.find(d => d.es_principal === 1) || direcciones[0];

        if (!dirCliente || !dirCliente.latitud || !dirCliente.longitud) {
            return res.status(400).json({ error: "El cliente no tiene coordenadas válidas." });
        }

        // 2. Traer técnicos desde la base de datos (Consulta limpia del Modelo)
        const tecnicos = await getTecnicosConUbicacion(categoria);

        // 3. Lógica del Controlador: Calcular distancia y ordenar el array
        const tecnicosConDistancia = tecnicos.map(tecnico => {
            const distancia = calcularDistanciaKM(
                dirCliente.latitud,
                dirCliente.longitud,
                tecnico.latitud,
                tecnico.longitud
            );
            return { ...tecnico, distancia_km: distancia };
        });

        // Ordenar de más cercano a más lejano (Array.sort en JS)
        tecnicosConDistancia.sort((a, b) => a.distancia_km - b.distancia_km);

        return res.status(200).json({
            origen: dirCliente.direccion_completa,
            tecnicos: tecnicosConDistancia
        });

    } catch (error) {
        console.error("Error al obtener técnicos por distancia:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};