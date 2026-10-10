const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const solicitudesController = require("../controllers/solicitudes.controller");

const router = express.Router();

const carpetaUploads = path.join(__dirname, "../../uploads");

fs.mkdirSync(carpetaUploads, { recursive: true });

const almacenamiento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carpetaUploads);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        cb(null, nombre);
    }
});

const upload = multer({
    storage: almacenamiento,
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