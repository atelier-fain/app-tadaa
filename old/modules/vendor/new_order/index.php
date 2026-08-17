
<?php 
    include('../../../php/auth.php');

    



    $cart_version = 19;



    // unset($_COOKIE['cart']); 
    // setcookie('cart', '', -1, '/');

    if (!isset($_COOKIE['cart_version'])) {
        setcookie("cart_version", $cart_version, time() + (86400 * 300), "/");
        $_COOKIE['cart_version'] = $cart_version;
    } elseif($_COOKIE['cart_version'] != $cart_version) {
        setcookie("cart_version", $cart_version, time() + (86400 * 300), "/");
        $_COOKIE['cart_version'] = $cart_version;
        unset($_COOKIE['cart']); 
        setcookie('cart', '', -1, '/');
    }

    require_once('php/functions.php');
    if(!isset($user['link_vendor']['_id']) || !$vendor = vendor_exists($user['link_vendor']['_id'])) {
        header('location: /modules/');
        exit();
    } 
    // echo "<pre>";
    // print_r($user);

    if($vendor['value_only']) { 
        header('location: /modules/vendor/new_simple_order/');
        exit();
    }

    include('header.php');

    $bulk_products = array();
    $products = array();
    $vendor_id = $user['link_vendor']['_id'];

    // echo "<pre>";
    // print_r(products_get($vendor_id));

    foreach (products_get($vendor_id) as $key => $entry) {

        if(!isset($entry['category']['title']) || empty($entry['category']['title'])) {
            $entry['category']['title'] = "Toate produsele";
        }

        if(!isset($products[$entry['category']['title']])) {
            $products[$entry['category']['title']] = array();
        }

        
        if($entry['active']){
            $products[$entry['category']['title']][$entry['_id']] = $entry;
        }
        
        $bulk_products[$entry['_id']] = $entry;
    }

    $categories = array_keys($products);
    // if(isset($_GET['dev'])) {
    //         echo "<pre>";
    //         print_r($products);
    //     }
    
    if(isset($_COOKIE['cart']) && !json_validator($_COOKIE['cart'])){
        unset($_COOKIE['cart']); 
        setcookie('cart', '', -1, '/'); 
        $cart = false;
    }

    if (isset($_COOKIE['cart'])) {
        $cart = json_decode($_COOKIE['cart'],true);
    } else {
        $cart = false;
    }

    if (isset($cart[$vendor_id]) ) {
        $cart = $cart[$vendor_id];
    } else {
        $cart = false;
    }


    // echo "<pre>";
    // print_r($_COOKIE);
?>

<?php if(!$user['link_vendor']['opened']){?>
    <h3 style="text-align: center; margin-top: 50px;">Ai solicitat suspendarea comenzilor. </h3>
    <?php exit(); ?>
<?php } ?>
<script type="text/javascript">
    var vendor_id = "<?php echo $vendor_id;?>"; 
