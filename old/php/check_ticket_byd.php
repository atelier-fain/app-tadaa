<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
	header('Content-Type: application/json');

	$id = $_POST['id'];
	//$id = '8f7ca1be376134712200035c';
	$today = date("d");
	$today = "31";

	$valid = false;
	$found = false;
	$ticket_name = '';
	$ticket_category = '';
	$details = false;
	$color = false;
	$qty = false;
	$istoday = false;
	

	$curl = curl_init();



	curl_setopt_array($curl, array(
	  CURLOPT_URL => 'https://api.byd.grapeminds.ro/api/collections/get/sealion_7_invitati/?token=e7b403b27a9afa252f013058041e6e',
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => '',
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 0,
	  CURLOPT_FOLLOWLOCATION => true,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => 'POST',
	  CURLOPT_POSTFIELDS =>'{
	    "filter": {
	        "_id" : "'.$id.'"
	    }
	}',
	  CURLOPT_HTTPHEADER => array(
	    'Content-Type: application/json'
	  ),
	));

	$response = json_decode(curl_exec($curl),true);
	// echo json_encode($response);
	curl_close($curl);


	if($response['total'] != 0) {
		$user = $response['entries'][0];

		if($user['check_in']) {
			$ticket_name = $user['prenume'].' '.$user['nume'];
			$ticket_category = $user['email'];
		} else {

			$valid = true;
			$ticket_name = $user['prenume'].' '.$user['nume'];
			$ticket_category = $user['email'];
			$istoday = true;

			$data = [
				"data" => [
					"_id" => $id,
					"check_in" => true
				]
			];
			$json = json_encode($data);

			curl_setopt_array($curl, array(
			  CURLOPT_URL => 'https://api.byd.grapeminds.ro/api/collections/save/sealion_7_invitati/?token=e7b403b27a9afa252f013058041e6e',
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

			$result = json_decode(curl_exec($curl),true);
			curl_close($curl);
		}
	} else {

	}

	

	echo json_encode([
			"valid" => $valid,  
			"ticket_name" => $ticket_name, 
			"ticket_category" => $ticket_category,
			"qty" => $qty,
			"color" => $color,
			"istoday" => $istoday
		]
	);



	
?>