<?php
session_start();
$server = "localhost";
$db_user = "root";
$db_pass = "";
$base = "alaska";

$conexion = new mysqli($server, $db_user, $db_pass, $base);

if ($conexion->connect_errno) {
    die("La conexion no se realizo correctamente: " . $conexion->connect_errno);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['eliminar_producto'])) {
    $codeEliminar = $_POST['code_eliminar'] ?? '';

   if (!empty($codeEliminar)) {
    // En lugar de borrar, hacemos un UPDATE para ocultarlo (Borrado lógico)
        $stmtDelete = $conexion->prepare("UPDATE productos SET activo = 0 WHERE code = ?");
        $stmtDelete->bind_param("s", $codeEliminar);
        $stmtDelete->execute();
        $stmtDelete->close();
        
        header("Location: " . $_SERVER['REQUEST_URI']);
        exit;
    }
}
// -------------------------------------------------------------
// 2. PROCESAR ACTUALIZACIÓN DEL PRODUCTO
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['actualizar_producto'])) {
    $codeOriginal = $_POST['code_original'] ?? '';
    $nuevoNombre  = $_POST['name'] ?? '';
    $nuevoStock   = (int)($_POST['stock'] ?? 0);
    $nuevoPrecio  = (float)($_POST['precio'] ?? 0);

    if (!empty($codeOriginal)) {
        $stmtUpdate = $conexion->prepare("UPDATE productos SET name = ?, stock = ?, precio = ? WHERE code = ?");
        $stmtUpdate->bind_param("sids", $nuevoNombre, $nuevoStock, $nuevoPrecio, $codeOriginal);
        $stmtUpdate->execute();
        
        header("Location: " . $_SERVER['REQUEST_URI']);
        exit;
    }
}

// -------------------------------------------------------------
// 3. FILTROS Y CONSULTA SELECT
// -------------------------------------------------------------
$filtroNombre   = $_GET['nombre'] ?? '';
$filtroCode     = $_GET['code'] ?? '';
$filtroStockMax = $_GET['stock_max'] ?? '';

$condiciones = [];
// Agregamos esta línea para que SIEMPRE traiga solo los productos activos
$condiciones[] = "activo = 1"; 

$params = [];
$tipos = '';

if ($filtroNombre !== '') {
    $condiciones[] = "name LIKE ?";
    $params[] = '%' . $filtroNombre . '%';
    $tipos .= 's';
}

if ($filtroCode !== '') {
    $condiciones[] = "code = ?";
    $params[] = $filtroCode;
    $tipos .= 's';
}

if ($filtroStockMax !== '') {
    $condiciones[] = "stock <= ?";
    $params[] = (int)$filtroStockMax;
    $tipos .= 'i';
}

$sql = "SELECT * FROM productos";

if (count($condiciones) > 0) {
    $sql .= " WHERE " . implode(" AND ", $condiciones);
}

$sql .= " ORDER BY code ASC";

if (count($params) > 0) {
    $consulta = $conexion->prepare($sql);
    $consulta->bind_param($tipos, ...$params);
    $consulta->execute();
    $resultado = $consulta->get_result();
} else {
    $resultado = $conexion->query($sql);
}

$tabla = '';
$count = 0;

