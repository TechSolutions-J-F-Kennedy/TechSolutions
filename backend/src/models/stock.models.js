import connection from "../database/db.js";

export const getProductosStock = async ({ nombre, codigo, stockMax } = {}) => {
  const condiciones = ["activo = 1"];
  const valores = [];

  if (nombre) {
    condiciones.push("nombre LIKE ?");
    valores.push(`%${nombre}%`);
  }

  if (codigo) {
    condiciones.push("codigo_sku = ?");
    valores.push(codigo);
  }

  if (stockMax !== undefined) {
    condiciones.push("stock_actual <= ?");
    valores.push(stockMax);
  }

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
    WHERE ${condiciones.join(" AND ")}
    ORDER BY nombre ASC
  `;

  const [rows] = await connection.execute(sql, valores);
  return rows;
};

export const crearProductoStock = async ({
  codigo_sku,
  codigo_qr,
  nombre,
  descripcion,
  stock_actual,
  stock_minimo
}) => {
  const sql = `
    INSERT INTO Productos_stock
      (codigo_sku, codigo_qr, nombre, descripcion, stock_actual, stock_minimo, activo)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `;
  const [resultado] = await connection.execute(sql, [
    codigo_sku,
    codigo_qr,
    nombre,
    descripcion,
    stock_actual,
    stock_minimo
  ]);

  return resultado.insertId;
};

export const actualizarProductoStock = async (
  id,
  { codigo_sku, codigo_qr, nombre, descripcion, stock_actual, stock_minimo }
) => {
  const conexion = await connection.getConnection();
  try {
    await conexion.beginTransaction();
    const [productos] = await conexion.execute(
      "SELECT id FROM Productos_stock WHERE id = ? AND activo = 1 FOR UPDATE",
      [id]
    );
    if (productos.length === 0) {
      await conexion.commit();
      return false;
    }

    const sql = `
      UPDATE Productos_stock
      SET codigo_sku = ?, codigo_qr = ?, nombre = ?, descripcion = ?,
          stock_actual = ?, stock_minimo = ?
      WHERE id = ? AND activo = 1
    `;
    await conexion.execute(sql, [
      codigo_sku,
      codigo_qr,
      nombre,
      descripcion,
      stock_actual,
      stock_minimo,
      id
    ]);
    await conexion.commit();
    return true;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
};

export const eliminarProductoStock = async (id) => {
  const sql = "UPDATE Productos_stock SET activo = 0 WHERE id = ? AND activo = 1";
  const [resultado] = await connection.execute(sql, [id]);
  return resultado.affectedRows > 0;
};
