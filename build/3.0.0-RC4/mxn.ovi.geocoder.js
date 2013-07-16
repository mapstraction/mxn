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
mxn.register('ovi', {

Geocoder: {
	
	init: function() {
		var me = this;
		var ovi_geocoder;

		if (typeof ovi.mapsapi.search.Manager === 'undefined') {
			throw new Error(api + ' map script not imported');
		}

		ovi_geocoder = new ovi.mapsapi.search.Manager();
		ovi_geocoder.addObserver("state", function (manager, key, value){
			if (value == "finished" || value == "failed") {
				me.geocode_callback (manager.locations, value);
			}
		});
		this.geocoders[this.api] = ovi_geocoder;
	},

	geocode: function(address, rowlimit){
		var ovi_geocoder = this.geocoders[this.api];
		this.row_limit = rowlimit || 1; //default to one result
		
		if (address instanceof mxn.LatLonPoint) {
			ovi_geocoder.reverseGeocode(address);
		}
		else {
			ovi_geocoder.geocode(address);
		}
	},

	geocode_callback: function(response, status){
		var ovi_geocoder = this.geocoders[this.api];

		if (status == "failed") {
			var error_cause = ovi_geocoder.getErrorCause();
			var error_status = "";

			if (error_cause.type) {
				error_status = error_cause.type;
				if (error_cause.subtype) {
					error_status += ", " + error_cause.subtype;
				}
				if (error_cause.message) {
					error_status += ", " + error_cause.message;
				}
			}

			else {
				error_status = "Geocoding failure";
			}

			this.error_callback(error_status);
		}

		else if (status == "finished") {
			var places = [];

			for (i=0; i<response.length; i++) {
				place = response[i];

				var return_location = {};
				var street_components = [];
				var locality_components = [];
				var region_components = [];

				return_location.street = '';
				return_location.locality = '';
				return_location.postcode = '';
				return_location.region = '';
				return_location.country = '';

				var address = place.address;
				var coords = place.displayPosition;

				if (address.street) {
					street_components.push(address.street);
				}
				if (address.houseNumber) {
					street_components.unshift(address.houseNumber);
				}

				if (address.city) {
					locality_components.push(address.city);
				}
				if (address.district) {
					locality_components.unshift(address.district);
				}

				if (address.postalCode) {
					return_location.postcode = address.postalCode;
				}

				if (address.state) {
					region_components.unshift(address.state);
				}
				if (address.county) {
					region_components.push(address.county);
				}

				if (address.country) {
					return_location.country = address.country;
				}

				if (return_location.street === '' && street_components.length > 0) {
					return_location.street = street_components.join(' ');
				}
				if (return_location.locality === '' && locality_components.length > 0) {
					return_location.locality = locality_components.join(', ');
				}
				if (return_location.region === '' && region_components.length > 0) {
					return_location.region = region_components.join(', ');
				}

				return_location.point = new mxn.LatLonPoint(coords.latitude, coords.longitude);

				places.push(return_location);
			}

			if (this.row_limit <= 1) {
				this.callback(places[0]);
			}

			else {
				if (places.length > this.row_limit) {
					places.length = this.row_limit;
				}
				this.callback(places);
			}
		}
	}
}

});