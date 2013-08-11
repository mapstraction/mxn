(function(){

/**
 * @exports mxn.util.$m as $m
 */
var $m = mxn.util.$m;

/**
 * Initialise our provider. This function should only be called 
 * from within Mapstraction code, not exposed as part of the API.
 * @private
 */
var init = function() {
	this.invoker.go('init', [ this.currentElement, this.api ]);
	this.applyOptions();
};

/**
 * <p>Creates and loads a Mapstraction map into a specified HTML element. The following mapping APIs
 * are supported by Mapstraction:</p>
 *
 * <ul>
 * <li><code>esri</code> - ESRI ArcGIS</li>
 * <li><code>google</code> - Google v2</li>
 * <li><code>googlev3</code> - Google v3</li>
 * <li><code>leaflet</code> - Leaflet</li>
 * <li><code>mapquest</code> - MapQuest</li>
 * <li><code>microsoft</code> - Microsoft Bing v6</li>
 * <li><code>microsoft7</code> - Microsoft Bing v7</li>
 * <li><code>nokia</code> - Nokia Here</li>
 * <li><code>openlayers</code> - OpenLayers</li>
 * <li><code>openmq</code> - MapQuest Open</li>
 * <li><code>openspace</code> - Ordnance Survey OpenSpace</li>
 * <li><code>ovi</code> - Nokia Ovi</li>
 * <li><code>yahoo</code> - <strong><em>Yahoo (obsoleted)</em></strong></li>
 * <li><code>yandex</code> - Yandex</li>
 * <li><code>yandexv2</code> - Yandex v2</li>
 * </ul>
 * @name mxn.Mapstraction
 * @constructor
 * @param {string} element The HTML element to replace with a map.
 * @param {string} api The API ID of the mapping API to use; if omitted, the first loaded provider implementation is used.
 * @param {boolean} [debug] optional parameter to turn on debug support; this uses alert panels for unsupported actions.
 * @exports Mapstraction as mxn.Mapstraction
 */
var Mapstraction = mxn.Mapstraction = function(element, api, debug) {
	if (!api){
		api = mxn.util.getAvailableProviders()[0];
	}
	
	/**
	 * The name of the active API.
	 * @name mxn.Mapstraction#api
	 * @type {string}
	 */
	this.api = api;
		
	this.maps = {};
	
	/**
	 * The DOM element containing the map.
	 * @name mxn.Mapstraction#currentElement
	 * @property
	 * @type {DOMElement}
	 */
	this.currentElement = $m(element);
	
	this.eventListeners = [];
	
	/**
	 * The array of all layers that have been added to the map.
	 * @name mxn.Mapstraction#tileLayers
	 * @property
	 * @type {Array}
	 */
	this.tileLayers = [];	
		
	/**
	 * The array of currently loaded <code>mxn.Marker</code> objects.
	 * @name mxn.Mapstraction#markers
	 * @property
	 * @type {Array}
	 */
	this.markers = [];
		
	/**
	 * The array of currently loaded <code>mxn.Polyline</code> objects.
	 * @name mxn.Mapstraction#polylines
	 * @property
	 * @type {Array}
	 */
	this.polylines = [];
	
	this.images = [];
	this.controls = [];	
	this.loaded = {};
	this.onload = {};
    //this.loaded[api] = true; // FIXME does this need to be true? -ajturner
	this.onload[api] = [];
	
	/**
	 * The original element value passed to the constructor.
	 * @name mxn.Mapstraction#element
	 * @property
	 * @type {string|DOMElement}
	 */
	this.element = element;
	
	/**
	 * Options defaults.
	 * @name mxn.Mapstraction#options
	 * @property {Object}
	 */
	this.options = {
		enableScrollWheelZoom: false,
		enableDragging: true
	};
	
	this.addControlsArgs = {};
	
	// set up our invoker for calling API methods
	this.invoker = new mxn.Invoker(this, 'Mapstraction', function(){ return this.api; });
	
	// Adding our events
	mxn.addEvents(this, [
		
		/**
		 * Map has loaded
		 * @name mxn.Mapstraction#load
		 * @event
		 */
		'load',
		
		/**
		 * Map is clicked {location: mxn.LatLonPoint}
		 * @name mxn.Mapstraction#click
		 * @event
		 */
		'click',
		
		/**
		 * Map is panned
		 * @name mxn.Mapstraction#endPan
		 * @event
		 */
		'endPan',
		
		/**
		 * Zoom is changed
		 * @name mxn.Mapstraction#changeZoom
		 * @event
		 */
		'changeZoom',
		
		/**
		 * Marker is added {marker: Marker}
		 * @name mxn.Mapstraction#markerAdded
		 * @event
		 */
		'markerAdded',
		
		/**
		 * Marker is removed {marker: Marker}
		 * @name mxn.Mapstraction#markerRemoved
		 * @event
		 */
		'markerRemoved',
		
		/**
		 * Polyline is added {polyline: Polyline}
		 * @name mxn.Mapstraction#polylineAdded
		 * @event
		 */
		'polylineAdded',
		
		/**
		 * Polyline is removed {polyline: Polyline}
		 * @name mxn.Mapstraction#polylineRemoved
		 * @event
		 */
		'polylineRemoved'
	]);
	
	// finally initialize our proper API map
	init.apply(this);
};

// Map type constants
Mapstraction.ROAD = 1;
Mapstraction.SATELLITE = 2;
Mapstraction.HYBRID = 3;
Mapstraction.PHYSICAL = 4;

// methods that have no implementation in mapstraction core
mxn.addProxyMethods(Mapstraction, [ 
	/**
	 * Adds a large map panning control and zoom buttons to the map
	 * @name mxn.Mapstraction#addLargeControls
	 * @function
	 */
	'addLargeControls',
		
	/**
	 * Adds a map type control to the map (streets, aerial imagery etc)
	 * @name mxn.Mapstraction#addMapTypeControls
	 * @function
	 */
	'addMapTypeControls', 
	
	/**
	 * Adds a GeoRSS or KML overlay to the map
	 *  some flavors of GeoRSS and KML are not supported by some of the Map providers
	 * @name mxn.Mapstraction#addOverlay
	 * @function
	 * @param {string} url GeoRSS or KML feed URL
	 * @param {boolean} autoCenterAndZoom Set true to auto center and zoom after the feed is loaded
	 */
	'addOverlay', 
	
	/**
	 * Adds a small map panning control and zoom buttons to the map
	 * @name mxn.Mapstraction#addSmallControls
	 * @function
	 */
	'addSmallControls', 
	
	/**
	 * Applies the current option settings
	 * @name mxn.Mapstraction#applyOptions
	 * @function
	 */
	'applyOptions',
	
	/**
	 * Gets the BoundingBox of the map
	 * @name mxn.Mapstraction#getBounds
	 * @function
	 * @returns {mxn.BoundingBox} The bounding box for the current map state
	 */
	'getBounds', 
	
	/**
	 * Gets the central point of the map
	 * @name mxn.Mapstraction#getCenter
	 * @function
	 * @returns {mxn.LatLonPoint} The center point of the map
	 */
	'getCenter', 
	
	/**
	 * <p>Gets the imagery type for the map. The type can be one of:</p>
	 *
	 * <ul>
	 * <li><code>mxn.Mapstraction.ROAD</code></li>
	 * <li><code>mxn.Mapstraction.SATELLITE</code></li>
	 * <li><code>mxn.Mapstraction.HYBRID</code></li>
	 * <li><code>mxn.Mapstraction.PHYSICAL</code></li>
	 * </ul>
	 *
	 * @name mxn.Mapstraction#getMapType
	 * @function
	 * @returns {Number} 
	 */
	'getMapType', 

	/**
	 * Returns a ratio to turn distance into pixels based on the current projection.
	 * @name mxn.Mapstraction#getPixelRatio
	 * @function
	 * @returns {number} ratio
	 */
	'getPixelRatio', 
	
	/**
	 * Returns the zoom level of the map
	 * @name mxn.Mapstraction#getZoom
	 * @function
	 * @returns {number} The zoom level of the map
	 */
	'getZoom', 
	
	/**
	 * Returns the best zoom level for bounds given
	 * @name mxn.Mapstraction#getZoomLevelForBoundingBox
	 * @function
	 * @param {mxn.BoundingBox} bbox The bounds to fit
	 * @returns {number} The closest zoom level that contains the bounding box
	 */
	'getZoomLevelForBoundingBox', 
	
	/**
	 * Displays the coordinates of the cursor in the HTML element
	 * @name mxn.Mapstraction#mousePosition
	 * @function
	 * @param {string} element ID of the HTML element to display the coordinates in
	 */
	'mousePosition',
	
	/**
	 * Resize the current map to the specified width and height
	 * (since it is actually on a child div of the mapElement passed
	 * as argument to the Mapstraction constructor, the resizing of this
	 * mapElement may have no effect on the size of the actual map)
	 * @name mxn.Mapstraction#resizeTo
	 * @function
	 * @param {number} width The width the map should be.
	 * @param {number} height The width the map should be.
	 */
	'resizeTo', 
	
	/**
	 * Sets the map to the appropriate location and zoom for a given BoundingBox
	 * @name mxn.Mapstraction#setBounds
	 * @function
	 * @param {mxn.BoundingBox} bounds The bounding box you want the map to show
	 */
	'setBounds', 
	
	/**
	 * setCenter sets the central point of the map
	 * @name mxn.Mapstraction#setCenter
	 * @function
	 * @param {mxn.LatLonPoint} point The point at which to center the map
	 * @param {Object} [options] Optional parameters
	 * @param {boolean} options.pan Whether the map should move to the locations using a pan or just jump straight there
	 */
	'setCenter', 
	
	/**
	 * Centers the map to some place and zoom level
	 * @name mxn.Mapstraction#setCenterAndZoom
	 * @function
	 * @param {mxn.LatLonPoint} point Where the center of the map should be
	 * @param {number} zoom The zoom level where 0 is all the way out.
	 */
	'setCenterAndZoom', 
	
	/**
	 * <p>Sets the imagery type for the map. The type can be one of:</p>
	 *
	 * <ul>
	 * <li><code>mxn.Mapstraction.ROAD</code></li>
	 * <li><code>mxn.Mapstraction.SATELLITE</code></li>
	 * <li><code>mxn.Mapstraction.HYBRID</code></li>
	 * <li><code>mxn.Mapstraction.PHYSICAL</code></li>
	 * </ul>
	 *
	 * @name mxn.Mapstraction#setMapType
	 * @function
	 * @param {Number} type 
	 */
	'setMapType', 
	
	/**
	 * Sets the zoom level for the map.
	 * @name mxn.Mapstraction#setZoom
	 * @function
	 * @param {Number} zoom The (native to the map) level zoom the map to.
	 */
	'setZoom',
	
	/**
	 * Turns a tile layer on or off
	 * @name mxn.Mapstraction#toggleTileLayer
	 * @function
	 * @param {tile_url} url of the tile layer that was created.
	 */
	'toggleTileLayer'
]);

/**
 * Sets the current options to those specified in oOpts and applies them
 * @param {Object} oOpts Hash of options to set
 */
Mapstraction.prototype.setOptions = function(oOpts){
	mxn.util.merge(this.options, oOpts);
	this.applyOptions();
};

/**
 * Sets an option and applies it.
 * @param {string} sOptName Option name
 * @param vVal Option value
 */
Mapstraction.prototype.setOption = function(sOptName, vVal){
	this.options[sOptName] = vVal;
	this.applyOptions();
};

/**
 * Enable scroll wheel zooming
 * @deprecated Use setOption instead.
 */
Mapstraction.prototype.enableScrollWheelZoom = function() {
	this.setOption('enableScrollWheelZoom', true);
};

/**
 * Enable/disable dragging of the map
 * @param {boolean} on
 * @deprecated Use setOption instead.
 */
Mapstraction.prototype.dragging = function(on) {
	this.setOption('enableDragging', on);
};

/**
 * Change the current API on the fly
 * @see mxn.Mapstraction
 * @param {Object} element The DOM element containing the map
 * @param {string} api The API to swap to
 */
Mapstraction.prototype.swap = function(element, api) {
	if (this.api === api) {
		return;
	}

	var center = this.getCenter();
	var zoom = this.getZoom();

	this.currentElement.style.visibility = 'hidden';
	this.currentElement.style.display = 'none';

	this.currentElement = $m(element);
	this.currentElement.style.visibility = 'visible';
	this.currentElement.style.display = 'block';

	this.api = api;
	this.onload[api] = [];

	init.apply(this);
	
	for (var i = 0; i < this.markers.length; i++) {
		this.addMarker(this.markers[i], true);
	}

	for (var j = 0; j < this.polylines.length; j++) {
		this.addPolyline( this.polylines[j], true);
	}

	//TODO synchronize any overlays created after api instantiation are not sync'd
	
	this.setCenterAndZoom(center,zoom);		
	this.addControls(this.addControlsArgs);
};

/**
 * Returns the loaded state of a Map Provider
 * @param {string} [api] Optional API to query for. If not specified, returns the state of the originally created API
 */
Mapstraction.prototype.isLoaded = function(api){
	if (api === null) {
		api = this.api;
	}
	return this.loaded[api];
};

/**
 * Set the debugging on or off - shows alert panels for functions that don't exist in Mapstraction
 * @param {boolean} [debug] Specify <code>true</code> to turn on debugging or <code>false</code> to turn it off
 */
Mapstraction.prototype.setDebug = function(debug){
	if(debug !== null) {
		this.debug = debug;
	}
	return this.debug;
};

/**
 * Set the api call deferment on or off - When it's on, mxn.invoke will queue up provider API calls until
 * runDeferred is called, at which time everything in the queue will be run in the order it was added. 
 * @param {boolean} set deferred to true to turn on deferment
 */
Mapstraction.prototype.setDefer = function(deferred){
	this.loaded[this.api] = !deferred;
};

/**
 * Run any queued provider API calls for the methods defined in the provider's implementation.
 * For example, if defferable in mxn.[provider].core.js is set to {getCenter: true, setCenter: true}
 * then any calls to map.setCenter or map.getCenter will be queued up in this.onload. When the provider's
 * implementation loads the map, it calls this.runDeferred and any queued calls will be run.
 */
Mapstraction.prototype.runDeferred = function(){
	while(this.onload[this.api].length > 0) {  
		this.onload[this.api].shift().apply(this); //run deferred calls
	}
};

/////////////////////////
//
// Event Handling
//
// FIXME need to consolidate some of these handlers...
//
///////////////////////////

// Click handler attached to native API
Mapstraction.prototype.clickHandler = function(lat, lon, me) {
	this.callEventListeners('click', {
		location: new LatLonPoint(lat, lon)
	});
};

// Move and zoom handler attached to native API
Mapstraction.prototype.moveendHandler = function(me) {
	this.callEventListeners('moveend', {});
};

/**
 * Add a listener for an event.
 * @param {string} type Event type to attach listener to
 * @param {Function} func Callback function
 * @param {Object} caller Callback object
 */
Mapstraction.prototype.addEventListener = function() {
	var listener = {};
	listener.event_type = arguments[0];
	listener.callback_function = arguments[1];

	// added the calling object so we can retain scope of callback function
	if(arguments.length == 3) {
		listener.back_compat_mode = false;
		listener.callback_object = arguments[2];
	}
	else {
		listener.back_compat_mode = true;
		listener.callback_object = null;
	}
	this.eventListeners.push(listener);
};

/**
 * Call listeners for a particular event.
 * @param {string} sEventType Call listeners of this event type
 * @param {Object} oEventArgs Event args object to pass back to the callback
 */
Mapstraction.prototype.callEventListeners = function(sEventType, oEventArgs) {
	oEventArgs.source = this;
	for(var i = 0; i < this.eventListeners.length; i++) {
		var evLi = this.eventListeners[i];
		if(evLi.event_type == sEventType) {
			// only two cases for this, click and move
			if(evLi.back_compat_mode) {
				if(evLi.event_type == 'click') {
					evLi.callback_function(oEventArgs.location);
				}
				else {
					evLi.callback_function();
				}
			}
			else {
				var scope = evLi.callback_object || this;
				evLi.callback_function.call(scope, oEventArgs);
			}
		}
	}
};


////////////////////
//
// map manipulation
//
/////////////////////


/**
 * <p><code>addControls</code> adds (or removes) controls to/from the map. You specify which controls to add in
 * the object literal that is the only argument.<p>
 * <p>To remove all controls from the map, call <code>addControls</code> with an empty object literal as the
 * argument.<p>
 * <p>Each time <code>addControls</code> is called, those controls present in the <code>args</code> object literal will
 * be added; those that are not specified or as specified as false will be removed.</p>
 *
 * <pre>
 * args = {
 *	 pan:		true,
 *	 zoom:		'large' | 'small',
 *	 overview:	true,
 *	 scale:		true,
 *	 map_type:	true,
 * }
 * </pre>
 * @param {Array} args Which controls to switch on
 */
Mapstraction.prototype.addControls = function( args ) {
	this.addControlsArgs = args;
	this.invoker.go('addControls', arguments);
};

/**
 * Adds a marker pin to the map
 * @param {mxn.Marker} marker The marker to add
 * @param {boolean} old If true, doesn't add this marker to the markers array. Used by the "swap" method
 */
Mapstraction.prototype.addMarker = function(marker, old) {
	marker.mapstraction = this;
	marker.api = this.api;
	marker.location.api = this.api;
	marker.map = this.maps[this.api]; 
	var propMarker = this.invoker.go('addMarker', arguments);
	marker.setChild(propMarker);
	if (!old) {
		this.markers.push(marker);
	}
	this.markerAdded.fire({'marker': marker});
};

/**
 * addMarkerWithData will addData to the marker, then add it to the map
 * @param {mxn.Marker} marker The marker to add
 * @param {Object} data A data has to add
 */
Mapstraction.prototype.addMarkerWithData = function(marker, data) {
	marker.addData(data);
	this.addMarker(marker);
};

/**
 * addPolylineWithData will addData to the polyline, then add it to the map
 * @param {Polyline} polyline The polyline to add
 * @param {Object} data A data has to add
 */
Mapstraction.prototype.addPolylineWithData = function(polyline, data) {
	polyline.addData(data);
	this.addPolyline(polyline);
};

/**
 * Removes a Marker from the map
 * @param {mxn.Marker} marker The marker to remove
 */
Mapstraction.prototype.removeMarker = function(marker) {	
	var current_marker;
	for(var i = 0; i < this.markers.length; i++){
		current_marker = this.markers[i];
		if(marker == current_marker) {
			marker.closeBubble();
			this.invoker.go('removeMarker', arguments);
			marker.onmap = false;
			this.markers.splice(i, 1);
			this.markerRemoved.fire({'marker': marker});
			break;
		}
	}
};

/**
 * Removes all the Markers currently loaded on a map
 */
Mapstraction.prototype.removeAllMarkers = function() {
	var current_marker;
	while(this.markers.length > 0) {
		current_marker = this.markers.pop();
		this.invoker.go('removeMarker', [current_marker]);
	}
};

/**
 * Declutter the markers on the map, group together overlapping markers.
 * @param {Object} opts Declutter options
 */
Mapstraction.prototype.declutterMarkers = function(opts) {
	if(this.loaded[this.api] === false) {
		var me = this;
		this.onload[this.api].push( function() {
			me.declutterMarkers(opts);
		} );
		return;
	}

	var map = this.maps[this.api];

	switch(this.api)
	{
		//	case 'yahoo':
		//
		//	  break;
		//	case 'google':
		//
		//	  break;
		//	case 'openstreetmap':
		//
		//	  break;
		//	case 'microsoft':
		//
		//	  break;
		//	case 'openlayers':
		//
		//	  break;
		case 'multimap':
			/*
			 * Multimap supports quite a lot of decluttering options such as whether
			 * to use an accurate of fast declutter algorithm and what icon to use to
			 * represent a cluster. Using all this would mean abstracting all the enums
			 * etc so we're only implementing the group name function at the moment.
			 */
			map.declutterGroup(opts.groupName);
			break;
		//	case 'mapquest':
		//
		//	  break;
		//	case 'map24':
		//
		//	  break;
		case '  dummy':
			break;
		default:
			if(this.debug) {
				throw new Error(this.api + ' not supported by Mapstraction.declutterMarkers');
			}
	}
};

/**
 * Add a polyline to the map
 * @param {Polyline} polyline The Polyline to add to the map
 * @param {boolean} old If true replaces an existing Polyline
 */
Mapstraction.prototype.addPolyline = function(polyline, old) {
	polyline.api = this.api;
	polyline.map = this.maps[this.api];
	var propPoly = this.invoker.go('addPolyline', arguments);
	polyline.setChild(propPoly);
	if(!old) {
		this.polylines.push(polyline);
	}
	this.polylineAdded.fire({'polyline': polyline});
};

// Private remove implementation
var removePolylineImpl = function(polyline) {
	this.invoker.go('removePolyline', arguments);
	polyline.onmap = false;
	this.polylineRemoved.fire({'polyline': polyline});
};

/**
 * Remove the polyline from the map
 * @param {Polyline} polyline The Polyline to remove from the map
 */
Mapstraction.prototype.removePolyline = function(polyline) {
	var current_polyline;
	for(var i = 0; i < this.polylines.length; i++){
		current_polyline = this.polylines[i];
		if(polyline == current_polyline) {
			this.polylines.splice(i, 1);
			removePolylineImpl.call(this, polyline);
			break;
		}
	}
};

/**
 * Removes all polylines from the map
 */
Mapstraction.prototype.removeAllPolylines = function() {
	var current_polyline;
	while(this.polylines.length > 0) {
		current_polyline = this.polylines.pop();
		removePolylineImpl.call(this, current_polyline);
	}
};

var collectPoints = function(bMarkers, bPolylines, predicate) {
	var points = [];
	
	if (bMarkers) {	
		for (var i = 0; i < this.markers.length; i++) {
			var mark = this.markers[i];
			if (!predicate || predicate(mark)) {
				points.push(mark.location);
			}
		}
	}
	
	if (bPolylines) {
		for(i = 0; i < this.polylines.length; i++) {
			var poly = this.polylines[i];
			if (!predicate || predicate(poly)) {
				for (var j = 0; j < poly.points.length; j++) {
					points.push(poly.points[j]);
				}
			}
		}
	}

	return points;
};

/**
 * Sets the center and zoom of the map to the smallest bounding box
 * containing all markers and polylines
 */
Mapstraction.prototype.autoCenterAndZoom = function() {
	var points = collectPoints.call(this, true, true);
	
	this.centerAndZoomOnPoints(points);
};

/**
 * centerAndZoomOnPoints sets the center and zoom of the map from an array of points
 *
 * This is useful if you don't want to have to add markers to the map
 */
Mapstraction.prototype.centerAndZoomOnPoints = function(points) {
	var bounds = new BoundingBox(90, 180, -90, -180);

	for (var i = 0, len = points.length; i < len; i++) {
		bounds.extend(points[i]);
	}

	this.setBounds(bounds);
};

/**
 * Sets the center and zoom of the map to the smallest bounding box
 * containing all visible markers and polylines
 * will only include markers and polylines with an attribute of "visible"
 */
Mapstraction.prototype.visibleCenterAndZoom = function() {
	var predicate = function(obj) {
		return obj.getAttribute("visible");
	};
	var points = collectPoints.call(this, true, true, predicate);
	
	this.centerAndZoomOnPoints(points);
};

/**
 * Automatically sets center and zoom level to show all polylines
 * @param {Number} padding Optional number of kilometers to pad around polyline
 */
Mapstraction.prototype.polylineCenterAndZoom = function(padding) {
	padding = padding || 0;
	
	var points = collectPoints.call(this, false, true);
	
	if (padding > 0) {
		var padPoints = [];
		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			
			var kmInOneDegreeLat = point.latConv();
			var kmInOneDegreeLon = point.lonConv();
			
			var latPad = padding / kmInOneDegreeLat;
			var lonPad = padding / kmInOneDegreeLon;

			var ne = new LatLonPoint(point.lat + latPad, point.lon + lonPad);
			var sw = new LatLonPoint(point.lat - latPad, point.lon - lonPad);
			
			padPoints.push(ne, sw);			
		}
		points = points.concat(padPoints);
	}
	
	this.centerAndZoomOnPoints(points);
};

/**
 * addImageOverlay layers an georeferenced image over the map
 * @param {id} unique DOM identifier
 * @param {src} url of image
 * @param {opacity} opacity 0-100
 * @param {west} west boundary
 * @param {south} south boundary
 * @param {east} east boundary
 * @param {north} north boundary
 */
Mapstraction.prototype.addImageOverlay = function(id, src, opacity, west, south, east, north) {
	
	var b = document.createElement("img");
	b.style.display = 'block';
	b.setAttribute('id',id);
	b.setAttribute('src',src);
	b.style.position = 'absolute';
	b.style.zIndex = 1;
	b.setAttribute('west',west);
	b.setAttribute('south',south);
	b.setAttribute('east',east);
	b.setAttribute('north',north);
	
	var oContext = {
		imgElm: b
	};
	
	this.invoker.go('addImageOverlay', arguments, { context: oContext });
};

Mapstraction.prototype.setImageOpacity = function(id, opacity) {
	if (opacity < 0) {
		opacity = 0;
	}
	if (opacity >= 100) {
		opacity = 100;
	}
	var c = opacity / 100;
	var d = document.getElementById(id);
	if(typeof(d.style.filter)=='string'){
		d.style.filter='alpha(opacity:'+opacity+')';
	}
	if(typeof(d.style.KHTMLOpacity)=='string'){
		d.style.KHTMLOpacity=c;
	}
	if(typeof(d.style.MozOpacity)=='string'){
		d.style.MozOpacity=c;
	}
	if(typeof(d.style.opacity)=='string'){
		d.style.opacity=c;
	}
};

Mapstraction.prototype.setImagePosition = function(id) {
	var imgElement = document.getElementById(id);
	var oContext = {
		latLng: { 
			top: imgElement.getAttribute('north'),
			left: imgElement.getAttribute('west'),
			bottom: imgElement.getAttribute('south'),
			right: imgElement.getAttribute('east')
		},
		pixels: { top: 0, right: 0, bottom: 0, left: 0 }
	};
	
	this.invoker.go('setImagePosition', arguments, { context: oContext });

	imgElement.style.top = oContext.pixels.top.toString() + 'px';
	imgElement.style.left = oContext.pixels.left.toString() + 'px';
	imgElement.style.width = (oContext.pixels.right - oContext.pixels.left).toString() + 'px';
	imgElement.style.height = (oContext.pixels.bottom - oContext.pixels.top).toString() + 'px';
};

Mapstraction.prototype.addJSON = function(json) {
	var features;
	if (typeof(json) == "string") {
		if (window.JSON && window.JSON.parse) {
			features = window.JSON.parse(json);
		} else {
			features = eval('(' + json + ')');
		}
	} else {
		features = json;
	}
	features = features.features;
	var map = this.maps[this.api];
	var html = "";
	var item;
	var polyline;
	var marker;
	var markers = [];

	if(features.type == "FeatureCollection") {
		this.addJSON(features.features);
	}

	for (var i = 0; i < features.length; i++) {
		item = features[i];
		switch(item.geometry.type) {
			case "Point":
				html = "<strong>" + item.title + "</strong><p>" + item.description + "</p>";
				marker = new Marker(new LatLonPoint(item.geometry.coordinates[1],item.geometry.coordinates[0]));
				markers.push(marker);
				this.addMarkerWithData(marker,{
					infoBubble : html,
					label : item.title,
					date : "new Date(\""+item.date+"\")",
					iconShadow : item.icon_shadow,
					marker : item.id,
					iconShadowSize : item.icon_shadow_size,
					icon : item.icon,
					iconSize : item.icon_size,
					category : item.source_id,
					draggable : false,
					hover : false
				});
				break;
			case "Polygon":
				var points = [];
				for (var j = 0; j < item.geometry.coordinates[0].length; j++) {
					points.push(new LatLonPoint(item.geometry.coordinates[0][j][1], item.geometry.coordinates[0][j][0]));
				}
				polyline = new Polyline(points);
				this.addPolylineWithData(polyline,{
					fillColor : item.poly_color,
					date : "new Date(\""+item.date+"\")",
					category : item.source_id,
					width : item.line_width,
					opacity : item.line_opacity,
					color : item.line_color,
					closed : points[points.length-1].equals(points[0]) //first point = last point in the polygon so its closed
				});
				markers.push(polyline);
				break;
			default:
		// console.log("Geometry: " + features.items[i].geometry.type);
		}
	}
	return markers;
};

/**
 * <p>Adds a Tile Layer to the map.</p>
 * 
 * <p>Requires providing a templated tile URL. Use <code>{S}</code>, <code>{Z}</code>, <code>{X}</code>, and <code>{Y}</code> to specify where the parameters
 * should go in the URL. <code>{S}</code> is the (optional) subdomain to be used in the URL. <code>{Z}</code> is the zoom level.
 * <code>{X}</code> and <code>{Y}</code> are the longitude and latitude of the tile.</p>
 *
 * <p>Sample templated tile URLs are :-</p>
 *
 * <ul>
 * <li>OpenStreetMap - <code>http://{S}.tile.openstreetmap.org/{Z}/{X}/{Y}.png</code></li>
 * <li>Stamen Toner - <code>http://tile.stamen.com/toner/{Z}/{X}/{Y}.png</code></li>
 * <li>MapQuest OSM - <code>http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg</code></li>
 * <li>MapQuest Open Aerial - <code>http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg</code></li>
 * </ul>
 *
 * @param {string} tile_url Template URL of the tiles.
 * @param {number} opacity Opacity of the tile layer - 0 is transparent, 1 is opaque. (default=0.6)
 * @param {string} label The label to be used for the tile layer in the Map Type control
 * @param {string} attribution The attribution and/or copyright text to use for the tile layer
 * @param {Int} min_zoom Minimum (furthest out) zoom level that tiles are available (default=1)
 * @param {Int} max_zoom Maximum (closest in) zoom level that the tiles are available (default=18)
 * @param {boolean} map_type Should the tile layer be a selectable map type in the layers palette (default=false)
 * @param {String|Array} subdomains List of subdomains that the tile server in <code>tile_url</code> refers to. Can be specified as a string "abc" or as an array [1, 2, 3]
 * @return {Object} The tile layer object
 */
Mapstraction.prototype.addTileLayer = function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
	if(!tile_url) {
		return;
	}
	
	opacity = opacity || 0.6;
	label = label || "Mapstraction";
	attribution = attribution || "Mapstraction";
	min_zoom = min_zoom || 1;
	max_zoom = max_zoom || 18;
	map_type = map_type || false;

	return this.invoker.go('addTileLayer', [ tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains] );
};

