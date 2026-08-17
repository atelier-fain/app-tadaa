<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

function sendMsg($id, $msg) {
  echo "id: $id" . PHP_EOL;
  echo "data: $msg" . PHP_EOL;
  echo PHP_EOL;
  ob_flush();
  flush();
}


if ($_SERVER['REQUEST_METHOD'] === 'GET') {
     sendMsg('dasde23e32', json_encode($_GET) );
     
}
// if (isset($_GET['test'])) {
// 	sendMsg('dasde23e32', 'test' );
// }
// sendMsg('dasde23e32', 'test' );
// $time = date('r');
// echo "data: The server time is: {$time}\n\n";
// flush();
?>