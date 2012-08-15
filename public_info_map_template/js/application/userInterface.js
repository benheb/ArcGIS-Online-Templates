// RIGHT SIDE MENU BUTTONS
function rightSideMenuButtons() {
    var html = '<div id="menuListCon">';
    if (userConfig.showLegendMenu && WMLayerInfos.length > 0) {
        html += '<span id="legendButton" class="barButton" title="Legend">Legend<span class="arrow"></span></span>';
        // Social MENU TOGGLE
        $(document).on('click', '#legendButton', function (event) {
            toggleMenus('#legendMenu', this);
        });
    }
    if (userConfig.showBasemapMenu) {
        html += '<span id="basemapButton" class="barButton" title="Switch Basemap">Basemap<span class="arrow"></span></span>';
        // Basemap MENU TOGGLE
        $(document).on('click', '#basemapButton', function (event) {
            toggleMenus('#basemapMenu', this);
        });
        $('#basemapMenu').html('<div class="slideScroll"><div id="baseContainer"></div></div>');
        // basemap gallery prepend to node
        if (basemapGallery) {
            dojo.place(basemapGallery.domNode, dojo.byId("baseContainer"), "first");
        }
    }
    if (userConfig.showLayersMenu) {
        html += '<span id="layersButton" class="barButton" title="Explore layers">Layers<span class="arrow"></span></span>';
        // Layers MENU TOGGLE
        $(document).on('click', '#layersButton', function (event) {
            toggleMenus('#layersMenu', this);
        });
    }
    if (userConfig.showSocialMenu) {
        html += '<span id="socialButton" class="barButton" title="Social Media">Social<span class="arrow"></span></span>';
        // Social MENU TOGGLE
        $(document).on('click', '#socialButton', function (event) {
            toggleMenus('#socialMenu', this);
        });
    }
    html += '</div>';
    $('#menuList').html(html);
    // SET DEFAULT MENU
    switch (userConfig.defaultMenu) {
    case 'basemap':
        if (userConfig.showBasemapMenu) {
            $('#basemapButton').addClass('barSelected');
            $('#basemapMenu').addClass('defaultLayer');
        }
        break;
    case 'layer':
        if (userConfig.showLayersMenu) {
            $('#layersButton').addClass('barSelected');
            $('#layersMenu').addClass('defaultLayer');
        }
        break;
    case 'social':
        if (userConfig.showSocialMenu) {
            $('#socialButton').addClass('barSelected');
            $('#socialMenu').addClass('defaultLayer');
        }
        break;
    }
    // SHOW MENU BAR
    $('#topMenuBar').show();
}

// CONFIGURE SHARE MENU
function configureShareMenu() {
    if (userConfig.showShareMenu) {
        $('#shareMap').html('<span id="shareIcon" class="barButton" title="Share this configured map"><span class="iconBlock"></span>Link<span class="arrow"></span></span></div><div class="clear">');
        var html = '';
        html += '<div class="shareContainer">';
        html += '<div class="Pad">';
        html += '<h3>Share a link to your map</h3>';
        html += '<input id="inputShare" value="" type="text" class="mapInput inputSingle" size="20" readonly>';
        html += '<span id="fbImage" title="Share on Facebook"><span class="icon"></span>Facebook</span><span id="twImage" title="Share on Twitter"><span class="icon"></span>Twitter</span></div>';
        html += '<h3>Copy/paste HTML into your web page</h3>';
        html += '<textarea rows="3" id="quickEmbedCode"></textarea>';
        if (userConfig.embedPage) {
            html += '<p id="embedOptions">Preview and customize</p>';
        }
        $('#shareControls').html(html);
        // EMBED MODAL CLICK
        if (userConfig.embedPage) {
            // on click
            $(document).on('click', '#embedOptions', function (event) {
                window.open(userConfig.embedPage + shareParams, 'pimEmbed', 'width=' + userConfig.embedSize.width + ',height=' + userConfig.embedSize.height, true);
            });
        }
        // SHARE MENU TOGGLE
        $(document).on('click', '#shareIcon', function (event) {
            toggleMenus('#shareControls', this);
        });
        // Share Buttons
        $(document).on('click', '#fbImage', function (event) {
            shareLink("fb");
            return false;
        });
        $(document).on('click', '#twImage', function (event) {
            shareLink("tw");
            return false;
        });
    }
}

