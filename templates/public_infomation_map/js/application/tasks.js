// create the basemap gallery when active
function createBasemapGallery() {
	var basemapGroup = false;
	if(!userConfig.basemaps.useArcGISOnline){
		basemapGroup = {
            title: userConfig.basemaps.title,
            owner: userConfig.basemaps.owner
        };
	}
    // basemap gallery
    basemapGallery = new esri.dijit.BasemapGallery({
        showArcGISBasemaps: userConfig.basemaps.useArcGISOnline,
        bingMapsKey: userConfig.bingMapsKey,
        basemapsGroup: basemapGroup,
        map: map
    }, dojo.create("div"));
    // start it up
    basemapGallery.startup();
    // on error
    dojo.connect(basemapGallery, "onError", function (msg) {
        console.log(msg);
    });
    // on change
    dojo.connect(basemapGallery, "onSelectionChange", baseMapChanged);
    // on initial load
    dojo.connect(basemapGallery, "onLoad", function () {
        $('#map').removeClass('mapLoading');
        selectCurrentBasemap();
    });
}

// Gets current basemap ID by its title
function getBasemapIdTitle(title) {
    var bmArray = basemapGallery.basemaps;
    for (var i = 0; i < bmArray.length; i++) {
        if (bmArray[i].title === title) {
            return bmArray[i].id;
        }
    }
    return false;
}

// Gets current basemap id by its Item ID on arcgisonline
function getBasemapId(itemId) {
    var bmArray = basemapGallery.basemaps;
    for (var i = 0; i < bmArray.length; i++) {
        if (bmArray[i].itemId === itemId) {
            return bmArray[i].id;
        }
    }
    return false;
}

// Selects a basemap by its title
function selectCurrentBasemap() {
    var bmid;
    if (WMBaseMap) {
        bmid = getBasemapId(WMBaseMap);
        if (bmid) {
            basemapGallery.select(bmid);
        }
    } else {
        bmid = getBasemapIdTitle(WMBMTitle);
        if (bmid) {
            basemapGallery.select(bmid);
        }
    }
}

// on change of basemap, update selected basemap global variable
function baseMapChanged() {
    // get currently selected basemap
    var basemap = basemapGallery.getSelected();
    // update global
    WMBaseMap = basemap.itemId;
    // set sharing links and embed code
    setSharing();
}

// Set false url param strings to false
function setFalseValues(obj) {
    // for each key
    for (var key in obj) {
        // if not a prototype
        if (obj.hasOwnProperty(key)) {
            // if is a false value string
            if (typeof obj[key] === 'string' && (obj[key].toLowerCase() === 'false' || obj[key].toLowerCase() === 'null' || obj[key].toLowerCase() === 'undefined')) {
                // set to false bool type
                obj[key] = false;
            }
        }
    }
    // return object
    return obj;
}

// Sets social media search center point
function setMenuForLatLong(PGP, locationText) {
    if (map && PGP && locationText) {
        map.setMapCursor('default');
        locationText.html(PGP.geoString);
        locationText.next('.resetCenter').show().css('display', 'inline-block');
        $('#settingsPanel .locationButton').removeClass('buttonSelected');
        setSharing();
    }
}

// resets social media center point to map center
function resetMenuForCenter(btn) {
    if (btn) {
        socialSourceX = '';
        socialSourceY = '';
        var locationText = btn.prev('.smallTxt');
        locationText.text('Center of map');
        setSharing();
        btn.hide();
    }
}

// create the offensive users filter
function createSMFOffensive() {
    // offensive users data store
    SMFAI_LUT = new dojo.store.Memory();
    if (userConfig.inappSvcURL) {
        // offensive users task
        SMFAIQueryTask = new esri.tasks.QueryTask(userConfig.inappSvcURL);
        // offensive users query
        SMFAIQuery = new esri.tasks.Query();
        SMFAIQuery.where = '1=1';
        SMFAIQuery.returnCountOnly = false;
        SMFAIQuery.returnIdsOnly = false;
        SMFAIQuery.outFields = ["*"];
    }
}

