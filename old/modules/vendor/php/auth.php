<?php
    if($_SERVER['SERVER_NAME'] == 'vendor.chew.atelierfain.ro') {
        $app_url = "https://vendor.chew.atelierfain.ro";
        $cockpit_url = "https://api.chew.atelierfain.ro";
    } elseif($_SERVER['SERVER_NAME'] == 'vendor.chew.biglittlefestival.com') {
        $app_url = "https://vendor.chew.biglittlefestival.com";
        $cockpit_url = "https://api.chew.biglittlefestival.com";
    }
    // $login = false;
	// if(isset($_COOKIE['token']) && !empty($_COOKIE['token'])) {
        
    //     $token = json_decode(base64_decode($_COOKIE['token']),true);

    //     if (isset($token['_id']) && !empty($token['_id'])) {
            
            
    //         $curl = curl_init();

    //         curl_setopt_array($curl, array(
    //           CURLOPT_URL => $GLOBALS['cockpit_url'].'/api/collections/get/vendors?token=793a33de041946f92512469dfbc965',
    //           CURLOPT_RETURNTRANSFER => true,
    //           CURLOPT_ENCODING => '',
    //           CURLOPT_MAXREDIRS => 10,
    //           CURLOPT_TIMEOUT => 0,
    //           CURLOPT_FOLLOWLOCATION => true,
    //           CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    //           CURLOPT_CUSTOMREQUEST => 'POST',
    //           CURLOPT_POSTFIELDS =>'{
    //             "filter": {
    //                 "username": "'.$token['username'].'"
    //             }
    //         }',
    //           CURLOPT_HTTPHEADER => array(
    //             'Content-Type: application/json'
    //           ),
    //         ));

    //         $response = json_decode(curl_exec($curl),true);

    //         curl_close($curl);

    //         if($response['total'] > 0) {
    //             $login = true;

    //             if($token['_id'] == 'b3adaa926535398481000166') {
    //                 $user_type = 'admin';
    //             } else {
    //                 $user_type = 'user';
    //             }

    //             if(!isset($_GET['id']) && $token['_id'] == $response['entries'][0]['_id']) {
    //                 header('location: /?id='.$token['_id']);
    //             }

    //         } 
    //     }
    // }

    // if(!$login) {
    //     header('location: /login/');
    // }
?>