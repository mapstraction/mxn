mxn.register('googlev3', {

Geocoder: {
	init: function() {
		this.geocoders[this.api] = new google.maps.Geocoder();
	},

	geocode: function(query, rowlimit){
		var me = this;
		var geocode_request_object = {};
		if (typeof(query) == 'object') {
			// query is a LatLonPoint object (reverse geocode)
			if (query.hasOwnProperty('lat') && query.hasOwnProperty('lon')) {
				geocode_request_object.latLng = query.toProprietary(this.api);
			}
			// query is an address object
			else{
				geocode_request_object.address = [ query.street, query.locality, query.region, query.country ].join(', ');
			}
		}

		// query is an address string
		else {
			geocode_request_object.address = query;
		}

		this.geocoders[this.api].geocode(geocode_request_object, function(results, status) {
			me.geocode_callback(results, status, rowlimit);
		});
	},

	geocode_callback: function(results, status, rowlimit){
		if (status != google.maps.GeocoderStatus.OK) {
			this.error_callback(status);
		} 

		else {
			var places = [];

			// Code Health Warning
			// Don't let the fact that the Google geocoder returns 'results' as an array
			// fool you. Google 'generally' returns a single value when geocoding address
			// lookups; multiple values 'may' be returned but only where there is ambiguity
			// See https://developers.google.com/maps/documentation/geocoding/#JSON
			
			for (i=0; i<results.length; i++) {
				place = results[i];
				var streetparts = [];
				var return_location = {};

				for (var k = 0; k < place.address_components.length; k++) {
					var addressComponent = place.address_components[k];
					for (var j = 0; j < addressComponent.types.length; j++) {
						var componentType = addressComponent.types[j];
						switch (componentType) {
							case 'country':
								return_location.country = addressComponent.long_name;
								break;
							case 'administrative_area_level_1':
								return_location.region = addressComponent.long_name;
								break;
							case 'locality':
								return_location.locality = addressComponent.long_name;
								break;
							case 'street_address':
								return_location.street = addressComponent.long_name;
								break;
							case 'postal_code':
								return_location.postcode = addressComponent.long_name;
								break;
							case 'street_number':
								streetparts.unshift(addressComponent.long_name);
								break;
							case 'route':
								streetparts.push(addressComponent.long_name);
								break;
						}
					}
				}

				if (return_location.street === '' && streetparts.length > 0) {
					return_location.street = streetparts.join(' ');
				}

				return_location.point = new mxn.LatLonPoint(place.geometry.location.lat(), place.geometry.location.lng());

				places.push(return_location);
			}

			if (places.length > rowlimit) {
				places.length = rowlimit;
			}
			this.callback(places);
		}
	}
}

});