// Mapea las URLs y verbos HTTP con las funciones del controlador:
import express from "express";
import { getServiciosPendientes, getTodosLosServicios, patchDisponibilidadTecnico, patchPerfilTecnico, getServicio, patchEstadoServicio, putFotoServicio, getSolicitudesCerca, postAceptarSolicitud, getUbicacion, putUbicacion } from "../controllers/tecnico.controllers.js";

const router = express.Router();

// /api/tecnicos
router.get("/:id/servicios-pendientes", getServiciosPendientes);
router.get("/:id/solicitudes-cercanas", getSolicitudesCerca);
router.post("/:id/solicitudes/:solicitudId/aceptar", postAceptarSolicitud);
router.get("/:id/servicios", getTodosLosServicios);
router.get("/:id/servicios/:servicioId", getServicio);
router.patch("/:id/servicios/:servicioId/estado", patchEstadoServicio);
router.put("/:id/servicios/:servicioId/foto", putFotoServicio);
router.patch("/:id/disponibilidad", patchDisponibilidadTecnico);
router.get("/:id/ubicacion", getUbicacion);
router.put("/:id/ubicacion", putUbicacion);
router.patch("/:id/perfil", patchPerfilTecnico);

export default router;