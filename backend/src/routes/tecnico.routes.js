// Mapea las URLs y verbos HTTP con las funciones del controlador:
import express from "express";

import { getServiciosPendientes, getTodosLosServicios, patchDisponibilidadTecnico, patchPerfilTecnico, getServicio, patchEstadoServicio, putFotoServicio, getSolicitudesCerca, postAceptarSolicitud, getUbicacion, putUbicacion, getProductosInsumosTecnico, postSolicitudInsumoTecnico, getSolicitudesInsumosTecnicoController, postConfirmarEntregaInsumo } from "../controllers/tecnico.controllers.js";
import { postSesion } from "../controllers/tecnico.controllers.js";
import { getTecnicosCercanosController, getPerfilTecnicoController } from "../controllers/tecnico.controllers.js";


const router = express.Router();

// /api/tecnicos
router.post("/login", postSesion); // mismo login que /api/usuarios/login (lo usa la versión de la rama principal)
router.get("/insumos/productos", getProductosInsumosTecnico);
router.post("/insumos/confirmar-entrega", postConfirmarEntregaInsumo);
router.get("/:id/insumos/solicitudes", getSolicitudesInsumosTecnicoController);
router.post("/:id/insumos/solicitudes", postSolicitudInsumoTecnico);
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
router.get("/cercanos/:usuarioId", getTecnicosCercanosController);
router.get("/perfil/:id", getPerfilTecnicoController);



export default router;