var firstCharge = false;
var prepaidPayment = false;
var shortOrderCode = false;
var transactionId = false;
var paymentMessage = false;
requestWakeLock();

if (getCookie('cart') !== null) {
    var cart = JSON.parse(getCookie('cart'));
} else {
    var cart = {};
}
console.log(cart);
// $(window).load(function(){
//     $('.splash').fadeOut(200);
// });

if(typeof(order) != "undefined" && order !== null) {
    statusInterval = setInterval(getStatus, 3000);
}

$('.extras-items input').click(function(){

});

$('.extras-items input').on('change', function(evt) {
    var limit = parseInt($(this).parents('.extras-items').attr('selections'));
    var selected = $(this).parents('.extras-items').find('input:checked');
    var all_selected = $(this).parents('.extras').find('input:checked');
    var pp = parseInt($(this).attr('product_price'));
    if(selected.length > limit) {
       this.checked = false;
    } else {
        var ttl = 0;
        all_selected.each(function () {
           var p = parseInt($(this).attr('price'));
           ttl += p;
        });

        $(this).parents('.item').find('.actions .left .price').html(formatPrice(ttl+pp)+' RON');
    }

    

});

$('.item.with-extras>.img, .item.with-extras>.info, .item.with-extras .show-extras').click(function(){
    requestWakeLock()
    $(this).parents('.item').toggleClass('extras-visible');
    if ($(this).parents('.item').hasClass('extras-visible')) {
        $('html, body').animate({
        scrollTop: $(this).parents('.item').find('.info').offset().top - 50
        }, 200);
    } else {
        $('html, body').animate({
        scrollTop: $(this).parents('.item').offset().top
        }, 200);
    }
});

$('header .menu-toggle').click(function(){
    $('header>.menu').toggleClass('active');
});

$('.drawer-toggle').click(function(){
    $($(this).attr('target')).toggleClass('active');
});

$('.vendors .top .view div').click(function(){
    requestWakeLock()
	var list = $(this).attr('list');

	if (list == 'true') {
		$('.vendors .map').fadeOut(100);
		$('.vendors .list').delay(100).fadeIn(100);
	} else {
		$('.vendors .list').fadeOut(100);
		$('.vendors .map').delay(150).fadeIn(100);
	}

	$('.vendors').toggleClass('list');
	$('.vendors .top .view div').toggleClass('selected');
});

// $('#submit_order').click(function(){
//     $('#submit_order').addClass('disabled');
// 	submit_order();
// });

$('#select_payment_method').click(function(){
    $('.payment_method').delay(200).fadeIn(100);
    $('.cart').fadeOut(100);
    //submit_order();
});

$('.payment-method.card_festival').click(function(){
    $('.charge_card_festival').delay(200).fadeIn(100);
    $('.payment_method').fadeOut(100);
    prepaidPayment = true;
    charge();
});

