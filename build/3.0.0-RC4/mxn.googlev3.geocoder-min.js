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
mxn.register("googlev3",{Geocoder:{init:function(){this.geocoders[this.api]=new google.maps.Geocoder()},geocode:function(c,a){var b=this;b.row_limit=a||1;var d={};if(typeof(c)=="object"){if(c.hasOwnProperty("lat")&&c.hasOwnProperty("lon")){d.latLng=c.toProprietary(this.api)}else{d.address=[c.street,c.locality,c.region,c.country].join(", ")}}else{d.address=c}this.geocoders[this.api].geocode(d,function(f,e){b.geocode_callback(f,e)})},geocode_callback:function(g,f){if(f!=google.maps.GeocoderStatus.OK){this.error_callback(f)}else{var a=[];for(i=0;i<g.length;i++){place=g[i];var h=[];var l={};for(var d=0;d<place.address_components.length;d++){var c=place.address_components[d];for(var e=0;e<c.types.length;e++){var b=c.types[e];switch(b){case"country":l.country=c.long_name;break;case"administrative_area_level_1":l.region=c.long_name;break;case"locality":l.locality=c.long_name;break;case"street_address":l.street=c.long_name;break;case"postal_code":l.postcode=c.long_name;break;case"street_number":h.unshift(c.long_name);break;case"route":h.push(c.long_name);break}}}if(l.street===""&&h.length>0){l.street=h.join(" ")}l.point=new mxn.LatLonPoint(place.geometry.location.lat(),place.geometry.location.lng());a.push(l)}if(this.row_limit<=1){this.callback(a[0])}else{if(a.length>this.row_limit){a.length=this.row_limit}this.callback(a)}}}}});