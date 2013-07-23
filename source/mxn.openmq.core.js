mxn.register('openmq', {	

Mapstraction: {
	
	init: function(element, api) {
		var me = this;
		
		if (typeof MQA.TileMap === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		this._fireOnNextCall = [];
		this._fireQueuedEvents =  function() {
			var fireListCount = me._fireOnNextCall.length;
			if (fireListCount > 0) {
				var fireList = me._fireOnNextCall.splice(0, fireListCount);
				var handler;
				while ((handler = fireList.shift())) {
					handler();
				}
			}
		};
		
		var options = {
			elt: element,
			mtype: 'osm'
		};

		var map = new MQA.TileMap(options);
		this.maps[api] = map;
		this.loaded[api] = true;
		this.controls = {
			zoom: null,
			overview: null,
			map_type: null
		};

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
	
		me._fireOnNextCall.push(function() {
			me.load.fire();
		});
	},
	
	applyOptions: function(){
		// applyOptions is called by mxn.core.js immediate after the provider specific call
		// to init, so don't check for queued events just yet.
		//this._fireQueuedEvents();
		if (this.options.enableScrollWheelZoom) {
			MQA.withModule('mousewheel', function() {
				var map = this.maps[this.api];
				map.enableMouseWheelZoom();
			});
		}
	},

	resizeTo: function(width, height){	
		this._fireQueuedEvents();
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
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

		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var me = this;

		if ('zoom' in args || ('pan' in args && args.pan)) {
			if (args.pan || args.zoom == 'small') {
				this.addSmallControls();
			}
			
			else if (args.zoom == 'large') {
				this.addLargeControls();
			}
		}
		
		else {
			if (this.controls.zoom) {
				map.removeControl(this.controls.zoom);
				this.controls.zoom = null;
			}
		}

		if ('overview' in args && args.overview) {
			if (this.controls.overview === null) {
				MQA.withModule('insetmapcontrol', function() {
					var options = {
						size: { width: 150, height: 125},
						zoom: 3,
						mapType: 'map',
						minimized: false
					};
					me.controls.overview = new MQA.InsetMapControl(options);
					map.addControl(
						me.controls.overview,
						new MQA.MapCornerPlacement(MQA.MapCorner.BOTTOM_RIGHT));
				});
			}
		}
		
		else {
			if (this.controls.overview) {
				map.removeControl(this.controls.overview);
				this.controls.overview = null;
			}
		}
		
		if ('map_type' in args && args.map_type) {
			this.addMapTypeControls();
		}
		
		else {
			if (this.controls.map_type) {
				map.removeControl(this.controls.map_type);
				this.controls.map_type = null;
			}
		}
	},

	addSmallControls: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var me = this;

		if (this.controls.zoom !== null) {
			map.removeControl(this.controls.zoom);
		}

		MQA.withModule('smallzoom', function() {
			me.controls.zoom = new MQA.SmallZoom();
			map.addControl(
			    me.controls.zoom, 
			    new MQA.MapCornerPlacement(MQA.MapCorner.TOP_LEFT, new MQA.Size(5,5))
			  );
		});
	},

	addLargeControls: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var me = this;

		if (this.controls.zoom !== null) {
			map.removeControl(this.controls.zoom);
		}
		
		MQA.withModule('largezoom', function() {
			me.controls.zoom = new MQA.LargeZoom();
			map.addControl(
				me.controls.zoom, 
			    new MQA.MapCornerPlacement(MQA.MapCorner.TOP_LEFT, new MQA.Size(5,5))
			  );
		});
	},

	addMapTypeControls: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var me = this;
		
		if (this.controls.map_type === null) {
			MQA.withModule('viewoptions', function() {
				me.controls.map_type = new MQA.ViewOptions();
				map.addControl(me.controls.map_type);
			});
		}
	},

	setCenterAndZoom: function(point, zoom) { 
		this._fireQueuedEvents();
		
		// The order of setting zoom and center is critical and peculiar to the way in which
		// the MapQuest API seems to work (which is based on trial, error and reverse engineering)
		//
		// Or .. to quote @gilesc50 "don’t mess with this, its deliberately nuts"
		
		this.setZoom(zoom);
		this.setCenter(point);
	},
	
	addMarker: function(marker, old) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
		
		map.addShape(pin);
		
		return pin;
	},

	removeMarker: function(marker) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		map.removeShape(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		this._fireQueuedEvents();

		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},

	addPolyline: function(polyline, old) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var openmq_polyline = polyline.toProprietary(this.api);

		map.addShape(openmq_polyline);
		
		return openmq_polyline;
	},

	removePolyline: function(polyline) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		
		map.removeShape(polyline.proprietary_polyline);
	},
	
	getCenter: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var point = map.getCenter();
		
		return new mxn.LatLonPoint(point.lat, point.lng);
	},

	setCenter: function(point, options) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setCenter(pt);
	},

	setZoom: function(zoom) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		map.setZoomLevel(zoom);
	},
	
	getZoom: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var zoom = map.getZoomLevel();
		
		return zoom;
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		// NE and SW points from the bounding box.
		var ne = bbox.getNorthEast();
		var sw = bbox.getSouthWest();
		var zoom;
		
		throw new Error('Mapstraction.getZoomLevelForBoundingBox is not currently supported by provider ' + this.api);
	},

	setMapType: function(type) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		
		switch (type) {
			case mxn.Mapstraction.SATELLITE:
				map.setMapType('osmsat');
				break;
			case mxn.Mapstraction.HYBRID:
				map.setMapType('hyb');
				break;
			case mxn.Mapstraction.PHYSICAL:
				map.setMapType('osm');
				break;
			case mxn.Mapstraction.ROAD:
				map.setMapType('osm');
				break;						
			default:
				map.setMapType('osm');
				break;
		}
	},

	getMapType: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		
		var type = map.getMapType();
		switch(type) {
			case 'osmsat':
				return mxn.Mapstraction.SATELLITE;
			case 'hyb':
				return mxn.Mapstraction.HYBRID;
			case 'osm':
				return mxn.Mapstraction.ROAD;
			default:
				return mxn.Mapstraction.ROAD;
		}
	},

	getBounds: function () {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var rect = map.getBounds();
		var se = rect.lr;
		var nw = rect.ul;
		// MapQuest uses SE and NW points to declare bounds
		return new mxn.BoundingBox(se.lat, nw.lng, nw.lat, se.lng);
	},

	setBounds: function(bounds){
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
		
		// MapQuest uses SE and NW points to declare bounds
		var rect = new MQA.RectLL(new MQA.LatLng(sw.lat, ne.lon), new MQA.LatLng(ne.lat, sw.lon));
		map.zoomToRect(rect);
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		this._fireQueuedEvents();

		throw new Error('Mapstraction.addImageOverlay is not currently supported by provider ' + this.api);
	},

	setImagePosition: function(id, oContext) {
		this._fireQueuedEvents();

		throw new Error('Mapstraction.setImagePosition is not currently supported by provider ' + this.api);
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		this._fireQueuedEvents();

		throw new Error('Mapstraction.addOverlay is not currently supported by provider ' + this.api);
	},

	addTileLayer: function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
		this._fireQueuedEvents();

		throw new Error('Mapstraction.addTileLayer is not currently supported by provider ' + this.api);
	},

	toggleTileLayer: function(tile_url) {
		this._fireQueuedEvents();

		throw new Error('Mapstraction.toggleTileLayer is not currently supported by provider ' + this.api);
	},

	getPixelRatio: function() {
		this._fireQueuedEvents();

		throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
	},
	
	mousePosition: function(element) {
		this._fireQueuedEvents();

		var locDisp = document.getElementById(element);
		
		if (locDisp !== null) {
			var mapDiv = document.getElementById(this.element);
			var map = this.maps[this.api];
			var isIE = MQA.Util.getBrowserInfo().name == 'msie';
			var offsetX = mapDiv.offsetLeft - mapDiv.scrollLeft;
			var offsetY = mapDiv.offsetTop - mapDiv.scrollTop;
		
			locDisp.innerHTML = '0.0000 / 0.0000';
			mapDiv.onmousemove = function(evt) {
				var x = isIE ? evt.clientX : evt.pageX - offsetX;
				var y = isIE ? evt.clientY : evt.pageY - offsetY;
				var coords = map.pixToLL({x:x, y:y});
				locDisp.innerHTML = coords.lat.toFixed(4) + '/' + coords.lng.toFixed(4);
			};
		}
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
		if (this.infoBubble) {
			this.proprietary_marker.setInfoContentHTML(this.infoBubble);
			if (!this.proprietary_marker.infoWindow) {
				this.proprietary_marker.toggleInfoWindow ();
			}
			else {
				// close
			}
		}
	},

	closeBubble: function() {
		if (!this.proprietary_marker.infoWindow) {
			// open
		}
		else {
			this.proprietary_marker.toggleInfoWindow ();
		}
	},
	
	hide: function() {
		throw new Error('Marker.hide is not currently supported by provider ' + this.api);
	},

	show: function() {
		throw new Error('Marker.show is not currently supported by provider ' + this.api);
	},

	update: function() {
		throw new Error('Marker.update is not currently supported by provider ' + this.api);
	}
},

