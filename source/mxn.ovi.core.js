mxn.register('ovi', {

Mapstraction: {

	init: function(element, api) {
		var me = this;
		var ovi_map;
		var mapLoaded = false;
		
		var eventStates = {
			"center": false,
			"zoom": false,
			"mapsize": false
		};
		
		if (typeof ovi.mapsapi.map.Display === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		ovi_map = new ovi.mapsapi.map.Display (element);
		ovi_map.addComponent(new ovi.mapsapi.map.component.InfoBubbles());
		ovi_map.addComponent(new ovi.mapsapi.map.component.Behavior());

		// Handle click event
		ovi_map.addListener('click', function(event){
			coords = ovi_map.pixelToGeo(event.targetX, event.targetY);
			me.click.fire({'location': new mxn.LatLonPoint(coords.latitude, coords.longitude)});
		}, false);

		// Handle endPan (via centre change) and zoom events
		// the Ovi Maps API doesn't have a discrete event for each of these events
		// instead it uses a start/update/end sequence of events, where update may happen
		// multiple times or not at all, so we need to keep track of which Ovi events have
		// fired during a start(/update) event sequence and then fire the relevent Mapstraction
		// events upon receiving the Ovi end event
		ovi_map.addListener('mapviewchangestart', function(event){
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

		ovi_map.addListener('mapviewchangeupdate', function(event){
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

		ovi_map.addListener('mapviewchangeend', function(event){
			// The Ovi Maps API doesn't support a "map loaded" event, but both a
			// "centre" and "size" mapviewchangestart/mapviewchangeupdate/mapviewchangeend
			// event sequence will be fired as part of the initial loading so we can trap
			// this and fire the MXN "load" event.
			
			if (!mapLoaded) {
				if (eventStates.center && eventStates.mapsize) {
					mapLoaded = true;
					eventStates.mapsize = false;
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

		this.maps[api] = ovi_map;
		this.loaded[api] = true;
	},
	
	applyOptions: function() {
		var map = this.maps[this.api];
		
		if (this.options.enableScrollWheelZoom) {
			map.addComponent(new ovi.mapsapi.map.component.zoom.MouseWheel());
		} 
		else {
			var mousewheel = map.getComponentById('zoom.MouseWheel');
			if (mousewheel) {
				map.removeComponent(mousewheel);
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
			if (cid === null) {
				map.addComponent(new ovi.mapsapi.map.component.Behavior());
			}
		}
		
		else {
			cid = map.getComponentById('Behavior');
			if (cid !== null) {
				map.removeComponent(cid);
			}
		}
		
		// TODO: The Ovi Maps API doesn't currently differentiate between large and small
		// style of Zoom controls so, for now, make them functionally equivalent
		if ('zoom' in args) {
			if (args.zoom || args.zoom == 'large' || args.zoom == 'small') {
				this.addSmallControls();
			}
		}

		else {
			cid = map.getComponentById('ZoomBar');
			if (cid !== null) {
				map.removeComponent(cid);
			}
		}

		if ('overview' in args && args.overview) {
			cid = map.getComponentById('Overview');
			if (cid === null) {
				map.addComponent(new ovi.mapsapi.map.component.Overview());
			}
		}
		
		else {
			cid = map.getComponentById('Overview');
			if (cid !== null) {
				map.removeComponent(cid);
			}
		}
		
		if ('scale' in args && args.scale) {
			cid = map.getComponentById('ScaleBar');
			if (cid === null) {
				map.addComponent(new ovi.mapsapi.map.component.ScaleBar ());
			}
		}

		else {
			cid = map.getComponentById('ScaleBar');
			if (cid !== null) {
				map.removeComponent(cid);
			}
		}
		
		if ('map_type' in args && args.map_type) {
			this.addMapTypeControls();
		}

		else {
			cid = map.getComponentById('TypeSelector');
			if (cid !== null) {
				map.removeComponent(cid);
			}
		}
	},

	// TODO: The Ovi Maps API doesn't currently differentiate between large and small
	// style of Zoom controls so, for now, make them functionally equivalent
	addSmallControls: function() {
		var map = this.maps[this.api];
		cid = map.getComponentById('ZoomBar');
		if (cid === null) {
			map.addComponent(new ovi.mapsapi.map.component.ZoomBar());
		}
	},
	
	addLargeControls: function() {
		this.addSmallControls();
	},
	
	addMapTypeControls: function() {
		var map = this.maps[this.api];
		cid = map.getComponentById('TypeSelector');
		if (cid === null) {
			map.addComponent(new ovi.mapsapi.map.component.TypeSelector ());
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
		var ovi_marker = marker.toProprietary(this.api);
		
		map.objects.add(ovi_marker);
		return ovi_marker;
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
		var ovi_polyline = polyline.toProprietary(this.api);

		map.objects.add(ovi_polyline);
		return ovi_polyline;
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
		var ovi_bb = new ovi.mapsapi.geo.BoundingBox(sw, ne);
		
		return map.getBestZoomLevel(ovi_bb);
	},
	
	setMapType: function(type) {
		var map = this.maps[this.api];
		
		switch (type) {
			case mxn.Mapstraction.ROAD:
				map.set("baseMapType", map.NORMAL);
				break;
			case mxn.Mapstraction.PHYSICAL:
				map.set("baseMapType", map.TERRAIN);
				break;
			case mxn.Mapstraction.HYBRID:
				map.set("baseMapType", map.SATELLITE);
				break;
			case mxn.Mapstraction.SATELLITE:
				map.set("baseMapType", map.SATELLITE);
				break;
			default:
				map.set("baseMapType", map.NORMAL);
				break;
		}	// end-switch ()
	},
	
	getMapType: function() {
		var map = this.maps[this.api];
		var type = map.baseMapType;
		
		switch(type) {
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

		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();

		var nw = new mxn.LatLonPoint(ne.lat, sw.lon).toProprietary(this.api);
		var se = new mxn.LatLonPoint(sw.lat, ne.lon).toProprietary(this.api);
		var ovi_bb = new ovi.mapsapi.geo.BoundingBox(nw, se);
		var keepCentre = false;
		map.zoomTo(ovi_bb, keepCentre);
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
		throw new Error('Mapstraction.addTileLayer is not currently supported by provider ' + this.api);
	},
	
	toggleTileLayer: function(tile_url) {
		throw new Error('Mapstraction.toggleTileLayer is not currently supported by provider ' + this.api);
	},
	
	getPixelRatio: function() {
		throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
	},
	
	mousePosition: function(element) {
		var map = this.maps[this.api];
		var locDisp = document.getElementById(element);
		var coords;
		
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
		return new ovi.mapsapi.geo.Coordinate(this.lat, this.lon);
	},
	
	fromProprietary: function(oviCoordinate) {
		this.lat = oviCoordinate.latitude;
		this.lon = oviCoordinate.longitude;
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

		var prop_marker = new ovi.mapsapi.map.Marker(
				self.location.toProprietary('ovi'),
				properties);

		if (this.infoBubble) {
			var event_action = "click";
			if (this.hover) {
				event_action = "mouseover";
			}
			prop_marker.addListener(event_action, function(event) {
				self.openBubble();
			}, false);
		}

		if (this.draggable) {
			prop_marker.enableDrag();
			
			prop_marker.addListener("dragstart", function(event){
				var bc = self.map.getComponentById("InfoBubbles");

				if (bc.bubbleExists(self.proprietary_infobubble)) {
					self.closeBubble();
					prop_marker.set("restore_infobubble", true);
				}
			}, false);
			
			prop_marker.addListener("dragend", function(event){
				var xy = event.dataTransfer.getData("application/map-drag-object-offset");
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
			throw new Error('Marker.openBubble: This marker must be added to a map in order to manage a Bubble for provider ' + this.api);
		}
		this.proprietary_infobubble = this.map.getComponentById("InfoBubbles").addBubble(this.infoBubble, this.location.toProprietary('ovi'));
	},
	
	closeBubble: function() {
		if (!this.map) {
			throw new Error('Marker.closeBubble: This marker must be added to a map in order to manage a Bubble for provider ' + this.api);
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
		var coords = [];
		
		for (var i=0, length=this.points.length; i<length; i++) {
			coords.push(this.points[i].toProprietary('ovi'));
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
			var polycolor = new mxn.util.Color();

			polycolor.setHexColor(this.color);

			var polycolor_rgba = "rgba(" + polycolor.red + "," + polycolor.green + "," +
				polycolor.blue + "," + this.opacity + ")";
			var polygon_options = {
				'visibility' : true,
				'fillColor' : polycolor_rgba,
				'color' : this.color,
				'stroke' : 'solid',
				'width' : this.width
			};
			this.proprietary_polyline = new ovi.mapsapi.map.Polygon (coords, polygon_options);
		}
		
		else {
			var polyline_options = {
				'visibility' : true,
				'color' : this.color,
				'stroke' : 'solid',
				'width' : this.width
			};
			this.proprietary_polyline = new ovi.mapsapi.map.Polyline (coords, polyline_options);
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