</script>
    
    
        <div class="bottom">
            <div class="categories">
                <span class="buton back tohome"><img src="/modules/vendor/new_order/img/arr.svg"></span>
                <!-- <span class="buton dark selected" category="all">Toate</span> -->
                <?php foreach ($categories as $key => $category) { ?>
                    <span class="buton dark" category="<?php echo $category;?>"><?php echo $category; ?></span>
                <?php } ?>
            </div>
        </div>
    </header>
    
    <div class="content">

        <div class="charge_card_festival_success">
            <h3 class="title">Plata în valoare de <strong class="amount"><span class="value"></span> lei</strong> a fost procesată cu succes.</h3>
            <h4>Credit rămas: <span class="balance"></span> lei</h4>
            <h4 id="nfcOutputSuccess" style="color: red;"></h4>
            <a href="/modules/vendor/new_order" class="buton dark selected" style="padding: 15px; width: 100%; margin-top: 30px;">Comandă nouă</a>
        </div>

        <div class="charge_card_bancar_success" <?php if(isset($_GET['status'])) { echo "style='display: flex;'";}?>>
            <?php if($_GET['status'] == 'success') { ?>
                <h3 class="title">Plata în valoare de <strong class="amount"><?php echo $_GET['amount']/100;?><span class="value"></span> lei</strong> a fost procesată cu succes.</h3>
                <a href="/modules/vendor/new_order" class="buton dark selected" style="padding: 15px; width: 100%; margin-top: 30px;">Comandă nouă</a>
                <a href="/modules/vendor/" class="buton dark " style="padding: 15px; width: 100%; margin-top: 30px;">Listă comenzi</a>
            <?php } else { ?>
                <h3 class="title" style="color: red;">Plată respinsă</h3>
                <h4 style="color: red;">Mesaj: <strong><?php echo $_GET['message'];?></strong></h4>
                
                <!-- <a class="buton dark selected" href="vivapayclient://pay/v1?appId=org.chromium.webpack.abe660f465bd92ffd_v2&action=sale&amount=<?php echo $_GET['amount'];?>&sourceCode=5428&callback=https://app.tadaa.ro/modules/vendor/new_order/&ISV_amount=0&ISV_clientId=f78qxghnmuj8sq11087ldvng42z630htfop5ow545dmi0.apps.vivapayments.com&ISV_clientSecret=2SiKYG6qP3x1FnQEdixD5qUDs8a77Q&ISV_sourceCode=3654&ISV_currencyCode=946&ISV_customerTrns=BigLittleFestival&clientTransactionId=<?php echo $user['user']?>&paymentMethod=CardPresent">Reîncearcă plata</a> -->
                <a class="buton" href="/modules/top_up/">Anulează plata</a>
            <?php } ?>
            
        </div>

        <div class="charge_card_festival">
            <h3 class="title">Apropie cardul de festival pentru plată</h3>
            <img src="/modules/vendor/new_order/img/loading.gif">
            <p style="font-size: 20px; color: red;" id="nfcOutput"></p>
        </div>

        <div class="payment_method">
            <h3 class="title">Selectează metoda de plată</h3>
            <div class="buttons">
                <div class="payment-method card_festival"><i class="fa fa-id-card-o" aria-hidden="true"></i></i>Card<br> de festival</div>
                <div class="payment-method card_bancar"><i class="fa fa-credit-card" aria-hidden="true"></i>Card<br> bancar</div>
            </div>
        </div>

        <div class="cart">
            <!-- <p class="title">Comanda mea</p> -->
            <?php if ($cart) { ?>
                <div class="list">
                    <?php 
                        $subtotal = 0;
                        foreach ($cart as $key => $cart_product) { 
                             
                            $product = $bulk_products[$cart_product['id']]; 
                            $line_price = $cart_product['price']*$cart_product['qty'];
                            $subtotal += $line_price;
                            $price = $cart_product['price'];

                            include('views/product-cart-item.php');
                        } 
                        $subtotal_arr = explode(',', number_format($subtotal / 100, 2, ',', ''));
                    ?>
                </div>
                <div class="details">
                    <div class="subtotal">
                        <p>Subtotal</p>
                        <p class="amount"><?php echo $subtotal_arr[0].'<sup>'.$subtotal_arr[1].'</sup>'; ?> RON</p>
                    </div>
                    <div class="tips">
                        <div class="top">
                            <p>Tips</p>
                            <p class="amount">0<sup>00</sup> RON</p>
                        </div>
                        <div class="bottom">
                            <span class="active" value="0">0%</span>
                            <span value="5">5%</span>
                            <span value="10">10%</span>
                            <span value="15">15%</span>
                        </div>
                    </div>
                    
                </div>
                <div class="total">
                    <p>Total</p>
                    <p class="amount"><?php echo $subtotal_arr[0].'<sup>'.$subtotal_arr[1].'</sup>'; ?> RON</p>
                </div>
                <div class="estimated">
                    <?php include('views/order_duration.php'); ?>
                </div>
                <textarea class="comments" placeholder="Preferințe"></textarea>
                
                <span class="buton dark selected submit_order" id="select_payment_method">Metodă de plată</span>
                <p class="vendor-closed">Din păcate ai decis să suspenzi comenzile noi.</p>
                
            <?php } else { ?>
                <div class="list"></div>
                <div class="details">
                    <div class="subtotal">
                        <p>Subtotal</p>
                        <p class="amount">0<sup>00</sup> RON</p>
                    </div>
                    <div class="tips">
                        <div class="top">
                            <p>Tips</p>
                            <p class="amount">0<sup>00</sup> RON</p>
                        </div>
                        <div class="bottom">
                            <span class="active" value="0">0%</span>
                            <span value="5">5%</span>
                            <span value="10">10%</span>
                            <span value="15">15%</span>
                        </div>
                    </div>
                </div>
                <div class="total">
                    <p>Total</p>
                    <p class="amount">0<sup>00</sup> RON</p>
                </div>
                <div class="estimated"></div>
                <textarea class="comments" placeholder="Preferințe"></textarea>
                <span class="buton dark selected submit_order" id="select_payment_method">Metodă de plată</span>         
                <p class="vendor-closed">Din păcate acest vânzător a decis să suspende comenzile noi. Te rugăm să apeși pe butonul de mai jos pentru o comandă nouă.</p>
                <p class="buton dark selected go-to-vendors">Vezi toți vanzatorii activi</p>
            <?php } ?>
        </div>



        <div class="categories" <?php if(isset($_GET['status'])) { echo "style='display: none;'";}?>>
            <div class="category selected" category="all">
                <!-- <p class="title">Toate</p> -->
                <div class="list">
                    <?php 
                        foreach ($products as $key1 => $categories) { 
                            foreach ($categories as $key2 => $product) { 
                           
                                $price = explode(',', number_format($product['price'] / 100, 2, ',', ''));
                                include('views/product-item.php');
                            }
                        } 
                    ?>
                </div>
            </div>

            <?php foreach ($products as $key1 => $category) { ?>
                <div class="category" category="<?php echo $key1;?>">
                    <!-- <p class="title"><?php echo $key1;?></p> -->
                    <div class="list">
                        <?php 
                            foreach ($category as $key2 => $product) { 
                                $price = explode(',', number_format($product['price'] / 100, 2, ',', ''));
                                include('views/product-item.php');
                            } 
                        ?>
                    </div>
                </div>
            <?php } ?>
        </div>
    </div>
    
    <div class="cart-button <?php if(is_array($cart) && count($cart)){ echo 'active';}?>">
        <span class="buton selected">Plasează comanda <span class="total"><?php if(is_array($cart) && count($cart)){ echo $subtotal_arr[0].'<sup>'.$subtotal_arr[1].'</sup> RON';}?></span></span>
    </div>
    
