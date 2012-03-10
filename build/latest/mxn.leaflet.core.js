/*
MAPSTRACTION   v2.0.18   http://www.mapstraction.com

Copyright (c) 2012 Tom Carden, Steve Coast, Mikel Maron, Andrew Turner, Henri Bergius, Rob Moran, Derek Fowler, Gary Gale
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the Mapstraction nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
mxn.register('leaflet', {

Mapstraction: {
	
	init: function(element, api) {
		if (typeof(L) != 'undefined') {
			var me = this;
			var map = new L.Map(element.id, {
				zoomControl: false
			});
			map.addEventListener('moveend', function(){
				me.endPan.fire();
			}); 
			map.on("click", function(e) {
				me.click.fire({'location': new mxn.LatLonPoint(e.latlng.lat, e.latlng.lng)});
			});
			map.on("popupopen", function(e) {
				if (e.popup._source.mxnMarker) {
				  e.popup._source.mxnMarker.openInfoBubble.fire({'bubbleContainer': e.popup._container});
				}
			});
			map.on("popupclose", function(e) {
				if (e.popup._source.mxnMarker) {
				  e.popup._source.mxnMarker.closeInfoBubble.fire({'bubbleContainer': e.popup._container});
				}
			});
			this.layers = {};
			this.features = [];
			this.maps[api] = map;
			this.setMapType();
			this.currentMapType = mxn.Mapstraction.ROAD;
			this.loaded[api] = true;
		} else {
			alert(api + ' map script not imported');
		}
	},
	
	applyOptions: function(){
		if (this.options.enableScrollWheelZoom) {
			this.maps[this.api].scrollWheelZoom.enable();
		} else {
			this.maps[this.api].scrollWheelZoom.disable();
		}
		return;
	},

	resizeTo: function(width, height){
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
	},

	addControls: function(args) {
		var map = this.maps[this.api];
		if (args.zoom) {
			var zoom = new L.Control.Zoom();
			map.addControl(zoom);
		}
		if (args.map_type) {
			var layersControl = new L.Control.Layers(this.layers, this.features);
			map.addControl(layersControl);
		}
	},

	addSmallControls: function() {
		this.addControls({zoom: true, map_type: true});
	},

	addLargeControls: function() {
		throw 'Not implemented';
	},

	addMapTypeControls: function() {
		throw 'Not implemented';
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setView(pt, zoom); 
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
		map.addLayer(pin);
		this.features.push(pin);
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		map.removeLayer(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw 'Not implemented';
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		polyline = polyline.toProprietary(this.api);
		map.addLayer(polyline);
		this.features.push(polyline);
		return polyline;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		map.removeLayer(polyline.proprietary_polyline);
	},

	getCenter: function() {
		var map = this.maps[this.api];
		var pt = map.getCenter();
		return new mxn.LatLonPoint(pt.lat, pt.lng);
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		if (options && options.pan) { 
			map.panTo(pt); 
		}
		else { 
			map.setView(pt, map.getZoom(), true);
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

	getZoomLevelForBoundingBox: function(bbox) {
		var map = this.maps[this.api];
		var bounds = new L.LatLngBounds(
			bbox.getSouthWest().toProprietary(this.api),
			bbox.getNorthEast().toProprietary(this.api));
		return map.getBoundsZoom(bounds);
	},

	setMapType: function(type) {
		switch(type) {
			case mxn.Mapstraction.ROAD:
				this.addTileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
					name: "Roads",
					attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
					subdomains: [1,2,3,4]
				});
				this.currentMapType = mxn.Mapstraction.ROAD;
				break;
			case mxn.Mapstraction.SATELLITE:
				this.addTileLayer('http://oatile{s}.mqcdn.com/naip/{z}/{x}/{y}.jpg', {
					name: "Satellite",
					attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
					subdomains: [1,2,3,4]
				});
				this.currentMapType = mxn.Mapstraction.SATELLITE;
				break;
			case mxn.Mapstraction.HYBRID:
				throw 'Not implemented';
			default:
				this.addTileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
					name: "Roads",
					attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
					subdomains: [1,2,3,4]
				});
				this.currentMapType = mxn.Mapstraction.ROAD;
		}
	},

	getMapType: function() {
		return this.currentMapType;
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var box = map.getBounds();
		var sw = box.getSouthWest();
		var ne = box.getNorthEast();
		return new mxn.BoundingBox(sw.lat, sw.lng, ne.lat, ne.lng);
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest().toProprietary(this.api);
		var ne = bounds.getNorthEast().toProprietary(this.api);
		var newBounds = new L.LatLngBounds(sw, ne);
		map.fitBounds(newBounds); 
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north) {
		throw 'Not implemented';
	},

	setImagePosition: function(id, oContext) {
		throw 'Not implemented';
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		throw 'Not implemented';
	},

	addTileLayer: function(tile_url, options) {
		var layerName;
		if (options && options.name) {
			layerName = options.name;
			delete options.name;
		} else {
			layerName = 'Tiles';
		}
		this.layers[layerName] = new L.TileLayer(tile_url, options || {});
		var map = this.maps[this.api];
		map.addLayer(this.layers[layerName]);
	},

	toggleTileLayer: function(tile_url) {
		throw 'Not implemented';
	},

	getPixelRatio: function() {
		throw 'Not implemented';
	},
	
	mousePosition: function(element) {
		throw 'Not implemented';
	},

	openBubble: function(point, content) {
		var map = this.maps[this.api];
		var newPoint = point.toProprietary(this.api);
		var marker = new L.Marker(newPoint);
		marker.bindPopup(content);
		map.addLayer(marker);
		marker.openPopup();
	},

	closeBubble: function() {
		var map = this.maps[this.api];
		map.closePopup();
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return new L.LatLng(this.lat,this.lon);
	},

	fromProprietary: function(point) {
		this.lat = point.lat();
		this.lon = point.lng();
	}
	
},

Marker: {
	
	toProprietary: function() {
		var me = this;
		var thisIcon = L.Icon;
		if (me.iconUrl) {
			thisIcon = thisIcon.extend({
				iconUrl: me.iconUrl
			});
		}
		if (me.iconSize) {
			thisIcon = thisIcon.extend({
				iconSize: new L.Point(me.iconSize[0], me.iconSize[1])
			});
		}
		if (me.iconAnchor) {
			thisIcon = thisIcon.extend({
				iconAnchor: new L.Point(me.iconAnchor[0], me.iconAnchor[1])
			});
		}
		if (me.iconShadowUrl) {
			thisIcon = thisIcon.extend({
				shadowUrl: me.iconShadowUrl
			});
		}
		if (me.iconShadowSize) {
			thisIcon = thisIcon.extend({
				shadowSize: new L.Point(me.iconShadowSize[0], me.iconShadowSize[1])
			});
		}
		var iconObj = new thisIcon();
		var marker = new L.Marker(
			this.location.toProprietary('leaflet'),
			{ icon: iconObj }
		);
		(function(me, marker) {
			marker.on("click", function (e) {
				me.click.fire();
			});
		})(me, marker);
		return marker;
	},

	openBubble: function() {
		var pin = this.proprietary_marker;
		if (this.infoBubble) {
			pin.mxnMarker = this;
			pin.bindPopup(this.infoBubble);
			pin.openPopup();
		}
	},
	
	closeBubble: function() {
		var pin = this.proprietary_marker;
		pin.closePopup();
	},

	hide: function() {
		var map = this.mapstraction.maps[this.api];
		map.removeLayer(this.proprietary_marker);
	},

	show: function() {
		var map = this.mapstraction.maps[this.api];
		map.addLayer(this.proprietary_marker);
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
		throw 'Not implemented';
	}
	
},

Polyline: {

	toProprietary: function() {
		var points = [];
		for (var i = 0,  length = this.points.length ; i< length; i++){
			points.push(this.points[i].toProprietary('leaflet'));
		}

		var polyOptions = {
			color: this.color || '#000000',
			opacity: this.opacity || 1.0, 
			weight: this.width || 3,
			fillColor: this.fillColor || '#000000'
		};

		if (this.closed) {
			return new L.Polygon(points, polyOptions);
		} else {
			return new L.Polyline(points, polyOptions);
		}
	},
	
	show: function() {
		this.map.addLayer(this.proprietary_polyline);
	},

	hide: function() {
		this.map.removeLayer(this.proprietary_polyline);
	},
	
	isHidden: function() {
		if (this.map.hasLayer(this.proprietary_polyline)) {
			return false;
		} else {
			return true;
		}
	}
}

});

