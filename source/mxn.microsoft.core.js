mxn.register('microsoft', {	

Mapstraction: {
	
	init: function(element, api) {		
		var me = this;
		
		if (typeof VEMap === 'undefined') {
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

		this.controls =  {
			zoom: false,
			overview: false,
			map_type: false,
			scale: false
		};

		this.maps[api] = new VEMap(element.id);
		this.maps[api].HideDashboard();
		
		this.maps[api].AttachEvent('onclick', function(event){
			me.clickHandler();
			var map = me.maps[me.api];
			var shape = map.GetShapeByID(event.elementID);
			if (shape && shape.mapstraction_marker) {
				shape.mapstraction_marker.click.fire();
			} 
			else {
				var x = event.mapX;
				var y = event.mapY;
				var pixel = new VEPixel(x, y);
				var ll = map.PixelToLatLong(pixel);
				var eventArg = {
					'location': new mxn.LatLonPoint(ll.Latitude, ll.Longitude),
					'position': { x: event.mapX, y: event.mapY },
					'button': event.rightMouseButton ? 'right' : 'left'
				};
				
				me.click.fire(eventArg);
			}
		});
		this.maps[api].AttachEvent('onendzoom', function(event){
			me.moveendHandler(me);
			me.changeZoom.fire();				
		});
		this.maps[api].AttachEvent('onendpan', function(event){
			me.moveendHandler(me);
			me.endPan.fire();
		});
		this.maps[api].AttachEvent('onchangeview', function(event){
			me.endPan.fire();				
		});

		this.maps[this.api].SetDashboardSize(VEDashboardSize.Normal);
		this.maps[api].LoadMap();
		//document.getElementById("MSVE_obliqueNotification").style.visibility = "hidden"; 
	
		//removes the bird's eye pop-up
		this.loaded[api] = true;
		
		me._fireOnNextCall.push(function() {
			me.load.fire();
		});
	},
	
	applyOptions: function(){
		// applyOptions is called by mxn.core.js immediate after the provider specific call
		// to init, so don't check for queued events just yet.
		//this._fireQueuedEvents();
		var map = this.maps[this.api];
		if(this.options.enableScrollWheelZoom){
			map.enableContinuousZoom();
			map.enableScrollWheelZoom();
		}		
	},

	resizeTo: function(width, height){	
		this._fireQueuedEvents();
		this.maps[this.api].Resize(width, height);
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
		
		// Yuck. Microsoft 6 only lets you set the size of the dashboard before you
		// load the map for the first time. What a genius design decision that is.
		
		if (('zoom' in args && args.zoom == 'small' || args.zoom == 'large') || ('pan' in args && args.pan)) {
			if (!this.controls.zoom) {
				map.ShowDashboard();
				this.controls.zoom = true;
			}
		}
		
		else {
			if (this.controls.zoom) {
				map.HideDashboard();
				this.controls.zoom = false;
			}
		}
		if ('overview' in args && args.overview) {
			if (!this.controls.overview) {
				map.ShowMiniMap(0, 150, VEMiniMapSize.Small);
				this.controls.overview = true;
			}
		}

		else {
			if (this.controls.overview) {
				map.HideMiniMap();
				this.controls.overview = false;
			}
		}
		
		if ('scale' in args && args.scale) {
			if (!this.controls.scale) {
				map.ShowScalebar();
				this.controls.scale = true;
			}
		}
		
		else {
			if (this.controls.scale) {
				map.HideScalebar();
				this.controls.scale = false;
			}
		}
	},

	addSmallControls: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		map.SetDashboardSize(VEDashboardSize.Tiny);
		if (!this.controls.zoom) {
			map.ShowDashboard();
			this.controls.zoom = true;
		}
	},

	addLargeControls: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		map.SetDashboardSize(VEDashboardSize.Normal);
		if (!this.controls.zoom) {
			map.ShowDashboard();
			this.controls.zoom = true;
		}
	},

	addMapTypeControls: function() {
		this._fireQueuedEvents();
	},

	dragging: function(on) {
		var map = this.maps[this.api];
		if (on) {
			map.enableDragMap();
		}
		else {
			map.disableDragMap();
		}
	},

	setCenterAndZoom: function(point, zoom) { 
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		var vzoom =	zoom;
		map.SetCenterAndZoom(new VELatLong(point.lat,point.lon), vzoom);
	},
	
	addMarker: function(marker, old) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		marker.pinID = "mspin-"+new Date().getTime()+'-'+(Math.floor(Math.random()*Math.pow(2,16)));
		var pin = marker.toProprietary(this.api);
		
		map.AddShape(pin);
		//give onclick event
		//give on double click event
		//give on close window
		//return the marker
				
		return pin;
	},

	removeMarker: function(marker) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var id = marker.proprietary_marker.GetID();
		var microsoftShape = map.GetShapeByID(id);
		map.DeleteShape(microsoftShape);
	},
	
	declutterMarkers: function(opts) {
		this._fireQueuedEvents();

		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},

	addPolyline: function(polyline, old) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var pl = polyline.toProprietary(this.api);
		pl.HideIcon(); //hide the icon VE automatically displays
		map.AddShape(pl);
		return pl;
	},

	removePolyline: function(polyline) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var id = polyline.proprietary_polyline.GetID();
		var microsoftShape = map.GetShapeByID(id);
		map.DeleteShape(microsoftShape);
	},
	
	getCenter: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var LL = map.GetCenter();
		var point = new mxn.LatLonPoint(LL.Latitude, LL.Longitude);
		return point;
	},
 
	setCenter: function(point, options) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.SetCenter(new VELatLong(point.lat, point.lon));
	},

	setZoom: function(zoom) {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		map.SetZoomLevel(zoom);
	},
	
	getZoom: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var zoom = map.GetZoomLevel();
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
		switch(type) {
			case mxn.Mapstraction.ROAD:
				map.SetMapStyle(VEMapStyle.Road);
				break;
			case mxn.Mapstraction.SATELLITE:
				map.SetMapStyle(VEMapStyle.Aerial);
				break;
			case mxn.Mapstraction.HYBRID:
				map.SetMapStyle(VEMapStyle.Hybrid);
				break;
			default:
				map.SetMapStyle(VEMapStyle.Road);
		}	 
	},

	getMapType: function() {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var mode = map.GetMapStyle();
		switch(mode){
			case VEMapStyle.Aerial:
				return mxn.Mapstraction.SATELLITE;
			case VEMapStyle.Road:
				return mxn.Mapstraction.ROAD;
			case VEMapStyle.Hybrid:
				return mxn.Mapstraction.HYBRID;
			default:
				return null;
		}
	},

	getBounds: function () {
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		view = map.GetMapView();
		var topleft = view.TopLeftLatLong;
		var bottomright = view.BottomRightLatLong;
		
		return new mxn.BoundingBox(bottomright.Latitude,topleft.Longitude,topleft.Latitude, bottomright.Longitude );
	},

	setBounds: function(bounds){
		this._fireQueuedEvents();
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
		
		var rec = new VELatLongRectangle(new VELatLong(ne.lat, ne.lon), new VELatLong(sw.lat, sw.lon));
		map.SetMapView(rec);
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
		var map = this.maps[this.api];
		var layer = new VEShapeLayer(); 
		var mlayerspec = new VEShapeSourceSpecification(VEDataType.GeoRSS, url, layer);
		map.ImportShapeLayerData(mlayerspec);
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
			var map = this.maps[this.api];
			map.AttachEvent("onmousemove", function(veEvent){
				var latlon = map.PixelToLatLong(new VEPixel(veEvent.mapX, veEvent.mapY));
				var loc = latlon.Latitude.toFixed(4) + " / " + latlon.Longitude.toFixed(4);
				locDisp.innerHTML = loc;
			});
			locDisp.innerHTML = "0.0000 / 0.0000";
		}
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return new VELatLong(this.lat, this.lon);
	},

	fromProprietary: function(mpoint) {
		this.lat = mpoint.Latitude;
		this.lon = mpoint.Longitude;
	}
	
},

