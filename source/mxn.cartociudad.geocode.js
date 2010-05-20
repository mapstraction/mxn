mxn.register('cartociudad', {	

MapstractionGeocoder: {
	
	init: function(element, api) {		
	  var me = this;
	  me.geocoders[api] = new GClientGeocoder();
	},
	geocode: function(address){
	  var return_location = {};
	  var mapstraction_geocoder = this;
	
	  if (address.address == null || address.address == "")
	  address.address = address.street + ", " + address.locality + ", " + address.region + ", " + address.country
	  this.geocoders[this.api].getLocations(address.address, function(response) { mapstraction_geocoder.geocode_callback(response, mapstraction_geocoder); });
	},
	geocode_callback: function(response, mapstraction_geocoder){
	  var return_location = {};
		
	  if (!response || response.Status.code != 200) {
		mapstraction_geocoder.error_callback(response);
	  } else {
	    return_location.street = "";
		return_location.locality = "";
		return_location.region = "";
		return_location.country = "";

		var place = response.Placemark[0];
		if(place.AddressDetails.Country.AdministrativeArea != null) {
		  return_location.region = place.AddressDetails.Country.AdministrativeArea.AdministrativeAreaName;
				
		  if(place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea != null) {
			if(place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality != null) {
			  return_location.locality = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.LocalityName;
              if(place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.Thoroughfare != null)
			    return_location.street = place.AddressDetails.Country.AdministrativeArea.SubAdministrativeArea.Locality.Thoroughfare.ThoroughfareName;
		    }
					
		  }
				
	  	}
		return_location.country = place.AddressDetails.Country.CountryNameCode;
		return_location.point = new mxn.LatLonPoint(place.Point.coordinates[1],
		place.Point.coordinates[0]);
		mapstraction_geocoder.callback(return_location);
	  }
	}
}
})