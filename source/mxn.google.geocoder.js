mxn.register('google', {	

Geocoder: {
	
	init: function() {		
		this.geocoders[this.api] = new GClientGeocoder();
	},
	
	geocode: function(address){
		var me = this;

		if (!address.hasOwnProperty('address') || address.address === null || address.address === '') {
			address.address = [ address.street, address.locality, address.region, address.country ].join(', ');
		}
		
		this.geocoders[this.api].getLocations(address.address, function(response) {
			me.geocode_callback(response);
		});
	},
	
	geocode_callback: function(response){
		var return_location = {};

		if (typeof(response) === 'undefined' || !response.hasOwnProperty('Status') || response.Status.code != 200) {
			this.error_callback(response);
		} 
		else {
			return_location.street = '';
			return_location.locality = '';
			return_location.region = '';
			return_location.country = '';

			var place = response.Placemark[0];
						
			mxn.util.traverse(place, 
				function(o){ return o.AddressDetails; },
				function(o){ return o.Country; },
				function(o){ 
					return_location.country = o.CountryNameCode;
					return o.AdministrativeArea; 
				},
				function(o){ 
					return_location.region = o.AdministrativeAreaName;
					// There may or may not be a sub administrative area
					return o.SubAdministrativeArea || o; 
				},
				function(o){ 
					return o.Locality;
				},
				function(o){ 
					return_location.locality = o.LocalityName;
					return o.Thoroughfare;
				},
				function(o){ 
					return_location.street = o.ThoroughfareName;
					return null;
				}
			);
			
			return_location.point = new mxn.LatLonPoint(place.Point.coordinates[1],	place.Point.coordinates[0]);
			
			this.callback(return_location);
		}
	}
}
});