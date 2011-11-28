mxn.register('leaflet', {

Mapstraction: {
    
    init: function(element, api) {
        if (typeof(L) != 'undefined') {
            var map = new L.Map(element.id, {
                zoomControl: false
            });
            this.layers = {};
            this.features = [];
            this.maps[api] = map;
            this.loaded[api] = true;
        } else {
            alert(api + ' map script not imported');
        }
    },
    
    applyOptions: function(){
        return false;
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
        if(options && options.pan) { 
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

    getZoomLevelForBoundingBox: function( bbox ) {
        throw 'Not implemented';
    },

    setMapType: function(type) {
        return false;
    },

    getMapType: function() {
        throw 'Not implemented';
    },

    getBounds: function () {
        var map = this.maps[this.api];
        var ne, sw, nw, se;
        var box = map.getBounds();
        sw = box.getSouthWest();
        ne = box.getNorthEast();
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
        if (this.closed) {
            return new L.Polygon(points);
        } else {
            return new L.Polyline(points);
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

