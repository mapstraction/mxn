mxn.register('geocommons', {	

    Mapstraction: {

        init: function(element, api) {		
            var me = this;
            this.element = element;
            Maker.maker_host='http://maker.geocommons.com';
            Maker.finder_host='http://finder.geocommons.com';
            Maker.core_host='http://geocommons.com';
          },

        applyOptions: function(){
            var map = this.maps[this.api];

            // TODO: Add provider code
        },

        resizeTo: function(width, height){	
            var map = this.maps[this.api];
            map.setSize(width,height);
        },

        addControls: function( args ) {
            var map = this.maps[this.api];
            map.showControl("Zoom", args.zoom || false);
            map.showControl("Layers", args.layers || false);
            map.showControl("Styles", args.styles || false); 
            map.showControl("Basemap", args.map_type || false);
            map.showControl("Legend", args.legend || false, "open"); 
            // showControl("Legend", true, "close"); 
        },

        addSmallControls: function() {
            var map = this.maps[this.api];
            showControl("Zoom", args.zoom);
            showControl("Legend", args.legend, "open"); 
        },

        addLargeControls: function() {
            var map = this.maps[this.api];
            showControl("Zoom", args.zoom);
            showControl("Layers", args.layers);
            showControl("Legend", args.legend, "open"); 
        },

        addMapTypeControls: function() {
            var map = this.maps[this.api];

            // TODO: Add provider code
        },

        dragging: function(on) {
            var map = this.maps[this.api];

            // TODO: Add provider code
        },

        setCenterAndZoom: function(point, zoom) { 
            var map = this.maps[this.api];
            map.setCenterZoom(point.lat, point.lon,zoom);
        },

        getCenter: function() {
            var map = this.maps[this.api];
            var point = map.getCenterZoom()[0];
            return mxn.LatLonPoint(point.lat,point.lon);
        },

        setCenter: function(point, options) {
            var map = this.maps[this.api];
            map.setCenter(point.lat, point.lon);            
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
            var zoom;

            // TODO: Add provider code

            return zoom;
        },

        setMapType: function(type) {
            var map = this.maps[this.api];
            switch(type) {
                case mxn.Mapstraction.ROAD:
                map.setMapProvider("OpenStreetMap (road)");
                break;
                case mxn.Mapstraction.SATELLITE:
                map.setMapProvider("BlueMarble");
                break;
                case mxn.Mapstraction.HYBRID:
                map.setMapProvider("Google Hybrid");
                break;
                default:
                map.setMapProvider(type);
            }	 
        },

        getMapType: function() {
            var map = this.maps[this.api];
            switch(map.getMapProvider) {
                case "OpenStreetMap (Road)":
                    retu
                    
            }
            // TODO: Add provider code

            //return mxn.Mapstraction.ROAD;
            //return mxn.Mapstraction.SATELLITE;
            //return mxn.Mapstraction.HYBRID;

        },

        getBounds: function () {
            var map = this.maps[this.api];
            var extent = map.getExtent();
            return new mxn.BoundingBox( extent.northWest.lat, extent.southEast.lon, extent.southEast.lat, extent.northWest.lon);
        },

        setBounds: function(bounds){
            var map = this.maps[this.api];
            var sw = bounds.getSouthWest();
            var ne = bounds.getNorthEast();
            map.setExtent(ne.lat,sw.lat,ne.lon,sw.lon);

        },

        addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
            var map = this.maps[this.api];

            // TODO: Add provider code
        },

        addOverlay: function(url, autoCenterAndZoom) {
            var map = this.maps[this.api];
            var me = this;
            Maker.load_map(this.element.id, url);
            setTimeout(function() { me.maps[me.api] = swfobject.getObjectById(FlashMap.dom_id);}, 500);
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
            // TODO: Add provider code
        },

        fromProprietary: function(googlePoint) {
            // TODO: Add provider code
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