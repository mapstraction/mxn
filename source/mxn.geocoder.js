(function(){
/**
 * @exports mxn.util.$m as $m
 */
var $m = mxn.util.$m;

/**
 * Initialise our provider. This function should only be called 
 * from within mapstraction code, not exposed as part of the API.
 * @private
 */
var init = function() {
	this.invoker.go('init', [ this.callback, this.api, this.error_callback ]);
};
/**
 * MapstractionGeocoder instantiates a geocoder with some API choice
 * @param {Function} callback The function to call when a geocode request returns (function(waypoint))
 * @param {String} api The API to use, currently only 'mapquest' is supported
 * @param {Function} error_callback The optional function to call when a geocode request fails
 * @constructor
 */
var MapstractionGeocoder = mxn.MapstractionGeocoder = function (callback, api, error_callback) {
  this.api = api;
  this.callback = callback;
  this.geocoders = new Object();
  if(error_callback == null) {
	this.error_callback = this.geocode_error
  } else {
	this.error_callback = error_callback;
  }
  
  // set up our invoker for calling API methods
  this.invoker = new mxn.Invoker(this, 'MapstractionGeocoder', function(){ return this.api; });
  init.apply(this);
}

mxn.addProxyMethods(MapstractionGeocoder, [
  
  /*
   * Implements the geocoding process
   */
  'geocode',
  
  /*
   * Implements the callback fucnction in geocoding process
   */
  'geocode_callback',  

])

/**
 * Performs a geocoding and then calls the specified callback function with the location
 * @param {Object} address The address object to geocode
 */
MapstractionGeocoder.prototype.geocode = function(address) {
  this.invoker.go('geocode',arguments); 	
}

/**
 * Default handler for geocode request completion
 */
MapstractionGeocoder.prototype.geocode_callback = function(response, mapstraction_geocoder) {
  this.invoker.go('geocode_callback',arguments);	
}

/**
 * Change the Routing API to use
 * @param {String} api The API to swap to
 */
MapstractionGeocoder.prototype.swap = function(api) {
  if (this.api == api) { return; }

  this.api = api;
  if (this.geocoders[this.api] == undefined) {
	init.apply(this);
  }
}

/**
 * Default Geocode error function
 */
MapstractionGeocoder.prototype.geocode_error = function(response) { 
	alert("Sorry, we were unable to geocode that address");
}

})();