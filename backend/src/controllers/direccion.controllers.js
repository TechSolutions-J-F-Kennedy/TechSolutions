import { getDireccionPrincipalBD } from "../models/direccion.models.js";

export const getDireccionPrincipal = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const direccion = await getDireccionPrincipalBD(usuarioId);

        if (!direccion) {
            return res.status(404).json({ error: "No se encontró una dirección principal." });
        }

        return res.status(200).json({ payload: direccion });
    } catch (error) {
        console.error("Error al obtener la dirección principal:", error);
        return res.status(500).json({ error: "Error interno al consultar la dirección." });
    }
};