// SHOW SEARCH
function configureSearchBox() {
    if (userConfig.showSearchBox) {
        var html = '<div id="locateCon" class="iconInput">';
        html += '<div id="submitAddress" class="iconSearch pushPin" title="' + userConfig.searchBoxPlaceholderText + '"></div>';
        html += '<div id="clearAddress" class="iconClear"></div>';
        html += '<input placeholder="' + userConfig.searchBoxPlaceholderText + '" id="address" title="' + userConfig.searchBoxPlaceholderText + '" value="' + locateString + '" class="default" autocomplete="off" type="text" tabindex="1">';
        html += '</div>';
        $('#locateBox').html(html);
        // SEARCH BOX JAVASCRIPT        
        $(document).on('click', '.iconInput input', function (event) {
            var cAVal2 = $(this).val();
            if (cAVal2 === userConfig.searchBoxPlaceholderText) {
                clearAddress(this);
            } else if (cAVal2 === '') {
                clearAddress(this);
            }
            hideAC();
        });
        // LISTENER FOR ADDRESS KEY UP
        $(document).on('keyup', '.iconInput input', function (event) {
            setSharing();
            checkAddressStatus(this);
        });
        $(document).on('click', '.iconInput .iconReset', function (event) {
            var obj = $(this).nextAll('input');
            clearAddress(obj);
        });
        $(document).on('click', '#submitAddress', function (event) {
            clearTimeout(timer);
            resetLocateLayer();
            locate();
            hideAC();
        });
        // AUTO COMPLETE && ADDRESS SPECIFIC ACTION LISTENERS
        var addressObj = $('#address');
        addressObj.keyup(function (e) {
            var aquery = $(this).val();
            var alength = aquery.length;
            if (e.keyCode === 13 && $(this).val() !== userConfig.searchBoxPlaceholderText && $(this).val() !== '') {
                clearTimeout(timer);
                resetLocateLayer();
                locate();
                hideAC();
            } else if (e.keyCode === 38) {
                resetHideACTimeout();
                $('#autoComplete li').filter(':last').focus();
            } else if (e.keyCode === 40) {
                resetHideACTimeout();
                $('#autoComplete li').filter(':first').focus();
            } else if (alength >= 2) {
                clearTimeout(acShowTimer);
                acShowTimer = setTimeout(function () {
                    autoComplete(aquery);
                }, 300);
            } else {
                hideAC();
            }
        });
        $(document).on('click', '#autoComplete ul li', function (event) {
            var locTxt = $(this).text();
            var locNum = $('#autoComplete ul li').index(this);
            $('#address').val(locTxt);
            locateString = locTxt;
            setSharing();
            showResults(ACObj, locNum);
            hideAC();
        });
        $(document).on('keyup', '#autoComplete ul li', function (event) {
            var locNum = $('#autoComplete ul li').index(this);
            var liSize = $('#autoComplete ul li').length;
            var newIndex;
            if (event.keyCode === 13) {
                var locTxt = $(this).text();
                $('#address').val(locTxt);
                locateString = locTxt;
                setSharing();
                showResults(ACObj, locNum);
                hideAC();
            } else if (event.keyCode === 38) {
                resetHideACTimeout();
                newIndex = locNum - 1;
                if (newIndex < 0) {
                    newIndex = liSize - 1;
                }
                $('#autoComplete li').eq(newIndex).focus();
            } else if (event.keyCode === 40) {
                resetHideACTimeout();
                newIndex = locNum + 1;
                if (newIndex >= liSize) {
                    newIndex = 0;
                }
                $('#autoComplete li').eq(newIndex).focus();
            }
        });
        $(document).on('click', '#clearAddress', function (event) {
            resetLocateLayer();
            hideAC();
        });
        // LOCATE
        if (locateString) {
            checkAddressStatus('#address');
        }
        // LOGO CLICK
        $(document).on('click', '#shareLogo', function (event) {
            map.setExtent(startExtent);
        });
        // INPUT SELECT ALL
        $(document).on('click', '#inputShare, #quickEmbedCode', function (event) {
            $(this).select();
        });
    }
}

// SHOW ABOUT BUTTON IF URL IS SET
function configureAboutText() {
    if (userConfig.aboutPage) {
        // INSERT HTML
        $('#aboutMap').html('<a class="barButton" target="_blank" href="' + userConfig.aboutPage + '" id="aboutMapLink" title="About this map">About<span class="newWindow"></span></a>');
    }
}

