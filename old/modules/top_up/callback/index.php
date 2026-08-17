<?php 
    include('../../../php/auth.php');
    include('../../../header.php');
    // $failed = [
    //     'status' => 'fail',
    //     'message' => 'USER_CANCEL',
    //     'amount' => 7000
    // ];
?>  
    
    <div class="screens">
        <div class="screen callback visible <?php if($_GET['status'] != 'success') { echo 'failed';} ?>">
            <?php 
                //echo "<pre>";
                // print_r($_GET);
                //echo http_build_query($_GET);
            ?>

            <?php if($_GET['status'] == 'success') { ?>
                <h2>Payment successful</h2>
                <h4>Your payment for <strong><?php echo $_GET['amount']/100;?> lei was successful.</strong></h4>
                <a class="buton" href="/modules/top_up/?<?php echo http_build_query($_GET);?>">Top-Up card</a>
            <?php } else { ?>
                <h2>Payment failed</h2>
                <?php if(isset($_GET['message'])) {?>
                    <h4>Reason: <strong><?php echo $_GET['message'];?></strong></h4>
                <?php } ?>
                <!-- <a class="buton" href="vivapayclient://pay/v1?appId=org.chromium.webpack.abe660f465bd92ffd_v2&action=sale&amount=<?php echo $_GET['amount'];?>&sourceCode=5428&callback=https://app.tadaa.ro/modules/top_up/callback/&ISV_amount=0&ISV_clientId=f78qxghnmuj8sq11087ldvng42z630htfop5ow545dmi0.apps.vivapayments.com&ISV_clientSecret=2SiKYG6qP3x1FnQEdixD5qUDs8a77Q&ISV_sourceCode=3654&ISV_currencyCode=946&ISV_customerTrns=BigLittleFestival&clientTransactionId=<?php echo $user['user']?>&paymentMethod=CardPresent">Retry payment</a> -->
                <a class="buton" href="/modules/top_up/">Cancel payment</a>
            <?php } ?>
        </div>
    </div>
<?php 
    include('../../../footer.php');
?>   