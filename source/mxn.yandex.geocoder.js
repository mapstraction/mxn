mxn.register('yandex', {

Geocoder: {
	
	init: function() {		
	},
	
	geocode: function(address, rowlimit){
		var me = this;
		
		if (!address.hasOwnProperty('address') || address.address === null || address.address === '') {
			var parts = [];
			if (address.country && address.country.length > 3) {// Yandex.Maps do not support country codes in input
				parts.push(address.country);
			}
			if (address.region) {
				parts.push(address.region);
			}
			if (address.locality) {
				parts.push(address.locality);
			}
			if (address.street) {
				parts.push(address.street);
			}

			if (parts.length === 0){
				parts.push(address);
			}
			
			address = [];
			address.address = parts.join(', ');
	     }

		if (!address.address) {
			me.error_callback('Empty address passed to geocoder.');
			return;
		}
		var geocoder = new YMaps.Geocoder(address.address, { results: rowlimit });
		YMaps.Events.observe(geocoder, geocoder.Events.Load, function (response) {
			if (response.found > 0) {
				me.geocode_callback(response._objects);
			} else {
				me.error_callback(response);
			}
		});
 
		YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (error) {
			me.error_callback(error.message);
		});
	},
	
	geocode_callback: function(response){
		var places = [];
	 
		for (i=0; i<response.length; i++) {
			var geoObject = response[i];

			var location = { street: '', locality: '', region: '', country: '' };

			var locLev = geoObject.AddressDetails;
			if (locLev.Country) {
				locLev = locLev.Country;
				location.country = locLev.CountryName;
			}
			if (locLev.AdministrativeArea) {
				locLev = locLev.AdministrativeArea;
				location.region = locLev.AdministrativeAreaName;
			}
			if (locLev.Locality) {
				locLev = locLev.Locality;
				location.locality = locLev.LocalityName;
			}
			var street = [];
			if (locLev.Thoroughfare) {
				locLev = locLev.Thoroughfare;
				street.push(locLev.ThoroughfareName);
			}
			if (locLev.Premise) {
				locLev = locLev.Premise;
				street.push(locLev.PremiseNumber);
			}
			if (street.length > 0) {
				location.street = street.join(', ');
			}

			var point = geoObject.getGeoPoint();
			location.point = new mxn.LatLonPoint(point.getY(), point.getX());
		
			places.push(location);
		}
		
		this.callback(places);
	}
}
});
