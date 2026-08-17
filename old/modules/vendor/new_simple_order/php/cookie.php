<?php
	header("Access-Control-Allow-Origin: *");
	header("Content-Type: application/json; charset=UTF-8");
	header("Access-Control-Allow-Methods: POST");
	header("Access-Control-Max-Age: 3600");
	header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

	if($_POST['type'] == 'set') {
		setcookie($_POST['key'], $_POST['value'], time() + (86400 * $_POST['expiry']), "/"); // 86400 = 1 day
		$_COOKIE[$_POST['key']] = $_POST['value'];
	}

	if($_POST['type'] == 'get') {
		if(isset($_COOKIE[$_POST['key']])) {
			echo json_encode($_COOKIE[$_POST['key']]);
		} 
		
	}
?>