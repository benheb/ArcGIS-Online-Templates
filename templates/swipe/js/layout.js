dojo.require("esri.map");
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.dijit.InfoWindow");
dojo.require("esri.IdentityManager");

var bottomMap;
var topMap;
var _inProgress = false;
var mapExtent = null;
var k = 0;
var urlObject;
var i18n;

function initMaps() {

  //get the localization strings
  i18n = dojo.i18n.getLocalization("esriTemplate","template"); 
  dojo.byId('loadingMsg').innerHTML = i18n.viewer.main.loadingMessage;
   
  if(configOptions.geometryserviceurl && location.protocol === "https:"){
    configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:','https:');
  }
  esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);  
  
  if(configOptions.geometryserviceurl && location.protocol === "https:"){
    configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:','https:');
  }
  esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);  

  //check for the sharing url and proxy
  if (!configOptions.sharingurl) {
    configOptions.sharingurl = location.protocol + '//' + location.host + "/sharing/content/items";
  }
  esri.arcgis.utils.arcgisUrl = configOptions.sharingurl;
  
  if (!configOptions.proxyurl) {
    configOptions.proxyurl = location.protocol + '//' + location.host + "/sharing/proxy";
  }
  esri.config.defaults.io.proxyUrl = configOptions.proxyurl;

  esri.config.defaults.io.alwaysUseProxy = false;
  

  //check for url params
  urlObject = esri.urlToObject(document.location.href);
 
 if(urlObject.query && urlObject.query.webmap){
    //replace the web maps in the config file with the url params
    configOptions.webmaps = getWebMaps(urlObject.query.webmap);
  }
  
  if(!configOptions.title){
  	configOptions.title = i18n.viewer.main.title;
  }
  if(!configOptions.subtitle){
  	configOptions.subtitle = i18n.viewer.main.subtitle;
  }
 
  document.title = configOptions.title;
  dojo.byId('title').innerHTML = configOptions.title;
  dojo.byId('subtitle').innerHTML = configOptions.subtitle;

  /*****************
   * Hook up jQuery
   *****************/
  $(document).ready(jQueryReady);
  
  //is an appid specified - if so read json from there
	  if(configOptions.appid || (urlObject.query && urlObject.query.appid)){
		var appid = configOptions.appid || urlObject.query.appid;
		var requestHandle = esri.request({
		  url: configOptions.sharingurl + "/" + appid + "/data",
		  content: {f:"json"},
		  callbackParamName:"callback",
		  load: function(response){
			   if(response.values.webmap !== undefined) {configOptions.webmaps = getWebMaps(response.values.webmap);}
			   initBottomMap();
		  },
		  error: function(response){
			var e = response.message;
		   alert(i18n.viewer.errors.createMap + " : " +  response.message);
		  }
		});
	}
	else{
		initBottomMap();
	}
	
}
  
  
function initBottomMap(){
  var bottomMapDeferred = esri.arcgis.utils.createMap(configOptions.webmaps[0].id,"map1",{
    mapOptions: {
      extent: mapExtent,
      slider: true,
      showAttribution:true,
      nav: false,
      wrapAround180: true
    },
    bingMapsKey:configOptions.bingmapskey
  });

  bottomMapDeferred.addCallback(function (response) {

    dojo.byId("bottomMapTitle").innerHTML = response.itemInfo.item.title;

    bottomMap = response.map;

    dojo.connect(bottomMap, "onExtentChange", syncTopMap);
    dojo.connect(bottomMap, "onUpdateEnd", hideLoader);

    //add the legend
    var layers = response.itemInfo.itemData.operationalLayers;
    if (bottomMap.loaded) {
      bottomMapLayers(layers);
      setMapExtent();
    } else {
      dojo.connect(bottomMap, "onLoad", function () {
        bottomMapLayers(layers);
        setMapExtent();
      });
    }
  });
  bottomMapDeferred.addErrback(function (error) {
     alert(i18n.viewer.errors.createMap + " : " +  error.message);
  });
}