/**
 * addFilter adds a marker filter
 * @param {field} name of attribute to filter on
 * @param {operator} presently only "ge" or "le"
 * @param {value} the value to compare against
 */
Mapstraction.prototype.addFilter = function(field, operator, value) {
	if (!this.filters) {
		this.filters = [];
	}
	this.filters.push( [field, operator, value] );
};

/**
 * Remove the specified filter
 * @param {Object} field
 * @param {Object} operator
 * @param {Object} value
 */
Mapstraction.prototype.removeFilter = function(field, operator, value) {
	if (!this.filters) {
		return;
	}

	var del;
	for (var f=0; f<this.filters.length; f++) {
		if (this.filters[f][0] == field &&
			(! operator || (this.filters[f][1] == operator && this.filters[f][2] == value))) {
			this.filters.splice(f,1);
			f--; //array size decreased
		}
	}
};

/**
 * Delete the current filter if present; otherwise add it
 * @param {Object} field
 * @param {Object} operator
 * @param {Object} value
 */
Mapstraction.prototype.toggleFilter = function(field, operator, value) {
	if (!this.filters) {
		this.filters = [];
	}

	var found = false;
	for (var f = 0; f < this.filters.length; f++) {
		if (this.filters[f][0] == field && this.filters[f][1] == operator && this.filters[f][2] == value) {
			this.filters.splice(f,1);
			f--; //array size decreased
			found = true;
		}
	}

	if (! found) {
		this.addFilter(field, operator, value);
	}
};

