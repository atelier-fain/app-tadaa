<!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
		<!-- Include all compiled plugins (below), or include individual files as needed -->
		<script src="/js/bootstrap.min.js"></script>
		<!-- <script src="/js/ebapi-modules.js"></script> -->
		<!-- <script src="https://unpkg.com/html5-qrcode"></script> -->
		<script src="/js/app.js?v=<?php //echo time();?>"></script>
		<?php if($module != 'app'){ ?>
			<?php 
                $js = $module;
                if(isset($module_sufix)){
                    $js .= $module_sufix;
                }
            ?>
            <script src="/js/<?php echo $js;?>.js?v=3<?php echo time();?>"></script>
        <?php } ?>
		
	</body>
</html>