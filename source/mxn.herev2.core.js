mxn.register('herev2', {

Mapstraction: {
	init: function(element, api, properties) {
		var me = this;
		var	nokia_map;
		var	mapLoaded = false;
		
		if (typeof nokia.maps === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		this.defaultBaseMaps = [
			{
				mxnType: mxn.Mapstraction.ROAD,
				providerType: nokia.maps.map.Display.NORMAL,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.SATELLITE,
				providerType: nokia.maps.map.Display.SATELLITE_PLAIN,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.HYBRID,
				providerType: nokia.maps.map.Display.SATELLITE,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.PHYSICAL,
				providerType: nokia.maps.map.Display.TERRAIN,
				nativeType: true
			}
		];
		this.initBaseMaps();
		this.currentMapType = mxn.Mapstraction.ROAD;

		var eventStates = {
			"center": false,
			"zoom": false,
			"mapsize": false
		};
			
		var props = {
			components: [
				new nokia.maps.map.component.InfoBubbles()
			]
		};

		var hasOptions = (typeof properties !== 'undefined' && properties !== null);
		if (hasOptions) {
			if (properties.hasOwnProperty('center') && null !== properties.center) {
				props.center = properties.center.toProprietary(this.api);
			}

			if (properties.hasOwnProperty('zoom') && null !== properties.zoom) {
				props.zoomLevel = properties.zoom;
			}

			if (properties.hasOwnProperty('map_type') && null !== properties.map_type) {
				//TODO: Suspect this shouldnt be here as its duplicated.
				switch (properties.map_type) {
					case mxn.Mapstraction.ROAD:
						props.baseMapType = nokia.maps.map.Display.NORMAL;
						break;
					case mxn.Mapstraction.PHYSICAL:
						props.baseMapType = nokia.maps.map.Display.TERRAIN;
						break;
					case mxn.Mapstraction.HYBRID:
						props.baseMapType = nokia.maps.map.Display.SATELLITE;
						break;
					case mxn.Mapstraction.SATELLITE:
						props.baseMapType = nokia.maps.map.Display.SATELLITE_PLAIN;
						break;
					default:
						props.baseMapType = nokia.maps.map.Display.NORMAL;
						break;
				}
			}
		}
		
		nokia_map = new nokia.maps.map.Display(element, props);
		this.maps[api] = nokia_map;

		if (hasOptions && properties.hasOwnProperty('controls') && null !== properties.controls) {
			me.addControls(properties.controls);
		}

		// Handle click event
		nokia_map.addListener('click', function(event) {
			coords = nokia_map.pixelToGeo(event.targetX, event.targetY);
			me.click.fire(
				{
					'location': new mxn.LatLonPoint(coords.latitude, coords.longitude)
				});
		}, false);

		// Handle endPan (via centre change) and zoom events
		// the Nokia Maps API doesn't have a discrete event for each of these events
		// instead it uses a start/update/end sequence of events, where update may happen
		// multiple times or not at all, so we need to keep track of which Nokia events have
		// fired during a start(/update) event sequence and then fire the relevent Mapstraction
		// events upon receiving the Nokia end event

		nokia_map.addListener('mapviewchangestart', function(event) {
			if (event.data & event.MAPVIEWCHANGE_CENTER) {
				eventStates.center = true;
			}
			if (event.data & event.MAPVIEWCHANGE_ZOOM) {
				eventStates.zoom = true;
			}
			if (event.data & event.MAPVIEWCHANGE_SIZE) {
				eventStates.mapsize = true;
			}
		}, false);

		nokia_map.addListener('mapviewchange', function(event) {
			if (event.data & event.MAPVIEWCHANGE_CENTER) {
				eventStates.center = true;
			}
			if (event.data & event.MAPVIEWCHANGE_ZOOM) {
				eventStates.zoom = true;
			}
			if (event.data & event.MAPVIEWCHANGE_SIZE) {
				eventStates.mapsize = true;
			}
		}, false);

		nokia_map.addListener('mapviewchangeend', function(event) {
			// The Nokia Maps API doesn't support a "map loaded" event, but both a
			// "centre" and "size" mapviewchangestart/mapviewchange/mapviewchangeend
			// event sequence will be fired as part of the initial loading so we can trap
			// this and fire the MXN "load" event.
			
			if (!mapLoaded) {
				if (eventStates.center && eventStates.mapsize && eventStates.zoom) {
					mapLoaded = true;
					eventStates.mapsize = false;
					eventStates.center = false;
					eventStates.zoom = false;
					me.load.fire();
				}
			}
			
			else {
				if (eventStates.center) {
					eventStates.center = false;
					me.moveendHandler(me);
					me.endPan.fire();
				}
			}
			
			if (eventStates.zoom) {
				eventStates.zoom = false;
				me.changeZoom.fire();
			}
		}, false);

		this.controls.mouseWheel = new nokia.maps.map.component.zoom.MouseWheel();
		this.controls.mouseWheel.enabled = true;
		this.controls.dragging = new nokia.maps.map.component.panning.Drag();
		this.controls.dragging.enabled = true;
		this.controls.doubleClick = new nokia.maps.map.component.zoom.DoubleClick();
		this.controls.doubleClick.enabled = true;
		this.controls.doubleTap = new nokia.maps.map.component.zoom.DoubleTap();
		this.controls.doubleTap.enabled = true;
		
		this.loaded[api] = true;
	},
	
	getVersion: function() {
		return nokia.maps.build;
	},

	enableScrollWheelZoom: function () {
		this.controls.mouseWheel.enabled = true;
	},

	disableScrollWheelZoom: function () {
		this.controls.mouseWheel.enabled = false;
	},

	enableDragging: function () {
		this.controls.dragging.enabled = true;
	},

	disableDragging: function () {
		this.controls.dragging.enabled = false;
	},

	enableDoubleClickZoom: function () {
		this.controls.doubleClick.enabled = true;
		this.controls.doubleTap.enabled = true;
	},

	disableDoubleClickZoom: function () {
		this.controls.doubleClick.enabled = false;
		this.controls.doubleTap.enabled = false;
	},

	resizeTo: function(width, height) {
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
	},
	
	addControl: function (control) {
		var map = this.maps[this.api];
		if (control !== null && typeof (control) !== "undefined") {
			var cid = map.getComponentById(control.getId());
			if (cid === null) {
				map.addComponent(control);
			}
			else {
				control = cid;
			}
		}
		return control;
	},

	removeControl: function (control) {
		var map = this.maps[this.api];
		if (control !== null && typeof (control) !== "undefined") {
			var cid = map.getComponentById(control.getId());
			if (cid !== null) {
				map.removeComponent(cid);
			}
		}
	},

	// TODO: The Nokia Maps API doesn't currently differentiate between large and small
	// style of Zoom controls so, for now, make them functionally equivalent
	addSmallControls: function() {
		this.controls.zoom = this.addControl(new nokia.maps.map.component.ZoomBar());
	},

	removeSmallControls: function () {
		this.removeControl(this.controls.zoom);
	},
	
	addLargeControls: function() {
		this.addSmallControls();
	},

	removeLargeControls: function () {
		this.removeSmallControls();
	},
	
	addMapTypeControls: function () {
		this.controls.map_type = this.addControl(new nokia.maps.map.component.TypeSelector());
	},

	removeMapTypeControls: function () {
		this.removeControl(this.controls.map_type);
	},

	addScaleControls: function () {
		this.controls.scale = this.addControl(new nokia.maps.map.component.ScaleBar());
	},

	removeScaleControls: function () {
		this.removeControl(this.controls.scale);
	},

	addPanControls: function () {
		// The HERE API doesn't (appear) to support a pan control. The documentation
		// references nokia.maps.map.component.ViewControl() but this doesn't appear
		// to have any effect.
	},
	
	removePanControls: function () {
		// See above comment for addPanControls()
	},

	addOverviewControls: function (zoomOffset) {
		this.controls.overview = this.addControl(new nokia.maps.map.component.Overview());
		//TODO: Find the supporteed way to do this. API Docs sadly lacking
		this.controls.overview.De = zoomOffset;

		this.controls.overview.expand(); //Other Minimaps default to open.
	},

	removeOverviewControls: function () {
		this.removeControl(this.controls.overview);
	},
	
	setCenterAndZoom: function(point, zoom) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		
		map.setCenter(pt);
		map.setZoomLevel(zoom);
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var	nokia_marker = marker.toProprietary(this.api);
		
		map.objects.add(nokia_marker);
		return nokia_marker;
	},
	
	removeMarker: function(marker) {
		var map = this.maps[this.api];
		
		map.objects.remove(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},
	
	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var nokia_polyline = polyline.toProprietary(this.api);

		map.objects.add(nokia_polyline);
		return nokia_polyline;
	},
	
	removePolyline: function(polyline) {
		var map = this.maps[this.api];

		map.objects.remove(polyline.proprietary_polyline);
	},
	
	getCenter: function() {
		var map = this.maps[this.api];
		
		return new mxn.LatLonPoint(map.center.latitude, map.center.longitude);
	},
	
	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);

		map.setCenter(pt);
	},
	
	setZoom: function(zoom) {
		var map = this.maps[this.api];
		
		map.setZoomLevel(zoom);
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		
		return map.zoomLevel;
	},
	
	getZoomLevelForBoundingBox: function(bbox) {
		var map = this.maps[this.api];
		var sw = bbox.getSouthWest().toProprietary(this.api);
		var ne = bbox.getNorthEast().toProprietary(this.api);
		var nokia_bb = new nokia.maps.geo.BoundingBox(sw, ne);
		
		return map.getBestZoomLevel(nokia_bb);
	},
	
	setMapType: function(mapType) {
		var map = this.maps[this.api];
		var i;
		
		if (this.currentMapType === mapType) {
			return;
		}

		var provider = false;
		
		for (i=0; i<this.defaultBaseMaps.length; i++) {
			if (this.defaultBaseMaps[i].mxnType === mapType) {
				map.set('baseMapType', this.defaultBaseMaps[i].providerType);
				this.currentMapType = mapType;
				return;
			}
		}

		//TODO: Also set the overviewmap if (this.controls.overview)

		throw new Error(this.api + ': unable to find definition for map type ' + mapType);
	},
	
	getMapType: function() {
		return this.currentMapType;
	},
	
	getBounds: function() {
		var map = this.maps[this.api];
		var bbox = map.getViewBounds();
		var nw = bbox.topLeft;
		var se = bbox.bottomRight;

		return new mxn.BoundingBox(se.latitude, nw.longitude, nw.latitude, se.longitude);
	},
	
	setBounds: function(bounds) {
		var map = this.maps[this.api];
		var nw = bounds.getNorthWest().toProprietary(this.api);
		var se = bounds.getSouthEast().toProprietary(this.api);
		var nokia_bb = new nokia.maps.geo.BoundingBox(nw, se);
		var keepCentre = false;
		
		map.zoomTo(nokia_bb, keepCentre);
	},
	
	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		throw new Error('Mapstraction.addImageOverlay is not currently supported by provider ' + this.api);
	},
	
	setImagePosition: function(id, oContext) {
		throw new Error('Mapstraction.setImagePosition is not currently supported by provider ' + this.api);
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		throw new Error('Mapstraction.addOverlay is not currently supported by provider ' + this.api);
	},
	
	addTileMap: function(tileMap) {
		if (tileMap.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
			return tileMap.toProprietary(this.api);
		}

		throw new Error('mxn.Mapstraction.TileType.BASE is not supported by provider ' + this.api);
	},
	
	getPixelRatio: function() {
		throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
	},
	
	mousePosition: function(element) {
		var map = this.maps[this.api];
		var	locDisp = document.getElementById(element);
		var	coords;
		
		if (locDisp !== null) {
			map.addListener('mousemove', function(event){
				coords = map.pixelToGeo(event.targetX, event.targetY);
				locDisp.innerHTML = coords.latitude.toFixed(4) + ' / ' + coords.longitude.toFixed(4);
			}, false);		
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return new nokia.maps.geo.Coordinate(this.lat, this.lon);
	},
	
	fromProprietary: function(nokiaCoordinate) {
		this.lat = nokiaCoordinate.latitude;
		this.lon = nokiaCoordinate.longitude;
		this.lng = this.lon;
	}
},

