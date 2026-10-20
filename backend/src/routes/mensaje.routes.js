import express from "express";
import { postMensaje, getMensajesChat } from "../controllers/mensaje.controllers.js";

const router = express.Router();

router.post("/enviar", postMensaje);                       // POST /api/mensajes/enviar
router.get("/:usuarioId/:tecnicoId", getMensajesChat);     // GET /api/mensajes/:usuarioId/:tecnicoId

export default router;