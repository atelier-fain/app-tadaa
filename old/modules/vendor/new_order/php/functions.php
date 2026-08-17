<?php
	
	// if($_SERVER['SERVER_NAME'] == 'vendor.chew.atelierfain.ro') {
	// 	$app_url = "https://vendor.chew.atelierfain.ro";
	// 	$cockpit_url = "https://api.chew.atelierfain.ro";
	// } elseif($_SERVER['SERVER_NAME'] == 'vendor.chew.biglittlefestival.com') {
	// 	$app_url = "https://vendor.chew.biglittlefestival.com";
	// 	$cockpit_url = "https://api.chew.biglittlefestival.com";
	// }

	$app_url = "https://app.tadaa.ro/modules/vendor/";
	$cockpit_url = "https://cockpit.tadaa.ro";

	$token_read = '9c5b720d607cd8046d8555186828bf';
	$token_write = '7f5968bc60c79d28b73801d449a17d';

	function post($url, $postVars = array()){
		$curl = curl_init();
		$json = json_encode($postVars);
	    curl_setopt_array($curl, array(
	      CURLOPT_URL => $url,
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
	    $response['response_code'] = curl_getinfo($curl, CURLINFO_HTTP_CODE);

	    curl_close($curl);
		return json_encode($response);
	}

	function qr_exists($link) {
		$arr =  array(
			'filter' => array(
				'link' => $link
			),
			'populate' => 1
		);
		$result = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/qr?token='.$GLOBALS['token_read'], $arr),true);

		$total = $result['total'];
		if ($total > 0) {
			return $result['entries'][0];
		} else {
			return false;
		}
	}

	function vendor_exists($id) {
		$arr =  array(
			'filter' => array(
				'_id' => $id
			)
		);
		$result = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendors?token='.$GLOBALS['token_read'], $arr),true);
		
		if ($result['total'] > 0) {
			return $result['entries'][0];
		} else {
			return false;
		}
	}

	function vendor_opened($id) {
		$arr =  array(
			'filter' => array(
				'_id' => $id,
				'opened' => true
			)
		);
		$result = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendors?token='.$GLOBALS['token_read'], $arr),true);
		
		if ($result['total'] > 0) {
			return true;
		} else {
			return false;
		}
	}

	function vendor_get() {
		$arr =  array(
			'filter' => array(
				'opened' => true
			),
			'sort' => array(
				'_o' => 1
			)
		);
		$vendors = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendors?token='.$GLOBALS['token_read'], $arr),true)['entries'];
		$result = array();

		foreach ($vendors as $key => $vendor) {
			if(!isset($result[$vendor['_id']])) {
				$result[$vendor['_id']] = array();
			}

			$result[$vendor['_id']] = $vendor;
		}

		return $result;
	}

	function products_get_available($id) {
		$arr =  array(
			'filter' => array(
				'vendor._id' => $id,
				'active' => true
			),
			'populate' => 1,
			'sort' => array(
				'_o' =>1
			)
		);

		$result = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_products?token='.$GLOBALS['token_read'], $arr),true)['entries'];
		$products = array();

		foreach ($result as $key => $product) {
			$products[$product['_id']] = $product;
		}

		return $products;

		
	}

	function products_get($id) {
		$arr =  array(
			'filter' => array(
				'vendor._id' => $id
			),
			'populate' => 1,
			'sort' => array(
				'_o' =>1
			)
		);

		$result = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_products?token='.$GLOBALS['token_read'], $arr),true)['entries'];
		$products = array();

		foreach ($result as $key => $product) {
			$products[$product['_id']] = $product;
		}

		return $products;

		
	}

	function product_get($id) {
		if(str_contains($id, "_")) {
			$id = explode("_", $id)[0];
		}
		$arr =  array(
			'filter' => array(
				'_id' => $id
			),
			'populate' => 1
		);

		return json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_products?token='.$GLOBALS['token_read'], $arr),true)['entries'][0];

		
	}

	function check_products_availibility($order){
		$products = products_get_available($order['vendor']);
		$unavailable = array();
		$unavailable_total = 0;

		if(is_array($order['products'])) {
      foreach ($order['products'] as $key => $op) {
			
				if(str_contains($key, "_")) {
					$opid = explode("_", $key)[0];
				} else {
					$opid = $key;
				}

				if(!array_key_exists($opid, $products)) {
					$unavailable_total++;
					$unavailable[$key] = $op;
				}
			}
    } 
		
    return array("total"=>$unavailable_total, "unavailable"=>$unavailable);
		
	}

	function save_order($order) {

		$arr1 =  array(
			'data' => array(
				'vendor' => $order['vendor'],
				'shortOrderCode' => $order['shortOrderCode'],
				'transactionId' => $order['transactionId'],
				'message' => $order['message'],
				'subtotal' => $order['subtotal'],
				'comments' => $order['comments'],
				'tip_percentage' => $order['tip']['percentage'],
				'tip_amount' => $order['tip']['amount'],
				'nominal_order_id' => get_next_nominal_id($order['vendor']),
				'paid' => true,
				'type' => 'card',
				'refunded' => false,
				'refunded_pg' => false,
				'status' => 'opened'
			)
		);

		if($order['prepaid']) {
			$arr1['data']['type'] = 'prepaid';
		}

		if(get_prop('vendors',$order['vendor'],'online_orders')){
			$arr1['data']['status'] = 'opened';
		} else {
			$arr1['data']['status'] = 'closed';
		}

		$db_order = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/save/vendor_orders?token='.$GLOBALS['token_write'], $arr1),true);

		$arr2 =  array(
			'data' => array()
		);

		if(is_array($order['products'])) {
			foreach ($order['products'] as $key => $product) {
				$product['user'] = $db_order['user'];
				$product['order'] = $db_order['_id'];
				$product['vendor'] = $order['vendor'];
				$product['product'] = $product['id'];
				$product['name'] = get_prop('vendor_products',$product['id'],'title');
				unset($product['id']);

				$arr2['data'][] = $product;
			}

			$db_order['products'] = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/save/vendor_order_items?token='.$GLOBALS['token_write'], $arr2),true);
		} else {
			$db_order['products'] = [];
		}

		return $db_order;
		
	}


	function order_exists($id) {
		$arr =  array(
			'filter' => array(
				'_id' => $id
			)
		);

		$total = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_orders?token='.$GLOBALS['token_read'], $arr),true)['total'];
		if ($total > 0) {
			return true;
		} else {
			return false;
		}
	}

	function netopia_order_exists($id) {
		$arr =  array(
			'filter' => array(
				'shortOrderCode' => $id
			)
		);

		$result = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_orders?token='.$GLOBALS['token_read'], $arr),true);

		$total = $result['total'];
		if ($total > 0) {
			return order_get($result['entries'][0]['_id']);
		} else {
			return false;
		}
	}

	function viva_order_exists($id) {
		$arr =  array(
			'filter' => array(
				'shortOrderCode' => $id
			)
		);

		$result = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_orders?token='.$GLOBALS['token_read'], $arr),true);

		$total = $result['total'];
		if ($total > 0) {
			return order_get($result['entries'][0]['_id']);
		} else {
			return false;
		}
	}


	function order_get($id) {
		$arr1 =  array(
			'filter' => array(
				'_id' => $id
			),
			'populate' => 1
		);

		$order = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_orders?token='.$GLOBALS['token_read'], $arr1),true)['entries'][0];

		$arr2 =  array(
			'filter' => array(
				'order' => $id
			),
			'populate' => 1
		);

		$order['products'] = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_order_items?token='.$GLOBALS['token_read'], $arr2),true)['entries'];

		return $order;
	}

	function get_next_nominal_id($vendor) {
		$arr =  array(
			'filter' => array(
				'vendor' => $vendor
			),
			'sort' => array(
				'nominal_order_id' => -1
			)
		);

		$response = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_orders?token='.$GLOBALS['token_read'], $arr),true);
		
		if ($response['total'] == 0) {
			return '1';
		} else {
			usort($response['entries'], fn($a, $b) => $a['nominal_order_id'] <=> $b['nominal_order_id']);
			$response['entries'] = array_reverse($response['entries']);
			$last_order_id = $response['entries'][0]['nominal_order_id'];
			$next_order_id = intval($last_order_id)+1;
			return $next_order_id;
		}
		
	}

	function order_mark_as_paid($order_id,$vendor,$netopia_order_id,$rcode,$resulttext){
		change_prop('vendor_orders',$order_id,'paid', true);
		change_prop('vendor_orders',$order_id,'netopia_order_id', $netopia_order_id);
		change_prop('vendor_orders',$order_id,'rcode', $rcode);
		change_prop('vendor_orders',$order_id,'resulttext', $resulttext);
		if(empty(get_prop('vendor_orders',$order_id,'nominal_order_id'))){
			change_prop('vendor_orders',$order_id,'nominal_order_id', get_next_nominal_id($vendor));
		}

		order_mark_duration(order_get($order_id));
	}

	function order_mark_as_unpaid($order_id,$netopia_order_id,$rcode,$resulttext){
		change_prop('vendor_orders',$order_id,'netopia_order_id', $netopia_order_id);
		change_prop('vendor_orders',$order_id,'rcode', $rcode);
		change_prop('vendor_orders',$order_id,'resulttext', $resulttext);
	}

	function order_mark_duration($order){
		if(empty(get_prop('vendor_orders',$order['_id'],'ready'))){
			change_prop('vendor_orders',$order['_id'],'ready', duration_estimate($order['products'],$order['vendor'])['timestamp']);
		}
	}

	function duration_estimate($products,$vendor) {
		//echo "<pre>";
		//print_r($products);
		$coef = 0.1;
		$db_products = products_get($vendor);
		$cart_duration = 0;
		$biggest_duration = 0;

		// print_r($products);
		// echo "--------------------------------------------------------------------------";
		//print_r($db_products);
		foreach ($products as $key => $product) {
			if (isset($product['id'])) {
				$product_id = $product['id'];
			} else {
				$product_id = $product['product'];
			}
			$product_duration = intval($db_products[$product_id]['duration']);
			$line_duration = $product_duration * $coef * ($product['qty'] - 1);
			if($product_duration > $biggest_duration){
				$biggest_duration = $product_duration;
			}
			$cart_duration += $line_duration;
		}

		$cart_duration +=$biggest_duration;

		$orders = get_vendor_opened_orders($vendor);
		$orders_duration = 0;
		foreach ($orders as $key => $order) {
			$remaining = $order['ready'] - time();
			if ($remaining < 0) {
				$remaining = 0;
			}

			$orders_duration += $remaining;
		}
		
		$min = round($cart_duration + $orders_duration/60);

		return array(
			'min' => $min,
			'timestamp' => time() + 60*$min
		);
	}



	function change_prop($collection,$entry_id,$prop_name, $prop_val) {
		$arr =  array(
			'data' => array(
				'_id' => $entry_id,
				$prop_name => $prop_val
			)
		);

		return json_decode(post($GLOBALS['cockpit_url'].'/api/collections/save/'.$collection.'?token='.$GLOBALS['token_write'], $arr),true);
	}



	function get_prop($collection,$entry_id,$prop_name) {
	    $arr =  array(
			'filter' => array(
				'_id' => $entry_id
			),
			'fields' => array(
				$prop_name => 1
			)
		);

		return json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/'.$collection.'?token='.$GLOBALS['token_read'], $arr),true)['entries'][0][$prop_name];
	}


	function generate_user_id() {
		return uniqid('blf',true);
	}

	function create_user(){
		$id = generate_user_id();
		setcookie('user', $id, time() + (86400 * 60), "/"); // 86400 = 1 day
		$_COOKIE['user'] = $id;
	}

	function get_vendor_opened_orders($id) {
		$arr1 =  array(
			'filter' => array(
				'vendor' => $id,
				'status' => 'opened',
				'paid' => true
			),
			'sort' => array(
				'_created' => -1
			),
			'populate' => 1
		);

		$orders = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_orders?token='.$GLOBALS['token_read'], $arr1),true)['entries'];

		$arr2 =  array(
			'filter' => array(
				'vendor' => $id
			),
			'populate' => 1
		);

		$order_items = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_order_items?token='.$GLOBALS['token_read'], $arr2),true)['entries'];

		$arr = array();

		foreach ($orders as $key => $order) {
			$arr[$order['_id']] = $order;

			$arr[$order['_id']]['products'] = array();
			foreach ($order_items as $key => $item) {
				if($order['_id'] == $item['order']) {
					$arr[$order['_id']]['products'][$item['_id']] = $item;
				}
			}
		}

		return $arr;
	}

	function get_user_orders($id) {
		$arr1 =  array(
			'filter' => array(
				'user' => $id,
				'paid' => true
			),
			'sort' => array(
				'_created' => -1
			),
			'populate' => 1
		);

		$orders = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_orders?token='.$GLOBALS['token_read'], $arr1),true)['entries'];

		$arr2 =  array(
			'filter' => array(
				'user' => $id
			),
			'populate' => 1
		);

		$order_items = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_order_items?token='.$GLOBALS['token_read'], $arr2),true)['entries'];

		$arr = array();

		foreach ($orders as $key => $order) {
			$arr[$order['_id']] = $order;

			$arr[$order['_id']]['products'] = array();
			foreach ($order_items as $key => $item) {
				if($order['_id'] == $item['order']) {
					$arr[$order['_id']]['products'][$item['_id']] = $item;
				}
			}
		}

		return $arr;
	}

	function format_price($price) {
		$price = explode(',', number_format($price / 100, 2, ',', ''));
		return $price[0].'<sup>'.$price[1].'</sup>';
	}

	function pluralize($quantity, $singular, $plural=null) {
	    if($quantity == 1){
	    	$result = $singular;
	    } else {
	    	$result = $plural;
	    }

	    return $result;
	}

	function json_validator($data) { 
    if (!empty($data)) { 
        return is_string($data) &&  
          is_array(json_decode($data, true)) ? true : false; 
    } 
    return false; 
  }











	
?>