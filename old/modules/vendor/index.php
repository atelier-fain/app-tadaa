<?php 
    // $token_version = 4;

    // if (!isset($_COOKIE['token_version'])) {
    //     setcookie("token_version", $token_version, time() + (86400 * 300), "/");
    //     $_COOKIE['token_version'] = $token_version;
    // } elseif($_COOKIE['token_version'] != $token_version) {
    //     setcookie("token_version", $token_version, time() + (86400 * 300), "/");
    //     $_COOKIE['token_version'] = $token_version;
    //     unset($_COOKIE['token']); 
    //     setcookie('token', '', -1, '/');
    // }

    include('header.php');
    require_once('../../php/auth.php');
    require_once('php/functions.php');

    if(!isset($user['link_vendor']['_id'])){
        header('location: /login/');
        exit();
    }
    $vendor = vendor_exists($user['link_vendor']['_id']);
    // if(!isset($user['link_vendor']['_id']) || !$vendor = vendor_exists($user['link_vendor']['_id'])) {
    //     unset($_COOKIE['token']); 
    //     setcookie('token', '', -1, '/'); 
    //     header('location: /login/');
    //     exit();
    // }
    if($vendor['online_orders']) { 
        $order_cat = get_vendor_orders($vendor['_id']);
    } else {
        $orders_all = get_all_vendor_orders($vendor['_id']);
    }
    // echo "<pre>";
    // print_r(get_vendor_orders($vendor['_id']));

    $products = products_get($vendor['_id']);
 
