mxn.register('googlev3', {	

Mapstraction: {
	
	init: function(element, api){		
		var me = this;
		
		if (typeof google.maps.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		var myOptions = {
			disableDefaultUI: true,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			mapTypeControl: false,
			mapTypeControlOptions: null,
			navigationControl: false,
			navigationControlOptions: null,
			scrollwheel: false,
			disableDoubleClickZoom: true
		};

		// Background color can only be set at construction
		// To provide some control, adopt any explicit element style
		var backgroundColor = null;
		if ( element.currentStyle ) {
			backgroundColor = element.currentStyle['background-color'];
		}
		else if ( window.getComputedStyle ) {
			backgroundColor = document.defaultView.getComputedStyle(element, null).getPropertyValue('background-color');
		}
		// Only set the background if a style has been explicitly set, ruling out the "transparent" default
		if ( backgroundColor && 'transparent' !== backgroundColor ) {
			myOptions.backgroundColor = backgroundColor;
		}

		// find controls
		if (!this.addControlsArgs && loadoptions.addControlsArgs) {
			this.addControlsArgs = loadoptions.addControlsArgs;
		}
		if (this.addControlsArgs) {
			if (this.addControlsArgs.zoom) {
				myOptions.navigationControl = true;
				if (this.addControlsArgs.zoom == 'small') {
					myOptions.navigationControlOptions = {style: google.maps.NavigationControlStyle.SMALL};
				}
				if (this.addControlsArgs.zoom == 'large') {
					myOptions.navigationControlOptions = {style: google.maps.NavigationControlStyle.ZOOM_PAN};
				}
			}
			if (this.addControlsArgs.map_type) {
				myOptions.mapTypeControl = true;
				myOptions.mapTypeControlOptions = {style: google.maps.MapTypeControlStyle.DEFAULT};
			}
			if (this.addControlsArgs.overview) {
				myOptions.overviewMapControl = true;
				myOptions.overviewMapControlOptions = {opened: true};
			}
		}
	
		var map = new google.maps.Map(element, myOptions);
		
		var fireOnNextIdle = [];
		
		google.maps.event.addListener(map, 'idle', function() {
			var fireListCount = fireOnNextIdle.length;
			if (fireListCount > 0) {
				var fireList = fireOnNextIdle.splice(0, fireListCount);
				var handler;
				while((handler = fireList.shift())){
					handler();
				}
			}
		});
		
		// deal with click
		google.maps.event.addListener(map, 'click', function(location){
			me.click.fire({'location': 
				new mxn.LatLonPoint(location.latLng.lat(),location.latLng.lng())
			});
		});

		// deal with zoom change
		google.maps.event.addListener(map, 'zoom_changed', function(){
			// zoom_changed fires before the zooming has finished so we 
			// wait for the next idle event before firing our changezoom
			// so that method calls report the correct values
			fireOnNextIdle.push(function() {
				me.changeZoom.fire();
			});
		});
		
		// deal with map movement
		var is_dragging = false;

		google.maps.event.addListener(map, 'dragstart', function() {
			is_dragging = true;
		});

		google.maps.event.addListener(map, 'dragend', function(){
			me.moveendHandler(me);
			me.endPan.fire();
			is_dragging = false;
		});
		
		google.maps.event.addListener(map, 'center_changed', function() {
			if (!is_dragging) {
				fireOnNextIdle.push(function() {
					me.endPan.fire();
				});
			}
		});
		
		// deal with initial tile loading
		var loadListener = google.maps.event.addListener(map, 'tilesloaded', function(){
			me.load.fire();
			google.maps.event.removeListener( loadListener );
		});			
		
		this.maps[api] = map;
		this.loaded[api] = true;
	},
	
	applyOptions: function(){
		var map = this.maps[this.api];
		var myOptions = [];
		if (this.options.enableDragging) {
			myOptions.draggable = true;
		} 
		else{
			myOptions.draggable = false;
		}
		if (this.options.enableScrollWheelZoom){
			myOptions.scrollwheel = true;
		} 
		else{
			myOptions.scrollwheel = false;
		}
		if(this.options.disableDoubleClickZoom){
			myOptions.disableDoubleClickZoom = true;
		}
		else{
			myOptions.disableDoubleClickZoom = false;
		}
		map.setOptions(myOptions);
	},

	resizeTo: function(width, height){	
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		var map = this.maps[this.api];
		google.maps.event.trigger(map,'resize');
  	},

	addControls: function( args ) {
		/* args = { 
		 *     pan:      true,
		 *     zoom:     'large' || 'small',
		 *     overview: true,
		 *     scale:    true,
		 *     map_type: true,
		 * }
		 */

		var map = this.maps[this.api];
		var myOptions;

		// Google has a combined zoom and pan control.

		if ('pan' in args && args.pan) {
			myOptions = { panControl: true };
			map.setOptions(myOptions);
			this.addControlsArgs.pan = true;
			
		}
		
		else if (!('pan' in args) || ('pan' in args && !args.pan)) {
			myOptions = { panControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.pan = false;
		}
		
		if ('zoom' in args) {
			if (args.zoom == 'small') {
				this.addSmallControls();
			}
			
			else if (args.zoom == 'large') {
				this.addLargeControls();
			}
		}
		
		else {
			myOptions = { zoomControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.zoom = false;
		}

		if ('scale' in args && args.scale){
			myOptions = {
				scaleControl:true,
				scaleControlOptions: {style:google.maps.ScaleControlStyle.DEFAULT}				
			};
			map.setOptions(myOptions);
			this.addControlsArgs.scale = true;
		}
		
		else {
			myOptions = { scaleControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.scale = false;
		}

		if ('map_type' in args && args.map_type){
			this.addMapTypeControls();
		}

		else {
			myOptions = { mapTypeControl : false };
			map.setOptions(myOptions);
			this.addControlsArgs.map_type = false;
		}
		
		if ('overview' in args) {
			myOptions = {
				overviewMapControl: true,
				overviewMapControlOptions: {opened: true}
			};
			map.setOptions(myOptions);
			this.addControlsArgs.overview = true;
		}
		
		else {
			myOptions = { overviewMapControl: false };
			map.setOptions(myOptions);
			this.addControlsArgs.overview = false;
		}
	},

	addSmallControls: function() {
		var map = this.maps[this.api];
		var myOptions = {
			zoomControl: true,
			zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL}
		};
		map.setOptions(myOptions);
		this.addControlsArgs.zoom = 'small';
	},

	addLargeControls: function() {
		var map = this.maps[this.api];
		var myOptions = {
			panControl: true,
			zoomControl: true,
			zoomControlOptions: {style:google.maps.ZoomControlStyle.LARGE}
		};
		map.setOptions(myOptions);
		this.addControlsArgs.pan = true;
		this.addControlsArgs.zoom = 'large';
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];
		var myOptions = {
			mapTypeControl: true,
			mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DEFAULT}
		};
		map.setOptions(myOptions);
		this.addControlsArgs.map_type = true;
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setCenter(pt);
		map.setZoom(zoom);
	},
	
	addMarker: function(marker, old) {
	   return marker.toProprietary(this.api);		
	},

	removeMarker: function(marker) {
		marker.proprietary_marker.setMap(null);
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var propPolyline = polyline.toProprietary(this.api);
		propPolyline.setMap(map);
		return propPolyline;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		polyline.proprietary_polyline.setMap(null);
	},
	   
	getCenter: function() {
		var map = this.maps[this.api];
		var pt = map.getCenter();
		return new mxn.LatLonPoint(pt.lat(),pt.lng());
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		if (options && options.pan) { 
			map.panTo(pt);
		}
		else { 
			map.setCenter(pt);
		}
	},

	setZoom: function(zoom) {
		var map = this.maps[this.api];
		map.setZoom(zoom);
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		return map.getZoom();
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
		var sw = bbox.getSouthWest().toProprietary(this.api);
		var ne = bbox.getNorthEast().toProprietary(this.api);
		var gLatLngBounds = new google.maps.LatLngBounds(sw, ne);
		map.fitBounds(gLatLngBounds);
		return map.getZoom();
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		switch(type) {
			case mxn.Mapstraction.ROAD:
				map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
				break;
			case mxn.Mapstraction.SATELLITE:
				map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
				break;
			case mxn.Mapstraction.HYBRID:
				map.setMapTypeId(google.maps.MapTypeId.HYBRID);
				break;
			case mxn.Mapstraction.PHYSICAL:
				map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
				break;
			default:
				map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		}	 
	},

	getMapType: function() {
		var map = this.maps[this.api];
		var type = map.getMapTypeId();
		switch(type) {
			case google.maps.MapTypeId.ROADMAP:
				return mxn.Mapstraction.ROAD;
			case google.maps.MapTypeId.SATELLITE:
				return mxn.Mapstraction.SATELLITE;
			case google.maps.MapTypeId.HYBRID:
				return mxn.Mapstraction.HYBRID;
			case google.maps.MapTypeId.TERRAIN:
				return mxn.Mapstraction.PHYSICAL;
			default:
				return null;
		}
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var gLatLngBounds = map.getBounds();
		if (!gLatLngBounds) {
			throw 'Mapstraction.getBounds; bounds not available, map must be initialized';
		}
		var sw = gLatLngBounds.getSouthWest();
		var ne = gLatLngBounds.getNorthEast();
		return new mxn.BoundingBox(sw.lat(), sw.lng(), ne.lat(), ne.lng());
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest().toProprietary(this.api);
		var ne = bounds.getNorthEast().toProprietary(this.api);
		var gLatLngBounds = new google.maps.LatLngBounds(sw, ne);
		map.fitBounds(gLatLngBounds);
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
		
		var imageBounds = new google.maps.LatLngBounds(
			new google.maps.LatLng(south,west),
			new google.maps.LatLng(north,east));
		
		var groundOverlay = new google.maps.GroundOverlay(src, imageBounds);
		groundOverlay.setMap(map);
	},

	setImagePosition: function(id, oContext) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];

		var opt = {preserveViewport: (!autoCenterAndZoom)};
		var layer = new google.maps.KmlLayer(url, opt);
		layer.setMap(map);
	},

addTileLayer: function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
		var map = this.maps[this.api];
		var z_index = this.tileLayers.length || 0;
		var tilelayer = {
			getTileUrl: function (coord, zoom) {
				var url = mxn.util.sanitizeTileURL(tile_url);
				if (typeof subdomains !== 'undefined') {
					url = mxn.util.getSubdomainTileURL(url, subdomains);
				}
				var x = coord.x;
				var maxX = Math.pow(2, zoom);
				while (x < 0) {
					x += maxX;
				}
				while (x >= maxX) {
					x -= maxX;
				}
				url = url.replace(/\{Z\}/gi, zoom);
				url = url.replace(/\{X\}/gi, x);
				url = url.replace(/\{Y\}/gi, coord.y);
				return url;
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true,
			minZoom: min_zoom,
			maxZoom: max_zoom,
			opacity: opacity,
			name: label
		};

		var tileLayerOverlay = new google.maps.ImageMapType(tilelayer);
		this.tileLayers.push( [tile_url, tileLayerOverlay, true, z_index] );

		if (map_type) {
			map.mapTypes.set('tile' + z_index, tileLayerOverlay);
			var mapTypeIds = [
				google.maps.MapTypeId.ROADMAP,
				google.maps.MapTypeId.HYBRID,
				google.maps.MapTypeId.SATELLITE,
				google.maps.MapTypeId.TERRAIN
			];
			for (var f = 0; f < this.tileLayers.length; f++) {
				mapTypeIds.push('tile' + f);
			}
			var optionsUpdate = {mapTypeControlOptions: {mapTypeIds: mapTypeIds}};
			map.setOptions(optionsUpdate);
		} 
		else {
			map.overlayMapTypes.insertAt(z_index, tileLayerOverlay);
		}
		
		return tileLayerOverlay;
	},

	toggleTileLayer: function(tile_url) {
		var map = this.maps[this.api];
		for (var f = 0; f < this.tileLayers.length; f++) {
			var tileLayer = this.tileLayers[f];
			if (tileLayer[0] == tile_url) {
				if (tileLayer[2]) {
					map.overlayMapTypes.removeAt(tileLayer[3]);
					tileLayer[2] = false;
				}
				else {
					map.overlayMapTypes.insertAt(tileLayer[3], tileLayer[1]);
					tileLayer[2] = true;
				}
			}
		}
	},

	getPixelRatio: function() {
		throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
	},
	
	mousePosition: function(element) {
		var map = this.maps[this.api];
		var locDisp = document.getElementById(element);
		if (locDisp !== null) {
			google.maps.event.addListener(map, 'mousemove', function (point) {
				var loc = point.latLng.lat().toFixed(4) + ' / ' + point.latLng.lng().toFixed(4);
				locDisp.innerHTML = loc;
			});
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return new google.maps.LatLng(this.lat, this.lon);
	},

	fromProprietary: function(googlePoint) {
		this.lat = googlePoint.lat();
		this.lon = googlePoint.lng();
	}
	
},

Marker: {
	
	toProprietary: function() {
		var options = {};

		// do we have an Anchor?
		var ax = 0;  // anchor x 
		var ay = 0;  // anchor y

		if (this.iconAnchor) {
			ax = this.iconAnchor[0];
			ay = this.iconAnchor[1];
		}
		var gAnchorPoint = new google.maps.Point(ax,ay);

		if (this.iconUrl) {
 			options.icon = new google.maps.MarkerImage(
				this.iconUrl,
				new google.maps.Size(this.iconSize[0], this.iconSize[1]),
				new google.maps.Point(0, 0),
				gAnchorPoint
			);

			// do we have a Shadow?
			if (this.iconShadowUrl) {
				if (this.iconShadowSize) {
					var x = this.iconShadowSize[0];
					var y = this.iconShadowSize[1];
					options.shadow = new google.maps.MarkerImage(
						this.iconShadowUrl,
						new google.maps.Size(x,y),
						new google.maps.Point(0,0),
						gAnchorPoint 
					);
				}
				else {
					options.shadow = new google.maps.MarkerImage(this.iconShadowUrl);
				}
			}
		}
		if (this.draggable) {
			options.draggable = this.draggable;
		}
		if (this.labelText) {
			options.title =  this.labelText;
		}
		if (this.imageMap) {
			options.shape = {
				coord: this.imageMap,
				type: 'poly'
			};
		}
		
		options.position = this.location.toProprietary(this.api);
		options.map = this.map;

		var marker = new google.maps.Marker(options);

		if (this.infoBubble) {
			var event_action = "click";
			if (this.hover) {
				event_action = "mouseover";
			}
			google.maps.event.addListener(marker, event_action, function() {
				marker.mapstraction_marker.openBubble();
			});
		}

		if (this.hoverIconUrl) {
			var gSize = new google.maps.Size(this.iconSize[0], this.iconSize[1]);
			var zerozero = new google.maps.Point(0,0);
 			var hIcon = new google.maps.MarkerImage(
				this.hoverIconUrl,
				gSize,
				zerozero,
				gAnchorPoint
			);
 			var Icon = new google.maps.MarkerImage(
				this.iconUrl,
				gSize,
				zerozero,
				gAnchorPoint
			);
			google.maps.event.addListener(
				marker, 
				"mouseover", 
				function(){ 
					marker.setIcon(hIcon); 
				}
			);
			google.maps.event.addListener(
				marker, 
				"mouseout", 
				function(){ marker.setIcon(Icon); }
			);
		}

		google.maps.event.addListener(marker, 'click', function() {
			marker.mapstraction_marker.click.fire();
		});
		
		return marker;
	},

	openBubble: function() {
		var infowindow, marker = this;
		if (!this.hasOwnProperty('proprietary_infowindow') || this.proprietary_infowindow === null) {
			infowindow = new google.maps.InfoWindow({
				content: this.infoBubble
			});
			google.maps.event.addListener(infowindow, 'closeclick', function(closedWindow) {
				marker.closeBubble();
			});
		}
		else {
			infowindow = this.proprietary_infowindow;
		}
		this.openInfoBubble.fire( { 'marker': this } );
		infowindow.open(this.map, this.proprietary_marker);
		this.proprietary_infowindow = infowindow; // Save so we can close it later
	},

	closeBubble: function() {
		if (this.hasOwnProperty('proprietary_infowindow') && this.proprietary_infowindow !== null) {
			this.proprietary_infowindow.close();
			this.proprietary_infowindow = null;
			this.closeInfoBubble.fire( { 'marker': this } );
		}
	},

	hide: function() {
		this.proprietary_marker.setOptions( { visible: false } );
	},

	show: function() {
		this.proprietary_marker.setOptions( { visible: true } );
	},

	update: function() {
		var point = new mxn.LatLonPoint();
		point.fromProprietary('googlev3', this.proprietary_marker.getPosition());
		this.location = point;
	}
	
},

Polyline: {

	toProprietary: function() {
		var coords = [];

		for (var i = 0, length = this.points.length; i < length; i++) {
			coords.push(this.points[i].toProprietary('googlev3'));
		}
		
		var polyOptions = {
			path: coords,
			strokeColor: this.color,
			strokeOpacity: this.opacity, 
			strokeWeight: this.width
		};
		
		if (this.closed) {
			if (!(this.points[0].equals(this.points[this.points.length - 1]))) {
				coords.push(coords[0]);
			}
		}

		else if (this.points[0].equals(this.points[this.points.length - 1])) {
			this.closed = true;
		}

		if (this.closed) {
			polyOptions.fillColor = this.fillColor;
			polyOptions.fillOpacity = polyOptions.strokeOpacity;
			
			this.proprietary_polyline = new google.maps.Polygon(polyOptions);
		}
		else {
			this.proprietary_polyline = new google.maps.Polyline(polyOptions);
		}
		
		return this.proprietary_polyline;
	},
	
	show: function() {
		this.proprietary_polyline.setVisible(true);
	},

	hide: function() {
		this.proprietary_polyline.setVisible(false);
	}
}

});
