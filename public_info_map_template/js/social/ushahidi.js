// USHAHIDI FEATURE LAYER
dojo.provide("social.ushahidi");
dojo.addOnLoad(function () {
    dojo.declare("social.ushahidi", null, {
        // Doc: http://docs.dojocampus.org/dojo/declare#chaining
        "-chains-": {
            constructor: "manual"
        },
        // CONSTRUCTOR
        constructor: function (options) {
            this._map = options.map || null;
            if (this._map === null) {
                throw "social.ushahidi says: Reference to esri.Map object required";
            }
            var socialInstance = this;
            this.limit = 1000;
            this.baseurl = options.apiUrl;
            this.title = options.title || '';
            this.id = options.id || 'ushahidi';
            this.symbolUrl = options.symbolUrl || 'Ushahidi';
            this.symbolHeight = options.symbolHeight || 22.5;
            this.symbolWidth = options.symbolWidth || 18.75;
            this.popupHeight = options.popupHeight || 300;
            this.popupWidth = options.popupWidth || 400;
            this.proxyURL = options.proxyURL;
            this.onClearFunction = options.onClear || false;
            this.onUpdateEndFunction = options.onUpdateEnd || false;
            this.onSetTitleFunction = options.onSetTitle || false;
            this.badWords = options.badWords || [];
            this.distance = options.distance || 10000;
            this.catid = 0;
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
                        "name": "id",
                        "type": "esriFieldTypeString",
                        "alias": "id",
                        "length": 100
                    }, {
                        "name": "owner",
                        "type": "esriFieldTypeString",
                        "alias": "User",
                        "length": 100
                    }, {
                        "name": "latitude",
                        "type": "esriFieldTypeDouble",
                        "alias": "latitude",
                        "length": 1073741822
                    }, {
                        "name": "longitude",
                        "type": "esriFieldTypeDouble",
                        "alias": "longitude",
                        "length": 1073741822
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
        // Get Categories
        getCategories: function () {
            var deferred = dojo.xhrPost({
                url: userConfig.proxyURL + '?' + this.baseurl,
                handleAs: "json",
                timeout: 15000,
                content: {
                    task: 'categories',
                    resp: 'json'
                },
                preventCache: true,
                handle: dojo.hitch(this, function (data) {
                    // IF NO ERROR
                    if (!parseInt(data.error.code, 10)) {
                        var categories = data.payload.categories;
                        if (categories) {
                            var html = '';
                            html += '<option value="0">All</option>';
                            for (var i = 0; i < categories.length; i++) {
                                html += '<option value="' + categories[i].category.id + '">' + categories[i].category.title + '</option>';
                            }
                            dojo.query('#uhCategories')[0].innerHTML = html;
                        }
                    } else {
                        console.log(data.error.code + ": " + data.error.message);
                    }
                })
            });
            this.deferreds.push(deferred);
        },
        // PUBLIC UPDATE
        update: function (options) {
            if (options) {
                this.socialSourceX = options.socialSourceX || this.socialSourceX;
                this.socialSourceY = options.socialSourceY || this.socialSourceY;
            }
            this.constructQuery();
        },
        // Format Date Object
        formatDate: function (momentObj) {
            if (momentObj) {
                return momentObj.format("MMMM Do, YYYY") + ' at ' + momentObj.format("h:mm a");
            }
        },
        // PUBLIC POINT TO EXTENT
        pointToExtent: function (map, point, toleranceInPixel) {
            var pixelWidth = map.extent.getWidth() / map.width;
            var toleraceInMapCoords = toleranceInPixel * pixelWidth;
            return new esri.geometry.Extent(point.x - toleraceInMapCoords, point.y - toleraceInMapCoords, point.x + toleraceInMapCoords, point.y + toleraceInMapCoords, map.spatialReference);
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
            //remove existing
            if (this._map.infoWindow.isShowing) {
                this._map.infoWindow.hide();
            }
            if (this.featureLayer.graphics.length > 0) {
                this.featureLayer.applyEdits(null, null, this.featureLayer.graphics);
            }
            // clear data
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
        // PUBLIC SHOW
        show: function () {
            this.featureLayer.setVisibility(true);
        },
        // PUBLIC HIDE
        hide: function () {
            this.featureLayer.setVisibility(false);
        },
        // PUBLIC SET VISIBILITY
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
        // PUBLIC GET RADIUS
        getRadius: function () {
            var extent = this.extent || this._map.extent;
            return {
                radius: 0,
                center: extent.getCenter(),
                units: "bbox"
            };
        },
        // PUBLIC SET SEARCH EXTENT
        setSearchExtent: function (extent) {
            this.extent = extent;
        },
        // INTERNAL GET INFO WINDOW CONTENT
        getWindowContent: function (graphic, socialInstance) {
            // FORMAT DATE
            var date = moment(graphic.attributes.incident.incidentdate, "YYYY-MM-DD HH:mm:ss");
            // LINK THE LINKS
            var linkedText = socialInstance.parseURL(graphic.attributes.incident.incidentdescription);
            linkedText = socialInstance.parseUsername(linkedText);
            linkedText = socialInstance.parseHashtag(linkedText);
            // CONTENT
            var content = '<div class="uhContent">';
            content += '<p><strong>' + graphic.attributes.incident.incidenttitle + '</strong></p>';
            // MEDIA
            if (graphic.attributes.media && graphic.attributes.media.length > 0) {
                if (parseInt(graphic.attributes.media[0].type, 10) === 1) {
                    content += '<p class="imgBlock"><a target="_blank" href="' + graphic.attributes.media[1].link_url + '"><img src="' + graphic.attributes.media[1].thumb_url + '" /></a></p>';
                } else {
                    content += '<p><a target="_blank" href="' + graphic.attributes.media[0].link + '">' + graphic.attributes.media[0].link + '</a></p>';
                }
            }
            content += '<p>' + linkedText + '</p>';
            content += '<div class="clear"></div>';
            // CATEGORIES
            if (graphic.attributes.categories && graphic.attributes.categories.length > 0) {
                content += '<p>';
                content += 'Category type(s): ';
                for (i = 0; i < graphic.attributes.categories.length; i++) {
                    content += graphic.attributes.categories[i].category.title;
                    if (i !== (graphic.attributes.categories.length - 1)) {
                        content += ', ';
                    }
                }
                content += '</p>';
            }
            /*Add support for inappropriate content filter.*/
            content += '<p>' + this.formatDate(date) + '</p>';
            content += '</div>';
            return content;
        },
        // INTERNAL CONSTRUCT QUERY
        constructQuery: function () {
            var map = this._map;
            var extent = this.extent || map.extent;
            // POINTS
            var minPoint = esri.geometry.webMercatorToGeographic(new esri.geometry.Point(extent.xmin, extent.ymin, map.spatialReference));
            var maxPoint = esri.geometry.webMercatorToGeographic(new esri.geometry.Point(extent.xmax, extent.ymax, map.spatialReference));
            //adjust for incoming geoSocialPoints
            if (socialSourceX && socialSourceY) {
                var geoPoint = esri.geometry.geographicToWebMercator(new esri.geometry.Point(socialSourceX, socialSourceY, map.spatialReference));
                minPoint = esri.geometry.webMercatorToGeographic(new esri.geometry.Point(geoPoint.x - this.distance, geoPoint.y - this.distance, map.spatialReference));
                maxPoint = esri.geometry.webMercatorToGeographic(new esri.geometry.Point(geoPoint.x + this.distance, geoPoint.y + this.distance, map.spatialReference));
            }
            var selectedCat = this.catid = dojo.query('#uhCategories')[0];
            if (selectedCat) {
                this.catid = parseInt(selectedCat.value, 10);
            }
            // POST DATA
            var postData = {
                task: 'incidents',
                by: 'bounds',
                c: '',
                sort: 0,
                sw: minPoint.x + ',' + minPoint.y,
                ne: maxPoint.x + ',' + maxPoint.y,
                resp: 'json',
                limit: this.limit,
                orderfield: 'incidentdate'
            };
            if (this.catid) {
                postData.by = 'catid';
                postData.id = this.catid;
            }
            this.sendRequest(this.proxyURL + '?' + this.baseurl, postData);
        },
        // INTERNAL SEND REQUEST
        sendRequest: function (url, postData) {
            //get the results from Ushahidi
            var deferred = dojo.xhrPost({
                url: url,
                handleAs: "json",
                content: postData,
                timeout: 15000,
                preventCache: true,
                load: dojo.hitch(this, function (data) {
                    // IF NO ERROR
                    if (!parseInt(data.error.code, 10)) {
                        if (data.payload.incidents.length > 0) {
                            this.mapResults(data);
                            this.onUpdateEnd();
                        } else {
                            // No results found, try another search term
                            this.onUpdateEnd();
                        }
                    } else {
                        console.log(data.error.code + ": " + data.error.message);
                        // No results found
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
            var socialInstance = this;
            // if error code isn't 0
            if (parseInt(j.error.code, 10)) {
                console.log("mapResults error: " + j.error.message);
                this.onError(j.error);
                return;
            }
            var b = [];
            var k = j.payload.incidents;
            // FOR EACH RESULT
            dojo.forEach(k, dojo.hitch(this, function (result) {
                // SET SOCIAL MEDIA TYPE
                result.socialMediaType = id;
                // BAD WORD VARIABLE
                var badWordFound = false;
                for (k = 0; k < badWordsArray.length; k++) {
                    // FILTER BAD DESCRIPTIONS
                    var found = socialInstance.findWordInText(badWordsArray[k], result.incident.incidentdescription);
                    // FILTER BAD TITLES
                    var found2 = socialInstance.findWordInText(badWordsArray[k], result.incident.incidenttitle);
                    if (found || found2) {
                        badWordFound = true;
                        break;
                    }
                }
                // FILTER BAD USERS. BAD! BAD USER! NO CAKE FOR YOU
                if (!badWordFound) {
                    // eliminate geo photos which we already have on the map
                    if (this.geocoded_ids[result.incident.incidentid]) {
                        return;
                    }
                    this.geocoded_ids[result.incident.incidentid] = true;
                    var geoPoint = null;
                    if (result.incident.locationlatitude) {
                        var g = [result.incident.locationlatitude, result.incident.locationlongitude];
                        geoPoint = new esri.geometry.Point(parseFloat(g[1]), parseFloat(g[0]));
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
        // MISC ON ERROR
        onError: function (info) {},
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
        }
    }); // end of class declaration
}); // end of addOnLoad