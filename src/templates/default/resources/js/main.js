(function(){
    'use strict';
    [].slice.call(document.getElementsByTagName('a')).forEach(function(element) {
        if(element.href.indexOf(document.location.host) == -1) {
            element.target = '_blank';
        }
    });
})();