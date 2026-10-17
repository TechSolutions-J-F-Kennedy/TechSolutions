<?php
$server = "localhost";
$user = "root";
$pass = "";
$base = "alaska";
$conexion = new mysqli ($server, $user, $pass, $base);
if ($conexion -> connect_errno){
	die("La conexion no se realizo correctamente".$conexion -> connect_errno);
}
if(isset ($_POST['enviar'])){
    $code = $_POST ['code'];
	$name = $_POST ['nombre'];
    $stock = $_POST['stock'];
    $precio = $_POST['precio'];
$sql = "INSERT INTO productos (code,name,stock,precio) VALUES('$code','$name','$stock','$precio')";
if(mysqli_query($conexion, $sql)){
 	echo "Producto registrado con exito";
    header("location:inventario.php");
 }	
}
if (isset($_POST['cerrar'])) {
    header('location:index.php');
    session_destroy;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>alaska:inicio de sesion</title>
    <link rel="stylesheet" href="alaska.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet">
</head>
<body>
    <header> <nav class="nav">
            <img src="newlogo.png" id="img_logo" alt="Logo">
            <h1>ALASKA</h1>
            <ul class="lista_nav">
                <li><a href="inventario.php">Inicio</a></li>
                <li><a href="#contacto">Contacto</a></li>
                <li><a href="agregar.php">Agregar producto</a></li>
                <form action="inventario.php" method="post"><li><button class="btn_cerrar" name="cerrar" type="submit">cerrar sesi&oacute;n</button></li></form>
                
            </ul>
        </nav></header>
    <section>
        <center>
        <form class="formulario" action="agregar.php" method="post">
        <h1>agregar producto a la lista</h1>
        <label>nombre del producto
        <input type="text" name="nombre" placeholder="ingrese el nombre del producto">
        <label>codigo del producto
        <input type="number" name="code" placeholder="ingrese el codigo del producto">
        <label>numero de stock
        <input type="number" name="stock" placeholder="ingrese la cantidad de stock actual del producto">
        <label>precio del producto
        <input type="number" name="precio" placeholder="ingrese el precio del producto">
        <br><br>
        <button type="submit" class="btn_submit" name="enviar">agregar</button>
        </form>
        </center>
    </section>
    <footer id="contacto">
    </footer>
    <script></script>
</body>
</html>