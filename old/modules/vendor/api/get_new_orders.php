<?php
	$app_version = 5;

	header("Access-Control-Allow-Origin: *");
	header("Content-Type: application/json; charset=UTF-8");
	header("Access-Control-Allow-Methods: POST");
	header("Access-Control-Max-Age: 3600");
	header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

	require_once('../php/functions.php');

	if(!isset($_COOKIE['chew-app-version']) || $_COOKIE['chew-app-version'] != $app_version) {
		setcookie("chew-app-version", $app_version, time() + (86400 * 300), "/"); // 86400 = 1 day
		echo json_encode(array('refresh'=>1));
		exit();
	}

	$result = array();

	$opened_orders = get_vendor_opened_orders($_POST['vendor']);
	$ready_orders = get_vendor_ready_orders($_POST['vendor']);
	
	$moved_orders = [];
	//print_r($_POST);
	if(!isset($_POST['ordersVisible'])) {
		$_POST['ordersVisible'] = array();
	}

	if(!isset($_POST['ordersReadyVisible'])) {
		$_POST['ordersReadyVisible'] = array();
	}
	foreach (array_unique($_POST['ordersVisible']) as $key => $order_key) {
		if (array_key_exists($order_key, $opened_orders)) {
			//$moved_orders[] = $order_key;
			unset($opened_orders[$order_key]);
		} else {
			$moved_orders[$order_key] = get_prop('vendor_orders',$order_key,'status');
		}
	}


	foreach (array_unique($_POST['ordersReadyVisible']) as $key => $order_key) {
		if (!array_key_exists($order_key, $ready_orders)) {
			$moved_orders[$order_key] = get_prop('vendor_orders',$order_key,'status');
		}
	}
	if (count($opened_orders) > 0) {
		echo json_encode(array('errors'=>0,'new_orders'=>$opened_orders, 'moved_orders'=>$moved_orders));
	} else {
		echo json_encode(array('errors'=>1, 'moved_orders'=>$moved_orders));
	}
	
?>