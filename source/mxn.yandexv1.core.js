mxn.register('yandexv1', {

Mapstraction: {

	init: function(element, api, properties) {
		var me = this;

		if (typeof YMaps.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		me.defaultBaseMaps = [
			{
				mxnType: mxn.Mapstraction.ROAD,
				providerType: YMaps.MapType.MAP,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.SATELLITE,
				providerType: YMaps.MapType.SATELLITE,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.HYBRID,
				providerType: YMaps.MapType.HYBRID,
				nativeType: true
			},
			{
				mxnType: mxn.Mapstraction.PHYSICAL,
				providerType:  YMaps.MapType.MAP,
				nativeType: true
			}
		];
		me.initBaseMaps();

		var yandexMap = this.maps[api] = new YMaps.Map(element);

		var hasOptions = (typeof properties !== 'undefined' && properties !== null);
		if (hasOptions && properties.hasOwnProperty('controls') && null !== properties.controls) {
			me.addControls(properties.controls); //map hasnt inited by this time
		}

		YMaps.Events.observe(yandexMap, yandexMap.Events.Click, function(map, mouseEvent) {
			var lat = mouseEvent.getCoordPoint().getX();
			var lon = mouseEvent.getCoordPoint().getY();
			me.click.fire({'location': new mxn.LatLonPoint(lat, lon)});
		});

		YMaps.Events.observe(yandexMap, yandexMap.Events.BoundsChange, function(map, scaling) {
			me.changeZoom.fire();
		});

		YMaps.Events.observe(yandexMap, yandexMap.Events.ZoomRangeChange, function(map, scaling) {
			me.changeZoom.fire();
		});

		YMaps.Events.observe(yandexMap, yandexMap.Events.Update, function(map) {
			me.endPan.fire();
		});

		this.loaded[api] = true;
		setTimeout(function () { me.load.fire(); }, 50);
	},
	
	getVersion: function() {
		return '1.1';
	},
	
	enableScrollWheelZoom: function () {
		this.maps[this.api].enableScrollZoom(true);
	},

	disableScrollWheelZoom: function () {
		this.maps[this.api].enableScrollZoom(false);
	},

	enableDragging: function () {
		this.maps[this.api].enableDragging();
	},

	disableDragging: function () {
		this.maps[this.api].disableDragging();
	},

	enableDoubleClickZoom: function () {
		//TODO this.maps[this.api].enableDoubleClickZoom();
	},

	disableDoubleClickZoom: function () {
		//TODO this.maps[this.api].disableDoubleClickZoom();
	},

	resizeTo: function (width, height) {
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		// YMaps do not has something like checkResize() notifer;
		// if container been resized so map must be redrawn
		this.maps[this.api].redraw();
	},

	addControl: function (control) {
		var map = this.maps[this.api];
		if (control !== null && typeof (control) !== "undefined") {
			map.addControl(control);
		}
		return control;
	},

	removeControl: function (control) {
		var map = this.maps[this.api];
		if (control !== null && typeof (control) !== "undefined") {
			map.removeControl(control);
		}
	},

	addSmallControls: function() {
		this.controls.zoom = this.addControls(new YMaps.SmallZoom());
	},

	removeSmallControls: function () {
		this.removeControl(this.controls.zoom);
	},

	addLargeControls: function() {
		this.controls.zoom = this.addControls(new YMaps.Zoom());
	},

	removeLargeControls: function () {
		this.removeControl(this.controls.zoom);
	},

	addMapTypeControls: function () {
		this.controls.map_type = this.addControl(new YMaps.TypeControl());
	},

	removeMapTypeControls: function () {
		this.removeControl(this.controls.map_type);
	},

	addScaleControls: function () {
		this.controls.scale = this.addControl(new YMaps.ScaleLine());
	},

	removeScaleControls: function () {
		this.removeControl(this.controls.scale);
	},

	addPanControls: function () {
		this.controls.pan = this.addControl(new YMaps.ToolBar());
	},

	removePanControls: function () {
		this.removeControl(this.controls.pan);
	},

	addOverviewControls: function (zoomOffset) {
		this.controls.overview = this.addControl(new YMaps.MiniMap(zoomOffset));
	},

	removeOverviewControls: function () {
		this.removeControl(this.controls.overview);
	},

	setCenterAndZoom: function(point, zoom) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);

		map.setCenter(pt, zoom);
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
		
		map.addOverlay(pin);
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		map.removeOverlay(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var pl = polyline.toProprietary(this.api);
		map.addOverlay(pl);
		return pl;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		map.removeOverlay(polyline.proprietary_polyline);
	},
	
	getCenter: function() {
		var map = this.maps[this.api];
		var pt = map.getCenter();
		var point = new mxn.LatLonPoint(pt.getLat(),pt.getLng());
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
		var zoom = map.getZoom();
		
		return zoom;
	},

	getZoomLevelForBoundingBox: function(bbox) {
		var map = this.maps[this.api];
		// NE and SW points from the bounding box.
		var ne = bbox.getNorthEast().toProprietary(this.api);
		var sw = bbox.getSouthWest().toProprietary(this.api);
		var zoom = new YMaps.GeoBounds(ne, sw).getMapZoom(map);
		
		return zoom;
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		switch(type) {
			case mxn.Mapstraction.ROAD:
				map.setType(YMaps.MapType.MAP);
				break;
			case mxn.Mapstraction.SATELLITE:
				map.setType(YMaps.MapType.SATELLITE);
				break;
			case mxn.Mapstraction.HYBRID:
				map.setType(YMaps.MapType.HYBRID);
				break;
			default:
				map.setType(type || YMaps.MapType.MAP);
		}
	},

	getMapType: function() {
		var map = this.maps[this.api];
		var type = map.getType();
		switch(type) {
			case YMaps.MapType.MAP:
				return mxn.Mapstraction.ROAD;
			case YMaps.MapType.SATELLITE:
				return mxn.Mapstraction.SATELLITE;
			case YMaps.MapType.HYBRID:
				return mxn.Mapstraction.HYBRID;
			default:
				return null;
		}
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var gbox = map.getBounds();
		var lb = gbox.getLeftBottom();
		var rt = gbox.getRightTop();
		return new mxn.BoundingBox(lb.getLat(), lb.getLng(), rt.getLat(), rt.getLng());
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
		
		var leftBottom = new YMaps.GeoPoint(sw.lon, sw.lat);
		var rightTop = new YMaps.GeoPoint(ne.lon, ne.lat);
		var ybounds = new YMaps.GeoBounds(leftBottom, rightTop);
		map.setZoom(ybounds.getMapZoom(map));
		map.setCenter(ybounds.getCenter());
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
		var mxnMap = this;
		
		// YMaps.IOverlay interface implementation.
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

		var topLeftGeoPoint = new YMaps.GeoPoint(oContext.latLng.left, oContext.latLng.top);
		var bottomRightGeoPoint = new YMaps.GeoPoint(oContext.latLng.right, oContext.latLng.bottom);
		var topLeftPoint = map.converter.coordinatesToMapPixels(topLeftGeoPoint);
		var bottomRightPoint = map.converter.coordinatesToMapPixels(bottomRightGeoPoint);
		oContext.pixels.top = topLeftPoint.y;
		oContext.pixels.left = topLeftPoint.x;
		oContext.pixels.bottom = bottomRightPoint.y;
		oContext.pixels.right = bottomRightPoint.x;
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];
		var kml = new YMaps.KML(url);
		
		map.addOverlay(kml);
		
		YMaps.Events.observe(kml, kml.Events.Fault, function (kml, error) {
			throw new Error('Mapstraction.addOverlay. KML upload error: ' + error + ' for provider ' + this.api);
		});
	},

	addTileMap: function (tileMap) {
		//TODO copied from Y2
		/* var prop_tilemap = tileMap.toProprietary(this.api);

		if (tileMap.properties.type === mxn.Mapstraction.TileType.BASE) {
			ymaps.layer.storage.add(tileMap.properties.name, function () {
				return prop_tilemap;
			});
			var mapType = new ymaps.MapType(tileMap.properties.options.label, [tileMap.properties.name]);
			ymaps.mapType.storage.add(tileMap.properties.name, mapType);
		}

		return prop_tilemap; */
	},

	getPixelRatio: function() {
		throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
	},
	
	mousePosition: function(element) {
		var locDisp = document.getElementById(element);
		if (locDisp !== null) {
			var map = this.maps[this.api];
			YMaps.Events.observe(map, map.Events.MouseMove, function(map, mouseEvent) {
				var geoPoint = mouseEvent.getGeoPoint();
				var loc = geoPoint.getY().toFixed(4) + ' / ' + geoPoint.getX().toFixed(4);
				locDisp.innerHTML = loc;
			});
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return new YMaps.GeoPoint(this.lon, this.lat);
	},

	fromProprietary: function(yandexPoint) {
		this.lat = yandexPoint.getLat();
		this.lon = yandexPoint.getLng();
		return this;
	}
	
},

Marker: {
	
	toProprietary: function() {
		var options = {
			hideIcon: false,
			draggable: this.draggable
		};
		
		if (this.iconUrl) {
			var style = new YMaps.Style();
			var icon = style.iconStyle = new YMaps.IconStyle();

			icon.href = this.iconUrl;
			if (this.iconSize) {
				icon.size = new YMaps.Point(this.iconSize[0], this.iconSize[1]);
				var anchor;
				if (this.iconAnchor) {
					anchor = new YMaps.Point(this.iconAnchor[0], this.iconAnchor[1]);
				}
				else {
					anchor = new YMaps.Point(0, 0);
				}
				icon.offset = anchor;
			}
			
			if (this.iconShadowUrl) {
				icon.shadow = new YMaps.IconShadowStyle();
				icon.shadow.href = this.iconShadowUrl;
				if (this.iconShadowSize) {
					icon.shadow.size = new YMaps.Point(this.iconShadowSize[0], this.iconShadowSize[1]);
					icon.shadow.offset = new YMaps.Point(0, 0);
				}
			}
			
			options.style = style;
		}
		
		var ymarker = new YMaps.Placemark(this.location.toProprietary(this.api), options);
		
		if (this.hoverIconUrl) {
			var me = this;
			YMaps.Events.observe(ymarker, ymarker.Events.MouseEnter, function(map, mouseEvent) {
				var markerOptions = ymarker.getOptions();
				if (! me.iconUrl) {
					// that dirtyhack saves default icon url
					me.iconUrl = ymarker._icon._context._computedStyle.iconStyle.href;
					markerOptions.style = ymarker._icon._context._computedStyle;
				}
				markerOptions.style.iconStyle.href = me.hoverIconUrl;
				ymarker.setOptions(markerOptions);
			});
			YMaps.Events.observe(ymarker, ymarker.Events.MouseLeave, function(map, mouseEvent) {
				var markerOptions = ymarker.getOptions();
				markerOptions.style.iconStyle.href = me.iconUrl;
				ymarker.setOptions(markerOptions);
			});
		}

		if (this.labelText) {
			ymarker.name = this.labelText;
		}
		
		if (this.infoBubble) {
			ymarker.setBalloonContent(this.infoBubble);
		}
		
		YMaps.Events.observe(ymarker, ymarker.Events.DragEnd, function(ymarker) {
			var latLon = new mxn.LatLonPoint().fromProprietary(this.api, ymarker.getGeoPoint());
			this.mapstraction_marker.location = latLon;
			this.mapstraction_marker.dragend.fire(latLon);
		});
		
		return ymarker;
	},

	openBubble: function() {
		this.proprietary_marker.openBalloon();
		this.openInfoBubble.fire({'marker': this});
	},
	
	closeBubble: function() {
		this.proprietary_marker.closeBalloon();
		this.closeInfoBubble.fire( { 'marker': this } );
	},
	
	hide: function() {
		this.proprietary_marker._$iconContainer.addClass("YMaps-display-none");
	},

	show: function() {
		this.proprietary_marker._$iconContainer.removeClass("YMaps-display-none");
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
			style: {
				lineStyle: {
					strokeColor: this.color.replace('#',''),
					strokeWidth: this.width
				}
			}
		};
		
		if (this.closed	|| ypoints[0].equals(ypoints[length-1])) {
			options.style.polygonStyle = options.style.lineStyle;
			if (this.fillColor) {
				options.style.polygonStyle.fill = true;
				var alphaChanal = (Math.round((this.opacity||1)*255)).toString(16);
				options.style.polygonStyle.fillColor = this.fillColor.replace('#','') + alphaChanal;
			}
			return new YMaps.Polygon(ypoints, options);
		} 
		else {
			return new YMaps.Polyline(ypoints, options);
		}
	},
	
	hide: function() {
		this.proprietary_polyline._container._$container.addClass("YMaps-display-none");
	},

	show: function() {
		this.proprietary_polyline._container._$container.removeClass("YMaps-display-none");
	}
},
/*
addTileLayer: function (tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
	var map = this.maps[this.api];

	if (map_type) {
		var layerID = Math.round(Math.random() * Date.now()).toString(); // silly hash function
		YMaps.Layers.add(layerID, newLayer);
		var newType = new YMaps.MapType([layerID],
			attribution,
			{
				textColor: "#706f60",
				minZoom: min_zoom,
				maxZoom: max_zoom
			}
		);
		var tp;
		for (var controlName in map.__controls) {
			if (map.__controls[controlName] instanceof YMaps.TypeControl) {
				tp = map.__controls[controlName];
				break;
			}
		}
		if (!tp) {
			tp = new YMaps.TypeControl();
			map.addControl(tp);
		}
		tp.addType(newType);
	}
	else {
		map.addLayer(newLayer);
		map.addCopyright(attribution);
	}
	this.tileLayers.push([tile_url, newLayer, true]);
	return newLayer;
},
*/

TileMap: {
	addToMapTypeControl: function() {
		if (this.prop_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling addToMapTypeControl()');
		}

		if (this.properties.type === mxn.Mapstraction.TileType.BASE) {
			var layerID = Math.round(Math.random() * Date.now()).toString(); // silly hash function
			YMaps.Layers.add(layerID, this.prop_tilemap);
			var newType = new YMaps.MapType([layerID],
				self.properties.options.attribution,
				{
					textColor: "#706f60",
					minZoom: min_zoom,
					maxZoom: max_zoom
				}
			);

			this.mxn.controls.map_type.addType(newType);// this.properties.name);
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
			this.mxn.controls.map_type.removeType(this.properties.name);
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

		var dataSource = new YMaps.TileDataSource(url, true, true);
		dataSource.getTileUrl = function (t, s) {
			var tile_url = this._tileUrlTemplate.replace(/\{X\}/gi, t.x).replace(/\{Y\}/gi, t.y).replace(/\{Z\}/gi, s);
			if (typeof subdomains !== 'undefined') {
				tile_url = mxn.util.getSubdomainTileURL(tile_url, subdomains);
			}
			return tile_url;
		};
		var prop_tilemap = new YMaps.Layer(dataSource);
		prop_tilemap._$element.css('opacity', self.properties.options.opacity);

		
		
		// ymaps.Layer inherits from ymaps.ILayer, which defines three optional methods
		// that we can override ...
		// getBrightness() - the opacity of the layer
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
