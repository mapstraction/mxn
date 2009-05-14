(function(){

var $m = mxn.util.$m;

/**
 * Initialise our provider. This function should only be called 
 * from within mapstraction code, not exposed as part of the API.
 */
var init = function() {
	this.invoker.go('init', [ this.currentElement, this.api ]);
};

/**
 * Mapstraction instantiates a map with some API choice into the HTML element given
 * @param {String} element The HTML element to replace with a map
 * @param {String} api The API to use, one of 'google', 'yahoo', 'microsoft', 'openstreetmap', 'multimap', 'map24', 'openlayers', 'mapquest'
 * @param {Bool} debug optional parameter to turn on debug support - this uses alert panels for unsupported actions
 * @constructor
 */
 var Mapstraction = mxn.Mapstraction = function(element, api, debug) {
	this.api = api;
	this.maps = {};
	this.currentElement = $m(element);
	this.eventListeners = [];
	this.markers = [];
	this.layers = [];
	this.polylines = [];
	this.images = [];
	this.loaded = {};
	this.onload = {};
	this.element = element;
	
	// option defaults
	this.options = {
		enableScrollWheelZoom: false
	}
	
	this.addControlsArgs = {};
	
	// set up our invoker for calling API methods
	this.invoker = new mxn.Invoker(this, 'Mapstraction', function(){ return this.api; });
		
	// TODO: Events
	mxn.addEvents(this, ['load', 'endPan', 'markerAdded', 'markerRemoved', 'polylineAdded', 'polylineRemoved']);
	
	// finally initialize our proper API map
	init.apply(this);
}

// Map type constants
Mapstraction.ROAD = 1;
Mapstraction.SATELLITE = 2;
Mapstraction.HYBRID = 3;

// methods that have no implementation in mapstraction core
mxn.addProxyMethods(Mapstraction, [ 
	'addLargeControls', 'addMarker', 'addMapTypeControls', 'addOverlay', 'addPolyline', 'addSmallControls', 'applyOptions',
	'dragging', 
	'getBounds', 'getCenter', 'getMapType', 'getPixelRatio', 'getZoom', 'getZoomLevelForBoundingBox', 
	'mousePosition',
	'resizeTo', 'removeMarker', 
	'setBounds', 'setCenter', 'setCenterAndZoom', 'setMapType', 'setOption', 'setZoom',
	'toggleTileLayer'
]);

Mapstraction.prototype.setOptions = function(oOpts){
	mxn.merge(this.options, oOpts);
	this.applyOptions();
};

Mapstraction.prototype.setOption = function(sOptName, vVal){
	this.options[sOptName] = vVal;
	this.applyOptions();
};

/**
 * Enable scroll wheel zooming
 * Currently only supported by Google
 */
Mapstraction.prototype.enableScrollWheelZoom = function() {
	this.setOption('enableScrollWheelZoom', true);
};

/**
 * Change the current api on the fly
 * @param {String} api The API to swap to
 * @param element
 */
Mapstraction.prototype.swap = function(element,api) {
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

	if (this.maps[this.api] === undefined) {
		init.apply(this);

		this.setCenterAndZoom(center,zoom);

		for (var i = 0; i < this.markers.length; i++) {
			this.addMarker(this.markers[i], true);
		}

		for (var j = 0; j < this.polylines.length; j++) {
			this.addPolyline( this.polylines[j], true);
		}
	}
	else {

		//sync the view
		this.setCenterAndZoom(center,zoom);

		//TODO synchronize the markers and polylines too
		// (any overlays created after api instantiation are not sync'd)
	}

	this.addControls(this.addControlsArgs);

};




/**
 * Returns the loaded state of a Map Provider
 * @param {String} api Optional API to query for. If not specified, returns state of the originally created API
 * @type {Boolean} The state of the map loading
 */
Mapstraction.prototype.isLoaded = function(api){
	if (api === null) {
		api = this.api;
	}
	return this.loaded[api];
};

/**
 * Set the debugging on or off - shows alert panels for functions that don't exist in Mapstraction
 * @param {Boolean} debug true to turn on debugging, false to turn it off
 * @type {Boolean} The state of debugging
 */
Mapstraction.prototype.setDebug = function(debug){
	if(debug !== null) {
		this.debug = debug;
	}
	return this.debug;
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
 * @param {String} type Event type to attach listener to
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
 * @param {String} sEventType Call listeners of this event type
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
 * addControls adds controls to the map. You specify which controls to add in
 * the associative array that is the only argument.
 * addControls can be called multiple time, with different args, to dynamically change controls.
 *
 * args = {
 *	 pan:	  true,
 *	 zoom:	 'large' || 'small',
 *	 overview: true,
 *	 scale:	true,
 *	 map_type: true,
 * }
 *
 * @param {array} args Which controls to switch on
 */
Mapstraction.prototype.addControls = function( args ) {
	this.addControlsArgs = args;
	this.invoker.go('addControls', arguments);
};

/**
 * Adds a marker pin to the map
 * @param {Marker} marker The marker to add
 * @param {Boolean} old If true, doesn't add this marker to the markers array. Used by the "swap" method
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
 * @param {Marker} marker The marker to add
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
 * removeMarker removes a Marker from the map
 * @param {Marker} marker The marker to remove
 */
Mapstraction.prototype.removeMarker = function(marker) {	
	var current_marker;
	for(var i = 0; i < this.markers.length; i++){
		current_marker = this.markers[i];
		if(marker == current_marker) {
			this.invoker.go('removeMarker', arguments);
			marker.onmap = false;
			this.markers.splice(i, 1);
			this.markerRemoved.fire(marker);
			break;
		}
	}
};

/**
 * removeAllMarkers removes all the Markers on a map
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
		default:
			if(this.debug) {
				alert(this.api + ' not supported by Mapstraction.declutterMarkers');
			}
	}
};

/**
 * Add a polyline to the map
 * @param {Polyline} polyline The Polyline to add to the map
 * @param {Boolean} old If true replaces an existing Polyline
 */
Mapstraction.prototype.addPolyline = function(polyline, old) {
	polyline.api = this.api;
	polyline.map = this.maps[this.api];
	var propPoly = this.invoker.go('addPolyline', arguments);
	polyline.setChild(propPoly);
	if(!old) {
		this.polylines.push(polyline);
	}
	this.polylineAdded.fire(polyline);
};

Mapstraction.prototype.removePolylineImpl = function(polyline) {
	this.invoker.go('removePolyline', arguments);
	polyline.onmap = false;
	this.polylineRemoved.fire(polyline);
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
			this.removePolylineImpl(polyline);
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
		this.removePolylineImpl(current_polyline);
	}
};

/**
 * autoCenterAndZoom sets the center and zoom of the map to the smallest bounding box
 * containing all markers
 */
Mapstraction.prototype.autoCenterAndZoom = function() {
	var lat_max = -90;
	var lat_min = 90;
	var lon_max = -180;
	var lon_min = 180;

	for (var i=0; i<this.markers.length; i++) {
		lat = this.markers[i].location.lat;
		lon = this.markers[i].location.lon;
		if (lat > lat_max) {
			lat_max = lat;
		}
		if (lat < lat_min) {
			lat_min = lat;
		}
		if (lon > lon_max) {
			lon_max = lon;
		}
		if (lon < lon_min) {
			lon_min = lon;
		}
	}
	for (var i=0; i<this.polylines.length; i++) {
		for (var j=0; j<this.polylines[i].points.length; j++) {
			lat = this.polylines[i].points[j].lat;
			lon = this.polylines[i].points[j].lon;
			if (lat > lat_max) {
				lat_max = lat;
			}
			if (lat < lat_min) {
				lat_min = lat;
			}
			if (lon > lon_max) {
				lon_max = lon;
			}
			if (lon < lon_min) {
				lon_min = lon;
			}
		}
	}
	this.setBounds( new BoundingBox(lat_min, lon_min, lat_max, lon_max) );
};

/**
 * centerAndZoomOnPoints sets the center and zoom of the map from an array of points
 *
 * This is useful if you don't want to have to add markers to the map
 */
Mapstraction.prototype.centerAndZoomOnPoints = function(points) {
	var bounds = new BoundingBox(points[0].lat,points[0].lon,points[0].lat,points[0].lon);

	for (var i=1, len = points.length ; i<len; i++) {
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
	var lat_max = -90;
	var lat_min = 90;
	var lon_max = -180;
	var lon_min = 180;

	for (var i=0; i<this.markers.length; i++) {
		if (this.markers[i].getAttribute("visible")) {
			lat = this.markers[i].location.lat;
			lon = this.markers[i].location.lon;

			if (lat > lat_max) lat_max = lat;
			if (lat < lat_min) lat_min = lat;
			if (lon > lon_max) lon_max = lon;
			if (lon < lon_min) lon_min = lon;
		}
	}

	for (i=0; i<this.polylines.length; i++){
		if (this.polylines[i].getAttribute("visible")) {
			for (j=0; j<this.polylines[i].points.length; j++) {
				lat = this.polylines[i].points[j].lat;
				lon = this.polylines[i].points[j].lon;

				if (lat > lat_max) lat_max = lat;
				if (lat < lat_min) lat_min = lat;
				if (lon > lon_max) lon_max = lon;
				if (lon < lon_min) lon_min = lon;
			}
		}
	}

	this.setBounds(new BoundingBox(lat_min, lon_min, lat_max, lon_max));
};

/**
 * Automatically sets center and zoom level to show all polylines
 * Takes into account radious of polyline
 * @param {Int} radius
 */
Mapstraction.prototype.polylineCenterAndZoom = function(radius) {
	var lat_max = -90;
	var lat_min = 90;
	var lon_max = -180;
	var lon_min = 180;

	for (i=0; i < mapstraction.polylines.length; i++)
	{
		for (j=0; j<mapstraction.polylines[i].points.length; j++)
		{
			lat = mapstraction.polylines[i].points[j].lat;
			lon = mapstraction.polylines[i].points[j].lon;

			latConv = lonConv = radius;

			if (radius > 0)
			{
				latConv = (radius / mapstraction.polylines[i].points[j].latConv());
				lonConv = (radius / mapstraction.polylines[i].points[j].lonConv());
			}

			if ((lat + latConv) > lat_max) lat_max = (lat + latConv);
			if ((lat - latConv) < lat_min) lat_min = (lat - latConv);
			if ((lon + lonConv) > lon_max) lon_max = (lon + lonConv);
			if ((lon - lonConv) < lon_min) lon_min = (lon - lonConv);
		}
	}

	this.setBounds(new BoundingBox(lat_min, lon_min, lat_max, lon_max));
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
	
	this.invoker.go('addImageOverlay', arguments, false, oContext);
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
	
	this.invoker.go('setImagePosition', arguments, false, oContext);

	imgElement.style.top = oContext.pixels.top.toString() + 'px';
	imgElement.style.left = oContext.pixels.left.toString() + 'px';
	imgElement.style.width = (oContext.pixels.right - oContext.pixels.left).toString() + 'px';
	imgElement.style.height = (oContext.pixels.bottom - oContext.pixels.top).toString() + 'px';
};

Mapstraction.prototype.addJSON = function(json) {
	var features;
	if (typeof(json) == "string") {
		features = eval('(' + json + ')');
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
					date : "new Date(\""+item.date+"\")",
					iconShadowSize : item.icon_shadow_size,
					icon : "http://boston.openguides.org/markers/AQUA.png",
					iconSize : item.icon_size,
					category : item.source_id,
					draggable : false,
					hover : false
				});
				break;
			case "Polygon":
				var points = [];
				polyline = new Polyline(points);
				mapstraction.addPolylineWithData(polyline,{
					fillColor : item.poly_color,
					date : "new Date(\""+item.date+"\")",
					category : item.source_id,
					width : item.line_width,
					opacity : item.line_opacity,
					color : item.line_color,
					polygon : true
				});
				markers.push(polyline);
			default:
		// console.log("Geometry: " + features.items[i].geometry.type);
		}
	}
	return markers;
};

