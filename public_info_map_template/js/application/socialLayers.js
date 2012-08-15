// GETS STRING FOR SOCIAL MEDIA POPUP TITLE
function getSmPopupTitle() {
    var graphic = pimPopup.getSelectedFeature();
    var socialString = '';
    var pagString = '';
    if (graphic) {
        if (graphic.attributes.socialMediaType) {
            var total = pimPopup.count;
            var current = pimPopup.selectedIndex + 1;
            var socialObject = false;
            // IF MORE THAN 1
            if (total > 1) {
                pagString = '<span class="pageInfo">(' + current + ' of ' + total + ')</span>';
            }
            var ytID, twID, flID, usID = 'unassigned';
            if (userConfig.socialMedia.YouTube.enabled) {
                ytID = userConfig.socialMedia.YouTube.uniqueID;
            }
            if (userConfig.socialMedia.Twitter.enabled) {
                twID = userConfig.socialMedia.Twitter.uniqueID;
            }
            if (userConfig.socialMedia.Flickr.enabled) {
                flID = userConfig.socialMedia.Flickr.uniqueID;
            }
            if (userConfig.socialMedia.Ushahidi.enabled) {
                usID = userConfig.socialMedia.Ushahidi.uniqueID;
            }
            // SET SOCIAL ICON
            switch (graphic.attributes.socialMediaType) {
            case ytID:
                socialObject = userConfig.socialMedia.YouTube;
                addReportInAppButton();
                break;
            case twID:
                socialObject = userConfig.socialMedia.Twitter;
                addReportInAppButton();
                break;
            case flID:
                socialObject = userConfig.socialMedia.Flickr;
                addReportInAppButton();
                break;
            case usID:
                socialObject = userConfig.socialMedia.Ushahidi;
                break;
            }
            if (socialObject) {
                socialString = '<span title="' + socialObject.title + '" class="iconImg" style="background-image:url(' + socialObject.legendIcon + ');"></span>' + '<span class="titleInfo">' + socialObject.title + '</span>';
            }
        }
    }
    return socialString + pagString;
}

// OVERRIDES POPUP TITLE FOR SOCIAL MEDIA TO ADD IMAGE
function overridePopupTitle() {
    pimPopup.setTitle(getSmPopupTitle());
}

// update social layers
function updateSocialLayers() {
    if (userConfig.socialMedia.YouTube.enabled) {
        // IF YOUTUBE cbox is checked
        if ($('#socialMenu .layer[data-layer=' + userConfig.socialMedia.YouTube.uniqueID + ']').hasClass("checked")) {
            $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.YouTube.uniqueID + ']').addClass("cLoading");
            youtubeLayer.update({
                searchTerm: userConfig.socialMedia.YouTube.searchTerm,
                distance: getSocialDistance("yt"),
                socialSourceX: socialSourceX,
                socialSourceY: socialSourceY,
                range: userConfig.socialMedia.YouTube.YTRange
            });
            addToActiveLayers(userConfig.socialMedia.YouTube.uniqueID);
        }
    }
    // IF TWITTER cbox is checked
    if (userConfig.socialMedia.Twitter.enabled) {
        if ($('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Twitter.uniqueID + ']').hasClass("checked")) {
            $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Twitter.uniqueID + ']').addClass("cLoading");
            twitterLayer.update({
                searchTerm: userConfig.socialMedia.Twitter.searchTerm,
                distance: getSocialDistance("tw"),
                socialSourceX: socialSourceX,
                socialSourceY: socialSourceY
            });
            addToActiveLayers(userConfig.socialMedia.Twitter.uniqueID);
        }
    }
    if (userConfig.socialMedia.Flickr.enabled) {
        // IF FLICKR cbox is checked
        if ($('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Flickr.uniqueID + ']').hasClass("checked")) {
            $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Flickr.uniqueID + ']').addClass("cLoading");
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
            addToActiveLayers(userConfig.socialMedia.Flickr.uniqueID);
        }
    }
    if (userConfig.socialMedia.Ushahidi.enabled && userConfig.proxyURL) {
        // IF Ushahidi cbox is checked
        if ($('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Ushahidi.uniqueID + ']').hasClass("checked")) {
            $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Ushahidi.uniqueID + ']').addClass("cLoading");
            ushahidiLayer.update({
                socialSourceX: socialSourceX,
                socialSourceY: socialSourceY
            });
            addToActiveLayers(userConfig.socialMedia.Ushahidi.uniqueID);
        }
    }
}

// RESET SOCIAL REFRESH TIMER
function resetSocialRefreshTimer() {
    clearTimeout(autoRefreshTimer);
    if (!(socialSourceX && socialSourceY)) {
        if (refreshIgnore > 0) {
            refreshIgnore--;
        } else {
            autoRefreshTimer = setTimeout(function () {
                updateSocialLayers();
            }, 2000);
        }
    }
}