Polyline: {

	toProprietary: function() {
		var coords = [];
		
		for (var i=0, length=this.points.length; i < length; i++) {
			coords.push(this.points[i].lat);
			coords.push(this.points[i].lon);
		}

		if (this.closed) {
			if (!(this.points[0].equals(this.points[this.points.length - 1]))) {
				coords.push(this.points[0].lat);
				coords.push(this.points[0].lon);
			}
		}

		else if (this.points[0].equals(this.points[this.points.length - 1])) {
			this.closed = true;
		}

		if (this.closed) {
			this.proprietary_polyline = new MQA.PolygonOverlay();
			this.proprietary_polyline.color = this.color;
			this.proprietary_polyline.fillColor = this.fillColor;
			this.proprietary_polyline.fillColorAlpha = this.opacity;
			this.proprietary_polyline.colorAlpha = this.opacity;
			this.proprietary_polyline.borderWidth = this.width;
		}
		
		else {
			this.proprietary_polyline = new MQA.LineOverlay();
			this.proprietary_polyline.color = this.color;
			this.proprietary_polyline.colorAlpha = this.opacity;
			this.proprietary_polyline.borderWidth = this.width;
		}

		this.proprietary_polyline.setShapePoints(coords);

		return this.proprietary_polyline;
	},
	
	show: function() {
		this.proprietary_polyline.visible = true;
	},

	hide: function() {
		this.proprietary_polyline.visible = false;
	}
}

});