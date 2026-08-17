<?php
	
	if($_SERVER['SERVER_NAME'] == 'vendor.chew.atelierfain.ro') {
		$app_url = "https://vendor.chew.atelierfain.ro";
		$cockpit_url = "https://api.chew.atelierfain.ro";
	} elseif($_SERVER['SERVER_NAME'] == 'app.tadaa.ro') {
		$app_url = "https://app.tadaa.ro";
		$cockpit_url = "https://cockpit.tadaa.ro";
	}

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

	function vendor_exists($id) {
		$arr =  array(
			'filter' => array(
				'_id' => $id
			)
		);

		$response = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendors?token='.$GLOBALS['token_read'], $arr),true);
		$total = $response['total'];
		if ($total > 0) {
			return $response['entries'][0];
		} else {
			return false;
		}
	}

	function products_get($id) {
		$arr =  array(
			'filter' => array(
				'vendor._id' => $id
			),
			'populate' => 1
		);

		return json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_products?token='.$GLOBALS['token_read'], $arr),true)['entries'];

		
	}

	function product_get($id) {
		$arr =  array(
			'filter' => array(
				'_id' => $id
			),
			'populate' => 1
		);

		return json_decode(post($GLOBALS['cockpit_url'].'/api/collections/get/vendor_products?token='.$GLOBALS['token_read'], $arr),true)['entries'][0];

		
	}

	function save_order($order) {

		$arr1 =  array(
			'data' => array(
				'vendor' => $order['vendor'],
				'subtotal' => $order['subtotal'],
				'tip_percentage' => $order['tip']['percentage'],
				'tip_amount' => $order['tip']['amount'],
				'paid' => false,
				'status' => 'opened',
				'user' =>$_COOKIE['user']
			)
		);

		$db_order = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/save/vendor_orders?token='.$GLOBALS['token_write'], $arr1),true);

		$arr2 =  array(
			'data' => array()
		);

		foreach ($order['products'] as $key => $product) {
			$product['order'] = $db_order['_id'];
			$product['vendor'] = $order['vendor'];
			$product['product'] = $product['id'];
			$product['name'] = get_prop('products',$product['id'],'title');
			unset($product['id']);

			$arr2['data'][] = $product;
		}

		$db_order['products'] = json_decode(post($GLOBALS['cockpit_url'].'/api/collections/save/vendor_order_items?token='.$GLOBALS['token_write'], $arr2),true);
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

	function get_all_vendor_orders($id) {
		$arr1 =  array(
			'filter' => array(
				'vendor' => $id,
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

		$arr = [];

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

	function get_vendor_orders($id) {
		$arr1 =  array(
			'filter' => array(
				'vendor' => $id,
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

		$arr = array(
			"opened"=> array(),
			"ready"=> array(),
			"closed"=> array()
		);

		foreach ($orders as $key => $order) {
			$arr[$order['status']][$order['_id']] = $order;

			$arr[$order['status']][$order['_id']]['products'] = array();
			foreach ($order_items as $key => $item) {
				if($order['_id'] == $item['order']) {
					$arr[$order['status']][$order['_id']]['products'][$item['_id']] = $item;
				}
			}
		}

		return $arr;
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

	function get_vendor_ready_orders($id) {
		$arr1 =  array(
			'filter' => array(
				'vendor' => $id,
				'status' => 'ready',
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
			$last_order_id = $response['entries'][0]['nominal_order_id'];
			$next_order_id = intval($last_order_id)+1;
			return $next_order_id;
		}
		
	}

	function order_mark_as_paid($order_id,$vendor){
		change_prop('vendor_orders',$order_id,'paid', true);
		if(empty(get_prop('vendor_orders',$order_id,'nominal_order_id'))){
			change_prop('vendor_orders',$order_id,'nominal_order_id', get_next_nominal_id($vendor));

		}
	}

	function order_mark_duration($order){
		if(empty(get_prop('vendor_orders',$order['_id'],'ready'))){
			change_prop('vendor_orders',$order['_id'],'ready', duration_estimate($order['products'],$order['vendor'])['timestamp']);
		}
	}

	function duration_estimate($products,$vendor) {
		return array(
			'min' => 14,
			'timestamp' => time() + 60*14
		);
	}

	function time_increment($entry_id,$increment){
		$ready = intval(get_prop('vendor_orders',$entry_id,'ready'));
		$now = time();
		if($now < $ready) {
			$new_ready = $ready + $increment;
		} else {
			$new_ready = $now + $increment;
		}
		// return array(
		// 	"now"=>$now,
		// 	"ready"=>$ready,
		// 	"new_ready"=>$new_ready
		// );
		return change_prop('vendor_orders',$entry_id,'ready', $new_ready);
	}

	function product_duration_increment($entry_id,$increment){
		return change_prop('vendor_products',$entry_id,'duration', $increment);
	}

	function product_active($entry_id,$active){
		return change_prop('vendor_products',$entry_id,'active', $active);
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


















	
?>