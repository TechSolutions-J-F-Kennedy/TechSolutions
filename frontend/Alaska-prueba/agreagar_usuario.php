<?php
// 1. Iniciar sesión para poder cerrarla o gestionarla
session_start();

$server = "localhost";
$user = "root";
$pass = "";
$base = "alaska";

$conexion = new mysqli($server, $user, $pass, $base);

if ($conexion->connect_errno) {
    die("La conexion no se realizo correctamente: " . $conexion->connect_errno);
}

// 2. Procesar registro/inicio de sesión
if (isset($_POST['enviar'])) {
    $code = $_POST['nombre'];
    $name = $_POST['contra'];

    // Para evitar inyecciones SQL simples, escapamos los datos
    $code = $conexion->real_escape_string($code);
    $name = $conexion->real_escape_string($name);

    $sql = "INSERT INTO usuarios (name, pass) VALUES ('$code', '$name')";

    if (mysqli_query($conexion, $sql)) {
        // Redireccionar inmediatamente sin 'echo' antes
        header("Location: index.php");
        exit();
    } else {
        echo "Error en la consulta: " . mysqli_error($conexion);
    }
}

// 3. Procesar Cierre de Sesión
if (isset($_POST['cerrar'])) {
    session_destroy(); // Paréntesis corregidos
    header('Location: index.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="alaska.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
    <title>Alaska: Inicio de sesión</title>
</head>
<body>
    <header>
        <nav class="nav">
            <img src="logo.png" id="img_logo" alt="Logo">
            <h1>ALASKA</h1>
            <ul class="lista_nav">
                <li><a href="inventario.php">Inicio</a></li>
                <li><a href="#contacto">Contacto</a></li>
                <li><a href="agregar.php">Agregar producto</a></li>
                <li>
                    <form action="inventario.php" method="post" style="display:inline;">
                        <button class="btn_cerrar" name="cerrar" type="submit">Cerrar sesión</button>
                    </form>
                </li>
            </ul>
        </nav>
    </header>

    <br><br><br><br><br><br>

    <section>
        <center>
            <!-- Asegúrate de enviar la acción al mismo archivo o al que corresponda -->
            <form class="formulario" action="" method="post">
                <h1>crear usuario tecnico nuevo</h1>
                <h2>Usuario</h2>
                <input type="text" name="nombre" placeholder="Ingrese su usuario" required>
                <h2>Contraseña</h2>
                <input type="password" name="contra" placeholder="Ingrese su contraseña" required><br><br>
                
                <button type="submit" class="btn_submit" name="enviar">Iniciar Sesión</button>
            </form>
        </center>
    </section>
</body>
</html>