mxn.register('google', {	

Mapstraction: {
	
	init: function(element,api) {		
		var me = this;
		if (GMap2) {
			if (GBrowserIsCompatible()) {
				this.maps[api] = new GMap2(element);

				GEvent.addListener(this.maps[api], 'click', function(marker,location) {
					// If the user puts their own Google markers directly on the map
					// then there is no location and this event should not fire.
					if ( location ) {
						me.clickHandler(location.y,location.x,location,me);
						
					}
				});

				GEvent.addListener(this.maps[api], 'moveend', function() {
					me.moveendHandler(me);
					var point = me.getCenter();
					me.endPan.fire({center: point});
				});
				this.loaded[api] = true;
			}
			else {
				alert('browser not compatible with Google Maps');
			}
		}
		else {
			alert(api + ' map script not imported');
		}	  
	},
	
	applyOptions: function(){
	
		if(this.options.enableScrollWheelZoom){
			map.enableContinuousZoom();
			map.enableScrollWheelZoom();
		}
		
	},

	resizeTo: function(width, height){	
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		this.maps[this.api].checkResize(); 
	},

	addControls: function( args ) {

		var map = this.maps[this.api];

		this.addControlsArgs = args;
	
		//remove old controls
		if (this.controls) {
			while ((ctl = this.controls.pop())) {
				map.removeControl(ctl);
			}
		}
		else {
			this.controls = [];
		}
		c = this.controls;

		// Google has a combined zoom and pan control.
		if (args.zoom || args.pan) {
			if (args.zoom == 'large') {
				c.unshift(new GLargeMapControl());
				map.addControl(c[0]);
			} else {
				c.unshift(new GSmallMapControl());
				map.addControl(c[0]);
			}
		}
		if (args.scale) {
			c.unshift(new GScaleControl()); map.addControl(c[0]);
		}
		
		if (args.overview) {
			c.unshift(new GOverviewMapControl()); map.addControl(c[0]);
		}
		if (args.map_type) {
			c.unshift(new GMapTypeControl()); map.addControl(c[0]);
		} 
	},

	addSmallControls: function() {
		var map = this.maps[this.api];
		map.addControl(new GSmallMapControl());
		this.addControlsArgs.zoom = 'small';
	},

	addLargeControls: function() {
		var map = this.maps[this.api];
		map.addControl(new GMapTypeControl());
		map.addControl(new GOverviewMapControl()) ;
		this.addControlsArgs.overview = true;
		this.addControlsArgs.map_type = true;
		map.addControl(new GLargeMapControl());
		map.addControl(new GScaleControl()) ;
		this.addControlsArgs.pan = true;
		this.addControlsArgs.zoom = 'large';
		this.addControlsArgs.scale = true;			  
	},

	addMapTypeControls: function() {
		var map = this.maps[this.api];
		map.addControl(new GMapTypeControl());  
	},

	dragging: function(on) {
		var map = this.maps[this.api];
		if (on) {
			map.enableDragging();
		} else {
			map.disableDragging();
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
		return gpin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		map.removeOverlay(marker.proprietary_marker);
	},

	removeAllMarkers: function() {
		var map = this.maps[this.api];
		// got a feeling this doesn't only delete markers FIXME
		map.clearOverlays();
	},
	
	declutterMarkers: function(opts) {
		var map = this.maps[this.api];
		// No implementation for google, MarkerManager?
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
		if(options && options['pan']) 
		{ 
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
			default:
				map.setMapType(G_NORMAL_MAP);
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

	setImagePosition: function(id) {
	   
		var map = this.maps[this.api];
		var x = document.getElementById(id);
		var d; var e;

		d = map.fromLatLngToDivPixel(new GLatLng(x.getAttribute('north'), x.getAttribute('west')));
		e = map.fromLatLngToDivPixel(new GLatLng(x.getAttribute('south'), x.getAttribute('east')));

		x.style.top = d.y.toString() + 'px';
		x.style.left = d.x.toString() + 'px';
		x.style.width = (e.x - d.x).toString() + 'px';
		x.style.height = (e.y - d.y).toString() + 'px';
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];
		var geoXML = new GGeoXml(url);
		map.addOverlay(geoXML, function() {
			if(autoCenterAndZoom) {
				geoXML.gotoDefaultViewport(map);
			}
		});
	},

	addTileLayer: function(tile_url, opacity, copyright_text, min_zoom, max_zoom) {
		
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
			url = url.replace(/\{Z\}/,b);
			url = url.replace(/\{X\}/,a.x);
			url = url.replace(/\{Y\}/,a.y);
			return url;
		};
		tileLayerOverlay = new GTileLayerOverlay(tilelayers[0]);

		this.tileLayers.push( [tile_url, tileLayerOverlay, true] );
		this.maps[this.api].addOverlay(tileLayerOverlay);
		
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
		if (locDisp != null) {
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
		var options = {};
		if(this.labelText){
			options.title =  this.labelText;
		}
		if(this.iconUrl){
			var icon = new GIcon(G_DEFAULT_ICON, this.iconUrl);
			icon.printImage = icon.mozPrintImage = icon.image;
			if(this.iconSize) {
				icon.iconSize = new GSize(this.iconSize[0], this.iconSize[1]);
				var anchor;
				if(this.iconAnchor) {
					anchor = new GPoint(this.iconAnchor[0], this.iconAnchor[1]);
				}
				else {
					// FIXME: hard-coding the anchor point
					anchor = new GPoint(this.iconSize[0]/2, this.iconSize[1]/2);
				}
				icon.iconAnchor = anchor;
			}
			if(this.iconShadowUrl) {
				icon.shadow = this.iconShadowUrl;
				if(this.iconShadowSize) {
					icon.shadowSize = new GSize(this.iconShadowSize[0], this.iconShadowSize[1]);
				}
			}
			options.icon = icon;
		}
		if(this.draggable){
			options.draggable = this.draggable;
		}
		var gmarker = new GMarker( this.location.toProprietary('google'),options);

		if(this.infoBubble){
			var theInfo = this.infoBubble;
			var event_action;
			if(this.hover) {
				event_action = "mouseover";
			}
			else {
				event_action = "click";
			}
			GEvent.addListener(gmarker, event_action, function() {
				gmarker.openInfoWindowHtml(theInfo, {
					maxWidth: 100
				});
			});
		}

		if(this.hoverIconUrl){
			GEvent.addListener(gmarker, "mouseover", function() {
				gmarker.setImage(this.hoverIconUrl);
			});
			GEvent.addListener(gmarker, "mouseout", function() {
				gmarker.setImage(this.iconUrl);
			});
		}

		if(this.infoDiv){
			var theInfo = this.infoDiv;
			var div = this.div;
			var event_action;
			if(this.hover) {
				event_action = "mouseover";
			}
			else {
				event_action = "click";
			}
			GEvent.addListener(gmarker, event_action, function() {
				document.getElementById(div).innerHTML = theInfo;
			});
		}

		return gmarker;
	},

	openBubble: function() {
		var gpin = this.proprietary_marker;
		gpin.openInfoWindowHtml(this.infoBubble);
	},

	hide: function() {
		this.proprietary_marker.hide();
	},

	show: function() {
		this.proprietary_marker.show();
	},

	update: function() {
		point = new mxn.LatLonPoint();
		point.fromGoogle(this.proprietary_marker.getPoint());
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
			var gpoly = new GPolygon(gpoints, this.color, this.width, this.opacity, this.fillColor || "#5462E3", this.opacity || "0.3");
		} else {
			var gpoly = new GPolyline(gpoints, this.color, this.width, this.opacity);
		}
		return gpoly;
	},
	
	show: function() {
		throw 'Not implemented';
	},

	hide: function() {
		throw 'Not implemented';
	}
	
}

});