// TOGGLE SOCIAL MEDIA LAYER ON AND OFF
function toggleMapLayerSM(layerid) {
    var ytID, twID, flID, usID = 'unassigned';
    if (userConfig.socialMedia.YouTube.enabled) {
        ytID = userConfig.socialMedia.YouTube.uniqueID;
    }
    if (userConfig.socialMedia.Twitter.enabled) {
        twID = userConfig.socialMedia.Twitter.uniqueID;
    }
    if (userConfig.socialMedia.Flickr.enabled) {
        flID = userConfig.socialMedia.Flickr.uniqueID;
    }
    if (userConfig.socialMedia.Ushahidi.enabled && userConfig.proxyURL) {
        usID = userConfig.socialMedia.Ushahidi.uniqueID;
    }
    if ($('#socialMenu li[data-layer="' + layerid + '"]').hasClass('checked')) {
        switch (layerid) {
        case ytID:
            youtubeLayer.update({
                searchTerm: userConfig.socialMedia.YouTube.searchTerm,
                distance: getSocialDistance("yt"),
                socialSourceX: socialSourceX,
                socialSourceY: socialSourceY,
                range: userConfig.socialMedia.YouTube.YTRange
            });
            break;
        case twID:
            twitterLayer.update({
                searchTerm: userConfig.socialMedia.Twitter.searchTerm,
                distance: getSocialDistance("tw"),
                socialSourceX: socialSourceX,
                socialSourceY: socialSourceY
            });
            break;
        case flID:
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
            break;
        case usID:
            ushahidiLayer.update({
                searchTerm: userConfig.socialMedia.Flickr.searchTerm,
                socialSourceX: socialSourceX,
                socialSourceY: socialSourceY
            });
            break;
        }
        addToActiveLayers(layerid);
    } else {
        switch (layerid) {
        case ytID:
            youtubeLayer.clear();
            break;
        case twID:
            twitterLayer.clear();
            break;
        case flID:
            flickrLayer.clear();
            break;
        case usID:
            ushahidiLayer.clear();
            break;
        }
        removeFromActiveLayers(layerid);
    }
}

// TOGGLE HEAT/CLUSTER
function showHeatLayer() {
    if (clusterLayer) {
        clusterLayer.setVisibility(false);
    }
    if (heatLayer) {
        heatLayer.setVisibility(true);
    } else {
        alertPIM(userConfig.heatmapUnsupportedText);
    }
}

// shows clusters and hides heatmap
function showClusterLayer() {
    if (heatLayer) {
        heatLayer.setVisibility(false);
    }
    if (clusterLayer) {
        clusterLayer.setVisibility(true);
    }
}

// TOGGLE DISPLAY AS CLUSTERS/HEATMAP
function toggleDisplayAs(obj) {
    $('#displayAs .mapButton').removeClass('buttonSelected');
    // DATA TYPE VARIABLE
    var dataType = obj.attr('data-type');
    if (dataType === 'heatmap') {
        showHeatLayer();
        socialHeatMap = 1;
    } else {
        showClusterLayer();
        socialHeatMap = 0;
    }
    hidePopup();
    setSharing();
    // CLASS
    obj.addClass('buttonSelected');
}

// HEATMAP / CLUSTERS TOGGLE
function insertSMToggle() {
    var clusterClass = '';
    var heatmapClass = '';
    var html = '';
    if (socialHeatMap) {
        heatmapClass = 'buttonSelected';
    } else {
        clusterClass = 'buttonSelected';
    }
    html += '<div id="displayAs" class="displayAs">';
    html += '<span class="label"></span>';
    html += '<span data-type="cluster" class="mapButton clusterButton buttonLeft ' + clusterClass + '"><span class="iconBlock"></span>Clusters</span>';
    html += '<span data-type="heatmap" class="mapButton heatButton buttonRight ' + heatmapClass + '"><span class="iconBlock"></span>Density</span>';
    html += '</div>';
    $('#socialMenu').append(html);
    $(document).on('click', '#displayAs .mapButton',

    function (event) {
        toggleDisplayAs($(this));
    });
}