?>  
    <script>
        console.log('Vendor obj');
        console.log(<?php echo json_encode($vendor); ?>);
        console.log('Orders obj');
        console.log(<?php if(isset($order_cat)){ echo json_encode($order_cat);} ?>);
        console.log('Orders obj');
        console.log(<?php if(isset($orders_all)){ echo json_encode($orders_all);} ?>);
    </script>

    <section class="top">
        <div class="vendor"><?php echo $vendor['name']; ?></div>
        <!-- <div class="view"> -->
            <!-- <div class="selected" list="true">Opened</div>
            <div list="false">Closed</div> -->
            
        <!-- </div> -->
        <?php if($vendor['online_orders']) { ?>
            <div class="status-buttons">
                <span class="buton selected" status="opened">În lucru</span>
                <span class="buton" status="ready">Finalizat</span>
                <span class="buton" status="closed">Închis</span>
            </div>
            <div class="action-buttons">
                <div class="settings">
                    <?php include('img/settings.svg');?>
                </div>
                <div class="sound">
                    <?php include('img/sound.svg');?>
                </div>
            </div>
        <?php } ?>

        
    </section>
    <section class="content">
        <?php if($vendor['online_orders']) { ?>
            <?php foreach ($order_cat as $key1 => $orders) { ?>
                <div class="list orders <?php echo $key1; ?>">
                    <?php foreach ($orders as $key2 => $order) { ?>
                        <?php include('views/list-item.php');?>
                    <?php } ?>
                </div>
            <?php } ?>
        <?php } else { ?>
            <div class="list orders opened">
                <?php foreach ($orders_all as $key2 => $order) { ?>
                    <?php include('views/list-item.php');?>
                <?php } ?>
            </div>
        <?php } ?>
        <?php if($vendor['online_orders']) { ?>
            <div class="list orders settings">
                <h2>Settings</h2>
                <div class="item header">
                        <div class="col-1 ">
                            <p>Produs</p>
                        </div>
                        <div class="col-2 ">
                            <p>Categorie</p>
                        </div>
                        <div class="col-3">
                            <p>Pret</p>
                        </div>
                        <div class="col-4 ">
                           <p>Activ</p>
                        </div>
                        <!-- <div class="col-5">
                           <p></p>
                        </div> -->
                        <div class="col-6 time">
                            <p>Timp de livrare</p>
                        </div>
                    </div>
                <?php foreach ($products as $key => $product) { ?>
                    <div class="item <?php if(!$product['active']){ echo "off"; }?>" product_id="<?php echo $product['_id'];?>">
                        <div class="col-1 ">
                            <p><?php echo $product['title'];?></p>
                        </div>
                        <div class="col-2 ">
                            <p><?php echo $product['category']['title'];?></p>
                        </div>
                        <div class="col-3">
                            <p><?php echo $product['price']/100 . " RON";?></p>
                        </div>
                        <div class="col-4 ">
                            <?php if($product['active']){?>
                                <div class="btn-group btn-toggle active" product_id="<?php echo $product['_id'];?>"> 
                                    <button class="btn btn-primary active">ON</button>
                                    <button class="btn btn-default">OFF</button>
                                </div>
                            <?php } else { ?>
                                <div class="btn-group btn-toggle active" product_id="<?php echo $product['_id'];?>"> 
                                    <button class="btn btn-default">ON</button>
                                    <button class="btn btn-primary active">OFF</button>
                                </div>
                            <?php } ?>
                        </div>
                        <!-- <div class="col-5">
                           
                        </div> -->
                        <div class="col-6 time">
                            <p class="nr"><span><?php echo $product['duration'];?></span> min</p>
                            <div class="buttons">
                                <span class="minus" duration="<?php echo $product['duration'];?>" product_id="<?php echo $product['_id'];?>"><img class="minus" src="/modules/vendor/img/minus.svg"></span>
                                <span class="plus" duration="<?php echo $product['duration'];?>" product_id="<?php echo $product['_id'];?>"><img src="/modules/vendor/img/plus.svg"></span>
                            </div>
                        </div>
                    </div>

                    <div class="item mobile <?php if(!$product['active']){ echo "off"; }?>" product_id="<?php echo $product['_id'];?>">
                        <div class="col-1 ">
                            <p><?php echo $product['title'];?></p>
                            <p>Categorie: <?php echo $product['category']['title'];?></p>
                            <p>Pret: <?php echo $product['price']/100 . " RON";?></p>
                        </div>
                        <div class="actions">
                            <div class="col-4 ">
                                <?php if($product['active']){?>
                                    <div class="btn-group btn-toggle active" product_id="<?php echo $product['_id'];?>"> 
                                        <button class="btn btn-primary active">ON</button>
                                        <button class="btn btn-default">OFF</button>
                                    </div>
                                <?php } else { ?>
                                    <div class="btn-group btn-toggle active" product_id="<?php echo $product['_id'];?>"> 
                                        <button class="btn btn-default">ON</button>
                                        <button class="btn btn-primary active">OFF</button>
                                    </div>
                                <?php } ?>
                            </div>
                            <!-- <div class="col-5">
                               
                            </div> -->
                            <div class="col-6 time">
                                <p class="nr"><span><?php echo $product['duration'];?></span> min</p>
                                <div class="buttons">
                                    <span class="minus" duration="<?php echo $product['duration'];?>" product_id="<?php echo $product['_id'];?>"><img class="minus" src="/modules/vendor/img/minus.svg"></span>
                                    <span class="plus" duration="<?php echo $product['duration'];?>" product_id="<?php echo $product['_id'];?>"><img src="/modules/vendor/img/plus.svg"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php } ?>
            </div>
        <?php } ?>
    </section>
    <?php if($vendor['value_only']) { ?>
        <a class="new-order-mobile" href="new_simple_order/"><i class="fa fa-plus-circle" aria-hidden="true"></i></a>
    <?php } else { ?>
        <a class="new-order-mobile" href="new_order/"><i class="fa fa-plus-circle" aria-hidden="true"></i></a>
    <?php } ?>
        <a class="back-home" href="/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>


    <audio controls id="ding">
        <source src="/modules/vendor/sounds/ding.mp3" type="audio/mpeg">
    </audio>
    <script type="text/javascript">
        var vendor = "<?php echo $vendor['_id'];?>";
        var vendor_online_orders = <?php echo $vendor['online_orders'] ? 'true' : 'false'; ?>;
        var vendor_value_only = <?php echo $vendor['value_only'] ? 'true' : 'false'; ?>;
        // console.log(vendor_online_orders);
    </script>
<?php 
    include('footer.php');
?>
    