/**
 * removeAllFilters
 */
Mapstraction.prototype.removeAllFilters = function() {
	this.filters = [];
};

/**
 * doFilter executes all filters added since last call
 * Now supports a callback function for when a marker is shown or hidden
 * @param {Function} showCallback
 * @param {Function} hideCallback
 * @returns {Int} count of visible markers
 */
Mapstraction.prototype.doFilter = function(showCallback, hideCallback) {
	var map = this.maps[this.api];
	var visibleCount = 0;
	var f;
	if (this.filters) {
		switch (this.api) {
			case 'multimap':
				/* TODO polylines aren't filtered in multimap */
				var mmfilters = [];
				for (f=0; f<this.filters.length; f++) {
					mmfilters.push( new MMSearchFilter( this.filters[f][0], this.filters[f][1], this.filters[f][2] ));
				}
				map.setMarkerFilters( mmfilters );
				map.redrawMap();
				break;
			case '  dummy':
				break;
			default:
				var vis;
				for (var m=0; m<this.markers.length; m++) {
					vis = true;
					for (f = 0; f < this.filters.length; f++) {
						if (! this.applyFilter(this.markers[m], this.filters[f])) {
							vis = false;
						}
					}
					if (vis) {
						visibleCount ++;
						if (showCallback){
							showCallback(this.markers[m]);
						}
						else {
							this.markers[m].show();
						}
					} 
					else { 
						if (hideCallback){
							hideCallback(this.markers[m]);
						}
						else {
							this.markers[m].hide();
						}
					}

					this.markers[m].setAttribute("visible", vis);
				}
				break;
		}
	}
	return visibleCount;
};

