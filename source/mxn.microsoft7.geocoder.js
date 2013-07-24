mxn.register('microsoft7', {

Geocoder: {
	init: function() {

	},

	geocode: function(query, rowlimit) {
		this.row_limit = rowlimit;
		var _address = '';
		var is_reverse = false;
		if (typeof(query) == 'object') {
			// query is a LatLonPoint object (reverse geocode)
			if (query.hasOwnProperty('lat') && query.hasOwnProperty('lon')) {
				_address = query.lat + ',' + query.lon;
			}
			// query is an address object
			else {
				_address = [ query.street, query.locality, query.region, query.country ].join(',');
			}
		}
		else {
			// query is an address string
			_address = query;
		}

		jsonp_callback_context = this;
		var searchRequest = 'http://dev.virtualearth.net/REST/v1/Locations/' + _address + '?output=json&jsonp=jsonp_callback_context.geocode_callback&key=' + microsoft_key;
		var mapscript = document.createElement('script'); 
		mapscript.type = 'text/javascript'; 
		mapscript.src = searchRequest; 
		document.body.appendChild(mapscript);
	},

	geocode_callback: function(results) {
		if (results.statusDescription != 'OK') {
			this.error_callback(results.statusDescription);
		}

		else {
			var places = [];

			for (i=0; i<results.resourceSets[0].resources.length; i++)
			{
				place = results.resourceSets[0].resources[i];

				var return_location = {
					street: place.address.addressLine,
					locality: place.address.locality,
					postcode: place.address.postalCode,
					region: place.address.adminDistrict,
					country: place.address.countryRegion,
					point: new mxn.LatLonPoint(place.point.coordinates[0], place.point.coordinates[1])
				};
				
				// Remove sovereign entity
				if (place.entityType != ('Sovereign') && place.entityType != ('CountryRegion')) {
					places.push(return_location);
				}
			}

			if (places.length > this.row_limit) {
					places.length = this.row_limit;
				}
			this.callback(places);
		}
	}
}

});