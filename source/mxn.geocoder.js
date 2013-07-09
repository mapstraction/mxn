(function(){

/**
 * Initialise our provider. This function should only be called 
 * from within mapstraction code, not exposed as part of the API.
 * @private
 */
var init = function() {
	this.invoker.go('init');
};

/**
 * Geocoder instantiates a geocoder with some API choice
 * @name mxn.Geocoder
 * @constructor
 * @param {String} api The API to use
 * @param {Function} callback The function to call when a geocode request returns (function(waypoint))
 * @param {Function} error_callback The optional function to call when a geocode request fails
 * @exports Geocoder as mxn.Geocoder
 */
var Geocoder = mxn.Geocoder = function (api, callback, error_callback, row_limit) {
	this.api = api;
	this.geocoders = {};
	this.callback = callback;
	this.error_callback = error_callback || function(){};
	  
	// set up our invoker for calling API methods
	this.invoker = new mxn.Invoker(this, 'Geocoder', function(){ return this.api; });
	init.apply(this);
};

mxn.addProxyMethods(Geocoder, [
	'geocode_callback'
]);

/**
* Geocodes the provided address.
* @name mxn.Geocoder#geocode
* @function
* @param {Object} address Address hash, keys are: street, locality, region, country.
* @param {Int} Row_Limit to limit returned results, defaults to 1 to support previous Mapstraction 2.0 API definition.
*/
Geocoder.prototype.geocode = function(address, row_limit) {
	row_limit = row_limit || 1; //default to 1 result
	this.invoker.go('geocode', [address, row_limit]);
};

/**
 * Change the geocoding API in use
 * @name mxn.Geocoder#swap
 * @param {String} api The API to swap to
 */
Geocoder.prototype.swap = function(api) {
	if (this.api == api) { return; }

	this.api = api;
	if (!this.geocoders.hasOwnProperty(this.api)) {
		init.apply(this);
	}
};

})();