mxn.register('openlayers', {	

	Mapstraction: {

		init: function(element, api){
			var me = this;
			
			if (typeof OpenLayers.Map === 'undefined') {
				throw new Error(api + ' map script not imported');
			}

			this.controls = {
				pan: null,
				zoom: null,
				overview: null,
				scale: null,
				map_type: null
			};

			var map = new OpenLayers.Map(
				element.id,
				{
					maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
					maxResolution: 156543,
					numZoomLevels: 18,
					units: 'm',
					projection: 'EPSG:900913',
					controls: [
						new OpenLayers.Control.Navigation(),
						new OpenLayers.Control.ArgParser(),
						new OpenLayers.Control.Attribution()
					]
				}
			);
		
			// initialize layers map (this was previously in mxn.core.js)
			this.layers = {};

			this.layers.osm = new OpenLayers.Layer.TMS(
				'OpenStreetMap',
				[
					"http://a.tile.openstreetmap.org/",
					"http://b.tile.openstreetmap.org/",
					"http://c.tile.openstreetmap.org/"
				],
				{ 
					type:'png',
					getURL: function (bounds) {
						var res = this.map.getResolution();
						var x = Math.round ((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
						var y = Math.round ((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
						var z = this.map.getZoom();
						var limit = Math.pow(2, z);
						if (y < 0 || y >= limit) {
							return null;
						} else {
							x = ((x % limit) + limit) % limit;
							var path = z + "/" + x + "/" + y + "." + this.type;
							var url = this.url;
							if (url instanceof Array) {
								url = this.selectUrl(path, url);
							}
							return url + path;
						}
					},
					displayOutsideMaxExtent: true
				}
			);
					
			// deal with click
			map.events.register('click', map, function(evt){
				var lonlat = map.getLonLatFromViewPortPx(evt.xy);
				var point = new mxn.LatLonPoint();
				point.fromProprietary(api, lonlat);
				me.click.fire({'location': point });
			});

			// deal with zoom change
			map.events.register('zoomend', map, function(evt){
				me.changeZoom.fire();
			});
		
			// deal with map movement
			map.events.register('moveend', map, function(evt){
				me.moveendHandler(me);
				me.endPan.fire();
			});
		
			// deal with initial tile loading
			var loadfire = function(e) {
				me.load.fire();
				this.events.unregister('loadend', this, loadfire);
			};
		
			for (var layerName in this.layers) {
				if (this.layers.hasOwnProperty(layerName)) {
					if (this.layers[layerName].visibility === true) {
						this.layers[layerName].events.register('loadend', this.layers[layerName], loadfire);
					}
				}
			}
		
			map.addLayer(this.layers.osm);
			this.tileLayers.push(["http://a.tile.openstreetmap.org/", this.layers.osm, true]);
			this.maps[api] = map;
			this.loaded[api] = true;
		},

		applyOptions: function(){
			var map = this.maps[this.api],
				navigators = map.getControlsByClass( 'OpenLayers.Control.Navigation' ),
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
			// FIXME: OpenLayers has a bug removing all the controls says crschmidt
			/*for (var i = map.controls.length; i>1; i--) {
				map.controls[i-1].deactivate();
				map.removeControl(map.controls[i-1]);
			}
			if ( args.zoom == 'large' )	  {
				map.addControl(new OpenLayers.Control.PanZoomBar());
			}
			else if ( args.zoom == 'small' ) {
				map.addControl(new OpenLayers.Control.ZoomPanel());
				if ( args.pan) {
					map.addControl(new OpenLayers.Control.PanPanel()); 
				}
			}
			else {
				if ( args.pan){
					map.addControl(new OpenLayers.Control.PanPanel()); 
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
					this.controls.zoom.deactivate();
					map.removeControl(this.controls.zoom);
					this.controls.zoom = null;
				}
			}

			// See notes for addSmallControls and addLargeControls for why we suppress
			// the PanPanel if the 'zoom' arg is set ...
			if ('pan' in args && args.pan && ((!'zoom' in args) || ('zoom' in args && args.zoom == 'small'))) {
				if (this.controls.pan === null) {
					this.controls.pan = new OpenLayers.Control.PanPanel();
					map.addControl(this.controls.pan);
				}
			}

			else {
				if (this.controls.pan !== null) {
					this.controls.pan.deactivate();
					map.removeControl(this.controls.pan);
					this.controls.pan = null;
				}
			}
			
			if ('overview' in args && args.overview) {
				if (this.controls.overview === null) {
					this.controls.overview = new OpenLayers.Control.OverviewMap();
					map.addControl(this.controls.overview);
				}
			}

			else {
				if (this.controls.overview !== null) {
					this.controls.overview.deactivate();
					map.removeControl(this.controls.overview);
					this.controls.overview = null;
				}
			}
			
			if ('map_type' in args && args.map_type) {
				this.controls.map_type = this.addMapTypeControls();
			}
			
			else {
				if (this.controls.map_type !== null) {
					this.controls.map_type.deactivate();
					map.removeControl(this.controls.map_type);
					this.controls.map_type = null;
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
		},

		addSmallControls: function() {
			var map = this.maps[this.api];
			this.addControlsArgs.pan = false;
			this.addControlsArgs.scale = false;						
			this.addControlsArgs.zoom = 'small';

			if (this.controls.zoom !== null) {
				this.controls.zoom.deactivate();
				map.removeControl(this.controls.zoom);
			}
			// ZoomPanel == ZoomIn + ZoomOut + ZoomToMaxExtent
			this.controls.zoom = new OpenLayers.Control.ZoomPanel();
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
			this.controls.zoom = new OpenLayers.Control.PanZoomBar();
			map.addControl(this.controls.zoom);
			return this.controls.zoom;
		},

		addMapTypeControls: function() {
			var map = this.maps[this.api];
			var control = null;
			
			if (this.controls.map_type === null) {
				control = new OpenLayers.Control.LayerSwitcher({ 'ascending':false });
				map.addControl(control);
			}
			
			else {
				control = this.controls.map_type;
			}
			
			return control;
		},

		setCenterAndZoom: function(point, zoom) { 
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			map.setCenter(point.toProprietary(this.api), zoom);
		},

		addMarker: function(marker, old) {
			var map = this.maps[this.api];
			var pin = marker.toProprietary(this.api);

			if (!this.layers.markers) {
				var default_style = new OpenLayers.Style({
					'cursor'       : 'pointer',
					'graphicZIndex': 2
				});
				var select_style = default_style;
				var style_map = new OpenLayers.StyleMap({
					'default': default_style,
					'select' : select_style
				});
				this.layers.markers = new OpenLayers.Layer.Vector('markers', {
					// events            : null,
					// isBaseLayer       : false,
					// isFixed           : false,
					// features          : [],
					// filter            : null,
					// selectedFeatures  : [],
					// unrenderedFeatures: {},
					reportError          : true,
					// style             : {},
					styleMap             : style_map,
					// strategies        : [],
					// protocol          : null,
					// renderers         : [],
					// renderer          : null,
					// rendererOptions   : {},
					rendererOptions      : {
						yOrdering: true,
						zIndexing: true
					}
					// geometryType      : 'OpenLayers.Geometry.Point',
					// drawn             : false,
					// ratio             : 1.0
				});
				map.addLayer(this.layers.markers);
				select = new OpenLayers.Control.SelectFeature(this.layers.markers, {
					// events        : null,
					// multipleKey   : 'altKey',
					// toggleKey     : 'ctrlKey',
					multiple         : true,
					clickout         : true,
					// toggle        : true,
					hover            : false,
					highlightOnly    : true,
					// box           : true,
					// onBeforeSelect: null,
					onSelect         : function(feature) {
						feature.mapstraction_marker.click.fire();
						select.unselect(feature);
					},
					// onUnselect    : null,
					// scope         : {},
					// geometryTypes : ['OpenLayers.Geometry.Point'],
					// layer         : null,
					// layers        : [],
					// callbacks     : {},
					// selectStyle   : {},
					// renderIntent  : '',
					// handlers      : {},
					overFeature      : function(feature) {
						var marker = feature.mapstraction_marker;
						if (!!marker.hoverIconUrl) {
							marker.setUrl(marker.hoverIconUrl);
						}
						if (marker.hover && !!marker.popup) {
							marker.map.addPopup(marker.popup);
							marker.popup.show();
						}
					},
					outFeature       : function(feature) {
						var marker = feature.mapstraction_marker;
						if (!!marker.hoverIconUrl) {
							var iconUrl = marker.iconUrl || 'http://openlayers.org/dev/img/marker-gold.png';
							marker.setUrl(iconUrl);
						}
						if (marker.hover && !!marker.popup) {
							marker.popup.hide();
							marker.map.removePopup(marker.popup);
						}
					},
					autoActivate     : true
				});
				drag = new OpenLayers.Control.DragFeature(this.layers.markers, {
					// geometryTypes: ['OpenLayers.Geometry.Point'],
					// onStart         : null,
					// onDrag          : null,
					// onComplete      : null,
					// onEnter         : null,
					// onLeave         : null,
					documentDrag    : true,
					// layer           : null,
					// feature         : null,
					// dragCallbacks   : {},
					// featureCallbacks: {},
					// lastPixel       : null,
					autoActivate    : true
				});
				drag.handlers.drag.stopDown     = false;
				drag.handlers.drag.stopUp       = false;
				drag.handlers.drag.stopClick    = false;
				drag.handlers.feature.stopDown  = false;
				drag.handlers.feature.stopUp    = false;
				drag.handlers.feature.stopClick = false;
				drag.onStart = function(feature,pixel) {
					if (feature.mapstraction_marker.draggable !== true) {
						drag.handlers.drag.deactivate();
					}
				};
				
				map.addControls([select, drag]);
				
				//Not actually needed, as not referenced anywhere else, but just for completeness:
				this.controls.drag = drag;
				this.controls.select = select;
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
				this.layers.polylines = new OpenLayers.Layer.Vector('polylines');
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
			var pt = map.getCenter();
			var mxnPt = new mxn.LatLonPoint();
			mxnPt.fromProprietary(this.api, pt);
			return mxnPt;
		},

		setCenter: function(point, options) {
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			map.setCenter(pt);
		},

		setZoom: function(zoom) {
			var map = this.maps[this.api];
			map.zoomTo(zoom);
		},

		getZoom: function() {
			var map = this.maps[this.api];
			return map.zoom;
		},

		getZoomLevelForBoundingBox: function( bbox ) {
			var map = this.maps[this.api];

			var sw = bbox.getSouthWest();
			var ne = bbox.getNorthEast();

			if(sw.lon > ne.lon) {
				sw.lon -= 360;
			}

			var obounds = new OpenLayers.Bounds();
			
			obounds.extend(new mxn.LatLonPoint(sw.lat,sw.lon).toProprietary(this.api));
			obounds.extend(new mxn.LatLonPoint(ne.lat,ne.lon).toProprietary(this.api));
			
			var zoom = map.getZoomForExtent(obounds);
			
			return zoom;
		},

		setMapType: function(type) {
			// Only Open Street Map road map is implemented, so you can't change the Map Type
		},

		getMapType: function() {
			// Only Open Street Map road map is implemented, so you can't change the Map Type
			return mxn.Mapstraction.ROAD;
		},

		getBounds: function () {
			var map = this.maps[this.api];
			var olbox = map.calculateBounds();
			var ol_sw = new OpenLayers.LonLat( olbox.left, olbox.bottom );
			var mxn_sw = new mxn.LatLonPoint(0,0);
			mxn_sw.fromProprietary( this.api, ol_sw );
			var ol_ne = new OpenLayers.LonLat( olbox.right, olbox.top );
			var mxn_ne = new mxn.LatLonPoint(0,0);
			mxn_ne.fromProprietary( this.api, ol_ne );
			return new mxn.BoundingBox(mxn_sw.lat, mxn_sw.lon, mxn_ne.lat, mxn_ne.lon);
		},

		setBounds: function(bounds) {
			var map = this.maps[this.api];
			var sw = bounds.getSouthWest();
			var ne = bounds.getNorthEast();

			if(sw.lon > ne.lon) {
				sw.lon -= 360;
			}

			var obounds = new OpenLayers.Bounds();
			
			obounds.extend(new mxn.LatLonPoint(sw.lat,sw.lon).toProprietary(this.api));
			obounds.extend(new mxn.LatLonPoint(ne.lat,ne.lon).toProprietary(this.api));
			map.zoomToExtent(obounds);
		},

		addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
			var map = this.maps[this.api];
			var bounds = new OpenLayers.Bounds();
			bounds.extend(new mxn.LatLonPoint(south,west).toProprietary(this.api));
			bounds.extend(new mxn.LatLonPoint(north,east).toProprietary(this.api));
			var overlay = new OpenLayers.Layer.Image(
				id, 
				src,
				bounds,
				new OpenLayers.Size(oContext.imgElm.width, oContext.imgElm.height),
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
			var kml = new OpenLayers.Layer.GML("kml", url,{
				'format'       : OpenLayers.Format.KML,
				'formatOptions': new OpenLayers.Format.KML({
					'extractStyles'    : true,
					'extractAttributes': true
				}),
				'projection'   : new OpenLayers.Projection('EPSG:4326')
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
			var new_tile_url = tile_url.replace(/\{Z\}/gi,'${z}');
			new_tile_url = new_tile_url.replace(/\{X\}/gi,'${x}');
			new_tile_url = new_tile_url.replace(/\{Y\}/gi,'${y}');
			var overlay = new OpenLayers.Layer.XYZ(label,
				new_tile_url,
				{sphericalMercator: false, opacity: opacity}
			);
			if(!map_type) {
				overlay.addOptions({displayInLayerSwitcher: false, isBaseLayer: false});
			}
			map.addLayer(overlay);
			OpenLayers.Util.onImageLoadErrorColor = "transparent"; //Otherwise missing tiles default to pink!			
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
					point.fromProprietary('openlayers', lonlat);
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
			return new OpenLayers.LonLat(ollon, ollat);			
		},

		fromProprietary: function(olPoint) {
			var lon = (olPoint.lon / 20037508.34) * 180;
			var lat = (olPoint.lat / 20037508.34) * 180;
			lat = 180/Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
			this.lon = lon;
			this.lng = this.lon;
			this.lat = lat;
		}

	},

	Marker: {

		toProprietary: function() {
			var size, anchor, style, marker, position;
			if (!!this.iconSize) {
				size = new OpenLayers.Size(this.iconSize[0], this.iconSize[1]);
			}
			else {
				size = new OpenLayers.Size(21, 25);
			}

			if (!!this.iconAnchor) {
				anchor = new OpenLayers.Pixel(-this.iconAnchor[0], -this.iconAnchor[1]);
			}
			else {
				anchor = new OpenLayers.Pixel(-(size.w / 2), -size.h);
			}

			if (!!this.iconUrl) {
				this.icon = new OpenLayers.Icon(this.iconUrl, size, anchor);
			}
			else {
				this.icon = new OpenLayers.Icon('http://openlayers.org/dev/img/marker-gold.png', size, anchor);
			}

			style = {
				cursor         : 'pointer',
				externalGraphic: ((!!this.iconUrl) ? this.iconUrl : 'http://openlayers.org/dev/img/marker-gold.png'),
				graphicTitle   : ((!!this.labelText) ? this.labelText : ''),
				graphicHeight  : size.h,
				graphicWidth   : size.w,
				graphicOpacity : 1.0,
				graphicXOffset : anchor.x,
				graphicYOffset : anchor.y,
				graphicZIndex  : (!!this.attributes.zIndex ? this.attributes.zIndex : 2)//,
				// title       : this.labelText
			};

			position = this.location.toProprietary('openlayers');
			marker = new OpenLayers.Feature.Vector(
			 new OpenLayers.Geometry.Point(position.lon,	position.lat),
				null,
				style);

			if (!!this.infoBubble) {
				this.popup = new OpenLayers.Popup.FramedCloud(
					null,
					position,
					new OpenLayers.Size(100, 100),
					this.infoBubble,
					this.icon,
					true);
				this.popup.autoSize = true;
				this.popup.panMapIfOutOfView = true;
				this.popup.fixedRelativePosition = false;
				this.popup.feature = marker;
			}
			else {
				this.popup = null;
			}

			if (this.infoDiv){
				// TODO
			}
			return marker;
		},

		openBubble: function() {		
			if (!!this.infoBubble) {
				// Need to create a new popup in case setInfoBubble has been called
				this.popup = new OpenLayers.Popup.FramedCloud(
					null,
					this.location.toProprietary("openlayers"),
					new OpenLayers.Size(100, 100),
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
		},

		closeBubble: function() {
			if (!!this.popup) {
				this.popup.hide();
				this.map.removePopup(this.popup);
				this.popup = null;
			}
		},

		hide: function() {
			this.proprietary_marker.layer.setVisibility(false);
			
		},

		show: function() {
			this.proprietary_marker.layer.setVisibility(true);
		},

		update: function() {
			throw new Error('Marker.update is not currently supported by provider ' + this.api);
		}
	},

	Polyline: {

		toProprietary: function() {
			var coords = [];
			var ring;
			var style = {
				strokeColor  : this.color,
				strokeOpacity: this.opacity,
				strokeWidth  : this.width,
				fillColor    : this.fillColor,
				fillOpacity  : this.opacity
			};

			for (var i = 0, length = this.points.length ; i< length; i++){
				var point = this.points[i].toProprietary("openlayers");
				coords.push(new OpenLayers.Geometry.Point(point.lon, point.lat));
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
				ring = new OpenLayers.Geometry.LinearRing(coords);
			} else {
				// a line
				ring = new OpenLayers.Geometry.LineString(coords);
			}

			this.proprietary_polyline = new OpenLayers.Feature.Vector(ring, null, style);
			return this.proprietary_polyline;
		},

		show: function() {
			this.proprietary_polyline.layer.setVisibility(true);
		},

		hide: function() {
			this.proprietary_polyline.layer.setVisibility(false);
		}
	}

});