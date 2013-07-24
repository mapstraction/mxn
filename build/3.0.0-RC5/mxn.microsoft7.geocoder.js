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
mxn.register('microsoft7', {

Geocoder: {
	init: function() {

	},

	geocode: function(query, rowlimit) {
		this.row_limit = rowlimit;
		var _address = '';
		var is_reverse = false;
		if (typeof(query) == 'object') {
			// query is a LatLonPoint object (reverse geocode)
			if (query.hasOwnProperty('lat') && query.hasOwnProperty('lon')) {
				_address = query.lat + ',' + query.lon;
			}
			// query is an address object
			else {
				_address = [ query.street, query.locality, query.region, query.country ].join(',');
			}
		}
		else {
			// query is an address string
			_address = query;
		}

		jsonp_callback_context = this;
		var searchRequest = 'http://dev.virtualearth.net/REST/v1/Locations/' + _address + '?output=json&jsonp=jsonp_callback_context.geocode_callback&key=' + microsoft_key;
		var mapscript = document.createElement('script'); 
		mapscript.type = 'text/javascript'; 
		mapscript.src = searchRequest; 
		document.body.appendChild(mapscript);
	},

	geocode_callback: function(results) {
		if (results.statusDescription != 'OK') {
			this.error_callback(results.statusDescription);
		}

		else {
			var places = [];

			for (i=0; i<results.resourceSets[0].resources.length; i++)
			{
				place = results.resourceSets[0].resources[i];

				var return_location = {
					street: place.address.addressLine,
					locality: place.address.locality,
					postcode: place.address.postalCode,
					region: place.address.adminDistrict,
					country: place.address.countryRegion,
					point: new mxn.LatLonPoint(place.point.coordinates[0], place.point.coordinates[1])
				};
				
				// Remove sovereign entity
				if (place.entityType != ('Sovereign') && place.entityType != ('CountryRegion')) {
					places.push(return_location);
				}
			}

			if (places.length > this.row_limit) {
					places.length = this.row_limit;
				}
			this.callback(places);
		}
	}
}

});