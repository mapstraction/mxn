mxn.register('leaflet', {

Mapstraction: {
	
	init: function(element, api) {
		if (typeof L.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		var me = this;
		var map = new L.Map(element.id, {
			zoomControl: false
		});
		map.addEventListener('moveend', function(){
			me.endPan.fire();
		}); 
		map.on("click", function(e) {
			me.click.fire({'location': new mxn.LatLonPoint(e.latlng.lat, e.latlng.lng)});
		});
		map.on("popupopen", function(e) {
			if (e.popup._source.mxnMarker) {
			  e.popup._source.mxnMarker.openInfoBubble.fire({'bubbleContainer': e.popup._container});
			}
		});
		map.on("popupclose", function(e) {
			if (e.popup._source.mxnMarker) {
			  e.popup._source.mxnMarker.closeInfoBubble.fire({'bubbleContainer': e.popup._container});
			}
		});
		map.on('load', function(e) {
			me.load.fire();
		});
		map.on('zoomend', function(e) {
			me.changeZoom.fire();
		});
		this.layers = {};
		this.features = [];
		this.maps[api] = map;

		this.controls =  {
			pan: null,
			zoom: null,
			overview: null,
			scale: null,
			map_type: null
		};

		// CODE HEALTH WARNING
		// The MapQuest Open Aerial Tiles, via http://oatile1.mqcdn.com, is being obsoleted
		// on 15/2/13.
		// MapQuest OSM Tiles (mxn.Mapstraction.ROAD) are via:
		//		http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg
		// MapQuest Open Aerial Tiles (mxn.Mapstraction.SATELLITE) are now via:
		//		http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg
		//
		// mxn.Mapstraction.HYBRID and mxn.Mapstraction.PHYSICAL remain unavailable via
		// Leaflet support
		//
		// Also note that the MQ Open Aerial tiles are only available at zoom levels 0-11
		// outside of the US.

		this.road_tile = {
			name: 'Roads',
			attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
			url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg'
		};
		this.satellite_tile = {
			name: 'Satellite',
			attribution: 'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
			url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg'
		};
		
		var subdomains = [1, 2, 3, 4];
		this.addTileLayer (this.satellite_tile.url, 1.0, this.satellite_tile.name, this.satellite_tile.attribution, 0, 18, true, subdomains);
		this.addTileLayer (this.road_tile.url, 1.0, this.road_tile.name, this.road_tile.attribution, 0, 18, true, subdomains);

		this.currentMapType = mxn.Mapstraction.ROAD;

		this.loaded[api] = true;
	},
	
	applyOptions: function(){
		if (this.options.enableScrollWheelZoom) {
			this.maps[this.api].scrollWheelZoom.enable();
		} else {
			this.maps[this.api].scrollWheelZoom.disable();
		}
		return;
	},

	resizeTo: function(width, height){
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		this.maps[this.api].invalidateSize();
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

		if ('zoom' in args || ('pan' in args && args.pan)) {
			if (args.pan || args.zoom || args.zoom == 'large' || args.zoom == 'small') {
				this.addSmallControls();
			}
		}
		else {
			if (this.controls.zoom !== null) {
				map.removeControl(this.controls.zoom);
				this.controls.zoom = null;
			}
		}
		
		if ('scale' in args && args.scale) {
			if (this.controls.scale === null) {
				this.controls.scale = new L.Control.Scale();
				map.addControl(this.controls.scale);
			}
		}
		else {
			if (this.controls.scale !== null) {
				map.removeControl(this.controls.scale);
				this.controls.scale = null;
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
	},

	addSmallControls: function() {
		var map = this.maps[this.api];
		
		if (this.controls.zoom === null) {
			this.controls.zoom = new L.Control.Zoom();
			map.addControl(this.controls.zoom);
		}
	},

	addLargeControls: function() {
		return this.addSmallControls();
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];
		
		if (this.controls.map_type === null) {
			this.controls.map_type = new L.Control.Layers(this.layers, this.features);
			map.addControl(this.controls.map_type);
		}
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setView(pt, zoom); 
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
		map.addLayer(pin);
		this.features.push(pin);
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		map.removeLayer(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		polyline = polyline.toProprietary(this.api);
		map.addLayer(polyline);
		this.features.push(polyline);
		return polyline;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		map.removeLayer(polyline.proprietary_polyline);
	},

	getCenter: function() {
		var map = this.maps[this.api];
		var pt = map.getCenter();
		return new mxn.LatLonPoint(pt.lat, pt.lng);
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		if (options && options.pan) { 
			map.panTo(pt); 
		}
		else { 
			map.setView(pt, map.getZoom(), true);
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

	getZoomLevelForBoundingBox: function(bbox) {
		var map = this.maps[this.api];
		var bounds = new L.LatLngBounds(
			bbox.getSouthWest().toProprietary(this.api),
			bbox.getNorthEast().toProprietary(this.api));
		return map.getBoundsZoom(bounds);
	},

	setMapType: function(type) {
		switch(type) {
			case mxn.Mapstraction.ROAD:
				this.layers[this.road_tile.name].bringToFront();
				this.currentMapType = mxn.Mapstraction.ROAD;
				break;

			case mxn.Mapstraction.SATELLITE:
				this.layers[this.satellite_tile.name].bringToFront();
				this.currentMapType = mxn.Mapstraction.SATELLITE;
				break;

			case mxn.Mapstraction.HYBRID:
				break;
			
			case mxn.Mapstraction.PHYSICAL:
				break;
				
			default:
				this.layers[this.road_tile.name].bringToFront();
				this.currentMapType = mxn.Mapstraction.ROAD;
				break;
		}
	},

	getMapType: function() {
		return this.currentMapType;
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var box = map.getBounds();
		var sw = box.getSouthWest();
		var ne = box.getNorthEast();
		return new mxn.BoundingBox(sw.lat, sw.lng, ne.lat, ne.lng);
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest().toProprietary(this.api);
		var ne = bounds.getNorthEast().toProprietary(this.api);
		var newBounds = new L.LatLngBounds(sw, ne);
		map.fitBounds(newBounds); 
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north) {
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
		var options = {
			minZoom: min_zoom,
			maxZoom: max_zoom,
			name: label,
			attribution: attribution,
			opacity: opacity
		};
		if (typeof subdomains !== 'undefined') {
			options.subdomains = subdomains;
		}
		var url = mxn.util.sanitizeTileURL(tile_url);
		
		this.layers[label] = new L.TileLayer(url, options);
		map.addLayer(this.layers[label]);
		this.tileLayers.push([tile_url, this.layers[label], true, z_index]);

		if (this.controls.map_type !== null) {
			this.controls.map_type.addBaseLayer(this.layers[label], label);
		}

		return this.layers[label];
	},

	toggleTileLayer: function(tile_url) {
		var map = this.maps[this.api];
		for (var f = 0; f < this.tileLayers.length; f++) {
			var tileLayer = this.tileLayers[f];
			if (tileLayer[0] == tile_url) {
				if (tileLayer[2]) {
					tileLayer[2] = false;
					map.removeLayer(tileLayer[1]);
				}
				else {
					tileLayer[2] = true;
					map.addLayer(tileLayer[1]);
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
			map.on("mousemove", function(e) {
				var loc = e.latlng.lat.toFixed(4) + '/' + e.latlng.lng.toFixed(4);
				locDisp.innerHTML = loc;
			});
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	},

	openBubble: function(point, content) {
		var map = this.maps[this.api];
		var newPoint = point.toProprietary(this.api);
		var marker = new L.Marker(newPoint);
		marker.bindPopup(content);
		map.addLayer(marker);
		marker.openPopup();
	},

	closeBubble: function() {
		var map = this.maps[this.api];
		map.closePopup();
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return new L.LatLng(this.lat,this.lon);
	},

	fromProprietary: function(point) {
		this.lat = point.lat();
		this.lon = point.lng();
	}
	
},

Marker: {
	
	toProprietary: function() {
		var me = this;
		var thisIcon = null;
		if (L.Icon.hasOwnProperty("Default")) {
			thisIcon = L.Icon.Default;
		}
		else {
			thisIcon = L.Icon;
		}
		if (me.iconUrl) {
			thisIcon = thisIcon.extend({
				options: {
					iconUrl: me.iconUrl
				}
			});
		}
		if (me.iconSize) {
			thisIcon = thisIcon.extend({
				options: {
					iconSize: new L.Point(me.iconSize[0], me.iconSize[1])
				}
			});
		}
		if (me.iconAnchor) {
			thisIcon = thisIcon.extend({
				options: {
					iconAnchor: new L.Point(me.iconAnchor[0], me.iconAnchor[1])
				}
			});
		}
		if (me.iconShadowUrl) {
			thisIcon = thisIcon.extend({
				options: {
					shadowUrl: me.iconShadowUrl
				}
			});
		}
		if (me.iconShadowSize) {
			thisIcon = thisIcon.extend({
				options: {
					shadowSize: new L.Point(me.iconShadowSize[0], me.iconShadowSize[1])
				}
			});
		}
		var iconObj = new thisIcon();
		var marker = new L.Marker(
			this.location.toProprietary('leaflet'),
			{ icon: iconObj }
		);
		(function(me, marker) {
			marker.on("click", function (e) {
				me.click.fire();
			});
		})(me, marker);
		return marker;
	},

	openBubble: function() {
		var pin = this.proprietary_marker;
		if (this.infoBubble) {
			pin.mxnMarker = this;
			pin.bindPopup(this.infoBubble);
			pin.openPopup();
		}
	},
	
	closeBubble: function() {
		var pin = this.proprietary_marker;
		pin.closePopup();
	},

	hide: function() {
		var map = this.mapstraction.maps[this.api];
		map.removeLayer(this.proprietary_marker);
	},

	show: function() {
		var map = this.mapstraction.maps[this.api];
		map.addLayer(this.proprietary_marker);
	},
	
	isHidden: function() {
		var map = this.mapstraction.maps[this.api];
		if (map.hasLayer(this.proprietary_marker)) {
			return false;
		} else {
			return true;
		}
	},

	update: function() {
		throw new Error('Marker.update is not currently supported by provider ' + this.api);
	}
	
},

Polyline: {

	toProprietary: function() {
		var coords = [];

		for (var i = 0,  length = this.points.length ; i< length; i++){
			coords.push(this.points[i].toProprietary('leaflet'));
		}

		var polyOptions = {
			color: this.color,
			opacity: this.opacity, 
			weight: this.width,
			fillColor: this.fillColor
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
			this.proprietary_polyline = new L.Polygon(coords, polyOptions);
		} else {
			this.proprietary_polyline = new L.Polyline(coords, polyOptions);
		}
		
		return this.proprietary_polyline;
	},
	
	show: function() {
		this.map.addLayer(this.proprietary_polyline);
	},

	hide: function() {
		this.map.removeLayer(this.proprietary_polyline);
	},
	
	isHidden: function() {
		if (this.map.hasLayer(this.proprietary_polyline)) {
			return false;
		} else {
			return true;
		}
	}
}

});

