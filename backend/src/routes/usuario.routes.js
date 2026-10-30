import express from "express";
import { 
    postUsuario, 
    postSesion, 
    putUsuario, 
    getDireccionesUsuario, 
    postDireccionUsuario, 
    patchDireccionPrincipal 
} from "../controllers/usuario.controllers.js";

const router = express.Router();

// Autenticación y Perfil
router.post("/registro", postUsuario);               // POST /api/usuarios/registro
router.post("/login", postSesion);                   // POST /api/usuarios/login
router.put("/:usuarioId", putUsuario);                // PUT /api/usuarios/:usuarioId

// Gestión de Direcciones
router.get("/:usuarioId/direcciones", getDireccionesUsuario);                                // GET /api/usuarios/:usuarioId/direcciones
router.post("/:usuarioId/direcciones", postDireccionUsuario);                               // POST /api/usuarios/:usuarioId/direcciones
router.patch("/:usuarioId/direcciones/:direccionId/principal", patchDireccionPrincipal);    // PATCH /api/usuarios/:usuarioId/direcciones/:direccionId/principal

export default router;