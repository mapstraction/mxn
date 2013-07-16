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
mxn.register("yandex",{Geocoder:{init:function(){},geocode:function(a){var b=this;if(!a.hasOwnProperty("address")||a.address===null||a.address===""){var d=[];if(a.country&&a.country.length>3){d.push(a.country)}if(a.region){d.push(a.region)}if(a.locality){d.push(a.locality)}if(a.street){d.push(a.street)}a.address=d.join(", ")}if(!a.address){b.error_callback("Empty address passed to geocoder.");return}var c=new YMaps.Geocoder(a.address,{results:1});YMaps.Events.observe(c,c.Events.Load,function(e){if(e.found>0){b.geocode_callback(e.get(0))}else{b.error_callback(e)}});YMaps.Events.observe(c,c.Events.Fault,function(e){b.error_callback(e.message)})},geocode_callback:function(c){var b={street:"",locality:"",region:"",country:""};var d=c.AddressDetails;if(d.Country){d=d.Country;b.country=d.CountryName}if(d.AdministrativeArea){d=d.AdministrativeArea;b.region=d.AdministrativeAreaName}if(d.Locality){d=d.Locality;b.locality=d.LocalityName}var e=[];if(d.Thoroughfare){d=d.Thoroughfare;e.push(d.ThoroughfareName)}if(d.Premise){d=d.Premise;e.push(d.PremiseNumber)}if(e.length>0){b.street=e.join(", ")}var a=c.getGeoPoint();b.point=new mxn.LatLonPoint(a.getY(),a.getX());this.callback(b)}}});