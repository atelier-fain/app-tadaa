<?php
    

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once('../php/functions.php');
        $vendor_id = $_POST['vendor'];
        $cart = $_POST['cart'][$vendor_id];
    } 

    $min = duration_estimate($cart,$vendor_id)['min'];
?>

	<p class="text">Timp de asteptare estimat</p>
    <p class="time"><span><?php echo $min;?></span> min</p>