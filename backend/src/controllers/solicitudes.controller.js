const solicitudesModel = require("../models/solicitudes.model");
const cloudinary = require("../config/cloudinary");

function subirImagen(buffer) {
    const variablesFaltantes = [
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
    ].filter((nombre) => !process.env[nombre]);

    if (variablesFaltantes.length) {
        throw new Error(
            `Faltan variables de entorno de Cloudinary: ${variablesFaltantes.join(", ")}`
        );
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "techsolutions/solicitudes",
                resource_type: "image"
            },
            (error, resultado) => {
                if (error) {
                    return reject(error);
                }

                if (!resultado || !resultado.secure_url) {
                    return reject(new Error("Cloudinary no devolvió una URL segura."));
                }

                resolve(resultado.secure_url);
            }
        );

        stream.end(buffer);
    });
}

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

        const foto = req.file ? await subirImagen(req.file.buffer) : null;

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