import { getTodosLosTecnicos } from "../models/tecnicos/tecnico.models.js";

export const getTecnico = async (req, res) => {
    try {
        let { categoria } = req.body;

        if (!categoria) {
            categoria="todos";
        }

        const tecnicos = await getTodosLosTecnicos( categoria );
        return res.json({ payload: tecnicos });
    } catch (error) {
        console.error("Error al obtener tecnicos:", error);
        return res.status(500).json({ error: "Error al consultar los tecnicos" });
    }
};