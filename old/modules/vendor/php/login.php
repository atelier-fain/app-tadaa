<?php
	if($_SERVER['SERVER_NAME'] == 'vendor.chew.atelierfain.ro') {
		$app_url = "https://vendor.chew.atelierfain.ro";
		$cockpit_url = "https://api.chew.atelierfain.ro";
	} elseif($_SERVER['SERVER_NAME'] == 'vendor.chew.biglittlefestival.com') {
		$app_url = "https://vendor.chew.biglittlefestival.com";
		$cockpit_url = "https://api.chew.biglittlefestival.com";
	}
	
	header("Access-Control-Allow-Origin: *");
	header("Content-Type: application/json; charset=UTF-8");
	header("Access-Control-Allow-Methods: POST");
	header("Access-Control-Max-Age: 3600");
	header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
	// echo password_hash($_POST['password'], PASSWORD_BCRYPT);
	// password_verify($_POST['password'],"$2y$10$dTesTqPdYv23wlklW1aI.OevOh0jn3V0WYflV5BlOUbPAlXU8qavu")
	$curl = curl_init();
	// print_r($_POST);

	curl_setopt_array($curl, array(
	  CURLOPT_URL => $GLOBALS['cockpit_url'].'/api/collections/get/vendors?token=793a33de041946f92512469dfbc965',
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => '',
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 0,
	  CURLOPT_FOLLOWLOCATION => true,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => 'POST',
	  CURLOPT_POSTFIELDS =>'{
	    "filter": {
	        "username": "'.$_POST['username'].'"
	    }
	}',
	  CURLOPT_HTTPHEADER => array(
	    'Content-Type: application/json'
	  ),
	));

	$response = json_decode(curl_exec($curl),true);

	curl_close($curl);
	

	if(isset($response['entries'][0]['password']) && password_verify($_POST['password'],$response['entries'][0]['password'])) {
		$token = base64_encode(json_encode($response['entries'][0]));
		setcookie("token", $token, time() + (86400 * 400), "/"); // 86400 = 1 day
		echo json_encode(array('vendor'=>$response['entries'][0]['_id']));
	} else {
		echo json_encode(false);
	}
?>