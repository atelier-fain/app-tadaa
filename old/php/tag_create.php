<?php
	header('Content-Type: application/json');

	$curl = curl_init();

	curl_setopt_array($curl, array(
	  CURLOPT_URL => 'https://api.tadaa.ro/v1/prepaid/tag/create/',
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => '',
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 0,
	  CURLOPT_FOLLOWLOCATION => true,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => 'POST',
	  CURLOPT_POSTFIELDS =>'{
	    "token": "'.$_COOKIE['token'].'"
	}',
	  CURLOPT_HTTPHEADER => array(
	    'Content-Type: application/json',
	    "Authorization: Bearer FG.-,thVup'y1XkyEH*QWf:E5bjfR#[#QR[,S+}bsq#YlUyL*-Q]Uj(.gd|Z[Xd7"
	  ),
	));
	$json = curl_exec($curl);
	$response = json_decode($json,true);
	
	echo json_encode(["tag" => $response['_id']]);
	
?>