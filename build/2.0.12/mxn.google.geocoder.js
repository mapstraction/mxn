/*
Copyright (c) 2010 Tom Carden, Steve Coast, Mikel Maron, Andrew Turner, Henri Bergius, Rob Moran, Derek Fowler
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the Mapstraction nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
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
			var working = place.AddressDetails.Country.AdministrativeArea;
			if(working !== null) {
				return_location.region = working.AdministrativeAreaName;
				if(working.SubAdministrativeArea !== null) {
					working = working.SubAdministrativeArea;
					if(working.Locality !== null) {
						working = working.Locality;
						return_location.locality = working.LocalityName;
						if(working.Thoroughfare !== null) {
							return_location.street = working.Thoroughfare.ThoroughfareName;
						}
					}
				}
			}
			
			return_location.country = place.AddressDetails.Country.CountryNameCode;
			return_location.point = new mxn.LatLonPoint(place.Point.coordinates[1],	place.Point.coordinates[0]);
			
			this.callback(return_location);
		}
	}
}
});