// CREATE PLACES ITEM
function createPlacesListItem(i) {
    // DEFAULT VARS //
    var html = '';
    // LIST HTML
    html += '<li class="layer placesItem sharedItem checked">';
    html += '<span class="placesIcon placesClick"></span><span class="title placesClick">' + truncate(WMBookmarks[i].name.replace(/[\-_]/g, " "), 28) + '</span>';
    html += '</li>';
    // INSERT LIST ITEM
    $('#placesList').append(html);
    zebraStripe($('#placesList li.layer'));
}

// ZOOM TO LOCATION: ZOOMS MAP TO LOCATION POINT
function zoomToLocation(x, y, IPAccuracy) {
    var lod = 16;
    // set point
    var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(x, y));
    // zoom and center
    map.centerAndZoom(pt, lod);
}

// GEOLOCATION ERROR
function geoLocateMapError(error) {
    console.log(error);
}

// GEOLOCATE FUNCTION: SETS MAP LOCATION TO USERS LOCATION
function geoLocateMap(position) {
    if (position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var IPAccuracy = position.coords.accuracy;
        zoomToLocation(longitude, latitude, IPAccuracy);
    }
}

// GEOLOCATE ITEM
function createGeolocateItem() {
    var html = '<li title="Center map to my location" id="geoLocate" class="layer placesItem"><span class="placesIcon"></span><span class="title">My Current Location</span></li>';
    $('#placesList').append(html);
}

// CONFIGURE PLACES
function placesOnClick() {
    // PLACES CLICK
    $(document).on('click', '#placesList .placesClick',

    function (event) {
        // INDEX
        objIndex = $('#placesList .sharedItem').index($(this).parent());
        if (objIndex !== -1) {
            // CREATE EXTENT
            var newExtent = new esri.geometry.Extent(WMBookmarks[objIndex].extent);
            // SET EXTENT
            map.setExtent(newExtent);
        }
    });
    // GEOLOCATE CLICK
    $(document).on('click', '#geoLocate .title, #geoLocate .placesIcon',

    function (event) {
        navigator.geolocation.getCurrentPosition(geoLocateMap, geoLocateMapError, {
            maximumAge: 3000,
            timeout: 5000,
            enableHighAccuracy: true
        });
    });
    // PLACES CLICK
    $(document).on('click', '#placesButton',

    function (event) {
        toggleMenus('#placesMenu', this);
    });
}

// CONFIGURE PLACES
function configurePlaces() {
    // IF PLACES
    if (userConfig.showPlaces) {
        // INSERT PLACES BUTTON
        $('#placesCon').html('<span id="placesButton" class="barButton" title="Bookmark Places">Places<span class="arrow"></span></span>');
        // CREATE LIST
        $('#placesMenu').html('<ul class="zebraStripes" id="placesList"></ul>');
        // IF GEOLOCATION
        if (userConfig.showGeolocation && navigator.geolocation) {
            createGeolocateItem();
        }
        // IF SHARE OBJECT
        if (WMBookmarks && WMBookmarks.length) {
            for (i = 0; i < WMBookmarks.length; i++) {
                createPlacesListItem(i);
            }
        }
        // SET ON CLICKS
        placesOnClick();
        zebraStripe($('#placesList li.layer'));
    }
}
// END