import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usuariosRoutes from "./src/routes/usuario.routes.js";
import tecnicosRoutes from "./src/routes/tecnico.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Montar las rutas
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/tecnicos", tecnicosRoutes);

app.listen(3000, () => console.log("🚀 Servidor activo en puerto 3000"));