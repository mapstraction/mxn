mxn.register('leafletv0', {

Mapstraction: {
	
	init: function(element, api, properties) {
		if (typeof L.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		var baseMaps = [
			{
				mxnType: mxn.Mapstraction.ROAD,
				providerType: 'mxn.BaseMapProviders.MapQuestOpen',
				nativeType: false
			},
			{
				mxnType: mxn.Mapstraction.SATELLITE,
				providerType: 'mxn.BaseMapProviders.Esri.WorldImagery',
				nativeType: false
			},
			{
				mxnType: mxn.Mapstraction.HYBRID,
				providerType: 'mxn.BaseMapProviders.Esri.WorldTopoMap',
				nativeType: false
			},
			{
				mxnType: mxn.Mapstraction.PHYSICAL,
				providerType: 'mxn.BaseMapProviders.Esri.WorldPhysical',
				nativeType: false
			}
		];

		var self = this;
		this.initBaseMaps(baseMaps);
		this.layers = {};
		this.features = [];
		this.currentMapType = mxn.Mapstraction.ROAD;

		for (var i=0; i<this.customBaseMaps.length; i++) {
			this.layers[this.customBaseMaps[i].label] = this.customBaseMaps[i].tileObject;
		}
		
		this.controls =  {
			pan: null,
			zoom: null,
			overview: null,
			scale: null,
			map_type: null
		};

		// Code Health Warning
		// The ZoomSlide and Pan controls add themselves into any new instance of L.Map
		// by default. Clever but stupidly frustrating. So we need to disable them by
		// default and only add them in when requested.
		// See https://github.com/kartena/Leaflet.Pancontrol/issues/11
		
		var options = {
			zoomControl: false,			// 'pure' Leaflet
			zoomsliderControl: false,	// added in as default by Leaflet.zoomslider
			panControl: false			// added in as default by Leaflet.Pancontrol
		};

		// Code Health Warning
		// Note that Leaflet (plus the loaded plugins) only allow the zoom, zoom slide
		// and pan controls to be added via options; you need to have the instance of
		// the control stored away if you want to subsequently remove it. So we're not
		// using the options method of adding these controls, but we create them, store
		// them and then add them after we've instantiated L.Map.

		if (typeof properties !== 'undefined' && properties !== null) {
			if (properties.hasOwnProperty('center') && null !== properties.center) {
				var point;
				if (Object.prototype.toString.call(properties.center) === '[object Array]') {
					point = new mxn.LatLonPoint(properties.center[0], properties.center[1]);
				}
				
				else {
					point = properties.center;
				}
				options.center = point.toProprietary(this.api);
			}

			if (properties.hasOwnProperty('zoom')) {
				options.zoom = properties.zoom;
			}
			
			if (properties.hasOwnProperty('map_type') && null !== properties.map_type) {
				this.currentMapType = properties.map_type;
				/*var layer;
				
				switch (properties.map_type) {
					case mxn.Mapstraction.ROAD:
						layer = this.road_tile;
						break;
					case mxn.Mapstraction.SATELLITE:
						layer = this.satellite_tile;
						break;
					case mxn.Mapstraction.HYBRID:
						layer = this.road_tile;
						break;
					case mxn.Mapstraction.PHYSICAL:
						layer = this.road_tile;
						break;
					default:
						break;
				}
				options.layers = layer.tileLayer.toProprietary(this.api);
				this.currentMapType = properties.map_type;*/
			}
			
			var defaultMap = this.getDefaultBaseMap(this.currentMapType);
			//var baseMap = this.getCustomBaseMap(mxnType);
			var baseMap = this.getCustomBaseMap(defaultMap.providerType);
			
			options.layers = [baseMap.tileObject];
			
			if (properties.hasOwnProperty('dragging')) {
				options.dragging = properties.dragging;
			}
			
			if (properties.hasOwnProperty('scroll_wheel')) {
				options.scrollWheelZoom = properties.scroll_wheel;
			}
			
			if (properties.hasOwnProperty('double_click')) {
				options.doubleClickZoom = properties.double_click;
			}

			if (properties.hasOwnProperty('controls') && null !== properties.controls) {
				var controls = properties.controls;
				
				if ('pan' in controls && controls.pan && L.Control.Pan) {
					this.controls.pan = new L.Control.Pan();
				}
				
				if ('zoom' in controls) {
					// For a 'small' zoom control, use Leaflet's built-in zoom control.
					// For a 'large' zoom control, use the ZoomSlide plugin control.
		
					if (controls.zoom === 'small') {
						this.controls.zoom = new L.Control.Zoom();
					}
					
					else if (controls.zoom === 'large') {
						this.controls.zoom = L.Control.Zoomslider ? new L.Control.Zoomslider() : new L.Control.Zoom();
					}
				}
				
				if ('overview' in controls && controls.overview && L.Control.MiniMap) {
					// Code Health Warning
					//
					// Hack to fix L.Control.MiniMap when working with L.Control.Pan
					// and L.Control.Zoomslider
					// See https://github.com/Norkart/Leaflet-MiniMap/issues/11
					
					L.Map.mergeOptions({
						panControl: false,
						zoomsliderControl: false
					});
					
					if (typeof controls.overview !== 'number') {
						controls.overview = 5;
					}
					
					var minimap_opts = {
						minZoom: 0,
						maxZoom: baseMap.baseMap.properties.options.maxZoom - controls.overview
					};

					if (baseMap.baseMap.properties.options.subdomains) {
						minimap_opts.subdomains = baseMap.baseMap.properties.options.subdomains;
					}

					this.minimap_layer = new L.TileLayer(baseMap.baseMap.properties.url, minimap_opts);
					this.controls.overview = new L.Control.MiniMap(this.minimap_layer, {
						toggleDisplay: true,
						zoomLevelOffset: -this.controls.overview
					});
				}
				
				if ('scale' in controls && controls.scale) {
					this.controls.scale = new L.Control.Scale();
				}
				
				if ('map_type' in controls && controls.map_type) {
					this.controls.map_type = new L.Control.Layers(this.layers, this.features, , {autoZIndex: false});
				}
			}

		}

		var me = this;
		var map = new L.Map(element.id, options);
		
		for (var control in this.controls) {
			if (this.controls[control] !== null) {
				map.addControl(this.controls[control]);
			}
		}
		
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
		
		var layerHandler = function(e) {
			var prevMapType = self.currentMapType;

			var layerName = null;
			for (var c=0; c<self.customBaseMaps.length; c++) {
				if (e.type === 'baselayerchange' && self.customBaseMaps[c].label === e.name) {
					layerName = self.customBaseMaps[c].name;
					break;
				}
				
				else {
					if (e.type === 'layeradd' && self.customBaseMaps[c].tileObject == e.layer) {
						layerName = self.customBaseMaps[c].name;
						break;
					}
				}
			}
			
			for (var d=0; d<self.defaultBaseMaps.length; d++) {
				if (self.defaultBaseMaps[d].providerType === layerName) {
					layerName = self.defaultBaseMaps[d].mxnType;
				}
			}
			
			self.currentMapType = layerName;
		};
		
		map.on('baselayerchange', layerHandler);
		map.on('layeradd', layerHandler);
		
		this.maps[api] = map;


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
		//this.addTileLayer (this.satellite_tile.url, 1.0, this.satellite_tile.name, this.satellite_tile.attribution, 0, 18, true, subdomains);
		//this.addTileLayer (this.road_tile.url, 1.0, this.road_tile.name, this.road_tile.attribution, 0, 18, true, subdomains);

		this.currentMapType = mxn.Mapstraction.ROAD;

		this.loaded[api] = true;
	},
	
	getVersion: function() {
		return L.version;
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

	setMapType: function(mapType) {
		var i;
		var name = null;
		
		for (i=0; i<this.defaultBaseMaps.length; i++) {
			if (this.defaultBaseMaps[i].mxnType === mapType) {
				if (this.currentMapType === this.defaultBaseMaps[i].mxnType) {
					return;
				}
				name = this.defaultBaseMaps[i].providerType;
				break;
			}
		}
		
		if (name === null) {
			name = mapType;
		}

		var layers = [];
		var map = this.maps[this.api];

		for (i=0; i<this.customBaseMaps.length; i++) {
			if (this.customBaseMaps[i].name === name) {
				map.addLayer(this.customBaseMaps[i].tileObject, true);
			}
			
			else if (map.hasLayer(this.customBaseMaps[i].tileObject)) {
				layers.push(this.customBaseMaps[i].tileObject);
			}
		}

		for (i=0; i<layers.length; i++) {
			map.removeLayer(layers[i]);
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
		var map = this.maps[this.api];
		var imageBounds = [[west, south], [east, north]];
		L.imageOverlay(src, imageBounds).addTo(map);
	},

	setImagePosition: function(id, oContext) {
		throw new Error('Mapstraction.setImagePosition is not currently supported by provider ' + this.api);
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		throw new Error('Mapstraction.addOverlay is not currently supported by provider ' + this.api);
	},

	addBaseMap: function(baseMap) {
		return baseMap.toProprietary(this.api);
	},
	
	addOverlayMap: function(overlayMap) {
		return overlayMap.toProprietary(this.api);
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
		this.openInfoBubble.fire( { 'marker': this } );		
	},

	closeBubble: function() {
		var map = this.maps[this.api];
		map.closePopup();
		this.closeInfoBubble.fire( { 'marker': this } );		
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
		var iconObj = null;
		
		if (me.htmlContent) {
			var options = {};
			options.html = me.htmlContent;
			options.className =  ''; //to override the default white square class
			
			if (me.iconAnchor) {
				options.iconAnchor = new L.Point(me.iconAnchor[0], me.iconAnchor[1]);
			}
			iconObj = new L.divIcon(options); //Annoyingly extend doesn't work on divIcon.
		}
		else {
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
			iconObj = new thisIcon();
		}
		
		var marker = new L.Marker(
			this.location.toProprietary(this.api),
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
			coords.push(this.points[i].toProprietary(this.api));
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
},

BaseMap: {
	addControl: function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': A BaseMap must be added to the map before calling addControl()');
		}

		if (!this.mapstraction.customBaseMaps[this.index].inControl) {
			this.mapstraction.customBaseMaps[this.index].inControl = true;
			this.mapstraction.layers[this.properties.options.label] = this.proprietary_tilemap;
			if (this.mapstraction.controls.map_type !== null) {
				this.mapstraction.controls.map_type.addBaseLayer(this.proprietary_tilemap, this.properties.options.label);
			}
		}
	},
	
	removeControl: function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': A BaseMap must be added to the map before calling removeControl()');
		}

		if (this.mapstraction.customBaseMaps[this.index].inControl) {
			this.mapstraction.customBaseMaps[this.index].inControl = false;
			delete this.mapstraction.layers[this.properties.options.label];
			if (this.mapstraction.controls.map_type !== null) {
				this.mapstraction.controls.map_type.removeLayer(this.proprietary_tilemap);
			}
		}
	},
	
	toProprietary: function() {
		var options = {
			minZoom: this.properties.options.minZoom,
			maxZoom: this.properties.options.maxZoom,
			name: this.properties.options.label,
			attribution: this.properties.options.attribution,
			opacity: this.properties.opacity
		};
		
		if (this.properties.options.subdomains !== null) {
			options.subdomains = this.properties.options.subdomains;
		}

		return new L.TileLayer(mxn.util.sanitizeTileURL(this.properties.url), options);
	}
},

OverlayMap: {
	hide: function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': An OverlayMap must be added to the map before calling hide()');
		}

		if (this.mapstraction.overlayMaps[this.index].visible) {
			this.mapstraction.overlayMaps[this.index].visible = false;
			if (this.map.hasLayer(this.proprietary_tilemap)) {
				this.map.removeLayer(this.proprietary_tilemap);
			}
		}
	},
	
	show: function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': An OverlayMap must be added to the map before calling show()');
		}
		
		if (!this.mapstraction.overlayMaps[this.index].visible) {
			this.mapstraction.overlayMaps[this.index].visible = true;

			if (this.map.hasLayer(this.proprietary_tilemap)) {
				this.proprietary_tilemap.bringToFront();
			}
			else {
				this.map.addLayer(this.proprietary_tilemap, false);
			}
		}
	},
	
	toProprietary: function() {
		var options = {
			minZoom: this.properties.options.minZoom,
			maxZoom: this.properties.options.maxZoom,
			name: this.properties.options.label,
			attribution: this.properties.options.attribution,
			opacity: this.properties.opacity,
			zIndex: this.index
		};
		
		if (this.properties.options.subdomains !== null) {
			options.subdomains = this.properties.options.subdomains;
		}

		return new L.TileLayer(mxn.util.sanitizeTileURL(this.properties.url), options);
	}
}

});

