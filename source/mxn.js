// Auto-load scripts
//
// specify which map providers to load by using
// <script src="mxn.js?(provider1,provider2,[module1,module2])" ...
// in your HTML
//
// for each provider mxn.provider.module.js and mxn.module.js will be loaded
// module 'core' is always loaded
//
// NOTE: if you call without providers
// <script src="mxn.js" ...
// no scripts will be loaded at all and it is then up to you to load the scripts independently

(function(){

// holds all our implementing functions
var apis = {};

// Our special private methods
/**
 * Calls the API specific implementation of a particular method.
 * Deferrable: If the API implmentation includes a deferable hash such as { getCenter: true, setCenter: true},
 * then the methods calls mentioned with in it will be queued until runDeferred is called.
 *   
 * @private
 */
var invoke = function(sApiId, sObjName, sFnName, oScope, args){
	if(!hasImplementation(sApiId, sObjName, sFnName)) {
		throw 'Method ' + sFnName + ' of object ' + sObjName + ' is not supported by API ' + sApiId + '. Are you missing a script tag?';
	}

	if(typeof(apis[sApiId][sObjName].deferrable) != 'undefined' && apis[sApiId][sObjName].deferrable[sFnName] === true) {
		mxn.deferUntilLoaded.call(oScope, function() {
			return apis[sApiId][sObjName][sFnName].apply(oScope, args);
			}
		);
	} 

	else {
		return apis[sApiId][sObjName][sFnName].apply(oScope, args);
	} 
};
	
/**
 * Determines whether the specified API provides an implementation for the 
 * specified object and function name.
 * @private
 */
var hasImplementation = function(sApiId, sObjName, sFnName){
	if(typeof(apis[sApiId]) == 'undefined') {
		throw 'API ' + sApiId + ' not loaded. Are you missing a script tag?';
	}
	if(typeof(apis[sApiId][sObjName]) == 'undefined') {
		throw 'Object definition ' + sObjName + ' in API ' + sApiId + ' not loaded. Are you missing a script tag?'; 
	}

	return typeof(apis[sApiId][sObjName][sFnName]) == 'function';
};

/**
 * @name mxn
 * @namespace
 */
var mxn = window.mxn = /** @lends mxn */ {
	
	/**
	 * Registers a set of provider specific implementation functions.
	 * @function
	 * @private
	 * @param {String} sApiId The API ID to register implementing functions for.
	 * @param {Object} oApiImpl An object containing the API implementation.
	 */
	register: function(sApiId, oApiImpl){
		if(!apis.hasOwnProperty(sApiId)){
			apis[sApiId] = {};
		}
		mxn.util.merge(apis[sApiId], oApiImpl);
	},		
	
	/**
	 * Adds a list of named proxy methods to the prototype of a 
	 * specified constructor function.
	 * @private
	 * @function
	 * @param {Function} func Constructor function to add methods to
	 * @param {Array} aryMethods Array of method names to create
	 * @param {Boolean} bWithApiArg Optional. Whether the proxy methods will use an API argument
	 */
	addProxyMethods: function(func, aryMethods, bWithApiArg){
		for(var i = 0; i < aryMethods.length; i++) {
			var sMethodName = aryMethods[i];
			if(bWithApiArg){
				func.prototype[sMethodName] = new Function('return this.invoker.go(\'' + sMethodName + '\', arguments, { overrideApi: true } );');
			}
			else {
				func.prototype[sMethodName] = new Function('return this.invoker.go(\'' + sMethodName + '\', arguments);');
			}
		}
	},
	
	/**
	 * @private
	 */
	checkLoad: function(funcDetails){
		if(this.loaded[this.api] === false) {
			var scope = this;
			this.onload[this.api].push( function() { funcDetails.callee.apply(scope, funcDetails); } );
			return true;
		}
		return false;
	},
	
	/**
	 * @private
	 */
	deferUntilLoaded: function(fnCall) {
		if(this.loaded[this.api] === false) {
			var scope = this;
			this.onload[this.api].push( fnCall );
		} else {
			fnCall.call(this);
		}
	},

	/**
	 * Bulk add some named events to an object.
	 * @function
	 * @private
	 * @param {Object} oEvtSrc The event source object.
	 * @param {String[]} aEvtNames Event names to add.
	 */
	addEvents: function(oEvtSrc, aEvtNames){
		for(var i = 0; i < aEvtNames.length; i++){
			var sEvtName = aEvtNames[i];
			if(sEvtName in oEvtSrc){
				throw 'Event or method ' + sEvtName + ' already declared.';
			}
			oEvtSrc[sEvtName] = new mxn.Event(sEvtName, oEvtSrc);
		}
	}
	
};

/**
 * Instantiates a new Event 
 * @constructor
 * @private
 * @param {String} sEvtName The name of the event.
 * @param {Object} oEvtSource The source object of the event.
 */
mxn.Event = function(sEvtName, oEvtSource){
	var handlers = [];
	if(!sEvtName){
		throw 'Event name must be provided';
	}
	/**
	 * Add a handler to the Event.
	 * @private
	 * @param {Function} fn The handler function.
	 * @param {Object} ctx The context of the handler function.
	 */
	this.addHandler = function(fn, ctx){
		handlers.push({context: ctx, handler: fn});
	};
	/**
	 * Remove a handler from the Event.
	 * @private
	 * @param {Function} fn The handler function.
	 * @param {Object} ctx The context of the handler function.
	 */
	this.removeHandler = function(fn, ctx){
		for(var i = 0; i < handlers.length; i++){
			if(handlers[i].handler == fn && handlers[i].context == ctx){
				handlers.splice(i, 1);
			}
		}
	};
	/**
	 * Remove all handlers from the Event.
	 * @private
	 */
	this.removeAllHandlers = function(){
		handlers = [];
	};
	/**
	 * Fires the Event.
	 * @private
	 * @param {Object} oEvtArgs Event arguments object to be passed to the handlers.
	 */
	this.fire = function(oEvtArgs){
		var args = [sEvtName, oEvtSource, oEvtArgs];
		for(var i = 0; i < handlers.length; i++){
			handlers[i].handler.apply(handlers[i].context, args);
		}
	};
};

/**
 * Creates a new Invoker, a class which helps with on-the-fly 
 * invocation of the correct API methods.
 * @constructor
 * @private
 * @param {Object} aobj The core object whose methods will make cals to go()
 * @param {String} asClassName The name of the Mapstraction class to be invoked, normally the same name as aobj's constructor function
 * @param {Function} afnApiIdGetter The function on object aobj which will return the active API ID
 */
mxn.Invoker = function(aobj, asClassName, afnApiIdGetter){
	var obj = aobj;
	var sClassName = asClassName;
	var fnApiIdGetter = afnApiIdGetter;
	var defOpts = { 
		overrideApi: false, // {Boolean} API ID is overridden by value in first argument
		context: null, // {Object} Local vars can be passed from the body of the method to the API method within this object
		fallback: null // {Function} If an API implementation doesn't exist this function is run instead
	};
	
	/**
	 * Invoke the API implementation of a specific method.
	 * @private
	 * @param {String} sMethodName The method name to invoke
	 * @param {Array} args Arguments to pass on
	 * @param {Object} oOptions Optional. Extra options for invocation
	 * @param {Boolean} oOptions.overrideApi When true the first argument is used as the API ID.
	 * @param {Object} oOptions.context A context object for passing extra information on to the provider implementation.
	 * @param {Function} oOptions.fallback A fallback function to run if the provider implementation is missing.
	 */
	this.go = function(sMethodName, args, oOptions){
		
		// make sure args is an array
		args = typeof(args) != 'undefined' ? Array.prototype.slice.apply(args) : [];
		
		if(typeof(oOptions) == 'undefined'){
			oOptions = defOpts;
		}
						
		var sApiId;
		if(oOptions.overrideApi){
			sApiId = args.shift();
		}
		else {
			sApiId = fnApiIdGetter.apply(obj);
		}
		
		if(typeof(sApiId) != 'string'){
			throw 'API ID not available.';
		}
		
		if(typeof(oOptions.context) != 'undefined' && oOptions.context !== null){
			args.push(oOptions.context);
		}
		
		if(typeof(oOptions.fallback) == 'function' && !hasImplementation(sApiId, sClassName, sMethodName)){
			// we've got no implementation but have got a fallback function
			return oOptions.fallback.apply(obj, args);
		}
		else {				
			return invoke(sApiId, sClassName, sMethodName, obj, args);
		}
	};
	
};

/**
 * @namespace
 */
mxn.util = {
			
	/**
	 * Merges properties of one object into another recursively.
	 * @name mxn.util.merge
	 * @param {Object} oRecv The object receiveing properties
	 * @param {Object} oGive The object donating properties
	 */
	merge: function(oRecv, oGive){
		for (var sPropName in oGive){
			if (oGive.hasOwnProperty(sPropName)) {
				if(!oRecv.hasOwnProperty(sPropName) || typeof(oRecv[sPropName]) !== 'object' || typeof(oGive[sPropName]) !== 'object'){
					oRecv[sPropName] = oGive[sPropName];
				}
				else {
					mxn.util.merge(oRecv[sPropName], oGive[sPropName]);
				}
			}
		}
	},
	
	/**
	 * $m, the dollar function, elegantising getElementById()
	 * @name mxn.util.$m
	 * @return An HTML element or array of HTML elements
	 */
	$m: function() {
		var elements = [];
		for (var i = 0; i < arguments.length; i++) {
			var element = arguments[i];
			if (typeof(element) == 'string') {
				element = document.getElementById(element);
			}
			if (arguments.length == 1) {
				return element;
			}
			elements.push(element);
		}
		return elements;
	},

	/**
	 * loadScript is a JSON data fetcher
	 * @name mxn.util.loadScript
	 * @param {String} src URL to JSON file
	 * @param {Function} callback Callback function
	 */
	loadScript: function(src, callback) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = src;
		if (callback) {
			if(script.addEventListener){
				script.addEventListener('load', callback, true);
			}
			else if(script.attachEvent){
				var done = false;
				script.attachEvent("onreadystatechange",function(){
					if ( !done && document.readyState === "complete" ) {
						done = true;
						callback();
					}
				});
			}			
		}
		var h = document.getElementsByTagName('head')[0];
		h.appendChild( script );
		return;
	},

	/**
	 * @private
	 * @param {Object} point
	 * @param {Object} level
	 */
	convertLatLonXY_Yahoo: function(point, level) { //Mercator
		var size = 1 << (26 - level);
		var pixel_per_degree = size / 360.0;
		var pixel_per_radian = size / (2 * Math.PI);
		var origin = new YCoordPoint(size / 2 , size / 2);
		var answer = new YCoordPoint();
		answer.x = Math.floor(origin.x + point.lon * pixel_per_degree);
		var sin = Math.sin(point.lat * Math.PI / 180.0);
		answer.y = Math.floor(origin.y + 0.5 * Math.log((1 + sin) / (1 - sin)) * -pixel_per_radian);
		return answer;
	},

	/**
	 * Load a stylesheet from a remote file.
	 * @name mxn.util.loadStyle
	 * @param {String} href URL to the CSS file
	 */
	loadStyle: function(href) {
		var link = document.createElement('link');
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = href;
		document.getElementsByTagName('head')[0].appendChild(link);
		return;
	},

	/**
	 * getStyle provides cross-browser access to css
	 * @name mxn.util.getStyle
	 * @param {Object} el HTML Element
	 * @param {String} prop Style property name
	 */
	getStyle: function(el, prop) {
		var y;
		if (el.currentStyle) {
			y = el.currentStyle[prop];
		}
		else if (window.getComputedStyle) {
			y = window.getComputedStyle( el, '').getPropertyValue(prop);
		}
		return y;
	},

	/**
	 * Convert longitude to metres
	 * http://www.uwgb.edu/dutchs/UsefulData/UTMFormulas.HTM
	 * "A degree of longitude at the equator is 111.2km... For other latitudes,
	 * multiply by cos(lat)"
	 * assumes the earth is a sphere but good enough for our purposes
	 * @name mxn.util.lonToMetres
	 * @param {Float} lon
	 * @param {Float} lat
	 */
	lonToMetres: function(lon, lat) {
		return lon * (111200 * Math.cos(lat * (Math.PI / 180)));
	},

	/**
	 * Convert metres to longitude
	 * @name mxn.util.metresToLon
	 * @param {Object} m
	 * @param {Object} lat
	 */
	metresToLon: function(m, lat) {
		return m / (111200 * Math.cos(lat * (Math.PI / 180)));
	},

	/**
	 * Convert kilometres to miles
	 * @name mxn.util.KMToMiles
	 * @param {Float} km
	 * @returns {Float} miles
	 */
	KMToMiles: function(km) {
		return km / 1.609344;
	},

	/**
	 * Convert miles to kilometres
	 * @name mxn.util.MilesToKM
	 * @param {Float} miles
	 * @returns {Float} km
	 */
	milesToKM: function(miles) {
		return miles * 1.609344;
	},

	// stuff to convert google zoom levels to/from degrees
	// assumes zoom 0 = 256 pixels = 360 degrees
	//		 zoom 1 = 256 pixels = 180 degrees
	// etc.

	/**
	 * @name mxn.util.getDegreesFromGoogleZoomLevel
	 * @param {Object} pixels
	 * @param {Object} zoom
	 */
	getDegreesFromGoogleZoomLevel: function(pixels, zoom) {
		return (360 * pixels) / (Math.pow(2, zoom + 8));
	},

	/**
	 * @name mxn.util.getGoogleZoomLevelFromDegrees
	 * @param {Object} pixels
	 * @param {Object} degrees
	 */
	getGoogleZoomLevelFromDegrees: function(pixels, degrees) {
		return mxn.util.logN((360 * pixels) / degrees, 2) - 8;
	},

	/**
	 * @name mxn.util.logN
	 * @param {Object} number
	 * @param {Object} base
	 */
	logN: function(number, base) {
		return Math.log(number) / Math.log(base);
	},
			
	/**
	 * Returns array of loaded provider apis
	 * @name mxn.util.getAvailableProviders
	 * @returns {Array} providers
	 */
	getAvailableProviders : function () {
		var providers = [];
		for (var propertyName in apis){
			if (apis.hasOwnProperty(propertyName)) {
				providers.push(propertyName);
			}
		}
		return providers;
	},
	
	/**
	 * Formats a string, inserting values of subsequent parameters at specified
	 * @name mxn.util.stringFormat
	 * locations. e.g. stringFormat('{0} {1}', 'hello', 'world');
	 */
	stringFormat: function(strIn){
		var replaceRegEx = /\{\d+\}/g;
		var args = Array.prototype.slice.apply(arguments);
		args.shift();
		return strIn.replace(replaceRegEx, function(strVal){
			var num = strVal.slice(1, -1);
			return args[num];
		});
	},
	
	/**
	 * Traverses an object graph using a series of map functions provided as arguments 
	 * 2 to n. Map functions are only called if the working object is not undefined/null.
	 * For usage see mxn.google.geocoder.js.
	 * @name mxn.util.traverse
	 */
	traverse: function(start) {
		var args = Array.prototype.slice.apply(arguments);
		args.shift();
		var working = start;
		while(typeof(working) != 'undefined' && working !== null && args.length > 0){
			var op = args.shift();
			working = op(working);
		}
	},
	
	/**
	 * Sanitises and cleans a templated tile server URL, converting all uppercase template
	 * references, such as {Z}, {X} or {Y} to their lowercase forms.
	 * @name mxn.util.sanitizeTileURL
	 * @param {String} url Source URL to sanitise
	 * @returns {String} The sanitised URL
	 */
	sanitizeTileURL: function(url) {
		return url.replace(/\{S\}/g, '{s}').replace(/\{Z\}/g, '{z}').replace(/\{X\}/g, '{x}').replace(/\{Y\}/g, '{y}');
	},
	
	/**
	 * Replaces the subdomain in a templated tile server URL with a randomly chosen element
	 * from a choice of subdomains. Some tile servers automagically replaces instances of
	 * {s} in templated URLs but for those that don't this helper function will do the job
	 * @name mxn.util.getSubdomainTileURL
	 * @param {String} url Templated tile server URL
	 * @param {Object} subdomains List of subdomains; can be supplied as a string or as an array
	 * @returns {String} The modified template URL
	 */
	getSubdomainTileURL: function (url, subdomains) {
		var pos = url.search('{s}');
		if (pos !== -1) {
			var random_element = Math.floor(Math.random() * subdomains.length);
			var domain;
			if (typeof subdomains === 'string') {
				domain = subdomains.substring(random_element, random_element + 1);
			}
			
			else {
				domain = subdomains[random_element];
			}
			
			if (typeof domain !== 'undefined') {
				return url.replace(/\{s\}/g, domain);
			}
		}

		return url;
	},
	
	isValidProvider: function(provider) {
		return mxn.Providers.hasOwnProperty(provider);
	},
	
	translateProvider: function(provider) {
		if (mxn.Providers[provider].type === 'master') {
			return provider;
		}
		
		else if (mxn.Providers[provider].type === 'alias') {
			return mxn.Providers[provider].refers;
		}
		
		return provider;
	}
};

/**
 * Helper class for converting between HTML and RGB integer color formats.
 * @constructor
 * @param {variable} color Specify as either a single argument containing an HTML
 * color string or three numeric arguments for R, G and B respectively.
 */
mxn.util.Color = function() {
	if(arguments.length == 3) {
		this.red = arguments[0];
		this.green = arguments[1];
		this.blue = arguments[2];
	}
	else if(arguments.length == 1) {
		this.setHexColor(arguments[0]);
	}
};

mxn.util.Color.prototype.reHex = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Set the color from the supplied HTML hex string.
 * @param {String} hexColor A HTML hex color string e.g. '#00FF88'.
 */
mxn.util.Color.prototype.setHexColor = function(hexColor) {
	var match = hexColor.match(this.reHex);
	if(match) {
		// grab the code - strips off the preceding # if there is one
		hexColor = match[1];
	}
	else {
		throw 'Invalid HEX color format, expected #000, 000, #000000 or 000000';
	}
	// if a three character hex code was provided, double up the values
	if(hexColor.length == 3) {
		hexColor = hexColor.replace(/\w/g, function(str){return str.concat(str);});
	}
	this.red = parseInt(hexColor.substr(0,2), 16);
	this.green = parseInt(hexColor.substr(2,2), 16);
	this.blue = parseInt(hexColor.substr(4,2), 16);
};

/**
 * Retrieve the color value as an HTML hex string.
 * @returns {String} Format '#00FF88'.
 */
mxn.util.Color.prototype.getHexColor = function() {
	var rgb = this.blue | (this.green << 8) | (this.red << 16);
	var hexString = rgb.toString(16).toUpperCase();
	if(hexString.length <  6){
		hexString = '0' + hexString;
	}
	return '#' + hexString;
};

})();