$('.payment-method.card_bancar').click(function(){
    amount =  cart_total();
    const ISVamount = amount*5/100;
    console.log(vendor_id);
    const vivaUrl = "vivapayclient://pay/v1" +
      "?appId=org.chromium.webpack.abe660f465bd92ffd_v2" +          // Replace with your app's package name
      "&action=sale" +                      // Action like sale, refund, activatePos
      "&amount="+ amount +                     // Amount in cents (e.g., 10000 = 100.00 RON)
      "&sourceCode=8117 " +
      "&callback=https://app.tadaa.ro/modules/vendor/new_order/" +
      "&ISV_amount="+ ISVamount +
      "&ISV_clientId=36d0ak0fs34pp7ptont4wso291bmzydpuc8mqsd7ydf76.apps.vivapayments.com" +
      "&ISV_clientSecret=ZdJTeAoE25V7Y8F5P6T5n67Cef8yHH" +
      "&ISV_sourceCode=1881 " +
      "&ISV_currencyCode=946" +
      "&ISV_customerTrns=BigLittleFestival" +
      "&clientTransactionId="+vendor_id +
      "&paymentMethod=CardPresent";     // Custom URI scheme for result callback
    //console.log(vivaUrl);
    window.location.href = vivaUrl;

    // amount =  cart_total();
    // const vivaUrl = "vivapayclient://pay/v1" +
    //   "?appId=org.chromium.webpack.abe660f465bd92ffd_v2" +          // Replace with your app's package name
    //   "&action=sale" +                      // Action like sale, refund, activatePos
    //   "&amount="+ amount +                     // Amount in cents (e.g., 10000 = 100.00 RON)
    //   "&callback=https://app.tadaa.ro/modules/vendor/new_order/";     // Custom URI scheme for result callback
    //   + "&ISV_amount=100"
    //   + "&ISV_clientId=f78qxghnmuj8sq11087ldvng42z630htfop5ow545dmi0.apps.vivapayments.com"
    //   + "&ISV_clientSecret=2SiKYG6qP3x1FnQEdixD5qUDs8a77Q"
    //   + "&ISV_sourceCode=Default"
    //   + "&ISV_currencyCode=978"
    //   + "&ISV_customerTrns=ItemDescription"
    //   + "&ISV_clientTransactionId=12345678901234567890123456789012" // anythibg
    //   + "&paymentMethod=CardPresent"
    // window.location.href = vivaUrl;
});

$('header .categories .buton').click(function(){
	if($('.cart').is(":visible")){
		$('.cart').fadeOut(100);
		$('header .categories .back').removeClass('active');
		if(Object.keys(cart[vendor_id]).length > 0) {
	        $('.cart-button').addClass('active');
	    }
	} 

	$('header .categories .buton').removeClass('selected');
    $(this).not('.back').addClass('selected');
    $('.content .categories .category').fadeOut(100);
    $('.content .categories .category[category="'+$(this).attr('category')+'"]').delay(100).fadeIn(100);
    scrollToTab($(this));
	
});

$('.cart .details .tips .bottom span').click(function(){
	$(this).addClass('active').siblings().removeClass('active');
	totals();
});

$('header .categories .back').click(function(){
    if($(this).hasClass('tohome')){
        window.location.href = "/modules/vendor/";
    } else if($('.charge_card_festival_success').is(":visible") || $('.charge_card_festival').is(":visible") || $('.payment_method').is(":visible")) {
        window.location.href = "/modules/vendor/new_order/";
    } else {
        hideCart();
    }
    
});

$('.cart-button .buton').click(function(){
    $('header .categories .back').removeClass('tohome');
	$('header .categories .buton').removeClass('last');
    $('header .categories .buton.selected').removeClass('selected').addClass('last');
    $('.cart-button').removeClass('active');
    $('.content .categories .category').removeClass('last');
    $('.content .categories .category:visible').addClass('last').fadeOut(100);
    $('.cart').delay(200).fadeIn(100);
    $('.buton.back').addClass('active');
    scrollToTab($('header .categories .back'));
    // estimateDuration();
    //durationInterval = setInterval(estimateDuration, 30000);
});

// $('.content .categories .list .item').click(function(){
//     $(this).find('.add-to-cart').click();
// });

$('.add-to-cart').click(function(){
    requestWakeLock()
    add_to_cart($(this).attr('product_id'),false,$(this).attr('product_price'),$(this).attr('vendor_id'));
    update_cookie();
});

$('.add-to-cart-extras').click(function(){
    requestWakeLock()
    var extras = [];
    var extras_price = 0;
    $(this).parents('.item').find('input:checked').each(function(i, obj) {
        var obj = {};
        var p = parseInt($(this).attr('price'));

        obj['name'] = $(this).attr('item');
        obj['price'] = p;

        extras_price += p;
        extras.push(obj);
        // console.log(extras_price);
    });

    var pp = parseInt($(this).attr('product_price')) + extras_price;

    add_to_cart($(this).attr('product_id'),extras,pp,$(this).attr('vendor_id'));
    update_cookie();

    $(this).parents('.item').find('input[type=checkbox]').prop( "checked", false );
    $(this).parents('.item').removeClass('extras-visible');
    $(this).parents('.item').find('.actions').removeClass('added');
});




