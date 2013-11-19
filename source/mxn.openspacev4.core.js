mxn.register('openspacev4', {

Mapstraction: {

	init: function(element, api, properties) {
		var me = this;
		var map;
		
		if (typeof OpenLayers === 'undefined') {
			throw new Error('OpenLayers is not loaded but is required to work with OpenSpace');
		}
		
		if (typeof OpenSpace.Map === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		this.layers = {};

		this.currentMapType = mxn.Mapstraction.ROAD;

		this.defaultBaseMaps = [
            {
                maxZoom: 10, //OS Tiles only available down to zoom 10
                mxnType: mxn.Mapstraction.ROAD,
                providerType: 'mxn.BaseMapProviders.MapQuestOpen', //TODO: Set this to the OS Map! OpenSpace.Layer.WMS_19?
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
            controls: [],
            centreInfoWindow: false,
            projection: 'EPSG:27700', //EPSG:4326 isnt supported on OS Tiles yet
		    crossOriginKeyword: null
		};

		var hasOptions = (typeof properties !== 'undefined' && properties !== null);
		if (hasOptions) {
		    if (properties.hasOwnProperty('center') && null !== properties.center) {
		        options.center = properties.center.toProprietary(this.api);
		    }

		    if (properties.hasOwnProperty('map_type') && null !== properties.map_type) {
		        this.currentMapType = properties.map_type;
		    }

		    var defaultMap = this.getDefaultBaseMap(this.currentMapType);
		    if (defaultMap !== null) {
		        var baselayer = this.getCustomBaseMap(defaultMap.providerType);
		        //options.layers = [baselayer.tileMap.prop_tilemap];
		    }

		    if (properties.hasOwnProperty('zoom') && null !== properties.zoom) {
		        options.zoom = properties.zoom;
		    }

		    if (properties.hasOwnProperty('dragging') && null !== properties.dragging) {
		        options.dragging = properties.dragging;
		    }

		    if (properties.hasOwnProperty('scroll_wheel') && null !== properties.scroll_wheel) {
		        options.scrollWheelZoom = properties.scroll_wheel;
		    }

		    if (properties.hasOwnProperty('double_click') && null !== properties.double_click) {
		        options.doubleClickZoom = properties.double_click;
		    }
		}

		// create the map with no controls and don't centre popup info window
		map = new OpenSpace.Map(element, options);

		// note that these four controls are always there 
		// enable map drag with mouse and keyboard

		this.controls.navigation = new OpenLayers.Control.Navigation();
		map.addControl(this.controls.navigation);
		this.controls.keyboard = new OpenLayers.Control.KeyboardDefaults();
		map.addControl(this.controls.keyboard);

		// include Openspace copyright statements
		this.controls.attribution = new OpenSpace.Control.CopyrightCollection();
		map.addControl(this.controls.attribution);
		this.controls.logo = new OpenSpace.Control.PoweredBy();
		map.addControl(this.controls.logo);

		this.maps[api] = map;

		if (hasOptions && properties.hasOwnProperty('controls') && null !== properties.controls) {
		    me.addControls(properties.controls);
		}

		map.events.register(
			"click", 
			map,
			function(evt) {
				var point = this.getLonLatFromViewPortPx( evt.xy );
				// convert to LatLonPoint
				var llPoint = new mxn.LatLonPoint();
				llPoint.fromProprietary(me.api, point);
				me.clickHandler( llPoint.lat, llPoint.lon );
				return false;
			}
		);
		
		var loadfire = function(e) {
			me.load.fire();
			this.events.unregister('loadend', this, loadfire);
		};
		
		for (var layerName in map.layers) {
			if (map.layers.hasOwnProperty(layerName)) {
				if (map.layers[layerName].visibility === true) {
					map.layers[layerName].events.register('loadend', map.layers[layerName], loadfire);
				}
			}
		}
		
		map.events.register('zoomend', map, function(evt) {
			me.changeZoom.fire();
		});
		
		map.events.register('moveend', map, function(evt) {
			me.moveendHandler(me);
			me.endPan.fire();
		});
		
		this.loaded[api] = true;
	},
	
	getVersion: function() {
		return OpenSpace.VERSION_NUMBER;
	},
	
	enableScrollWheelZoom: function () {
	    this.controls.navigation.enableZoomWheel();
	},

	disableScrollWheelZoom: function () {
	    this.controls.navigation.disableZoomWheel();
	},

	enableDragging: function () {
	    this.controls.navigation.activate();
	},

	disableDragging: function () {
	    this.controls.navigation.deactivate();  //TODO: what is document.drag on navigation control?
	},

	resizeTo: function(width, height){
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		this.maps[this.api].updateSize();
	},

    //TODO: See notes for addSmallControls and addLargeControls for why we suppress
    // the PanPanel if the 'zoom' arg is set ...
    //if ('pan' in args && args.pan && ((!'zoom' in args) || ('zoom' in args && args.zoom == 'small'))) {

	addControl: function (control) {
	    var map = this.maps[this.api];
	    if (control !== null && typeof (control) !== "undefined" && !control.active) { 
	        map.addControl(control);
	    }
	    return control;
	},

	removeControl: function (control) {
	    var map = this.maps[this.api];
	    if (control !== null && typeof (control) !== "undefined" && control.active) {
	        control.deactivate();
	        map.removeControl(control);
	    }
	},

	addSmallControls: function() {
	    this.removeSmallControls();
	    this.controls.zoom = this.addControl(new OpenSpace.Control.SmallMapControl());
	},

	removeSmallControls: function () {
	    this.removeControl(this.controls.zoom);
	},

	addLargeControls: function() {
	    this.removeLargeControls();
	    this.controls.zoom = this.addControl(new OpenSpace.Control.LargeMapControl());
	},

	removeLargeControls: function () {
	    this.removeControl(this.controls.zoom);
	},

	addMapTypeControls: function () {
	    this.controls.map_type = this.addControl(new OpenLayers.Control.LayerSwitcher({ 'ascending': false }));
	},

	removeMapTypeControls: function () {
	    this.removeControl(this.controls.map_type);
	},

	addScaleControls: function () {
	    this.controls.scale = this.addControl(new OpenLayers.Control.ScaleLine());
	},

	removeScaleControls: function () {
	    this.removeControl(this.controls.scale);
	},

	addPanControls: function () {
        //pan is handled by using the large zoom controls
	    this.addLargeControls();
	},

	removePanControls: function () {
	    //pan is handled by using the large zoom controls
	    this.addSmallControls();
	},

	addOverviewControls: function (zoomOffset) {
	    this.controls.overview = this.addControl(new OpenSpace.Control.OverviewMap({
	        maximized: true,
	        mapoptions: {
	            crossOriginKeyword: null
	        }
	    }));
	},

	removeOverviewControls: function () {
	    this.removeControl(this.controls.overview);
	},
		
	setCenterAndZoom: function(point, zoom) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
	
		var oszoom = zoom-6;
		if (oszoom<0) {
			oszoom = 0;
		}
		else if (oszoom>10) {
			oszoom = 10;
		}
		map.setCenter(pt, oszoom, false, false);
	},
	
	addMarker: function(marker, old) {
		var pin = marker.toProprietary(this.api);

		// Fire 'click' event for Marker ...
		pin.events.register('click', marker, function(event) {
			marker.click.fire();
		});
		
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		
		map.removeMarker(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw new Error('Mapstraction.declutterMarkers is not currently supported by provider ' + this.api);
	},
	
	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var pl = polyline.toProprietary(this.api);

		map.getVectorLayer().addFeatures([pl]);

		return pl;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		var pl = polyline.proprietary_polyline;

		map.removeFeatures([pl]);
	},
	
	getCenter: function() {
		var map = this.maps[this.api];
	
		var pt = map.getCenter(); // an OpenSpace.MapPoint, National Grid
		var gridProjection = new OpenSpace.GridProjection();
		var center = gridProjection.getLonLatFromMapPoint(pt);
		return new mxn.LatLonPoint(center.lat, center.lon);
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setCenter(pt);
	},
	
	setZoom: function(zoom) {
		var map = this.maps[this.api];
	
		var oszoom = zoom-6;
		if (oszoom<0) {
			oszoom = 0;
	}
	else if (oszoom>10) {
			oszoom = 10;
	}
	map.zoomTo(oszoom);
	
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		var zoom;
	
		zoom = map.zoom + 6;  // convert to equivalent google zoom
	
		return zoom;
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
		// NE and SW points from the bounding box.
		var ne = bbox.getNorthEast();
		var sw = bbox.getSouthWest();
		var zoom;
	
		var obounds = new OpenSpace.MapBounds();
		obounds.extend(new mxn.LatLonPoint(sw.lat,sw.lon).toProprietary(this.api));
		obounds.extend(new mxn.LatLonPoint(ne.lat,ne.lon).toProprietary(this.api));
		zoom = map.getZoomForExtent(obounds) + 6; // get it and adjust to equivalent google zoom
	
		return zoom;
	},

	setMapType: function(type) {
		//TODO:
	},

	getMapType: function () {
	    return this.currentMapType;
	},

	getBounds: function () {
		var map = this.maps[this.api];

		// array of openspace coords	
		// left, bottom, right, top
		var olbox = map.calculateBounds().toArray(); 
		var ossw = new OpenSpace.MapPoint( olbox[0], olbox[1] );
		var osne = new OpenSpace.MapPoint( olbox[2], olbox[3] );
		// convert to LatLonPoints
		var sw = new mxn.LatLonPoint();
		sw.fromProprietary(this.api, ossw);
		var ne = new mxn.LatLonPoint();
		ne.fromProprietary(this.api, osne);
		return new mxn.BoundingBox(sw.lat, sw.lon, ne.lat, ne.lon);
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
	
		var obounds = new OpenSpace.MapBounds();
		obounds.extend(new mxn.LatLonPoint(sw.lat,sw.lon).toProprietary(this.api));
		obounds.extend(new mxn.LatLonPoint(ne.lat,ne.lon).toProprietary(this.api));
		map.zoomToExtent(obounds);	
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		throw new Error('Mapstraction.addImageOverlay is not currently supported by provider ' + this.api);
	},

	setImagePosition: function(id, oContext) {
		throw new Error('Mapstraction.setImagePosition is not currently supported by provider ' + this.api);
	},

	addOverlay: function(url, autoCenterAndZoom) {
		throw new Error('Mapstraction.addOverlay is not currently supported by provider ' + this.api);
	},

	addTileMap: function (tileMap) {
	    return tileMap.toProprietary(this.api);
	},

	getPixelRatio: function() {
		throw new Error('Mapstraction.getPixelRatio is not currently supported by provider ' + this.api);
	},

	mousePosition: function(element) {
		var map = this.maps[this.api];

		locDisp = document.getElementById(element);
		if (locDisp !== null) {
			map.events.register('mousemove', map, function (e) {
				var lonLat = map.getLonLatFromViewPortPx(e.xy);
				var mouseLL = new mxn.LatLonPoint();
				mouseLL.fromProprietary(this.api, lonLat);
				var loc = parseFloat(mouseLL.lat).toFixed(4) + ' / ' + parseFloat(mouseLL.lon).toFixed(4);
				locDisp.innerHTML = loc;
			});
		}
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		var lonlat = new OpenLayers.LonLat(this.lon, this.lat);
		// need to convert to UK national grid
		var gridProjection = new OpenSpace.GridProjection();
		return gridProjection.getMapPointFromLonLat(lonlat); 
		// on OpenSpace.MapPoint
	
	},
	
	fromProprietary: function(osPoint) {
		var gridProjection = new OpenSpace.GridProjection();
		var olpt = gridProjection.getLonLatFromMapPoint(osPoint); 
		// an OpenLayers.LonLat
		this.lon = olpt.lon;
		this.lat = olpt.lat;
	}
},

Marker: {
	
	toProprietary: function() {
		var loc = this.location.toProprietary(this.api);
		var size, anchor, icon;
		
		if(this.iconSize) {
			size = new OpenLayers.Size(this.iconSize[0],this.iconSize[1]);
		}
		else {
			size = new OpenLayers.Size(20,25);
		}
	
		if(this.iconAnchor) {
			anchor = new OpenLayers.Pixel(-this.iconAnchor[0],-this.iconAnchor[1]);
		}
		else {
			//hard-coding the anchor point, if none provided
			anchor = new OpenLayers.Pixel(-(size.w/2), -size.h);
		}
	
		if(this.iconUrl || this.htmlContent) {
			//html content relies on the anchor point
			icon = new OpenSpace.Icon(this.iconUrl, size, anchor);
		}

		var marker = this.map.createMarker(loc, icon);
				
		if (this.htmlContent) {
             marker.icon.imageDiv.innerHTML = this.htmlContent;
		}
		
		return marker;
	},

	openBubble: function() {
		this.map.openInfoWindow(this.proprietary_marker.icon, this.location.toProprietary(this.api), this.infoBubble, new OpenLayers.Size(300, 100));
		this.map.infoWindow.autoSize = true;
		this.openInfoBubble.fire( { 'marker': this } );
	},
	
	closeBubble: function() {
		this.map.closeInfoWindow();
		this.closeInfoBubble.fire( { 'marker': this } );		
	},

	hide: function() {
		this.proprietary_marker.display(false);
	},
	
	show: function() {
		this.proprietary_marker.display(true);
	},
	
	update: function() {
		throw new Error('Mapstraction.update is not currently supported by provider ' + this.api);
	}
},

Polyline: {

	toProprietary: function() {
		var coords = [];

		for (var i = 0, length = this.points.length ; i< length; i++){
			// convert each point to OpenSpace.MapPoint
			var ospoint = this.points[i].toProprietary(this.api);
			coords.push(new OpenLayers.Geometry.Point(ospoint.getEasting(),ospoint.getNorthing()));
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
			this.proprietary_polyline = new OpenLayers.Feature.Vector(
				new OpenLayers.Geometry.LinearRing(coords), 
				null,
				{
					fillColor: this.fillColor,
					strokeColor: this.color,
					strokeOpacity: this.opacity,
					fillOpacity: this.opacity,
					strokeWidth: this.width
				}
			);
		}
		else {
			this.proprietary_polyline = new OpenLayers.Feature.Vector(
				new	OpenLayers.Geometry.LineString(coords),
				null, 
				{
					fillColor: this.fillColor,
					strokeColor: this.color,
					strokeOpacity: this.opacity,
					fillOpacity: this.opacity,
					strokeWidth: this.width
				}
			);
		}

		return this.proprietary_polyline;
	},
	
	show: function() {
		delete this.proprietary_polyline.style.display;
		this.proprietary_polyline.layer.redraw();		
	},
	
	hide: function() {
		this.proprietary_polyline.style.display = "none";
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