mxn.register('googlev3', {	

Geocoder: {
	
	init: function(api, callback) {
		this.geocoders[api] = new google.maps.Geocoder();
	},
	
	geocode: function(address){
		var me = this;

		if (!address.hasOwnProperty('address') || address.address === null || address.address === '') {
			address.address = [ address.street, address.locality, address.region, address.country ].join(', ');
		}
		
		this.geocoders[this.api].geocode({'address': address.address }, function(results, status) {
			me.geocode_callback(results, status);
		});
	},
	
	geocode_callback: function(results, status){
		var return_location = {};

		if (status != google.maps.GeocoderStatus.OK) {
			this.error_callback(status);
		} 
		else {
			return_location.street = '';
			return_location.locality = '';
			return_location.region = '';
			return_location.country = '';

			var place = results[0];
			
			for (i=0;i<place.address_components.length;i++){
				for (j=0;j<place.address_components[i].types.length;j++){
					if(place.address_components[i].types[j]=="country")
						return_location.country = place.address_components[i].long_name;

					if(place.address_components[i].types[j]=="administrative_area_level_1")
						return_location.region = place.address_components[i].long_name;
					
					if(place.address_components[i].types[j]=="locality")
						return_location.locality = place.address_components[i].long_name;
						
					if(place.address_components[i].types[j]=="street_address")
						return_location.street = place.address_components[i].long_name;
				}
			}
			
			return_location.point = new mxn.LatLonPoint(place.geometry.location.lat(), place.geometry.location.lng());
			
			this.callback(return_location);
		}
	}
}
});