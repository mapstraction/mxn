/*
MAPSTRACTION   v3.0.21   http://www.mapstraction.com

The BSD 3-Clause License (http://www.opensource.org/licenses/BSD-3-Clause)

Copyright (c) 2013 Tom Carden, Steve Coast, Mikel Maron, Andrew Turner, Henri Bergius, Rob Moran, Derek Fowler, Gary Gale
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the Mapstraction nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
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