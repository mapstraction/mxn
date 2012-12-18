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
		this.setMapType();
		this.currentMapType = mxn.Mapstraction.ROAD;
		this.controls =  {
			pan: null,
			zoom: null,
			overview: null,
			scale: null,
			map_type: null
		};
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
		throw 'Not implemented';
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
				this.addTileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
					name: "Roads",
					attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
					subdomains: [1,2,3,4]
				});
				this.currentMapType = mxn.Mapstraction.ROAD;
				break;
			case mxn.Mapstraction.SATELLITE:
				this.addTileLayer('http://oatile{s}.mqcdn.com/naip/{z}/{x}/{y}.jpg', {
					name: "Satellite",
					attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
					subdomains: [1,2,3,4]
				});
				this.currentMapType = mxn.Mapstraction.SATELLITE;
				break;
			case mxn.Mapstraction.HYBRID:
				throw 'Not implemented';
			default:
				this.addTileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
					name: "Roads",
					attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
					subdomains: [1,2,3,4]
				});
				this.currentMapType = mxn.Mapstraction.ROAD;
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
		throw 'Not implemented';
	},

	setImagePosition: function(id, oContext) {
		throw 'Not implemented';
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		throw 'Not implemented';
	},

	addTileLayer: function(tile_url, options) {
		var z_index = this.tileLayers.length || 0;
		var layerName;
		if (options && options.name) {
			layerName = options.name;
			delete options.name;
		} else {
			layerName = 'Tiles';
		}
		var lowerCaseXYZ_url = tile_url.replace(/\{Z\}/g, '{z}').replace(/\{X\}/g, '{x}').replace(/\{Y\}/g, '{y}');
		this.layers[layerName] = new L.TileLayer(lowerCaseXYZ_url, options || {});
		var map = this.maps[this.api];
		map.addLayer(this.layers[layerName]);
		this.tileLayers.push( [tile_url, this.layers[layerName], true, z_index] );
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
		throw 'Not implemented';
	},
	
	mousePosition: function(element) {
		throw 'Not implemented';
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
				iconUrl: me.iconUrl
			});
		}
		if (me.iconSize) {
			thisIcon = thisIcon.extend({
				iconSize: new L.Point(me.iconSize[0], me.iconSize[1])
			});
		}
		if (me.iconAnchor) {
			thisIcon = thisIcon.extend({
				iconAnchor: new L.Point(me.iconAnchor[0], me.iconAnchor[1])
			});
		}
		if (me.iconShadowUrl) {
			thisIcon = thisIcon.extend({
				shadowUrl: me.iconShadowUrl
			});
		}
		if (me.iconShadowSize) {
			thisIcon = thisIcon.extend({
				shadowSize: new L.Point(me.iconShadowSize[0], me.iconShadowSize[1])
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
		throw 'Not implemented';
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

