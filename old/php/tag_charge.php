<?php
	header('Content-Type: application/json');
	$input = json_decode(file_get_contents('php://input'), true);
	$curl = curl_init();

	curl_setopt_array($curl, array(
	  CURLOPT_URL => 'https://api.tadaa.ro/v1/prepaid/tag/charge/',
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => '',
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 0,
	  CURLOPT_FOLLOWLOCATION => true,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => 'POST',
	  CURLOPT_POSTFIELDS =>'{
	    "token": "'.$_COOKIE['token'].'",
	    "TDID": "'.$input['TDID'].'",
	    "method": "'.$input['method'].'",
	    "type": "'.$input['type'].'",
	    "amount": "'.$input['amount'].'",
	    "transactionId": "'.$input['transactionId'].'",
	    "shortOrderCode": "'.$input['shortOrderCode'].'"
	}',
	  CURLOPT_HTTPHEADER => array(
	    'Content-Type: application/json',
	    "Authorization: Bearer FG.-,thVup'y1XkyEH*QWf:E5bjfR#[#QR[,S+}bsq#YlUyL*-Q]Uj(.gd|Z[Xd7"
	  ),
	));
	$json = curl_exec($curl);
	$response = json_decode($json,true);
	
	echo json_encode(["response" => $response]);

?>