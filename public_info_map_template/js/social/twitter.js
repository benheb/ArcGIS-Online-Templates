// TWITTER
dojo.provide("social.twitter");
dojo.addOnLoad(function () {
    dojo.declare("social.twitter", null, {
        // Doc: http://docs.dojocampus.org/dojo/declare#chaining
        "-chains-": {
            constructor: "manual"
        },
        // CONSTRUCTOR
        constructor: function (options) {
            this._map = options.map || null;
            if (this._map === null) {
                throw "social.twitter says: Reference to esri.Map object required";
            }
            var socialInstance = this;
            this.autopage = options.autopage || true;
            this.maxpage = options.maxpage || 4;
            this.limit = 100;
            this.baseurl = "http://search.twitter.com/search.json";
            this.title = options.title || '';
            this.id = options.id || 'twitter';
            this.searchTerm = options.searchTerm || '';
            this.symbolUrl = options.symbolUrl || 'Twitter';
            this.symbolHeight = options.symbolHeight || 22.5;
            this.symbolWidth = options.symbolWidth || 18.75;
            this.popupHeight = options.popupHeight || 300;
            this.popupWidth = options.popupWidth || 400;
            this.email = options.email || '';
            this.appName = options.appName || '';
            this.getWindowContentCallback = options.getWindowContentCallback || false;
            this.onClearFunction = options.onClear || false;
            this.onUpdateEndFunction = options.onUpdateEnd || false;
            this.onSetTitleFunction = options.onSetTitle || false;
            this.badWords = options.badWords || [];
            this.badUsers = options.badUsers || new dojo.store.Memory();
            this.distance = options.distance;
            // FEATURE COLLECTION
            this.featureCollection = {
                layerDefinition: {
                    "geometryType": "esriGeometryPoint",
                    "drawingInfo": {
                        "renderer": {
                            "type": "simple",
                            "symbol": {
                                "type": "esriPMS",
                                "url": this.symbolUrl,
                                "contentType": "image/" + this.symbolUrl.substring(this.symbolUrl.lastIndexOf(".") + 1),
                                "width": this.symbolWidth,
                                "height": this.symbolHeight
                            }
                        }
                    },
                    "fields": [{
                        "name": "OBJECTID",
                        "type": "esriFieldTypeOID"
                    }, {
                        "name": "created_at",
                        "type": "esriFieldTypeDate",
                        "alias": "Created"
                    }, {
                        "name": "id",
                        "type": "esriFieldTypeString",
                        "alias": "id",
                        "length": 100
                    }, {
                        "name": "from_user",
                        "type": "esriFieldTypeString",
                        "alias": "User",
                        "length": 100
                    }, {
                        "name": "location",
                        "type": "esriFieldTypeString",
                        "alias": "Location",
                        "length": 1073741822
                    }, {
                        "name": "place",
                        "type": "esriFieldTypeString",
                        "alias": "Place",
                        "length": 100
                    }, {
                        "name": "text",
                        "type": "esriFieldTypeString",
                        "alias": "Text",
                        "length": 1073741822
                    }, {
                        "name": "profile_image_url",
                        "type": "esriFieldTypeString",
                        "alias": "ProfileImage",
                        "length": 255
                    }],
                    "globalIdField": "id",
                    "displayField": "from_user"
                },
                featureSet: {
                    "features": [],
                    "geometryType": "esriGeometryPoint"
                }
            };
            // INFO TEMPLATE
            this.infoTemplate = new esri.InfoTemplate();
            this.infoTemplate.setTitle(function (graphic) {
                if (this.onSetTitleFunction && typeof this.onSetTitleFunction === 'function') {
                    return this.onSetTitleFunction(graphic);
                } else {
                    return socialInstance.title;
                }
            });
            this.infoTemplate.setContent(function (graphic) {
                return socialInstance.getWindowContent(graphic, socialInstance);
            });
            // FEATURE LAYER
            this.featureLayer = new esri.layers.FeatureLayer(this.featureCollection, {
                id: this.id,
                outFields: ["*"],
                infoTemplate: this.infoTemplate,
                visible: false
            });
            this._map.addLayer(this.featureLayer);
            // CONNECT
            dojo.connect(this.featureLayer, "onClick", dojo.hitch(this, function (evt) {
                var query = new esri.tasks.Query();
                query.geometry = this.pointToExtent(this._map, evt.mapPoint, 20);
                var deferred = this.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
                this._map.infoWindow.setFeatures([deferred]);
                this._map.infoWindow.show(evt.mapPoint);
                this._map.infoWindow.resize(this.popupWidth, this.popupHeight);
            }));
            // STATS
            this.stats = {
                geoPoints: 0,
                geoNames: 0,
                noGeo: 0
            };
            this.dataPoints = [];
            this.deferreds = [];
            this.geocoded_ids = {};
            this.loaded = true;
        },
        // PUBLIC METHOD UPDATE
        update: function (options) {
            if (options) {
                this.searchTerm = options.searchTerm || this.searchTerm;
                this.distance = options.distance || this.distance;
                this.socialSourceX = options.socialSourceX || this.socialSourceX;
                this.socialSourceY = options.socialSourceY || this.socialSourceY;
            }
            this.constructQuery(this.searchTerm);
        },
        // PUBLIC POINT TO EXTENT
        pointToExtent: function (map, point, toleranceInPixel) {
            var pixelWidth = map.extent.getWidth() / map.width;
            var toleraceInMapCoords = toleranceInPixel * pixelWidth;
            return new esri.geometry.Extent(point.x - toleraceInMapCoords, point.y - toleraceInMapCoords, point.x + toleraceInMapCoords, point.y + toleraceInMapCoords, map.spatialReference);
        },
        // PUBLIC GET STATS
        getStats: function () {
            var x = this.stats;
            x.total = this.stats.geoPoints + this.stats.noGeo + this.stats.geoNames;
            return x;
        },
        // Parse Links
        parseURL: function (text) {
            return text.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function (url) {
                return '<a target="_blank" href="' + url + '">' + url + '</a>';
            });
        },
        parseUsername: function (text) {
            return text.replace(/[@]+[A-Za-z0-9-_]+/g, function (u) {
                var username = u.replace("@", "");
                return '<a target="_blank" href="http://twitter.com/' + username + '">' + u + '</a>';
            });
        },
        parseHashtag: function (text) {
            return text.replace(/[#]+[A-Za-z0-9-_]+/g, function (t) {
                var tag = t.replace("#", "%23");
                return '<a target="_blank" href="http://search.twitter.com/search?q=' + tag + '">' + t + '</a>';
            });
        },
        // PUBLIC GET POINTS

        getPoints: function () {
            return this.dataPoints;
        },
        // PUBLIC CLEAR
        clear: function () {
            //cancel any outstanding requests
            this.query = null;
            dojo.forEach(this.deferreds, function (def) {
                def.cancel();
            });
            if (this.deferreds) {
                this.deferreds.length = 0;
            }
            //remove existing tweets  
            if (this._map.infoWindow.isShowing) {
                this._map.infoWindow.hide();
            }
            if (this.featureLayer.graphics.length > 0) {
                this.featureLayer.applyEdits(null, null, this.featureLayer.graphics);
            }
            // clear stats and points
            this.stats = {
                geoPoints: 0,
                noGeo: 0,
                geoNames: 0
            };
            this.dataPoints = [];
            this.geocoded_ids = {};
            this.onClear();
        },
        // PUBLIC SHOW
        show: function () {
            this.featureLayer.setVisibility(true);
        },
        // PUBLIC HIDE
        hide: function () {
            this.featureLayer.setVisibility(false);
        },
        // PUBLIC SET VIS
        setVisibility: function (val) {
            if (val) {
                this.show();
            } else {
                this.hide();
            }
        },
        // PUBLIC GET EXTENT
        getExtent: function () {
            return esri.graphicsExtent(this.featureLayer.graphics);
        },
        // Format Date Object
        formatDate: function (momentObj) {
            if (momentObj) {
                return momentObj.format("MMMM Do, YYYY") + ' at ' + momentObj.format("h:mm a");
            }
        },
        // PUBLIC GET RADIUS
        getRadius: function () {
            var map = this._map;
            var extent = this.extent || map.extent;
            var radius = Math.min(932, Math.ceil(esri.geometry.getLength(new esri.geometry.Point(extent.xmin, extent.ymin, map.spatialReference), new esri.geometry.Point(extent.xmax, extent.ymin, map.spatialReference)) * 3.281 / 5280 / 2));
            radius = Math.round(radius, 0);
            return {
                radius: radius,
                center: map.extent.getCenter(),
                units: "mi"
            };
        },
        // PUBLIC SET SEARCH EXTENT
        setSearchExtent: function (extent) {
            this.extent = extent;
        },
        // INTERNAL GET INFO WINDOW CONTENT
        getWindowContent: function (graphic, socialInstance) {
            if (socialInstance.getWindowContentCallback) {
                if (typeof socialInstance.getWindowContentCallback === 'function') {
                    socialInstance.getWindowContentCallback(graphic);
                }
            }
            // DATE
            var date = moment(graphic.attributes.created_at);
            // LINK THE LINKS
            var linkedText = socialInstance.parseURL(graphic.attributes.text);
            linkedText = socialInstance.parseUsername(linkedText);
            linkedText = socialInstance.parseHashtag(linkedText);
            //define content for the tweet pop-up window.
            var content = '<div class="twContent">';
            if (graphic.attributes.profile_image_url) {
                content = '<a class="twImage" href="http://twitter.com/' + graphic.attributes.from_user + '" target="_blank"><img class="shadow" src="' + graphic.attributes.profile_image_url + '" width="48" height="48"></a>';
            }
            content += '<p>' + linkedText + '</p>';
            content += '<div class="clear"></div>';
            if (graphic.attributes.created_at) {
                content += '<p>' + this.formatDate(date) + '</p>';
            }
            content += '</div>';
            return content;
        },
        // INTERNAL CONSTRUCT QUERY
        constructQuery: function (searchValue) {
            var map = this._map;
            var radius = this.distance || this.getRadius().radius;
            var search = dojo.trim(searchValue);
            if (search.length === 0) {
                search = "";
            }
            var extent = this.extent || map.extent;
            var center = extent.getCenter();
            center = esri.geometry.webMercatorToGeographic(center);
            var geoPoint = center.y + "," + center.x;
            if (socialSourceX && socialSourceY) {
                geoPoint = new esri.geometry.Point(socialSourceX, socialSourceY, map.spatialReference);
            } else {
                geoPoint = new esri.geometry.Point(center.x, center.y, map.spatialReference);
            }
            this.query = {
                q: search,
                rpp: this.limit,
                result_type: "recent",
                // 'recent', 'mixed', 'popular'
                geocode: geoPoint.y + "," + geoPoint.x + "," + radius + "mi",
                page: 1
            };
            //start Twitter API call of several pages
            this.pageCount = 1;
            this.sendRequest(this.baseurl + "?" + dojo.objectToQuery(this.query));
        },
        // INTERNAL SEND REQUEST
        sendRequest: function (url) {
            //get the results from twitter for each page
            var deferred = esri.request({
                url: url,
                handleAs: "json",
                timeout: 10000,
                callbackParamName: "callback",
                preventCache: true,
                load: dojo.hitch(this, function (data) {
                    if (data.results.length > 0) {
                        this.mapResults(data);
                        //display results for multiple pages
                        if ((this.autopage) && (this.maxpage > this.pageCount) && (data.next_page !== undefined) && (this.query)) {
                            this.pageCount++;
                            this.query.page++;
                            this.sendRequest(this.baseurl + "?" + dojo.objectToQuery(this.query));
                        } else {
                            this.onUpdateEnd();
                        }
                    } else {
                        // No results found, try another search term
                        this.onUpdateEnd();
                    }
                }),
                error: dojo.hitch(this, function (e) {
                    if (deferred.canceled) {
                        console.log("Search Cancelled");
                    } else {
                        console.log("Search error : " + e.message);
                    }
                    this.onError(e);
                })
            });
            this.deferreds.push(deferred);
        },
        // INTERNAL UNBIND DEF
        unbindDef: function (dfd) {
            //if deferred has already finished, remove from deferreds array
            var index = dojo.indexOf(this.deferreds, dfd);
            if (index === -1) {
                return; // did not find
            }
            this.deferreds.splice(index, 1);
            if (!this.deferreds.length) {
                return 2; // indicates we received results from all expected deferreds
            }
            return 1; // found and removed   
        },
        // BAD WORD MATCH
        findWordInText: function (word, text) {
            if (word && text) {
                // TEXT
                var searchString = text.toLowerCase();
                // WORD
                var badWord = ' ' + word.toLowerCase() + ' ';
                // IF FOUND
                if (searchString.indexOf(badWord) > -1) {
                    return true;
                }
            }
            return false;
        },
        // INTERNAL MAP RESULTS
        mapResults: function (j) {
            var id = this.id;
            var badWordsArray = this.badWords;
            var badUsersDict = this.badUsers;
            var socialInstance = this;
            if (j.error) {
                console.log("mapResults error: " + j.error);
                this.onError(j.error);
                return;
            }
            var b = [];
            var k = j.results;
            dojo.forEach(k, dojo.hitch(this, function (result) {
                // SET SOCIAL MEDIA TYPE
                result.socialMediaType = id;
                // BAD WORD VARIABLE
                var badWordFound = false;
                for (k = 0; k < badWordsArray.length; k++) {
                    var found = socialInstance.findWordInText(badWordsArray[k], result.text);
                    if (found) {
                        badWordFound = true;
                        break;
                    }
                }
                var featureObj = {
                    type: 2,
                    author: result.from_user
                };
                if (!badUsersDict.get(featureObj) && !badWordFound) {
                    // eliminate Tweets which we have on the map
                    if (this.geocoded_ids[result.id]) {
                        return;
                    }
                    this.geocoded_ids[result.id] = true;
                    var geoPoint = null;
                    if (result.geo) {
                        var g = result.geo.coordinates;
                        geoPoint = new esri.geometry.Point(parseFloat(g[1]), parseFloat(g[0]));
                    } else {
                        var n = result.location;
                        if (n) {
                            var c, d, e, f;
                            // try some different parsings for result.location
                            if (n.indexOf("iPhone:") > -1) {
                                n = n.slice(7);
                                f = n.split(",");
                                geoPoint = new esri.geometry.Point(parseFloat(f[1]), parseFloat(f[0]));
                            } else if (n.indexOf("ÜT") > -1) {
                                n = n.slice(3);
                                e = n.split(",");
                                geoPoint = new esri.geometry.Point(parseFloat(e[1]), parseFloat(e[0]));
                            } else if (n.indexOf("T") === 1) {
                                n = n.slice(3);
                                e = n.split(",");
                                geoPoint = new esri.geometry.Point(parseFloat(e[1]), parseFloat(e[0]));
                            } else if (n.indexOf("Pre:") > -1) {
                                n = n.slice(4);
                                d = n.split(",");
                                geoPoint = new esri.geometry.Point(parseFloat(d[1]), parseFloat(d[0]));
                            } else if (n.split(",").length === 2) {
                                c = n.split(",");
                                if (c.length === 2 && parseFloat(c[1]) && parseFloat(c[0])) {
                                    geoPoint = new esri.geometry.Point(parseFloat(c[1]), parseFloat(c[0]));
                                } else {
                                    // location cannot be interpreted by this geocoder
                                    this.stats.geoNames++;
                                    return;
                                }
                            } else {
                                // location cannot be interpreted by this geocoder
                                this.stats.geoNames++;
                                return;
                            }
                        } else {
                            // location cannot be interpreted by this geocoder
                            this.stats.geoNames++;
                            return;
                        }
                    }
                    if (geoPoint) {
                        //last check to make sure we parsed it right
                        if (isNaN(geoPoint.x) || isNaN(geoPoint.y)) {
                            //discard bad geopoints
                            this.stats.noGeo++;
                        } else {
                            // convert the Point to WebMercator projection
                            var a = new esri.geometry.geographicToWebMercator(geoPoint);
                            // make the Point into a Graphic
                            var graphic = new esri.Graphic(a);
                            graphic.setAttributes(result);
                            b.push(graphic);
                            this.dataPoints.push({
                                x: a.x,
                                y: a.y,
                                symbol: esri.symbol.PictureMarkerSymbol(this.featureCollection.layerDefinition.drawingInfo.renderer.symbol),
                                attributes: result
                            });
                            this.stats.geoPoints++;
                        }
                    } else {
                        this.stats.noGeo++;
                    }
                }
            }));
            this.featureLayer.applyEdits(b, null, null);
            this.onUpdate();
        },
        // MISC ONUPDATE
        onUpdate: function () {},
        // MISC ON UPDATE END
        onUpdateEnd: function () {
            this.query = null;
            if (this.onUpdateEndFunction) {
                if (typeof this.onUpdateEndFunction === 'function') {
                    this.onUpdateEndFunction(this.dataPoints.length);
                }
            }
        },
        // MISC ON CLEAR
        onClear: function () {
            if (this.onClearFunction) {
                if (typeof this.onClearFunction === 'function') {
                    this.onClearFunction();
                }
            }
        },
        // MISC ON ERROR
        onError: function (info) {}
    }); // end of class declaration
}); // end of addOnLoad