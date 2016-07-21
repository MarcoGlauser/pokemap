jQuery(document).ready(function($) {

    var map;
    var pokemons = {};
    var position = {};
    var positionMarker;

    function initMap(initPosition) {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: initPosition.coords.latitude, lng: initPosition.coords.longitude},
            zoom: 18
        });
        setupPositionMarker();
        /*setup_websocket();
        startUpdate();
        setInterval(startUpdate,50*1000)*/
    }

    function setupPositionMarker(){
        console.log({position: {lat:position.coords.latitude,lng:position.coords.longitude}})
        positionMarker = new google.maps.Marker({
            position: {lat:position.coords.latitude,lng:position.coords.longitude},
            title: 'You\'re here'
        });
        var image = {
            url: '/static/images/pokeball.png',
            // This marker is 20 pixels wide by 32 pixels high.
            size: new google.maps.Size(96, 96),
            // The anchor for this image is the base of the flagpole at (0, 32).
            anchor: new google.maps.Point(48, 48)
        };

        positionMarker.setIcon(image);
        positionMarker.setMap(map);
        console.log('set on map')
    }

    function updatePositionMarker() {
        positionMarker.setPosition({lat:position.coords.latitude,lng:position.coords.longitude})
    }

    function setup_websocket() {
        var ws4redis = WS4Redis({
            uri: 'wss://'+ window.location.host+'/ws/wild_pokemon?subscribe-broadcast&publish-broadcast&echo',
            receive_message: receiveMessage,
            heartbeat_msg: '--skip--'
        });
    }

    //ws4redis.send_message($('#text_message').val());

	// receive a message though the Websocket from the server
	function receiveMessage(msg) {
        var data = JSON.parse(msg)
        console.log('[data received]')
        for(var i = 0; i < data.length;i++){
            var pokemon = data[i];
            if(!pokemons[pokemon.encounter_id]){
                addMarker(pokemon);
                pokemons[pokemon.encounter_id] = true
            }
            else{
                console.log('duplicate received')
            }
        }
	}

    function getPokemonData(data,marker){
        var id = data.pokemon_data.pokemon_id;
        console.log('Getting Data for #' + id)
        $.ajax({
            url:'https://pokeapi.co/api/v2/pokemon/'+ id +'/',
            success: function (response) {
                console.log('Received Data for #' + id + ' ' + response.name)
                marker.setTitle(response.name);
                spriteUrl = response.sprites.front_default.replace(/^http:\/\//i, 'https://');
                var image = {
                    url: spriteUrl,
                    // This marker is 20 pixels wide by 32 pixels high.
                    size: new google.maps.Size(48, 48),
                    // The anchor for this image is the base of the flagpole at (0, 32).
                    anchor: new google.maps.Point(24, 24)
                };

                marker.setIcon(image);
            }
        });
    }

    function addMarker(data){
        var marker = new google.maps.Marker({
            position: {lng:data.longitude,lat:data.latitude},
            title: data.pokemon_data.pokemon_id.toString()
        });
        marker.setMap(map);
        setTimeout(function () {
            removeMarker(data,marker)
        },data.time_till_hidden_ms);

        getPokemonData(data,marker)
    }

    function removeMarker(data,marker){
        console.log('removed marker for #' + data.pokemon_data.pokemon_id);
        marker.setMap(null);
        marker = null;
    }

    function startUpdate(){
        random_component = Math.floor((Math.random() * 20*1000));
        setTimeout(function () {
            $.ajax('/pokeworld/test/?latitude='+position.coords.latitude+'&longitude='+position.coords.longitude)
        },random_component)
    }

    function updatePosition(new_position) {
        if (position.coords.latitude != new_position.coords.latitude && position.coords.longitude != new_position.coords.longitude){
            console.log('new coordinates')
            position = new_position
            updatePositionMarker()
        }
    }
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (initPosition) {
            position = initPosition;
            initMap(initPosition)
        });
        navigator.geolocation.watchPosition(updatePosition);
    }
    else {
        initMap({coords:{latitude:0,longitude:0}});
    }

});