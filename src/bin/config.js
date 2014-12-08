 /*jshint unused:false*/
let path = require('path');
let fs = require('fs');

// rootdir === `dist` dir
let exportRootDir = path.normalize(__dirname + '/../');
let pack = JSON.parse(fs.readFileSync(exportRootDir + '/../package.json').toString());

export let rootdir = exportRootDir;
export let version = pack.version;
export let postspath = path.normalize('./src/posts/');
export let pagespath = path.normalize('./src/pages/');