Marker: {
	
	toProprietary: function() {
		var properties = {};
		var self = this;
		
		if (this.iconAnchor) {
			properties.anchor = [this.iconAnchor[0], this.iconAnchor[1]];
		}
		if (this.iconUrl) {
			properties.icon = this.iconUrl;
		}

		this.proprietary_infobubble = null;

		var	prop_marker = new nokia.maps.map.Marker(
				self.location.toProprietary(this.api),
				properties);

		if (this.infoBubble) {
			var	event_action = "click";
			if (this.hover) {
				event_action = "mouseover";
			}
			prop_marker.addListener(event_action, function() {
				self.openBubble();
			}, false);
		}

		if (this.draggable) {
			prop_marker.enableDrag();
			
			prop_marker.addListener("dragstart", function(event){
				var	bc = self.map.getComponentById("InfoBubbles");

				if (bc.bubbleExists(self.proprietary_infobubble)) {
					self.closeBubble();
					prop_marker.set("restore_infobubble", true);
				}
			}, false);
			
			prop_marker.addListener("dragend", function(event){
				var	xy = event.dataTransfer.getData("application/map-drag-object-offset");
				var new_coords = self.map.pixelToGeo(
					event.displayX - xy.x + prop_marker.anchor.x,
					event.displayY - xy.y + prop_marker.anchor.y
					);
				var bb = self.map.getBoundingBox();
				
				if (bb.contains(new_coords)) {
					self.location.lat = new_coords.latitude;
					self.location.lon = new_coords.longitude;
					self.location.lng = self.location.lon;
				}
				
				if (prop_marker.get("restore_infobubble")) {
					prop_marker.set("restore_infobubble", false);
					self.openBubble();
				}
			}, false);
		}

		prop_marker.addListener('click', function (event) {
				prop_marker.mapstraction_marker.click.fire(event);
			}, false);
		
		return prop_marker;
	},
	
	openBubble: function() {
		if (!this.map) {
			throw new Error('Marker.openBubble; this marker must be added to a map in order to manage a Bubble');
		}
		this.proprietary_infobubble = this.map.getComponentById("InfoBubbles").addBubble(this.infoBubble, this.location.toProprietary(this.api));
		this.openInfoBubble.fire( { 'marker': this } );		
	},
	
	closeBubble: function() {
		if (!this.map) {
			throw new Error('Marker.closeBubble; this marker must be added to a map in order to manage a Bubble');
		}

		if (this.map.getComponentById("InfoBubbles").bubbleExists(this.proprietary_infobubble)) {
			this.map.getComponentById("InfoBubbles").removeBubble(this.proprietary_infobubble);
		}
		this.proprietary_infobubble = null;
		this.closeInfoBubble.fire( { 'marker': this } );		
	},
	
	hide: function() {
		this.proprietary_marker.set('visibility', false);
	},
	
	show: function() {
		this.proprietary_marker.set('visibility', true);
	},
	
	update: function() {
		throw new Error('Marker.update is not currently supported by provider ' + this.api);
	}
	
},

