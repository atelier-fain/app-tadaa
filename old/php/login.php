<?php
	header('Content-Type: application/json');

	$curl = curl_init();

	curl_setopt_array($curl, array(
	  CURLOPT_URL => 'https://api.tadaa.ro/v1/auth/login/',
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => '',
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 0,
	  CURLOPT_FOLLOWLOCATION => true,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => 'POST',
	  CURLOPT_POSTFIELDS =>'{
	    "user": "'.$_POST['user'].'",
	    "password": "'.$_POST['password'].'",
	    "permission": "access"
	}',
	  CURLOPT_HTTPHEADER => array(
	    'Content-Type: application/json',
	    "Authorization: Bearer FG.-,thVup'y1XkyEH*QWf:E5bjfR#[#QR[,S+}bsq#YlUyL*-Q]Uj(.gd|Z[Xd7"
	  ),
	));

	$json = curl_exec($curl);
	// echo $json;
	// exit();
	$response = json_decode($json,true);
	//print_r($response);
	curl_close($curl);
	
	if($response['auth']) {
		setcookie('token', $response['token'], [
		    'expires' => time() + (3600*100),          // 100 hours
		    'path' => '/',                            // Available across the entire domain
		    'domain' => $_SERVER['SERVER_NAME'],     // The leading dot allows access on subdomains
		    'secure' => true
		]);
		$_COOKIE['token'] = $response['token'];
	}

	echo json_encode(["auth" => $response['auth']]);
	
?>