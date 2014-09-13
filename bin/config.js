var path = require('path'),
	fs = require('fs');

exports.rootdir = path.normalize(__dirname + '/../');
exports.package = JSON.parse(fs.readFileSync(this.rootdir + '/package.json').toString());
exports.version = exports.package.version;
exports.postspath = path.normalize('./src/posts/');
exports.pagespath = path.normalize('./src/pages/');
