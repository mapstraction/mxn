var mxn = (function(){
	
	// holds all our implementing functions
	var apis = {};
	
	return {
	
		/**
		 * Registers a set of provider specific implementation functions.
		 */
		register: function(sApiId, oApiImpl){
			if(!apis.hasOwnProperty(sApiId)) apis[sApiId] = {};
			mxn.merge(apis[sApiId], oApiImpl);
		},
		
		/**
		 * Merges properties of one object into another recursively.
		 * @param {Object} oRecv The object receiveing properties
		 * @param {Object} oGive The object donating properties
		 */
		merge: function(oRecv, oGive){
			for (var sPropName in oGive) if (oGive.hasOwnProperty(sPropName)) {
				if(!oRecv.hasOwnProperty(sPropName)){
					oRecv[sPropName] = oGive[sPropName];
				}
				else {
					mxn.merge(oRecv[sPropName], oGive[sPropName]);
				}			
			}
		},
		
		/**
		 * Adds a list of named proxy methods to the prototype of a 
		 * specified constructor function.
		 * @param {Function} func Constructor function to add methods to
		 * @param {Array} aryMethods Array of method names to create
		 * @param {Boolean} bWithApiArg Optional. Whether the proxy methods will use an API argument
		 */
		addProxyMethods: function(func, aryMethods, bWithApiArg){
			for(var i = 0; i < aryMethods.length; i++) {
				var sMethodName = aryMethods[i];
				if(bWithApiArg){
					func.prototype[sMethodName] = new Function('return this.invoker.go(\'' + sMethodName + '\', arguments, true);');
				}
				else {
					func.prototype[sMethodName] = new Function('return this.invoker.go(\'' + sMethodName + '\', arguments);');
				}
			}
		},
		
		/*
		checkLoad: function(funcDetails){
			if(this.loaded[this.api] === false) {
				var scope = this;
				this.onload[this.api].push( function() { funcDetails.callee.apply(scope, funcDetails); } );
				return true;
			}
			return false;
		},
		*/
				
		
		/**
		 * Calls the API specific implementation of a particular method
		 */
		invoke: function(sApiId, sObjName, sFnName, oScope, args){
			if(typeof(apis[sApiId][sObjName]) == 'undefined' || 
				typeof(apis[sApiId][sObjName][sFnName]) == 'undefined') {
				throw 'Method ' + sFnName + ' of object ' + sObjName + ' is not supported by API ' + sApiId + '. Are you missing a script tag?';
			}
			return apis[sApiId][sObjName][sFnName].apply(oScope, args);
		},
		
		/**
		 * Bulk add some named events to an object.
		 */
		addEvents: function(oEvtSrc, aEvtNames){
			for(var i = 0; i < aEvtNames.length; i++){
				var sEvtName = aEvtNames[i];
				if(sEvtName in oEvtSrc) throw 'Event or method ' + sEvtName + ' already declared.';
				oEvtSrc[sEvtName] = new mxn.Event(sEvtName, oEvtSrc);
			}
		},
		
		/**
		 * Event 
		 * @constructor
		 */
		Event: function(sEvtName, oEvtSource){
			var handlers = [];
			if(!sEvtName) throw 'Event name must be provided';
			this.addHandler = function(fn, ctx){
				handlers.push({context: ctx, handler: fn});
			};
			this.removeHandler = function(fn, ctx){
				for(var i = 0; i < handlers.length; i++){
					if(handlers[i].handler == fn && handlers[i].context == ctx){
						handlers.splice(i, 1);
					}
				}
			};
			this.removeAllHandlers = function(){
				handlers = [];
			};
			this.fire = function(oEvtArgs){
				var args = [sEvtName, oEvtSource, oEvtArgs];
				for(var i = 0; i < handlers.length; i++){
					handlers[i].handler.apply(handlers[i].context, args);
				}
			}
		},
		
		/**
		 * Creates a new Invoker, a class which helps with on-the-fly 
		 * invokation of the correct API methods.
		 * @constructor
		 * @param {Object} aobj The core object whose methods will make cals to go()
		 * @param {String} asClassName The name of the Mapstraction class to be invoked, normally the same name as aobj's constructor function
		 * @param {Function} afnApiIdGetter The function on object aobj which will return the active API ID
		 */
		Invoker: function(aobj, asClassName, afnApiIdGetter){
			var obj = aobj;
			var sClassName = asClassName;
			var fnApiIdGetter = afnApiIdGetter;
			
			/**
			 * Change the current api on the fly
			 * @param {String} sMethodName The API to swap to
			 * @param {Array} args Arguments to pass on
			 * @param {String} bApi Optional. API ID is overridden by value in first argument.
			 * @param {Object} oContext Optional. Local vars can be passed from the body of the method to the API method within this object.
			 */
			this.go = function(sMethodName, args, bApi, oContext){
				var sApiId = bApi ? args[0] : fnApiIdGetter.apply(obj);
				if(typeof(sApiId) == 'string'){
					if(typeof(oContext) != 'undefined'){
						// make sure args is an array
						args = Array.prototype.slice.apply(args);
						args.push(oContext);
					}
					return mxn.invoke(sApiId, sClassName, sMethodName, obj, args);
				}
				else{
					throw 'API ID not available.';
				}
			};
		},
		
		util: {
					
			/**
			 * $m, the dollar function, elegantising getElementById()
			 * @return An HTML element or array of HTML elements
			 */
			$m: function() {
				var elements = [];
				for (var i = 0; i < arguments.length; i++) {
					var element = arguments[i];
					if (typeof(element) == 'string') {
						element = document.getElementById(element);
					}
					if (arguments.length == 1) {
						return element;
					}
					elements.push(element);
				}
				return elements;
			},

			/**
			 * loadScript is a JSON data fetcher
			 * @param {String} src URL to JSON file
			 * @param {Function} callback Callback function
			 */
			loadScript: function(src, callback) {
				var script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = src;
				if (callback) {
					var evl = {};
					evl.handleEvent = function(e) {
						callback();
					};
					script.addEventListener('load' ,evl ,true);
				}
				document.getElementsByTagName('head')[0].appendChild(script);
				return;
			},

			/**
			 *
			 * @param {Object} point
			 * @param {Object} level
			 */
			convertLatLonXY_Yahoo: function(point, level) { //Mercator
				var size = 1 << (26 - level);
				var pixel_per_degree = size / 360.0;
				var pixel_per_radian = size / (2 * Math.PI);
				var origin = new YCoordPoint(size / 2 , size / 2);
				var answer = new YCoordPoint();
				answer.x = Math.floor(origin.x + point.lon * pixel_per_degree);
				var sin = Math.sin(point.lat * Math.PI / 180.0);
				answer.y = Math.floor(origin.y + 0.5 * Math.log((1 + sin) / (1 - sin)) * -pixel_per_radian);
				return answer;
			},

			/**
			 * Load a stylesheet from a remote file.
			 * @param {String} href URL to the CSS file
			 */
			loadStyle: function(href) {
				var link = document.createElement('link');
				link.type = 'text/css';
				link.rel = 'stylesheet';
				link.href = href;
				document.getElementsByTagName('head')[0].appendChild(link);
				return;
			},

			/**
			 * getStyle provides cross-browser access to css
			 * @param {Object} el HTML Element
			 * @param {String} prop Style property name
			 */
			getStyle: function(el, prop) {
				var y;
				if (el.currentStyle) {
					y = el.currentStyle[prop];
				}
				else if (window.getComputedStyle) {
					y = window.getComputedStyle( el, '').getPropertyValue(prop);
				}
				return y;
			},

			/**
			 * Convert longitude to metres
			 * http://www.uwgb.edu/dutchs/UsefulData/UTMFormulas.HTM
			 * "A degree of longitude at the equator is 111.2km... For other latitudes,
			 * multiply by cos(lat)"
			 * assumes the earth is a sphere but good enough for our purposes
			 * @param {Float} lon
			 * @param {Float} lat
			 */
			lonToMetres: function(lon, lat) {
				return lon * (111200 * Math.cos(lat * (Math.PI / 180)));
			},

			/**
			 * Convert metres to longitude
			 * @param {Object} m
			 * @param {Object} lat
			 */
			metresToLon: function(m, lat) {
				return m / (111200 * Math.cos(lat * (Math.PI / 180)));
			},

			/**
			 * Convert kilometres to miles
			 * @param {Float} km
			 * @returns {Float} miles
			 */
			KMToMiles: function(km) {
				return km / 1.609344;
			},

			/**
			 * Convert miles to kilometres
			 * @param {Float} miles
			 * @returns {Float} km
			 */
			milesToKM: function(miles) {
				return miles * 1.609344;
			},

			// stuff to convert google zoom levels to/from degrees
			// assumes zoom 0 = 256 pixels = 360 degrees
			//		 zoom 1 = 256 pixels = 180 degrees
			// etc.

			/**
			 *
			 * @param {Object} pixels
			 * @param {Object} zoom
			 */
			getDegreesFromGoogleZoomLevel: function(pixels, zoom) {
				return (360 * pixels) / (Math.pow(2, zoom + 8));
			},

			/**
			 *
			 * @param {Object} pixels
			 * @param {Object} degrees
			 */
			getGoogleZoomLevelFromDegrees: function(pixels, degrees) {
				return mxn.util.logN((360 * pixels) / degrees, 2) - 8;
			},

			/**
			 *
			 * @param {Object} number
			 * @param {Object} base
			 */
			logN: function(number, base) {
				return Math.log(number) / Math.log(base);
			}

		},
		
		dummy: 0
	};
})();