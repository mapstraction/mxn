mxn.register('leafletv0', {

Mapstraction: {
	
	init: function(element, api, properties) {
		if (typeof L.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		var self = this;
		this.layers = {};
		this.overlays = {};
		this.features = [];
		this.currentMap = {};
		this.currentMap.type = mxn.Mapstraction.ROAD;
		this.controls =  {
			pan: null,
			zoom: null,
			overview: null,
			scale: null,
			map_type: null
		};

		this.defaultBaseMaps = [
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
		this.initBaseMaps();

		for (var i=0; i<this.customBaseMaps.length; i++) {
		    this.layers[this.customBaseMaps[i].label] = this.customBaseMaps[i].tileMap.prop_tilemap;
		    if (this.customBaseMaps[i].label == this.currentMap.type) {
		        this.currentMap.baselayer = this.customBaseMaps[i];
		    }
		}
		
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

		var hasOptions = (typeof properties !== 'undefined' && properties !== null);
		if (hasOptions) {
            //TODO change this to call our setcentre method instead?
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
			
			if (properties.hasOwnProperty('map_type') && null !== properties.map_type) {
				this.currentMap.type = properties.map_type;
			}
			
			var defaultMap = this.getDefaultBaseMap(this.currentMap.type);
		    if (defaultMap !== null)
		    {
		        this.currentMap.baselayer = this.getCustomBaseMap(defaultMap.providerType);
		        options.layers = [this.currentMap.baselayer.tileMap.prop_tilemap];
		    }

            //These will be standard in every init
		    if (properties.hasOwnProperty('zoom')) {
		        options.zoom = properties.zoom;
		    }

			if (properties.hasOwnProperty('dragging')) {
				options.dragging = properties.dragging;
			}
			
			if (properties.hasOwnProperty('scroll_wheel')) {
				options.scrollWheelZoom = properties.scroll_wheel;
			}
			
			if (properties.hasOwnProperty('double_click')) {
				options.doubleClickZoom = properties.double_click;
			}

		}

		var map = this.maps[api] = new L.Map(element.id, options);

		if (hasOptions && properties.hasOwnProperty('controls') && null !== properties.controls) {
		    self.addControls(properties.controls);
		}

		map.addEventListener('moveend', function(){
			self.endPan.fire();
		}); 
		map.on("click", function(e) {
			self.click.fire({'location': new mxn.LatLonPoint(e.latlng.lat, e.latlng.lng)});
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
			self.load.fire();
		});
		map.on('zoomend', function(e) {
			self.changeZoom.fire();
		});
		
		var layerHandler = function(e) {

		    var currmap = {};
			for (var c=0; c<self.customBaseMaps.length; c++) {
				if (e.type === 'baselayerchange' && self.customBaseMaps[c].label === e.name) {
				    currmap.map = self.customBaseMaps[c];
				    currmap.type = currmap.map.name;
					break;
				}
				
				else {
					if (e.type === 'layeradd' && self.customBaseMaps[c].tileMap.prop_tilemap == e.layer) {
					    currmap.map = self.customBaseMaps[c];
					    currmap.type = currmap.map.name;
						break;
					}
				}
			}
			
			for (var d=0; d<self.defaultBaseMaps.length; d++) {
				if (self.defaultBaseMaps[d].providerType === e.layerName) {
				    currmap.map = self.defaultBaseMaps[d];
				    currmap.type = currmap.mxnType;
				}
			}
			
			self.currentMap = currmap;
		};
		
		map.on('baselayerchange', layerHandler);
		map.on('layeradd', layerHandler);
		
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

	addSmallControls: function() {
		var map = this.maps[this.api];
		
		if (this.controls.zoom === null) {
			this.controls.zoom = new L.Control.Zoom();
			map.addControl(this.controls.zoom);
		}
	},

	removeSmallControls: function() {
	    var map = this.maps[this.api];
    	if (this.controls.zoom !== null) {
	        map.removeControl(this.controls.zoom);
            this.controls.zoom = null;
        }
	},

	addLargeControls: function() {
	    var map = this.maps[this.api];
		
        //Use zoomslider plugin if it is loaded
	    if (this.controls.zoom === null) {
	        this.controls.zoom =  L.Control.Zoomslider ? new L.Control.Zoomslider() : new L.Control.Zoom();
	        map.addControl(this.controls.zoom);
	    }
    },

	removeLargeControls: function () {
	    this.removeSmallControls();
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];

		if (this.controls.map_type === null) {
		    this.controls.map_type = new L.Control.Layers(this.layers, this.overlays, {
		    autoZIndex: false
		});
			map.addControl(this.controls.map_type);
		}
	},

	removeMapTypeControls: function() {
        if (this.controls.map_type !== null) {
            map.removeControl(this.controls.map_type);
            this.controls.map_type = null;
	    }
    },

	addScaleControls: function () {
	    var map = this.maps[this.api];

	    if (this.controls.scale === null) {
	        this.controls.scale = new L.Control.Scale();
	        map.addControl(this.controls.scale);
	    }
    },

	removeScaleControls: function () {
	    var map = this.maps[this.api];

	    if (this.controls.scale !== null) {
	        map.removeControl(this.controls.scale);
	        this.controls.scale = null;
	    }
	},

	addPanControls: function() {
	    var map = this.maps[this.api];

	    if (this.controls.pan === null && L.Control.Pan) {
	        this.controls.pan = new L.Control.Pan();
	        map.addControl(this.controls.pan);
	    }
	},
    
	removePanControls: function() {
	    var map = this.maps[this.api];

	    if (this.controls.pan !== null) {
	        map.removeControl(this.controls.pan);
	        this.controls.pan = null;
	    }
	},

	addOverviewControls: function (zoomOffset) {
	    var map = this.maps[this.api];

	    if (this.controls.overview === null && L.Control.MiniMap) {
	        //TODO: move this check back into mxn for all providers
	        if (zoomOffset === null) {
	            zoomOffset = 5;
	        }

	        // Code Health Warning
	        //
	        // Hack to fix L.Control.MiniMap when working with L.Control.Pan
	        // and L.Control.Zoomslider
	        // See https://github.com/Norkart/Leaflet-MiniMap/issues/11

	        L.Map.mergeOptions({
	            panControl: false,
	            zoomsliderControl: false
	        });

	        var bmOptions = this.currentMap.baselayer.tileMap.properties.options;

            //Keep the layer within its zoom bounds by overriding the zoomOffset if necessary
	        if (zoomOffset > bmOptions.maxZoom - bmOptions.minZoom) {
	            zoomOffset = bmOptions.maxZoom - bmOptions.minZoom;
	        }

	        var minimap_opts = {
	            minZoom: bmOptions.minZoom,
	            maxZoom: bmOptions.maxZoom - zoomOffset
	        };

	        if (bmOptions.subdomains) {
	            minimap_opts.subdomains = bmOptions.subdomains;
	        }

	        var minimap_layer = new L.TileLayer(mxn.util.sanitizeTileURL(this.currentMap.baselayer.tileMap.properties.url), minimap_opts);
	        this.controls.overview = new L.Control.MiniMap(minimap_layer, {
	            toggleDisplay: true,
	            zoomLevelOffset: -zoomOffset
	        });

	        map.addControl(this.controls.overview);
	    }
	},
    
	removeOverviewControls: function () {
	    var map = this.maps[this.api];
	    if (this.controls.overview !== null) {
	        map.removeControl(this.controls.overview);
	        this.controls.overview = null;
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
		var baselayer = null;
		
		if (this.currentMap.type === mapType) {
			return;
		}
		
		for (i=0; i<this.defaultBaseMaps.length; i++) {
			if (this.defaultBaseMaps[i].mxnType === mapType) {
			    name = this.defaultBaseMaps[i].providerType;
			    baselayer = this.defaultBaseMaps[i];
				break;
			}
		}
		
		if (name === null) {
			name = mapType;
		}

		var layers = [];
		var map = this.maps[this.api];
		var foundMapType = false;
		
		for (i=0; i<this.customBaseMaps.length; i++) {
			if (this.customBaseMaps[i].name === name) {
			    map.addLayer(this.customBaseMaps[i].tileMap.prop_tilemap, true);
			    baselayer = this.customBaseMaps[i];
				foundMapType = true;
			}
			
			else if (map.hasLayer(this.customBaseMaps[i].tileMap.prop_tilemap)) {
			    baselayer = this.customBaseMaps[i];
				layers.push(this.customBaseMaps[i].tileMap.prop_tilemap);
			}
		}

		if (foundMapType) {
		    this.currentMap.type = mapType;
		    this.currentMap.baselayer = baselayer;
			for (i=0; i<layers.length; i++) {
				map.removeLayer(layers[i]);
			}
		    //TODO: If the Minimap is shown then remove and readd it to change the basemap in that too
			if (this.controls.overview) {
			    var zoomOffset = -this.controls.overview.options.zoomLevelOffset;
			    this.removeOverviewControls();
			    this.addOverviewControls(zoomOffset);
			}

		}
		
		else {
			throw new Error(this.api + ': unable to find definition for map type ' + mapType);
		}
	},

	getMapType: function() {
		return this.currentMap.type;
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

	addTileMap: function(tileMap) {
		return tileMap.toProprietary(this.api);
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
		var self = this;
		var thisIcon = null;
		var iconObj = null;
		
		if (self.htmlContent) {
			var options = {};
			options.html = self.htmlContent;
			options.className =  ''; //to override the default white square class
			
			if (self.iconAnchor) {
				options.iconAnchor = new L.Point(self.iconAnchor[0], self.iconAnchor[1]);
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
			if (self.iconUrl) {
				thisIcon = thisIcon.extend({
					options: {
						iconUrl: self.iconUrl
					}
				});
			}
			if (self.iconSize) {
				thisIcon = thisIcon.extend({
					options: {
						iconSize: new L.Point(self.iconSize[0], self.iconSize[1])
					}
				});
			}
			if (self.iconAnchor) {
				thisIcon = thisIcon.extend({
					options: {
						iconAnchor: new L.Point(self.iconAnchor[0], self.iconAnchor[1])
					}
				});
			}
			if (self.iconShadowUrl) {
				thisIcon = thisIcon.extend({
					options: {
						shadowUrl: self.iconShadowUrl
					}
				});
			}
			if (self.iconShadowSize) {
				thisIcon = thisIcon.extend({
					options: {
						shadowSize: new L.Point(self.iconShadowSize[0], self.iconShadowSize[1])
					}
				});
			}
			iconObj = new thisIcon();
		}
		
		var marker = new L.Marker(
			this.location.toProprietary(this.api),
			{ icon: iconObj }
		);
		(function(self, marker) {
			marker.on("click", function (e) {
				self.click.fire();
			});
		})(self, marker);
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

TileMap: {
	addToMapTypeControl: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling addToMapTypeControl()');
		}

		var tileCache = null;
		var propCache = null;
		switch (this.properties.type) {
			case mxn.Mapstraction.TileType.BASE:
				tileCache = this.mxn.customBaseMaps;
				propCache = this.mxn.layers;
				break;
			case mxn.Mapstraction.TileType.OVERLAY:
				tileCache = this.mxn.overlayMaps;
				propCache = this.mxn.overlays;
				break;
			case mxn.Mapstraction.TileType.UNKNOWN:
				throw new Error('Invalid tile type supplied');
			default:
				throw new Error('Invalid tile type supplied');
		}

		if (!tileCache[this.index].inControl) {
			tileCache[this.index].inControl = true;
			propCache[this.properties.options.label] = this.prop_tilemap;
			if (this.mxn.controls.map_type !== null) {
				if (this.properties.type === mxn.Mapstraction.TileType.BASE) {
				    this.mxn.controls.map_type.addBaseLayer(this.prop_tilemap, this.properties.options.label);
				}
				else {
					this.mxn.controls.map_type.addOverlay(this.prop_tilemap, this.properties.options.label);
				}
			}
		}
	},
	
	hide: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling hide()');
		}

		if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
			var tileCache = this.mxn.overlayMaps;
			
			if (tileCache[this.index].visible) {
				tileCache[this.index].visible = false;
				if (this.map.hasLayer(this.prop_tilemap)) {
					this.map.removeLayer(this.prop_tilemap);
				}
			}
		}
	},
	
	removeFromMapTypeControl: function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling removeFromMapTypeControl()');
		}

		var tileCache = null;
		var propCache = null;
		switch (this.properties.type) {
			case mxn.Mapstraction.TileType.BASE:
				tileCache = this.customBaseMaps;
				propCache = this.mxn.layers;
				break;
			case mxn.Mapstraction.TileType.OVERLAY:
				tileCache = this.overlayMaps;
				propCache = this.mxn.overlays;
				break;
			case mxn.Mapstraction.TileType.UNKNOWN:
				throw new Error('Invalid tile type supplied');
			default:
				throw new Error('Invalid tile type supplied');
		}

		if (tileCache[this.index].inControl) {
			tileCache[this.index].inControl = false;
			delete propCache[this.properties.options.label];
			if (this.mapstraction.controls.map_type !== null) {
				this.mapstraction.controls.map_type.removeLayer(this.proprietary_tilemap);
			}
		}
	},
	
	show: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling show()');
		}
		
		if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
			var tileCache = this.mxn.overlayMaps;

			if (!tileCache[this.index].visible) {
				tileCache[this.index].visible = true;

				if (this.map.hasLayer(this.prop_tilemap)) {
					this.prop_tilemap.bringToFront();
				}
				else {
					this.map.addLayer(this.prop_tilemap, false);
				}
			}
		}
	},
	
	toProprietary: function() {
		var options = {
			minZoom: this.properties.options.minZoom,
			maxZoom: this.properties.options.maxZoom,
			name: this.properties.options.label,
			attribution: this.properties.options.attribution,
			opacity: this.properties.options.opacity,
			zIndex: this.index
		};
		
		if (this.properties.options.subdomains !== null) {
			options.subdomains = this.properties.options.subdomains;
		}

		return new L.TileLayer(mxn.util.sanitizeTileURL(this.properties.url), options);
	}
}
});