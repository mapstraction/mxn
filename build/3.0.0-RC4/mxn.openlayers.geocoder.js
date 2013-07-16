/*
MAPSTRACTION   v3.0.20   http://www.mapstraction.com

The BSD 3-Clause License (http://www.opensource.org/licenses/BSD-3-Clause)

Copyright (c) 2013 Tom Carden, Steve Coast, Mikel Maron, Andrew Turner, Henri Bergius, Rob Moran, Derek Fowler, Gary Gale
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the Mapstraction nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
mxn.register('openlayers', {

Geocoder: {
	init: function() {
	},

	geocode: function(address, rowlimit) {
		var me = this;
		me.row_limit = rowlimit || 1; //default to one result

		var url = 'http://nominatim.openstreetmap.org/';
		var params = {
			'addressdetails': 1,
			'format': 'json'
		};

		if (address.hasOwnProperty('lat') && address.hasOwnProperty('lon')) {
			url += 'reverse';
			params.lat = address.lat;
			params.lon = address.lon;
		} else {
			url += 'search';
			if (!address.hasOwnProperty('address') || address.address === null || address.address === '') {
				address.address = [ address.street, address.locality, address.region, address.country ].join(', ');
			}
			if (address.hasOwnProperty('address')) {
				params.q = address.address;
			}
			else {
				params.q = address;
			}
			params.limit = me.row_limit;
		}

		OpenLayers.Request.GET({
			url: url,
			params: params,
			callback: function(response) {
				if (response.status == 503) { // Service Temporarily Unavailable
					me.error_callback("Nominatim is temporarily unavailable (were you blocked for excessive use?)");
				} else if (response.status != 200) {
					me.error_callback(response.statusText);
				} else {
					me.geocode_callback(JSON.parse(response.responseText), me.row_limit);
				}
			}
		});
	},

	geocode_callback: function(results, rowlimit) {
		if (results instanceof Array) {
			if (!results.length) {
				this.error_callback("Nominatim didn't recognize this address.");
				return;
			}
		}
		else {
			results = [results];
		}

		var place;
		var places = [];

		for (i=0; i<results.length; i++) {
			place = results[i];
			var return_location = {};
			return_location.street = '';
			return_location.locality = '';
			return_location.postcode = '';
			return_location.region = '';
			return_location.country = '';
			var street_components = [];

			if (place.address.country) {
				return_location.country = place.address.country;
			}
			if (place.address.state_district) {
				return_location.region = place.address.state_district;
			}
			else if (place.address.state) {
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

			if (!return_location.locality && place.address.county) {
				return_location.locality = place.address.county;
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

});