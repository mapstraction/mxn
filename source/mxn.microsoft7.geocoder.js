mxn.register('microsoft7', {	
	Geocoder: {

		init: function(){

		},

		geocode: function(query){
			var self = this;
			var _address = '';
			var is_reverse = false;
			if (typeof(query) == 'object') {
				// query is a LatLonPoint object (reverse geocode)
				if (query.hasOwnProperty('lat') && query.hasOwnProperty('lon')) {
					_address = query.lat + ',' + query.lon;
				}
				// query is an address object
				else {
					_address = [ query.street, query.locality, query.region, query.country ].join(', ');
				}
			}
			// query is an address string
			else{
				_address = query;
			}
			jsonp_callback_context = this;
			var searchRequest = 'http://dev.virtualearth.net/REST/v1/Locations/' + _address + '?output=json&jsonp=jsonp_callback_context.geocode_callback&key=' + microsoft_key;
			var mapscript = document.createElement('script'); 
			mapscript.type = 'text/javascript'; 
			mapscript.src = searchRequest; 
			document.body.appendChild(mapscript);
		},

		geocode_callback: function(results){
			if (results.statusDescription != 'OK') {
				this.error_callback(results.statusDescription);
			}
			else {
				var topResult = results.resourceSets[0].resources[0];
				var return_location = {
					street: topResult.address.addressLine,
					locality: topResult.address.locality,
					postcode: topResult.address.postalCode,
					region: topResult.address.adminDistrict,
					country: topResult.address.countryRegion,
					point: new mxn.LatLonPoint(topResult.point.coordinates[0], topResult.point.coordinates[1])			
				};
				this.callback(return_location);
			}
		}
	}
});