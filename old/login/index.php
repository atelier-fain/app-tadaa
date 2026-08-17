<?php
    include('../php/auth.php'); 
    $module = 'app';
    include('../header.php');
    
?>
    <div class="login">
        <img src="/img/TADA_logo.png">
        <input type="text" id="user" placeholder="User"/>
        <input type="password" id="password" placeholder="Password"/>
        <span class="buton" id="login">Login</span>
        <p class="error"></p>
    </div>
    
<?php 
    include('../footer.php');
?>