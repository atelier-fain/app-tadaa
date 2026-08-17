<?php 
    include('../header.php');

    $orders = get_user_orders($_COOKIE['user']);
    $vendors = vendors_get();


?>
    


        <div class="bottom">
        </div>
        <!-- <div class="splash">
            <div class="inner">
                <img src="/img/logo1.svg">
                <p>Enabled by atelierfain.ro</p>
            </div>
        </div> -->
    </header>
    <div class="content">
        <div class="orders list">
            <div class="top">
                <p class="title">Comenzi</p>
            </div>
            <div class="list">
                <?php if(count($orders) < 1){ ?>
                    <p class="no-orders">Nu exista comenzi.</p>
                <?php } ?>
                <?php foreach ($orders as $key => $order) { ?>
                    <?php
                        $count = 0;
                        foreach ($order['products'] as $key => $product) {
                            $count += $product['qty'];
                        }
                    ?>
                    <a href="<?php echo $app_url.'/order?orderId='.$order['netopia_order_id']?>" class="item">
                        <div class="top">
                            <p class="t-vendor"><?php echo $vendors[$order['vendor']]['name'];?></p>
                            <p class="t-order">#<?php echo $vendors[$order['vendor']]['prefix'].$order['nominal_order_id'];?></p>
                        </div>
                        <div class="bottom">
                            <p class="t-products"><?php echo $count; ?> produse</p>
                            <p class="t-price"><?php echo format_price($order['subtotal']+$order['tip_amount']);?> RON</p>
                        </div>
                    </a>
                <?php } ?>
                
                
            </div>
            <a class="buton img" href="/all-vendors/"><img src="/img/arr-grey.svg"> Toate restaurantele</a>
            
        </div>
    </div>
    

<?php 
    include('../footer.php');
?>   