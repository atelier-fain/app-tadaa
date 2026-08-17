<?php 
    include('../../../php/auth.php');
    include('../../../header.php');
    include('php/functions.php');

    //print_r($user);

    if(!isset($user['link_vendor']['_id']) || !$vendor = vendor_exists($user['link_vendor']['_id'])) {
        header('location: /modules/');
        exit();
    }

    if(!$vendor['value_only']) { 
        header('location: /modules/vendor/new_order/');
        exit();
    }


?>  
    
    <div class="screens">
        

        <div class="screen select_other_amount <?php if(!isset($_GET['status'])) { echo 'visible';} ?>">
            <a class="back" href="/modules/vendor/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Introdu suma </p>
            <div class="other_amount_input">
                <input type="text" id="other_amount" inputmode="numeric" pattern="[0-9]*" autocomplete="off" >
                <span> lei</span>
            </div>
            <span class="other_amount_submit">METODĂ DE PLATĂ</span>
        </div>

        <div class="screen payment_method">
            <a class="back" href="/modules/vendor/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Selectează metoda de plată pentru <span class="amount"><span class="value">0</span> lei</span></p>
            <div class="list">
                <div class="item cash" type="cash"><i class="fa fa-id-card-o" aria-hidden="true"></i>Card<br> de festival</div>
                <div class="item card" type="card"><i class="fa fa-credit-card" aria-hidden="true"></i>Card<br> bancar</div>
            </div>
        </div>

        <div class="screen top_up ">
            <a class="back" href="/modules/vendor/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Apropie <strong>cardul de festival</strong> pentru plata în valoare de <span class="amount"><span class="value"></span> lei</span>.</p>
            <p id="nfcOutput"></p>
        </div>
        <div class="screen charge_card_bancar_success <?php if(isset($_GET['status']) && $_GET['status'] == 'success') { echo "status_success";}?>" <?php if(isset($_GET['status'])) { echo "style='display: flex;'";}?>>
            <?php if($_GET['status'] == 'success') { ?>
                <h3 class="title">Plata în valoare de <br><strong class="amount"><?php echo $_GET['amount']/100;?><span class="value"></span> lei</strong> a fost procesată cu succes.</h3>
                <a href="/modules/vendor/new_order" class="buton dark selected" style="padding: 15px; width: 100%; margin-top: 30px;">Comandă nouă</a>
                <a href="/modules/vendor/" class="buton dark " style="padding: 15px; width: 100%; margin-top: 30px;">Listă comenzi</a>
            <?php } else { ?>
                <h3 class="title" style="color: red;">Plată respinsă</h3>
                <h4 style="color: red;">Mesaj: <strong><?php echo $_GET['message'];?></strong></h4>
                <!-- <a class="buton dark selected" style="background: #666; color: #fff; margin-bottom: 20px; margin-top: 40px"  href="vivapayclient://pay/v1?appId=org.chromium.webpack.abe660f465bd92ffd_v2&action=sale&amount=<?php echo $_GET['amount']?>&callback=https://app.tadaa.ro/modules/vendor/new_order/">Reîncearcă plata</a> -->
                <a class="buton" href="/modules/vendor/" style="background: #666; color: #fff;">Anulează plata</a>
            <?php } ?>
            
        </div>
        <div class="screen success">
            <p class="title">Plată efectuată</p>
            <h4 class="subtitle">Plata în valoare de <strong class="amount"><span class="value"></span> lei </strong>a fost procesată cu succes.</h4>
            <h4>Credit rămas:</h4>
            <p class="title" style="margin-top: 0"><strong class="balance"></strong> lei</p>
            <a class="buton" href="/modules/vendor/">Listă comenzi</a>
            <a class="buton" href="/modules/vendor/new_simple_order/">Comandă nouă</a>
        </div>

    </div>
    <script type="text/javascript">
        var username = "<?php echo $user['user'];?>";
        var vendor = <?php echo json_encode($vendor);?>;
    </script>
<?php 
    include('../../../footer.php');
    if(isset($_GET['status']) && $_GET['status'] == 'success') {
?>
    <script>
        shortOrderCode = "<?php echo $_GET['shortOrderCode']?>";
        transactionId = "<?php echo $_GET['transactionId']?>";
        paymentMessage = "<?php echo $_GET['message']?>";
        prepaidPayment = false;
        method = 'card';
        type = "card";
        amount = <?php echo $_GET['amount']?>;

        submit_order();

    </script>
<?php
    }
?>   