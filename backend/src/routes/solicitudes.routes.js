const express = require("express");
const multer = require("multer");

const solicitudesController = require("../controllers/solicitudes.controller");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {
            return cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP."));
        }

        cb(null, true);
    }
});

router.post("/", (req, res, next) => {
    upload.single("foto")(req, res, (error) => {
        if (error) {
            const esArchivoInvalido =
                error instanceof multer.MulterError ||
                error.message.includes("Solo se permiten imágenes");

            return res.status(esArchivoInvalido ? 400 : 500).json({
                mensaje: error.message
            });
        }

        next();
    });
}, solicitudesController.crearSolicitud);

module.exports = router;