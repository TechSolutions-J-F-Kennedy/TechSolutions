import { 
    crearResenaModel, 
    actualizarResenaModel, 
    getResenaByServicioId,
    getResenasPorClienteModel,
    eliminarResenaModel
} from "../models/resena.models.js";

export const crearResena = async (req, res) => {
    try {
        const { servicio_id, cliente_id, tecnico_id, estrella, comentario } = req.body;

        if (!cliente_id || !tecnico_id || !estrella) {
            return res.status(400).json({ error: "Faltan datos obligatorios." });
        }

        if (servicio_id) {
            const existeResena = await getResenaByServicioId(servicio_id);
            if (existeResena) {
                await actualizarResenaModel({
                    servicio_id: Number(servicio_id),
                    estrella: Number(estrella),
                    comentario
                });

                return res.status(200).json({
                    success: true,
                    message: "Reseña actualizada correctamente."
                });
            }
        }

        const insertId = await crearResenaModel({
            servicio_id: servicio_id ? Number(servicio_id) : null,
            cliente_id: Number(cliente_id),
            tecnico_id: Number(tecnico_id),
            estrella: Number(estrella),
            comentario
        });

        return res.status(201).json({
            success: true,
            message: "Reseña registrada con éxito.",
            id: insertId
        });

    } catch (error) {
        console.error("Error al procesar reseña:", error);
        return res.status(500).json({ error: "Error interno del servidor al procesar la reseña." });
    }
};

// --- NUEVOS ENDPOINTS ---

export const getResenasPorCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const resenas = await getResenasPorClienteModel(clienteId);
        return res.status(200).json(resenas);
    } catch (error) {
        console.error("Error al obtener reseñas del cliente:", error);
        return res.status(500).json({ error: "Error al cargar las reseñas." });
    }
};

export const eliminarResena = async (req, res) => {
    try {
        const { id } = req.params;
        const { cliente_id } = req.query;

        if (!cliente_id) {
            return res.status(400).json({ error: "Falta identificar al cliente." });
        }

        const eliminado = await eliminarResenaModel(id, cliente_id);
        if (!eliminado) {
            return res.status(404).json({ error: "No se encontró la reseña o no tenés permiso para eliminarla." });
        }

        return res.status(200).json({ success: true, message: "Reseña eliminada correctamente." });
    } catch (error) {
        console.error("Error al eliminar reseña:", error);
        return res.status(500).json({ error: "Error interno al eliminar la reseña." });
    }
};