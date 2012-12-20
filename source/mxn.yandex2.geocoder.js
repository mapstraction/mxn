mxn.register('yandex2', {

Geocoder: {
	init: function() {
		if (!ymaps.geocode) {
			ymaps.load(['package.full']);
		}
	},
	geocode: function(address) {
		var me = this;

		if (!ymaps.geocode) {
			ymaps.load(['package.full'], function() {
				me.geocode(address);
			});
			return;
		}

		if (!address.hasOwnProperty('address') || address.address === null || address.address === '') {
			var parts = [];
			if (address.country && address.country.length > 3) { // Yandex.Maps do not support country codes in input
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
			address.address = parts.join(', ');
		}

		if (!address.address) {
			me.error_callback('Empty address passed to geocoder.');
			return;
		}

		var geocoder = ymaps.geocode(address.address, {results: 1, json: true});
		geocoder.then(
			function (response) {
				var collection = response.GeoObjectCollection;
				if (collection.metaDataProperty.GeocoderResponseMetaData.results > 0) {
					me.geocode_callback(collection.featureMember[0].GeoObject);
				} else {
					me.error_callback(response);
				}
			},
			function (error) {
				me.error_callback(error);
			}
		);
	},
	geocode_callback: function(geoObject) {
		var location = { street: '', locality: '', region: '', country: '' };

		var locLev = geoObject.metaDataProperty.GeocoderMetaData.AddressDetails;
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

		var point = geoObject.Point.pos.split(' ');
		location.point = new mxn.LatLonPoint(parseFloat(point[1]), parseFloat(point[0]));

		this.callback(location);
	}
}
});