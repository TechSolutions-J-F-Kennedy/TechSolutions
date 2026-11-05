import { crearResenaModel, actualizarResenaModel, getResenaByServicioId } from "../models/resena.models.js";

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