jQuery(document).ready(function($) {

    var map;
    var pokemons = {};
    var position = {};
    var positionMarker;
    var last_update = null;
    var dot_count = 0;

    function initMap(position) {
        var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        var controlDiv =$("#control-div");
        var options = {
            zoom: 17,
            center: coords,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map"), options);
        controlDiv.index = 1;
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv[0]);
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

	// receive a message though the Websocket from the server
	function receiveMessage(msg) {
        var data = JSON.parse(msg);
        last_update = Date.now();
        console.log('[data received]');
        for(var i = 0; i < data.length;i++){
            var pokemon = data[i];
            if(Date.now() < pokemon.runaway_timestamp) {
                if (!pokemons[pokemon.id]) {
                    var marker = addMarker(pokemon);
                    pokemons[pokemon.id] = {
                        runaway_timestamp: pokemon.runaway_timestamp,
                        marker: marker,
                        pokemon: pokemon
                    }
                }

                else {
                    console.log('duplicate received')
                }
            }
        }
	}

    function addMarker(data){
        var marker = new google.maps.Marker({
            position: {lng:data.longitude,lat:data.latitude},
            title: data.pokemon_name
        });
        marker.setMap(map);

        var spriteUrl = '/static/images/pokemon/'+ data.pokemon_name + '_40_copy.png';
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
        $.ajax('/pokeworld/scan/?latitude='+position.coords.latitude+'&longitude='+position.coords.longitude)
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
        if(last_update){
            var seconds_ago = Math.floor((now - last_update)/1000);
            if(seconds_ago < 1){
                if(dot_count >3){
                    dot_count = 0;
                }
                var text = 'Scanning';
                for(var i = 0; i < dot_count;i++){
                    text += '.'
                }
                dot_count++;
            }
            else {
                dot_count = 0;
                var text = 'Last update was ' + seconds_ago.toString() + ' seconds ago';
            }
        }
        else{
            var text = 'No Update yet'
            dot_count = 0;
        }
        $('#last_update').text(text)

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