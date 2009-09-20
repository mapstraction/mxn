mxn.register('googlev3', {	

Mapstraction: {
	
	init: function(element, api){		
	    var me = this;         
            if ( google && google.maps ){
                var map = new google.maps.Map(element, {mapTypeId:google.maps.MapTypeId.ROADMAP});

                // deal with click

                // deal with zoom change
                google.maps.event.addListener(map, 'zoom_changed', function(){
                    me.changeZoom.fire();
		});
                // deal with map movement
		google.maps.event.addListener(map, 'dragend', function(){
                    me.moveendHandler(me);
                    me.endPan.fire();
		});
                this.maps[api] = map;
                this.loaded[api] = true;
                me.load.fire();
	    }
            else {
                alert(api + ' map script not imported');
            }     
	},
	
	applyOptions: function(){
		var map = this.maps[this.api];
		// TODO: Add provider code
	},

	resizeTo: function(width, height){	
            this.currentElement.style.width = width;
            this.currentElement.style.height = height;
            this.maps[this.api].checkResize(); 
  	},

	addControls: function( args ) {
	    var map = this.maps[this.api];	
            // remove old controls
            // Google has a combined zoom and pan control.
            if (args.zoom || args.pan) {
                (args.zoom == 'large') 
                ? this.addLargeControls() 
                : this.addSmallControls();

            }
	},

	addSmallControls: function() {
            var map = this.maps[this.api];
            var myOptions = {
                navigationControl:true,
		navigationControlOptions: {style:google.maps.NavigationControlStyle.SMALL}
            };
            map.setOptions(myOptions);
            this.addControlsArgs.pan = false;
            this.addControlsArgs.scale = false;                        
            this.addControlsArgs.zoom = 'small';
	},

	addLargeControls: function() {
	    var map = this.maps[this.api];
            var myOptions = {
                navigationControl:true,
		navigationControlOptions: {style:google.maps.NavigationControlStyle.DEFAULT},
            };
            map.setOptions(myOptions);
            this.addControlsArgs.pan = true;
            this.addControlsArgs.zoom = 'large';
	},

	addMapTypeControls: function() {
	    var map = this.maps[this.api];
            var myOptions = {
                mapTypeControl: true,
                mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DEFAULT},
            };
            map.setOptions(myOptions);
	    this.addControlsArgs.map_type = true;
	},

	dragging: function(on) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.setCenter(pt);
                map.setZoom(zoom);
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
		
		// TODO: Add provider code
		
		return pin;
	},

	removeMarker: function(marker) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	removeAllMarkers: function() {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},
	
	declutterMarkers: function(opts) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		var pl = polyline.toProprietary(this.api);
		
		// TODO: Add provider code
		
		return pl;
	},

	removePolyline: function(polyline) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},
	
	getCenter: function() {
		var point;
		var map = this.maps[this.api];
		
		// TODO: Add provider code
		
		return point;
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		if(options && options['pan']) { 
			// TODO: Add provider code
		}
		else { 
			// TODO: Add provider code
		}
	},

	setZoom: function(zoom) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
		
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		var zoom;
		
		// TODO: Add provider code
		
		return zoom;
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
		// NE and SW points from the bounding box.
		var ne = bbox.getNorthEast();
		var sw = bbox.getSouthWest();
		var zoom;
		
		// TODO: Add provider code
		
		return zoom;
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		switch(type) {
			case mxn.Mapstraction.ROAD:
				// TODO: Add provider code
				break;
			case mxn.Mapstraction.SATELLITE:
				// TODO: Add provider code
				break;
			case mxn.Mapstraction.HYBRID:
				// TODO: Add provider code
				break;
			default:
				// TODO: Add provider code
		}	 
	},

	getMapType: function() {
            var map = this.maps[this.api];
            var type = map.getMapTypeId()
                switch(type) {
                        case google.maps.MapTypeId.ROADMAP:
                                return mxn.Mapstraction.ROAD;
                        case google.maps.MapTypeId.SATELLITE:
                                return mxn.Mapstraction.SATELLITE;
                        case google.maps.MapTypeId.HYBRID:
                                return mxn.Mapstraction.HYBRID;
                        //case google.maps.MapTypeId.TERRAIN:
                        //        return something;
                        default:
                                return null;
                }
	},

	getBounds: function () {
	    var map = this.maps[this.api];
	    var gLatLngBounds = map.getBounds();	
            var sw = gLatLngBounds.getSouthWest();
            var ne = gLatLngBounds.getNorthEast();
            return new mxn.BoundingBox(sw.lat(), sw.lng(), ne.lat(), ne.lng());
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest();
		var ne = bounds.getNorthEast();
                var gLatLngBounds = new google.maps.LatLngBounds({sw:sw, ne:ne});
		map.fitBounds(gLatLngBounds);
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	setImagePosition: function(id, oContext) {
		var map = this.maps[this.api];
		var topLeftPoint; var bottomRightPoint;

		// TODO: Add provider code

		//oContext.pixels.top = ...;
		//oContext.pixels.left = ...;
		//oContext.pixels.bottom = ...;
		//oContext.pixels.right = ...;
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
		
	},

	addTileLayer: function(tile_url, opacity, copyright_text, min_zoom, max_zoom) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	toggleTileLayer: function(tile_url) {
		var map = this.maps[this.api];
		
		// TODO: Add provider code
	},

	getPixelRatio: function() {
		var map = this.maps[this.api];

		// TODO: Add provider code	
	},
	
	mousePosition: function(element) {
		var map = this.maps[this.api];

		// TODO: Add provider code	
	}
},

LatLonPoint: {
	
	toProprietary: function() {
            return new google.maps.LatLng(this.lat, this.lon);
	},

	fromProprietary: function(googlePoint) {
		this.lat = googlePoint.lat();
		this.lon = googlePoint.lng();
	}
	
},

Marker: {
	
	toProprietary: function() {
		// TODO: Add provider code
	},

	openBubble: function() {		
		// TODO: Add provider code
	},

	hide: function() {
		// TODO: Add provider code
	},

	show: function() {
		// TODO: Add provider code
	},

	update: function() {
		// TODO: Add provider code
	}
	
},

Polyline: {

	toProprietary: function() {
		// TODO: Add provider code
	},
	
	show: function() {
		// TODO: Add provider code
	},

	hide: function() {
		// TODO: Add provider code
	}
	
}

});