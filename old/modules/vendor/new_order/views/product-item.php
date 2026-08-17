<?php
    if(!isset($product['extras']) || !is_array($product['extras']) || count($product['extras']) == 0){
        $product['extras'] = false;
    }

?>
                            <div class="item product-<?php echo $product['_id'];?> <?php if($product['extras']) { echo "with-extras"; } ?>" >
                                <!-- <div class="img">
                                    <img src="<?php echo $cockpit_url.'/storage/uploads'.$product['image']['path']; ?>">
                                </div> -->
                                <div class="info">
                                    <div class="left">
                                        <p class="title"><?php echo $product['title'];?></p>
                                        <span class="close-extras">&times;</span>
                                        <!-- <p class="description"><?php echo $product['description'];?></p> -->
                                    </div>
                                    <!-- <div class="right">
                                        <p class="weight"><?php echo $product['weight_or_volume'];?></p>
                                    </div> -->
                                </div>
                                <?php if($product['extras']) { ?>
                                    <form class="extras">
                                        <?php 
                                        // echo "<pre>";
                                        // print_r($product['extras']);
                                        ?>
                                        <?php foreach ($product['extras'] as $key1 => $extra_category) { ?>
                                            
                                            <?php 
                                                // echo "<pre>";
                                                // print_r($extra_category['value']);
                                            ?>
                                            <div class="extras-cat">
                                                <p class="title">
                                                    <?php echo $extra_category['value']['title']; ?> 
                                                    <?php 
                                                        //if($extra_category['value']['selections'] > 1) { 
                                                            echo " <span>(maxim ".$extra_category['value']['selections']." ".pluralize($extra_category['value']['selections'], 'selecție','selecții').")</span>";
                                                        //}
                                                    ?>  
                                                </p>
                                                <div class="extras-items" selections="<?php echo $extra_category['value']['selections']?>">
                                                    <?php foreach ($extra_category['value']['items'] as $key2 => $item) { ?>
                                                    <?php 
                                                        if(!isset($item['value']['price'])) {
                                                            $item['value']['price'] = 0;
                                                        }

                                                        if(!isset($extra_category['value']['accept_no_selection'])) {
                                                            $extra_category['value']['accept_no_selection'] = false;
                                                        }
                                                    ?>
                                                    <label class="extras-item" >
                                                        
                                                        <div class="left">
                                                            <?php 
                                                            
                                                                if($extra_category['value']['accept_no_selection']) {
                                                                    $type = 'checkbox';
                                                                } else {
                                                                    if($extra_category['value']['selections'] == 1) {
                                                                        $type = 'radio';
                                                                    } else {
                                                                        $type = 'checkbox';
                                                                    }
                                                                }
                                                            ?>
                                                            
                                                            <?php if($type == 'checkbox') { ?>
                                                                <input 
                                                                price="<?php echo $item['value']['price'];?>" 
                                                                product_price = <?php echo $product['price'];?>
                                                                type="checkbox" 
                                                                cat="<?php echo $extra_category['value']['title']; ?>" 
                                                                item="<?php echo $item['value']['title'];?>"  
                                                                name="<?php echo strtolower(str_replace(' ', "_", $extra_category['value']['title'])); ?>" >
                                                                <span class="checkbox"></span>
                                                            <?php } else { ?>
                                                                
                                                                <input 
                                                                price="<?php echo $item['value']['price'];?>" 
                                                                product_price = <?php echo $product['price'];?>
                                                                type="radio" 
                                                                cat="<?php echo $extra_category['value']['title']; ?>" 
                                                                item="<?php echo $item['value']['title'];?>"  
                                                                name="<?php echo strtolower(str_replace(' ', "_", $extra_category['value']['title'])); ?>" 
                                                                <?php if($key2 == 0){ echo 'checked="checked"';}?>>
                                                                <span class="radio"></span>
                                                            <?php } ?>
                                                            
                                                            <span class="title"><?php echo $item['value']['title'];?></span>
                                                        </div>
                                                        <div class="right">
                                                            <span class="price">+ <?php echo format_price($item['value']['price']);?> RON</span>
                                                        </div>
                                                        
                                                    </label>
                                                        <?php 
                                                        // echo "<pre>";
                                                        // print_r($item);
                                                        ?>
                                                    <?php } ?> 
                                                </div>
                                            </div>
                                            
                                        <?php } ?>
                                    </form>
                                <?php } ?>
                                <div class="actions <?php if(isset($cart[$product['_id']])){ echo 'added';}?>">
                                    <div class="left">
                                        <p class="price"><?php echo $price[0].'<sup>'.$price[1].'</sup>';?> RON</p>
                                    </div>
                                    <?php if($product['extras']) { ?>
                                        <div class="right-extras">
                                            <span class="show-extras">
                                                <i class="fa fa-bars" aria-hidden="true"></i>
                                            </span>
                                            <span class="buton dark selected add-to-cart-extras" product_id="<?php echo $product['_id'];?>" product_price="<?php echo $product['price'];?>" vendor_id="<?php echo $vendor_id;?>">Adaugă la comandă</span>
                                        </div>
                                    <?php } else { ?>
                                        <div class="right <?php if(isset($cart[$product['_id']])){ echo 'added';}?>">
                                            <span class="add-to-cart" product_id="<?php echo $product['_id'];?>" product_price="<?php echo $product['price'];?>" vendor_id="<?php echo $vendor_id;?>"></span>
                                            <div class="qty-selector">
                                                <img class="minus" src="/modules/vendor/new_order/img/minus.svg" product_id="<?php echo $product['_id'];?>" vendor_id="<?php echo $vendor_id;?>" product_price="<?php echo $product['price'];?>">
                                                <span class="qty"><?php if(isset($cart[$product['_id']])){ echo $cart[$product['_id']]['qty'];} else { echo '0'; }?></span>
                                                <img class="plus" src="/modules/vendor/new_order/img/plus.svg" product_id="<?php echo $product['_id'];?>" vendor_id="<?php echo $vendor_id;?>" product_price="<?php echo $product['price'];?>">
                                            </div>
                                        </div>
                                    <?php } ?>
                                    
                                </div>
                            </div>