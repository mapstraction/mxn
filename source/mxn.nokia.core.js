mxn.register('nokia', {

Mapstraction: {
	init: function(element, api) {
		var me = this;
		var	nokia_map;
		var	mapLoaded = false;
		
		if (typeof nokia.maps === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		var eventStates = {
			"center": false,
			"zoom": false,
			"mapsize": false
		};
		
		this.controls =  {
			pan: null,
			zoom: null,
			overview: null,
			scale: null,
			map_type: null
		};
		
		nokia_map = new nokia.maps.map.Display(element);
		nokia_map.addComponent(new nokia.maps.map.component.InfoBubbles());
		nokia_map.addComponent(new nokia.maps.map.component.Behavior());

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

		this.maps[api] = nokia_map;
		this.loaded[api] = true;
	},
	
	applyOptions: function() {
		var map = this.maps[this.api];
	    if (this.options.enableScrollWheelZoom) {
			map.addComponent(new nokia.maps.map.component.zoom.MouseWheel());
		}
		else {
			var cid = map.getComponentById('zoom.MouseWheel');
			if (cid !== null) {
				map.removeComponent(cid);
			}
		}
	},
	
	resizeTo: function(width, height) {
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
	},
	
	addControls: function(args) {
		/* args = { 
		 *     pan:      true,
		 *     zoom:     'large' || 'small',
		 *     overview: true,
		 *     scale:    true,
		 *     map_type: true,
		 * }
		 */

		var map = this.maps[this.api];
		var cid = null;
		
		if ('pan' in args && args.pan) {
			cid = map.getComponentById('Behavior');
			if (this.controls.pan === null) {
				this.controls.pan = new nokia.maps.map.component.Behavior();
				map.addComponent(this.controls.pan);
			}
		}

		else {
			if (this.controls.pan !== null) {
				map.removeComponent(this.controls.pan);
				this.controls.pan = null;
			}
		}
		
		// TODO: The Nokia Maps API doesn't currently differentiate between large and small
		// style of Zoom controls so, for now, make them functionally equivalent
		if ('zoom' in args) {
			if (args.zoom || args.zoom == 'large' || args.zoom == 'small') {
				this.addSmallControls();
			}
		}

		else {
			if (this.controls.zoom !== null) {
				map.removeComponent(this.controls.zoom);
				this.controls.zoom = null;
			}
		}
		
		if ('overview' in args && args.overview) {
			cid = map.getComponentById('Overview');
			if (this.controls.overview === null) {
				this.controls.overview = new nokia.maps.map.component.Overview();
				map.addComponent(this.controls.overview);
			}
		}

		else {
			if (this.controls.overview !== null) {
				map.removeComponent(this.controls.overview);
				this.controls.overview = null;
			}
		}
		
		if ('scale' in args && args.scale) {
			if (this.controls.scale === null) {
				this.controls.scale = new nokia.maps.map.component.ScaleBar();
				map.addComponent(this.controls.scale);
			}
		}

		else {
			if (this.controls.scale !== null) {
				map.removeComponent(this.controls.scale);
				this.controls.scale = null;
			}
		}
		
		if ('map_type' in args && args.map_type) {
			this.addMapTypeControls();
		}

		else {
			if (this.controls.map_type !== null) {
				map.removeComponent(this.controls.map_type);
				this.controls.map_type = null;
			}
		}
	},

	// TODO: The Nokia Maps API doesn't currently differentiate between large and small
	// style of Zoom controls so, for now, make them functionally equivalent
	addSmallControls: function() {
		var map = this.maps[this.api];
		if (this.controls.zoom === null) {
			this.controls.zoom = new nokia.maps.map.component.ZoomBar();
			map.addComponent(this.controls.zoom);
		}
	},
	
	addLargeControls: function() {
		this.addSmallControls();
	},
	
	addMapTypeControls: function() {
		var map = this.maps[this.api];
		if (this.controls.map_type === null) {
			this.controls.map_type = new nokia.maps.map.component.TypeSelector();
			map.addComponent(this.controls.map_type);
		}
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
	
	setMapType: function(type) {
		var map = this.maps[this.api];
		
		switch (type) {
			case mxn.Mapstraction.ROAD:
				map.set("baseMapType", nokia.maps.map.Display.NORMAL);
				break;
			case mxn.Mapstraction.PHYSICAL:
				map.set("baseMapType", nokia.maps.map.Display.TERRAIN);
				break;
			case mxn.Mapstraction.HYBRID:
				map.set("baseMapType", nokia.maps.map.Display.SATELLITE);
				break;
			case mxn.Mapstraction.SATELLITE:
				map.set("baseMapType", nokia.maps.map.Display.SATELLITE_PLAIN);
				break;
			default:
				map.set("baseMapType", nokia.maps.map.Display.NORMAL);
				break;
		}	// end-switch ()
	},
	
	getMapType: function() {
		var map = this.maps[this.api];
		var type = map.baseMapType;
		
		switch (type) {
			case map.NORMAL:
				return mxn.Mapstraction.ROAD;
			case map.TERRAIN:
				return mxn.Mapstraction.PHYSICAL;
			case map.SATELLITE:
				return mxn.Mapstraction.SATELLITE;
			default:
				return null;
		}	// end-switch ()
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
	
	addTileLayer: function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
		var map = this.maps[this.api];
		var z_index = this.tileLayers.length || 0;
		
		var tileProviderOptions = {
			getUrl: function(zoom, row, column) {
				var url = mxn.util.sanitizeTileURL(tile_url);
				if (typeof subdomains !== 'undefined') {
					url = mxn.util.getSubdomainTileURL(url, subdomains);
				}
				url = url.replace(/\{z\}/gi, zoom).replace(/\{x\}/gi, column).replace(/\{y\}/gi, row);
				return url;
			}, // obligatory 
			max: max_zoom,  // max zoom level for overlay
			min: min_zoom,  // min zoom level for overlay
			opacity: opacity, // 0 = transparent overlay, 1 = opaque
			alpha: true, // renderer to read alpha channel    
			getCopyrights : function(area, zoom) {
				return [{
					label: attribution,
					alt: attribution
				}];
			}// display copyright
		};	
		
		var overlay =  new nokia.maps.map.provider.ImgTileProvider (tileProviderOptions);                
		this.tileLayers.push( [tile_url, overlay, true, z_index] );
		return map.overlays.add(overlay);
	},
	
	toggleTileLayer: function(tile_url) {
		var map = this.maps[this.api];
		for (var f = 0; f < this.tileLayers.length; f++) {
			var tileLayer = this.tileLayers[f];
			if (tileLayer[0] == tile_url) {
				if (tileLayer[2]) {
					tileLayer[2] = false;
					map.overlays.remove(tileLayer[1]);
				}
				else {
					tileLayer[2] = true;
					map.overlays.add(tileLayer[1]);
				}
			}
		}
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
				self.location.toProprietary('nokia'),
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
		this.proprietary_infobubble = this.map.getComponentById("InfoBubbles").addBubble(this.infoBubble, this.location.toProprietary('nokia'));
	},
	
	closeBubble: function() {
		if (!this.map) {
			throw new Error('Marker.closeBubble; this marker must be added to a map in order to manage a Bubble');
		}

		if (this.map.getComponentById("InfoBubbles").bubbleExists(this.proprietary_infobubble)) {
			this.map.getComponentById("InfoBubbles").removeBubble(this.proprietary_infobubble);
		}
		this.proprietary_infobubble = null;
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
			coords.push(this.points[i].toProprietary('nokia'));
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
}
	
});