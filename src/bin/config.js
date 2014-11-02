var path = require('path'),
	fs = require('fs');

// rootdir === `dist` dir
exports.rootdir = path.normalize(__dirname + '/../');
exports.version = JSON.parse(fs.readFileSync(this.rootdir + '/../package.json').toString()).version;
exports.postspath = path.normalize('./src/posts/');
exports.pagespath = path.normalize('./src/pages/');
