var firstClick = true;
// console.log(vendor);

setTimeout(function () {
	$("html").trigger("click");
}, 1000);

$('.list.orders.opened .item').each(function(i, obj) {
	refreshColor($(this));
});

var undoTimeouts = {};
var click = new Audio('/modules/vendor/sounds/click2.mp3');
var ding = new Audio('/modules/vendor/sounds/ding.mp3');
var requests_count = 0;
if (window.location.href.indexOf("/login") < 0) {
	if(vendor_online_orders){
		const newOrderInterval = setInterval(getNewOrder, 10000);
	}
	const readyInterval = setInterval(refreshTimings, 60000);
}


function playSound(sound){
	if (sound.paused === true) {
	  sound.play();
	} else {
	  // sound.pause();
	  sound.currentTime = 0;
	  // sound.play();
	}
	console.log(sound.volume);
}

function drag(event) {
	console.log(event);
}

$('.settings .btn-toggle.active').click(function() {
    $(this).find('.btn').toggleClass('active'); 
    var val = false; 
    var id = $(this).attr('product_id');
    
    if ($(this).find('.btn-primary').size()>0) {
    	$(this).find('.btn').toggleClass('btn-primary');
    }

    if($(this).find('.btn-primary').text() == "ON") {
    	val = true;
    }

    if(val){
    	$(this).parents('.item').removeClass('off');
    } else {
    	$(this).parents('.item').addClass('off');
    }
    

    $(this).find('.btn').toggleClass('btn-default');

    $.post( "/modules/vendor/api/product_active.php",{id:id,active:val}, function( response ) {
		
    });
       
});

$('body').on("click", ".item .mark-ready", function(){
	var el = $(this);
	var id = el.parents('.item').attr('order_id');

	el.parents('.item').addClass('waiting');
	undoTimeouts[id] = setTimeout(function(){
		$.post( "/modules/vendor/api/mark_ready.php",{id:id}, function( response ) {
			el.parents('.item').hide(100);
			setTimeout(function(){
				el.parents('.item').remove();
			}, 200);
			
			$.post( "/modules/vendor/views/list-item.php",{id:id}, function( response ) {
				$('.list.orders.ready').prepend(response);
		    });
	    });
	}, 15000);
	
});


$('body').on("click", ".item .mark-closed", function(){
	var el = $(this);
	var id = el.parents('.item').attr('order_id');

	el.parents('.item').addClass('waiting');
	undoTimeouts[id] = setTimeout(function(){
		$.post( "/modules/vendor/api/mark_closed.php",{id:id}, function( response ) {
			el.parents('.item').hide(100);
			setTimeout(function(){
				el.parents('.item').remove();
			}, 200);
			
			$.post( "/modules/vendor/views/list-item.php",{id:id}, function( response ) {
				$('.list.orders.closed').prepend(response);
		    });
	    });
	}, 15000);
	
});

$('body').on("click", ".item .mark-refunded", function(){
	var el = $(this);
	var id = el.parents('.item').attr('order_id');

	el.parents('.item').addClass('waiting');
	undoTimeouts[id] = setTimeout(function(){
		$.post( "/modules/vendor/api/mark_refunded.php",{id:id}, function( response ) {
			el.parents('.item').removeClass('waiting').addClass('refunded');
	    });
	}, 15000);
	
});

$('body').on("click", ".item .undo", function(){
	var el = $(this);
	var id = el.parents('.item').attr('order_id');

	el.parents('.item').removeClass('waiting');
	clearTimeout(undoTimeouts[id]);
});

let debounceTimer;
let pendingIncrement = 0; // in seconds!

