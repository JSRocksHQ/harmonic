let path = require('path');
let fs = require('fs');
let rootdir = path.normalize(__dirname + '/../');
let pack = JSON.parse(fs.readFileSync(rootdir + '/../package.json').toString());

// rootdir === `dist` dir
export let rootdir = rootdir;
export let version = pack.version;
export let postspath = path.normalize('./src/posts/');
export let pagespath = path.normalize('./src/pages/');
