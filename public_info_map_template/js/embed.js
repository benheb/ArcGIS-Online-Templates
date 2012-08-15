// RESIZE MAP FUNCTION
function resizeMapPreview() {
    //clear any existing resize timer
    clearTimeout(timer2);
    //create new resize timer with delay of 500 milliseconds
    timer2 = setTimeout(function () {
        map.resize();
        map.reposition();
        setTimeout(function () {
            if (startExtent) {
                map.setExtent(startExtent);
            }
        }, 500);
    }, 500);
}

// Handle the map size variables
function mapSize(mSize, ui) {
    $('#embedContainer .embedSizing li').removeClass('selected');
    switch (mSize) {
    case 'small':
        mapWidth = userConfig.embedSizes.small.width;
        mapHeight = userConfig.embedSizes.small.height;
        $('#inputWidth').val(mapWidth);
        $('#inputHeight').val(mapHeight);
        $('#embedSmall').addClass('selected');
        break;
    case 'medium':
        mapWidth = userConfig.embedSizes.medium.width;
        mapHeight = userConfig.embedSizes.medium.height;
        $('#inputWidth').val(mapWidth);
        $('#inputHeight').val(mapHeight);
        $('#embedMedium').addClass('selected');
        break;
    case 'large':
        mapWidth = userConfig.embedSizes.large.width;
        mapHeight = userConfig.embedSizes.large.height;
        $('#inputWidth').val(mapWidth);
        $('#inputHeight').val(mapHeight);
        $('#embedLarge').addClass('selected');
        break;
    case 'resize':
        mapWidth = ui.size.width;
        mapHeight = ui.size.height;
        $('#inputWidth').val(mapWidth);
        $('#inputHeight').val(mapHeight);
        $('#embedCustom').addClass('selected');
        break;
    case 'input':
        mapWidth = ui.size.width;
        mapHeight = ui.size.height;
        $('#inputWidth').val(mapWidth);
        $('#inputHeight').val(mapHeight);
        $('#embedCustom').addClass('selected');
        break;
    default:
        mapWidth = $('#inputWidth').val();
        mapHeight = $('#inputHeight').val();
        if (!RestrictInt(mapWidth)) {
            alertPIM('You may only enter integers in this field.');
            mapWidth = userConfig.embedSizes.medium.width;
            $('#inputWidth').val(mapWidth);
        }
        if (!RestrictInt(mapHeight)) {
            alertPIM('You may only enter integers in this field.');
            mapHeight = userConfig.embedSizes.medium.height;
            $('#inputHeight').val(mapHeight);
        }
        if (userConfig.embedSizes.minimum.width && mapWidth < userConfig.embedSizes.minimum.width) {
            mapWidth = userConfig.embedSizes.minimum.width;
            alertPIM('Minimum width is ' + mapWidth);
            $('#inputWidth').val(mapWidth);
        } else if (userConfig.embedSizes.minimum.height && mapHeight < userConfig.embedSizes.minimum.height) {
            mapHeight = userConfig.embedSizes.minimum.height;
            alertPIM('Minimum height is ' + mapHeight);
            $('#inputHeight').val(mapHeight);
        } else if (userConfig.embedSizes.maximum.width && mapWidth > userConfig.embedSizes.maximum.width) {
            mapWidth = userConfig.embedSizes.maximum.width;
            alertPIM('Maximum width is ' + mapWidth);
            $('#inputWidth').val(mapWidth);
        } else if (userConfig.embedSizes.maximum.height && mapHeight > userConfig.embedSizes.maximum.height) {
            mapHeight = userConfig.embedSizes.maximum.height;
            alertPIM('Maximum height is ' + mapHeight);
            $('#inputHeight').val(mapHeight);
        }
        $('#embedCustom').addClass('selected');
    }
    $('#map, #mapPreviewResize').width(mapWidth).height(mapHeight);
    resizeMapPreview();
    setSharing(true);
}

