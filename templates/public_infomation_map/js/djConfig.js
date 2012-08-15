// host path regular expression
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location.pathname.replace(pathRegex, '');

// Dojo Config
var dojoConfig = {
    parseOnLoad: true,
    packages: [{
        name: "esriTemplate",
        location: locationPath
    }, {
        name: "myModules",
        location: locationPath + '/javascript'
    }, {
        name: "apl",
        location: locationPath + '/apl'
    }]
};

// GLOBAL VARIABLES
var clusterArr, clusterClick;
// MAP
var map, pimPopup, xScalebar;
// WEB MAP
var webmap, WMBMTitle, WMBaseMap, WMBaseLUO, WMItemData, WMLayers, WMItemInfo, WMVisLayers = [],
    WMPreso, WMBookmarks, baseGalleryLoaded, basemapGallery, URLBaseMap;
// SOCIAL LAYERS
var heatLayer, twitterLayer, flickrLayer, youtubeLayer, wikiLayer, clusterLayer, ushahidiLayer;
// LOCATORS
var aoGeocoder, aoGeoCoderAutocomplete;
// LAYERS
var inappLayer, inappFeat, locateResultLayer;
// REPORT TABLES
var SMFAI_LUT, SMFAIQuery, SMFAIQueryTask, SMDUPQueryTask, badWordsTask, badWordsQuery, badWordsList, mailString;
// EXTENT
var startExtent;
// MAP TIMERS
var timer, acHideTimer, acShowTimer, autoRefreshTimer, emailTimer, refreshIgnore = 2;
// UI OBJECTS
var settingsDialog, ACObj, customMapSlider;
// SHARING VALUES
var appURL, shareURL, shareParams, locateString, sXmin, sYmin, sXmax, sYmax, ytParam, twParam, flParam, isEmbedded, socGeoTmp, smdTmp, visLyrs, ytRange, twRange, flRange, socialSourceX, socialSourceY, socialClickListener, socialRadius, socialSliderCurrent, socialSliderValues, mapWidth, mapHeight, timer2, urlObject, socialHeatMap;