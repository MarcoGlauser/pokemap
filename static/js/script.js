jQuery(document).ready(function($) {

    var map;
    var pokemons = {};
    var position = {};
    var positionMarker;

    function initMap(position) {
        var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        var options = {
            zoom: 17,
            center: coords,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map"), options);
    }

    function setupPositionMarker(position){
        positionMarker = new google.maps.Marker({
            position: {lat:position.coords.latitude,lng:position.coords.longitude},
            title: 'You\'re here'
        });
        var image = {
            url: '/static/images/pokeball.png',
            // This marker is 20 pixels wide by 32 pixels high.
            size: new google.maps.Size(48, 48),
            // The anchor for this image is the base of the flagpole at (0, 32).
            anchor: new google.maps.Point(24, 24)
        };

        positionMarker.setIcon(image);
        positionMarker.setMap(map)
    }

    function updatePositionMarker() {
        console.log('moved Marker')
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
        var data = JSON.parse(msg);
        console.log('[data received]');
        for(var i = 0; i < data.length;i++){
            var pokemon = data[i];
            if(!pokemons[pokemon.id]){
                var marker = addMarker(pokemon);
                pokemons[pokemon.id] = {
                    runaway_timestamp : pokemon.runaway_timestamp,
                    marker : marker,
                    pokemon :pokemon
                }
            }
            else{
                console.log('duplicate received')
            }
        }
	}

    function addMarker(data){
        var marker = new google.maps.Marker({
            position: {lng:data.longitude,lat:data.latitude},
            title: data.pokemon_name
        });
        marker.setMap(map);

        var spriteUrl = '/static/images/pokemon/'+ data.pokemon_name + '.png';
        loadImage(spriteUrl,function (data_url,size) {
            var image = {
                url: data_url,
                // This marker is 20 pixels wide by 32 pixels high.
                size: new google.maps.Size(size.width, size.height),
                // The anchor for this image is the base of the flagpole at (0, 32).
                anchor: new google.maps.Point(size.width / 2, size.height / 2)
            };

            marker.setIcon(image);
        });
        return marker
    }

    function removeMarker(marker,pokemon){
        console.log('removed marker for #' + pokemon.pokemon_name);
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

    function garbageCollection() {
        var now = Date.now();
        for (var prop in pokemons) {
            var pokemon_entry = pokemons[prop];
            if(now > pokemon_entry.runaway_timestamp) {
                removeMarker(pokemon_entry.marker, pokemon_entry.pokemon)
                delete pokemons[prop]
            }
        }
    }

    if (navigator.geolocation) {
        setInterval(garbageCollection,1000);
        navigator.geolocation.getCurrentPosition(function (initPosition) {

            position = initPosition;
            initMap(initPosition);
            setupPositionMarker(initPosition);
            setup_websocket();
            startUpdate();
            setInterval(startUpdate,30*1000);
            navigator.geolocation.watchPosition(updatePosition);
         });
    }
    else {
        alert('This map needs Geolocation Access To work!');
    }

});