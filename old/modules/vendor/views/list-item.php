<?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once('../php/functions.php');
        $order = order_get($_POST['id']);
        $vendor = vendor_exists($order['vendor']);
    } else {
        
    }
    $time = round(($order['ready']-time())/60);
    if($time < 0) {
        $time = 0;
    }
?>

<div class="item order-<?php echo $order['_id']; ?> status-<?php echo $order['status']; ?> <?php if($order['refunded']){ echo 'refunded';} ?> <?php if($order['refunded_pg']){ echo 'confirmed';} ?> <?php if($order['type'] != 'online') { echo 'not-online';}?>" ready="<?php echo $order['ready']; ?>" created="<?php echo $order['_created']; ?>" order_id="<?php echo $order['_id']; ?>">
    <?php if($vendor['online_orders']) { ?>
        <?php if($order['type'] == 'online') { ?>
            <div class="color"></div>
        <?php } ?>
    <?php } ?>

    <!-- <div class="col-1 ">
        
    </div> -->
    
    <div class="col-2 products">
        <p><strong>Comanda: <?php echo '#'.$vendor['prefix'].$order['nominal_order_id']; ?></strong></p>
        <?php foreach ($order['products'] as $key3 => $product) { ?>
            <p><span><?php echo $product['qty']?>&times; </span><?php echo $product['name']?>
            <?php 
                if (isset($product['extras']) && !empty($product['extras']) && count($product['extras']) > 0) {
                    echo "<span class='extras'>";
                    foreach ($product['extras'] as $key => $extra) {
                        $p = $extra['price']/100;
                        echo "<span>".$extra['name']." (".$p." RON)</span>";
                    }
                    echo "</span>";
                }
            ?>
            </p>
        <?php } ?>
    </div>
    <div class="col-3 comments">
        <p><?php echo $order['comments']; ?></p>
    </div>
    <div class="col-4 details">
        <!-- <p>Subtotal: <?php echo $order['subtotal']/100; ?> RON</p>
        <p>Tips: <?php echo $order['tip_amount']/100; ?> RON</p> -->
        <p>Total: <?php echo ($order['subtotal']+$order['tip_amount'])/100; ?> RON</p>
    </div>
    <?php if($vendor['online_orders']) { ?>
        <?php if($order['status'] == 'opened') { ?>
            <div class="col-6 time">
            <?php if($order['type'] == 'online') { ?>
                
                    <p class="nr"><span><?php echo $time; ?></span> min</p>
                    <div class="buttons">
                        <span class="minus" order_id="<?php echo $order['_id'];?>"><img class="minus" src="/modules/vendor/img/minus.svg"></span>
                        <span class="plus" order_id="<?php echo $order['_id'];?>"><img src="/modules/vendor/img/plus.svg"></span>
                    </div>
                
            <?php } ?>
            </div>
            <div class="col-5 actions">
                <span class="buton mark-ready" order_id="<?php echo $order['_id'];?>">Finalizat</span>
                <span class="buton undo" order_id="<?php echo $order['_id'];?>">Anulează</span>
            </div>
        <?php } elseif($order['status'] == 'ready'){ ?>
            <div class="col-5 actions">
                <span class="buton mark-closed" order_id="<?php echo $order['_id'];?>">Închide</span>
                <span class="buton undo" order_id="<?php echo $order['_id'];?>">Anulează</span>
            </div>
        <?php } elseif($order['status'] == 'closed'){ ?>
            <div class="col-4 day">
                <p><?php echo date('d.m.Y H:i', $order['_created']);?></p>
            </div>
            <!-- <div class="col-5 actions">
                <span class="buton mark-refunded" order_id="<?php echo $order['_id'];?>">Refund</span>
                <span class="buton undo" order_id="<?php echo $order['_id'];?>">Anulează</span>
                <p class="refund-pending">Refund pending</p>
                <p class="refund-confirmed">Refund confirmed</p>
            </div> -->
        <?php } ?>
    <?php } ?>

    
