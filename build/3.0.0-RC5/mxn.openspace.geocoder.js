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
mxn.register('openspace', {

Geocoder: {

	init: function() {
	
		this.geocoders[this.api] = {};
		
		this.geocoders[this.api].gazetteer = new OpenSpace.Gazetteer();    
		this.geocoders[this.api].postcodeService = new OpenSpace.Postcode();
	},

	geocode: function(query, rowlimit){
		var me = this;
		var isPostCode = false;
		var geocode_request_object = {};
		if (typeof(query) == 'object') {
			// query is a LatLonPoint object (reverse geocode)
			if (query.hasOwnProperty('lat') && query.hasOwnProperty('lon')) {
				geocode_request_object.latLng = query.toProprietary(this.api);
			}
			else if(query.hasOwnProperty('postcode')) 
			{
				isPostCode = true;
				geocode_request_object.address = query.postcode;
			}
			// query is an address object
			else{
				geocode_request_object.address = query.locality||query.region ; //use locality if present or just region
			}
		}

		// query is an address string
		else {
			geocode_request_object.address = query;
			//If the query contains numbers then interpret it as a postcode perhaps?
			var matches = query.match(/\d+/g);
			if (matches !== null) {
				isPostCode = true;
			}
		}

		//Is Query a postcode search?
		if (isPostCode) {
			this.geocoders[this.api].postcodeService.getLonLat(geocode_request_object.address, function(mapPoint) {
				me.geocode_callback(mapPoint, 1);
			});
		} else {
			this.geocoders[this.api].gazetteer.getLocations(geocode_request_object.address, function(results) {
				me.geocode_callback(results, rowlimit);
			});
		}
	},

	geocode_callback: function(results, rowlimit) {
		var place;
		var places = [];

		if (results.hasOwnProperty('lat')) {
			//This is a single postcode result
			place = {};
			place.point = new mxn.LatLonPoint();
			if (results !== null) { 
				place.point.fromProprietary(this.api, results); 
				places.push(place);
			}
		}

		else {
			for (i=0; i<results.length; i++) {
				place = results[i];
				if (place.type == "CITY" || place.type == "TOWN" || place.type == "OTHER SETTLEMENT") {
					var return_location = {};
					return_location.street = '';
					return_location.locality = place.name;
					return_location.postcode = '';
					return_location.region = place.county;
					return_location.country = 'United Kingdom';

					return_location.point = new mxn.LatLonPoint();
					return_location.point.fromProprietary(this.api, place.location);

					places.push(return_location);
				}
			}  
		}    

		if (places.length > rowlimit) {
			places.length = rowlimit;
		}
		this.callback(places);
	}
}

});