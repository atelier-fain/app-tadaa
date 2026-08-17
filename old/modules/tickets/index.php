<?php 
    include('../../php/auth.php');
    include('../../header.php');

    // print_r($user['user']);
?>  
    
    <div class="screens">
        <div class="screen select_amount <?php if(!isset($_GET['status'])) { echo 'visible';} ?>">
            
            <p class="title">Select number of tickets</p>
            <div class="list">
                <div class="item fixed" amount="1">1</div>
                <div class="item fixed" amount="2">2</div>
                <div class="item fixed" amount="3">3</div>
                <div class="item fixed" amount="4">4</div>
                <div class="item fixed" amount="5">5</div>
                <div class="item fixed" amount="6">6</div>
                <div class="item fixed" amount="7">7</div>
                <div class="item fixed" amount="8">8</div>
                <div class="item fixed" amount="9">9</div>
                <div class="item fixed" amount="10">10</div>
                <div class="item fixed" amount="11">11</div>
                <div class="item fixed" amount="12">12</div>
                <div class="item fixed" amount="13">13</div>
                <div class="item other">Other...</div>
                
                
                <a href="/" class="item go_home"><i class="fa fa-home" aria-hidden="true"></i></a>
            </div>
        </div>

        <div class="screen select_other_amount">
            <a class="back" href="/modules/tickets/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Other amount</p>
            <div class="other_amount_input">
                <input type="text" id="other_amount" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                <span> tickets</span>
            </div>
            <span class="other_amount_submit">Payment method</span>
        </div>

        <div class="screen payment_method">
            <a class="back" href="/modules/tickets/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Select payment method for <span class="qty"><span class="value">0</span> tickets</span><br> Amount: <span class="amount"><span class="value">0</span> lei</span></p>
            <div class="list">
                <div class="item cash" type="cash"><i class="fa fa-money" aria-hidden="true"></i>CASH</div>
                <div class="item card" type="card"><i class="fa fa-credit-card" aria-hidden="true"></i>CARD</div>
            </div>
        </div>

        <div class="screen confirm_cash">
            <p class="title">Please confirm that you have received <span class="amount"><span class="value">0</span> lei</span> in cash from the customer.</p>
            <div class="list">
                <div class="item yes">YES</div>
                <a href="/modules/tickets/" class="item no">NO</a>
            </div>
        </div>

        <div class="screen top_up <?php if(isset($_GET['status']) && $_GET['status'] == 'success') { echo 'visible';} ?>">
            <a class="back" href="/modules/tickets/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Transaction completed. <br>Amount: <span class="amount"><span class="value"><?php if(isset($_GET['status']) && $_GET['status'] == 'success') { echo $_GET['amount']/100;} ?></span> lei</span>.</p>
            <p id="nfcOutput"></p>
            <a class="buton" href="/modules/tickets">New order</a>
        </div>

        <div class="screen check_balance">
            <a class="back" href="/modules/tickets/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Scan the card to check balance.</p>
            <p class="value">
                <span class="amount">0</span>
                 lei
            </p>
            <p class="error"></p>
        </div>

        <div class="screen cash_out">
            <a class="back" href="/modules/tickets/"><i class="fa fa-chevron-circle-left" aria-hidden="true"></i></a>
            <p class="title">Scan the card to <br>cash out.</p>
            <p class="value">
                <span class="amount">0</span>
                 lei
            </p>
            <div class="buttons">
                <span class="buton yes">YES</span>
                <a href="/modules/tickets" class="buton no">NO</a>
            </div>
            <p class="error"></p>
        </div>
        <div class="screen success">
            <p class="title">Successful Top-Up</p>
            <h4 class="subtitle">Your NFC tag has been topped up successfully with <strong class="amount"><span class="value"></span> lei.</strong></h4>
            <p>Current balance:</p>
            <p class="title" style="margin-top: 0"><strong class="balance"></strong> lei</p>
            <a class="buton" href="/modules/tickets">New Top-Up</a>
        </div>

    </div>
    <script type="text/javascript">
        var username = "<?php echo $user['user'];?>";
    </script>
<?php 
    include('../../footer.php');
?>   