/**
 * Adds a Tile Layer to the map
 *
 * Requires providing a parameterized tile url. Use {Z}, {X}, and {Y} to specify where the parameters
 *  should go in the URL.
 *
 * For example, the OpenStreetMap tiles are:
 *  http://tile.openstreetmap.org/{Z}/{X}/{Y}.png
 *
 * @param {tile_url} template url of the tiles.
 * @param {opacity} opacity of the tile layer - 0 is transparent, 1 is opaque. (default=0.6)
 * @param {copyright_text} copyright text to use for the tile layer. (default=Mapstraction)
 * @param {min_zoom} Minimum (furtherest out) zoom level that tiles are available (default=1)
 * @param {max_zoom} Maximum (closest) zoom level that the tiles are available (default=18)
 */
Mapstraction.prototype.addTileLayer = function(tile_url, opacity, copyright_text, min_zoom, max_zoom) {
	if(!tile_url) {
		return;
	}
	
	this.tileLayers = this.tileLayers || [];	
	opacity = opacity || 0.6;
	copyright_text = copyright_text || "Mapstraction";
	min_zoom = min_zoom || 1;
	max_zoom = max_zoom || 18;

	return this.invoker.go('addTileLayer', [ tile_url, opacity, copyright_text, min_zoom, max_zoom ] );
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
	if(this.loaded[this.api] === false) {
		var me = this;
		this.onload[this.api].push( function() {
			me.doFilter(showCallback, hideCallback);
		} );
		return;
	}

	var map = this.maps[this.api];

	var visibleCount = 0;

	if (this.filters) {
		switch (this.api) {
			case 'multimap':
				/* TODO polylines aren't filtered in multimap */
				var mmfilters = [];
				for (var f=0; f<this.filters.length; f++) {
					mmfilters.push( new MMSearchFilter( this.filters[f][0], this.filters[f][1], this.filters[f][2] ));
				}
				map.setMarkerFilters( mmfilters );
				map.redrawMap();
				break;
			default:
				var vis;
				for (var m=0; m<this.markers.length; m++) {
					vis = true;
					for (var f = 0; f < this.filters.length; f++) {
						if (! this.applyFilter(this.markers[m], this.filters[f])) {
							vis = false;
						}
					}
					if (vis) {
						visibleCount ++;
						if (showCallback) showCallback(this.markers[m]);
						else this.markers[m].show();
					} else { 
						if (hideCallback) hideCallback(this.markers[m]);
						else this.markers[m].hide();
					}

					this.markers[m].setAttribute("visible", vis);
				}

				/*
					 for (var p=0; m<this.polylines.length; p++) {
					 vis = true;
					 for (var f=0; f<this.filters.length; f++) {
					 if (! this.applyFilter(this.polylines[p], this.filters[f])) {
					 vis = false;
					 }
					 }
					 if (vis) {
					 this.polylines[p].show();
					 } else {
					 this.polylines[p].hide();
					 }
					 }
				 */
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
			if (o.getAttribute( f[0] ) == f[2]) {
				vis = false;
			}
			break;
	}

	return vis;
};

/**
 * getAttributeExtremes returns the minimum/maximum of "field" from all markers
 * @param {field} name of "field" to query
 * @returns {array} of minimum/maximum
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
 * LatLonPoint is a point containing a latitude and longitude with helper methods
 * @param {double} lat is the latitude
 * @param {double} lon is the longitude
 * @returns a new LatLonPoint
 * @type LatLonPoint
 */
var LatLonPoint = mxn.LatLonPoint = function(lat, lon) {
	// TODO error if undefined?
	//  if (lat == undefined) alert('undefined lat');
	//  if (lon == undefined) alert('undefined lon');
	this.lat = lat;
	this.lon = lon;
	this.lng = lon; // lets be lon/lng agnostic
	
	// TODO: put a vlid function for returning the api id in here
	this.invoker = new mxn.Invoker(this, 'LatLonPoint');	
	
	
}

mxn.addProxyMethods(LatLonPoint, [ 
	'fromProprietary', 'toProprietary'
], true);

/**
 * toString returns a string represntation of a point
 * @returns a string like '51.23, -0.123'
 * @type String
 */
LatLonPoint.prototype.toString = function() {
	return this.lat + ', ' + this.lon;
};

/**
 * distance returns the distance in kilometers between two points
 * @param {LatLonPoint} otherPoint The other point to measure the distance from to this one
 * @returns the distance between the points in kilometers
 * @type double
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
 * equals tests if this point is the same as some other one
 * @param {LatLonPoint} otherPoint The other point to test with
 * @returns true or false
 * @type boolean
 */
LatLonPoint.prototype.equals = function(otherPoint) {
	return this.lat == otherPoint.lat && this.lon == otherPoint.lon;
};

/**
 * Returns latitude conversion based on current projection
 * @returns {Float} conversion
 */
LatLonPoint.prototype.latConv = function() {
	return this.distance(new LatLonPoint(this.lat + 0.1, this.lon))*10;
}

/**
 * Returns longitude conversion based on current projection
 * @returns {Float} conversion
 */
LatLonPoint.prototype.lonConv = function() {
	return this.distance(new LatLonPoint(this.lat, this.lon + 0.1))*10;
}


//////////////////////////
//
//  BoundingBox
//
//////////////////////////

/**
 * BoundingBox creates a new bounding box object
 * @param {double} swlat the latitude of the south-west point
 * @param {double} swlon the longitude of the south-west point
 * @param {double} nelat the latitude of the north-east point
 * @param {double} nelon the longitude of the north-east point
 * @returns a new BoundingBox
 * @type BoundingBox
 * @constructor
 * @classDescription BoundingBox
 */
var BoundingBox = mxn.BoundingBox = function(swlat, swlon, nelat, nelon) {
	//FIXME throw error if box bigger than world
	//alert('new bbox ' + swlat + ',' +  swlon + ',' +  nelat + ',' + nelon);
	this.sw = new LatLonPoint(swlat, swlon);
	this.ne = new LatLonPoint(nelat, nelon);
}

/**
 * getSouthWest returns a LatLonPoint of the south-west point of the bounding box
 * @returns the south-west point of the bounding box
 * @type LatLonPoint
 */
BoundingBox.prototype.getSouthWest = function() {
	return this.sw;
};

/**
 * getNorthEast returns a LatLonPoint of the north-east point of the bounding box
 * @returns the north-east point of the bounding box
 * @type LatLonPoint
 */
BoundingBox.prototype.getNorthEast = function() {
	return this.ne;
};

/**
 * isEmpty finds if this bounding box has zero area
 * @returns whether the north-east and south-west points of the bounding box are the same point
 * @type boolean
 */
BoundingBox.prototype.isEmpty = function() {
	return this.ne == this.sw; // is this right? FIXME
};

/**
 * contains finds whether a given point is within a bounding box
 * @param {LatLonPoint} point the point to test with
 * @returns whether point is within this bounding box
 * @type boolean
 */
BoundingBox.prototype.contains = function(point){
	return point.lat >= this.sw.lat && point.lat <= this.ne.lat && point.lon >= this.sw.lon && point.lon <= this.ne.lon;
};

/**
 * toSpan returns a LatLonPoint with the lat and lon as the height and width of the bounding box
 * @returns a LatLonPoint containing the height and width of this bounding box
 * @type LatLonPoint
 */
BoundingBox.prototype.toSpan = function() {
	return new LatLonPoint( Math.abs(this.sw.lat - this.ne.lat), Math.abs(this.sw.lon - this.ne.lon) );
};

/**
 * extend extends the bounding box to include the new point
 */
BoundingBox.prototype.extend = function(point) {
	if(this.sw.lat > point.lat) {
		this.sw.lat = point.lat;
	}
	if(this.sw.lon > point.lon) {
		this.sw.lon = point.lon;
	}
	if(this.ne.lat < point.lat) {
		this.ne.lat = point.lat;
	}
	if(this.ne.lon < point.lon) {
		this.ne.lon = point.lon;
	}
	return;
};

//////////////////////////////
//
//  Marker
//
///////////////////////////////

/**
 * Marker create's a new marker pin
 * @param {LatLonPoint} point the point on the map where the marker should go
 * @constructor
 */
var Marker = mxn.Marker = function(point) {
	this.api = null;
	this.location = point;
	this.onmap = false;
	this.proprietary_marker = false;
	this.attributes = [];
	this.pinID = "mspin-"+new Date().getTime()+'-'+(Math.floor(Math.random()*Math.pow(2,16)));
	this.invoker = new mxn.Invoker(this, 'Marker', function(){return this.api;});
	mxn.addEvents(this, [ 'infoBubbleOpenned', 'markerClicked']);
}

mxn.addProxyMethods(Marker, [ 
	'fromProprietary',
	'hide',
	'openBubble',
	'show',
	'toProprietary',
	'update'
]);

Marker.prototype.setChild = function(some_proprietary_marker) {
	this.proprietary_marker = some_proprietary_marker;
	this.onmap = true;
};

Marker.prototype.setLabel = function(labelText) {
	this.labelText = labelText;
};

/**
 * addData conviniently set a hash of options on a marker
 */
Marker.prototype.addData = function(options){
	for(var sOptKey in options) {
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
				if(options.iconShadowSize)
					this.setShadowIcon(options.iconShadow, new Array(options.iconShadowSize[0], options.iconShadowSize[1]));
				else
					this.setIcon(options.iconShadow);
				break;
			case 'infoDiv':
				this.setInfoDiv(options.infoDiv[0],options.infoDiv[1]);
				break;
			case 'draggable':
				this.setDraggable(options.draggable);
				break;
			case 'hover':
				this.setHover(options.hover);
			// no break statement here intentionally
			case 'hoverIcon':
				this.setHoverIcon(options.hoverIcon);
				break;
			case 'openBubble':
				this.openBubble();
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
};

/**
 * setInfoBubble sets the html/text content for a bubble popup for a marker
 * @param {String} infoBubble the html/text you want displayed
 */
Marker.prototype.setInfoBubble = function(infoBubble) {
	this.infoBubble = infoBubble;
};

/**
 * setInfoDiv sets the text and the id of the div element where to the information
 *  useful for putting information in a div outside of the map
 * @param {String} infoDiv the html/text you want displayed
 * @param {String} div the element id to use for displaying the text/html
 */
Marker.prototype.setInfoDiv = function(infoDiv,div){
	this.infoDiv = infoDiv;
	this.div = div;
};

/**
 * setIcon sets the icon for a marker
 * @param {String} iconUrl The URL of the image you want to be the icon
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
 * setIconSize sets the size of the icon for a marker
 * @param {String} iconSize The array size in pixels of the marker image
 */
Marker.prototype.setIconSize = function(iconSize){
	if(iconSize) {
		this.iconSize = iconSize;
	}
};

/**
 * setIconAnchor sets the anchor point for a marker
 * @param {String} iconAnchor The array offset of the anchor point
 */
Marker.prototype.setIconAnchor = function(iconAnchor){
	if(iconAnchor) {
		this.iconAnchor = iconAnchor;
	}
};

/**
 * setShadowIcon sets the icon for a marker
 * @param {String} iconUrl The URL of the image you want to be the icon
 */
Marker.prototype.setShadowIcon = function(iconShadowUrl, iconShadowSize){
	this.iconShadowUrl = iconShadowUrl;
	if(iconShadowSize) {
		this.iconShadowSize = iconShadowSize;
	}
};

Marker.prototype.setHoverIcon = function(hoverIconUrl){
	this.hoverIconUrl = hoverIconUrl;
};

/**
 * setDraggable sets the draggable state of the marker
 * @param {Bool} draggable set to true if marker should be draggable by the user
 */
Marker.prototype.setDraggable = function(draggable) {
	this.draggable = draggable;
};

/**
 * setHover sets that the marker info is displayed on hover
 * @param {Bool} hover set to true if marker should display info on hover
 */
Marker.prototype.setHover = function(hover) {
	this.hover = hover;
};

/**
 * Markers are grouped up by this name. declutterGroup makes use of this.
 */
Marker.prototype.setGroupName = function(sGrpName) {
	this.groupName = sGrpName;
};

/**
 * setAttribute: set an arbitrary key/value pair on a marker
 * @arg(String) key
 * @arg value
 */
Marker.prototype.setAttribute = function(key,value) {
	this.attributes[key] = value;
};

/**
 * getAttribute: gets the value of "key"
 * @arg(String) key
 * @returns value
 */
Marker.prototype.getAttribute = function(key) {
	return this.attributes[key];
};


///////////////
// Polyline ///
///////////////


var Polyline = mxn.Polyline = function(points) {
	this.api = null;
	this.points = points;
	this.attributes = [];
	this.onmap = false;
	this.proprietary_polyline = false;
	this.pllID = "mspll-"+new Date().getTime()+'-'+(Math.floor(Math.random()*Math.pow(2,16)));
	this.invoker = new mxn.Invoker(this, 'Polyline', function(){return this.api;});
}

mxn.addProxyMethods(Polyline, [ 
	'fromProprietary', 
	'hide',
	'show',
	'toProprietary',
	'update'
]);

/**
 * addData conviniently set a hash of options on a polyline
 */
Polyline.prototype.addData = function(options){
	for(var sOpt in options) {
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
};

Polyline.prototype.setChild = function(some_proprietary_polyline) {
	this.proprietary_polyline = some_proprietary_polyline;
	this.onmap = true;
};

/**
 * in the form: #RRGGBB
 * Note map24 insists on upper case, so we convert it.
 */
Polyline.prototype.setColor = function(color){
	this.color = (color.length==7 && color[0]=="#") ? color.toUpperCase() : color;
};

/**
 * Stroke width of the polyline
 * @param {Integer} width
 */
Polyline.prototype.setWidth = function(width){
	this.width = width;
};

/**
 * A float between 0.0 and 1.0
 * @param {Float} opacity
 */
Polyline.prototype.setOpacity = function(opacity){
	this.opacity = opacity;
};

/**
 * Marks the polyline as a closed polygon
 * @param {Boolean} bClosed
 */
Polyline.prototype.setClosed = function(bClosed){
	this.closed = bClosed;
};

/**
 * Fill color for a closed polyline as HTML color value e.g. #RRGGBB
 * @param {String} sFillColor HTML color value #RRGGBB
 */
Polyline.prototype.setFillColor = function(sFillColor) {
	this.fillColor = sFillColor;
};


/**
 * setAttribute: set an arbitrary key/value pair on a polyline
 * @arg(String) key
 * @arg value
 */
Polyline.prototype.setAttribute = function(key,value) {
	this.attributes[key] = value;
};

/**
 * getAttribute: gets the value of "key"
 * @arg(String) key
 * @returns value
 */
Polyline.prototype.getAttribute = function(key) {
	return this.attributes[key];
};

/**
 * Simplifies a polyline, averaging and reducing the points
 * @param {Integer} tolerance (1.0 is a good starting point)
 */
Polyline.prototype.simplify = function(tolerance) {
	var reduced = new Array();

	// First point
	reduced[0] = this.points[0];

	var markerPoint = 0;

	for (var i = 1; i < this.points.length-1; i++)
		if (this.points[i].distance(this.points[markerPoint]) >= tolerance)
		{
			reduced[reduced.length] = this.points[i];
			markerPoint = i;
		}

	// Last point
	reduced[reduced.length] = this.points[this.points.length-1];

	// Revert
	this.points = reduced;
};

})();