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

	
	$domain = "https://api.biglittlefestival.com";
	$token = "b9063c0f1226f74a53f9466f0726ad";
	
	class Cockpit {

		public function getEntries($collection,$filter = '{}') {
			global $domain;
			global $token;

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/collections/get/".$collection."?token=".$token,
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
			global $token;
			$filter = '{
		       "fields": {"'.strtoupper($_COOKIE['lang']).'": "1"}
		      }';

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/collections/get/traduceri?token=".$token,
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

		public function addEntries($collection,$entries) {
			global $domain;
			global $token;

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/collections/get/".$collection."?token=".$token,
			  CURLOPT_RETURNTRANSFER => true,
			  CURLOPT_ENCODING => "",
			  CURLOPT_MAXREDIRS => 10,
			  CURLOPT_TIMEOUT => 0,
			  CURLOPT_FOLLOWLOCATION => true,
			  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
			  CURLOPT_CUSTOMREQUEST => "POST",
			  CURLOPT_POSTFIELDS => $entries,
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
			global $token;

			$curl = curl_init();

			curl_setopt_array($curl, array(
			  CURLOPT_URL => $domain."/api/collections/get/".$collection."?token=".$token,
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