Polyline: {
	
	toProprietary: function() {
		// nokia.maps.map.Polyline
		// color = nokia.maps.util.Pen.strokeColor
		// width = nokia.maps.util.Pen.lineWidth
		// opacity = 
		// closed = false
		// fillColor = brush.color

		// nokia.maps.map.Polygon
		// color = nokia.maps.util.Pen.strokeColor
		// width = nokia.maps.util.Pen.lineWidth
		// opacity = 
		// closed = true
		// fillColor = nokia.maps.util.Brush.color
		
		var	coords = [];
		
		for (var i=0, length=this.points.length; i<length; i++) {
			coords.push(this.points[i].toProprietary(this.api));
		}
		
		if (this.closed) {
			if (!(this.points[0].equals(this.points[this.points.length - 1]))) {
				coords.push(coords[0]);
			}
		}

		else if (this.points[0].equals(this.points[this.points.length - 1])) {
			this.closed = true;
		}
		
		if (this.closed) {
			var	polycolor = new mxn.util.Color();

			polycolor.setHexColor(this.fillColor);

			var polycolor_rgba = "rgba(" + polycolor.red + "," + polycolor.green + "," +
				polycolor.blue + "," + (this.opacity || 1.0) + ")";

			var polygon_options = {
				visibility: true,
				pen: {
					strokeColor: this.color,
					lineWidth: this.width
					 },
				brush: {
					fill: 'solid',
					color: polycolor_rgba
				}
			};

			this.proprietary_polyline = new nokia.maps.map.Polygon(coords, polygon_options);
		}
		
		else {
			var polyline_options = {
				visibility : true,
				pen: {
					strokeColor: this.color,
					lineWidth: this.width
				}
			};
			this.proprietary_polyline = new nokia.maps.map.Polyline(coords, polyline_options);
		}
		
		return this.proprietary_polyline;
	},
	
	show: function() {
		this.proprietary_polyline.set('visibility', true);
	},
	
	hide: function() {
		this.proprietary_polyline.set('visibility', false);
	}
},

