$('#login').click(function(){
    var error = false;
    var data = {};
    data.user = $('#user').val().trim();
    data.password = $('#password').val().trim();

    if(data.user.length < 1){
        error = true;
    }

    if(data.password.length < 1){
        error = true;
    }

    if(!error) {
        $.post('/php/login.php', data, function(response) {
            if(response.auth){
                window.location.replace("/");
            } else {
                $('.error').text('Incorrect user or password');
            }
        });
    } else {
        $('.error').text('Incorrect user or password');
    }
});

$('#logout').click(function(){
    

    
    $.post('/php/logout.php', function(response) {
        window.location.replace("/");
    });
    
});

// $('.screens')

