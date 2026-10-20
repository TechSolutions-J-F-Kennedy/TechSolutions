import { getTodosLosTecnicos, getTecnicosByCategoria } from "../models/tecnicos/tecnico.models.js";



export const getTecnicos = async (req, res) => {
    try {
        const tecnicos = await getTodosLosTecnicos();
        return res.json({ payload: tecnicos });
    } catch (error) {
        console.error("Error al obtener tecnicos:", error);
        return res.status(500).json({ error: "Error al consultar los tecnicos" });
    }
};
export const getTecnicosCategoria = async (req, res) => {
    try {
        let { categoria } = req.body;
        const tecnicos = await getTecnicosByCategoria( categoria );
        return res.json({ payload: tecnicos });
    } catch (error) {
        console.error("Error al obtener tecnicos:", error);
        return res.status(500).json({ error: "Error al consultar los tecnicos" });
    }
};