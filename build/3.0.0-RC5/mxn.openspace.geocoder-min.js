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
mxn.register("openspace",{Geocoder:{init:function(){this.geocoders[this.api]={};this.geocoders[this.api].gazetteer=new OpenSpace.Gazetteer();this.geocoders[this.api].postcodeService=new OpenSpace.Postcode()},geocode:function(e,a){var b=this;var d=false;var f={};if(typeof(e)=="object"){if(e.hasOwnProperty("lat")&&e.hasOwnProperty("lon")){f.latLng=e.toProprietary(this.api)}else{if(e.hasOwnProperty("postcode")){d=true;f.address=e.postcode}else{f.address=e.locality||e.region}}}else{f.address=e;var c=e.match(/\d+/g);if(c!==null){d=true}}if(d){this.geocoders[this.api].postcodeService.getLonLat(f.address,function(g){b.geocode_callback(g,1)})}else{this.geocoders[this.api].gazetteer.getLocations(f.address,function(g){b.geocode_callback(g,a)})}},geocode_callback:function(e,c){var b;var d=[];if(e.hasOwnProperty("lat")){b={};b.point=new mxn.LatLonPoint();if(e!==null){b.point.fromProprietary(this.api,e);d.push(b)}}else{for(i=0;i<e.length;i++){b=e[i];if(b.type=="CITY"||b.type=="TOWN"||b.type=="OTHER SETTLEMENT"){var a={};a.street="";a.locality=b.name;a.postcode="";a.region=b.county;a.country="United Kingdom";a.point=new mxn.LatLonPoint();a.point.fromProprietary(this.api,b.location);d.push(a)}}}if(d.length>c){d.length=c}this.callback(d)}}});