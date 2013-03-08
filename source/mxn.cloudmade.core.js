mxn.register('cloudmade', {	

	Mapstraction: {

		init: function(element, api) {
			var me = this;
			
			if (typeof CM.Map === 'undefined') {
				throw new Error(api + ' map script not imported');
			}
			
			var opts = {
				key: cloudmade_key
			};
			if (typeof cloudmade_styleId != "undefined"){
				opts.styleId = cloudmade_styleId;
			}

			this.controls = {
				zoom: null,
				overview: null,
				scale: null,
				map_type: null
			};
			
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
		
			var cloudmade = new CM.Tiles.CloudMade.Web(opts);
			this.maps[api] = new CM.Map(element, cloudmade);

			CM.Event.addListener(this.maps[api], 'load', function() {
				me._fireOnNextCall.push(function() {
					me.load.fire();
				});
			});
		
			CM.Event.addListener(this.maps[api], 'click', function(location,marker) {
				if ( marker && marker.mapstraction_marker ) {
					marker.mapstraction_marker.click.fire();
				}
				else if ( location ) {
					me.click.fire({'location': new mxn.LatLonPoint(location.lat(), location.lng())});
				}

				// If the user puts their own Google markers directly on the map
				// then there is no location and this event should not fire.
				if ( location ) {
					me.clickHandler(location.lat(),location.lng(),location,me);
				}
			});
			CM.Event.addListener(this.maps[api], 'moveend', function() {
				me.endPan.fire();
			});
			CM.Event.addListener(this.maps[api], 'zoomend', function() {
				me.changeZoom.fire();
			});

			// CloudMade insists that setCenter is called with a valid lat/long and a zoom
			// level before any other operation is called on the map. Surely a WTF moment.
			this.maps[api].setCenter(new CM.LatLng(0, 0), 12);
			this.loaded[api] = true;
		},

		applyOptions: function(){
			// applyOptions is called by mxn.core.js immediate after the provider specific call
			// to init, so don't check for queued events just yet.
			//this._fireQueuedEvents();
			var map = this.maps[this.api];
			if (this.options.enableScrollWheelZoom) {
				map.enableScrollWheelZoom();
			}
			else {
				map.disableScrollWheelZoom();
			}
		},

		resizeTo: function(width, height){	
			this._fireQueuedEvents();
			this.maps[this.api].checkResize();
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

			if ('zoom' in args) {
				if (args.zoom == 'small') {
					this.addSmallControls();
				}

				else if (args.zoom == 'large') {
					this.addLargeControls();
				}
			}

			else {
				if (this.controls.zoom !== null) {
					map.removeControl(this.controls.zoom);
					this.controls.zoom = null;
				}
			}

			if ('overview' in args && args.overview) {
				if (this.controls.overview === null) {
					this.controls.overview = new CM.OverviewMapControl();
					map.addControl(this.controls.overview);
				}
			}
			
			else {
				if (this.controls.overview !== null) {
					map.removeControl(this.controls.overview);
					this.controls.overview = null;
				}
			}
			
			if ('map_type' in args && args.map_type) {
				this.addMapTypeControls();
			}

			else {
				if (this.controls.map_type !== null) {
					map.removeControl(this.controls.map_type);
					this.controls.map_type = null;
				}
			}
			
			if ('scale' in args && args.scale) {
				if (this.controls.scale === null) {
					this.controls.scale = new CM.ScaleControl();
					map.addControl(this.controls.scale);
				}
			}
			
			else {
				if (this.controls.scale !== null) {
					map.removeControl(this.controls.scale);
					this.controls.scale = null;
				}
			}
		},

		addSmallControls: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			if (this.controls.zoom !== null) {
				map.removeControl(this.controls.zoom);
			}

			this.controls.zoom = new CM.SmallMapControl();
			map.addControl(this.controls.zoom);
		},

		addLargeControls: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			if (this.controls.zoom !== null) {
				map.removeControl(this.controls.zoom);
			}

			this.controls.zoom = new CM.LargeMapControl();
			map.addControl(this.controls.zoom);
		},

		addMapTypeControls: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			if (this.controls.map_type === null) {
				this.controls.map_type = new CM.TileLayerControl();
				map.addControl(this.controls.map_type);
			}
		},

		dragging: function(on) {
			var map = this.maps[this.api];

			if (on) {
				map.enableDragging();
			} else {
				map.disableDragging();
			}
		},

		setCenterAndZoom: function(point, zoom) { 
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			map.setCenter(pt, zoom);
		},

		addMarker: function(marker, old) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pin = marker.toProprietary(this.api);
			map.addOverlay(pin);
			return pin;
		},

		removeMarker: function(marker) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			marker.proprietary_marker.closeInfoWindow();
			map.removeOverlay(marker.proprietary_marker);
		},
		
		declutterMarkers: function(opts) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
		},

		addPolyline: function(polyline, old) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pl = polyline.toProprietary(this.api);
			map.addOverlay(pl);
			return pl;
		},

		removePolyline: function(polyline) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			map.removeOverlay(polyline.proprietary_polyline);
		},

		getCenter: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pt = map.getCenter();

			return new mxn.LatLonPoint(pt.lat(), pt.lng());
		},

		setCenter: function(point, options) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			if(typeof (options) != 'undefined' && options.pan) { map.panTo(pt); }
			else { map.setCenter(pt); }
		},

		setZoom: function(zoom) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			map.setZoom(zoom);
		},

		getZoom: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			return map.getZoom();
		},

		getZoomLevelForBoundingBox: function( bbox ) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			// NE and SW points from the bounding box.
			var ne = bbox.getNorthEast();
			var sw = bbox.getSouthWest();

			var zoom = map.getBoundsZoomLevel(new CM.LatLngBounds(sw.toProprietary(this.api), ne.toProprietary(this.api)));
			return zoom;
		},

		setMapType: function(type) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// CloudMade supports Web, Mobile, Mapnik, OSMarender and Cycle map tiles
			// but none of theme map to the standard MXN map tile types. So effectively
			// we can only support mxn.Mapstraction.ROAD, which is equivalent to the
			// default CloudMade Web map tile type.
		},

		getMapType: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// See note in setMapType() above regarding CloudMade map tile types

			return mxn.Mapstraction.ROAD;
		},

		getBounds: function () {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			var box = map.getBounds();
			var sw = box.getSouthWest();
			var ne = box.getNorthEast();

			return new mxn.BoundingBox(sw.lat(), sw.lng(), ne.lat(), ne.lng());
		},

		setBounds: function(bounds){
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var sw = bounds.getSouthWest();
			var ne = bounds.getNorthEast();

			map.zoomToBounds(new CM.LatLngBounds(sw.toProprietary(this.api), ne.toProprietary(this.api)));
		},

		addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			throw new Error('Mapstraction.addImageOverlay is not currently supported by provider ' + this.api);
		},

		setImagePosition: function(id, oContext) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var topLeftPoint; var bottomRightPoint;

			throw new Error('Mapstraction.setImagePosition is not currently supported by provider ' + this.api);
		},

		addOverlay: function(url, autoCenterAndZoom) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			throw new Error('Mapstraction.addOverlay is not currently supported by provider ' + this.api);
		},

		addTileLayer: function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			throw new Error('Mapstraction.addTileLayer is not currently supported by provider ' + this.api);
		},

		toggleTileLayer: function(tile_url) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			throw new Error('Mapstraction.toggleTileLayer is not currently supported by provider ' + this.api);
		},

		getPixelRatio: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
		},

		mousePosition: function(element) {
			this._fireQueuedEvents();

			var map = this.maps[this.api];
			var locDisp = document.getElementById(element);
			if (locDisp !== null) {
				CM.Event.addListener(map, 'mousemove', function(point) {
					var loc = point._lat.toFixed(4) + ' / ' + point._lng.toFixed(4);
					locDisp.innerHTML = loc;
				});
				locDisp.innerHTML = '0.0000 / 0.0000';
			}
		}
	},

	LatLonPoint: {

		toProprietary: function() {
			var cll = new CM.LatLng(this.lat,this.lon);
			return cll;
		},

		fromProprietary: function(point) {
			this.lat = point.lat();
			this.lon = point.lng();
		}
	},

	Marker: {

		toProprietary: function() {
			var pt = this.location.toProprietary(this.api);
			var options = {};

			if (this.iconUrl) {
				var cicon = new CM.Icon();
				cicon.image = this.iconUrl;
				if (this.iconSize) {
					cicon.iconSize = new CM.Size(this.iconSize[0], this.iconSize[1]);
					if (this.iconAnchor) {
						cicon.iconAnchor = new CM.Point(this.iconAnchor[0], this.iconAnchor[1]);
					}
				}
				if (this.iconShadowUrl) {
					cicon.shadow = this.iconShadowUrl;
					if (this.iconShadowSize) {
						cicon.shadowSize = new CM.Size(this.iconShadowSize[0], this.iconShadowSize[1]);
					}
				}
				options.icon = cicon;
			}
			if (this.labelText) {
				options.title = this.labelText;
			}
			var cmarker = new CM.Marker(pt, options);

			if (this.infoBubble) {
				cmarker.bindInfoWindow(this.infoBubble);
			}


			return cmarker;
		},

		openBubble: function() {		
			var pin = this.proprietary_marker;
			pin.openInfoWindow(this.infoBubble);
		},

		closeBubble: function() {
			var pin = this.proprietary_marker;
			pin.closeInfoWindow();
		},
		
		hide: function() {
			var pin = this.proprietary_marker;
			pin.hide();
		},

		show: function() {
			var pin = this.proprietary_marker;
			pin.show();
		},

		update: function() {
			throw new Error('Marker.update is not currently supported by provider ' + this.api);
		}
	},

	Polyline: {

		toProprietary: function() {
			var coords = [];

			for (var i = 0,  length = this.points.length ; i< length; i++){
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
				this.proprietary_polyline = new CM.Polygon(coords, this.color, this.width, this.opacity, this.fillColor || "#5462E3", this.opacity || "0.3");
			}
			else {
				this.proprietary_polyline = new CM.Polyline(coords, this.color, this.width, this.opacity);
			}

			return this.proprietary_polyline;
		},

		show: function() {
			this.proprietary_polyline.show();
		},

		hide: function() {
			this.proprietary_polyline.hide();
		}
	}
});