$('.cart .comments').focus(function(){
	$(this).addClass('focused');
});

$('.cart .comments').blur(function(){
	// var lht = parseInt($('.cart .comments').css('line-height'),10);
	// var padding = parseInt($('.cart .comments').css('padding-top'),10) + parseInt($('.cart .comments').css('padding-bottom'),10);
	// var scrollHeight = $('.cart .comments').prop('scrollHeight');
	// var lines = (scrollHeight - padding)/lht;
	// console.log(lines);
	

	// $(this).css('max-height',lines*22).removeClass('focused');
	$(this).removeClass('focused');
});

$('body').on("click", ".qty-selector .plus", function(){
    var qty = parseInt($(this).siblings('.qty').text()) + 1;
    var price = parseInt($(this).attr('product_price'));
    var tot_price = price * qty;
    // console.log(qty+' * '+price);
    if(qty < 11) {
        $('.product-'+$(this).attr('product_id')+' .qty').text(qty);
        updateQty($(this).attr('product_id'),$(this).attr('vendor_id'),qty);
        $('.cart .product-'+$(this).attr('product_id')+' .price').attr('value',tot_price).html(formatPrice(tot_price)+' RON');
        totals();
    }

});

$('body').on("click", ".qty-selector .minus", function(){
    var qty = parseInt($(this).siblings('.qty').text()) - 1;
    var price = parseInt($(this).attr('product_price'));
    var tot_price = price * qty;
    
    $('.product-'+$(this).attr('product_id')+' .qty').text(qty);
    $('.cart .product-'+$(this).attr('product_id')+' .price').attr('value',tot_price).html(formatPrice(tot_price)+' RON');
    updateQty($(this).attr('product_id'),$(this).attr('vendor_id'),qty);
    totals();
    if(qty == 0) {
        $(this).parents('.right').removeClass('added');
        $(this).parents('.actions').removeClass('added');
        removeProduct($(this).attr('product_id'),$(this).attr('vendor_id'));
    }
});





$('.cart').on("click", ".minus", function(){
    var qty = parseInt($(this).siblings('.qty').text());
    if(qty == 0) {
        //$(this).parents('.item').remove();
        removeProduct($(this).attr('product_id'),$(this).attr('vendor_id'));
    }
});

$('.cart').on("click", ".del", function(){
    //$(this).parents('.item').remove();
    removeProduct($(this).attr('product_id'),$(this).attr('vendor_id'));

});



function updateQty(product_id,vendor_id,qty){
    cart[vendor_id][product_id]['qty'] = qty;
    update_cookie();


}

function removeProduct(product_id,vendor_id){
    delete cart[vendor_id][product_id];
    update_cookie();
    if(Object.keys(cart[vendor_id]).length == 0) {
        $('.cart-button').removeClass('active');
        if($('.cart').is(":visible")){
            hideCart();
        }
    }
    $('.cart .list .product-'+product_id).hide(200,function() { $(this).remove(); });
    $('.product-'+product_id+' .right').removeClass('added');
    $('.product-'+product_id+' .actions').removeClass('added');
    $('.product-'+product_id+' .qty').text(0);
    totals();
}

function add_to_cart(product_id,extras,product_price,vendor_id){
    var suffix = $.now();
    var product = {};
    
    product.qty = 1;
    product.price = parseInt(product_price);
    
    product.id = product_id;
    product.extras = {};
    if(extras){
        product.extras = extras;

    }
    
    if(!(vendor_id in cart)) {
        cart[vendor_id] = {};
    }
    if(extras){
        product.lid = product_id+'_'+suffix;
    } else {
        product.lid = product_id;
    }

    cart[vendor_id][product.lid] = product;
    
    $('.cart-button').addClass('active');
    $('.product-'+product_id+' .right').addClass('added');
    $('.product-'+product_id+' .actions').addClass('added');
    $('.product-'+product_id+' .qty').text(1);
    console.log(product);

    $.post( "/modules/vendor/new_order/views/product-cart-item.php",product, function( response ) {
        
      $('.cart .list').append(response);
      totals();
    });
}

