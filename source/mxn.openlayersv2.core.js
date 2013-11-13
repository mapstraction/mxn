mxn.register('openlayersv2', {	

	Mapstraction: {

		init: function(element, api, properties){
			var self = this;
			
			if (typeof OpenLayers.Map === 'undefined') {
				throw new Error(api + ' map script not imported');
			}

			OpenLayers.Util.onImageLoadErrorColor = "transparent"; //Otherwise missing tiles default to pink!	

			this.controls = {
				pan: null,
				zoom: null,
				overview: null,
				scale: null,
				map_type: null
			};

			this.layers = {};
			this.overlays = {};
			this.currentMapType = mxn.Mapstraction.ROAD;

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

			for (var i = 0; i < this.customBaseMaps.length; i++) {
			    this.layers[this.customBaseMaps[i].label] = this.customBaseMaps[i].tileMap.prop_tilemap;
			}

			var options = {
			    projection: 'EPSG:4326',
			    crossorigin: 'anonymous',
			    controls: [
                    new OpenLayers.Control.Navigation(),
                    new OpenLayers.Control.ArgParser(),
                    new OpenLayers.Control.Attribution()]
			};

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
			        this.currentMapType = properties.map_type;
			    }

			    var defaultMap = this.getDefaultBaseMap(this.currentMapType);
			    if (defaultMap !== null) {
			        var baselayer = this.getCustomBaseMap(defaultMap.providerType);
			        options.layers = [baselayer.tileMap.prop_tilemap];
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

			var map = new OpenLayers.Map(
				element.id,
                options
			);
			this.maps[api] = map;
            
			if (hasOptions && properties.hasOwnProperty('controls') && null !== properties.controls) {
			    self.addControls(properties.controls);
			}
				
			// deal with click
			map.events.register('click', map, function(evt){
				var lonlat = map.getLonLatFromViewPortPx(evt.xy);
				var point = new mxn.LatLonPoint();
				point.fromProprietary(api, lonlat);
				self.click.fire({'location': point });
			});

			// deal with zoom change
			map.events.register('zoomend', map, function(evt){
				self.changeZoom.fire();
			});
		
			// deal with map movement
			map.events.register('moveend', map, function(evt){
				self.moveendHandler(self);
				self.endPan.fire();
			});
		
			// deal with initial tile loading
			var loadfire = function(e) {
				self.load.fire();
				this.events.unregister('loadend', this, loadfire);
			};
		
			for (var layerName in this.layers) {
				if (this.layers.hasOwnProperty(layerName)) {
					if (this.layers[layerName].visibility === true) {
						this.layers[layerName].events.register('loadend', this.layers[layerName], loadfire);
					}
				}
			}
		
			this.loaded[api] = true;
		},

		getVersion: function() {
			return OpenLayers.VERSION_NUMBER;
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

		//TODO: See notes for addSmallControls and addLargeControls for why we suppress
		// the PanPanel if the 'zoom' arg is set ...
		//if ('pan' in args && args.pan && ((!'zoom' in args) || ('zoom' in args && args.zoom == 'small'))) {

		addAControl: function (control) {
		    var map = this.maps[this.api];
		    if (control !== null && typeof (control) !== "undefined" && !control.active) { 
		        map.addControl(control);
		    }
		    return control;
		},

		removeAControl: function (control) {
		    var map = this.maps[this.api];
		    if (control !== null && typeof (control) !== "undefined" && control.active) {
		        control.deactivate();
		        map.removeControl(control);
		    }
		},

		addSmallControls: function() {
			this.removeSmallControls();
			// ZoomPanel == ZoomIn + ZoomOut + ZoomToMaxExtent
			this.controls.zoom = this.addAControl(new OpenLayers.Control.ZoomPanel());
		},

		removeSmallControls: function () {
		    this.removeAControl(this.controls.zoom);
		},

		addLargeControls: function() {
            this.removeLargeControls();
		    // PanZoomBar == PanPanel + ZoomBar
            this.controls.zoom = this.addAControl(new OpenLayers.Control.PanZoomBar());
		},

		removeLargeControls: function () {
		    this.removeAControl(this.controls.zoom);
		},

		addMapTypeControls: function () {
		    this.controls.map_type = this.addAControl(new OpenLayers.Control.LayerSwitcher({ 'ascending': false }));
		},

		removeMapTypeControls: function () {
		    this.removeAControl(this.controls.map_type);
		},

		addScaleControls: function () {
		    this.controls.scale = this.addAControl(new OpenLayers.Control.ScaleLine());
		},

		removeScaleControls: function () {
		    this.removeAControl(this.controls.scale);
		},

		addPanControls: function () {
		    this.controls.pan = this.addAControl(new OpenLayers.Control.PanPanel());
		},

		removePanControls: function () {
		    this.removeAControl(this.controls.pan);
		},

		addOverviewControls: function (zoomOffset) {
		    this.controls.pan = this.addAControl(new OpenLayers.Control.OverviewMap({
		            maximized: true,
		            mapoptions: {
		                projection: 'EPSG:4326',
		                crossorigin: 'anonymous'
		            }
		        }));
		},

		removeOverviewControls: function () {
		    this.removeAControl(this.controls.overview);
		},

		setCenterAndZoom: function(point, zoom) { 
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			map.setCenter(pt, zoom);
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

		setMapType: function (mapType) {
		    var i;
		    var name = null;

		    for (i = 0; i < this.defaultBaseMaps.length; i++) {
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
		    var fn = function (elem, index, array) {
		        if (elem === this.customBaseMaps[i].tileMap.prop_tilemap) {
		            layers.push(elem);
		        }
		    };

		    for (i = 0; i < this.customBaseMaps.length; i++) {
		        if (this.customBaseMaps[i].name === name) {
		            map.addLayer(this.customBaseMaps[i].tileMap.prop_tilemap, true);
		        }
		        else {
		            map.layers.forEach(fn, this);
		        }
		    }

		    for (i = 0; i < layers.length; i++) {
		        map.removeLayer(layers[i]);
		    }
		},

		getMapType: function () {
		    return this.currentMapType;
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

		addTileMap: function (tileMap) {
		    return tileMap.toProprietary(this.api);
		},

		getPixelRatio: function() {
			throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
		},

		mousePosition: function(element) {
			var map = this.maps[this.api];
			var locDisp = document.getElementById(element);
			if (locDisp !== null) {
				map.events.register('mousemove', map, function (evt) {
					var lonlat = map.getLonLatFromViewPortPx(evt.xy);
					var point = new mxn.LatLonPoint();
					point.fromProprietary(this.api, lonlat);
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

			position = this.location.toProprietary(this.api);
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
			this.openInfoBubble.fire( { 'marker': this } );
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
			delete this.proprietary_polyline.style.display;
			this.proprietary_polyline.layer.redraw();		
			},

		hide: function() {
			this.proprietary_polyline.style.display = 'none';
			this.proprietary_polyline.layer.redraw();		
		}
	},

	TileMap: {
	    addToMapTypeControl: function () {
	        if (this.proprietary_tilemap === null) {
	            throw new Error(this.api + ': A TileMap must be added to the map before calling addControl()');
	        }

	        if (!this.mxn.customBaseMaps[this.index].inControl) {
	            this.mxn.customBaseMaps[this.index].inControl = true;
	            this.mxn.layers[this.properties.options.label] = this.proprietary_tilemap;
	            if (this.mxn.controls.map_type !== null && typeof (this.mxn.controls.map_type) !== "undefined") {
	                this.mxn.maps[this.mxn.api].setBaseLayer(this.toProprietary());//this.proprietary_tilemap) ; //, this.properties.options.label);
	                if (this.mxn.controls.overview !== null && typeof (this.mxn.controls.overview) !== "undefined") {
	                    var zoomOffset = //TODO: Unused at present:   -this.mxn.controls.overview.options.zoomLevelOffset;
	                    this.mxn.removeOverviewControls();
	                    var that = this;
	                    setTimeout(function () { //Needs time for the basemap layer to be loaded, as the overview map deaults to use it.
	                        that.mxn.addOverviewControls(zoomOffset);
	                    }, 50);
	                }
	            }
	        }
	    },

	    removeFromMapTypeControl: function () {
	        if (this.proprietary_tilemap === null) {
	            throw new Error(this.api + ': A TileMap must be added to the map before calling removeControl()');
	        }

	        if (this.mxn.customBaseMaps[this.index].inControl) {
	            this.mxn.customBaseMaps[this.index].inControl = false;
	            delete this.mxn.layers[this.properties.options.label];
	            if (typeof (this.mxn.controls.map_type) !== "undefined") {
	                this.mxn.controls.map_type.removeLayer(this.proprietary_tilemap);
	            }
	        }
	    },

	    hide: function () {
	        if (this.proprietary_tilemap === null) {
	            throw new Error(this.api + ': A TileMap must be added to the map before calling hide()');
	        }

	        if (this.properties.type === mxn.Mapstraction.TileType.OVERLAY) {
	            if (this.mxn.overlayMaps[this.index].visible) {
	                this.mxn.overlayMaps[this.index].visible = false;
	                this.map.removeLayer(this.proprietary_tilemap);
	            }
	        }
	    },

	    show: function () {
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

	    toProprietary: function () {
	        var urls = null;
	        var url = mxn.util.sanitizeTileURL(this.properties.url);
	        url = url.replace(/\{/g, '\/${'); //ol2 seems to need this format to do substitutions: '/mqopen/${Z}/${X}/${Y}.jpeg'
	        var subdomains = this.properties.options.subdomains;

	        //TODO: This is duplicated in Leaflet, ol2, ol3 move it to utils.
            //TODO: Actually ol probably copes with the domain parameter
	        if (this.properties.options.subdomains !== null) {
	            var pos = url.search('{s}');
	            if (pos !== -1) {
	                var i = 0;
	                var domain;
	                urls = [];

	                for (i = 0; i < subdomains.length; i++) {
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

            //OSM Layer works better than XYZ Layer for what we are doing here.
	        var overlay = new OpenLayers.Layer.OSM(this.properties.options.label, urls || url);

	        if(!this.properties.opacity) {
	            overlay.addOptions({opacity: this.properties.opacity});
	        }

	        if(!this.properties.options.attribution) {
	            overlay.addOptions({ attribution: this.properties.attribution });
	        }
			
	        /* if(!map_type) {
	            overlay.addOptions({displayInLayerSwitcher: false, isBaseLayer: false});
	        } */
	        //map.addLayer(overlay);		
	        //this.tileLayers.push( [tile_url, overlay, true] );		

	        return overlay;
	    }
	}
});