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
mxn.register("cloudmade",{Geocoder:{init:function(){this.geocoders[this.api]=new CM.Geocoder(cloudmade_key)},geocode:function(e,a){var c=this;var f=false;c.row_limit=a||1;var g={};if(typeof(e)=="object"){if(e.hasOwnProperty("lat")&&e.hasOwnProperty("lon")){f=true;g=new CM.LatLng(e.toProprietary(this.api))}else{g.address=e.locality||e.region}}else{g.address=e;var d=e.match(/\d+/g);if(d!==null){isPostCode=true}}var b={resultsNumber:a};this.geocoders[this.api].getLocations(f?g:g.address,function(h){c.geocode_callback(h)},b)},geocode_callback:function(d){var c=[];for(i=0;i<d.features.length;i++){place=d.features[i];var b=[];var a={};if(place.properties.place=="city"){a.locality=place.properties["name:en"]||place.properties.name}a.postal_code=place.properties.postal_code;a.country=place.properties["is_in:country"];a.region=place.properties["is_in:county"]||place.properties["is_in:state"]||place.properties["is_in:province"]||place.properties.code_departement;a.point=new mxn.LatLonPoint(place.centroid.coordinates[0],place.centroid.coordinates[1]);c.push(a)}if(this.row_limit<=1){this.callback(c[0])}this.callback(c)}}});