function update_cookie(){
    setCookie('cart',JSON.stringify(cart),'2');  
}

function setCookie(key, value, expiry) {
    var expires = new Date();
    expires.setTime(expires.getTime() + (expiry * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
    var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
    return keyValue ? keyValue[2] : null;
}

function eraseCookie(key) {
    var keyValue = getCookie(key);
    setCookie(key, keyValue, '-1');
}

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
}

function scrollToTab(tab){
    var containerWidth = $('header .categories').width();
    var selectedTabDistance = tab.position().left + $('header .categories').scrollLeft() + tab.width() / 2;
  
    $('header .categories').animate({
        scrollLeft: selectedTabDistance - containerWidth/2
    }, 200);
}

function hideCart(){

	var lastButton = $('header .categories .buton.last');
    $('header .categories .back').removeClass('active').addClass('tohome');
    scrollToTab(lastButton);
    $('.content .cart').fadeOut(100);
    $('.content .charge_card_festival_success').fadeOut(100);
    $('.content .charge_card_festival').fadeOut(100);
    $('.content .payment_method').fadeOut(100);

    lastButton.removeClass('last').addClass('selected');
    $('.content .categories .category.last').removeClass('last').delay(200).fadeIn(100);
    if(Object.keys(cart[vendor_id]).length > 0) {
        $('.cart-button').addClass('active');
    }
	//clearInterval(durationInterval);

	
}

function formatPrice(price){
	if(price == 0) {
		return '0<sup>00</sup>';
	}
	var pr1 = price.toString().slice(0,-2);
    var pr2 = price.toString().slice(-2);

    return pr1+'<sup>'+pr2+'</sup>';
}

function totals(){
	var subtotal = 0;
	$.each(cart[vendor_id], function (key, val) {
        subtotal += val.price*val.qty;
    });
	// $('.cart .list .price').each(function(i, obj) {
	//     subtotal += parseInt($(this).attr('value'));
	// });
	var tips = $('.cart .details .tips .bottom span.active').attr('value')/100*subtotal;
	tips = Math.floor(tips);
	//console.log(subtotal+'--'+tips);
	$('.tips .amount').html(formatPrice(tips)+' RON');
	$('.subtotal .amount').html(formatPrice(subtotal)+' RON');
	$('.total .amount').html(formatPrice(subtotal+tips)+' RON');
    $('.cart-button .buton .total').html(formatPrice(subtotal+tips)+' RON');
	//estimateDuration();
}

function cart_total(){
    var subtotal = 0;
    $.each(cart[vendor_id], function (key, val) {
        subtotal += val.price*val.qty;
    });
    var tips = $('.cart .details .tips .bottom span.active').attr('value')/100*subtotal;
    tips = Math.floor(tips);
    
    return subtotal+tips;
}

function submit_order(){
	var subtotal = 0;
	$.each(cart[vendor_id], function (key, val) {
        subtotal += val.price*val.qty;
    });
	var order = {};
    order.prepaid = prepaidPayment;
	order.subtotal = subtotal;
    order.message = paymentMessage;
	order.comments = $('.comments').val();
	order.products = cart[vendor_id];
	order.vendor = vendor_id;
    order.shortOrderCode = shortOrderCode;
    order.transactionId = transactionId;
	order.tip = {};
	order.tip.percentage = parseInt($('.cart .details .tips .bottom span.active').attr('value'));
	order.tip.amount = Math.round(order.tip.percentage/100*subtotal);
    //console.log(order);
	save_order(order);
}

function save_order(order){
	$.post( "/modules/vendor/new_order/api/save_order.php",{order}, function( result ) {
        if (result.error) {
            if (result.error_code == 1) {
                $('#select_payment_method').hide();
                $('.go-to-vendors, .vendor-closed').show();
            } else if(result.error_code == 2) {
                $.each( result.unavailable_products, function( key, value ) {
                  $('.cart .product-'+value.lid).addClass('unavailable');
                });
                $('#submit_order').removeClass('disabled');
            }
        } else {
            delete_vendor_cookie();
        }       
    });
}

function delete_vendor_cookie() {
	delete cart[vendor_id];
	update_cookie();
}

function estimateDuration(){
	$.post( "/modules/vendor/new_order/views/order_duration.php",{cart:cart,vendor:vendor_id}, function( response ) {
		$('.cart .estimated').html(response);
    });
}

function getStatus(){
	$.post( "/modules/vendor/new_order/views/order_status.php",{order:order}, function( response ) {
		$('.order .ready-wr').html(response);
		if ($('.order .ready-wr .ready').hasClass('green')) {
			clearInterval(statusInterval);
		}
    });
}

function post_to_url(path, params, method) {
    method = method || "post"; // Set method to post by default, if not specified.

    var $form = $("<form>")
        .attr("method", method)
        .attr("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var $hiddenField = $("<input type='hidden' >")
                .attr("name", key)
                .val( params[key] );

            $form.append( $hiddenField );
         }
    }

    $('body').append( $form );
    $form.submit();
}

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


