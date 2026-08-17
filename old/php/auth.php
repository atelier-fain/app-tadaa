<?php


	if((!isset($_COOKIE['token']) || empty($_COOKIE['token'])) && $_SERVER['SCRIPT_NAME'] != '/login/index.php') {
        header('location: /login/');
        exit();
    }

    if(isset($_COOKIE['token']) && !empty($_COOKIE['token'])) {
    	$curl = curl_init();

		curl_setopt_array($curl, array(
		  CURLOPT_URL => 'https://api.tadaa.ro/v1/user/get/',
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
		

		curl_close($curl);
		if($response['auth'] == false) {
			setcookie('token', '', [
			    'expires' => time() - 3600,          
			    'path' => '/',                            // Available across the entire domain
			    'domain' => $_SERVER['SERVER_NAME'],     // The leading dot allows access on subdomains
			    'secure' => true
			]);
			//header('location: login/');
		} else {
			$user = $response['user'];

			if(str_contains($_SERVER['SCRIPT_NAME'], '/access/')){
				$module = 'access';
			} elseif(str_contains($_SERVER['SCRIPT_NAME'], '/access_byd/')){
				$module = 'access_byd';
			} elseif(str_contains($_SERVER['SCRIPT_NAME'], '/access_proedus/')){
				$module = 'access_proedus';
			} elseif(str_contains($_SERVER['SCRIPT_NAME'], '/top_up/')){
				$module = 'top_up';
			} elseif(str_contains($_SERVER['SCRIPT_NAME'], '/add_tag/')){
				$module = 'add_tag';
			} elseif(str_contains($_SERVER['SCRIPT_NAME'], '/report/')){
				$module = 'report';
			} elseif(str_contains($_SERVER['SCRIPT_NAME'], '/tickets/')){
				$module = 'tickets';
			} elseif(str_contains($_SERVER['SCRIPT_NAME'], '/vendor/')){
				$module = 'vendor';
				if(str_contains($_SERVER['SCRIPT_NAME'], '/vendor/new_order/')){
					$module_sufix = '_new_order';
				}
			} else {
				$module = 'app';
			}

			if($module != 'app' && !$user[$module]){
				//header('location: /');
			}

			// echo "<pre>";
			// print_r($user);
		}
    } 
	
?>