// Bad words list
function createSMFBadWords() {
    // BAD WORDS LIST
    badWordsList = [];
    if (userConfig.badWordsURL) {
        // Bad Words Task
        badWordsTask = new esri.tasks.QueryTask(userConfig.badWordsURL);
        // Bad Words Query
        badWordsQuery = new esri.tasks.Query();
        badWordsQuery.where = '1=1';
        badWordsQuery.returnGeometry = false;
        badWordsQuery.outFields = ["word"];
        badWordsTask.execute(badWordsQuery,

        function (fset) {
            for (i = 0; i < fset.features.length; i++) {
                badWordsList.push(fset.features[i].attributes.word);
            }
        });
    }
}

// SET SHARING
function setSharing(shareEmbed) {
    // SHARE PARAMATERS
    shareParams = '?';
    // Web map ID
    if (!webmap) {
        webmap = userConfig.webmap;
    }
    shareParams += 'webmap=' + webmap;
    // BASEMAP
    if (WMBaseMap) {
        shareParams += '&bm=' + encodeURIComponent(WMBaseMap);
    }
    // LOCATE
    if (locateString) {
        shareParams += '&adr=' + encodeURIComponent(locateString);
    }
    // GENERATE VISIBLE LAYERS STRING
    var visString = '';
    if (WMVisLayers) {
        visString = WMVisLayers.toString();
    } else if (visLyrs) {
        visString = visLyrs.toString();
    }
    // ACTIVE LAYERS
    if (visString) {
        shareParams += '&lrs=' + encodeURIComponent(visString);
    }
    if (userConfig.socialMedia) {
        if (userConfig.socialMedia.YouTube.enabled) {
            // YOUTUBE
            if (userConfig.socialMedia.YouTube.searchTerm) {
                shareParams += '&ytkw=' + encodeURIComponent(userConfig.socialMedia.YouTube.searchTerm);
            }
            if (userConfig.socialMedia.YouTube.YTRange) {
                shareParams += '&ytr=' + encodeURIComponent(userConfig.socialMedia.YouTube.YTRange);
            }
        }
        if (userConfig.socialMedia.Twitter.enabled) {
            // TWITTER
            if (userConfig.socialMedia.Twitter.searchTerm) {
                shareParams += '&twkw=' + encodeURIComponent(userConfig.socialMedia.Twitter.searchTerm);
            }
        }
        if (userConfig.socialMedia.Flickr.enabled) {
            // FLICKR
            if (userConfig.socialMedia.Flickr.searchTerm) {
                shareParams += '&flkw=' + encodeURIComponent(userConfig.socialMedia.Flickr.searchTerm);
            }
            if (userConfig.socialMedia.Flickr.flDateFrom && userConfig.socialMedia.Flickr.flDateTo) {
                var flickrDates = userConfig.socialMedia.Flickr.flDateFrom + ',' + userConfig.socialMedia.Flickr.flDateTo;
                shareParams += '&flr=' + encodeURIComponent(flickrDates);
            }
        }
    }
    if (socialSliderCurrent) {
        // SOCIAL MEDIA DISTANCE
        shareParams += '&smd=' + encodeURIComponent(socialSliderCurrent);
    }
    // SOCIAL MEDIA POINT
    if (socialSourceX && socialSourceY) {
        var socialSource = socialSourceX + "," + socialSourceY;
        shareParams += '&sg=' + encodeURIComponent(socialSource);
    }
    // heatmap vs cluster
    if (socialHeatMap) {
        shareParams += '&hm=' + encodeURIComponent(socialHeatMap);
    }
    // EXTENT
    shareParams += '&xmin=' + encodeURIComponent(sXmin);
    shareParams += '&ymin=' + encodeURIComponent(sYmin);
    shareParams += '&xmax=' + encodeURIComponent(sXmax);
    shareParams += '&ymax=' + encodeURIComponent(sYmax);
    // SHARE URL
    shareURL = appURL + shareParams;
    // quick embed width
    var embedWidth = mapWidth || userConfig.embedSizes.medium.width;
    var embedHeight = mapHeight || userConfig.embedSizes.medium.height;
    // embed URL
    embedURL = '<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" width="' + embedWidth + '" height="' + embedHeight + '" align="center" src="' + shareURL + '&embed=1"></iframe>';
    // EMBED URL
    if (shareEmbed) {
        // SET EMBED URL
        $('#inputEmbed').val(embedURL);
    } else {
        // Quick embed code
        $('#quickEmbedCode').val(embedURL);
        // SET SHARE URL
        $('#inputShare').val(shareURL);
    }
}

