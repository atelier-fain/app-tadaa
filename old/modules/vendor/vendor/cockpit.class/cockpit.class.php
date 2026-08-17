<?php

	// GET entries filters 
	// $filter = '{
	// 	"filter":{
	// 		"titlu" : "titlu1"
	// 	}
	// }';


	// POST add entries data
	// $entries = '{
	// 	"data":
	// 	{
	// 		"titlu" : "titlu1",
	// 		"subtitlu" : "subtitlu1"
	// 	}
	// }';

	// Edit entries data
	// {
	// 	"data": {
	// 		"id_produs_shopify" : "test",
	// 		"_id" : "5e6672e839343954c1000112"
	// 	}
	// }

	
	$domain = "https://api.timesheet.atelierfain.ro";
	$token_read = "793a33de041946f92512469dfbc965";
	$token_write = "9e4248067b6b77f01acd0d4a15562b";
	
	class Cockpit {

		public function listUsers() {
			global $domain;

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/cockpit/listUsers?token=70cec0bf17aa380d6b90564e4ca736",
			  CURLOPT_RETURNTRANSFER => true,
			  CURLOPT_ENCODING => "",
			  CURLOPT_MAXREDIRS => 10,
			  CURLOPT_TIMEOUT => 0,
			  CURLOPT_FOLLOWLOCATION => true,
			  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			  CURLOPT_CUSTOMREQUEST => "POST",
			  CURLOPT_HTTPHEADER => array(
    			"Content-Type: application/json"
  				),
			));

			$response = curl_exec($curl);

			curl_close($curl);
			return json_decode($response,true);
		}

		public function getEntries($collection,$filter = '{}') {
			global $domain;
			global $token_read;

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/collections/get/".$collection."?token=".$token_read,
			  CURLOPT_RETURNTRANSFER => true,
			  CURLOPT_ENCODING => "",
			  CURLOPT_MAXREDIRS => 10,
			  CURLOPT_TIMEOUT => 0,
			  CURLOPT_FOLLOWLOCATION => true,
			  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			  CURLOPT_CUSTOMREQUEST => "POST",
			  CURLOPT_POSTFIELDS => $filter,
			  CURLOPT_HTTPHEADER => array(
    			"Content-Type: application/json",
    			"X-Content-Type-Options: nosniff"
  				),
			));

			$response = curl_exec($curl);

			curl_close($curl);
			return json_decode($response,true);
		}

		public function getTranslations() {
			global $domain;
			global $token_read;
			$filter = '{
		       "fields": {"'.strtoupper($_COOKIE['lang']).'": "1"}
		      }';

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/collections/get/traduceri?token=".$token_read,
			  CURLOPT_RETURNTRANSFER => true,
			  CURLOPT_ENCODING => "",
			  CURLOPT_MAXREDIRS => 10,
			  CURLOPT_TIMEOUT => 0,
			  CURLOPT_FOLLOWLOCATION => true,
			  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			  CURLOPT_CUSTOMREQUEST => "POST",
			  CURLOPT_POSTFIELDS => $filter,
			  CURLOPT_HTTPHEADER => array(
    			"Content-Type: application/json",
    			"X-Content-Type-Options: nosniff"
  				),
			));

			$response = curl_exec($curl);

			curl_close($curl);
			$entries =  json_decode($response,true)['entries'];
			$translations = array();
			foreach ($entries as $key => $value) {
				$translations[$value['_id']] = $value;
			}

			return $translations;
		}

		public function addEntries($collection,$entry) {
			global $domain;
			global $token_write;

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/collections/save/".$collection."?token=".$token_write,
			  CURLOPT_RETURNTRANSFER => true,
			  CURLOPT_ENCODING => "",
			  CURLOPT_MAXREDIRS => 10,
			  CURLOPT_TIMEOUT => 0,
			  CURLOPT_FOLLOWLOCATION => true,
			  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			  CURLOPT_CUSTOMREQUEST => "POST",
			  CURLOPT_POSTFIELDS => $entry,
			  CURLOPT_HTTPHEADER => array(
			    "Content-Type: application/json"
			  ),
			));

			$response = curl_exec($curl);

			curl_close($curl);
			return json_decode($response,true);
		}

		public function editEntries($collection,$data) {
			global $domain;
			global $token_read;

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/collections/get/".$collection."?token=".$token_read,
			  CURLOPT_RETURNTRANSFER => true,
			  CURLOPT_ENCODING => "",
			  CURLOPT_MAXREDIRS => 10,
			  CURLOPT_TIMEOUT => 0,
			  CURLOPT_FOLLOWLOCATION => true,
			  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			  CURLOPT_CUSTOMREQUEST => "POST",
			  CURLOPT_POSTFIELDS => $data,
			  CURLOPT_HTTPHEADER => array(
			    "Content-Type: application/json"
			  ),
			));

			$response = curl_exec($curl);

			curl_close($curl);
			return json_decode($response,true);
		}
	}

?>