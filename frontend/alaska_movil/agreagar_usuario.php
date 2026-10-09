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
    <title>Alaska: Inicio de sesión</title>
    <style>
        body {
            margin: 0;
            font-family: "Trebuchet MS", sans-serif;
            background-color: #467cab;
        }
        #img_logo {
            height: 80px;
            width: 80px;
            margin-right: 15px;
        }
        .nav {
            width: 100%;
            background-color: #bbe0ff;
            display: flex;
            align-items: center;
            padding: 0 2rem;
            position: fixed;
            height: 100px;
            top: 0;
            left: 0;
            box-sizing: border-box;
            z-index: 1000;
            box-shadow: 0px 4px 10px rgba(0,0,0,0.1);
        }
        .nav h1 {
            color: #467cab;
            margin: 0;
        }
        .lista_nav {
            list-style: none;
            display: inline-flex;
            margin-left: auto;
            padding: 0;
        }
        .lista_nav li {
            margin: 0 1rem;
        }
        .lista_nav a {
            color: #467cab;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
        }
        .lista_nav a:hover {
            color: #234d75;
        }
        .btn_cerrar {
            background-color: transparent;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            border-style: none;
            cursor: pointer;
            color: #467cab;
        }
        .btn_cerrar:hover {
            color: #234d75;
        }
        .formulario {
            background-color: #c5e5ff7d;
            width: 45%;
            padding: 1rem;
            padding-top: 20px;
            margin: 1.6rem;
            border: 5px solid #2A4D77;
            border-radius: 20px;
        }
        input {
            background-color: #467cab;
            border: 4px solid #2A4D77;
            color: #95cffe;
            width: 80%;
            max-width: 400px;
            text-align: center;
            font-family: 'Trebuchet MS', sans-serif;
            padding: 5px;
            height: 30px;
            border-radius: 10px;
        }
        input::placeholder {
            color: #95cffe;
        }
        .btn {
            background-color: #467cab;
            border: none;
            color: white;
            font-family: 'Trebuchet MS', sans-serif;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        }
        h1, h2 {
            color: white;
        }
    </style>
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
                
                <button type="submit" class="btn" name="enviar">Iniciar Sesión</button>
            </form>
        </center>
    </section>
</body>
</html>