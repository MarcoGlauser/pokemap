jQuery(document).ready(function($) {

    var map;
    var position = {};

    function initMap(position) {
        var coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        var options = {
            zoom: 18,
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

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (initPosition) {
            position = initPosition;
            initMap(initPosition);
         });
    }
    else {
        alert('This map needs Geolocation Access To work!')
    }

});