$('body').on("click", ".list.orders:not(.settings) .item .plus, .list.orders:not(.settings) .item .minus", function() {
    var el = $(this);
    var span = el.parents('.time').find('.nr span');
    var min = parseInt(span.text()); // current displayed minutes
    var id = el.attr('order_id');

    let thisIncrement; // in seconds
    if (el.hasClass('plus')) {
        thisIncrement = 60; // +1 minute
    } else {
        thisIncrement = (min > 0 ? -60 : 0); // -1 minute (if > 0)
    }

    // ✅ Update UI immediately in minutes
    if (thisIncrement !== 0) {
        span.text(min + (thisIncrement / 60)); 
    }

    // accumulate increment in SECONDS (for backend)
    pendingIncrement += thisIncrement;

    // reset debounce timer
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(function() {
        if (pendingIncrement !== 0) {
            $.post("/modules/vendor/api/time_increment.php", { id: id, increment: pendingIncrement }, function(response) {
                el.parents('.item').attr('ready', response.ready);
                refreshTimings();
                requests_count++;
                $('.requests_count').text(requests_count);
                // ✅ overwrite with DB value
                if (response.minutes !== undefined) {
                    span.text(response.minutes);
                }
            });
            pendingIncrement = 0; // reset after sending
        }
    }, 1000);
});
// $('body').on("click", ".list.orders:not(.settings) .item .plus, .list.orders:not(.settings) .item .minus", function(){
// 	var el = $(this);
//     var min = parseInt(el.parents('.time').find('.nr span').text());
//     var id = el.attr('order_id');
    

//     if(el.hasClass('plus')) {
//     	var increment = 1*60;
//     } else {
//     	if(min > 0) {
//     		var increment = -1*60;
//     	} else {
//     		var increment = 0;
//     	}
    	
//     }
//     //playSound(click);
    
// 	$.post( "/modules/vendor/api/time_increment.php",{id:id,increment:increment}, function( response ) {
// 		el.parents('.item').attr('ready',response.ready);
// 		refreshTimings();
// 		requests_count++;
// 		$('.requests_count').text(requests_count);
//     });

// });




$('body').on("click", ".list.orders.settings .item .plus, .list.orders.settings .item .minus", function(){
	var el = $(this);
	var parent = el.parents('.time');
    var min = parseInt(el.attr('duration'));
    var id = el.attr('product_id');
    

    if(el.hasClass('plus')) {
    	var increment = 1;
    } else {
    	if(min > 1) {
    		var increment = -1;
    	} else {
    		var increment = 0;
    	}
    }
    min = min + increment;
    
	$.post( "/modules/vendor/api/product_duration_increment.php",{id:id,increment:min}, function( response ) {
		parent.find('.buttons span').attr('duration',response.duration);
		parent.find('.nr span').text(response.duration);
    });

});

$("#login").click(function(){
	var data = {};
	data.username = $("#username").val();
	data.password = $("#password").val();

	console.log(data);

	$.post("/modules/vendor/php/login.php", data, function(response){
    	if(response == false) {
    		$('.error').text('Incorrect username or password.');
    	} else {
    		window.location.href = "/?id="+response.vendor;
    	}
  	});
});

// $('.top .view div').click(function(){
// 	$('.top .view div').toggleClass('selected');
// });

$('.top .status-buttons .buton').click(function(){
	var status = $(this).attr('status');
	$('.top .status-buttons .buton').removeClass('selected');
	$('.top .settings').removeClass('selected');
	$(this).addClass('selected');

	$('.list.orders').fadeOut(100);
	$('.list.orders.'+status).delay(150).fadeIn(100);
	// console.log(status);
});

$('.top .settings').click(function(){
	$('.top .status-buttons .buton').removeClass('selected');
	$(this).addClass('selected');

	$('.list.orders').fadeOut(100);
	$('.list.orders.settings').delay(150).fadeIn(100);
	// console.log(status);
});



function refreshTimings(){
	$('.list.orders.opened .item').each(function(i, obj) {
	    var ready = parseInt($(this).attr('ready'))*1000;
	    var now = new Date().getTime();
	    var diff = ready-now;

	    if(diff < 0) {
	    	diff = 0;
	    }
	    
	    $(this).find('.time .nr span').text(Math.round(diff/60/1000));
	    refreshColor($(this));
	    // console.log(color);
	    // console.log(ready);
	});
}

function refreshColor(item) {
	var ready = parseInt(item.attr('ready'))*1000;
    var created = parseInt(item.attr('created'))*1000;
    var now = new Date().getTime();
    var diff = ready-now;
    var color = 0;
    var interval = ready-created;

    if(diff < 0) {
    	diff = 0;
    }

    color = diff*100/interval*2;

    if(item.hasClass('status-opened')){
    	item.find('.color').css('border-color','rgba(255,'+color+',6,1)');
    }
}