// SET VALUES FROM URL
function setValuesFromURL() {
    if (urlObject.query.adr) {
        locateString = decodeURIComponent(urlObject.query.adr);
    } else {
        locateString = "";
    }
    if (urlObject.query.webmap) {
        webmap = decodeURIComponent(urlObject.query.webmap);
    }
    if (urlObject.query.bm) {
        WMBaseMap = decodeURIComponent(urlObject.query.bm);
    }
    if (urlObject.query.xmin && urlObject.query.ymin && urlObject.query.xmax && urlObject.query.ymax) {
        sXmin = parseFloat(decodeURIComponent(urlObject.query.xmin));
        sYmin = parseFloat(decodeURIComponent(urlObject.query.ymin));
        sXmax = parseFloat(decodeURIComponent(urlObject.query.xmax));
        sYmax = parseFloat(decodeURIComponent(urlObject.query.ymax));
    }
    if (urlObject.query.ytkw) {
        ytParam = decodeURIComponent(urlObject.query.ytkw);
    }
    if (urlObject.query.twkw) {
        twParam = decodeURIComponent(urlObject.query.twkw);
    }
    if (urlObject.query.flkw) {
        flParam = decodeURIComponent(urlObject.query.flkw);
    }
    if (urlObject.query.sg) {
        socGeoTmp = decodeURIComponent(urlObject.query.sg);
    }
    // if socGeoTmp is set
    if (socGeoTmp) {
        socGeoTmp = decodeURIComponent(socGeoTmp);
        if (socGeoTmp) {
            socGeoTmp = socGeoTmp.split(',');
        }
    }
    if (urlObject.query.smd) {
        smdTmp = decodeURIComponent(urlObject.query.smd);
    }
    if (urlObject.query.lrs) {
        visLyrs = decodeURIComponent(urlObject.query.lrs);
        // if visLyrs is set
        if (visLyrs) {
            visLyrs = visLyrs.split(',');
            WMVisLayers = visLyrs;
        }
    }
    if (urlObject.query.ytr) {
        ytRange = decodeURIComponent(urlObject.query.ytr);
    }
    if (urlObject.query.twr) {
        twRange = decodeURIComponent(urlObject.query.twr);
    }
    if (urlObject.query.flr) {
        flRange = decodeURIComponent(urlObject.query.flr);
    }
    if (urlObject.query.hm) {
        socialHeatMap = decodeURIComponent(urlObject.query.hm);
    }
}

// SHOWS THE SNAKE SPINNER ON OBJECT
function showLoading(obj) {
    if (obj) {
        $('#' + obj).removeClass('LoadingComplete').addClass('Loading').show();
    }
}

// CHANGE SOCIAL MEDIA SETTINGS
function changeYouTube() {
    userConfig.socialMedia.YouTube.searchTerm = $('#YTkwinput').val();
    userConfig.socialMedia.YouTube.YTRange = $("#youtuberange").val();
    showLoading('YTLoad');
    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.YouTube.uniqueID + ']').addClass("checked cLoading");
    setSharing();
    youtubeLayer.clear();
    youtubeLayer.update({
        searchTerm: userConfig.socialMedia.YouTube.searchTerm,
        distance: getSocialDistance("yt"),
        socialSourceX: socialSourceX,
        socialSourceY: socialSourceY,
        range: userConfig.socialMedia.YouTube.YTRange
    });
}

