// Mapea las URLs y verbos HTTP con las funciones del controlador:
import express from "express";
import { getServiciosPendientes, getTodosLosServicios, patchDisponibilidadTecnico, patchPerfilTecnico, getServicio, patchEstadoServicio } from "../controllers/tecnico.controllers.js";

const router = express.Router();

// /api/tecnicos
router.get("/:id/servicios-pendientes", getServiciosPendientes);
router.get("/:id/servicios", getTodosLosServicios);
router.get("/:id/servicios/:servicioId", getServicio);
router.patch("/:id/servicios/:servicioId/estado", patchEstadoServicio);
router.patch("/:id/disponibilidad", patchDisponibilidadTecnico);
router.patch("/:id/perfil", patchPerfilTecnico);

export default router;