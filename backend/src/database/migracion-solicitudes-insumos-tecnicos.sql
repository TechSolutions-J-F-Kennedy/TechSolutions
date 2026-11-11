CREATE TABLE IF NOT EXISTS Solicitudes_insumos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    token_hash CHAR(64) NOT NULL,
    tecnico_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT UNSIGNED NOT NULL DEFAULT 1,
    estado ENUM('pendiente', 'entregado', 'vencida', 'sin_stock') NOT NULL DEFAULT 'pendiente',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vence_en DATETIME NOT NULL,
    entregado_en DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_solicitudes_insumos_token_hash (token_hash),
    KEY idx_solicitudes_insumos_tecnico (tecnico_id, creado_en),
    KEY idx_solicitudes_insumos_producto (producto_id)
) ENGINE=InnoDB;
