const solicitudesModel = require("../models/solicitudes.model");

async function crearSolicitud(req, res) {
    try {
        const { id_usuario, direccion, descripcion } = req.body;

        if (!id_usuario || !Number.isInteger(Number(id_usuario))) {
            return res.status(400).json({
                mensaje: "El identificador del usuario no es válido."
            });
        }

        if (
            typeof direccion !== "string" ||
            !direccion.trim() ||
            direccion.trim().length > 200
        ) {
            return res.status(400).json({
                mensaje: "Ingresá una dirección válida de hasta 200 caracteres."
            });
        }

        if (
            typeof descripcion !== "string" ||
            !descripcion.trim() ||
            descripcion.trim().length > 1000
        ) {
            return res.status(400).json({
                mensaje: "Ingresá una descripción de hasta 1000 caracteres."
            });
        }

        const foto = req.file ? req.file.filename : null;

        const solicitud = await solicitudesModel.crearSolicitud({
            id_usuario: Number(id_usuario),
            direccion: direccion.trim(),
            descripcion: descripcion.trim(),
            foto
        });

        return res.status(201).json({
            mensaje: "Solicitud creada correctamente.",
            solicitud
        });
    } catch (error) {
        console.error("Error al crear solicitud:", error.message);

        return res.status(500).json({
            mensaje: "No se pudo crear la solicitud."
        });
    }
}

module.exports = {
    crearSolicitud
};