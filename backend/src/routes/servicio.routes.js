import express from "express";
import { getDisponibilidadTecnico, postSolicitarServicio } from "../controllers/servicio.controllers.js";

const router = express.Router();

router.get("/tecnicos/:id/disponibilidad", getDisponibilidadTecnico);
router.post("/servicios/solicitar", postSolicitarServicio);   

export default router;