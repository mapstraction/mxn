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
mxn.register("yandex",{Geocoder:{init:function(){},geocode:function(a,b){var c=this;if(!a.hasOwnProperty("address")||a.address===null||a.address===""){var e=[];if(a.country&&a.country.length>3){e.push(a.country)}if(a.region){e.push(a.region)}if(a.locality){e.push(a.locality)}if(a.street){e.push(a.street)}if(e.length===0){e.push(a)}a=[];a.address=e.join(", ")}if(!a.address){c.error_callback("Empty address passed to geocoder.");return}var d=new YMaps.Geocoder(a.address,{results:b});YMaps.Events.observe(d,d.Events.Load,function(f){if(f.found>0){c.geocode_callback(f._objects)}else{c.error_callback(f)}});YMaps.Events.observe(d,d.Events.Fault,function(f){c.error_callback(f.message)})},geocode_callback:function(c){var d=[];for(i=0;i<c.length;i++){var f=c[i];var b={street:"",locality:"",region:"",country:""};var e=f.AddressDetails;if(e.Country){e=e.Country;b.country=e.CountryName}if(e.AdministrativeArea){e=e.AdministrativeArea;b.region=e.AdministrativeAreaName}if(e.Locality){e=e.Locality;b.locality=e.LocalityName}var g=[];if(e.Thoroughfare){e=e.Thoroughfare;g.push(e.ThoroughfareName)}if(e.Premise){e=e.Premise;g.push(e.PremiseNumber)}if(g.length>0){b.street=g.join(", ")}var a=f.getGeoPoint();b.point=new mxn.LatLonPoint(a.getY(),a.getX());d.push(b)}this.callback(d)}}});