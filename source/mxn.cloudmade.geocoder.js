mxn.register('cloudmade', {

Geocoder: {

	init: function() {
		this.geocoders[this.api] = new CM.Geocoder(cloudmade_key); 
	},

	geocode: function(query, rowlimit){
		var me = this;
		var reverseGeocode = false;
		var geocode_request_object = {};
		if (typeof(query) == 'object') {
			// query is a LatLonPoint object (reverse geocode)
			if (query.hasOwnProperty('lat') && query.hasOwnProperty('lon')) {
				reverseGeocode = true;
				geocode_request_object = new CM.LatLng(query.toProprietary(this.api));
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

		//add options to set the max results: resultsNumber
		var options = {resultsNumber: rowlimit};
		this.geocoders[this.api].getLocations(reverseGeocode ? geocode_request_object : geocode_request_object.address, function(results) {
			me.geocode_callback(results);
		}, options);
	},

	geocode_callback: function(results){
		var places = [];

			for (i=0; i<results.features.length; i++) {
				place = results.features[i];
				var streetparts = [];
				var return_location = {};

				if (place.properties.place == "city") {return_location.locality = place.properties["name:en"] || place.properties.name;}
				//What about things that dont come back as city? Newcastle, UK or Bardon Mill, springfield, USA, greenwich, uk , St Omar, France 
				
				return_location.postal_code = place.properties.postal_code;
				return_location.country = place.properties["is_in:country"];
				return_location.region =  place.properties["is_in:county"] || place.properties["is_in:state"] || place.properties["is_in:province"] || place.properties.code_departement;

				return_location.point = new mxn.LatLonPoint(place.centroid.coordinates[0], place.centroid.coordinates[1]);
				places.push(return_location);
			}

			this.callback(places);
		}
	}

});