// INSERT SOCIAL MEDIA LIST ITEM
function insertSMItem(obj) {
    if (obj) {
        // LAYER DEFAULT CLASS
        var layerClass = 'layer';
        var key;
        // CHECKED OR NOT?
        if (visLyrs) {
            // FOR EACH VISLYRS ITEM
            for (key in visLyrs) {
                // IF ITEM MATCHES THIS PARAMETER
                if (visLyrs[key] === obj.uniqueID) {
                    // SET CLASS TO CHECKED
                    layerClass = 'layer checked';
                }
            }
        } else {
            // IF LAYER IS CHECKED
            if (obj.visible === true) {
                // SET CLASS TO CHECKED
                layerClass = 'layer checked';
            }
        }
        // COMPOSE HTML LIST STRING
        var html = '';
        html += '<li data-layer="' + obj.uniqueID + '" class="' + layerClass + '">';
        html += '<div class="cover"></div>';
        if (obj.showSocialSettings) {
            html += ' <span class="cBconfig" title="' + obj.title + ' Search Settings"></span>';
        }
        if (obj.description) {
            html += '<span class="cBinfo" title="Information"></span>';
        }
        html += '<span class="toggle cBox"></span>';
        html += '<span class="toggle cBicon"><img alt="' + obj.title + '" title="' + obj.title + '" width="16" height="16" src="' + obj.legendIcon + '" /></span>';
        html += '<span class="toggle cBtitle">' + obj.title + '<span class="count"></span></span>';
        html += '<div class="clear"></div>';
        if (obj.description) {
            html += '<div class="infoHidden">';
            html += '<p>' + obj.description + '</p>';
            if (obj.searchTerm) {
                html += '<p>Filtered by: "<span class="keyword">' + obj.searchTerm + '</span>"</p>';
            }
            html += '</div>';
        }
        html += '</li>';
        // INSERT HTML
        $('#socialList').append(html);
    }
}

// SOCIAL GEO AND DISTANCE
function setSocialShareValues() {
    socialSliderValues = [{
        "label": "local",
        "values": {
            "yt": 50,
            "tw": 50,
            "fl": 50
        }
    }, {
        "label": "regional",
        "values": {
            "yt": 300,
            "tw": 500,
            "fl": 500
        }
    }, {
        "label": "national",
        "values": {
            "yt": 600,
            "tw": 1000,
            "fl": 1000
        }
    }];
    if (userConfig.socialMedia) {
        // social point
        if (socGeoTmp) {
            socialSourceX = parseFloat(socGeoTmp[0] || userConfig.socialMedia.socialGeo.x);
            socialSourceY = parseFloat(socGeoTmp[1] || userConfig.socialMedia.socialGeo.y);
        }
        // socialDistance
        switch (userConfig.socialMedia.socialDistance) {
        case 'local':
            socialSliderCurrent = 0;
            break;
        case 'regional':
            socialSliderCurrent = 1;
            break;
        case 'national':
            socialSliderCurrent = 2;
            break;
        default:
            socialSliderCurrent = 1;
            break;
        }
        // share parameter value
        if (smdTmp && smdTmp !== "") {
            socialSliderCurrent = smdTmp;
        }
    }
}

// YOUTUBE PARAMETERS
function setYTShareValues() {
    // IF LOADED FROM URL
    if (ytParam) {
        // USE URI VAL
        userConfig.socialMedia.YouTube.searchTerm = ytParam;
        // SET INPUT TO VALUE
    }
    // IF RANGE
    if (ytRange) {
        userConfig.socialMedia.YouTube.YTRange = ytRange;
    }
}

// TWITTER PARAMETERS
function setTWShareValues() {
    // IF LOADED FROM URL
    if (twParam) {
        // USE URI VAL
        userConfig.socialMedia.Twitter.searchTerm = twParam;
    }
}

// FLICKR PARAMETERS
function setFLShareValues() {
    // IF LOADED FROM URL
    if (flParam) {
        // USE URI VAL
        userConfig.socialMedia.Flickr.searchTerm = flParam;
    }
    if (flRange) {
        flRange = flRange.split(",");
        userConfig.socialMedia.Flickr.flDateFrom = flRange[0];
        userConfig.socialMedia.Flickr.flDateTo = flRange[1];
    }
}

// UPDATE HEAT MAP
function updateDataPoints() {
    var dataPoints = [];
    if (userConfig.socialMedia.Twitter.enabled) {
        if (twitterLayer.dataPoints && $('#socialList li[data-layer=' + userConfig.socialMedia.Twitter.uniqueID + ']').hasClass('checked')) {
            dataPoints = dataPoints.concat(twitterLayer.dataPoints);
        }
    }
    if (userConfig.socialMedia.YouTube.enabled) {
        if (youtubeLayer.dataPoints && $('#socialList li[data-layer=' + userConfig.socialMedia.YouTube.uniqueID + ']').hasClass('checked')) {
            dataPoints = dataPoints.concat(youtubeLayer.dataPoints);
        }
    }
    if (userConfig.socialMedia.Flickr.enabled) {
        if (flickrLayer.dataPoints && $('#socialList li[data-layer=' + userConfig.socialMedia.Flickr.uniqueID + ']').hasClass('checked')) {
            dataPoints = dataPoints.concat(flickrLayer.dataPoints);
        }
    }
    if (userConfig.socialMedia.Ushahidi.enabled && userConfig.proxyURL) {
        if (ushahidiLayer.dataPoints && $('#socialList li[data-layer=' + userConfig.socialMedia.Ushahidi.uniqueID + ']').hasClass('checked')) {
            dataPoints = dataPoints.concat(ushahidiLayer.dataPoints);
        }
    }
    if (heatLayer) {
        heatLayer.setData(dataPoints);
    }
    if (clusterLayer) {
        clusterLayer.setData(dataPoints);
    }
}

