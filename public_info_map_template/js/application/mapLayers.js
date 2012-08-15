// TOGGLE MAP LAYER ON AND OFF
function toggleMapLayer(layerid) {
    var layer = map.getLayer(layerid);
    if (layer) {
        //if visible hide the layer
        if (layer.visible === true) {
            layer.hide();
            removeFromActiveLayers(layerid);
        }
        //otherwise show and add to WMVisLayers
        else {
            layer.show();
            addToActiveLayers(layerid);
        }
    }
}

// CREATE LAYER ITEMS
function configureLayers() {
    // if operational layers
    if (WMItemData.operationalLayers) {
        // if operational layers of at least 1
        if (WMItemData.operationalLayers.length > 0) {
            // set operational layers
            var WMLayers = WMItemData.operationalLayers;
            // build layers
            WMLayerInfos = buildLayersList(WMLayers);
            if (userConfig.showLegendMenu) {
                // Build Legend
                if (WMLayerInfos.length > 0) {
                    var legendDijit = new esri.dijit.Legend({
                        map: map,
                        layerInfos: WMLayerInfos
                    }, "legendContent");
                    legendDijit.startup();
                } else {
                    var legendContentNode = dojo.byId('legendContent');
                    if (legendContentNode) {
                        legendContentNode.innerHTML = 'No legend.';
                    }
                }
            }
            // ADD URL
            $('#layersMenu').html('<ul class="zebraStripes" id="layersList"></ul>');
            // EACH LAYER
            var layerClass;
            // URL layers variable
            var urlLayers = false;
            // if visible layers set in URL
            if (WMVisLayers && WMVisLayers.length > 0 && WMVisLayers !== '') {
                urlLayers = true;
            }
            // for each layer
            for (var i = 0; i < WMLayers.length; i++) {
                // GENERATE LAYER HTML
                var html = '';
                // if layer object
                if (WMLayers[i]) {
                    // default layer class
                    layerClass = 'layer';
                    // layer ids
                    var dataLayers = '';
                    // key variable
                    var key;
                    if (WMLayers[i].featureCollection) {
                        // if feature collection layers
                        if (WMLayers[i].featureCollection.layers) {
                            // for each feature collection
                            for (var k = 0; k < WMLayers[i].featureCollection.layers.length; k++) {
                                // if URL layers set
                                if (urlLayers) {
                                    // set layer visibility to false
                                    WMLayers[i].featureCollection.layers[k].visibility = false;
                                    map.getLayer(WMLayers[i].featureCollection.layers[k].id).hide();
                                    // for each visible layer array item
                                    for (key in WMVisLayers) {
                                        // if current layer ID matches visible layer item
                                        if (WMVisLayers[key] === WMLayers[i].featureCollection.layers[k].id) {
                                            // set visibility to true
                                            WMLayers[i].featureCollection.layers[k].visibility = true;
                                            map.getLayer(WMLayers[i].featureCollection.layers[k].id).show();
                                        }
                                    }
                                }
                                // if layer visibility is true
                                if (WMLayers[i].featureCollection.layers[k].visibility === true) {
                                    // set layer class to checked
                                    layerClass = 'layer checked';
                                    // add to active layers array
                                    addToActiveLayers(WMLayers[i].featureCollection.layers[k].id);
                                }
                                // data layer attrubute
                                dataLayers += WMLayers[i].featureCollection.layers[k].id;
                                // if not last feature collection add comma for splitting
                                if (k !== (WMLayers[i].featureCollection.layers.length - 1)) {
                                    dataLayers += ",";
                                }
                            }
                        }
                        // csv
                        else {
                            // if URL layers set
                            if (urlLayers) {
                                map.getLayer(WMLayers[i].id).hide();
                                WMLayers[i].visibility = false;
                                // for each visible layer array item
                                for (key in WMVisLayers) {
                                    // if current layer ID matches visible layer item
                                    if (WMVisLayers[key] === WMLayers[i].id) {
                                        // set visibility to true
                                        WMLayers[i].visibility = true;
                                        map.getLayer(WMLayers[i].id).show();
                                    }
                                }
                            }
                            // if layer visibility is true
                            if (WMLayers[i].visibility === true) {
                                // set layer class to checked
                                layerClass = 'layer checked';
                                // add to active layers array
                                addToActiveLayers(WMLayers[i].id);
                            }
                            // data layer attrubute
                            dataLayers += WMLayers[i].id;
                        }
                    } else {
                        // if URL layers set
                        if (urlLayers) {
                            WMLayers[i].visibility = false;
                            map.getLayer(WMLayers[i].id).hide();
                            // for each visible layer array item
                            for (key in WMVisLayers) {
                                // if current layer ID matches visible layer item
                                if (WMVisLayers[key] === WMLayers[i].id) {
                                    // set visibility to true
                                    WMLayers[i].visibility = true;
                                    map.getLayer(WMLayers[i].id).show();
                                }
                            }
                        }
                        // if layer visibility is true
                        if (WMLayers[i].visibility === true) {
                            // set layer class to checked
                            layerClass = 'layer checked';
                            // add to active layers array
                            addToActiveLayers(WMLayers[i].id);
                        }
                        // data layer attrubute
                        dataLayers += WMLayers[i].id;
                    }
                    // COMPOSE HTML LIST STRING
                    html += '<li class="' + layerClass + '" data-layer="' + dataLayers + '">';
                    html += '<div class="cover"></div>';
                    html += '<span class="cBinfo" title="Information"></span>';
                    html += '<span class="toggle cBox"></span>';
                    html += '<span class="toggle cBtitle" title="' + WMLayers[i].title + '">' + truncate(WMLayers[i].title.replace(/[\-_]/g, " "), 33) + '</span>';
                    html += '<div class="clear"></div>';
                    html += '<div class="infoHidden">';
                    if (WMLayers[i].resourceInfo) {
                    	html += '<div class="infoHiddenScroll">';
                    	if(WMLayers[i].resourceInfo.serviceDescription || WMLayers[i].resourceInfo.description){
	                    	if(WMLayers[i].resourceInfo.serviceDescription){
	                    		html += decodeURIComponent(WMLayers[i].resourceInfo.serviceDescription);
	                    	}
	                    	if(WMLayers[i].resourceInfo.description){
	                    		html += decodeURIComponent(WMLayers[i].resourceInfo.description);
	                    	}
                    	}
                    	html += '</div>';
                    } else {
                        html += '<div>No description.</div>';
                    }
                    if (WMLayers[i].url) {
                        html += '<div class="serviceUrl"><a href="' + WMLayers[i].url + '" target="_blank">Map Server URL</a></div>';
                    }
                    html += '<div class="transSlider formStyle"><span class="transLabel">Transparency</span><span data-opacity="' + WMLayers[i].opacity + '" data-layer-id="' + dataLayers + '" class="uiSlider slider"></span></div>';
                    html += '</div>';
                }
                html += '</li>';
                // APPEND HTML
                $('#layersList').append(html);
                setSharing();
            }
            // INIT SLIDERS
            $(".uiSlider").slider({
                value: 100,
                min: 1,
                max: 100,
                step: 1,
                create: function (event, ui) {
                    var opacity = $(this).attr('data-opacity');
                    var newValue = parseFloat(opacity) * 100;
                    $(this).slider("option", "value", newValue);
                },
                slide: function (event, ui) {
                    var layerID = $(this).attr('data-layer-id');
                    var newValue = (ui.value / 100);
                    var splitVals = layerID.split(',');
                    for (var j = 0; j < splitVals.length; j++) {
                        map.getLayer(splitVals[j]).setOpacity(newValue);
                    }
                }
            });
            zebraStripe($('#layersList li.layer'));
        } else {
            userConfig.showLayersMenu = false;
        }
        // IF SCALEBAR IN CONFIG
        if (userConfig.showScalebar) {
            xScalebar = new esri.dijit.Scalebar({
                map: map,
                attachTo: "bottom-left",
                scalebarUnit: 'metric'
            });
        }
    }
}
// END