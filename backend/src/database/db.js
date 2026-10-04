// src/database/db.js
import mysql from "mysql2/promise"; // 1. Importa la versión de mysql2 basada en Promesas (async/await)
import dotenv from "dotenv";        // 2. Importa dotenv para leer el archivo de variables .env

dotenv.config();                     // 3. Ejecuta la lectura de variables de entorno

// 4. Crea y exporta la piscina de conexiones reutilizables
const connection = mysql.createPool({
    // Dirección IP o dominio donde se hospeda MariaDB ("localhost" si es en tu computadora)
    host: process.env.DB_HOST || "localhost",

    // Usuario registrado en la base de datos con permisos (por defecto en XAMPP/WAMP es "root")
    user: process.env.DB_USER || "root",

    // Contraseña del usuario de la BD (en XAMPP/WAMP suele estar vacía "")
    password: process.env.DB_PASSWORD || "",

    // Nombre de la base de datos específica que contiene nuestras tablas
    database: process.env.DB_NAME || "app_moviles",

    // Si la piscina está llena, las nuevas peticiones esperan pacientemente a que se libere un socket (true)
    waitForConnections: true,

    // Cantidad máxima de conexiones TCP abiertas en simultáneo que mantendrá el pool en memoria
    connectionLimit: 10,

    // Límite máximo de peticiones en cola de espera cuando el pool está lleno (0 = cola ilimitada)
    queueLimit: 0
});

export default connection;
