mxn.register('openlayers', {	

Geocoder: {
	
	init: function() {
		var me = this;
	},
	
	geocode: function(address){
		var me = this;
		
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
				callback: function(request) { me.geocode_callback(JSON.parse(request.responseText), request.status); }
			});
		} else {
			OpenLayers.Request.GET({
				url: 'http://nominatim.openstreetmap.org/search',
				params: {
					'q': address.address,
					'addressdetails': 1,
					'format': 'json'
				},
				callback: function(request) { me.geocode_callback(JSON.parse(request.responseText), request.status); }
			});
		}
	},
	
	geocode_callback: function(results, status){
		var return_location = {};
		
		if (status != 200) {
			this.error_callback(response.statusText);
		} 
		else {
			return_location.street = '';
			return_location.locality = '';
			return_location.postcode = '';
			return_location.region = '';
			return_location.country = '';
			
			var place;
			
			if (results.length > 0) {
				place = results[0];
			} else {
				place = results;
			}
			var street_components = [];
			
			if (place.address.country) {
				return_location.country = place.address.country;
			}
			if (place.address.state) {
				return_location.region = place.address.state;
			}
			if (place.address.city) {
				return_location.locality = place.address.city;
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
			
			this.callback(return_location);
		}
	}
}
});