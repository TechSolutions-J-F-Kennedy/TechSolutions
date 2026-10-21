// Rutas del chat entre técnico y usuario (tabla Mensajes):
import express from "express";
import { getTiempoReal, getConversaciones, getMensajes, postMensaje } from "../controllers/chat.controllers.js";

const router = express.Router();

// /api/chat
router.get("/:id/tiempo-real", getTiempoReal);
router.get("/:id/conversaciones", getConversaciones);
router.get("/:id/mensajes/:otroId", getMensajes);
router.post("/mensajes", postMensaje);

export default router;