Marker: {
	
	toProprietary: function() {
		var mmarker = new VEShape(VEShapeType.Pushpin, this.location.toProprietary('microsoft'));
		mmarker.SetTitle(this.labelText);
		mmarker.SetDescription(this.infoBubble);
		
		if (this.iconUrl) {
			var customIcon = new VECustomIconSpecification();
			customIcon.Image = this.iconUrl;
			// See this article on how to patch 6.2 to correctly render offsets.
			// http://social.msdn.microsoft.com/Forums/en-US/vemapcontroldev/thread/5ee2f15d-09bf-4158-955e-e3fa92f33cda?prof=required&ppud=4
			if (this.iconAnchor) {
				 customIcon.ImageOffset = new VEPixel(-this.iconAnchor[0], -this.iconAnchor[1]);
			} 
			else if (this.iconSize) {
				 customIcon.ImageOffset = new VEPixel(-this.iconSize[0]/2, -this.iconSize[1]/2);
			}
			mmarker.SetCustomIcon(customIcon);	
		}
		if (this.draggable){
			mmarker.Draggable = true;
		}
		
		return mmarker;
	},

	openBubble: function() {
		if (!this.map) {
			throw new Error('Marker.openBubble; marker must be added to map in order to display infobox');
		}
		this.map.ShowInfoBox(this.proprietary_marker);
	},
	
	closeBubble: function() {
		if (!this.map) {
			throw new Error('Marker.openBubble; marker must be added to map in order to display infobox');
		}
		this.map.HideInfoBox();
	},

	hide: function() {
		this.proprietary_marker.Hide();
	},

	show: function() {
		this.proprietary_marker.Show();
	},

	update: function() {
		var point = new mxn.LatLonPoint(this.proprietary_marker.Latitude,this.proprietary_marker.Longitude);
		
		this.location = point;
	}
	
},

Polyline: {

	toProprietary: function() {
		var coords = [];
		var mtype;
		
		var colorToVEColor = function(color, opacity) {
			var mxColor = new mxn.util.Color(color);
			var mxOpacity = (typeof(opacity) == 'undefined' || opacity === null) ? 1.0 : opacity;
			var vecolor = new VEColor(mxColor.red, mxColor.green, mxColor.blue, mxOpacity);
			return vecolor;
		};
		
		for(var i = 0, length = this.points.length; i < length; i++) {
			coords.push(this.points[i].toProprietary('microsoft'));
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
			mtype = VEShapeType.Polygon;
		}
		else {
			mtype = VEShapeType.Polyline;
		}

		this.proprietary_polyline = new VEShape(mtype, coords);
		if (this.width) {
			this.proprietary_polyline.SetLineWidth(this.width);
		}
		if (this.color) {
			this.proprietary_polyline.SetLineColor(colorToVEColor(this.color, this.opacity));
		}
		if (this.fillColor) {
			this.proprietary_polyline.SetFillColor(colorToVEColor(this.fillColor, this.opacity));
		}

		return this.proprietary_polyline;
	},
		
	show: function() {
		this.proprietary_polyline.Show();
	},

	hide: function() {
		this.proprietary_polyline.Hide();
	}
}

});