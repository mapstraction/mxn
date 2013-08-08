//the require makes sure we have loaded all the modules we need.
require([
	"esri/map", 
	"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/layers/WebTiledLayer",
	"esri/graphic", "esri/dijit/OverviewMap", "esri/dijit/Scalebar", "esri/dijit/BasemapGallery",
	"dijit/form/Button", "dijit/Menu",
	"dojo/_base/Color", "dojo/dom", "dojo/on", "dojo/dom-construct", "dojo/_base/window", "dojo/dom-style", "dojo/domReady!"
  ], function(
			Map, 
			SimpleMarkerSymbol, SimpleLineSymbol, WebTiledLayer,
			Graphic, OverviewMap, Scalebar, BasemapGallery,
			Button, Menu,
			Color, dom, on, domConstruct, win, domStyle
		  ) {
mxn.register('esri', {

	Mapstraction: {
	
		init: function(element, api) {
			if (esri.version < 3.4) {
				throw new Error(api + ' map script version not high enough found  ' + esri.version);
			}
			
			var me = this;
			var map;
			
			this.layers = {};
			this.features = [];		
			this.controls =  {
				pan: null,
				zoom: null,
				overview: null,
				scale: null,
				map_type: null
			};

			this.maps[api] = map = new Map(element.id, {
			  basemap: "streets",
			  center: [-25.312, 34.307],
			  zoom: 3,
			  wrapAround180: true,
			  spatialReference: 4326
			});
			
			map.on("load", function() {					
				me.controls.overview = new esri.dijit.OverviewMap({map: map});			
				me.controls.overview.startup();	
				me.controls.scale = new Scalebar({
						map: map,
						attachTo: "bottom-left"
					});

				me.load.fire();
				me.loaded[api] = true;				
			});
			
			map.on("zoom-end", function() {
				me.changeZoom.fire();
			});
			
			map.on("pan-end", function() {
				me.endPan.fire();
			});
		},
	
		applyOptions: function(){
			if (this.options.enableScrollWheelZoom) {
				this.maps[this.api].enableScrollWheelZoom();
			} else {
				this.maps[this.api].disableScrollWheelZoom()
			}
			
			if (this.options.enableDragging) {
				this.maps[this.api].enablePan();
			} else {
				this.maps[this.api].disablePan();
			}
			
			return;
		},

		resizeTo: function(width, height){
			this.currentElement.style.width = width;
			this.currentElement.style.height = height;
			this.maps[this.api].resize();
			//TODO: recentre on original centre and fit
		},

		addControls: function(args) {
			var map = this.maps[this.api];

			if ('pan' in args && args.pan) {
				map.showPanArrows();
			} else {
				map.hidePanArrows();
			}

			if ('zoom' in args && (args.zoom == 'small' || args.zoom == 'large')) {
				this.addSmallControls();
			} else {
				map.hideZoomSlider();
			}
		
			if ('overview' in args && args.overview) {
				if (this.controls.overview !== null) {
					this.controls.overview.show();
				}
			}else {
				if (this.controls.overview !== null) {
					this.controls.overview.hide();
				}
			}
		
			if ('scale' in args && args.scale) {
				if (this.controls.scale !== null) {
					this.controls.scale.show();
				} 
			} else {
				if (this.controls.scale !== null) {
					this.controls.scale.hide();
				}
			}
		
			if ('map_type' in args && args.map_type) {
				if (this.controls.map_type === null) {
					this.addMapTypeControls();
				} else {
					domStyle.set("outerbasemapMenu", "display", "block"); //make sure it is showing
				}
			} else {
				if (this.controls.map_type !== null) {
					domStyle.set("outerbasemapMenu", "display", "none"); //hide it
					//this.controls.map_type.destroy();
					//this.controls.map_type = null;
				}
			}
		
		},

		addSmallControls: function() {
			var map = this.maps[this.api];
			map.showZoomSlider();
		},

		addLargeControls: function() {
			this.addSmallControls();
		},

		addMapTypeControls: function() {
			var map = this.maps[this.api];
			var me = this;

			if (this.controls.map_type === null) {
				if (typeof esri.dijit.BasemapGallery !== 'undefined') {
	
					var innerhtml = "<button id='dropdownButton' label='Basemaps' style='text-align: center;border: 2px solid #666666;background-color: #FFFFFF;color: #666666;' data-dojo-type='dijit.form.DropDownButton'><div data-dojo-type='dijit.Menu' id='basemapMenu'></div></button>"
					var outerbasemapMenu = domConstruct.create('div', { style:"position:absolute; right:50px; top:10px; z-Index:99;", innerHTML: innerhtml, id:"outerbasemapMenu" }, win.body(), "first");
					
					dojo.parser.parse();
					domStyle.set("outerbasemapMenu", "display", "none"); //hide it until its ready in the right place
					
					var basemapGallery = this.controls.map_type = new esri.dijit.BasemapGallery({
						showArcGISBasemaps: true,
						map: map
						});

					basemapGallery.on("load", function() {
						dojo.forEach(basemapGallery.basemaps, function(basemap) {            
							//Add a menu item for each basemap, when the menu items are selected
							switch(basemap.title) {
								case 'Streets':
								case 'Imagery':
								case 'Topographic':
								case 'Imagery with Labels':
									var ch = new dijit.MenuItem({
										label: basemap.title,
										onClick: dojo.hitch(this, function() {
											basemapGallery.select(basemap.id);
											switch(basemap.title) {
											case 'Streets':
												me.currentMapType = mxn.Mapstraction.ROAD;
												break;
											case 'Imagery':
												me.currentMapType = mxn.Mapstraction.SATELLITE;
												break;
											case 'Topographic':
												me.currentMapType = mxn.Mapstraction.PHYSICAL;
												break;
											case 'Imagery with Labels':
												me.currentMapType = mxn.Mapstraction.HYBRID;
												break;											
										  	default:
												break;
											}
										})
									  })
									
									ch.placeAt(dijit.byId('basemapMenu'), 'last');
								default:
									break;
							}

						  });
						dojo.place(dojo.byId('outerbasemapMenu'),dojo.byId('map_container'), 'first');
						domStyle.set("outerbasemapMenu", "display", "block");
					});
				}
			} else {
				domStyle.set("outerbasemapMenu", "display", "block"); //make sure it is showing
			}
		},

		setCenterAndZoom: function(point, zoom) { 
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			// FIXME: if this is called too soon on map loading then the extent is null.
			if(map.extent !== null) {
				map.centerAndZoom(pt, zoom);
			}
		},
	
		addMarker: function(marker, old) {
			var map = this.maps[this.api];
			var pin = marker.toProprietary(this.api);
			map.graphics.add(pin);
			return pin;
		},

		removeMarker: function(marker) {
			var map = this.maps[this.api];
			map.graphics.remove(marker.proprietary_marker);
		},
	
		declutterMarkers: function(opts) {
			throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
		},

		addPolyline: function(polyline, old) {
			var map = this.maps[this.api];
			polyline = polyline.toProprietary(this.api);
			map.graphics.add(polyline);

			this.features.push(polyline);
			return polyline;
		},

		removePolyline: function(polyline) {
			var map = this.maps[this.api];
			map.graphics.remove(polyline.proprietary_polyline);
			this.features.pop(polyline);
		},

		getCenter: function() {
			var map = this.maps[this.api];
			var pt = esri.geometry.webMercatorToGeographic(map.extent.getCenter());
			return new mxn.LatLonPoint(pt.y, pt.x);
		},

		setCenter: function(point, options) {
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			map.centerAt(pt);
		},

		setZoom: function(zoom) {
			var map = this.maps[this.api];
			map.centerAndZoom(map.extent.getCenter(), zoom);
		},
	
		getZoom: function() {
			var map = this.maps[this.api];
			return map.getLevel();
		},

		getZoomLevelForBoundingBox: function(bbox) {
			throw new Error('Mapstraction.getZoomLevelForBoundingBox is not currently supported by provider ' + this.api);
		},

		setMapType: function(type) {
			var basemapGallery = this.controls.map_type;
			if (! basemapGallery){
				return;
			}			
			dojo.forEach(basemapGallery.basemaps, function(basemap) {            
				switch(basemap.title) {
					case 'Streets':
						if (type === mxn.Mapstraction.ROAD) {
							basemapGallery.select(basemap.id);
							}					
						break;
					case 'Imagery':
						if (type === mxn.Mapstraction.SATELLITE) {
							basemapGallery.select(basemap.id);
							}
						break
					case 'Topographic':
						if (type === mxn.Mapstraction.PHYSICAL) {
							basemapGallery.select(basemap.id);
							}					
						break;
					case 'Imagery with Labels':
						if (type === mxn.Mapstraction.HYBRID) {
							basemapGallery.select(basemap.id);
							}					
						break;
					default:
						break;
				} 
			})
											
			this.currentMapType = type;
		},

		getMapType: function() {
			return this.currentMapType;
		},

		getBounds: function () {
			var map = this.maps[this.api];
			var box = esri.geometry.webMercatorToGeographic(map.extent);
			return new mxn.BoundingBox(box.ymin, box.xmin, box.ymax, box.xmax);
		},

		setBounds: function(bounds){
			var map = this.maps[this.api];
			var sw = bounds.getSouthWest();
			var ne = bounds.getNorthEast();
			var newBounds = new esri.geometry.Extent(sw.lon,sw.lat,ne.lon,ne.lat, new esri.SpatialReference({ wkid: 4326 }));
			map.setExtent(newBounds, true); 
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
			var esri_tile_url = tile_url.replace(/\{Z\}/gi, '\{level\}').replace(/\{X\}/gi, '\{col\}').replace(/\{Y\}/gi, '\{row\}').replace(/\{S\}/gi, '\{subDomain\}');
			var newlayer = new WebTiledLayer(esri_tile_url, {
			  "copyright": attribution,
			  "id": label,
			  "subDomains": subdomains
			});
			map.addLayer(newlayer);
			newlayer.setOpacity(opacity);
		},

		toggleTileLayer: function(tile_url) {
			throw new Error('Mapstraction.toggleTileLayer is not currently supported by provider ' + this.api);
		},

		getPixelRatio: function() {
			throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
		},
	
		mousePosition: function(element) {
			var map = this.maps[this.api];
			var locDisp = document.getElementById(element);
			if (locDisp !== null) {
				dojo.connect(map, "onMouseMove", function(evt){
					var loc = e.x.toFixed(4) + '/' + e.y.toFixed(4);
					locDisp.innerHTML = loc;
				});
				locDisp.innerHTML = '0.0000 / 0.0000';
			}
		}
	},

	LatLonPoint: {
	
		toProprietary: function() {
			return esri.geometry.geographicToWebMercator( new esri.geometry.Point(this.lon, this.lat, new esri.SpatialReference({ wkid: 4326 })));
		},

		fromProprietary: function(point) {
			this.lat = point.y;
			this.lon = point.x;
		}
	},

	Marker: {
	
		toProprietary: function() {
			var me = this;
			var iconUrl2 = this.iconUrl || "http://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png";
			var thisIcon = new esri.symbol.PictureMarkerSymbol(iconUrl2,25,25);

			if (me.iconSize) {
				thisIcon.setWidth(me.iconSize[0]);
				thisIcon.setHeight(me.iconSize[1]);
			}
			if (me.iconAnchor) {
				thisIcon.setOffset(me.iconAnchor[0], me.iconAnchor[1]);
			} else {
				thisIcon.setOffset([0,16]);
			}


			// FIXME: esri - add support for iconShadowUrl and iconShadowSize (ajturner)
			// if (me.iconShadowUrl) {
			// 	thisIcon = thisIcon.extend({
			// 		shadowUrl: me.iconShadowUrl
			// 	});
			// }
			// if (me.iconShadowSize) {
			// 	thisIcon = thisIcon.extend({
			// 		shadowSize: new L.Point(me.iconShadowSize[0], me.iconShadowSize[1])
			// 	});
			// }

			var marker = new esri.Graphic(this.location.toProprietary(this.api),thisIcon);
			return marker;
		},

		openBubble: function() {
			var pin = this.proprietary_marker;
			var map = this.mapstraction.maps[this.api];
		
			if(this.labelText) {
				map.infoWindow.setTitle(this.labelText);
			}

			if (this.infoBubble) {
				map.infoWindow.setContent(this.infoBubble);			
				map.infoWindow.show(pin.geometry);
			}
			this.openInfoBubble.fire( { 'marker': this } );
		},
	
		closeBubble: function() {
			var map = this.mapstraction.maps[this.api];
			map.infoWindow.hide();
			this.closeInfoBubble.fire( { 'marker': this } );
		},

		hide: function() {
			this.proprietary_marker.hide();
		},

		show: function() {
			this.proprietary_marker.show();
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
			var path = null;
			var fill = null;
			var i;
			var style = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color(this.color || "#FFFFFF"), this.width || 3);

			for (i = 0, length = this.points.length ; i < length; i+=1){
				coords.push([this.points[i].lon,this.points[i].lat]);
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
				var polycolor;
				var polycolor_rgba;
			
				polycolor = new mxn.util.Color();
				polycolor.setHexColor(this.fillColor);
				polycolor_rgba = [polycolor.red, polycolor.green, polycolor.blue, this.opacity];

				path = new esri.geometry.Polygon(new esri.SpatialReference({wkid:4326}));
				style = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, style, new dojo.Color(polycolor_rgba));	
				path.addRing(coords);
			} else {
				path = new esri.geometry.Polyline(new esri.SpatialReference({wkid:4326}));
				path.addPath(coords);
			}

			this.proprietary_polyline = new esri.Graphic(path,style);
			return this.proprietary_polyline;
		},
	
		show: function() {
			this.proprietary_polyline.show();
		},

		hide: function() {
			this.proprietary_polyline.hide();
		}
	}
});
});