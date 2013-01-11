mxn.register('openlayers', {

Geocoder: {

	init: function() {
		var me = this;
	},

	geocode: function(address, rowlimit) {
		var me = this;
		rowlimit = rowlimit || 1; //default to one result
		if (!address.hasOwnProperty('address') || address.address === null || address.address === '') {
			address.address = [ address.street, address.locality, address.region, address.country ].join(', ');
		}

		if (address.hasOwnProperty('lat') && address.hasOwnProperty('lon')) {
			var latlon = address.toProprietary(this.api);
			OpenLayers.Request.GET({
				url: 'http://nominatim.openstreetmap.org/reverse',
				params: {
					'lat': address.lat,
					'lon': address.lon,
					'addressdetails': 1,
					'format': 'json'
				},
				callback: function(request) { me.geocode_callback(JSON.parse(request.responseText), request.status, rowlimit); }
			});
		}
		else {
			OpenLayers.Request.GET({
				url: 'http://nominatim.openstreetmap.org/search',
				params: {
					'q': address.address,
					'addressdetails': 1,
					'format': 'json'
				},
				callback: function(request) { me.geocode_callback(JSON.parse(request.responseText), request.status, rowlimit); }
			});
		}
	},

	geocode_callback: function(results, status, rowlimit) {
		console.log('geocode_callback: ' + status);
		if (status != 200) {
			this.error_callback(response.statusText);
		}
		else if (results instanceof Array && !results.length) {
			this.error_callback("OpenLayers didn't recognize this address.");
		}
		else {
			var place;
			var places = [];

			console.log ('Got ' + results.length + ' results');
			for (i=0; i<results.length; i++) {
				place = results[i];
				var return_location = {};
				return_location.street = '';
				return_location.locality = '';
				return_location.postcode = '';
				return_location.region = '';
				return_location.country = '';
				var street_components = [];

				console.log (JSON.stringify(place));
				
				if (place.address.country) {
					return_location.country = place.address.country;
				}
				if (place.address.state) {
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
}

});