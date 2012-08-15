// clip text to desired length
function truncate(text, length, ellipsis) {
    if (!ellipsis) {
        ellipsis = '&hellip;';
    }
    if (!length || length <= 0 || text.length < length) {
        return text;
    } else {
        return text.substr(0, length) + ellipsis;
    }
}

// Canvas detection
function isCanvasSupported() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
}

// .indexOf for lame IE
if (!Array.indexOf) {
    Array.prototype.indexOf = function (obj) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === obj) {
                return i;
            }
        }
        return -1;
    };
}

// ALERT
function alertPIM(text) {
    var dialogObj = $('#dialog-message');
    dialogObj.text(text);
    dialogObj.dialog({
        modal: true,
        title: 'Alert',
        autoOpen: true,
        closeOnEscape: true,
        resizable: true,
        draggable: true,
        width: 300,
        height: 200,
        position: 'center',
        buttons: {
            Ok: function () {
                $(this).dialog("close");
            }
        }
    });
}

// ZEBRA STRIPE OBJECT
function zebraStripe(obj) {
    obj.removeClass("stripe");
    obj.filter(":even").addClass("stripe");
}

// RETURNS BUTTON CLASS FOR MENU
function getButtonClass(i, size) {
    if ((i === 1) && (i === size)) {
        return 'buttonSingle';
    } else {
        switch (i) {
        case 1:
            return 'buttonLeft';
        case size:
            return 'buttonRight';
        default:
            return 'buttonCenter';
        }
    }
}

// returns a nice geoPoint w/ a formatted string
function prettyGeoPoint(mapPoint, label) {
    label = label || "";
    this.geo = esri.geometry.webMercatorToGeographic(mapPoint);
    this.x_float = this.geo.x;
    this.y_float = this.geo.y;
    this.x = this.geo.x.toFixed(2);
    this.y = this.geo.y.toFixed(2);
    this.geoString = 'Lat: <b id="' + label + 'LatCoord">' + this.x + '</b> Long: <b id="' + label + 'LonCoord">' + this.y + '</b>';
    return this;
}

// FORMAT DATE TO OUR LIKING
function pimDate(momentObj) {
    if (momentObj) {
        return momentObj.format("MMMM Do, YYYY") + ' at ' + momentObj.format("h:mm a");
    }
}

// RESTRICT INT
function RestrictInt(val) {
    if (isNaN(val)) {
        return false;
    } else {
        return true;
    }
}

// BIT.LY CALLBACK FUNCTION
function bitlyCallback(callback, urlString) {
    if (callback && urlString) {
        if (typeof callback === 'function') {
            callback(urlString);
        }
    }
}

// CREATE BIT.LY URL
function bitlyURL(longURL, callback) {
    if (userConfig.bitly) {
        if (userConfig.bitly.login && userConfig.bitly.key && userConfig.bitly.APIURL) {
            $.ajax({
                url: userConfig.bitly.APIURL,
                data: 'login=' + userConfig.bitly.login + '&apiKey=' + userConfig.bitly.key + '&longUrl=' + longURL + '&format=json',
                dataType: 'jsonp',
                success: function (result, textStatus, jqXHR) {
                    if (result.data.url) {
                        bitlyCallback(callback, result.data.url);
                    } else {
                        bitlyCallback(callback, longURL);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    bitlyCallback(callback, longURL);
                }
            });
        } else {
            bitlyCallback(callback, longURL);
        }
    } else {
        bitlyCallback(callback, longURL);
    }
}

// Get distances for social search based on vernacular slider
function getSocialDistance(socID) {
    var distance = 500;
    if (socID && socialSliderValues) {
        socID = socID.toLowerCase();
        if (socialSliderValues[socialSliderCurrent] && socID) {
            distance = socialSliderValues[socialSliderCurrent].values[socID];
        } else {
            distance = socialSliderValues[1].values[socID];
        }
    }
    return distance;
}

// Build a list of layers for the incoming web map.
function buildLayersList(layers) {
    //layers  arg is  response.itemInfo.itemData.operationalLayers;
    var layerInfos = [];
    dojo.forEach(layers, function (mapLayer, index) {
        var layerInfo = {};
        if (mapLayer.featureCollection && mapLayer.type !== "CSV") {
            if (mapLayer.featureCollection.showLegend === true) {
                dojo.forEach(mapLayer.featureCollection.layers, function (fcMapLayer) {
                    if (fcMapLayer.showLegend !== false) {
                        layerInfo = {
                            "layer": fcMapLayer.layerObject,
                            "title": mapLayer.title,
                            "defaultSymbol": false
                        };
                        if (mapLayer.featureCollection.layers.length > 1) {
                            layerInfo.title += " - " + fcMapLayer.layerDefinition.name;
                        }
                        layerInfos.push(layerInfo);
                    }
                });
            }
        } else if (mapLayer.showLegend !== false && mapLayer.layerObject) {
            var showDefaultSymbol = false;
            if (mapLayer.layerObject.version < 10.1 && (mapLayer.layerObject instanceof esri.layers.ArcGISDynamicMapServiceLayer || mapLayer.layerObject instanceof esri.layers.ArcGISTiledMapServiceLayer)) {
                showDefaultSymbol = true;
            }
            layerInfo = {
                "layer": mapLayer.layerObject,
                "title": mapLayer.title,
                "defaultSymbol": showDefaultSymbol
            };
            //does it have layers too? If so check to see if showLegend is false
            if (mapLayer.layers) {
                var hideLayers = dojo.map(dojo.filter(mapLayer.layers, function (lyr) {
                    return (lyr.showLegend === false);
                }), function (lyr) {
                    return lyr.id;
                });
                if (hideLayers.length) {
                    layerInfo.hideLayers = hideLayers;
                }
            }
            layerInfos.push(layerInfo);
        }
    });
    return layerInfos;
}