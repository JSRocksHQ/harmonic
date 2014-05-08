let fs = require('fs');
let path = './src/posts/';
let Promise = require('promise');

module.exports = {
	new_post : function (title) {
		return new Promise(function (resolve, reject) {
			let template = '<!--\n' +
								'layout: post\n' +
								'title: ' + title + '\n'+
								'date:\n' +
								'comments: true\n' +
								'published: true\n' +
								'keywords:\n' +
								'description:\n' +
								'categories:\n' +
							'-->';
			let filename = path + title.split(' ').join('-') + '.md';

			/* create a new post */
			fs.writeFile(filename, template, function (err) {
				if (err) throw err;
				resolve('Post "' + title + '" was successefuly created. File generated at ' + filename);
			});
		});
	}
}