if ($resultado && $resultado->num_rows > 0) {
    while ($row = $resultado->fetch_array()) {
        if ($count % 4 == 0) {
            $tabla .= '<tr>';
        }

        $codeEsc   = htmlspecialchars($row['code']);
        $nameEsc   = htmlspecialchars($row['name']);
        $stockEsc  = htmlspecialchars($row['stock']);
        $precioEsc = htmlspecialchars($row['precio']);

        $tabla .= '<td class="tarjeta-producto" 
                       data-code="' . $codeEsc . '" 
                       data-name="' . $nameEsc . '" 
                       data-stock="' . $stockEsc . '" 
                       data-precio="' . $precioEsc . '">';
        
        $tabla .= '<div class="contenido-tarjeta">';
        $tabla .= '<h4>C&oacute;digo: ' . $codeEsc . '</h4>';
        $tabla .= '<h4>Nombre: ' . $nameEsc . '</h4>';
        $tabla .= '<h4>Stock: ' . $stockEsc . '</h4>';
        $tabla .= '<h4>Precio: ' . $precioEsc . '</h4>';
        $tabla .= '<button class="btn_seleccionar" onclick="seleccionarItem(this)">SELECCIONAR</button>';
        $tabla .= '</div>';
        $tabla .= '</td>';

        $count++;

        if ($count % 4 == 0) {
            $tabla .= '</tr>';
        }
    }

    if ($count % 4 != 0) {
        $tabla .= '</tr>';
    }
} else {
    $tabla = '<tr><td colspan="4" style="text-align:center;">No se encontraron productos.</td></tr>';
}
if (isset($_POST['cerrar'])) {
    header('location:index.php');
    session_destroy;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inicio - Alaska</title>
    <link rel="stylesheet" href="alaska.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <nav class="nav">
    <img src="logo.png" id="img_logo" alt="Logo">
    <h1>ALASKA</h1>
    <!-- Agregamos el onclick al botón del menú hamburguesa -->
    <button class="btn_cel" onclick="toggleMenuNav()">☰</button>
    <!-- Agregamos un ID 'listaNav' para manipularlo con JS -->
    <ul class="lista_nav" id="listaNav">
        <li><a href="index.php">Inicio</a></li>
        <li><a href="#contacto">Contacto</a></li>
        <li><a href="agregar.php">Agregar Producto</a></li>
        <li>
            <form action="index.php" method="post">
                <button class="btn_cerrar" name="cerrar" type="submit">Cerrar Ses&oacute;n</button>
            </form>
        </li>
    </ul>
</nav>

        <button class="btn_abrir_filtro" onclick="toggleFiltro()">Filtros</button>

        <aside class="filtro_sidebar" id="filtroSidebar">
            <div class="filtro_header">
                <h3>Filtros</h3>
                <button class="btn_cerrar" onclick="toggleFiltro()">X</button>
            </div>

            <div class="filtros_rapidos">
                <h4>Filtros r&aacute;pidos</h4>
                <a href="?stock_max=0" class="btn_rapido">Sin stock (0)</a>
                <a href="?stock_max=4" class="btn_rapido">Stock bajo (&lt; 5)</a>
            </div>

            <form method="GET" action="" class="filtro_form">
                <h4>Buscar</h4>
                <input type="text" name="nombre" placeholder="Nombre" value="<?php echo htmlspecialchars($filtroNombre); ?>">
                <input type="text" name="code" placeholder="C&oacute;digo" value="<?php echo htmlspecialchars($filtroCode); ?>">
                <input type="number" name="stock_max" placeholder="Stock menor o igual a" value="<?php echo htmlspecialchars($filtroStockMax); ?>">
                <button type="submit">Buscar</button>
                <a href="?" class="btn_limpiar">Limpiar filtros</a>
            </form>
        </aside>
    </header>

    <section class='articulos'>
        <table>
            <tbody>
                <?php echo $tabla; ?>
            </tbody>
        </table>
    </section>

    <form id="formEliminar" method="POST" action="">
        <input type="hidden" name="eliminar_producto" value="1">
        <input type="hidden" name="code_eliminar" id="codeEliminarInput" value="">
    </form>
    <footer>
        <p>todos los derechos reservados a KennedyTech Solutions @copyright 2026</p>
    </footer>
    <script>
        function toggleFiltro() {
            document.getElementById('filtroSidebar').classList.toggle('activo');
        }

        function toggleMenuNav() {
            const listaNav = document.getElementById('listaNav');
            listaNav.classList.toggle('activo');
        }

        function seleccionarItem(boton) {
            const td = boton.closest('.tarjeta-producto');
           
            const code = td.dataset.code;
            const name = td.dataset.name;
            const stock = td.dataset.stock;
            const precio = td.dataset.precio;

            td.innerHTML = `
                <form method="POST" action="" class="form-edicion">
                    <input type="hidden" name="actualizar_producto" value="1">
                    <input type="hidden" name="code_original" value="${code}">
                    
                    <h4>C&oacute;digo: ${code}</h4>
                    
                    <label>Nombre:</label>
                    <input type="text" name="name" value="${name}" required>
                    
                    <label>Stock:</label>
                    <input type="number" name="stock" value="${stock}" required>
                    
                    <label>Precio:</label>
                    <input type="number" step="0.01" name="precio" value="${precio}" required>
                    
                    <button type="submit" class="btn_guardar">GUARDAR</button>
                    <button type="button" class="btn_eliminar" onclick="eliminarProducto('${code}', '${name}')">ELIMINAR</button>
                    <button type="button" class="btn_cancelar" onclick="cancelarEdicion(this)">CANCELAR</button>
                </form>
            `;
        }

        function cancelarEdicion(boton) {
            const td = boton.closest('.tarjeta-producto');
            
            const code = td.dataset.code;
            const name = td.dataset.name;
            const stock = td.dataset.stock;
            const precio = td.dataset.precio;

            td.innerHTML = `
                <div class="contenido-tarjeta">
                    <h4>Código: ${code}</h4>
                    <h4>Nombre: ${name}</h4>
                    <h4>Stock: ${stock}</h4>
                    <h4>Precio: ${precio}</h4>
                    <button class="btn_seleccionar" onclick="seleccionarItem(this)">SELECCIONAR</button>
                </div>
            `;
        }

        function eliminarProducto(code, nombre) {
            if (confirm(`¿Estás seguro de que deseas eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`)) {
                document.getElementById('codeEliminarInput').value = code;
                document.getElementById('formEliminar').submit();
            }
        }
    </script>
</body>
</html>