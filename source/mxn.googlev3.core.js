mxn.register('googlev3', {	

Mapstraction: {
	
	init: function(element, api){		
	    var me = this;         
            if ( google && google.maps ){
                // by default no controls and road map
                var myOptions = {
		    		disableDefaultUI: true,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var map = new google.maps.Map(element, myOptions);
                
                // deal with click
                google.maps.event.addListener(map, 'click', function(location){
				me.clickHandler(location.latLng.lat(),location.latLng.lng(),location,me);
                });

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
            var map = this.maps[this.api];
            google.maps.event.trigger(map,'resize');
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
            	navigationControl: true,
            	navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL}
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
	       return marker.toProprietary(this.api);		
	},

	removeMarker: function(marker) {
                // doesn't really remove them, just hides them
                marker.hide();
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
		return polyline.toProprietary(this.api);
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
		map.setZoom(zoom);
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		return map.getZoom();
	},

	getZoomLevelForBoundingBox: function( bbox ) {
		var map = this.maps[this.api];
		var sw = bbox.getSouthWest().toProprietary(this.api);
		var ne = bbox.getNorthEast().toProprietary(this.api);
		var gLatLngBounds = new google.maps.LatLngBounds(sw, ne);
		map.fitBounds(gLatLngBounds);
                return map.getZoom();
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
		var sw = bounds.getSouthWest().toProprietary(this.api);
		var ne = bounds.getNorthEast().toProprietary(this.api);
		var gLatLngBounds = new google.maps.LatLngBounds(sw, ne);
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

	addTileLayer: function(tile_url, opacity, copyright_text, min_zoom, max_zoom, map_type) {
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
		var options = {};

                // do we have an Anchor?
                var ax = 0;  // anchor x 
		var ay = 0;  // anchor y

		if (this.iconAnchor) {
                    ax = this.iconAnchor[0];
                    ay = this.iconAnchor[1];
                }
                var gAnchorPoint = new google.maps.Point(ax,ay);

		if (this.iconUrl) {
 		    options.icon = new google.maps.MarkerImage(
			this.iconUrl,
                        new google.maps.Size(this.iconSize[0],
					     this.iconSize[1]),
                        new google.maps.Point(0,0),
                        gAnchorPoint
                    );

                    // do we have a Shadow?
		    if (this.iconShadowUrl) {
  			if (this.iconShadowSize) {
                            var x = this.iconShadowSize[0];
                            var y = this.iconShadowSize[1];
  			    options.shadow = new google.maps.MarkerImage(
				this.iconShadowUrl,
                                new google.maps.Size(x,y),
                                new google.maps.Point(0,0),
                                gAnchorPoint 
			    );
			}
                        else {
  			    options.shadow = new google.maps.MarkerImage(this.iconShadowUrl);
			}
		    }
		}
		if (this.draggable){
		    options.draggable = this.draggable;
		}
		if (this.labelText){
		    options.title =  this.labelText;
		}
		if (this.imageMap){
                    options.shape = {
                        coord: this.imageMap,
                        type: 'poly'
		    };
                }
		
		options.position = this.location.toProprietary(this.api);
		options.map = this.map;

		var marker = new google.maps.Marker(options);

		if (this.infoBubble){
		    var infowindow = new google.maps.InfoWindow({
        	        content: this.infoBubble
		    });

                    var event_action = "click";
		    if (this.hover) {
		        event_action = "mouseover";
		    }
		    google.maps.event.addListener(marker, event_action, function() { infowindow.open(this.map,marker); });
		}

                if (this.hoverIconUrl){
                    var gSize = new google.maps.Size(this.iconSize[0],
			                            this.iconSize[1]);
                    var zerozero = new google.maps.Point(0,0);
 		    var hIcon = new google.maps.MarkerImage(
			this.hoverIconUrl,
                        gSize,
                        zerozero,
                        gAnchorPoint
                    );
 		    var Icon = new google.maps.MarkerImage(
			this.iconUrl,
			gSize,
                        zerozero,
                        gAnchorPoint
                    );
                    google.maps.event.addListener(
                        marker, 
                        "mouseover", 
                        function(){ 
                            marker.setIcon(hIcon); 
                        }
                    );
                    google.maps.event.addListener(
                        marker, 
                        "mouseout", 
                        function(){ marker.setIcon(Icon); }
                    );
                }

		google.maps.event.addListener(marker, 'click', function() {
			marker.mapstraction_marker.click.fire();
		});
		
		return marker;
	},

	openBubble: function() {
		var infowindow = new google.maps.InfoWindow({
       		content: this.infoBubble
	    });
	    infowindow.open(this.map,this.proprietary_marker);
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
