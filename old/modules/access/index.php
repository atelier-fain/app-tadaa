<?php 
    include('../../php/auth.php');
    include('../../header.php');
?>  
    <a class="home" href="/"><img src="/img/home.svg"></a>
    <div class="scanning">
        <input type="text" id="scanInput" placeholder="Scan QR code" inputmode="none"/>
        <p id="ticketCode">Ready to scan...</p>
    </div>
    
<?php 
    include('../../footer.php');
?>   