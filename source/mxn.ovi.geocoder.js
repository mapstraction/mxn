mxn.register('ovi', {

Geocoder: {
	
	init: function() {
		var me = this;
		var ovi_geocoder;

		if (typeof ovi.mapsapi.search.Manager === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		ovi_geocoder = new ovi.mapsapi.search.Manager();
		ovi_geocoder.addObserver("state", function (manager, key, value){
			if (value == "finished" || value == "failed") {
				me.geocode_callback (manager.locations, value);
			}
		});
		this.geocoders[this.api] = ovi_geocoder;
	},

	geocode: function(address, rowlimit){
		var ovi_geocoder = this.geocoders[this.api];
		this.rowlimit = rowlimit;
		
		if (address instanceof mxn.LatLonPoint) {
			ovi_geocoder.reverseGeocode(address);
		}
		else {
			ovi_geocoder.geocode(address);
		}
	},

	geocode_callback: function(response, status){
		var ovi_geocoder = this.geocoders[this.api];

		if (status == "failed") {
			var error_cause = ovi_geocoder.getErrorCause();
			var error_status = "";

			if (error_cause.type) {
				error_status = error_cause.type;
				if (error_cause.subtype) {
					error_status += ", " + error_cause.subtype;
				}
				if (error_cause.message) {
					error_status += ", " + error_cause.message;
				}
			}

			else {
				error_status = "Geocoding failure";
			}

			this.error_callback(error_status);
		}

		else if (status == "finished") {
			var places = [];

			for (i=0; i<response.length; i++) {
				place = response[i];

				var return_location = {};
				var street_components = [];
				var locality_components = [];
				var region_components = [];

				return_location.street = '';
				return_location.locality = '';
				return_location.postcode = '';
				return_location.region = '';
				return_location.country = '';

				var address = place.address;
				var coords = place.displayPosition;

				if (address.street) {
					street_components.push(address.street);
				}
				if (address.houseNumber) {
					street_components.unshift(address.houseNumber);
				}

				if (address.city) {
					locality_components.push(address.city);
				}
				if (address.district) {
					locality_components.unshift(address.district);
				}

				if (address.postalCode) {
					return_location.postcode = address.postalCode;
				}

				if (address.state) {
					region_components.unshift(address.state);
				}
				if (address.county) {
					region_components.push(address.county);
				}

				if (address.country) {
					return_location.country = address.country;
				}

				if (return_location.street === '' && street_components.length > 0) {
					return_location.street = street_components.join(' ');
				}
				if (return_location.locality === '' && locality_components.length > 0) {
					return_location.locality = locality_components.join(', ');
				}
				if (return_location.region === '' && region_components.length > 0) {
					return_location.region = region_components.join(', ');
				}

				return_location.point = new mxn.LatLonPoint(coords.latitude, coords.longitude);

				places.push(return_location);
			}

			if (places.length > this.rowlimit) {
				places.length = this.rowlimit;
			}
			this.callback(places);
		}
	}
}

});