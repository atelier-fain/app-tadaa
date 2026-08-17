<?php 
    include('php/auth.php');
    include('header.php');

    // if($user['access'] && !$user['top_up']) {
    //     header('location: /modules/access');
    // }

    // if(!$user['access'] && $user['top_up']) {
    //     header('location: /modules/top_up');
    // }

?>  
    <span class="buton logout" id="logout">Logout</span>
    <div class="apps">

        
        <?php if($user['top_up']) { ?>
            <a href="/modules/top_up/">
                <img src="/img/icon_top_up.png">
            </a>
        <?php } ?>

        <?php if($user['add_tag']) { ?>
            <a href="/modules/add_tag/">
                <img src="/img/icon_add_tag.png">
            </a>
        <?php } ?>

        <?php if($user['access']) { ?>
            <a href="/modules/access/">
                <img src="/img/icon_access.png">
            </a>
        <?php } ?>

        <?php if($user['access_byd']) { ?>
            <a href="/modules/access_byd/">
                <img src="/img/icon_access_byd.png">
            </a>
        <?php } ?>

        <?php if($user['access_proedus']) { ?>
            <a href="/modules/access_proedus/">
                <img src="/img/icon_access_proedus.png">
            </a>
        <?php } ?>

        <?php if($user['tickets']) { ?>
            <a href="/modules/tickets/">
                <img src="/img/icon_tickets.png">
            </a>
        <?php } ?>

        <?php if($user['vendor']) { ?>
            <a href="/modules/vendor/">
                <img src="/img/icon_vendor.png">
            </a>
        <?php } ?>

        
        <?php if(!$user['access_byd']) { ?>
            <a href="/modules/report/">
                <img src="/img/icon_report.png">
            </a>
        <?php } ?>
    </div>
    
<?php 
    include('footer.php');
?>

    