mxn.Providers = {
	'cloudmade': {
		'type': 'master',
		'state': 'obsolete'
	},
	'esriv3': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': [
			{
				'src': 'http://serverapi.arcgisonline.com/jsapi/arcgis/3.2/js/esri/css/esri.css',
				'conditional': null
			},
			{
				'src': 'http://serverapi.arcgisonline.com/jsapi/arcgis/3.2/js/dojo/dijit/themes/claro/claro.css',
				'conditional': null
			}
		],
		'script': [
			{
				'src': 'http://serverapi.arcgisonline.com/jsapi/arcgis/?v=3.2',
				'auth': false,
				'authType': null
			}
		]
	},
	'esri' : {
		'type': 'alias',
		'refers': 'esriv3'
	},
	'geocommons': {
		'type': 'master',
		'state': 'obsolete'
	},
	'googlev2': {
		'type': 'master',
		'state': 'obsolete',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://maps.google.com/maps?file=api&v=2&key={%1}',
				'auth': true,
				'authType': 'url'
			}
		]
	},
	'googlev3': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'https://maps.googleapis.com/maps/api/js?key={%1}&sensor=false',
				'auth': true,
				'authType': 'url'
			}
		]
	},
	'google': {
		'type': 'alias',
		'refers': 'googlev3'
	},
	'herev2': {
		'type': 'master',
		'state': 'active',
		'meta': '<meta http-equiv="X-UA-Compatible" content="IE=7; IE=EmulateIE9" />',
		'style': null,
		'script': [
			{
				'src': 'http://js.api.here.com/se/2.5.3/jsl.js',
				'auth': true,
				'authType': 'js'
			}
		]
	},
	'here': {
		'type': 'alias',
		'refers': 'herev2'
	},
	'leafletv0': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': [
			{
				'src': 'http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.css',
				'conditional': null
			},
			{
				'src': 'http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.ie.css',
				'conditional': 'if lte IE 8'
			},
			{
				'src': 'http://code.geotastic.org/mxn/plugins/leaflet/Leaflet.Pancontrol/src/L.Control.Pan.css',
				'conditional': null
			},
			{
				'src': 'http://code.geotastic.org/mxn/plugins/leaflet/Leaflet.Pancontrol/src/L.Control.Pan.ie.css',
				'conditional': 'if lte IE 9'
			},
			{
				'src': 'http://code.geotastic.org/mxn/plugins/leaflet/Leaflet.zoomslider/src/L.Control.Zoomslider.css',
				'conditional': null
			},
			{
				'src': 'http://code.geotastic.org/mxn/plugins/leaflet/Leaflet.zoomslider/src/L.Control.Zoomslider.ie.css',
				'conditional': 'if lte IE 8'
			}
		],
		'script': [
			{
				'src': 'http://cdn.leafletjs.com/leaflet-0.6.4/leaflet.js',
				'auth': false,
				'authType': null
			},
			{
				'src': 'http://code.geotastic.org/mxn/plugins/leaflet/Leaflet-MiniMap/src/Control.MiniMap.js',
				'auth': false,
				'authType': null
			},
			{
				'src': 'http://code.geotastic.org/mxn/plugins/leaflet/Leaflet.Pancontrol/src/L.Control.Pan.js',
				'auth': false,
				'authType': null
			},
			{
				'src': 'http://code.geotastic.org/mxn/plugins/leaflet/Leaflet.zoomslider/src/L.Control.Zoomslider.js',
				'auth': false,
				'authType': null
			}
		]
	},
	'leaflet': {
		'type': 'alias',
		'refers': 'leafletv0'
	},
	'mapquestv7': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://www.mapquestapi.com/sdk/js/v7.0.s/mqa.toolkit.js?key={%1}',
				'auth': true,
				'authType': 'url'
			}
		]
	},
	'mapquest': {
		'type': 'alias',
		'refers': 'mapquestv7'
	},
	'microsoftv6': {
		'type': 'master',
		'state': 'obsolete',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=6.3&mkt=en-us',
				'auth': false,
				'authType': null
			}
		]
	},
	'microsoftv7': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0',
				'auth': false,
				'authType': null
			}
		]
	},
	'microsoft': {
		'type': 'alias',
		'refers': 'microsoftv7'
	},
	'nokia': {
		'type': 'alias',
		'refers': 'herev2'
	},
	'openlayersv2': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://dev.openlayers.org/releases/OpenLayers-2.12/OpenLayers.js',
				'auth': false,
				'authType': null
			}
		]
	},
	'openlayersv3': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': [
			{
				'src': 'http://ol3js.org/en/master/build/ol.css',
				'conditional': null
			}
		],
		'script': [
			{

			    //'src': 'http://ol3js.org/en/master/build/ol.js', //TODO: When ol3 exports the features we need for removing polylines
				'src': 'http://ol3js.org/en/master/build/ol-simple.js',
				'auth': false,
				'authType': null
			}
		]
	},
	'openlayers': {
		'type': 'alias',
		'refers': 'openlayersv2'
	},
	'openmapquestv7': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://open.mapquestapi.com/sdk/js/v7.0.s/mqa.toolkit.js',
				'auth': false,
				'authType': null
			}
		]
	},
	'openmapquest': {
		'type': 'alias',
		'refers': 'openmapquestv7'
	},
	'openmq': {
		'type': 'alias',
		'refers': 'openmapquestv7'
	},
	'openspacev4': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://openspace.ordnancesurvey.co.uk/osmapapi/openspace.js?key={%1}',
				'auth': true,
				'authType': 'url'
			}
		]
		
	},
	'openspace': {
		'type': 'alias',
		'refers': 'openspacev4'
	},
	'ovi': {
		'type': 'master',
		'state': 'obsolete',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://api.maps.ovi.com/jsl.js',
				'auth': false,
				'authType': null
			}
		]
	},
	'yahoo': {
		'type': 'master',
		'state': 'obsolete'
	},
	'yandexv1': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://api-maps.yandex.ru/1.1/index.xml?key={%1}',
				'auth': true,
				'authType': 'url'
			}
		]
	},
	'yandex': {
		'type': 'alias',
		'refers': 'yandexv1'
	},
	'yandexv2': {
		'type': 'master',
		'state': 'active',
		'meta': null,
		'style': null,
		'script': [
			{
				'src': 'http://api-maps.yandex.ru/2.0/?load=package.full&lang=en-US',
				'auth': false,
				'authType': null
			}
		]
	}
};