// SHOW SMFAI RESULTS
function showSMFAIResults(featureSet) {
    if (featureSet && featureSet.features) {
        dojo.forEach(featureSet.features,

        function (feature, index) {
            var featureObj = {
                type: feature.attributes.type,
                author: feature.attributes.author
            };
            var dontAdd = SMFAI_LUT.get(featureObj);
            if (!dontAdd) {
                SMFAI_LUT.add(featureObj);
            } else {
                console.log('duplicate');
            }
        });
    }
}

// GET SM LOOKUP
function getSMLookup() {
    if (userConfig.inappSvcURL && SMFAIQuery) {
        SMFAIQueryTask.execute(SMFAIQuery,

        function (fset) {
            showSMFAIResults(fset);
        });
    }
}

// Send Report Email Notification
function sendReportEmail() {
    //clear any existing timer
    clearTimeout(emailTimer);
    // pop open email after delay for apply edits
    emailTimer = setTimeout(function () {
        if (mailString) {
            window.location.href = mailString;
        }
    }, 500);
}

// Replace Flag
function replaceFlag() {
    $('#inFlag').replaceWith('<span id="inFlagComplete"><span class="LoadingComplete"></span>Content flagged</span>');
}

// REPORT IN APP
function ReportInapp() {
    if (userConfig.proxyURL && userConfig.inappSvcURL && userConfig.mailServer) {
        $.ajax({
            url: userConfig.mailServer,
            data: {
                "op": "send",
                "auth": "esriadmin",
                "author": inappFeat.attributes.author,
                "appname": userConfig.appName,
                "type": inappFeat.attributes.type,
                "content": inappFeat.attributes.content
            },
            dataType: 'jsonp',
            success: function (result, textStatus, jqXHR) {
                replaceFlag();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                sendReportEmail();
                replaceFlag();
            }
        });
    } else {
        replaceFlag();
        sendReportEmail();
    }
}

