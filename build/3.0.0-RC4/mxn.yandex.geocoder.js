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
mxn.register('yandex', {

Geocoder: {
	
	init: function() {		
	},
	
	geocode: function(address){
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
			address.address = parts.join(', ');
	     }

		if (!address.address) {
			me.error_callback('Empty address passed to geocoder.');
			return;
		}
		var geocoder = new YMaps.Geocoder(address.address, { results: 1 });
		YMaps.Events.observe(geocoder, geocoder.Events.Load, function (response) {
			if (response.found > 0) {
				me.geocode_callback(response.get(0));
			} else {
				me.error_callback(response);
			}
		});
 
		YMaps.Events.observe(geocoder, geocoder.Events.Fault, function (error) {
			me.error_callback(error.message);
		});
	},
	
	geocode_callback: function(response){
		var location = { street: '', locality: '', region: '', country: '' };

		var locLev = response.AddressDetails;
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

		var point = response.getGeoPoint();
		location.point = new mxn.LatLonPoint(point.getY(), point.getX());
		
		this.callback(location);
	}
}
});
