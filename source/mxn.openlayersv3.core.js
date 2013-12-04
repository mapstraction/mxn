mxn.register('openlayersv3', {	

	Mapstraction: {
	
		init: function (element, api, properties) {
			var me = this;
			this.layers = {};
					
			if (typeof ol.Map === 'undefined') {
				throw new Error(api + ' map script not imported');
			}

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
			this.currentMapType = mxn.Mapstraction.ROAD;
			var defaultMap = this.getDefaultBaseMap(this.currentMapType);
			var baseMap = this.getCustomBaseMap(defaultMap.providerType);	
			
			var options = {
				projection: 'EPSG:4326', //TODO: check whether these ol2 properties are needed / useful
				crossOrigin: 'anonymous', //TODO: check whether these ol2 properties are needed / useful
				view: new ol.View2D({
					center: [0, 0],
					zoom: 3
				}),
				layers: [baseMap.tileMap.prop_tilemap],
				target: element,
				renderer: ol.RendererHint.CANVAS //needed as webGL doesn't support vector layers yet
			};

			var hasOptions = (typeof properties !== 'undefined' && properties !== null);
			if (hasOptions) {
				if (properties.hasOwnProperty('center') && null !== properties.center) {
					options.view.center = properties.center.toProprietary(this.api);
				}

				if (properties.hasOwnProperty('map_type') && null !== properties.map_type) {
					this.currentMapType = properties.map_type;
				}

				defaultMap = this.getDefaultBaseMap(this.currentMapType);
				if (defaultMap !== null) {
					var baselayer = this.getCustomBaseMap(defaultMap.providerType);
					options.layers = [baselayer.tileMap.prop_tilemap];
				}

				if (properties.hasOwnProperty('zoom') && null !== properties.zoom) {
					options.view.zoom = properties.zoom;
				}
			}

			var map = new ol.Map({
			  view: new ol.View2D({
				center: [0, 0],
				zoom: 3
			  }),
			  layers: [baseMap.tileMap.prop_tilemap],
			  target: element,
			  renderer: ol.RendererHint.CANVAS //needed as webGL doesn't support vector layers yet
			});
			this.maps[api] = map;
			
			if (hasOptions && properties.hasOwnProperty('controls') && null !== properties.controls) {
				this.addControls(properties.controls);
			}

			// deal with click
			map.on(['click'], function(evt) {
				var point = new mxn.LatLonPoint();
				point.fromProprietary(api, evt.getCoordinate());
				me.click.fire({'location': point });
			});
			
			// deal with zoom change
			map.on(['zoomend'], function(evt) {
				me.changeZoom.fire();
			});
		
			// deal with map movement
			map.on(['moveend'], function(evt) {
				me.endPan.fire();
			});
		
			this.loaded[api] = true;
			
			/* map.on(['load'], function(evt) {
				me.load.fire();
			}); This doesn't work so use the hack below */
			//doing the load.fire directly it runs too fast and we dont get a chance to register the handler in the core tests, so had to add a delay.
			setTimeout(function(){me.load.fire();},50);
		},

		resizeTo: function(width, height){	
			this.currentElement.style.width = width;
			this.currentElement.style.height = height;
			this.maps[this.api].updateSize();
		},

		addSmallControls: function() {
			var map = this.maps[this.api];
			this.removeSmallControls();
			// ZoomPanel == ZoomIn + ZoomOut + ZoomToMaxExtent
			this.controls.zoom = new ol.control.Zoom();
			map.addControl(this.controls.zoom);
			return this.controls.zoom;
		},

		removeSmallControls: function () {
			var map = this.maps[this.api];
			if (this.controls.zoom !== null) {
				this.controls.zoom.deactivate();
				map.removeControl(this.controls.zoom);
				this.controls.zoom = null;
			}
		},

		addLargeControls: function() {
			var map = this.maps[this.api];
			this.removeLargeControls();
			// PanZoomBar == PanPanel + ZoomBar
			this.controls.zoom = new ol.control.ZoomSlider();
			map.addControl(this.controls.zoom);
			return this.controls.zoom;
		},

		removeLargeControls: function () {
			this.removeSmallControls();
		},

		addMapTypeControls: function() {
			var map = this.maps[this.api];
			var control = null;
			
			if (this.controls.map_type === null) {
				/*
				control = new ol.control.LayerSwitcher({ 'ascending':false });
				map.addControl(control); */
			}
			
			else {
				control = this.controls.map_type;
			}
			
			return control;
		},

		removeMapTypeControls: function () {
			if (this.controls.map_type !== null) {
				map.removeControl(this.controls.map_type);
				this.controls.map_type = null;
			}
		},

		addScaleControls: function () {
			var map = this.maps[this.api];

			if (this.controls.scale === null) {
				this.controls.scale = new ol.control.ScaleLine();
				map.addControl(this.controls.scale);
			}
		},

		removeScaleControls: function () {
			var map = this.maps[this.api];

			if (this.controls.scale !== null) {
				this.controls.scale.deactivate();
				map.removeControl(this.controls.scale);
				this.controls.scale = null;
			}
		},

		addPanControls: function () {
			/* TODO: ol3 doesnt have one yet
			var map = this.maps[this.api];

			if (this.controls.pan === null) {
				this.controls.pan = new ol.control.PanPanel()
				map.addControl(this.controls.pan);
			} */
		},

		removePanControls: function () {
			var map = this.maps[this.api];

			if (this.controls.pan !== null) {
				this.controls.pan.deactivate();
				map.removeControl(this.controls.pan);
				this.controls.pan = null;
			}
		},

		addOverviewControls: function (zoomOffset) {
			var map = this.maps[this.api];

			if (this.controls.overview === null) {
				/*TODO: Not implemented in ol3 yet
				this.controls.overview = new OpenLayers.Control.OverviewMap({
					maximized: true,
					mapoptions: {
						projection: 'EPSG:4326',
						crossorigin: 'anonymous',
					}
				});
				map.addControl(this.controls.overview); */
			}
		},

		removeOverviewControls: function () {
			var map = this.maps[this.api];
			if (this.controls.overview !== null) {
				this.controls.overview.destroy();
				map.removeControl(this.controls.overview);
				this.controls.overview = null;
			}
		},

		setCenterAndZoom: function(point, zoom) { 
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			var view = new ol.View2D({
				center: pt,
				zoom: zoom
			  });
						
			map.setView(view);
		},

		addMarker: function(marker, old) {
			var map = this.maps[this.api];
			var pin = marker.toProprietary(this.api);

			if (!this.layers.markers) {
				this.layers.markers = new ol.layer.Vector({
					source: new ol.source.Vector({data: null}),
					projection: ol.proj.get('EPSG:4326')			
				});
				map.addLayer(this.layers.markers);
			}
			this.layers.markers.addFeatures([pin]);
			return pin;
		},

		removeMarker: function(marker) {
			var pin = marker.proprietary_marker;
			this.layers.markers.removeFeatures([pin]);
		},

		declutterMarkers: function(opts) {
			throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
		},

		addPolyline: function(polyline, old) {
			var map = this.maps[this.api];
			var pl = polyline.toProprietary(this.api);
			if (!this.layers.polylines) {
				this.layers.polylines = new ol.layer.Vector({
					source: new ol.source.Vector({data: null}),
					projection: ol.proj.get('EPSG:4326')
				});
				map.addLayer(this.layers.polylines);
			}
			this.layers.polylines.addFeatures([pl]);
			return pl;
		},

		removePolyline: function(polyline) {
			var pl = polyline.proprietary_polyline;
			this.layers.polylines.removeFeatures([pl]);
		},
		
		removeAllPolylines: function () {
			if (this.layers.polylines) {
				this.layers.polylines.clear();
			}
		},

		getCenter: function() {
			var map = this.maps[this.api];
			var pt = map.getView().getCenter();
			var mxnPt = new mxn.LatLonPoint();
			mxnPt.fromProprietary(this.api, pt);
			return mxnPt;
		},

		setCenter: function(point, options) {
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			map.getView().setCenter(pt);
		},

		setZoom: function(zoom) {
			var map = this.maps[this.api];
			map.getView().setZoom(zoom);
		},

		getZoom: function() {
			var map = this.maps[this.api];
			return map.getView().getZoom();
		},

		getZoomLevelForBoundingBox: function( bbox ) {
			var map = this.maps[this.api];

			var sw = bbox.getSouthWest();
			var ne = bbox.getNorthEast();

			if(sw.lon > ne.lon) {
				sw.lon -= 360;
			}

			var obounds = new ol.extent();
			
			obounds.extend(new mxn.LatLonPoint(sw.lat,sw.lon).toProprietary(this.api));
			obounds.extend(new mxn.LatLonPoint(ne.lat,ne.lon).toProprietary(this.api));
			
			var zoom = map.getZoomForExtent(obounds);
			
			return zoom;
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
			var fn = function(elem, index, array) { 
						if (elem === this.customBaseMaps[i].tileMap.prop_tilemap) {
							layers.push(elem);
						}};

			for (i=0; i<this.customBaseMaps.length; i++) {
				if (this.customBaseMaps[i].name === name) {
					map.addLayer(this.customBaseMaps[i].tileMap.prop_tilemap, true);
				}
				else {
					map.getLayers().forEach(fn, this);
				}
			}

			for (i=0; i<layers.length; i++) {
				map.removeLayer(layers[i]);
			}
		},

		getMapType: function() {
			var map = this.maps[this.api];		
			var maypType = mxn.Mapstraction.ROAD;
			
			if (map.getLayers().getAt(1).getVisible()) {
				maypType = mxn.Mapstraction.SATELLITE;
			}
				
			return maypType;
		},

		getBounds: function () {
			var map = this.maps[this.api];
			var olbox = map.getView().getView2D().calculateExtent(map.getSize());
			
			var ol_sw = [olbox[0], olbox[2]];
			var mxn_sw = new mxn.LatLonPoint(0,0);
			mxn_sw.fromProprietary( this.api, ol_sw );
			
			var ol_ne = [olbox[1], olbox[3]];
			var mxn_ne = new mxn.LatLonPoint(0,0);
			mxn_ne.fromProprietary( this.api, ol_ne );
			
			return new mxn.BoundingBox(mxn_sw.lat, mxn_sw.lon, mxn_ne.lat, mxn_ne.lon);
		},

		setBounds: function(bounds) {
			var map = this.maps[this.api];
			var sw_ol = bounds.getSouthWest().toProprietary(this.api);
			var ne_ol = bounds.getNorthEast().toProprietary(this.api);
			var obounds = [sw_ol[0],ne_ol[0],sw_ol[1],ne_ol[1]];
			
			map.getView().getView2D().fitExtent(obounds, map.getSize());
		},

		addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
			var map = this.maps[this.api];
			var bounds = new ol.Bounds();
			bounds.extend(new mxn.LatLonPoint(south,west).toProprietary(this.api));
			bounds.extend(new mxn.LatLonPoint(north,east).toProprietary(this.api));
			var overlay = new ol.Layer.Image(
				id, 
				src,
				bounds,
				new ol.Size(oContext.imgElm.width, oContext.imgElm.height),
				{'isBaseLayer': false, 'alwaysInRange': true}
			);
			map.addLayer(overlay);
			this.setImageOpacity(overlay.div.id, opacity);
		},

		setImagePosition: function(id, oContext) {
			throw new Error('Mapstraction.setImagePosition is not currently supported by provider ' + this.api);
		},

		addOverlay: function(url, autoCenterAndZoom) {
			var map = this.maps[this.api];
			var kml = new ol.Layer.GML("kml", url,{
				'format'	   : ol.Format.KML,
				'formatOptions': new ol.Format.KML({
					'extractStyles'	: true,
					'extractAttributes': true
				}),
				'projection'   : new ol.Projection('EPSG:4326')
			});
			if (autoCenterAndZoom) {
				var setExtent = function() {
					dataExtent = this.getDataExtent();
					map.zoomToExtent(dataExtent);
				};
				kml.events.register('loadend', kml, setExtent); 
			}
			map.addLayer(kml);
		},

		addBaseMap: function(baseMap) {
			return baseMap.toProprietary(this.api);
		},
		
		addTileMap: function(tileMap) {
			return tileMap.toProprietary(this.api);
		},		
			
		addOverlayMap: function(overlayMap) {
			return overlayMap.toProprietary(this.api);
		},
		
		addTile: function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
			var map = this.maps[this.api];
			if (typeof subdomains !== 'undefined') {
				//Use the first subdomain only for now
				tile_url = mxn.util.getSubdomainTileURL(tile_url, subdomains[0]);
			}

			var new_tile_url = tile_url.replace(/\{Z\}/gi,'{z}').replace(/\{X\}/gi,'{x}').replace(/\{Y\}/gi,'{y}');
			
			var overlay = new ol.layer.Tile({
			  source: new ol.source.XYZ({ //this source is not currently exported by openlayers3, so we have to use ol-simple.js until it is
				attributions: [new ol.Attribution(attribution)],
				url: new_tile_url,
				crossOrigin: 'anonymous',
				maxZoom : 18,
				minZoom: 0,
				opacity: opacity
			  })
			});
			
			map.addLayer(overlay);
			this.Tiles.push( [tile_url, overlay, true] );			
		},

		getPixelRatio: function () {
			//TODO: ol3 probably can do this
			throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
		},

		mousePosition: function(element) {
			var map = this.maps[this.api];
			var locDisp = document.getElementById(element);
			if (locDisp !== null) {
				map.events.register('mousemove', map, function (evt) {
					var lonlat = map.getLonLatFromViewPortPx(evt.xy);
					var point = new mxn.LatLonPoint();
					point.fromProprietary('openlayersv3', lonlat);
					var loc = point.lat.toFixed(4) + ' / ' + point.lon.toFixed(4);
					locDisp.innerHTML = loc;
				});
			}
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	},

	LatLonPoint: {

		toProprietary: function() {
			var ollon = this.lon * 20037508.34 / 180;
			var ollat = Math.log(Math.tan((90 + this.lat) * Math.PI / 360)) / (Math.PI / 180);
			ollat = ollat * 20037508.34 / 180;
			return [ollon, ollat];			 
		},

		fromProprietary: function(olPoint) {
			var lon = (olPoint[0] / 20037508.34) * 180;
			var lat = (olPoint[1] / 20037508.34) * 180;
			lat = 180/Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
			this.lon = lon;
			this.lat = lat;
		}
	},

	Marker: {

		toProprietary: function() {	
			var options = {
				geometry: new ol.geom.Point(this.location.toProprietary('openlayersv3')),
				symbolizers: [new ol.style.Icon({
					url: this.iconUrl || 'http://openlayers.org/dev/img/marker-gold.png'
				})]
			};

			if (this.iconAnchor) { //TODO:not supported in ol3 yet
				options.xOffset = this.iconAnchor[0];
				options.yOffset = this.iconAnchor[1];
			}
				
			if (this.iconSize) {
				options.width = this.iconSize[0];
				options.height = this.iconSize[1];
			}
			
			this.proprietary_marker = new ol.Feature(options);
			//this.proprietary_marker.setSymbolizers([symbol]); 
					
			if (!!this.infoBubble) {
				var popup = new ol.Overlay({
				  map: this.map
				  //element: document.createTextElement(this.infoBubble)
				});

				//popup.setPosition(point);
				this.popup = popup;
			}
			else {
				this.popup = null;
			}

			return this.proprietary_marker;
		},

		openBubble: function() {		
			/*
			if (!!this.infoBubble) {
				// Need to create a new popup in case setInfoBubble has been called
				this.popup = new ol.Popup.FramedCloud(
					null,
					this.location.toProprietary("openlayersv3"),
					new ol.Size(100, 100),
					this.infoBubble,
					this.icon,
					true);
				this.popup.autoSize = true;
				this.popup.panMapIfOutOfView = true;
				this.popup.fixedRelativePosition = false;
				this.popup.feature = this.propriety_marker;
			}

			if (!!this.popup) {
				this.map.addPopup(this.popup, true);
			}
			this.openInfoBubble.fire( { 'marker': this } );
			*/
		},

		closeBubble: function() {
			/*if (!!this.popup) {
				this.popup.hide();
				this.map.removePopup(this.popup);
				this.popup = null;
			} */
			this.closeInfoBubble.fire( { 'marker': this } );
		},

		hide: function() {
			delete this.proprietary_marker.style.display;
			this.proprietary_marker.layer.redraw();		
		},


		show: function() {
			this.proprietary_marker.style.display = 'true';
			this.proprietary_marker.layer.redraw();
		},

		update: function() {
			throw new Error('Marker.update is not currently supported by provider ' + this.api);
		}
	},

	Polyline: {

		toProprietary: function() {
			var coords = [];
			var ring;
			
			for (var i = 0, length = this.points.length ; i< length; i++){
				var point = this.points[i].toProprietary("openlayersv3");
				coords.push(point);
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
				// a closed polygon
				ring = new ol.geom.Polygon([coords]);
			} else {
				// a line
				ring = new ol.geom.LineString(coords);
			}
		
			this.proprietary_polyline = new ol.Feature({});
			this.proprietary_polyline.setGeometry(ring);
			this.proprietary_polyline.setSymbolizers([
				new ol.style.Stroke({
					strokeColor: this.color,
					strokeOpacity: this.opacity,
					strokeWidth  : this.width}),
				new ol.style.Fill({
					fillColor	: this.fillColor,
					fillOpacity  : this.opacity})
					
			]);
			return this.proprietary_polyline;
		},

		show: function() {
			//delete this.proprietary_polyline.style.display;
			//this.proprietary_polyline.layer.redraw();		
			},

		hide: function() {
			//this.proprietary_polyline.style.display = 'none';
			//this.proprietary_polyline.layer.redraw();		
		}
	},

TileMap: {
	addToMapTypeControl : function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling addControl()');
		}

		if (!this.mxn.customBaseMaps[this.index].inControl) {
			this.mxn.customBaseMaps[this.index].inControl = true;
			this.mxn.layers[this.properties.options.label] = this.proprietary_tilemap;
			if (this.mxn.controls.map_type !== null && typeof(this.mxn.controls.map_type) !== "undefined") {
				this.mxn.controls.map_type.addBaseLayer(this.proprietary_tilemap, this.properties.options.label);
			}
		}
	},
	
	removeFromMapTypeControl : function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling removeControl()');
		}

		if (this.mxn.customBaseMaps[this.index].inControl) {
			this.mxn.customBaseMaps[this.index].inControl = false;
			delete this.mxn.layers[this.properties.options.label];
			if (typeof(this.mxn.controls.map_type) !== "undefined") {
				this.mxn.controls.map_type.removeLayer(this.proprietary_tilemap);
			}
		}
	},
	
	hide: function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling hide()');
		}

		if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY)
		{
			if (this.mxn.overlayMaps[this.index].visible) {
				this.mxn.overlayMaps[this.index].visible = false;
				this.map.removeLayer(this.proprietary_tilemap);
			}
		}
	},
	
	show: function() {
		if (this.proprietary_tilemap === null) {
			throw new Error(this.api + ': A TileMap must be added to the map before calling show()');
		}
		
		if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
			if (!this.mxn.overlayMaps[this.index].visible) {
				this.mxn.overlayMaps[this.index].visible = true;
				this.map.addLayer(this.proprietary_tilemap, false);
			}
		}
	},
	
	toProprietary: function() {
		var urls = null;
		var url = mxn.util.sanitizeTileURL(this.properties.url);
		var subdomains = this.properties.options.subdomains;
		var source;
		
		if (this.properties.options.subdomains !== null) {
			var pos = url.search('{s}');
			if (pos !== -1) {
				var i = 0;
				var domain;
				urls = [];
				
				for(i = 0; i < subdomains.length; i++) {
					if (typeof subdomains === 'string') {
						domain = subdomains.substring(i, i + 1);
					}
					
					else {
						domain = subdomains[i];
					}
					
					if (typeof domain !== 'undefined') {
						urls.push(url.replace(/\{s\}/g, domain));
					}
				}
			}
		}
	
		if (urls !== null)
		{
			source = new ol.source.XYZ({
				attributions: [new ol.Attribution({html: this.properties.options.attribution})],
				urls: urls
			});
		} else {
			source = new ol.source.XYZ({
				attributions: [new ol.Attribution({html: this.properties.options.attribution})],
				url: url
			});
		}

		var options = {
			//minZoom: this.properties.options.minZoom,
			//maxZoom: this.properties.options.maxZoom,
			//name: this.properties.options.label,
			opacity: this.properties.opacity,
			//zIndex: this.index
			projection: 'EPSG:4326',
			source: source
		};

		return new ol.layer.Tile(options);
	}
}

});