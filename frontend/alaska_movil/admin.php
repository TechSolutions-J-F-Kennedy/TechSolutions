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
    <title>alaska: inicio de sesion</title>
    <style>
        body{
            margin: 0;
            font-family: "Trebuchet MS", sans-serif;
            background-color:#467cab;
        }
        #img_logo{
            height: 100px;
            width: 100px;
        }
        .nav{
            width: 100%;
            background-color: #bbe0ff;
            display: flex;
            align-items: center;
            padding: 1rem;
            position: fixed;
            height:100px;
            top: 0;
            left: 0;
            box-sizing: border-box;
        }
        section {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 140px; 
        }
        .formulario{
            background-color: #c5e5ff7d;
            width: 45%;
            max-width: 500px;
            padding: 2rem;
            border: 5px solid #2A4D77;
            border-radius: 20px;
            text-align: center;
            color: white;
        }
        input{
            background-color: #467cab;
            border: 4px solid #2A4D77;
            color: #95cffe;
            width: 90%;
            max-width: 400px;
            text-align: center;
            font-family: 'Trebuchet MS';
            padding: 5px;
            height: 30px;
            border-radius: 10px;
            margin-bottom: 15px;
        }
        input::placeholder{
            color: #95cffe;
        }
        .btn{
            background-color: #467cab;
            border: none;
            color: white;
            font-family: 'Trebuchet MS';
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .mensaje{
            font-size:16px;
            margin:10px;
        }
        a{
            text-decoration:none;
            color:black;
        }
    </style>
</head>
<body>
    <header>
        <nav class="nav">
            <img src="logo.png" id="img_logo" alt="Logo">
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
            
            <button type="submit" class="btn" name="enviar">Iniciar Sesión</button>
            <h3>para volver al inicio de sesi&oacute;n de tecnicos haga click <a href="index.php">aqu&iacute;</a></h3>
        </form>
    </section>

    <footer></footer>
</body>
</html>