<?php
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        require_once('../php/functions.php');
        // echo "<pre>";
        // print_r($_POST);
        $product = product_get($_POST['id']);
        $line_id = $_POST['lid'];
        if(!isset($_POST['extras'])) {
            $extras = [];
        } else {
            $extras = $_POST['extras'];
        }
        
        $vendor_id = $product['vendor']['_id'];
        $line_price = $_POST['price'];
        $price = $_POST['price'];
        $qty = '1';
    } else {
        $qty = $cart[$key]['qty'];
        $line_id = $key;
        $extras = $cart[$key]['extras'];

        // if(isset($cart[$product['_id']])){ 
        //     $qty = $cart[$product['_id']]['qty'];
        // } else { 
        //     $qty = '0'; 
        // }
    }

    if(count($extras) == 0){
        $extras = false;
    }

    // echo "<pre>";
    // print_r($extras);
    // foreach ($extras as $key => $extra) {
    //     echo $extra['name'];
    // }
?>
                    <div class="item product-<?php echo $line_id;?>">
                        <div class="right">
                            <div class="unavailable">
                                <img src="/modules/vendor/new_order/img/alert.svg">
                                <span>Acest produs nu mai este disponibil</span>
                            </div>
                            <div class="top">
                                <div class="left">
                                    <p class="title"><?php echo $product['title'];?></p>
                                    <?php if($extras) { ?>
                                        <div class="extras">
                                            <?php foreach ($extras as $key => $extra) { ?>
                                                <p><?php echo $extra['name'];?> (+<?php echo format_price($extra['price']);?> RON)</p>
                                            <?php } ?>
                                        </div>
                                    <?php } ?>
                                </div>
                                <img class="del" src="/modules/vendor/new_order/img/del.svg" product_id="<?php echo $line_id;?>" vendor_id="<?php echo $vendor_id;?>">
                            </div>
                            <div class="bottom">   
                                <div class="qty-selector">
                                    <img class="minus" src="/modules/vendor/new_order/img/minus.svg" product_id="<?php echo $line_id;?>" vendor_id="<?php echo $vendor_id;?>" product_price="<?php echo $price;?>">
                                    <span class="qty"><?php echo $qty; ?></span>
                                    <img class="plus" src="/modules/vendor/new_order/img/plus.svg" product_id="<?php echo $line_id;?>" vendor_id="<?php echo $vendor_id;?>" product_price="<?php echo $price;?>">
                                </div>
                                <p class="price" value="<?php echo $line_price;?>"><?php echo format_price($line_price);?> RON</p>
                            </div>
                        </div>
                    </div>