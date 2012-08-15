dojo.provide("modules.ClusterLayer");
dojo.addOnLoad(function () {
    dojo.declare("modules.ClusterLayer", null, {
        // Doc: http://docs.dojocampus.org/dojo/declare#chaining
        "-chains-": {
            constructor: "manual"
        },
        // constructor
        constructor: function (data, options) {
            this.data = data;
            // GRID SIZE. 144 so the 72x72 icons won't overlap much
            this.pxgrid = options.pixelsSquare || 144;
            // number of break point ranges
            this.numRangeBreaks = options.numRangeBreaks || 5; // minimum 2.
            // use dynamic ranges. If off, uses static range values.
            this.useDynamicRanges = options.useDynamicRanges || true;
            // minimum graphic size in points
            this.minDynamicGraphicSize = options.minDynamicGraphicSize || 24; // 32 x 32
            // maximum grahpic size in points
            this.maxDynamicGraphicSize = options.maxDynamicGraphicSize || 54; // 72 x 72
            // offset from corners of grid
            this.cornerOffset = options.cornerOffset || 15;
            // default text color
            this.clusterTextColor = options.clusterTextColor || [255, 255, 255];
            // text size
            this.clusterTextSize = options.clusterTextSize || "12px";
            // text style
            this.clusterTextStyle = esri.symbol.Font.STYLE_NORMAL;
            // text variant
            this.clusterTextVariant = esri.symbol.Font.VARIANT_NORMAL;
            // text weight
            this.clusterTextWeight = esri.symbol.Font.WEIGHT_NORMAL;
            // text font family
            this.clusterTextFamily = options.clusterTextFamily || "Verdana, Geneva, sans-serif";
            // default static ranges variable
            this.staticRanges = options.staticRanges || [
            // 0
            {
                min: 2,
                max: 5,
                width: 24,
                height: 24,
                textrgb: [255, 255, 255]
            },
            // 1
            {
                min: 6,
                max: 25,
                width: 39,
                height: 39,
                textrgb: [255, 255, 255]
            },
            // 2
            {
                min: 26,
                max: 999,
                width: 54,
                height: 54,
                textrgb: [255, 255, 255]
            }];
            // break point pattern variable
            this.pattern = [];
            // map
            this._map = options.map;
            // graphics
            this.graphics = new esri.layers.GraphicsLayer({
                id: "ClusterGraphicsLayer"
            });
            // if loaded
            if (this._map.loaded) {
                // add graphics layer
                this._map.addLayer(this.graphics);
            } else {
                // onload
                dojo.connect(this._map, "onLoad", dojo.hitch(this, function () {
                    // add graphics layer
                    this._map.addLayer(this.graphics);
                }));
            }
            // set global max
            this.globalMax = true;
            // regrid connect
            dojo.connect(this._map, "onZoomEnd", this, this.regrid);
            // calculate break points
            this.setClusterBreaks();
            // draw
            this.draw();
            // set loaded
            this.loaded = true;
            // default cluster image
            this.clusterImage = options.clusterImage || '/images/map/cluster72x72.png';
        },
        setOpacity: function (opacity) {
            if (this.opacity !== opacity) {
                this.onOpacityChange(this.opacity = opacity);
            }
        },
        regrid: function () {
            this.setData(this.lastDataset);
        },
        /*****************
         * Public Methods
         *****************/
        setData: function (dataPoints) {
            this.lastDataset = dataPoints;
            var clusteredData = {};
            var gridSquaresWide = (parseInt(dojo.coords(this._map.id).w, 10)) / (parseInt(this.pxgrid, 10));
            var gridSquareDivisor = (this._map.extent.xmax - this._map.extent.xmin) / gridSquaresWide;
            clusteredData.gridsquare = gridSquareDivisor;
            dojo.forEach(dataPoints, function (geoPoint) {
                var geoKey = Math.round(geoPoint.y / gridSquareDivisor) + "|" + Math.round(geoPoint.x / gridSquareDivisor);
                if (clusteredData[geoKey]) {
                    clusteredData[geoKey].count += 1;
                    clusteredData[geoKey].avgx += ((geoPoint.x - clusteredData[geoKey].avgx) / clusteredData[geoKey].count);
                    clusteredData[geoKey].avgy += ((geoPoint.y - clusteredData[geoKey].avgy) / clusteredData[geoKey].count);
                } else {
                    clusteredData[geoKey] = {
                        count: 1,
                        avgx: geoPoint.x,
                        avgy: geoPoint.y,
                        symbol: geoPoint.symbol,
                        attributes: geoPoint.attributes
                    };
                }
            });
            this.data = {
                data: clusteredData,
                noDataValue: [0]
            };
            clusteredData = {};
            this.setClusterBreaks();
            this.draw();
        },
        clear: function () {
            this.graphics.clear();
        },
        getRange: function () {
            var data = this.data;
            if (!data) {
                return;
            }
            var dataArray = data.data,
                noDataValue = data.noDataValue[0];
            var maxValue = 0;
            var minValue = 0;
            var map = this._map;
            var key;
            for (key in dataArray) {
                if (dataArray.hasOwnProperty(key)) {
                    var val = dataArray[key];
                    if (val !== noDataValue) {
                        var onMapPix;
                        if (!this.globalMax) {
                            if (key.split("|").length === 4) {
                                onMapPix = map.toScreen(esri.geometry.Point(((parseFloat(key.split("|")[0], 10) + parseFloat(key.split("|")[1], 10)) * dataArray.gridsquare / 2), ((parseFloat(key.split("|")[2], 10) + parseFloat(key.split("|")[3], 10)) * dataArray.gridsquare / 2), map.spatialReference));
                            } else if (key.split("|").length === 2) {
                                onMapPix = map.toScreen(esri.geometry.Point(key.split("|")[1] * dataArray.gridsquare / 2, key.split("|")[0] * dataArray.gridsquare / 2), map.spatialReference);
                            }
                            if (onMapPix) {
                                if (val > maxValue) {
                                    maxValue = val;
                                }
                                if (val < minValue) {
                                    minValue = val;
                                }
                            }
                        } else {
                            if (val > maxValue) {
                                maxValue = val;
                            }
                            if (val < minValue) {
                                minValue = val;
                            }
                        }
                    }
                }
            }
            return {
                min: minValue,
                max: maxValue
            };
        },
        setVisibility: function (val) {
            this.graphics.setVisibility(val);
        },
        setClusterBreaks: function () {
            // clear thiz
            this.clear();
            // IF NO DATA
            if (!this.data) {
                return;
            }
            // DATA
            var data = this.data,
                dataArray = data.data;
            // default variables
            var clusterNums = [];
            var breaks = 0;
            var graphicBreaks = 0;
            var minNum = 0;
            var maxNum = 0;
            var minGraphic = this.minDynamicGraphicSize;
            var maxGraphic = this.maxDynamicGraphicSize;
            // set pattern for singles with no clusters
            this.pattern[0] = {};
            this.pattern[0].min = 0;
            this.pattern[0].max = 1;
            var key;
            // FOR EACH
            for (key in dataArray) {
                if (dataArray.hasOwnProperty(key)) {
                    var breakCount;
                    // cluster size
                    var count = parseInt(dataArray[key].count, 10);
                    // if dynamic ranges
                    if (this.useDynamicRanges) {
                        // set break count
                        breakCount = this.numRangeBreaks;
                        if (breakCount < 2) {
                            breakCount = 2;
                        }
                    } else {
                        // set static break count
                        breakCount = this.staticRanges.length;
                    }
                    // if cluster
                    if (count && count > 1) {
                        // cluster count array
                        clusterNums.push(count);
                        // CLUSTER MIN/MAX
                        minNum = Math.min.apply(Math, clusterNums);
                        maxNum = Math.max.apply(Math, clusterNums);
                        // calculate breaks
                        breaks = Math.ceil((maxNum - minNum) / breakCount);
                        graphicBreaks = Math.ceil((maxGraphic - minGraphic) / (breakCount - 1));
                        // DYNAMIC BREAK POINTS
                        if (this.useDynamicRanges) {
                            // set patterns for clusters
                            for (i = 1; i <= breakCount; i++) {
                                // set common
                                this.pattern[i] = {};
                                this.pattern[i].symbol = {
                                    "type": "esriPMS",
                                    "url": this.clusterImage,
                                    "contentType": "image/" + this.clusterImage.substring(this.clusterImage.lastIndexOf(".") + 1)
                                };
                                // if first
                                if (i === 1) {
                                    this.pattern[i].min = minNum;
                                    this.pattern[i].max = (breaks);
                                    this.pattern[i].symbol.width = minGraphic;
                                    this.pattern[i].symbol.height = minGraphic;
                                }
                                // if last
                                else if (i === breakCount) {
                                    this.pattern[i].min = (breaks * (i - 1)) + 1;
                                    this.pattern[i].max = maxNum;
                                    this.pattern[i].symbol.width = maxGraphic;
                                    this.pattern[i].symbol.height = maxGraphic;
                                }
                                // otherwise
                                else {
                                    this.pattern[i].min = (breaks * (i - 1)) + 1;
                                    this.pattern[i].max = (breaks * i);
                                    this.pattern[i].symbol.width = minGraphic + ((i - 1) * graphicBreaks);
                                    this.pattern[i].symbol.height = minGraphic + ((i - 1) * graphicBreaks);
                                }
                            }
                        }
                        // STATIC BREAK POINTS
                        else {
                            // for each static breakpoint
                            for (i = 0; i < breakCount; i++) {
                                // breakpoint var
                                this.pattern[i + 1] = {};
                                // set symbol
                                this.pattern[i + 1].symbol = {
                                    "type": "esriPMS",
                                    // image
                                    "url": this.clusterImage,
                                    // image type
                                    "contentType": "image/" + this.clusterImage.substring(this.clusterImage.lastIndexOf(".") + 1),
                                    // width
                                    "width": this.staticRanges[i].width,
                                    // height
                                    "height": this.staticRanges[i].height
                                };
                                // min and max
                                this.pattern[i + 1].min = this.staticRanges[i].min;
                                this.pattern[i + 1].max = this.staticRanges[i].max;
                            }
                        }
                    }
                }
            }
        },
        /*******************
         * Internal Methods
         *******************/
        draw: function () {
            // clear
            this.clear();
            // if no data, commence zombie apocalypse
            if (!this.data) {
                // die
                return;
            }
            // DATA VARIABLE
            var data = this.data,
                dataArray = data.data;
            // Statistics
            var range = this.getRange();
            var minValue = range.min,
                maxValue = range.max;
            if ((minValue === maxValue) && (maxValue === 0)) {
                return;
            }
            var map = this._map;
            var key;
            // Draw
            for (key in dataArray) {
                // IF HAS KEY
                if (dataArray.hasOwnProperty(key) && key.indexOf("|") !== -1) {
                    // EXTENT
                    var gridExtent = new esri.geometry.Extent({
                        "xmin": dataArray.gridsquare * key.split("|")[1] - dataArray.gridsquare / 2,
                        "ymin": dataArray.gridsquare * key.split("|")[0] - dataArray.gridsquare / 2,
                        "xmax": dataArray.gridsquare * key.split("|")[1] + dataArray.gridsquare / 2,
                        "ymax": dataArray.gridsquare * key.split("|")[0] + dataArray.gridsquare / 2,
                        "spatialReference": {
                            "wkid": 102113
                        }
                    });
                    // LAT LONG
                    var centerLNG = dataArray.gridsquare * key.split("|")[1];
                    var centerLAT = dataArray.gridsquare * key.split("|")[0];
                    // CALCULATE SQUARE
                    if ((centerLNG + dataArray.gridsquare / 2) - dataArray[key].avgx <= this.cornerOffset / this.pxgrid * dataArray.gridsquare) {
                        dataArray[key].avgx = centerLNG + dataArray.gridsquare * (this.pxgrid * 0.4) / this.pxgrid;
                    }
                    if (dataArray[key].avgx - (centerLNG - dataArray.gridsquare / 2) <= this.cornerOffset / this.pxgrid * dataArray.gridsquare) {
                        dataArray[key].avgx = centerLNG - dataArray.gridsquare * (this.pxgrid * 0.4) / this.pxgrid;
                    }
                    if ((centerLAT + dataArray.gridsquare / 2) - dataArray[key].avgy <= this.cornerOffset / this.pxgrid * dataArray.gridsquare) {
                        dataArray[key].avgy = centerLAT + dataArray.gridsquare * (this.pxgrid * 0.4) / this.pxgrid;
                    }
                    if (dataArray[key].avgy - (centerLAT - dataArray.gridsquare / 2) <= this.cornerOffset / this.pxgrid * dataArray.gridsquare) {
                        dataArray[key].avgy = centerLAT - dataArray.gridsquare * (this.pxgrid * 0.4) / this.pxgrid;
                    }
                    // POINT
                    var onMapPix = new esri.geometry.Point(dataArray[key].avgx, dataArray[key].avgy, map.spatialReference);
                    // POINT COUNT
                    var pointCount = dataArray[key].count;
                    // SYMBOL VARIABLE
                    var symb;
                    // DEFAULT TEXT COLOR
                    var textcolor = this.clusterTextColor;
                    var breakCount;
                    // if dynamic ranges
                    if (this.useDynamicRanges) {
                        // set break count
                        breakCount = this.numRangeBreaks;
                        if (breakCount < 2) {
                            breakCount = 2;
                        }
                    } else {
                        // set static break count
                        breakCount = this.staticRanges.length;
                    }
                    // if 1 point cluster
                    if (pointCount <= this.pattern[0].max) {
                        // set extent
                        dataArray[key].attributes.extent = gridExtent;
                        // add symbol
                        this.graphics.add(new esri.Graphic(onMapPix, dataArray[key].symbol, dataArray[key].attributes));
                    } else {
                        // FOR EACH BREAK
                        for (i = 1; i <= breakCount; i++) {
                            // IF POINT COUNT IS LESS THAN THIS BREAKS MAX
                            if (pointCount <= this.pattern[i].max) {
                                // IF TEXT RGB IS SET FOR THIS PATTERN
                                if (this.pattern[i].textrgb) {
                                    // SET TEXT COLOR
                                    textcolor = this.pattern[i].textrgb;
                                }
                                // CREATE SYMBOL
                                symb = this.pattern[i].symbol;
                                // END FOR EACH
                                break;
                            }
                        }
                        // add graphic symbol
                        this.graphics.add(new esri.Graphic(onMapPix, new esri.symbol.PictureMarkerSymbol(symb), {
                            extent: gridExtent
                        }));
                        // add graphic text
                        this.graphics.add(new esri.Graphic(onMapPix, new esri.symbol.TextSymbol(pointCount, new esri.symbol.Font(this.clusterTextSize, this.clusterTextStyle, this.clusterTextVariant, this.clusterTextWeight, this.clusterTextFamily), new dojo.Color(textcolor)).setOffset(0, - 4), {
                            extent: gridExtent
                        }));
                    }
                }
            }
            // clear data array
            dataArray = null;
        }
    }); // end of class declaration
}); // end of addOnLoad