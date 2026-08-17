<?php
    $v = 141;
?>

<!DOCTYPE html>
<html lang="ro" class="<?php echo substr(basename($_SERVER['PHP_SELF']), 0, -4);?>">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, target-densitydpi=device-dpi" />

        <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
        <title>Food vendor</title>
        
        <link rel="icon" type="image/png" href="https://biglittlefestival.com/img/favicon.png">
        <link rel="manifest" href="/manifest.json?v=<?php //echo $v; ?>" />

        <!-- Bootstrap -->

        <link href="/css/bootstrap.css?v=<?php //echo $v; ?>" rel="stylesheet">
        <link href="/css/bootstrap-theme.css?v=<?php //echo $v; ?>" rel="stylesheet">
        <link href="/vendor/fontawesome/css/font-awesome.css" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="/modules/vendor/css/style.css?v=<?php //echo time(); ?>">
        <link rel="stylesheet" type="text/css" href="/modules/vendor/css/style-mobile.css?v=<?php //echo time(); ?>">

        <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
        <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
        <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
        <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
        <![endif]-->
        <!-- <link rel="apple-touch-icon" href="https://timesheet.atelierfain.ro/img/favicon.svg"> -->
    </head>
    <body>