// changes twitter keywords and such
function changeTwitter() {
    userConfig.socialMedia.Twitter.searchTerm = $('#TWkwinput').val();
    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Twitter.uniqueID + ']').addClass("checked cLoading");
    showLoading('TWLoad');
    setSharing();
    twitterLayer.clear();
    twitterLayer.update({
        searchTerm: userConfig.socialMedia.Twitter.searchTerm,
        distance: getSocialDistance("tw"),
        socialSourceX: socialSourceX,
        socialSourceY: socialSourceY
    });
}

// changes flickr keywords and such
function changeFlickr() {
    userConfig.socialMedia.Flickr.searchTerm = $('#FLkwinput').val();
    userConfig.socialMedia.Flickr.flDateFrom = $("#flDateFrom").val();
    userConfig.socialMedia.Flickr.flDateTo = $("#flDateTo").val();
    showLoading('FLLoad');
    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Flickr.uniqueID + ']').addClass("checked cLoading");
    setSharing();
    flickrLayer.clear();
    var updateObj = {
        searchTerm: userConfig.socialMedia.Flickr.searchTerm,
        distance: getSocialDistance("fl"),
        socialSourceX: socialSourceX,
        socialSourceY: socialSourceY,
        dateFrom: '',
        dateTo: ''
    };
    if (userConfig.socialMedia.Flickr.flDateFrom && userConfig.socialMedia.Flickr.flDateTo) {
        updateObj.dateFrom = moment(userConfig.socialMedia.Flickr.flDateFrom, "MM-DD-YYYY");
        updateObj.dateTo = moment(userConfig.socialMedia.Flickr.flDateTo, "MM-DD-YYYY");
    }
    flickrLayer.update(updateObj);
}

// changes ushahidi keywords and such
function changeUshahidi() {
    showLoading('UHLoad');
    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Ushahidi.uniqueID + ']').addClass("checked cLoading");
    setSharing();
    ushahidiLayer.clear();
    ushahidiLayer.update();
}

// CHANGE ACTIVE LAYERS
function getActiveLayerIndex(layerid) {
    var indexNum = WMVisLayers.indexOf(layerid);
    return indexNum;
}

// adds layer to list of visible layers
function addToActiveLayers(layerid) {
    var theIndex = getActiveLayerIndex(layerid);
    if (theIndex === -1) {
        WMVisLayers.push(layerid);
    }
    setSharing();
}

// removes layer from list of visible layers
function removeFromActiveLayers(layerid) {
    var theIndex = getActiveLayerIndex(layerid);
    for (theIndex; theIndex > -1; theIndex = getActiveLayerIndex(layerid)) {
        WMVisLayers.splice(theIndex, 1);
    }
    setSharing();
}

// INAPROPRIATE BUTTON
function removeReportInAppButton() {
    $('#inFlag, #inFlagComplete').remove();
}

// adds report button to info window
function addReportInAppButton() {
    if (userConfig.inappSvcURL) {
        removeReportInAppButton();
        $('.esriPopup .actionList').append('<a id="inFlag"><span class="inappropriate"></span>Flag as inappropriate</a>');
    }
}

// SET EXTENT
function setStartExtentValues() {
    // EXTENT
    if (sXmin && sYmin && sXmax && sYmax) {
        // LOADED FROM URL
        startExtent = new esri.geometry.Extent({
            xmin: sXmin,
            ymin: sYmin,
            xmax: sXmax,
            ymax: sYmax,
            spatialReference: map.extent.spatialReference
        });
    } else {
        // NOT LOADED FROM URL
        startExtent = map.extent;
    }
}