function initTopMap() {
  var topMapDeferred = esri.arcgis.utils.createMap(configOptions.webmaps[1].id,"map2",{
    mapOptions: {
      extent: mapExtent,
      slider: true,
      showAttribution:true,
      nav: false,
      wrapAround180: true
    },
    bingMapsKey: configOptions.bingmapskey
  });

  topMapDeferred.addCallback(function (response) {

    dojo.byId("topMapTitle").innerHTML = response.itemInfo.item.title;

    topMap = response.map;

    dojo.connect(topMap, "onExtentChange", syncBottomMap);

    //add the legend
    var layers = response.itemInfo.itemData.operationalLayers;
    if (topMap.loaded) {
      topMapLayers(layers);
      initiateSwipe();
    } else {
      dojo.connect(topMap, "onLoad", function () {
        topMapLayers(layers);
		initiateSwipe();
      });
    }
  });
  topMapDeferred.addErrback(function (error) {
    alert(i18n.viewer.errors.createMap + " : " +  error.message);
  });
}

function topMapLayers(layers) {
  //add chrome theme for popup
  dojo.addClass(topMap.infoWindow.domNode, "chrome");

  //add a scalebar
  var scalebar = new esri.dijit.Scalebar({
    map: topMap,
    scalebarUnit: i18n.viewer.main.scaleBarUnits //metric or english
  });
  var layerInfos = buildLayersList(layers);
  //add a legend
  var legend = new esri.dijit.Legend({
    layerInfos:layerInfos,
    map: topMap
  }, "legendDiv");
  legend.startup();
}

function bottomMapLayers(layers) {
  //add chrome theme for popup
  dojo.addClass(bottomMap.infoWindow.domNode, "chrome");

  //add a scalebar
  var scalebar = new esri.dijit.Scalebar({
    map: bottomMap,
    scalebarUnit: i18n.viewer.main.scaleBarUnits //metric or english
  });
  //add a legend
  var layerInfos = buildLayersList(layers);
  var legend = new esri.dijit.Legend({
    layerInfos:layerInfos,
    map: bottomMap
  }, "legendDiv2");
  legend.startup();
}

function initiateSwipe() {
  setTimeout($("#resizeWrapper").animate({
    width: 450
  }, "200"), 800);
  setTimeout("syncBottomMap()", 400);
  $("#map2").css('width', dojo.byId('map1').clientWidth);
}

function syncTopMap() {
  if (k == 1){
	  if (_inProgress == true) {
		_inProgress = false;
		return;
	  }
	  _inProgress = true;
	  topMap.setExtent(bottomMap.extent);
  }
}

function syncBottomMap() {
  if (_inProgress == true) {
    _inProgress = false;
    return;
  }
  _inProgress = true;
  bottomMap.setExtent(topMap.extent);
  k = 1;
}

function hideLoader() {
  if (k == 1) {
    $("#loadingCon").hide();
  }
}

function setMapExtent() {
  mapExtent = bottomMap.extent;
  initTopMap();
}

function resizeMapDiv() {
  $("#map2").css('width', dojo.byId('map1').clientWidth);
  $("#map2").css('height', dojo.byId('map1').clientHeight);
  if(bottomMap){
    bottomMap.resize();
  }
  if(topMap){
  topMap.resize();
  }
}




function jQueryReady(){
$(function () {
  $("#resizeWrapper").resizable({
    handles: 'e',
    containment: 'parent',
    minWidth: 2
  });
});

  $("#legendToggle").click(function () {
    if ($("#legendDiv").css('display') == 'none') {
      $("#legImg1").attr('src', 'images/legendUp.png');
    } else {
      $("#legImg1").attr('src', 'images/legendDown.png');
    }
    $("#legendDiv").slideToggle();
  });
  $("#legendToggle2").click(function () {
    if ($("#legendDiv2").css('display') == 'none') {
      $("#legImg2").attr('src', 'images/legendUp.png');
    } else {
      $("#legImg2").attr('src', 'images/legendDown.png');
    }
    $("#legendDiv2").slideToggle();
  });
  $("#map1, #map2, .ui-resizable-e").mousedown(function () {
    $("#legendDiv").slideUp('fast');
    $("#legendDiv2").slideUp('fast');
    $("#legImg1").attr('src', 'images/legendDown.png');
    $("#legImg2").attr('src', 'images/legendDown.png');
  });
}

function getWebMaps(webmaps) {
  if (webmaps.indexOf(',') !== -1) {
    var mapIds = webmaps.split(',');
    webmapresults = dojo.map(mapIds, function (mapId) {
      return {
        id: mapId
      };
    });
  } else {
    var previewWebMap = {
      id: webmaps
    };
    webmapresults = [previewWebMap, previewWebMap];
  }
  return webmapresults;
}

function buildLayersList(layers) {

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