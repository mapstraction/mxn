mxn.register('yandexv2', {

Mapstraction: {

	init: function(element, api, properties) {
		var self = this;
		
		if (typeof ymaps === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		self.defaultBaseMaps = [
			{
				mxnType: mxn.Mapstraction.ROAD,
				providerType: 'yandex#map',
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.SATELLITE,
				providerType: 'yandex#satellite',
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.HYBRID,
				providerType: 'yandex#hybrid',
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.PHYSICAL,
				providerType: 'yandex#map',
				nativeType: true
			}
		];
		self.initBaseMaps();

		self.loaded[api] = false;
		ymaps.ready(function() {

			self.controls =  {
				pan: null,
				zoom: null,
				overview: null,
				scale: null,
				map_type: null
			};

			var state = {
				type: 'yandex#map',
				center: [51.50848, -0.12532],
				zoom: 8
			};

			if (typeof properties !== 'undefined' && properties !== null) {
				if (properties.hasOwnProperty('controls')) {
					var controls = properties.controls;

					if ('pan' in controls && controls.pan) {
						self.controls.pan = new ymaps.control.MapTools();
					}

					if ('zoom' in controls) {
						if (controls.zoom === 'small') {
							self.controls.zoom = new ymaps.control.SmallZoomControl();
						}

						else if (controls.zoom === 'large') {
							self.controls.zoom = new ymaps.control.ZoomControl();
						}
					}

					if ('overview' in controls && controls.overview) {
						self.controls.overview = new ymaps.control.MiniMap({
							type: 'yandex#map'
						});
					}

					if ('scale' in controls && controls.scale) {
						self.controls.scale = new ymaps.control.ScaleLine();
					}

					if ('map_type' in controls && controls.map_type) {
						self.controls.map_type = new ymaps.control.TypeSelector();
					}
				}

				if (properties.hasOwnProperty('center') && null !== properties.center) {
					var point;

					if (Object.prototype.toString.call(properties.center) === '[object Array]') {
						point = new mxn.LatLonPoint(properties.center[0], properties.center[1]);
					}
					else {
						point = properties.center;
					}
					state.center = point.toProprietary(self.api);
				}

				if (properties.hasOwnProperty('zoom') && null !== properties.zoom) {
					state.zoom = properties.zoom;
				}

				if (properties.hasOwnProperty('map_type') && null !== properties.map_type) {
					for (i=0; i<self.defaultBaseMaps.length; i++) {
						if (self.defaultBaseMaps[i].mxnType === properties.map_type) {
							state.type = self.defaultBaseMaps[i].providerType;
							break;
						}
					}
				}

				var behaviors = [];
				if (properties.hasOwnProperty('dragging')) {
					behaviors.push('drag');
				}

				if (properties.hasOwnProperty('scroll_wheel')) {
					behaviors.push('scrollZoom');
				}

				if (properties.hasOwnProperty('double_click')) {
					behaviors.push('dblClickZoom');
				}
				if (behaviors.length > 0) {
					state.behaviors = behaviors;
				}
			}

			var map = new ymaps.Map(element, state);
			
			for (var control in self.controls) {
				if (self.controls[control] !== null) {
					map.controls.add(self.controls[control]);
				}
			}

			map.events.add('click', function(e) {
				var coords = e.get('coordPosition');
				self.click.fire({
					location: new mxn.LatLonPoint(coords[0], coords[1])
				});
			});
						
			map.events.add('boundschange', function(e) {
				if (e.get('newZoom') != e.get('oldZoom')) {
					self.changeZoom.fire();
				}
				
				else {
					self.endPan.fire();
				}
			});

			self.maps[api] = map;
			self.loaded[api] = true;
			
			//doing the load.fire directly it runs too fast and we dont get a chance to register the handler in the core tests, so had to add a delay.
			setTimeout(function(){self.load.fire();},50);
		});
	},
	
	getVersion: function() {
		return '2.2';
	},
	
	applyOptions: function(){
		var map = this.maps[this.api];
		
		if (typeof map != 'undefined')
		{
			if(this.options.enableScrollWheelZoom){
				map.behaviors.enable('scrollZoom');
			}
			
			if (this.options.enableDragging) {
				map.behaviors.enable('drag');
			} else {
				map.behaviors.disable('drag');
			}
		}
	},

	resizeTo: function(width, height){
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		this.maps[this.api].container.fitToViewport();
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
		
		if ('pan' in args && args.pan) {
			this.controls.pan = new ymaps.control.MapTools();
			map.controls.add(this.controls.pan);
		}
		
		else {
			if (this.controls.pan !== null) {
				map.controls.remove(this.controls.pan);
				this.controls.pan = null;
			}
		}

		if ('zoom' in args) {
			if (args.zoom === true || args.zoom == 'small') {
				this.addSmallControls();
			}
			
			else if (args.zoom == 'large') {
				this.addLargeControls();
			}
		}
		
		else {
			if (this.controls.zoom !== null) {
				map.controls.remove(this.controls.zoom);
				this.controls.zoom = null;
			}
		}
		
		if ('overview' in args && args.overview) {
			if (this.controls.overview === null) {
				this.controls.overview = new ymaps.control.MiniMap({
                    type: 'yandex#map'
                });
				map.controls.add(this.controls.overview);
			}
		}
		
		else {
			if (this.controls.overview !== null) {
				map.controls.remove(this.controls.overview);
				this.controls.overview = null;
			}
		}
		
		if ('scale' in args && args.scale) {
			if (this.controls.scale === null) {
				this.controls.scale = new ymaps.control.ScaleLine();
				map.controls.add(this.controls.scale);
			}
		}
		
		else {
			if (this.controls.scale !== null) {
				map.controls.remove(this.controls.scale);
				this.controls.scale = null;
			}
		}
		
		if ('map_type' in args && args.map_type) {
			this.addMapTypeControls();
		}
		
		else {
			if (this.controls.map_type !== null) {
				map.controls.remove(this.controls.map_type);
				this.controls.map_type = null;
			}
		}
	},

	addSmallControls: function() {
		var map = this.maps[this.api];
		
		if (this.controls.zoom !== null) {
			map.controls.remove(this.controls.zoom);
		}
		
		this.controls.zoom = new ymaps.control.SmallZoomControl();
		map.controls.add(this.controls.zoom);
	},

	addLargeControls: function() {
		var map = this.maps[this.api];
		
		if (this.controls.zoom !== null) {
			map.controls.remove(this.controls.zoom);
		}
		
		this.controls.zoom = new ymaps.control.ZoomControl();
		map.controls.add(this.controls.zoom);
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];
		
		if (this.controls.map_type === null) {
			this.controls.map_type = new ymaps.control.TypeSelector();
			map.controls.add(this.controls.map_type);
		}
	},

	setCenterAndZoom: function(point, zoom) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);

		map.setCenter(pt, zoom);
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
		
		map.geoObjects.add(pin);
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		map.geoObjects.remove(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var pl = polyline.toProprietary(this.api);
		map.geoObjects.add(pl);
		return pl;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		map.geoObjects.remove(polyline.proprietary_polyline);
	},
	
	getCenter: function() {
		var map = this.maps[this.api];
		var pt = map.getCenter();
		var point = new mxn.LatLonPoint(pt[0],pt[1]);
		return point;
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setCenter(pt);
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
		// NE and SW points from the bounding box.
		var ne = bbox.getNorthEast().toProprietary(this.api);
		var sw = bbox.getSouthWest().toProprietary(this.api);
		var zoom = new ymaps.GeoBounds(ne, sw).getMapZoom(map);
		
		return zoom;
	},

	setMapType: function(mapType) {
		var map = this.maps[this.api];
		var currType = map.getType();
		var i;

		if (currType == mapType) {
			return;
		}

		for (i=0; i<this.defaultBaseMaps.length; i++) {
			if (this.defaultBaseMaps[i].mxnType === mapType) {
				map.setType(this.defaultBaseMaps[i].providerType);
				return;
			}
		}

		for (i=0; i<this.customBaseMaps.length; i++) {
			if (this.customBaseMaps[i].name === mapType) {
				map.setType(this.customBaseMaps[i].name);
				return;
			}
		}

		throw new Error(this.api + ': unable to find definition for map type ' + mapType);
	},

	getMapType: function() {
		var map = this.maps[this.api];
		switch(map.getType()) {
			case 'yandex#map':
				return mxn.Mapstraction.ROAD;
			case 'yandex#satellite':
				return mxn.Mapstraction.SATELLITE;
			case 'yandex#hybrid':
				return mxn.Mapstraction.HYBRID;
			default:
				return map.getType();
		}	
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var gbox = map.getBounds();
		var lb = gbox[0];
		var rt = gbox[1];
		return new mxn.BoundingBox(lb[0], lb[1], rt[0], rt[1]);
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
		
		map.setBounds([[sw.lat, sw.lon], [ne.lat, ne.lon]]);
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
		var mxnMap = this;
		
		// ymaps.IOverlay interface implementation.
		// http://api.yandex.ru/maps/jsapi/doc/ref/reference/ioverlay.xml
		var YImageOverlay = function (imgElm) {
			var ymap;
			this.onAddToMap = function (pMap, parentContainer) {
				ymap = parentContainer;
				ymap.appendChild(imgElm);
				this.onMapUpdate();
			};
			this.onRemoveFromMap = function () {
				if (ymap) {
					ymap.removeChild(imgElm);
				}
			};
			this.onMapUpdate = function () {
				mxnMap.setImagePosition(id);
			};
		};
		
		var overlay = new YImageOverlay(oContext.imgElm);
		map.addOverlay(overlay);
		this.setImageOpacity(id, opacity);
		this.setImagePosition(id);
	},

	setImagePosition: function(id, oContext) {
		var map = this.maps[this.api];

		var topLeftGeoPoint = new ymaps.geometry.Point(oContext.latLng.left, oContext.latLng.top);
		var bottomRightGeoPoint = new ymaps.geometry.Point(oContext.latLng.right, oContext.latLng.bottom);
		var topLeftPoint = map.converter.coordinatesToMapPixels(topLeftGeoPoint);
		var bottomRightPoint = map.converter.coordinatesToMapPixels(bottomRightGeoPoint);
		oContext.pixels.top = topLeftPoint.y;
		oContext.pixels.left = topLeftPoint.x;
		oContext.pixels.bottom = bottomRightPoint.y;
		oContext.pixels.right = bottomRightPoint.x;
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];
		var kml = new ymaps.KML(url);
		
		map.addOverlay(kml);
	},
	
	addTileMap: function(tileMap) {
		var prop_tilemap = tileMap.toProprietary(this.api);

		if (tileMap.properties.type === mxn.Mapstraction.TileType.BASE) {
			ymaps.layer.storage.add(tileMap.properties.name, function() {
				return prop_tilemap;
			});
			var mapType = new ymaps.MapType(tileMap.properties.options.label, [tileMap.properties.name]);
			ymaps.mapType.storage.add(tileMap.properties.name, mapType);
		}

		return prop_tilemap;
	},

	getPixelRatio: function() {
		throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
	},
	
	mousePosition: function(element) {
		var locDisp = document.getElementById(element);
		if (locDisp !== null) {
			var map = this.maps[this.api];
			/*
			ymaps.Events.observe(map, map.Events.MouseMove, function(map, mouseEvent) {
				var geoPoint = mouseEvent.getGeoPoint();
				var loc = geoPoint.getY().toFixed(4) + ' / ' + geoPoint.getX().toFixed(4);
				locDisp.innerHTML = loc;
			}); */
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return [this.lat, this.lon];
	},

	fromProprietary: function(yandexPoint) {
		this.lat = yandexPoint[0];
		this.lon = yandexPoint[1];
		return this;
	}
	
},

Marker: {
	
	toProprietary: function() {
		var properties = {
		};

		var options = {
			draggable: this.draggable
		};

		if (this.labelText) {
			properties.iconContent = this.labelText;
			if (properties.iconContent.length > 1) {
				options.preset = 'twirl#blueStretchyIcon';
			}
		}

		if (this.iconUrl) {
			if (this.iconUrl[0] === '#') {
				// See http://api.yandex.ru/maps/doc/jsapi/2.x/ref/reference/option.presetStorage.xml for all the predefined icons
				options.preset = 'twirl' + this.iconUrl;
			} else {
				options.iconImageHref = this.iconUrl;
			}
		}
		if (this.iconSize) {
			options.iconImageSize = [this.iconSize[0], this.iconSize[1]];
		}
		if (this.iconShadowUrl) {
			options.iconShadowImageHref = this.iconShadowUrl;
		}
		if (this.iconShadowSize) {
			options.iconShadowImageSize = [this.iconShadowSize[0], this.iconShadowSize[1]];
		}
		if (this.iconAnchor) {
			options.iconOffset = [this.iconAnchor[0], this.iconAnchor[1]];
		}

		var ymarker = new ymaps.Placemark(this.location.toProprietary(this.api), properties, options);
		
		
		if (this.hoverIconUrl) {
			var self = this;
			
			ymarker.events.add('mouseenter', function(e) {
				if (!self.iconUrl) {
					// that dirtyhack saves default icon url
					self.iconUrl = ymarker._icon._context._computedStyle.iconStyle.href;
				}

				ymarker.options.iconImageHref = self.hoverIconUrl;
			});
			
			ymarker.events.add('mouseleave', function(e) {
				ymarker.options.iconImageHref = self.iconUrl;
			});
		}
				
		return ymarker;
	},

	openBubble: function() {
		this.proprietary_marker.properties.set({
			balloonContentHeader: this.labelText || '',
			//balloonContentFooter: 'footer',
			balloonContentBody: this.infoBubble
		});
		
		this.proprietary_marker.balloon.open();
		this.openInfoBubble.fire({'marker': this});
	},
	
	closeBubble: function() {
		this.proprietary_marker.balloon.close();
		this.closeInfoBubble.fire({'marker': this});
	},
	
	hide: function() {
		this.proprietary_marker.options.set({
			visible: false
		});
	},

	show: function() {
		this.proprietary_marker.options.set({
			visible: true
		});
	},

	update: function() {
		point = new mxn.LatLonPoint();
		point.fromProprietary(this.api, this.proprietary_marker.getGeoPoint());
		this.location = point;
	}
},

Polyline: {

	toProprietary: function() {
		var ypoints = [];
		
		for (var i = 0,  length = this.points.length ; i< length; i++){
			ypoints.push(this.points[i].toProprietary(this.api));
		}
		
		var options = {
			strokeColor: this.color,
			strokeWidth: this.width,
			opacity: this.opacity
		};
		
		if (this.closed	|| ypoints[0] == (ypoints[length-1])) {
			if (this.fillColor) {
				options.fillColor = this.fillColor;
			}

			return new ymaps.Polygon([ypoints], {}, options);
		} 
		else {
			return new ymaps.Polyline(ypoints, {}, options);
		}
	},
	
	hide: function() {
		this.proprietary_polyline.options.set({
			visible: false
		});	
	},

	show: function() {
		this.proprietary_polyline.options.set({
			visible: true
		});	
	}
},

TileMap: {
	addToMapTypeControl: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling addToMapTypeControl()');
		}

		if (this.properties.type === mxn.Mapstraction.TileType.BASE) {
			this.mxn.controls.map_type.addMapType(this.properties.name);
		}		
	},
	
	hide: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling hide()');
		}

		if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
			var tileCache = this.mxn.overlayMaps;
			
			if (tileCache[this.index].visible) {
				this.map.layers.remove(this.prop_tilemap);
				tileCache[this.index].visible = false;

				this.tileMapHidden.fire({
					'tileMap': this
				});
			}
		}
	},
	
	removeFromMapTypeControl: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling removeFromMapTypeControl()');
		}

		if (this.properties.type === mxn.Mapstraction.TileType.BASE) {
			this.mxn.controls.map_type.removeMapType(this.properties.name);
		}		
	},
	
	show: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling show()');
		}
		
		if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
			var tileCache = this.mxn.overlayMaps;

			if (!tileCache[this.index].visible) {
				this.map.layers.add(this.prop_tilemap);
				tileCache[this.index].visible = true;
			
				this.tileMapShown.fire({
					'tileMap': this
				});
			}
		}
	},
	
	toProprietary: function() {
		var self = this;
		var url = mxn.util.sanitizeTileURL(this.properties.url);

		if (typeof this.properties.options.subdomains !== 'undefined') {
			url = mxn.util.getSubdomainTileURL(url, this.properties.options.subdomains);
		}
		url = url.replace(/\{X\}/gi, '%x');
		url = url.replace(/\{Y\}/gi, '%y');
		url = url.replace(/\{Z\}/gi, '%z');

		var prop_tilemap = new ymaps.Layer(url);
		
		// ymaps.Layer inherits from ymaps.ILayer, which defines three optional methods
		// that we can override ...
		// getBrightness() - the opacity of the layer; at least I think that's what it does -
		// you never can tell with Google Translate going from Russian to English!
		// getCopyrights() - the attribution of the layer
		// getZoomRange() - the min/max zoom levels of the layer
		
		prop_tilemap.getBrightness = function() {
			return self.properties.options.opacity;
		};
		
		prop_tilemap.getCopyrights = function(coords, zoom) {
			var p = new ymaps.util.Promise();
			p.resolve(self.properties.options.attribution);
			return p;
		};
		
		prop_tilemap.getZoomRange = function(point) {
			var p = new ymaps.util.Promise();
			p.resolve([self.properties.options.minZoom, self.properties.options.maxZoom]);
			return p;
		};
		
		return prop_tilemap;
	}
}

});
