var amount = 0;
var method = 'cash';
var type = 'charge';
var CashOutTDID = false;
var shortOrderCode = false;
var transactionId = false;
var firstCharge = false;
var prepaidPayment = true;
var paymentMessage = false;

$('#other_amount').on('keydown', function(e) {
    // Allow: Backspace (8), Tab (9), Delete (46), arrows (37-40)
    if (
      $.inArray(e.keyCode, [8, 9, 46, 37, 38, 39, 40]) !== -1
    ) {
      return;
    }

    // Prevent spacebar
    if (e.keyCode === 32) {
      e.preventDefault();
      return;
    }

    // Allow only number keys (0–9) from both keyboard and numpad
    if (
      (e.keyCode < 48 || e.keyCode > 57) && // top row
      (e.keyCode < 96 || e.keyCode > 105)   // numpad
    ) {
      e.preventDefault();
    }
  });

$('#other_amount').on('input', function() {
    const value = $(this).val().replace(/\D/g, ''); // sanitize input
    $(this).val(value); // ensure only digits remain
    if(value.length > 0) {
    	$('.other_amount_submit').show();
    } else {
    	$('.other_amount_submit').hide();
    }
});

$('.other_amount_submit').click(function(){
	amount = $('#other_amount').val().trim()*100;
	$('.payment_method .amount .value').text(amount/100);
	$('.select_other_amount').removeClass('visible');
	$('.payment_method').addClass('visible');
});

$('.payment_method .item.cash').click(function(){
	$('.top_up .amount .value').text(amount/100);
	$('.payment_method').removeClass('visible');
	$('.top_up').addClass('visible');
  charge();
});

// $('.confirm_cash .item.yes').click(async function(){
	
// 	$('.confirm_cash').removeClass('visible');
// 	$('.top_up').addClass('visible');

// 	top_up();

// });

















// $('.select_amount .item.cash_out_buton').click(function(){
//   $('.select_amount').removeClass('visible');
//   $('.cash_out').addClass('visible');

//   requestWakeLock();

//   if ('NDEFReader' in window) {

//     // Wrap everything in an async IIFE to allow top-level await
//     (async () => {
//       try {
//         const ndef = new NDEFReader();
//         await ndef.scan();

//         ndef.onreading = async (event) => { // make this async!
//           let message = event.message;
//           let error = false;

//           $('.cash_out .error').empty();

//           $.each(message.records, function(index, record) {
//             if (record.recordType === "mime" || record.recordType === "text" || record.recordType === "json") {
//               const textDecoder = new TextDecoder(record.encoding || "utf-8");
//               const data = textDecoder.decode(record.data);

//               try {
//                 const parsed = JSON.parse(data);
//                 if (parsed.TDID) {
//                   CashOutTDID = parsed.TDID;
//                 }
//               } catch (err) {
//                 error = 'Non-JSON record<br>';
//               }
//             }
//           });

//           if (error) {
//             $('.cash_out .error').append(error);
//           }

//           if (!CashOutTDID) {
//             $('.cash_out .error').append("No TDID found <br>");
//           } else {
//             //topup

//             const payload = {
//               TDID: CashOutTDID
//             };
            

//             try {
//               const chargeResponse = await fetch('/php/tag_check.php', {
//                 method: 'POST',
//                 headers: {
//                   'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(payload)
//               });

//               const result = await chargeResponse.json(); // Or `.text()` if not JSON

//               // console.log(response);
//               if(result.balance){

//                 if(result.balance == 0){
//                   $('.cash_out .title').text('Cannot cash out! The card balance is 0.');
//                 } else {
//                   $('.cash_out .title').text('Are you sure you want to cash out');
//                   $('.cash_out .value .amount').text(result.balance/100);
//                   $('.cash_out .value').show();
//                   $('.cash_out .buttons').css('display','flex');
//                 }
                

//                 amount = -result.balance;
//                 //$('.cash_out .error').text(balance).show();
//               } else {
//                 $('.cash_out .error').append("Tag not found").show();
//               }
//             } catch (err) {
//               $('.cash_out .error').append(err);
//             }
//           }

//         };

//       } catch (err) {
//         const error = JSON.stringify(err, null, 2);
//         $('#nfcOutput').text("NFC Scan Error: " + error);
//       }
//     })(); // End IIFE

//   } else {
//     alert("Web NFC not supported in this browser.");
//   }
// });

// $('.cash_out .yes').click(async function(){
//   const payload = {
//     amount: amount,
//     TDID: CashOutTDID,
//     method: 'cash',
//     type: 'discharge',
//     transactionId: transactionId,
//     shortOrderCode: shortOrderCode
//     // amount: -1000,
//     // TDID: '338ff723316666d96800037a',
//     // method: 'cash',
//     // type: 'discharge',
//     // transactionId: transactionId,
//     // shortOrderCode: shortOrderCode
//   };

  
//   if(!firstCharge) {

//     try {
//       const chargeResponse = await fetch('/php/tag_charge.php', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(payload, null, 2)
//       });

//       const result = await chargeResponse.json(); // Or `.text()` if not JSON

//       if(result.response.errors){
//         $('.cash_out .error').append("Charge error");
//         $('.cash_out .title').text('');
//         $('.cash_out .buttons').css('display','none');
//         $('.cash_out .value').hide();
//       } else {
//         $('.cash_out .buttons').css('display','none');
//         $('.cash_out .value').hide();
//         $('.cash_out .title').html('Cash out was successful.<br>Please refund <br><strong>'+-amount/100+' lei</strong>');
//       }
//     } catch (err) {
//       $('.cash_out .error').append(err);
//     }

