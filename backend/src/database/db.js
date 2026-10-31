// src/database/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

// Forzar a dotenv a encontrar el archivo .env en la raíz del backend
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Imprimir en consola para depuración local
console.log("🔌 Conectando a la base de datos en:", process.env.DB_HOST);

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 23461,

  ssl: {
    rejectUnauthorized: false // Requiere Aiven para conexiones SSL
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default connection;