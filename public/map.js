function initMap(lat, lon) {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: lat, lng: lon},
        zoom: 10
    });

    var marker = new google.maps.Marker({
        position: {lat: lat, lng: lon},
        map: map,
        title: 'City'
    });
}

