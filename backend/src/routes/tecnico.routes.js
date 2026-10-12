// Mapea las URLs y verbos HTTP con las funciones del controlador:
import express from "express";
import { postSesion, getServiciosPendientes, getTodosLosServicios, patchDisponibilidadTecnico, patchPerfilTecnico } from "../controllers/tecnico.controllers.js";

const router = express.Router();

// GET /api/tecnicos
router.post("/login", postSesion);
router.get("/:id/servicios-pendientes", getServiciosPendientes);
router.get("/:id/servicios", getTodosLosServicios);
router.patch("/:id/disponibilidad", patchDisponibilidadTecnico);
router.patch("/:id/perfil", patchPerfilTecnico);

export default router;