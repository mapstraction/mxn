// DomReady event - Thom Shannon, http://ts0.com
// Public Domain

var WhenDomReady = function(callBack,scope){
    var scope = scope || window;
    var args = [];
    for (var i=2, len = arguments.length; i < len; ++i) {
        args.push(arguments[i]);
    };
    if (navigator.userAgent.match(/WebKit/))
    {
        (function(){
            if(document.readyState != 'complete' && document.readyState != 'loaded') return setTimeout(arguments.callee, 1);
            callBack.apply(scope, args);
        })();
    }
    else if (document.addEventListener) {
       document.addEventListener("DOMContentLoaded", function(){callBack.apply(scope, args);}, false);
    }
    else if (document.all)
    {   
        if(!document.getElementById('WhenDomReady_element'))
        {document.write("<scr" + "ipt id=\"WhenDomReady_element\" defer=true " + "src=//:><\/scr" + "ipt>");  } 
        document.getElementById('WhenDomReady_element').attachEvent("onreadystatechange",function(){
            if (document.getElementById('WhenDomReady_element').readyState=="complete"){
                callBack.apply(scope, args);
            }
        });
    }
}