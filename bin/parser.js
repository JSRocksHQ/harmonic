let fs = require('fs');
let marked = require('marked');
let path = './src/posts/';
let markextra = require('markdown-extra');
let _ = require('underscore');
let nunjucks = require('nunjucks');
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
					let template = fs.readFileSync('./src/layouts/index.html');
					let templateNun = nunjucks.compile(template.toString());
					let markfile = data.toString();
					let htmlfile = templateNun.render({ content : marked(markfile) });
					let filename = file.split('.md')[0];
					let metadata = markextra.metadata(markfile, function (md) {
						let retObj = {};
						md.split('\n').forEach(function(line) {
							let data = line.split(':');
							retObj[data[0].trim()] = data[1].trim();
						});
						return retObj;
					});

					/* Removing header */
					htmlfile = htmlfile.replace(/<!--[\s\S]*?-->/g, '');

					/* write html file */
					fs.writeFile('./public/' + filename + '.html', htmlfile, function (err) {
						if (err) throw err;
						console.log('Successefuly generate html file ' + filename);
					});
				});
			});
		});
	}
}