function charge(){
    amount =  cart_total();
    if ('NDEFReader' in window) {

        // Wrap everything in an async IIFE to allow top-level await
        (async () => {
          try {
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.onreading = async (event) => { // make this async!
              let message = event.message;
              let TDID = false;
              let error = false;

              $('#nfcOutput').empty();

              $.each(message.records, function(index, record) {
                if (record.recordType === "mime" || record.recordType === "text" || record.recordType === "json") {
                  const textDecoder = new TextDecoder(record.encoding || "utf-8");
                  const data = textDecoder.decode(record.data);

                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.TDID) {
                      TDID = parsed.TDID;
                    }
                  } catch (err) {
                    error = 'Non-JSON record<br>';
                  }
                }
              });

              if (error) {
                $('#nfcOutput').append(error);
              }

              if (TDID) {
                const payload = {
                  amount: -amount,
                  TDID: TDID,
                  method: false,
                  type: 'purchase',
                  shortOrderCode: false,
                  transactionId: false,
                  vendor: vendor_id
                };

                if(!firstCharge) {
                  try {
                    const chargeResponse = await fetch('/php/tag_payment.php', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(payload)
                    });

                    const result = await chargeResponse.json(); // Or `.text()` if not JSON
                    //$('#nfcOutput').text(JSON.stringify(result));
                    if(result.response.errors){    
                        $('#nfcOutput').append("Credit insuficient: "+result.response.balance/100+' lei');
                    } else {
                      
                      $('.charge_card_festival_success .amount .value').text(amount/100);
                      $('.charge_card_festival_success .balance').text(result.response.balance/100);
                      $('.charge_card_festival').fadeOut(100);
                      $('.charge_card_festival_success').delay(200).fadeIn(100);
                      firstCharge = true;
                      submit_order();
                      
                      //window.location.replace("/modules/top_up/success/?amount="+amount+'&balance='+result.response.balance);
                    }
                  } catch (err) {
                    $('#nfcOutput').append(err);
                  }
                } else {
                  $('#nfcOutputSuccess').text('Plata a fost deja procesata.');
                }
              } else {
                $('#nfcOutput').append('TAG not activated');
              }

            };

          } catch (err) {
            const error = JSON.stringify(err, null, 2);
            $('#nfcOutput').text("NFC Scan Error: " + error);
          }
        })(); // End IIFE

    } else {
    alert("Web NFC not supported in this browser.");
    }

    
}