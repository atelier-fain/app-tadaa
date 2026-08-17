<?php 
    include('../../php/auth.php');
    include('../../header.php');
    

    
?>  
    <!-- <p class="title">Daily report for user: <strong><?php echo $user['user']; ?></strong> </p> -->
    <?php if($user['top_up']) { 

        $curl = curl_init();

        curl_setopt_array($curl, array(
          CURLOPT_URL => 'https://api.tadaa.ro/prepaid/tag/log/get/',
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_ENCODING => '',
          CURLOPT_MAXREDIRS => 10,
          CURLOPT_TIMEOUT => 0,
          CURLOPT_FOLLOWLOCATION => true,
          CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
          CURLOPT_CUSTOMREQUEST => 'POST',
          CURLOPT_POSTFIELDS =>'{
            "token": "'.$_COOKIE['token'].'"
        }',
          CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            "Authorization: Bearer FG.-,thVup'y1XkyEH*QWf:E5bjfR#[#QR[,S+}bsq#YlUyL*-Q]Uj(.gd|Z[Xd7"
          ),
        ));

        $lines = json_decode(curl_exec($curl),true);

        // echo "<pre>";
        // print_r($user);
        

        $totals = [
            '29' => [
                'cash' => [
                    'transactions' => 0,
                    'balance' => 0
                ],
                'card' => [
                    'transactions' => 0,
                    'balance' => 0
                ]
            ],
            '30' => [
                'cash' => [
                    'transactions' => 0,
                    'balance' => 0
                ],
                'card' => [
                    'transactions' => 0,
                    'balance' => 0
                ]
            ],
            '31' => [
                'cash' => [
                    'transactions' => 0,
                    'balance' => 0
                ],
                'card' => [
                    'transactions' => 0,
                    'balance' => 0
                ]
            ]
        ];

        foreach ($lines as $key => $line) {
            $day = date("d", $line['_created']);
            if($line['method'] == 'cash') {
                // print_r($line);
                $totals[$day]['cash']['transactions'] += 1;
                $totals[$day]['cash']['balance'] += $line['amount'];
            }

            if($line['method'] == 'card') {
                $totals[$day]['card']['transactions'] += 1;
                $totals[$day]['card']['balance'] += $line['amount'];
            }
        }

        ?>


        <div class="screens">
            <div class="screen report visible">
                <a class="back" href="/"><i class="fa fa-chevron-circle-left " aria-hidden="true"></i></a>
                <p class="title">Daily report for user: <strong><?php echo $user['user']; ?></strong> </p>

                <div class="module">
                    <h3>Top-Up</h3>
                    <?php foreach($totals as $key => $day) { ?>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th><?php echo $key.' aug';?></th>
                                    <th>Cash</th>
                                    <th>Card</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row">Transactions</th>
                                    <td><?php echo $day['cash']['transactions']; ?></td>
                                    <td><?php echo $day['card']['transactions']; ?></td>
                                </tr>
                                <tr>
                                    <th scope="row">Balance (lei)</th>
                                    <td><?php echo $day['cash']['balance']/100; ?> lei</td>
                                    <td><?php echo $day['card']['balance']/100; ?> lei</td>
                                </tr>
                            </tbody>
                        </table>
                    <?php } ?>
                </div>
            </div>
        </div>
    <?php } ?>

    <?php if($user['vendor']) { 
        //echo $user['link_vendor']['_id'];
        $curl = curl_init();

        curl_setopt_array($curl, array(
          CURLOPT_URL => 'https://cockpit.tadaa.ro/api/collections/get/vendor_orders?token=8968ba1c7d088b6f250b223b83dff4',
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_ENCODING => '',
          CURLOPT_MAXREDIRS => 10,
          CURLOPT_TIMEOUT => 0,
          CURLOPT_FOLLOWLOCATION => true,
          CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
          CURLOPT_CUSTOMREQUEST => 'POST',
          CURLOPT_POSTFIELDS =>'{
            "filter": {
                "paid": true,
                "vendor": "'.$user['link_vendor']['_id'].'"
            }
        }',
          CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json'
          ),
        ));

        $response = curl_exec($curl);
        
        curl_close($curl);

        $orders = json_decode(curl_exec($curl),true)['entries'];
        if(isset($_GET['dev'])) {
            // echo "<pre>";
            // print_r($orders);    
        }

        $totals = [
            '29' => [
                'prepaid' => [
                    'orders' => [],
                    'balance' => 0
                ],
                'card' => [
                    'orders' => [],
                    'balance' => 0
                ],
                'online' => [
                    'orders' => [],
                    'balance' => 0
                ]
            ],
            '30' => [
                'prepaid' => [
                    'orders' => [],
                    'balance' => 0
                ],
                'card' => [
                    'orders' => [],
                    'balance' => 0
                ],
                'online' => [
                    'orders' => [],
                    'balance' => 0
                ]
            ],
            '31' => [
                'prepaid' => [
                    'orders' => [],
                    'balance' => 0
                ],
                'card' => [
                    'orders' => [],
                    'balance' => 0
                ],
                'online' => [
                    'orders' => [],
                    'balance' => 0
                ]
            ]
        ];
        $orders_card = [];
        $orders_card_sum = 0;
        $orders_prepaid = [];
        $orders_prepaid_sum = 0;
        $orders_online = [];
        $orders_online_sum = 0;
        // echo "<pre>";
        // print_r($orders);
        foreach ($orders as $key => $order) {
            $day = date("d", $order['_created']);
            if(isset($order['type']) && $order["type"] == "card") {
                $totals[$day]['card']['orders'][] = $order;
                $totals[$day]['card']['balance'] += $order['subtotal'];
            } elseif(isset($order['type']) && $order["type"] == "prepaid") {
                $totals[$day]['prepaid']['orders'][] = $order;
                $totals[$day]['prepaid']['balance'] += $order['subtotal'];
            } elseif(isset($order['type']) && $order["type"] == "online") {
                $totals[$day]['online']['orders'][] = $order;
                $totals[$day]['online']['balance'] += $order['subtotal'];
            }
        }

        ?>

        <div class="screens">
            <div class="screen report visible">
                <a class="back" href="/"><i class="fa fa-chevron-circle-left " aria-hidden="true"></i></a>
                <p class="title">Daily report for user: <strong><?php echo $user['user']; ?></strong> </p>

                <div class="module">
                    <h3>Sales</h3>
                    <?php foreach($totals as $key => $day) { ?>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th><?php echo $key.' aug';?></th>
                                    <th>Prepaid</th>
                                    <th>Card</th>
                                    <th>Online</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row">Transactions</th>
                                    <td><?php echo count($day['prepaid']['orders']); ?></td>
                                    <td><?php echo count($day['card']['orders']); ?></td>
                                    <td><?php echo count($day['online']['orders']); ?></td>
                                </tr>
                                <tr>
                                    <th scope="row">Balance (lei)</th>
                                    <td><?php echo $day['prepaid']['balance']/100; ?> lei</td>
                                    <td><?php echo $day['card']['balance']/100; ?> lei</td>
                                    <td><?php echo $day['online']['balance']/100; ?> lei</td>
                                </tr>
                            </tbody>
                        </table>
                    <?php } ?>
                </div>
            </div>
        </div>
    <?php } ?>

    <?php if($user['tickets']) { 
        //echo $user['link_vendor']['_id'];
        $curl = curl_init();

        curl_setopt_array($curl, array(
          CURLOPT_URL => 'https://cockpit.tadaa.ro/api/collections/get/tickets_onsite?token=8968ba1c7d088b6f250b223b83dff4',
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_ENCODING => '',
          CURLOPT_MAXREDIRS => 10,
          CURLOPT_TIMEOUT => 0,
          CURLOPT_FOLLOWLOCATION => true,
          CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
          CURLOPT_CUSTOMREQUEST => 'POST',
          CURLOPT_POSTFIELDS =>'{
            "filter": {
                "paid": true,
                "user": "'.$user['user'].'"
            }
        }',
          CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json'
          ),
        ));

        $response = curl_exec($curl);

        curl_close($curl);

        $orders = json_decode(curl_exec($curl),true)['entries'];

        $orders_card = [];
        $orders_card_sum = 0;
        $orders_cash = [];
        $orders_cash_sum = 0;
        
        foreach ($orders as $key => $order) {
            if(isset($order['type']) && $order["type"] == "card") {
                $orders_card[] = $order;
                $orders_card_sum += $order['subtotal'];
            } elseif(isset($order['type']) && $order["type"] == "prepaid") {
                $orders_cash[] = $order;
                $orders_cash_sum += $order['subtotal'];
            } 
        }

        ?>

        <div class="screens">
            <div class="screen report visible">
                <a class="back" href="/"><i class="fa fa-chevron-circle-left " aria-hidden="true"></i></a>
                <p class="title">Daily report for user: <strong><?php echo $user['user']; ?></strong> </p>

                <div class="module">
                    <h3>Sales</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Cash</th>
                                <th>Card</th>

                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th scope="row">Transactions</th>
                                <td><?php echo count($orders_cash); ?></td>
                                <td><?php echo count($orders_card); ?></td>
                            </tr>
                            <tr>
                                <th scope="row">Balance (lei)</th>
                                <td><?php echo $orders_cash_sum/100; ?> lei</td>
                                <td><?php echo $orders_card_sum/100; ?> lei</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    <?php } ?>
<?php 
    include('../../footer.php');
?>   