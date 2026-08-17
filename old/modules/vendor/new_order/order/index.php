<?php 
    include('../header.php');
    if(!isset($_GET['orderId']) || !$order = netopia_order_exists($_GET['orderId'])) {
        header('location: /');
        exit();
    }


    //$order = netopia_order_exists($_GET['orderId']);



    //$vendor = get_prop('orders',$_GET['id'],'vendor');
    //if payment response is true
    //order_mark_as_paid($_GET['id'],$vendor);

    //$order = order_get($_GET['id']);

    
    
    $subtotal = explode(',', number_format($order['subtotal'] / 100, 2, ',', ''));
    $tip = explode(',', number_format($order['tip_amount'] / 100, 2, ',', ''));
    $total = explode(',', number_format(($order['tip_amount']+$order['subtotal']) / 100, 2, ',', ''));

    
    // echo "<pre>";
    // print_r($order);
?>
    


        <div class="bottom">
        </div>
    </header>
    <div class="splash">
        <div class="inner">
            <img src="/img/logo1.svg">
            <p>Enabled by atelierfain.ro</p>
        </div>
    </div>
    <div class="order">
        <div class="content">
            
            <p class="title"><?php echo "Comanda #".get_prop('vendors',$order['vendor'],'prefix').$order['nominal_order_id'];?></p>

            <div class="ready-wr">
                <?php include('../views/order_status.php'); ?>
            </div>
            <div class="list">
                <?php foreach ($order['products'] as $key => $product) { ?>
                    <?php 
                        $line_price = $product['price']*$product['qty'];
                        $price = explode(',', number_format($line_price / 100, 2, ',', ''));
                        if (!isset($product['extras']) || !is_array($product['extras']) || count($product['extras']) == 0) {
                            $product['extras'] = false;
                        }
                    ?>
                    <div class="item">
                        <p class="qty">
                            <?php echo $product['qty'];?> &times;
                        </p>
                        <p class="title">
                            <?php echo $product['name'];?>
                            <?php if($product['extras']) { ?>
                                <span>
                                    <?php foreach ($product['extras'] as $key => $extra) { ?>
                                        <span><?php echo $extra['name'];?> (<?php echo format_price($extra['price']);?> RON)</span>
                                    <?php } ?>
                                </span>
                            <?php } ?>    
                        </p>
                        <p class="price"><?php echo $price[0].'<sup>'.$price[1].'</sup>';?> RON</p>
                    </div>
                <?php } ?>
            </div>
            <div class="list subtotal">
                <div class="item">
                    <p class="title">Subtotal</p>
                    <p class="price"><?php echo $subtotal[0].'<sup>'.$subtotal[1].'</sup>';?> RON</p>
                </div>
                <div class="item">
                    <p class="title">Tips (<?php echo $order['tip_percentage']?>%)</p>
                    <p class="price"><?php echo $tip[0].'<sup>'.$tip[1].'</sup>';?> RON</p>
                </div>
            </div>

            <div class="total">
                <p class="title">Total</p>
                <p class="price"><?php echo $total[0].'<sup>'.$total[1].'</sup>';?> RON</p>
            </div>
        </div>
    </div>
    <a class="buton img" href="/orders/"><img src="/img/arr-grey.svg"> Toate comenzile</a>
    <script type="text/javascript">var order = '<?php echo $order['_id'];?>'</script>

<?php 
    include('../footer.php');
?>

    