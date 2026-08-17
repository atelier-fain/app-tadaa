<?php
	header("Access-Control-Allow-Origin: *");
	header("Content-Type: application/json; charset=UTF-8");
	header("Access-Control-Allow-Methods: POST");
	header("Access-Control-Max-Age: 3600");
	header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

	require_once('../php/functions.php');

    if($_POST['order']['prepaid'] == 'false') {
      $_POST['order']['prepaid'] = false;
    }

    $unavailable_products = check_products_availibility($_POST['order']);
    //echo "<pre>";
    // print_r($_POST['order']['vendor']);
    //exit();

    
    if(!vendor_opened($_POST['order']['vendor'])) {
      print_r(json_encode(array("error"=>true, "error_code" => 1)));
      exit();
    }

    if($unavailable_products['total'] > 0) {
      print_r(json_encode(array("error"=>true, "error_code" => 2, "unavailable_products"=>$unavailable_products['unavailable'])));
      exit();
    }
    
    if(strlen($_POST['order']['shortOrderCode']) > 6) {
      if(!$order = viva_order_exists($_POST['order']['shortOrderCode'])){
        $order = save_order($_POST['order']);
      }     
    } else {
      $order = save_order($_POST['order']);
    }
    // $order = save_order($_POST['order']);
    echo json_encode($order);
?>