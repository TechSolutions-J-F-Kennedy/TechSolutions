import express from "express";
import { crearResena } from "../controllers/resena.controllers.js";

const router = express.Router();

router.post("/", crearResena);

export default router;