// INSERT SETTINGS PANEL HTML
function insertSettingsHTML() {
    var html = '';
    html += '<div class="cfgMenu" id="cfgMenu"></div>';
    html += '<div class="Pad ">';
    html += '<div class="clear"></div>';
    if (userConfig.socialMedia.Flickr.enabled) {
        if (userConfig.socialMedia.Flickr.showSocialSettings) {
            html += '<div class="cfgPanel" data-layer="' + userConfig.socialMedia.Flickr.uniqueID + '">';
            html += '<div class="firstDesc"><strong>Search all of ' + userConfig.socialMedia.Flickr.title + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="FLkwinput">Using this keyword</label>';
            html += '<input id="FLkwinput" class="mapInput inputSingle" type="text" size="20" value="' + userConfig.socialMedia.Flickr.searchTerm + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="flDateFrom">From Date</label>';
            html += '<input id="flDateFrom" class="mapInput inputSingle" type="text" size="20" value="' + userConfig.socialMedia.Flickr.flDateFrom + '" />';
            html += '<span class="calendarIcon"></span>';
            html += '<div class="clear"></div>';
            html += '</li>';
            html += '<li>';
            html += '<label for="flDateTo">To Date</label>';
            html += '<input id="flDateTo" class="mapInput inputSingle" type="text" size="20" value="' + userConfig.socialMedia.Flickr.flDateTo + '" />';
            html += '<span class="calendarIcon"></span>';
            html += '<div class="clear"></div>';
            html += '</li>';
            html += '<li>';
            html += '<label for="flSubmit">&nbsp;</label>';
            html += '<span id="flSubmit" class="mapSubmit">Search</span><span class="Status" id="FLLoad"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    if (userConfig.socialMedia.Twitter.enabled) {
        if (userConfig.socialMedia.Twitter.showSocialSettings) {
            html += '<div class="cfgPanel" data-layer="' + userConfig.socialMedia.Twitter.uniqueID + '">';
            html += '<div class="firstDesc"><strong>Search all of ' + userConfig.socialMedia.Twitter.title + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="TWkwinput">Using this hashtag</label>';
            html += '<input id="TWkwinput" class="mapInput inputSingle" type="text" size="20" value="' + userConfig.socialMedia.Twitter.searchTerm + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="twSubmit">&nbsp;</label>';
            html += '<span id="twSubmit" class="mapSubmit">Search</span><span class="Status" id="TWLoad"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    if (userConfig.socialMedia.YouTube.enabled) {
        if (userConfig.socialMedia.YouTube.showSocialSettings) {
            html += '<div class="cfgPanel" data-layer="' + userConfig.socialMedia.YouTube.uniqueID + '">';
            html += '<div class="firstDesc"><strong>Search all of ' + userConfig.socialMedia.YouTube.title + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="YTkwinput">Using this keyword</label>';
            html += '<input id="YTkwinput" class="mapInput inputSingle" type="text" size="20" value="' + userConfig.socialMedia.YouTube.searchTerm + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="youtuberange">From the past</label>';
            html += '<select id="youtuberange">';
            html += '<option value="today">1 day</option>';
            html += '<option value="this_week">1 week</option>';
            html += '<option value="this_month">1 month</option>';
            html += '<option value="all_time">All</option>';
            html += '</select>';
            html += '</li>';
            html += '<li>';
            html += '<label for="ytSubmit">&nbsp;</label>';
            html += '<span class="mapSubmit" id="ytSubmit">Search</span><span class="Status" id="YTLoad"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    if (userConfig.socialMedia.Ushahidi) {
        if (userConfig.socialMedia.Ushahidi.showSocialSettings) {
            html += '<div class="cfgPanel" data-layer="' + userConfig.socialMedia.Ushahidi.uniqueID + '">';
            html += '<div class="firstDesc"><strong>Search all of ' + userConfig.socialMedia.Ushahidi.title + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="uhCategories">Category</label>';
            html += '<select id="uhCategories">';
            html += '</select>';
            html += '</li>';
            html += '<li>';
            html += '<label for="uhSubmit">&nbsp;</label>';
            html += '<span class="mapSubmit" id="uhSubmit">Search</span><span class="Status" id="UHLoad"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    html += '</div>';
    html += '<div class="allOptions">';
    html += '<div class="Pad">';
    html += '<ul class="formStyle">';
    html += '<li>';
    html += '<label for="socialUseCenter">At this location</label>';
    html += '<span class="mapButton locationButton buttonSingle"><span class="iconBlock"></span></span><span class="smallTxt">Center of map</span><span title="Use center of map" id="socialUseCenter" class="resetCenter"></span>';
    html += '<div class="clear"></div>';
    html += '</li>';
    html += '<li>';
    html += '<label for="socialSlider">Within this distance</label>';
    html += '<span id="socialSlider" class="slider"></span>';
    html += '<span class="smallTxt sliderTxt"><span class="miTxt" id="socialmi">regional</span></span>';
    html += '<div class="clear"></div>';
    html += '</li>';
    html += '</ul>';
    html += '</div>';
    html += '</div>';
    $('#settingsPanel').html(html);
    //	SET SELECT MENU VALUES
    if (userConfig.socialMedia.YouTube.enabled) {
        $('#youtuberange').val(userConfig.socialMedia.YouTube.YTRange);
    }
    if (userConfig.socialMedia.Ushahidi && userConfig.socialMedia.Ushahidi.enabled && userConfig.socialMedia.Ushahidi.showSocialSettings) {
        ushahidiLayer.getCategories();
    }
}

// Social Media
function configureSocialMedia() {
    // if canvas is supported
    if (isCanvasSupported()) {
        // set up heat layer
        heatLayer = new HeatmapLayer({
            "map": map,
            "domNodeId": "heatLayer",
            "opacity": 0.85
        });
        map.addLayer(heatLayer);
    }
    // SET UP CLUSTER LAYER
    clusterLayer = new modules.ClusterLayer(null, {
        map: map,
        clusterImage: userConfig.socialMedia.clusterImage
    });
    // set default visible of the two
    if (socialHeatMap) {
        if (heatLayer) {
            heatLayer.setVisibility(true);
        } else {
            alertPIM(userConfig.heatmapUnsupportedText);
        }
        if (clusterLayer) {
            clusterLayer.setVisibility(false);
        }
    } else {
        if (heatLayer) {
            heatLayer.setVisibility(false);
        }
        if (clusterLayer) {
            clusterLayer.setVisibility(true);
        }
    }
    // REPORT TABLE
    getSMLookup();
    if (userConfig.socialMedia) {
        // APPEND LIST CONTAINER
        $('#socialMenu').html('<ul class="zebraStripes" id="socialList"></ul>');
        // IF FLICKR
        if (userConfig.socialMedia.Flickr.enabled) {
            flickrLayer = new social.flickr({
                map: map,
                autopage: true,
                maxpage: 2,
                badWords: badWordsList,
                badUsers: SMFAI_LUT,
                getWindowContentCallback: createInAppFeat,
                title: userConfig.socialMedia.Flickr.title,
                id: userConfig.socialMedia.Flickr.uniqueID,
                searchTerm: userConfig.socialMedia.Flickr.searchTerm,
                symbolUrl: userConfig.socialMedia.Flickr.symbol.url,
                symbolHeight: userConfig.socialMedia.Flickr.symbol.height,
                symbolWidth: userConfig.socialMedia.Flickr.symbol.width,
                popupWidth: userConfig.socialMedia.popupWidth,
                popupHeight: userConfig.socialMedia.popupHeight,
                email: userConfig.FAI_Email,
                appName: userConfig.appName,
                dateFrom: userConfig.socialMedia.Flickr.flDateFrom,
                dateTo: userConfig.socialMedia.Flickr.flDateTo,
                apiKey: userConfig.socialMedia.Flickr.key,
                onClear: function () {
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Flickr.uniqueID + '] .count').text('');
                },
                onUpdateEnd: function (totalCount) {
                    hideLoading($('#socialMenu ul li[data-layer=' + userConfig.socialMedia.Flickr.uniqueID + ']'), $('#FLLoad'));
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Flickr.uniqueID + '] .keyword').text(userConfig.socialMedia.Flickr.searchTerm);
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Flickr.uniqueID + '] .count').text(textCount);
                },
                onSetTitle: getSmPopupTitle
            });
            dojo.connect(flickrLayer, 'onUpdate', updateDataPoints);
            dojo.connect(flickrLayer, 'onClear', updateDataPoints);
            // INSERT HTML
            insertSMItem(userConfig.socialMedia.Flickr);
        }
        // IF TWITTER
        if (userConfig.socialMedia.Twitter.enabled) {
            twitterLayer = new social.twitter({
                map: map,
                autopage: true,
                maxpage: 4,
                badWords: badWordsList,
                badUsers: SMFAI_LUT,
                getWindowContentCallback: createInAppFeat,
                title: userConfig.socialMedia.Twitter.title,
                id: userConfig.socialMedia.Twitter.uniqueID,
                searchTerm: userConfig.socialMedia.Twitter.searchTerm,
                symbolUrl: userConfig.socialMedia.Twitter.symbol.url,
                symbolHeight: userConfig.socialMedia.Twitter.symbol.height,
                symbolWidth: userConfig.socialMedia.Twitter.symbol.width,
                popupWidth: userConfig.socialMedia.popupWidth,
                popupHeight: userConfig.socialMedia.popupHeight,
                email: userConfig.FAI_Email,
                appName: userConfig.appName,
                onClear: function () {
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Twitter.uniqueID + '] .count').text('');
                },
                onUpdateEnd: function (totalCount) {
                    hideLoading($('#socialMenu ul li[data-layer=' + userConfig.socialMedia.Twitter.uniqueID + ']'), $('#TWLoad'));
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Twitter.uniqueID + '] .keyword').text(userConfig.socialMedia.Twitter.searchTerm);
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Twitter.uniqueID + '] .count').text(textCount);
                },
                onSetTitle: getSmPopupTitle
            });
            dojo.connect(twitterLayer, 'onUpdate', updateDataPoints);
            dojo.connect(twitterLayer, 'onClear', updateDataPoints);
            // INSERT HTML
            insertSMItem(userConfig.socialMedia.Twitter);
        }
        // IF YOUTUBE
        if (userConfig.socialMedia.YouTube.enabled) {
            youtubeLayer = new social.youtube({
                map: map,
                autopage: true,
                maxpage: 4,
                badWords: badWordsList,
                badUsers: SMFAI_LUT,
                getWindowContentCallback: createInAppFeat,
                title: userConfig.socialMedia.YouTube.title,
                id: userConfig.socialMedia.YouTube.uniqueID,
                searchTerm: userConfig.socialMedia.YouTube.searchTerm,
                symbolUrl: userConfig.socialMedia.YouTube.symbol.url,
                symbolHeight: userConfig.socialMedia.YouTube.symbol.height,
                symbolWidth: userConfig.socialMedia.YouTube.symbol.width,
                popupWidth: userConfig.socialMedia.popupWidth,
                popupHeight: userConfig.socialMedia.popupHeight,
                email: userConfig.FAI_Email,
                appName: userConfig.appName,
                range: userConfig.socialMedia.YouTube.YTRange,
                onClear: function () {
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.YouTube.uniqueID + '] .count').text('');
                },
                onUpdateEnd: function (totalCount) {
                    hideLoading($('#socialMenu ul li[data-layer=' + userConfig.socialMedia.YouTube.uniqueID + ']'), $('#YTLoad'));
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.YouTube.uniqueID + '] .keyword').text(userConfig.socialMedia.YouTube.searchTerm);
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.YouTube.uniqueID + '] .count').text(textCount);
                },
                onSetTitle: getSmPopupTitle
            });
            dojo.connect(youtubeLayer, 'onUpdate', updateDataPoints);
            dojo.connect(youtubeLayer, 'onClear', updateDataPoints);
            // INSERT HTML
            insertSMItem(userConfig.socialMedia.YouTube);
        }
        // IF USHAHIDI
        if (userConfig.socialMedia.Ushahidi.enabled && userConfig.proxyURL) {
            ushahidiLayer = new social.ushahidi({
                map: map,
                apiUrl: userConfig.socialMedia.Ushahidi.apiURL,
                title: userConfig.socialMedia.Ushahidi.title,
                id: userConfig.socialMedia.Ushahidi.uniqueID,
                searchTerm: userConfig.socialMedia.Ushahidi.searchTerm,
                symbolUrl: userConfig.socialMedia.Ushahidi.symbol.url,
                symbolHeight: userConfig.socialMedia.Ushahidi.symbol.height,
                symbolWidth: userConfig.socialMedia.Ushahidi.symbol.width,
                popupWidth: userConfig.socialMedia.popupWidth,
                popupHeight: userConfig.socialMedia.popupHeight,
                email: userConfig.FAI_Email,
                appName: userConfig.appName,
                proxyURL: userConfig.proxyURL,
                onClear: function () {
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Ushahidi.uniqueID + '] .count').text('');
                },
                onUpdateEnd: function (totalCount) {
                    hideLoading($('#socialMenu ul li[data-layer=' + userConfig.socialMedia.Ushahidi.uniqueID + ']'), $('#UHLoad'));
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Ushahidi.uniqueID + '] .keyword').text(userConfig.socialMedia.Ushahidi.searchTerm);
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    $('#socialMenu .layer[data-layer=' + userConfig.socialMedia.Ushahidi.uniqueID + '] .count').text(textCount);
                },
                onSetTitle: getSmPopupTitle
            });
            dojo.connect(ushahidiLayer, 'onUpdate', updateDataPoints);
            dojo.connect(ushahidiLayer, 'onClear', updateDataPoints);
            // INSERT HTML
            insertSMItem(userConfig.socialMedia.Ushahidi);
        }
        updateSocialLayers();
        insertSMToggle();
        insertSettingsHTML();
    }

    // ONCLICK CONNECT
    dojo.connect(clusterLayer.graphics, "onClick",

    function (evt) {
        clusterArr = [];
        clusterClick = evt;
        var lyrArr = [];
        var query = new esri.tasks.Query();
        var TWDeferred = new dojo.Deferred();
        var FLDeferred = new dojo.Deferred();
        var YTDeferred = new dojo.Deferred();
        var UshDeferred = new dojo.Deferred();
        query.geometry = evt.graphic.attributes.extent;
        dojo.stopEvent(evt);
        if (userConfig.socialMedia.Twitter.enabled) {
            TWDeferred = twitterLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
            lyrArr.push(TWDeferred);
        }
        if (userConfig.socialMedia.Flickr.enabled) {
            FLDeferred = flickrLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
            lyrArr.push(FLDeferred);
        }
        if (userConfig.socialMedia.YouTube.enabled) {
            YTDeferred = youtubeLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
            lyrArr.push(YTDeferred);
        }
        if (userConfig.socialMedia.Ushahidi.enabled && userConfig.proxyURL) {
            UshDeferred = ushahidiLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
            lyrArr.push(UshDeferred);
        }
        if (lyrArr.length > 0) {
            var clusterDL = new dojo.DeferredList(lyrArr);
            clusterDL.then(function (result) {
                if (userConfig.socialMedia.Twitter.enabled) {
                    if (result[0][0] && result[0][1].length > 0) { //Twitter features have been returned
                        dojo.forEach(result[0][1],

                        function (r, index) {
                            clusterArr.push(result[0][1][index]);
                        });
                    }
                }
                if (userConfig.socialMedia.Flickr.enabled) {
                    if (result[1][0] && result[1][1].length > 0) { //Flickr features have been returned
                        dojo.forEach(result[1][1],

                        function (r, index) {
                            clusterArr.push(result[1][1][index]);
                        });
                    }
                }
                if (userConfig.socialMedia.YouTube.enabled) {
                    if (result[2][0] && result[2][1].length > 0) { //YouTube features have been returned
                        dojo.forEach(result[2][1],

                        function (r, index) {
                            clusterArr.push(result[2][1][index]);
                        });
                    }
                }
                if (userConfig.socialMedia.Ushahidi.enabled && userConfig.proxyURL) {
                    if (result[3][0] && result[3][1].length > 0) { //Ushahidi features have been returned
                        dojo.forEach(result[3][1],

                        function (r, index) {
                            clusterArr.push(result[3][1][index]);
                        });
                    }
                }
                pimPopup.setFeatures(clusterArr);
                pimPopup.show(clusterClick.mapPoint);
                pimPopup.resize(userConfig.socialMedia.popupWidth, userConfig.socialMedia.popupHeight);
                overridePopupTitle();
            },

            function (err) {
                console.log(err);
            });
        }
    });

    // ZEBRA STRIPE LAYERS
    zebraStripe($('#socialList li.layer'));

    // SETTINGS MENU GENERATOR
    var settingsCount = $('#socialList li.layer .cBconfig').size();
    if (settingsCount > -1) {
        $('#socialList li.layer:has(.cBconfig)').each(function (i) {
            var settingsID = $(this).attr('data-layer');
            var settingsClass = getButtonClass(i + 1, settingsCount);
            var settingsSource = $(this).children('.cBicon').children('img').attr('src');
            var settingsTitle = $(this).children('.cBtitle').text();
            $('#cfgMenu').append('<span data-layer="' + settingsID + '" class="mapButton ' + settingsClass + '" title="' + settingsTitle + '"><img width="16" height="16" src="' + settingsSource + '" /></span>');
        });
    }

    // INAPPROPRIATE ONCLICK
    $(document).on('click', '#inFlag',

    function (event) {
        ReportInapp();
    });
}

