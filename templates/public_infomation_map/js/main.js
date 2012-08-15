// webmap object returned. Create map data
function pimWebmapReturned(response) {
    // webmap layers
    var layers = response.itemInfo.itemData.operationalLayers;
    // webmap
    map = response.map;
    // map connect functions
    dojo.connect(aoGeocoder, "onAddressToLocationsComplete", showResults);
    dojo.connect(aoGeoCoderAutocomplete, "onAddressToLocationsComplete", showAutoComplete);
    dojo.connect(pimPopup, "onHide", clearPopupValues);
    dojo.connect(window, "onresize", resizeMap);
    dojo.connect(map, "onExtentChange", function (extent) {
        // update current extent
        sXmin = extent.xmin;
        sXmax = extent.xmax;
        sYmin = extent.ymin;
        sYmax = extent.ymax;
        // update sharing link
        setSharing();
        // hide auto complete
        hideAC();
        // reset refresh timer for social media
        resetSocialRefreshTimer();
    });
    // webmap item info
    WMItemInfo = response.itemInfo;
    // webmap item data
    WMItemData = response.itemInfo.itemData;
    // use places from agol bookmarks
    WMBookmarks = response.itemInfo.itemData.bookmarks;
    // webmap presentation layer
    WMPreso = response.itemInfo.itemData.presentation;
    // webmap operational layers
    WMLayers = response.itemInfo.itemData.operationalLayers;
    // webmap basemap title by default
    WMBMTitle = response.itemInfo.itemData.baseMap.title;
    // set app name from agol item name
    userConfig.appName = WMItemInfo.item.title;
    // create basemap gallery widget
    createBasemapGallery();
    // set up layer menu
    configureLayers();
    // set up places menu
    configurePlaces();
    // resize map
    resizeMap();
    // set up social media
    configureSocialMedia();
    // Build Social Media FAI Offensive
    createSMFOffensive();
    // BAD WORDS TASK
    createSMFBadWords();
    // init UI
    configureUserInterface();
    // start extent
    setStartExtentValues();
    // set extent
    map.setExtent(startExtent);
}

// Info window popup creation
function createPimPopup() {
    // popup dijit configuration
    pimPopup = new esri.dijit.Popup({
        offsetX: 3,
        fillSymbol: false,
        highlight: false,
        lineSymbol: false,
        marginLeft: 10,
        marginTop: 10,
        markerSymbol: false,
        offsetY: 3,
        zoomFactor: 4
    }, dojo.create("div"));
    // connects for popup
    dojo.connect(pimPopup, "maximize", toggleMenus);
    dojo.connect(pimPopup, "onSelectionChange", overridePopupTitle);
    // popup theme
    dojo.addClass(pimPopup.domNode, "modernGrey");
}

// Create the map object for the PIM
function createPimMap() {
    // if webmap not set via URL
    if (!webmap) {
        // use config webmap
        webmap = userConfig.webmap;
    }
    // configure popup
    createPimPopup();
    // create map deferred with options
    var mapDeferred = esri.arcgis.utils.createMap(webmap, 'map', {
        mapOptions: {
            slider: false,
            wrapAround180: true,
            infoWindow: pimPopup,
            isScrollWheelZoom: true
        },
        bingMapsKey: userConfig.bingMapsKey,
        geometryServiceURL: userConfig.geometryserviceurl
    });
    // on successful response
    mapDeferred.addCallback(function (response) {
        pimWebmapReturned(response);
    });
    // on error response
    mapDeferred.addErrback(function (error) {
        console.log("Map creation failed: ", dojo.toJson(error));
    });
}

// Initial function
function init() {
    // Set Query Values from URL
    urlObject = esri.urlToObject(document.location.href);
    urlObject.query = urlObject.query || {};
    // check for false value strings
    urlObject.query = setFalseValues(urlObject.query);
    // set all values from URL
    setValuesFromURL();
    // Set app location
    appURL = getAppLoc();
    // Set default values
    setDefaultEmptyValues();
    setLocateValues();
    setSocialShareValues();
    setYTShareValues();
    setTWShareValues();
    setFLShareValues();
    // PROXY
    esri.config.defaults.io.proxyUrl = userConfig.proxyURL;
    esri.config.defaults.io.alwaysUseProxy = userConfig.alwaysUseProxy;
    // LOCATOR SEARCH SERVICES
    aoGeocoder = new esri.tasks.Locator(userConfig.locatorURL);
    aoGeoCoderAutocomplete = new esri.tasks.Locator(userConfig.locatorURL);
    aoTwitterGeocoder = new esri.tasks.Locator(userConfig.locatorURL);
    // Create Map
    createPimMap();
}

// On load of libraries
dojo.addOnLoad(function () {
    $(document).ready(function () {
        $.ajaxSetup({
            // Disable caching of AJAX responses
            cache: false
        });
        // Get Config File
        $.getJSON('config/config.js', function (data) {
            // set plugin.userConfig to default config
            userConfig = data;
            // dojo ready
            init();
        });
    });
});