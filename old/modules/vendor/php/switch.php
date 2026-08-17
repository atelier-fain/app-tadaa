<?php

  
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  	include('../vendor/cockpit.class/cockpit.class.php');
  	$cockpit = new Cockpit();

    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: POST");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

    $success = true;

  	if (isset($_POST['interval'])) {

  		$filter = '{
			"filter":{
				"_id" : "'.$_POST['interval'].'"
			}
		}';

  		if($cockpit->getEntries('intervals',$filter)['entries'][0]['end'] == 0) {
  			$edit_json = '{
				"data": {
					"_id" : "'.$_POST['interval'].'",
					"end" : "'.time().'"
				}
			}';


			if($cockpit->addEntries('intervals',$edit_json)['_id'] != $_POST['interval']){
				 $success = false;
			}
  		}
  	}

  	if (isset($_POST['project'])) {
  		$add_json = '{
				"data": {
					"start" : "'.time().'",
					"project": {
					    "_id": "'.$_POST['project'].'",
					    "link": "projects"
					}
				}
			}';

		if($cockpit->addEntries('intervals',$add_json)['project']['_id'] != $_POST['project']){
			$success = false;
		}
	}	
  
    if ($success) {
		print_r(json_encode(array("success"=>"true")));
	} else {
		print_r(json_encode(array("success"=>"false")));
	}  
}

?>