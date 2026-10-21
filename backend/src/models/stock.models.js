import connection from "../database/db.js";

export const getProductosStock = async () => {
  const sql = `
    SELECT
      id,
      codigo_sku,
      codigo_qr,
      nombre,
      descripcion,
      stock_actual,
      stock_minimo
    FROM Productos_stock
    ORDER BY nombre ASC
  `;

  const [rows] = await connection.query(sql);
  return rows;
};