Mapstraction.prototype.applyFilter = function(o, f) {
	var vis = true;
	switch (f[1]) {
		case 'ge':
			if (o.getAttribute( f[0] ) < f[2]) {
				vis = false;
			}
			break;
		case 'le':
			if (o.getAttribute( f[0] ) > f[2]) {
				vis = false;
			}
			break;
		case 'eq':
			if (o.getAttribute( f[0] ) != f[2]) {
				vis = false;
			}
			break;
		case 'in':
			if ( typeof(o.getAttribute( f[0] )) == 'undefined' ) {
				vis = false;
			} else if (o.getAttribute( f[0] ).indexOf( f[2] ) == -1 ) {
				vis = false;
			}
			break;
	}

	return vis;
};

/**
 * getAttributeExtremes returns the minimum/maximum of "field" from all markers
 * @param {field} name of "field" to query
 * @returns {Array} of minimum/maximum
 */
Mapstraction.prototype.getAttributeExtremes = function(field) {
	var min;
	var max;
	for (var m=0; m<this.markers.length; m++) {
		if (! min || min > this.markers[m].getAttribute(field)) {
			min = this.markers[m].getAttribute(field);
		}
		if (! max || max < this.markers[m].getAttribute(field)) {
			max = this.markers[m].getAttribute(field);
		}
	}
	for (var p=0; m<this.polylines.length; m++) {
		if (! min || min > this.polylines[p].getAttribute(field)) {
			min = this.polylines[p].getAttribute(field);
		}
		if (! max || max < this.polylines[p].getAttribute(field)) {
			max = this.polylines[p].getAttribute(field);
		}
	}

	return [min, max];
};

