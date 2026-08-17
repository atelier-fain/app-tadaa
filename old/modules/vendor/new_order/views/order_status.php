<?php

	if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once('../php/functions.php');
        $order_id = $_POST['order'];
    } else {
    	$order_id = $order['_id'];
    }
	$timestamp = get_prop('orders',$order_id,'ready');
	$min = round(($timestamp - time())/60);
	if($min < 1) {
		$min = 0;
	}

	$status = get_prop('orders',$order_id,'status');
	// echo $status;
?>

<?php if($status == 'opened') { ?>
	<?php if($min < 1) { ?>
		<div class="ready">
			<p class="text">În lucru</p>
	        <div>
	            <p class="estimated">Comanda ta va fi gata în cel mai scurt timp.</p>
	        </div>
	    </div>
	<?php } else { ?>
		<div class="ready">
			<p class="text">În lucru</p>
	        <div>
	            <p class="time"><span><?php echo $min; ?></span> min</p>
	            <p class="estimated">estimat</p>
	        </div>
	    </div>
	<?php }?>
<?php } elseif ($status == 'ready') { ?>
	<div class="ready green">
		<p class="text">Poți ridica acum comanda</p>
	    <div>
	        <p class="estimated">Arată acest ecran vânzătorului pentru a ridica comanda.</p>
	    </div>
	</div>
<?php } elseif ($status == 'closed') { ?>
	<div class="ready grey">
		<p class="text">Comanda a fost ridicata.</p>
	    
	</div>
<?php }?>

				