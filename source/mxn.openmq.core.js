mxn.register('openmq', {	

Mapstraction: {
	
	init: function(element, api) {
		var me = this;
		var map = new MQA.TileMap(element);
		this.maps[api] = map;
		this.loaded[api] = true;

		MQA.withModule('shapes', function() {
			// Loading all modules that can't be loaded on-demand
			// [This space left intentionally blank]
		});
		
		MQA.EventManager.addListener(map, 'click', function(e) {
			me.click.fire();
		});
		
		MQA.EventManager.addListener(map, 'zoomend', function(e) {
			me.changeZoom.fire();
		});

		MQA.EventManager.addListener(map, 'moveend', function(e) {
			me.endPan.fire();
		});
		
	},
	
	applyOptions: function(){
		if (this.options.enableScrollWheelZoom) {
			MQA.withModule('mousewheel', function() {
				var map = this.maps[this.api];
				map.enableMouseWheelZoom();
			});
		}
	},

	resizeTo: function(width, height){	
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
	},

	addControls: function( args ) {
		var map = this.maps[this.api];

		if (args.zoom) {
			if (args.zoom == 'large') { 
				this.addLargeControls();
			} else { 
				this.addSmallControls();
			}
		}
	},

	addSmallControls: function() {
		var map = this.maps[this.api];
		MQA.withModule('smallzoom', function() {
			map.addControl(
			    new MQA.SmallZoom(), 
			    new MQA.MapCornerPlacement(MQA.MapCorner.TOP_LEFT, new MQA.Size(5,5))
			  );
		});
	},

	addLargeControls: function() {
		var map = this.maps[this.api];
		MQA.withModule('largezoom', function() {
			map.addControl(
			    new MQA.LargeZoom(), 
			    new MQA.MapCornerPlacement(MQA.MapCorner.TOP_LEFT, new MQA.Size(5,5))
			  );
		});
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];
		// Open MapQuest only supports a single map type, so there is no map type control	
	},

	setCenterAndZoom: function(point, zoom) { 
		this.setCenter(point);
		this.setZoom(zoom);
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
		
		map.addShape(pin);
		
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		map.removeShape(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		var map = this.maps[this.api];
		// TODO: Add provider code
	},

	addPolyline: function(polyline, old) {
		var thisapi = this.api;
		var map = this.maps[thisapi];
		MQA.withModule('shapes', function() {
			var pl = polyline.toProprietary(thisapi);
			map.addShape(pl);
		});
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},
	
	getCenter: function() {
		var map = this.maps[this.api];
		var point = map.getCenter();
		
		return new mxn.LatLonPoint(point.lat, point.lng);
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
		var zoom = map.getZoomLevel();
		
		return zoom;
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
		// NE and SW points from the bounding box.
		var ne = bbox.getNorthEast();
		var sw = bbox.getSouthWest();
		var zoom;
		
		// TODO: Add provider code
		
		return zoom;
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		// MapQuest has a function to set map type, but open MapQuest only supports road
		/*
		switch (type) {
			case mxn.Mapstraction.SATELLITE:
				map.setMapType('sat');
				break;
			case mxn.Mapstraction.HYBRID:
				map.setMapType('hyb');
				break;
			//case mxn.Mapstraction.ROAD:
			//	break;						
			default:
				map.setMapType('map');
				break;
		}
		*/
		map.setMapType('map');
	},

	getMapType: function() {
		var map = this.maps[this.api];
		
		/*
		var type = map.getMapType();
		switch(type) {
			case 'sat':
				return mxn.Mapstraction.SATELLITE;
			case 'hyb':
				return mxn.Mapstraction.HYBRID;
			case 'map':
			default:
				return mxn.Mapstraction.ROAD
		}
		*/
		return mxn.Mapstraction.ROAD;
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var rect = map.getBounds();
		var se = rect.lr;
		var nw = rect.ul;
		// MapQuest uses SE and NW points to declare bounds
		return new mxn.BoundingBox(se.lat, nw.lng, nw.lat, se.lng);
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
		
		// MapQuest uses SE and NW points to declare bounds
		var rect = new MQA.RectLL(new MQA.LatLng(sw.lat, ne.lon), new MQA.LatLng(ne.lat, sw.lon));
		map.zoomToRect(rect);
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	setImagePosition: function(id, oContext) {
		var map = this.maps[this.api];
		var topLeftPoint; var bottomRightPoint;

		// TODO: Add provider code

		//oContext.pixels.top = ...;
		//oContext.pixels.left = ...;
		//oContext.pixels.bottom = ...;
		//oContext.pixels.right = ...;
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
		
	},

	addTileLayer: function(tile_url, opacity, copyright_text, min_zoom, max_zoom, map_type) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	toggleTileLayer: function(tile_url) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	getPixelRatio: function() {
		var map = this.maps[this.api];

		// TODO: Add provider code	
	},
	
	mousePosition: function(element) {
		var map = this.maps[this.api];

		// TODO: Add provider code	
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return new MQA.LatLng(this.lat, this.lon);
	},

	fromProprietary: function(mqPoint) {
		this.lat = mqPoint.lat;
		this.lon = mqPoint.lng;
	}
},

Marker: {
	
	toProprietary: function() {
		var pt = this.location.toProprietary(this.api);
		var mk = new MQA.Poi(pt);
		
		if (this.iconUrl) {
			var icon = new MQA.Icon(this.iconUrl, this.iconSize[0], this.iconSize[1]);
			mk.setIcon(icon);
		}
		
		if (this.infoBubble) {
			mk.setInfoContentHTML(this.infoBubble);
		}
		
		MQA.EventManager.addListener(mk, 'click', function() {
			mk.mapstraction_marker.click.fire();
		});
		
		return mk;
	},

	openBubble: function() {		
		// TODO: Add provider code
	},

	hide: function() {
		// TODO: Add provider code
	},

	show: function() {
		// TODO: Add provider code
	},

	update: function() {
		// TODO: Add provider code
	}
	
},

Polyline: {

	toProprietary: function() {
		var points = [];
		var oldpoints = this.points;
		
		for(var i =0, length = this.points.length; i < length; i++) {
			var thispt = this.points[i];
			points.push(thispt.lat);
			points.push(thispt.lon);
		}

		var line = new MQA.LineOverlay();
		line.setShapePoints(points);

		// Line options
		line.color = this.color || '#000000';
		line.colorAlpha = this.opacity || 1.0;
		line.borderWidth = this.width || 3;

		return line;
	},
	
	show: function() {
		// TODO: Add provider code
	},

	hide: function() {
		// TODO: Add provider code
	}
	
}

});