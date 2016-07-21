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

        var marker = new google.maps.Marker({
          position: coords,
          map: map,
          title:"You are here!"
        });
    }

    function setupPositionMarker(position){
        console.log('lat: '+ position.coords.latitude+ ' lng:'+position.coords.longitude)
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
        positionMarker.setMap(map);
        console.log(map.getCenter())
        console.log(map.getCenter().toString())
        map.setCenter(positionMarker.getPosition())
    }

    function updatePositionMarker() {
        console.log('moved Marker')
     		  positionMarker.setPosition({lat:position.coords.latitude,lng:position.coords.longitude})
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
            initMap(initPosition);
            setupPositionMarker(initPosition);
            navigator.geolocation.watchPosition(updatePosition);
         });
    }
    else {
        alert('This map needs Geolocation Access To work!')
    }

});