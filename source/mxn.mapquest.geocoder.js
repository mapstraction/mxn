mxn.register('mapquest', {

Geocoder: {

	init: function() {
		var me = this;
		MQA.withModule('geocoder', function() {});
	},

	geocode: function(address, rowlimit) {
		var me = this;
		var return_location = {};
		var options = {};
		options.maxResults = rowlimit;
		options.thumbMaps = false;

		/* Specifying Country
		 * The geocoding target country is specified using the "adminArea1" or "country"
		 * request parameter (Refer to the Locations documentation). Country designation
		 * is currently not supported for single-line addressing. The United States is
		 * assumed for all single-line addresses.
		 */

		MQA.Geocoder.geocode(address, options, null, function(results) {
			me.geocode_callback(results);
		});
	},

	geocode_callback: function(response) {
		var results = response.results[0].locations;
		var places = [];

		for (i=0; i<results.length; i++) {
			place = results[i];
			var return_location = {};

			switch ("Country")
			{
				case place.adminArea1Type:
					return_location.country = place.adminArea1;
					break;
				case place.adminArea2Type:
					return_location.country = place.adminArea2;
					break;
				case place.adminArea3Type:
					return_location.country = place.adminArea3;
					break;
				case place.adminArea4Type:
					return_location.country = place.adminArea4;
					break;
				case place.adminArea5Type:
					return_location.country = place.adminArea5;
					break;
			}

			switch ("State")
			{
				case place.adminArea1Type:
					return_location.region = place.adminArea1;
					break;
				case place.adminArea2Type:
					return_location.region = place.adminArea2;
					break;
				case place.adminArea3Type:
					return_location.region = place.adminArea3;
					break;
				case place.adminArea4Type:
					return_location.region = place.adminArea4;
					break;
				case place.adminArea5Type:
					return_location.region = place.adminArea5;
					break;
			}

			switch ("City")
			{
				case place.adminArea1Type:
					return_location.locality = place.adminArea1;
					break;
				case place.adminArea2Type:
					return_location.locality = place.adminArea2;
					break;
				case place.adminArea3Type:
					return_location.locality = place.adminArea3;
					break;
				case place.adminArea4Type:
					return_location.locality = place.adminArea4;
					break;
				case place.adminArea5Type:
					return_location.locality = place.adminArea5;
					break;
			}

			return_location.street = place.street;
			return_location.postcode = place.postalCode;

			return_location.point = new mxn.LatLonPoint(place.latLng.lat, place.latLng.lng);

			places.push(return_location);
		}

		if (places.length > this.row_limit) {
			places.length = this.row_limit;
		}
		this.callback(places);
	}
}

});