//   } else {
//     $('.cash_out .title').text('This NFC tag has already been cashed out.');
//     $('.cash_out *:not(.title:first-of-type)').hide();
//   }

// });


$('.payment_method .item.card').on('click', function () {
  const ISVamount = amount*5/100;
    const vivaUrl = "vivapayclient://pay/v1" +
      "?appId=org.chromium.webpack.abe660f465bd92ffd_v2" +          // Replace with your app's package name
      "&action=sale" +                      // Action like sale, refund, activatePos
      "&amount="+ amount +                     // Amount in cents (e.g., 10000 = 100.00 RON)
      "&sourceCode=8117" +
      "&callback=https://app.tadaa.ro/modules/vendor/new_simple_order/" +
      "&ISV_amount="+ ISVamount +
      "&ISV_clientId=36d0ak0fs34pp7ptont4wso291bmzydpuc8mqsd7ydf76.apps.vivapayments.com" +
      "&ISV_clientSecret=ZdJTeAoE25V7Y8F5P6T5n67Cef8yHH" +
      "&ISV_sourceCode=1881" +
      "&ISV_currencyCode=946" +
      "&ISV_customerTrns=BigLittleFestival" +
      "&clientTransactionId="+username +
      "&paymentMethod=CardPresent";     // Custom URI scheme for result callback
      // console.log(vivaUrl);
    window.location.href = vivaUrl;

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




function charge(){
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

          // if (!TDID) {
          //   $('#nfcOutput').append("Getting TDID from DB<br>");

          //   try {
          //     const createResponse = await fetch('/php/tag_create.php', {
          //       method: 'POST'
          //     });
              
          //     const data = await createResponse.json();
          //     TDID = data.tag;

          //     $('#nfcOutput').append('TDID created in DB: ' + TDID + '<br>');

          //     try {
          //       await ndef.write(JSON.stringify({ TDID: TDID }));
          //       await ndef.makeReadOnly(); // optional
          //       $('#nfcOutput').append("TDID written to NFC tag!<br>");
          //     } catch (err) {
          //       $('#nfcOutput').append("Error writing to tag: " + (err.message || err.toString()) + "<br>");
          //     }
              
          //   } catch (err) {
          //     $('#nfcOutput').append("Failed to get TDID from server: " + err + "<br>");
          //   }

          // }
            //topup
          if (TDID) {
            const payload = {
              amount: -amount,
              TDID: TDID,
              method: false,
              type: 'purchase',
              shortOrderCode: shortOrderCode,
              transactionId: transactionId
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

                if(result.response.errors){
                  $('.top_up').removeClass('visible');
                  $('.success').addClass('visible');
                  $('.success').css('background','#d91e0a');
                  $('.success .title').hide();
                  $('.success .title:first-of-type').text("Credit insuficient: "+result.response.balance/100+' lei').show();
                  $('.success .subtitle').hide();
                  $('.success h4').hide();
                } else {
                  
                  $('.success .amount .value').text(amount/100);
                  $('.success .balance').text(result.response.balance/100);
                  $('.top_up').removeClass('visible');
                  $('.success').addClass('visible');
                  firstCharge = true;
                  submit_order();
                  
                  //window.location.replace("/modules/top_up/success/?amount="+amount+'&balance='+result.response.balance);
                }
              } catch (err) {
                $('#nfcOutput').append(err);
              }
            } else {
              $('.success .title').text('This NFC tag was already topped up.');
              $('.success *:not(.title:first-of-type)').hide();
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


function decodeTextRecord(record) {
  // record.data is a DataView; first byte = status (bits: encoding + lang length)
  const status = record.data.getUint8(0);
  const langLength = status & 0x3f; // lower 6 bits
  const utf16 = (status & 0x80) !== 0;
  const encoding = utf16 ? "utf-16" : "utf-8";

  const decoder = new TextDecoder(encoding);
  // Slice off status + language code
  const textBytes = new DataView(
    record.data.buffer,
    record.data.byteOffset + 1 + langLength,
    record.data.byteLength - 1 - langLength
  );
  return decoder.decode(textBytes);
}

function submit_order(){
  
  var order = {};
  order.prepaid = prepaidPayment;
  order.subtotal = amount;
  order.message = paymentMessage;
  order.products = false;
  order.vendor = vendor._id;
  order.shortOrderCode = shortOrderCode;
  order.transactionId = transactionId;
  order.comments = '';
  order.tip = {};
  order.tip.percentage = 0;
  order.tip.amount = 0;
  save_order(order);
}


function save_order(order){
  $.post( "/modules/vendor/new_order/api/save_order.php",{order}, function( result ) {
           
  });
}
// test();

// async function test(){

//   const payload = {
//     TDID: '01b2ca5e3165349f4b000177'
//   };
  

//   try {
//     const chargeResponse = await fetch('/php/tag_check.php', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(payload)
//     });

//     const result = await checkResponse.json(); // Or `.text()` if not JSON

//     console.log(response);
//     // if(result.response.errors){
//     //   $('.check_balance .error').append("Charge error");
//     // } else {
//     //   window.location.replace("/modules/top_up/success/?amount="+amount+'&balance='+result.response.balance);
//     // }
//   } catch (err) {
//     $('.check_balance .error').append(err);
//   }
// }