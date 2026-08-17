<?php
	header('Content-Type: application/json');

	$code = $_POST['code'];
	$today = date("d");
	//$today = "31";
	// $code = '856014532';
	$collection = false;
	$valid = false;
	$found = false;
	$istoday = false;
	$ticket_name = '';
	$ticket_category = '';
	$details = false;
	$color = false;
	$qty = false;
	

	$curl = curl_init();

	$filter = '{
	    "filter": {
	        "ticket_code": "'.$code.'",
        	"used": false
	    }
	}';

	curl_setopt_array($curl, array(
	  CURLOPT_URL => 'https://api.tickets.atelierfain.ro/api/collections/get/blf_tickets?token=711d1b4e4bbf1b8b8ae3ef7f832efd',
	  CURLOPT_RETURNTRANSFER => true,
	  CURLOPT_ENCODING => '',
	  CURLOPT_MAXREDIRS => 10,
	  CURLOPT_TIMEOUT => 0,
	  CURLOPT_FOLLOWLOCATION => true,
	  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
	  CURLOPT_CUSTOMREQUEST => 'POST',
	  CURLOPT_POSTFIELDS => $filter,
	  CURLOPT_HTTPHEADER => array(
	    'Content-Type: application/json'
	  ),
	));

	$response1 = json_decode(curl_exec($curl),true);
	curl_close($curl);

	if($response1['total'] != 0) {
		$found = true;
		$entry = $response1['entries'][0];
		$collection = 'blf_tickets';
	}


	if(!$found) {

		$curl = curl_init();
		curl_setopt_array($curl, array(
		  CURLOPT_URL => 'https://api.tickets.atelierfain.ro/api/collections/get/invitatii?token=711d1b4e4bbf1b8b8ae3ef7f832efd',
		  CURLOPT_RETURNTRANSFER => true,
		  CURLOPT_ENCODING => '',
		  CURLOPT_MAXREDIRS => 10,
		  CURLOPT_TIMEOUT => 0,
		  CURLOPT_FOLLOWLOCATION => true,
		  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
		  CURLOPT_CUSTOMREQUEST => 'POST',
		  CURLOPT_POSTFIELDS => $filter,
		  CURLOPT_HTTPHEADER => array(
		    'Content-Type: application/json'
		  ),
		));

		$response2 = json_decode(curl_exec($curl),true);
		curl_close($curl);

		if($response2['total'] != 0) {
			$found = true;
			$entry = $response2['entries'][0];
			$collection = 'invitatii';
		}
	}

	


	if(!$found) {
		$curl = curl_init();

		$filter = '{
		    "filter": {
		        "cod_bare": "'.$code.'",
	        	"used": false
		    }
		}';

		curl_setopt_array($curl, array(
		  CURLOPT_URL => 'https://api.tickets.atelierfain.ro/api/collections/get/iabilet?token=711d1b4e4bbf1b8b8ae3ef7f832efd',
		  CURLOPT_RETURNTRANSFER => true,
		  CURLOPT_ENCODING => '',
		  CURLOPT_MAXREDIRS => 10,
		  CURLOPT_TIMEOUT => 0,
		  CURLOPT_FOLLOWLOCATION => true,
		  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
		  CURLOPT_CUSTOMREQUEST => 'POST',
		  CURLOPT_POSTFIELDS => $filter,
		  CURLOPT_HTTPHEADER => array(
		    'Content-Type: application/json'
		  ),
		));

		$response3 = json_decode(curl_exec($curl),true);
		curl_close($curl);

		if($response3['total'] != 0) {
			$found = true;
			$entry = $response3['entries'][0];
			$collection = 'iabilet';
		}
	}

	if($found) {

		if(isset($entry['ticket_name'])) {
			$ticket_name = $entry['ticket_name'];
		} else {
			$ticket_name = $entry['tarif'];
		}

		if(isset($entry['ticket_category'])) {
			$ticket_category = $entry['ticket_category'];
		} elseif(isset($entry['loc'])) {
			$ticket_category = $entry['loc'];
		} else {
			$ticket_category = '';
		}

		$valid = true;
	}
	

	$bands = [
		"Abonament" => [
			"color" => "galbena",
			"qty" => [
				"COMBO" => 3,
				"SUMMER" => 3,
				"PACHET" => 3,
				"else" => 1
			]
		],
		"ORIC" => [
			"color" => false,
			"qty" => [
				"Aniversare" => 20,
				"COMBO" => 3,
				"SUMMER" => 3,
				"PACHET" => 3,
				"else" => 1
			]
		],
		"29" => [
			"color" => "albastra",
			"qty" => [
				"Aniversare" => 20,
				"COMBO" => 3,
				"SUMMER" => 3,
				"PACHET" => 3,
				"else" => 1
			]
		],
		"30" => [
			"color" => "roz - fucsia",
			"qty" => [
				"Aniversare" => 20,
				"COMBO" => 3,
				"SUMMER" => 3,
				"PACHET" => 3,
				"else" => 1
			]
		],
		"31" => [
			"color" => "mov - lila",
			"qty" => [
				"Aniversare" => 20,
				"COMBO" => 3,
				"SUMMER" => 3,
				"PACHET" => 3,
				"else" => 1
			]
		],
		"else" => [
			"qty" => "1",
			"color" => [
				"Special" => 'aurie',
				"else" => 'galbena'
			]
		]
	];

	

	if(stripos($ticket_category, $today) !== false || stripos($ticket_name, $today) !== false) {
		$istoday = true;
	}

	if(stripos($ticket_category, "abonament") !== false && ($today == "29" || $today == "30" || $today == "31")) {
		$istoday = true;
	}

	if(stripos($ticket_category, "oric") !== false && ($today == "29" || $today == "30" || $today == "31")) {
		$istoday = true;
	}

	if(stripos($ticket_name, "invita") || stripos($ticket_name, "special guest") !== false || $today == "29" || $today == "30" || $today == "31") {
		$istoday = true;
	}

	if($istoday) {
		foreach ($bands as $cat_q => $cat_v) {
		
			if(stripos($ticket_category, $cat_q) !== false) {
				$details = $cat_v;
			} 
		}

		if(!$details) {
			$details = $bands["else"];
		}
		
		if(is_array($details['color'])) {
			
			foreach ($details['color'] as $color_q => $color_v) {
				if(stripos($ticket_name, $color_q) !== false) {
					$color = $color_v;
				}
			}
			if(!$color) {
				$color = $details["color"]["else"];
			}
		} else {
			
			foreach ($bands as $cat_q => $cat_v) {
				if (stripos($cat_q, $today) !== false) {
					$color = $bands[$cat_q]['color'];
				}
			}
		}

		if(is_array($details['qty'])) {
			
			foreach ($details['qty'] as $qty_q => $qty_v) {
				if(stripos($ticket_name, $qty_q) !== false) {
					$qty = $qty_v;
				}
			}
			if(!$qty) {
				$qty = $details["qty"]["else"];
			}
		} else {
			$qty = $details['qty'];
		}
	}

	if($valid && $istoday) {
		//mark as used
		$entry['used'] = true;
		$entry['used_date'] = date("d.m.Y H:i:s");
		$data = json_encode(["data"=>$entry]);

		$curl = curl_init();

		curl_setopt_array($curl, array(
		  CURLOPT_URL => 'https://api.tickets.atelierfain.ro/api/collections/save/'.$collection.'?token=608083fa154f41e2bab439862ff422',
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
		curl_close($curl);
	}

	echo json_encode([
			"valid" => $valid, 
			"istoday" => $istoday, 
			"ticket_name" => $ticket_name, 
			"ticket_category" => $ticket_category,
			"qty" => '',
			"color" => ''
		]
	);



	
?>