/**
 * getMap returns the native map object that mapstraction is talking to
 * @returns the native map object mapstraction is using
 */
Mapstraction.prototype.getMap = function() {
	// FIXME in an ideal world this shouldn't exist right?
	return this.maps[this.api];
};


//////////////////////////////
//
//   LatLonPoint
//
/////////////////////////////

/**
 * Defines a coordinate point, expressed as a latitude and longitude.
 * @name mxn.LatLonPoint
 * @constructor
 * @param {number} lat The point's latitude
 * @param {number} lon The point's longitude
 * @exports LatLonPoint as mxn.LatLonPoint
 */
var LatLonPoint = mxn.LatLonPoint = function(lat, lon) {	
	this.lat = Number(lat); // force to be numeric
	this.lon = Number(lon);
	this.lng = this.lon; // lets be lon/lng agnostic
	
	this.invoker = new mxn.Invoker(this, 'LatLonPoint');		
};

mxn.addProxyMethods(LatLonPoint, [ 
	/**
	 * Extract the lat and lon values from a proprietary point.
	 * @name mxn.LatLonPoint#fromProprietary
	 * @function
	 * @param {string} api The API ID of the proprietary point.
	 * @param {Object} point The proprietary point.
	 */
	'fromProprietary',
	
	/**
	 * Converts the current LatLonPoint to a proprietary one for the API specified by <code>api</code>.
	 * @name mxn.LatLonPoint#toProprietary
	 * @function
	 * @param {string} api The API ID of the proprietary point.
	 * @returns A proprietary point.
	 */
	'toProprietary'
], true);

/**
 * Returns a string representation of a point
 * @name mxn.LatLonPoint#toString
 * @param {Number} places Optional number of decimal places to display for the lat and long
 * @returns A string like '51.23, -0.123'
 * @type {string}
 */
LatLonPoint.prototype.toString = function(places) {
	if (typeof places !== 'undefined') {
		return this.lat.toFixed(places) + ', ' + this.lon.toFixed(places);
	}
	else {
		return this.lat + ', ' + this.lon;
	}
};

/**
 * Returns the distance in kilometers between two <code>mxn.LatLonPoint</code> objects.
 * @param {mxn.LatLonPoint} otherPoint The other point to measure the distance from to this one
 * @returns The distance between the points in kilometers
 * @type {number}
 */
LatLonPoint.prototype.distance = function(otherPoint) {
	// Uses Haversine formula from http://www.movable-type.co.uk
	var rads = Math.PI / 180;
	var diffLat = (this.lat-otherPoint.lat) * rads;
	var diffLon = (this.lon-otherPoint.lon) * rads; 
	var a = Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
		Math.cos(this.lat*rads) * Math.cos(otherPoint.lat*rads) * 
		Math.sin(diffLon/2) * Math.sin(diffLon/2); 
	return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 6371; // Earth's mean radius in km
};

/**
 * Tests if this <code>mxn.LatLonPoint</code> is equal to another point by precisely comparing the latitude and longitude values.
 * @param {mxn.LatLonPoint} otherPoint The other point to test with
 * @returns true or false
 * @type {boolean}
 */
LatLonPoint.prototype.equals = function(otherPoint) {
	return this.lat == otherPoint.lat && this.lon == otherPoint.lon;
};