// LAYERS UI
function configureLayerUI() {
    // Layer CheckBoxes
    $(document).on('click', '#layersList li:not(.cLoading) .toggle', function (event) {
        toggleChecked(this);
        var changeMapVal = $(this).parent('li').attr('data-layer');
        var splitVals = changeMapVal.split(',');
        for (var i = 0; i < splitVals.length; i++) {
            toggleMapLayer(splitVals[i]);
        }
        hideLoading($('#layersList li[data-layer*="' + changeMapVal + '"]'));
    });
    // SOCIAL MEDIA CHECKBOXES
    $(document).on('click', '#socialList li:not(.cLoading) .toggle', function (event) {
        toggleChecked(this);
        var changeMapVal = $(this).parent('li').attr('data-layer');
        toggleMapLayerSM(changeMapVal);
    });
    // ToolTips
    $(document).on('click', '.listMenu ul li .cBinfo', function (event) {
        var toolTip = $(this).nextAll('.infoHidden').filter(':first');
        $('.listMenu ul li .cBinfo').removeClass('cBinfoAnim');
        if (toolTip.size() > 0) {
            if (toolTip.is(':hidden')) {
                $('.infoHidden').hide();
                $('.listMenu ul li').removeClass('active');
                $(this).parent('li').addClass('active');
                toolTip.show();
                $(this).addClass('cBinfoAnim');
            } else {
                toolTip.hide();
                $(this).parent('li').removeClass('active');
            }
        }
    });
    // CONFIG SETTINGS
    $(document).on('click', '.listMenu ul li .cBconfig', function (event) {
        hideLayerInfo();
        $('.listMenu ul li .cBconfig').removeClass('cBconfigAnim');
        var $parentLi = $(this).parent('li').attr('data-layer');
        var $panelObj = $('#settingsPanel .cfgPanel[data-layer=' + $parentLi + ']');
        var $panelBtn = $('#cfgMenu .mapButton[data-layer=' + $parentLi + ']');
        $('#cfgMenu span').removeClass('buttonSelected');
        $panelBtn.addClass('buttonSelected');
        hidePopup();
        if ($panelObj.is(':visible')) {
            settingsDialog.dialog("close");
        } else {
            $("#settingsPanel .cfgPanel").hide();
            $panelObj.show();
            $(this).addClass('cBconfigAnim');
            if (!settingsDialog.dialog('isOpen')) {
                settingsDialog.dialog('open');
            }
        }
    });
}

