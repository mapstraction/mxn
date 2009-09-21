mxn.register('googlev3', {	

Mapstraction: {
	
	init: function(element, api){		
	    var me = this;         
            if ( google && google.maps ){
                // be default no controls and road map
                var myOptions = {
		    disableDefaultUI: true,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var map = new google.maps.Map(element, myOptions);

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
	    var myOptions = [];
            if (this.options.enableDragging) {
		myOptions.draggable = true;
            } 
            if (this.options.enableScrollWheelZoom){
		myOptions.scrollwheel = true;
            } 
	    map.setOptions(myOptions);
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
                if (args.zoom == 'large'){ 
                    this.addLargeControls();
                } else { 
                    this.addSmallControls();
                }
            }
            if (args.scale){
                var myOptions = {
                    scaleControl:true,
		    scaleControlOptions: {style:google.maps.ScaleControlStyle.DEFAULT}                
                };
                map.setOptions(myOptions);
                this.addControlsArgs.scale = true;
            }
	},

	addSmallControls: function() {
            var map = this.maps[this.api];
            var myOptions = {
                scrollwheel: false,
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
		navigationControlOptions: {style:google.maps.NavigationControlStyle.DEFAULT}
            };
            map.setOptions(myOptions);
            this.addControlsArgs.pan = true;
            this.addControlsArgs.zoom = 'large';
	},

	addMapTypeControls: function() {
	    var map = this.maps[this.api];
            var myOptions = {
                mapTypeControl: true,
                mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DEFAULT}
            };
            map.setOptions(myOptions);
	    this.addControlsArgs.map_type = true;
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
		var map = this.maps[this.api];
                var pt = map.getCenter();
                return new mxn.LatLonPoint(pt.lat(),pt.lng());
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
		
		// TODO: Add provider code
		
	},
	
	getZoom: function() {
	    var map = this.maps[this.api];
            return map.getZoom();
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
                throw 'Not implemented';
	},

	setMapType: function(type) {
		var map = this.maps[this.api];
		switch(type) {
			case mxn.Mapstraction.ROAD:
                            map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
			    break;
			case mxn.Mapstraction.SATELLITE:
                            map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
			    break;
			case mxn.Mapstraction.HYBRID:
                            map.setMapTypeId(google.maps.MapTypeId.HYBRID);
			    break;
			default:
                            map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		}	 
	},

	getMapType: function() {
            var map = this.maps[this.api];
            var type = map.getMapTypeId();
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
	    this.proprietary_marker.setOptions({visible:false});
	},

	show: function() {
	    this.proprietary_marker.setOptions({visible:true});
	},

	update: function() {
		// TODO: Add provider code
	}
	
},

Polyline: {

	toProprietary: function() {
            throw 'Not implemented';
	},
	
	show: function() {
            throw 'Not implemented';
	},

	hide: function() {
            throw 'Not implemented';
	}
	
}

});