/**
 * Returns the latitude conversion based on the map's current projection
 * @returns {number} conversion
 */
LatLonPoint.prototype.latConv = function() {
	return this.distance(new LatLonPoint(this.lat + 0.1, this.lon))*10;
};

/**
 * Returns the longitude conversion based on the map's current projection
 * @returns {number} conversion
 */
LatLonPoint.prototype.lonConv = function() {
	return this.distance(new LatLonPoint(this.lat, this.lon + 0.1))*10;
};


//////////////////////////
//
//  BoundingBox
//
//////////////////////////

/**
 * Defines a bounding box, expressed as a rectangle by coordinates for the south west and north east corners.
 * @name mxn.BoundingBox
 * @constructor
 * @param {number} swlat The latitude of the south-west point
 * @param {number} swlon The longitude of the south-west point
 * @param {number} nelat The latitude of the north-east point
 * @param {number} nelon The longitude of the north-east point
 * @exports BoundingBox as mxn.BoundingBox
 */
var BoundingBox = mxn.BoundingBox = function(swlat, swlon, nelat, nelon) {
	//FIXME throw error if box bigger than world
	this.sw = new LatLonPoint(swlat, swlon);
	this.ne = new LatLonPoint(nelat, nelon);
	this.se = new LatLonPoint(swlat, nelon);
	this.nw = new LatLonPoint(nelat, swlon);
};

/**
 * Returns the <code>mxn.LatLonPoint</code> of the south-west point of the bounding box
 * @returns The south-west point of the bounding box
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.getSouthWest = function() {
	return this.sw;
};

/**
 * Returns the <code>mxn.LatLonPoint</code> of the south-east point of the bounding box
 * @returns The south-east point of the bounding box
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.getSouthEast = function() {
	return this.se;
};

/**
 * Returns the <code>mxn.LatLonPoint</code> of the north-west point of the bounding box
 * @returns The north-west point of the bounding box
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.getNorthWest = function() {
	return this.nw;
};

/**
 * Returns the <code>mxn.LatLonPoint</code> of the north-east point of the bounding box
 * @returns The north-east point of the bounding box
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.getNorthEast = function() {
	return this.ne;
};

/**
 * Determines if this <code>mxn.BoundingBox</code> has a zero area
 * @returns Whether the north-east and south-west points of the bounding box are the same point
 * @type {boolean}
 */
BoundingBox.prototype.isEmpty = function() {
	return this.ne == this.sw; // is this right? FIXME
};

/**
 * Determines whether a given <code>mxn.LatLonPoint</code> is within an <code>mxn.BoundingBox</code>
 * @param {mxn.LatLonPoint} point the point to test with
 * @returns Whether point is within this bounding box
 * @type {boolean}
 */
BoundingBox.prototype.contains = function(point) {
	return point.lat >= this.sw.lat && point.lat <= this.ne.lat &&
		((this.sw.lon <= this.ne.lon && point.lon >= this.sw.lon && point.lon <= this.ne.lon) ||
			(this.sw.lon > this.ne.lon && (point.lon >= this.sw.lon || point.lon <= this.ne.lon)));
};

/**
 * Returns an <code>mxn.LatLonPoint</code> with the lat and lon as the height and width of the <code>mxn.BoundingBox</code>
 * @returns A <code>mxn.LatLonPoint</code> containing the height and width of this the <code>mxn.BoundingBox</code>
 * @type {mxn.LatLonPoint}
 */
BoundingBox.prototype.toSpan = function() {
	return new LatLonPoint( Math.abs(this.sw.lat - this.ne.lat), Math.abs(this.sw.lon - this.ne.lon) );
};


/**
 * Returns a string representation of an <code>mxn.BoundingBox</code>
 * @param {Number} [places] Optional number of decimal places to display for each lat and long
 * @returns A string like <code>SW: 52.62647572585443, 41.90677719368304, NE: 55.21343254471387, 56.01322251932069</code>
 * @type {string}
 */
BoundingBox.prototype.toString = function(places) {
	var sw;
	var ne;
	
	if (typeof places !== 'undefined') {
		sw = this.sw.toString(places);
		ne = this.ne.toString(places);
	}
	else {

		sw = this.sw;
		ne = this.ne;
	}

	return 'SW: ' + sw +  ', NE: ' + ne;
};

/**
 * Extends the <code>mxn.BoundingBox</code> to include the new the <code>mxn.LatLonPoint</code>
 * @param {mxn.LatLonPoint} point The <code>mxn.LatLonPoint</code> around which the <code>mxn.BoundingBox</code> should be extended
 */
BoundingBox.prototype.extend = function(point) {
	var extended = false;
	if (this.sw.lat > point.lat) {
		this.sw.lat = point.lat;
		extended = true;
	}
	if (this.sw.lon > point.lon) {
		this.sw.lon = point.lon;
		extended = true;
	}
	if (this.ne.lat < point.lat) {
		this.ne.lat = point.lat;
		extended = true;
	}
	if (this.ne.lon < point.lon) {
		this.ne.lon = point.lon;
		extended = true;
	}
	
	if (extended) {
		this.se = new LatLonPoint(this.sw.lat, this.ne.lon);
		this.nw = new LatLonPoint(this.ne.lat, this.sw.lon);
	}
	return;
};

/**
 * Determines whether a given <code>mxn.BoundingBox</code> intersects another <code>mxn.BoundingBox</code>
 * @param {mxn.BoundingBox} other The <code>mxn.BoundingBox</code> to test against
 * @returns Whether the current <code>mxn.BoundingBox</code> overlaps the other
 * @type {boolean}
 */
BoundingBox.prototype.intersects = function(other) {
	return this.sw.lat <= other.ne.lat && this.ne.lat >= other.sw.lat &&
		((this.sw.lon <= this.ne.lon && other.sw.lon <= other.ne.lon && this.sw.lon <= other.ne.lon && this.ne.lon >= other.sw.lon) ||
			(this.sw.lon > this.ne.lon && other.sw.lon > other.ne.lon) ||
			(this.sw.lon > this.ne.lon && other.sw.lon <= other.ne.lon && (this.sw.lon <= other.ne.lon || this.ne.lon >= other.sw.lon)) ||
			(this.sw.lon <= this.ne.lon && other.sw.lon > other.ne.lon && (this.ne.lon >= other.sw.lon || this.sw.lon <= other.ne.lon)));
};

//////////////////////////////
//
//  Marker
//
///////////////////////////////

/**
 * Creates a Mapstraction map marker capable of showing an optional <code>infoBubble</code> pop-up.
 * @name mxn.Marker
 * @constructor
 * @param {mxn.LatLonPoint} point The point specifying where on the map the <code>mxn.Marker</code> should be positioned.
 * @exports Marker as mxn.Marker
 */
var Marker = mxn.Marker = function(point) {
	this.api = null;
	this.location = point;
	this.onmap = false;
	this.proprietary_marker = false;
	this.attributes = [];
	this.invoker = new mxn.Invoker(this, 'Marker', function(){return this.api;});
	mxn.addEvents(this, [ 
		'openInfoBubble',	// Info bubble opened
		'closeInfoBubble', 	// Info bubble closed
		'click'				// Marker clicked
	]);
};

