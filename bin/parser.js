let fs = require('fs');
let marked = require('marked');
let path = './src/posts/';
let co = require('co');

module.exports = {

	/* posts */
	parsePosts : function () {
		fs.readdir(path, function (err, files) {
			if (err) {
				throw err;
			}

			files.forEach(function (file, i) {
				fs.readFile(path + file, function (err, data) {
					if (err) throw err;
					let htmlfile = marked(data.toString());
					let filename = file.split('.md')[0];
					fs.writeFile('./public/' + filename + '.html', htmlfile, function (err) {
						if (err) throw err;
						console.log('Successefuly generate html file ' + filename);
					});
				});
			});
		});
	}
}