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
				me.geocode_callback(mapPoint, 1);
			});
		} else {
			this.geocoders[this.api].gazetteer.getLonLat(geocode_request_object.address, function(mapPoint) {
				me.geocode_callback(mapPoint, me.row_limit);
			});
		}
	},

	geocode_callback: function(results, rowlimit) {
		var place;
		var places = [];

		if (results.hasOwnProperty('lat')) {
			//This is a single postcode result
			place = {};
			place.point = new mxn.LatLonPoint();
			if (results !== null) { 
				place.point.fromProprietary(this.api, results); 
				places.push(place);
			}
		}

		else {
			for (i=0; i<results.length; i++) {
				place = results[i];
				if (place.type == "CITY" || place.type == "TOWN") {
					var return_location = {};
					return_location.street = '';
					return_location.locality = place.name;
					return_location.postcode = '';
					return_location.region = place.county;
					return_location.country = 'United Kingdom';

					return_location.point = new mxn.LatLonPoint();
					return_location.point.fromProprietary(this.api, place.location);

					places.push(return_location);
				}
			}  
		}    

		if (rowlimit <= 1) {
			this.callback(places[0]);
		}
		else {
			if (places.length > rowlimit) {
				places.length = rowlimit;
			}
			this.callback(places);
		}
	}
}

});