import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import chatRoutes from "./src/routes/chat.routes.js";
import clientesRoutes from "./src/routes/cliente.routes.js";
import usuariosRoutes from "./src/routes/usuario.routes.js";
import tecnicosRoutes from "./src/routes/tecnico.routes.js";
import serviciosRoutes from "./src/routes/servicio.routes.js"; 
import pedidosRoutes from "./src/routes/pedido.routes.js"; 
import mensajesRoutes from "./src/routes/mensaje.routes.js"; 

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// 1. Montar las rutas de la API (siempre van primero)
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/tecnicos", tecnicosRoutes);
app.use("/api", serviciosRoutes);
app.use("/api/pedidos", pedidosRoutes); 
app.use("/api/mensajes", mensajesRoutes); 
app.use("/api/chat", chatRoutes);
app.use("/api/clientes", clientesRoutes);

// 2. Servir archivos estáticos del frontend (solo necesario localmente)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpetaFrontend = path.join(__dirname, "../frontend");

app.use(express.static(carpetaFrontend));

app.get("/", (req, res) => {
  res.sendFile(path.join(carpetaFrontend, "index.html"));
});

// 3. Escuchar en puerto solo en entorno local
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Servidor activo en puerto ${PORT}`));
}

export default app;