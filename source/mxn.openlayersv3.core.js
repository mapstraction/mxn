mxn.register('openlayersv3', {	

	Mapstraction: {
	
		init: function(element, api){
			var me = this;
			
			if (typeof ol.Map === 'undefined') {
				throw new Error(api + ' map script not imported');
			}

			this.controls = {
				pan: null,
				zoom: null,
				overview: null,
				scale: null,
				map_type: null
			};
			
			var osm = new ol.layer.TileLayer({
				  source: new ol.source.OSM()
			});
				
			var aerial = new ol.layer.TileLayer({
			  source: new ol.source.MapQuestOpenAerial(),
			  visible: false
			});
				
			var map = new ol.Map({
			  view: new ol.View2D({
				center: [0, 0],
				zoom: 3
			  }),
			  layers: [osm, aerial],
			  target: element,
			  renderer: ol.RendererHint.CANVAS //needed as webGL doesn't support vector layers yet
			});
			
			// initialize layers map (this was previously in mxn.core.js)
			this.layers = {};
	
			// deal with click
			map.on(['click'], function(evt) {
				var lonlat = evt.getCoordinate();
				var point = new mxn.LatLonPoint();
				point.fromProprietary(api, lonlat);
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
		
			this.maps[api] = map;
			this.loaded[api] = true;
			
			/* map.on(['load'], function(evt) {
				me.load.fire();
			}); This doesn't work so use the hack below */
			//doing the load.fire directly it runs too fast and we dont get a chance to register the handler in the core tests, so had to add a delay.
			setTimeout(function(){me.load.fire();},50);
		},

		applyOptions: function(){
			var map = this.maps[this.api];
			/*
			var	navigators = map.getControlsByClass( 'ol.control.Navigation' ),
				navigator;

			if ( navigators.length > 0 ) {
				navigator = navigators[0];
				if ( this.options.enableScrollWheelZoom ) {
					navigator.enableZoomWheel();
				} else {
					navigator.disableZoomWheel();
				}
				if ( this.options.enableDragging ) {
					navigator.activate();
				} else {
					navigator.deactivate();
				}
			}*/
		},

		resizeTo: function(width, height){	
			this.currentElement.style.width = width;
			this.currentElement.style.height = height;
			this.maps[this.api].updateSize();
		},

		addControls: function( args ) {
			var map = this.maps[this.api];	
			/*for (var i = map.controls.length; i>1; i--) {
				map.controls[i-1].deactivate();
				map.removeControl(map.controls[i-1]);
			}
			if ( args.zoom == 'large' )	  {
				map.addControl(new ol.control.PanZoomBar());
			}
			else if ( args.zoom == 'small' ) {
				map.addControl(new ol.control.ZoomPanel());
				if ( args.pan) {
					map.addControl(new ol.control.PanPanel()); 
				}
			}
			else {
				if ( args.pan){
					map.addControl(new ol.control.PanPanel()); 
				}
			}*/

			if ('zoom' in args) {
				if (args.zoom == 'large') {
					this.controls.zoom = this.addLargeControls();
				}
				
				else if (args.zoom == 'small') {
					this.controls.zoom = this.addSmallControls();
				}
			}

			else {
				if (this.controls.zoom !== null) {
					map.removeControl(this.controls.zoom);
					this.controls.zoom = null;
				}
			}

			// See notes for addSmallControls and addLargeControls for why we suppress
			// the PanPanel if the 'zoom' arg is set ...
			if ('pan' in args && args.pan && ((!'zoom' in args) || ('zoom' in args && args.zoom == 'small'))) {
				if (this.controls.pan === null) {
					this.controls.pan = new ol.control.PanPanel();
					map.addControl(this.controls.pan);
				}
			}

			else {
				if (this.controls.pan !== null) {
					map.removeControl(this.controls.pan);
					this.controls.pan = null;
				}
			}
			
			if ('overview' in args && args.overview) {
				if (this.controls.overview === null) {
					/*
					this.controls.overview = new ol.control.OverviewMap();
					map.addControl(this.controls.overview);
					*/
				}
			}

			else {
				if (this.controls.overview !== null) {
					map.removeControl(this.controls.overview);
					this.controls.overview = null;
				}
			}
			
			if ('map_type' in args && args.map_type) {
				//this.controls.map_type = this.addMapTypeControls();
			}
			
			else {
				if (this.controls.map_type !== null) {
					map.removeControl(this.controls.map_type);
					this.controls.map_type = null;
				}
			}

			if ('scale' in args && args.scale) {
				if (this.controls.scale === null) {
					this.controls.scale = new ol.control.ScaleLine();
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
			var map = this.maps[this.api];

			if (this.controls.zoom !== null) {
				this.controls.zoom.deactivate();
				map.removeControl(this.controls.zoom);
			}
			// ZoomPanel == ZoomIn + ZoomOut + ZoomToMaxExtent
			this.controls.zoom = new ol.control.Zoom();
			map.addControl(this.controls.zoom);
			return this.controls.zoom;
		},

		addLargeControls: function() {
			var map = this.maps[this.api];
			if (this.controls.zoom !== null) {
				this.controls.zoom.deactivate();
				map.removeControl(this.controls.zoom);
			}
			// PanZoomBar == PanPanel + ZoomBar
			this.controls.zoom = new ol.control.ZoomSlider();
			map.addControl(this.controls.zoom);
			return this.controls.zoom;
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
			var map = this.maps[this.api];
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
			var map = this.maps[this.api];
			var pl = polyline.proprietary_polyline;
			this.layers.polylines.removeFeatures([pl]);
		},
		
		removeAllPolylines: function() {
			var olpolylines = [];
			for (var i = 0, length = this.polylines.length; i < length; i++) {
				olpolylines.push(this.polylines[i].proprietary_polyline);
			}
			if (this.layers.polylines) {
				this.layers.polylines.removeFeatures(olpolylines);
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

		setMapType: function(type) {
			var map = this.maps[this.api];
			
			switch (type) {
				case mxn.Mapstraction.ROAD:
					map.getLayers().getAt(1).setVisible(false);
					map.getLayers().getAt(0).setVisible(true);					
					
					break;
				case mxn.Mapstraction.SATELLITE:
					map.getLayers().getAt(1).setVisible(true);
					map.getLayers().getAt(0).setVisible(false);
					
					break;
				default:
					options.mapTypeId = Microsoft.Maps.MapTypeId.road;
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
				'format'       : ol.Format.KML,
				'formatOptions': new ol.Format.KML({
					'extractStyles'    : true,
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

		addTileLayer: function(tile_url, opacity, label, attribution, min_zoom, max_zoom, map_type, subdomains) {
			var map = this.maps[this.api];
			if (typeof subdomains !== 'undefined') {
				//Use the first subdomain only for now
				tile_url = mxn.util.getSubdomainTileURL(tile_url, subdomains[0]);
			}

			var new_tile_url = tile_url.replace(/\{Z\}/gi,'{z}').replace(/\{X\}/gi,'{x}').replace(/\{Y\}/gi,'{y}');
			
			var overlay = new ol.layer.TileLayer({
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
			this.tileLayers.push( [tile_url, overlay, true] );			
		},

		toggleTileLayer: function(tile_url) {
			var map = this.maps[this.api];
			for (var f=this.tileLayers.length-1; f>=0; f--) {
				if(this.tileLayers[f][0] == tile_url) {
					this.tileLayers[f][2] = !this.tileLayers[f][2];
					this.tileLayers[f][1].setVisibility(this.tileLayers[f][2]);
				}
			}	   
		},

		getPixelRatio: function() {
			var map = this.maps[this.api];

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
			this.lng = this.lon;
			this.lat = lat;
		}

	},

	Marker: {

		toProprietary: function() {	
			position = this.location.toProprietary('openlayersv3');		
			point = new ol.geom.Point(position);		

			this.proprietary_marker = new ol.Feature({});
			this.proprietary_marker.setGeometry(point);
			
			var options = {
				  url: this.iconUrl || 'http://openlayers.org/dev/img/marker-gold.png'
			};

			if (this.iconAnchor) { //not supported in ol3 yet
				options.xOffset = this.iconAnchor[0];
				options.yOffset = this.iconAnchor[1];
			}
				
			if (this.iconSize) {
				options.width = this.iconSize[0];
				options.height = this.iconSize[1];
			}
			
			this.proprietary_marker.setSymbolizers([
				new ol.style.Icon({
				  url: this.iconUrl || 'http://openlayers.org/dev/img/marker-gold.png'
				})
			  ]);
					
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
			if (!!this.popup) {
				this.popup.hide();
				this.map.removePopup(this.popup);
				this.popup = null;
			}
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
					fillColor    : this.fillColor,
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
	}

});