<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
	header('Content-Type: application/json');

	$code = $_POST['code'];
	$today = date("d");
	$today = "31";
	// $code = '856014532';
	$valid = false;
	$found = false;
	$istoday = false;
	$ticket_name = '';
	$ticket_category = '';
	$details = false;
	$color = false;
	$qty = false;
	

	$curl = curl_init();

	$filter = [
			"filter" => [
				"ticket_code" => $code,
        		"used"=> false
			]
		];
	$json = json_encode($filter);
	$curl = curl_init();
	curl_setopt_array($curl, array(
	  CURLOPT_URL => 'https://api.tickets.atelierfain.ro/api/collections/get/invitatii_proedus?token=711d1b4e4bbf1b8b8ae3ef7f832efd',
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => '',
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 0,
	  CURLOPT_FOLLOWLOCATION => true,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => 'POST',
	  CURLOPT_POSTFIELDS => $json,
	  CURLOPT_HTTPHEADER => array(
	    'Content-Type: application/json'
	  ),
	));

	$response = json_decode(curl_exec($curl),true);
	// echo $json;
	// echo json_encode($response);
	curl_close($curl);

	if($response['total'] != 0) {
		$found = true;
		$entry = $response['entries'][0];
		$valid = true;
		$ticket_category = "";
		$ticket_name = $entry['ticket_name'];
	}

	// print_r($entry);

	if($today == "29" || $today == "30" || $today == "31") {
		$istoday = true;
	}

	if($istoday) {
		$color = 'galbena';
		$qty = 1;
	}

	if($valid && $istoday) {
		//mark as used		
		$entry['used'] = true;
		$entry['used_date'] = date("d.m.Y H:i:s");
		$data = json_encode(["data"=>$entry]);

		$curl = curl_init();

		curl_setopt_array($curl, array(
		  CURLOPT_URL => 'https://api.tickets.atelierfain.ro/api/collections/save/invitatii_proedus?token=608083fa154f41e2bab439862ff422',
		  CURLOPT_RETURNTRANSFER => true,
		  CURLOPT_ENCODING => '',
		  CURLOPT_MAXREDIRS => 10,
		  CURLOPT_TIMEOUT => 0,
		  CURLOPT_FOLLOWLOCATION => true,
		  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
		  CURLOPT_CUSTOMREQUEST => 'POST',
		  CURLOPT_POSTFIELDS => $data,
		  CURLOPT_HTTPHEADER => array(
		    'Content-Type: application/json'
		  ),
		));

		$response = curl_exec($curl);
		//echo $response;
		curl_close($curl);
	}

	echo json_encode([
			"valid" => $valid, 
			"istoday" => $istoday, 
			"ticket_name" => $ticket_name, 
			"ticket_category" => $ticket_category,
			"qty" => $qty,
			"color" => $color
		]
	);



	
?>