mxn.register('googlev3', {	

Mapstraction: {
	
	init: function(element, api, properties){		
		var me = this;
		
		if (typeof google.maps.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		this.defaultBaseMaps = [
			{
				mxnType: mxn.Mapstraction.ROAD,
				providerType: google.maps.MapTypeId.ROADMAP,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.SATELLITE,
				providerType: google.maps.MapTypeId.SATELLITE,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.HYBRID,
				providerType: google.maps.MapTypeId.HYBRID,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.PHYSICAL,
				providerType: google.maps.MapTypeId.TERRAIN,
				nativeType: true
			}
		];
		this.initBaseMaps();
	
		var options = {
			disableDefaultUI: true,
			disableDoubleClickZoom: true,
			draggable: true,
			mapTypeControl: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			overviewMapControl: false,
			panControl: false,
			scaleControl: false,
			scrollwheel: false,
			zoomControl: false
		};
		
		// Background color can only be set at construction time.
		// To provide some control, adopt any explicit element style.
		var background = null;
		if (element.currentStyle) {
			backgroundColor = element.currentStyle['background-color'];
		}

		else if (window.getComputedStyle) {
			background = document.defaultView.getComputedStyle(element, null).getPropertyValue('background-color');
		}

		// Only set the background if a style has been explicitly set, ruling out the
		// "transparent" default
		if (background && 'transparent' !== background) {
			options.backgroundColor = background;
		}

		var hasOptions = (typeof properties !== 'undefined' && properties !== null);
		if (hasOptions) {
			if (properties.hasOwnProperty('center') && null !== properties.center) {
			    options.center = properties.center.toProprietary(this.api);
			}

			if (properties.hasOwnProperty('zoom') && null !== properties.zoom) {
				options.zoom = properties.zoom;
			}
			
			if (properties.hasOwnProperty('map_type') && null !== properties.map_type) {
				for (i=0; i<this.defaultBaseMaps.length; i++) {
					if (this.defaultBaseMaps[i].mxnType === properties.map_type) {
						options.mapTypeId = this.defaultBaseMaps[i].providerType;
						break;
					}
				}
			}
			
			if (properties.hasOwnProperty('dragging')) {
				options.draggable = properties.dragging;
			}
			
			if (properties.hasOwnProperty('scroll_wheel')) {
				options.scrollwheel = properties.scroll_wheel;
			}
			
			if (properties.hasOwnProperty('double_click')) {
                //TODO: Decide if we support this for all providers?
				options.disableDoubleClickZoom = !properties.double_click;
			}
		}

		var map = new google.maps.Map(element, options);
		this.maps[api] = map;

		if (hasOptions && properties.hasOwnProperty('controls') && null !== properties.controls) {
		    me.addControls(properties.controls);
		}

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
		
		this.loaded[api] = true;
	},
	
	getVersion: function() {
		return google.maps.version;
	},

	enableScrollWheelZoom: function () {
	    this.maps[this.api].setOptions({ scrollwheel: true });
	},

	disableScrollWheelZoom: function () {
	    this.maps[this.api].setOptions({ scrollwheel: false });
	},

	enableDragging: function () {
	    this.maps[this.api].setOptions({draggable: true});
	},

	disableDragging: function () {
	    this.maps[this.api].setOptions({ draggable: false});
	},

	resizeTo: function(width, height){	
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		var map = this.maps[this.api];
		google.maps.event.trigger(map,'resize');
  	},

	addControl: function (control) {
	    //Google add/removes controls only using setOptions so this is unused
	    throw new Error('Mapstraction.addControl is not currently required for provider ' + this.api);
	},

	removeControl: function (control) {
	    //Google add/removes controls only using setOptions so this is unused
	    throw new Error('Mapstraction.removeControl is not currently required for provider ' + this.api);
	},

    addScaleControls: function () {
        this.maps[this.api].setOptions({
            scaleControl: true,
            scaleControlOptions: {style:google.maps.ScaleControlStyle.DEFAULT}				
        });
	    this.controls.scale = true;
	},

	removeScaleControls: function () {
	    this.maps[this.api].setOptions({scaleControl: false});
	    this.controls.scale = false;
	},

	addPanControls: function () {
	    this.maps[this.api].setOptions({ panControl: true });
	    this.controls.pan = true;
	},

	removePanControls: function () {
	    this.maps[this.api].setOptions({ panControl: false });
	    this.controls.pan = false;
	},

	addOverviewControls: function (zoomOffset) {
	    this.maps[this.api].setOptions({
	        overviewMapControl: true,
	        overviewMapControlOptions: { opened: true }
	    });
	    this.controls.overview = true;
	},

	removeOverviewControls: function () {
	    this.maps[this.api].setOptions({ overviewMapControl: false });
	    this.controls.overview = false;
	},
    
	addSmallControls: function() {
	    this.maps[this.api].setOptions({
	        zoomControl: true,
	        zoomControlOptions: { style: google.maps.ZoomControlStyle.SMALL }
	    });
		this.controls.zoom = 'small';
	},

	removeSmallControls: function () {
	    this.maps[this.api].setOptions({ zoomControl: false });
	    this.controls.zoom = false;
	},

	addLargeControls: function() {
		this.maps[this.api].setOptions({
		    panControl: true,
		    zoomControl: true,
		    zoomControlOptions: { style: google.maps.ZoomControlStyle.LARGE }
		});
		this.controls.pan = true;
		this.controls.zoom = 'large';
	},

	removeLargeControls: function () {
	    this.removeSmallControls();
	    this.removePanControls();
	},

	addMapTypeControls: function() {
	    this.maps[this.api].setOptions({
	        mapTypeControl: true,
	        mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DEFAULT }
	    });
	    this.controls.map_type = true;
	},

	removeMapTypeControls: function () {
	    this.maps[this.api].setOptions({ mapTypeControl: false });
	    this.controls.map_type = false;
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
		
		// TODO - see http://stackoverflow.com/questions/6048975/google-maps-v3-how-to-calculate-the-zoom-level-for-a-given-bounds
	},

	setMapType: function(mapType) {
		var map = this.maps[this.api];
		var i;

		for (i=0; i<this.defaultBaseMaps.length; i++) {
			if (this.defaultBaseMaps[i].mxnType === mapType) {
				map.setMapTypeId(this.defaultBaseMaps[i].providerType);
				return;
			}
		}

		for (i=0; i<this.customBaseMaps.length; i++) {
			if (this.customBaseMaps[i].name === mapType) {
				map.setMapTypeId(this.customBaseMaps[i].label);
				return;
			}
		}

		throw new Error(this.api + ': unable to find definition for map type ' + mapType);
	},

	getMapType: function() {
		var map = this.maps[this.api];
		var mapType = map.getMapTypeId();
		var i;
		
		for (i=0; i<this.defaultBaseMaps.length; i++) {
			if (this.defaultBaseMaps[i].providerType === mapType) {
				return this.defaultBaseMaps[i].mxnType;
			}
		}

		for (i=0; i<this.customBaseMaps.length; i++) {
			if (this.customBaseMaps[i].label === mapType) {
				return this.customBaseMaps[i].name;
			}
		}
		
		return mxn.Mapstraction.UKNOWN;
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
	
	addTileMap: function(tileMap) {
		var map = this.maps[this.api];
		var prop_tilemap = tileMap.toProprietary(this.api);

		if (tileMap.properties.type === mxn.Mapstraction.TileType.BASE) {
			map.mapTypes.set(tileMap.properties.options.label, prop_tilemap);
		}

		return prop_tilemap;
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

MapType: {
	toProprietary: function(type) {
		switch(type) {
			case mxn.Mapstraction.ROAD:
				return google.maps.MapTypeId.ROADMAP;

			case mxn.Mapstraction.SATELLITE:
				return google.maps.MapTypeId.SATELLITE;

			case mxn.Mapstraction.HYBRID:
				return google.maps.MapTypeId.HYBRID;

			case mxn.Mapstraction.PHYSICAL:
				return google.maps.MapTypeId.TERRAIN;

			default:
				return google.maps.MapTypeId.ROADMAP;
		}	 
	},
	
	fromProprietary: function(type) {
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
				return mxn.Mapstraction.ROAD;
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

		if (this.htmlContent) {
			//Check that RichMarker has been loaded
			if (typeof RichMarker === 'undefined') {
				throw new Error(this.api + ' htmlContent support in markers requires RichMarker.js to be loaded, but it was not not found.');
			}

			options.content = this.htmlContent;
			options.flat = true; //set the marker to flat to avoid an auto shadow
		}
		
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

		var marker = this.htmlContent ? new RichMarker(options) : new google.maps.Marker(options);

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
		point.fromProprietary(this.api, this.proprietary_marker.getPosition());
		this.location = point;
	}
	
},

Polyline: {

	toProprietary: function() {
		var coords = [];

		for (var i = 0, length = this.points.length; i < length; i++) {
			coords.push(this.points[i].toProprietary(this.api));
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
},

TileMap: {
	addToMapTypeControl: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling addToMapTypeControl()');
		}

		// Google v3 only supports adding/removing Base Map type tile overlays to the map type
		// control. If this is an Overlay Map, just return with no action; it seems excessive
		// to throw an exception for this to my mind.

		if (this.properties.type === mxn.Mapstraction.TileType.BASE) {
			var tileCache = this.mxn.customBaseMaps;

			if (!tileCache[this.index].inControl) {
				tileCache[this.index].inControl = true;

				var map_ids = [
					google.maps.MapTypeId.ROADMAP,
					google.maps.MapTypeId.HYBRID,
					google.maps.MapTypeId.SATELLITE,
					google.maps.MapTypeId.TERRAIN
				];

				for (var id in tileCache) {
					if (tileCache[id].inControl) {
						map_ids.push(tileCache[id].label);
					}
				}

				this.map.setOptions({
					mapTypeControlOptions: {
						mapTypeIds: map_ids
					}
				});

				this.tileMapAddedToMapTypeControl.fire({
					'tileMap': this
				});
			}
		}
	},
	
	hide: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling hide()');
		}

		// For Google v3 it doesn't make sense to show/hide a Base Map type tile overlay
		
		if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
			var tileCache = this.mxn.overlayMaps;
			
			if (tileCache[this.index].visible) {
				this.map.overlayMapTypes.setAt(this.index, null);
				tileCache[this.index].visible = false;

				this.tileMapHidden.fire({
					'tileMap': this
				});
			}
		}
	},

	removeFromMapTypeControl: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling removeFromMapTypeControl()');
		}

		// Google v3 only supports adding/removing Base Map type tile overlays to the map type
		// control. If this is an Overlay Map, just return with no action; it seems excessive
		// to throw an exception for this to my mind.
		
		if (this.properties.type === mxn.Mapstraction.TileType.BASE) {
			var tileCache = this.mxn.customBaseMaps;

			if (tileCache[this.index].inControl) {
				tileCache[this.index].inControl = false;

				var map_ids = [
					google.maps.MapTypeId.ROADMAP,
					google.maps.MapTypeId.HYBRID,
					google.maps.MapTypeId.SATELLITE,
					google.maps.MapTypeId.TERRAIN
				];

				for (var id in tileCache) {
					if (tileCache[id].inControl) {
						map_ids.push(tileCache[id].label);
					}
				}

				this.map.setOptions({
					mapTypeControlOptions: {
						mapTypeIds: map_ids
					}
				});

				if (this.map.getMapTypeId() === this.properties.options.label) {
					this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
				}
			}

			this.tileMapRemovedFromMapTypeControl.fire({
				'tileMap': this
			});
			
		}
	},

	show: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling show()');
		}

		// For Google v3 it doesn't make sense to show/hide a Base Map type tile overlay
		
		if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
			var tileCache = this.mxn.overlayMaps;

			if (!tileCache[this.index].visible) {
				this.map.overlayMapTypes.setAt(this.index, this.prop_tilemap);
				tileCache[this.index].visible = true;
			
				this.tileMapShown.fire({
					'tileMap': this
				});
			}
		}
	},
	
	toProprietary: function() {
		var self = this;
		var tile_options = {
			getTileUrl: function (coord, zoom) {
				var url = mxn.util.sanitizeTileURL(self.properties.url);
				if (typeof self.properties.options.subdomains !== 'undefined') {
					url = mxn.util.getSubdomainTileURL(url, self.properties.options.subdomains);
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
			minZoom: self.properties.options.minZoom,
			maxZoom: self.properties.options.maxZoom,
			opacity: self.properties.options.opacity,
			name: self.properties.options.label
		};
		
		return new google.maps.ImageMapType(tile_options);
	}
}

});
