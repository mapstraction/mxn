(function(){
	var googlev3_key = 'AIzaSyDW21lnrSsBk4OyHUDmBQ7su9di3yMaO7I';
	var nokia_app_id = 'FbgYuugcrj8Taq6JjmUK';
	var nokia_auth_token = 'Yy2i2n98kaWj69qysOmcYg';
	var microsoftv7_key = 'AlneHdcKOFDot4FjwyuLH8ZSUIz5rv_X22vULKa7H5ia0JnsxiykdO8y-dgLQMU6';
	var openspace_key = 'CEEFBE51588492CBE0405F0ACA6010B1';
	var mapquest_key = 'Fmjtd%7Cluub29uy25%2Crs%3Do5-96zl9y';
	var yandexv1_key = 'AMVH-VABAAAAEdVkcQIAOS-fmBYJfLFV-YDg7ZCPjwVQycUAAAAAAAAAAADwTFcvgPirz7OV75IX_Gsopsw7jA==';


if(typeof(Enumerator) == 'undefined'){
	function Enumerator(ary){
		var len = ary.length;
		var current = 0;
		this.atEnd = function(){
			return (current === len);
		};
		this.moveNext = function(){
			if(this.atEnd()) throw 'At end of collection';
			current++;
		};
		this.item = function(){
			return ary[current];
		};
		this.getCurrent = function() {
			return current;
		}
	}
}

window.RunTests = function(ops, actionElm, infoElm) {
	for(var i=0; i < ops.length; i++){
		var li = document.createElement('li');
		var op = ops[i];
		li.innerHTML = op.desc;
		actionElm.appendChild(li);
		op.elm = li;
	}
	
	var e = new Enumerator(ops);
	var intervalID;

	function doNextAction(){
		if(e.atEnd()){
			clearInterval(intervalID);
		}
		else {
			var a = e.item();
			try {
				a.action();
			}
			catch(err){
				infoElm.innerHTML += 'ERROR: ' + err;
				infoElm.style.backgroundColor = '#FCC';
				clearInterval(intervalID);
				throw err;
			}
			a.elm.style.textDecoration = 'line-through';
			a.elm.style.color = '#AAA';
			e.moveNext();
		}
	}
	
	intervalID = setInterval(doNextAction, 2000);
};

window.Dump = function(obj) {
	if (obj instanceof mxn.LatLonPoint) {
		return '(' + obj.lat.toFixed(5) + ','+ obj.lon.toFixed(5) +')';
	}
	else if (obj instanceof mxn.BoundingBox) {
		return 'SW' + Dump(obj.sw) + '<br/>NE' + Dump(obj.ne) + '<br/>SE ' + Dump(obj.se) + '<br/>NW ' + Dump(obj.nw);
		
	}
	throw 'Not recognised';
};

})();