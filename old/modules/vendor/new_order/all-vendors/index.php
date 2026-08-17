<?php 
    include('../header.php');

    $vendors = vendors_get();
?>
    


        <div class="bottom">
        </div>
        <!-- <div class="splash">
            <div class="inner">
                <img src="/img/logo1.svg">
                <p>Enabled by atelierfain.ro</p>
            </div>
        </div> -->
    </header>
    <div class="content">
        <div class="vendors list">
            <div class="top">
                <p class="title">Restaurante</p>
                <div class="view">
                    <div class="selected" list="true">Listă</div>
                    <div list="false">Hartă</div>
                </div>
            </div>
            <div class="list">
                <?php foreach ($vendors as $key => $vendor) { ?>
                    <a href="<?php echo $app_url.'?id='.$vendor['_id']?>" class="item">
                        <img src="<?php echo $cockpit_url.'/storage/uploads'.$vendor['thumbnail']['path'];?>">
                        <div class="info">
                            <p class="title"><?php echo $vendor['name'];?></p>
                            <p class="description"><?php echo $vendor['description'];?></p>
                        </div>
                    </a>
                <?php } ?>
                
                
            </div>
            <div class="map" id="map">
                <img loading="lazy" src="/img/harta_mobile.jpg">
            </div>
        </div>
    </div>
    <?php if(isset($_COOKIE['user']) && count(get_user_orders($_COOKIE['user'])) > 0){ ?>
        <div class="active-orders">
            <a href=/orders class="buton selected">Comenzile mele</a>
        </div>
        
    <?php } ?>
    

<?php 
    include('../footer.php');
?>
    <script src="/vendor/zoom-master/jquery.zoom.js"></script>
    <script type="text/javascript">
        $(document).ready(function(){
          $('#map')
            .wrap('<span style="display:inline-block"></span>')
            .css('display', 'block')
            .parent()
            .zoom({
                on: 'grab',
                touch: 'true',
                magnify: 0.5
            });
        });
    </script>

    