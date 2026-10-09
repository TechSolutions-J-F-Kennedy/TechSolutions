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
    <style>
        body{
            margin: 0;
            font-family: "Trebuchet MS";
            background-color:#467cab;
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
            border-style:none;
        }
        .btn_cerrar:hover {
            color: #234d75;
        }
        .formulario{
            background-color: #c5e5ff7d;
            width: 45%;
            padding-top: 50px;
            padding: 1rem;
            margin:1.6rem;
            border-style: solid;
            border-width: 5px;
            border-color: #2A4D77;
            border-radius: 20px;
        }
        input{
            background-color: #467cab;
            border-style: solid;
            border-color: #2A4D77;
            border-width: 4px;
            color: #95cffe;
            width: 400px;
            text-align: center;
            font-family: 'Trebuchet MS';
            padding: 5px;
            height: 30px;
            border-radius: 10px;
        }
        input::placeholder{
            color: #95cffe;
        }
        .btn{
            background-color: #467cab;
            border-style: none;
            color: white;
            font-family: 'Trebuchet MS';
            padding: 10px;
            height: 30px;
            border-radius: 5px;
            text-align: center;
            padding-top: 6px;
            padding-bottom: 15px;
        }
        footer{
            width: 2rem;
            background-color: #cbe8ff;
        }
        a{
            color: white;
            text-decoration:none;
            font-size:20px;
        }
        .mensaje{
            font-size:16px;
            margin:10px;
        }
        p{
            margin:0;
        }
        h1{
            color:white;
        }
        h2{
            color:white;
        }
        .lista_nav{
            list-style: none;
            display:inline-flex;
        }
        li{
            margin:1rem;
        }
        #contacto{
            background-color: #bbe0ff;
            height:30px;
            width:100%;
        }
    </style>
</head>
<body>
    <header> <nav class="nav">
            <img src="logo.png" id="img_logo" alt="Logo">
            <h1>ALASKA</h1>
            <ul class="lista_nav">
                <li><a href="inventario.php">Inicio</a></li>
                <li><a href="#contacto">Contacto</a></li>
                <li><a href="agregar.php">Agregar producto</a></li>
                <form action="inventario.php" method="post"><li><button class="btn_cerrar" name="cerrar" type="submit">cerrar sesi&oacute;n</button></li></form>
                
            </ul>
        </nav></header>
    <br><br><br><br><br><br>
    <section>
        <center>
        <form class="formulario" action="agregar.php" method="post">
        <h1>agregar producto a la lista</h1>
        <h2>nombre del producto</h2>
        <input type="text" name="nombre" placeholder="ingrese el nombre del producto">
        <h2>codigo del producto</h2>
        <input type="number" name="code" placeholder="ingrese el codigo del producto">
        <h2>numero de stock</h2>
        <input type="number" name="stock" placeholder="ingrese la cantidad de stock actual del producto">
        <h2>precio del producto</h2>
        <input type="number" name="precio" placeholder="ingrese el precio del producto">
        <br><br>
        <button type="submit" class="btn" name="enviar">agregar</button>
        </form>
        </center>
    </section>
    <footer id="contacto">
    </footer>
    <script></script>
</body>
</html>