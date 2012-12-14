mxn.register('google', {	

Mapstraction: {
	
	init: function(element,api) {		
		var me = this;

		if (typeof GMap2 === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		if (!GBrowserIsCompatible()) {
			throw new Error('This browser is not compatible with Google Maps');
		}

		this.controls =  {
			pan: null,
			zoom: null,
			overview: null,
			scale: null,
			map_type: null
		};
		
		this.maps[api] = new GMap2(element);

		GEvent.addListener(this.maps[api], 'click', function(marker,location) {
			
			if ( marker && marker.mapstraction_marker ) {
				marker.mapstraction_marker.click.fire();
			}
			else if ( location ) {
				me.click.fire({'location': new mxn.LatLonPoint(location.y, location.x)});
			}
			
			// If the user puts their own Google markers directly on the map
			// then there is no location and this event should not fire.
			if ( location ) {
				me.clickHandler(location.y,location.x,location,me);
			}
		});

		GEvent.addListener(this.maps[api], 'moveend', function() {
			me.moveendHandler(me);
			me.endPan.fire();
		});
		
		GEvent.addListener(this.maps[api], 'zoomend', function() {
			me.changeZoom.fire();
		});
		
		var loadListener = GEvent.addListener(this.maps[api], 'tilesloaded', function() {
			me.load.fire();
			GEvent.removeListener(loadListener);
		});
		
		this.loaded[api] = true;
		me.load.fire();
	},
	
	applyOptions: function(){
		var map = this.maps[this.api];
		
		if(this.options.enableScrollWheelZoom){
			map.enableContinuousZoom();
			map.enableScrollWheelZoom();
		}
		
		if (this.options.enableDragging) {
			map.enableDragging();
		} else {
			map.disableDragging();
		}
		
	},

	resizeTo: function(width, height){	
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		this.maps[this.api].checkResize(); 
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
	
		if ('zoom' in args || ('pan' in args && args.pan)) {
			if (args.pan || args.zoom == 'small') {
				this.addSmallControls();
			}
			
			else if (args.zoom == 'large') {
				this.addLargeControls();
			}
		}
		
		else {
			if (this.controls.zoom !== null) {
				map.removeControl(this.controls.zoom);
				this.controls.zoom = null;
			}
		}
		
		if ('overview' in args && args.overview) {
			if (this.controls.overview === null) {
				this.controls.overview = new GOverviewMapControl();
				map.addControl(this.controls.overview);
			}
		}
		
		else {
			if (this.controls.overview !== null) {
				map.removeControl(this.controls.overview);
				this.controls.overview = null;
			}
		}

		if ('scale' in args && args.scale) {
			if (this.controls.scale === null) {
				this.controls.scale = new GScaleControl();
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
		
		if (this.controls.zoom !== null) {
			map.removeControl(this.controls.zoom);
		}

		this.controls.zoom = new GSmallMapControl();
		map.addControl(this.controls.zoom);
	},

	addLargeControls: function() {
		var map = this.maps[this.api];
		
		if (this.controls.zoom !== null) {
			map.removeControl(this.controls.zoom);
		}

		this.controls.zoom = new GLargeMapControl();
		map.addControl(this.controls.zoom);
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];

		if (this.controls.map_type === null) {
			this.controls.map_type = new GMapTypeControl();
			map.addControl(this.controls.map_type);
		}
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setCenter(pt, zoom); 
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var gpin = marker.toProprietary(this.api);
		map.addOverlay(gpin);
		
		GEvent.addListener(gpin, 'infowindowopen', function() {
			marker.openInfoBubble.fire();
		});
		GEvent.addListener(gpin, 'infowindowclose', function() {
			marker.closeInfoBubble.fire();
		});		
		return gpin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		map.removeOverlay(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw 'Not supported';
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		gpolyline = polyline.toProprietary(this.api);
		map.addOverlay(gpolyline);
		return gpolyline;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		map.removeOverlay(polyline.proprietary_polyline);
	},

	getCenter: function() {
		var map = this.maps[this.api];
		var pt = map.getCenter();
		var point = new mxn.LatLonPoint(pt.lat(),pt.lng());
		return point;
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		if(options && options.pan) { 
			map.panTo(pt); 
		}
		else { 
			map.setCenter(pt);
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

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
		// NE and SW points from the bounding box.
		var ne = bbox.getNorthEast();
		var sw = bbox.getSouthWest();
		var gbox = new GLatLngBounds( sw.toProprietary(this.api), ne.toProprietary(this.api) );
		var zoom = map.getBoundsZoomLevel( gbox );
		return zoom;
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		switch(type) {
			case mxn.Mapstraction.ROAD:
				map.setMapType(G_NORMAL_MAP);
				break;
			case mxn.Mapstraction.SATELLITE:
				map.setMapType(G_SATELLITE_MAP);
				break;
			case mxn.Mapstraction.HYBRID:
				map.setMapType(G_HYBRID_MAP);
				break;
			case mxn.Mapstraction.PHYSICAL:
				map.setMapType(G_PHYSICAL_MAP);
				break;
			default:
				map.setMapType(type || G_NORMAL_MAP);
		}	 
	},

	getMapType: function() {
		var map = this.maps[this.api];
		var type = map.getCurrentMapType();
		switch(type) {
			case G_NORMAL_MAP:
				return mxn.Mapstraction.ROAD;
			case G_SATELLITE_MAP:
				return mxn.Mapstraction.SATELLITE;
			case G_HYBRID_MAP:
				return mxn.Mapstraction.HYBRID;
			case G_PHYSICAL_MAP:
				return mxn.Mapstraction.PHYSICAL;
			default:
				return null;
		}
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var ne, sw, nw, se;
		var gbox = map.getBounds();
		sw = gbox.getSouthWest();
		ne = gbox.getNorthEast();
		return new mxn.BoundingBox(sw.lat(), sw.lng(), ne.lat(), ne.lng());
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
		var gbounds = new GLatLngBounds(new GLatLng(sw.lat,sw.lon),new GLatLng(ne.lat,ne.lon));
		map.setCenter(gbounds.getCenter(), map.getBoundsZoomLevel(gbounds)); 
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
		map.getPane(G_MAP_MAP_PANE).appendChild(oContext.imgElm);
		this.setImageOpacity(id, opacity);
		this.setImagePosition(id);
		GEvent.bind(map, "zoomend", this, function() {
			this.setImagePosition(id);
		});
		GEvent.bind(map, "moveend", this, function() {
			this.setImagePosition(id);
		});
	},

	setImagePosition: function(id, oContext) {
		var map = this.maps[this.api];
		var topLeftPoint; var bottomRightPoint;

		topLeftPoint = map.fromLatLngToDivPixel( new GLatLng(oContext.latLng.top, oContext.latLng.left) );
		bottomRightPoint = map.fromLatLngToDivPixel( new GLatLng(oContext.latLng.bottom, oContext.latLng.right) );
		
		oContext.pixels.top = topLeftPoint.y;
		oContext.pixels.left = topLeftPoint.x;
		oContext.pixels.bottom = bottomRightPoint.y;
		oContext.pixels.right = bottomRightPoint.x;
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];
		var geoXML = new GGeoXml(url);
		if(autoCenterAndZoom) {
			GEvent.addListener( geoXML, 'load', function() { geoXML.gotoDefaultViewport(map); } );
		}
		map.addOverlay(geoXML);
	},

	addTileLayer: function(tile_url, opacity, copyright_text, min_zoom, max_zoom, map_type) {
		var copyright = new GCopyright(1, new GLatLngBounds(new GLatLng(-90,-180), new GLatLng(90,180)), 0, "copyleft");
		var copyrightCollection = new GCopyrightCollection(copyright_text);
		copyrightCollection.addCopyright(copyright);
		var tilelayers = [];
		tilelayers[0] = new GTileLayer(copyrightCollection, min_zoom, max_zoom);
		tilelayers[0].isPng = function() {
			return true;
		};
		tilelayers[0].getOpacity = function() {
			return opacity;
		};
		tilelayers[0].getTileUrl = function (a, b) {
			url = tile_url;
			url = url.replace(/\{Z\}/g,b);
			url = url.replace(/\{X\}/g,a.x);
			url = url.replace(/\{Y\}/g,a.y);
			return url;
		};
		if(map_type) {
			var tileLayerOverlay = new GMapType(tilelayers, new GMercatorProjection(19), copyright_text, {
				errorMessage:"More "+copyright_text+" tiles coming soon"
			});		
			this.maps[this.api].addMapType(tileLayerOverlay);
		} else {
			tileLayerOverlay = new GTileLayerOverlay(tilelayers[0]);
			this.maps[this.api].addOverlay(tileLayerOverlay);
		}		
		this.tileLayers.push( [tile_url, tileLayerOverlay, true] );
		return tileLayerOverlay;
	},

	toggleTileLayer: function(tile_url) {
		for (var f=0; f<this.tileLayers.length; f++) {
			if(this.tileLayers[f][0] == tile_url) {
				if(this.tileLayers[f][2]) {
					this.maps[this.api].removeOverlay(this.tileLayers[f][1]);
					this.tileLayers[f][2] = false;
				}
				else {
					this.maps[this.api].addOverlay(this.tileLayers[f][1]);
					this.tileLayers[f][2] = true;
				}
			}
		}	   
	},

	getPixelRatio: function() {
		var map = this.maps[this.api];

		var projection = G_NORMAL_MAP.getProjection();
		var centerPoint = map.getCenter();
		var zoom = map.getZoom();
		var centerPixel = projection.fromLatLngToPixel(centerPoint, zoom);
		// distance is the distance in metres for 5 pixels (3-4-5 triangle)
		var distancePoint = projection.fromPixelToLatLng(new GPoint(centerPixel.x + 3, centerPixel.y + 4), zoom);
		//*1000(km to m), /5 (pythag), *2 (radius to diameter)
		return 10000/distancePoint.distanceFrom(centerPoint);
	
	},
	
	mousePosition: function(element) {
		var locDisp = document.getElementById(element);
		if (locDisp !== null) {
			var map = this.maps[this.api];
			GEvent.addListener(map, 'mousemove', function (point) {
				var loc = point.lat().toFixed(4) + ' / ' + point.lng().toFixed(4);
				locDisp.innerHTML = loc;
			});
			locDisp.innerHTML = '0.0000 / 0.0000';
		}
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return new GLatLng(this.lat,this.lon);
	},

	fromProprietary: function(googlePoint) {
		this.lat = googlePoint.lat();
		this.lon = googlePoint.lng();
	}
	
},

Marker: {
	
	toProprietary: function() {
		var me = this;
		var infoBubble, event_action, infoDiv, div;
		var options = {};
		if (this.labelText) {
			options.title =  this.labelText;
		}
		if (this.iconUrl) {
			var icon = new GIcon(G_DEFAULT_ICON, this.iconUrl);
			icon.printImage = icon.mozPrintImage = icon.image;
			if (this.iconSize) {
				icon.iconSize = new GSize(this.iconSize[0], this.iconSize[1]);
				var anchor;
				if (this.iconAnchor) {
					anchor = new GPoint(this.iconAnchor[0], this.iconAnchor[1]);
				}
				else {
					// FIXME: hard-coding the anchor point
					anchor = new GPoint(this.iconSize[0]/2, this.iconSize[1]/2);
				}
				icon.iconAnchor = anchor;
			}
			if (typeof(this.iconShadowUrl) != 'undefined') {
				icon.shadow = this.iconShadowUrl;
				if(this.iconShadowSize) {
					icon.shadowSize = new GSize(this.iconShadowSize[0], this.iconShadowSize[1]);
				}
			} 
			else {  // turn off shadow
  				icon.shadow = '';
				icon.shadowSize = '';
			}
			if (this.transparent) {
  				icon.transparent = this.transparent;
			}
			if (this.imageMap) {
  				icon.imageMap = this.imageMap;
			}
			options.icon = icon;
		}
		if (this.draggable) {
			options.draggable = this.draggable;
		}
		var gmarker = new GMarker( this.location.toProprietary('google'),options);
				
		if (this.infoBubble) {
			if (this.hover) {
				event_action = "mouseover";
			}
			else {
				event_action = "click";
			}
			GEvent.addListener(gmarker, event_action, function() {
				gmarker.openInfoWindowHtml(me.infoBubble, {
					maxWidth: 100
				});
			});
		}

		if (this.hoverIconUrl) {
			GEvent.addListener(gmarker, "mouseover", function() {
				gmarker.setImage(me.hoverIconUrl);
			});
			GEvent.addListener(gmarker, "mouseout", function() {
				gmarker.setImage(me.iconUrl);
			});
		}

		if (this.infoDiv) {
			if (this.hover) {
				event_action = "mouseover";
			}
			else {
				event_action = "click";
			}
			GEvent.addListener(gmarker, event_action, function() {
				document.getElementById(me.div).innerHTML = me.infoDiv;
			});
		}

		return gmarker;
	},

	openBubble: function() {
		var gpin = this.proprietary_marker;
		gpin.openInfoWindowHtml(this.infoBubble);
	},
	
	closeBubble: function() {
		var gpin = this.proprietary_marker;
		gpin.closeInfoWindow();
	},

	hide: function() {
		this.proprietary_marker.hide();
	},

	show: function() {
		this.proprietary_marker.show();
	},

	update: function() {
		point = new mxn.LatLonPoint();
		point.fromProprietary('google', this.proprietary_marker.getPoint());
		this.location = point;
	}
	
},

Polyline: {

	toProprietary: function() {
		var gpoints = [];
		for (var i = 0,  length = this.points.length ; i< length; i++){
			gpoints.push(this.points[i].toProprietary('google'));
		}
		if (this.closed	|| gpoints[0].equals(gpoints[length-1])) {
			return new GPolygon(gpoints, this.color, this.width, this.opacity, this.fillColor || "#5462E3", this.opacity || "0.3");
		} else {
			return new GPolyline(gpoints, this.color, this.width, this.opacity);
		}
	},
	
	show: function() {
		throw 'Not implemented';
	},

	hide: function() {
		throw 'Not implemented';
	}
}

});
