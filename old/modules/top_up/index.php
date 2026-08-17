<?php 
    include('../../php/auth.php');
    include('../../header.php');

    // print_r($user['user']);
?>  
    
    <div class="screens">
        <div class="screen select_amount <?php if(!isset($_GET['status'])) { echo 'visible';} ?>">
            
            <p class="title">Select prepaid amount</p>
            <div class="list">
                <div class="item fixed" amount="5000">50 lei</div>
                <div class="item fixed" amount="10000">100 lei</div>
                <div class="item fixed" amount="15000">150 lei</div>
                <div class="item fixed" amount="20000">200 lei</div>
                <div class="item fixed" amount="25000">250 lei</div>
                <div class="item fixed" amount="30000">300 lei</div>
                <div class="item fixed" amount="35000">350 lei</div>
                <div class="item fixed" amount="40000">400 lei</div>
                <div class="item fixed" amount="45000">450 lei</div>
                <div class="item fixed" amount="50000">500 lei</div>
                <div class="item fixed" amount="55000">550 lei</div>
                <div class="item other">Other...</div>
                
                <div class="item cash_out_buton">Cash<br> Out</div>
                <div class="item check_balance_buton">Check Balance</div>
                <a href="/" class="item go_home"><i class="fa fa-home" aria-hidden="true"></i></a>
            </div>
        </div>

        <div class="screen select_other_amount">
            <a class="back" href="/modules/top_up/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Other amount</p>
            <div class="other_amount_input">
                <input type="text" id="other_amount" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                <span> lei</span>
            </div>
            <span class="other_amount_submit">TOP UP</span>
        </div>

        <div class="screen payment_method">
            <a class="back" href="/modules/top_up/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Select payment method for <span class="amount"><span class="value">0</span> lei</span></p>
            <div class="list">
                <div class="item cash" type="cash"><i class="fa fa-money" aria-hidden="true"></i>CASH</div>
                <div class="item card" type="card"><i class="fa fa-credit-card" aria-hidden="true"></i>CARD</div>
            </div>
        </div>

        <div class="screen confirm_cash">
            <p class="title">Please confirm that you have received <span class="amount"><span class="value">0</span> lei</span> in cash from the customer.</p>
            <div class="list">
                <div class="item yes">YES</div>
                <a href="/modules/top_up/" class="item no">NO</a>
            </div>
        </div>

        <div class="screen top_up <?php if(isset($_GET['status']) && $_GET['status'] == 'success') { echo 'visible';} ?>">
            <a class="back" href="/modules/top_up/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Scan the card to top up with <span class="amount"><span class="value"><?php if(isset($_GET['status']) && $_GET['status'] == 'success') { echo $_GET['amount']/100;} ?></span> lei</span>.</p>
            <p id="nfcOutput"></p>
        </div>

        <div class="screen check_balance">
            <a class="back" href="/modules/top_up/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Scan the card to check balance.</p>
            <p class="value">
                <span class="amount">0</span>
                 lei
            </p>
            <p class="error"></p>
        </div>

        <div class="screen cash_out">
            <a class="back" href="/modules/top_up/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Scan the card to <br>cash out.</p>
            <p class="value">
                <span class="amount">0</span>
                 lei
            </p>
            <div class="buttons">
                <span class="buton yes">YES</span>
                <a href="/modules/top_up" class="buton no">NO</a>
            </div>
            <p class="error"></p>
        </div>
        <div class="screen success">
            <p class="title">Successful Top-Up</p>
            <h4 class="subtitle">Your NFC tag has been topped up successfully with <strong class="amount"><span class="value"></span> lei.</strong></h4>
            <p>Current balance:</p>
            <p class="title" style="margin-top: 0"><strong class="balance"></strong> lei</p>
            <a class="buton" href="/modules/top_up">New Top-Up</a>
        </div>

    </div>
    <script type="text/javascript">
        var username = "<?php echo $user['user'];?>";
    </script>
<?php 
    include('../../footer.php');
    if(isset($_GET['status']) && $_GET['status'] == 'success') {
?>
    <script>
        shortOrderCode = "<?php echo $_GET['shortOrderCode']?>";
        transactionId = "<?php echo $_GET['transactionId']?>";
        method = 'card';
        type = "charge";
        amount = <?php echo $_GET['amount']?>;
        top_up();

        
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
<?php
    }
?>   