// CONFIGURE EMBED
function configureEmbed() {
    urlObject = esri.urlToObject(document.location.href);
    urlObject.query = urlObject.query || {};
    // check for false value strings
    urlObject.query = setFalseValues(urlObject.query);
    // Set Query Values from URL
    setValuesFromURL();
    appURL = getAppLoc();
    setDefaultEmptyValues();
    mapWidth = userConfig.embedSizes.medium.width;
    mapHeight = userConfig.embedSizes.medium.height;
    var html = '';
    html += '<h2>Customize</h2>';
    html += '<table id="embedArea"><tbody><tr><td>';
    html += '<ul class="embedSizing">';
    html += '<li class="item" id="embedSmall"><span class="itemIcon"></span>Small</li>';
    html += '<li class="item selected" id="embedMedium"><span class="itemIcon"></span>Medium</li>';
    html += '<li class="item" id="embedLarge"><span class="itemIcon"></span>Large</li>';
    html += '<li class="item" id="embedCustom"><span class="itemIcon"></span>Custom';
    html += '<ul>';
    html += '<li><input placeholder="Width" autocomplete="off" id="inputWidth" value="' + userConfig.embedSizes.medium.width + '" type="text" class="mapInput inputSingle" size="10"></li>';
    html += '<li><input placeholder="Height" autocomplete="off" id="inputHeight" value="' + userConfig.embedSizes.medium.height + '" type="text" class="mapInput inputSingle" size="10"></li>';
    html += '</ul>';
    html += '</li>';
    html += '</ul></td><td>';
    html += '<div id="mapPreviewResize"><div id="map" class="mapLoading"></div></div>';
    html += '</div></td></tr></tbody></table>';
    html += '<h2>Embed</h2>';
    html += '<p>Copy and paste the following HTML to embed the map on your website.</p>';
    html += '<div class="textAreaCon">';
    html += '<textarea id="inputEmbed" value="" class="" size="30" rows="5" readonly></textarea>';
    html += '</div>';
    $('#embedContainer').html(html);
    // if webmap not set via URL
    if (!webmap) {
        // use config webmap
        webmap = userConfig.webmap;
    }
    // create map deferred with options
    var mapDeferred = esri.arcgis.utils.createMap(webmap, 'map', {
        mapOptions: {
            slider: false,
            wrapAround180: true,
            isScrollWheelZoom: true
        }
    });
    // on successful response
    mapDeferred.addCallback(function (response) {
        map = response.map;
        // init basemap gallery hidden
        createBasemapGallery();
        // disable panning
        map.disableMapNavigation();
        // start extent
        setStartExtentValues();
        map.setExtent(startExtent);
    });
    // on error response
    mapDeferred.addErrback(function (error) {
        console.log("Map creation failed: ", dojo.toJson(error));
    });
    // Embed Radio Buttons
    $(document).on('click', '#embedSmall', function (event) {
        mapSize('small');
    });
    $(document).on('click', '#embedMedium', function (event) {
        mapSize('medium');
    });
    $(document).on('click', '#embedLarge', function (event) {
        mapSize('large');
    });
    $(document).on('click', '#embedCustom', function (event) {
        mapSize('custom');
    });
    //  LISTENER FOR CUSTOM MAP SIZE KEY UP - Height
    $('#inputHeight').change(function (e) {
        mapSize('custom');
    });
    // LISTENER FOR CUSTOM MAP SIZE KEY UP - Width
    $('#inputWidth').change(function (e) {
        mapSize('custom');
    });
    // INPUT SELECT ALL
    $(document).on('click', '#inputEmbed', function (event) {
        $(this).select();
    });
    // RESIZABLE
    $("#mapPreviewResize").resizable({
        containment: '#embedPage',
        maxHeight: userConfig.embedSizes.maximum.height,
        maxWidth: userConfig.embedSizes.maximum.width,
        minHeight: userConfig.embedSizes.minimum.height,
        minWidth: userConfig.embedSizes.minimum.width,
        start: function (event, ui) {
            $('#map').css('opacity', "0");
            $(this).addClass('resizing');
        },
        resize: function (event, ui) {
            mapSize('input', ui);
        },
        stop: function (event, ui) {
            mapSize('resize', ui);
            $('#map').css('opacity', "1");
            $(this).removeClass('resizing');
        }
    });
    // SET INITIAL EMBED CODE
    setSharing(true);
}

// on load of libraries
dojo.addOnLoad(function () {
    $(document).ready(function () {
        $.ajaxSetup({
            // Disable caching of AJAX responses
            cache: false
        });
        // get config JSON
        $.getJSON('config/config.js', function (data) {
            // set plugin.userConfig to default config
            userConfig = data;
            // init
            configureEmbed();
        });
    });
});