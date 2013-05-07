mxn.register('openspace', {

Mapstraction: {

	init: function(element, api) {
		var me = this;
		var map;
		
		if (typeof OpenLayers === 'undefined') {
			throw new Error('OpenLayers is not loaded but is required to work with OpenSpace');
		}
		
		if (typeof OpenSpace.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		this.controls = {
			pan: null,
			zoom: null,
			overview: null,
			scale: null,
			map_type: null
		};

		// create the map with no controls and don't centre popup info window
		map = new OpenSpace.Map(element,{
			controls: [],
			centreInfoWindow: false
		});

		// note that these three controls are always there and the fact that 
		// there are three resident controls is used in addControls()
		// enable map drag with mouse and keyboard

		map.addControl(new OpenLayers.Control.Navigation());
		map.addControl(new OpenLayers.Control.KeyboardDefaults());
		// include copyright statement
		map.addControl(new OpenSpace.Control.CopyrightCollection());
		map.addControl(new OpenSpace.Control.PoweredBy());
	
		map.events.register(
			"click", 
			map,
			function(evt) {
				var point = this.getLonLatFromViewPortPx( evt.xy );
				// convert to LatLonPoint
				var llPoint = new mxn.LatLonPoint();
				llPoint.fromProprietary('openspace', point);
				me.clickHandler( llPoint.lat, llPoint.lon );
				return false;
			}
		);
		
		var loadfire = function(e) {
			me.load.fire();
			this.events.unregister('loadend', this, loadfire);
		};
		
		for (var layerName in map.layers) {
			if (map.layers.hasOwnProperty(layerName)) {
				if (map.layers[layerName].visibility === true) {
					map.layers[layerName].events.register('loadend', map.layers[layerName], loadfire);
				}
			}
		}
		
		map.events.register('zoomend', map, function(evt) {
			me.changeZoom.fire();
		});
		
		map.events.register('moveend', map, function(evt) {
			me.moveendHandler(me);
			me.endPan.fire();
		});
		
		this.maps[api] = map;
		this.loaded[api] = true;
	},
	
	applyOptions: function(){
		var map = this.maps[this.api];
		var navigators = map.getControlsByClass('OpenLayers.Control.Navigation');
	
		if (navigators.length > 0) {
			var navigator = navigators[0];
			if (this.options.enableScrollWheelZoom) {
				navigator.enableZoomWheel();
			}
			else {
				navigator.disableZoomWheel();
			}
			
			if (this.options.enableDragging) {
				navigator.activate();
			}
			else {
				navigator.deactivate();
			}
		}
	},
	
	resizeTo: function(width, height){
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		this.maps[this.api].updateSize();
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
		var controls;
		var	control;
		var i;
		
		if ('zoom' in args || ('pan' in args && args.pan)) {
			if (args.pan || args.zoom == 'small') {
				this.addSmallControls();
			}
			
			else if (args.zoom == 'large') {
				this.addLargeControls();
			}
		}

		else {
			if (!('pan' in args)) {
				controls = map.getControlsByClass('OpenSpace.Control.SmallMapControl');
				for (i=0; i < controls.length; i++) {
					controls[i].deactivate();
					map.removeControl(controls[i]);
				}
			}
			
			if (!('zoom' in args)) {
				controls = map.getControlsByClass('OpenSpace.Control.SmallMapControl');
				for (i=0; i < controls.length; i++) {
					controls[i].deactivate();
					map.removeControl(controls[i]);
				}
				controls = map.getControlsByClass('OpenSpace.Control.LargeMapControl');
				for (i=0; i < controls.length; i++) {
					controls[i].deactivate();
					map.removeControl(controls[i]);
				}
			}
		}
		if ('overview' in args) {
			controls = map.getControlsByClass('OpenSpace.Control.OverviewMap');
			if (controls.length === 0) {
				control = new OpenSpace.Control.OverviewMap();
				map.addControl(control);
				control.maximizeControl();
			}
		}
		
		else {
			controls = map.getControlsByClass('OpenSpace.Control.OverviewMap');
			for (i=0; i < controls.length; i++) {
				controls[i].deactivate();
				map.removeControl(controls[i]);
			}
		}
		
		if ('scale' in args && args.scale) {
			if (this.controls.scale === null) {
				this.controls.scale = new OpenLayers.Control.ScaleLine();
				map.addControl(this.controls.scale);
			}
		}

		else {
			if (this.controls.scale !== null) {
				this.controls.scale.deactivate();
				map.removeControl(this.controls.scale);
				this.controls.scale = null;
			}
		}

		
		if ('map_type' in args) {
			this.addMapTypeControls ();
		}

		else {
			controls = map.getControlsByClass('OpenSpace.Control.LayerSwitcher');
			for (i=0; i < controls.length; i++) {
				controls[i].deactivate();
				map.removeControl(controls[i]);
			}
		}
	},
	
	addSmallControls: function() {
		var map = this.maps[this.api];
		var controls;
		
		controls = map.getControlsByClass('OpenSpace.Control.SmallMapControl');
		if (controls.length === 0) {
			map.addControl(new OpenSpace.Control.SmallMapControl());
		}
	},
	
	addLargeControls: function() {
		var map = this.maps[this.api];
		var controls;

		controls = map.getControlsByClass('OpenSpace.Control.LargeMapControl');
		if (controls.length === 0) {
			map.addControl(new OpenSpace.Control.LargeMapControl());
		}
	},
	
	addMapTypeControls: function() {
		var map = this.maps[this.api];
		var controls;
	
		// This is all you get with OpenSpace, a control to switch on or
		// off the layers and markers; probably not much use to anybody

		controls = map.getControlsByClass('OpenSpace.Control.LayerSwitcher');
		if (controls.length === 0) {
			map.addControl(new OpenLayers.Control.LayerSwitcher());
		}
	},
	
	setCenterAndZoom: function(point, zoom) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
	
		var oszoom = zoom-6;
		if (oszoom<0) {
			oszoom = 0;
		}
		else if (oszoom>10) {
			oszoom = 10;
		}
		map.setCenter(pt, oszoom, false, false);
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var loc = marker.location.toProprietary(this.api);
		var pin = map.createMarker(loc, null, marker.labelText);
	
		// Fire 'click' event for Marker ...
		pin.events.register('click', marker, function(event) {
			marker.click.fire();
		});
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		
		map.removeMarker(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},
	
	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var pl = polyline.toProprietary(this.api);

		map.getVectorLayer().addFeatures([pl]);

		return pl;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		var pl = polyline.proprietary_polyline;

		map.removeFeatures([pl]);
	},
	
	getCenter: function() {
		var point;
		var map = this.maps[this.api];
	
		var pt = map.getCenter(); // an OpenSpace.MapPoint, National Grid
		var gridProjection = new OpenSpace.GridProjection();
		var center = gridProjection.getLonLatFromMapPoint(pt);
		return new mxn.LatLonPoint(center.lat, center.lon);
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setCenter(pt);
	},
	
	setZoom: function(zoom) {
		var map = this.maps[this.api];
	
		var oszoom = zoom-6;
		if (oszoom<0) {
			oszoom = 0;
	}
	else if (oszoom>10) {
			oszoom = 10;
	}
	map.zoomTo(oszoom);
	
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		var zoom;
	
		zoom = map.zoom + 6;  // convert to equivalent google zoom
	
		return zoom;
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
		// NE and SW points from the bounding box.
		var ne = bbox.getNorthEast();
		var sw = bbox.getSouthWest();
		var zoom;
	
		var obounds = new OpenSpace.MapBounds();
		obounds.extend(new mxn.LatLonPoint(sw.lat,sw.lon).toProprietary(this.api));
		obounds.extend(new mxn.LatLonPoint(ne.lat,ne.lon).toProprietary(this.api));
		zoom = map.getZoomForExtent(obounds) + 6; // get it and adjust to equivalent google zoom
	
		return zoom;
	},

	setMapType: function(type) {
		// OpenSpace only supports a single ROAD tile layer
	},

	getMapType: function() {
		return mxn.Mapstraction.ROAD;
	},

	getBounds: function () {
		var map = this.maps[this.api];

		// array of openspace coords	
		// left, bottom, right, top
		var olbox = map.calculateBounds().toArray(); 
		var ossw = new OpenSpace.MapPoint( olbox[0], olbox[1] );
		var osne = new OpenSpace.MapPoint( olbox[2], olbox[3] );
		// convert to LatLonPoints
		var sw = new mxn.LatLonPoint();
		sw.fromProprietary('openspace', ossw);
		var ne = new mxn.LatLonPoint();
		ne.fromProprietary('openspace', osne);
		return new mxn.BoundingBox(sw.lat, sw.lon, ne.lat, ne.lon);
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
	
		var obounds = new OpenSpace.MapBounds();
		obounds.extend(new mxn.LatLonPoint(sw.lat,sw.lon).toProprietary(this.api));
		obounds.extend(new mxn.LatLonPoint(ne.lat,ne.lon).toProprietary(this.api));
		map.zoomToExtent(obounds);	
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
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

		locDisp = document.getElementById(element);
		if (locDisp !== null) {
			map.events.register('mousemove', map, function (e) {
				var lonLat = map.getLonLatFromViewPortPx(e.xy);
				var mouseLL = new mxn.LatLonPoint();
				mouseLL.fromProprietary('openspace', lonLat);
				var loc = parseFloat(mouseLL.lat).toFixed(4) + ' / ' + parseFloat(mouseLL.lon).toFixed(4);
				locDisp.innerHTML = loc;
			});
		}
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		var lonlat = new OpenLayers.LonLat(this.lon, this.lat);
		// need to convert to UK national grid
		var gridProjection = new OpenSpace.GridProjection();
		return gridProjection.getMapPointFromLonLat(lonlat); 
		// on OpenSpace.MapPoint
	
	},
	
	fromProprietary: function(osPoint) {
		var gridProjection = new OpenSpace.GridProjection();
		var olpt = gridProjection.getLonLatFromMapPoint(osPoint); 
		// an OpenLayers.LonLat
		this.lon = olpt.lon;
		this.lat = olpt.lat;
	}
},

Marker: {
	
	toProprietary: function() {
		var size, anchor, icon;
		if(this.iconSize) {
			size = new OpenLayers.Size(this.iconSize[0],
					   this.iconSize[1]);
		}
		else {
			size = new OpenLayers.Size(20,25);
		}
	
		if(this.iconAnchor) {
			anchor = new OpenLayers.Pixel(this.iconAnchor[0],
					  this.iconAnchor[1]);
		}
		else {
			// FIXME: hard-coding the anchor point
			anchor = new OpenLayers.Pixel(-(size.w/2), -size.h);
		}
	
		if(this.iconUrl) {
			icon = new OpenSpace.Icon(this.iconUrl, size, anchor);
		}
	
		var marker = new OpenLayers.Marker(this.location.toProprietary(this.api), icon, this.labelText, new OpenLayers.Size(300,100));
		
		return marker;
	},

	openBubble: function() {
		this.map.openInfoWindow(this.proprietary_marker.icon, this.location.toProprietary(this.api), this.infoBubble, new OpenLayers.Size(300, 100));
		this.map.infoWindow.autoSize = true;
	},
	
	closeBubble: function() {
		this.map.closeInfoWindow();
	},

	hide: function() {
		this.proprietary_marker.display(false);
	},
	
	show: function() {
		this.proprietary_marker.display(true);
	},
	
	update: function() {
		throw new Error('Mapstraction.update is not currently supported by provider ' + this.api);
	}
},

Polyline: {

	toProprietary: function() {
		var coords = [];

		for (var i = 0, length = this.points.length ; i< length; i++){
			// convert each point to OpenSpace.MapPoint
			var ospoint = this.points[i].toProprietary(this.api);
			coords.push(new OpenLayers.Geometry.Point(ospoint.getEasting(),ospoint.getNorthing()));
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
			this.proprietary_polyline = new OpenLayers.Feature.Vector(
				new OpenLayers.Geometry.LinearRing(coords), 
				null,
				{
					fillColor: this.fillColor,
					strokeColor: this.color,
					strokeOpacity: this.opacity,
					fillOpacity: this.opacity,
					strokeWidth: this.width
				}
			);
		}
		else {
			this.proprietary_polyline = new OpenLayers.Feature.Vector(
				new	OpenLayers.Geometry.LineString(coords),
				null, 
				{
					fillColor: this.fillColor,
					strokeColor: this.color,
					strokeOpacity: this.opacity,
					fillOpacity: this.opacity,
					strokeWidth: this.width
				}
			);
		}

		return this.proprietary_polyline;
	},
	
	show: function() {
		delete this.proprietary_polyline.style.display;
	},
	
	hide: function() {
		this.proprietary_polyline.style.display = "none";
	}
}
	
});