mxn.addProxyMethods(Marker, [ 
	/**
	 * Retrieve the settings from a proprietary marker.
	 * @name mxn.Marker#fromProprietary
	 * @function
	 * @param {string} api The API ID of the proprietary point.
	 * @param {Object} marker The proprietary marker.
	 */
	'fromProprietary',
	
	/**
	 * Hide the marker.
	 * @name mxn.Marker#hide
	 * @function
	 */
	'hide',
	
	/**
	 * Open the marker's <code>infoBubble</code> pop-up
	 * @name mxn.Marker#openBubble
	 * @function
	 */
	'openBubble',
	
	/**
	 * Closes the marker's <code>infoBubble</code> pop-up
	 * @name mxn.Marker#closeBubble
	 * @function
	 */
	'closeBubble',
	
	/**
	 * Show the marker.
	 * @name mxn.Marker#show
	 * @function
	 */
	'show',
	
	/**
	 * Converts the current Marker to a proprietary one for the API specified by <code>api</code>.
	 * @name mxn.Marker#toProprietary
	 * @function
	 * @param {string} api The API ID of the proprietary marker.
	 * @returns {Object} A proprietary marker.
	 */
	'toProprietary',
	
	/**
	 * Updates the Marker with the location of the attached proprietary marker on the map.
	 * @name mxn.Marker#update
	 * @function
	 */
	'update'
]);

/**
 * Sets a proprietary marker as a child of the current <code>mxn.Marker</code>.
 * @name mxn.Marker#setChild
 * @function
 * @param {Object} childMarker The proprietary marker's object
 */
Marker.prototype.setChild = function(childMarker) {
	this.proprietary_marker = childMarker;
	childMarker.mapstraction_marker = this;
	this.onmap = true;
};

/**
 * Sets the label text of the current <code>mxn.Marker</code>. The label is used in some maps
 * API implementation as the text to be displayed when the mouse pointer hovers over the marker.
 * @name mxn.Marker#setLabel
 * @function
 * @param {string} labelText The text to be used for the label
 */
Marker.prototype.setLabel = function(labelText) {
	this.labelText = labelText;
};

/**
 * Sets the properties of a marker via an object literal, which contains the following
 * property name/value pairs:
 *
 * <pre>
 * options = {
 *	label: 'marker label; see <code>mxn.Marker.setLabel()</code>',
 *	infoBubble: 'infoBubble text or HTML, see <code>mxn.Marker.setInfoBubble()</code>',
 *	icon: 'icon image URL, see <code>mxn.Marker.setIcon()</code>',
 *	iconSize: 'icon image size, see <code>mxn.Marker.setIcon()</code>',
 *	iconAnchor: 'icon image anchor, see <code>mxn.Marker.setIcon()</code>',
 *	iconShadow: 'icon shadow image URL, see <code>mxn.Marker.setShadowIcon()</code>',
 *	iconShadowSize: 'icon shadow size, see <code>mxn.Marker.setShadowIcon()</code>',
 *	infoDiv: 'informational div, see <code>mxn.Marker.setInfoDiv()</code>',
 *	draggable: 'draggable state, see <code>mxn.Marker.setDraggable()</code>',
 *	hover: 'hover text, see <code>mxn.Marker.setHover()</code>',
 *	hoverIcon: 'hover icon URL, see <code>mxn.Marker.setHoverIcon()</code>',
 *	openBubble: 'if specified, calls <code>mxn.Marker.openBubble()</code>',
 *	closeBubble: 'if specified, calls <code>mxn.Marker.closeBubble()</code>',
 *	groupName: 'marker group name, see <code>mxn.Marker.setGroupName()</code>'
 * };
 * </pre>
 *
 * <p>Any other literal name value pairs are added to the marker's list of properties.</p>
 * @param {Object} options An object literal of property name/value pairs.
 */
Marker.prototype.addData = function(options){
	for(var sOptKey in options) {
		if(options.hasOwnProperty(sOptKey)){
			switch(sOptKey) {
				case 'label':
					this.setLabel(options.label);
					break;
				case 'infoBubble':
					this.setInfoBubble(options.infoBubble);
					break;
				case 'icon':
					if(options.iconSize && options.iconAnchor) {
						this.setIcon(options.icon, options.iconSize, options.iconAnchor);
					}
					else if(options.iconSize) {
						this.setIcon(options.icon, options.iconSize);
					}
					else {
						this.setIcon(options.icon);
					}
					break;
				case 'iconShadow':
					if(options.iconShadowSize) {
						this.setShadowIcon(options.iconShadow, [ options.iconShadowSize[0], options.iconShadowSize[1] ]);
					}
					else {
						this.setIcon(options.iconShadow);
					}
					break;
				case 'infoDiv':
					this.setInfoDiv(options.infoDiv[0],options.infoDiv[1]);
					break;
				case 'draggable':
					this.setDraggable(options.draggable);
					break;
				case 'hover':
					this.setHover(options.hover);
					break;
				case 'hoverIcon':
					this.setHoverIcon(options.hoverIcon);
					break;
				case 'openBubble':
					this.openBubble();
					break;
				case 'closeBubble':
					this.closeBubble();
					break;
				case 'groupName':
					this.setGroupName(options.groupName);
					break;
				default:
					// don't have a specific action for this bit of
					// data so set a named attribute
					this.setAttribute(sOptKey, options[sOptKey]);
					break;
			}
		}
	}
};

/**
 * Sets the HTML or text content for the marker's <code>InfoBubble</code> pop-up.
 * @param {string} infoBubble The HTML or plain text to be displayed
 */
Marker.prototype.setInfoBubble = function(infoBubble) {
	this.infoBubble = infoBubble;
};

/**
 * Sets the text content and the id of the <code>DIV</code> element to display additional
 * information associated with the marker; useful for putting information in a <code>DIV</code>
 * outside of the map
 * @param {string} infoDiv The HMTML or text content to be displayed
 * @param {string} div The element id to use for displaying the HTML or text content
 */
Marker.prototype.setInfoDiv = function(infoDiv, div){
	this.infoDiv = infoDiv;
	this.div = div;
};

/**
 * Sets the icon for a marker
 * @param {string} iconUrl The URL of the image you want to be the icon
 */
Marker.prototype.setIcon = function(iconUrl, iconSize, iconAnchor) {
	this.iconUrl = iconUrl;
	if(iconSize) {
		this.iconSize = iconSize;
	}
	if(iconAnchor) {
		this.iconAnchor = iconAnchor;
	}
};

/**
 * Sets the size of the icon for a marker
 * @param {Array} iconSize The array size in pixels of the marker image: <code>[width, height]</code>
 */
Marker.prototype.setIconSize = function(iconSize) {
	if(iconSize) {
		this.iconSize = iconSize;
	}
};

/**
 * Sets the anchor point for a marker
 * @param {Array} iconAnchor The array offset in pixels of the anchor point from top left: <code>[right, down]</code>
 */
Marker.prototype.setIconAnchor = function(iconAnchor){
	if(iconAnchor) {
		this.iconAnchor = iconAnchor;
	}
};

/**
 * Sets the icon for a marker
 * @param {string} iconUrl The URL of the image you want to be the icon
 */
Marker.prototype.setShadowIcon = function(iconShadowUrl, iconShadowSize){
	this.iconShadowUrl = iconShadowUrl;
	if(iconShadowSize) {
		this.iconShadowSize = iconShadowSize;
	}
};

/**
 * Sets the icon to be used on hover
 * @param {strong} hoverIconUrl The URL of the image to be used
 */
Marker.prototype.setHoverIcon = function(hoverIconUrl){
	this.hoverIconUrl = hoverIconUrl;
};

/**
 * Sets the draggable state of the marker
 * @param {boolean} draggable Set to <code>true</code> if the marker should be draggable by the user
 */
Marker.prototype.setDraggable = function(draggable) {
	this.draggable = draggable;
};

/**
 * Sets that the marker label is to be displayed on hover
 * @param {boolean} hover Set to <code>true</code> if the marker should display the label on hover
 */
Marker.prototype.setHover = function(hover) {
	this.hover = hover;
};

/**
 * Add this marker to a named group; used in decluttering a group of markers.
 * @param {string} groupName Name of the marker's group
 * @see mxn.Mapstraction.declutterGroup
 */
Marker.prototype.setGroupName = function(groupName) {
	this.groupName = groupName;
};

/**
 * Set an arbitrary property name and value on a marker
 * @param {string} key The property key name
 * @param {string} value The property value to be associated with the key
 */