// Code Health Warning
//
// The Nokia/HERE API doesn't (currently) support custom base map tiles. The workaround
// used here is to compartmentalise the HERE map's overlays property into two sections.
// Though not documented, the index of an ImgTileProvider instance in the overlays property
// is effectively its z-index. To support custom base maps, indices of < 1000 are assumed
// to be base maps. Indices of >= 1000 are assumed to be overlays, so to add an overlay, the
// index is incremented by 1000 so that the layers stack correctly.
//
// The obvious drawback here is that it limits an implementation to 1000 base map sets, but
// this never comes into play as we remove the current base map in setMapType if it's not
// a map type provided natively by the HERE API.
//
// All in all a horrible fugly cludge. I apologise to anyone reading this unreservedly.

TileMap: {
	addToMapTypeControl: function() {
		
	},
	
	hide: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling hide()');
		}
		
		var tileCache = null;
		var index = this.index;

		if (this.properties.type === mxn.Mapstraction.TileType.BASE) {
			tileCache = this.mxn.customBaseMaps;
		}
		else {
			tileCache = this.mxn.overlayMaps;
			index += 1000;
		}
		
		if (tileCache[this.index].visible) {
			tileCache[this.index].visible = false;
			
			this.map.overlays.removeAt(index);
			
			this.tileMapHidden.fire({
				'tileMap': this
			});
		}
	},
	
	removeFromMapTypeControl: function() {
		
	},
	
	show: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling show()');
		}

		var tileCache = null;
		var index = this.index;

		if (this.properties.type === mxn.Mapstraction.TileType.BASE) {
			tileCache = this.mxn.customBaseMaps;
		}
		else {
			tileCache = this.mxn.overlayMaps;
			index += 1000;
		}

		if (!tileCache[this.index].visible) {
			tileCache[this.index].visible = true;
			
			//this.map.overlays.add(this.prop_tilemap, index);
			this.map.overlays.add(this.prop_tilemap);
			
			this.tileMapShown.fire({
				'tileMap': this
			});
		}
	},
	
	toProprietary: function() {
		var self = this;
		var options = {
			getUrl: function(zoom, row, column) {
				var url = mxn.util.sanitizeTileURL(self.properties.url);
				if (self.properties.options.subdomains !== null) {
					url = mxn.util.getSubdomainTileURL(url, self.properties.options.subdomains);
				}

				// The HERE API doesn't know about templated tile URLs. No. Really
				url = url.replace(/\{z\}/gi, zoom).replace(/\{x\}/gi, column).replace(/\{y\}/gi, row);
				return url;
			},
			max: this.properties.options.maxZoom,
			min: this.properties.options.minZoom,
			opacity: this.properties.options.opacity,
			alpha: true,
			getCopyrights: function(area, zoom) {
				return [{
					label: this.properties.options.attribution,
					alt: this.properties.options.attribution
				}];
			}
		};
		
		return new nokia.maps.map.provider.ImgTileProvider(options);
	}
}
	
});