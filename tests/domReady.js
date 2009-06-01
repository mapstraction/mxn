// DomReady event - Thom Shannon, http://ts0.com
// Public Domain

var WhenDomReady = function(callBack,scope){
	var scope = scope || window;
	var args = [];
	for (var i=2, len = arguments.length; i < len; ++i) {
		args.push(arguments[i]);
	};
	if (document.addEventListener) {
		document.addEventListener("DOMContentLoaded", function(){
			callBack.apply(scope, args);
		}, false);
	}
	else if (document.attachEvent)
	{
		var done = false;
		document.attachEvent("onreadystatechange",function(){
			if ( !done && document.readyState === "complete" ) {
				done = true;
				callBack.apply(scope, args);
			}
		});
	}
}