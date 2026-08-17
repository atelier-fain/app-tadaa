<?php
    require_once('php/functions.php');
    if (!isset($_COOKIE['user'])) {
        create_user();
    }
    $v = 59;

    // echo "<pre>";
    // print_r($vendor);
?>

<!DOCTYPE html>
<html lang="ro" class="<?php echo substr(basename($_SERVER['PHP_SELF']), 0, -4);?>">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

        <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
        <title>TADA</title>

        <!-- Bootstrap -->
        <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
        <link href="/css/bootstrap.min.css?v=<?php //echo $v; ?>" rel="stylesheet">
        <link href="/css/bootstrap-theme.css?v=<?php //echo $v; ?>" rel="stylesheet">
        <link href="/vendor/fontawesome/css/font-awesome.css" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="/modules/vendor/new_order/css/style.css?v=<?php //echo time(); ?>">

        <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
        <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
        <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
        <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
        <![endif]-->
    </head>
    <body>
        <header>
            <!-- <div class="menu">
                <span class="menu-toggle">&times;</span>
                <a href="/all-vendors/">Restaurante</a>
                <a href="/orders/">Comenzile mele</a>
                <a href="/help/">Ajutor</a>

                <div class="legal">
                    <div class="links">
                        <a class="drawer-toggle" target="#livrare">Livrare</a>
                        <a target="blank" href="https://biglittlefestival.com/Termeni%20si%20conditii%20BLF.pdf">Termeni și condiții</a>
                    </div>
                    <script src="https://mny.ro/npId.js?p=140941" type="text/javascript" data-version="orizontal" data-contrast-color="#434343" ></script>
                </div>
            </div>
            <div class="top">
                <div class="left">
                    <a href="/all-vendors"><img class="logo" src="/modules/vendor/new_order/img/logo2.svg"></a>
                    <?php if (isset($vendor)) { ?>
                        <span class="vendor">& <?php echo $vendor['name'] ;?></span>
                    <?php } ?>
                    
                </div>
                <img class="menu-toggle" src="/modules/vendor/new_order/img/menu.svg">
            </div> -->
        