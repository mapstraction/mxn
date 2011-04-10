(function(){

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
				infoElm.innerHTML = 'ERROR: ' + err;
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
		return 'SW' + Dump(obj.sw) + '<br/>NE' + Dump(obj.ne);
	}
	throw 'Not recognised';
};

})();