</div>


<div class="item mobile <?php if(!$vendor['online_orders']) { echo 'simple';} ?> order-<?php echo $order['_id']; ?> status-<?php echo $order['status']; ?> <?php if($order['refunded']){ echo 'refunded';} ?> <?php if($order['refunded_pg']){ echo 'confirmed';} ?> <?php if($order['type'] != 'online') { echo 'not-online';}?>" ready="<?php echo $order['ready']; ?>" created="<?php echo $order['_created']; ?>" order_id="<?php echo $order['_id']; ?>">
    <?php if($vendor['online_orders']) { ?>
        <?php if($order['type'] == 'online') { ?>
            <div class="color"></div>
        <?php } ?>
    <?php } ?>

    <!-- <div class="col-1 ">
    </div> -->
    
    <div class="col-2 products ">
        <div>
            <p><strong><?php echo '#'.$vendor['prefix'].str_pad($order['nominal_order_id'], 4, "0", STR_PAD_LEFT); ?></strong></p>
            <?php foreach ($order['products'] as $key3 => $product) { ?>
                <p><span><?php echo $product['qty']?>&times; </span><?php echo $product['name']?>
                <?php 
                    if (isset($product['extras']) && !empty($product['extras']) && count($product['extras']) > 0) {
                        echo "<span class='extras'>";
                        foreach ($product['extras'] as $key => $extra) {
                            $p = $extra['price']/100;
                            echo "<span>".$extra['name']." (".$p." RON)</span>";
                        }
                        echo "</span>";
                    }
                ?>
                </p>
            <?php } ?>
        </div>
        <div class="details">
            <!-- <p>Subtotal: <?php echo $order['subtotal']/100; ?> RON</p>
            <p>Tips: <?php echo $order['tip_amount']/100; ?> RON</p> -->
            <h4>Total: <span><?php echo ($order['subtotal']+$order['tip_amount'])/100; ?> RON</span></h4>
        </div>
    </div>
    
    
    <?php if($vendor['online_orders']) { ?>
        <?php if($order['status'] == 'opened') { ?>
            <div class="actions-wr">
                <div class="col-6 time">
                    <?php if($order['type'] == 'online') { ?>
                        <p class="nr"><span><?php echo $time; ?></span> min</p>
                        <div class="buttons">
                            <span class="minus" order_id="<?php echo $order['_id'];?>"><img class="minus" src="/modules/vendor/img/minus.svg"></span>
                            <span class="plus" order_id="<?php echo $order['_id'];?>"><img src="/modules/vendor/img/plus.svg"></span>
                        </div>
                    <?php } ?>
                </div>
                <div class="col-5 actions">
                    <span class="buton mark-ready" order_id="<?php echo $order['_id'];?>">Finalizat</span>
                    <span class="buton undo" order_id="<?php echo $order['_id'];?>">Anulează</span>
                </div>
            </div>
        <?php } elseif($order['status'] == 'ready'){ ?>
            <div class="col-5 actions">
                <span class="buton mark-closed" order_id="<?php echo $order['_id'];?>">Închide</span>
                <span class="buton undo" order_id="<?php echo $order['_id'];?>">Anulează</span>
            </div>
        <?php } elseif($order['status'] == 'closed'){ ?>
            <div class="col-4 day">
                <p><?php echo date('d.m.Y', $order['_created']);?></p>
            </div>
            <div class="col-5 actions">
                <!-- <span class="buton mark-refunded" order_id="<?php echo $order['_id'];?>">Refund</span> -->
                <span class="buton undo" order_id="<?php echo $order['_id'];?>">Anulează</span>
                <p class="refund-pending">Refund pending</p>
                <p class="refund-confirmed">Refund confirmed</p>
            </div>
        <?php } ?>
    <?php } ?>
    <?php if(!empty($order['comments'])) { ?>
        <div class="comments">
            <p>Preferinte: <?php echo $order['comments']; ?></p>
        </div>
    <?php } ?>
    

    
</div>


