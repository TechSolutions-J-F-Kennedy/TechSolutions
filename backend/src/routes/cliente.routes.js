// Rutas de las pantallas del cliente (rol 'usuario'):
import express from "express";
import { getPedidos, getDirecciones, postSolicitud, postResena, patchPerfilCliente } from "../controllers/cliente.controllers.js";

const router = express.Router();

// /api/clientes
router.get("/:id/pedidos", getPedidos);
router.get("/:id/direcciones", getDirecciones);
router.post("/:id/solicitudes", postSolicitud);
router.post("/:id/resenas", postResena);
router.patch("/:id/perfil", patchPerfilCliente);

export default router;
