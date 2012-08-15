// YOUTUBE FEATURE LAYER
dojo.provide("social.youtube");
dojo.addOnLoad(function () {
    dojo.declare("social.youtube", null, {
        // Doc: http://docs.dojocampus.org/dojo/declare#chaining
        "-chains-": {
            constructor: "manual"
        },
        // CONSTRUCTOR
        constructor: function (options) {
            this._map = options.map || null;
            if (this._map === null) {
                throw "social.youtube says: Reference to esri.Map object required";
            }
            var socialInstance = this;
            this.autopage = options.autopage || true;
            this.maxpage = options.maxpage || 4;
            this.limit = 50;
            this.baseurl = "http://gdata.youtube.com/feeds/api/videos";
            this.title = options.title || '';
            this.id = options.id || 'youtube';
            this.searchTerm = options.searchTerm || '';
            this.symbolUrl = options.symbolUrl || 'YouTube';
            this.symbolHeight = options.symbolHeight || 22.5;
            this.symbolWidth = options.symbolWidth || 18.75;
            this.popupHeight = options.popupHeight || 300;
            this.popupWidth = options.popupWidth || 400;
            this.email = options.email || '';
            this.appName = options.appName || '';
            this.range = options.range || 'this_week';
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
                        "name": "published",
                        "type": "esriFieldTypeDate",
                        "alias": "Created"
                    }, {
                        "name": "updated",
                        "type": "esriFieldTypeDate",
                        "alias": "Updated"
                    }, {
                        "name": "id",
                        "type": "esriFieldTypeString",
                        "alias": "id",
                        "length": 100
                    }, {
                        "name": "description",
                        "type": "esriFieldTypeString",
                        "alias": "description",
                        "length": 500
                    }, {
                        "name": "author",
                        "type": "esriFieldTypeString",
                        "alias": "Author",
                        "length": 100
                    }, {
                        "name": "thumbnail",
                        "type": "esriFieldTypeString",
                        "alias": "Thumbnail",
                        "length": 100
                    }, {
                        "name": "location",
                        "type": "esriFieldTypeString",
                        "alias": "Location",
                        "length": 1073741822
                    }, {
                        "name": "src",
                        "type": "esriFieldTypeString",
                        "alias": "Source",
                        "length": 100
                    }, {
                        "name": "title",
                        "type": "esriFieldTypeString",
                        "alias": "Title",
                        "length": 1073741822
                    }],
                    "globalIdField": "id",
                    "displayField": "title"
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
        // PUBLIC UPDATE
        update: function (options) {
            if (options) {
                this.searchTerm = options.searchTerm || this.searchTerm;
                this.distance = options.distance || this.distance;
                this.socialSourceX = options.socialSourceX || this.socialSourceX;
                this.socialSourceY = options.socialSourceY || this.socialSourceY;
                this.range = options.range || this.range;
            }
            this.constructQuery(this.searchTerm);
        },
        // PUBLIC POINT TO EXTENT
        pointToExtent: function (map, point, toleranceInPixel) {
            var pixelWidth = map.extent.getWidth() / map.width;
            var toleraceInMapCoords = toleranceInPixel * pixelWidth;
            return new esri.geometry.Extent(point.x - toleraceInMapCoords, point.y - toleraceInMapCoords, point.x + toleraceInMapCoords, point.y + toleraceInMapCoords, map.spatialReference);
        },
        // PUBLIC SHOW
        show: function () {
            this.featureLayer.setVisibility(true);
        },
        // Format Date Object
        formatDate: function (momentObj) {
            if (momentObj) {
                return momentObj.format("MMMM Do, YYYY") + ' at ' + momentObj.format("h:mm a");
            }
        },
        // PUBLIC HIDE
        hide: function () {
            this.featureLayer.setVisibility(false);
        },
        // PUBLIC VISIBILITY
        setVisibility: function (val) {
            if (val) {
                this.show();
            } else {
                this.hide();
            }
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
            //remove existing videos  
            if (this._map.infoWindow.isShowing) {
                this._map.infoWindow.hide();
            }
            if (this.featureLayer.graphics.length > 0) {
                this.featureLayer.applyEdits(null, null, this.featureLayer.graphics);
            }
            // clear data and stats
            this.stats = {
                geoPoints: 0,
                noGeo: 0,
                geoNames: 0
            };
            this.dataPoints = [];
            this.geocoded_ids = {};
            this.onClear();
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
        // PUBLIC GET EXTENT
        getExtent: function () {
            return esri.graphicsExtent(this.featureLayer.graphics);
        },
        // PUBLIC GET RADIUS
        getRadius: function () {
            var map = this._map;
            var extent = this.extent || map.extent;
            var radius = Math.min(621, Math.ceil(esri.geometry.getLength(new esri.geometry.Point(extent.xmin, extent.ymin, map.spatialReference), new esri.geometry.Point(extent.xmax, extent.ymin, map.spatialReference)) * 3.281 / 5280 / 2));
            return {
                radius: radius,
                center: extent.getCenter(),
                units: "mi"
            };
        },
        // PUBLIC SET EARCH EXTENT
        setSearchExtent: function (extent) {
            this.extent = extent;
        },
        // INTERNAL INFO WINDOW
        getWindowContent: function (graphic, socialInstance) {
            if (socialInstance.getWindowContentCallback) {
                if (typeof socialInstance.getWindowContentCallback === 'function') {
                    socialInstance.getWindowContentCallback(graphic);
                }
            }
            // DATE
            var date = moment(graphic.attributes.published.$t, "YYYY-MM-DD HH:mm:ss");
            // LINK THE LINKS
            var linkedText = socialInstance.parseURL(graphic.attributes.media$group.media$description.$t);
            linkedText = socialInstance.parseUsername(linkedText);
            linkedText = socialInstance.parseHashtag(linkedText);
            var content = '<div class="ytContent"><p><strong>' + graphic.attributes.title.$t + '</strong></p>';
            content += '<p class="video">';
            var videoWidth = 336;
            var videoHeight = 252;
            // IF WIDESCREEN
            if (graphic.attributes.media$group.yt$aspectRatio) {
                videoHeight = 189;
            }
            content += '<iframe width="' + videoWidth + '" height="' + videoHeight + '" src="http://www.youtube.com/embed/' + graphic.attributes.media$group.yt$videoid.$t + '" frameborder="0" allowfullscreen></iframe>';
            content += '<div class="description"><p class="descriptionText">' + linkedText + '</p></div>';
            content += '<p class="description"><a href="http://www.youtube.com/user/' + graphic.attributes.author[0].name.$t + '" target="_blank">' + graphic.attributes.author[0].name.$t + '</a></p>';
            content += '<p>' + this.formatDate(date) + '</p>';
            content += '</div>';
            return content;
        },
        // INTERNAL CONSTRUCT QUERY
        constructQuery: function (searchValue) {
            //specify search radius - has to be smaller than 1500 kilometers (932 miles)
            //by default, use a radius equal to half the width of the bottom border of the map
            var map = this._map;
            var radius = this.distance || this.getRadius().radius;
            var search = dojo.trim(searchValue);
            if (search.length === 0) {
                search = "";
            }
            var ytRange = this.range;
            var extent = this.extent || map.extent;
            var center = extent.getCenter();
            center = esri.geometry.webMercatorToGeographic(center);
            var geoPoint = center.y + "," + center.x;
            if (socialSourceX && socialSourceY) {
                geoPoint = socialSourceY + "," + socialSourceX;
            }
            this.query = {
                q: search,
                "max-results": this.limit,
                v: 2,
                location: geoPoint,
                "location-radius": radius + "mi",
                time: ytRange,
                "start-index": 1,
                alt: "json"
            };
            //make the actual YouTube API call
            this.pageCount = 1;
            this.sendRequest(this.baseurl + "?" + dojo.objectToQuery(this.query));
        },
        // INTERNAL SEND REQUEST
        sendRequest: function (url) {
            //get the results from YouTube for each page
            var deferred = esri.request({
                url: url,
                timeout: 10000,
                handleAs: "json",
                preventCache: true,
                callbackParamName: "callback",
                load: dojo.hitch(this, function (data) {
                    if (data.feed.entry) {
                        if (data.feed.entry.length > 0) {
                            this.mapResults(data);
                            //display results from multiple pages
                            if ((this.autopage) && (this.maxpage > this.pageCount) && (data.feed.entry.length >= this.limit) && (this.query)) {
                                this.pageCount++;
                                this.query["start-index"] += this.limit;
                                this.sendRequest(this.baseurl + "?" + dojo.objectToQuery(this.query));
                            } else {
                                this.onUpdateEnd();
                            }
                        } else {
                            // No results found, try another search term
                            this.onUpdateEnd();
                        }
                    } else {
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
            var k = j.feed.entry;
            dojo.forEach(k, dojo.hitch(this, function (result) {
                // SET SOCIAL MEDIA TYPE
                result.socialMediaType = id;
                // BAD WORD VARIABLE
                var badWordFound = false;
                for (k = 0; k < badWordsArray.length; k++) {
                    var found = socialInstance.findWordInText(badWordsArray[k], result.media$group.media$description.$t);
                    var found2 = socialInstance.findWordInText(badWordsArray[k], result.title.$t);
                    if (found || found2) {
                        badWordFound = true;
                        break;
                    }
                }
                var featureObj = {
                    type: 3,
                    author: result.author[0].name.$t
                };
                if (!badUsersDict.get(featureObj) && !badWordFound) {
                    // eliminate video ids which we already have on the map
                    if (this.geocoded_ids[result.id.$t]) {
                        return;
                    }
                    this.geocoded_ids[result.id.$t] = true;
                    var geoPoint = null;
                    if (result.georss$where) {
                        if (result.georss$where.gml$Point) {
                            if (result.georss$where.gml$Point.gml$pos) {
                                var g = result.georss$where.gml$Point.gml$pos.$t.split(' ');
                                geoPoint = new esri.geometry.Point(parseFloat(g[1]), parseFloat(g[0]));
                            }
                        }
                    }
                    if (geoPoint) {
                        if (isNaN(geoPoint.x) || isNaN(geoPoint.y)) {
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
        // MISC ON CLEAR
        onClear: function () {
            if (this.onClearFunction) {
                if (typeof this.onClearFunction === 'function') {
                    this.onClearFunction();
                }
            }
        },
        // MISC ON UPDATE
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
        // MISC ON ERROR
        onError: function (info) {}
    }); // end of class declaration
}); // end of addOnLoad