// CREATE IN APP FEAT
function createInAppFeat(feat) {
    inappFeat = new esri.Graphic(feat.geometry, null, null, null);
    var ytID, twID, flID, usID = 'unassigned';
    if (userConfig.socialMedia.YouTube.enabled) {
        ytID = userConfig.socialMedia.YouTube.uniqueID;
    }
    if (userConfig.socialMedia.Twitter.enabled) {
        twID = userConfig.socialMedia.Twitter.uniqueID;
    }
    if (userConfig.socialMedia.Flickr.enabled) {
        flID = userConfig.socialMedia.Flickr.uniqueID;
    }
    if (userConfig.socialMedia.Ushahidi.enabled && userConfig.proxyURL) {
        usID = userConfig.socialMedia.Ushahidi.uniqueID;
    }
    switch (feat.attributes.socialMediaType) {
    case twID:
        if (userConfig.FAI_Email) {
            mailString = 'mailto:' + userConfig.FAI_Email;
            mailString += '?subject=';
            mailString += encodeURIComponent('Twitter post from - ');
            mailString += encodeURIComponent(feat.attributes.from_user_id);
            mailString += encodeURIComponent(' - is inappropriate');
            mailString += '&body=';
            mailString += encodeURIComponent('This post from - ');
            mailString += encodeURIComponent(feat.attributes.from_user);
            mailString += encodeURIComponent(' - ');
            mailString += encodeURIComponent(feat.attributes.text);
            mailString += encodeURIComponent(' - is showing inappropriate content in the ');
            mailString += encodeURIComponent(userConfig.appName);
            mailString += encodeURIComponent(' application.');
        }
        inappFeat.setAttributes({
            "type": 2,
            "content": 'https://twitter.com/#!/' + feat.attributes.from_user_id_str + '/status/' + feat.attributes.id_str,
            "author": feat.attributes.from_user
        });
        break;
    case flID:
        if (userConfig.FAI_Email) {
            mailString = 'mailto:' + userConfig.FAI_Email;
            mailString += '?subject=';
            mailString += encodeURIComponent('Flickr image from - ');
            mailString += encodeURIComponent(feat.attributes.owner);
            mailString += encodeURIComponent(' - is inappropriate');
            mailString += '&body=';
            mailString += encodeURIComponent('This post from - ');
            mailString += encodeURIComponent(feat.attributes.owner);
            mailString += encodeURIComponent(' - ');
            mailString += encodeURIComponent('http://www.flickr.com/photos/' + feat.attributes.owner + '/' + feat.attributes.id + '/in/photostream');
            mailString += encodeURIComponent(' - is showing inappropriate content in the ');
            mailString += encodeURIComponent(userConfig.appName);
            mailString += encodeURIComponent(' application.');
        }
        inappFeat.setAttributes({
            "type": 4,
            "content": 'http://www.flickr.com/photos/' + feat.attributes.owner + '/' + feat.attributes.id + '/in/photostream',
            "author": feat.attributes.owner
        });
        break;
    case ytID:
        if (userConfig.FAI_Email) {
            mailString = 'mailto:' + userConfig.FAI_Email;
            mailString += '?subject=';
            mailString += encodeURIComponent('YouTube video from - ');
            mailString += encodeURIComponent(feat.attributes.author[0].name.$t);
            mailString += encodeURIComponent(' - is inappropriate');
            mailString += '&body=';
            mailString += encodeURIComponent('This post from - ');
            mailString += encodeURIComponent(feat.attributes.author[0].name.$t);
            mailString += encodeURIComponent(' - ');
            mailString += encodeURIComponent(feat.attributes.title.$t);
            mailString += encodeURIComponent(' - is showing inappropriate content in the ');
            mailString += encodeURIComponent(userConfig.appName);
            mailString += encodeURIComponent(' application.');
        }
        inappFeat.setAttributes({
            "type": 3,
            "content": feat.attributes.link[0].href,
            "author": feat.attributes.author[0].name.$t
        });
        break;
    default:
        alertPIM('There was an error reporting this feature, please try again.');
        inappFeat = null;
    }
}

// SET TW LINK
function setTWLink(shLink) {
    if (shLink) {
        var fullLink;
        fullLink = 'https://twitter.com/intent/tweet?' + 'url=' + encodeURIComponent(shLink) + '&text=' + encodeURIComponent(userConfig.socialMediaShareDesc) + '&hashtags=' + 'esriPIM';
        window.open(fullLink);
    }
}

// SET FB LINK
function setFBLink(fbLink) {
    if (fbLink) {
        var fullLink;
        fullLink = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(fbLink) + '&t=' + encodeURIComponent(userConfig.socialMediaShareDesc);
        window.open(fullLink);
    }
}

// Twitter and Facebook sharing
function shareLink(site) {
    if (site === "fb") {
        bitlyURL(shareURL, setFBLink);
    }
    if (site === "tw") {
        bitlyURL(shareURL, setTWLink);
    }
}