// SETS LOCATE STRING ON INIT
function setDefaultEmptyValues() {
    if (!userConfig.socialMedia) {
        userConfig.socialMedia = {};
    }
    if (!userConfig.embedPage) {
        userConfig.embedPage = 'embed.html';
    }
    if (!userConfig.embedSize) {
        userConfig.embedSize = {
            width: 900,
            height: 750
        };
    }
    if (!userConfig.socialMediaShareDesc) {
        userConfig.socialMediaShareDesc = '';
    }
    if (!userConfig.heatmapUnsupportedText) {
        userConfig.heatmapUnsupportedText = 'Heatmapping is unsupported on this browser.';
    }
    if (!userConfig.searchBoxPlaceholderText) {
        userConfig.searchBoxPlaceholderText = 'Find a place';
    }
    if (!userConfig.pointSymbol) {
        userConfig.pointSymbol = 'http://tmimages.esri.com/esri.com/map/bluepoint-21x29.png';
    }
    if (!userConfig.proxyURL) {
        userConfig.proxyURL = './resources/proxy.ashx';
    }
    if (!userConfig.locatorURL) {
        userConfig.locatorURL = 'http://tasks.arcgis.com/ArcGIS/rest/services/WorldLocator/GeocodeServer';
    }
    if (!userConfig.embedSizes) {
        userConfig.embedSizes = {
            small: {
                width: 480,
                height: 360
            },
            medium: {
                width: 700,
                height: 525
            },
            large: {
                width: 940,
                height: 705
            },
            maximum: {
                width: 1900,
                height: 1200
            },
            minimum: {
                width: 350,
                height: 250
            }
        };
    }
}

// SETS LOCATE STRING ON INIT
function setLocateValues() {
    if (!locateString && userConfig.locateString) {
        locateString = userConfig.locateString;
    }
}

// update position of menu for right side buttons
function updateRightMenuOffset(button, menu) {
    var buttonObj = $(button);
    var menuObj = $(menu);
    var offset = buttonObj.offset();
    if (offset) {
        var btnWidth = buttonObj.outerWidth();
        var position = $(window).width() - (offset.left + btnWidth);
        menuObj.css('right', position + 'px');
    }
}

// update position of menu for left side buttons
function updateLeftMenuOffset(button, menu) {
    var leftOffset = $(button).offset();
    if (leftOffset) {
        leftOffset = leftOffset.left;
        $(menu).css('left', leftOffset + 'px');
    }
}

// GET APPLICATION URL
function getAppLoc() {
    // Page name
    var pimPage = '/index.html';
    // split path directories
    var pimPath = window.location.pathname.split("/");
    // remove page
    pimPath.pop();
    // connect directories again
    var pimPathNew = pimPath.join("/");
    // Origin Value
    var pimOrigin = '';
    // If protocol
    if (window.location.protocol) {
        pimOrigin += window.location.protocol + '//';
    }
    // If host
    if (window.location.host) {
        pimOrigin += window.location.host;
    }
    // return
    return pimOrigin + pimPathNew + pimPage;
}

// RESIZE MAP FUNCTION
function resizeMap() {
    //clear any existing resize timer
    clearTimeout(timer);
    //create new resize timer with delay of 500 milliseconds
    timer = setTimeout(function () {
        if (map) {
            // GET HEIGHT OF MENU BAR
            var barHeight = $('#topMenuBar').height();
            // GET HEIGHT OF MENU BAR
            var chartHeight = $('#graphBar').height();
            // GET HEIGHT OF WINDOW
            var windowHeight = $(window).height();
            // SET MAP HEIGHT
            $('#map').height(windowHeight - barHeight - chartHeight);
            // RESIZE
            map.resize();
            map.reposition();
            // update location of menus
            updateLeftMenuOffset('#shareMap', '#shareControls');
            updateLeftMenuOffset('#placesButton', '#placesMenu');
            updateRightMenuOffset('#layersButton', '#layersMenu');
            updateRightMenuOffset('#basemapButton', '#basemapMenu');
            updateRightMenuOffset('#legendButton', '#legendMenu');
            updateRightMenuOffset('socialButton', '#socialMenu');
        }
    }, 500);
}