// SETTINGS PANEL UI
function configureSettingsUI() {
    // JQUERY UI DIALOG
    settingsDialog = $("#settingsPanel");
    settingsDialog.dialog({
        autoOpen: false,
        title: '<div id="collapseIcon"></div><div class="configIcon"></div><div id="settingsTitle">Settings</div><div class="clear"></div>',
        width: 450,
        height: 'auto',
        resizable: false,
        draggable: true,
        position: ['center', 47],
        closeOnEscape: true,
        close: function (event, ui) {
            $('#collapseIcon').removeClass('iconDown');
        }
    });
    // JQUERY UI DATE PICKER
    var dates = $("#flDateFrom, #flDateTo").datepicker({
        showButtonPanel: false,
        dateFormat: 'm-d-yy',
        numberOfMonths: 1,
        changeMonth: true,
        autoSize: true,
        onSelect: function (selectedDate) {
            var option;
            if (this.id === 'flDateFrom') {
                option = 'minDate';
                userConfig.socialMedia.Flickr.flDateFrom = selectedDate;
            } else {
                option = 'maxDate';
                userConfig.socialMedia.Flickr.flDateTo = selectedDate;
            }
            var instance = $(this).data("datepicker");
            var date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);
            dates.not(this).datepicker("option", option, date);
        }
    });
    $(document).on('click', '#settingsPanel .calendarIcon', function (event) {
        $(this).prev('input').focus();
    });
    $(document).on('click', '#collapseIcon', function (event) {
        toggleSettingsContent();
    });
    $('.ui-dialog-titlebar').dblclick(function () {
        toggleSettingsContent();
    });
    // JQUERY UI SLIDER
    if (userConfig.socialMedia) {
        $("#socialSlider").slider({
            value: socialSliderCurrent,
            min: 0,
            max: 2,
            step: 1,
            slide: function (event, ui) {
                if (socialSliderValues[ui.value]) {
                    $(this).nextAll('.smallTxt').children('.miTxt').text(socialSliderValues[ui.value].label);
                    socialSliderCurrent = ui.value;
                    userConfig.socialMedia.socialDistance = ui.value;
                }
            }
        });
        if (socialSliderValues && socialSliderCurrent) {
            if (socialSliderValues[socialSliderCurrent]) {
                $('#socialSlider').nextAll('.smallTxt').children('.miTxt').text(socialSliderValues[socialSliderCurrent].label);
            }
        }
    }
    // Settings Menu Config
    $(document).on('click', '#cfgMenu .mapButton', function (event) {
        $('#cfgMenu .mapButton').removeClass('buttonSelected');
        $(this).addClass('buttonSelected');
        var $id = $(this).attr('data-layer');
        var $panelObj = $('#settingsPanel .cfgPanel[data-layer=' + $id + ']');
        $("#settingsPanel .cfgPanel").hide();
        $panelObj.show();
    });
    // SETTINGS SUBMIT BUTTONS
    $(document).on('keypress', '#YTkwinput', function (event) {
        if (event.type === 'keypress' && event.keyCode === 13) {
            changeYouTube();
        }
    });
    $(document).on('keypress', '#TWkwinput', function (event) {
        if (event.type === 'keypress' && event.keyCode === 13) {
            changeTwitter();
        }
    });
    $(document).on('keypress', '#FLkwinput', function (event) {
        if (event.type === 'keypress' && event.keyCode === 13) {
            changeFlickr();
        }
    });
    $(document).on('click', '#ytSubmit', function (event) {
        changeYouTube();
    });
    $(document).on('click', '#twSubmit', function (event) {
        changeTwitter();
    });
    $(document).on('click', '#flSubmit', function (event) {
        changeFlickr();
    });
    $(document).on('click', '#uhSubmit', function (event) {
        changeUshahidi();
    });
    // LOCATION BUTTON
    $(document).on('click', '#settingsPanel .locationButton', function (event) {
        $(this).addClass('buttonSelected');
        var locationText = $(this).next('.smallTxt');
        locationText.next('.resetCenter').hide();
        locationText.text('click on the map to set the origin');
        map.setMapCursor("url(images/ui/crosshairblue.cur),auto");
        var PGP;
        //click universal social geo choose and then...
        socialClickListener = dojo.connect(map, "onClick", function (evt) {
            PGP = prettyGeoPoint(evt.mapPoint);
            socialSourceX = PGP.x;
            socialSourceY = PGP.y;
            setMenuForLatLong(PGP, locationText);
            updateSocialLayers();
            dojo.disconnect(socialClickListener);
        });
    });
    //set the passed variable for social geo
    if (socialSourceX && socialSourceY) {
        var prePoint = {
            "x": socialSourceX,
            "y": socialSourceY,
            "geoString": 'Lat: <b id="LatCoord">' + socialSourceX + '</b> Long: <b id="LonCoord">' + socialSourceY + '</b>'
        };
        setMenuForLatLong(prePoint, $('#settingsPanel .locationButton').next('.smallTxt'));
    }
    // RESET TO CENTER OF MAP

    $(document).on('click', '#settingsPanel .resetCenter', function (event) {
        resetMenuForCenter($(this));
    });
}

// JQUERY UI SLIDER
function createCustomSlider() {
    $('#zoomSliderDiv').html('<div id="zoomSliderPlus" title="Zoom in"></div><div id="zoomSliderCustom" title="Drag to zoom"></div><div id="zoomSliderMinus" title="Zoom out"></div>');
    var sliderMax = 20;
    if (map._params.lods) {
        sliderMax = map._params.lods.length - 1;
    }
    customMapSlider = $("#zoomSliderCustom").slider({
        min: 0,
        max: sliderMax,
        value: map.getLevel(),
        orientation: "vertical",
        range: "min",
        change: function (event, ui) {
            if (map.getLevel() !== ui.value) {
                map.setLevel(ui.value);
            }
        }
    });
    dojo.connect(map, "onZoomEnd", function (evt) {
        customMapSlider.slider("value", map.getLevel());
    });
    // ZOOM SLIDER BUTTONS
    $(document).on('click', '#zoomSliderMinus', function (event) {
        var currentValue = customMapSlider.slider("option", "value");
        customMapSlider.slider("option", "value", currentValue - 1);
    });
    $(document).on('click', '#zoomSliderPlus', function (event) {
        var currentValue = customMapSlider.slider("option", "value");
        customMapSlider.slider("option", "value", currentValue + 1);
    });
    // SHOW ZOOM SLIDER
    $('#zoomSliderDiv').show();
}

// APPLICATION TITLE
function configureAppTitle() {
    document.title = WMItemInfo.item.title;
    $('#shareLogo').html(truncate(WMItemInfo.item.title, 30));
}

// Configure
function configureUserInterface() {
    configureAppTitle();
    createCustomSlider();
    rightSideMenuButtons();
    configureShareMenu();
    configureSearchBox();
    configureAboutText();
    configureLayerUI();
    configureSettingsUI();
}