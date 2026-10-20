import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import usuariosRoutes from "./src/routes/usuario.routes.js";
import tecnicosRoutes from "./src/routes/tecnico.routes.js";
import serviciosRoutes from "./src/routes/servicio.routes.js"; 
import pedidosRoutes from "./src/routes/pedido.routes.js"; 
import mensajesRoutes from "./src/routes/mensaje.routes.js"; 


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// 1. Servir archivos estáticos (CSS, JS del frontend, imágenes)
app.use(express.static(path.resolve("../frontend")));

// 2. Montar las rutas de la API
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/tecnicos", tecnicosRoutes);
app.use("/api", serviciosRoutes); // Montamos las rutas de servicios (/api/tecnicos/:id/disponibilidad y /api/servicios/solicitar)
app.use("/api/pedidos", pedidosRoutes); 
app.use("/api/mensajes", mensajesRoutes); 

// 3. Servir el HTML principal en la raíz /
app.get("/", (req, res) => {
  res.sendFile(path.resolve("../frontend/index.html"));
});

// 4. Escuchar en puerto local solo fuera de producción (Vercel)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Servidor activo en puerto ${PORT}`));
}

// 5. Exportar la instancia de Express para Vercel
export default app;