// SHOW MENU FUNCTION
function showMenu(menuObj, buttonObj) {
    $(menuObj).slideDown('fast');
    if (buttonObj) {
        $(buttonObj).addClass('barSelected');
    }
}

// HIDE LAYER INFO
function hideLayerInfo() {
    $('.listMenu ul li .infoHidden').hide();
    $('.listMenu ul li').removeClass('active');
}

// HIDES INFO WINDOW
function hidePopup() {
    pimPopup.hide();
}

// TOGGLE MENUS
function toggleMenus(menuObj, buttonObj) {
    if (menuObj) {
        hidePopup();
    }
    var currentlyOpen = $('#mapcon .slideMenu').filter(':visible');
    var currentlyOpenID = '#' + currentlyOpen.attr('id');
    hideLayerInfo();
    $('#topMenuCon .barButton').removeClass('barSelected');
    if (currentlyOpenID !== menuObj && menuObj) {
        currentlyOpen.slideUp('fast', showMenu(menuObj, buttonObj));
    } else {
        currentlyOpen.slideUp('fast');
    }
}

// CLEAR ADDRESS FUNCTION THAT REMOVES BUTTON AS WELL
function clearAddress(obj) {
    $(obj).val('');
    var iconReset = $(obj).prev('.iconClear');
    iconReset.removeClass('iconReset').attr("title", "");
}

// CHECKS TO SEE IF ADDRESS IS POPULATED
function checkAddressStatus(obj) {
    var cAVal = $(obj).val();
    var iconReset = $(obj).prev('.iconClear');
    if (cAVal !== userConfig.searchBoxPlaceholderText && cAVal !== '') {
        iconReset.addClass('iconReset').attr("title", "Clear Location");
    }
}

// Folder Layer CheckBoxes
function toggleChecked(obj) {
    var $list = $(obj).parent('li');
    if ($list.hasClass('checked')) {
        $list.removeClass('cLoading');
    } else {
        $list.addClass('cLoading');
    }
    $list.toggleClass('checked');
}

// HIDE AUTO COMPLETE
function hideAC() {
    $('#autoComplete').hide();
}

// TOGGLE SETTINGS
function toggleSettings() {
    hidePopup();
    if (settingsDialog.dialog('isOpen')) {
        settingsDialog.dialog('close');
    } else {
        settingsDialog.dialog('open');
    }
}

// TOGGLE SETTINGS CONTENT
function toggleSettingsContent() {
    $('#collapseIcon').toggleClass('iconDown');
    $('#settingsPanel').toggle();
}

// REMOVES SNAKE SPINNER FROM OBJECT AND ADDS COMPLETE ICON TO OBJECT 2 THEN FADES OUT
function hideLoading(obj, obj2) {
    if (obj) {
        obj.removeClass('cLoading');
    }
    if (obj2) {
        obj2.removeClass('Loading').addClass('LoadingComplete');
    }
}

// HIDE STUFF
function clearPopupValues() {
    pimPopup.setContent('');
    pimPopup.setTitle('');
    pimPopup.clearFeatures();
    removeReportInAppButton();
}

// clear the locate graphic
function resetLocateLayer() {
    if (locateResultLayer) {
        locateResultLayer.clear();
    }
    locateString = "";
    setSharing();
}

// hide auto complete results timeout
function resetHideACTimeout() {
    clearTimeout(acHideTimer);
    acHideTimer = setTimeout(hideAC, 6000);
}

// search box functions
function autoComplete(query) {
    var address = {
        SingleLine: query
    };
    aoGeoCoderAutocomplete.addressToLocations(address, ["*"]);
    resetHideACTimeout();
}

