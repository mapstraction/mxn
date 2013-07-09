mxn.register('openlayers', {

Geocoder: {
	init: function() {
	},

	geocode: function(address, rowlimit) {
		var me = this;
		var url = 'http://nominatim.openstreetmap.org/';
		var params = {
			'addressdetails': 1,
			'format': 'json'
		};

		if (address.hasOwnProperty('lat') && address.hasOwnProperty('lon')) {
			url += 'reverse';
			params.lat = address.lat;
			params.lon = address.lon;
		} else {
			url += 'search';
			if (!address.hasOwnProperty('address') || address.address === null || address.address === '') {
				address.address = [ address.street, address.locality, address.region, address.country ].join(', ');
			}
			if (address.hasOwnProperty('address')) {
				params.q = address.address;
			}
			else {
				params.q = address;
			}
			params.limit = rowlimit;
		}

		OpenLayers.Request.GET({
			url: url,
			params: params,
			callback: function(response) {
				if (response.status == 503) { // Service Temporarily Unavailable
					me.error_callback("Nominatim is temporarily unavailable (were you blocked for excessive use?)");
				} else if (response.status != 200) {
					me.error_callback(response.statusText);
				} else {
					me.geocode_callback(JSON.parse(response.responseText));
				}
			}
		});
	},

	geocode_callback: function(results) {
		if (results instanceof Array) {
			if (!results.length) {
				this.error_callback("Nominatim didn't recognize this address.");
				return;
			}
		}
		else {
			results = [results];
		}

		var place;
		var places = [];

		for (i=0; i<results.length; i++) {
			place = results[i];
			var return_location = {};
			return_location.street = '';
			return_location.locality = '';
			return_location.postcode = '';
			return_location.region = '';
			return_location.country = '';
			var street_components = [];

			if (place.address.country) {
				return_location.country = place.address.country;
			}
			if (place.address.state_district) {
				return_location.region = place.address.state_district;
			}
			else if (place.address.state) {
				return_location.region = place.address.state;
			}
			if (place.address.city) {
				return_location.locality = place.address.city;
			}
			else if (place.address.town) {
				return_location.locality = place.address.town;
			}
			else if (place.address.village) {
				return_location.locality = place.address.village;
			}
			else if (place.address.hamlet) {
				return_location.locality = place.address.hamlet;
			}

			if (!return_location.locality && place.address.county) {
				return_location.locality = place.address.county;
			}

			if (place.address.postcode) {
				return_location.postcode = place.address.postcode;
			}
			if (place.address.road) {
				street_components.push(place.address.road);
			}
			if (place.address.house_number) {
				street_components.unshift(place.address.house_number);
			}

			if (return_location.street === '' && street_components.length > 0) {
				return_location.street = street_components.join(' ');
			}

			return_location.point = new mxn.LatLonPoint(parseFloat(place.lat), parseFloat(place.lon));

			places.push(return_location);
		}

		this.callback(places);
	}
}

});