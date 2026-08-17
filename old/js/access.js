if($('#scanInput').length){
    document.getElementById('scanInput').addEventListener('keydown', function (e) {
        requestWakeLock();


        if (e.key === 'Enter' || e.keyCode === 13) {

            var scannedValue = this.value;
            
            this.value = ''; // Clear for next scan

            $.post('/php/check_ticket.php', { code: scannedValue}, function(response) {
                //$('#ticketCode').text(JSON.stringify(response, null, 2));

              

                if(response.valid && response.istoday) {
                    $('#ticketCode').html('<strong><big>'+response.qty+' &times; </big> brățară '+response.color+'</strong><br><br>Bilet valid<br>'+response.ticket_name+'<br>'+response.ticket_category);
                    $('.scanning').css('background-color', '#4fb907');
                } else if(response.valid && !response.istoday) {
                    $('#ticketCode').html('Bilet valabil in alta zi:<br>'+response.ticket_name+'<br>'+response.ticket_category);
                    $('.scanning').css('background-color', '#FF9800');
                } else {
                    $('#ticketCode').html('Bilet invalid');
                    $('.scanning').css('background-color', '#ce0b0b');
                }
            });
        }
    });

    setInterval(function () {
        $('#scanInput').focus();
    }, 1000);

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
}