// LOCATE
function locate() {
    var query = $('#address').val();
    if (query) {
        var address = {
            SingleLine: query
        };
        aoGeocoder.addressToLocations(address, ["*"]);
        locateString = query;
        setSharing();
    } else {
        alertPIM("Please enter a search location.");
    }
}

// SHOW AUTOCOMPLETE
function showAutoComplete(geocodeResults) {
    var aResults = '';
    var addressPosition = $('#address').parent('.iconInput').offset();
    var partialMatch = $('#address').val();
    var regex = new RegExp('(' + partialMatch + ')', 'gi');
    var autoCompleteObj = $('#autoComplete');
    autoCompleteObj.css({
        'left': addressPosition.left + 'px',
        'top': addressPosition.top + 28 + 'px'
    });
    if (geocodeResults !== null) {
        ACObj = geocodeResults;
        aResults += '<ul class="zebraStripes">';
        var i;
        for (i = 0; i < geocodeResults.length; ++i) {
            var layerClass = '';
            if (i % 2 === 0) {
                layerClass = '';
            } else {
                layerClass = 'stripe';
            }
            aResults += '<li tabindex="' + (i + 2) + '" class="' + layerClass + '">' + geocodeResults[i].address.replace(regex, '<span>' + partialMatch + '</span>') + '</li>';
        }
        aResults += '</ul>';
        if (geocodeResults.length > 0) {
            autoCompleteObj.html(aResults).show();
        } else {
            hideAC();
        }
    }
}

// SHOW RESULTS
function showResults(geocodeResults, resultNumber) {
    // IF RESULT
    if (geocodeResults.length > 0) {
        // NUM RESULT VARIABLE
        var numResult = 0;
        // IF RESULT NUMBER
        if (resultNumber) {
            numResult = resultNumber;
        }
        // IF LOCATE RESULTS
        if (locateResultLayer) {
            locateResultLayer.clear();
            clearPopupValues();
            hidePopup();
        } else {
            locateResultLayer = new esri.layers.GraphicsLayer();
            dojo.connect(locateResultLayer, "onClick",

            function (evt) {
                pimPopup.clearFeatures();
                removeReportInAppButton();
                dojo.stopEvent(evt);
                var content = "<strong>" + evt.graphic.attributes.address + "</strong>";
                pimPopup.setContent(content);
                var title = "Location";
                pimPopup.setTitle(title);
                pimPopup.show(evt.graphic.geometry);
            });
            map.addLayer(locateResultLayer);
        }
        // CREATE POINT MARKER
        var pointMeters = esri.geometry.geographicToWebMercator(geocodeResults[numResult].location);
        var pointSymbol = new esri.symbol.PictureMarkerSymbol(userConfig.pointSymbol, 21, 29).setOffset(0, 12);
        var locationGraphic = new esri.Graphic(pointMeters, pointSymbol);
        locationGraphic.setAttributes({
            "address": geocodeResults[numResult].address
        });
        locateResultLayer.add(locationGraphic);
        // SET EXTENT VARIABLES
        var xminNew = parseFloat(geocodeResults[numResult].attributes.West_Lon);
        var yminNew = parseFloat(geocodeResults[numResult].attributes.South_Lat);
        var xmaxNew = parseFloat(geocodeResults[numResult].attributes.East_Lon);
        var ymaxNew = parseFloat(geocodeResults[numResult].attributes.North_Lat);
        // CREATE NEW EXTENT
        var newExtent = new esri.geometry.Extent({
            xmin: xminNew,
            ymin: yminNew,
            xmax: xmaxNew,
            ymax: ymaxNew,
            spatialReference: map.extent.spatialReference
        });
        // SET EXTENT CONVERTED TO WEB MERCATOR
        map.setExtent(esri.geometry.geographicToWebMercator(newExtent));
    } else {
        alertPIM("Location could not be found.");
        resetLocateLayer();
        clearAddress($('#address'));
    }
    hideAC();
}