(function() {
	var makeAuthURL = function(provider, src) {
		switch (provider) {
			case 'googlev3':
				if (typeof googlev3_key === 'undefined') {
					src = src.replace('{%1}', google_key);
				}
				else {
					src = src.replace('{%1}', googlev3_key);
				}
				break;

			case 'mapquestv7':
				if (typeof mapquestv7_key === 'undefined') {
					src = src.replace('{%1}', mapquest_key);
				}
				else {
					src = src.replace('{%1}', mapquestv7_key);
				}
				break;

			case 'openspace':
				if (typeof openspacev4_key === 'undefined') {
					src = src.replace('{%1}', openspace_key);
				}
				else {
					src = src.replace('{%1}', openspacev4_key);
				}
				break;

			case 'yandexv1':
				if (typeof yandexv1_key === 'undefined') {
					src = src.replace('{%1}', yandex_key);
				}
				else {
					src = src.replace('{%1}', yandexv1_key);
				}
				break;
				
			default:
				break;
		}
		
		return src;
	};
	
	var makeAuthJavascript = function(provider) {
		if (provider === 'herev2') {
			var auth = '<script type="text/javascript">';
			auth += '\nnokia.Settings.set("app_id", "' + nokia_app_id + '");';
			auth += '\nnokia.Settings.set("app_code", "' + nokia_auth_token + '");';
			auth += '\n</script>';

			return auth;
		}
		
		else {
			return null;
		}
	};
	
	var makeScriptTag = function(src) {
		var tag = '<script type="text/javascript" src="';
		
		tag += src;
		tag += '"></script>';
		
		return tag;
	};
	
	var makeStyleTag = function(src, condition) {
		var tag = '';
		
		if (condition) {
			tag += '<!--[' + condition + ']>\n';
		}
		
		tag += '<link rel="stylesheet" type="text/css" href="' + src + '" />';
		
		if (condition) {
			tag += '\n<![endif]-->';
		}
		
		return tag;
	};

	var tags = document.getElementsByTagName('script');
	var input_providers = null;
	var support_modules = ['basemap'];
	var input_modules = 'core';
	var script_base = null;
	var auto_meta = [];
	var auto_styles = [];
	var auto_scripts = [];
	var auto_auth = [];
	var core_scripts = [];
	var i;

	for (i=0; i<tags.length; i++) {
		var match = tags[i].src.replace(/%20/g , '').match(/^(.*?)mxn\.js(\?\(\[?(.*?)\]?\))?(.*)$/);
		if (match !== null) {
			script_base = match[1];
			if (match[3]) {
				var settings = match[3].split(',[');
				input_providers = settings[0].replace(']', '');
				
				if (settings[1]) {
					input_modules += ',' + settings[1];
				}
			}
			break;
		}
	}
	
	if (input_providers === null || input_providers == 'none') {
		return;
	}
	
	input_providers = input_providers.replace(/ /g, '').split(',');
	input_modules = input_modules.replace(/ /g, '').split(',');

	var num_modules = input_modules.length;
	var num_providers = input_providers.length;
	var src = '';

	for (var s=0; s<support_modules.length; s++) {
		src = script_base + 'mxn.' + support_modules[s] + '.js';
		core_scripts.push(makeScriptTag(src));
	}
	
	for (var m=0; m<num_modules; m++) {
		var module = input_modules[m];

		if (module !== 'autoload') {
			src = script_base + 'mxn.' + module + '.js';
			core_scripts.push(makeScriptTag(src));
		}
		for (var p=0; p<num_providers; p++) {
			var provider = input_providers[p];

			// Do we know about this provider?
			if (!mxn.Providers.hasOwnProperty(provider)) {
				throw new Error('Unknown Mapstraction provider "' + provider + '"');
			}
			
			// If we do, is it an alias to a master provider definition? If so, update the current
			// provider id to use what the alias refers to ...

			if (!mxn.Providers[provider].hasOwnProperty('type')) {
				throw new Error('Something went wrong; cannot find the type property for provider "' + provider + '"');
			}

			if (mxn.Providers[provider].type === 'alias') {
				if (!mxn.Providers[provider].hasOwnProperty('refers')) {
					throw new Error('Something went wrong; cannot find the refer property for provider alias "' + provider + '"');
				}
				
				provider = mxn.Providers[provider].refers;
			}
			
			if (!mxn.Providers[provider].hasOwnProperty('state')) {
				throw new Error('Something went wrong; cannot find the state property for provider "' + provider + '"');
			}
			
			if (mxn.Providers[provider].state !== 'active') {
				throw new Error('Mapstraction provider "' + provider + '" is obsoleted and no longer supported');
			}

			if (module === 'autoload') {
				if (mxn.Providers.hasOwnProperty(provider)) {
					var auto = mxn.Providers[provider];
					
					if (auto.hasOwnProperty('meta') && auto.meta !== null) {
						auto_meta.push(auto.meta);
					}
					
					if (auto.hasOwnProperty('style') && auto.style !== null) {
						for (i in auto.style) {
							if (auto.style.hasOwnProperty(i)) {
								auto_styles.push(makeStyleTag(auto.style[i].src,
									auto.style[i].conditional));
							}
						}
					}
					
					if (auto.hasOwnProperty('script') && auto.script !== null) {
						for (var script in auto.script) {
							if (auto.script[script].hasOwnProperty('src')) {
								src = auto.script[script].src;
								if (auto.script[script].auth === true) {
									if (auto.script[script].authType === 'url') {
										src = makeAuthURL(provider, src);
									}

									else if (auto.script[script].authType === 'js') {
										auto_auth.push(makeAuthJavascript(provider));
									}
								}
								auto_scripts.push(makeScriptTag(src));
							}
						}
					}
				}
			}
			
			else {
				src = script_base + 'mxn.' + provider + '.' + module + '.js';
				core_scripts.push(makeScriptTag(src));
			}
		}
	}
	
	if (auto_meta.length !== 0) {
		document.write(auto_meta.join(''));
	}
	if (auto_styles.length !== 0) {
		document.write(auto_styles.join(''));
	}
	if (auto_scripts.length !== 0) {
		document.write(auto_scripts.join(''));
	}
	if (auto_auth.length !== 0) {
		document.write(auto_auth.join(''));
	}
	if (core_scripts.length !== 0) {
		document.write(core_scripts.join(''));
	}
})();