<?php 
    include('footer.php');
?>

<?php if(isset($_GET['status'])) { ?>
    <?php if($_GET['status'] == 'success') { ?>
        <script>
            
            if(cart['<?php echo $vendor_id; ?>'] == undefined){
                
            } else {
                shortOrderCode = "<?php echo $_GET['shortOrderCode']?>";
                transactionId = "<?php echo $_GET['transactionId']?>";
                paymentMessage = "<?php echo $_GET['message']?>";
                prepaidPayment = false;
                method = 'card';
                type = "charge";
                amount = <?php echo $_GET['amount']?>;

                submit_order();
            }
            


            
            // test();
            // async function test(){

            // const payload = {
            //       amount: amount,
            //       TDID: TDID,
            //       type: type,
            //       method: method,
            //       shortOrderCode: shortOrderCode,
            //       transactionId: transactionId
            //     };

            //     try {
            //       const chargeResponse = await fetch('/php/tag_charge.php', {
            //         method: 'POST',
            //         headers: {
            //           'Content-Type': 'application/json'
            //         },
            //         body: JSON.stringify(payload)
            //       });

            //       const result = await chargeResponse.json(); // Or `.text()` if not JSON

            //       if(result.response.errors){
            //         $('#nfcOutput').append("Charge error");
            //       } else {

            //         $('.success .amount .value').text(amount/100);
            //         $('.success .balance').text(result.response.balance/100);
            //         $('.top_up').removeClass('visible');
            //         $('.success').addClass('visible');
            //         //window.location.replace("/modules/top_up/success/?amount="+amount+'&balance='+result.response.balance);
            //       }
            //     } catch (err) {
            //       $('#nfcOutput').append(err);
            //     }
            // }
        </script>
    <?php } else { ?>

    <?php } ?>
<?php } ?>   