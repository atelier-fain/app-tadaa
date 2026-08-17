<?php
	header('Content-Type: application/json');
	
	setcookie('token', '', [
	    'expires' => time() - 3600,          
	    'path' => '/',                            // Available across the entire domain
	    'domain' => $_SERVER['SERVER_NAME'],     // The leading dot allows access on subdomains
	    'secure' => true
	]);
	
	

	echo json_encode(["auth" => false]);
	
?>