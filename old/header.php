<?php

?>

<!DOCTYPE html>
<html lang="ro" class="<?php echo substr(basename($_SERVER['PHP_SELF']), 0, -4);?>">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
        <title>TADA</title>
        <link rel="manifest" href="/manifest.json?v=<?php echo time();?>">
        <link rel="apple-touch-icon" sizes="512x512" href="img/icon.png">

        <!-- Bootstrap -->
        <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
        <link href="/css/bootstrap.css" rel="stylesheet">
        <link href="/css/bootstrap-theme.css" rel="stylesheet">
        <link href="/vendor/fontawesome/css/font-awesome.css" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="/css/app.css?v=3<?php //echo time();?>">
        <?php if($module != 'app'){ ?>
            <?php 
                $css = $module;
                if(isset($module_sufix)){
                    $css .= $module_sufix;
                }
            ?>
            <link rel="stylesheet" type="text/css" href="/css/<?php echo $css;?>.css?v=4<?php //echo time();?>">
        <?php } ?>

        <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
        <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
        <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
        <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
        <![endif]-->
    </head>
    <body>