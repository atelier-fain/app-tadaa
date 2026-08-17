requestWakeLock();

if ('NDEFReader' in window) {

    // Wrap everything in an async IIFE to allow top-level await
    (async () => {
      try {
        const ndef = new NDEFReader();
        await ndef.scan();

        ndef.onreading = async (event) => { // make this async!
          requestWakeLock();
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

          if (!TDID) {
            $('#nfcOutput').append("Getting TDID from DB<br>");

            try {
              const createResponse = await fetch('/php/tag_create.php', {
                method: 'POST'
              });
              
              const data = await createResponse.json();
              TDID = data.tag;

              $('#nfcOutput').append('TDID created in DB: ' + TDID + '<br>');

              try {
                await ndef.write(JSON.stringify({ TDID: TDID }));
                //await ndef.makeReadOnly(); // optional
                $('#nfcOutput').append("TDID written to NFC tag!<br>");
              } catch (err) {
                $('#nfcOutput').append("Error writing to tag: " + (err.message || err.toString()) + "<br>");
              }
              
            } catch (err) {
              $('#nfcOutput').append("Failed to get TDID from server: " + err + "<br>");
            }

          } else {
            $('#nfcOutput').append("TDID allready present: "+TDID);
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