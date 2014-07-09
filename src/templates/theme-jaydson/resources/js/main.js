(function(){
    'use strict';

    [].slice.call(document.getElementsByTagName('a')).forEach(function(element) {
        if(element.href.indexOf(document.location.host) == -1) {
            element.target = '_blank';
        }
    });

    var harmonic = new Harmonic(),
    	index_posts = harmonic.getConfig().index_posts,
    	posts = harmonic.getPosts(),
    	postsLen = posts.length,
    	pagination = Math.ceil(postsLen / index_posts),
    	currentPost = pagination,
    	posts_printed = index_posts,
    	ulRoot = document.querySelector('#posts .postList');

    window.addEventListener('scroll', function () {
		var scrollY = window.pageYOffset,
		bodyH = document.body.offsetHeight,
		innerH = window.innerHeight,
		total = scrollY + innerH,
		liToClone = document.querySelectorAll('.post')[0],
		elem = null;
		
		if ((total - bodyH) >= 0 && (total - bodyH) <= 40) {
			if (posts_printed <= postsLen) {
				for (var i = currentPost; i < (currentPost + pagination); i +=1) {
					try {
						elem = liToClone.cloneNode(true);
						if (posts[i] && posts[i].image) {
							elem.querySelectorAll('div')[0].setAttribute('style','background: url('+ posts[i].image + ') no-repeat center center;  -webkit-background-size: cover;-moz-background-size: cover;-o-background-size: cover;background-size: cover;');
						} else {
							elem.querySelectorAll('div')[0].setAttribute('style','background:rgba(6, 0, 30, 1)');
						}
						elem.querySelectorAll('span')[0].innerHTML = posts[i].date;
						elem.querySelectorAll('a')[0].setAttribute('href',posts[i].link);
						elem.querySelectorAll('a')[0].innerHTML = posts[i].title;
						elem.querySelectorAll('section')[0].innerHTML = posts[i].description || '';
						ulRoot.appendChild(elem);
					} catch (e) {}
					posts_printed += 1;
				}
				currentPost += pagination;
			}
		}
	});

})();