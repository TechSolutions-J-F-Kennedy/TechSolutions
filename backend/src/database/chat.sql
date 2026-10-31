-- Tabla Chat: mensajes en tiempo real entre técnico y usuario
CREATE TABLE "Chat" (
    -- 1. Identificador del mensaje
    "id" int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',

    -- 2. Quién participa
    "emisor_id" int NOT NULL COMMENT 'Usuario que envía el mensaje',
    "receptor_id" int NOT NULL COMMENT 'Usuario que recibe el mensaje',

    -- 3. Contenido
    "mensaje" text NOT NULL COMMENT 'Contenido del mensaje',

    -- 4. Estado y fecha
    "leido" tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 = no leído, 1 = leído',
    "fecha_envio" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de envío',

    -- 5. Clave primaria
    PRIMARY KEY ("id"),

    -- 6. Relaciones con Usuarios
    CONSTRAINT "fk_chat_emisor" FOREIGN KEY ("emisor_id") REFERENCES "Usuarios" ("id") ON DELETE CASCADE,
    CONSTRAINT "fk_chat_receptor" FOREIGN KEY ("receptor_id") REFERENCES "Usuarios" ("id") ON DELETE CASCADE,

    -- 7. Índices (para que las búsquedas sean rápidas)
    KEY "idx_conversacion" ("emisor_id", "receptor_id"),
    KEY "idx_receptor_leido" ("receptor_id", "leido")
);
