mxn.register('openspace', {

Geocoder: {

	init: function() {
	
		this.geocoders[this.api] = {};
		
		this.geocoders[this.api].gazetteer = new OpenSpace.Gazetteer();    
		this.geocoders[this.api].postcodeService = new OpenSpace.Postcode();
	},

	geocode: function(query, rowlimit){
		var me = this;
		var isPostCode = false;
		me.row_limit = rowlimit || 1; //default to one result
		var geocode_request_object = {};
		if (typeof(query) == 'object') {
			// query is a LatLonPoint object (reverse geocode)
			if (query.hasOwnProperty('lat') && query.hasOwnProperty('lon')) {
				geocode_request_object.latLng = query.toProprietary(this.api);
			}
			else if(query.hasOwnProperty('postcode')) 
			{
				isPostCode = true;
				geocode_request_object.address = query.postcode;
			}
			// query is an address object
			else{
				geocode_request_object.address = query.locality||query.region ; //use locality if pesent or just region
			}
		}

		// query is an address string
		else {
			geocode_request_object.address = query;
			//If the query contains numbers then interpret it as a postcode perhaps?
			var matches = query.match(/\d+/g);
			if (matches !== null) {
				isPostCode = true;
			}
		}

		//Is Query a postcode search?
		if (isPostCode) {
			this.geocoders[this.api].postcodeService.getLonLat(geocode_request_object.address, function(mapPoint) {
				me.geocode_callback(mapPoint);
			});
		} else {
			this.geocoders[this.api].gazetteer.getLonLat(geocode_request_object.address, function(mapPoint) {
				me.geocode_callback(mapPoint);
			});
		}
	},

	geocode_callback: function(mapPoint){
			var return_location = {};			
			return_location.point = new mxn.LatLonPoint();
			return_location.point.fromProprietary(this.api, mapPoint);
			this.callback(return_location);
	}
}

});