// function getNewOrder(){
// 	var ordersVisible = [];
// 	$('.list.orders.opened .item').each(function(i, obj) {
// 		ordersVisible.push($(this).attr('order_id'));
// 	});
// 	// console.log(ordersVisible.length);

// 	$.post("/modules/vendor/api/get_new_orders.php", {ordersVisible:ordersVisible,vendor:vendor}, function(response){
// 		requests_count++;
// 		// $('.requests_count').text(requests_count);
// 		if(response.refresh == 1) {
// 			window.location.reload();
//     	} else if(response.errors == 0) {
//     		$.each(response.new_orders, function (i, order) {
//     			$.post( "/modules/vendor/views/list-item.php",{id:i}, function( response ) {
//     				if(!firstClick) {
//     					$('#ding').get(0).play();
//     				}
// 				    $('.list.orders.opened').prepend(response);
// 				});
// 		    });
//     	}

//     	console.log(Object.keys(response.moved_orders).length);
//     	console.log(response);

//     	if(Object.keys(response.moved_orders).length > 0) {
//     		$.each(response.moved_orders, function (i, status) {
//     			$.post( "/modules/vendor/views/list-item.php",{id:i}, function( response ) {
//     				$('.order-'+i).remove();
//     				if(status == 'ready') {
//     					$('.list.orders.ready').prepend(response);
//     				} else if(status == 'closed') {
//     					$('.list.orders.closed').prepend(response);
//     				}
					
// 			    });
// 			});
    		
//     	}
//   	});

// }

function getNewOrder(){
	var ordersVisible = [];
	var ordersReadyVisible = [];
	$('.list.orders.opened .item').each(function(i, obj) {
		ordersVisible.push($(this).attr('order_id'));
	});

	$('.list.orders.ready .item').each(function(i, obj) {
		ordersReadyVisible.push($(this).attr('order_id'));
	});
	// console.log(ordersVisible.length);

	$.post("/modules/vendor/api/get_new_orders.php", {ordersVisible:ordersVisible,ordersReadyVisible:ordersReadyVisible,vendor:vendor}, function(response){
		requests_count++;
		// $('.requests_count').text(requests_count);
		if(response.refresh == 1) {
			window.location.reload();
    	} else if(response.errors == 0) {
    		$.each(response.new_orders, function (i, order) {
    			$.post( "/modules/vendor/views/list-item.php",{id:i}, function( response ) {
    				if(!firstClick) {
    					$('#ding').get(0).play();
    				}
				    $('.list.orders.opened').prepend(response);
				});
		    });
    	}

    	// console.log(Object.keys(response.moved_orders).length);
    	// console.log(response);

    	if(Object.keys(response.moved_orders).length > 0) {
    		$.each(response.moved_orders, function (i, status) {
    			$.post( "/modules/vendor/views/list-item.php",{id:i}, function( response ) {
    				$('.order-'+i).remove();
    				if(status == 'ready') {
    					$('.list.orders.ready').prepend(response);
    				} else if(status == 'closed') {
    					$('.list.orders.closed').prepend(response);
    				}
					
			    });
			});
    		
    	}
  	});

}
requestWakeLock();

$('.top .sound').click(function(){
	toggle_sound();
});

$('html').click(function(){
	if(firstClick){
		requestWakeLock();
		toggle_sound();
		firstClick = false;
	}
	
});

let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake Lock is active');

    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock was released');
    });
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

function toggle_sound() {
	$('.top .sound').toggleClass('on');
	if(firstClick){	
		$('#ding').get(0).muted = true;
		$('#ding').get(0).play();
		setTimeout(function() { 
	        $('#ding').get(0).muted = false;
	    }, 2100);
	    firstClick = false;
	} else {
		if($(this).hasClass('on')) {
			$('#ding').get(0).muted = false;

		} else {
			$('#ding').get(0).muted = true;
		}
	}
}

// window.addEventListener('message',function(event) {
//   console.log('message received:  ',event);
//   console.log('entry: ',event.data.entry);
//   el.textContent = JSON.stringify(event.data.entry);
// },false);

// var source = new EventSource("/php/test.php");
// source.onmessage = function(event) {
//   console.log(event);
// };