Marker.prototype.setAttribute = function(key,value) {
	this.attributes[key] = value;
};

/**
 * Gets the value of a marker's property
 * @param {string} key The key whose value is to be returned
 * @returns {string} The value associated with the key
 */
Marker.prototype.getAttribute = function(key) {
	return this.attributes[key];
};


///////////////
// Polyline ///
///////////////

/**
 * Creates a Mapstraction Polyline; either an open-ended polyline or an enclosed polygon.
 * @name mxn.Polyline
 * @constructor
 * @param {Array} points Array of <code>mxn.LatLonPoint</code> that make up the Polyline.
 * @exports Polyline as mxn.Polyline
 */
var Polyline = mxn.Polyline = function(points) {
	this.api = null;
	this.points = points;
	this.attributes = [];
	this.onmap = false;
	this.proprietary_polyline = false;
	this.pllID = "mspll-"+new Date().getTime()+'-'+(Math.floor(Math.random()*Math.pow(2,16)));
	this.invoker = new mxn.Invoker(this, 'Polyline', function(){return this.api;});
	this.color = "#000000";
	this.width = 3;
	this.opacity = 0.5;
	this.closed = false;
	this.fillColor = "#808080";
};

mxn.addProxyMethods(Polyline, [ 

	/**
	 * Retrieve the settings from a proprietary polyline.
	 * @name mxn.Polyline#fromProprietary
	 * @function
	 * @param {string} api The API ID of the proprietary polyline.
	 * @param {Object} polyline The proprietary polyline.
	 */
	'fromProprietary', 
	
	/**
	 * Hide the polyline.
	 * @name mxn.Polyline#hide
	 * @function
	 */
	'hide',
	
	/**
	 * Show the polyline.
	 * @name mxn.Polyline#show
	 * @function
	 */
	'show',
	
	/**
	 * Converts the current Polyline to a proprietary one for the API specified by <code>api</code>.
	 * @name mxn.Polyline#toProprietary
	 * @function
	 * @param {string} api The API ID of the proprietary polyline.
	 * @returns {Object} A proprietary polyline.
	 */
	'toProprietary',
	
	/**
	 * Updates the Polyline with the path of the attached proprietary polyline on the map.
	 * @name mxn.Polyline#update
	 * @function
	 */
	'update'
]);

/**
 * <p>Sets the properties of a polyline via an object literal, which contains the following
 * property name/value pairs:</p>
 *
 * <pre>
 * options = {
 *	color: 'line color; see <code>mxn.Polyline.setColor()</code>',
 *	width: 'line stroke width; see <code>mxn.Polyline.setWidth()</code>',
 *	opacity: 'polyline opacity; see <code>mxn.Polyline.setOpacity()</code>',
 *	closed: 'polyline or polygon; see <code>mxn.Polyline.setClosed()</code>',
 *	fillColor: 'fill color; see <code>mxn.Polyline.seFillColor()</code>',
 * };
 * </pre>
 *
 * <p>Any other literal name value pairs are added to the marker's list of properties.</p>
 * @param {Object} options An object literal of property name/value pairs.
 */
Polyline.prototype.addData = function(options){
	for(var sOpt in options) {
		if(options.hasOwnProperty(sOpt)){
			switch(sOpt) {
				case 'color':
					this.setColor(options.color);
					break;
				case 'width':
					this.setWidth(options.width);
					break;
				case 'opacity':
					this.setOpacity(options.opacity);
					break;
				case 'closed':
					this.setClosed(options.closed);
					break;
				case 'fillColor':
					this.setFillColor(options.fillColor);
					break;
				default:
					this.setAttribute(sOpt, options[sOpt]);
					break;
			}
		}
	}
};

/**
 * Sets a proprietary polyline as a child of the current <code>mxn.Polyline</code>.
 * @param {Object} childPolyline The proprietary polyline's object
 */
Polyline.prototype.setChild = function(childPolyline) {
	this.proprietary_polyline = childPolyline;
	this.onmap = true;
};

/**
 * Sets the line color for the polyline.
 * @param {string} color RGB color expressed in the form <code>#RRGGBB</code>
 */
Polyline.prototype.setColor = function(color){
	this.color = (color.length==7 && color[0]=="#") ? color.toUpperCase() : color;
};

/**
 * Sets the line stroke width of the polyline
 * @param {number} width Line stroke width in pixels.
 */
Polyline.prototype.setWidth = function(width){
	this.width = width;
};

/**
 * Sets the polyline opacity.
 * @param {number} opacity A number between <code>0.0</code> (transparent) and <code>1.0</code> (opaque)
 */
Polyline.prototype.setOpacity = function(opacity){
	this.opacity = opacity;
};

/**
 * Marks the polyline as a closed polygon
 * @param {boolean} closed Specify as <code>true</code> to mark the polyline as an enclosed polygon
 */
Polyline.prototype.setClosed = function(closed){
	this.closed = closed;
};

/**
 * Sets the fill color for a closed polyline.
 * @param {string} color RGB color expressed in the form <code>#RRGGBB</code>
 */
Polyline.prototype.setFillColor = function(fillColor) {
	this.fillColor = fillColor;
};


/**
 * Set an arbitrary property name and value on a polyline
 * @param {string} key The property key name
 * @param {string} value The property value to be associated with the key
 */
Polyline.prototype.setAttribute = function(key, value) {
	this.attributes[key] = value;
};

/**
 * Gets the value of a polyline's property
 * @param {string} key The key whose value is to be returned
 * @returns {string} The value associated with the key
 */
Polyline.prototype.getAttribute = function(key) {
	return this.attributes[key];
};

/**
 * Simplifies a polyline, averaging and reducing the points
 * @param {number} tolerance The simplification tolerance; 1.0 is a good starting point
 */
Polyline.prototype.simplify = function(tolerance) {
	var reduced = [];

	// First point
	reduced[0] = this.points[0];

	var markerPoint = 0;

	for (var i = 1; i < this.points.length-1; i++){
		if (this.points[i].distance(this.points[markerPoint]) >= tolerance)
		{
			reduced[reduced.length] = this.points[i];
			markerPoint = i;
		}
	}

	// Last point
	reduced[reduced.length] = this.points[this.points.length-1];

	// Revert
	this.points = reduced;
};

///////////////
// Radius	//
///////////////

/**
 * Creates a Mapstraction Radius for drawing circles around a given point. Note that creating
 * a radius performs a lot of initial calculation which can lead to increased page load times.
 * @name mxn.Radius
 * @constructor
 * @param {mxn.LatLonPoint} center Central <code>mxn.LatLonPoint</code> of the radius
 * @param {number} quality Number of points that comprise the approximated circle (20 is a good starting point)
 * @exports Radius as mxn.Radius
 */
var Radius = mxn.Radius = function(center, quality) {
	this.center = center;
	var latConv = center.latConv();
	var lonConv = center.lonConv();

	// Create Radian conversion constant
	var rad = Math.PI / 180;
	this.calcs = [];

	for(var i = 0; i < 360; i += quality){
		this.calcs.push([Math.cos(i * rad) / latConv, Math.sin(i * rad) / lonConv]);
	}
};

/**
 * Returns the <code>mxn.Polyline</code> of a circle around the point based on a new radius value.
 * @param {number} radius The new radius value
 * @param {string} color RGB fill color expressed in the form <code>#RRGGBB</code>
 * @returns {Polyline} The calculated <code>mxn.Polyline</code>
 */
Radius.prototype.getPolyline = function(radius, color) {
	var points = [];

	for(var i = 0; i < this.calcs.length; i++){
		var point = new LatLonPoint(
			this.center.lat + (radius * this.calcs[i][0]),
			this.center.lon + (radius * this.calcs[i][1])
		);
		points.push(point);
	}
	
	// Add first point
	points.push(points[0]);

	var line = new Polyline(points);
	line.setColor(color);

	return line;
};


})();
