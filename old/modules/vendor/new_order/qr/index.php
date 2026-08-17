<?php 
    require_once('../php/functions.php');
    

    $slug = explode('/',$_SERVER['REQUEST_URI']);
    $slug = end($slug);
    $slug = explode('?',$slug)[0];

    $errors = false;

    if(empty($slug)) {
        $errors = true;
    } 

    if(!$entry = qr_exists($slug)) {
        $errors = true;
    } 

    // var_dump($errors);
    // var_dump($entry);
    
    if($errors) {
        header('location:/all-vendors');
    } else {
        header('location:/?id='.$entry['vendor']['_id']);
    }
    



    