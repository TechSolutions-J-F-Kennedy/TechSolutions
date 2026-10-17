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

$mensaje = ""; 
if (isset($_POST['enviar'])) {
    $user = $conexion->real_escape_string($_POST['nombre']);
    $pass = $conexion->real_escape_string($_POST['contra']);

    $sql = "SELECT * FROM admins WHERE nombre = '$user' AND contraseña = '$pass'";
    $resultado = $conexion->query($sql);
    
    if ($resultado && $resultado->num_rows > 0) {
        $_SESSION['usuario'] = $user;
        $_SESSION['contra'] = $pass;
        header("Location: agreagar_usuario.php");
        exit(); 
    } else {
        $mensaje = "<p style='color: red;'>Usuario o contraseña incorrectos.</p>";
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="alaska.css">
    <link rel="stylesheet" href="alaska.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
    <title>alaska: inicio de sesion</title>
</head>
<body>
    <header>
        <nav class="nav">
            <img src="newlogo.png" id="img_logo" alt="Logo">
            <h1>ALASKA</h1>
        </nav>
    </header>

    <section>
        <form action="admin.php" class="formulario" method="post">
            <h1>Inicio de Sesión de administrador</h1>
            <h2>Usuario</h2>
            <input type="text" name="nombre" placeholder="Ingrese su usuario" required>
            <h2>Contraseña</h2>
            <input type="password" name="contra" placeholder="Ingrese su contraseña" required><br> 
            
            <div class="mensaje"><?php echo $mensaje; ?></div>
            
            <button type="submit" class="btn_submit" name="enviar">Iniciar Sesión</button>
            <h3>para volver al inicio de sesi&oacute;n de tecnicos haga click <a href="index.php">aqu&iacute;</a></h3>
        </form>
    </section>

    <footer></footer>
</body>
</html>