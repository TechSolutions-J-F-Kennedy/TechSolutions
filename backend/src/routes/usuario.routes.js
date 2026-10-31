import express from "express";
import { 
    postUsuario, 
    postSesion, 
    putUsuario, 
    getFoto, 
    putFoto, 
    getFotoImagen,
    getDireccionesUsuario, 
    postDireccionUsuario, 
    patchDireccionPrincipal 
} from "../controllers/usuario.controllers.js";

const router = express.Router();

// Autenticación y Perfil
router.post("/registro", postUsuario);               // POST /api/usuarios/registro
router.post("/login", postSesion);                   // POST /api/usuarios/login
router.put("/:usuarioId", putUsuario);                // PUT /api/usuarios/:usuarioId

// Gestión de Foto de Perfil
router.get("/:id/foto", getFoto);                    // GET /api/usuarios/:id/foto
router.put("/:id/foto", putFoto);                    // PUT /api/usuarios/:id/foto
router.get("/:id/foto/imagen", getFotoImagen);       // GET /api/usuarios/:id/foto/imagen

// Gestión de Direcciones
router.get("/:usuarioId/direcciones", getDireccionesUsuario);                                // GET /api/usuarios/:usuarioId/direcciones
router.post("/:usuarioId/direcciones", postDireccionUsuario);                               // POST /api/usuarios/:usuarioId/direcciones
router.patch("/:usuarioId/direcciones/:direccionId/principal", patchDireccionPrincipal);    // PATCH /api/usuarios/:usuarioId/direcciones/:direccionId/principal

export default router;